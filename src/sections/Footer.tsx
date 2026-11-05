import type { MouseEvent } from 'react';
import { BrandSymbol } from '../brand/BrandSymbol';
import { navigation } from '../content/navigation';
import { company } from '../content/company';
import { copy } from '../content/copy';
import { scrollToTarget } from '../animation/smoothScroll';

/** Minimal black footer: silver type, navigation, registered details, the closing line. */
export function Footer() {
  const go = (id: string) => (event: MouseEvent) => {
    event.preventDefault();
    scrollToTarget(`#${id}`);
  };

  return (
    <footer className="border-t border-hairline bg-black pt-20 pb-10 text-silver">
      <div className="shell">
        <p className="max-w-4xl font-display text-[clamp(1.4rem,2.6vw,2.4rem)] leading-[1.2] font-medium tracking-[-0.01em] text-chrome">
          {copy.manifesto}
        </p>

        <div className="mt-16 grid gap-12 border-t border-hairline pt-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <a href="#top" onClick={go('top')} className="inline-flex items-center gap-3" aria-label="SENSAN — back to top">
              <BrandSymbol mode="assembled" className="h-7 w-auto" />
              <span className="metal-text font-display text-[15px] font-semibold tracking-[0.34em]">SENSAN</span>
            </a>
            <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-fog">{company.displayName}</p>
          </div>

          <nav aria-label="Footer" className="md:col-span-3">
            <p className="label text-fog">Navigate</p>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {navigation.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} onClick={go(item.id)} className="text-chrome transition-colors hover:text-porcelain">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <dl className="space-y-4 text-[13px] leading-relaxed md:col-span-4">
            <div>
              <dt className="label text-fog">Registered office</dt>
              <dd className="mt-1.5 text-chrome">{company.registeredOffice.lines.join(', ')}</dd>
            </div>
            <div>
              <dt className="label text-fog">CIN</dt>
              <dd className="mt-1.5 font-mono text-chrome">{company.cin}</dd>
            </div>
            <div>
              <dt className="label text-fog">Incorporated</dt>
              <dd className="mt-1.5 text-chrome">
                {company.incorporated.label} · ROC {company.roc}
              </dd>
            </div>
          </dl>
        </div>

        <div className="label mt-16 flex flex-wrap justify-between gap-4 text-fog">
          <span>© {new Date().getFullYear()} {company.legalName}</span>
          <a href={`mailto:${company.email}`} className="transition-colors hover:text-chrome">
            {company.email}
          </a>
        </div>
      </div>
    </footer>
  );
}
