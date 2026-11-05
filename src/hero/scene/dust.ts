import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial } from 'three';
import { lerp, mulberry32, range } from './math';

const vertex = /* glsl */ `
uniform float uTime;
uniform float uScale;
uniform float uFogDensity;
attribute float aSeed;
attribute float aSize;
varying float vAlpha;
void main() {
  vec3 p = position;
  float t = uTime * (0.12 + aSeed * 0.18);
  p.x += sin(t + aSeed * 31.0) * 1.4;
  p.y += sin(t * 0.7 + aSeed * 17.0) * 0.9;
  p.z += cos(t * 0.8 + aSeed * 11.0) * 1.4;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float depth = -mv.z;
  gl_PointSize = min(aSize * uScale / max(depth, 0.1), 9.0);
  float fog = exp(-pow(uFogDensity * depth, 2.0));
  vAlpha = fog * smoothstep(0.8, 3.5, depth) * (0.35 + 0.65 * fract(aSeed * 91.3));
  gl_Position = projectionMatrix * mv;
}`;

const fragment = /* glsl */ `
uniform float uOpacity;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d) * vAlpha * uOpacity;
  gl_FragColor = vec4(0.93, 0.92, 0.9, a);
}`;

/** Fine construction dust drifting through the light. */
export function createDust(count: number, fog: { value: number }) {
  const rand = mulberry32(5);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = lerp(-45, 75, rand());
    positions[i * 3 + 1] = lerp(0.5, 32, rand() ** 1.4);
    positions[i * 3 + 2] = lerp(-18, 58, rand());
    seeds[i] = rand();
    sizes[i] = lerp(0.012, 0.05, rand() ** 2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1));

  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 1000 },
      uOpacity: { value: 1 },
      uFogDensity: fog,
    },
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;

  return {
    points,
    /** `scale` = drawing-buffer height / (2·tan(fov/2)), so sizes are in metres. */
    update(time: number, p: number, scale: number) {
      material.uniforms.uTime.value = time;
      material.uniforms.uScale.value = scale;
      material.uniforms.uOpacity.value = 0.95 - 0.45 * range(p, 0.1, 0.4) - 0.2 * range(p, 0.85, 0.97);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
