import { describe, expect, it } from 'vitest';
import { PALETTE, PALETTE_KEYS } from './palette';
import { PIXEL, SPRITE_MAX, SPRITES, spriteRuns } from './sprite-data';

describe('palette', () => {
  it('has exactly 16 fixed colours, all distinct', () => {
    expect(PALETTE_KEYS.length).toBe(16);
    expect(new Set(PALETTE_KEYS.map((k) => PALETTE[k])).size).toBe(16);
  });

  it('maps every pixel character to a palette colour', () => {
    for (const key of Object.values(PIXEL)) expect(PALETTE_KEYS).toContain(key);
  });
});

describe('code-defined sprites', () => {
  for (const [name, rows] of Object.entries(SPRITES)) {
    it(`${name} is a rectangular grid of palette pixels`, () => {
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.length).toBeLessThanOrEqual(SPRITE_MAX);
      const width = rows[0]?.length ?? 0;
      expect(width).toBeGreaterThan(0);
      expect(width).toBeLessThanOrEqual(SPRITE_MAX);
      for (const row of rows) {
        expect(row.length, `row "${row}"`).toBe(width);
        for (const ch of row) expect(ch === '.' || ch in PIXEL, `unknown pixel "${ch}"`).toBe(true);
      }
    });
  }

  it('encodes horizontal runs and skips transparent pixels', () => {
    expect(spriteRuns(['.00b', 'bb..'])).toEqual([
      { x: 1, y: 0, w: 2, key: 'stone0' },
      { x: 3, y: 0, w: 1, key: 'bone' },
      { x: 0, y: 1, w: 2, key: 'bone' },
    ]);
  });
});
