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

// `X` is the rarity colour: the outline and horns, so rarity reads at a glance.
const ENEMY = [
  '.X........X.',
  '.XX......XX.',
  '..XXXXXXXX..',
  '.X11111111X.',
  '.X1b1111b1X.',
  '.X11111111X.',
  '.X111rr111X.',
  '.X11111111X.',
  '.XX111111XX.',
  '..XX1111XX..',
  '..X.X..X.X..',
  '..X.X..X.X..',
] as const;

// One gem per rarity; `c` is the rarity colour, `b` the highlight.
const GEM = ['..cc..', '.cbcc.', 'cbcccc', '.cccc.', '..cc..'] as const;
const recolor = (rows: readonly string[], from: string, to: string): string[] => rows.map((r) => r.replaceAll(from, to));

export const SPRITES = {
  player: [
    '....bbbb....',
    '...bbbbbb...',
    '...b0bb0b...',
    '...bbbbbb...',
    '....ffff....',
    '..ffffffff..',
    '..f.ffff.f..',
    '..f.ffff.f..',
    '....f..f....',
    '....f..f....',
    '...00..00...',
    '...00..00...',
  ],
  // Enemies: the eye colour is the rarity colour (normal, magic, rare).
  enemy0: recolor(ENEMY, 'X', 'w'),
  enemy1: recolor(ENEMY, 'X', 'M'),
  enemy2: recolor(ENEMY, 'X', 'Y'),
  gem0: recolor(GEM, 'c', 'w'),
  gem1: recolor(GEM, 'c', 'M'),
  gem2: recolor(GEM, 'c', 'Y'),
  gem3: recolor(GEM, 'c', 'U'),
  floor: [
    '1111111111',
    '1111211111',
    '1111111111',
    '1211111121',
    '1111111111',
    '1111112111',
    '1121111111',
    '1111111111',
    '1111211112',
    '1111111111',
  ],
  wall: [
    '2222122222',
    '2222122222',
    '1111111111',
    '2212222221',
    '2212222221',
    '1111111111',
    '2222122222',
    '2222122222',
    '1111111111',
    '2221222222',
  ],
  exit: [
    '....ffffff....',
    '..ffffffffff..',
    '.fffbbbbbffff.',
    '.ffbbffffbbff.',
    'ffbbf....fbbff',
    'ffbf......fbff',
    'ffbf......fbff',
    'ffbf......fbff',
    'ffbbf....fbbff',
    '.ffbbffffbbff.',
    '.fffbbbbbffff.',
    '..ffffffffff..',
    '....ffffff....',
    '..............',
  ],
  torch: [
    '.T.T.',
    '..T..',
    '.tTt.',
    '.ttt.',
    '..1..',
    '..1..',
    '..1..',
    '..1..',
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
