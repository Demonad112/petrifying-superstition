# Prompt: build the demo slice (paste into a new session)

```text
Repo: Demonad112/petrifying-superstition. Build the demo slice described in docs/DEMO_SLICE.md, in one session and one draft PR.

Setup, in this order:
1. git config user.name "Addison" && git config user.email addynetgrp@gmail.com
2. git fetch origin && git checkout feat/demo-slice (it already has the plan commit). Never create or push claude/* branches; if one exists locally, ignore it.
3. npm ci. Read, in this order: CLAUDE.md, docs/DEMO_SLICE.md, docs/KNOWN_ISSUES.md, docs/HANDOFF.md, docs/DECISIONS.md, then src/sim/{tuning,state,step,autopilot}.ts and src/game/scenes/{Boot,Preload,Play}.ts, src/game/{loop,input,fx,sprite-data,sprites,debug}.ts, vite.config.ts, playwright.config.ts.

Build:
- Do batches 1-8 from the table in docs/DEMO_SLICE.md, in order, as small conventional commits. Push to feat/demo-slice after each batch and keep it as one draft PR (open it after batch 1 if none exists).
- The goal is a working slice on GitHub Pages: move, attack, kill one gorgon on a flat field, pick up one rune, and see the stat change. A rough sketch at about 60% detail is enough. Don't polish.
- No sim rule changes. The golden hash 990565fc and the replay fixtures must stay green.

Known issues log (this is half the point of the slice):
- Every problem you hit (build, CI, Pages, Phaser 4 API, types, tests, git, tooling, attribution text) goes into docs/KNOWN_ISSUES.md as a K-NN entry with Symptom / Cause / Fix / Status / Seen, at the moment you hit it, even if you fix it right away.
- Attribution or tool names showing up somewhere is NOT a blocker on this branch: log it and move on.

Rules that still apply: never use --no-verify, never force-push, a regression test for every fix (watch it fail first), no game rules in src/game/, check Phaser 4 types before any FX/tint API, and report honestly: a check you didn't run is NOT CHECKED, never PASS.

Finish: run /verify and npm run e2e. Put a results table in the PR body (typecheck, Vitest, build, e2e, CI), plus the list of new K-NN entries. Update docs/HANDOFF.md. Leave the PR as a draft and stop. Don't merge.
```
