import { useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../animation/gsap';
import { prefersReducedMotion } from '../lib/deviceTier';

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  /** Seconds for one full loop at rest. */
  duration?: number;
  reverse?: boolean;
}

/**
 * A seamless loop that never ends: the content is rendered twice and the
 * track slides by exactly one copy. Scrolling speeds it up and turns it with
 * the scroll direction, then it eases back to its resting pace.
 */
export function Marquee({ children, className = '', duration = 40, reverse = false }: MarqueeProps) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!track.current || prefersReducedMotion()) return;
      const loop = gsap.fromTo(
        track.current,
        { xPercent: reverse ? -50 : 0 },
        { xPercent: reverse ? 0 : -50, duration, ease: 'none', repeat: -1 },
      );
      let direction = 1;
      const trigger = ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          if (self.direction !== direction) direction = self.direction;
          const boost = Math.min(5, Math.abs(self.getVelocity()) / 350);
          gsap.to(loop, { timeScale: direction * (1 + boost), duration: 0.25, overwrite: true });
          gsap.to(loop, { timeScale: direction, duration: 1.2, delay: 0.25, ease: 'power2.out' });
        },
      });
      return () => trigger.kill();
    },
    { scope: root },
  );

  return (
    <div ref={root} className={`overflow-hidden ${className}`}>
      <div ref={track} className="flex w-max">
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
