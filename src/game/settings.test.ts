import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings, serializeSettings } from './settings';

describe('parseSettings', () => {
  it('returns defaults for missing input', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('')).toEqual(DEFAULT_SETTINGS);
  });

  it('returns defaults for bad JSON or wrong shapes', () => {
    for (const raw of ['{', 'nope', 'null', '42', '"x"', '[]', '{"muted":"yes"}', '{"muted":1}', '{}']) {
      expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS);
    }
  });

  it('round-trips every combination', () => {
    for (const muted of [true, false]) {
      for (const fx of ['full', 'reduced'] as const) {
        expect(parseSettings(serializeSettings({ muted, fx }))).toEqual({ muted, fx });
      }
    }
  });

  it('defaults fx to full, including for settings saved before the field existed', () => {
    expect(DEFAULT_SETTINGS.fx).toBe('full');
    expect(parseSettings('{"muted":true}')).toEqual({ muted: true, fx: 'full' });
  });

  it('rejects bad fx values per field without discarding the others', () => {
    for (const bad of ['"loud"', '1', 'true', 'null', '"FULL"', '[]', '{}']) {
      expect(parseSettings(`{"muted":true,"fx":${bad}}`)).toEqual({ muted: true, fx: 'full' });
    }
    expect(parseSettings('{"muted":"yes","fx":"reduced"}')).toEqual({ muted: false, fx: 'reduced' });
  });

  it('does not hand out the shared defaults object', () => {
    expect(parseSettings(null)).not.toBe(DEFAULT_SETTINGS);
  });
});
