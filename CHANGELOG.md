# Changelog

## [Unreleased]

## [1.1.0] - 2026-11-22

### Upgrading
Everything now lives in one folder, `/data` (`DATA_DIR`): `ezhost.sqlite`, the hosted files in `public/`, and `logs/`.

1. Stop the container.
2. Make one host folder holding `ezhost.sqlite` (from your old `/app/data` volume) and `public/` (your old `/app/public` volume).
3. Mount it as `- ./data:/data` instead of the two old volumes, and start it.

If you skip this, the app keeps using the old locations and logs a warning, so nothing is lost.

### Changed
- Logs go to the console (`docker logs`) and to rotating files in `$DATA_DIR/logs` (`ezhost.log`): 5 MB per file, 3 files kept. Each process writes its own file. The log file is now `ezhost.log` (was `general.log`).
- All state lives under one folder, `DATA_DIR` (`/data` in the image, `data/` when run from source), declared as a Docker volume. See **Upgrading**.
- The Docker image follows the ez standard: Alpine, runs as the unprivileged `bun` user (uid 1000), and a `HEALTHCHECK` that reports healthy within seconds of start.
- CI is two workflows, `test.yml` and `publish.yml`. Merging to `master` publishes `:<version>`, `:latest` and `:sha-<commit>` after the tests (and an image boot check) pass; a `vX.Y.Z` tag is optional and adds a GitHub Release.
- Every push to `development` publishes `:development` and `:sha-<commit>` after the tests, so unreleased changes can be tried without touching `master`.
- Header, sidebar and sign-in use the shared ez `Brand`: the ez icon and the lowercase name.
- Dependencies updated (majors kept only where the tests passed), Docker image on oven/bun 1.4.5, Biome as the linter, and the shared ez favicon.
- Style the vault OTP wall and file browser with the shared ez theme, responsive
  layouts, theme switch, file rows and inbox upload controls.
- Activate enrollment after successful private QR generation; remove the separate
  OTP confirmation command. Failed QR writes remain inactive; existing enrollments
  cannot be overwritten.
- Add isolated Our Vault mode: private TOTP enrollment, replay protection,
  persistent login throttling, hashed 30-minute sessions and authenticated downloads.
- Add authenticated streaming inbox uploads (100 MiB cap), exclusive creation,
  safe filenames and cleanup on failed uploads; parent folder stays read-only.
- Add separate hardened Docker Compose configuration and enrollment guide.
- Update frontend/backend dependencies; pin Docker Bun 1.4.4, migrate to Vite 8
  and stable React Compiler; freeze dependency installs.
- Keep existing public file-host behavior separate from vault mode.

## 1.0.0 — 2026-11-01

First release. ezhost is now an Elysia + Bun app with a redesigned React UI.

### Security
- The admin cookie holds a random session token (stored hashed, 24h expiry,
  revoked on sign-out) instead of the password.
- Rate limiting (50 requests/min per IP) now actually runs, including on sign-in.
- Uploaded files are served with a CSP `sandbox` header and `nosniff`, so an
  uploaded page can't act with the admin's session. Uploads stay public.
- Path checks on `/static` and admin file operations use a strict
  containment check.
- The Docker image runs as the unprivileged `bun` user (uid 1000) and never
  includes a local database.

### Features
- New public page at `/`: drop files anywhere, real upload progress, files
  checked before upload, copy-link on every row, image previews.
- Admin dashboard at `/admin` that works on phones; empty folders can be deleted.
- Accessible dialogs, light and dark themes, reduced-motion support.
- `docker-publish.yml` (GHCR) and `release.yml` (downloadable bundle) workflows,
  both gated on `test.yml`.

### Breaking changes
- The public page moved from `/app` to `/` (`/app` redirects), and the admin
  dashboard moved from `/` to `/admin`.
- `POST /api/v1/admin/dirs` rejects nested paths (`a/b`) with 400.
- Deleting a folder removes it when empty and returns 409 otherwise.
- Docker: the database now lives in `/app/data` — mount it as a volume, and
  make `public/` and `data/` writable by uid 1000
  (`sudo chown -R 1000:1000 public data`).
- Existing sign-ins are logged out once on upgrade.
