# dummy-gamer-3

Browser game, 960x540, Phaser 4 + TypeScript strict + Vite. Solo, 30-day jam.

## Commands
- `npm ci`: install. Also activates the pre-commit hook (`core.hooksPath=.githooks`).
- `npm run dev`: dev server on :5173 (Desktop preview uses `.claude/launch.json`).
- `npm run typecheck`, `npm test` (Vitest, sim), `npm run build`, `npm run preview` (:4173).
- `npm run e2e`: Playwright smoke test against `vite preview`. Run `npm run build` first.
- Fast gate: the `verify` skill (typecheck + sim tests + build).
- The pre-commit hook runs typecheck + sim tests. Never bypass it with `--no-verify`.

## Architecture (hard rule)
- `src/sim/` is a pure-TS deterministic sim: one seeded RNG (`rng.ts`), a flat JSON-serializable
  `SimState`, a serializable `Command` log, and a pure `step(state, cmd)`.
  Zero imports from `phaser` and no DOM, `Date.now()` or `Math.random()`.
- Fixed 60 Hz timestep (`src/sim/clock.ts`). Every tick logs one `Command` (`wait` when idle). Replay fixtures live in `tests/replays/`.
- `src/game/` is a thin Phaser view: it renders `SimState` and turns input into `Command`s. No game rules here.
- All FX code lives in `src/game/fx.ts`. Audio is ZzFX through `src/game/audio.ts`, and only after the first user input.
- Art is primitives in the fixed `PALETTE` (`src/game/palette.ts`). No binary assets.
- Vite `base: './'` and `appType: 'mpa'` (no SPA fallback). Keyboard and mouse only. Scale FIT.
- Path-scoped rules: `.claude/rules/sim.md`, `.claude/rules/phaser.md`.

## Phaser 4
- Pinned exactly: `"phaser": "4.2.1"`. Use `import Phaser from 'phaser'`. Never use Phaser 3 APIs or examples.
- Check `.claude/skills/v3-to-v4-migration/SKILL.md` before using any FX, mask, lighting or tint API,
  then confirm against `node_modules/phaser/types/phaser.d.ts`.
- Phaser 4 skills subset: `.claude/skills/` (see `PHASER_SKILLS_SOURCE.md`).

## Decisions
- Settled systems live in `docs/DECISIONS.md`. Read it before proposing alternatives, and don't re-litigate.
- Design: `docs/GDD.md`. Playtest notes: `docs/PLAYTEST.md`. Session state: `docs/HANDOFF.md`.

## Session hygiene
- One task per session. Start by reading `docs/HANDOFF.md`, and end by updating it (state, open items, next task).
- Small conventional commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`). main must always build.
- Work on a feature branch and merge to main via PR when CI is green. Never force-push.
- Subagents: `explorer` (haiku, read-only), `test-runner` (haiku), `implementer` (sonnet).
- Keep tool output small. Scripts print summaries only.
- Commit messages, PRs, code comments, README and docs/ describe the work only, never the tooling used to produce it.

## Cloud vs local
- Cloud sessions: code, tests, workflows, docs, git and PRs, headless Playwright.
- Local sessions (Desktop): Browser preview pane, screenshots, feel playtests, worktree tests,
  anything needing secrets or logins (itch, butler, gh secrets). Runbook: `docs/LOCAL.md`.
- Deploys: CI on every push/PR. On main, `deploy.yml` publishes to GitHub Pages and to itch via butler.
