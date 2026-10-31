import { describe, expect, it } from 'vitest';
import { createState, hashState, replay, step, type CommandLog } from './index';

const SEED = 1337;
const LOG: CommandLog = [
  { t: 'act' },
  { t: 'wait' },
  { t: 'act' },
];
// Golden hash: update deliberately (and note why in the commit) if sim rules change.
const EXPECTED_HASH = '3560e748';

describe('sim replay', () => {
  it('seed + 3 commands produces the expected state hash', () => {
    const s = replay(SEED, LOG);
    expect(s.tick).toBe(3);
    expect(hashState(s)).toBe(EXPECTED_HASH);
  });

  it('same seed and log twice gives an identical state', () => {
    expect(replay(SEED, LOG)).toEqual(replay(SEED, LOG));
  });

  it('state survives a JSON round-trip', () => {
    const s = replay(SEED, LOG);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('act draws from the seeded RNG and advances its state', () => {
    const s = step(createState(SEED), { t: 'act' });
    expect(s.roll).toBeGreaterThanOrEqual(1);
    expect(s.roll).toBeLessThanOrEqual(6);
    expect(s.rng).not.toBe(SEED);
  });

  it('step does not mutate its input', () => {
    const s = createState(SEED);
    const before = hashState(s);
    step(s, { t: 'act' });
    expect(hashState(s)).toBe(before);
  });
});
