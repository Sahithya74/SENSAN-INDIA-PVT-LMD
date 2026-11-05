import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '../animation/gsap';
import { HORIZONTAL_QUERY } from '../animation/config';

interface HorizontalScrollerProps {
  id?: string;
  className?: string;
  trackClassName?: string;
  /** How the panels lay out below the desktop breakpoint. */
  mobile?: 'stack' | 'snap';
  /** 0–1 progress of the horizontal travel (desktop) — for indicators and active states. */
  onProgress?: (progress: number) => void;
  children: ReactNode;
  /** Fixed over the pinned section (progress indicators). */
  overlay?: ReactNode;
  ariaLabel?: string;
  labelledBy?: string;
}

/**
 * Vertical scroll becomes horizontal travel: on desktop the section pins and
 * its track slides sideways by exactly its overflow. Below the breakpoint (or
 * with reduced motion) the panels either stack vertically or become a native,
 * touch-friendly snap carousel — rebuilt for the device, not shrunk.
 */
export function HorizontalScroller({
  id,
  className = '',
  trackClassName = '',
  mobile = 'stack',
  onProgress,
  children,
  overlay,
  ariaLabel,
  labelledBy,
}: HorizontalScrollerProps) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const progressRef = useRef(onProgress);
  progressRef.current = onProgress;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(HORIZONTAL_QUERY, () => {
        const el = track.current;
        if (!el) return;
        const distance = () => Math.max(0, el.scrollWidth - window.innerWidth);
        gsap.to(el, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => progressRef.current?.(self.progress),
          },
        });
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  const mobileLayout =
    mobile === 'snap'
      ? 'max-lg:snap-x max-lg:snap-mandatory max-lg:overflow-x-auto max-lg:overscroll-x-contain'
      : 'max-lg:flex-col';

  return (
    <section ref={section} id={id} aria-label={ariaLabel} aria-labelledby={labelledBy} className={`relative overflow-hidden ${className}`}>
      <div ref={track} className={`flex lg:h-svh lg:w-max lg:flex-nowrap ${mobileLayout} ${trackClassName}`}>
        {children}
      </div>
      {overlay}
    </section>
  );
}
