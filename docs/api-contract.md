# Guestbook API contract

The frontend in this repo is a static site with no backend of its own. It expects a
separate service (a Go/Chi API, `fg-tamagochi`) to implement the two endpoints below.
Nothing here is implemented in this repo — this document is the spec the backend
must satisfy so the two sides can be built independently.

The frontend talks to `VITE_API_BASE_URL` (see `.env` / build-time env var),
defaulting to `/api/v1` so a same-origin reverse proxy needs no configuration. All
paths below are relative to that base — e.g. `POST /guests` means
`POST {VITE_API_BASE_URL}/guests`.

## Response envelope

**Every response, success or error, is wrapped the same way:**

```jsonc
{
  "code": "success",       // "success" on the happy path; an error code string otherwise
  "message": "Success",    // human-readable — safe to show/log as-is on error
  "data": { /* ... */ },   // the payload described per-endpoint below; null on error
  "servertime": 0          // not consumed by the frontend
}
```

The endpoint sections below describe the shape of `data` only — assume it's wrapped
in the envelope above on every response. The frontend unwraps `data` on success and,
on a non-2xx status, throws `message` from the envelope (falling back to a generic
message if the body isn't parseable JSON or doesn't match this shape).

## Behavioural notes the backend must honor

- **The name field is not trustworthy as sent.** The frontend caps it at 40
  characters as a UX convenience, not a control — the server must independently
  validate and length-cap `name` (reject empty/whitespace-only, cap length,
  presumably strip control characters). Never assume the client enforced anything.
- **`visit_id` is an idempotency key**, one per browser tab (regenerated only if
  `sessionStorage` is unavailable). The frontend's entry flow is optimistic — it
  fires the `POST /guests` request without awaiting it, and a slow network may
  cause the frontend's own retry logic (if any is added later) to resend the same
  `visit_id`. The server should treat a repeated `visit_id` as the same visit (upsert
  or ignore-on-conflict), not a second guest.
- **CORS**: the API must allow the frontend's origin (credentials are not used —
  no cookies/auth — so a permissive `Access-Control-Allow-Origin` for the known
  frontend origin(s) is sufficient).
- **Names are rendered as plain text** by React, which auto-escapes on output, so
  the API does not need to HTML-escape `name` for the frontend's sake. It should
  still treat the value as untrusted input for anything else it's used for
  (logging, other consumers, storage).
- **The envelope must be present on every status code the frontend might see**,
  including error responses — the client reads `message` from the envelope on a
  non-2xx body and falls back to a generic message if that fails. A proxy or load
  balancer that returns an HTML error page for a 502/504 will surface as "Unexpected
  response from the server." on the frontend; matching the envelope shape above on
  error responses too is preferable to relying on that fallback.
- **Timeouts**: the frontend aborts both requests client-side after 5 seconds
  (`AbortSignal.timeout`). A failed or slow `POST /guests` never blocks entry to
  the gallery — the visit is simply not logged, and a warning is written to the
  browser console. There's no retry queue in this version.

## `POST /guests`

Logs a visitor entering the gallery.

**Request**

```jsonc
{
  "name": "Pradipta",
  "visit_id": "3f1c9e2a-8b7e-4a2b-9c1d-6e0f8a2b7c3d" // client-generated UUID
}
```

**201 Created** — `data`:

```jsonc
{
  "id": 42,
  "name": "Pradipta",
  "visited_at": "2026-09-12T10:00:00Z" // ISO 8601, UTC
}
```

**Error responses** — any non-2xx should return the envelope with `data: null` and a
useful `message`, e.g.:

```jsonc
{ "code": "invalid_name", "message": "name must be 1–40 characters", "data": null, "servertime": 0 }
```

Expected cases: `400` (missing/invalid `name` or `visit_id`), `422` (name fails
server-side validation), `429` (rate limited). The frontend does not currently
special-case any of these — it logs the error and moves on — but a real `message`
helps debugging.

## `GET /guests`

Lists visitors, newest first. Fetched lazily the first time a visitor opens the
guestbook panel in the gallery UI — never preloaded, so an outage here only
degrades that one panel, never the entry flow.

**Query parameters**

| Param    | Type   | Default | Notes                                             |
| -------- | ------ | ------- | -------------------------------------------------- |
| `size`  | number | 50      | Max entries to return.                             |
| `cursor` | string | —       | Opaque pagination cursor from a prior response.     |

The frontend currently only calls `GET /guests?size=50` (no pagination UI yet),
but the shape below reserves cursor-based paging so it can be added without a
breaking change. The backend may implement pagination as page-based internally for
now, but must still expose it to the frontend in the `total`/`cursor` shape below —
this is what the client codes against, independent of how the backend paginates
under the hood.

**200 OK** — `data`:

```jsonc
{
  "guests": [
    { "id": 42, "name": "Pradipta", "visited_at": "2026-09-12T10:00:00Z" }
  ],
  "pagination": {
      "total": 128,
      "cursor": "eyJvZmZzZXQiOjUwfQ==" // or null if this is the last page
  }
}
```

An empty gallery should return a `data` of
`{ "guests": [], "pagination": { "total": 0, "cursor": null } }`, not an error — the
frontend renders "No visitors yet — be the first." for this case.

**Note:** the guest object above always includes `id`, matching `POST /guests`. If a
particular deployment can't supply one on the list endpoint, the frontend falls back
to `name` + `visited_at` for its React list key — but `id` should be sent whenever
the backend has it.

## `POST /specials/validate`

Gates the Special Room, a fourth room (single print, placeholder for now) reachable
only from The Hall's west doorway. The doorway is visually roped off and the
frontend also blocks free-walking through it client-side — but that's only a UX
nicety, **the server is the actual gate**: the frontend never lets a visitor into
the room's scene state until this call returns 2xx, and does not cache a positive
result across page loads (no token is stored — a refresh re-locks the room).

**Request**

```jsonc
{ "token": "whatever-the-visitor-typed" }
```

**200 OK** — `data: null`. Any 2xx unlocks the room; the frontend does not read
anything from `data` for this endpoint, so `null` is fine.

**Error responses** — any non-2xx should return the envelope with `data: null` and a
`message` suitable to show the visitor directly (e.g. "That token isn't valid.");
unlike `POST /guests`, this `message` **is** shown in the gate's UI, not just logged.
Expected cases: `400` (missing/empty `token`), `401`/`403` (token doesn't validate),
`429` (rate limited).

**Behavioural notes specific to this endpoint:**
- Unlike `POST /guests`, this call **is awaited** — the gate's "unlock" button stays
  in a loading state until the response comes back, and the room only opens on 2xx.
  A slow/offline backend leaves the room locked with a visible error, which is the
  intended behavior here (this is the one place in the app where blocking on the
  network is correct, not a bug to optimistically route around).
- The frontend's 8s client-side timeout (`AbortSignal.timeout`) surfaces as a
  generic "Could not validate that token." if the server hangs.
- Tokens are presumably meant to be single-use or rate-limited server-side — the
  frontend has no lockout/retry-limit logic of its own and will happily resubmit
  on every click.
