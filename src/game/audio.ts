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
