import { RevealText } from '../components/RevealText';
import { SectionLabel } from '../components/SectionLabel';
import { RenderImage } from '../components/RenderImage';
import { DomainDrawing } from './drawings/DomainDrawing';
import { company } from '../content/company';
import { copy } from '../content/copy';

const facts = [
  { label: 'Legal name', value: company.legalName },
  { label: 'Corporate identity number', value: company.cin },
  { label: 'Incorporated', value: company.incorporated.label },
  { label: 'Registrar of Companies', value: `ROC ${company.roc}` },
  { label: 'Registered office', value: company.registeredOffice.lines.join(', ') },
  { label: 'Registered activity', value: company.registeredActivity },
];

/** 01 — The company, introduced on a light editorial surface. */
export function Company() {
  return (
    <section id="company" data-surface="light" aria-labelledby="company-title" className="surface-light relative overflow-hidden py-[clamp(96px,13vw,190px)]">
      <div className="drafting-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="shell relative">
        <SectionLabel number="01" label="The company" tone="light" />

        <div className="mt-10 grid gap-14 lg:mt-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <RevealText as="h2" className="metal-text-ink font-display text-display-xl font-medium" id="company-title">
              {copy.company.heading}
            </RevealText>
            <div className="mt-10 max-w-xl space-y-5 text-[17px] leading-relaxed text-industrial lg:mt-14">
              {copy.company.body.map((p) => (
                <p key={p} data-reveal>
                  {p}
                </p>
              ))}
            </div>
          </div>

          <figure className="lg:col-span-5 lg:pt-4">
            <div data-mask className="relative aspect-[4/5] overflow-hidden bg-graphite shadow-[0_40px_80px_-40px_rgba(32,34,38,0.55)]">
              <RenderImage
                name="viaduct-dawn"
                alt="Illustrative render of an elevated highway viaduct at dawn"
                sizes="(min-width: 1024px) 40vw, 100vw"
                parallax={7}
                className="absolute inset-0 h-[116%] w-full -translate-y-[8%] object-cover"
                fallback={<DomainDrawing kind="bridge" className="absolute inset-0 h-full w-full p-8 text-chrome" />}
              />
              <span className="label absolute top-4 left-4 text-chrome/80">Fig. 01</span>
            </div>
            <figcaption className="label mt-4 text-ash">{copy.company.renderCaption}</figcaption>
          </figure>
        </div>

        <div className="mt-20 lg:mt-28">
          <p data-reveal className="label text-ash">
            Registered details
          </p>
          <dl className="mt-5 grid border-t border-hairline-dark sm:grid-cols-2 lg:grid-cols-3">
            {facts.map((fact) => (
              <div key={fact.label} data-reveal className="border-b border-hairline-dark py-6 sm:pr-8">
                <dt className="label text-ash">{fact.label}</dt>
                <dd className="mt-2.5 text-[15px] leading-relaxed text-graphite">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
