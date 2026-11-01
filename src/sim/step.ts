import type { Command, CommandLog, Dir } from './commands';
import { randomInt } from './rng';
import { clamp, createState, EXIT_X, EXIT_Y, MAX_X, MAX_Y, MIN_X, MIN_Y, type SimState } from './state';
import { isqrt } from './trig';
import { byRarity, DEFAULT_TUNING, type Tuning } from './tuning';

const PERCENT = 100;
const UNIQUE_RARITY = 3; // drar code, see SimState
const MOD_KINDS = 4; // dmg, haste, swift, vigor: structural, matches SimState.dkind
const DIRS: readonly (readonly [number, number])[] = [[1, 0], [0, 1], [-1, 0], [0, -1]];

// Pure: returns a new state, never mutates the input.
export function step(prev: SimState, cmd: Command, t: Tuning = DEFAULT_TUNING): SimState {
  const s: SimState = structuredClone(prev);
  if (s.status !== 'playing') return s;
  s.tick++;
  if (s.cd > 0) s.cd--;
  if (s.inv > 0) s.inv--;

  if (cmd.t === 'move') move(s, cmd.dx, cmd.dy, t);
  else if (cmd.t === 'attack') attack(s, cmd.dir, t);

  moveEnemies(s, t);
  contactDamage(s, t);
  pickUp(s, t);

  if (s.hp <= 0) s.status = 'dead';
  else if (s.exitOpen && near(s.px, s.py, EXIT_X, EXIT_Y, t.exitRadius)) {
    s.status = 'cleared';
    s.tier++;
  }
  return s;
}

export function replay(seed: number, log: CommandLog, t: Tuning = DEFAULT_TUNING): SimState {
  return log.reduce((s, cmd) => step(s, cmd, t), createState(seed, t));
}

const near = (ax: number, ay: number, bx: number, by: number, r: number): boolean => {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy <= r * r;
};

function move(s: SimState, dx: number, dy: number, t: Tuning): void {
  if (dx === 0 && dy === 0) return;
  const speed = t.playerSpeed + s.mSwift * t.swiftUnit;
  // Diagonals use 181/256 (~0.707) so they are not faster than straight moves.
  const v = dx !== 0 && dy !== 0 ? (speed * 181) >> 8 : speed;
  s.px = clamp(s.px + dx * v, MIN_X, MAX_X);
  s.py = clamp(s.py + dy * v, MIN_Y, MAX_Y);
  s.face = Math.abs(dx) >= Math.abs(dy) && dx !== 0 ? (dx > 0 ? 0 : 2) : dy > 0 ? 1 : 3;
}

function attack(s: SimState, dir: Dir, t: Tuning): void {
  s.face = dir;
  if (s.cd > 0) return;
  s.cd = Math.max(t.attackCdMin, t.attackCd - s.mHaste);
  const [ux, uy] = DIRS[dir] ?? [1, 0];
  const dmg = t.baseDamage + s.mDmg;
  // 90 degree cone: the target is ahead of the player and no further sideways than it is forward.
  for (let i = 0; i < s.ex.length; i++) {
    const rx = (s.ex[i] ?? 0) - s.px;
    const ry = (s.ey[i] ?? 0) - s.py;
    const along = rx * ux + ry * uy;
    const side = Math.abs(rx * uy - ry * ux);
    if (along <= 0 || side > along || rx * rx + ry * ry > t.attackRange * t.attackRange) continue;
    s.ehp[i] = (s.ehp[i] ?? 0) - dmg;
    s.ex[i] = clamp((s.ex[i] ?? 0) + ux * t.knockback, MIN_X, MAX_X);
    s.ey[i] = clamp((s.ey[i] ?? 0) + uy * t.knockback, MIN_Y, MAX_Y);
  }
  // Resolve deaths after all hits, in index order, so RNG draws are deterministic.
  for (let i = 0; i < s.ex.length; ) {
    if ((s.ehp[i] ?? 1) > 0) {
      i++;
      continue;
    }
    killEnemy(s, i, t);
  }
  if (s.ex.length === 0) s.exitOpen = true;
}

function killEnemy(s: SimState, i: number, t: Tuning): void {
  const rar = s.erar[i] ?? 0;
  const x = s.ex[i] ?? 0;
  const y = s.ey[i] ?? 0;
  for (const list of [s.ex, s.ey, s.ehp, s.erar]) list.splice(i, 1);
  s.kills[rar] = (s.kills[rar] ?? 0) + 1;

  let roll: number;
  [roll, s.rng] = randomInt(s.rng, PERCENT);
  if (roll >= byRarity(t, 'dropChance', rar)) return;
  const count = byRarity(t, 'dropCount', rar);
  for (let n = 0; n < count; n++) {
    let unique = false;
    if (rar === 2 && n === 0) {
      [roll, s.rng] = randomInt(s.rng, PERCENT);
      unique = roll < t.uniqueChance;
    }
    let kind: number;
    [kind, s.rng] = randomInt(s.rng, MOD_KINDS);
    // Unique is fixed: a big damage modifier. Otherwise magnitude scales with rarity (1 normal, 2 magic, 3 rare).
    s.dx.push(clamp(x + n * t.dropSpread, MIN_X, MAX_X));
    s.dy.push(y);
    s.drar.push(unique ? UNIQUE_RARITY : rar);
    s.dkind.push(unique ? 0 : kind);
    s.dval.push(unique ? t.uniqueValue : rar + 1);
  }
}

function moveEnemies(s: SimState, t: Tuning): void {
  for (let i = 0; i < s.ex.length; i++) {
    const rx = s.px - (s.ex[i] ?? 0);
    const ry = s.py - (s.ey[i] ?? 0);
    const d = isqrt(rx * rx + ry * ry);
    if (d > t.aggroRadius || d <= t.contactRadius / 2) continue;
    const v = byRarity(t, 'enemySpeed', s.erar[i] ?? 0);
    s.ex[i] = clamp((s.ex[i] ?? 0) + Math.trunc((rx * v) / d), MIN_X, MAX_X);
    s.ey[i] = clamp((s.ey[i] ?? 0) + Math.trunc((ry * v) / d), MIN_Y, MAX_Y);
  }
}

function contactDamage(s: SimState, t: Tuning): void {
  if (s.inv > 0) return;
  for (let i = 0; i < s.ex.length; i++) {
    if (!near(s.px, s.py, s.ex[i] ?? 0, s.ey[i] ?? 0, t.contactRadius)) continue;
    s.hp -= byRarity(t, 'enemyDmg', s.erar[i] ?? 0);
    s.inv = t.iframes;
    return;
  }
}

function pickUp(s: SimState, t: Tuning): void {
  for (let i = 0; i < s.dx.length; ) {
    if (!near(s.px, s.py, s.dx[i] ?? 0, s.dy[i] ?? 0, t.pickupRadius)) {
      i++;
      continue;
    }
    const v = s.dval[i] ?? 1;
    switch (s.dkind[i]) {
      case 0: s.mDmg += (v + 1) >> 1; break;
      case 1: s.mHaste += v; break;
      case 2: s.mSwift += v; break;
      default:
        s.maxHp += v * t.vigorHpPerPoint;
        s.hp = Math.min(s.maxHp, s.hp + v * t.vigorHpPerPoint);
    }
    for (const list of [s.dx, s.dy, s.drar, s.dkind, s.dval]) list.splice(i, 1);
    s.picked++;
  }
}
