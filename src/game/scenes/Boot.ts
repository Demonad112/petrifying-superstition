import Phaser from 'phaser';
import { installAudioUnlock } from '../audio';
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
    installAudioUnlock();
    this.scene.start('Preload');
  }
}
