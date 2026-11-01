// Integer trig for the sim. Math.sin/cos are not guaranteed bit-identical across engines, so angles are
// 64ths of a turn and values are Q12 fixed point (4096 = 1.0), read from a literal table.
export const ANGLES = 64;
export const Q = 4096;

// sin(2*pi*i/64) * 4096, rounded.
export const SIN64: readonly number[] = [
  0, 401, 799, 1189, 1567, 1931, 2276, 2598,
  2896, 3166, 3406, 3612, 3784, 3920, 4017, 4076,
  4096, 4076, 4017, 3920, 3784, 3612, 3406, 3166,
  2896, 2598, 2276, 1931, 1567, 1189, 799, 401,
  0, -401, -799, -1189, -1567, -1931, -2276, -2598,
  -2896, -3166, -3406, -3612, -3784, -3920, -4017, -4076,
  -4096, -4076, -4017, -3920, -3784, -3612, -3406, -3166,
  -2896, -2598, -2276, -1931, -1567, -1189, -799, -401,
];

export const sin64 = (a: number): number => SIN64[a & (ANGLES - 1)] ?? 0;
export const cos64 = (a: number): number => SIN64[(a + ANGLES / 4) & (ANGLES - 1)] ?? 0;

// Exact floor(sqrt(n)) for non-negative integers below 2^52 (Newton on integers, no float rounding).
export function isqrt(n: number): number {
  if (n <= 0) return 0;
  let x = Math.floor(Math.sqrt(n));
  while (x * x > n) x--;
  while ((x + 1) * (x + 1) <= n) x++;
  return x;
}
