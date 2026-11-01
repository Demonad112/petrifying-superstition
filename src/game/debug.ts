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

// View-only URL parameters (DECISIONS #18). None of them enter SimState or the Command log.
//   ?demo=<name>  play tests/replays/demo-<name>.json through the live clock and step path
//   ?speed=<n>    wall-delta multiplier (0.25-8); the catch-up cap scales with it
//   ?fps=<n>      fixed setTimeout-driven frame rate (5-240), read once in main.ts
//   ?shots=1      auto-pause at each moment (resume with P), for screenshots
//   ?perf=1       record frame deltas; summary on window.__perf and canvas data-perf
export interface DebugParams {
  demo: string | null;
  speed: number;
  fps: number | null;
  shots: boolean;
  perf: boolean;
}

export function debugParams(search: string = location.search): DebugParams {
  const p = new URLSearchParams(search);
  const num = (k: string, min: number, max: number): number | null => {
    const v = Number(p.get(k));
    return p.has(k) && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : null;
  };
  const demo = p.get('demo');
  return {
    demo: demo && /^[a-z0-9-]+$/i.test(demo) ? demo : null,
    speed: num('speed', 0.25, 8) ?? 1,
    fps: num('fps', 5, 240),
    shots: p.get('shots') === '1',
    perf: p.get('perf') === '1',
  };
}

// Sets or clears one canvas data attribute (`null` removes it).
export function markData(canvas: HTMLCanvasElement, key: string, value: string | number | null): void {
  if (value === null) delete canvas.dataset[key];
  else canvas.dataset[key] = String(value);
}

// Each moment gets a fresh `<n>:<name>` value, so a MutationObserver sees repeats of the same moment.
let momentCount = 0;
export function markMoment(canvas: HTMLCanvasElement, name: string): void {
  canvas.dataset.moment = `${++momentCount}:${name}`;
}
