import Phaser from 'phaser';
import { PALETTE } from '../palette';

// No binary assets: generate textures from primitives.
export class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  create(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(PALETTE.primary).fillRect(0, 0, 48, 48);
    g.generateTexture('block', 48, 48);
    g.destroy();
    this.scene.start('Menu');
  }
}
