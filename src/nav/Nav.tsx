import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { Menu } from 'lucide-react';
import { BrandSymbol } from '../brand/BrandSymbol';
import { navigation } from '../content/navigation';
import { scrollToTarget } from '../animation/smoothScroll';
import { heroProgress } from '../lib/store';
import { useActiveSection } from './useActiveSection';
import { SoundToggle } from './SoundToggle';
import { MobileMenu } from './MobileMenu';

const ids = navigation.map((item) => item.id);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Floating glass navigation. During the hero the symbol is still a scatter of
 * members and the links sit back; as the structure completes, the symbol
 * locks together and the SENSAN name slides out beside it.
 */
export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useActiveSection(ids);
  const pill = useRef<HTMLElement>(null);
  const brandName = useRef<HTMLSpanElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const links = useRef<Record<string, HTMLAnchorElement | null>>({});
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(
    () =>
      heroProgress.subscribe((p) => {
        pill.current?.setAttribute('data-phase', p < 0.96 ? 'hero' : 'site');
        // The name slides out of the symbol as the wordmark completes in the hero.
        const reveal = clamp01((p - 0.9) / 0.08);
        const name = brandName.current;
        if (name) {
          name.style.opacity = String(reveal);
          name.style.maxWidth = `${reveal * 92}px`;
          name.style.marginLeft = `${reveal * 12}px`;
        }
      }),
    [],
  );

  useLayoutEffect(() => {
    const bar = indicator.current;
    const link = active ? links.current[active] : null;
    if (!bar) return;
    if (!link) {
      bar.style.opacity = '0';
      return;
    }
    bar.style.opacity = '1';
    bar.style.width = `${link.offsetWidth}px`;
    bar.style.transform = `translateX(${link.offsetLeft}px)`;
  }, [active]);

  const go = (id: string) => (event: MouseEvent) => {
    event.preventDefault();
    scrollToTarget(`#${id}`);
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4">
      <nav
        ref={pill}
        aria-label="Primary"
        data-phase="hero"
        className="nav-pill metal-border pointer-events-auto flex h-[52px] w-full max-w-[860px] items-center justify-between gap-2 rounded-full pr-2 pl-4 md:w-auto md:justify-start"
      >
        <a href="#top" onClick={go('top')} className="flex items-center pr-2" aria-label="SENSAN — back to top">
          <BrandSymbol className="h-[22px] w-auto" />
          <span
            ref={brandName}
            className="metal-text inline-block overflow-hidden font-display text-[13px] font-semibold tracking-[0.34em] whitespace-nowrap"
            style={{ opacity: 0, maxWidth: 0, marginLeft: 0 }}
          >
            SENSAN
          </span>
        </a>

        <span className="mx-2 hidden h-5 w-px bg-hairline md:block" aria-hidden="true" />

        <div className="nav-links relative hidden md:block">
          <ul className="flex items-center">
          {navigation.map((item) => (
            <li key={item.id}>
              <a
                ref={(el) => {
                  links.current[item.id] = el;
                }}
                href={`#${item.id}`}
                onClick={go(item.id)}
                aria-current={active === item.id ? 'location' : undefined}
                className={`nav-link block px-3 py-4 text-[13px] tracking-[0.02em] ${
                  active === item.id ? 'text-porcelain' : 'text-chrome/75 hover:text-porcelain'
                }`}
              >
                {item.label}
              </a>
            </li>
          ))}
          </ul>
          <span ref={indicator} className="nav-indicator" aria-hidden="true" />
        </div>

        <div className="flex items-center md:ml-1">
          <SoundToggle />
          <button
            ref={menuButton}
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full text-chrome md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={18} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      <MobileMenu
        open={menuOpen}
        active={active}
        onClose={() => {
          setMenuOpen(false);
          menuButton.current?.focus();
        }}
      />
    </header>
  );
}
