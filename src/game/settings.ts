// Persisted player settings. View-side only: never part of SimState or the Command log.
export type FxMode = 'full' | 'reduced';

export interface Settings {
  muted: boolean;
  fx: FxMode;
}

export const SETTINGS_KEY = 'dg3.settings';
export const DEFAULT_SETTINGS: Settings = { muted: false, fx: 'full' };

// Pure: turns whatever storage returned into valid settings. Each field falls back to its default on its own,
// so one bad value never discards the others. Missing or malformed input yields the defaults.
export function parseSettings(raw: string | null | undefined): Settings {
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== 'object' || v === null) return { ...DEFAULT_SETTINGS };
    const { muted, fx } = v as { muted?: unknown; fx?: unknown };
    return {
      muted: typeof muted === 'boolean' ? muted : DEFAULT_SETTINGS.muted,
      fx: fx === 'full' || fx === 'reduced' ? fx : DEFAULT_SETTINGS.fx,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function serializeSettings(s: Settings): string {
  return JSON.stringify({ muted: s.muted, fx: s.fx });
}

let cache: Settings | null = null;

export function getSettings(): Settings {
  if (cache) return cache;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(SETTINGS_KEY);
  } catch {
    // storage blocked or unavailable: use defaults
  }
  cache = parseSettings(raw);
  return cache;
}

function update(patch: Partial<Settings>): void {
  cache = { ...getSettings(), ...patch };
  try {
    localStorage.setItem(SETTINGS_KEY, serializeSettings(cache));
  } catch {
    // not persisted; the in-memory value still applies this session
  }
}

export function setMuted(muted: boolean): void {
  update({ muted });
}

export function setFx(fx: FxMode): void {
  update({ fx });
}
