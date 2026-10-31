---
paths:
  - "src/sim/**"
---

# Sim rules (src/sim/**)

- Pure TypeScript. Never import `phaser`, touch `window`/`document`, or use `Date.now()`/`Math.random()`.
- All randomness goes through `src/sim/rng.ts`, with the RNG state kept in `SimState.rng`.
- `SimState` stays flat and JSON-serializable: primitives and arrays of primitives, no classes or Maps.
- `step(state, cmd)` is pure: clone, never mutate the input.
- Player intent enters only as a `Command` (serializable). New input means a new `Command` variant.
- Any rule change that alters the replay hash must update `EXPECTED_HASH` in `sim.test.ts` deliberately, and the commit must say why.
- Add or extend a Vitest test next to the code for every rule.
