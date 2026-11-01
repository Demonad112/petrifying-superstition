// Fixed 16-colour palette (DECISIONS #19). Every sprite pixel, primitive, FX tint and text colour comes from here.
// No binary assets: sprites are code-defined grids of these colours (src/game/sprite-data.ts).
export const PALETTE = {
  // Darks and stone
  bg: 0x0a0a10, // night: page and camera background
  stone0: 0x16151c,
  stone1: 0x2a2830,
  stone2: 0x4a4652,
  stone3: 0x7d7785,
  bone: 0xe6dcc3,
  // Blood, fire, nature, cold
  blood0: 0x5e1016,
  blood1: 0xb02a30,
  torch0: 0xd9731f,
  torch1: 0xf5c451,
  moss: 0x4f6b3a,
  frost: 0x6fb7c9,
  // Item and enemy rarity
  normal: 0xc8c8c8,
  magic: 0x6b8cff,
  rare: 0xffe25c,
  unique: 0xe0782a,
  // CSS strings for Phaser text (same hues as bone and torch0)
  text: '#e6dcc3',
  accent: '#d9731f',
} as const;

type Palette = typeof PALETTE;
export type PaletteKey = { [K in keyof Palette]: Palette[K] extends number ? K : never }[keyof Palette];
export type PaletteColor = Palette[PaletteKey];

export const PALETTE_KEYS = Object.keys(PALETTE).filter((k) => typeof PALETTE[k as keyof Palette] === 'number') as PaletteKey[];
