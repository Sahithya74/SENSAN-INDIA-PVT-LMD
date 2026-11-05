import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Group,
  LineSegments,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { AnimatedInstances, pose, type PartAnim } from './animatedInstances';
import { DECK_WIDTH, FOCUS_X, PIER_XS, SPAN, X_MAX, X_MIN, wave } from './layout';
import type { SceneMaterials } from './materials';
import { easeInOutCubic, easeOutBack, easeOutCubic, range } from './math';

const gridVertex = /* glsl */ `
attribute float aMajor;
varying float vMajor;
varying vec3 vWorld;
varying float vDepth;
void main() {
  vMajor = aMajor;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vec4 mv = viewMatrix * world;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const gridFragment = /* glsl */ `
uniform float uReveal;
uniform float uOpacity;
uniform vec3 uColor;
uniform float uFogDensity;
uniform vec2 uOrigin;
varying float vMajor;
varying vec3 vWorld;
varying float vDepth;
void main() {
  float d = length(vWorld.xz - uOrigin);
  float radius = uReveal * 320.0;
  float inside = 1.0 - smoothstep(radius - 30.0, radius, d);
  float front = smoothstep(radius - 9.0, radius - 1.0, d) * inside;
  float alpha = (mix(0.06, 0.18, vMajor) * inside + front * 0.5) * uOpacity;
  float fog = exp(-pow(uFogDensity * vDepth, 2.0));
  gl_FragColor = vec4(uColor, alpha * fog);
}`;

/**
 * The site before the structure: a dark ground plane, a survey grid that
 * draws outward from the focus span, and setting-out marks at every pier.
 */
export function createGround(m: SceneMaterials, fog: { value: number }, shadows: boolean) {
  const group = new Group();

  const planeGeometry = new PlaneGeometry(1600, 1600);
  const plane = new Mesh(planeGeometry, m.ground);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = shadows;
  group.add(plane);

  // Survey grid — 5 m cells, major lines on pier lines and the deck axis.
  const positions: number[] = [];
  const major: number[] = [];
  const [x0, x1, z0, z1, step] = [-200, 280, -150, 150, 5];
  for (let x = x0; x <= x1; x += step) {
    positions.push(x, 0.03, z0, x, 0.03, z1);
    const isMajor = x % SPAN === 0 ? 1 : 0;
    major.push(isMajor, isMajor);
  }
  for (let z = z0; z <= z1; z += step) {
    positions.push(x0, 0.03, z, x1, 0.03, z);
    const isMajor = z === 0 ? 1 : 0;
    major.push(isMajor, isMajor);
  }
  const gridGeometry = new BufferGeometry();
  gridGeometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  gridGeometry.setAttribute('aMajor', new BufferAttribute(new Float32Array(major), 1));
  const gridMaterial = new ShaderMaterial({
    vertexShader: gridVertex,
    fragmentShader: gridFragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uReveal: { value: 0 },
      uOpacity: { value: 1 },
      uColor: { value: [0.78, 0.8, 0.82] },
      uFogDensity: fog,
      uOrigin: { value: new Vector2(FOCUS_X, 0) },
    },
  });
  const grid = new LineSegments(gridGeometry, gridMaterial);
  grid.frustumCulled = false;
  group.add(grid);

  // Setting-out crosses at each pier, then the deck axis and edge lines.
  const crossGeometry = mergeGeometries([
    new BoxGeometry(3.6, 0.02, 0.12).rotateY(Math.PI / 4),
    new BoxGeometry(3.6, 0.02, 0.12).rotateY(-Math.PI / 4),
  ]);
  const crosses = new AnimatedInstances(
    crossGeometry,
    m.survey,
    PIER_XS.map((x): PartAnim => {
      const t0 = 0.055 + wave(x) * 0.05;
      return {
        final: pose(x, 0.035, 0),
        start: pose(x, 0.035, 0, 0, 0, 0, 0.0001, 1, 0.0001),
        window: [t0, t0 + 0.03],
        ease: (t) => easeOutBack(t, 1.6),
      };
    }),
  );
  group.add(crosses.mesh);

  const lineGeometry = new BoxGeometry(1, 0.015, 0.08).translate(0.5, 0, 0);
  const length = X_MAX - X_MIN + 40;
  const lines = new AnimatedInstances(
    lineGeometry,
    m.survey,
    [0, DECK_WIDTH / 2, -DECK_WIDTH / 2].map((z, i): PartAnim => ({
      final: pose(X_MIN - 20, 0.03, z, 0, 0, 0, length, 1, 1),
      start: pose(X_MIN - 20, 0.03, z, 0, 0, 0, 0.0001, 1, 1),
      window: [0.06 + i * 0.015, 0.17 + i * 0.015],
      ease: easeInOutCubic,
    })),
  );
  group.add(lines.mesh);

  return {
    group,
    update(p: number) {
      gridMaterial.uniforms.uReveal.value = easeOutCubic(range(p, 0.045, 0.22));
      gridMaterial.uniforms.uOpacity.value = 1 - 0.65 * range(p, 0.6, 0.85);
      m.survey.opacity = 0.85 * (1 - 0.75 * range(p, 0.55, 0.8));
      crosses.update(p, 0);
      lines.update(p, 0);
    },
    dispose() {
      planeGeometry.dispose();
      gridGeometry.dispose();
      gridMaterial.dispose();
      crossGeometry.dispose();
      lineGeometry.dispose();
      crosses.mesh.dispose();
      lines.mesh.dispose();
    },
  };
}
