import { useEffect, useId, useRef } from 'react';
import { CAP_HEIGHT, SYMBOL_MEMBERS, SYMBOL_WIDTH, toPath } from './wordmarkGeometry';
import { heroProgress } from '../lib/store';

/** Where each of the five S members waits before assembly: dx, dy (units), rotation (deg). */
const SCATTER: readonly [number, number, number][] = [
  [-24, -20, -26],
  [-30, 8, 40],
  [24, -6, -14],
  [30, 14, -36],
  [16, 26, 22],
];

const CENTRES = SYMBOL_MEMBERS.map(({ points }) => {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2] as const;
});

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

interface BrandSymbolProps {
  className?: string;
  /** 'hero' assembles with the hero sequence; 'assembled' is always complete. */
  mode?: 'hero' | 'assembled';
}

/**
 * The brand symbol: the first S of the wordmark. In hero mode its five
 * members start scattered and lock together as the construction sequence
 * plays, so the navigation becomes identifiable as the structure does.
 */
export function BrandSymbol({ className, mode = 'hero' }: BrandSymbolProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const members = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    const apply = (p: number) => {
      const a = mode === 'assembled' ? 1 : smooth(clamp01((p - 0.04) / 0.86));
      members.current.forEach((el, i) => {
        if (!el) return;
        const [dx, dy, rot] = SCATTER[i];
        const k = 1 - a;
        const [cx, cy] = CENTRES[i];
        el.setAttribute('transform', `translate(${dx * k} ${dy * k}) rotate(${rot * k} ${cx} ${cy})`);
        el.style.opacity = String(0.45 + 0.55 * a);
      });
    };
    apply(heroProgress.get());
    return mode === 'hero' ? heroProgress.subscribe(apply) : undefined;
  }, [mode]);

  return (
    <svg viewBox={`0 0 ${SYMBOL_WIDTH} ${CAP_HEIGHT}`} className={className} overflow="visible" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={CAP_HEIGHT}>
          <stop offset="0" stopColor="#f7f7f5" />
          <stop offset="0.48" stopColor="#b9bdc2" />
          <stop offset="0.53" stopColor="#7a7f85" />
          <stop offset="1" stopColor="#d8dadd" />
        </linearGradient>
      </defs>
      {SYMBOL_MEMBERS.map((member, i) => (
        <path
          key={i}
          ref={(el) => {
            members.current[i] = el;
          }}
          d={toPath(member.points)}
          fill={`url(#${uid}g)`}
        />
      ))}
    </svg>
  );
}
