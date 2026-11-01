import Phaser from 'phaser';
import { markData } from './debug';
import { PALETTE } from './palette';
import { SPRITES, spriteRuns } from './sprite-data';

// Bakes every code-defined sprite into a texture of the same key, once. Bake time is mirrored to canvas
// data-bake-ms so a slow bake shows up in e2e and on low-end devices.
export function bakeSprites(scene: Phaser.Scene): void {
  const t0 = performance.now();
  const g = scene.make.graphics({}, false);
  for (const [key, rows] of Object.entries(SPRITES)) {
    if (scene.textures.exists(key)) continue;
    g.clear();
    for (const run of spriteRuns(rows)) g.fillStyle(PALETTE[run.key]).fillRect(run.x, run.y, run.w, 1);
    g.generateTexture(key, rows[0]?.length ?? 0, rows.length);
  }
  g.destroy();
  markData(scene.game.canvas, 'bakeMs', Math.round(performance.now() - t0));
}
