import type { CompiledSpace } from "@/space/types";

/** The one room in the Nocturne variant that's locked behind a token — see
 * TitleCard.tsx's sibling overlay/SpecialGate.tsx for the entry form and
 * createController.ts for where this is checked before a click/room-index travel
 * and before free-walk movement. */
export const SPECIAL_ROOM_ID = "sp";

/** Whether (x, z) falls inside the special room or the corridor leading to it —
 * the region free-walking is blocked from while the room is locked. Derived from
 * the room/passage records already on CompiledSpace (not the flattened `bounds`
 * array, whose push order this shouldn't have to depend on), so it stays correct
 * if compileSpace's bounds construction ever changes. */
export function isInGatedZone(space: CompiledSpace, x: number, z: number): boolean {
  const room = space.roomById[SPECIAL_ROOM_ID];
  if (!room) return false;

  const [cx, cz] = room.c;
  const [w, d] = room.s;
  if (x >= cx - w / 2 && x <= cx + w / 2 && z >= cz - d / 2 && z <= cz + d / 2) return true;

  const doorW = space.spec.doorW;
  for (const p of space.passages) {
    if (p.axis !== "x") continue;
    const touchesRoom = Math.abs(p.x0 - (cx + w / 2)) < 0.01 || Math.abs(p.x1 - (cx - w / 2)) < 0.01;
    if (touchesRoom && x >= p.x0 && x <= p.x1 && Math.abs(z - p.z) <= doorW / 2) return true;
  }
  return false;
}
