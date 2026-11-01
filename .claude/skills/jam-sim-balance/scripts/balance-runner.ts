/**
 * Headless balance runner for a deterministic sim.
 *
 * Usage:
 *   npx tsx <skill>/scripts/balance-runner.ts <adapter.ts> [--seeds 200] [--max-steps 5000]
 *        [--tuning '{"enemySpeed":1.2}'] [--out balance-report.json]
 *
 * The adapter module must default-export (or export `adapter`) an object:
 *   init(seed: number, tuning: Record<string, number>): State
 *   legalCommands(state: State): Cmd[]          // [] means no move available
 *   apply(state: State, cmd: Cmd): State         // pure; may mutate a copy
 *   isOver(state: State): boolean
 *   score(state: State): number
 *   won?(state: State): boolean
 *   label?(cmd: Cmd): string                     // groups commands for "spam" policies
 *   tuning?: Record<string, number>              // defaults
 *
 * Plain TS only (no enums / parameter properties) so it also runs under
 * `node --experimental-strip-types`.
 */
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

type Adapter = {
  init(seed: number, tuning: Record<string, number>): unknown;
  legalCommands(state: unknown): unknown[];
  apply(state: unknown, cmd: unknown): unknown;
  isOver(state: unknown): boolean;
  score(state: unknown): number;
  won?(state: unknown): boolean;
  label?(cmd: unknown): string;
  tuning?: Record<string, number>;
};

type Policy = { name: string; pick(a: Adapter, s: unknown, cmds: unknown[], rng: () => number): unknown };

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function args(argv: string[]) {
  const o: Record<string, string> = {};
  const pos: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) o[argv[i].slice(2)] = argv[++i] ?? "";
    else pos.push(argv[i]);
  }
  return { o, pos };
}

function lbl(a: Adapter, c: unknown): string {
  return a.label ? a.label(c) : typeof c === "object" ? JSON.stringify(c) : String(c);
}

function stats(xs: number[]) {
  const s = [...xs].sort((p, q) => p - q);
  const q = (p: number) => s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN;
  const mean = s.reduce((t, x) => t + x, 0) / (s.length || 1);
  return { n: s.length, mean: +mean.toFixed(3), p10: q(0.1), median: q(0.5), p90: q(0.9), min: s[0], max: s[s.length - 1] };
}

async function main() {
  const { o, pos } = args(process.argv.slice(2));
  if (!pos[0]) {
    console.error("usage: balance-runner.ts <adapter.ts> [--seeds N] [--max-steps N] [--tuning JSON] [--out file]");
    process.exit(2);
  }
  const mod = await import(pathToFileURL(resolve(pos[0])).href);
  const a: Adapter = mod.default ?? mod.adapter;
  const seeds = Number(o.seeds ?? 200);
  const maxSteps = Number(o["max-steps"] ?? 5000);
  const tuning = { ...(a.tuning ?? {}), ...(o.tuning ? JSON.parse(o.tuning) : {}) };

  // Discover command labels from a few opening states so we can build "spam X" policies.
  const labels = new Set<string>();
  for (let s = 1; s <= 5; s++) for (const c of a.legalCommands(a.init(s, tuning))) labels.add(lbl(a, c));

  const policies: Policy[] = [
    { name: "random", pick: (_a, _s, cmds, rng) => cmds[Math.floor(rng() * cmds.length)] },
    {
      name: "greedy-1step",
      pick: (ad, s, cmds, rng) => {
        let best = cmds[0], bv = -Infinity;
        for (const c of cmds) {
          const v = ad.score(ad.apply(s, c)) + rng() * 1e-9;
          if (v > bv) { bv = v; best = c; }
        }
        return best;
      },
    },
    ...[...labels].slice(0, 12).map((L): Policy => ({
      name: `spam:${L}`,
      pick: (ad, _s, cmds, rng) => {
        const m = cmds.filter((c) => lbl(ad, c) === L);
        return m.length ? m[0] : cmds[Math.floor(rng() * cmds.length)];
      },
    })),
  ];

  const results: Record<string, unknown> = {};
  const issues: string[] = [];
  for (const p of policies) {
    const scores: number[] = [], lengths: number[] = [];
    let wins = 0, timeouts = 0, stuck = 0, errors = 0;
    for (let seed = 1; seed <= seeds; seed++) {
      const rng = mulberry32(seed * 7919 + 1);
      let s = a.init(seed, tuning), step = 0;
      try {
        while (!a.isOver(s) && step < maxSteps) {
          const cmds = a.legalCommands(s);
          if (!cmds.length) { stuck++; break; }
          s = a.apply(s, p.pick(a, s, cmds, rng));
          step++;
        }
      } catch {
        errors++;
        continue;
      }
      if (step >= maxSteps && !a.isOver(s)) timeouts++;
      if (a.won?.(s)) wins++;
      scores.push(a.score(s));
      lengths.push(step);
    }
    results[p.name] = {
      score: stats(scores), length: stats(lengths),
      winRate: a.won ? +(wins / seeds).toFixed(3) : null, timeouts, stuck, errors,
    };
    if (timeouts) issues.push(`${p.name}: ${timeouts}/${seeds} runs hit max-steps (possible infinite/stall loop)`);
    if (stuck) issues.push(`${p.name}: ${stuck}/${seeds} runs had no legal command before game over (softlock)`);
    if (errors) issues.push(`${p.name}: ${errors}/${seeds} runs threw`);
  }

  // Degenerate-strategy flags: pressing ONE input forever should not beat every mixed policy.
  const r = results as Record<string, { score: { median: number }; winRate: number | null }>;
  const base = r["greedy-1step"]?.score.median ?? 0;
  const rand = r["random"]?.score.median ?? 0;
  const bestMixed = Math.max(base, rand);
  const bestMixedWin = Math.max(r["greedy-1step"]?.winRate ?? 0, r["random"]?.winRate ?? 0);
  for (const [name, v] of Object.entries(r)) {
    if (!name.startsWith("spam:")) continue;
    const winsAtLeast = v.winRate === null || v.winRate >= bestMixedWin;
    if (v.score.median > bestMixed && winsAtLeast)
      issues.push(`${name}: median ${v.score.median} beats best mixed policy (${bestMixed}) — one input dominates (degenerate strategy)`);
  }
  if (r["random"] && r["greedy-1step"] && Math.abs(base - rand) <= Math.abs(rand) * 0.05)
    issues.push(`greedy ≈ random (${base} vs ${rand}) — choices may not matter`);
  if (r["random"] && r["greedy-1step"] && base < rand * 0.8)
    issues.push(`greedy-1step (${base}) scores below random (${rand}) — short-term-optimal play is punished; check that's intended and readable to players`);

  const report = { adapter: pos[0], seeds, maxSteps, tuning, policies: results, issues };
  const out = o.out ?? "balance-report.json";
  writeFileSync(out, JSON.stringify(report, null, 2));

  console.log(`\nBalance run — ${seeds} seeds, tuning ${JSON.stringify(tuning)}\n`);
  console.log("| policy | score p10 / median / p90 | length median | win rate | timeouts | stuck | errors |");
  console.log("|---|---|---|---|---|---|---|");
  for (const [name, v] of Object.entries(results) as [string, any][])
    console.log(`| ${name} | ${v.score.p10} / ${v.score.median} / ${v.score.p90} | ${v.length.median} | ${v.winRate ?? "n/a"} | ${v.timeouts} | ${v.stuck} | ${v.errors} |`);
  console.log(`\nIssues (${issues.length}):`);
  for (const i of issues) console.log(`- ${i}`);
  console.log(`\nWrote ${out}`);
}

main();
