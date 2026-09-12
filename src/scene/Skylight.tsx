import { useMemo } from "react";
import { skyPaneTexture } from "@/textures/canvasTextures";
import type { CompiledRoom, SpaceSpec } from "@/space/types";

const FALLBACK_SKY = { pane: "#fcfdff", pane2: undefined as string | undefined, color: "#f0f5ff", i: 95, dist: 52 };

export default function Skylight({ room, spec }: { room: CompiledRoom; spec: SpaceSpec }) {
  const [cx, cz] = room.c;
  const [w, d] = room.s;
  const sky = spec.sky ?? FALLBACK_SKY;
  const texture = useMemo(
    () => (sky.pane2 ? skyPaneTexture(sky.pane, sky.pane2) : null),
    [sky.pane, sky.pane2],
  );

  return (
    <>
      <mesh position={[cx, room.h - 0.03, cz]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 0.44, d * 0.44]} />
        {texture ? <meshBasicMaterial map={texture} /> : <meshBasicMaterial color={sky.pane} />}
      </mesh>
      <pointLight
        color={sky.color}
        intensity={sky.i}
        distance={sky.dist}
        decay={2}
        position={[cx, room.h - 1.2, cz]}
      />
    </>
  );
}
