# Handoff: 3D Exhibition Portfolio — "Nocturne"

## Overview

A photography portfolio presented as a navigable exhibition building rather than a
grid of images. The visitor enters a tall hall lit by a night skylight, walks or
clicks between rooms through arched thresholds, and clicks a print to be walked up to
it, at which point a caption panel opens.

Three rooms: **The Hall** (16 × 16 m, 6.8 m ceiling, freestanding partition),
**North Room** and **East Room** (9 × 9 m, 4.2 m), each reached through a 4 m arched
passage off the hall.

## About the design files

The files in this bundle are **design references created in HTML** — a working
prototype of the intended look, lighting and behaviour, not production code to lift
wholesale. `gallery3d.js` is genuinely runnable and is the most precise spec that
exists for the motion and the light rig, so read it as the source of truth for
*values*, and re-implement the structure in whatever the target project actually uses
(React + react-three-fiber, a Next.js route, a Vue app, plain Vite). If there is no
codebase yet, **Vite + three.js** (optionally react-three-fiber) is the natural
target; the prototype's only dependency is three.js r184.

## Fidelity

**High fidelity.** Colours, light intensities, room dimensions in metres, camera
timings, typography and copy are all final and are listed below. Match them.
The one deliberately unfinished part is content: only three photographs exist
(`assets/p1–p3.jpg`); the other six hangs are canvas-drawn placeholders.

## Run it

```bash
cd design
python3 -m http.server 8000
# → http://localhost:8000/Exhibition.dc.html
```

A static server is required (the page fetches sibling files). three.js is pulled from
unpkg at runtime — pin and vendor it in production.

---

## Screens / views

### 1. Title card (pre-entry overlay)

Full-bleed `#060607`, centred column, `pointer-events: auto`, sits above the canvas at
`z-index: 3`. Fades out over `1s` on click, then `display: none`.

| Element | Spec |
| --- | --- |
| Kicker | `Nocturne · 3 rooms` — mono, 9.5px, letter-spacing `.34em`, uppercase, `opacity .45` |
| Title | `Tokyo · Kyoto · Osaka` — Spectral 400, `clamp(38px, 6.4vw, 76px)`, tracking `-.022em`, line-height 1.02, margin-top 22px |
| Subtitle | Variant blurb — 14px, `opacity .55`, max-width 430px, line-height 1.65, margin-top 18px |
| Button | `Enter the room` — mono 10px, tracking `.28em`, uppercase, padding `14px 32px`, 1px border `rgba(242,239,233,.32)`, transparent fill, margin-top 40px. Hover: background `rgba(242,239,233,.1)`, border `rgba(242,239,233,.66)`, transition `.35s` |

Text colour throughout: `#f2efe9`.

### 2. The room (the whole app)

A single WebGL canvas filling the viewport, with a non-interactive HTML overlay on
top. Overlay children:

| Element | Position | Spec |
| --- | --- | --- |
| Room name | top 26px, left 28px | Spectral 500, 27px, tracking `-.01em`, line-height 1.08 |
| Room subtitle | under the name, margin-top 8px | mono 10px, tracking `.18em`, uppercase, `opacity .62` |
| Room index | top 26px, right 28px | one button per room, mono 9.5px, tracking `.17em`, uppercase, padding `6px 0 6px 16px`, right-aligned, column with 1px gap. `opacity`: current `1`, others `.38`, hover `.8`, transition `.3s`. Clicking travels there. |
| Hint | bottom 26px, centred | `drag to look · w a s d to walk · click a photograph or a doorway` — mono 10px, tracking `.16em`, uppercase, `opacity .5`, fades in 2s after entry and out after 13s, transition `.6s` |
| Hover tooltip | follows the cursor, `translate(-50%, -190%)` | mono 10px, tracking `.14em`, uppercase, padding `7px 11px`, 1px border `rgba(241,237,229,.17)`, background `rgba(20,18,17,.9)`, `backdrop-filter: blur(8px)`, transition `.18s`. Doors read `→ North Room`; prints read their title. |
| Caption panel | left 28px, bottom 28px, width 340px | background `rgba(20,18,17,.9)`, 1px border `rgba(241,237,229,.17)`, padding `22px 24px 20px`, `backdrop-filter: blur(10px)`. Enters from `translateY(12px)` + `opacity 0` over `.5s`. |

Caption panel contents, in order:

1. Title — Spectral 500, 22px, line-height 1.22
2. Meta — mono 9.5px, tracking `.16em`, uppercase, `opacity .6`, margin-top 10px
3. Note — 13.5px, line-height 1.62, `opacity .8`, `text-wrap: pretty`, margin-top 15px
4. Dismiss hint — `esc, or click the room, to step back` — mono 9px, tracking `.16em`, uppercase, `opacity .42`, margin-top 18px

All overlay text is `#f1ede5`, with `text-shadow: 0 1px 16px rgba(0,0,0,.65)` on the
room name and `0 1px 10px` on the smaller labels so it survives over a bright print.

---

## The 3D scene

### Camera

| | |
| --- | --- |
| Type | PerspectiveCamera, FOV **62**, near `.05`, far `300`, rotation order `YXZ` |
| Eye height | **1.62 m**, constant — the visitor never crouches or floats |
| Look | pointer drag; yaw `-0.0033 rad/px`, pitch `-0.0027 rad/px`, pitch clamped to `[-0.55, 0.5]` |
| Walk | `W A S D` / arrows, **1.8 m/s** (3.2 with Shift), axis-separated collision so you slide along walls |

### Rooms (metres, x/z plane, y up)

| Room | Centre | Size | Ceiling | Standing point |
| --- | --- | --- | --- | --- |
| The Hall | `0, 0` | 16 × 16 | 6.8 | `0, 7.2` |
| North Room | `0, -17.5` | 9 × 9 | 4.2 | `0, -14.0` |
| East Room | `17.5, 0` | 9 × 9 | 4.2 | `14.0, 0` |

Hall partition: freestanding slab at `0, 0.8`, 8.0 × 0.46 m, 3.6 m tall — both faces hung.

Walls are 0.26 m thick, built as an extruded rectangle `Shape` with the doorway as a
`Path` hole (straight sides to a springline, then a semicircular `absarc`), which is
what makes the arch free. Openings are **2.05 m wide × 3.3 m high**. Each link builds
a connecting passage (floor, ceiling at door height + 0.15, two side walls) spanning
the gap between the two rooms' outer wall faces.

### Light rig

| Light | Spec |
| --- | --- |
| Hemisphere | sky `#7f8d9d`, ground `#2a251f`, intensity `1.15` |
| Ambient | white, `0.4` |
| Skylight (hall only) | emissive pane 44% of the room footprint at ceiling − 0.03, textured with a radial gradient `#8ba2bd → #2c3849`; PointLight `#a8bdd6`, intensity `62`, distance `44`, decay 2, at ceiling − 1.2 |
| Room fill | PointLight `#fff6ea`, intensity `6`, distance `max(w,d) × 1.6`, at ceiling − 0.6 |
| Passage | PointLight `#fff2e0`, intensity `10`, distance `9` — this is what makes the arch glow from the dark side |
| Picture spot | SpotLight `#ffe2b4`, intensity `30`, distance `11`, angle `0.36`, penumbra `0.66`, decay `1.7`, mounted at ceiling − 0.24 and **1.5 m out from the wall**, targeting the print centre + 0.1 m |

**Only the three widest prints in each room get a spotlight** — the rest are carried by
the hemisphere and the room fill. This is a performance ceiling, not a style choice:
each additional light costs roughly 1 fps in the forward renderer. Renderer:
`ACESFilmicToneMapping`, exposure **1.26**, `SRGBColorSpace` output, `antialias: true`,
pixel ratio capped at **1.5**. Scene fog: `#060607`, near 15, far 64. No shadow maps.

### Hanging

Centre height **1.53 m** for every print. Each hang is a group of four planes:

1. Frame — box, `#0b0a09`, 0.05 m deep, 0.075 m reveal outside the mat
2. Mat — plane, `#e9e2d5`, roughness .96, 0.085 m border around the image
3. Image — plane, `MeshStandardMaterial` roughness .84, sized from the file's aspect
4. Wall plaque — 0.33 × 0.139 m canvas texture, background `#1a1715`, ink `#e8e2d6`,
   title in Georgia 38px and meta in mono 24px, sitting 0.26 m to the right of the
   frame, aligned to its bottom edge

Placeholder hangs use a canvas texture instead of a photo: `#24211d` ground, 9px
diagonal stripes at `rgba(255,248,236,.11)` every 30px, and a knocked-out label band
carrying e.g. `PHOTO 04 · 3:2` in mono 34px at `rgba(240,233,221,.82)`.

Track fixtures (cosmetic): a 0.028 m rail across the ceiling in `#2b2724`, plus a
tapered 0.032→0.046 m head in `#131110` above each spotlit print.

---

## Interactions & behaviour

| Action | Result |
| --- | --- |
| Click **Enter the room** | Cover fades (1s); camera dollies from the arrival pose to the hall standing point over **2600 ms**, ending facing the hero print |
| Drag | Free look. Cancels any running camera move. |
| `W A S D` / arrows | Free walk within the room + passage bounds. Cancels an open caption. |
| Hover a print or doorway | Cursor `pointer`, tooltip appears at the cursor |
| Click a print | Camera runs a Catmull-Rom path to a viewing point `max(2.05, width × 1.42)` m out from the wall over **1200 ms**, ending pitched up `+0.075` so the print sits high in frame and the caption has clean wall beneath it. Caption fades in on arrival. |
| `Esc`, or click anywhere that isn't a target | Steps back up to 2.4 m along the view axis over **900 ms**, caption out |
| Click a doorway | **2700 ms** path through four waypoints — 2.7 m inside the room, 0.5 m short of the threshold, 2.6 m past it, then the target room's standing point. Yaw follows the curve tangent for the first 80% (smoothed, `dt × 3.2`), then settles. Room label swaps at 1600 ms, mid-passage. On arrival, a **1100 ms** yaw tween turns to face that room's hero print. |
| Click a room in the index | Same travel, chained — `gotoRoom` BFS's the room graph and runs one travel per hop |

Easing is `easeInOutCubic` for every camera move.

**Picking** raycasts the whole scene and walks the sorted hit list: the first hit
carrying a `userData.type` wins; any other mesh means the target is behind a wall and
the pick fails. Hotspots are zero-opacity, `depthWrite: false` planes rather than
`visible: false`, so they still take part in sorting. Without this, you can click
doorways through walls.

**Walkable space** is a union of axis-aligned rectangles — one per room (inset 0.6 m)
and one per passage (inset 0.32 m) — tested per axis.

## State

```
pos      Vector3   ground position; y is pinned to 1.62
yaw      number    radians; forward = (-sin yaw, 0, -cos yaw)
pitch    number    radians, clamped [-0.55, 0.5]
room     string    current room id — drives the label and the index
mode     'free' | 'art' | 'travel'
focus    art record | null      the print being viewed
tween    { curve, t0, dur, yaw0, dYaw, pitch0, dPitch, onDone, lookAlong } | null
yawTween { y0, dy, t0, dur } | null
entered  boolean   gates walking and hover until the cover is dismissed
```

Room membership is derived every frame from `pos` against the room rectangles, so
walking through a passage updates the label without any event. No data fetching; all
content is a literal in the module.

## Design tokens

**Surfaces** `#060607` void/fog · `#3d372f` wall · `#241f1b` ceiling · `#2c261e` floor ·
`#2a2621` baseboard · `#0b0a09` frame · `#e9e2d5` mat · `#1a1715` plaque

**Light** `#7f8d9d` / `#2a251f` hemisphere · `#a8bdd6` skylight · `#ffe2b4` picture spot ·
`#fff2e0` passage · `#fff6ea` room fill

**UI** `#f1ede5` ink · `rgba(20,18,17,.9)` panel · `rgba(241,237,229,.17)` hairline ·
`#c89a5a` link, `#f1ede5` link hover

**Type** Spectral 400/500 (Google) for titles and captions · Helvetica Neue / Helvetica /
Arial for body · `ui-monospace, SFMono-Regular, Menlo` for every label, uppercase with
`.14–.34em` tracking

**Scale** 76/27/22/14/13.5/10/9.5/9 px · overlay inset 26–28 px · panel padding
`22px 24px 20px`

**Motion** 1200 / 900 / 2700 / 1100 / 2600 ms, `easeInOutCubic` · UI fades `.18s`
(tooltip) `.5s` (caption) `.6s` (hint) `1s` (cover)

## Assets

- `assets/p1.jpg` — Oshiage, Tokyo. Night crossing with the tower. 1400 × 933.
- `assets/p2.jpg` — Fushimi Inari, Kyoto. Torii corridor. 1400 × 933.
- `assets/p3.jpg` — Hōzenji Yokochō, Osaka. Wet alley. 1400 × 933.

All three are the client's own photographs, resized from 6000 × 4000 originals at
JPEG q82. The remaining six hangs are canvas-generated placeholders — no files.
Fonts: Spectral from Google Fonts. No icons, no SVG.

## Files in this bundle

| File | Role |
| --- | --- |
| `Exhibition.dc.html` | Entry point. Font link, body reset, one `<gallery-room variant="nocturne">`. |
| `gallery3d.js` | The entire gallery: content table `C`, space table `VARIANTS`, scene builder, camera, UI. ~700 lines, no build step. |
| `support.js` | Runtime for the `.dc.html` authoring format used in design. **Not needed** once the page is rebuilt in the target framework — drop it. |
| `assets/p1–p3.jpg` | The photographs. |
| `Concept-A-Enfilade.dc.html` | Rejected alternative: warm white cube, three rooms on one axis. Kept for reference. |
| `Concept-B-Atrium.dc.html` | Rejected alternative: the same building by day. Useful as a "lights on" reference for the same geometry. |
| `Concept-C-Cabinet.dc.html` | Rejected alternative: small dark chambers. Source of the night palette. |

## Where to extend

Adding a room is three lines of data — append to `VARIANTS.nocturne.rooms`, append a
`link` to something already in the graph, done. Doorway hotspots, passage geometry,
walkable bounds, the room index and the pathfinding are all derived from that array.
Adding a photograph is one entry in `C` plus one `{ k, wall, u, w }` in a room's `art`.

Two things to fix before this ships to real traffic:

1. **Mobile.** Look and tap-to-navigate work; there is no walk control. Either add an
   on-screen stick or lean fully on click-navigation below 768px.
2. **Texture loading.** All prints load eagerly at boot. Fine at nine; past ~40 it
   needs per-room lazy loading and a low-res placeholder swap.
