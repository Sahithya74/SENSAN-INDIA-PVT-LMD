import { gsap } from '../../animation/gsap';

/** Tone, labels, movement and dashed lines fade in; everything else draws on. */
export const FADE = '.d-fill, .d-hatch-el, .d-text, .d-flow, .d-dash';
export const DRAW = '.d-line, .d-dim:not(.d-dash)';

/**
 * Hide fading elements, remembering the opacity each was designed with — a
 * tone fill at 9 % must return to 9 %, not to 100 %.
 */
export function hideFades(elements: Iterable<Element>) {
  for (const el of elements) {
    const svgEl = el as SVGElement;
    if (svgEl.dataset.o === undefined) svgEl.dataset.o = getComputedStyle(svgEl).opacity;
    gsap.set(svgEl, { autoAlpha: 0 });
  }
}

/** Target for gsap: back to the remembered opacity. */
export const designedOpacity = (_: number, el: Element) => Number((el as SVGElement).dataset.o ?? 1);
