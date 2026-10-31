import { describe, expect, it } from 'vitest';
import { advanceClock, MAX_STEPS_PER_FRAME, TICK_MS } from './clock';

describe('fixed-timestep clock', () => {
  it('runs one tick per TICK_MS and carries the remainder', () => {
    const r = advanceClock(0, TICK_MS * 2.5);
    expect(r.steps).toBe(2);
    expect(r.accMs).toBeCloseTo(TICK_MS * 0.5);
  });

  it('accumulates short frames into whole ticks', () => {
    let acc = 0;
    let steps = 0;
    for (let i = 0; i < 120; i++) {
      const r = advanceClock(acc, TICK_MS / 2);
      acc = r.accMs;
      steps += r.steps;
    }
    expect(steps).toBe(60);
  });

  it('caps catch-up after a stall and drops the backlog', () => {
    expect(advanceClock(0, 10_000)).toEqual({ steps: MAX_STEPS_PER_FRAME, accMs: 0 });
  });

  it('ignores negative deltas', () => {
    expect(advanceClock(3, -50)).toEqual({ steps: 0, accMs: 3 });
  });
});
