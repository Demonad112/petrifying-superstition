# Handoff

_Updated 2026-11-01 · sim tuning moved to `src/sim/tuning.ts` (task A)_

## State
- Repo created from the jam template and renamed `petrifying-superstition` (package, `<title>`, Menu, README, settings key `ps.settings`).
- **Sim (DECISIONS #21):** one tier-1 walled room, 12 enemies (normal/magic/rare by RNG), melee cone `attack`, `move`, rarity-based modifier drops, exit and tier-up.
  Integer fixed point plus a literal sine table in `src/sim/trig.ts`. Golden hash `990565fc`.
- **Tuning (DECISIONS #22):** every gameplay number is in `src/sim/tuning.ts` (`DEFAULT_TUNING`, flat integer record, 41 keys).
  `createState`/`step`/`replay`/`autopilot` take an optional `Tuning`; `makeTuning(overrides)` rejects unknown keys and fractions.
  The move changed no replay hash. Not in tuning by design: layout (`FP`, arena bounds, exit) in `state.ts`, autopilot habits in `autopilot.ts`.
- **Autopilot** (`src/sim/autopilot.ts`) records `tests/replays/demo-map-seed5.json` (1654 ticks, ~27.6 s, hash `d8f92ce5`) and `baseline-seed42.json`.
  `UPDATE_DEMO=1 npx vitest run autopilot` re-records after a deliberate rule change. Live play: WASD move, arrows/Space/click attack.
- `demo-baseline.json` is gone (its `act` log cannot replay). The audio-gating and hit-stop e2e tests use `?demo=map-seed5`.
- **Frame driver** `src/game/loop.ts` (`runFrame`): Phaser-free clock/pause/hit-stop scheduling, used by Play and property-tested in Vitest.
- **Demo mode** (DECISIONS #18): `?demo=<name>` or `D` on the Menu plays `tests/replays/demo-<name>.json` through the live path.
  View-only params `?speed ?fps ?shots ?perf`. Canvas mirrors `data-mode/tick/status/moment/hash/renderer/camfx/perf/bake-ms`.
- **Palette** (#19): fixed 16 colours, dark/gothic plus rarity colours. **Sprites** (#20): code-defined grids baked in Preload, `pixelArt: true`.
- **Audio fix:** the template's unlock lived on Boot's scene input and was removed when Boot shut down, so no sound ever played.
  It now uses window listeners. The e2e suite asserts the audio chunk loads only after the first input.
- **CI:** e2e evidence artifact (`test-results/`), `verify-pages` job after Pages deploy, manual `E2E stress` workflow.
- Tests: 72 Vitest (14 new in `tuning.test.ts`); 22 e2e (smoke 7, demo 7, pipeline 8).

## Measured
| Risk | Result |
| --- | --- |
| Vite fake-200 | Missing `.js`/`.json` are 404 on preview at root and under `/petrifying-superstition/`. Live Pages is checked by `verify-pages` after merge. |
| Headless WebGL | `data-renderer=WEBGL`, `data-camfx=on`. Screenshots show bloom glow, vignette, burst particles and crisp pixel sprites. Usable as evidence. |
| Frame cost (CI-class container, SwiftShader, 1280x720) | Demo p50 16.7 ms, p95 138 ms, max 142 ms. Software GL is the worst case; the real-device number comes from the phone check. |
| Replay determinism | Same final hash at fps 20/60/120, speed 2 and 4, reduced FX, and 4 auto-pauses (e2e). Plus 20 random-timing runs with pauses and hit-stops (Vitest). |
| Stress (`--repeat-each 24 --workers 8 --retries 0`, 528 runs, 4-core container) | pending; see PR |
| Scale FIT | 16:9, contained, centred at 960x540, 640x360, 390x844, 844x390, and refits at 1920x1080. |

## Open items (human)
1. Repo settings: `BUTLER_API_KEY` secret, `ITCH_USER`/`ITCH_GAME` variables. The itch job skips every step after "Check itch config".
   (Pages source is done: the Deploy for PR 2 deployed Pages and `verify-pages` passed.)
2. itch HTML project: 960x540 embed, fullscreen button on, tick "playable in browser" after the first push.
3. Open the Pages URL and the itch page in a private window, and try `?demo=map-seed5&perf=1`.
4. Phone: the same URL. Record the end-screen p95 in `docs/PLAYTEST.md` (pass if <= 33 ms).
5. Desktop: preview pane via `.claude/launch.json`, from main and from a worktree (does the worktree cwd bug reproduce?).
6. Confirm sound now plays on a real device (it never did before the fix).
7. Housekeeping: delete merged remote branches.

## Next session's first task
B: `/jam-concept` with the theme, and lock `docs/GDD.md` (Theme interpretation, Scope, Open questions are still empty).
Then C: theme fit (room, sprites, names), hand-play for feel (the autopilot never takes damage, so tune enemy damage/aggro by playing),
and save each playtest bug as an F8 replay in `tests/replays/`. Then D: `/jam-sim-balance`, whose adapter can now pass `makeTuning(overrides)`.
Open: a second tier, a boss, and a real map generator are not in this slice.

## Measurements
| Metric | Value | Notes |
| --- | --- | --- |
| Demo frame time p50 / p95 (SwiftShader) | 16.7 / 138 ms | local container; CI numbers in the `perf-baseline.json` attachment |
| Demo frame time p95 (slowest phone) | | pass if <= 33 ms |
| Sprite bake time | | canvas `data-bake-ms` |
