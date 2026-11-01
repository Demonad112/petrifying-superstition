import Phaser from 'phaser';
import {
  createState, DEFAULT_TUNING, encodeReplay, EXIT_X, EXIT_Y, FP, hashState, step, WORLD_H,
  type Command, type CommandLog, type ReplayFile, type SimState, type Tuning,
} from '../../sim';
import { sfxClear, sfxHurt, sfxKill, sfxPickup, sfxSwing } from '../audio';
import { bindReplayExport, debugParams, markData, markMoment, markPaused, markScene } from '../debug';
import { ReplaySource } from '../demo';
import { applyCameraFx, burst, flash, hitStop, resetHitStop, shake, slash, tickHitStop } from '../fx';
import { bindFx, bindMute, CommandInput } from '../input';
import { frameStats, runFrame, type FrameIO, type TickMode } from '../loop';
import { vanishedEnemies } from '../kills';
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
  // The tuning this run uses: passed to createState, step and every view lookup (K-09). Demo fixtures need the defaults.
  private readonly tuning: Tuning = DEFAULT_TUNING;
  private sim!: SimState;
  private log: CommandLog = [];
  private accMs = 0;
  private input2!: CommandInput;
  private source: ReplaySource | null = null;
  private playerImg!: Phaser.GameObjects.Image;
  private enemyImgs: Phaser.GameObjects.Image[] = [];
  private dropImgs: Phaser.GameObjects.Image[] = [];
  private exitImg!: Phaser.GameObjects.Image;
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
    this.sim = createState(data.seed, this.tuning);
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
    this.enemyImgs = [];
    this.dropImgs = [];
    this.buildArena();
    this.exitImg = this.add.image(EXIT_X / FP, EXIT_Y / FP, 'exit').setScale(3).setDepth(1);
    this.playerImg = this.add.image(this.sim.px / FP, this.sim.py / FP, 'player').setScale(2);
    this.hud = this.add.text(12, 6, '', { fontFamily: 'monospace', fontSize: '16px', color: PALETTE.text }).setDepth(8);
    const help = this.source
      ? `DEMO ${data.demo?.name}   P: pause   M: mute   F: fx   Esc: end   F8: save replay`
      : 'WASD: move   Arrows / Space / Click: attack   P: pause   M: mute   F: fx   Esc: end';
    this.add.text(width / 2, height - 15, help, { fontFamily: 'monospace', fontSize: '14px', color: PALETTE.accent }).setOrigin(0.5).setDepth(8);
    this.muteHud = this.add
      .text(width - 12, 6, 'MUTED', { fontFamily: 'monospace', fontSize: '16px', color: PALETTE.accent })
      .setOrigin(1, 0)
      .setDepth(8);
    this.overlay = this.makePauseOverlay();
    this.input2 = new CommandInput(this, () => ({ x: this.sim.px / FP, y: this.sim.py / FP, face: this.sim.face }));
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
    // End after a pause lifts, so a ?shots capture on the last moment is not skipped.
    if (!this.paused && !this.ended && (this.source?.done || this.sim.status !== 'playing')) this.end();
    this.render();
  }

  private summary(): string {
    const s = this.sim;
    const result = s.status === 'cleared' ? `MAP CLEARED  tier ${s.tier - 1} -> ${s.tier}` : s.status === 'dead' ? 'YOU DIED' : 'RUN ENDED';
    return `${result}\nkills ${s.kills.join('/')} (normal/magic/rare)   modifiers ${s.picked}`;
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
    this.scene.start('GameOver', { replay: this.replayFile(), demo: this.source !== null, summary: this.summary() });
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
    const prev = this.sim;
    this.sim = step(prev, cmd, this.tuning);
    this.log.push(cmd);
    this.react(prev, this.sim);
  }

  // The view reacts to what changed between two sim states. Pure observation: no rules, no RNG.
  private react(prev: SimState, next: SimState): void {
    if (prev.cd === 0 && next.cd > 0) {
      sfxSwing();
      slash(this, next.px / FP, next.py / FP, next.face);
    }
    this.reactKills(prev, next);
    if (next.drar.length > prev.drar.length) {
      const top = Math.max(...next.drar.slice(prev.drar.length));
      if (top >= 2) this.moment('drop-rare');
    }
    if (next.picked > prev.picked) {
      sfxPickup();
      burst(this, next.px / FP, next.py / FP, { count: 8, color: PALETTE.rare });
      if (prev.picked === 0) this.moment('pickup');
    }
    if (next.hp < prev.hp) {
      sfxHurt();
      shake(this, 0.003, 100);
      flash(this, PALETTE.blood1, 80);
    }
    if (next.exitOpen && !prev.exitOpen) this.moment('exit-open');
    if (next.status === 'cleared' && prev.status === 'playing') {
      sfxClear();
      flash(this, PALETTE.frost, 120);
      this.moment('cleared');
    }
  }

  private reactKills(prev: SimState, next: SimState): void {
    for (const i of vanishedEnemies(prev, next, this.tuning)) {
      const rar = prev.erar[i] ?? 0;
      const x = (prev.ex[i] ?? 0) / FP;
      const y = (prev.ey[i] ?? 0) / FP;
      sfxKill();
      if (rar === 0) {
        burst(this, x, y, { count: 6, color: PALETTE.normal });
        hitStop(this, 30);
      } else if (rar === 1) {
        burst(this, x, y, { count: 12, color: PALETTE.magic });
        shake(this, 0.002, 80);
        hitStop(this, 50);
        this.moment('kill-magic');
      } else {
        burst(this, x, y, { count: 20, color: PALETTE.rare });
        flash(this, PALETTE.rare, 100);
        shake(this, 0.004, 120);
        hitStop(this, 80);
        this.moment('kill-rare');
      }
    }
  }

  // A moment is a sim outcome worth a screenshot. ?shots=1 pauses on each one.
  private moment(name: string): void {
    markMoment(this.game.canvas, name);
    if (this.params.shots) this.setPaused(true, false);
  }

  private buildArena(): void {
    const { width, height } = this.scale;
    const t = 30;
    this.add.tileSprite(0, 0, width, height, 'floor').setOrigin(0).setTileScale(3).setDepth(0);
    for (const [x, y, w, h] of [[0, 0, width, t], [0, height - t, width, t], [0, 0, t, height], [width - t, 0, t, height]] as const) {
      this.add.tileSprite(x, y, w, h, 'wall').setOrigin(0).setTileScale(3).setDepth(0.5);
    }
    const torches: (readonly [number, number])[] = [[560, 15], [700, 15], [820, 15], [15, 150], [15, 390], [945, 150], [945, 390]];
    for (const [x, y] of torches) this.add.image(x, y, 'torch').setScale(2).setDepth(0.6);
  }

  // Grows or shrinks a pool of images to `n` and returns them, so entities never leak or stack.
  private pool(imgs: Phaser.GameObjects.Image[], n: number, scale: number): Phaser.GameObjects.Image[] {
    while (imgs.length < n) imgs.push(this.add.image(0, 0, 'enemy0').setScale(scale));
    imgs.forEach((img, i) => img.setVisible(i < n));
    return imgs;
  }

  private render(): void {
    const canvas = this.game.canvas;
    const sim = this.sim;
    const depth = (yFp: number) => 1 + yFp / FP / WORLD_H;
    this.playerImg
      .setPosition(sim.px / FP, sim.py / FP)
      .setDepth(depth(sim.py))
      .setFlipX(sim.face === 2)
      .setAlpha(sim.inv > 0 && (sim.tick & 4) === 0 ? 0.35 : 1);
    this.pool(this.enemyImgs, sim.ex.length, 2).forEach((img, i) => {
      if (i < sim.ex.length) img.setTexture(`enemy${sim.erar[i] ?? 0}`).setPosition((sim.ex[i] ?? 0) / FP, (sim.ey[i] ?? 0) / FP).setDepth(depth(sim.ey[i] ?? 0));
    });
    this.pool(this.dropImgs, sim.dx.length, 2).forEach((img, i) => {
      if (i < sim.dx.length) img.setTexture(`gem${sim.drar[i] ?? 0}`).setPosition((sim.dx[i] ?? 0) / FP, (sim.dy[i] ?? 0) / FP).setDepth(1);
    });
    this.exitImg.setAlpha(sim.exitOpen ? 1 : 0.25);
    const mods = [sim.mDmg && `DMG+${sim.mDmg}`, sim.mHaste && `HASTE+${sim.mHaste}`, sim.mSwift && `SWIFT+${sim.mSwift}`].filter(Boolean).join(' ');
    this.hud.setText(
      `TIER ${sim.tier}  HP ${Math.max(0, sim.hp)}/${sim.maxHp}  KILLS ${sim.kills.reduce((a, b) => a + b, 0)}/${this.tuning.enemyCount}  ${mods}`,
    );
    this.muteHud.setVisible(getSettings().muted);
    markData(canvas, 'tick', sim.tick);
    markData(canvas, 'status', sim.status);
    markData(canvas, 'tier', sim.tier);
    markData(canvas, 'hp', sim.hp);
    markData(canvas, 'kills', sim.kills.reduce((a, b) => a + b, 0));
  }
}
