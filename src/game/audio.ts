import { getSettings } from './settings';

// ZzFX is imported lazily on the first user gesture, so no AudioContext exists before input.
type Zzfx = (...params: (number | undefined)[]) => unknown;
let play: Zzfx | null = null;
let loading = false;

export function unlockAudio(): void {
  if (play || loading) return;
  loading = true;
  void import('zzfx').then((m) => {
    void m.ZZFX.audioContext.resume();
    play = m.zzfx;
  });
}

// Unlock on the first pointer or key press anywhere on the page. Window listeners, not scene input:
// scene listeners are removed when their scene shuts down, so a Boot-scene listener never fired.
export function installAudioUnlock(): void {
  const once = () => {
    window.removeEventListener('pointerdown', once, true);
    window.removeEventListener('keydown', once, true);
    unlockAudio();
  };
  window.addEventListener('pointerdown', once, true);
  window.addEventListener('keydown', once, true);
}

// 21-param ZzFX v1.3 sound: short blip.
const BLIP = [1, 0.05, 880, 0, 0.02, 0.12, 1, 1.6, 0, 0, 440, 0.04, 0, 0, 0, 0, 0, 0.7, 0.02, 0, 0];

// Every sound goes through here: it is the single place that checks mute and that audio has been unlocked.
export function sfx(params: readonly (number | undefined)[]): void {
  if (getSettings().muted) return;
  play?.(...params);
}

export function sfxBlip(): void {
  sfx(BLIP);
}

// More 21-param ZzFX sounds, one per kind of moment. All still go through sfx().
const SWING = [0.6, 0.05, 220, 0, 0.01, 0.06, 4, 1.5, -8, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 0.02, 0, 0];
const KILL = [1, 0.05, 330, 0.01, 0.03, 0.18, 4, 2, -4, 0, 0, 0, 0, 0.2, 0, 0.3, 0, 0.6, 0.04, 0, 0];
const PICKUP = [0.8, 0, 660, 0.01, 0.05, 0.15, 0, 1.2, 0, 0, 330, 0.06, 0, 0, 0, 0, 0, 0.8, 0.03, 0, 0];
const HURT = [1, 0.05, 140, 0, 0.04, 0.2, 3, 2.5, -5, 0, 0, 0, 0, 0.8, 0, 0.4, 0, 0.7, 0.05, 0, 0];
const CLEAR = [1, 0, 523, 0.02, 0.2, 0.4, 0, 1.4, 0, 0, 262, 0.12, 0.05, 0, 0, 0, 0.1, 0.8, 0.1, 0, 0];

export const sfxSwing = (): void => sfx(SWING);
export const sfxKill = (): void => sfx(KILL);
export const sfxPickup = (): void => sfx(PICKUP);
export const sfxHurt = (): void => sfx(HURT);
export const sfxClear = (): void => sfx(CLEAR);
