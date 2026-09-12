import type { SpaceSpec } from "@/space/types";

export default function Lights({ spec }: { spec: SpaceSpec }) {
  return (
    <>
      <hemisphereLight args={[spec.hemi.sky, spec.hemi.ground, spec.hemi.i]} />
      <ambientLight args={[0xffffff, spec.amb]} />
    </>
  );
}
