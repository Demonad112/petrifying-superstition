import { decodeLog, type Command, type CommandLog, type ReplayFile } from '../sim';

// Replay-driven demo mode. Every `tests/replays/demo-<name>.json` is emitted as a hashed build asset
// (never inlined) and fetched at runtime, so the demo also exercises base './', the JSON content-type and 404s.
const URLS = import.meta.glob<string>('../../tests/replays/demo-*.json', {
  query: '?url&no-inline',
  import: 'default',
  eager: true,
});

const PREFIX = '../../tests/replays/demo-';

export function demoNames(): string[] {
  return Object.keys(URLS)
    .map((p) => p.slice(PREFIX.length, -'.json'.length))
    .sort();
}

export async function loadDemo(name: string): Promise<ReplayFile> {
  const url = URLS[`${PREFIX}${name}.json`];
  if (!url) throw new Error(`unknown demo "${name}"`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`demo "${name}": HTTP ${res.status}`);
  const file = (await res.json()) as ReplayFile;
  if (file.v !== 1 || !Array.isArray(file.runs)) throw new Error(`demo "${name}": not a v1 replay`);
  return file;
}

// Feeds a recorded log one command per tick through the same frame driver and step path as live play.
export class ReplaySource {
  private i = 0;
  private readonly log: CommandLog;

  constructor(file: ReplayFile) {
    this.log = decodeLog(file.runs);
  }

  next(): Command | null {
    return this.log[this.i++] ?? null;
  }

  get done(): boolean {
    return this.i >= this.log.length;
  }
}
