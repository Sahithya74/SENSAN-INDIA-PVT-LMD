import { useEffect, useRef, type MouseEvent } from 'react';
import { X } from 'lucide-react';
import { gsap } from '../animation/gsap';
import { scrollToTarget, setScrollLocked } from '../animation/smoothScroll';
import { BrandSymbol } from '../brand/BrandSymbol';
import { navigation } from '../content/navigation';
import { company } from '../content/company';

interface MobileMenuProps {
  open: boolean;
  active: string | null;
  onClose: () => void;
}

/** Full-screen menu for touch devices: large targets, focus trapped, Esc to close. */
export function MobileMenu({ open, active, onClose }: MobileMenuProps) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const opened = useRef(false);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;

    if (!open) {
      if (!opened.current) return;
      opened.current = false;
      setScrollLocked(false);
      gsap.to(el, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 0.5,
        ease: 'power3.in',
        onComplete: () => gsap.set(el, { display: 'none' }),
      });
      return;
    }

    opened.current = true;
    setScrollLocked(true);
    gsap.set(el, { display: 'flex' });
    gsap.fromTo(el, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'expo.out' });
    gsap.fromTo(
      el.querySelectorAll('[data-menu-item]'),
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: 0.05, delay: 0.12 },
    );
    el.querySelector<HTMLElement>('[data-menu-close]')?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(el.querySelectorAll<HTMLElement>('a[href], button'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (id: string) => (event: MouseEvent) => {
    event.preventDefault();
    setScrollLocked(false);
    scrollToTarget(`#${id}`);
    close.current();
  };

  return (
    <div
      ref={panel}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="hero-blueprint pointer-events-auto fixed inset-0 z-[60] hidden flex-col px-5 pt-5 pb-8"
      style={{ clipPath: 'inset(0% 0% 100% 0%)' }}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-3">
          <BrandSymbol mode="assembled" className="h-[22px] w-auto" />
          <span className="metal-text font-display text-[13px] font-semibold tracking-[0.34em]">SENSAN</span>
        </span>
        <button
          type="button"
          data-menu-close
          onClick={() => close.current()}
          aria-label="Close menu"
          className="metal-border grid h-11 w-11 place-items-center rounded-full text-chrome"
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      <nav aria-label="Mobile" className="mt-14 flex-1">
        <ol className="space-y-1">
          {navigation.map((item, i) => (
            <li key={item.id} data-menu-item>
              <a
                href={`#${item.id}`}
                onClick={go(item.id)}
                aria-current={active === item.id ? 'location' : undefined}
                className="flex items-baseline gap-4 border-b border-hairline py-4"
              >
                <span className="label text-fog">{String(i + 1).padStart(2, '0')}</span>
                <span
                  className={`font-display text-[2.1rem] leading-none font-medium tracking-[-0.02em] ${
                    active === item.id ? 'metal-text' : 'text-chrome'
                  }`}
                >
                  {item.label}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div data-menu-item className="space-y-1 text-[13px] text-fog">
        <p>{company.displayName}</p>
        <a href={`mailto:${company.email}`} className="text-chrome underline decoration-hairline underline-offset-4">
          {company.email}
        </a>
      </div>
    </div>
  );
}
