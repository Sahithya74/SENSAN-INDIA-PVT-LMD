import { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { gsap, useGSAP } from '../animation/gsap';
import { Wordmark } from '../brand/Wordmark';
import { RevealText } from '../components/RevealText';
import { SectionLabel } from '../components/SectionLabel';
import { ContactForm } from './contact/ContactForm';
import { company } from '../content/company';
import { copy } from '../content/copy';
import { mulberry32 } from '../hero/scene/math';
import { prefersReducedMotion } from '../lib/deviceTier';

/**
 * 07 — Contact and the final brand moment: the wordmark's members fly back
 * together as you arrive, echoing the opening sequence.
 */
export function Contact() {
  const section = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = section.current;
      if (!root || prefersReducedMotion()) return;
      const r = mulberry32(505);
      gsap.fromTo(
        root.querySelectorAll('.contact-wordmark .wm-member'),
        {
          x: () => (r() - 0.5) * 520,
          y: () => -60 - r() * 260,
          rotation: () => (r() - 0.5) * 120,
          opacity: 0,
          transformOrigin: '50% 50%',
        },
        {
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          ease: 'power3.out',
          stagger: 0.02,
          scrollTrigger: { trigger: root.querySelector('.contact-wordmark'), start: 'top 92%', end: 'top 38%', scrub: 0.8 },
        },
      );
    },
    { scope: section },
  );

  return (
    <section ref={section} id="contact" aria-labelledby="contact-title" className="relative overflow-hidden bg-obsidian pt-[clamp(96px,12vw,170px)] pb-24 text-chrome">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60%] bg-[radial-gradient(60%_70%_at_50%_0%,rgba(78,84,92,0.35),transparent_70%)]" aria-hidden="true" />
      <div className="shell relative">
        <div className="contact-wordmark mx-auto w-[min(1100px,100%)] drop-shadow-[0_30px_50px_rgba(0,0,0,0.55)]">
          <Wordmark depth={8} />
        </div>
        <p className="label mt-6 text-center tracking-[0.42em] text-silver">{company.legalNameSuffix}</p>

        <div className="mt-24 grid gap-16 lg:mt-32 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <SectionLabel number="07" label="Contact" />
            <RevealText as="h2" className="metal-text mt-8 font-display text-display-lg font-medium" id="contact-title">
              {copy.contact.heading}
            </RevealText>

            <dl className="mt-12 space-y-8 text-[15px] leading-relaxed">
              <div data-reveal>
                <dt className="label text-fog">Registered office</dt>
                <dd className="mt-2 text-chrome">
                  <address className="not-italic">
                    {company.registeredOffice.lines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </dd>
              </div>
              <div data-reveal>
                <dt className="label text-fog">Email</dt>
                <dd className="mt-2">
                  <a href={`mailto:${company.email}`} className="group inline-flex items-center gap-2 text-porcelain underline decoration-silver/30 underline-offset-[6px] transition-colors hover:decoration-porcelain">
                    {company.email}
                    <ArrowUpRight size={15} strokeWidth={1.5} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                  </a>
                </dd>
              </div>
              {company.phone && (
                <div data-reveal>
                  <dt className="label text-fog">Phone</dt>
                  <dd className="mt-2">
                    <a href={`tel:${company.phone.replace(/\s/g, '')}`} className="text-porcelain">
                      {company.phone}
                    </a>
                  </dd>
                </div>
              )}
              {company.social.length > 0 && (
                <div data-reveal>
                  <dt className="label text-fog">Follow</dt>
                  <dd className="mt-2 flex flex-wrap gap-5">
                    {company.social.map((s) => (
                      <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className="text-porcelain underline underline-offset-4">
                        {s.label}
                      </a>
                    ))}
                  </dd>
                </div>
              )}
            </dl>

            <div data-reveal className="metal-border brushed mt-12 rounded-sm p-7">
              <p className="label text-chrome">{copy.contact.enquiryTitle}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-silver">{copy.contact.enquiryBody}</p>
            </div>
          </div>

          <div className="lg:col-span-7 lg:pt-3">
            <div data-reveal className="metal-border rounded-sm bg-graphite/35 p-[clamp(24px,4vw,48px)] backdrop-blur-sm">
              <p className="label mb-8 text-fog">Send an enquiry</p>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
