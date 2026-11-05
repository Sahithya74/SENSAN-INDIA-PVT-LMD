import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  CylinderGeometry,
  Euler,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  PlaneGeometry,
  ShaderMaterial,
  Shape,
  Vector2,
  Vector3,
  type BufferGeometry,
  type Material,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { AnimatedInstances, pose, type PartAnim } from './animatedInstances';
import {
  BARRIER_Z,
  CAP_TOP,
  DECK_THICKNESS,
  DECK_TOP,
  DECK_WIDTH,
  FOCUS_X,
  FOOTING_TOP,
  GIRDER_DEPTH,
  GIRDER_ZS,
  PIER_TOP,
  PIER_XS,
  SLAB_TOP,
  SPAN,
  SPAN_CENTRES,
  X_MAX,
  X_MIN,
  wave,
} from './layout';
import type { SceneMaterials } from './materials';
import { easeInOutCubic, easeOutBack, easeOutCubic, easeOutQuart, mulberry32, range, smoothstep } from './math';

const DECK_BASE = CAP_TOP + GIRDER_DEPTH;
const MEDIAN_TOP = DECK_TOP + 0.92;

/** Extrude a (u, v) profile along +x, centred on x = 0. u maps to −z, v to +y. */
function extrudeAlongX(points: [number, number][], length: number): BufferGeometry {
  const shape = new Shape(points.map(([u, v]) => new Vector2(u, v)));
  const geometry = new ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, curveSegments: 1 });
  geometry.rotateY(Math.PI / 2);
  geometry.translate(-length / 2, 0, 0);
  return geometry;
}

function roundedRect(width: number, depth: number, radius: number): Shape {
  const x = -width / 2;
  const y = -depth / 2;
  const s = new Shape();
  s.moveTo(x + radius, y);
  s.lineTo(x + width - radius, y);
  s.quadraticCurveTo(x + width, y, x + width, y + radius);
  s.lineTo(x + width, y + depth - radius);
  s.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth);
  s.lineTo(x + radius, y + depth);
  s.quadraticCurveTo(x, y + depth, x, y + depth - radius);
  s.lineTo(x, y + radius);
  s.quadraticCurveTo(x, y, x + radius, y);
  return s;
}

function geometries() {
  const slab = new BoxGeometry(10, SLAB_TOP, 15).translate(0, SLAB_TOP / 2, 0);
  const footing = new BoxGeometry(6.2, FOOTING_TOP - SLAB_TOP, 11.5).translate(0, (FOOTING_TOP - SLAB_TOP) / 2, 0);

  const pier = new ExtrudeGeometry(roundedRect(2.4, 4.2, 0.55), {
    depth: PIER_TOP - FOOTING_TOP,
    bevelEnabled: false,
    curveSegments: 5,
  });
  pier.rotateX(-Math.PI / 2);

  // Hammerhead pier cap: narrow at the column, cantilevered under the deck.
  const cap = extrudeAlongX(
    [
      [-2.3, 0],
      [2.3, 0],
      [7.9, 1.35],
      [7.9, CAP_TOP - PIER_TOP],
      [-7.9, CAP_TOP - PIER_TOP],
      [-7.9, 1.35],
    ],
    2.6,
  );

  // Welded steel plate girder (I-section).
  const fw = 0.31;
  const ft = 0.07;
  const tw = 0.0225;
  const d = GIRDER_DEPTH;
  const girder = extrudeAlongX(
    [
      [-fw, 0],
      [fw, 0],
      [fw, ft],
      [tw, ft],
      [tw, d - ft],
      [fw, d - ft],
      [fw, d],
      [-fw, d],
      [-fw, d - ft],
      [-tw, d - ft],
      [-tw, ft],
      [-fw, ft],
    ],
    SPAN - 0.9,
  );

  // Deck panel: concrete on every face except the asphalt wearing course on top.
  const deck = new BoxGeometry(7.4, DECK_THICKNESS, DECK_WIDTH).translate(0, DECK_THICKNESS / 2, 0);
  deck.groups.forEach((group, i) => (group.materialIndex = i === 2 ? 1 : 0));

  // New Jersey safety-shape barrier (outer face towards −z before rotation).
  const barrier = extrudeAlongX(
    [
      [-0.3, 0],
      [0.3, 0],
      [0.3, 0.92],
      [0.05, 0.92],
      [-0.12, 0.33],
      [-0.3, 0.08],
    ],
    14.8,
  );
  const median = extrudeAlongX(
    [
      [-0.3, 0],
      [0.3, 0],
      [0.3, 0.08],
      [0.12, 0.33],
      [0.08, 0.92],
      [-0.08, 0.92],
      [-0.12, 0.33],
      [-0.3, 0.08],
    ],
    14.8,
  );

  const pole = mergeGeometries([
    new CylinderGeometry(0.1, 0.15, 10, 10, 1).translate(0, 5, 0),
    new BoxGeometry(0.09, 0.09, 2.5).translate(0, 9.85, 1.25),
    new BoxGeometry(0.09, 0.09, 2.5).translate(0, 9.85, -1.25),
    new BoxGeometry(0.5, 0.25, 0.5).translate(0, 0.125, 0),
  ]);
  const heads = mergeGeometries([
    new BoxGeometry(0.75, 0.12, 0.32).translate(0, 9.8, 2.45),
    new BoxGeometry(0.75, 0.12, 0.32).translate(0, 9.8, -2.45),
  ]);

  // Road marking: unit length from x = 0, scaled per instance (draws on from one end).
  const marking = new BoxGeometry(1, 0.02, 0.14).translate(0.5, 0.01, 0);

  return { slab, footing, pier, cap, girder, deck, barrier, median, pole, heads, marking };
}

export interface Viaduct {
  group: Group;
  update(p: number, time: number): void;
  dispose(): void;
}

/** Soft pools of light on the deck under each luminaire — additive, no real lights needed. */
function createLightPools(centres: { x: number; z: number }[], fog: { value: number }) {
  const geometry = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uIntensity: { value: 0 }, uFogDensity: fog },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vDepth;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uIntensity;
      uniform float uFogDensity;
      varying vec2 vUv;
      varying float vDepth;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float a = pow(max(0.0, 1.0 - d), 2.4) * uIntensity;
        float fog = exp(-pow(uFogDensity * vDepth, 2.0));
        gl_FragColor = vec4(1.0, 0.93, 0.82, a * fog * 0.3);
      }`,
  });
  const mesh = new InstancedMesh(geometry, material, centres.length);
  const matrix = new Matrix4();
  centres.forEach(({ x, z }, i) => {
    matrix.makeScale(11, 1, 11).setPosition(x, DECK_TOP + 0.04, z);
    mesh.setMatrixAt(i, matrix);
  });
  mesh.frustumCulled = false;
  return {
    mesh,
    setIntensity: (v: number) => {
      material.uniforms.uIntensity.value = v;
      mesh.visible = v > 0.001;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
  };
}

export function createViaduct(m: SceneMaterials, shadows: boolean, fog: { value: number }): Viaduct {
  const group = new Group();
  const geo = geometries();
  const rand = mulberry32(31);
  const layers: AnimatedInstances[] = [];

  const concreteTints = (count: number) =>
    Array.from({ length: count }, () => {
      const f = 0.88 + rand() * 0.18;
      return new Color(f, f * (0.995 + rand() * 0.012), f * (0.99 + rand() * 0.02));
    });

  const add = (
    geometry: BufferGeometry,
    material: Material | Material[],
    parts: PartAnim[],
    { cast = true, tinted = false } = {},
  ) => {
    const tints = tinted ? concreteTints(parts.length) : null;
    const layer = new AnimatedInstances(geometry, material, parts, {
      castShadow: shadows && cast,
      receiveShadow: shadows,
      tint: tints ? (i) => tints[i] : undefined,
    });
    layers.push(layer);
    group.add(layer.mesh);
  };

  const alignWindow = (x: number) => [0.62 + wave(x) * 0.035, 0.69 + wave(x) * 0.035] as const;

  // 01 Foundation — slabs slide in from depth, footings rise through them.
  add(
    geo.slab,
    m.concrete,
    PIER_XS.map((x) => {
      const t0 = 0.085 + wave(x) * 0.07;
      return { final: pose(x, 0, 0), start: pose(x, 0, -95), window: [t0, t0 + 0.055], ease: easeOutCubic, hiddenBefore: true };
    }),
    { tinted: true },
  );
  add(
    geo.footing,
    m.concrete,
    PIER_XS.map((x) => {
      const t0 = 0.12 + wave(x) * 0.07;
      return { final: pose(x, SLAB_TOP, 0), start: pose(x, SLAB_TOP - 2.2, 0), window: [t0, t0 + 0.06], ease: easeOutCubic };
    }),
    { tinted: true },
  );

  // 02 Structure — piers extrude upward, hammerhead caps swing in from above.
  add(
    geo.pier,
    m.concrete,
    PIER_XS.map((x) => {
      const t0 = 0.255 + wave(x) * 0.08;
      return {
        final: pose(x, FOOTING_TOP, 0),
        start: pose(x, FOOTING_TOP, 0, 0, 0, 0, 1, 0.0001, 1),
        window: [t0, t0 + 0.075],
        ease: easeInOutCubic,
        hiddenBefore: true,
      };
    }),
    { tinted: true },
  );
  add(
    geo.cap,
    m.concrete,
    PIER_XS.map((x, i) => {
      const t0 = 0.315 + wave(x) * 0.08;
      const side = i % 2 === 0 ? 1 : -1;
      return {
        final: pose(x, PIER_TOP, 0),
        start: pose(x, PIER_TOP + 16, 0, 0, (side * Math.PI) / 2, 0),
        window: [t0, t0 + 0.07],
        ease: easeOutCubic,
        hiddenBefore: true,
        gap: new Vector3(0, 0.6, 0),
        align: alignWindow(x),
      };
    }),
    { tinted: true },
  );

  // Steel girders fly in from either side. One of them — the member seen
  // floating in the opening shot — is the first to be placed.
  const euler = new Euler();
  add(
    geo.girder,
    m.steel,
    SPAN_CENTRES.flatMap((sx) =>
      GIRDER_ZS.map((z, gi): PartAnim => {
        const final = pose(sx, CAP_TOP, z);
        if (sx === FOCUS_X && z === 0) {
          return {
            final,
            start: pose(0, 0, 0),
            window: [0.3, 0.43],
            ease: easeInOutCubic,
            gap: new Vector3(0, 0.5, 0),
            align: alignWindow(sx),
            drift: (p, time, out) => {
              const t = Math.min(p, 0.3);
              out.position.set(6 + t * 10, 8.2 + t * 6 + Math.sin(time * 0.55) * 0.18, 15 - t * 14);
              out.quaternion.setFromEuler(euler.set(0.08 + Math.sin(time * 0.31) * 0.025, 0.62 + t * 1.2, 0.06));
              out.scale.set(1, 1, 1);
            },
          };
        }
        const side = gi % 2 === 0 ? 1 : -1;
        const t0 = 0.37 + wave(sx) * 0.08 + gi * 0.006;
        return {
          final,
          start: pose(sx + side * 6, CAP_TOP + 5, z + side * 58, 0, side * 0.32, 0),
          window: [t0, t0 + 0.075],
          ease: easeOutQuart,
          hiddenBefore: true,
          gap: new Vector3(0, 0.5, 0),
          align: alignWindow(sx),
        };
      }),
    ),
  );

  // 03 Assembly — deck panels drop in tilted, pass close to the lens, settle.
  add(
    geo.deck,
    [m.concrete, m.asphalt],
    SPAN_CENTRES.flatMap((sx) =>
      [0, 1, 2, 3].map((k): PartAnim => {
        const x = sx - 11.25 + k * 7.5;
        const t0 = 0.465 + wave(x) * 0.09 + k * 0.005;
        return {
          final: pose(x, DECK_BASE, 0),
          start: pose(x + (k - 1.5) * 1.5, DECK_BASE + 24, 9, (rand() - 0.5) * 0.5, (rand() - 0.5) * 0.2, (rand() - 0.5) * 0.3),
          window: [t0, t0 + 0.07],
          ease: easeOutCubic,
          hiddenBefore: true,
          gap: new Vector3((k - 1.5) * 0.18, 0.4, 0),
          align: alignWindow(x),
        };
      }),
    ),
    { tinted: true },
  );

  // Barriers slide in sideways; the median rises; light poles swing upright.
  add(
    geo.barrier,
    m.concrete,
    SPAN_CENTRES.flatMap((sx) =>
      [-1, 1].flatMap((side) =>
        [0, 1].map((seg): PartAnim => {
          const x = sx - 7.5 + seg * 15;
          const t0 = 0.52 + wave(x) * 0.08 + seg * 0.006 + (side < 0 ? 0.01 : 0);
          const ry = side > 0 ? Math.PI : 0;
          return {
            final: pose(x, DECK_TOP, side * BARRIER_Z, 0, ry, 0),
            start: pose(x, DECK_TOP + 1.5, side * (BARRIER_Z + 36), 0, ry, 0),
            window: [t0, t0 + 0.06],
            ease: easeOutCubic,
            hiddenBefore: true,
            gap: new Vector3(0, 0.25, side * 0.25),
            align: alignWindow(x),
          };
        }),
      ),
    ),
    { tinted: true },
  );
  add(
    geo.median,
    m.concrete,
    SPAN_CENTRES.flatMap((sx) =>
      [0, 1].map((seg): PartAnim => {
        const x = sx - 7.5 + seg * 15;
        const t0 = 0.555 + wave(x) * 0.07;
        return {
          final: pose(x, DECK_TOP, 0),
          start: pose(x, DECK_TOP, 0, 0, 0, 0, 1, 0.0001, 1),
          window: [t0, t0 + 0.045],
          ease: easeOutCubic,
          hiddenBefore: true,
        };
      }),
    ),
    { tinted: true },
  );

  const poleParts = SPAN_CENTRES.flatMap((sx) =>
    [-1, 1].map((j): PartAnim => {
      const x = sx + j * 7.5;
      const t0 = 0.575 + wave(x) * 0.07 + (j + 1) * 0.004;
      return {
        final: pose(x, MEDIAN_TOP, 0),
        start: pose(x, MEDIAN_TOP, 0, 0, 0, (Math.PI / 2) * 0.97),
        window: [t0, t0 + 0.06],
        ease: (t) => easeOutBack(t, 1.1),
        hiddenBefore: true,
      };
    }),
  );
  add(geo.pole, m.galvanised, poleParts);
  add(geo.heads, m.luminaire, poleParts, { cast: false });
  const pools = createLightPools(
    poleParts.flatMap((part) => [
      { x: part.final.position.x, z: 2.45 },
      { x: part.final.position.x, z: -2.45 },
    ]),
    fog,
  );
  group.add(pools.mesh);

  // 04 Alignment — road markings draw on along the carriageway.
  const markingParts: PartAnim[] = [];
  const drawOn = (x: number, z: number, length: number) => {
    const t0 = 0.645 + ((x - X_MIN) / (X_MAX - X_MIN)) * 0.09;
    markingParts.push({
      final: pose(x, DECK_TOP, z, 0, 0, 0, length, 1, 1),
      start: pose(x, DECK_TOP, z, 0, 0, 0, 0.0001, 1, 1),
      window: [t0, t0 + 0.03],
      ease: easeOutCubic,
    });
  };
  for (let x = X_MIN + 3; x < X_MAX - 3; x += 9) {
    drawOn(x, 3.65, 3);
    drawOn(x, -3.65, 3);
  }
  for (const sx of SPAN_CENTRES) {
    for (const z of [7.55, 0.75, -0.75, -7.55]) drawOn(sx - SPAN / 2 + 0.2, z, SPAN - 0.4);
  }
  add(geo.marking, m.marking, markingParts, { cast: false });

  return {
    group,
    update(p, time) {
      for (const layer of layers) layer.update(p, time);
      const lit = smoothstep(range(p, 0.74, 0.8));
      m.luminaire.emissiveIntensity = 3.2 * lit;
      pools.setIntensity(lit);
    },
    dispose() {
      Object.values(geo).forEach((g) => g.dispose());
      layers.forEach((l) => l.mesh.dispose());
      pools.dispose();
    },
  };
}
