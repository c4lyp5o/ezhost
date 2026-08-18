import path from "node:path";
import { Elysia } from "elysia";
import staticPlugin from "@elysiajs/static";
import { logger } from "./logger";
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
			// API misses get JSON; everything else falls through to the SPA shell.
			if (new URL(request.url).pathname.startsWith("/api/")) {
				set.status = 404;
				return { success: false, message: "Not Found" };
			}

			// SPA fallback must be a fresh 200 Response — file() inside onError
			// keeps the error status (verified Elysia gotcha).
			return new Response(Bun.file(path.join(DIST_DIR, "index.html")), {
				status: 200,
				headers: { "Content-Type": "text/html" },
			});
		}

		set.status = 500;
		logger.error(`[SERVER] 💥 [${code}] ${error?.stack || error}`);
		return {
			success: false,
			message: NODE_ENV === "development" ? error.message : "Internal Server Error",
		};
	})

	// Uploaded files — short cache life because they're re-uploaded under the
	// same names (data.js etc). A long max-age would serve stale data.
	// alwaysStatic MUST be false here: true registers routes only for files
	// present at startup, so runtime uploads would 404 (SPA fallback instead).
	.use(
		staticPlugin({
			assets: PUBLIC_DIR,
			prefix: "/static/",
			alwaysStatic: false,
			maxAge: UPLOADS_MAX_AGE,
		}),
	)

	.use(HealthRoute)

	// Healthcheck is loopback-only so only the Docker healthcheck can hit it.
	.guard((api) => api.onBeforeHandle(localOnlyGuard).use(HealthRoute))

	// File listing + upload are public but rate-limited per IP.
	.guard((api) => api.onBeforeHandle(rateLimitHandler(RATE_LIMIT)).use(FilesRoutes))

	// Built client assets — hashed names, safe to cache for a week.
	.use(
		staticPlugin({
			assets: DIST_DIR,
			prefix: "/",
			indexHTML: true,
			alwaysStatic: true,
			maxAge: DIST_MAX_AGE,
		}),
	);

try {
	app.listen(PORT);
	logger.info(
		`[SERVER] 🚀 ezhost is running on port ${PORT} | mode: ${NODE_ENV}`,
	);
} catch (err) {
	logger.error(`[SERVER] Failed to start: ${err.message}`);
	process.exit(1);
}
