import { useEffect, useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { FragmentText } from '../components/FragmentText';
import { Wordmark } from '../brand/Wordmark';
import { HERO_STAGES, stageIndexAt } from '../animation/heroStages';
import { scrollToTarget } from '../animation/smoothScroll';
import { heroProgress } from '../lib/store';
import { company } from '../content/company';
import { copy } from '../content/copy';

interface HeroOverlayProps {
  animated: boolean;
  showDomWordmark: boolean;
}

/**
 * The typographic layers over the construction scene. Each layer is animated
 * independently by the hero timeline (see Hero.tsx); this component only
 * renders them and keeps the documentary HUD in sync with progress.
 */
export function HeroOverlay({ animated, showDomWordmark }: HeroOverlayProps) {
  const stageNumber = useRef<HTMLSpanElement>(null);
  const stageLabel = useRef<HTMLSpanElement>(null);
  const stageCaption = useRef<HTMLSpanElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!animated) return;
    let current = -1;
    return heroProgress.subscribe((p) => {
      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
      if (percent.current) percent.current.textContent = String(Math.round(p * 100)).padStart(3, '0');
      const index = stageIndexAt(p);
      if (index === current) return;
      current = index;
      const stage = HERO_STAGES[index];
      if (stageNumber.current) stageNumber.current.textContent = stage.number;
      if (stageLabel.current) stageLabel.current.textContent = stage.label;
      if (stageCaption.current) stageCaption.current.textContent = stage.caption;
    });
  }, [animated]);

  const hiddenUntilAnimated = animated ? { opacity: 0, visibility: 'hidden' as const } : undefined;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-chrome">
      <h1 className="sr-only">
        {company.displayName} — {copy.hero.tagline}
      </h1>

      {animated && (
        <>
          <div className="hero-line-1 hero-text-shadow absolute inset-x-0 top-[60%] px-6 text-center tall:top-[64%]">
            <FragmentText
              text={copy.hero.lines[0]}
              className="font-display text-[clamp(1.55rem,3.2vw,3rem)] leading-[1.06] font-medium tracking-[-0.01em]"
            />
          </div>
          <div className="hero-line-2 hero-text-shadow absolute inset-x-0 top-[60%] px-6 text-center tall:top-[64%]">
            <FragmentText
              text={copy.hero.lines[1]}
              className="font-display text-[clamp(1.55rem,3.2vw,3rem)] leading-[1.06] font-medium tracking-[-0.01em]"
            />
          </div>
          <div className="hero-line-3 hero-text-shadow absolute inset-x-0 top-[40.5%] px-6 text-center tall:top-[24%]">
            <FragmentText
              text={copy.hero.lines[2]}
              className="font-display text-[clamp(1.3rem,2.5vw,2.35rem)] leading-[1.1] font-medium tracking-[-0.005em]"
            />
          </div>
        </>
      )}

      {showDomWordmark && (
        <div className="hero-dom-wordmark absolute top-1/2 left-1/2 w-[min(76vw,900px)] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_24px_40px_rgba(0,0,0,0.6)]">
          <Wordmark decorative />
        </div>
      )}

      <div
        className="hero-lockup hero-text-shadow absolute inset-x-0 bottom-[10%] flex flex-col items-center px-6 text-center tall:bottom-[17%]"
        style={hiddenUntilAnimated}
      >
        <p className="hero-lockup-name font-display text-[clamp(0.66rem,1.05vw,0.95rem)] font-medium tracking-[0.42em] text-chrome">
          {company.legalNameSuffix}
        </p>
        <span className="hero-lockup-rule my-4 block h-px w-24 bg-gradient-to-r from-transparent via-silver to-transparent" />
        <FragmentText
          text={copy.hero.tagline.toUpperCase()}
          className="hero-tagline font-display text-[clamp(0.95rem,1.7vw,1.45rem)] font-medium tracking-[0.08em] text-balance"
        />
      </div>

      {animated && (
        <>
          <div className="hero-hud absolute bottom-7 left-5 w-[min(300px,44vw)] sm:left-8" style={hiddenUntilAnimated}>
            <p className="label flex items-baseline gap-3 text-chrome">
              <span ref={stageNumber}>00</span>
              <span className="h-px w-5 translate-y-[-3px] bg-silver/50" />
              <span ref={stageLabel}>Origin</span>
            </p>
            <p className="mt-2 hidden text-[13px] leading-snug text-fog sm:block">
              <span ref={stageCaption} />
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="hero-progress flex-1">
                <span ref={bar} />
              </span>
              <span ref={percent} className="label text-fog tabular-nums">
                000
              </span>
            </div>
          </div>

          <div className="hero-cue absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
            <span className="label text-fog">{copy.hero.scrollCue}</span>
            <span className="hero-cue-line" />
          </div>

          <a
            href="#company"
            className="hero-skip label pointer-events-auto absolute right-5 bottom-7 flex items-center gap-2 text-fog transition-colors hover:text-porcelain sm:right-8"
            onClick={(event) => {
              event.preventDefault();
              scrollToTarget('#company');
            }}
          >
            {copy.hero.skip}
            <ArrowDown size={13} strokeWidth={1.5} aria-hidden="true" />
          </a>
        </>
      )}
    </div>
  );
}
