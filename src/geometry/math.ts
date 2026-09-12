import type { AABB, CompiledRoom } from "@/space/types";

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Normalizes an angle to the shortest-arc range (-pi, pi]. */
export const wrapPi = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

/** Yaw that makes a YXZ-order camera face direction (dx, dz). The +PI is because
 * yaw=0 looks down -Z. */
export const yawToward = (dx: number, dz: number): number => Math.atan2(dx, dz) + Math.PI;

export function inBounds(bounds: AABB[], x: number, z: number): boolean {
  return bounds.some((b) => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1);
}

/** First room whose footprint contains (x, z); falls back to `fallbackRoomId` (the
 * current room) so standing in a corridor keeps the last room label. */
export function roomAt(rooms: CompiledRoom[], x: number, z: number, fallbackRoomId: string): string {
  for (const r of rooms) {
    if (Math.abs(x - r.c[0]) < r.s[0] / 2 && Math.abs(z - r.c[1]) < r.s[1] / 2) {
      return r.id;
    }
  }
  return fallbackRoomId;
}

/** A room's standing point for travel; falls back to a point inset from centre
 * toward +Z when the room doesn't declare one. */
export function homeOf(r: CompiledRoom): [number, number] {
  return r.home ?? [r.c[0], r.c[1] + Math.min(3.4, r.s[1] * 0.32)];
}
