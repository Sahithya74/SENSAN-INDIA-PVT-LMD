import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  PCFShadowMap,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  SpotLight,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { Orientation } from '../../lib/deviceTier';
import { sampleCamera } from './cameraPath';
import { createDust } from './dust';
import { createGround } from './ground';
import { createLightTrails } from './lightTrails';
import { createMaterials, createStudioEnvironment, type Quality } from './materials';
import { easeInOutCubic, easeInOutSine, lerp, range, smoothstep } from './math';
import { createViaduct } from './viaduct';
import { createWordmark3D } from './wordmark3d';
import { SKY, createSky } from './sky';

export type { Quality };

export interface HeroSceneOptions {
  quality: Quality;
  /** Deterministic stills for frame export: no loop, time derived from progress. */
  renderMode?: boolean;
  /** Force a camera path; otherwise chosen from the canvas aspect ratio. */
  orientation?: Orientation;
  maxPixelRatio?: number;
  onContextLost?: () => void;
}

export interface HeroSceneController {
  ready: Promise<void>;
  setProgress(p: number): void;
  setPointer(x: number, y: number): void;
  setActive(active: boolean): void;
  /** Render one deterministic frame at progress p (render mode). */
  renderAt(p: number): void;
  dispose(): void;
}

// Three mixes fog in after tone mapping, in output space, so distant geometry
// resolves to exactly the sky's horizon colour — atmospheric perspective.
const HORIZON = new Color(SKY.horizon);
const EXPOSURE = 1.24;

/** Atmosphere by stage: light haze while building, clear air for the aerial completion shot. */
function fogDensityAt(p: number) {
  let d = lerp(0.0078, 0.0046, smoothstep(range(p, 0.7, 0.8)));
  d = lerp(d, 0.0058, smoothstep(range(p, 0.87, 0.95)));
  return d;
}

export function createHeroScene(canvas: HTMLCanvasElement, options: HeroSceneOptions): HeroSceneController {
  const { quality, renderMode = false } = options;
  const shadows = quality === 'full';

  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    stencil: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: renderMode,
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = EXPOSURE;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.setClearColor(HORIZON);

  const maxDpr = options.maxPixelRatio ?? (quality === 'full' ? 1.5 : 1.25);
  let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

  const scene = new Scene();
  const fog = new FogExp2(HORIZON.clone(), fogDensityAt(0));
  scene.fog = fog;
  // Shared by every custom shader that fades with distance.
  const fogUniform = { value: fog.density };
  const sky = createSky();
  scene.add(sky.mesh);

  const envTarget = createStudioEnvironment(renderer);
  const materials = createMaterials(envTarget.texture, quality);

  const hemi = new HemisphereLight('#8a929c', '#2a2c30', 0.9);
  scene.add(hemi);

  const key = new DirectionalLight('#fff4e6', 3.2);
  key.position.set(-40, 55, 38);
  key.target.position.set(20, 0, 0);
  scene.add(key, key.target);
  if (shadows) {
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -130, right: 130, top: 130, bottom: -130, near: 1, far: 320 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0003;
    key.shadow.normalBias = 0.035;
  }

  const rim = new DirectionalLight('#9db0c8', 1.1);
  rim.position.set(110, 40, -70);
  scene.add(rim);

  // Accent for the wordmark under the deck, where the key light is shadowed.
  const portal = new SpotLight('#ffffff', 0, 80, 0.55, 0.65, 2);
  portal.position.set(15, 2.5, 30);
  portal.target.position.set(15, 7, 0);
  scene.add(portal, portal.target);

  const viaduct = createViaduct(materials, shadows, fogUniform);
  const ground = createGround(materials, fogUniform, shadows);
  const wordmark = createWordmark3D(materials.wordmark, shadows);
  const dust = createDust(quality === 'full' ? 1500 : 700, fogUniform);
  const trails = createLightTrails(quality === 'full' ? 14 : 9, fogUniform);
  scene.add(viaduct.group, ground.group, wordmark.group, dust.points, trails.mesh);

  const camera = new PerspectiveCamera(32, 1, 0.5, 1400);
  const camPos = new Vector3();
  const camLook = new Vector3();
  const right = new Vector3();
  const up = new Vector3(0, 1, 0);

  let orientation: Orientation = options.orientation ?? 'landscape';
  let width = 1;
  let height = 1;

  const resize = () => {
    width = Math.max(1, canvas.clientWidth);
    height = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    orientation = options.orientation ?? (camera.aspect < 0.9 ? 'portrait' : 'landscape');
  };
  resize();

  let progress = 0;
  const pointerTarget = { x: 0, y: 0 };
  const pointerNow = { x: 0, y: 0 };

  const update = (p: number, time: number) => {
    fog.density = fogUniform.value = fogDensityAt(p);
    viaduct.update(p, time);
    ground.update(p);
    wordmark.update(p, orientation === 'portrait' ? -0.11 : -0.14);
    trails.update(time, p);

    // Light: a softer opening that warms up as the site is set out, fullest at completion.
    const opening = smoothstep(range(p, 0.03, 0.2));
    const finale = smoothstep(range(p, 0.72, 0.84));
    key.intensity = lerp(1.8, 3.2, opening) + 0.6 * finale;
    hemi.intensity = lerp(0.6, 0.95, opening) + 0.3 * finale;
    rim.intensity = lerp(2.0, 1.4, opening);
    portal.intensity = 3200 * smoothstep(range(p, 0.88, 0.95));

    // Reflections sweep across the metal: once in the opening shot, again
    // across the wordmark at the reveal, and subtly with the cursor.
    const sweep = -0.4 + 0.9 * easeInOutSine(range(p, 0, 0.12)) + pointerNow.x * 0.18 + time * 0.012;
    for (const m of materials.structural) m.envMapRotation.set(0, sweep, 0);
    // The wordmark's sweep settles at the designed studio orientation (0).
    materials.wordmark.envMapRotation.set(0, 1.6 * (1 - easeInOutCubic(range(p, 0.9, 1))) + pointerNow.x * 0.3, 0);

    const fov = sampleCamera(p, orientation, camera.aspect, camPos, camLook);
    right.subVectors(camLook, camPos).cross(up).normalize();
    camPos.addScaledVector(right, pointerNow.x * 0.9).addScaledVector(up, pointerNow.y * 0.5);
    camLook.addScaledVector(right, pointerNow.x * 0.3);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    if (camera.fov !== fov) {
      camera.fov = fov;
    }
    camera.updateProjectionMatrix();

    const bufferHeight = height * dpr;
    dust.update(time, p, bufferHeight / (2 * Math.tan((camera.fov * Math.PI) / 360)));
  };

  // Loop with adaptive resolution: if frames run long, step DPR down.
  let raf = 0;
  let last = 0;
  let time = 0;
  let wantActive = true;
  let slowFrames = 0;
  let sampled = 0;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000 || 0.016);
    last = now;
    time += dt;

    const k = 1 - Math.exp(-dt * 4);
    pointerNow.x += (pointerTarget.x - pointerNow.x) * k;
    pointerNow.y += (pointerTarget.y - pointerNow.y) * k;

    update(progress, time);
    renderer.render(scene, camera);

    sampled++;
    if (dt > 0.024) slowFrames++;
    if (sampled >= 90) {
      if (slowFrames > 45 && dpr > 1) {
        dpr = Math.max(1, dpr - 0.25);
        resize();
      }
      sampled = 0;
      slowFrames = 0;
    }
  };

  const start = () => {
    if (raf || renderMode || document.hidden || !wantActive) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const onVisibility = () => (document.hidden ? stop() : start());
  const onLost = (event: Event) => {
    event.preventDefault();
    stop();
    options.onContextLost?.();
  };
  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (!raf) {
      update(progress, time);
      renderer.render(scene, camera);
    }
  });

  if (!renderMode) {
    document.addEventListener('visibilitychange', onVisibility);
    resizeObserver.observe(canvas);
  }
  canvas.addEventListener('webglcontextlost', onLost);

  update(0, 0);
  const ready = renderer.compileAsync(scene, camera).then(() => {
    update(progress, time);
    renderer.render(scene, camera);
    start();
  });

  return {
    ready,
    setProgress(p) {
      progress = p;
    },
    setPointer(x, y) {
      pointerTarget.x = x;
      pointerTarget.y = y;
    },
    setActive(active) {
      wantActive = active;
      if (active) start();
      else stop();
    },
    renderAt(p) {
      resize();
      update(p, p * 8);
      renderer.render(scene, camera);
    },
    dispose() {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      resizeObserver.disconnect();
      viaduct.dispose();
      ground.dispose();
      wordmark.dispose();
      dust.dispose();
      trails.dispose();
      materials.dispose();
      envTarget.dispose();
      sky.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
