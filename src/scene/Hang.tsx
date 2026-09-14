import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CENTER_HEIGHT, resolveArtPlacement } from "@/geometry/layout";
import { ARTWORKS } from "@/space/artworks";
import { placeholderTexture, plaqueTexture } from "@/textures/canvasTextures";
import { readPhotoTexture } from "@/textures/photoTextures";
import Hotspot from "@/scene/Hotspot";
import { useMaterials } from "@/scene/useMaterials";
import { useGallery } from "@/store/useGallery";
import { isRealArtwork } from "@/space/types";
import type { ArtPlacement, ArtRecord, CompiledRoom, SpaceSpec } from "@/space/types";

interface HangProps {
  room: CompiledRoom;
  placement: ArtPlacement;
  rec: ArtRecord;
  spec: SpaceSpec;
  lit: boolean;
}

/** One hung picture: frame, mat, image, wall plaque and a click hotspot, plus (for
 * placements in the room's lit set — see compileSpace.ts's `litIndexes`) a
 * spotlight and track fixture that only actually mounts while the visitor is
 * standing in that room (ArtLighting's `active` check). The spotlight and track
 * head are siblings of the picture group, not children of it — their world-space
 * placement formula (`px + n*standoff`, at ceiling height) only matches
 * design/gallery3d.js's `addArt` when computed in world space, same as the original
 * (which adds them to `scene`, not to the picture's own THREE.Group). */
export default function Hang({ room, placement, rec, spec, lit }: HangProps) {
  const materials = useMaterials();
  const src = ARTWORKS[placement.k];
  const h = placement.w / src.ar;
  const { px, pz, ry, n } = resolveArtPlacement(room, placement);
  const centerY = CENTER_HEIGHT + (placement.v ?? 0);

  // The spotlight's aim point can be shifted along the wall independently of
  // the picture itself (litOffset) — e.g. to center one light over a cluster
  // of placements instead of just this one's own position.
  const litOffset = placement.litOffset ?? 0;
  const { px: aimX, pz: aimZ } = litOffset
    ? resolveArtPlacement(room, { ...placement, u: placement.u + litOffset })
    : { px, pz };

  const fw = placement.w + (spec.matW + spec.frameW) * 2;
  const fh = h + (spec.matW + spec.frameW) * 2;

  const texture = isRealArtwork(src)
    ? readPhotoTexture(src.src)
    : placeholderTexture(src.ph, src.ar, spec.darkPlaceholder);

  const plaqueTex = useMemo(
    () => plaqueTexture(src.title, src.meta, spec.plaque),
    [src.title, src.meta, spec.plaque],
  );

  return (
    <>
      <group position={[px, centerY, pz]} rotation={[0, ry, 0]}>
        <mesh material={materials.frame} position={[0, 0, spec.frameD / 2 - 0.004]}>
          <boxGeometry args={[fw, fh, spec.frameD]} />
        </mesh>
        <mesh material={materials.mat} position={[0, 0, spec.frameD + 0.001]}>
          <planeGeometry args={[placement.w + spec.matW * 2, h + spec.matW * 2]} />
        </mesh>
        <mesh position={[0, 0, spec.frameD + 0.003]}>
          <planeGeometry args={[placement.w, h]} />
          <meshStandardMaterial map={texture} roughness={0.84} metalness={0} />
        </mesh>
        <mesh position={[fw / 2 + 0.26, -fh / 2 + 0.06, 0.004]}>
          <planeGeometry args={[0.33, 0.139]} />
          <meshStandardMaterial map={plaqueTex} roughness={0.95} />
        </mesh>
        <Hotspot width={fw} height={fh} position={[0, 0, spec.frameD + 0.02]} userData={{ type: "art", rec }} />
      </group>
      {lit && (
        <ArtLighting
          room={room}
          spec={spec}
          px={aimX}
          pz={aimZ}
          centerY={centerY}
          n={n}
          materials={materials}
        />
      )}
    </>
  );
}

function ArtLighting({
  room,
  spec,
  px,
  pz,
  centerY,
  n,
  materials,
}: {
  room: CompiledRoom;
  spec: SpaceSpec;
  px: number;
  pz: number;
  centerY: number;
  n: [number, number, number];
  materials: ReturnType<typeof useMaterials>;
}) {
  const lightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);
  const headRef = useRef<THREE.Mesh>(null);

  // Only the room the visitor is currently standing in gets its lights
  // actually mounted — everywhere else they stay in `litIndexes`' eligible
  // set (so the room "remembers" what should light up) but render nothing,
  // which is what lets MAX_LIT_PER_ROOM be a real per-room number instead of
  // a sum across every room in the variant at once. See compileSpace.ts.
  const currentRoomId = useGallery((s) => s.roomId);
  const active = room.id === currentRoomId;

  const lightX = px + n[0] * spec.spot.standoff;
  const lightZ = pz + n[2] * spec.spot.standoff;

  useLayoutEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
    }
  }, [active]);

  useLayoutEffect(() => {
    if (!headRef.current) return;
    headRef.current.lookAt(px, centerY, pz);
    headRef.current.rotateX(Math.PI / 2);
  }, [px, pz, centerY, active]);

  if (!active) return null;

  return (
    <>
      <spotLight
        ref={lightRef}
        color={spec.spot.color}
        intensity={spec.spot.i}
        distance={spec.spot.dist}
        angle={spec.spot.angle}
        penumbra={spec.spot.pen}
        decay={1.7}
        position={[lightX, room.h - 0.24, lightZ]}
      />
      <object3D ref={targetRef} position={[px, centerY + 0.1, pz]} />
      {spec.track && (
        <>
          <mesh ref={headRef} material={materials.track} position={[lightX, room.h - 0.135, lightZ]}>
            <cylinderGeometry args={[0.032, 0.046, 0.115, 12]} />
          </mesh>
          <mesh material={materials.track} position={[lightX, room.h - 0.055, lightZ]}>
            <cylinderGeometry args={[0.011, 0.011, 0.1, 8]} />
          </mesh>
        </>
      )}
    </>
  );
}
