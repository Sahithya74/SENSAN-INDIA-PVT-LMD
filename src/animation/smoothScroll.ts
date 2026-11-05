import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';

let lenis: Lenis | null = null;

/** Lenis drives the scroll position; GSAP's ticker drives Lenis, so ScrollTrigger and Lenis share one frame clock. */
export function initSmoothScroll(): () => void {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  if (import.meta.env.DEV) (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

  return () => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  };
}

export function scrollToTarget(target: string | HTMLElement | number, options: { immediate?: boolean } = {}) {
  if (lenis) {
    lenis.scrollTo(target, {
      immediate: options.immediate,
      duration: 1.8,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
    });
    return;
  }
  if (typeof target === 'number') {
    window.scrollTo({ top: target });
    return;
  }
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  element?.scrollIntoView();
}

/** Pause scrolling (e.g. while the mobile menu is open). */
export function setScrollLocked(locked: boolean) {
  if (locked) lenis?.stop();
  else lenis?.start();
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}
