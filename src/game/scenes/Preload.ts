import Phaser from 'phaser';
import { bakeSprites } from '../sprites';

// No binary assets: every texture is baked from code-defined pixel sprites.
export class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  create(): void {
    bakeSprites(this);
    // Entry pages choose where to go after the bake (slice.html sets 'firstScene' to 'Slice').
    this.scene.start((this.game.registry.get('firstScene') as string | undefined) ?? 'Menu');
  }
}
