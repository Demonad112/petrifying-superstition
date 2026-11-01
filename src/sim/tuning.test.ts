import { describe, expect, it } from 'vitest';
import {
  byRarity, createState, DEFAULT_TUNING, hashState, makeTuning, replay, runAutopilot, step, type CommandLog, type SimState,
} from './index';

const LOG: CommandLog = [{ t: 'move', dx: 1, dy: 0 }, { t: 'wait' }, { t: 'attack', dir: 0 }, { t: 'move', dx: 1, dy: 1 }];

describe('tuning', () => {
  it('tuning defaults all integers', () => {
    for (const [k, v] of Object.entries(DEFAULT_TUNING)) expect(Number.isInteger(v), k).toBe(true);
  });

  it('tuning default spawn weights sum to 100 so the spawn roll is a percent', () => {
    expect(DEFAULT_TUNING.rarityWeight0 + DEFAULT_TUNING.rarityWeight1 + DEFAULT_TUNING.rarityWeight2).toBe(100);
  });

  it('makeTuning with no overrides equals the defaults', () => {
    expect(makeTuning()).toEqual(DEFAULT_TUNING);
  });

  it('makeTuning with an unknown key throws', () => {
    expect(() => makeTuning({ enemySpeed: 20 })).toThrow(/unknown tuning key: enemySpeed/);
  });

  it('makeTuning with a fractional value throws', () => {
    expect(() => makeTuning({ playerSpeed: 32.5 })).toThrow(/must be an integer/);
  });

  it('makeTuning override leaves the defaults untouched', () => {
    const t = makeTuning({ enemyCount: 3 });
    expect(t.enemyCount).toBe(3);
    expect(DEFAULT_TUNING.enemyCount).toBe(12);
  });

  it('byRarity out-of-range rarity clamps to normal or rare', () => {
    expect(byRarity(DEFAULT_TUNING, 'enemyHp', -1)).toBe(DEFAULT_TUNING.enemyHp0);
    expect(byRarity(DEFAULT_TUNING, 'enemyHp', 1)).toBe(DEFAULT_TUNING.enemyHp1);
    expect(byRarity(DEFAULT_TUNING, 'enemyHp', 7)).toBe(DEFAULT_TUNING.enemyHp2);
  });
});

describe('tuning reaches the sim', () => {
  it('replay with explicit default tuning matches the implicit default hash', () => {
    expect(hashState(replay(1337, LOG, makeTuning()))).toBe(hashState(replay(1337, LOG)));
  });

  it('createState enemyCount override spawns that many enemies', () => {
    expect(createState(1, makeTuning({ enemyCount: 3 })).ex).toHaveLength(3);
  });

  it('createState playerHp override sets hp and maxHp', () => {
    const s = createState(1, makeTuning({ playerHp: 7 }));
    expect([s.hp, s.maxHp]).toEqual([7, 7]);
  });

  it('createState with only the rare weight set spawns only rares with rare hp', () => {
    const s = createState(9, makeTuning({ rarityWeight0: 0, rarityWeight1: 0, rarityWeight2: 1 }));
    expect(new Set(s.erar)).toEqual(new Set([2]));
    expect(new Set(s.ehp)).toEqual(new Set([DEFAULT_TUNING.enemyHp2]));
  });

  it('step attackCd override sets the cooldown after an attack', () => {
    const t = makeTuning({ attackCd: 33 });
    // The tick decrements cd before the attack sets it, so the full value is visible after the step.
    expect(step(createState(1, t), { t: 'attack', dir: 0 }, t).cd).toBe(33);
  });

  it('step playerSpeed override moves the player that many units per tick', () => {
    const t = makeTuning({ playerSpeed: 48 });
    const s0: SimState = { ...createState(1, t), ex: [], ey: [], ehp: [], erar: [] };
    expect(step(s0, { t: 'move', dx: 1, dy: 0 }, t).px - s0.px).toBe(48);
  });

  it('autopilot enemyCount override clears the demo seed with a different hash', () => {
    const t = makeTuning({ enemyCount: 4 });
    const base = runAutopilot(createState(5), 5000, step);
    const tuned = runAutopilot(createState(5, t), 5000, (s, c) => step(s, c, t));
    expect(tuned.final.status).toBe('cleared');
    expect(hashState(tuned.final)).not.toBe(hashState(base.final));
  });
});
