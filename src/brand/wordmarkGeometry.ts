/**
 * The SENSAN wordmark, built from structural members.
 *
 * Each letter is assembled from chamfered bars separated by hairline "joint"
 * seams, exactly as a structure is assembled from members. The same polygons
 * drive the SVG wordmark, the nav symbol and the extruded 3D wordmark in the
 * hero, so the identity is literally the thing that gets built.
 *
 * Units: cap height = 100, y grows downward (SVG space). Design rules: stroke
 * 18, seam 1.6, the outer top-left and bottom-right corners are chamfered — a
 * forward-leaning cut that reads as motion.
 */
export type Point = readonly [number, number];

export interface Member {
  /** Letter index within SENSAN (0–5). */
  letter: number;
  /** Convex polygon, clockwise, in wordmark units. */
  points: Point[];
}

export const CAP_HEIGHT = 100;
const T = 18;
const SEAM = 1.6;
const CH = 12; // corner chamfer
const GAP = 16; // letter spacing

const rect = (x0: number, y0: number, x1: number, y1: number): Point[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];

type Glyph = { width: number; members: Point[][] };

const S: Glyph = {
  width: 72,
  members: [
    [[CH, 0], [72, 0], [72, T], [0, T], [0, CH]],
    rect(0, T + SEAM, T, 41 - SEAM),
    rect(0, 41, 72, 59),
    rect(72 - T, 59 + SEAM, 72, 82 - SEAM),
    [[0, 82], [72, 82], [72, 100 - CH], [72 - CH, 100], [0, 100]],
  ],
};

const E: Glyph = {
  width: 62,
  members: [
    [[CH, 0], [T, 0], [T, 100], [0, 100], [0, CH]],
    rect(T + SEAM, 0, 62, T),
    rect(T + SEAM, 41, 56, 59),
    [[T + SEAM, 82], [62, 82], [62, 100 - CH], [62 - CH, 100], [T + SEAM, 100]],
  ],
};

const N: Glyph = {
  width: 74,
  members: [
    [[CH, 0], [T, 0], [T, 100], [0, 100], [0, CH]],
    [[T + SEAM, 0], [T + SEAM + 20, 0], [74 - T - SEAM, 100], [74 - T - SEAM - 20, 100]],
    [[74 - T, 0], [74, 0], [74, 100 - CH], [74 - CH, 100], [74 - T, 100]],
  ],
};

const A: Glyph = {
  width: 74,
  members: [
    [[T, 0], [74 - T, 0], [74, T], [0, T]],
    rect(0, T + SEAM, T, 100),
    [[74 - T, T + SEAM], [74, T + SEAM], [74, 100 - CH], [74 - CH, 100], [74 - T, 100]],
    rect(T + SEAM, 54, 74 - T - SEAM, 70),
  ],
};

const GLYPHS: Glyph[] = [S, E, N, S, A, N];

function build(): { members: Member[]; width: number } {
  const members: Member[] = [];
  let x = 0;
  GLYPHS.forEach((glyph, letter) => {
    for (const poly of glyph.members) {
      members.push({ letter, points: poly.map(([px, py]) => [px + x, py] as const) });
    }
    x += glyph.width + GAP;
  });
  return { members, width: x - GAP };
}

const built = build();

/** All 24 members of the wordmark, left to right. */
export const WORDMARK_MEMBERS: readonly Member[] = built.members;
export const WORDMARK_WIDTH = built.width;

/** The five members of the first S — the brand symbol. */
export const SYMBOL_MEMBERS: readonly Member[] = built.members.filter((m) => m.letter === 0);
export const SYMBOL_WIDTH = S.width;

export const toPath = (points: readonly Point[]) =>
  `M${points.map(([x, y]) => `${round(x)} ${round(y)}`).join('L')}Z`;

/**
 * Side face of a faux extrusion: for a convex member, the convex hull of the
 * polygon and its offset copy is exactly the swept volume's silhouette.
 */
export function extrusionHull(points: readonly Point[], dx: number, dy: number): Point[] {
  const all: Point[] = [...points, ...points.map(([x, y]) => [x + dx, y + dy] as const)];
  return convexHull(all);
}

function convexHull(input: Point[]): Point[] {
  const pts = [...input].sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
  const cross = (o: Point, a: Point, b: Point) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Point[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Point[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

const round = (n: number) => Math.round(n * 100) / 100;
