import Wall from "@/scene/Wall";
import Skylight from "@/scene/Skylight";
import Partition from "@/scene/Partition";
import { useMaterials } from "@/scene/useMaterials";
import type { CompiledRoom, SpaceSpec, WallHole, WallSide } from "@/space/types";

const SIDES: Array<"N" | "S" | "W" | "E"> = ["N", "S", "W", "E"];

interface RoomProps {
  room: CompiledRoom;
  spec: SpaceSpec;
  holesForRoom: Partial<Record<WallSide, WallHole[]>>;
}

export default function Room({ room, spec, holesForRoom }: RoomProps) {
  const materials = useMaterials();
  const [cx, cz] = room.c;
  const [w, d] = room.s;

  return (
    <>
      <mesh material={materials.floor} position={[cx, 0, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
      </mesh>
      <mesh material={materials.ceil} position={[cx, room.h, cz]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
      </mesh>

      {SIDES.map((side) => (
        <Wall key={side} room={room} side={side} spec={spec} holes={holesForRoom[side] ?? []} />
      ))}

      {room.skylight ? (
        <Skylight room={room} spec={spec} />
      ) : spec.fill > 0 ? (
        <pointLight
          color={0xfff6ea}
          intensity={spec.fill}
          distance={Math.max(w, d) * 1.6}
          decay={2}
          position={[cx, room.h - 0.6, cz]}
        />
      ) : null}

      {room.partition && <Partition partition={room.partition} />}

      {spec.track && (
        <mesh material={materials.rail} position={[cx, room.h - 0.022, cz]}>
          <boxGeometry args={[w - 1.6, 0.028, 0.028]} />
        </mesh>
      )}
    </>
  );
}
