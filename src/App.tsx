import { useEffect, useState } from 'react';
import { ScrollTrigger } from './animation/gsap';
import { initSmoothScroll } from './animation/smoothScroll';
import { initMetalPointer } from './animation/metalPointer';
import { initScrollReveals } from './animation/reveals';
import { detectHeroTier } from './lib/deviceTier';
import { Nav } from './nav/Nav';
import { Hero } from './hero/Hero';
import { MarqueeBand } from './sections/MarqueeBand';
import { Company } from './sections/Company';
import { Domains } from './sections/Domains';
import { Process } from './sections/Process';
import { Leadership } from './sections/Leadership';
import { Projects } from './sections/Projects';
import { WhySensan } from './sections/WhySensan';
import { Contact } from './sections/Contact';
import { Footer } from './sections/Footer';

export default function App() {
  const [tier] = useState(detectHeroTier);

  useEffect(() => {
    const cleanups = [initMetalPointer(), initScrollReveals()];
    if (tier !== 'static') cleanups.push(initSmoothScroll());

    // Pinned sections measure layout: re-measure once fonts and images settle.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    return () => {
      window.removeEventListener('load', refresh);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [tier]);

  return (
    <>
      <a href="#company" className="skip-link">
        Skip to content
      </a>
      <Nav />
      <main>
        <Hero tier={tier} />
        <MarqueeBand />
        <Company />
        <Domains />
        <Process />
        <Leadership />
        <Projects />
        <WhySensan />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
