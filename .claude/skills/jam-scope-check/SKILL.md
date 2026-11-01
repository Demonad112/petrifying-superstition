---
name: jam-scope-check
description: Read-only scope-creep audit for the Game Off 2026 jam game — compares GDD.md's MVP against what's actually in the repo and git history, quantifies bloat, checks the calendar against Nov 4 / Nov 11 / Nov 21 freeze / Nov 29 submit, and recommends exact cuts. Use when the user asks "are we on track", "any scope creep", "what should I cut", "can I add X", before adding any new mechanic, or at each milestone date.
---

# Jam Scope Check

Read-only: report, never edit code. "It feels bigger" isn't actionable; "+40% items,
6 days to freeze, cut #5 and #6" is.

## 1. Baseline
Read `GDD.md`: MVP list, Out of scope, Build order, Cut list.
If `GDD.md` is missing → stop: **NOT ASSESSED — no baseline**; suggest `/jam-concept`.
If it exists but the MVP list is empty/placeholder → **NOT ASSESSED** too. Zero baseline
items computes to "0% change", which would read as on-track when nothing was compared.

## 2. Current state
- `git log --oneline --since=<GDD.md first commit date>` and `git log --stat -20`
- Grep `src/sim/` and `src/game/` for each MVP item's mechanic.
- Grep for `TODO|FIXME|HACK` added recently.
- Read `docs/PLAYTEST.md` last 3 entries if present (feel issues often hide scope).
Classify every MVP item: **done** (in sim + view + test), **in progress**, **not started**.
Then list **additions**: mechanics/systems in code that aren't MVP items.
If you can't find any related code or commits, current state is **NOT ASSESSED** — don't compute a percentage.

## 3. Calendar
Get today's date (`date`), all times MST. Milestones:
| Date | Gate |
|---|---|
| Nov 4 | Core loop playable (Phaser 4 kill-switch decision) |
| Nov 11 | Vertical slice live (hidden) on itch |
| Nov 21 | Content freeze — no new mechanics after this |
| Nov 28 | Release candidate |
| Nov 29 | Submit (48 h buffer before Dec 1 14:37 MST) |
Compute days to the next gate and MVP items remaining. Rough pace check:
remaining items ÷ days-to-freeze; more than ~1 mechanic/day on a solo schedule is a red flag.

## 4. Report
```markdown
## Scope check — <date> (<N> days to <next gate>)

| MVP item | Status | Evidence |
|---|---|---|

### Additions not in MVP
| Addition | Where | Effort S/M/L | Keep / cut / defer |

### Bloat
MVP items: N · additions: N (+X%) · removed: N · net: ±X%
Done: N/M · days to freeze: N

**Verdict: PASS | CONCERNS | FAIL | NOT ASSESSED** — one line why

### Do this
1. Cut: ...
2. Defer to post-jam: ...
3. Keep: ...
```

Verdict table (net scope change), then adjust for the calendar:
| Net change | Verdict |
|---|---|
| ≤10% | PASS |
| >10–25% | CONCERNS |
| >25% | FAIL |
Also FAIL if any MVP item is "not started" after Nov 21, or core loop isn't playable after Nov 4.
NOT ASSESSED outranks PASS but ranks below CONCERNS/FAIL.

## "Can I add X?" mode
If the user proposes a new feature: after Nov 21 the answer is **no** (freeze) — offer the
polish-only version. Before that, it's yes only with a named cut of equal or larger size
from the GDD Cut list. State the trade explicitly.

## Cut priority (preserve in this order)
1. Core verb + first 30 seconds 2. Win/lose clarity 3. Feel (hit-stop, SFX, transitions)
4. Content volume 5. Extra mechanics / meta-progression. Cut from the bottom.
