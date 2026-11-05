import type { Vector3 } from 'three';
import type { Orientation } from '../../lib/deviceTier';
import { lerp, smoothstep } from './math';

type V3 = readonly [number, number, number];
interface Keyframe {
  p: number;
  pos: V3;
  look: V3;
  /** Vertical field of view at the reference aspect ratio. */
  fov: number;
}

/**
 * The documentary camera. Landscape is composed for 16:9; portrait is a
 * separate path composed for 9:16 phones rather than a crop of landscape.
 */
const LANDSCAPE: Keyframe[] = [
  { p: 0.0, pos: [-4, 7, 40], look: [6, 8.2, 15], fov: 32 },
  { p: 0.07, pos: [-8, 8.5, 46], look: [7, 7.8, 13], fov: 32 },
  { p: 0.17, pos: [-46, 28, 62], look: [22, 0, 2], fov: 32 },
  { p: 0.26, pos: [-34, 10, 46], look: [24, 5, 0], fov: 32 },
  { p: 0.36, pos: [-22, 2.2, 30], look: [24, 10.5, 0], fov: 34 },
  { p: 0.46, pos: [-14, 9, 36], look: [26, 13.5, 0], fov: 32 },
  { p: 0.56, pos: [-30, 24, 46], look: [30, 13, 0], fov: 32 },
  { p: 0.68, pos: [-10, 19, 52], look: [38, 12, 0], fov: 32 },
  { p: 0.8, pos: [-34, 46, 66], look: [36, 8, -4], fov: 32 },
  { p: 0.89, pos: [15, 17, 82], look: [15, 10, 0], fov: 32 },
  { p: 0.97, pos: [15, 9.6, 51], look: [15, 9.4, 0], fov: 32 },
  { p: 1.0, pos: [15, 9.6, 50], look: [15, 9.4, 0], fov: 32 },
];

const PORTRAIT: Keyframe[] = [
  { p: 0.0, pos: [-1, 6.5, 46], look: [7, 8.4, 15], fov: 52 },
  { p: 0.07, pos: [-5, 8, 52], look: [8, 8, 13], fov: 52 },
  { p: 0.17, pos: [-40, 34, 76], look: [18, 0, 0], fov: 50 },
  { p: 0.26, pos: [-30, 12, 56], look: [20, 6, 0], fov: 50 },
  { p: 0.36, pos: [-16, 1.8, 36], look: [20, 11, 0], fov: 54 },
  { p: 0.46, pos: [-8, 10, 44], look: [22, 14, 0], fov: 52 },
  { p: 0.56, pos: [-24, 28, 58], look: [26, 13, 0], fov: 50 },
  { p: 0.68, pos: [-4, 22, 62], look: [32, 12, 0], fov: 50 },
  { p: 0.8, pos: [-36, 66, 96], look: [32, 8, -4], fov: 50 },
  { p: 0.89, pos: [15, 14, 92], look: [15, 10, 0], fov: 50 },
  { p: 0.97, pos: [15, 6.5, 66], look: [15, 10.5, 0], fov: 50 },
  { p: 1.0, pos: [15, 6.5, 65], look: [15, 10.5, 0], fov: 50 },
];

const REFERENCE_ASPECT: Record<Orientation, number> = { landscape: 16 / 9, portrait: 9 / 16 };

const catmull = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};

function sample(frames: Keyframe[], key: 'pos' | 'look', k: number, u: number, out: Vector3) {
  const a = frames[Math.max(0, k - 1)][key];
  const b = frames[k][key];
  const c = frames[Math.min(frames.length - 1, k + 1)][key];
  const d = frames[Math.min(frames.length - 1, k + 2)][key];
  out.set(catmull(a[0], b[0], c[0], d[0], u), catmull(a[1], b[1], c[1], d[1], u), catmull(a[2], b[2], c[2], d[2], u));
}

/**
 * Writes the camera position and look target for progress p and returns the
 * vertical FOV, widened when the viewport is narrower than the reference so
 * the horizontal framing (the portal of piers at the end) is preserved.
 */
export function sampleCamera(p: number, orientation: Orientation, aspect: number, pos: Vector3, look: Vector3): number {
  const frames = orientation === 'portrait' ? PORTRAIT : LANDSCAPE;
  let k = 0;
  while (k < frames.length - 2 && p > frames[k + 1].p) k++;
  const a = frames[k];
  const b = frames[k + 1];
  const raw = Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p)));
  const u = lerp(raw, smoothstep(raw), 0.5);
  sample(frames, 'pos', k, u, pos);
  sample(frames, 'look', k, u, look);

  const fov = lerp(a.fov, b.fov, u);
  const widen = Math.max(1, REFERENCE_ASPECT[orientation] / aspect);
  const rad = (fov * Math.PI) / 180;
  return Math.min(70, (2 * Math.atan(Math.tan(rad / 2) * widen) * 180) / Math.PI);
}
