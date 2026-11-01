// Every gameplay number the sim reads. Flat and integer-only so a balance run can override any key
// with JSON, and so fixed point stays exact. Distances and speeds are sim units (1 px = 16 units, see FP).
// Per-rarity values use the suffix 0 normal, 1 magic, 2 rare.
// Changing any default changes the replay hashes on purpose: re-record fixtures and say why.
export const DEFAULT_TUNING = {
  // player
  playerHp: 20,
  playerStartX: 1440, // 90 px
  playerStartY: 4320, // 270 px
  playerSpeed: 32, // per tick (2 px)
  swiftUnit: 3, // extra speed per swift point
  baseDamage: 1,
  attackRange: 704, // 44 px
  attackCd: 20, // ticks
  attackCdMin: 8, // ticks, floor after haste
  knockback: 256, // 16 px
  iframes: 30, // ticks of invulnerability after a hit
  pickupRadius: 352, // 22 px
  exitRadius: 384, // 24 px

  // enemies
  enemyCount: 12,
  spawnRadiusMin: 2400, // 150 px from the arena centre
  spawnRadiusStep: 320, // 20 px per band
  spawnRadiusBands: 5,
  rarityWeight0: 70,
  rarityWeight1: 22,
  rarityWeight2: 8,
  enemyHp0: 3,
  enemyHp1: 6,
  enemyHp2: 14,
  enemySpeed0: 13, // per tick
  enemySpeed1: 17,
  enemySpeed2: 21,
  enemyDmg0: 1,
  enemyDmg1: 1,
  enemyDmg2: 2,
  aggroRadius: 3680, // 230 px
  contactRadius: 320, // 20 px

  // drops and modifiers
  dropChance0: 12, // percent, by killer rarity
  dropChance1: 60,
  dropChance2: 100,
  dropCount0: 1, // modifiers per drop
  dropCount1: 1,
  dropCount2: 2,
  dropSpread: 192, // 12 px between the modifiers of one drop
  uniqueChance: 25, // percent, rare kills only: the first modifier becomes the unique
  uniqueValue: 5, // the unique is a fixed damage modifier of this value
  vigorHpPerPoint: 2,
} as const satisfies Record<string, number>;

export type Tuning = { readonly [K in keyof typeof DEFAULT_TUNING]: number };

export type RarityKey = 'enemyHp' | 'enemySpeed' | 'enemyDmg' | 'dropChance' | 'dropCount' | 'rarityWeight';

// Reads a per-rarity value. Rarity is always 0..2 in state; anything else is clamped into range.
export function byRarity(t: Tuning, key: RarityKey, rarity: number): number {
  const r = rarity <= 0 ? 0 : rarity >= 2 ? 2 : 1;
  return t[`${key}${r}`];
}

// Merges overrides onto the defaults and rejects unknown keys and non-integers, so a typo in a
// balance run fails loudly instead of silently testing the defaults.
export function makeTuning(overrides: Readonly<Record<string, number>> = {}): Tuning {
  const t: Record<string, number> = { ...DEFAULT_TUNING };
  for (const [k, v] of Object.entries(overrides)) {
    if (!(k in DEFAULT_TUNING)) throw new Error(`unknown tuning key: ${k}`);
    if (!Number.isInteger(v)) throw new Error(`tuning ${k} must be an integer, got ${v}`);
    t[k] = v;
  }
  return t as Tuning;
}
