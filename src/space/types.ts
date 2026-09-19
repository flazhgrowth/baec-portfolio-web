/** Compass side a wall/hole/hang sits on. P+/P- are the two faces of a freestanding
 * partition (only used by rooms that declare one). */
export type WallSide = "N" | "S" | "W" | "E" | "P+" | "P-";

export interface RealArtwork {
  src: string;
  title: string;
  meta: string;
  ar: number;
  note: string;
}

export interface PlaceholderArtwork {
  ph: string;
  title: string;
  meta: string;
  ar: number;
  note: string;
}

export type Artwork = RealArtwork | PlaceholderArtwork;

export function isRealArtwork(a: Artwork): a is RealArtwork {
  return "src" in a;
}

export interface ArtPlacement {
  /** key into the artwork table */
  k: string;
  wall: WallSide;
  /** offset along the wall, measured from the wall's midpoint */
  u: number;
  /** picture width in metres; height is derived from the artwork's aspect ratio */
  w: number;
  /** vertical offset from CENTER_HEIGHT, metres, positive = higher. Omit for the
   * standard eye-level hang; used for a staggered salon-style cluster. */
  v?: number;
  /** Overrides compileSpace's default "3 widest per room" spotlight pick:
   * `true` forces this placement to be lit regardless of width, `false` forces
   * it to never be (e.g. to free up budget for a `true` elsewhere). Omit for
   * the default width-based behavior. See compileSpace.ts's `litIndexes`. */
  lit?: boolean;
  /** Tangential offset (metres, along the wall, same direction as `u`) applied
   * ONLY to this placement's spotlight aim point — the picture itself still
   * hangs at `u`. Lets one light center over a cluster of placements packed
   * close together (e.g. a vertical stack) instead of just this one's own
   * position. Ignored unless this placement ends up lit. */
  litOffset?: number;
}

export interface Partition {
  /** centre [x, z] */
  c: [number, number];
  /** [x-width, z-thickness] */
  s: [number, number];
  h: number;
}

export interface RoomSpec {
  id: string;
  name: string;
  sub: string;
  /** centre [x, z] */
  c: [number, number];
  /** [width(x), depth(z)] */
  s: [number, number];
  /** ceiling height; falls back to SpaceSpec.roomH when omitted */
  h?: number;
  /** standing point [x, z] used by room travel; derived when omitted */
  home?: [number, number];
  skylight?: boolean;
  partition?: Partition;
  art: ArtPlacement[];
  /** Overrides compileSpace's default MAX_LIT_PER_ROOM for this room only.
   * Safe to raise per room since Hang.tsx's ArtLighting only ever renders the
   * currently-occupied room's lights — the frame-rate cost only applies while
   * a visitor is standing in the room you raise it for. Omit to use the
   * variant-wide default. */
  maxLit?: number;
}

export interface LinkSpec {
  a: string;
  b: string;
  axis: "x" | "z";
  /** world coordinate on the axis perpendicular to `axis` where the doorway sits */
  at: number;
  /** for a z-axis link, swaps which room is "north" of the other */
  rev?: boolean;
}

export interface SkyRig {
  pane: string;
  pane2?: string;
  color: string;
  i: number;
  dist: number;
}

export interface SpotRig {
  color: string;
  i: number;
  angle: number;
  pen: number;
  dist: number;
  standoff: number;
}

export interface PlaquePalette {
  bg: string;
  ink: string;
}

export interface UiPalette {
  ink: string;
  paper: string;
  edge: string;
  dark: boolean;
}

export interface SpaceSpec {
  label: string;
  blurb: string;
  bg: string;
  exposure: number;
  /** [near, far] */
  fog: [number, number];
  darkPlaceholder: boolean;

  wall: string;
  wallRough: number;
  ceil: string;
  floor: string;
  floorRough: number;
  floorMetal: number;
  base: string;
  baseH: number;

  roomH: number;
  doorW: number;
  doorH: number;
  arch: boolean;

  frame: string;
  frameW: number;
  frameD: number;
  mat: string;
  matW: number;

  hemi: { sky: string; ground: string; i: number };
  amb: number;
  spot: SpotRig;

  track: boolean;
  trackColor: string;
  railColor?: string;
  fill: number;
  corridor?: number;
  sky?: SkyRig;

  ui: UiPalette;
  plaque: PlaquePalette;

  rooms: RoomSpec[];
  links: LinkSpec[];
  start: { room: string; pos: [number, number]; yaw: number };
}

/** A room record with `h` resolved to a concrete number (spec.roomH fallback applied). */
export type CompiledRoom = RoomSpec & { h: number };

export interface DoorRecord {
  type: "door";
  from: string;
  to: string;
  label: string;
  /** waypoint 2.7m inside the `from` room */
  entry: [number, number];
  /** waypoint 0.5m past the wall plane */
  mid: [number, number];
  /** waypoint 2.6m beyond, inside the `to` room/corridor */
  thru: [number, number];
  /** hotspot mesh placement, 6cm proud of the wall plane, y = doorH/2 */
  hotspotPosition: [number, number, number];
  hotspotRotationY: number;
}

export interface ArtRecord {
  room: string;
  /** the placement's key into the ARTWORKS table (ArtPlacement.k) — unique across the
   * whole variant, so it doubles as the identifier notes/api's notes attach to. */
  key: string;
  title: string;
  meta: string;
  note: string;
  /** standing point to view this piece from, [x, z] */
  view: [number, number];
  /** centre height, metres */
  cy: number;
  yaw: number;
  /** the resolved artwork (src/ph + ar) — carried along so overlay/Lightbox.tsx
   * can render the image full-size without re-looking it up by key. */
  artwork: Artwork;
}

export interface WallHole {
  /** offset along the wall (already side-flipped for E, matching wallGeom's local space) */
  u: number;
  w: number;
  h: number;
}

export interface AABB {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

/** A corridor's world-space span. Endpoints rather than centre+length so bounds and
 * geometry construction can both read them directly, matching design/gallery3d.js's
 * `addCorridor`. */
export type PassageRecord =
  | { axis: "x"; x0: number; x1: number; z: number }
  | { axis: "z"; z0: number; z1: number; x: number };

/** Per-room art placements that fall in the "three widest" spotlight allowance. */
export type LitIndexSet = ReadonlySet<number>;

export interface CompiledSpace {
  spec: SpaceSpec;
  roomById: Record<string, CompiledRoom>;
  /** doorway hole per room per side, in wallGeom's local (side-flipped) u */
  holesFor: Record<string, Partial<Record<WallSide, WallHole[]>>>;
  /** resolved link sides/offsets, keyed by link index in spec.links */
  linkGeometry: Array<{
    sideA: WallSide;
    sideB: WallSide;
    uA: number;
    uB: number;
  }>;
  bounds: AABB[];
  passages: PassageRecord[];
  doors: DoorRecord[];
  artRecords: ArtRecord[];
  /** same records as `artRecords`, grouped by room and kept in the room's `art`
   * placement order — lets a Hang component look up its own record by index
   * instead of searching the flat list. */
  artRecordsByRoom: Record<string, ArtRecord[]>;
  /** per room id, the set of art-placement indexes that get a spotlight */
  litIndexes: Record<string, LitIndexSet>;
  adjacency: Record<string, string[]>;
  startRoom: CompiledRoom;
}
