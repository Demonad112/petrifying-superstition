# Replay fixtures

Each `*.json` here is re-simulated by `src/sim/replays.test.ts`. The test checks the final hash and the tick count.

- Press F8 during a run (or on the Game Over screen) to download `replay-<seed>-<ticks>.json`.
- Drop the file here with a descriptive name (`bug-wall-clip.json`). It is now a regression test.
- Reproduce the run in the browser with `?seed=<seed>`.
- If a rule changes the outcome deliberately, the test prints the new hash. Update `hash` and `ticks` in the fixture and say why in the commit.

`demo-map-seed5.json` and `baseline-seed42.json` are recordings of the autopilot (`src/sim/autopilot.ts`), not hand-played runs.
`src/sim/autopilot.test.ts` fails if either drifts from a fresh recording. After a deliberate rule change run
`UPDATE_DEMO=1 npx vitest run autopilot`, review the diff, and say why in the commit.
