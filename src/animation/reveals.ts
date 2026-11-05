import { gsap, ScrollTrigger } from './gsap';
import { EASE } from './config';

/**
 * Site-wide scroll reveals, batched so dozens of elements share a handful of
 * triggers:
 *   data-reveal            rises and fades in
 *   data-mask="up|left"    unmasks in that direction (images, drawings, panels)
 * Hidden states only apply under html.motion-ok, which is set here — so
 * without JavaScript, or with reduced motion, everything is simply visible.
 */
export function initScrollReveals(): () => void {
  const root = document.documentElement;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  root.classList.add('motion-ok');

  const triggers = [
    ...ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: EASE.reveal, stagger: 0.08, overwrite: true }),
    }),
    ...ScrollTrigger.batch('[data-mask]', {
      start: 'top 85%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', stagger: 0.12, overwrite: true }),
    }),
  ];

  // data-parallax="8": drifts ±8 % against the scroll inside its (overflow-hidden) parent.
  const parallax = gsap.utils.toArray<HTMLElement>('[data-parallax]').map((el) => {
    const amount = Number(el.dataset.parallax) || 8;
    return gsap.fromTo(
      el,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  return () => {
    triggers.forEach((t) => t.kill());
    parallax.forEach((t) => t.scrollTrigger?.kill());
    root.classList.remove('motion-ok');
  };
}
