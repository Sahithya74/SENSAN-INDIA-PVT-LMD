import { useEffect, useId, useRef } from 'react';
import { CAP_HEIGHT, WORDMARK_MEMBERS, WORDMARK_WIDTH, extrusionHull, toPath } from './wordmarkGeometry';
import { pointer } from '../lib/store';

interface WordmarkProps {
  className?: string;
  /** Faux extrusion depth in wordmark units (cap height = 100). */
  depth?: number;
  /** Hide from assistive tech when a visible text equivalent sits nearby. */
  decorative?: boolean;
}

/**
 * The SENSAN wordmark as layered SVG: a dark extrusion hull, a chrome face and
 * a specular sheen that follows the cursor. Each member is its own <g
 * class="wm-member"> so timelines can assemble the mark bar by bar.
 */
export function Wordmark({ className, depth = 7, decorative = false }: WordmarkProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const sheen = useRef<SVGLinearGradientElement>(null);
  const dx = depth * 0.45;
  const dy = depth;

  useEffect(
    () =>
      pointer.subscribe(({ x }) => {
        const gradient = sheen.current;
        if (!gradient) return;
        const cx = (x * 0.5 + 0.5) * WORDMARK_WIDTH;
        gradient.setAttribute('x1', String(cx - 150));
        gradient.setAttribute('x2', String(cx + 150));
      }),
    [],
  );

  return (
    <svg
      viewBox={`-2 -2 ${WORDMARK_WIDTH + dx + 4} ${CAP_HEIGHT + dy + 4}`}
      className={className}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'SENSAN'}
      aria-hidden={decorative || undefined}
      overflow="visible"
    >
      <defs>
        <linearGradient id={`${uid}f`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={CAP_HEIGHT}>
          <stop offset="0" stopColor="#f7f7f5" />
          <stop offset="0.3" stopColor="#dadde0" />
          <stop offset="0.47" stopColor="#aab0b5" />
          <stop offset="0.52" stopColor="#686d73" />
          <stop offset="0.6" stopColor="#91969c" />
          <stop offset="0.8" stopColor="#d4d7da" />
          <stop offset="1" stopColor="#aeb3b8" />
        </linearGradient>
        <linearGradient id={`${uid}s`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={dx} y2={CAP_HEIGHT + dy}>
          <stop offset="0" stopColor="#45484d" />
          <stop offset="1" stopColor="#141518" />
        </linearGradient>
        <linearGradient
          ref={sheen}
          id={`${uid}h`}
          gradientUnits="userSpaceOnUse"
          x1={WORDMARK_WIDTH / 2 - 150}
          y1="0"
          x2={WORDMARK_WIDTH / 2 + 150}
          y2={CAP_HEIGHT * 0.5}
        >
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {WORDMARK_MEMBERS.map((member, i) => {
        const face = toPath(member.points);
        return (
          <g key={i} className="wm-member" data-letter={member.letter}>
            <path d={toPath(extrusionHull(member.points, dx, dy))} fill={`url(#${uid}s)`} />
            <path d={face} fill={`url(#${uid}f)`} />
            <path d={face} fill={`url(#${uid}h)`} />
            <path d={face} fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="0.7" />
          </g>
        );
      })}
    </svg>
  );
}
