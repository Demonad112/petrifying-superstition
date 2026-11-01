import { advanceClock, MAX_STEPS_PER_FRAME, type Command } from '../sim';

// Phaser-free frame driver. Play calls runFrame once per update; tests drive it with synthetic frame deltas.
// Wall time (delta, pause, hit-stop) only decides how many ticks run this frame, never what they contain,
// so any frame-rate, pause or hit-stop pattern produces the same command log and final state.

export type TickMode = 'realtime' | 'turn';

export interface FrameIO {
  readonly mode: TickMode;
  readonly paused: boolean;
  // Spends wall time from the hit-stop budget. Returns true while frozen (DECISIONS #17).
  tickHitStop(deltaMs: number): boolean;
  // The command for the next tick. Live realtime returns queued input or 'wait'; turn mode returns input or null;
  // a replay source returns the next logged command or null once the log is spent. null means "do not step".
  next(): Command | null;
  // Drops input queued while paused (DECISIONS #16).
  clearInput(): void;
  // Steps the sim and logs the command. May start a hit-stop.
  apply(cmd: Command): void;
}

// Catch-up cap for a ?speed=N run: the wall delta is multiplied by N, so the cap scales with it (view-only).
export function catchUpCap(speed: number): number {
  return Math.max(MAX_STEPS_PER_FRAME, Math.ceil(MAX_STEPS_PER_FRAME * speed));
}

// Returns the new clock accumulator.
export function runFrame(accMs: number, deltaMs: number, io: FrameIO, maxSteps = MAX_STEPS_PER_FRAME): number {
  if (io.paused) {
    // No ticks and no clock advance, so resuming never catches up.
    io.clearInput();
    return accMs;
  }
  // Hit-stop: no clock advance and no step for a few wall ms. Queued input is kept (only delayed).
  if (io.tickHitStop(deltaMs)) return accMs;
  if (io.mode === 'turn') {
    const cmd = io.next();
    if (cmd) io.apply(cmd);
    return accMs;
  }
  const { steps, accMs: acc } = advanceClock(accMs, deltaMs, maxSteps);
  for (let i = 0; i < steps; i++) {
    const cmd = io.next();
    if (!cmd) break;
    io.apply(cmd);
    // A hit landed: drop this frame's remaining ticks instead of replaying them later.
    if (io.tickHitStop(0)) break;
  }
  return acc;
}

export interface FrameStats {
  frames: number;
  p50: number;
  p95: number;
  max: number;
}

// Frame-time summary in ms, for the ?perf probe. Empty input gives zeros.
export function frameStats(deltas: readonly number[]): FrameStats {
  if (deltas.length === 0) return { frames: 0, p50: 0, p95: 0, max: 0 };
  const s = [...deltas].sort((a, b) => a - b);
  const at = (q: number) => s[Math.min(s.length - 1, Math.floor(q * s.length))] ?? 0;
  const r = (v: number) => Math.round(v * 10) / 10;
  return { frames: s.length, p50: r(at(0.5)), p95: r(at(0.95)), max: r(s[s.length - 1] ?? 0) };
}
