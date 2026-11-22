#!/bin/sh
# Release files attached to the GitHub Release by publish.yml on a vX.Y.Z tag:
# a runnable bundle (server source + built UI, no node_modules) and checksums.
# Usage: scripts/release-assets.sh vX.Y.Z   (writes release-assets/)
set -eu
VERSION="$1"
name="ezhost_${VERSION}"
out="release-assets/${name}"
mkdir -p "${out}/backend"
# Server source only. No node_modules (start.sh installs them), no tests and
# never a local sqlite DB.
cp -r backend/index.js backend/config.js backend/logger.js \
	backend/utils.js backend/package.json backend/bun.lock \
	backend/plugins backend/routes backend/services "${out}/backend/"
(cd frontend && bun install --frozen-lockfile && bun run build)
cp -r dist "${out}/dist"
mkdir -p "${out}/public" "${out}/logs" && cp public/HELLO.md "${out}/public/"
cp README.md "${out}/"
cat > "${out}/start.sh" <<'EOF'
#!/bin/sh
# First run: set ADMIN_PASSWORD (only read when the DB is empty).
#   ADMIN_PASSWORD=change-me ./start.sh
set -e
cd "$(dirname "$0")/backend"
bun install --production
NODE_ENV=production exec bun index.js
EOF
chmod +x "${out}/start.sh"
tar -C release-assets -czf "release-assets/${name}.tar.gz" "${name}"
(cd release-assets && python3 -m zipfile -c "${name}.zip" "${name}")
rm -r "${out}"
(cd release-assets && sha256sum ./*.tar.gz ./*.zip > SHA256SUMS)
