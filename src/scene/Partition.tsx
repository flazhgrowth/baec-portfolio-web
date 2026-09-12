import { useMaterials } from "@/scene/useMaterials";
import type { Partition as PartitionSpec } from "@/space/types";

/** The freestanding slab some rooms hang art on both faces of. Always axis-aligned
 * (s[0] spans X, s[1] is the Z thickness) — never rotated. */
export default function Partition({ partition }: { partition: PartitionSpec }) {
  const materials = useMaterials();
  return (
    <mesh material={materials.wall} position={[partition.c[0], partition.h / 2, partition.c[1]]}>
      <boxGeometry args={[partition.s[0], partition.h, partition.s[1]]} />
    </mesh>
  );
}
