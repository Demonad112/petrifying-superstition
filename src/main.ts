import Phaser from 'phaser';
import { WORLD_H, WORLD_W } from './sim';
import { PALETTE } from './game/palette';
import { Boot } from './game/scenes/Boot';
import { GameOver } from './game/scenes/GameOver';
import { Menu } from './game/scenes/Menu';
import { Play } from './game/scenes/Play';
import { Preload } from './game/scenes/Preload';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WORLD_W,
  height: WORLD_H,
  backgroundColor: PALETTE.bg,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Boot, Preload, Menu, Play, GameOver],
});
