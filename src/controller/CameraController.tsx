import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { createController, type Controller } from "@/controller/createController";
import { controllerRef } from "@/controller/controllerRef";
import { useGalleryStore } from "@/store/GalleryStoreContext";
import type { CompiledSpace } from "@/space/types";

interface CameraControllerProps {
  space: CompiledSpace;
}

/** Mounts the imperative controller and drives it with exactly one `useFrame`. Lives
 * outside any <Suspense> boundary so a still-loading texture can never unmount it
 * and lose camera pose mid-tween. */
export default function CameraController({ space }: CameraControllerProps) {
  const store = useGalleryStore();
  const { camera, scene, gl } = useThree();
  const ctlRef = useRef<Controller | null>(null);
  if (!ctlRef.current) {
    ctlRef.current = createController({
      space,
      camera: camera as THREE.PerspectiveCamera,
      scene,
      store,
    });
  }

  useEffect(() => {
    const ctl = ctlRef.current!;
    controllerRef.current = ctl;
    const unbind = ctl.bindInput(gl.domElement);
    return () => {
      unbind();
      ctl.dispose();
      controllerRef.current = null;
    };
  }, [gl]);

  useFrame((_, dt) => {
    ctlRef.current?.tick(dt, performance.now());
  });

  return null;
}
