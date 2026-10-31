---
paths:
  - "src/game/**"
---

# Phaser view rules (src/game/**)

- Phaser is pinned to 4.2.1. Use `import Phaser from 'phaser'`. Do not use Phaser 3 APIs.
- Before using any FX, mask, lighting or tint API, read `.claude/skills/v3-to-v4-migration/SKILL.md`, then verify against `node_modules/phaser/types/phaser.d.ts`.
- All FX code lives in `src/game/fx.ts`. Camera filters go through `camera.filters.internal|external`. Bloom is `Phaser.Actions.AddEffectBloom`.
- The view reads `SimState` and emits `Command`s. No game rules in scenes.
- Art is primitives in `PALETTE` colours (`src/game/palette.ts`); no binary assets.
- Audio is ZzFX through `src/game/audio.ts`; nothing plays before the first user input.
- Logical size is 960x540, Scale FIT. Input is keyboard and mouse only.
