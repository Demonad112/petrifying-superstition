---
name: jam-ship-check
description: Pre-release gate for the Game Off 2026 jam entry — verifies the web build, GitHub Pages and itch.io html5 upload, itch page completeness, controls/onboarding basics, and scans every public surface (README, source, commits, branch names, built bundle, itch copy) for AI/tool attribution text. Use before the Nov 11 hidden slice, the Nov 28 release candidate, the Nov 29 submit, any time the user asks "are we ready to ship/submit", or after writing README or itch page copy.
---

# Jam Ship Check

A checklist that produces a verdict, not vibes. Run it read-only, report, then fix
only what the user approves (or what's trivially safe, like adding a missing `M` mute key note to the README).

## 1. Attribution scan (always run first)
Project rule: nothing public says the game was made/built with Claude, Claude Code, or AI.
`CLAUDE.md`, `.claude/`, handoff files are allowed. Addy handles disclosure himself on the jam form and itch page.
```bash
python3 -I <this-skill>/scripts/attribution_scan.py . --dist dist --extra itch-page.md
```
(`--dist` only after a build; `--extra` for any itch copy drafts.) Exit 1 = hits.
- Hits in files or the latest unpushed commits → propose the exact edit / `git commit --amend` wording.
- Hits in **already-pushed history** → report them; rewriting public history (rebase/force-push) is destructive and is the user's call. Never do it unprompted.
- Model words (`opus`, `sonnet`, `haiku`) can be false positives in game content — show context and let the user judge.
- Never add a disclosure line yourself and never remove one the user wrote on itch.

## 2. Build + deploy
| Check | How |
|---|---|
| Typecheck + tests green | `npm run typecheck && npm test` (or the repo's scripts) |
| Production build | `npm run build`; report `dist/` total size (`du -sh dist`) and largest JS chunk |
| Loads from a sub-path | Vite `base` set for Pages/itch (relative `./` works for both) |
| Pages live | latest push deployed; URL returns 200 (`gh run list -L 3`, `gh api repos/{owner}/{repo}/pages`) |
| itch upload | Butler channel `html5` pushed for this commit (`butler status <user>/<game>:html5` if available) |
| "Playable in browser" | must be ticked once by hand on itch — ask the user to confirm, can't be verified from CLI |
| Viewport | itch embed 960x540, fullscreen button on, autostart off |
| Audio | nothing plays before first input (browser autoplay policy) |
| Errors | Playwright smoke: page loads, canvas present, no console errors for 10 s of input |

## 3. Player-facing basics
Mute on `M` with HUD icon · restart on `R` · controls shown in-game without a text wall ·
pause/focus-loss doesn't break the sim · works at 1280x720 and 1920x1080 browser windows ·
no colour-only information.

## 4. itch page (by Nov 28)
630x500 cover (animated GIF < 3 MB showing the core twist) · 3–5 screenshots · one-line hook ·
controls table · "how the theme fits" blurb (from GDD `Theme fit`) · repo link · tags ·
kind = HTML · page visibility matches the stage (hidden/draft for Nov 11, public at submit).
Jam submission itself: game submitted to the Game Off jam page, public GitHub repo linked.

## 5. Report
```markdown
## Ship check — <date> — <stage: slice | RC | submit> — <commit>
**Verdict:** READY | READY WITH WARNINGS | BLOCKED | NOT ASSESSED
| Area | Item | Status PASS/FAIL/NOT CHECKED | Note / fix |
### Blockers
### Warnings
### Needs a human (can't verify from CLI)
```
Rules: any attribution hit in current files, failing build/tests, or broken Pages/itch
load = **BLOCKED**. Anything you couldn't actually run is **NOT CHECKED**, never PASS —
a green line for an unrun check is worse than a gap. If nothing could be run (no build
yet), the verdict is NOT ASSESSED.

Stage strictness: **slice (Nov 11)** — sections 1–2 only. **RC (Nov 28)** — all sections.
**Submit (Nov 29)** — all sections plus confirm the jam submission and repo visibility.
