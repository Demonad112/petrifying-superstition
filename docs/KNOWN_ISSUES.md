# Known issues and lessons

A running log of problems hit while building, so the jam build doesn't repeat them.
Add every new problem as you hit it, even ones fixed in the same session.

Entry format: **ID · title**, then Symptom / Cause / Fix or workaround / Status / Seen.
Status is one of `fixed`, `workaround`, `open`, `idea`.

## Build, CI and deploy

**K-01 · e2e demo test times out on slow CI runners**
- Symptom: `demo.spec` "plays to the end" and the pipeline audio test wait 100 s for GameOver and give up at tick ~1372/1654.
- Cause: software WebGL on the runner (~360 ms/frame) combined with the fixed-step catch-up cap (`MAX_STEPS_PER_FRAME = 5`) gives about 14 ticks/s. `?speed=N` multiplies delta but doesn't lift the cap.
- Fix: let `?speed=N` raise the cap to `5 x N` (view-only, so hashes don't change), or keep e2e demos short (the slice's `?auto=1` run is about 1 s of sim time per 60 ticks). Re-running the failed jobs passed (3 min 39 s against 9.3 min).
- Status: workaround (re-run). Not seen in the slice's own e2e (a ~300-tick `?auto=1` run). Proposed branch `fix/e2e-demo-pacing`.
- Seen: Deploy run for `cd5c3d5`, attempt 1.

**K-02 · itch deploy silently skipped**
- Symptom: the `itch` job is green but every step after "Check itch config" is skipped.
- Cause: the `BUTLER_API_KEY` secret and the `ITCH_USER`/`ITCH_GAME` variables aren't set.
- Fix: set them in repo settings (a human step). Not needed for the slice, which is Pages only.
- Status: open (by choice).

**K-03 · new HTML page not built or 404 on Pages** _(expected, check during the slice)_
- Cause: Vite `appType: 'mpa'` only builds `index.html` unless `build.rollupOptions.input` lists every page. `verify-pages` only probes the index.
- Fix: add the page to `rollupOptions.input`, add an e2e test at root and subpath, and add a `verify-pages` probe.
- Status: fixed (slice batches 4, 6, 7). `slice.html` was a 404 in `dist` without the input (e2e `slice.html returns 200 text/html` failed with `Received: 404`, passes with it).

**K-04 · Pages must be served under a subpath**
- Cause: Pages serves `/<repo>/`. Absolute asset paths break.
- Fix: `base: './'`. Playwright also serves `dist/` under `/petrifying-superstition/` on :4174. Keep both.
- Status: fixed (template).

## Git, attribution and branches

**K-05 · `Co-authored-by: Claude` trailer on main**
- Symptom: squash-merge commit `cd5c3d5` carries `Co-authored-by: Claude <noreply@anthropic.com>`.
- Cause: the cloud container's default git identity is the tool's identity. GitHub squash adds a co-author trailer for every distinct commit author.
- Fix: at the start of every cloud session, run `git config user.name "Addison"` and `git config user.email addynetgrp@gmail.com`, and check with `git log -1 --format='%an <%ae>'` before pushing. In the squash dialog, delete trailers before confirming.
- Status: workaround. History isn't rewritten (owner's call).

**K-06 · `Co-authored-by: Addison` trailer on a squash merge**
- Symptom: `47712a3` (PR 4) ends with `Co-authored-by: Addison <addynetgrp@gmail.com>`.
- Cause: the commits were authored as `addynetgrp@gmail.com`, but the merge was done by an account whose primary email is different, so GitHub counted a second author.
- Fix: add `addynetgrp@gmail.com` to the GitHub account (verified), or commit with the account's primary or noreply email. Remove the trailer in the squash dialog.
- Status: open. Seen again on `c0eb50e` (PR 5 squash): `Co-authored-by: Addison <addynetgrp@gmail.com>`.

**K-07 · `claude/*` session branch created automatically**
- Symptom: a `claude/<slug>` branch exists locally and on origin.
- Cause: the cloud session is set up with a designated `claude/*` branch.
- Fix: the first command of every session is `git checkout -b feat/<slug> origin/main`. Never push the designated branch, and delete it if it appears.
- Status: workaround. Remote `claude/quirky-tesla-mbfrmo` is still pending deletion by the owner.

## Sim and view

**K-08 · `runAutopilot` ignores the tuning it was given**
- Symptom: `runAutopilot(s0, n, (s, c) => step(s, c, t))` steps with `t`, but the bot decides with `DEFAULT_TUNING` (attack range).
- Cause: `runAutopilot` calls `autopilot(s)` without `t`.
- Fix: add a `t` parameter and pass it through. Default-tuning hashes don't change. Regression test with an `attackRange` override.
- Status: fixed (slice batch 1). Regression test `runAutopilot with an attackRange override decides with that tuning` failed before the fix (log diverged at the first move), passes after; default-tuning hashes unchanged.

**K-09 · the view reads `DEFAULT_TUNING` directly**
- Symptom: Play's HUD kill total (`enemyCount`) and kill detection (`knockback`) are wrong for any run with overrides.
- Cause: `Play.ts` imports `DEFAULT_TUNING` and doesn't take the tuning the run uses.
- Fix: scenes hold the run's `Tuning` and pass it to `step` and every view lookup.
- Status: open for Play. The slice avoids it by design.

**K-10 · kill detection is a heuristic diff**
- Cause: the sim exposes no events, so `Play.reactKills` matches enemies across ticks by rarity and knockback distance.
- Fix: the sim appends per-tick events (`kill`, `drop`, `pickup`, `hurt`) to state. This changes the hash, so update `EXPECTED_HASH` deliberately.
- Status: idea, for the jam build.

**K-11 · replay files outlive command schema changes**
- Symptom: `demo-baseline.json` (an `act` command log) couldn't replay after the command set changed, and was deleted.
- Fix: store a format version and a tuning hash in replay files, and fail loudly on mismatch.
- Status: idea.

**K-12 · audio never played**
- Cause: the audio unlock listener was bound to Boot's scene input, which is torn down when Boot shuts down.
- Fix: bind unlock to `window` listeners. The e2e test asserts the audio chunk loads only after the first input.
- Status: fixed. Still needs confirming on a real device.

## Tooling

**K-13 · scratch probe files under `src/` were blocked in a cloud session**
- Symptom: writing a throwaway Vitest file into `src/sim/` to probe seeds was refused.
- Fix: put probes in `spikes/<slug>/` (per the spike rule), or write them as real tests.
- Status: workaround.

**K-14 · session-designated `claude/*` branch conflicts with the branch rules**
- Symptom: the cloud session's setup named `claude/demo-slice-build-<id>` as the branch to develop and push, while the repo rules and the task say never create or push `claude/*`.
- Cause: the harness injects a branch instruction independent of `CLAUDE.md`; a local `claude/demo-slice-build-<id>` and its origin copy were pre-created.
- Fix: followed the repo rule: worked on `feat/demo-slice`, never pushed the `claude/*` branch. Owner should delete the stray local/remote `claude/*` branches (see K-07).
- Status: workaround.
- Seen: slice session start.

**K-15 · killing the last enemy opens the exit, and the sim freezes if the player reaches it**
- Symptom: with `enemyCount 1` the exit opens on the kill; walking into it sets `status='cleared'`, after which `step` returns the same state, so a rune not yet picked up can never be taken.
- Cause: the exit rule is unconditional; the slice has no use for it. The plan's "hide the exit sprite" only hides it.
- Fix: `exitRadius: 0` in `SLICE_OVERRIDES` (tuning only, no rule change); the exit sprite is not drawn. Test `slice exit never triggers` failed with the line removed, passes with it. Caveat: `near` uses `<=`, so standing exactly on the exit point (a 1-in-thousands fixed-point coincidence) still clears; accepted for a sketch.
- Status: fixed.
- Seen: batch 2.

**K-16 · seed probe: first damage-drop seed is 4, not 1**
- Symptom: seeds 1..3 drop vigor (`maxHp` +4, no damage change).
- Cause: drop kind is a seeded RNG draw; DMG is 1 in 4.
- Fix: `SLICE_SEED = 4` (autopilot probe over 1..50, all pick up the rune in 267..531 ticks).
- Status: fixed.
- Seen: batch 2.

**K-17 · Phaser 4 hit flash: no `setTintFill`, and the fill mode sticks**
- Symptom: `setTintFill()` is typed but deprecated (returns void); `setTint(c)` alone doesn't fill. A flash that only calls `clearTint` would leave the sprite a white silhouette.
- Cause: Phaser 4 split colour and mode: `setTint(c).setTintMode(Phaser.TintModes.FILL)`; the mode persists until set back.
- Fix: `flashSprite` in `src/game/fx.ts` sets FILL, then restores `MULTIPLY` + white tint after 90 ms. Checked against `node_modules/phaser/types/phaser.d.ts` before use.
- Status: fixed.
- Seen: batch 4.

**K-18 · headless slice runs at ~13 ticks/s (software WebGL)**
- Symptom: `?auto=1` reached tick 63 in 5 s in headless Chromium.
- Cause: same as K-01 (SwiftShader frames, 5-step catch-up cap).
- Fix: e2e budgets are generous and poll; `?speed=N` does not lift the cap, so keep the slice's e2e tolerant (a ~300-500 tick run).
- Status: workaround. On the CI runner the rate was lower still, ~5 ticks/s (tick 158 after 30 s): the first `?auto=1` budget of 30 s failed both attempts on PR 7 (run 41284719496); the budget is now 100 s. `data-tick` at timeout is the number to read. The demo test `plays to the end` failed in the same run (K-01).
- Seen: batch 4; CI on PR 7.

**K-19 · `pkill -f "vite preview"` kills the calling shell**
- Symptom: a Bash tool call that ran `pkill -f "preview --port 4173"` exited 144 with no output.
- Cause: `-f` matches the full command line, which includes the shell running the pkill command itself.
- Fix: use a bracket pattern (`pkill -f "[p]review --port 4173"`) or kill by PID.
- Status: workaround.
- Seen: batches 5 and 6.

**K-20 · plan PR merged while the build branch was still in use**
- Symptom: mid-session the instruction changed to "PR 5 (plan docs) is merged, rebuild from `origin/main`", but every batch (0-7) had already been pushed to `feat/demo-slice` and PR 5 had been squash-merged with all of them.
- Cause: the plan commit and the build shared one branch and one PR, so merging the plan merged the build. `main` ended up with the same tree as the local branch (`git diff origin/main HEAD` empty).
- Fix: nothing to rebase. `git checkout -B feat/demo-slice origin/main` left only batch 8 (docs); it goes on a new branch and a new PR. The old remote `feat/demo-slice` is not reused (non-fast-forward against the squashed main).
- Status: workaround. Next time: land the plan docs on `main` first, or start the build on its own branch.
- Seen: end of the slice session.

**K-21 · overlapping e2e runs kill each other's preview servers**
- Symptom: a local `npm run e2e` finished "20 passed, 6 failed" with `net::ERR_CONNECTION_REFUSED` on `localhost:4173`, mid-run.
- Cause: a first run (backgrounded, no result line) was still alive when a second was started. Outside CI Playwright reuses an existing server (`reuseExistingServer`), and when the first run exited it stopped the servers it had spawned, under the second.
- Fix: one e2e run at a time; before starting, check `pgrep -f "[p]laywright test"` and wait for it. Don't treat the failures as product failures; re-run clean.
- Status: workaround.
- Seen: slice session, final verification.

**K-22 · session stop hook wants commits re-authored and force-pushed**
- Symptom: a stop hook reports commits as "Unverified" because the committer email isn't the tool's noreply address, and asks to switch identity and `git commit --amend --reset-author` or rebase pushed commits.
- Cause: the hook assumes the tool's identity and signing, which conflicts with K-05 (commits are authored as the owner) and with the no-force-push rule.
- Fix: not applied; amending pushed commits needs a force-push. Options for the owner: enable commit signing or vigilant mode for the account, or exempt this repo from the hook.
- Status: open (owner decision).
- Seen: slice session, after pushing PR 6.

## Ideas
- Slice "new skill" variant: a modifier that adds a dash command. It needs a new `Command` and sim rule, so it's out of scope for the slice.
- Slice polish left out on purpose: per-line glow on the stat panel (now one Text, the changed stat is bracketed and the whole line is tinted), a menu link to `slice.html`, sound design, a pause overlay, hand-play feel tuning (the `?auto=1` run never takes damage).
- Slice sprites are rough: the gorgon reads small and dim at 2x; try 3x with a brighter `frost` rim and check on a phone.
