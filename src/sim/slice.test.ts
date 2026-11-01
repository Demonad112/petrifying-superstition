import { describe, expect, it } from 'vitest';
import { autopilot, createState, DEFAULT_TUNING, EXIT_X, EXIT_Y, FP, step, type SimState } from './index';
import { SLICE_SEED, SLICE_TUNING as T } from './slice';

// With exitRadius 0 the bot keeps walking to the exit after the pickup, so stop at the first pickup.
function run(seed: number, max = 1500): { ticks: number; final: SimState } {
  let s = createState(seed, T);
  while (s.status === 'playing' && s.picked < 1 && s.tick < max) s = step(s, autopilot(s, T), T);
  return { ticks: s.tick, final: s };
}

describe('slice', () => {
  it('createState spawns exactly one magic enemy', () => {
    const s = createState(SLICE_SEED, T);
    expect(s.ex).toHaveLength(1);
    expect(s.erar).toEqual([1]);
    expect(s.ehp).toEqual([4]);
  });

  it('kill always drops one modifier of value 2', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { final } = run(seed);
      expect(final.picked, `seed ${seed}`).toBe(1);
      expect(final.kills).toEqual([0, 1, 0]);
    }
  });

  it('kill leaves exactly one drop of value 2', () => {
    let s = createState(SLICE_SEED, T);
    while (s.ex.length > 0 && s.tick < 1500) s = step(s, autopilot(s, T), T);
    expect(s.ex).toHaveLength(0);
    expect(s.dx.length + s.picked).toBe(1);
    expect(s.dval.concat(s.picked ? [2] : [])).toEqual([2]);
  });

  it('autopilot picks up the rune within 1500 ticks', () => {
    const { ticks, final } = run(SLICE_SEED);
    expect(final.picked).toBe(1);
    expect(ticks).toBeLessThan(1500);
  });

  it('pickup raises the matching stat', () => {
    const s0 = createState(SLICE_SEED, T);
    const { final } = run(SLICE_SEED);
    const before = [s0.mDmg, s0.mHaste, s0.mSwift, s0.maxHp];
    const after = [final.mDmg, final.mHaste, final.mSwift, final.maxHp];
    const changed = after.map((v, i) => v - (before[i] ?? 0));
    expect(changed.filter((d) => d !== 0)).toHaveLength(1);
    expect(changed.every((d) => d >= 0)).toBe(true);
  });

  it('default seed drops a damage rune', () => {
    const { final } = run(SLICE_SEED);
    expect(final.mDmg).toBe(1);
    expect(T.baseDamage + final.mDmg).toBe(2);
  });

  it('exit never triggers, so the sim stays playing after the kill', () => {
    // arrange: no enemies, exit open, player standing on the exit
    const s = createState(SLICE_SEED, T);
    const cur: SimState = { ...s, ex: [], ey: [], ehp: [], erar: [], exitOpen: true, px: EXIT_X, py: EXIT_Y + FP };
    // act + assert: one pixel off the exit is inside the default radius but never triggers here
    expect(step(cur, { t: 'wait' }, DEFAULT_TUNING).status).toBe('cleared');
    expect(step(cur, { t: 'wait' }, T).status).toBe('playing');
  });
});
