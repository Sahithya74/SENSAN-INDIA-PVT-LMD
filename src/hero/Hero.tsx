import { useRef, useState } from 'react';
import { gsap, useGSAP } from '../animation/gsap';
import { addFragments, playFragmentsIn } from '../animation/fragments';
import { HERO_SCROLL_VH, HERO_SCRUB, deviceClass } from '../animation/config';
import { heroProgress } from '../lib/store';
import type { HeroTier } from '../lib/deviceTier';
import { mulberry32 } from './scene/math';
import { HeroCanvas } from './HeroCanvas';
import { FrameSequence } from './FrameSequence';
import { HeroPoster } from './HeroPoster';
import { HeroOverlay } from './HeroOverlay';

/** What is actually drawing the hero right now. Each failure falls through to the next. */
type Visual = 'webgl' | 'frames' | 'dom' | 'static';

/**
 * The signature sequence. A tall section with a sticky stage: scrolling
 * through it scrubs one master timeline (0–1) that drives the 3D scene (or
 * its frame sequence) and every typographic layer, then releases into the
 * page with the identity complete.
 */
export function Hero({ tier }: { tier: HeroTier }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isStatic = tier === 'static';
  const [visual, setVisual] = useState<Visual>(isStatic ? 'static' : tier === 'frames' ? 'frames' : 'webgl');
  const [liveReady, setLiveReady] = useState(false);
  const [finalPoster, setFinalPoster] = useState<boolean | null>(null);
  const [scrollVh] = useState(() => HERO_SCROLL_VH[deviceClass()]);

  const showDomWordmark = visual === 'dom' || (visual === 'static' && finalPoster === false);

  useGSAP(
    () => {
      const root = sectionRef.current;
      if (!root) return;
      if (isStatic) {
        heroProgress.set(1);
        return;
      }
      const q = gsap.utils.selector(root);
      const one = (selector: string) => root.querySelector(selector);

      let intro: gsap.core.Timeline | null = null;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: HERO_SCRUB },
        onUpdate: () => {
          const p = tl.progress();
          heroProgress.set(p);
          if (intro && p > 0.02) {
            intro.progress(1).kill();
            intro = null;
          }
        },
      });
      tl.to({}, { duration: 1 }, 0);

      // 00 Origin → 01 Foundation
      tl.to(q('.hero-cue'), { autoAlpha: 0, y: 10, duration: 0.025 }, 0.012);
      addFragments(tl, one('.hero-line-1'), 'out', 0.04, 0.05, { seed: 11 });
      tl.fromTo(q('.hero-hud'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.03 }, 0.06);
      addFragments(tl, one('.hero-line-2'), 'in', 0.095, 0.06, { seed: 23 });
      addFragments(tl, one('.hero-line-2'), 'out', 0.22, 0.05, { seed: 29 });

      // 05 Completion → 06 Identity: the sentence is completed by the wordmark.
      addFragments(tl, one('.hero-line-3'), 'in', 0.775, 0.065, { seed: 37 });
      tl.to(q('.hero-hud'), { autoAlpha: 0, y: 8, duration: 0.03 }, 0.86);
      tl.to(q('.hero-skip'), { autoAlpha: 0, duration: 0.03 }, 0.9);

      if (visual === 'dom') {
        const r = mulberry32(99);
        tl.fromTo(
          q('.hero-dom-wordmark .wm-member'),
          {
            x: () => (r() - 0.5) * 640,
            y: () => (r() - 0.5) * 320 - 90,
            rotation: () => (r() - 0.5) * 100,
            opacity: 0,
            transformOrigin: '50% 50%',
          },
          { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.035, ease: 'back.out(1.3)', stagger: 0.0018 },
          0.885,
        );
      }

      tl.to(q('.hero-line-3'), { autoAlpha: 0, y: -16, duration: 0.03, ease: 'power1.in' }, 0.945);
      tl.to(q('.hero-lockup'), { autoAlpha: 1, duration: 0.01 }, 0.92);
      tl.fromTo(
        q('.hero-lockup-name'),
        { autoAlpha: 0, letterSpacing: '0.9em' },
        { autoAlpha: 1, letterSpacing: '0.42em', duration: 0.045, ease: 'power3.out' },
        0.925,
      );
      tl.fromTo(q('.hero-lockup-rule'), { scaleX: 0 }, { scaleX: 1, duration: 0.04, ease: 'power3.inOut' }, 0.93);
      addFragments(tl, one('.hero-tagline'), 'in', 0.94, 0.045, { seed: 41, spread: 0.6 });

      // The first line assembles on arrival, before any scrolling.
      if (window.scrollY < 8) intro = playFragmentsIn(one('.hero-line-1'), { seed: 11, delay: 0.5, duration: 2.6 });
    },
    { scope: sectionRef, dependencies: [isStatic, visual === 'dom'], revertOnUpdate: true },
  );

  return (
    <section
      ref={sectionRef}
      id="top"
      data-visual={visual}
      data-ready={liveReady || isStatic}
      aria-label="Introduction"
      className="relative bg-obsidian"
      style={{ height: isStatic ? '100svh' : `calc(100svh + ${scrollVh}svh)` }}
    >
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {visual === 'dom' ? (
          <div className="hero-blueprint" />
        ) : (
          <HeroPoster
            which={visual === 'static' ? 'final' : 'intro'}
            hidden={liveReady}
            onAvailable={visual === 'static' ? setFinalPoster : undefined}
          />
        )}
        {visual === 'webgl' && (
          <HeroCanvas
            quality={tier === 'webgl-full' ? 'full' : 'lite'}
            onReady={() => setLiveReady(true)}
            onFail={() => setVisual('frames')}
          />
        )}
        {visual === 'frames' && <FrameSequence onReady={() => setLiveReady(true)} onFail={() => setVisual('dom')} />}
        <div className="hero-shade" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="grain" />
        </div>
        <HeroOverlay animated={!isStatic} showDomWordmark={showDomWordmark} />
      </div>
    </section>
  );
}
