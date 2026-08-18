# ezhost 📦

Minimal static file host + uploader. Elysia + Bun, following the eziarr
blueprint: layered `backend/{config,logger,utils,services,plugins,routes}`.

## What it does

- **`/static/*`** — serves files from `public/` (uploads land here)
- **`/`** — serves the built React client (`dist/`), SPA fallback included
- **`GET /api/v1/healthcheck`** — loopback-only probe (Docker healthcheck)
- **`GET /api/v1/files`** — lists uploaded files (rate-limited, 50/min)
- **`POST /api/v1/upload`** — multipart upload, field name `files`, 100MB cap

## Development

```bash
bun install           # backend + client deps
bun run dev           # backend (watch) + client (vite) concurrently
bun run test:backend  # bun test
```

Client dev server runs on :3000 and proxies `/api` to :5000.

## Production

```bash
bun run build:client
NODE_ENV=production bun backend/index.js   # or: bun run start
```

Docker:

```bash
docker build -t ezhost .
docker run -p 5000:5000 -v ./public:/app/public ezhost
```

Mount `public/` as a volume so uploads survive container restarts.
