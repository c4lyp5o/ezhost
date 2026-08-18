import path from "node:path";

// Paths anchor to backend/ so the server works from any cwd.
// Env overrides let Docker mount volumes and tests isolate into tmp dirs.
export const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(import.meta.dir, "../public");
export const DIST_DIR = process.env.DIST_DIR || path.join(import.meta.dir, "../dist");

export const PORT = Number(process.env.PORT) || 5000;
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
