import type { Command, CommandLog } from './commands';
import { randomInt } from './rng';
import { createState, type SimState } from './state';

// Pure: returns a new state, never mutates the input.
export function step(prev: SimState, cmd: Command): SimState {
  const state: SimState = structuredClone(prev);
  if (state.status !== 'playing') return state;
  state.tick++;

  if (cmd.t === 'act') {
    const [roll, rng] = randomInt(state.rng, 6);
    state.roll = roll + 1;
    state.rng = rng;
  }
  return state;
}

export function replay(seed: number, log: CommandLog): SimState {
  return log.reduce(step, createState(seed));
}
