import { Fragment, useRef, type PointerEvent } from 'react';
import { SectionLabel } from '../components/SectionLabel';
import { RevealText } from '../components/RevealText';
import { directors, type Director } from '../content/directors';
import { company } from '../content/company';
import { copy } from '../content/copy';
import portraitManifest from '../content/generated/portraits.json';
import { asset, assetSrcSet } from '../lib/asset';

interface PortraitAsset {
  alt: string;
  width: number;
  height: number;
  avif: string;
  webp: string;
  fallback: string;
}
const portraits = portraitManifest as Record<string, PortraitAsset | undefined>;

/** Measurement rule with ticks, set alongside each portrait like a drawing annotation. */
function Rule() {
  return (
    <div className="absolute top-0 bottom-0 -left-6 hidden w-3 flex-col justify-between lg:flex" aria-hidden="true">
      {Array.from({ length: 21 }, (_, i) => (
        <span key={i} className={`block h-px bg-silver/50 ${i % 5 === 0 ? 'w-3' : 'w-1.5'}`} />
      ))}
    </div>
  );
}

function Portrait({ director }: { director: Director }) {
  const frame = useRef<HTMLDivElement>(null);
  const photo = portraits[director.slug];

  // A subtle tilt (≤ 4°) toward the cursor — the frame, never the photograph, moves.
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || !frame.current) return;
    const r = frame.current.getBoundingClientRect();
    const x = (event.clientX - r.left) / r.width - 0.5;
    const y = (event.clientY - r.top) / r.height - 0.5;
    frame.current.style.transform = `perspective(1200px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  };
  const onLeave = () => {
    if (frame.current) frame.current.style.transform = '';
  };

  return (
    <div className="relative">
      <Rule />
      <div data-mask className="relative">
        <div ref={frame} onPointerMove={onMove} onPointerLeave={onLeave} className="portrait-frame light-sweep aspect-[4/5]">
          {photo ? (
            <picture>
              <source type="image/avif" srcSet={assetSrcSet(photo.avif)} sizes="(min-width: 1024px) 50vw, 100vw" />
              <source type="image/webp" srcSet={assetSrcSet(photo.webp)} sizes="(min-width: 1024px) 50vw, 100vw" />
              <img
                src={asset(photo.fallback)}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-[110%] w-full -translate-y-[5%] object-cover"
                data-parallax="4"
              />
            </picture>
          ) : (
            <div className="brushed absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              <span className="h-12 w-px bg-gradient-to-b from-transparent to-silver/60" aria-hidden="true" />
              <p className="label text-chrome">Portrait to be added</p>
              <p className="label text-fog">{director.name}</p>
            </div>
          )}
          <span className="label absolute bottom-4 left-4 text-chrome/80">{director.designation}</span>
        </div>
      </div>
    </div>
  );
}

function DirectorRow({ director, index }: { director: Director; index: number }) {
  const flipped = index % 2 === 1;
  return (
    <article aria-labelledby={`director-${director.slug}`} className="grid items-center gap-10 lg:grid-cols-12 lg:gap-20">
      <div className={`lg:col-span-7 ${flipped ? 'lg:order-2' : ''}`}>
        <Portrait director={director} />
      </div>
      <div className={`lg:col-span-5 ${flipped ? 'lg:order-1 lg:text-right' : ''}`}>
        <p data-reveal className="label text-fog">
          {String(index + 1).padStart(2, '0')} · {director.designation}
        </p>
        <RevealText as="h3" id={`director-${director.slug}`} className="metal-text mt-6 font-display text-display-lg font-medium">
          {director.nameLines.map((line, i) => (
            <Fragment key={line}>
              {line}
              {i < director.nameLines.length - 1 && <br />}
            </Fragment>
          ))}
        </RevealText>
        <p data-reveal className="mt-6 text-[15px] leading-relaxed text-silver">
          {director.designation}, {company.displayName}
        </p>
      </div>
    </article>
  );
}

/** 04 — Leadership: an editorial layout for the registered directors. */
export function Leadership() {
  return (
    <section id="leadership" aria-labelledby="leadership-title" className="relative overflow-hidden bg-graphite py-[clamp(96px,13vw,190px)] text-chrome">
      <div className="shell relative">
        <div className="max-w-3xl">
          <SectionLabel number="04" label="Leadership" />
          <RevealText as="h2" className="metal-text mt-8 font-display text-display-xl font-medium" id="leadership-title">
            {copy.leadership.heading}
          </RevealText>
          <p data-reveal className="mt-8 max-w-lg text-[17px] leading-relaxed text-silver">
            {copy.leadership.body}
          </p>
        </div>
        <div className="mt-20 space-y-28 lg:mt-28 lg:space-y-40">
          {directors.map((director, i) => (
            <DirectorRow key={director.slug} director={director} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
