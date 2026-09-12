import * as THREE from "three";

interface HotspotProps {
  width: number;
  height: number;
  userData: Record<string, unknown>;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/** An invisible-but-raycastable plane: opacity 0 with depthWrite off (not
 * `visible={false}`), so it still participates in the controller's manual raycast
 * sort. `userData.type` is what the picker keys off of. */
export default function Hotspot({ width, height, userData, position, rotation }: HotspotProps) {
  return (
    <mesh position={position} rotation={rotation} userData={userData}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}
