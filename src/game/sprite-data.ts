import type { PaletteKey } from './palette';

// Code-defined pixel sprites (DECISIONS #20). Each sprite is rows of characters; each character is one pixel
// in a PALETTE colour, '.' is transparent. Baked into textures once in Preload (src/game/sprites.ts).
// Pure data: no Phaser import, so Vitest can validate every grid.
export const PIXEL: Readonly<Record<string, PaletteKey>> = {
  n: 'bg',
  '0': 'stone0',
  '1': 'stone1',
  '2': 'stone2',
  '3': 'stone3',
  b: 'bone',
  r: 'blood0',
  R: 'blood1',
  t: 'torch0',
  T: 'torch1',
  m: 'moss',
  f: 'frost',
  w: 'normal',
  M: 'magic',
  Y: 'rare',
  U: 'unique',
};

export const SPRITE_MAX = 32;

export const SPRITES = {
  // Template skeleton: a carved rune stone. Replaced by the real game's sprites.
  block: [
    '....11111111....',
    '...1222222221...',
    '..122333333221..',
    '.12233333333221.',
    '.12333TTTT33321.',
    '.1233T3333T3321.',
    '.123333TT333321.',
    '.12333T33T33321.',
    '.1233T3333T3321.',
    '.12333TTTT33321.',
    '.12333333333321.',
    '.12223333332221.',
    '.11222222222211.',
    '..011111111110..',
    '...0000000000...',
    '................',
  ],
} satisfies Record<string, readonly string[]>;

export type SpriteKey = keyof typeof SPRITES;

// Horizontal runs of one colour, so baking draws one rectangle per run instead of one per pixel.
export interface PixelRun {
  x: number;
  y: number;
  w: number;
  key: PaletteKey;
}

export function spriteRuns(rows: readonly string[]): PixelRun[] {
  const runs: PixelRun[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x] ?? '.';
      let w = 1;
      while (row[x + w] === ch) w++;
      const key = PIXEL[ch];
      if (key) runs.push({ x, y, w, key });
      x += w;
    }
  });
  return runs;
}
