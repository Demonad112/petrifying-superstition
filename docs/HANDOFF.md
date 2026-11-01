# Handoff

_Updated 2026-11-01 · pipeline-proof demo, PR 1 (keepers)_

## State
- Repo created from the jam template and renamed to `petrifying-superstition` (package, `<title>`, Menu, README, settings key `ps.settings`).
- The template skeleton is unchanged: `act` rolls a d6, one block, HUD, FX kit (DECISIONS #17), pause/mute/fx settings (#16).
- Tests: 20 Vitest, 7 e2e, all green.

## In progress
Pipeline-proof demo (see `docs/GDD.md` header). It is evidence, not the game.
- PR 1 (keepers): rename, frame driver, replay-driven demo mode, view-only debug params, 16-colour palette,
  code-defined pixel sprites, subpath/scale/audio e2e, CI evidence upload, post-deploy Pages check.
- PR 2 (mini-slice of the real loop, squash-merged so it can be reverted): map run, enemy rarity, RNG modifier drops.

## Open items
1. Repo settings for this repo: Pages source = GitHub Actions, `BUTLER_API_KEY` secret, `ITCH_USER`/`ITCH_GAME` variables.
2. itch HTML project: 960x540 embed, fullscreen button, "playable in browser" ticked after the first push.

## Next session's first task
Finish PR 1, then PR 2 shaped by the theme (announced Nov 1, 14:37 MST).

## Measurements
| Metric | Value | Notes |
| --- | --- | --- |
| Demo frame time p50 / p95 (CI, SwiftShader) | | from `perf.json` artifact |
| Demo frame time p95 (slowest phone) | | pass if <= 33 ms |
