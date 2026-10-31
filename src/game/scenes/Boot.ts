import Phaser from 'phaser';
import { unlockAudio } from '../audio';
import { markFx, markMuted } from '../debug';
import { getSettings } from '../settings';

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    markMuted(this.game.canvas, getSettings().muted);
    markFx(this.game.canvas, getSettings().fx);
    this.input.once('pointerdown', unlockAudio);
    this.input.keyboard?.once('keydown', unlockAudio);
    this.scene.start('Preload');
  }
}
