import { useMaterials } from "@/scene/useMaterials";
import type { PassageRecord, SpaceSpec } from "@/space/types";

/** A connecting corridor between two rooms — floor, ceiling, two side walls and a
 * warm point light, matching design/gallery3d.js's `addCorridor`. Only rendered
 * when the two rooms aren't directly adjacent (compileSpace skips passages
 * &lt;= 0.05m long). */
export default function Passage({ passage, spec }: { passage: PassageRecord; spec: SpaceSpec }) {
  const materials = useMaterials();
  const cw = spec.doorW;
  const ch = spec.doorH + 0.15;
  const lightIntensity = spec.corridor ?? 3.6;

  if (passage.axis === "x") {
    const { x0, x1, z } = passage;
    const len = x1 - x0;
    const mx = (x0 + x1) / 2;
    return (
      <>
        <mesh material={materials.floor} position={[mx, 0, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[len, cw]} />
        </mesh>
        <mesh material={materials.ceil} position={[mx, ch, z]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[len, cw]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} material={materials.wall} position={[mx, ch / 2, z + (s * cw) / 2]}>
            <boxGeometry args={[len, ch, 0.1]} />
          </mesh>
        ))}
        <pointLight
          color={0xfff2e0}
          intensity={lightIntensity}
          distance={9}
          decay={2}
          position={[mx, ch - 0.3, z]}
        />
      </>
    );
  }

  const { z0, z1, x } = passage;
  const len = z1 - z0;
  const mz = (z0 + z1) / 2;
  return (
    <>
      <mesh material={materials.floor} position={[x, 0, mz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[cw, len]} />
      </mesh>
      <mesh material={materials.ceil} position={[x, ch, mz]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[cw, len]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={materials.wall} position={[x + (s * cw) / 2, ch / 2, mz]}>
          <boxGeometry args={[0.1, ch, len]} />
        </mesh>
      ))}
      <pointLight color={0xfff2e0} intensity={lightIntensity} distance={9} decay={2} position={[x, ch - 0.3, mz]} />
    </>
  );
}
