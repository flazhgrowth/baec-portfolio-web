# Nocturne

A navigable 3D exhibition-building photography portfolio, built with Vite, React,
and react-three-fiber. Visitors enter their name at the door, walk through three
skylit rooms of framed prints, and can check a guestbook of who's already visited.

This repo is the frontend only. Name-gate and guestbook data are served by a
separate Go/Chi API (`fg-tamagochi`) that isn't part of this repo — see
[`docs/api-contract.md`](docs/api-contract.md) for the HTTP contract it implements.

## Getting started

```bash
npm install
npm run dev
```

Open the printed `http://localhost:5173` URL. Without `VITE_API_BASE_URL` set, the
app still runs fully: entry is optimistic (a missing backend never blocks a
visitor from entering) and the guestbook panel shows a calm empty/error state.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) then build for production |
| `npm run typecheck` | Type-check only, no bundling |
| `npm run lint` | ESLint over the whole repo |
| `npm run preview` | Serve the production build locally |

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Base URL for the guestbook backend. Default assumes a same-origin reverse proxy. |

Set it in a local `.env` file (gitignored) or at build time.

## Controls

- **Desktop**: WASD/arrows to walk, drag to look, click a print or doorway,
  Esc to step back from a print.
- **Mobile/touch** (<768px or coarse pointer): drag to look, tap a print or
  doorway to navigate — no free walking.

## Repository layout

```
src/            The app — see CLAUDE.md for the full architecture breakdown
public/art/     The three photographs served by the app
docs/           HTTP contract for the separately-deployed backend
design/         The original design handoff bundle (reference spec, not built/shipped)
```

For architecture details — the declarative/imperative split, the store shape,
disposal rules, and the specific things a naive change is likely to break —
see [`CLAUDE.md`](CLAUDE.md).
