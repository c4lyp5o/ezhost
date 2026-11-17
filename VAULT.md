# Our Vault — local implementation

A separate ezhost instance: EZHOST_MODE=vault selects a separate route tree.
The existing public routes are not registered. Start with backend/start.js;
backend/index.js remains the public-only entry for existing callers.

## Container
Build: docker compose -f compose.vault.yml build
Deployment is NOT performed automatically. The example binds loopback port 5097;
an HTTPS reverse proxy must forward to it. Adapt the routing to the real proxy.
Set VAULT_ORIGIN to the exact external origin (required for POST checks behind TLS).
Do not expose this service over plain HTTP. No public DNS changes have been made.

Before deployment create the host folder and its inbox subfolder. Mount the parent
read-only and only inbox read-write (see compose.vault.yml). The inbox must be
writable by container uid 1000. Set VAULT_INBOX=/vault/inbox. Authentication state
uses a dedicated volume. Back it up privately: it contains the TOTP seed and sessions.
The folder and DB are not encrypted at rest. Host writers are trusted; do not allow
untrusted users to mutate folder entries concurrently (path checks are not a
kernel-level sandbox against a hostile local writer).

## Private enrollment
On the new container, run:
docker compose -f compose.vault.yml exec -e VAULT_QR_PATH=/app/data/enroll.svg vault bun vault-setup.js

Retrieve that file privately, scan it with an authenticator, then run:
docker compose -f compose.vault.yml exec vault bun vault-setup.js SIX_DIGIT_CODE

Delete the private QR file immediately after confirmation. Never publish the SVG,
copy it into the served folder, or put its contents in logs/chat. No HTTP enrollment
endpoint exists. Before confirmation all login attempts fail closed. Restarting
preserves enrollment. No remote reset route exists; lost-authenticator recovery
requires host access and deliberate replacement of the dedicated authentication DB.
This also revokes all sessions. OTP verification allows one 30-second step of drift;
accepted steps cannot be reused. Sessions expire after 30 minutes.

Five login attempts per client and thirty globally per five minutes, persisted
across restarts. Both successful and failed attempts count. Unknown peers share a
bucket. Forwarded IP headers are ignored unless VAULT_TRUSTED_PROXY exactly matches
the socket peer; only configure this for a proxy that overwrites X-Real-IP.
Global throttling deliberately trades availability for resistance to distributed
guessing. Listing/download APIs require a session, reject symlink paths, and have
no general write operations. Downloads are attachments and no-store.

## Private upload inbox
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

## Verification
Run backend: bun test
Run frontend: bun run build
Vault integration tests use real loopback HTTP, scratch SQLite and disposable files.
Container build/browser/proxy verification must be reported separately.
