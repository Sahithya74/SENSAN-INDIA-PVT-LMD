import { useRef, useState } from 'react';
import { ScrollTrigger, useGSAP } from '../animation/gsap';
import { HORIZONTAL_QUERY } from '../animation/config';
import { SectionLabel } from '../components/SectionLabel';
import { RevealText } from '../components/RevealText';
import { ProcessDrawing } from './drawings/ProcessDrawing';
import { processStages } from '../content/process';
import { copy } from '../content/copy';
import { useMediaQuery, useOnScreen } from '../lib/hooks';

const sheet = (n: number) => `Sheet ${String(n + 1).padStart(2, '0')} / ${String(processStages.length).padStart(2, '0')}`;

function Header() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
      <div>
        <SectionLabel number="03" label="Engineering process" tone="light" />
        <RevealText as="h2" className="metal-text-ink mt-6 font-display text-display-lg font-medium" id="process-title">
          {copy.process.heading}
        </RevealText>
      </div>
      <p data-reveal className="label max-w-xs text-ash">
        {copy.process.note}
      </p>
    </div>
  );
}

/** Desktop: a pinned drawing sheet. Scrolling advances the stages along a horizontal timeline. */
function PinnedSheet() {
  const section = useRef<HTMLElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const [stage, setStage] = useState(0);

  useGSAP(
    () => {
      const trigger = ScrollTrigger.create({
        trigger: section.current,
        start: 'top top',
        end: '+=380%',
        pin: true,
        onUpdate: (self) => {
          const next = Math.min(processStages.length - 1, Math.floor(self.progress * processStages.length));
          setStage((prev) => (prev === next ? prev : next));
          if (fill.current) fill.current.style.transform = `scaleX(${self.progress})`;
        },
      });
      return () => trigger.kill();
    },
    { scope: section },
  );

  return (
    <section ref={section} id="process" data-surface="light" aria-labelledby="process-title" className="surface-light relative h-svh overflow-hidden">
      <div className="drafting-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="shell relative flex h-full flex-col pt-24 pb-8">
        <Header />

        <div className="relative mt-8 grid min-h-0 flex-1 grid-cols-12 border border-graphite/20 bg-porcelain/70">
          <div className="col-span-8 flex min-h-0 items-center justify-center p-8 text-graphite">
            <ProcessDrawing stage={stage} className="h-full max-h-[52svh] w-full" />
          </div>
          <div className="relative col-span-4 border-l border-graphite/15">
            {processStages.map((s, i) => (
              <div
                key={s.number}
                aria-hidden={i !== stage}
                className="absolute inset-0 flex flex-col justify-center p-10 transition-all duration-700 ease-[var(--ease-out-expo)]"
                style={{ opacity: i === stage ? 1 : 0, transform: `translateY(${i === stage ? 0 : i < stage ? -24 : 24}px)` }}
              >
                <p className="outline-ink font-display text-[7.5rem] leading-[0.8] font-medium">{s.number}</p>
                <h3 className="mt-8 font-display text-display-md font-medium text-graphite">{s.title}</h3>
                <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-ash">{s.summary}</p>
              </div>
            ))}
            {/* Title block, as on a drawing sheet. */}
            <dl className="label absolute right-0 bottom-0 left-0 grid grid-cols-2 border-t border-graphite/15 text-ash">
              <div className="border-r border-graphite/15 px-4 py-3">
                <dt className="sr-only">Project</dt>
                <dd>SENSAN · Illustrative</dd>
              </div>
              <div className="px-4 py-3 text-right">
                <dt className="sr-only">Sheet</dt>
                <dd className="text-graphite">{sheet(stage)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <ol className="relative mt-7 grid grid-cols-5" aria-label="Process stages">
          <span className="absolute top-[7px] right-[10%] left-[10%] h-px bg-graphite/15" aria-hidden="true" />
          <span
            ref={fill}
            className="absolute top-[7px] right-[10%] left-[10%] h-px origin-left bg-graphite"
            style={{ transform: 'scaleX(0)' }}
            aria-hidden="true"
          />
          {processStages.map((s, i) => (
            <li key={s.number} className="relative flex flex-col items-center text-center" aria-current={i === stage ? 'step' : undefined}>
              <span
                className={`h-[15px] w-[15px] rotate-45 border transition-colors duration-500 ${
                  i <= stage ? 'border-graphite bg-graphite' : 'border-graphite/40 bg-porcelain'
                }`}
              />
              <span className={`label mt-3 transition-colors ${i === stage ? 'text-graphite' : 'text-ash'}`}>
                {s.number} · {s.title}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function StageCard({ index }: { index: number }) {
  const [ref, seen] = useOnScreen<HTMLLIElement>(0.4);
  const s = processStages[index];
  return (
    <li ref={ref} className="border-t border-graphite/15 py-10">
      <div className="flex items-baseline gap-4">
        <span className="outline-ink font-display text-6xl leading-none font-medium">{s.number}</span>
        <h3 className="font-display text-display-md font-medium text-graphite">{s.title}</h3>
      </div>
      <p className="mt-4 text-[16px] leading-relaxed text-ash">{s.summary}</p>
      <div className="mt-6 border border-graphite/15 bg-porcelain/70 p-4 text-graphite">
        <ProcessDrawing stage={seen ? index : -1} className="h-auto w-full" />
        <p className="label mt-2 text-right text-ash">{sheet(index)}</p>
      </div>
    </li>
  );
}

/** Touch and reduced motion: the same sheets as a vertical sequence. */
function StackedSheets() {
  return (
    <section id="process" data-surface="light" aria-labelledby="process-title" className="surface-light relative overflow-hidden py-24">
      <div className="drafting-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="shell relative">
        <Header />
        <ol className="mt-12">
          {processStages.map((s, i) => (
            <StageCard key={s.number} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}

/** 03 — The engineering process (illustrative). */
export function Process() {
  const desktop = useMediaQuery(HORIZONTAL_QUERY);
  return desktop ? <PinnedSheet /> : <StackedSheets />;
}
