import Phaser from 'phaser';
import type { ReplayFile } from '../sim';
import type { FxMode } from './settings';

// `?seed=123` pins the run seed so an exported replay can be reproduced in the browser.
export function seedFromUrl(fallback: number): number {
  const p = new URLSearchParams(location.search).get('seed');
  return p !== null && /^\d+$/.test(p) ? Number(p) >>> 0 : fallback >>> 0;
}

// F8 downloads the current run. Drop the file in tests/replays/ to make it a regression test.
export function bindReplayExport(scene: Phaser.Scene, get: () => ReplayFile): void {
  scene.input.keyboard?.on('keydown-F8', () => download(get()));
}

function download(file: ReplayFile): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `replay-${file.seed}-${file.ticks}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Mirrors the active scene onto the canvas (`data-scene`) so e2e tests can wait for it instead of sleeping.
export function markScene(scene: Phaser.Scene): void {
  scene.game.canvas.dataset.scene = scene.scene.key;
}

// Mirrors view-only state onto the canvas so e2e tests can poll it. Pause, mute, fx and hit-stop never enter the sim.
export function markPaused(canvas: HTMLCanvasElement, paused: boolean | null): void {
  if (paused === null) delete canvas.dataset.paused;
  else canvas.dataset.paused = String(paused);
}

export function markMuted(canvas: HTMLCanvasElement, muted: boolean): void {
  canvas.dataset.muted = String(muted);
}

export function markFx(canvas: HTMLCanvasElement, fx: FxMode): void {
  canvas.dataset.fx = fx;
}

export function markHitStop(canvas: HTMLCanvasElement, active: boolean | null): void {
  if (active === null) delete canvas.dataset.hitstop;
  else canvas.dataset.hitstop = String(active);
}
