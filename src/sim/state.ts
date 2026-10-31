export const WORLD_W = 960;
export const WORLD_H = 540;

// Flat, JSON-serializable. No classes, no references, no functions.
export interface SimState {
  seed: number;
  rng: number;
  tick: number;
  roll: number;
  status: 'playing' | 'over';
}

export function createState(seed: number): SimState {
  return { seed, rng: seed >>> 0, tick: 0, roll: 0, status: 'playing' };
}
