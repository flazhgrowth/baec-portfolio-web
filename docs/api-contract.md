# Guestbook API contract

The frontend in this repo is a static site with no backend of its own. It expects a
separate service (a Go/Chi API, `fg-tamagochi`) to implement the two endpoints below.
Nothing here is implemented in this repo — this document is the spec the backend
must satisfy so the two sides can be built independently.

The frontend talks to `VITE_API_BASE_URL` (see `.env` / build-time env var),
defaulting to `/api` so a same-origin reverse proxy needs no configuration. All
paths below are relative to that base — e.g. `POST /visitors` means
`POST {VITE_API_BASE_URL}/visitors`.

## Behavioural notes the backend must honor

- **The name field is not trustworthy as sent.** The frontend caps it at 40
  characters as a UX convenience, not a control — the server must independently
  validate and length-cap `name` (reject empty/whitespace-only, cap length,
  presumably strip control characters). Never assume the client enforced anything.
- **`visitId` is an idempotency key**, one per browser tab (regenerated only if
  `sessionStorage` is unavailable). The frontend's entry flow is optimistic — it
  fires the `POST /visitors` request without awaiting it, and a slow network may
  cause the frontend's own retry logic (if any is added later) to resend the same
  `visitId`. The server should treat a repeated `visitId` as the same visit (upsert
  or ignore-on-conflict), not a second guest.
- **CORS**: the API must allow the frontend's origin (credentials are not used —
  no cookies/auth — so a permissive `Access-Control-Allow-Origin` for the known
  frontend origin(s) is sufficient).
- **Names are rendered as plain text** by React, which auto-escapes on output, so
  the API does not need to HTML-escape `name` for the frontend's sake. It should
  still treat the value as untrusted input for anything else it's used for
  (logging, other consumers, storage).
- **Response shape must be JSON on every status code the frontend might see**,
  including error responses — the client tries to read `{ "error": "..." }` from a
  non-2xx body and falls back to a generic message if that fails. A proxy or load
  balancer that returns an HTML error page for a 502/504 will surface as "Unexpected
  response from the server." on the frontend; matching the JSON error shape below is
  preferable to relying on that fallback.
- **Timeouts**: the frontend aborts both requests client-side after 5 seconds
  (`AbortSignal.timeout`). A failed or slow `POST /visitors` never blocks entry to
  the gallery — the visit is simply not logged, and a warning is written to the
  browser console. There's no retry queue in this version.

## `POST /visitors`

Logs a visitor entering the gallery.

**Request**

```jsonc
{
  "name": "Pradipta",
  "visitId": "3f1c9e2a-8b7e-4a2b-9c1d-6e0f8a2b7c3d" // client-generated UUID
}
```

**201 Created**

```jsonc
{
  "id": "42",
  "name": "Pradipta",
  "enteredAt": "2026-09-12T10:00:00Z" // ISO 8601, UTC
}
```

**Error responses** — any non-2xx should return:

```jsonc
{ "error": "human-readable message" }
```

Expected cases: `400` (missing/invalid `name` or `visitId`), `422` (name fails
server-side validation), `429` (rate limited). The frontend does not currently
special-case any of these — it logs the error and moves on — but a real `error`
message helps debugging.

## `GET /guestbook`

Lists visitors, newest first. Fetched lazily the first time a visitor opens the
guestbook panel in the gallery UI — never preloaded, so an outage here only
degrades that one panel, never the entry flow.

**Query parameters**

| Param    | Type   | Default | Notes                                             |
| -------- | ------ | ------- | -------------------------------------------------- |
| `limit`  | number | 50      | Max entries to return.                             |
| `cursor` | string | —       | Opaque pagination cursor from a prior response.     |

The frontend currently only calls `GET /guestbook?limit=50` (no pagination UI yet),
but the shape below reserves cursor-based paging so it can be added without a
breaking change.

**200 OK**

```jsonc
{
  "entries": [
    { "id": "42", "name": "Pradipta", "enteredAt": "2026-09-12T10:00:00Z" }
  ],
  "total": 128,
  "nextCursor": "eyJvZmZzZXQiOjUwfQ==" // or null if this is the last page
}
```

An empty gallery should return `{ "entries": [], "total": 0, "nextCursor": null }`,
not an error — the frontend renders "No visitors yet — be the first." for this case.
