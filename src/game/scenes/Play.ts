import Phaser from 'phaser';
import { createState, encodeReplay, hashState, step, type Command, type CommandLog, type ReplayFile, type SimState } from '../../sim';
import { sfxBlip } from '../audio';
import { bindReplayExport, debugParams, markData, markMoment, markPaused, markScene } from '../debug';
import { ReplaySource } from '../demo';
import { applyCameraFx, burst, hitStop, pulse, resetHitStop, shake, tickHitStop } from '../fx';
import { bindFx, bindMute, CommandInput } from '../input';
import { frameStats, runFrame, type FrameIO, type TickMode } from '../loop';
import { PALETTE } from '../palette';
import { getSettings } from '../settings';

// 'realtime': the sim ticks at TICK_HZ and idle ticks log 'wait'. 'turn': the sim ticks only on input.
const TICK_MODE: TickMode = 'realtime';

export interface PlayData {
  seed: number;
  // Demo mode: the recorded log replaces live input; everything else (clock, step, FX, audio) is the live path.
  demo?: { name: string; file: ReplayFile };
}

export class Play extends Phaser.Scene {
  private sim!: SimState;
  private log: CommandLog = [];
  private accMs = 0;
  private input2!: CommandInput;
  private source: ReplaySource | null = null;
  private block!: Phaser.GameObjects.Image;
  private hud!: Phaser.GameObjects.Text;
  private muteHud!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Container;
  private paused = false;
  private ended = false;
  private deltas: number[] = [];
  private readonly params = debugParams();

  constructor() {
    super('Play');
  }

  create(data: PlayData): void {
    markScene(this);
    const canvas = this.game.canvas;
    this.sim = createState(data.seed);
    this.log = [];
    this.accMs = 0;
    this.paused = false;
    this.ended = false;
    this.deltas = [];
    this.source = data.demo ? new ReplaySource(data.demo.file) : null;
    markData(canvas, 'mode', this.source ? 'demo' : 'live');
    markData(canvas, 'hash', null);
    markData(canvas, 'moment', null);
    const { width, height } = this.scale;
    this.block = this.add.image(width / 2, height / 2, 'block');
    this.hud = this.add.text(12, 8, '', { fontFamily: 'monospace', fontSize: '18px', color: PALETTE.text });
    const help = this.source
      ? `DEMO ${data.demo?.name}   P: pause   M: mute   F: fx   Esc: end   F8: save replay`
      : 'Space / Click: act   P: pause   M: mute   F: fx   Esc: end   F8: save replay';
    this.add.text(width / 2, height - 40, help, { fontFamily: 'monospace', fontSize: '16px', color: PALETTE.accent }).setOrigin(0.5);
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
      markPaused(canvas, null);
      resetHitStop(this, null);
    });
    markPaused(canvas, false);
    resetHitStop(this, false);
    bindReplayExport(this, () => this.replayFile());
    this.input.keyboard?.once('keydown-ESC', () => this.end());
    applyCameraFx(this.cameras.main);
    this.render();
  }

  update(_time: number, delta: number): void {
    if (this.params.perf && !this.paused) this.deltas.push(delta);
    this.accMs = runFrame(this.accMs, delta * this.params.speed, this.frameIO);
    if (this.source?.done && !this.ended) this.end();
    this.render();
  }

  private replayFile(): ReplayFile {
    return encodeReplay(this.sim.seed, this.log, this.sim);
  }

  private end(): void {
    if (this.ended) return;
    this.ended = true;
    const canvas = this.game.canvas;
    markData(canvas, 'hash', hashState(this.sim));
    if (this.params.perf) {
      const stats = frameStats(this.deltas);
      (window as unknown as { __perf?: unknown }).__perf = stats;
      markData(canvas, 'perf', JSON.stringify(stats));
    }
    this.scene.start('GameOver', { replay: this.replayFile(), demo: this.source !== null });
  }

  // Wall-time scheduling lives in loop.ts; this only adapts the scene to it.
  private readonly frameIO: FrameIO = this.makeFrameIO();

  private makeFrameIO(): FrameIO {
    const scene = this;
    return {
      mode: TICK_MODE,
      get paused() {
        return scene.paused || scene.ended;
      },
      tickHitStop: (d) => tickHitStop(scene, d),
      next: () => {
        if (scene.source) return scene.source.next(); // live input is ignored in demo mode
        return scene.input2.poll() ?? (TICK_MODE === 'realtime' ? { t: 'wait' } : null);
      },
      clearInput: () => scene.input2.clear(),
      apply: (cmd) => scene.apply(cmd),
    };
  }

  // `overlay: false` is the ?shots capture pause: same freeze, but the moment stays visible.
  private setPaused(paused: boolean, overlay = true): void {
    if (paused === this.paused) return;
    this.paused = paused;
    if (paused) this.input2.clear();
    this.overlay.setVisible(paused && overlay);
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
    if (cmd.t === 'act') this.moment('act');
  }

  // A moment is a sim outcome the view reacts to with FX and sound. ?shots=1 pauses on each one.
  private moment(name: string): void {
    sfxBlip();
    pulse(this, this.block);
    burst(this, this.block.x, this.block.y, { count: 8, color: PALETTE.secondary });
    shake(this, 0.002, 80);
    hitStop(this, 40);
    markMoment(this.game.canvas, name);
    if (this.params.shots) this.setPaused(true, false);
  }

  private render(): void {
    const canvas = this.game.canvas;
    this.hud.setText(`TICK ${this.sim.tick}  ROLL ${this.sim.roll}`);
    this.muteHud.setVisible(getSettings().muted);
    markData(canvas, 'tick', this.sim.tick);
    markData(canvas, 'status', this.sim.status);
  }
}
