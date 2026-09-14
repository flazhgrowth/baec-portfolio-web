# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A production Vite + React + react-three-fiber app: a navigable 3D exhibition-building
photography portfolio ("Nocturne" — three rooms, arched doorways, a skylit hall), plus a
name-gate at entry and a guestbook, both backed by a separate Go/Chi API this repo does
not implement (see `docs/api-contract.md`).

The app is a from-scratch port of the design prototype in `design/` (kept intact there as
the reference spec, not used at runtime) — `design/README.md` is the source of truth for
exact colors, dimensions, camera timings and light-rig values; `design/gallery3d.js` is
the original imperative implementation those values were first proven out in. When a
number in `src/` looks surprising, check it against `design/gallery3d.js` before assuming
it's wrong — the fidelity bar for the geometry/camera/motion port is "matches exactly,"
not "close enough."

## Commands

```bash
npm install
npm run dev         # Vite dev server, http://localhost:5173
npm run build        # tsc -b && vite build — type errors fail the build
npm run typecheck    # tsc -b only (no bundling)
npm run lint          # eslint .
npm run preview       # serve the production build locally
```

No test suite exists yet. `npm run typecheck` is the meaningful correctness gate for the
data/geometry layer (`src/space`, `src/geometry`) — it's pure and mistakes there show up
as type errors before they show up as visual bugs.

Node: the project targets vite 6.4.x specifically because it supports Node 18, which is
this machine's default (`nvm` has 18.20.3 active; Homebrew's `node@23` is installed at
`/opt/homebrew/opt/node@23/bin` if a newer toolchain is ever needed for a CLI tool that
requires it — prefix `PATH` with that dir for a one-off command rather than switching the
project's default).

## Architecture

The declarative/imperative boundary is the whole shape of this codebase: **the boundary
sits at the camera.** Everything that is a static `Object3D` — walls, floors, lights,
hung pictures — is plain JSX driven by compiled data. Camera pose, tweens, keys, drag and
hover picking are imperative closure state that never touches React, and are driven by
exactly one `useFrame` call.

```
src/space/        Typed scene data. nocturne.ts is the only shipped variant (transcribed
                   verbatim from design/gallery3d.js's VARIANTS.nocturne — see fidelity
                   note above). compileSpace.ts is a PURE function: spec -> CompiledSpace
                   (resolved room heights, door-hole geometry, room-graph adjacency, art
                   placement/camera-target records, walkable bounds). This replaces the
                   original's in-place mutation of its own data tables, so re-running it
                   (StrictMode, HMR) is always safe — nothing in this repo may mutate a
                   SpaceSpec after compileSpace reads it.
src/geometry/      Pure math/geometry helpers shared by compileSpace AND the scene layer
                   (wallGeom's arched-doorway Path construction, the WALL orientation
                   table, resolveArtPlacement, room-graph BFS). No React, no three.js
                   side effects beyond geometry construction.
src/textures/      Canvas-generated placeholder/plaque/skylight textures (cached by
                   content key — unlike the original, which built a fresh canvas per
                   instance) and a Suspense-compatible loader/cache for the three real
                   photographs.
src/scene/         Declarative r3f components (Space, Room, Wall, Passage, Hang, ...),
                   built from CompiledSpace. Static after mount; camera code never lives
                   here.
src/controller/    createController.ts is the whole camera/interaction layer: a factory
                   closure (not a class) owning pose/tween/keys/drag state, exposing
                   tick/approach/stepBack/travel/gotoRoom/enter/bindInput/dispose.
                   CameraController.tsx mounts it and calls tick() from a single
                   useFrame — the frame order (tween/yaw/walk exclusive chain -> room
                   recompute -> camera sync -> hover pick) is behavioural and ported
                   line-by-line; don't split it across components or hooks.
                   controllerRef.ts publishes the live instance so overlay components
                   outside the <Canvas> tree (the entry button, the room index) can call
                   its API without prop-drilling.
src/store/         A vanilla zustand store the controller writes via setState and React
                   reads via useGallery(selector). Holds ONLY coarse, event-rate fields
                   (current room id, mode, caption contents, tooltip text) — never pos,
                   yaw, pitch or the active tween, which would cause a re-render every
                   frame. The tooltip's cursor position bypasses the store entirely: the
                   controller writes the DOM node's style directly (see
                   controller/tooltipNode.ts).
src/overlay/       The 2D HTML overlay (room tag, room index, caption panel, tooltip, the
                   title-card name gate, the guestbook panel) — plain React reading the
                   store, calling controllerRef for actions.
src/api/           Client for the (separately deployed) guestbook backend. See
                   docs/api-contract.md for the contract and its rationale.
```

### Things a naive change is likely to break

- **compileSpace must stay pure.** It's called once at module scope
  (`src/space/compiled.ts`) rather than per-render; if it started mutating `NOCTURNE` in
  place, that one-time call would be fine but any future second variant or test that
  re-imports the spec would see corrupted data.
- **Only `sideA` can ever be `'E'`** in the wall-hole flip logic (`compileSpace.ts`'s
  `flipForE`) — `sideB` for an x-axis link is always `'W'`. This isn't a bug to "fix" by
  making both symmetric in a different way; it mirrors `design/gallery3d.js` exactly and
  a stricter TS literal type on `sideB` would make the symmetric-looking code a type
  error (see the comment on `flipForE`).
- **The spotlight/track-fixture placement in `Hang.tsx` is deliberately NOT nested inside
  the picture's `<group>`** — it's positioned in world space as a sibling, because the
  original adds it directly to `scene`, not to the picture group, and the standoff/height
  math only comes out right in world coordinates.
- **Only up to `MAX_LIT_PER_ROOM` (or a room's own `RoomSpec.maxLit` override)
  pictures per room ever get a spotlight** (`compileSpace.ts`'s `litIndexes`,
  widest-first, overridable per placement with `ArtPlacement.lit`/`litOffset`) —
  a performance ceiling from the original design (`design/README.md`: roughly
  1fps per extra light), not a style choice to relax. It's a *per-room* budget,
  not global: `Hang.tsx`'s `ArtLighting` only actually mounts a placement's
  spotlight/track fixture while `roomId` in the store equals that placement's
  room, so at most one room's lights are ever live at once regardless of how
  many rooms the variant has — raising the budget (globally or for one room via
  `maxLit`) costs frame rate only in the room a visitor is currently standing in.
- **The name-gate's global keydown handler must keep bailing on typing targets** — WASD
  and Escape are bound on `window` for in-gallery navigation; without the
  `isTypingTarget` guard in `createController.ts`, a visitor typing "d" or "escape" into
  the name field would trigger camera movement instead.
- **Entry is optimistic by design**: `TitleCard.tsx` never awaits `submitVisitor()` before
  calling `controllerRef.current?.enter()`. Don't "fix" this into a blocking await — a
  slow or offline backend must never keep a visitor out of the gallery.

## Design references, not part of the app

- `design/` — the original handoff bundle, runnable standalone (`cd design && python3 -m
  http.server 8000`, then open `Exhibition.dc.html`). Includes the three rejected
  concepts (`Concept-A-Enfilade`, `Concept-B-Atrium`, `Concept-C-Cabinet`) and
  `support.js`, the `.dc.html` authoring-format runtime — none of this ships.
- `docs/api-contract.md` — the HTTP contract the separately-deployed Go/Chi backend must
  implement (`POST /visitors`, `GET /guestbook`). Nothing in this repo implements that
  backend; changes to `src/api/` should stay in sync with this doc.
