# Replay fixtures

Each `*.json` here is re-simulated by `src/sim/replays.test.ts`. The test checks the final hash and the tick count.

- Press F8 during a run (or on the Game Over screen) to download `replay-<seed>-<ticks>.json`.
- Drop the file here with a descriptive name (`bug-wall-clip.json`). It is now a regression test.
- Reproduce the run in the browser with `?seed=<seed>`.
- If a rule changes the outcome deliberately, the test prints the new hash. Update `hash` and `ticks` in the fixture and say why in the commit.
