# syntax=docker/dockerfile:1

# ---- build: compile the Vite app to static assets ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines every VITE_* var into the built JS at compile time — there is no
# runtime env to read once this becomes a static bundle in nginx. So this MUST be a
# build ARG (wired from docker-compose.yml's `build.args`), not a container
# `environment:` entry; changing it later means rebuilding the image, not just
# restarting the container. Defaults to same-origin /api/v1, matching src/api's own
# fallback, so a reverse proxy on the VPS needs no extra config if it forwards
# /api/v1 to the backend itself.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---- serve: nginx serving the static output ----
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
