# Demo slice: build plan

_Created 2026-11-01. Branch `feat/demo-slice`, one draft PR, many commits._

## Goal
A tiny playable page on GitHub Pages, at `<pages-url>/slice.html`. The point is to hit the real
build/deploy/render problems now, before the jam build, and to write each one down in
`docs/KNOWN_ISSUES.md`.

What the player does, start to finish (about 20–40 s):
1. Spawns on a flat field. Move with WASD.
2. One mythic monster walks toward them. Attack with arrows, Space or a mouse click.
3. The monster dies and drops one glowing rune (the modifier).
4. Walking over the rune picks it up. A card names it and shows the stat change, for example
   `RUNE OF FURY: Damage 1 -> 2`. The stat panel highlights the changed line.
5. A "Slice complete" panel appears. `R` restarts.

That's the whole scope. No menu, tiers, exit, itch, audio polish or balance work.

## Look: a rough sketch, about 60% detail
Use the existing systems only: code-defined pixel sprites (`src/game/sprite-data.ts`), the fixed
`PALETTE`, and FX in `src/game/fx.ts`. No binary assets.

| Element | Sketch |
| --- | --- |
| Theme | "Petrifying superstition": a lantern-bearer at a crossroads, facing a stone gorgon. |
| Background | A flat field. Floor tiles in `stone1`/`moss` with a few scattered decorations: two or three standing stones, a chalk/salt circle (a `bone` ring drawn with Graphics), grass tufts. Decorations never collide. No walls needed. Keep the sim's arena bounds. |
| Hero | About 12x16 grid: hooded cloak (`stone2`/`frost`), `bone` face, a `torch1` lantern in one hand. Flip on left-facing, a 1 px walk bob (view tween), and the existing slash FX on attack. |
| Monster | 24x24 to 32x32 grid (`SPRITE_MAX` is 32): a gorgon/basilisk bust with snake-hair strands, `stone3` skin, `rare`/`magic` glowing eyes and a `blood1` mouth. Idle bob, a white flash on hit (use the FX helper and check the tint API against Phaser 4 types first), and an HP bar over its head (Graphics, `blood1` on `stone0`). |
| Rune drop | Reuse `gem1` (or a new rune stone grid), with a pulse tween and a small `?` label above it. |
| Damage numbers | Floating `-1` text that rises and fades over 400 ms. |
| HUD | Bottom-left stat panel: `HP 20/20 · DMG 1 · HASTE 0 · SWIFT 0`, monospace, `PALETTE.text`. The changed line glows `accent` for 3 s after pickup. |
| Pickup card | Top-centre, about 3 s: rune name plus `stat old -> new`. Names: DMG "Rune of Fury", HASTE "Rune of Quickening", SWIFT "Rune of the Hare", VIGOR "Rune of Stone Skin". |

## Architecture (keep the rules that matter)
- **No sim rule changes.** The slice is the existing sim run with tuning overrides. Golden hash
  `990565fc` and the replay fixtures must stay green.
- **`src/sim/slice.ts`** (pure data): `SLICE_OVERRIDES` and `SLICE_TUNING = makeTuning(SLICE_OVERRIDES)`.
  Starting values (make it easy):
  `enemyCount 1, rarityWeight0 0, rarityWeight1 1, rarityWeight2 0, dropChance1 100, enemySpeed1 10, enemyHp1 4`.
  Magic rarity gives exactly 1 modifier of value 2. Add `SLICE_SEED`: pick it by probing seeds 1..50
  with the autopilot (see batch 2) and choose the first one whose drop is kind 0 (DMG), so the default
  run shows a damage increase. `?seed=N` overrides it.
- **View:** a new `src/game/scenes/Slice.ts`, with entry `src/slice.ts` and page `slice.html` at the repo
  root. Game config: `[Boot-like init, sprite bake, Slice]`. Reuse `bakeSprites`, `runFrame` (loop.ts),
  `CommandInput`, `fx.ts` and `audio.ts`. Every `step(...)` call passes `SLICE_TUNING`.
  Don't read `DEFAULT_TUNING` in the slice view (see KNOWN_ISSUES K-09).
- "Slice complete" is a view check: `sim.picked >= 1`. The sim status stays `playing`. Hide the exit sprite.
- **Vite:** `appType: 'mpa'` only builds `index.html` unless `build.rollupOptions.input` lists both pages.
  Add `{ main: 'index.html', slice: 'slice.html' }`.
- **`?auto=1`:** the command source is `autopilot(sim, SLICE_TUNING)` and not the keyboard. It's for e2e only.
- Mirror onto the canvas (as Play does): `data-scene=Slice`, `data-tick`, `data-px`, `data-ehp`,
  `data-picked`, `data-mdmg/mhaste/mswift/maxhp`, `data-complete`.

## Batches: one PR, push after each batch
Each batch is one or more small conventional commits. Run the pre-commit hook every time and never use `--no-verify`.

| # | Commit(s) | Done when |
| --- | --- | --- |
| 0 | `docs: demo slice plan and known-issues log` | Already on the branch (this file and `KNOWN_ISSUES.md`). |
| 1 | `fix(sim): runAutopilot passes tuning to the autopilot` | K-08. Write the test first and watch it FAIL. The default-tuning hashes don't change. |
| 2 | `feat(sim): slice tuning overrides` + `test(sim): slice ...` | Tests: `slice createState spawns exactly one enemy`, `slice kill always drops one modifier`, `slice autopilot picks up the rune within 1500 ticks`, `slice pickup raises the matching stat`, `slice default seed drops a damage rune`. |
| 3 | `feat(art): slice hero, gorgon, rune and field sprites` | Sprite-data tests pass (palette keys, max 32, rectangular rows). |
| 4 | `feat(slice): slice page, entry and scene` + `build: add slice.html as a second Vite input` | `npm run build` emits `dist/slice.html`. Move and attack work under `npm run preview`. |
| 5 | `feat(slice): HUD stats, monster HP bar, damage numbers, pickup card, complete panel, restart` | All 5 player steps above work by hand. |
| 6 | `test(e2e): slice page` | `slice.html` returns 200 at root and under the subpath. `data-scene=Slice`. A keyboard move changes `data-px`. `?auto=1` reaches `data-complete=true` in under 30 s, and the matching stat went up. No console errors. |
| 7 | `ci: verify-pages also probes slice.html` | `deploy.yml` verify step checks `${base}slice.html` returns `200 text/html`. |
| 8 | `docs: handoff and known issues after the slice` | `HANDOFF.md` state/next updated, and every problem hit is logged in `KNOWN_ISSUES.md`. |

Then: run `/verify` and `npm run e2e`, record results honestly in the PR body (NOT CHECKED if not run),
leave the PR as a draft, and stop. The owner merges, and the main Deploy publishes Pages.

## Out of scope (write it down, don't build it)
Menu link to the slice, sound design, new sim mechanics ("new skill" abilities), more monsters, balance,
itch upload, mobile/touch, and polish. Put ideas in `KNOWN_ISSUES.md` under "Ideas".

## Rules for this branch
- Relaxed: tool/attribution text showing up somewhere is not a blocker. Log it in `KNOWN_ISSUES.md` and move on.
- Not relaxed: no `--no-verify`, no force-push, no `claude/*` branches, a regression test for every
  fix (seen failing first), no game rules in `src/game/`, and honest check status.
- If a step blocks for more than about 20 minutes, log it as a known issue with what was tried, choose the
  simplest workaround, and continue.
