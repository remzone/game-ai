export function seedHash(seed: string): number {
  let n = 2166136261;
  for (const c of seed) {
    n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  }
  return n >>> 0 || 1;
}
export function random(w: { rng: number }): number {
  let x = w.rng;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  w.rng = x >>> 0;
  return w.rng / 4294967296;
}
export function pick<T>(w: { rng: number }, values: readonly T[]): T {
  return values[Math.floor(random(w) * values.length)];
}
export function integer(w: { rng: number }, min: number, max: number): number {
  return min + Math.floor(random(w) * (max - min + 1));
}
