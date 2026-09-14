import * as THREE from "three";
import { SPECIAL_ROOM_ID } from "@/controller/gatedRoom";
import { ribbonTexture } from "@/textures/canvasTextures";
import { useGallery } from "@/store/useGallery";
import type { CompiledSpace } from "@/space/types";

/** Two crossed hazard-tape strips hung across the Special Room's doorway while it's
 * locked. Positioned at the same hotspot the door itself uses and tagged with the
 * same userData, so clicking the tape opens the token gate exactly like clicking
 * the doorway — the ribbon sits in front of the door hotspot and would otherwise
 * occlude it from the manual raycaster (see controller/picking.ts's occlusion
 * rule: any mesh without userData.type blocks the pick). */
export default function GateRibbon({ compiled }: { compiled: CompiledSpace }) {
  const unlocked = useGallery((s) => s.specialUnlocked);
  if (unlocked) return null;

  const door = compiled.doors.find((d) => d.to === SPECIAL_ROOM_ID);
  if (!door) return null;

  const texture = ribbonTexture();
  const width = compiled.spec.doorW * 0.94;
  const stripHeight = 0.3;
  const [x, , z] = door.hotspotPosition;
  const doorH = compiled.spec.doorH;

  return (
    <>
      {[doorH * 0.4, doorH * 0.65].map((y, i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, door.hotspotRotationY, 0]} userData={{ type: "door", door }}>
          <planeGeometry args={[width, stripHeight]} />
          <meshStandardMaterial map={texture} side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
      ))}
    </>
  );
}
