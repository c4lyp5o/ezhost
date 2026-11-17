# ezhost frontend

React 19 + Vite 8 + Tailwind 4. Stable React Compiler is configured through
@rolldown/plugin-babel. Run `bun install --frozen-lockfile`, `bun run dev`,
`bun run lint`, and `bun run build` from this directory.

The entrypoint detects vault mode through /api/v1/vault/status and renders the
OTP wall without fetching file data before authentication. The private Vault
page supports browsing, attachment downloads, logout and inbox-only uploads.
Public mode retains the public uploader and admin dashboard.

See ../VAULT.md for private-mode deployment and security boundaries.
