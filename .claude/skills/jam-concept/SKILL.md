---
name: jam-concept
description: Turn a game-jam theme into a locked one-page GDD for Addy's GitHub Game Off 2026 entry (Phaser 4 + pure-TS deterministic sim). Use on theme day or whenever the user gives a theme, asks for concept ideas, wants interpretations scored, wants to compare or pick a game concept, wants to pivot to a new concept, or asks to write/refresh GDD.md — even if they just paste the theme word with no instructions.
---

# Jam Concept: theme → scored concepts → one-page GDD

Theme day is the single highest-leverage decision of the jam. The two failure modes are
(1) building the obvious first thought that most of ~700 entrants also build, and
(2) picking a concept whose scope can't reach content freeze on Nov 21. This skill
guards against both, then writes a one-page `GDD.md` the build can trace back to.

Work autonomously: generate, score, recommend, and draft. Ask only one question —
which concept to lock — and only after showing the recommendation.

## Inputs
- The theme (from the user's message).
- `docs/` or project brief if present (schedule, locked stack). If not present, assume:
  Phaser 4.2.1 view over a pure-TS deterministic sim (`src/sim/`: seeded RNG, flat
  serializable state, command log, no Phaser/DOM imports), 960x540, keyboard+mouse,
  primitives + fixed palette art, ZzFX audio, content freeze Nov 21, submit Nov 29.
- If a `GDD.md` already exists, refine it instead of starting over, and say what changed.

## Step 1 — 15+ interpretations (no filtering)
Cover each lens at least once: literal, metaphorical, mechanical (theme as a rule),
inverted, pun/double meaning, technical-domain meaning (computing, physics, economics,
sensory). Mark the 2–3 you expect most entrants to build as **[obvious]** — they're
allowed only with a twist that changes the core verb.

## Step 2 — three concepts
Pick three interpretations that lead to *different core verbs*. For each, a compact card:

| Field | Content |
|---|---|
| Hook | one sentence |
| Core verb | what the player does that *is* the theme (theme must be the verb, not the skin) |
| First 10 seconds | the first-fun moment, no text |
| Win / lose | how a run ends |
| Sim state | entities, resources, commands (one line each) |
| Art / audio | within primitives + ZzFX |
| Scope trap | the single riskiest thing |

## Step 3 — weighted score
Score 1–5, multiply, total. Scope safety is inverted (5 = tiny).

| Criterion | Weight |
|---|---|
| Overall appeal | 2 |
| Theme interpretation | 1.5 |
| Gameplay | 1.5 |
| Innovation | 1 |
| Graphics achievable w/ primitives | 0.75 |
| Audio achievable w/ ZzFX | 0.5 |
| Scope safety | 2 |
| Testability (headless sim) | 1 |

Max = 51.25. Show the table, then **recommend one** with a two-sentence why. Past
Game Off winners rank high on Theme + Gameplay, low on Graphics — weight ties toward that.

Hard disqualifiers (flag, don't silently drop): netcode, custom level editor, large
hand-authored content volume, continuous physics that can't be made deterministic,
heavy text/UI, anything that needs binary art assets to read.

## Step 4 — one-page GDD for the recommended concept
Write `GDD.md` at the repo root (in a chat with no filesystem, output it in a code block
ready to paste). Use exactly this template — one screen. If a field wants a second
paragraph, it's out of scope for a jam.

```markdown
# [Working title]

**Pitch:** [one sentence]
**Theme fit:** [one sentence — how the core verb IS the theme; reused on the itch page]

## Core loop
- [2–4 bullets: do → get → why again]

## Win / fail
- [what a run is, how it ends — acceptance criteria trace back here]

## First 30 seconds (no text)
1. [beat] 2. [beat] 3. [beat]

## MVP (≤7 items — each becomes a build task)
1. ...

## Out of scope (deliberately not building)
- ...

## Build order (riskiest / core-fun first)
1. ...

## Sim sketch
- State: ...
- Commands: ...
- Tuning knobs (live in src/sim/tuning.ts): ...

## Art / audio
- Palette + shapes: ...
- SFX list (ZzFX): ...

## Cut list (in order, if behind schedule)
1. ...
```

MVP rule: **more than 7 items → push back.** Move the items the core loop works
without into Out of scope and Cut list, and say which ones you moved.

Build order rule: the unproven part of the core verb goes first, so Nov 4
(core loop playable) actually answers "is this fun?".

## Step 5 — lock
Show the GDD, then ask once: lock this concept, or swap to concept #2/#3? On lock, the
next step is `/jam-spike` (45-minute paper test of the core verb in `src/sim/` only)
if the fun is unproven, else straight to building MVP item 1.

## Rules
- Nothing written here goes into public files with "AI", "Claude", or "generated"
  wording — the GDD is fine in-repo, but itch/README copy must stay attribution-free.
- Don't invent jam facts (dates, rules, medians). Use the project brief or say unknown.
