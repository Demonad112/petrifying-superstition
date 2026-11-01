import { describe, expect, it } from 'vitest';
import { checkReplay, createState, encodeReplay, hashState, nextRandom, replay, step, type Command, type CommandLog, type SimState } from '../sim';
import { frameStats, runFrame, type FrameIO } from './loop';

// Test-only PRNG for frame timings (not the sim RNG): keeps the property test reproducible.
function timings(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    const [v, n] = nextRandom(s);
    s = n;
    return v;
  };
}

// Drives a recorded log through runFrame with hostile wall timing: random deltas, pause gaps and hit-stops.
function playBack(seed: number, log: CommandLog, timingSeed: number): { state: SimState; frames: number } {
  const rand = timings(timingSeed);
  let state = createState(seed);
  let i = 0;
  let hitStop = 0;
  let paused = false;
  let acc = 0;
  let frames = 0;
  const io: FrameIO = {
    mode: 'realtime',
    get paused() {
      return paused;
    },
    tickHitStop(d) {
      if (hitStop <= 0) return false;
      hitStop -= Math.max(0, d);
      return hitStop > 0;
    },
    next: () => log[i++] ?? null,
    clearInput: () => {},
    apply(cmd: Command) {
      state = step(state, cmd);
      if (rand() < 0.05) hitStop = 10 + rand() * 70; // up to the 80 ms budget
    },
  };
  while (i < log.length && frames < 100_000) {
    if (rand() < 0.02) paused = !paused;
    const delta = 1 + rand() * 249; // 1-250 ms, i.e. 4-1000 fps
    acc = runFrame(acc, delta, io);
    frames++;
  }
  return { state, frames };
}

function sampleLog(n: number, seed: number): CommandLog {
  const rand = timings(seed);
  return Array.from({ length: n }, (): Command => (rand() < 0.1 ? { t: 'attack', dir: 0 } : { t: 'wait' }));
}

describe('frame driver (runFrame)', () => {
  it('reaches the same final state as replay under random deltas, pauses and hit-stops', () => {
    for (let k = 0; k < 20; k++) {
      const log = sampleLog(600, 100 + k);
      const expected = hashState(replay(42 + k, log));
      const { state } = playBack(42 + k, log, 900 + k);
      expect(hashState(state), `run ${k}`).toBe(expected);
      expect(checkReplay(encodeReplay(42 + k, log, state)).ok).toBe(true);
    }
  });

  it('pause runs no ticks, keeps the accumulator and clears input', () => {
    let cleared = 0;
    let applied = 0;
    const io: FrameIO = {
      mode: 'realtime',
      paused: true,
      tickHitStop: () => false,
      next: () => ({ t: 'wait' }),
      clearInput: () => cleared++,
      apply: () => applied++,
    };
    expect(runFrame(5, 1000, io)).toBe(5);
    expect(applied).toBe(0);
    expect(cleared).toBe(1);
  });

  it('hit-stop keeps queued input and drops the rest of the frame', () => {
    let frozen = false;
    const applied: Command[] = [];
    const io: FrameIO = {
      mode: 'realtime',
      paused: false,
      tickHitStop: () => frozen,
      next: () => ({ t: 'attack', dir: 0 }),
      clearInput: () => {},
      apply: (c) => {
        applied.push(c);
        frozen = true;
      },
    };
    runFrame(0, 1000 / 60 * 4, io);
    expect(applied.length).toBe(1);
    runFrame(0, 1000 / 60 * 4, io);
    expect(applied.length).toBe(1);
  });

  it('stops stepping when the source is spent', () => {
    let applied = 0;
    const io: FrameIO = {
      mode: 'realtime',
      paused: false,
      tickHitStop: () => false,
      next: () => (applied < 2 ? { t: 'wait' } : null),
      clearInput: () => {},
      apply: () => applied++,
    };
    runFrame(0, 1000 / 60 * 5, io);
    expect(applied).toBe(2);
  });

  it('turn mode steps once per available command and ignores wall time', () => {
    let applied = 0;
    const io: FrameIO = {
      mode: 'turn',
      paused: false,
      tickHitStop: () => false,
      next: () => ({ t: 'attack', dir: 0 }),
      clearInput: () => {},
      apply: () => applied++,
    };
    expect(runFrame(3, 10_000, io)).toBe(3);
    expect(applied).toBe(1);
  });
});

describe('frameStats', () => {
  it('summarises frame deltas', () => {
    const d = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(frameStats(d)).toEqual({ frames: 100, p50: 51, p95: 96, max: 100 });
    expect(frameStats([])).toEqual({ frames: 0, p50: 0, p95: 0, max: 0 });
  });
});
