import Phaser from 'phaser';
import { markScene, seedFromUrl } from '../debug';
import { bindFx, bindMute } from '../input';
import { PALETTE } from '../palette';

export class Menu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    markScene(this);
    bindMute(this);
    bindFx(this);
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2 - 40, 'DUMMY GAMER 3', { fontFamily: 'monospace', fontSize: '48px', color: PALETTE.text }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 30, 'Enter / Space / Click to start', { fontFamily: 'monospace', fontSize: '20px', color: PALETTE.accent }).setOrigin(0.5);
    const start = () => this.scene.start('Play', { seed: seedFromUrl(Date.now()) });
    this.input.keyboard?.once('keydown-ENTER', start);
    this.input.keyboard?.once('keydown-SPACE', start);
    this.input.once('pointerdown', start);
  }
}
