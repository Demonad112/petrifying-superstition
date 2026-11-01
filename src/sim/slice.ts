import { makeTuning } from './tuning';

// The demo slice is the existing sim run with these overrides: one magic gorgon that always drops one
// modifier of value 2. No rule changes; every step/createState/autopilot call must pass SLICE_TUNING.
export const SLICE_OVERRIDES = {
  enemyCount: 1,
  rarityWeight0: 0,
  rarityWeight1: 1,
  rarityWeight2: 0,
  dropChance1: 100,
  enemySpeed1: 10,
  enemyHp1: 4,
  exitRadius: 0, // the exit opens on the kill; a radius of 0 keeps the sim from freezing on 'cleared' before the rune is taken
} as const satisfies Record<string, number>;

export const SLICE_TUNING = makeTuning(SLICE_OVERRIDES);

// First seed in 1..50 whose drop is kind 0 (damage), so the default run shows a damage increase.
export const SLICE_SEED = 4;
