import Lights from "@/scene/Lights";
import Room from "@/scene/Room";
import Passage from "@/scene/Passage";
import Hotspot from "@/scene/Hotspot";
import Hang from "@/scene/Hang";
import GateVeil from "@/scene/GateVeil";
import { MaterialsProvider, useCreateMaterials } from "@/scene/useMaterials";
import type { CompiledSpace } from "@/space/types";

/** The static scene: everything that is a THREE.Object3D positioned from compiled
 * data, and never mutated after mount. Declarative JSX end to end — the camera and
 * interaction layer live entirely in CameraController, outside this tree. */
export default function Space({ compiled }: { compiled: CompiledSpace }) {
  const spec = compiled.spec;
  const materials = useCreateMaterials(spec);
  const rooms = Object.values(compiled.roomById);

  return (
    <MaterialsProvider value={materials}>
      <Lights spec={spec} />

      {rooms.map((room) => (
        <Room key={room.id} room={room} spec={spec} holesForRoom={compiled.holesFor[room.id] ?? {}} />
      ))}

      {compiled.passages.map((passage, i) => (
        <Passage key={i} passage={passage} spec={spec} />
      ))}

      {compiled.doors.map((door, i) => (
        <Hotspot
          key={i}
          width={spec.doorW * 0.96}
          height={spec.doorH * 0.96}
          position={door.hotspotPosition}
          rotation={[0, door.hotspotRotationY, 0]}
          userData={{ type: "door", door }}
        />
      ))}

      <GateVeil compiled={compiled} />

      {rooms.map((room) =>
        room.art.map((placement, i) => (
          <Hang
            key={`${room.id}:${i}`}
            room={room}
            placement={placement}
            rec={compiled.artRecordsByRoom[room.id][i]}
            spec={spec}
            lit={compiled.litIndexes[room.id]?.has(i) ?? false}
          />
        )),
      )}
    </MaterialsProvider>
  );
}
