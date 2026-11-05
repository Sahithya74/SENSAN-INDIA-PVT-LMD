import { Euler, ExtrudeGeometry, Group, Mesh, Quaternion, Shape, Vector2, Vector3, type Material } from 'three';
import { CAP_HEIGHT, WORDMARK_MEMBERS, WORDMARK_WIDTH } from '../../brand/wordmarkGeometry';
import { FOCUS_X } from './layout';
import { easeOutBack, easeOutCubic, lerp, mulberry32, range } from './math';

/** World width of the wordmark: it fits inside one span, framed by two piers and the deck. */
export const WORDMARK_WORLD_WIDTH = 24;
const SCALE = WORDMARK_WORLD_WIDTH / WORDMARK_WIDTH;
const CENTRE_Y = 7;
const DEPTH = 22;

interface MemberAnim {
  mesh: Mesh;
  final: Vector3;
  start: Vector3;
  startRotation: Quaternion;
  window: [number, number];
}

const IDENTITY = new Quaternion();

/**
 * The wordmark as a physical object: each member is extruded from the same
 * polygons as the SVG mark (with the bevel inset so the joint seams stay
 * open) and flies out of the structure's depth to lock into its letter.
 */
export function createWordmark3D(material: Material, shadows: boolean) {
  const group = new Group();
  const rand = mulberry32(2024);
  const members: MemberAnim[] = [];

  WORDMARK_MEMBERS.forEach((member, index) => {
    const xs = member.points.map((p) => p[0]);
    const ys = member.points.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2 - WORDMARK_WIDTH / 2;
    const cy = CAP_HEIGHT / 2 - (Math.min(...ys) + Math.max(...ys)) / 2;

    // Local shape around the member's own centre, so it rotates about itself.
    const shape = new Shape(member.points.map(([x, y]) => new Vector2(x - WORDMARK_WIDTH / 2 - cx, CAP_HEIGHT / 2 - y - cy)));
    const geometry = new ExtrudeGeometry(shape, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.9,
      bevelSize: 0.45,
      bevelOffset: -0.45,
      bevelSegments: 2,
      curveSegments: 1,
    });
    geometry.translate(0, 0, -DEPTH / 2);

    const mesh = new Mesh(geometry, material);
    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;
    group.add(mesh);

    const final = new Vector3(cx, cy, 0);
    const start = new Vector3(
      cx + (rand() - 0.5) * 180,
      cy + (rand() - 0.35) * 140,
      -(120 + rand() * 260),
    );
    const startRotation = new Quaternion().setFromEuler(
      new Euler((rand() - 0.5) * 2.4, (rand() - 0.5) * 2.0, (rand() - 0.5) * 1.4),
    );
    const t0 = 0.884 + (index / (WORDMARK_MEMBERS.length - 1)) * 0.048 + rand() * 0.006;
    members.push({ mesh, final, start, startRotation, window: [t0, t0 + 0.034] });
  });

  group.scale.setScalar(SCALE);
  group.position.set(FOCUS_X, CENTRE_Y, 0);

  return {
    group,
    centre: new Vector3(FOCUS_X, CENTRE_Y, 0),
    /**
     * `lean` (radians, negative = top away from camera) is chosen per camera
     * path so the faces catch the edge of the softbox band behind the
     * camera: bright at the top of each bar, falling off towards the base.
     */
    update(p: number, lean: number) {
      group.visible = p > 0.88;
      if (!group.visible) return;
      const rise = easeOutCubic(range(p, 0.88, 0.95));
      group.position.y = lerp(CENTRE_Y - 0.8, CENTRE_Y, rise);
      group.rotation.y = lerp(-0.12, 0, rise);
      group.rotation.x = lerp(0.05, lean, rise);
      for (const m of members) {
        if (p <= m.window[0]) {
          m.mesh.visible = false;
          continue;
        }
        m.mesh.visible = true;
        const e = easeOutBack(range(p, m.window[0], m.window[1]), 1.15);
        m.mesh.position.lerpVectors(m.start, m.final, e);
        m.mesh.quaternion.slerpQuaternions(m.startRotation, IDENTITY, e);
      }
    },
    dispose() {
      members.forEach((m) => m.mesh.geometry.dispose());
    },
  };
}
