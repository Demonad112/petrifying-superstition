import { describe, expect, it } from 'vitest';
import {
  ATTACK_CD, ENEMY_COUNT, EXIT_X, EXIT_Y, FP, IFRAMES, MAX_X, MIN_X, createState, hashState, replay, step, type CommandLog, type SimState,
} from './index';

const SEED = 1337;
const LOG: CommandLog = [
  { t: 'move', dx: 1, dy: 0 },
  { t: 'wait' },
  { t: 'attack', dir: 0 },
  { t: 'move', dx: 1, dy: 1 },
];
// Golden hash: update deliberately (and note why in the commit) if sim rules change.
const EXPECTED_HASH = '990565fc';

// A state with no enemies/drops that tests place by hand.
const blank = (over: Partial<SimState> = {}): SimState => ({
  ...createState(SEED),
  ex: [], ey: [], ehp: [], erar: [], dx: [], dy: [], drar: [], dkind: [], dval: [],
  ...over,
});

describe('sim replay', () => {
  it('seed + commands produces the expected state hash', () => {
    const s = replay(SEED, LOG);
    expect(s.tick).toBe(4);
    expect(hashState(s)).toBe(EXPECTED_HASH);
  });

  it('same seed and log twice gives an identical state; JSON round-trips', () => {
    expect(replay(SEED, LOG)).toEqual(replay(SEED, LOG));
    const s = replay(SEED, LOG);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('step does not mutate its input', () => {
    const s = createState(SEED);
    const before = hashState(s);
    step(s, { t: 'attack', dir: 0 });
    step(s, { t: 'move', dx: 1, dy: 0 });
    expect(hashState(s)).toBe(before);
  });
});

describe('spawn', () => {
  it('places ENEMY_COUNT enemies inside the arena, rarity in 0..2, deterministically', () => {
    const s = createState(SEED);
    expect(s.ex).toHaveLength(ENEMY_COUNT);
    expect(createState(SEED)).toEqual(s);
    for (let i = 0; i < ENEMY_COUNT; i++) {
      expect(s.ex[i]).toBeGreaterThanOrEqual(MIN_X);
      expect(s.ex[i]).toBeLessThanOrEqual(MAX_X);
      expect([0, 1, 2]).toContain(s.erar[i]);
    }
  });

  it('rarity weights: normal dominates, rare is the least common (1000 seeds)', () => {
    const n: [number, number, number] = [0, 0, 0];
    for (let seed = 1; seed <= 1000; seed++) for (const r of createState(seed).erar) n[r as 0 | 1 | 2]++;
    expect(n[0]).toBeGreaterThan(n[1]!);
    expect(n[1]).toBeGreaterThan(n[2]!);
    expect(n[2]).toBeGreaterThan(0);
  });
});

describe('player', () => {
  it('moves, clamps at the wall and slows diagonals', () => {
    const a = step(blank(), { t: 'move', dx: 1, dy: 0 });
    const d = step(blank(), { t: 'move', dx: 1, dy: 1 });
    expect(a.px).toBeGreaterThan(blank().px);
    expect(d.px - blank().px).toBeLessThan(a.px - blank().px);
    expect(step(blank({ px: MIN_X }), { t: 'move', dx: -1, dy: 0 }).px).toBe(MIN_X);
  });

  it('attack hits inside the cone, misses behind and sideways, and respects the cooldown', () => {
    const s0 = blank({ ex: [blank().px + 30 * FP, blank().px - 30 * FP, blank().px + 20 * FP], ey: [blank().py, blank().py, blank().py + 40 * FP], ehp: [5, 5, 5], erar: [0, 0, 0] });
    const s1 = step(s0, { t: 'attack', dir: 0 });
    expect(s1.ehp).toEqual([4, 5, 5]);
    expect(s1.cd).toBe(ATTACK_CD);
    expect(step(s1, { t: 'attack', dir: 0 }).ehp).toEqual([4, 5, 5]); // still cooling down
  });

  it('a kill removes the enemy, counts it, and the last kill opens the exit', () => {
    const s0 = blank({ ex: [blank().px + 30 * FP], ey: [blank().py], ehp: [1], erar: [1] });
    const s1 = step(s0, { t: 'attack', dir: 0 });
    expect(s1.ex).toHaveLength(0);
    expect(s1.kills).toEqual([0, 1, 0]);
    expect(s1.exitOpen).toBe(true);
  });

  it('a rare kill always drops, and drops are deterministic', () => {
    const s0 = blank({ ex: [blank().px + 30 * FP], ey: [blank().py], ehp: [1], erar: [2] });
    const s1 = step(s0, { t: 'attack', dir: 0 });
    expect(s1.dx.length).toBe(2);
    expect(step(s0, { t: 'attack', dir: 0 })).toEqual(s1);
    expect(s1.rng).not.toBe(s0.rng);
  });

  it('picks up a modifier on contact', () => {
    const s0 = blank();
    const s1 = step({ ...s0, dx: [s0.px], dy: [s0.py], drar: [2], dkind: [0], dval: [3] }, { t: 'wait' });
    expect(s1.mDmg).toBe(2);
    expect(s1.picked).toBe(1);
    expect(s1.dx).toHaveLength(0);
  });

  it('enemy contact hurts once per invulnerability window, and 0 hp ends the run', () => {
    const s0 = blank({ ex: [blank().px], ey: [blank().py], ehp: [3], erar: [2] });
    const s1 = step(s0, { t: 'wait' });
    expect(s1.hp).toBe(s0.hp - 2);
    expect(s1.inv).toBe(IFRAMES);
    expect(step(s1, { t: 'wait' }).hp).toBe(s1.hp);
    const dead = step({ ...s0, hp: 2 }, { t: 'wait' });
    expect(dead.status).toBe('dead');
    expect(step(dead, { t: 'move', dx: 1, dy: 0 })).toEqual(dead); // a dead run is frozen
  });

  it('reaching the open exit clears the map and raises the tier', () => {
    const s0 = blank({ exitOpen: true, px: EXIT_X, py: EXIT_Y + 4 * FP });
    const s1 = step(s0, { t: 'wait' });
    expect(s1.status).toBe('cleared');
    expect(s1.tier).toBe(2);
    expect(step(blank({ px: EXIT_X, py: EXIT_Y }), { t: 'wait' }).status).toBe('playing'); // exit still closed
  });
});
