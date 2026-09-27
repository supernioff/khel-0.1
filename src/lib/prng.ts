/**
 * Seeded Mulberry32 Pseudo-Random Number Generator.
 * Guarantees identical random pipes for both players in a multiplayer room.
 */
export function createPRNG(seed: number) {
  let s = (seed || 12345) >>> 0;
  return function next() {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
