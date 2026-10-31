// Serializable command log entries. The view only ever produces these.
// Add one variant per player intent.
export type Command =
  | { t: 'act' }
  | { t: 'wait' };

export type CommandLog = Command[];
