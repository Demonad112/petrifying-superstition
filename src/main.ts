import Phaser from 'phaser';
import { WORLD_H, WORLD_W } from './sim';
import { debugParams } from './game/debug';
import { PALETTE } from './game/palette';
import { Boot } from './game/scenes/Boot';
import { GameOver } from './game/scenes/GameOver';
import { Menu } from './game/scenes/Menu';
import { Play } from './game/scenes/Play';
import { Preload } from './game/scenes/Preload';

// ?fps=<n> forces a fixed setTimeout-driven frame rate, to prove replays are frame-rate independent.
const { fps } = debugParams();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WORLD_W,
  height: WORLD_H,
  backgroundColor: PALETTE.bg,
  pixelArt: true, // nearest-neighbour scaling keeps code-defined sprites crisp
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  ...(fps ? { fps: { target: fps, forceSetTimeOut: true } } : {}),
  scene: [Boot, Preload, Menu, Play, GameOver],
});
