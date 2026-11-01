import Phaser from 'phaser';
import { WORLD_H, WORLD_W } from './sim';
import { debugParams } from './game/debug';
import { PALETTE } from './game/palette';
import { Boot } from './game/scenes/Boot';
import { Slice } from './game/scenes/Slice';
import { Preload } from './game/scenes/Preload';

// Entry for slice.html: Boot (init + audio unlock) -> sprite bake -> Slice. Same game config as main.ts.
const { fps } = debugParams();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WORLD_W,
  height: WORLD_H,
  backgroundColor: PALETTE.bg,
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  ...(fps ? { fps: { target: fps, forceSetTimeOut: true } } : {}),
  callbacks: { preBoot: (game) => game.registry.set('firstScene', 'Slice') },
  scene: [Boot, Preload, Slice],
});
