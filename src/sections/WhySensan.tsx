import { useRef } from 'react';
import { gsap, useGSAP } from '../animation/gsap';
import { addFragments } from '../animation/fragments';
import { FragmentText } from '../components/FragmentText';
import { SectionLabel } from '../components/SectionLabel';
import { principles } from '../content/principles';
import { copy } from '../content/copy';
import { prefersReducedMotion } from '../lib/deviceTier';

/** Asymmetric spans: the grid reads as engineered, not templated. */
const SPANS = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-7'];

/** Why SENSAN — brand positioning. Principles, not certifications. */
export function WhySensan() {
  const section = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = section.current;
      if (!root || prefersReducedMotion()) return;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.querySelector('.why-headline'), start: 'top 82%', end: 'top 30%', scrub: 0.8 },
      });
      tl.to({}, { duration: 1 }, 0);
      const lines = root.querySelectorAll('.why-line');
      addFragments(tl, lines[0] ?? null, 'in', 0, 0.62, { seed: 71, spread: 0.8 });
      addFragments(tl, lines[1] ?? null, 'in', 0.3, 0.62, { seed: 83, spread: 0.8 });
    },
    { scope: section },
  );

  return (
    <section ref={section} id="why-sensan" aria-labelledby="why-title" className="relative overflow-hidden bg-obsidian py-[clamp(96px,13vw,190px)] text-chrome">
      <div className="drafting-grid-dark pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="shell relative">
        <SectionLabel number="06" label="Why SENSAN" />
        <h2 id="why-title" className="why-headline mt-10 font-display text-display-xl font-medium">
          {copy.why.lines.map((line) => (
            <FragmentText key={line} text={line} className="why-line block" />
          ))}
        </h2>

        <div className="mt-20 grid border-t border-hairline lg:mt-28 lg:grid-cols-12">
          {principles.map((p, i) => (
            <article
              key={p.number}
              data-reveal
              className={`group relative border-b border-hairline py-12 lg:px-10 lg:py-16 ${SPANS[i]} ${i % 2 === 0 ? 'lg:border-r lg:pl-0' : ''}`}
            >
              <p className="outline-chrome font-display text-[clamp(5rem,9vw,8.5rem)] leading-[0.8] font-medium tracking-[-0.04em] transition-[-webkit-text-stroke-color] duration-700 group-hover:[-webkit-text-stroke-color:rgb(243_243_241/0.9)]">
                {p.number}
              </p>
              <h3 className="metal-text mt-8 font-display text-display-md font-medium">{p.title}</h3>
              <p className="mt-4 max-w-md text-[16px] leading-relaxed text-silver">{p.body}</p>
            </article>
          ))}
        </div>
        <p data-reveal className="label mt-8 text-fog">
          {copy.why.note}
        </p>
      </div>
    </section>
  );
}
