import path from "node:path";
import { dataDir, keepLegacy } from "./datadir.js";

// Paths anchor to backend/ so the server works from any cwd.
// Env overrides let Docker mount volumes and tests isolate into tmp dirs.
// All state (database, hosted files, logs) lives under DATA_DIR (ez standard).
// State at the pre-1.1 locations keeps being used until it is moved.
const ROOT = path.join(import.meta.dir, "..");
export const DATA_DIR = dataDir(ROOT);
export const PUBLIC_DIR =
	process.env.PUBLIC_DIR ||
	keepLegacy(path.join(DATA_DIR, "public"), [path.join(ROOT, "public")], { dir: true });
export const DIST_DIR = process.env.DIST_DIR || path.join(import.meta.dir, "../dist");
// Admin + session DB. Anchored like the dirs above so the cwd never decides
// which database (and which seeded admin) you get.
export const DB_PATH =
	process.env.EZHOST_DB ||
	keepLegacy(path.join(DATA_DIR, "ezhost.sqlite"), [
		path.join(ROOT, "data/ezhost.sqlite"),
		path.join(import.meta.dir, "ezhost.sqlite"),
	]);
export const LOG_DIR = path.join(DATA_DIR, "logs");

export const PORT = process.env.PORT === undefined ? 5000 : Number(process.env.PORT);
export const NODE_ENV = process.env.NODE_ENV || "development";

// Per-file upload cap (same 100MB ceiling the multer setup had).
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

// Rate limiting: 50 requests per minute per IP (same as before).
export const RATE_LIMIT = { limit: 50, windowMs: 60_000 };

// Uploads get a short cache life: they are re-uploaded under the SAME name
// (e.g. data.js), so a long max-age would serve stale data forever.
// Hashed dist/ assets can keep the long cache — see static plugin usage.
export const UPLOADS_MAX_AGE = 60; // seconds
export const DIST_MAX_AGE = 7 * 24 * 60 * 60; // seconds
