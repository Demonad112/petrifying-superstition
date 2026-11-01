import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkReplay, createState, encodeReplay, runAutopilot, step, TICK_HZ, type ReplayFile } from './index';

// The demo fixture is the autopilot's recording. Seed 5 was picked by scanning seeds 1-40: it clears the map in
// ~27 s and contains magic and rare kills plus several modifier pickups.
// Regenerate on purpose with: UPDATE_DEMO=1 npx vitest run autopilot
const DEMO_SEED = 5;
const FIXTURES = [
  { path: new URL('../../tests/replays/demo-map-seed5.json', import.meta.url), seed: DEMO_SEED, maxTicks: 4000 },
  { path: new URL('../../tests/replays/baseline-seed42.json', import.meta.url), seed: 42, maxTicks: 600 },
];

describe('autopilot', () => {
  const { log, final } = runAutopilot(createState(DEMO_SEED), 4000, step);

  it('clears the map in about 30 seconds and tiers up', () => {
    expect(final.status).toBe('cleared');
    expect(final.tier).toBe(2);
    expect(final.ex).toHaveLength(0);
    expect(log.length / TICK_HZ).toBeGreaterThan(25);
    expect(log.length / TICK_HZ).toBeLessThan(31);
  });

  it('kills a magic and a rare enemy and picks up modifiers', () => {
    expect(final.kills[1]).toBeGreaterThan(0);
    expect(final.kills[2]).toBeGreaterThan(0);
    expect(final.picked).toBeGreaterThan(0);
  });

  it('is deterministic', () => {
    expect(runAutopilot(createState(DEMO_SEED), 4000, step).log).toEqual(log);
  });

  for (const f of FIXTURES) {
    it(`${f.path.pathname.split('/').pop()} matches a fresh recording`, () => {
      const run = runAutopilot(createState(f.seed), f.maxTicks, step);
      const fresh = encodeReplay(f.seed, run.log, run.final);
      if (process.env.UPDATE_DEMO === '1') writeFileSync(f.path, JSON.stringify(fresh));
      const stored = JSON.parse(readFileSync(f.path, 'utf8')) as ReplayFile;
      expect(stored).toEqual(fresh);
      expect(checkReplay(stored).ok).toBe(true);
    });
  }
});
