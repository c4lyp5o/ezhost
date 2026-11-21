# Changelog

## [Unreleased]

### Changed
- Header, sidebar and sign-in use the shared ez `Brand`: the ez icon and the lowercase name.

## [1.0.1] - 2026-11-22

### Changed
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
