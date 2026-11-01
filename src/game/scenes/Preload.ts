import Phaser from 'phaser';
import { bakeSprites } from '../sprites';

// No binary assets: every texture is baked from code-defined pixel sprites.
export class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  create(): void {
    bakeSprites(this);
    this.scene.start('Menu');
  }
}
