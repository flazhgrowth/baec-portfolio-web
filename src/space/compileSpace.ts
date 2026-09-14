import { ARTWORKS } from "@/space/artworks";
import { CENTER_HEIGHT, WALL, WALL_THICKNESS, innerPlane, resolveArtPlacement } from "@/geometry/layout";
import { yawToward } from "@/geometry/math";
import type {
  AABB,
  ArtRecord,
  CompiledRoom,
  CompiledSpace,
  DoorRecord,
  PassageRecord,
  SpaceSpec,
  WallHole,
  WallSide,
} from "@/space/types";

/**
 * Pure spec -> CompiledSpace. Replaces design/gallery3d.js's in-place mutation of
 * its own data tables (`r.h = r.h || V.roomH`, `L._sA = ...`) with a derivation that
 * never touches `spec`, so re-running it (StrictMode, HMR) is always safe.
 */
export function compileSpace(spec: SpaceSpec): CompiledSpace {
  const roomById: Record<string, CompiledRoom> = {};
  for (const room of spec.rooms) {
    roomById[room.id] = { ...room, h: room.h ?? spec.roomH };
  }

  const holesFor: CompiledSpace["holesFor"] = {};
  const linkGeometry: CompiledSpace["linkGeometry"] = [];
  const adjacency: Record<string, string[]> = {};

  for (const link of spec.links) {
    const a = roomById[link.a];
    const b = roomById[link.b];
    const sideA: WallSide = link.axis === "x" ? "E" : link.rev ? "N" : "S";
    const sideB: WallSide = link.axis === "x" ? "W" : link.rev ? "S" : "N";
    const uA = link.axis === "x" ? link.at - a.c[1] : link.at - a.c[0];
    const uB = link.axis === "x" ? link.at - b.c[1] : link.at - b.c[0];
    linkGeometry.push({ sideA, sideB, uA, uB });

    (holesFor[a.id] ??= {})[sideA] = [{ u: flipForE(sideA, uA), w: spec.doorW, h: spec.doorH }];
    (holesFor[b.id] ??= {})[sideB] = [{ u: flipForE(sideB, uB), w: spec.doorW, h: spec.doorH }];

    (adjacency[a.id] ??= []).push(b.id);
    (adjacency[b.id] ??= []).push(a.id);
  }

  const bounds: AABB[] = [];
  for (const r of Object.values(roomById)) {
    const [cx, cz] = r.c;
    const [w, d] = r.s;
    bounds.push({
      x0: cx - w / 2 + 0.6,
      x1: cx + w / 2 - 0.6,
      z0: cz - d / 2 + 0.6,
      z1: cz + d / 2 - 0.6,
    });
  }

  const passages: PassageRecord[] = [];
  for (const link of spec.links) {
    const a = roomById[link.a];
    const b = roomById[link.b];
    const cw = spec.doorW;
    if (link.axis === "x") {
      const x0 = a.c[0] + a.s[0] / 2 + WALL_THICKNESS;
      const x1 = b.c[0] - b.s[0] / 2 - WALL_THICKNESS;
      const z = link.at;
      if (x1 - x0 <= 0.05) continue;
      passages.push({ axis: "x", x0, x1, z });
      bounds.push({ x0: x0 - 0.5, x1: x1 + 0.5, z0: z - cw / 2 + 0.32, z1: z + cw / 2 - 0.32 });
    } else {
      const lo = link.rev ? b : a;
      const hi = link.rev ? a : b;
      const z0 = lo.c[1] + lo.s[1] / 2 + WALL_THICKNESS;
      const z1 = hi.c[1] - hi.s[1] / 2 - WALL_THICKNESS;
      const x = link.at;
      if (z1 - z0 <= 0.05) continue;
      passages.push({ axis: "z", z0, z1, x });
      bounds.push({ x0: x - cw / 2 + 0.32, x1: x + cw / 2 - 0.32, z0: z0 - 0.5, z1: z1 + 0.5 });
    }
  }

  const doors: DoorRecord[] = [];
  spec.links.forEach((link, i) => {
    const a = roomById[link.a];
    const b = roomById[link.b];
    const { sideA, sideB, uA, uB } = linkGeometry[i];
    doors.push(makeDoor(a, sideA, uA, b, spec));
    doors.push(makeDoor(b, sideB, uB, a, spec));
  });

  const artRecords: ArtRecord[] = [];
  const artRecordsByRoom: Record<string, ArtRecord[]> = {};
  const litIndexes: CompiledSpace["litIndexes"] = {};
  for (const r of Object.values(roomById)) {
    const list = r.art;
    const widestFirst = list
      .map((_, i) => i)
      .sort((i, j) => list[j].w - list[i].w)
      .slice(0, 3);
    litIndexes[r.id] = new Set(widestFirst);

    const roomRecords: ArtRecord[] = [];
    for (const placement of list) {
      const src = ARTWORKS[placement.k];
      const { px, pz, n } = resolveArtPlacement(r, placement);
      const back = Math.max(2.05, placement.w * 1.42);
      const rec: ArtRecord = {
        room: r.id,
        title: src.title,
        meta: src.meta,
        note: src.note,
        view: [px + n[0] * back, pz + n[2] * back],
        cy: CENTER_HEIGHT + (placement.v ?? 0),
        yaw: yawToward(-n[0], -n[2]),
        artwork: src,
      };
      artRecords.push(rec);
      roomRecords.push(rec);
    }
    artRecordsByRoom[r.id] = roomRecords;
  }

  const startRoom = roomById[spec.start.room];

  return {
    spec,
    roomById,
    holesFor,
    linkGeometry,
    bounds,
    passages,
    doors,
    artRecords,
    artRecordsByRoom,
    litIndexes,
    adjacency,
    startRoom,
  };
}

function makeDoor(
  from: CompiledRoom,
  side: WallSide,
  u: number,
  to: CompiledRoom,
  spec: SpaceSpec,
): DoorRecord {
  if (side === "P+" || side === "P-") {
    throw new Error("doors cannot open onto a partition face");
  }
  const [ix, iz] = innerPlane(from, side);
  const dir = WALL[side].dir;
  const n = WALL[side].inN;
  const px = ix + dir[0] * u;
  const pz = iz + dir[2] * u;
  return {
    type: "door",
    from: from.id,
    to: to.id,
    label: to.name,
    entry: [px + n[0] * 2.7, pz + n[2] * 2.7],
    mid: [px - n[0] * 0.5, pz - n[2] * 0.5],
    thru: [px - n[0] * 2.6, pz - n[2] * 2.6],
    hotspotPosition: [px + n[0] * 0.06, spec.doorH / 2, pz + n[2] * 0.06],
    hotspotRotationY: WALL[side].face,
  };
}

/** `side` is a plain WallSide parameter (not call-site-narrowed to a literal
 * subset), so this avoids the "no overlap" TS error a direct `sideB === 'E'`
 * comparison hits when sideB's inferred type can never include 'E'. */
function flipForE(side: WallSide, u: number): number {
  return side === "E" ? -u : u;
}

export function wallHoles(compiled: CompiledSpace, roomId: string, side: "N" | "S" | "W" | "E"): WallHole[] {
  return compiled.holesFor[roomId]?.[side] ?? [];
}
