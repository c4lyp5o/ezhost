import { describe, expect, it } from "bun:test";
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
});
