import {
  AdditiveBlending,
  BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  ShaderMaterial,
  Vector2,
} from 'three';
import { DECK_TOP, LANES, X_MAX, X_MIN } from './layout';
import { lerp, mulberry32, range, smoothstep } from './math';

const vertex = /* glsl */ `
uniform float uTime;
uniform vec2 uRange;
uniform float uY;
uniform float uWidth;
attribute float aLane;
attribute float aDir;
attribute float aPhase;
attribute float aSpeed;
attribute float aLen;
attribute vec3 aColor;
varying float vAlong;
varying float vSide;
varying vec3 vColor;
varying float vFade;
varying float vDepth;
void main() {
  float span = uRange.y - uRange.x;
  float travel = mod(aPhase + uTime * aSpeed, span);
  float head = aDir > 0.0 ? uRange.x + travel : uRange.y - travel;
  float x = head - aDir * aLen * position.x;
  vec3 centre = vec3(x, uY, aLane);
  vec3 toCam = normalize(cameraPosition - centre);
  vec3 side = normalize(cross(vec3(1.0, 0.0, 0.0), toCam));
  // Never thinner than ~1.5 px, so distant traffic still reads as light.
  float width = max(uWidth, -(viewMatrix * vec4(centre, 1.0)).z * 0.0011);
  vec3 world = centre + side * position.y * width;
  vAlong = position.x;
  vSide = position.y;
  vColor = aColor;
  vFade = smoothstep(uRange.x, uRange.x + 25.0, x) * (1.0 - smoothstep(uRange.y - 25.0, uRange.y, x));
  vec4 mv = viewMatrix * vec4(world, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const fragment = /* glsl */ `
uniform float uIntensity;
uniform float uFogDensity;
varying float vAlong;
varying float vSide;
varying vec3 vColor;
varying float vFade;
varying float vDepth;
void main() {
  float core = 1.0 - smoothstep(0.0, 1.0, abs(vSide));
  float tail = pow(1.0 - vAlong, 2.2) * smoothstep(0.0, 0.03, vAlong + 0.01);
  float fog = exp(-pow(uFogDensity * vDepth, 2.0));
  gl_FragColor = vec4(vColor, core * tail * vFade * uIntensity * fog);
}`;

/**
 * Long-exposure traffic streaks along the finished deck: red tail lights on
 * the near carriageway moving away, white head lights approaching. Each
 * streak is a camera-facing ribbon expanded in the vertex shader.
 */
export function createLightTrails(perLane: number, fog: { value: number }) {
  const rand = mulberry32(17);
  const count = perLane * LANES.length;

  const geometry = new InstancedBufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0]), 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);

  const lane = new Float32Array(count);
  const dir = new Float32Array(count);
  const phase = new Float32Array(count);
  const speed = new Float32Array(count);
  const len = new Float32Array(count);
  const color = new Float32Array(count * 3);
  let i = 0;
  for (const l of LANES) {
    for (let k = 0; k < perLane; k++, i++) {
      lane[i] = l.z + (rand() - 0.5) * 0.3;
      dir[i] = l.dir;
      phase[i] = rand() * (X_MAX - X_MIN);
      speed[i] = lerp(15, 27, rand());
      len[i] = lerp(5, 13, rand());
      const tail = l.dir > 0;
      const [r, g, b] = tail ? [1.0, 0.27, 0.2] : [1.0, 0.95, 0.86];
      const k2 = lerp(0.7, 1.15, rand());
      color.set([r * k2, g * k2, b * k2], i * 3);
    }
  }
  geometry.setAttribute('aLane', new InstancedBufferAttribute(lane, 1));
  geometry.setAttribute('aDir', new InstancedBufferAttribute(dir, 1));
  geometry.setAttribute('aPhase', new InstancedBufferAttribute(phase, 1));
  geometry.setAttribute('aSpeed', new InstancedBufferAttribute(speed, 1));
  geometry.setAttribute('aLen', new InstancedBufferAttribute(len, 1));
  geometry.setAttribute('aColor', new InstancedBufferAttribute(color, 3));
  geometry.instanceCount = count;

  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uRange: { value: new Vector2(X_MIN, X_MAX) },
      // Bus/truck headlight height: high enough to clear the barrier line when
      // seen from below the deck at the reveal.
      uY: { value: DECK_TOP + 1.35 },
      uWidth: { value: 0.11 },
      uIntensity: { value: 0 },
      uFogDensity: fog,
    },
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;

  return {
    mesh,
    update(time: number, p: number) {
      const intensity = smoothstep(range(p, 0.76, 0.84));
      material.uniforms.uIntensity.value = intensity;
      material.uniforms.uTime.value = time;
      mesh.visible = intensity > 0.001;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
