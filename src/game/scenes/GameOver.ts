import Phaser from 'phaser';
import type { ReplayFile } from '../../sim';
import { bindReplayExport, markScene } from '../debug';
import { bindFx, bindMute } from '../input';
import { PALETTE } from '../palette';

export class GameOver extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(data: { replay: ReplayFile }): void {
    markScene(this);
    bindMute(this);
    bindFx(this);
    const { width, height } = this.scale;
    const { ticks, hash, seed } = data.replay;
    this.add.text(width / 2, height / 2 - 40, 'GAME OVER', { fontFamily: 'monospace', fontSize: '48px', color: PALETTE.text }).setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 + 20, `seed ${seed}  ticks ${ticks}  #${hash}`, { fontFamily: 'monospace', fontSize: '18px', color: PALETTE.accent })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 + 56, 'Enter / Click: menu   F8: save replay', { fontFamily: 'monospace', fontSize: '16px', color: PALETTE.accent })
      .setOrigin(0.5);
    bindReplayExport(this, () => data.replay);
    const again = () => this.scene.start('Menu');
    this.input.keyboard?.once('keydown-ENTER', again);
    this.input.once('pointerdown', again);
  }
}
