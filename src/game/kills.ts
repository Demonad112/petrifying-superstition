import { DEFAULT_TUNING, FP, type SimState, type Tuning } from '../sim';

// Indices into `prev` of the enemies that are gone in `next`. The sim exposes no events (K-10), so this walks both
// lists in order: a survivor keeps its rarity and has moved at most one knockback. Pure observation, no rules.
export function vanishedEnemies(prev: SimState, next: SimState, t: Tuning = DEFAULT_TUNING): number[] {
  const gone: number[] = [];
  if (next.ex.length === prev.ex.length) return gone;
  let j = 0;
  for (let i = 0; i < prev.ex.length; i++) {
    const alive =
      j < next.ex.length &&
      next.erar[j] === (prev.erar[i] ?? 0) &&
      Math.abs((next.ex[j] ?? 0) - (prev.ex[i] ?? 0)) <= t.knockback + FP &&
      Math.abs((next.ey[j] ?? 0) - (prev.ey[i] ?? 0)) <= t.knockback + FP;
    if (alive) j++;
    else gone.push(i);
  }
  return gone;
}
