import { Suspense } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import CameraController from "@/controller/CameraController";
import Space from "@/scene/Space";
import { EYE_HEIGHT } from "@/geometry/layout";
import { useGallery } from "@/store/useGallery";
import type { CompiledSpace } from "@/space/types";

export default function GalleryCanvas({ compiled }: { compiled: CompiledSpace }) {
  const profile = useGallery((s) => s.profile);
  const spec = compiled.spec;

  return (
    <Canvas
      dpr={profile === "touch" ? [1, 1.25] : [1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{
        fov: 62,
        near: 0.05,
        far: 300,
        position: [spec.start.pos[0], EYE_HEIGHT, spec.start.pos[1]],
      }}
      style={{ touchAction: profile === "touch" ? "none" : "auto" }}
      onCreated={({ camera, scene, gl }) => {
        // Must happen before frame 1: a stray lookAt anywhere would silently break
        // pitch/yaw once the controller starts driving rotation via .set(pitch, yaw, 0).
        camera.rotation.order = "YXZ";
        scene.background = new THREE.Color(spec.bg);
        scene.fog = new THREE.Fog(spec.bg, spec.fog[0], spec.fog[1]);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = spec.exposure;
      }}
    >
      {/* Outside Suspense: a still-loading texture must never unmount the
          controller mid-tween and lose camera pose. */}
      <CameraController space={compiled} />
      <Suspense fallback={null}>
        <Space compiled={compiled} />
      </Suspense>
    </Canvas>
  );
}
