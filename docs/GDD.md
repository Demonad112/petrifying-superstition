# Game Design Document

> **Pipeline demo, not the game.** The current build is a throwaway slice that proves every layer of the stack.
> Theme: _TBD (announced Nov 1, 14:37 MST)_ · Working title: _Petrifying Superstition_ · Last updated: 2026-11-01

## One-line pitch

_Pre-theme direction (to be fitted to the theme):_ a top-down pixel-art action roguelite. Each run is one map with a tier; clearing it raises the tier.
There is no shop or skill tree: all upgrades are modifiers rolled by the seeded RNG and dropped by rarer, stronger enemies.
Dark, late-90s pixel look, built from code-defined sprites in a fixed 16-colour palette.

## Theme interpretation

## Core loop
1. Enter a map of the current tier: a walled room with enemies of three rarities.
2. Kill them. Rarer enemies are tougher and drop modifiers (stat nudges), which are picked up on contact.
3. The last kill opens the exit. Walk in: the tier rises. (Pipeline slice: one tier-1 map, theme-neutral.)

## Player verbs (keyboard / mouse)
| Input | Verb |
| --- | --- |
| WASD | Move (8 directions, diagonals normalised) |
| Arrow keys | Attack in that direction (90-degree melee cone) |
| Space | Attack the way you face |
| Click | Attack toward the pointer |
| P / M / F / Esc / F8 | Pause / mute / reduced FX / end run / save replay |

## Win / lose conditions
- Win: clear all enemies, then reach the exit (`status='cleared'`, tier + 1).
- Lose: hp reaches 0 (`status='dead'`).

## Systems (sim, src/sim/)
| System | State fields | Commands | Notes |
| --- | --- | --- | --- |
| Movement | `px py face` | `move` | Integer fixed point (16/px), wall clamp |
| Combat | `cd inv hp ex ey ehp erar` | `attack` | Cone hit, knockback, cooldown reduced by haste; enemy contact damage with i-frames |
| Rarity and drops | `drar dkind dval kills picked` | none | Spawn weights, drop tables and every other number in `tuning.ts`; all RNG via `rng.ts` |
| Modifiers | `mDmg mHaste mSwift mVigor` | none | Flat stat nudges; magnitude scales with rarity |
| Map run | `tier exitOpen status` | none | Clear, exit, tier up |
| Trig | none | none | `trig.ts`: 64-angle Q12 sine table, `isqrt` |

## Presentation (view, src/game/)
- Palette: 16 fixed colours; enemy outline, gem and burst colours are the rarity colours.
- FX: slash on attack, burst per kill (bigger with rarity), flash and shake on rare kills and damage, hit-stop on kills.
- Audio (ZzFX): swing, kill, pickup, hurt, clear.

## Scope
- **Must** (week 1-2):
- **Should** (week 3):
- **Could** (week 4, only if ahead):
- **Won't**:

## Milestones
| Date | Milestone | Done |
| --- | --- | --- |
| Nov 7 | Core loop playable | |
| Nov 14 | Content + juice pass | |
| Nov 21 | Feature freeze | |
| Nov 28 | Polish, itch page, submit | |

## Open questions
