import * as THREE from "three";
import type { ArtRecord, DoorRecord } from "@/space/types";

export interface DoorHit {
  type: "door";
  door: DoorRecord;
}
export interface ArtHit {
  type: "art";
  rec: ArtRecord;
}
export type Hit = DoorHit | ArtHit;

/** Raycasts the whole scene and walks the sorted hit list: the first hit carrying
 * `userData.type` wins; any other mesh (a wall, a floor, a frame) means the target
 * is occluded and the pick fails. Hotspots are opacity-0, depthWrite:false planes
 * (not `visible:false`) so they still take part in sorting. */
export function pick(
  raycaster: THREE.Raycaster,
  pointer: THREE.Vector2,
  camera: THREE.Camera,
  scene: THREE.Scene,
): THREE.Object3D | null {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  for (const h of hits) {
    if (h.object.userData && h.object.userData.type) return h.object;
    if ((h.object as THREE.Mesh).isMesh) return null;
  }
  return null;
}

export function hitOf(object: THREE.Object3D | null): Hit | null {
  if (!object) return null;
  const u = object.userData as { type?: string; door?: DoorRecord; rec?: ArtRecord };
  if (u.type === "door" && u.door) return { type: "door", door: u.door };
  if (u.type === "art" && u.rec) return { type: "art", rec: u.rec };
  return null;
}

export function tooltipTextFor(hit: Hit): string {
  return hit.type === "door" ? `→ ${hit.door.label}` : hit.rec.title;
}
