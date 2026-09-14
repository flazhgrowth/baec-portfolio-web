import type { ArtPlacement, CompiledRoom, WallSide } from "@/space/types";

/** Wall thickness, metres — matches design/gallery3d.js's module-level `T`. */
export const WALL_THICKNESS = 0.26;

/** Camera eye height, metres — constant, never varies by room. */
export const EYE_HEIGHT = 1.62;

/** Standard hung-picture centre height, metres. A placement's `v` offsets from
 * this; shared by compileSpace (ArtRecord.cy) and Hang.tsx so the two never
 * drift apart. */
export const CENTER_HEIGHT = 1.53;

interface WallOrientation {
  /** mesh.rotation.y for the extruded wall geometry */
  rot: number;
  /** the world axis the wall's local u-coordinate runs along */
  dir: [number, number, number];
  /** inward normal, pointing into the room */
  inN: [number, number, number];
  /** rotation.y for a PlaneGeometry whose +Z normal should equal inN */
  face: number;
}

/**
 * World convention: -Z is North, +Z is South, -X is West, +X is East.
 *
 * The E wall is asymmetric: its mesh rotation maps local +x to world -z, but `dir`
 * is still [0,0,1] (the world axis u runs along). Callers that place holes and
 * baseboards in the wall's own local space must flip `u` for side 'E'; callers
 * placing world-space things (doors, art) use `dir`/`inN` directly and need no flip.
 */
export const WALL: Record<"N" | "S" | "W" | "E", WallOrientation> = {
  N: { rot: 0, dir: [1, 0, 0], inN: [0, 0, 1], face: 0 },
  S: { rot: 0, dir: [1, 0, 0], inN: [0, 0, -1], face: Math.PI },
  W: { rot: -Math.PI / 2, dir: [0, 0, 1], inN: [1, 0, 0], face: Math.PI / 2 },
  E: { rot: Math.PI / 2, dir: [0, 0, 1], inN: [-1, 0, 0], face: -Math.PI / 2 },
};

/** True for the two orthogonal (N/S/W/E) sides; false for the partition faces. */
export function isOrthogonalSide(side: WallSide): side is "N" | "S" | "W" | "E" {
  return side === "N" || side === "S" || side === "W" || side === "E";
}

/** Origin of the wall mesh such that the T-metre extrusion lands its inner face on
 * the room boundary. */
export function wallOrigin(r: CompiledRoom, side: "N" | "S" | "W" | "E"): [number, number] {
  const [cx, cz] = r.c;
  const [w, d] = r.s;
  if (side === "N") return [cx, cz - d / 2 - WALL_THICKNESS];
  if (side === "S") return [cx, cz + d / 2];
  if (side === "W") return [cx - w / 2, cz];
  return [cx + w / 2, cz];
}

/** The room-facing surface plane position for a wall side. */
export function innerPlane(r: CompiledRoom, side: "N" | "S" | "W" | "E"): [number, number] {
  const [cx, cz] = r.c;
  const [w, d] = r.s;
  if (side === "N") return [cx, cz - d / 2];
  if (side === "S") return [cx, cz + d / 2];
  if (side === "W") return [cx - w / 2, cz];
  return [cx + w / 2, cz];
}

export interface ArtPlacementTransform {
  px: number;
  pz: number;
  /** group.rotation.y so local +Z faces outward, away from the wall/partition */
  ry: number;
  /** outward normal */
  n: [number, number, number];
}

/** Shared by compileSpace (to derive ArtRecord.view/yaw) and the Hang scene
 * component (to place the picture group) so the two never drift apart. */
export function resolveArtPlacement(r: CompiledRoom, placement: ArtPlacement): ArtPlacementTransform {
  if (placement.wall === "P+" || placement.wall === "P-") {
    const p = r.partition!;
    const s = placement.wall === "P+" ? 1 : -1;
    return {
      px: p.c[0] + placement.u,
      pz: p.c[1] + s * (p.s[1] / 2 + 0.02),
      ry: s > 0 ? 0 : Math.PI,
      n: [0, 0, s],
    };
  }
  const [ix, iz] = innerPlane(r, placement.wall);
  const dir = WALL[placement.wall].dir;
  const n = WALL[placement.wall].inN;
  return {
    px: ix + dir[0] * placement.u + n[0] * 0.02,
    pz: iz + dir[2] * placement.u + n[2] * 0.02,
    ry: WALL[placement.wall].face,
    n,
  };
}
