import {
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
  PlaneGeometry,
  Scene,
  type Texture,
  type WebGLRenderTarget,
  type WebGLRenderer,
} from 'three';

export type Quality = 'full' | 'lite';

/**
 * A black studio lit by a few long softboxes, prefiltered for reflections.
 * Metal picks up crisp highlight bands — the look of automotive and product
 * photography — while the scene itself stays dark. Generated at runtime, so
 * there is no HDR file to download.
 */
export function createStudioEnvironment(renderer: WebGLRenderer): WebGLRenderTarget {
  const scene = new Scene();
  // A soft graphite fill rather than black: chrome never mirrors a void.
  scene.background = new Color(0.07, 0.075, 0.082);
  const plane = new PlaneGeometry(1, 1);
  const owned: MeshBasicMaterial[] = [];

  const softbox = (
    width: number,
    height: number,
    position: [number, number, number],
    target: [number, number, number],
    intensity: number,
    color = 0xffffff,
  ) => {
    const material = new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), side: DoubleSide });
    owned.push(material);
    const mesh = new Mesh(plane, material);
    mesh.scale.set(width, height, 1);
    mesh.position.set(...position);
    mesh.lookAt(...target);
    scene.add(mesh);
  };

  softbox(36, 3.5, [0, 14, -2], [0, 0, 0], 3.2); // long overhead strip
  softbox(2.4, 18, [-16, 5, 6], [0, 3, 0], 2.6); // tall strip, left
  softbox(1.6, 14, [17, 4, -6], [0, 3, 0], 1.6); // tall strip, right
  softbox(46, 1.1, [0, 1.4, 18], [0, 1.4, 0], 1.4); // horizon line, front
  softbox(46, 1.1, [0, 2.4, -18], [0, 2.4, 0], 0.7); // horizon line, back
  softbox(60, 60, [0, -9, 0], [0, 0, 0], 0.05, 0xd8ccb8); // faint warm floor bounce
  // Behind the camera: the bands that run across front-facing chrome (the wordmark).
  softbox(30, 2.2, [0, 6, 20], [0, 4, 0], 2.2);
  softbox(1.4, 12, [-7, 4, 19], [0, 4, 0], 1.8);
  softbox(1.4, 12, [8, 4, 18], [0, 4, 0], 1.3);

  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.015);
  pmrem.dispose();
  plane.dispose();
  owned.forEach((m) => m.dispose());
  return target;
}

const NOISE_GLSL = /* glsl */ `
float sHash(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float sNoise(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(sHash(i), sHash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(sHash(i + vec3(0.0, 1.0, 0.0)), sHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(sHash(i + vec3(0.0, 0.0, 1.0)), sHash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(sHash(i + vec3(0.0, 1.0, 1.0)), sHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}
float sFbm(vec3 p) { float a = 0.5; float s = 0.0; for (int i = 0; i < 4; i++) { s += a * sNoise(p); p = p * 2.07 + 17.3; a *= 0.5; } return s / 0.9375; }
`;

/**
 * Procedural cast-concrete variation in object space (so moving members
 * don't "swim" through their texture). Each instance gets its own offset,
 * so precast elements read as individually poured.
 */
function addSurfaceNoise(
  material: MeshStandardMaterial,
  key: string,
  { scale, strength, grain, roughness }: { scale: number; strength: number; grain: number; roughness: number },
) {
  const f = (n: number) => n.toFixed(4);
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSurfacePos;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvSurfacePos = position + float(gl_InstanceID) * vec3(37.17, 11.3, 5.9);',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vSurfacePos;\n${NOISE_GLSL}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float surfLarge = sFbm(vSurfacePos * ${f(scale)});
        float surfGrain = sNoise(vSurfacePos * ${f(scale * 14)});
        diffuseColor.rgb *= ${f(1 - strength / 2)} + ${f(strength)} * surfLarge + ${f(grain)} * (surfGrain - 0.5);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + ${f(roughness)} * (surfGrain - surfLarge), 0.04, 1.0);`,
      );
  };
  material.customProgramCacheKey = () => key;
}

export interface SceneMaterials {
  concrete: MeshStandardMaterial;
  asphalt: MeshStandardMaterial;
  steel: MeshStandardMaterial;
  galvanised: MeshStandardMaterial;
  marking: MeshStandardMaterial;
  luminaire: MeshStandardMaterial;
  wordmark: MeshPhysicalMaterial;
  ground: MeshStandardMaterial;
  survey: MeshBasicMaterial;
  /** Materials whose reflections rotate with the scene's light sweep. */
  structural: MeshStandardMaterial[];
  dispose(): void;
}

export function createMaterials(env: Texture, quality: Quality): SceneMaterials {
  const concrete = new MeshStandardMaterial({ color: '#acafb4', roughness: 0.88, metalness: 0, envMap: env, envMapIntensity: 0.85 });
  addSurfaceNoise(concrete, 'sensan-concrete', { scale: 0.45, strength: 0.32, grain: 0.1, roughness: 0.12 });

  const asphalt = new MeshStandardMaterial({ color: '#2a2c30', roughness: 0.8, metalness: 0, envMap: env, envMapIntensity: 0.5 });
  addSurfaceNoise(asphalt, 'sensan-asphalt', { scale: 0.3, strength: 0.22, grain: 0.16, roughness: 0.1 });

  const steel =
    quality === 'full'
      ? new MeshPhysicalMaterial({ color: '#d4d7db', metalness: 1, roughness: 0.3, anisotropy: 0.5, envMap: env, envMapIntensity: 1.3 })
      : new MeshStandardMaterial({ color: '#d4d7db', metalness: 1, roughness: 0.32, envMap: env, envMapIntensity: 1.3 });

  const galvanised = new MeshStandardMaterial({ color: '#90959b', metalness: 0.85, roughness: 0.48, envMap: env, envMapIntensity: 0.8 });
  const marking = new MeshStandardMaterial({ color: '#d4d6d9', roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.05 });
  const luminaire = new MeshStandardMaterial({ color: '#1e1f22', roughness: 0.5, emissive: '#fff0da', emissiveIntensity: 0 });

  const wordmark = new MeshPhysicalMaterial({
    color: '#e6e8eb',
    metalness: 1,
    roughness: 0.08,
    anisotropy: quality === 'full' ? 0.7 : 0,
    envMap: env,
    envMapIntensity: 1.85,
  });

  const ground = new MeshStandardMaterial({ color: '#26282c', roughness: 0.72, metalness: 0.05, envMap: env, envMapIntensity: 0.45 });
  addSurfaceNoise(ground, 'sensan-ground', { scale: 0.05, strength: 0.22, grain: 0.1, roughness: 0.12 });

  const survey = new MeshBasicMaterial({ color: '#c6cacf', transparent: true, opacity: 0.85, depthWrite: false });

  const all = [concrete, asphalt, steel, galvanised, marking, luminaire, wordmark, ground, survey];
  return {
    concrete,
    asphalt,
    steel,
    galvanised,
    marking,
    luminaire,
    wordmark,
    ground,
    survey,
    structural: [concrete, asphalt, steel, galvanised, ground],
    dispose: () => all.forEach((m) => m.dispose()),
  };
}
