import { Elysia } from "elysia";
import { logger } from "./logger";
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { staticPlugin } from "@elysiajs/static";
import {
    DIST_DIR,
    DIST_MAX_AGE,
    NODE_ENV,
    PORT,
    PUBLIC_DIR,
    RATE_LIMIT,
    UPLOADS_MAX_AGE,
} from "./config";
import { HttpError, isInside } from "./utils";
import { rateLimitHandler } from "./plugins/rate-limit.plugin";
import { localOnlyGuard } from "./plugins/local-only.plugin";
import { HealthRoute } from "./routes/health.route";
import { FilesRoutes } from "./routes/files.route";
import {
    createSession,
    deleteSession,
    initDB,
    SESSION_TTL_MS,
    verifyAdmin,
} from "./services/admin";
import { authPlugin } from "./plugins/auth.plugin";

// Content types for /static uploads — deterministic MIME instead of relying on
// the static plugin's map (which 404'd files it couldn't type).
const MIME_BY_EXT = {
    ".html": "text/html; charset=utf-8",
    ".htm": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".csv": "text/csv; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".ico": "image/x-icon",
    ".pdf": "application/pdf",
    ".zip": "application/zip",
    ".gz": "application/gzip",
    ".tar": "application/x-tar",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".wasm": "application/wasm",
};

const UPLOADS_CSP =
    "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads";

// Initialize the database and create admin if needed.
// Must be awaited BEFORE the server handles its first request, or the admin
// seed can still be writing when a request verifies credentials.
await initDB();

// The SPA (built React app) is served from dist/. Every client-side route that
// isn't a real file (/login, /app/*, etc.) must return index.html so React
// Router can take over. Load it once up front (guarded: in dev the vite server
// on :3000 serves the app, so dist/ may not exist and we fall back to 404).
let SPA_INDEX = null;
{
    const spaIndexPath = path.join(DIST_DIR, "index.html");
    if (existsSync(spaIndexPath)) {
        SPA_INDEX = readFileSync(spaIndexPath, "utf8");
    }
}

// Login: shared by POST /api/v1/admin/login and the legacy POST /login.
const loginHandler = async ({ body, set, cookie: { auth } }) => {
    const { password } = body ?? {};
    const isValid = typeof password === "string" && (await verifyAdmin("admin", password));
    if (!isValid) {
        set.status = 401;
        return { success: false, message: "Invalid password" };
    }
    // Cookie-flag helper: Secure is forced ON in production so the auth
    // cookie is never sent over plaintext HTTP, but MUST be off in dev
    // (the vite server on :3000 talks to the backend over http://localhost).
    const secureCookie = NODE_ENV === "production";
    auth.set({
        value: createSession(),
        httpOnly: true,
        secure: secureCookie,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL_MS / 1000
    });
    return { success: true };
};

export const app = new Elysia()
    .onError(({ code, error, set, request }) => {
        if (error instanceof HttpError) {
            set.status = error.status;
            return { success: false, message: error.message };
        }

        if (code === "VALIDATION") {
            NODE_ENV === "development" && logger.error(error);
            set.status = 400;
            return { success: false, message: "Bad request" };
        }

        if (code === "NOT_FOUND") {
            // Thrown by @elysiajs/static for an unknown path under a static
            // prefix. For /api and /static (uploads) it's a real 404; anything
            // else is a client-side route and should get the SPA shell.
            const reqPath = new URL(request.url).pathname;
            const isApi = reqPath.startsWith("/api/");
            const isUpload = reqPath.startsWith("/static/");
            if (!isApi && !isUpload && SPA_INDEX) {
                return new Response(SPA_INDEX, {
                    headers: { "Content-Type": "text/html" },
                });
            }
            set.status = 404;
            return { success: false, message: "Not Found" };
        }

        throw error;
    })
    // Rate limit first (onRequest), so throttled requests never reach cookie
    // parsing, session lookup or a handler. Returning a value short-circuits.
    .onRequest(rateLimitHandler(RATE_LIMIT))
    .onRequest(({ request }) => {
        const url = new URL(request.url);
        // At startup Elysia pre-runs these hooks against a synthetic
        // http://ely.sia/... request to precompute static routes (dist/ via
        // alwaysStatic). Those aren't real traffic, so don't log them.
        if (url.hostname === "ely.sia") return;
        logger.info(`${request.method} ${url.pathname}${url.search}`);
    })
    .use(authPlugin)
    .guard((api) => api.onBeforeHandle(localOnlyGuard).use(HealthRoute))
    .use(FilesRoutes)
    // Admin session — lets the SPA ask "am I logged in?" without reading the
    // httpOnly cookie (which JS can't touch). The real enforcement stays on
    // each admin API route via the auth plugin.
    .get("/api/v1/admin/session", ({ isAdmin }) => ({ isAdmin }))
    // Login: verify the password, set the httpOnly cookie, return JSON. The SPA
    // (not a server redirect) decides where to navigate next. Lives under /api
    // so the vite dev proxy reaches it; POST /login is kept as an alias.
    .post("/api/v1/admin/login", loginHandler)
    .post("/login", loginHandler)
    // Logout: revoke the session server-side, then clear the cookie.
    .post("/api/v1/admin/logout", ({ set, cookie: { auth } }) => {
        deleteSession(auth?.value);
        auth.set({
            value: "",
            httpOnly: true,
            secure: NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0
        });
        return { success: true };
    })
    // The built SPA at the root. indexHTML:true maps /index.html → / and /app
    // asset paths map under their full /assets/... names in dist/. In prod
    // (alwaysStatic) every file becomes an exact route; client-side routes
    // that aren't real files fall through to the catch-all below.
    // Options mirror the proven ezjot/ezmail recipe — prefix "/" + indexHTML
    // + alwaysStatic are required for hashed dist/ assets to be served at all.
    .use(staticPlugin({
        assets: DIST_DIR,
        prefix: "/",
        indexHTML: true,
        alwaysStatic: true,
        maxAge: DIST_MAX_AGE,
    }))
    // Serve uploaded files (public/) under /static — where uploads point.
    // Hand-rolled (not staticPlugin): deterministic MIME, traversal-guarded,
    // and a deleted/missing file returns a clean 404 instead of throwing
    // ENOENT through the plugin and killing the whole process.
    .get("/static/*", ({ params, set }) => {
        const rel = (params["*"] || "").replace(/^\/+/, "");
        const root = path.resolve(PUBLIC_DIR);
        const target = path.resolve(root, rel);

        if (
            !rel ||
            !isInside(root, target) ||
            !existsSync(target) ||
            statSync(target).isDirectory()
        ) {
            set.status = 404;
            return { success: false, message: "Not Found" };
        }

        set.headers["Content-Type"] =
            MIME_BY_EXT[path.extname(target).toLowerCase()] ||
            "application/octet-stream";
        set.headers["Cache-Control"] = `public, max-age=${UPLOADS_MAX_AGE}`;
        // Uploads are public and may be HTML/JS. Sandbox them into an opaque
        // origin (no allow-same-origin) so an uploaded page opened by a
        // logged-in admin can't ride the session cookie against /api.
        // Scripts/forms still run; cookies/storage of this origin don't.
        set.headers["Content-Security-Policy"] = UPLOADS_CSP;
        set.headers["X-Content-Type-Options"] = "nosniff";
        return Bun.file(target);
    })
    .get("/*", ({ path }) => {
        // Mirrors the ezmail/ezjot fallback: never intercept API or file-like
        // paths (unmatched /api/* and missing assets return a real 404).
        if (path.startsWith("/api") || path.includes(".")) {
            return new Response(JSON.stringify({ success: false, message: "Not Found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }
        // SPA fallback — React Router handles the rest (/login, /app/*, ...).
        if (SPA_INDEX) {
            return new Response(SPA_INDEX, {
                headers: { "Content-Type": "text/html" },
            });
        }
        return new Response("Not found", { status: 404 });
    });

// Start the HTTP server. In production the Dockerfile runs `bun index.js`
// from backend/, so this is the real entry point — without .listen() the
// event loop has nothing to hold open and the process exits immediately.
// Guarded so importing `app` (tests) has no side effects.
if (import.meta.main) {
    app.listen({ port: PORT }, () => {
        logger.info(`[server] 🚀 ezhost listening on ${PORT}`);
    });
}

export { PORT };