import { useRef } from 'react';
import { HorizontalScroller } from '../components/HorizontalScroller';
import { SectionLabel } from '../components/SectionLabel';
import { RevealText } from '../components/RevealText';
import { DomainDrawing } from './drawings/DomainDrawing';
import { domainBasisLabel, domains, type Domain } from '../content/domains';
import { copy } from '../content/copy';
import { useOnScreen } from '../lib/hooks';

function DomainPanel({ domain, total }: { domain: Domain; total: number }) {
  const [ref, seen] = useOnScreen<HTMLElement>();
  return (
    <article
      ref={ref}
      aria-labelledby={`domain-${domain.id}`}
      className="domain-panel flex shrink-0 items-center border-hairline px-[clamp(16px,5vw,72px)] py-16 max-lg:border-t lg:h-full lg:w-[min(88vw,1320px)] lg:border-l lg:py-0"
    >
      <div className="grid w-full items-center gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-5">
          <p className="outline-chrome font-display text-[clamp(4.5rem,10vw,9.5rem)] leading-[0.8] font-medium tracking-[-0.04em]">
            {domain.number}
          </p>
          <p className="label mt-8 text-fog">
            {domain.number} / {String(total).padStart(2, '0')} · {domainBasisLabel[domain.basis]}
          </p>
          <h3 id={`domain-${domain.id}`} className="metal-text mt-4 font-display text-display-lg font-medium">
            {domain.title}
          </h3>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-silver">{domain.summary}</p>
        </div>
        <figure className="lg:col-span-7">
          <div className="domain-frame light-sweep aspect-[16/10] p-[clamp(16px,3vw,40px)] text-chrome">
            <DomainDrawing kind={domain.drawing} active={seen} className="h-full w-full" title={`${domain.title} — conceptual drawing`} />
          </div>
          <figcaption className="label mt-3 flex justify-between text-fog">
            <span>Fig. {domain.number}</span>
            <span>Conceptual drawing</span>
          </figcaption>
        </figure>
      </div>
    </article>
  );
}

/** 02 — Core construction domain: horizontal travel through the six registered domains. */
export function Domains() {
  const visible = domains.filter((d) => d.visible);
  const bar = useRef<HTMLSpanElement>(null);
  const counter = useRef<HTMLSpanElement>(null);

  const onProgress = (p: number) => {
    if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    if (counter.current) {
      const index = Math.min(visible.length, Math.max(1, Math.round(p * visible.length + 0.4)));
      counter.current.textContent = String(index).padStart(2, '0');
    }
  };

  const indicator = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden lg:block" aria-hidden="true">
      <div className="shell flex items-center gap-5 pb-8">
        <span className="label text-fog">
          <span ref={counter} className="text-chrome">
            01
          </span>{' '}
          / {String(visible.length).padStart(2, '0')}
        </span>
        <span className="hero-progress max-w-xs flex-1">
          <span ref={bar} />
        </span>
      </div>
    </div>
  );

  return (
    <div className="relative bg-obsidian text-chrome">
      <HorizontalScroller
        id="domains"
        labelledBy="domains-title"
        mobile="stack"
        onProgress={onProgress}
        overlay={indicator}
        className="drafting-grid-dark"
      >
        <header className="flex shrink-0 flex-col justify-center px-[clamp(16px,5vw,72px)] pt-28 pb-16 lg:h-full lg:w-[min(46vw,700px)] lg:py-0">
          <SectionLabel number="02" label="Core construction domain" />
          <RevealText as="h2" className="metal-text mt-8 font-display text-display-xl font-medium" id="domains-title">
            {copy.domains.heading}
          </RevealText>
          <p data-reveal className="mt-8 max-w-md text-[17px] leading-relaxed text-silver">
            {copy.domains.body}
          </p>
          <p data-reveal className="label mt-10 hidden items-center gap-3 text-fog lg:flex">
            Scroll to travel
            <span className="h-px w-16 bg-gradient-to-r from-silver/60 to-transparent" />
          </p>
        </header>
        {visible.map((domain) => (
          <DomainPanel key={domain.id} domain={domain} total={visible.length} />
        ))}
        <div className="hidden w-[8vw] shrink-0 lg:block" aria-hidden="true" />
      </HorizontalScroller>
    </div>
  );
}
