import { useMemo } from "react";
import * as THREE from "three";
import { SPECIAL_ROOM_ID } from "@/controller/gatedRoom";
import { veilTexture } from "@/textures/canvasTextures";
import { useDisposable } from "@/scene/useDisposable";
import { useGallery } from "@/store/useGallery";
import type { CompiledSpace } from "@/space/types";

/** Builds the same arch silhouette wallGeom cuts as a hole (see geometry/walls.ts),
 * but filled — so the panel matches the doorway's own curve exactly instead of
 * leaving the arched cap open above a rectangular strip. `doorW` is passed in
 * already inset slightly narrower than the real hole, for a sliver of wall/frame
 * showing at the edges. */
function archShape(doorW: number, doorH: number): THREE.Shape {
  const r = doorW / 2;
  const sy = Math.max(0.4, doorH - r);
  const shape = new THREE.Shape();
  shape.moveTo(-doorW / 2, 0);
  shape.lineTo(-doorW / 2, sy);
  shape.absarc(0, sy, r, Math.PI, 0, true);
  shape.lineTo(doorW / 2, 0);
  shape.closePath();
  return shape;
}

/** ShapeGeometry doesn't normalize its generated UVs to 0-1 — it uses the raw
 * shape-local (x, y) as the UV directly, so most of a shape this tall would
 * sample outside [0,1] and clamp to a single edge texel instead of showing the
 * curtain texture. Rescale into 0-1 against the shape's own bounding box. */
function normalizeUV(geometry: THREE.ShapeGeometry): void {
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  const uv = geometry.attributes.uv;
  const pos = geometry.attributes.position;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
  }
  uv.needsUpdate = true;
}

/** A drawn curtain filling the Special Room's doorway while it's locked, in place
 * of a hung strip — one panel across the whole arched opening so the room's
 * interior isn't visible around/above it, tagged with the door's own userData so
 * clicking the curtain opens the token gate exactly like clicking the doorway (see
 * controller/picking.ts's occlusion rule). */
export default function GateVeil({ compiled }: { compiled: CompiledSpace }) {
  const unlocked = useGallery((s) => s.specialUnlocked);

  const door = compiled.doors.find((d) => d.to === SPECIAL_ROOM_ID);
  const texture = useMemo(() => veilTexture(), []);
  const geometry = useMemo(() => {
    const geo = new THREE.ShapeGeometry(archShape(compiled.spec.doorW * 0.92, compiled.spec.doorH));
    normalizeUV(geo);
    return geo;
  }, [compiled.spec.doorW, compiled.spec.doorH]);
  useDisposable(geometry);

  if (unlocked || !door) return null;

  const [x, , z] = door.hotspotPosition;

  return (
    <mesh
      geometry={geometry}
      position={[x, 0, z]}
      rotation={[0, door.hotspotRotationY, 0]}
      userData={{ type: "door", door }}
    >
      <meshStandardMaterial map={texture} side={THREE.DoubleSide} roughness={0.85} />
    </mesh>
  );
}
