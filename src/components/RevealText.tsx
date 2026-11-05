import { useRef, type ElementType, type ReactNode } from 'react';
import { gsap, SplitText, useGSAP } from '../animation/gsap';
import { EASE } from '../animation/config';
import { prefersReducedMotion } from '../lib/deviceTier';

interface RevealTextProps {
  as?: ElementType;
  id?: string;
  className?: string;
  children: ReactNode;
  delay?: number;
}

/**
 * Editorial headline that rises line by line out of a mask as it enters the
 * viewport. SplitText re-splits on resize and font load, so line breaks stay
 * true; screen readers get the unsplit text.
 */
export function RevealText({ as: Tag = 'h2', id, className, children, delay = 0 }: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const split = SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'reveal-line',
        aria: 'auto',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 112,
            duration: 1.25,
            ease: EASE.reveal,
            stagger: 0.09,
            delay,
            scrollTrigger: { trigger: el, start: 'top 86%', once: true },
          }),
      });
      return () => split.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} id={id} className={className}>
      {children}
    </Tag>
  );
}
