import { BackSide, Color, Mesh, ShaderMaterial, SphereGeometry, Vector3 } from 'three';

/** Display-space (sRGB) colours: the sky shader writes them straight to the screen. */
export const SKY = {
  zenith: '#0e1116',
  upper: '#262a31',
  /** The horizon is also the fog colour, so distant structure dissolves into it. */
  horizon: '#4a5058',
  glow: '#9a8a76',
} as const;

const srgb = (hex: string) => {
  const c = new Color(hex);
  c.convertLinearToSRGB();
  return new Vector3(c.r, c.g, c.b);
};

/**
 * Blue-hour sky: graphite overhead, lightening toward a soft silver horizon,
 * with a faint warm glow low behind the structure. Not fogged and not tone
 * mapped — it is the backdrop the fog fades into.
 */
export function createSky() {
  const geometry = new SphereGeometry(900, 32, 16);
  const material = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    uniforms: {
      uZenith: { value: srgb(SKY.zenith) },
      uUpper: { value: srgb(SKY.upper) },
      uHorizon: { value: srgb(SKY.horizon) },
      uGlow: { value: srgb(SKY.glow) },
      uGlowDir: { value: new Vector3(0.35, 0, -1).normalize() },
      uGlowStrength: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uZenith;
      uniform vec3 uUpper;
      uniform vec3 uHorizon;
      uniform vec3 uGlow;
      uniform vec3 uGlowDir;
      uniform float uGlowStrength;
      varying vec3 vDir;
      void main() {
        float e = max(vDir.y, 0.0);
        vec3 col = mix(uHorizon, uUpper, smoothstep(0.0, 0.13, e));
        col = mix(col, uZenith, smoothstep(0.13, 0.55, e));
        vec3 across = normalize(vec3(vDir.x, 0.0, vDir.z) + 1e-5);
        // Peaks just above the horizon, so the fogged ground meets the sky without a seam.
        float g = pow(max(dot(across, uGlowDir), 0.0), 4.0) * smoothstep(0.0, 0.05, e) * (1.0 - smoothstep(0.05, 0.26, e));
        col = mix(col, uGlow, g * 0.6 * uGlowStrength);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  return {
    mesh,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
