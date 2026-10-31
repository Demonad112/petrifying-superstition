// Fixed-timestep scheduler. The view feeds it frame deltas and runs the returned number of ticks.
// Wall time only decides when ticks run, never what they contain, so replays stay deterministic.
export const TICK_HZ = 60;
export const TICK_MS = 1000 / TICK_HZ;
// Caps catch-up after a stall (background tab, breakpoint) so the sim never spirals.
export const MAX_STEPS_PER_FRAME = 5;

export function advanceClock(
  accMs: number,
  deltaMs: number,
  maxSteps = MAX_STEPS_PER_FRAME,
): { steps: number; accMs: number } {
  const acc = accMs + Math.max(0, deltaMs);
  const steps = Math.floor(acc / TICK_MS);
  if (steps > maxSteps) return { steps: maxSteps, accMs: 0 };
  return { steps, accMs: acc - steps * TICK_MS };
}
