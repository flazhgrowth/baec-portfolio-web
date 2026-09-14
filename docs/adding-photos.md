# Adding photos to the gallery

A practical guide for putting a new photo (or placeholder) into the Nocturne
variant: which files to touch, where on which wall there's actually room, how
big it can be, and how the automatic spotlighting works. This is about content
(art placements), not the app's architecture — see `CLAUDE.md` for that.

## The two files you touch

**`src/space/artworks.ts`** — the artwork itself: what it *is*.

```ts
x10: {
  ph: "PHOTO 13 · 3:2",     // placeholder label baked into the canvas texture
  title: "Untitled",
  meta: "awaiting print",
  ar: 1.5,                  // width ÷ height — this drives every size calc below
  note: "An empty hang. Drop a photograph in to fill it.",
},
```

A real photo uses `src` instead of `ph` (see [Real photo vs. placeholder](#real-photo-vs-placeholder)).

**`src/space/nocturne.ts`** — where it hangs: a room's `art` list.

```ts
{ k: "x10", wall: "S", u: -2.0, w: 1.2 },
```

- `k` — the key into `ARTWORKS`.
- `wall` — which wall: `"N" | "S" | "W" | "E"` (the room's four sides), or
  `"P+" | "P-"` for the two faces of the Hall's freestanding partition (only the
  Hall has one).
- `u` — position along that wall, in metres from the wall's **midpoint**.
  Positive/negative direction depends on the wall (see below).
- `w` — width in metres. Height is derived as `w / ar`, so reshaping a photo is
  an `artworks.ts` edit (`ar`), never a `nocturne.ts` edit.
- `v` (optional) — vertical offset in metres from the standard hang height
  (`CENTER_HEIGHT = 1.53m`, in `src/geometry/layout.ts`). Omit it for a normal
  eye-level hang; use it to stack pieces at different heights (see the trio
  left of `x3` in the Hall for a worked example).

Adding an entry to a room's `art` array is the entire job for a placeholder.
Run `npm run typecheck && npm run lint` after — both are clean gates for this
layer since it's pure data.

## Which direction is `u`?

`u` runs along the wall in a fixed world direction, not "left/right as you
walk in." From `src/geometry/layout.ts`:

| Wall | `u` increases toward | Facing that wall, `u` increasing is... |
| --- | --- | --- |
| `N` | East (+X) | to your right |
| `S` | East (+X) | to your left |
| `W` | South (+Z) | to your left |
| `E` | South (+Z) | to your right |

(World convention: -Z is North, +Z is South, -X is West, +X is East, and
"facing the wall" means standing in the room looking at it.) `u = 0` is
always the wall's midpoint. In this variant every doorway happens to land at
`u = 0` too (every room's centre lines up with the next room's along the axis
they're linked on) — not a rule the engine enforces, just how `nocturne.ts`'s
room coordinates were chosen — so laying out a wall with a door is usually
"door in the middle, pieces fanned out to either side," same as the Hall's
`W` wall (`p1` and `x3`/the new trio flanking the doorway to the Special
Room).

## Sizing and clearance

A placement's **visible footprint** is bigger than `w` × `w/ar` — there's a
mat + frame border, and a small plaque hanging off to one side:

- Frame footprint: `w + 0.32` wide, `(w/ar) + 0.32` tall (`spec.matW +
  spec.frameW`, doubled, from `Hang.tsx`).
- Leave **another ~0.4–0.5m** past the frame's edge on one side for its
  plaque (a small title/meta placard) — don't butt two pieces flush against
  each other.
- Vertically: bottom edge must clear the baseboard (`spec.baseH = 0.1m`) with
  room to spare, and top edge must stay under the room's ceiling (`6.8m` in
  the Hall, `4.2m` in the three smaller rooms) — check
  `CENTER_HEIGHT + v ± (frame height)/2` against both.
- Near a doorway: the hole itself is `doorW = 2.05m` wide, centred at `u = 0`
  on the wall(s) it's cut into — stay clear of `u ∈ [-1.4, 1.4]` or so on a
  door wall (a bit more than half the door width, for margin).
- Near a corner: leave **~0.8–1m** before the wall ends (this is a visual
  convention this codebase follows, not an enforced limit — nothing stops you
  from going closer, it just starts looking cramped against the adjacent
  wall).

## Where there's actually room right now

Rough audit of each wall's occupied span (using each placement's core `u ± w/2`,
not the wider frame footprint — leave the margins above on top of these
numbers). All rooms are square, so N/S and W/E walls are the same length.

**The Hall** (`h`, 16m × 16m walls, `u ∈ [-8, 8]`; partition faces `u ∈ [-4, 4]`)

| Wall | Occupied | Free |
| --- | --- | --- |
| `P+` | `p2` (-2.9 to 0.1), `x1` (2.1 to 3.3) | most of the rest — plenty either side |
| `P-` | `x2` (-0.7 to 0.7) | both ends, ~3.3m each |
| `W` | door (-1.0 to 1.0), `p1` (-4.1 to -1.5), `x3` (2.65 to 4.15), trio (~5.0 to 6.0) | thin gaps around the door; ~2m past the trio before the SW corner |
| `S` | `x4` only (4.25 to 5.35) | **wide open** — ~12m on one side, ~2.6m on the other |
| `N` | door only | wide open both sides of the door |
| `E` | door only | wide open both sides of the door |

The Hall's **S wall** is the obvious place to put something next — it's
almost entirely empty.

**North Room** (`n`), **East Room** (`e`), **Special Room** (`sp`) — all
9m × 9m, `u ∈ [-4.5, 4.5]`:

- North Room: `N` wall has two pieces (`p3`, `x5`) with room to spare either
  side; `W`, `E` each have one small centred piece; `S` (the door wall, back
  toward the Hall) is **completely open** apart from the doorway.
- East Room: `E` wall has two pieces with a ~2m gap between them; `N`, `S`
  each have one small centred piece with room either side; `W` (the door
  wall) is open apart from the doorway.
- Special Room: only `sp1` on the `W` wall (facing the entrant). `N` and `S`
  are **completely empty** — this room has the most open wall space in the
  gallery if you want to build it out.

## Lighting

There's no per-picture "make this one lit" flag. `compileSpace.ts` picks the
**three widest placements in each room** (by `w`) and gives only those a
spotlight + track fixture (`litIndexes`, computed per room). This is a
deliberate performance ceiling carried over from the original design spec
(`design/README.md`: roughly 1fps per extra light) — not something to relax
by just adding more lights.

What this means in practice:

- **To get a new photo lit**, make it wider than the room's current
  3rd-widest piece. Check the room's `art` list in `nocturne.ts` and sort by
  `w` — e.g. in the Hall, the current lit set is `p2` (2.95), `p1` (2.55),
  `x3` (1.5), so anything under 1.5m wide won't be lit no matter where you
  put it, and adding a >1.5m piece will bump `x3` out of the lit set.
- **Small/accent pieces stay unlit** by design (this is intentional — see the
  trio left of `x3`, or the existing `x1`/`x4`/`x5`/`x6` placeholders scattered
  around). They're still visible under the room's ambient/hemisphere light,
  just dimmer. Don't chase a bright screenshot of one of these; it's supposed
  to read as a quiet accent, not a hero piece.
- **The spotlight's look is global**, not per-picture: `spec.spot` in
  `nocturne.ts` (`color`, `i` intensity, `angle`, `pen` penumbra, `dist`
  throw, `standoff` distance from the wall) applies to every lit piece in the
  whole variant, as does `spec.track`/`trackColor`/`railColor` (the ceiling
  fixture look). Changing these changes every spotlight in every room at
  once — there's no room-by-room or picture-by-picture override today.
- **If you actually need more than 3 lit pieces per room**, or specific
  pieces lit regardless of width, that's a small code change, not a data
  change: `litIndexes` in `src/space/compileSpace.ts` is where the
  widest-3 rule lives. Swapping it for (or supplementing it with) an explicit
  `lit?: boolean` on `ArtPlacement` would work, but think about the frame-rate
  cost first — that's exactly the tradeoff the original 3-light ceiling was
  drawn to avoid.

## Real photo vs. placeholder

A placeholder (`ph` field) renders a generated canvas texture — no image file
needed, good for blocking out a wall before real content exists (this is what
every `x1`–`x9` entry is).

A real photo (`src` field) needs an actual file:

1. Drop the image in `public/art/` (e.g. `p4.jpg`).
2. Find its true pixel aspect ratio (`width / height`) — don't guess. E.g.
   `sips -g pixelWidth -g pixelHeight public/art/p4.jpg` on macOS.
3. Add it to `artworks.ts` with `src: "/art/p4.jpg"` and that exact `ar`.
4. Reference its key from a room's `art` list, same as any placeholder.

Getting `ar` wrong stretches the photo — the frame/mat sizing is entirely
derived from `w` and `ar`, there's no independent height field to fall back
on.

## Worked example: adding one photo to the Hall's south wall

The S wall is wide open (see the table above), so this is the easiest slot
in the gallery right now.

```ts
// artworks.ts
x10: {
  ph: "PHOTO 13 · 3:2",
  title: "Untitled",
  meta: "awaiting print",
  ar: 1.5,
  note: "An empty hang. Drop a photograph in to fill it.",
},
```

```ts
// nocturne.ts, room "h"'s art list
{ k: "x10", wall: "S", u: -2.0, w: 1.4 },
```

At `w: 1.4` this won't crack the Hall's lit-3 (needs >1.5m), so it'll hang as
an unlit accent, same as `x4` on the same wall. If you want it lit instead,
size it above 1.5m and expect `x3` to lose its spotlight to make room.

## Checklist

- [ ] `ar` in `artworks.ts` matches the image's real pixel ratio (real photos only).
- [ ] `u`/`w` don't overlap an existing piece's frame footprint (`w + 0.32`) or a doorway hole.
- [ ] Left ~0.4–0.5m past the frame for its plaque, and ~0.8–1m before a corner.
- [ ] `CENTER_HEIGHT + v` keeps the frame between the baseboard and the ceiling.
- [ ] Checked whether the new `w` changes the room's lit-3 set, and that's intentional.
- [ ] `npm run typecheck && npm run lint` clean.
- [ ] Looked at it in `npm run dev` — the numbers above are a starting point, not a guarantee against something looking off in person.
