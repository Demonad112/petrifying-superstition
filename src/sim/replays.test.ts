import { describe, expect, it } from 'vitest';
import { replay } from './step';
import { hashState } from './hash';
import { checkReplay, decodeLog, encodeReplay, type ReplayFile } from './replay';
import type { CommandLog } from './commands';

// Every replay exported with F8 and dropped into tests/replays/ becomes a regression test.
const FIXTURES = import.meta.glob<ReplayFile>('../../tests/replays/*.json', { eager: true, import: 'default' });

describe('replay format', () => {
  const log: CommandLog = [{ t: 'wait' }, { t: 'wait' }, { t: 'act' }, { t: 'wait' }];

  it('run-length encodes repeated commands', () => {
    expect(encodeReplay(7, log).runs).toEqual([[{ t: 'wait' }, 2], [{ t: 'act' }, 1], [{ t: 'wait' }, 1]]);
  });

  it('decodes back to the original log and verifies', () => {
    const file = encodeReplay(7, log);
    expect(decodeLog(file.runs)).toEqual(log);
    expect(checkReplay(JSON.parse(JSON.stringify(file)))).toEqual({ ok: true, hash: hashState(replay(7, log)), ticks: 4 });
  });

  it('flags a tampered replay', () => {
    const file = encodeReplay(7, log);
    expect(checkReplay({ ...file, seed: 8 }).ok).toBe(false);
  });
});

describe('replay fixtures (tests/replays)', () => {
  it('has at least one fixture', () => {
    expect(Object.keys(FIXTURES).length).toBeGreaterThan(0);
  });

  for (const [path, file] of Object.entries(FIXTURES)) {
    it(path.replace('../../tests/replays/', ''), () => {
      const r = checkReplay(file);
      // A deliberate rule change: update this fixture's hash and ticks, and say why in the commit.
      expect(r.hash, 'hash').toBe(file.hash);
      expect(r.ticks, 'ticks').toBe(file.ticks);
    });
  }
});
