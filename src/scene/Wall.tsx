import { useMemo } from "react";
import { WALL, WALL_THICKNESS, innerPlane, wallOrigin } from "@/geometry/layout";
import { wallGeom } from "@/geometry/walls";
import { useDisposable } from "@/scene/useDisposable";
import { useMaterials } from "@/scene/useMaterials";
import type { CompiledRoom, SpaceSpec, WallHole } from "@/space/types";

interface WallProps {
  room: CompiledRoom;
  side: "N" | "S" | "W" | "E";
  spec: SpaceSpec;
  holes: WallHole[];
}

/** One wall panel (extruded, with an optional door hole) plus its baseboard
 * segments — split around the first hole only, matching design/gallery3d.js's
 * `addWall` exactly (a wall never carries more than one doorway). */
export default function Wall({ room, side, spec, holes }: WallProps) {
  const materials = useMaterials();
  const [w, d] = room.s;
  const len = side === "N" || side === "S" ? w : d;

  const geometry = useMemo(
    () => wallGeom(len, room.h, WALL_THICKNESS, holes, spec.arch),
    [len, room.h, holes, spec.arch],
  );
  useDisposable(geometry);

  const [ox, oz] = wallOrigin(room, side);
  const rotationY = WALL[side].rot;

  const segments = useMemo(() => {
    if (spec.baseH <= 0) return [];
    const raw: Array<[number, number]> = holes.length
      ? [
          [-len / 2, holes[0].u - holes[0].w / 2],
          [holes[0].u + holes[0].w / 2, len / 2],
        ]
      : [[-len / 2, len / 2]];
    return raw.filter(([s0, s1]) => s1 - s0 >= 0.05);
  }, [holes, len, spec.baseH]);

  const [ix, iz] = innerPlane(room, side);
  const n = WALL[side].inN;
  const dir = WALL[side].dir;

  return (
    <>
      <mesh geometry={geometry} material={materials.wall} position={[ox, 0, oz]} rotation={[0, rotationY, 0]} />
      {segments.map(([s0, s1], i) => {
        const mid = (s0 + s1) / 2;
        const sl = s1 - s0;
        const off = side === "E" ? -mid : mid;
        return (
          <mesh
            key={i}
            material={materials.base}
            position={[ix + dir[0] * off + n[0] * 0.018, spec.baseH / 2, iz + dir[2] * off + n[2] * 0.018]}
            rotation={[0, rotationY, 0]}
          >
            <boxGeometry args={[sl, spec.baseH, 0.035]} />
          </mesh>
        );
      })}
    </>
  );
}
