import Phaser from 'phaser';
import { unlockAudio } from '../audio';
import { markData, markFx, markMuted } from '../debug';
import { getSettings } from '../settings';

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    markData(this.game.canvas, 'renderer', this.game.renderer.type === Phaser.WEBGL ? 'WEBGL' : 'CANVAS');
    markMuted(this.game.canvas, getSettings().muted);
    markFx(this.game.canvas, getSettings().fx);
    this.input.once('pointerdown', unlockAudio);
    this.input.keyboard?.once('keydown', unlockAudio);
    this.scene.start('Preload');
  }
}
