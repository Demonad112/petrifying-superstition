// mulberry32: tiny, fast, deterministic. The RNG state is a single uint32 kept in SimState.
export function nextRandom(seed: number): [value: number, nextSeed: number] {
  const s = (seed + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, s];
}

export function randomInt(seed: number, maxExclusive: number): [value: number, nextSeed: number] {
  const [v, next] = nextRandom(seed);
  return [Math.floor(v * maxExclusive), next];
}
