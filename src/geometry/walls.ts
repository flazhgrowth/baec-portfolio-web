import * as THREE from "three";
import type { WallHole } from "@/space/types";

/**
 * Extrudes a wall panel `len` × `h` × `t`, with each hole cut as either a
 * rectangular or an arched doorway. Local space: x = along the wall (u), y = up.
 *
 * Arch construction: the hole's straight sides run up to a springline at
 * `sy = max(0.4, holeHeight - radius)`, then an `absarc` sweeps clockwise over the
 * top through the apex — matching design/gallery3d.js's `wallGeom` exactly.
 */
export function wallGeom(
  len: number,
  h: number,
  t: number,
  holes: WallHole[],
  arch: boolean,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-len / 2, 0);
  shape.lineTo(len / 2, 0);
  shape.lineTo(len / 2, h);
  shape.lineTo(-len / 2, h);
  shape.closePath();

  for (const hole of holes) {
    const path = new THREE.Path();
    const x0 = hole.u - hole.w / 2;
    const x1 = hole.u + hole.w / 2;
    if (arch) {
      const r = hole.w / 2;
      const sy = Math.max(0.4, hole.h - r);
      path.moveTo(x0, 0);
      path.lineTo(x0, sy);
      path.absarc(hole.u, sy, r, Math.PI, 0, true);
      path.lineTo(x1, 0);
      path.closePath();
    } else {
      path.moveTo(x0, 0);
      path.lineTo(x0, hole.h);
      path.lineTo(x1, hole.h);
      path.lineTo(x1, 0);
      path.closePath();
    }
    shape.holes.push(path);
  }

  return new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 28 });
}
