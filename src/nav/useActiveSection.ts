import { useEffect, useState } from 'react';

/**
 * The section crossing the middle of the viewport. A thin observation band
 * (rootMargin −50%/−50%) means exactly one section is "current" at a time.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    const targets = ['top', ...ids].map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active === 'top' ? null : active;
}
