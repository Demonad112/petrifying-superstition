# petrifying-superstition

Game Off 2026 entry. Phaser 4 browser game, 960x540, keyboard and mouse. Built from the jam template.

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
| D | Watch the demo (Menu, when a demo fixture exists) |

## URL parameters

| Parameter | Effect |
| --- | --- |
| `?seed=<n>` | Pin the run seed |
| `?demo=<name>` | Play `tests/replays/demo-<name>.json` on load (self-playing demo) |
| `?speed=<n>` | Run the clock n times faster (0.25-8); view-only |
| `?fps=<n>` | Force a fixed frame rate (5-240) |
| `?shots=1` | Pause at each moment (resume with P), for screenshots |
| `?perf=1` | Record frame times; summary on the end screen |

None of these change the outcome of a run: the replay hash is the same with or without them.

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
