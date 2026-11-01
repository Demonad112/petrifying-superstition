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
  // Demo slice (docs/DEMO_SLICE.md): lantern-bearer, stone gorgon bust, rune stone, field decorations.
  sliceHero: [
    '....2222....',
    '...222222...',
    '..22bbbb22..',
    '..2b0bb0b2..',
    '..2bbbbbb2..',
    '...22bb22...',
    '..ff2222ff..',
    '.ff22ff22ff.',
    '.2222222222.',
    'T2222ff2222.',
    't222ffff222.',
    '1.222ff222..',
    '..222222222.',
    '..22222222..',
    '...00..00...',
    '...00..00...',
  ],
  sliceGorgon: [
    '..........................',
    '.....M...............M....',
    '.M...m.......M...M...m...M',
    '..m...m......m...m..m...m.',
    '..m...m.....m...m...m...m.',
    '...m...m....m...m..m...m..',
    '...m...m...m...m...m...m..',
    '....m...m..m.2.m..m...m...',
    '....m....233333332....m...',
    '.....m..23333333332..m....',
    '.......2333333333332......',
    '......233333333333332.....',
    '...Mm.231111333111132.mM..',
    '.....2333f333333f33332....',
    '.....2333MM33333MM3332....',
    '.....2333MM33333MM3332....',
    '.....23333333333333332....',
    '.....23333333233333332....',
    '......233333323333332.....',
    '......233330303033332.....',
    '.......233RRRRRRR332......',
    '..23333233333333333332332.',
    '...233233333333333332332..',
    '....2233333323333332332...',
    '.....23333323333332332....',
    '......233323333332332.....',
  ],
  sliceRune: [
    '...2222...',
    '..233332..',
    '.23333332.',
    '.233MM332.',
    '.23M33M32.',
    '.233MM332.',
    '.23M3MM32.',
    '.23333332.',
    '.23333332.',
    '.22333322.',
    '..222222..',
  ],
  sliceStone: [
    '....2222....',
    '...233332...',
    '..23333332..',
    '..23333332..',
    '..2333b332..',
    '..23333332..',
    '..23333332..',
    '..23333332..',
    '..23333332..',
    '..2333b332..',
    '..23333332..',
    '..23333332..',
    '..23333332..',
    '..23333332..',
    '..2233332m..',
    '.m2233332mm.',
    'mmm2222mmmm.',
  ],
  sliceTuft: [
    'm..m..m',
    '.m.m.m.',
    '..mmm..',
    '..mmm..',
  ],
  sliceField: [
    '1111111111',
    '1111m11111',
    '1111111111',
    '1m11111121',
    '1111111111',
    '1111112111',
    '1121111111',
    '11111m1111',
    '1111211112',
    '1111111111',
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
