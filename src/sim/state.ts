import { randomInt } from './rng';
import { cos64, sin64 } from './trig';

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

export const ENEMY_COUNT = 12;
export const ENEMY_HP = [3, 6, 14] as const; // by rarity: normal, magic, rare

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

export function createState(seed: number): SimState {
  let rng = seed >>> 0;
  const ex: number[] = [];
  const ey: number[] = [];
  const ehp: number[] = [];
  const erar: number[] = [];
  for (let i = 0; i < ENEMY_COUNT; i++) {
    let r: number;
    let a: number;
    let d: number;
    [r, rng] = randomInt(rng, 100);
    [a, rng] = randomInt(rng, 64);
    [d, rng] = randomInt(rng, 5);
    const rar = r < 70 ? 0 : r < 92 ? 1 : 2;
    const radius = (150 + d * 20) * FP;
    ex.push(clamp(480 * FP + ((cos64(a) * radius) >> 12), MIN_X, MAX_X));
    ey.push(clamp(270 * FP + ((sin64(a) * radius) >> 12), MIN_Y, MAX_Y));
    ehp.push(ENEMY_HP[rar] ?? 3);
    erar.push(rar);
  }
  return {
    seed,
    rng,
    tick: 0,
    status: 'playing',
    tier: 1,
    px: 90 * FP,
    py: 270 * FP,
    hp: 20,
    maxHp: 20,
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
