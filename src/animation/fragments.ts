import { gsap } from './gsap';
import { mulberry32 } from '../hero/scene/math';

type Timeline = gsap.core.Timeline;

interface FragmentOptions {
  /** Same seed → same scatter on every load, so motion is designed, not random. */
  seed: number;
  /** Scales the scatter distance. */
  spread?: number;
}

interface Scatter {
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}

function scatter(count: number, seed: number, piece: 0 | 1, spread: number): Scatter[] {
  const r = mulberry32(seed * 7919 + piece * 104729);
  const sign = piece ? 1 : -1;
  return Array.from({ length: count }, () => ({
    x: ((r() - 0.5) * 140 + sign * 26) * spread,
    y: sign * (24 + r() * 80) * spread,
    z: (r() * 260 - 60) * spread,
    rotationX: (r() - 0.5) * 150,
    rotationY: (r() - 0.5) * 100,
    rotationZ: (r() - 0.5) * 50,
  }));
}

/** A seeded shuffle, returned as each index's rank in the assembly order. */
function ranks(count: number, seed: number): number[] {
  const r = mulberry32(seed);
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const rank = new Array<number>(count);
  order.forEach((index, position) => (rank[index] = position));
  return rank;
}

const ASSEMBLED = { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, opacity: 1 };

function pieces(root: Element) {
  return [root.querySelectorAll<HTMLElement>('.frag-a'), root.querySelectorAll<HTMLElement>('.frag-b')] as const;
}

/**
 * Adds a "fragments assemble" (in) or "fragments disperse" (out) animation
 * for a <FragmentText> to a timeline. `at` and `duration` are in the
 * timeline's units (scroll progress for the hero).
 */
export function addFragments(
  tl: Timeline,
  root: Element | null,
  mode: 'in' | 'out',
  at: number,
  duration: number,
  { seed, spread = 1 }: FragmentOptions,
) {
  if (!root) return;
  const [a, b] = pieces(root);
  const n = a.length;
  if (!n) return;
  const rank = ranks(n, seed);
  const each = duration * 0.5;
  const window = duration - each;
  const stagger = (i: number) => (rank[i] / Math.max(1, n - 1)) * window;

  [a, b].forEach((elements, piece) => {
    const s = scatter(n, seed, piece as 0 | 1, mode === 'out' ? spread * 1.3 : spread);
    const scattered = {
      x: (i: number) => s[i].x,
      y: (i: number) => s[i].y,
      z: (i: number) => s[i].z,
      rotationX: (i: number) => s[i].rotationX,
      rotationY: (i: number) => s[i].rotationY,
      rotationZ: (i: number) => s[i].rotationZ,
      opacity: 0,
    };
    if (mode === 'in') {
      tl.fromTo(elements, scattered, { ...ASSEMBLED, duration: each, ease: 'expo.out', stagger }, at + piece * each * 0.06);
    } else {
      tl.fromTo(
        elements,
        ASSEMBLED,
        { ...scattered, duration: each, ease: 'power2.in', stagger, immediateRender: false },
        at + piece * each * 0.06,
      );
    }
  });
}

/** Standalone time-based assembly (used for the very first line on load). */
export function playFragmentsIn(root: Element | null, options: FragmentOptions & { delay?: number; duration?: number }) {
  const tl = gsap.timeline({ delay: options.delay ?? 0 });
  addFragments(tl, root, 'in', 0, options.duration ?? 2.4, options);
  return tl;
}
