import type { Command, Dir } from './commands';
import { ATTACK_RANGE } from './step';
import { EXIT_X, EXIT_Y, FP, type SimState } from './state';

// Pure director: reads state, returns this tick's command. No RNG and no memory, so a run is fully
// determined by the seed. Records the demo fixtures; the player never sees it.
const DEAD_ZONE = 6 * FP;
const STRIKE = ATTACK_RANGE - 4 * FP;
const BACK_OFF = 26 * FP;

const sign = (v: number): -1 | 0 | 1 => (v > 0 ? 1 : v < 0 ? -1 : 0);

function nearest(s: SimState, xs: readonly number[], ys: readonly number[]): number {
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < xs.length; i++) {
    const dx = (xs[i] ?? 0) - s.px;
    const dy = (ys[i] ?? 0) - s.py;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function toward(s: SimState, x: number, y: number): Command {
  const dx = x - s.px;
  const dy = y - s.py;
  return { t: 'move', dx: Math.abs(dx) > DEAD_ZONE ? sign(dx) : 0, dy: Math.abs(dy) > DEAD_ZONE ? sign(dy) : 0 };
}

export function autopilot(s: SimState): Command {
  if (s.status !== 'playing') return { t: 'wait' };
  const e = nearest(s, s.ex, s.ey);
  if (e >= 0) {
    const rx = (s.ex[e] ?? 0) - s.px;
    const ry = (s.ey[e] ?? 0) - s.py;
    const dist2 = rx * rx + ry * ry;
    const dir: Dir = Math.abs(rx) >= Math.abs(ry) ? (rx >= 0 ? 0 : 2) : ry >= 0 ? 1 : 3;
    const along = dir % 2 === 0 ? Math.abs(rx) : Math.abs(ry);
    const side = dir % 2 === 0 ? Math.abs(ry) : Math.abs(rx);
    const inCone = side <= along && dist2 <= STRIKE * STRIKE;
    if (inCone && s.cd === 0) return { t: 'attack', dir };
    // Waiting on the cooldown with an enemy on top of us: step away instead of taking contact damage.
    if (s.cd > 0 && dist2 < BACK_OFF * BACK_OFF) return { t: 'move', dx: -sign(rx) as -1 | 0 | 1, dy: -sign(ry) as -1 | 0 | 1 };
    if (s.cd > 0 && inCone) return { t: 'wait' };
    // Line up on the dominant axis: close the gap on the short axis first.
    return toward(s, s.ex[e] ?? 0, s.ey[e] ?? 0);
  }
  const d = nearest(s, s.dx, s.dy);
  if (d >= 0) return toward(s, s.dx[d] ?? 0, s.dy[d] ?? 0);
  return toward(s, EXIT_X, EXIT_Y);
}

export function runAutopilot(s0: SimState, maxTicks: number, stepFn: (s: SimState, c: Command) => SimState): { log: Command[]; final: SimState } {
  const log: Command[] = [];
  let s = s0;
  while (s.status === 'playing' && log.length < maxTicks) {
    const cmd = autopilot(s);
    log.push(cmd);
    s = stepFn(s, cmd);
  }
  return { log, final: s };
}
