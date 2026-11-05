/**
 * Central animation configuration. Section components read their eases,
 * durations and scroll lengths from here so the whole site moves with one
 * rhythm.
 */
export const EASE = {
  /** Heavy, deliberate — structural members moving into place. */
  structural: 'power3.inOut',
  /** Fast arrival, long settle — reveals and text. */
  reveal: 'expo.out',
  /** A small overshoot for parts locking into alignment. */
  settle: 'back.out(1.4)',
  exit: 'power2.in',
} as const;

export const DURATION = {
  reveal: 1.2,
  stagger: 0.06,
  hover: 0.6,
} as const;

/** Extra scroll distance (in svh) the pinned hero consumes, by device class. */
export const HERO_SCROLL_VH = {
  desktop: 520,
  tablet: 440,
  mobile: 360,
} as const;

/** Scrub smoothing (seconds of catch-up) for the hero timeline. */
export const HERO_SCRUB = 0.9;

/** Where pinned, horizontally-travelling sections are used; below it they are rebuilt for touch. */
export const HORIZONTAL_QUERY = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';

export type DeviceClass = keyof typeof HERO_SCROLL_VH;

export function deviceClass(width = window.innerWidth): DeviceClass {
  if (width < 768) return 'mobile';
  if (width < 1200) return 'tablet';
  return 'desktop';
}
