import type { Command, CommandLog } from './commands';
import { hashState } from './hash';
import type { SimState } from './state';
import { replay } from './step';

// Versioned record of a run. Runs of identical commands are run-length encoded,
// since a real-time log is mostly 'wait'.
export interface ReplayFile {
  v: 1;
  seed: number;
  ticks: number;
  hash: string;
  runs: [Command, number][];
}

export function encodeReplay(seed: number, log: CommandLog, final: SimState = replay(seed, log)): ReplayFile {
  const runs: [Command, number][] = [];
  let lastKey = '';
  for (const cmd of log) {
    const key = JSON.stringify(cmd);
    const last = runs[runs.length - 1];
    if (last && key === lastKey) last[1]++;
    else runs.push([cmd, 1]);
    lastKey = key;
  }
  return { v: 1, seed, ticks: final.tick, hash: hashState(final), runs };
}

export function decodeLog(runs: ReplayFile['runs']): CommandLog {
  const log: CommandLog = [];
  for (const [cmd, n] of runs) for (let i = 0; i < n; i++) log.push(cmd);
  return log;
}

// Re-simulates a replay and reports the hash it actually produces.
export function checkReplay(file: ReplayFile): { ok: boolean; hash: string; ticks: number } {
  const s = replay(file.seed, decodeLog(file.runs));
  const hash = hashState(s);
  return { ok: hash === file.hash && s.tick === file.ticks, hash, ticks: s.tick };
}
