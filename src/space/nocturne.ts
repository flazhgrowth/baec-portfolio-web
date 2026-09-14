import type { SpaceSpec } from "@/space/types";

/** The nocturne variant — transcribed verbatim from design/gallery3d.js's
 * `VARIANTS.nocturne`. Frozen; nothing downstream may mutate this.
 *
 * Note: `raw` carries the explicit `SpaceSpec` annotation (not `NOCTURNE` itself)
 * so nested tuple fields like `fog` get contextual typing from the literal —
 * annotating only the `Object.freeze(...)` call's result would let TS infer `T`
 * from the literal alone and widen `fog` to `number[]`. */
const raw: SpaceSpec = {
  label: "Nocturne",
  blurb:
    "The tall hall after hours — a cold skylight overhead, warm pools below, arches into the dark.",
  bg: "#060607",
  exposure: 1.26,
  fog: [15, 64],
  darkPlaceholder: true,

  wall: "#3d372f",
  wallRough: 0.99,
  ceil: "#241f1b",
  floor: "#2c261e",
  floorRough: 0.33,
  floorMetal: 0.1,
  base: "#2a2621",
  baseH: 0.1,

  roomH: 6.8,
  doorW: 2.05,
  doorH: 3.3,
  arch: true,

  frame: "#0b0a09",
  frameW: 0.075,
  frameD: 0.05,
  mat: "#e9e2d5",
  matW: 0.085,

  hemi: { sky: "#7f8d9d", ground: "#2a251f", i: 1.15 },
  amb: 0.4,
  spot: { color: "#ffe2b4", i: 30, angle: 0.36, pen: 0.66, dist: 11, standoff: 1.5 },

  track: true,
  trackColor: "#131110",
  railColor: "#2b2724",
  fill: 6,
  corridor: 10,
  sky: { pane: "#8ba2bd", pane2: "#2c3849", color: "#a8bdd6", i: 62, dist: 44 },

  ui: {
    ink: "#f1ede5",
    paper: "rgba(20,18,17,0.9)",
    edge: "rgba(241,237,229,0.17)",
    dark: true,
  },
  plaque: { bg: "#1a1715", ink: "#e8e2d6" },

  rooms: [
    {
      id: "h",
      name: "The Hall",
      sub: "The Hall showcase",
      c: [0, 0],
      s: [16, 16],
      h: 6.8,
      skylight: true,
      home: [0, 7.2],
      maxLit: 7,
      partition: { c: [0, 0.8], s: [8.0, 0.46], h: 3.6 },
      art: [
        // w scaled to 80% of its original 2.95m hang width; height still derives
        // from artworks.ts's declared `ar` for p2, so the print's proportions hold.
        { k: "p2", wall: "P+", u: -1.4, w: 1.5, lit: true}, // 1
        { k: "x1", wall: "P+", u: 2.0, w: 1.5, lit: true}, // 2

        { k: "x2", wall: "P-", u: 0, w: 1.4, lit: false },

        { k: "p1", wall: "W", u: -4, w: 1.8, v: 0.6, lit: true}, // 3

        { k: "x3", wall: "W", u: 3.4, w: 1.5, lit: false},
        // A vertical trio left of x3 (toward the wall's far corner): stacked mainly
        // by height (v), with only a slight rightward creep in u as it climbs —
        // not a diagonal, just enough offset that it doesn't read as one column.
        // Rather than 3 separate spotlights, x8 (the vertical middle, v: 0) is
        // pinned lit and its aim nudged toward the trio's horizontal centre
        // (u 6.5 - 0.6 = 5.9) via litOffset, so one light covers all three.
        { k: "x7", wall: "W", u: 5.3, w: 0.65, v: -0.85, lit: false },
        { k: "x8", wall: "W", u: 7.0, w: 1.2, v: -0.2, lit: true, litOffset: -1.7 }, // 4
        { k: "x9", wall: "W", u: 5.5, w: 0.85, v: 1.0, lit: false },

        { k: "x4", wall: "S", u: 4.8, w: 1.1, lit: false},


        { k: "x10_1", wall: "N", u: -6, w: 0.7, v: -0.7, lit: false},
        { k: "x10_2", wall: "N", u: -6, w: 0.7, v: 0.1, lit: false},
        { k: "x10_3", wall: "N", u: -6, w: 0.7, v: 0.9, lit: false},
        { k: "x10_6", wall: "N", u: -4.3, w: 1.0, v: 0, lit: true}, // 5
        { k: "x10_4", wall: "N", u: -2.5, w: 1.0, v: 0.9, lit: false},
        { k: "x10_5", wall: "N", u: -2.5, w: 1.0, v: -0.5, lit: false},

        { k: "x11_1", wall: "E", u: -4.5, w: 1.5, v: 1.6, lit: true}, // 6
        { k: "x11_3", wall: "E", u: -4.5, w: 1.5, v: 0.0, lit: false},
        { k: "x11_2", wall: "N", u: 4.5, w: 1.5, v: 0.9, lit: true}, // 7
        { k: "x11_4", wall: "N", u: 4.5, w: 1.5, v: -0.7, lit: false},
      ],
    },
    {
      id: "n",
      name: "North Room",
      sub: "Small works",
      c: [0, -17.5],
      s: [9, 9],
      h: 4.2,
      home: [0, -14.0],
      art: [
        { k: "p3", wall: "N", u: 0, w: 2.35 },
        { k: "x5", wall: "N", u: -2.9, w: 0.9 },
        { k: "x3", wall: "W", u: 0, w: 1.4 },
        { k: "x4", wall: "E", u: 0, w: 1.1 },
      ],
    },
    {
      id: "e",
      name: "East Room",
      sub: "Work on paper",
      c: [17.5, 0],
      s: [9, 9],
      h: 4.2,
      home: [14.0, 0],
      art: [
        { k: "x6", wall: "E", u: -1.7, w: 1.6 },
        { k: "x5", wall: "E", u: 1.7, w: 1.15 },
        { k: "x1", wall: "S", u: 0, w: 1.5 },
        { k: "x2", wall: "N", u: 0, w: 1.2 },
      ],
    },
    {
      id: "sp",
      name: "Special Room",
      sub: "By invitation only",
      c: [-17.5, 0],
      s: [9, 9],
      h: 4.2,
      home: [-14.0, 0],
      // Single hero print on the far wall, facing a visitor as they come through
      // the doorway — see controller/gatedRoom.ts for the token-gate that blocks
      // this room's doorway (h's W wall) until POST /specials/validate returns 2xx.
      art: [{ k: "sp1", wall: "W", u: 0, w: 1.6 }],
    },
  ],

  links: [
    { a: "h", b: "n", axis: "z", at: 0, rev: true },
    { a: "h", b: "e", axis: "x", at: 0 },
    { a: "sp", b: "h", axis: "x", at: 0 },
  ],

  start: { room: "h", pos: [1.4, 8.6], yaw: -0.14 },
};

export const NOCTURNE = Object.freeze(raw);
