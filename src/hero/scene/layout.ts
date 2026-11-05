/**
 * Dimensions of the viaduct, in metres. The structure runs along +x; the
 * camera works from the +z side. The span centred on FOCUS_X frames the
 * wordmark at the end of the sequence.
 */
export const SPAN = 30;
export const PIER_XS = Array.from({ length: 13 }, (_, i) => (i - 4) * SPAN); // −120 … 240
export const SPAN_CENTRES = PIER_XS.slice(0, -1).map((x) => x + SPAN / 2);
export const FOCUS_X = 15;

export const SLAB_TOP = 0.45;
export const FOOTING_TOP = 2.0;
export const PIER_TOP = 11.0;
export const CAP_TOP = 13.2;
export const GIRDER_DEPTH = 1.6;
export const DECK_THICKNESS = 0.35;
export const DECK_TOP = CAP_TOP + GIRDER_DEPTH + DECK_THICKNESS;
export const DECK_WIDTH = 16.4;
export const GIRDER_ZS = [-6, -3, 0, 3, 6];
export const BARRIER_Z = DECK_WIDTH / 2 - 0.35;

/** Traffic lanes: z offset and direction of travel along x. */
export const LANES = [
  { z: -5.4, dir: -1 },
  { z: -1.9, dir: -1 },
  { z: 1.9, dir: 1 },
  { z: 5.4, dir: 1 },
] as const;

export const X_MIN = PIER_XS[0];
export const X_MAX = PIER_XS[PIER_XS.length - 1];

/**
 * 0 near the focus span, 1 at the far ends: assembly travels outward from
 * where the camera is looking, like a construction wave.
 */
export const wave = (x: number) => Math.min(1, Math.abs(x - FOCUS_X) / 180);
