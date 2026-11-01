---
name: jam-sim-balance
description: Headless balance testing for the jam game's deterministic TypeScript sim — runs hundreds of seeded games with random, greedy, and single-input-spam bots to find dominant strategies, softlocks, stall loops, and bad difficulty curves, and compares tuning values before you change them. Use whenever the user says the game is too easy/hard, a number "feels wrong", wants to tune src/sim/tuning.ts, asks "is there a broken strategy", wants a difficulty curve checked, or before content freeze.
---

# Jam Sim Balance

The project's sim is pure and seeded, so balance can be *measured*, not guessed:
run the game hundreds of times with bots and look at the distributions. This turns
"feels too easy" into "median run ends turn 12, spamming dash beats every mixed policy".

## 1. Adapter (once per project)
Create `tests/balance/adapter.ts` that wraps the real sim — don't reimplement rules:
```ts
import { createState, step, legalCommands, isGameOver, scoreOf, didWin } from "../../src/sim";
import { DEFAULT_TUNING } from "../../src/sim/tuning";
export default {
  tuning: DEFAULT_TUNING,               // flat Record<string, number>
  init: (seed, tuning) => createState({ seed, tuning }),
  legalCommands: (s) => legalCommands(s),
  apply: (s, c) => step(s, c),          // must not mutate the input state
  isOver: (s) => isGameOver(s),
  score: (s) => scoreOf(s),
  won: (s) => didWin(s),                // omit if there's no win
  label: (c) => c.type,                 // groups commands for spam bots
};
```
Adapt names to the actual sim exports. Real-time games: make one command = one fixed
sim tick of held input (e.g. `{type:"move", dir}` + `{type:"idle"}`), so bots can play.
If the sim has no `legalCommands`, add one — it's also useful for input validation and tests.

## 2. Run
```bash
npx tsx <this-skill>/scripts/balance-runner.ts tests/balance/adapter.ts --seeds 300 --out tests/balance/report.json
# compare a tuning change without editing code:
npx tsx <this-skill>/scripts/balance-runner.ts tests/balance/adapter.ts --tuning '{"enemySpeed":1.3}' --out /tmp/b.json
```
(`node --experimental-strip-types` works too.) Copy the script into `tests/balance/` if
the project should own it. Bots: `random`, `greedy-1step` (best immediate score), and
`spam:<label>` (always the same input). The script prints a table and an Issues list.

## 3. Read the results
| Signal | Meaning | Severity |
|---|---|---|
| spam policy beats best mixed policy | one input dominates — degenerate strategy | Critical |
| timeouts | runs never end — stall or infinite loop | Critical |
| stuck | no legal input before game over — softlock | Critical |
| errors | sim threw on some seed — that's a bug, add a failing test with that seed | Critical |
| greedy ≈ random | choices don't matter | Concern |
| greedy ≪ random | short-term-best play is punished — fine only if the game teaches it | Concern |
| p10–p90 score spread huge | seed luck dominates skill | Concern |
| median length far from target | runs too short/long for a 2–5 min rater session | Concern |

Targets come from `GDD.md` (win/fail, intended run length). If the GDD gives no target
for a value, report it as **not judged — no stated target**, never as "fine".

## 4. Report
```markdown
## Balance — <date> — <commit> — <seeds> seeds
**Verdict:** CRITICAL | CONCERNS | HEALTHY | NOT ASSESSED
| policy | score p10/med/p90 | length med | win rate |
### Issues
### Tuning experiments
| change | before (med / win) | after (med / win) | keep? |
### Recommended changes to src/sim/tuning.ts
```
Verdict = worst finding. **NOT ASSESSED** if the adapter can't be built yet (no sim, no
end condition) — say what's missing. A green table from zero runs is not HEALTHY.

## 5. Change values safely
- Tuning lives in `src/sim/tuning.ts` only; gameplay code reads from it — no magic numbers in `src/sim/**`.
- Try each change with `--tuning` first, compare tables, then edit the file.
- For a fixed exploit/softlock: add a Vitest regression test using the offending seed,
  **watch it fail on the unfixed code**, then fix and watch it pass.
- Bots measure structure, not feel. Hand off any "feels" question to `/jam-playtest`.
