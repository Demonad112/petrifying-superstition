import Phaser from 'phaser';
import { advanceClock, createState, encodeReplay, step, type Command, type CommandLog, type SimState } from '../../sim';
import { sfxBlip } from '../audio';
import { bindReplayExport, markPaused, markScene } from '../debug';
import { applyCameraFx, burst, hitStop, pulse, resetHitStop, shake, tickHitStop } from '../fx';
import { bindFx, bindMute, CommandInput } from '../input';
import { PALETTE } from '../palette';
import { getSettings } from '../settings';

// 'realtime': the sim ticks at TICK_HZ and idle ticks log 'wait'. 'turn': the sim ticks only on input.
const TICK_MODE: 'realtime' | 'turn' = 'realtime';

export class Play extends Phaser.Scene {
  private sim!: SimState;
  private log: CommandLog = [];
  private accMs = 0;
  private input2!: CommandInput;
  private block!: Phaser.GameObjects.Image;
  private hud!: Phaser.GameObjects.Text;
  private muteHud!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Container;
  private paused = false;

  constructor() {
    super('Play');
  }

  create(data: { seed: number }): void {
    markScene(this);
    this.sim = createState(data.seed);
    this.log = [];
    this.accMs = 0;
    this.paused = false;
    const { width, height } = this.scale;
    this.block = this.add.image(width / 2, height / 2, 'block');
    this.hud = this.add.text(12, 8, '', { fontFamily: 'monospace', fontSize: '18px', color: PALETTE.text });
    this.add
      .text(width / 2, height - 40, 'Space / Click: act   P: pause   M: mute   F: fx   Esc: end   F8: save replay', { fontFamily: 'monospace', fontSize: '16px', color: PALETTE.accent })
      .setOrigin(0.5);
    this.muteHud = this.add
      .text(width - 12, 8, 'MUTED', { fontFamily: 'monospace', fontSize: '18px', color: PALETTE.accent })
      .setOrigin(1, 0);
    this.overlay = this.makePauseOverlay();
    this.input2 = new CommandInput(this);
    bindMute(this);
    bindFx(this);
    this.input.keyboard?.on('keydown-P', () => this.setPaused(!this.paused));
    // Losing focus or hiding the tab pauses; only P resumes.
    const autoPause = () => this.setPaused(true);
    this.game.events.on(Phaser.Core.Events.BLUR, autoPause);
    this.game.events.on(Phaser.Core.Events.HIDDEN, autoPause);
    this.events.once('shutdown', () => {
      this.game.events.off(Phaser.Core.Events.BLUR, autoPause);
      this.game.events.off(Phaser.Core.Events.HIDDEN, autoPause);
      markPaused(this.game.canvas, null);
      resetHitStop(this, null);
    });
    markPaused(this.game.canvas, false);
    resetHitStop(this, false);
    const replay = () => encodeReplay(data.seed, this.log, this.sim);
    bindReplayExport(this, replay);
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('GameOver', { replay: replay() }));
    applyCameraFx(this.cameras.main);
    this.render();
  }

  update(_time: number, delta: number): void {
    if (this.paused) {
      // No ticks and no clock advance, so resuming never catches up. Input typed while paused is dropped.
      this.input2.clear();
      this.render();
      return;
    }
    if (tickHitStop(this, delta)) {
      // Hit-stop: no clock advance and no step for a few wall ms, like pause. Queued input is kept (it is only delayed).
      this.render();
      return;
    }
    if (TICK_MODE === 'turn') {
      const cmd = this.input2.poll();
      if (cmd) this.apply(cmd);
    } else {
      const { steps, accMs } = advanceClock(this.accMs, delta);
      this.accMs = accMs;
      for (let i = 0; i < steps; i++) {
        this.apply(this.input2.poll() ?? { t: 'wait' });
        if (tickHitStop(this, 0)) break; // a hit landed: drop this frame's remaining ticks instead of replaying them later
      }
    }
    this.render();
  }

  private setPaused(paused: boolean): void {
    if (paused === this.paused) return;
    this.paused = paused;
    if (paused) this.input2.clear();
    this.overlay.setVisible(paused);
    markPaused(this.game.canvas, paused);
  }

  private makePauseOverlay(): Phaser.GameObjects.Container {
    const { width, height } = this.scale;
    const shade = this.add.rectangle(width / 2, height / 2, width, height, PALETTE.bg, 0.75);
    const label = this.add
      .text(width / 2, height / 2, 'PAUSED  P: resume  M: mute', { fontFamily: 'monospace', fontSize: '28px', color: PALETTE.text })
      .setOrigin(0.5);
    return this.add.container(0, 0, [shade, label]).setDepth(10).setVisible(false);
  }

  private apply(cmd: Command): void {
    this.sim = step(this.sim, cmd);
    this.log.push(cmd);
    if (cmd.t === 'act') {
      sfxBlip();
      pulse(this, this.block);
      burst(this, this.block.x, this.block.y, { count: 8, color: PALETTE.secondary });
      shake(this, 0.002, 80);
      hitStop(this, 40);
    }
  }

  private render(): void {
    this.hud.setText(`TICK ${this.sim.tick}  ROLL ${this.sim.roll}`);
    this.muteHud.setVisible(getSettings().muted);
  }
}
