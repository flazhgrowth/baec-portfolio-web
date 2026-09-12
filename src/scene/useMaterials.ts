import { createContext, useContext, useEffect, useMemo } from "react";
import * as THREE from "three";
import type { SpaceSpec } from "@/space/types";

export interface SharedMaterials {
  wall: THREE.MeshStandardMaterial;
  ceil: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
  base: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
  mat: THREE.MeshStandardMaterial;
  track: THREE.MeshStandardMaterial;
  rail: THREE.MeshStandardMaterial;
}

const MaterialsContext = createContext<SharedMaterials | null>(null);

/** The eight shared materials, created once and disposed once — never per-mesh, or
 * the first unmounting <Wall> would kill the material for every other one. */
export function useCreateMaterials(spec: SpaceSpec): SharedMaterials {
  const materials = useMemo<SharedMaterials>(
    () => ({
      wall: new THREE.MeshStandardMaterial({ color: spec.wall, roughness: spec.wallRough, metalness: 0 }),
      ceil: new THREE.MeshStandardMaterial({ color: spec.ceil, roughness: 1, metalness: 0 }),
      floor: new THREE.MeshStandardMaterial({
        color: spec.floor,
        roughness: spec.floorRough,
        metalness: spec.floorMetal,
      }),
      base: new THREE.MeshStandardMaterial({ color: spec.base, roughness: 0.7, metalness: 0 }),
      frame: new THREE.MeshStandardMaterial({ color: spec.frame, roughness: 0.5, metalness: 0.06 }),
      mat: new THREE.MeshStandardMaterial({ color: spec.mat, roughness: 0.96, metalness: 0 }),
      track: new THREE.MeshStandardMaterial({ color: spec.trackColor, roughness: 0.42, metalness: 0.55 }),
      rail: new THREE.MeshStandardMaterial({
        color: spec.railColor ?? spec.trackColor,
        roughness: 0.5,
        metalness: 0.4,
      }),
    }),
    [spec],
  );

  useEffect(() => {
    return () => {
      Object.values(materials).forEach((m) => m.dispose());
    };
  }, [materials]);

  return materials;
}

export const MaterialsProvider = MaterialsContext.Provider;

export function useMaterials(): SharedMaterials {
  const materials = useContext(MaterialsContext);
  if (!materials) throw new Error("useMaterials must be used within MaterialsProvider");
  return materials;
}
