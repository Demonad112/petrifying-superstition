---
name: jam-spike
description: Run a time-boxed spike that answers ONE question about a jam game mechanic or technical approach — paper test in the pure-TS sim, or a throwaway Phaser greybox — and record a YES/NO/PARTIAL spike note. Use whenever the user wonders "would X be fun", "can we do X with Y", wants to paper-test or greybox a concept, test a mechanic before committing, try a risky idea mid-jam, or check Phaser 4 can handle something.
---

# Jam Spike: one question, one verdict, throwaway code

A spike exists to *learn*, not to build the game. The two ways spikes go wrong:
the question is too big to answer in the time box, or the spike code quietly
becomes production code. This skill prevents both.

## 1. Frame the question
Write it as one sentence: **"Can [the player / the sim / Phaser] [do X] using [approach Y]?"**
or **"Is [core verb] interesting when [condition]?"**
If it needs "and", split it and run the riskiest one first.

## 2. Pick the path (cheapest that can answer it)
| Path | When | Build |
|---|---|---|
| **Paper (sim-only)** | Is the mechanic interesting as numbers/state? | `spikes/<slug>/sim.ts` + a Vitest file that runs N seeded turns and prints state/score traces. No Phaser. 45 min cap. |
| **Greybox** | Does it *feel* right (timing, input, camera)? | `spikes/<slug>/` Phaser scene, primitives only, hardcoded values OK. 4 h cap. |
| **Tech** | Will Phaser 4 / the browser handle it (draw count, filters, audio)? | Minimal stress scene; output is a number (fps, ms/frame, bundle KB), not a feeling. 4 h cap. |

Default to Paper. The project's deterministic-sim architecture means most gameplay
questions can be answered headlessly, which is faster and repeatable.

## 3. Scope — max 3 bullets
One mechanic, one question. No menus, no audio, no polish, no game-over screen unless
that *is* the question. If it can't be shown inside the cap, the question is too large: stop and split.

## 4. Isolation rules (non-negotiable)
- Spike code lives only in `spikes/<slug>/`. It may import from `src/sim/` (read-only use) but nothing in `src/` may import from `spikes/`.
- Spikes never ship and are excluded from the build (`spikes/` not under Vite's entry; add it to tsconfig `exclude` if needed).
- If the verdict is YES, **rewrite** the mechanic properly in `src/sim/` with tests — don't promote spike code by "cleaning it up".
- Hardcoded numbers, globals, and console logs are fine inside a spike.

## 5. Run it and get a human verdict
Paper path: run the Vitest file, show the trace summary (score distribution across
seeds, turns-to-end, any degenerate strategy noticed).
Greybox/Tech: tell the user exactly how to run it, then ask the debrief **one question at a time**:
1. Did it answer the question — YES / NO / PARTIAL?
2. The moment it worked (specific).
3. The worst moment (specific — "input felt ~200 ms late", not "felt off").
4. Anything surprising?

Vague answer → ask once for specifics. **If nobody played it, the verdict is
`NOT ASSESSED — built, not played`.** Never infer a feel verdict from code.

## 6. Write the spike note
`spikes/<slug>/SPIKE-NOTE.md`:
```markdown
# Spike: <slug> — <date>
**Question:** ...
**Path / time spent:** paper | greybox | tech — <minutes>
**Verdict:** YES | NO | PARTIAL | NOT ASSESSED
**Evidence:** <trace numbers, fps, or the player's specific observations>
**Next:** add to build order | spike again (narrower question) | drop
```
If the result changes the plan, also update `GDD.md` (build order / out of scope).

## Kill rule
Third PARTIAL/NO on the same concept → stop iterating and say so plainly: switch to
concept #2 from the GDD scoring. Two fresh spikes beat a fourth patch on a struggling idea.
Check `spikes/*/SPIKE-NOTE.md` for prior verdicts on the same concept before starting.
