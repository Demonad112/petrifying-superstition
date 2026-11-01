// Serializable command log entries. The view only ever produces these.
// Add one variant per player intent.
export type Dir = 0 | 1 | 2 | 3; // 0 right, 1 down, 2 left, 3 up

export type Command =
  | { t: 'move'; dx: -1 | 0 | 1; dy: -1 | 0 | 1 }
  | { t: 'attack'; dir: Dir }
  | { t: 'wait' };

export type CommandLog = Command[];
