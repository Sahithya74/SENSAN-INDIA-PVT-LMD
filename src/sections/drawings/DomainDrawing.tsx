import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { gsap } from '../../animation/gsap';
import { prefersReducedMotion } from '../../lib/deviceTier';
import type { DomainDrawing as Kind } from '../../content/domains';
import { DRAW, FADE, designedOpacity, hideFades } from './fade';

/**
 * Original engineering drawings for each construction domain — conceptual
 * line work, deliberately free of dimensions or specifications.
 *   .d-line  structure (draws on)    .d-dim  annotation (draws on, lighter)
 *   .d-fill  tone (fades in)         .d-flow movement (animated dashes)
 *   .d-text  labels (fade in)
 */

interface DrawingProps {
  kind: Kind;
  /** Draws on the first time this becomes true. */
  active?: boolean;
  className?: string;
  title?: string;
}

const Label = ({ x, y, children, anchor = 'start' }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end' }) => (
  <text className="d-text" x={x} y={y} textAnchor={anchor}>
    {children}
  </text>
);

/** Leader line + label. */
const Callout = ({ from, to, text }: { from: [number, number]; to: [number, number]; text: string }) => (
  <>
    <path className="d-dim" d={`M${from[0]} ${from[1]} L${to[0]} ${to[1]}`} />
    <circle className="d-line" cx={from[0]} cy={from[1]} r={1.6} />
    <Label x={to[0] + 6} y={to[1] + 3}>
      {text}
    </Label>
  </>
);

/** Horizontal dimension line with end ticks and a centred label — no figures. */
const Dimension = ({ x1, x2, y, text }: { x1: number; x2: number; y: number; text: string }) => (
  <>
    <path className="d-dim" d={`M${x1} ${y} L${x2} ${y} M${x1} ${y - 5} L${x1} ${y + 5} M${x2} ${y - 5} L${x2} ${y + 5}`} />
    <Label x={(x1 + x2) / 2} y={y - 7} anchor="middle">
      {text}
    </Label>
  </>
);

function Pavement({ hatch }: { hatch: string }) {
  const camber = (y: number) => `M40 ${y + 12} L80 ${y + 9} L240 ${y} L400 ${y + 9} L440 ${y + 12}`;
  const layers = [150, 160, 174, 198, 228];
  const band = (top: number, bottom: number) =>
    `M40 ${top + 12} L80 ${top + 9} L240 ${top} L400 ${top + 9} L440 ${top + 12} L440 ${bottom + 12} L400 ${bottom + 9} L240 ${bottom} L80 ${bottom + 9} L40 ${bottom + 12} Z`;
  return (
    <>
      <path d="M40 240 L440 240 L478 318 L2 318 Z" fill={hatch} className="d-hatch-el" opacity={0.55} />
      {layers.slice(0, -1).map((top, i) => (
        <path key={top} className="d-fill" d={band(top, layers[i + 1])} style={{ opacity: 0.05 + i * 0.03 }} />
      ))}
      {layers.map((y) => (
        <path key={y} className="d-line" d={camber(y)} />
      ))}
      <path className="d-line" d="M40 162 L2 318 M440 162 L478 318 M2 318 L478 318" />
      <path className="d-line" d="M158 152 L174 150 M306 150 L322 152" strokeWidth={3} />
      <Dimension x1={80} x2={400} y={122} text="Carriageway" />
      <Dimension x1={40} x2={80} y={138} text="" />
      <Label x={60} y={133} anchor="middle">
        Shoulder
      </Label>
      <Callout from={[420, 156]} to={[456, 150]} text="Wearing course" />
      <Callout from={[420, 169]} to={[456, 176]} text="Binder course" />
      <Callout from={[420, 186]} to={[456, 202]} text="Base" />
      <Callout from={[420, 212]} to={[456, 228]} text="Sub-base" />
      <Callout from={[420, 262]} to={[456, 262]} text="Subgrade" />
    </>
  );
}

function Bridge({ hatch }: { hatch: string }) {
  const piers = [180, 320, 460];
  return (
    <>
      <path d="M0 296 C120 300 200 330 320 352 C440 330 520 300 640 296 L640 400 L0 400 Z" fill={hatch} className="d-hatch-el" opacity={0.5} />
      <path className="d-line" d="M0 296 C120 300 200 330 320 352 C440 330 520 300 640 296" />
      <path className="d-dim" d="M250 338 q 10 -4 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0" />
      <path className="d-fill" d="M20 150 H620 V184 H20 Z" />
      <path className="d-line" d="M20 150 H620 V166 H20 Z M20 166 V184 H620 V166" />
      <path className="d-line" d={`M20 138 H620 ${Array.from({ length: 31 }, (_, i) => `M${20 + i * 20} 138 V150`).join(' ')}`} />
      {piers.map((x) => {
        const ground = x === 320 ? 352 : 318;
        return (
          <g key={x}>
            <path className="d-line" d={`M${x - 28} 184 L${x + 28} 184 L${x + 10} 200 L${x - 10} 200 Z`} />
            <path className="d-line" d={`M${x - 8} 200 V${ground - 8} M${x + 8} 200 V${ground - 8}`} />
            <path className="d-line" d={`M${x - 24} ${ground - 8} H${x + 24} V${ground + 6} H${x - 24} Z`} />
          </g>
        );
      })}
      <path className="d-line" d="M20 184 L52 184 L60 300 L12 300 Z M620 184 L588 184 L580 300 L628 300 Z" />
      <Dimension x1={180} x2={320} y={112} text="Span" />
      <Dimension x1={320} x2={460} y={112} text="Span" />
      <Callout from={[560, 158]} to={[580, 100]} text="Deck" />
      <Callout from={[540, 176]} to={[548, 228]} text="Girder" />
      <Callout from={[468, 260]} to={[500, 262]} text="Pier" />
      <Callout from={[36, 250]} to={[70, 250]} text="Abutment" />
    </>
  );
}

function Interchange() {
  const loops = [
    [240, 118],
    [400, 118],
    [240, 282],
    [400, 282],
  ];
  return (
    <>
      <path className="d-fill" d="M0 176 H640 V224 H0 Z M296 0 H344 V400 H296 Z" />
      <path className="d-line" d="M0 176 H296 M344 176 H640 M0 198 H296 M344 198 H640 M0 202 H640 M0 224 H640" />
      <path className="d-line" d="M296 0 V176 M296 224 V400 M318 0 V400 M322 0 V400 M344 0 V176 M344 224 V400" />
      {loops.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} className="d-line" cx={cx} cy={cy} r={44} />
      ))}
      <path className="d-line" d="M120 176 C180 176 200 60 296 40 M520 176 C460 176 440 60 344 40 M120 224 C180 224 200 340 296 360 M520 224 C460 224 440 340 344 360" />
      <path className="d-flow" d="M0 187 H640" />
      <path className="d-flow" d="M640 213 H0" />
      <path className="d-flow" d="M307 400 V0" />
      <path className="d-flow" d="M333 0 V400" />
      {loops.map(([cx, cy]) => (
        <circle key={`f-${cx}-${cy}`} className="d-flow" cx={cx} cy={cy} r={44} />
      ))}
      <Label x={24} y={168}>
        Motorway
      </Label>
      <Label x={352} y={392}>
        Overpass
      </Label>
      <Callout from={[196, 118]} to={[110, 96]} text="Loop ramp" />
      <Callout from={[470, 120]} to={[520, 96]} text="Slip road" />
    </>
  );
}

function Tunnel({ hatch, uid }: { hatch: string; uid: string }) {
  const cx = 320;
  const cy = 226;
  const joints = Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI * (1.05 + (i * 0.9) / 8);
    return [Math.cos(a), Math.sin(a)];
  });
  return (
    <>
      <defs>
        <mask id={`${uid}m`}>
          <rect width="640" height="400" fill="#fff" />
          <path d={`M${cx - 152} 312 A152 152 0 1 1 ${cx + 152} 312 Z`} fill="#000" />
        </mask>
      </defs>
      <rect width="640" height="400" fill={hatch} className="d-hatch-el" opacity={0.45} mask={`url(#${uid}m)`} />
      {[112, 84, 60, 40].map((r, i) => (
        <path
          key={r}
          className="d-dim"
          style={{ opacity: 0.5 - i * 0.1 }}
          d={`M${cx - r} ${cy + r * 0.56} A${r} ${r} 0 1 1 ${cx + r} ${cy + r * 0.56}`}
        />
      ))}
      {joints.map(([x, y], i) => (
        <path key={i} className="d-dim" d={`M${cx + x * 132} ${cy + y * 132} L${cx + x * 40} ${cy + y * 40 + 12}`} />
      ))}
      <path className="d-line" d={`M${cx - 152} 312 A152 152 0 1 1 ${cx + 152} 312`} />
      <path className="d-line" d={`M${cx - 132} 300 A132 132 0 1 1 ${cx + 132} 300`} />
      {joints.map(([x, y], i) => (
        <path key={`j${i}`} className="d-line" d={`M${cx + x * 132} ${cy + y * 132} L${cx + x * 152} ${cy + y * 152}`} />
      ))}
      <path className="d-fill" d={`M${cx - 150} 300 H${cx + 150} V312 H${cx - 150} Z`} />
      <path className="d-line" d={`M${cx - 150} 300 H${cx + 150} M${cx - 132} 292 H${cx - 100} V300 M${cx + 132} 292 H${cx + 100} V300`} />
      <path className="d-flow" d={`M${cx - 90} 296 H${cx + 90}`} />
      <path className="d-line" d={`M${cx - 40} 118 h24 v12 h-24 Z M${cx + 16} 118 h24 v12 h-24 Z`} />
      <Callout from={[cx + 118, 150]} to={[520, 96]} text="Segmental lining" />
      <Callout from={[cx + 28, 124]} to={[400, 66]} text="Ventilation" />
      <Callout from={[cx - 116, 296]} to={[96, 340]} text="Walkway" />
      <Callout from={[cx + 40, 304]} to={[500, 350]} text="Carriageway" />
    </>
  );
}

function Street() {
  const blocks = [
    [36, 40],
    [236, 40],
    [436, 40],
    [36, 226],
    [236, 226],
    [436, 226],
  ];
  const zebra = (x: number, y: number, vertical: boolean) =>
    Array.from({ length: 6 }, (_, i) =>
      vertical ? `M${x + i * 6} ${y} v14` : `M${x} ${y + i * 6} h14`,
    ).join(' ');
  return (
    <>
      {blocks.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect className="d-fill" x={x} y={y} width={168} height={134} rx={10} />
          <rect className="d-line" x={x} y={y} width={168} height={134} rx={10} />
          <rect className="d-dim" x={x + 8} y={y + 8} width={152} height={118} rx={6} />
        </g>
      ))}
      <path className="d-flow" d="M0 200 H640" />
      <path className="d-flow" d="M220 0 V400" />
      <path className="d-flow" d="M420 400 V0" />
      <path className="d-line" d={`${zebra(206, 180, true)} ${zebra(406, 180, true)} ${zebra(206, 206, true)} ${zebra(406, 206, true)}`} strokeWidth={2.4} />
      {[
        [210, 178],
        [430, 178],
        [210, 222],
        [430, 222],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} className="d-line" cx={x} cy={y} r={3.5} />
      ))}
      <Callout from={[120, 200]} to={[60, 390]} text="Street" />
      <Callout from={[300, 222]} to={[330, 390]} text="Footpath" />
      <Callout from={[224, 194]} to={[110, 192]} text="" />
      <Label x={110} y={188} anchor="end">
        Crossing
      </Label>
      <Callout from={[430, 178]} to={[520, 192]} text="Junction" />
    </>
  );
}

function Pedestrian({ hatch }: { hatch: string }) {
  const steps = Array.from({ length: 10 }, (_, i) => `L${200 - (i + 1) * 7} ${160 + i * 14} L${200 - (i + 1) * 7} ${160 + (i + 1) * 14}`).join(' ');
  return (
    <>
      <path d="M0 322 H640 V400 H0 Z" fill={hatch} className="d-hatch-el" opacity={0.45} />
      <path className="d-fill" d="M120 300 H520 V322 H120 Z" />
      <path className="d-line" d="M0 322 H640 M120 300 H520" />
      <path className="d-flow" d="M120 311 H520" />
      <path className="d-fill" d="M200 150 H440 V162 H200 Z" />
      <path className="d-line" d="M200 150 H440 V162 H200 Z" />
      <path className="d-line" d={`M200 128 H440 ${Array.from({ length: 13 }, (_, i) => `M${200 + i * 20} 128 V150`).join(' ')}`} />
      <path className="d-line" d={`M200 162 ${steps}`} />
      <path className="d-line" d="M200 140 L130 300" />
      <path className="d-line" d="M440 162 L620 300 M440 140 L620 280" />
      <path className="d-line" d="M206 162 V300 M434 162 V300 M196 300 h20 M424 300 h20" />
      <path className="d-dim" d="M470 162 V300 M464 162 h12 M464 300 h12" />
      <Label x={480} y={236}>
        Clearance
      </Label>
      <Dimension x1={206} x2={434} y={104} text="Span" />
      <Callout from={[160, 230]} to={[60, 210]} text="Stair" />
      <Callout from={[560, 254]} to={[580, 200]} text="Ramp" />
      <Callout from={[300, 128]} to={[320, 76]} text="Handrail" />
    </>
  );
}

function Building({ hatch }: { hatch: string }) {
  const cols = [120, 210, 300, 390];
  const floors = [300, 245, 190, 135, 80];
  return (
    <>
      <path d="M0 300 H640 V400 H0 Z" fill={hatch} className="d-hatch-el" opacity={0.45} />
      <path className="d-line" d="M0 300 H640" />
      {cols.map((x) => (
        <g key={x}>
          <path className="d-line" d={`M${x - 16} 318 H${x + 16} V332 H${x - 16} Z M${x} 300 V318`} />
          <path className="d-line" d={`M${x - 4} 80 V300 M${x + 4} 80 V300`} />
        </g>
      ))}
      {floors.slice(1).map((y, i) => (
        <g key={y}>
          <path className="d-fill" d={`M104 ${y} H406 V${y + 8} H104 Z`} />
          <path className="d-line" d={`M104 ${y} H406 V${y + 8} H104 Z`} />
          {cols.slice(0, -1).map((x) => (
            <path key={x} className="d-dim" d={`M${x + 18} ${y + 22} h54 v28 h-54 Z`} style={{ opacity: 0.3 + i * 0.05 }} />
          ))}
        </g>
      ))}
      <path className="d-line" d="M104 80 V66 H406 V80" />
      <path className="d-line" d={`M520 300 V40 M532 300 V40 ${Array.from({ length: 11 }, (_, i) => `M520 ${300 - i * 24} L532 ${300 - (i + 1) * 24}`).join(' ')}`} />
      <path className="d-line" d="M380 46 H630 M380 52 H630 M520 40 L560 26 L630 46 M520 40 L440 30 L380 46" />
      <path className="d-dim" d="M430 52 V112 M422 112 h16 v8 h-16 Z" />
      <path className="d-dim" d="M440 135 V300 M434 135 h12 M434 190 h12 M434 245 h12 M434 300 h12" />
      <Label x={452} y={220}>
        Floors
      </Label>
      <Callout from={[300, 160]} to={[230, 24]} text="Column" />
      <Callout from={[380, 194]} to={[452, 172]} text="Slab" />
      <Callout from={[120, 326]} to={[40, 360]} text="Footing" />
      <Label x={560} y={20}>
        Crane
      </Label>
    </>
  );
}

function PublicWorks() {
  const blocks = [
    [150, 96, 150, 90],
    [340, 96, 110, 90],
    [150, 230, 110, 74],
  ];
  return (
    <>
      <rect className="d-line" x={60} y={40} width={520} height={320} rx={4} />
      <rect className="d-dim" x={68} y={48} width={504} height={304} rx={2} />
      <path className="d-line" d="M280 360 v-8 M360 360 v-8" />
      <path className="d-fill" d="M110 70 H530 V330 H110 Z" style={{ opacity: 0.04 }} />
      <path className="d-line" d="M110 70 H530 V330 H110 Z" />
      <path className="d-flow" d="M120 80 H520 V320 H120 Z" />
      <path className="d-line" d="M310 330 V360 M330 330 V360" />
      {blocks.map(([x, y, w, h]) => (
        <g key={`${x}-${y}`}>
          <rect className="d-fill" x={x} y={y} width={w} height={h} />
          <rect className="d-line" x={x} y={y} width={w} height={h} />
          <path className="d-dim" d={`M${x} ${y} L${x + w} ${y + h} M${x + w} ${y} L${x} ${y + h}`} />
        </g>
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} className="d-dim" d={`M${300 + i * 22} 236 v40`} />
      ))}
      <path className="d-dim" d="M300 276 H454" />
      {[
        [90, 60],
        [90, 140],
        [90, 220],
        [90, 300],
        [550, 60],
        [550, 140],
        [550, 220],
        [550, 300],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} className="d-line" cx={x} cy={y} r={7} />
      ))}
      <Label x={320} y={384} anchor="middle">
        Access
      </Label>
      <Callout from={[225, 140]} to={[180, 22]} text="Building" />
      <Callout from={[454, 256]} to={[478, 212]} text="Parking" />
      <Callout from={[520, 200]} to={[596, 200]} text="" />
      <Label x={604} y={180} anchor="end">
        Site road
      </Label>
      <Callout from={[60, 360]} to={[24, 392]} text="Boundary" />
    </>
  );
}

export function DomainDrawing({ kind, active = true, className = '', title }: DrawingProps) {
  const ref = useRef<SVGSVGElement>(null);
  const raw = useId();
  const uid = raw.replace(/[^a-zA-Z0-9]/g, '');
  const hatch = `url(#${uid}h)`;
  const played = useRef(false);

  // Hold the drawing hidden until it is first activated.
  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg || prefersReducedMotion()) return;
    gsap.set(svg.querySelectorAll(DRAW), { drawSVG: '0%' });
    hideFades(svg.querySelectorAll(FADE));
  }, []);

  useEffect(() => {
    const svg = ref.current;
    if (!svg || !active || played.current || prefersReducedMotion()) return;
    played.current = true;
    const tl = gsap.timeline();
    tl.to(svg.querySelectorAll('.d-line'), { drawSVG: '100%', duration: 1.5, ease: 'power2.inOut', stagger: 0.035 })
      .to(svg.querySelectorAll('.d-fill, .d-hatch-el'), { autoAlpha: designedOpacity, duration: 1.1, stagger: 0.04 }, 0.5)
      .to(svg.querySelectorAll('.d-dim:not(.d-dash)'), { drawSVG: '100%', duration: 0.9, stagger: 0.025 }, 0.8)
      .to(svg.querySelectorAll('.d-text, .d-flow, .d-dash'), { autoAlpha: designedOpacity, duration: 0.6, stagger: 0.03 }, 1.1);
  }, [active]);

  const body = {
    pavement: <Pavement hatch={hatch} />,
    bridge: <Bridge hatch={hatch} />,
    interchange: <Interchange />,
    tunnel: <Tunnel hatch={hatch} uid={uid} />,
    street: <Street />,
    pedestrian: <Pedestrian hatch={hatch} />,
    building: <Building hatch={hatch} />,
    gem: <PublicWorks />,
  }[kind];

  return (
    <svg
      ref={ref}
      viewBox="0 0 640 400"
      className={`drawing ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <pattern id={`${uid}h`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
        </pattern>
      </defs>
      {body}
    </svg>
  );
}
