import { Euler, InstancedMesh, Matrix4, Quaternion, Vector3, type BufferGeometry, type Color, type Material } from 'three';
import { easeOutBack, range } from './math';

export interface Pose {
  position: Vector3;
  quaternion: Quaternion;
  scale: Vector3;
}

export function pose(x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1): Pose {
  return {
    position: new Vector3(x, y, z),
    quaternion: new Quaternion().setFromEuler(new Euler(rx, ry, rz)),
    scale: new Vector3(sx, sy, sz),
  };
}

/**
 * One structural member's journey: from `start` to `final` across `window`
 * (scroll progress). While placed but not yet aligned it hovers at `gap`;
 * the gap closes, with a small overshoot, during `align`.
 */
export interface PartAnim {
  final: Pose;
  start: Pose;
  window: readonly [number, number];
  ease: (t: number) => number;
  gap?: Vector3;
  align?: readonly [number, number];
  /** Collapse to zero scale until the window opens (for parts that enter from off-frame). */
  hiddenBefore?: boolean;
  /** Overrides the start pose over time — e.g. the member floating in the opening shot. */
  drift?: (p: number, time: number, out: Pose) => void;
}

const _m = new Matrix4();
const _p = new Vector3();
const _q = new Quaternion();
const _s = new Vector3();
const _gap = new Vector3();
const _drift: Pose = { position: new Vector3(), quaternion: new Quaternion(), scale: new Vector3(1, 1, 1) };

export class AnimatedInstances {
  readonly mesh: InstancedMesh;

  constructor(
    geometry: BufferGeometry,
    material: Material | Material[],
    readonly parts: PartAnim[],
    options: { castShadow?: boolean; receiveShadow?: boolean; tint?: (index: number) => Color } = {},
  ) {
    this.mesh = new InstancedMesh(geometry, material, parts.length);
    // Members travel far from their final positions, so per-mesh culling
    // bounds would be wrong most of the time. The scene is small enough not to need it.
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = !!options.castShadow;
    this.mesh.receiveShadow = !!options.receiveShadow;
    if (options.tint) parts.forEach((_, i) => this.mesh.setColorAt(i, options.tint!(i)));
  }

  update(p: number, time: number) {
    const { parts, mesh } = this;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      let start = part.start;
      if (part.drift) {
        part.drift(p, time, _drift);
        start = _drift;
      }

      if (part.hiddenBefore && p <= part.window[0]) {
        _s.setScalar(1e-5);
        _m.compose(start.position, start.quaternion, _s);
        mesh.setMatrixAt(i, _m);
        continue;
      }

      const e = part.ease(range(p, part.window[0], part.window[1]));
      _p.lerpVectors(start.position, part.final.position, e);
      if (part.gap) {
        const aligned = part.align ? easeOutBack(range(p, part.align[0], part.align[1]), 1.6) : 1;
        _gap.copy(part.gap).multiplyScalar(Math.min(e, 1) * (1 - aligned));
        _p.add(_gap);
      }
      _q.slerpQuaternions(start.quaternion, part.final.quaternion, e);
      _s.lerpVectors(start.scale, part.final.scale, e);
      _m.compose(_p, _q, _s);
      mesh.setMatrixAt(i, _m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}
