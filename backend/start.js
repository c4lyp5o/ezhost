const mode = process.env.EZHOST_MODE || "public";
if (!["public", "vault"].includes(mode)) throw new Error("Invalid EZHOST_MODE");
if (mode === "public") {
	const { app, PORT } = await import("./index.js");
	app.listen({ port: PORT });
} else {
	const { logger } = await import("./logger.js");
	logger.info("[vault] Private QR file: " + (process.env.VAULT_QR_PATH || "/data/enroll.svg") + " (if retained after enrollment)");
	logger.info("[vault] Display existing QR privately: docker compose -f compose.vault.yml exec vault bun vault-setup.js --show");
	const { createVault } = await import("./vault.js");
	const { DB_PATH, PUBLIC_DIR, DIST_DIR, PORT } = await import("./config.js");
	createVault({ dbPath: DB_PATH, root: PUBLIC_DIR, dist: DIST_DIR, secure: process.env.NODE_ENV !== "development", trustedProxy: process.env.VAULT_TRUSTED_PROXY || "", origin: process.env.VAULT_ORIGIN || "", inbox: process.env.VAULT_INBOX || "" }).app.listen({ port: PORT, hostname: process.env.HOST || "127.0.0.1" });
}
