# ezhost 📦

Minimal static file host + uploader. Elysia + Bun, following the eziarr
blueprint: layered `backend/{config,logger,utils,services,plugins,routes}`.

## What it does

- **`/static/*`** — serves files from `public/` (uploads land here)
- **`/`** — the public page: upload by dropping files, browse and copy links
- **`/admin`** — admin dashboard (sign in at `/login`): delete files and empty
  folders, create single-level folders. `/app` redirects to `/`.
- **`GET /api/v1/healthcheck`** — loopback-only probe (Docker healthcheck)
- **`GET /api/v1/files`** — lists uploaded files
- **`POST /api/v1/upload`** — multipart upload, field name `files`, 100MB cap

Every request is rate-limited to 50/min per client IP (429 after that),
including `/login`. Uploads are public; they are served with a CSP `sandbox`
header so an uploaded page can't act with the admin's session.

## Development

```bash
bun install           # backend + client deps
bun run dev           # backend (watch) + client (vite) concurrently
bun run test:backend  # bun test
```

Client dev server runs on :3000 and proxies `/api` and `/static` to :5000
(login is `POST /api/v1/admin/login`; `POST /login` remains as an alias).

## Production

```bash
bun run build:client
NODE_ENV=production bun backend/index.js   # or: bun run start
```

Docker:

```bash
docker build -t ezhost .
docker run -p 5000:5000 \
  -e ADMIN_PASSWORD=change-me \
  -v ./public:/app/public \
  -v ./data:/app/data \
  ezhost
```

Two pieces of state, both must be volumes:

- `/app/public` — uploaded files.
- `/app/data` — `ezhost.sqlite` (admin hash + login sessions). Without this
  volume, recreating the container re-seeds the admin from `ADMIN_PASSWORD`
  and logs everyone out.

`ADMIN_PASSWORD` is only read on first run (empty DB). The container runs as
the unprivileged `bun` user (uid 1000): host directories you mount must be
writable by that uid (`sudo chown -R 1000:1000 public data`).

Outside Docker the DB defaults to `backend/ezhost.sqlite` regardless of the
working directory; override with `EZHOST_DB`.
