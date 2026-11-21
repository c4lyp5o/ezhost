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

## Our Vault (private mode)

Set `EZHOST_MODE=vault` to run an isolated OTP-gated file browser instead of the
public uploader. Use a separate container and auth volume; public routes are not
mounted. Authenticated uploads go only to the writable inbox; other files remain
read-only. See [Our Vault: deployment and security](#our-vault-deployment-and-security) for enrollment, limits and deployment.

Docker pins Bun 1.4.4; frontend uses Vite 8 and stable React Compiler. Dependency
installs in Docker use frozen lockfiles.

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

## Development

Setup, commands, tests, linting and the `development` → `master` release flow are in [DEVELOPER.md](DEVELOPER.md). Changes are listed in [CHANGELOG.md](CHANGELOG.md).

## Admin

### Setup

1. Set the admin password (only on first run):
   ```bash
   export ADMIN_PASSWORD="your-secure-password-here"
   ```

2. Start the server:
   ```bash
   cd ~/ezhost
   PORT=3180 bun run backend/index.js
   ```

   The server will create an admin user with:
   - Username: `admin`
   - Password: `[value of ADMIN_PASSWORD]`

### Access

- **Admin Dashboard**: Open `http://localhost:3180/` in your browser
- **Login Page**: If not logged in, you'll be redirected to `http://localhost:3180/login`

### API Endpoints (Admin)

All admin endpoints require authentication via the admin session cookie set after logging in.

#### Create a Folder
```bash
curl -X POST http://localhost:3180/api/v1/admin/dirs \
  -H "Content-Type: application/json" \
  -d '{"path":"/test-admin-folder"}'
```

#### Delete a File
```bash
## Replace :id with the actual file ID from the file list
curl -X DELETE http://localhost:3180/api/v1/admin/files/:id
```

#### List Files (Public)
```bash
curl http://localhost:3180/api/v1/files
```

### Live Demo
- Open browser at `http://localhost:3180/` after server starts
- You'll see file list with delete buttons in the UI

### Password Note
- The admin password is hashed using Bun.password.bcrypt and stored in a SQLite database (`ezhost.sqlite`).
- On subsequent runs, the server will use the existing admin credentials; you do not need to set `ADMIN_PASSWORD` again unless you want to change the password (which requires deleting the database and restarting).
- The admin dashboard provides a UI for file management, including folder creation and file deletion.

### Testing with curl

1. **Get admin session**:
```bash
## First login to get cookie
LOGIN_RESP=$(curl -s -X POST http://localhost:3180/login -H "Content-Type: application/json" -d '{"password":"ezhost-admin-2026"}' | jq -r '.cookies | keys[]')
echo "Login response: $LOGIN_RESP"
```

2. **Create a folder** (using cookie from login):
```bash
curl -X POST http://localhost:3180/api/v1/admin/dirs \
  -H "Content-Type: application/json" \
  -H "Cookie: auth=$LOGIN_RESP" \
  -d '{"path":"/test-admin-folder"}' 2>&1 | jq
```

#### Expected responses:
- `201 Created` for successful folder creation
- `401 Unauthorized` if not logged in
- `400 Bad Request` for invalid JSON paths

### Troubleshooting

- **Server not responding**: Check if process is running:
  ```bash
  ps aux | grep "bun backend"
  ```
- **Connection refused**: Ensure server is running on port 3180
- **401 Unauthorized**: Verify login credentials and that you're sending the correct cookie

### Commitment to Calypso's Style

✅ Bun native (no native dependencies)
✅ Elysia framework with proper routing
✅ Type hints and structured responses
✅ Error handling with proper HTTP status codes
✅ Mobile-friendly admin UI with dark theme

## Our Vault: deployment and security

A separate ezhost instance: EZHOST_MODE=vault selects a separate route tree.
The existing public routes are not registered. Start with backend/start.js;
backend/index.js remains the public-only entry for existing callers.

### Container
Build: docker compose -f compose.vault.yml build
Deployment is NOT performed automatically. The example binds loopback port 5097;
an HTTPS reverse proxy must forward to it. Adapt the routing to the real proxy.
Set VAULT_ORIGIN to the exact external origin (required for POST checks behind TLS).
Do not expose this service over plain HTTP. The home deployment uses
https://test.calypso.dedyn.io through Traefik on traefik_default; compose includes
the router labels. The host port remains loopback-only.

Before deployment create the host folder and its inbox subfolder. Mount the parent
read-only and only inbox read-write (see compose.vault.yml). The inbox must be
writable by container uid 1000. Set VAULT_INBOX=/vault/inbox. Authentication state
uses a dedicated volume. Back it up privately: it contains the TOTP seed and sessions.
The folder and DB are not encrypted at rest. Host writers are trusted; do not allow
untrusted users to mutate folder entries concurrently (path checks are not a
kernel-level sandbox against a hostile local writer).

### Private enrollment
On the new container, run:
docker compose -f compose.vault.yml exec -e VAULT_QR_PATH=/app/data/enroll.svg vault bun vault-setup.js

Successful private QR creation activates enrollment immediately; no confirmation
command is needed. Retrieve the file privately, scan it with an authenticator,
then sign in with a current code. QR creation failures leave enrollment inactive.
Existing enrollments are never regenerated or reset by this command.

Delete the private QR file immediately after scanning. Never publish the SVG,
copy it into the served folder, or put its contents in logs/chat. No HTTP enrollment
endpoint exists. Before successful QR creation all login attempts fail closed. Restarting
preserves enrollment. No remote reset route exists; lost-authenticator recovery
requires host access and deliberate replacement of the dedicated authentication DB.
This also revokes all sessions. OTP verification allows one 30-second step of drift;
accepted steps cannot be reused. Sessions expire after 30 minutes.
Browser reloads restore an existing valid session through the authenticated session
endpoint; they do not extend its expiry. File listings refresh every five seconds
while the page is active, using SWR. Transient failures preserve the last list;
an authentication failure hides it. Sort by name, created date, updated date or
size in either direction (folders first). Dates are filesystem birth/modified
timestamps, not upload history; unsupported birth times display as unavailable.
Directory sizes are not recursively calculated.

Five login attempts per client and thirty globally per five minutes, persisted
across restarts. Both successful and failed attempts count. Unknown peers share a
bucket. Forwarded IP headers are ignored unless VAULT_TRUSTED_PROXY exactly matches
the socket peer; only configure this for a proxy that overwrites X-Real-IP.
Global throttling deliberately trades availability for resistance to distributed
guessing. Listing/download APIs require a session, reject symlink paths, and have
no general write operations. Downloads are attachments and no-store.

### Display the existing QR privately
Vault startup logs contain only the private SVG path (if retained) and this command:

`docker compose -f compose.vault.yml exec vault bun vault-setup.js --show`

Run from the repository over your private SSH terminal. It renders the existing
seed as a terminal QR without changing enrollment or replay state. It refuses
non-interactive stdout; do not record the terminal or share the QR. The original
SVG may be deleted after scanning; display regenerates the QR in memory from the
stored seed, not a new secret. Nothing sensitive is printed during startup.

### Private upload inbox
After login, the file picker uploads one file at a time to inbox, regardless of
which folder is being browsed. The server streams raw bytes with a 100 MiB cap
(including chunked bodies), rejects empty files and unsafe/path-like filenames,
and exclusively creates files: existing files and symlinks are never overwritten.
Failed/oversized uploads are removed. Files are stored with mode 0600 and never
executed or extracted. Host uid 1000 can read them directly at
/home/calypso/workspace/testfiles/inbox. No malware scanning is performed; treat
uploaded contents as untrusted data. There is no total storage quota yet, so an
authenticated user can fill the inbox; monitor disk space. A disconnected upload
or process crash can leave a partial file; check before retrying after an error.
The writable inbox mount does not permit modifying the rest of the vault.

### Verification
Run backend: bun test
Run frontend: bun run build
Vault integration tests use real loopback HTTP, scratch SQLite and disposable files.
Container build/browser/proxy verification must be reported separately.

## License

MIT. See [LICENSE](LICENSE).
