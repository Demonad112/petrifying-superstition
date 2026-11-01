import Phaser from 'phaser';
import {
  autopilot, createState, FP, SLICE_SEED, SLICE_TUNING, step, WORLD_H,
  type Command, type SimState,
} from '../../sim';
import { sfxHurt, sfxKill, sfxPickup, sfxSwing } from '../audio';
import { debugParams, markData, markScene, seedFromUrl } from '../debug';
import { applyCameraFx, burst, flash, flashSprite, hitStop, resetHitStop, shake, slash, tickHitStop } from '../fx';
import { bindFx, bindMute, CommandInput } from '../input';
import { runFrame, type FrameIO } from '../loop';
import { PALETTE } from '../palette';

const T = SLICE_TUNING;
const GORGON_SCALE = 2;
const HERO_SCALE = 3;

// Demo slice (docs/DEMO_SLICE.md): the existing sim run with SLICE_TUNING. View only: it renders SimState and
// turns input into Commands. Every step() call passes SLICE_TUNING (K-09).
export class Slice extends Phaser.Scene {
  private sim!: SimState;
  private accMs = 0;
  private input2!: CommandInput;
  private auto = false;
  private hero!: Phaser.GameObjects.Image;
  private gorgon!: Phaser.GameObjects.Image;
  private rune!: Phaser.GameObjects.Image;
  private runeLabel!: Phaser.GameObjects.Text;
  private hpBar!: Phaser.GameObjects.Graphics;
  private readonly params = debugParams();

  constructor() {
    super('Slice');
  }

  create(): void {
    markScene(this);
    const canvas = this.game.canvas;
    this.sim = createState(seedFromUrl(SLICE_SEED), T);
    this.accMs = 0;
    this.auto = new URLSearchParams(location.search).get('auto') === '1';
    markData(canvas, 'mode', this.auto ? 'auto' : 'live');
    this.buildField();
    this.rune = this.add.image(0, 0, 'sliceRune').setScale(3).setDepth(1).setVisible(false);
    this.tweens.add({ targets: this.rune, scale: 3.6, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.runeLabel = this.add
      .text(0, 0, '?', { fontFamily: 'monospace', fontSize: '18px', color: PALETTE.accent })
      .setOrigin(0.5)
      .setDepth(6)
      .setVisible(false);
    this.gorgon = this.add.image(0, 0, 'sliceGorgon').setScale(GORGON_SCALE);
    this.hero = this.add.image(0, 0, 'sliceHero').setScale(HERO_SCALE);
    this.hpBar = this.add.graphics().setDepth(6);
    this.input2 = new CommandInput(this, () => ({ x: this.sim.px / FP, y: this.sim.py / FP, face: this.sim.face }));
    bindMute(this);
    bindFx(this);
    this.input.keyboard?.on('keydown-R', () => this.scene.restart());
    resetHitStop(this, false);
    this.events.once('shutdown', () => resetHitStop(this, null));
    applyCameraFx(this.cameras.main);
    this.render();
  }

  update(_time: number, delta: number): void {
    this.accMs = runFrame(this.accMs, delta * this.params.speed, this.frameIO);
    this.render();
  }

  private readonly frameIO: FrameIO = this.makeFrameIO();

  private makeFrameIO(): FrameIO {
    const scene = this;
    return {
      mode: 'realtime',
      paused: false,
      tickHitStop: (d) => tickHitStop(scene, d),
      next: () => (scene.auto ? autopilot(scene.sim, T) : (scene.input2.poll() ?? { t: 'wait' })),
      clearInput: () => scene.input2.clear(),
      apply: (cmd) => scene.apply(cmd),
    };
  }

  private apply(cmd: Command): void {
    const prev = this.sim;
    this.sim = step(prev, cmd, T);
    this.react(prev, this.sim);
  }

  // Pure observation of what changed between two sim states: no rules, no RNG.
  private react(prev: SimState, next: SimState): void {
    if (prev.cd === 0 && next.cd > 0) {
      sfxSwing();
      slash(this, next.px / FP, next.py / FP, next.face);
    }
    if (next.ex.length > 0 && next.ehp[0] !== undefined && prev.ehp[0] !== undefined && next.ehp[0] < prev.ehp[0]) {
      flashSprite(this, this.gorgon);
      burst(this, next.ex[0]! / FP, next.ey[0]! / FP, { count: 5, color: PALETTE.magic });
      hitStop(this, 30);
    }
    if (prev.ex.length > 0 && next.ex.length === 0) {
      sfxKill();
      burst(this, prev.ex[0]! / FP, prev.ey[0]! / FP, { count: 16, color: PALETTE.magic });
      shake(this, 0.003, 90);
      hitStop(this, 50);
    }
    if (next.hp < prev.hp) {
      sfxHurt();
      shake(this, 0.003, 100);
      flash(this, PALETTE.blood1, 80);
    }
    if (next.picked > prev.picked) {
      sfxPickup();
      burst(this, next.px / FP, next.py / FP, { count: 8, color: PALETTE.rare });
    }
  }

  private buildField(): void {
    const { width, height } = this.scale;
    this.add.tileSprite(0, 0, width, height, 'sliceField').setOrigin(0).setTileScale(3).setDepth(0);
    // Chalk/salt circle at the crossroads.
    this.add.graphics().lineStyle(3, PALETTE.bone, 0.45).strokeCircle(width / 2, height / 2, 120).setDepth(0.1);
    for (const [x, y] of [[250, 120], [720, 150], [610, 440]] as const) this.add.image(x, y, 'sliceStone').setScale(3).setDepth(1 + y / WORLD_H);
    for (const [x, y] of [[120, 460], [330, 70], [860, 330], [500, 490], [170, 200], [790, 480]] as const) this.add.image(x, y, 'sliceTuft').setScale(3).setDepth(0.2);
  }

  private render(): void {
    const s = this.sim;
    const canvas = this.game.canvas;
    const depth = (yFp: number) => 1 + yFp / FP / WORLD_H;
    const bob = (s.tick >> 3) & 1;
    this.hero
      .setPosition(s.px / FP, s.py / FP + bob)
      .setDepth(depth(s.py))
      .setFlipX(s.face === 2)
      .setAlpha(s.inv > 0 && (s.tick & 4) === 0 ? 0.35 : 1);
    const alive = s.ex.length > 0;
    this.gorgon.setVisible(alive);
    this.hpBar.clear();
    if (alive) {
      const gx = (s.ex[0] ?? 0) / FP;
      const gy = (s.ey[0] ?? 0) / FP;
      this.gorgon.setPosition(gx, gy + ((s.tick >> 4) & 1)).setDepth(depth(s.ey[0] ?? 0));
      const w = 44;
      const frac = Math.max(0, (s.ehp[0] ?? 0) / T.enemyHp1);
      this.hpBar.fillStyle(PALETTE.stone0).fillRect(gx - w / 2, gy - 44, w, 6);
      this.hpBar.fillStyle(PALETTE.blood1).fillRect(gx - w / 2 + 1, gy - 43, (w - 2) * frac, 4);
    }
    const hasRune = s.dx.length > 0;
    this.rune.setVisible(hasRune);
    this.runeLabel.setVisible(hasRune);
    if (hasRune) {
      this.rune.setPosition((s.dx[0] ?? 0) / FP, (s.dy[0] ?? 0) / FP);
      this.runeLabel.setPosition((s.dx[0] ?? 0) / FP, (s.dy[0] ?? 0) / FP - 26);
    }
    markData(canvas, 'tick', s.tick);
    markData(canvas, 'px', s.px);
    markData(canvas, 'ehp', s.ex.length ? (s.ehp[0] ?? 0) : 0);
    markData(canvas, 'picked', s.picked);
    markData(canvas, 'mdmg', s.mDmg);
    markData(canvas, 'mhaste', s.mHaste);
    markData(canvas, 'mswift', s.mSwift);
    markData(canvas, 'maxhp', s.maxHp);
  }
}
