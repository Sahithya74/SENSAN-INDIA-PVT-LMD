export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Progress of p through the window [a, b], clamped to 0–1. */
export const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

export const smoothstep = (t: number) => t * t * (3 - 2 * t);
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
export const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
/** Arrives, overshoots slightly, settles. */
export const easeOutBack = (t: number, s = 1.2) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;

/** Deterministic PRNG so every load (and every rendered frame) is identical. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
