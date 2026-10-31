# Handoff

_Updated 2026-10-31 · game-feel FX kit_

## State
- Toolchain proven and deployed: Phaser 4.2.1 (exact pin), TypeScript strict, Vite, Vitest, Playwright.
  CI is green, and Deploy on main is green (Pages + itch).
- Template skeleton replaces the placeholder grid slice:
  - `src/sim/`: `SimState { seed, rng, tick, roll, status }`, `Command = act | wait`. `act` rolls a d6 from the seeded RNG. Pure `step` and `replay`.
  - Fixed 60 Hz timestep (`clock.ts`): each tick applies the next queued input or `wait`. `TICK_MODE` in `Play.ts` switches to turn-based.
  - `ReplayFile` v1 (`replay.ts`): seed, ticks, hash and a run-length-encoded log. F8 downloads one in Play and Game Over, and `?seed=<n>` pins the seed.
  - `src/game/`: Boot/Preload/Menu/Play/GameOver. Play shows one block and a HUD. Space/Click sends `act` (blip + pulse), Esc ends the run.
    Camera bloom + vignette (`fx.ts`), lazy ZzFX (`audio.ts`).
- Game-feel FX kit (DECISIONS #17), all in `src/game/fx.ts`: `shake`, `flash` (PALETTE colour), `burst` (one reused emitter per scene, generated texture) and `hitStop`
  (Play skips the clock and step for the wall ms; view-only, canvas `data-hitstop`). `F` toggles `settings.fx` `full`/`reduced` (canvas `data-fx`).
  All sounds go through `audio.ts` `sfx(params)`. The `act` demo is a pulse, a small burst, a light shake and a 40 ms hit-stop.
- Pause/mute/settings (DECISIONS #16): `P` pauses Play (auto-pause on blur/hidden, resume only on `P`), `M` mutes in any scene, shown as MUTED in the HUD.
  Both are view-only. `src/game/settings.ts` persists `{ muted, fx }` under `dg3.settings`. Canvas exposes `data-paused` (Play) and `data-muted`.
- Tests (20 Vitest, 7 e2e):
  - Sim: golden hash `3560e748` (unchanged), determinism, JSON round-trip, RNG advance, no mutation.
  - Clock: tick accumulation, catch-up cap, negative delta.
  - Replay: RLE round-trip, tamper detection, and every fixture in `tests/replays/` (`baseline-seed42.json`, hash `5bdc82d6`).
  - Settings: defaults, bad JSON/shapes, `fx` default and bad values per field, round-trip, defaults object not shared.
  - e2e: `F` toggles `data-fx` and survives reload; `act` sets `data-hitstop` true then clears, and the replay still re-simulates; pause freezes ticks (F8 works while paused) and resumes; mute survives reload; boot, console errors and content-types, a 404 for a missing asset, and an F8 export that re-simulates to its own hash.
- The pre-commit hook (typecheck + sim tests) is active after `npm ci`.
- README has the "starting a game from this template" checklist. DECISIONS #14 records the template decision.

## Open items (1-5 closed by owner 2026-10-31)
1. Manual setup: secrets/variables, Pages source, itch HTML project. Done.
2. Local `/context`, `/usage`, `/doctor` and the subagent model check. Done. Numbers are not recorded here.
3. Desktop preview pane check and feel playtest. Done.
4. Live URL check in a private window and on a phone. Done.
5. Template conversion. Done: the slice is stripped and the repo is now a template.
6. Housekeeping: delete the merged remote branches (all fully merged into main, PRs #1-#6 closed as merged):
   `claude/game-off-toolchain-baseline-08cj3v`, `ccr-329605c3-bekthy`, `claude/pause-mute-settings-ymjhh4`.

## Next session's first task
Nov 1: once the theme is announced, create the game repo from this template (README checklist), then fill in `docs/GDD.md`
(pitch, core loop, verbs, Must/Should/Could). Choose `TICK_MODE` (realtime or turn) to match the design.
After that, replace `act` with the first real verb and get the core loop playable by Nov 7. Save each playtest bug as an F8 replay in `tests/replays/`.

## Measurements
| Metric | Before feature | After feature | Notes |
| --- | --- | --- | --- |
| /context total | | | not recorded |
| /usage (session) | | | not recorded |
| Subagent models seen in /usage | | | not recorded |
| /doctor prompt-audit | | | not recorded |
