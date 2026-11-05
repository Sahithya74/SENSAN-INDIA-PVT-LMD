/**
 * Picks how the hero is rendered on this device.
 *
 *   webgl-full  desktop: real-time scene with shadows
 *   webgl-lite  tablets / modest desktops: no shadows, less dust, lower DPR
 *   frames      phones, Save-Data, low-memory devices, no WebGL2: a canvas
 *               frame sequence rendered from the same scene
 *   static      prefers-reduced-motion: final composition, no pinning
 *
 * `?tier=<name>` forces a tier (used by the QA scripts).
 */
export type HeroTier = 'webgl-full' | 'webgl-lite' | 'frames' | 'static';

const TIERS: HeroTier[] = ['webgl-full', 'webgl-lite', 'frames', 'static'];

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function detectHeroTier(): HeroTier {
  const forced = new URLSearchParams(window.location.search).get('tier') as HeroTier | null;
  if (forced && TIERS.includes(forced)) return forced;

  if (prefersReducedMotion()) return 'static';

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return 'frames';

  const width = window.innerWidth;
  const height = window.innerHeight;
  if (Math.min(width, height) < 600) return 'frames';
  if (!supportsWebGL2()) return 'frames';

  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 8;
  if (memory <= 2 || cores <= 2) return 'frames';

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (coarse || width < 1200 || cores <= 4 || memory <= 4) return 'webgl-lite';
  return 'webgl-full';
}

function supportsWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export type Orientation = 'landscape' | 'portrait';

export function viewportOrientation(): Orientation {
  return window.innerWidth / window.innerHeight < 0.9 ? 'portrait' : 'landscape';
}
