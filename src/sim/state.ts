import { randomInt } from './rng';
import { ANGLES, cos64, sin64 } from './trig';
import { byRarity, DEFAULT_TUNING, type Tuning } from './tuning';

export const WORLD_W = 960;
export const WORLD_H = 540;

// Positions are integer fixed point: 1 px = FP units.
export const FP = 16;
export const TILE = 30; // px; the arena is 32x18 tiles with a one-tile wall border
export const MIN_X = 40 * FP;
export const MAX_X = (WORLD_W - 40) * FP;
export const MIN_Y = 40 * FP;
export const MAX_Y = (WORLD_H - 40) * FP;
export const EXIT_X = (WORLD_W / 2) * FP;
export const EXIT_Y = 50 * FP;
export const CENTER_X = (WORLD_W / 2) * FP;
export const CENTER_Y = (WORLD_H / 2) * FP;

// Flat, JSON-serializable. No classes, no references, no functions. Entity lists are parallel arrays.
export interface SimState {
  seed: number;
  rng: number;
  tick: number;
  status: 'playing' | 'cleared' | 'dead';
  tier: number;
  // player
  px: number;
  py: number;
  hp: number;
  maxHp: number;
  cd: number; // attack cooldown, ticks
  inv: number; // damage invulnerability, ticks
  face: number; // last attack/move direction, 0..3
  // modifiers picked up (integers)
  mDmg: number;
  mHaste: number;
  mSwift: number;
  mVigor: number;
  // enemies
  ex: number[];
  ey: number[];
  ehp: number[];
  erar: number[]; // 0 normal, 1 magic, 2 rare
  // drops: one modifier each
  dx: number[];
  dy: number[];
  drar: number[]; // 0 normal, 1 magic, 2 rare, 3 unique
  dkind: number[]; // 0 dmg, 1 haste, 2 swift, 3 vigor
  dval: number[];
  // counters
  kills: number[]; // per enemy rarity
  picked: number;
  exitOpen: boolean;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function createState(seed: number, t: Tuning = DEFAULT_TUNING): SimState {
  let rng = seed >>> 0;
  const w0 = byRarity(t, 'rarityWeight', 0);
  const w1 = byRarity(t, 'rarityWeight', 1);
  const wTotal = w0 + w1 + byRarity(t, 'rarityWeight', 2);
  const ex: number[] = [];
  const ey: number[] = [];
  const ehp: number[] = [];
  const erar: number[] = [];
  for (let i = 0; i < t.enemyCount; i++) {
    let r: number;
    let a: number;
    let d: number;
    [r, rng] = randomInt(rng, wTotal);
    [a, rng] = randomInt(rng, ANGLES);
    [d, rng] = randomInt(rng, t.spawnRadiusBands);
    const rar = r < w0 ? 0 : r < w0 + w1 ? 1 : 2;
    const radius = t.spawnRadiusMin + d * t.spawnRadiusStep;
    ex.push(clamp(CENTER_X + ((cos64(a) * radius) >> 12), MIN_X, MAX_X));
    ey.push(clamp(CENTER_Y + ((sin64(a) * radius) >> 12), MIN_Y, MAX_Y));
    ehp.push(byRarity(t, 'enemyHp', rar));
    erar.push(rar);
  }
  return {
    seed,
    rng,
    tick: 0,
    status: 'playing',
    tier: 1,
    px: t.playerStartX,
    py: t.playerStartY,
    hp: t.playerHp,
    maxHp: t.playerHp,
    cd: 0,
    inv: 0,
    face: 0,
    mDmg: 0,
    mHaste: 0,
    mSwift: 0,
    mVigor: 0,
    ex,
    ey,
    ehp,
    erar,
    dx: [],
    dy: [],
    drar: [],
    dkind: [],
    dval: [],
    kills: [0, 0, 0],
    picked: 0,
    exitOpen: false,
  };
}
