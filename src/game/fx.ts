import Phaser from 'phaser';
import { markData, markHitStop } from './debug';
import { PALETTE, type PaletteColor } from './palette';
import { getSettings } from './settings';

// All visual FX live here. Phaser 4 filters: check the v3-to-v4 migration skill before changing.
export function applyCameraFx(camera: Phaser.Cameras.Scene2D.Camera): void {
  const canvas = camera.scene.game.canvas;
  if (camera.scene.game.renderer.type !== Phaser.WEBGL) {
    markData(canvas, 'camfx', 'off'); // filters are WebGL-only
    return;
  }
  Phaser.Actions.AddEffectBloom(camera, {
    threshold: 0.5,
    blurRadius: 2,
    blurSteps: 4,
    blendAmount: 0.8,
    useInternal: true,
  });
  camera.filters.internal.addVignette(0.5, 0.5, 0.9, 0.35);
  markData(canvas, 'camfx', 'on');
}

// A short bone-coloured swipe in front of the attacker. View-only; motion is tiny, so it stays on in 'reduced' mode.
export function slash(scene: Phaser.Scene, x: number, y: number, dir: number): void {
  const horizontal = dir % 2 === 0;
  const sign = dir === 0 || dir === 1 ? 1 : -1;
  const arc = scene.add
    .rectangle(x + (horizontal ? sign * 26 : 0), y + (horizontal ? 0 : sign * 26), horizontal ? 10 : 44, horizontal ? 44 : 10, PALETTE.bone, 0.8)
    .setDepth(3);
  scene.tweens.add({ targets: arc, alpha: 0, scaleX: horizontal ? 1.6 : 1, scaleY: horizontal ? 1 : 1.6, duration: 120, ease: 'Quad.easeOut', onComplete: () => arc.destroy() });
}

// White hit flash on a sprite. Phaser 4 has no setTintFill(): the fill is `setTint(c).setTintMode(FILL)`, and the
// mode must be put back to MULTIPLY or the sprite stays a white silhouette (K-17).
export function flashSprite(scene: Phaser.Scene, img: Phaser.GameObjects.Image, ms = 90): void {
  img.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
  scene.time.delayedCall(ms, () => {
    if (img.active) img.setTintMode(Phaser.TintModes.MULTIPLY).setTint(0xffffff);
  });
}

// ---- Game-feel kit (view-only). Nothing here touches SimState or the Command log (DECISIONS #17). ----
// Budget rules: a trigger fires at most one shake, one flash, one burst and one hit-stop; shake <= 0.005,
// flash <= 120 ms, hit-stop <= 80 ms, burst <= 24 particles. 'reduced' drops shake and flash and halves bursts.

const isReduced = (): boolean => getSettings().fx === 'reduced';

export function shake(scene: Phaser.Scene, intensity: number, ms: number): void {
  if (isReduced()) return;
  scene.cameras.main.shake(ms, intensity);
}

export function flash(scene: Phaser.Scene, color: PaletteColor, ms: number): void {
  if (isReduced()) return;
  scene.cameras.main.flash(ms, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff);
}

export interface BurstOpts {
  count?: number; // particles before the reduced-FX halving
  color?: PaletteColor;
  speed?: number; // px/s
  lifespan?: number; // ms
}

const SPARK = 'fx-spark';
const emitters = new WeakMap<Phaser.Scene, Phaser.GameObjects.Particles.ParticleEmitter>();

// One emitter per scene, created on first use and reused; the texture is generated once from a primitive.
function emitterFor(scene: Phaser.Scene): Phaser.GameObjects.Particles.ParticleEmitter {
  let em = emitters.get(scene);
  if (em) return em;
  if (!scene.textures.exists(SPARK)) {
    const g = scene.make.graphics({}, false);
    g.fillStyle(0xffffff).fillRect(0, 0, 6, 6);
    g.generateTexture(SPARK, 6, 6);
    g.destroy();
  }
  em = scene.add
    .particles(0, 0, SPARK, { emitting: false, alpha: { start: 1, end: 0 }, scale: { start: 1, end: 0.2 }, angle: { min: 0, max: 360 } })
    .setDepth(5);
  emitters.set(scene, em);
  scene.events.once('shutdown', () => emitters.delete(scene)); // the display list destroys the emitter itself
  return em;
}

export function burst(scene: Phaser.Scene, x: number, y: number, opts: BurstOpts = {}): void {
  const { count = 10, color = PALETTE.torch1, speed = 160, lifespan = 350 } = opts;
  const n = isReduced() ? Math.max(1, Math.round(count / 2)) : count;
  emitterFor(scene)
    .setParticleTint(color)
    .setParticleSpeed(speed * 0.5, speed)
    .setParticleLifespan(lifespan)
    .explode(n, x, y);
}

// Hit-stop freezes the view's clock/step for a few wall-clock ms (like pause, but self-clearing).
// The remaining time is view state keyed by scene; it is mirrored to canvas `data-hitstop`.
const hitStopMs = new WeakMap<Phaser.Scene, number>();

export function hitStop(scene: Phaser.Scene, ms: number): void {
  hitStopMs.set(scene, Math.max(hitStopMs.get(scene) ?? 0, ms));
  markHitStop(scene.game.canvas, true);
}

// Call once per update before the clock. Returns true while frozen; spends wall time (delta) from the budget.
export function tickHitStop(scene: Phaser.Scene, deltaMs: number): boolean {
  const left = hitStopMs.get(scene) ?? 0;
  if (left <= 0) return false;
  const next = left - Math.max(0, deltaMs);
  if (next > 0) {
    hitStopMs.set(scene, next);
    return true;
  }
  hitStopMs.delete(scene);
  markHitStop(scene.game.canvas, false);
  return false;
}

export function resetHitStop(scene: Phaser.Scene, active: boolean | null): void {
  hitStopMs.delete(scene);
  markHitStop(scene.game.canvas, active);
}
