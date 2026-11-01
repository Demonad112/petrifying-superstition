---
name: jam-playtest
description: Run and log a playtest for the Game Off 2026 jam game — debrief Addy's daily 20–30 min session or an outside tester's notes, append a structured entry to docs/PLAYTEST.md, and route every finding into design / balance / bug / polish with next actions. Use whenever the user says they played the build, pastes playtest notes or tester feedback, asks for playtest questions, wants a tester script for outside playtesters, or says something "feels off".
---

# Jam Playtest

Gameplay and Audio scores are judged by humans in 30 seconds to a few minutes, so
the daily playtest is the only real instrument for feel. A log full of "felt fine"
is worthless; this skill extracts specifics and turns them into actions.

## Modes
- **Debrief** (default — user just played): ask the questions below.
- **Analyze** (user pasted notes / tester feedback): structure them, ask only about gaps.
- **Tester script** (user wants outside playtesters): output the tester script at the end.

## Debrief — ask one at a time, wait for each answer
1. **Build + focus:** which commit/URL, and what were you testing today?
2. **First 30 seconds:** without reading anything, did you know what to do? Where did you hesitate?
3. **Best moment:** when did it feel like a game? Be specific.
4. **Worst moment:** most frustrating/confusing/broken moment — with a concrete detail
   ("dash ignored the second press", not "controls felt bad").
5. **Surprise:** anything you didn't expect, good or bad?
6. **One change:** if you could change one thing before tomorrow?

Vague answer → one follow-up asking for the exact moment or number. Don't move on with
"fine". If the user didn't actually play, don't fabricate a session — log nothing and say so.

## Classify findings
| Bucket | What goes here | Route to |
|---|---|---|
| Bug | crashes, softlocks, wrong behaviour that *breaks* | failing test in `tests/` reproducing it first, then fix |
| Balance | numbers feel wrong, difficulty spikes/flat | `/jam-sim-balance` before touching `src/sim/tuning.ts` |
| Design | confusion, unclear goal, theme not reading | `GDD.md`; after Nov 21 only clarity changes, no new mechanics |
| Polish | feel/friction | polish backlog; check against the feel checklist |

A bug is never filed under "pain points" — if it breaks, it's a bug.

## Feel checklist (tick what's present; untested items are "not checked", not "fail")
Input buffer/coyote · 40–80 ms hit-stop on key impacts · camera shake on trauma ·
150–250 ms transitions · ±5% pitch variance on repeated SFX · M mutes + HUD icon ·
R restarts · onboarding in-world, no text walls · high contrast, never colour-only meaning.

## Append to `docs/PLAYTEST.md` (newest at top under the header)
```markdown
## <YYYY-MM-DD> — <commit short sha> — <tester: Addy | name>
**Focus:** ...
**First 30 s:** understood goal Y/N/partial · understood controls Y/N/partial — ...
**Best:** ...
**Worst:** ...
**Surprise:** ...
| # | Finding | Bucket | Severity H/M/L | Action |
|---|---|---|---|---|
**Feel checklist:** <ticked items> | not checked: <items>
**Top action for next session:** ...
```
Create the file with a `# Playtest log` header if missing. Get the sha with
`git rev-parse --short HEAD`. In a chat without repo access, output the entry for pasting.

Then: if 2+ consecutive entries list the same Worst/Design finding, flag it as a pattern —
that's the thing to fix before anything else.

## Tester script (for the 2 outside playtesters, Nov 22–27)
Give the tester this, nothing more — no explanation of the game, that's what's being tested:
```
1. Open <URL>. Don't read the page text first.
2. Play for up to 10 minutes. Think out loud or jot notes as you go.
3. Afterwards answer:
   - What did you think the goal was after 30 seconds?
   - When were you most into it? When did you want to quit?
   - What confused you?
   - Rate 1–5: fun, clarity, how it looks, how it sounds.
   - What word would you use to describe the theme of this game?
```
The last question tests theme interpretation without leading — compare their word to the jam theme.
