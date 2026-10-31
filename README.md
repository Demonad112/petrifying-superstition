# dummy-gamer-3

Phaser 4 browser game template, 960x540, keyboard and mouse.

## Controls

| Input | Action |
| --- | --- |
| Enter / Space / Click | Start, restart |
| Space / Click | Act (placeholder command) |
| P | Pause / resume (Play). Also pauses on focus loss; resume with P |
| M | Mute / unmute (any scene, remembered between sessions) |
| F | Full / reduced FX (shake and flash off, half the particles; any scene, remembered between sessions) |
| Esc | End run |
| F8 | Save the run as a replay file (Play and Game Over) |

Append `?seed=<n>` to the URL to pin the run seed.

## Replays

The sim ticks at a fixed 60 Hz. Every tick logs one command (`wait` when idle), so `{seed, log}` reproduces a run exactly.
F8 downloads `replay-<seed>-<ticks>.json`. Put it in `tests/replays/` and `npm test` re-simulates it against its stored hash.
See `tests/replays/README.md`.

## Dev commands

```bash
npm ci            # install (also activates the pre-commit hook)
npm run dev       # dev server on http://localhost:5173
npm run typecheck # tsc, strict
npm test          # vitest (sim)
npm run build     # production build to dist/
npm run preview   # serve dist/ on http://localhost:4173
npm run e2e       # Playwright smoke test against preview (build first)
```

License: MIT

## Starting a game from this template

1. GitHub: "Use this template", then clone and run `npm ci`.
2. Set the repo-local git identity, then add the `BUTLER_API_KEY` secret and the `ITCH_USER`/`ITCH_GAME` variables. Set Pages source to GitHub Actions.
3. Rename the project in `package.json`, `index.html` `<title>`, the Menu title and this README.
4. Fill in `docs/GDD.md` and reset `docs/HANDOFF.md`.
5. Replace the `act` command, `SimState` fields and the Play scene with the real game. Update `EXPECTED_HASH` deliberately and delete or re-record `tests/replays/baseline-seed42.json`.
