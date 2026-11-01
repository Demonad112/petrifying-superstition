import Phaser from 'phaser';
import { debugParams, markData, markScene, seedFromUrl } from '../debug';
import { demoNames, loadDemo } from '../demo';
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
    this.add.text(width / 2, height / 2 - 40, 'PETRIFYING SUPERSTITION', { fontFamily: 'monospace', fontSize: '48px', color: PALETTE.text }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 30, 'Enter / Space / Click to start', { fontFamily: 'monospace', fontSize: '20px', color: PALETTE.accent }).setOrigin(0.5);
    const demos = demoNames();
    if (demos.length > 0) {
      this.add.text(width / 2, height / 2 + 62, 'D: watch demo', { fontFamily: 'monospace', fontSize: '16px', color: PALETTE.accent }).setOrigin(0.5);
    }
    this.status = this.add.text(width / 2, height - 40, '', { fontFamily: 'monospace', fontSize: '16px', color: PALETTE.accent }).setOrigin(0.5);
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      this.scene.start('Play', { seed: seedFromUrl(Date.now()) });
    };
    this.input.keyboard?.once('keydown-ENTER', start);
    this.input.keyboard?.once('keydown-SPACE', start);
    this.input.once('pointerdown', start);
    this.input.keyboard?.on('keydown-D', () => {
      const first = demos[0];
      if (first && !started) void this.startDemo(first);
    });
    // ?demo=<name> boots straight into the replay (shareable links, e2e).
    const requested = debugParams().demo;
    if (requested && !Menu.urlDemoUsed) {
      Menu.urlDemoUsed = true;
      started = true;
      void this.startDemo(requested);
    }
  }

  private status!: Phaser.GameObjects.Text;
  // The URL demo plays once per page load; returning to the Menu afterwards behaves normally.
  private static urlDemoUsed = false;

  private async startDemo(name: string): Promise<void> {
    markData(this.game.canvas, 'demoError', null);
    try {
      const file = await loadDemo(name);
      this.scene.start('Play', { seed: file.seed, demo: { name, file } });
    } catch (e) {
      // A missing or broken demo must never crash the game: show it and expose it for tests.
      markData(this.game.canvas, 'demoError', name);
      this.status.setText(`demo not found: ${name}`);
      console.warn(e);
    }
  }
}
