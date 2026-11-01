import type { Command, CommandLog, Dir } from './commands';
import { randomInt } from './rng';
import { clamp, createState, EXIT_X, EXIT_Y, FP, MAX_X, MAX_Y, MIN_X, MIN_Y, type SimState } from './state';
import { isqrt } from './trig';

// Tunables, in sim units (1 px = FP). Changing any of these changes the replay hash on purpose.
export const PLAYER_SPEED = 2 * FP; // per tick
export const SWIFT_UNIT = 3; // extra speed units per swift point
export const ATTACK_RANGE = 44 * FP;
export const ATTACK_CD = 20;
export const CD_MIN = 8;
export const KNOCKBACK = 16 * FP;
export const ENEMY_SPEED = [13, 17, 21] as const; // per tick, by rarity
export const ENEMY_DMG = [1, 1, 2] as const;
export const AGGRO = 230 * FP;
export const CONTACT = 20 * FP;
export const IFRAMES = 30;
export const PICKUP = 22 * FP;
export const EXIT_RADIUS = 24 * FP;
// Drop chance (percent) by killer rarity, and how many modifiers a drop makes.
export const DROP_CHANCE = [12, 60, 100] as const;
export const DROP_COUNT = [1, 1, 2] as const;
export const UNIQUE_CHANCE = 25; // percent, rare kills only: the first modifier becomes the fixed unique

const DIRS: readonly (readonly [number, number])[] = [[1, 0], [0, 1], [-1, 0], [0, -1]];

// Pure: returns a new state, never mutates the input.
export function step(prev: SimState, cmd: Command): SimState {
  const s: SimState = structuredClone(prev);
  if (s.status !== 'playing') return s;
  s.tick++;
  if (s.cd > 0) s.cd--;
  if (s.inv > 0) s.inv--;

  if (cmd.t === 'move') move(s, cmd.dx, cmd.dy);
  else if (cmd.t === 'attack') attack(s, cmd.dir);

  moveEnemies(s);
  contactDamage(s);
  pickUp(s);

  if (s.hp <= 0) s.status = 'dead';
  else if (s.exitOpen && near(s.px, s.py, EXIT_X, EXIT_Y, EXIT_RADIUS)) {
    s.status = 'cleared';
    s.tier++;
  }
  return s;
}

export function replay(seed: number, log: CommandLog): SimState {
  return log.reduce(step, createState(seed));
}

const near = (ax: number, ay: number, bx: number, by: number, r: number): boolean => {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy <= r * r;
};

function move(s: SimState, dx: number, dy: number): void {
  if (dx === 0 && dy === 0) return;
  const speed = PLAYER_SPEED + s.mSwift * SWIFT_UNIT;
  // Diagonals use 181/256 (~0.707) so they are not faster than straight moves.
  const v = dx !== 0 && dy !== 0 ? (speed * 181) >> 8 : speed;
  s.px = clamp(s.px + dx * v, MIN_X, MAX_X);
  s.py = clamp(s.py + dy * v, MIN_Y, MAX_Y);
  s.face = Math.abs(dx) >= Math.abs(dy) && dx !== 0 ? (dx > 0 ? 0 : 2) : dy > 0 ? 1 : 3;
}

function attack(s: SimState, dir: Dir): void {
  s.face = dir;
  if (s.cd > 0) return;
  s.cd = Math.max(CD_MIN, ATTACK_CD - s.mHaste);
  const [ux, uy] = DIRS[dir] ?? [1, 0];
  const dmg = 1 + s.mDmg;
  // 90 degree cone: the target is ahead of the player and no further sideways than it is forward.
  for (let i = 0; i < s.ex.length; i++) {
    const rx = (s.ex[i] ?? 0) - s.px;
    const ry = (s.ey[i] ?? 0) - s.py;
    const along = rx * ux + ry * uy;
    const side = Math.abs(rx * uy - ry * ux);
    if (along <= 0 || side > along || rx * rx + ry * ry > ATTACK_RANGE * ATTACK_RANGE) continue;
    s.ehp[i] = (s.ehp[i] ?? 0) - dmg;
    s.ex[i] = clamp((s.ex[i] ?? 0) + ux * KNOCKBACK, MIN_X, MAX_X);
    s.ey[i] = clamp((s.ey[i] ?? 0) + uy * KNOCKBACK, MIN_Y, MAX_Y);
  }
  // Resolve deaths after all hits, in index order, so RNG draws are deterministic.
  for (let i = 0; i < s.ex.length; ) {
    if ((s.ehp[i] ?? 1) > 0) {
      i++;
      continue;
    }
    killEnemy(s, i);
  }
  if (s.ex.length === 0) s.exitOpen = true;
}

function killEnemy(s: SimState, i: number): void {
  const rar = s.erar[i] ?? 0;
  const x = s.ex[i] ?? 0;
  const y = s.ey[i] ?? 0;
  for (const list of [s.ex, s.ey, s.ehp, s.erar]) list.splice(i, 1);
  s.kills[rar] = (s.kills[rar] ?? 0) + 1;

  let roll: number;
  [roll, s.rng] = randomInt(s.rng, 100);
  if (roll >= (DROP_CHANCE[rar] ?? 0)) return;
  const count = DROP_COUNT[rar] ?? 1;
  for (let n = 0; n < count; n++) {
    let unique = false;
    if (rar === 2 && n === 0) {
      [roll, s.rng] = randomInt(s.rng, 100);
      unique = roll < UNIQUE_CHANCE;
    }
    let kind: number;
    [kind, s.rng] = randomInt(s.rng, 4);
    // Unique is fixed: a big damage modifier. Otherwise magnitude scales with rarity (1 normal, 2 magic, 3 rare).
    s.dx.push(clamp(x + (n === 0 ? 0 : 12 * FP), MIN_X, MAX_X));
    s.dy.push(y);
    s.drar.push(unique ? 3 : rar);
    s.dkind.push(unique ? 0 : kind);
    s.dval.push(unique ? 5 : rar + 1);
  }
}

function moveEnemies(s: SimState): void {
  for (let i = 0; i < s.ex.length; i++) {
    const rx = s.px - (s.ex[i] ?? 0);
    const ry = s.py - (s.ey[i] ?? 0);
    const d = isqrt(rx * rx + ry * ry);
    if (d > AGGRO || d <= CONTACT / 2) continue;
    const v = ENEMY_SPEED[s.erar[i] ?? 0] ?? 13;
    s.ex[i] = clamp((s.ex[i] ?? 0) + Math.trunc((rx * v) / d), MIN_X, MAX_X);
    s.ey[i] = clamp((s.ey[i] ?? 0) + Math.trunc((ry * v) / d), MIN_Y, MAX_Y);
  }
}

function contactDamage(s: SimState): void {
  if (s.inv > 0) return;
  for (let i = 0; i < s.ex.length; i++) {
    if (!near(s.px, s.py, s.ex[i] ?? 0, s.ey[i] ?? 0, CONTACT)) continue;
    s.hp -= ENEMY_DMG[s.erar[i] ?? 0] ?? 1;
    s.inv = IFRAMES;
    return;
  }
}

function pickUp(s: SimState): void {
  for (let i = 0; i < s.dx.length; ) {
    if (!near(s.px, s.py, s.dx[i] ?? 0, s.dy[i] ?? 0, PICKUP)) {
      i++;
      continue;
    }
    const v = s.dval[i] ?? 1;
    switch (s.dkind[i]) {
      case 0: s.mDmg += (v + 1) >> 1; break;
      case 1: s.mHaste += v; break;
      case 2: s.mSwift += v; break;
      default:
        s.maxHp += v * 2;
        s.hp = Math.min(s.maxHp, s.hp + v * 2);
    }
    for (const list of [s.dx, s.dy, s.drar, s.dkind, s.dval]) list.splice(i, 1);
    s.picked++;
  }
}
