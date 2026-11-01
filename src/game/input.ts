import Phaser from 'phaser';
import type { Command, Dir } from '../sim';
import { markFx, markMuted } from './debug';
import { getSettings, setFx, setMuted } from './settings';

// Maps held keys to sim commands, one per tick. WASD moves; arrow keys attack in that direction;
// Space attacks the way the player faces; a click attacks toward the pointer (dominant axis).
export class CommandInput {
  private readonly keys: Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'SPACE', Phaser.Input.Keyboard.Key>;
  private clicks: Dir[] = [];

  constructor(
    scene: Phaser.Scene,
    private readonly player: () => { x: number; y: number; face: number },
  ) {
    const kb = scene.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE') as typeof this.keys;
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const me = this.player();
      const dx = p.worldX - me.x;
      const dy = p.worldY - me.y;
      this.clicks.push(Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 0 : 2) : dy >= 0 ? 1 : 3);
    });
  }

  clear(): void {
    this.clicks.length = 0;
    for (const key of Object.values(this.keys)) Phaser.Input.Keyboard.JustDown(key); // consume presses made while paused
  }

  poll(): Command | null {
    const k = this.keys;
    // A tap shorter than one frame still counts: JustDown latches a press until it is read, and is read for every key each poll.
    const hit = (key: Phaser.Input.Keyboard.Key): boolean => Phaser.Input.Keyboard.JustDown(key) || key.isDown;
    const [right, down, left, up, space] = [hit(k.RIGHT), hit(k.DOWN), hit(k.LEFT), hit(k.UP), hit(k.SPACE)];
    const click = this.clicks.shift();
    if (click !== undefined) return { t: 'attack', dir: click };
    if (right) return { t: 'attack', dir: 0 };
    if (down) return { t: 'attack', dir: 1 };
    if (left) return { t: 'attack', dir: 2 };
    if (up) return { t: 'attack', dir: 3 };
    if (space) return { t: 'attack', dir: this.player().face as Dir };
    const dx = (k.D.isDown ? 1 : 0) - (k.A.isDown ? 1 : 0);
    const dy = (k.S.isDown ? 1 : 0) - (k.W.isDown ? 1 : 0);
    return dx !== 0 || dy !== 0 ? { t: 'move', dx: dx as -1 | 0 | 1, dy: dy as -1 | 0 | 1 } : null;
  }
}

// M toggles mute in any scene that calls this. Mute is a persisted view setting, not a sim command.
export function bindMute(scene: Phaser.Scene): void {
  markMuted(scene.game.canvas, getSettings().muted);
  scene.input.keyboard?.on('keydown-M', () => {
    setMuted(!getSettings().muted);
    markMuted(scene.game.canvas, getSettings().muted);
  });
}

// F toggles full/reduced FX in any scene that calls this. Persisted view setting, not a sim command.
export function bindFx(scene: Phaser.Scene): void {
  markFx(scene.game.canvas, getSettings().fx);
  scene.input.keyboard?.on('keydown-F', () => {
    setFx(getSettings().fx === 'full' ? 'reduced' : 'full');
    markFx(scene.game.canvas, getSettings().fx);
  });
}
