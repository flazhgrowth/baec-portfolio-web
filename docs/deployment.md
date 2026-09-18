# Deploying to a VPS with Docker Compose

This repo is a **static frontend only** — `docker-compose.yml` here builds and serves
it, nothing else. The guestbook/messages backend (`fg-tamagochi`, Go/Chi) is a separate
service, deployed and run independently (its own compose file/process, wherever that
lives) — see `docs/api-contract.md` for the contract between the two. This doc only
covers getting *this* repo's built site running and reachable.

## What ships

- **`Dockerfile`** — multi-stage: `node:20-alpine` runs `npm ci && npm run build`
  (`tsc -b && vite build`), then `nginx:1.27-alpine` serves the resulting `dist/`.
- **`nginx.conf`** — gzip, long-lived caching for hashed `/assets/*`, no-cache on
  `index.html`, and a catch-all fallback to `index.html` (harmless today since there's
  no client-side router, and free insurance if one is ever added).
- **`docker-compose.yml`** — one `web` service built from the Dockerfile, publishing
  nginx's port 80 on the host at `${WEB_PORT:-8081}`.
- **`.dockerignore`** — keeps `node_modules`, `design/`, `docs/`, `.git` out of the
  build context; none of it is needed to produce `dist/`.

## The one gotcha: `VITE_API_BASE_URL` is a build-time value

Vite inlines every `VITE_*` variable into the compiled JS **at build time**. Once that's
baked into static files served by nginx, there is nothing left at container-start to
read an env var from — a plain `environment:` entry on the `web` service would do
nothing. That's why `docker-compose.yml` wires it as a `build.args` value instead,
sourced from a local `.env` file that `docker compose` loads automatically:

```bash
# .env, next to docker-compose.yml — not committed (see .gitignore)
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
WEB_PORT=8081
```

Practical consequence: **the backend's public URL needs to be settled before the first
build**, and **any later change to it needs a rebuild, not just a restart**:

```bash
docker compose up -d --build   # not just `docker compose restart`
```

## First deploy on the VPS

1. Install Docker + the Compose plugin (`docker compose version` should work; on
   Debian/Ubuntu that's the `docker-compose-plugin` package from Docker's own apt repo,
   not the old standalone `docker-compose` binary).
2. Clone this repo onto the VPS (or pull a prebuilt image from a registry instead — see
   [Building elsewhere and shipping the image](#building-elsewhere-and-shipping-the-image)
   below if the VPS itself shouldn't run `npm ci`/`vite build`).
3. Copy `.env.example` to `.env` and fill in the real values:
   ```bash
   cp .env.example .env
   # edit VITE_API_BASE_URL to the backend's real, public base URL
   # edit WEB_PORT only if 8081 is already taken on this host
   ```
4. Build and start:
   ```bash
   docker compose up -d --build
   ```
5. Verify:
   ```bash
   curl -I http://localhost:${WEB_PORT:-8081}/
   docker compose logs -f web
   ```

At this point the site is reachable on the VPS at that port, but not yet on the public
internet with a real domain/TLS — that's the reverse proxy step below.

## Putting it behind a domain + HTTPS

`docker-compose.yml` intentionally does **not** include a reverse proxy or TLS
termination — that depends on what's already running on the VPS (a shared proxy for
multiple sites is a very different setup from a single-site box). Whatever fronts it
just needs to forward to `127.0.0.1:${WEB_PORT}` (or the container on its compose
network, if the proxy is added as another service in this same file).

If nothing is running yet and a simple option is wanted, Caddy is the least
configuration for automatic Let's Encrypt TLS — a `Caddyfile` on the host:

```
gallery.yourdomain.com {
    reverse_proxy 127.0.0.1:8081
}
```

then `caddy run` (or Caddy's own systemd service/Docker image) alongside this compose
project. Nginx/Traefik/an existing proxy work the same way in principle: forward the
domain to this container's published port.

**CORS reminder**: whatever domain ends up serving this frontend is the origin the
backend's CORS policy must allow — see the CORS note in `docs/api-contract.md`. A
frontend that loads fine but whose guestbook/message calls fail silently in the browser
console is almost always this.

## Redeploying after a change

```bash
git pull
docker compose up -d --build
```

`--build` is safe to always include — Docker's layer cache skips the `npm ci` layer
when `package.json`/`package-lock.json` haven't changed, so a source-only change
rebuilds fast. Old, now-unused images accumulate over repeated builds; occasionally:

```bash
docker image prune -f
```

## Rolling back

There's no image registry/tagging set up here — a rollback is `git checkout` (or
`revert`) to the previous commit, then rebuild:

```bash
git checkout <previous-commit-or-tag>
docker compose up -d --build
```

## Building elsewhere and shipping the image

If the VPS is small enough that a `vite build` on it isn't desirable, build the image
somewhere with more resources (a CI runner, a dev machine) and push it to a registry
instead of building in place on the VPS:

```bash
docker build -t <registry>/baec-portfolio-web:<tag> \
  --build-arg VITE_API_BASE_URL=https://api.yourdomain.com/api/v1 .
docker push <registry>/baec-portfolio-web:<tag>
```

Then on the VPS, swap `docker-compose.yml`'s `build:` block for `image:
<registry>/baec-portfolio-web:<tag>` and `docker compose pull && docker compose up -d`
instead of `--build`. Not set up by default in this repo since it adds a registry
dependency the VPS-only path doesn't need.
