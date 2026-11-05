import { Marquee } from '../components/Marquee';
import { copy } from '../content/copy';

/** The seam between the hero and the page: the registered domains, looping without end. */
export function MarqueeBand() {
  return (
    <div className="relative border-y border-hairline bg-obsidian py-7 sm:py-9" aria-hidden="true">
      <Marquee duration={46}>
        {copy.marquee.map((word) => (
          <span key={word} className="flex items-center">
            <span className="outline-chrome px-6 font-display text-[clamp(2.6rem,6vw,5.5rem)] leading-none font-medium tracking-[-0.02em] uppercase sm:px-10">
              {word}
            </span>
            <span className="h-2.5 w-2.5 rotate-45 border border-silver/60" />
          </span>
        ))}
      </Marquee>
    </div>
  );
}
