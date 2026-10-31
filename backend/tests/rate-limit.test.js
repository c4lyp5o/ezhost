import { describe, expect, it } from "bun:test";
import { app } from "../index.js";
import { RATE_LIMIT } from "../config.js";
import {
	rateLimitHandler,
	resetRateLimitBuckets,
} from "../plugins/rate-limit.plugin.js";

// No server/socket in these unit tests → key collapses to "unknown".
const makeCtx = () => ({
	request: new Request("http://localhost/"),
	server: null,
	set: { status: 0 },
});

describe("rate limit", () => {
	it("blocks once the window limit is reached", () => {
		resetRateLimitBuckets();

		const handler = rateLimitHandler({ limit: 2, windowMs: 60_000 });
		handler(makeCtx());
		handler(makeCtx());

		const third = makeCtx();
		const out = handler(third);
		expect(third.set.status).toBe(429);
		expect(out.success).toBe(false);
	});

	it("resets after the window expires", () => {
		resetRateLimitBuckets();

		const handler = rateLimitHandler({ limit: 1, windowMs: 1 });
		handler(makeCtx());

		// 5ms sleep > 1ms window → bucket expired.
		return new Promise((resolve) => setTimeout(resolve, 5)).then(() => {
			const next = makeCtx();
			const out = handler(next);
			expect(next.set.status).toBe(0);
			expect(out).toBeUndefined();
		});
	});

	// Drives the real app — the old unit tests stayed green while the app
	// had no limiter wired at all.
	it("app returns 429 after the configured limit", async () => {
		resetRateLimitBuckets();
		const statuses = [];
		for (let i = 0; i <= RATE_LIMIT.limit; i++) {
			const res = await app.handle(new Request("http://localhost/api/v1/files"));
			statuses.push(res.status);
		}
		expect(statuses.slice(0, RATE_LIMIT.limit).every((s) => s !== 429)).toBe(true);
		expect(statuses.at(-1)).toBe(429);
	});

	it("app rate-limits failed logins", async () => {
		resetRateLimitBuckets();
		let last;
		for (let i = 0; i <= RATE_LIMIT.limit; i++) {
			last = await app.handle(
				new Request("http://localhost/login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ password: "wrong" }),
				}),
			);
		}
		expect(last.status).toBe(429);
	});
});
