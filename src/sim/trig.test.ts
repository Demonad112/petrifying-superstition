import { describe, expect, it } from 'vitest';
import { ANGLES, cos64, isqrt, Q, sin64, SIN64 } from './trig';

describe('integer trig', () => {
  it('has 64 entries and is exact at the quadrant points', () => {
    expect(SIN64).toHaveLength(ANGLES);
    expect([sin64(0), sin64(16), sin64(32), sin64(48)]).toEqual([0, Q, 0, -Q]);
    expect([cos64(0), cos64(16), cos64(32), cos64(48)]).toEqual([Q, 0, -Q, 0]);
  });

  it('is odd-symmetric and close to the unit circle', () => {
    for (let a = 0; a < ANGLES; a++) {
      expect(sin64(a + 32) + sin64(a)).toBe(0);
      const r = Math.hypot(sin64(a), cos64(a));
      expect(Math.abs(r - Q)).toBeLessThan(2);
    }
  });

  it('wraps angles', () => {
    expect(sin64(5 + ANGLES)).toBe(sin64(5));
    expect(sin64(-1)).toBe(sin64(63));
  });

  it('isqrt is the exact integer floor square root', () => {
    for (const n of [0, 1, 2, 3, 4, 15, 16, 17, 99, 100, 1e6 - 1, 1e6, 123456789012]) {
      const r = isqrt(n);
      expect(r * r).toBeLessThanOrEqual(n);
      expect((r + 1) * (r + 1)).toBeGreaterThan(n);
    }
  });
});
