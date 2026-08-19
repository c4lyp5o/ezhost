import { Elysia } from "elysia";
import { logger } from "./logger";
import { readFileSync, existsSync } from "node:fs";
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
import { HttpError } from "./utils";
import { rateLimitHandler } from "./plugins/rate-limit.plugin";
import { localOnlyGuard } from "./plugins/local-only.plugin";
import { HealthRoute } from "./routes/health.route";
import { FilesRoutes } from "./routes/files.route";
import { initDB, verifyAdmin } from "./services/admin";
import { authPlugin } from "./plugins/auth.plugin";

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
    .use(authPlugin)
    .derive({ as: "global" }, ({ request, set }) => {
        if (RATE_LIMIT > 0) {
            rateLimitHandler(request, set);
        }
        logger.info(`${request.method} ${request.url}`);
    })
    .guard((api) => api.onBeforeHandle(localOnlyGuard).use(HealthRoute))
    .use(FilesRoutes)
    // Admin session — lets the SPA ask "am I logged in?" without reading the
    // httpOnly cookie (which JS can't touch). The real enforcement stays on
    // each admin API route via the auth plugin.
    .get("/api/v1/admin/session", ({ isAdmin }) => ({ isAdmin }))
    // Login: verify the password, set the httpOnly cookie, return JSON. The SPA
    // (not a server redirect) decides where to navigate next.
    .post("/login", async ({ body, set, cookie: { auth } }) => {
        const { password } = body;
        const isValid = await verifyAdmin("admin", password);
        if (!isValid) {
            set.status = 401;
            return { success: false, message: "Invalid password" };
        }
        // Cookie-flag helper: Secure is forced ON in production so the auth
        // cookie is never sent over plaintext HTTP, but MUST be off in dev
        // (the vite server on :3000 talks to the backend over http://localhost).
        const secureCookie = NODE_ENV === "production";
        auth.set({
            value: password,
            httpOnly: true,
            secure: secureCookie,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24
        });
        return { success: true };
    })
    // Logout: clear the auth cookie (replace with a dead value).
    .post("/api/v1/admin/logout", ({ set, cookie: { auth } }) => {
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
    .use(staticPlugin({
        assets: DIST_DIR,
        maxAge: DIST_MAX_AGE,
    }))
    // Serve uploaded files (public/) under /static — where uploads point.
    // Short cache life because files are re-uploaded under the same name.
    .use(staticPlugin({
        assets: PUBLIC_DIR,
        prefix: "/static",
        maxAge: UPLOADS_MAX_AGE,
    }))
    .get("/*", ({ path }) => {
        if (path.startsWith("/api/")) {
            // Unknown API endpoint → consistent JSON 404 for API consumers.
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
app.listen({ port: PORT }, () => {
    logger.info(`[server] 🚀 ezhost listening on ${PORT}`);
});

export { PORT };