# Local session runbook

Use for work the cloud can't do: Browser preview pane, screenshots, feel playtests,
parallel worktree tests, and anything needing secrets or logins.

## 1. Get the code
```bash
git clone https://github.com/Demonad112/petrifying-superstition.git && cd petrifying-superstition   # first time
git checkout main && git pull --ff-only                                         # afterwards
git checkout -b feat/<short-task-name>
npm ci
```
Check: `git config core.hooksPath` prints `.githooks` (set by `npm ci` via `prepare`).

## 2. Verify the baseline (about 1 minute)
```bash
npm run typecheck && npm test && npm run build && npm run e2e
```
Expected: no tsc output, `Tests N passed` (Vitest, all green), a silent build, and every e2e test passed (count in `docs/HANDOFF.md`).
If `npm run e2e` says the browser is missing, run `npx playwright install chromium` once.

## 3. Task recipes (touch only the listed files)

| Task | Run | Check | Files |
| --- | --- | --- | --- |
| Preview pane / screenshots | Desktop preview uses `.claude/launch.json` (`npm run dev`, :5173) | Menu shows, click starts Play, the current verb gives feedback (FX + sound), bloom glow + soft vignette visible | none (read-only) |
| Feel playtest | `npm run dev` | Input response, hit feedback, audio volume | `docs/PLAYTEST.md` (add a dated entry) |
| Tuning feel | `npm run dev` | As above | `src/game/input.ts`, `src/game/fx.ts`, `src/game/audio.ts` |
| Worktree test | `git worktree add ../ps-wt -b feat/wt-test && cd ../ps-wt && npm ci && npm test` | Hook works in the worktree, and tests pass independently | none, then `git worktree remove ../ps-wt` |
| Secrets / Pages / itch | see the "Manual steps" in `docs/HANDOFF.md` | `gh secret list`, `gh variable list` | none in repo |
| Measurements | `/context`, `/usage`, `/doctor` in the CLI | Record numbers | `docs/HANDOFF.md` |

## 4. Push back
```bash
git add -p && git commit -m "feat: <what changed>"   # pre-commit runs typecheck + sim tests
git push -u origin feat/<short-task-name>
gh pr create --fill --base main
```
CI must be green before merging. Squash-merge with a conventional title. Never force-push.
Update `docs/HANDOFF.md` (state, open items, next task) in the same PR.
