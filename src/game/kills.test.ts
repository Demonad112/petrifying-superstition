import { describe, expect, it } from 'vitest';
import { createState, DEFAULT_TUNING, FP, makeTuning } from '../sim';
import { vanishedEnemies } from './kills';

describe('kills', () => {
  const t = makeTuning({ enemyCount: 2, knockback: 640 }); // 40 px knockback, more than the default 16 px
  const prev = createState(1, t);

  it('vanishedEnemies with default tuning finds the enemy that was removed', () => {
    const next = { ...prev, ex: prev.ex.slice(1), ey: prev.ey.slice(1), ehp: prev.ehp.slice(1), erar: prev.erar.slice(1) };
    expect(vanishedEnemies(prev, next, DEFAULT_TUNING)).toEqual([0]);
  });

  it('vanishedEnemies with a knockback override does not count a hit survivor as a kill', () => {
    // arrange: enemy 1 is hit and knocked back by the overridden 40 px, enemy 0 is killed
    const next = {
      ...prev,
      ex: [(prev.ex[1] ?? 0) + t.knockback],
      ey: [prev.ey[1] ?? 0],
      ehp: [1],
      erar: [prev.erar[1] ?? 0],
    };
    // act + assert: only the removed enemy (index 0) is reported
    expect(vanishedEnemies(prev, next, t)).toEqual([0]);
    expect(t.knockback).toBeGreaterThan(DEFAULT_TUNING.knockback + FP);
  });
});
