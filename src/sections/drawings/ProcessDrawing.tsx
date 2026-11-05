import { useEffect, useId, useLayoutEffect, useRef } from 'react';
import { gsap } from '../../animation/gsap';
import { prefersReducedMotion } from '../../lib/deviceTier';
import { DRAW, FADE, designedOpacity, hideFades } from './fade';

/**
 * One elevation of a pier-and-girder module, built up across the five
 * illustrative stages: survey → design outline → foundations → structure
 * (with crane) → completed, in use. Each stage's group draws on as it is
 * reached; the crane exists only while building.
 */
const PIERS = [180, 460];
const GROUND = 300;

function Survey() {
  return (
    <g data-stage="0">
      <path className="d-line" d={`M20 ${GROUND} H620`} />
      {PIERS.map((x) => (
        <g key={x}>
          <path className="d-line" d={`M${x - 8} ${GROUND - 8} l16 16 M${x + 8} ${GROUND - 8} l-16 16`} />
          <path className="d-dim d-dash" d={`M${x} 60 V${GROUND + 70}`} strokeDasharray="6 6" />
        </g>
      ))}
      <path className="d-dim" d={`M180 ${GROUND + 44} H460 M180 ${GROUND + 38} v12 M460 ${GROUND + 38} v12`} />
      <text className="d-text" x={320} y={GROUND + 38} textAnchor="middle">
        Setting out
      </text>
      <path className="d-line" d={`M70 ${GROUND} l-12 -54 M70 ${GROUND} l0 -54 M70 ${GROUND} l12 -54 M58 ${GROUND - 60} h24 v-8 h-24 Z`} />
      <path className="d-dim" d={`M40 ${GROUND - 14} l8 -10 l8 10 Z`} />
      <text className="d-text" x={36} y={GROUND - 30}>
        Datum
      </text>
    </g>
  );
}

function DesignOutline() {
  return (
    <g data-stage="1" className="design-outline">
      <path className="d-dim d-dash" strokeDasharray="5 4" d="M60 150 H580 V164 H60 Z M60 164 V180 H580 V164" />
      {PIERS.map((x) => (
        <path
          key={x}
          className="d-dim d-dash"
          strokeDasharray="5 4"
          d={`M${x - 34} 180 L${x + 34} 180 L${x + 12} 198 L${x - 12} 198 Z M${x - 10} 198 V330 M${x + 10} 198 V330 M${x - 32} 330 H${x + 32} V346 H${x - 32} Z`}
        />
      ))}
      <path className="d-dim" d="M604 150 V300 M598 150 h12 M598 300 h12" />
      <text className="d-text" x={596} y={232} textAnchor="end">
        Clearance
      </text>
      <path className="d-dim" d="M60 128 H580 M60 122 v12 M580 122 v12" />
      <text className="d-text" x={320} y={120} textAnchor="middle">
        Structural concept
      </text>
    </g>
  );
}

function Foundations({ hatch }: { hatch: string }) {
  return (
    <g data-stage="2">
      {PIERS.map((x) => (
        <g key={x}>
          <path className="d-line" d={`M${x - 46} ${GROUND} L${x - 38} 352 H${x + 38} L${x + 46} ${GROUND}`} />
          <path className="d-hatch-el" fill={hatch} d={`M${x - 32} 330 H${x + 32} V346 H${x - 32} Z`} />
          <path className="d-line" d={`M${x - 32} 330 H${x + 32} V346 H${x - 32} Z`} />
          <path className="d-line" d={`M${x - 22} 346 V392 M${x - 7} 346 V392 M${x + 7} 346 V392 M${x + 22} 346 V392`} />
        </g>
      ))}
      <text className="d-text" x={232} y={378}>
        Piles &amp; footing
      </text>
    </g>
  );
}

function Structure() {
  return (
    <g data-stage="3">
      {PIERS.map((x) => (
        <g key={x}>
          <path className="d-fill" d={`M${x - 10} 198 H${x + 10} V330 H${x - 10} Z`} />
          <path className="d-line" d={`M${x - 10} 198 V330 M${x + 10} 198 V330`} />
          <path className="d-line" d={`M${x - 34} 180 L${x + 34} 180 L${x + 12} 198 L${x - 12} 198 Z`} />
        </g>
      ))}
      <path className="d-line" d="M60 164 H580 M60 180 H580 M60 164 V180 M580 164 V180" />
    </g>
  );
}

function Crane() {
  return (
    <g data-stage="3" data-only="3">
      <path className="d-line" d={`M548 ${GROUND} V54 M560 ${GROUND} V54 ${Array.from({ length: 10 }, (_, i) => `M548 ${GROUND - i * 24} L560 ${GROUND - (i + 1) * 24}`).join(' ')}`} />
      <path className="d-line" d="M430 60 H630 M430 66 H630 M548 54 L590 40 L630 60 M548 54 L470 44 L430 60" />
      <path className="d-dim" d="M470 66 V138 M462 138 h16 v8 h-16 Z" />
      <text className="d-text" x={572} y={36}>
        Crane
      </text>
    </g>
  );
}

function Completion() {
  return (
    <g data-stage="4">
      <path className="d-fill" d="M60 150 H580 V180 H60 Z" />
      <path className="d-line" d="M60 150 H580 V164 H60 Z" />
      <path className="d-line" d={`M60 140 H580 ${Array.from({ length: 27 }, (_, i) => `M${60 + i * 20} 140 V150`).join(' ')}`} />
      {[140, 320, 500].map((x) => (
        <path key={x} className="d-line" d={`M${x} 140 V92 M${x} 92 h18 M${x + 14} 92 v4`} />
      ))}
      <path className="d-flow" d="M60 146 H580" />
      {PIERS.map((x) => (
        <path key={x} className="d-fill" d={`M${x - 46} ${GROUND} L${x - 38} 352 H${x + 38} L${x + 46} ${GROUND} Z`} />
      ))}
    </g>
  );
}

export function ProcessDrawing({ stage, className = '' }: { stage: number; className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const hatch = `url(#${uid}h)`;
  const shown = useRef<Set<Element>>(new Set());

  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg || prefersReducedMotion()) return;
    svg.querySelectorAll('[data-stage]').forEach((group) => gsap.set(group, { autoAlpha: 0 }));
    hideFades(svg.querySelectorAll(FADE));
  }, []);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const reduced = prefersReducedMotion();
    svg.querySelectorAll<SVGGElement>('[data-stage]').forEach((group) => {
      const n = Number(group.dataset.stage);
      const only = group.dataset.only !== undefined ? Number(group.dataset.only) : null;
      const visible = only !== null ? stage === only : n <= stage;
      const isShown = shown.current.has(group);

      if (reduced) {
        gsap.set(group, { autoAlpha: visible ? 1 : 0 });
        if (visible) shown.current.add(group);
        else shown.current.delete(group);
        return;
      }
      if (visible && !isShown) {
        shown.current.add(group);
        gsap.set(group, { autoAlpha: 1 });
        gsap.fromTo(group.querySelectorAll(DRAW), { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.2, ease: 'power2.inOut', stagger: 0.03, overwrite: true });
        gsap.fromTo(group.querySelectorAll(FADE), { autoAlpha: 0 }, { autoAlpha: designedOpacity, duration: 0.8, delay: 0.5, stagger: 0.03, overwrite: true });
      } else if (!visible && isShown) {
        shown.current.delete(group);
        gsap.to(group, { autoAlpha: 0, duration: 0.4, overwrite: true });
      }
    });
    // The dashed design outline recedes once the real structure stands.
    const outline = svg.querySelector('.design-outline');
    if (outline && shown.current.has(outline)) gsap.to(outline, { autoAlpha: stage >= 3 ? 0.3 : 1, duration: 0.6 });
  }, [stage]);

  return (
    <svg ref={ref} viewBox="0 0 640 400" className={`drawing ${className}`} aria-hidden="true">
      <defs>
        <pattern id={`${uid}h`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
        </pattern>
      </defs>
      <Survey />
      <DesignOutline />
      <Foundations hatch={hatch} />
      <Structure />
      <Crane />
      <Completion />
    </svg>
  );
}
