import { getClientIp } from "../utils";

const buckets = new Map();
const MAX_BUCKET_ENTRIES = 10000;

// Exported so tests can start from a clean slate.
export const resetRateLimitBuckets = () => buckets.clear();

// Simple in-memory sliding-window rate limiter (same design as eziarr).
// Buckets live in this process only; a restart resets them.
export const rateLimitHandler = ({ limit = 50, windowMs = 60000 } = {}) => {
	return ({ request, server, set }) => {
		const key = getClientIp(request, server);
		const now = Date.now();
		const windowStart = now - windowMs;

		const hits = (buckets.get(key) || []).filter((t) => t > windowStart);
		if (hits.length >= limit) {
			set.status = 429;
			return {
				success: false,
				message: "Too many requests. Try again later.",
			};
		}

		hits.push(now);
		buckets.set(key, hits);

		// Opportunistic cleanup so the map never grows unbounded.
		if (buckets.size > MAX_BUCKET_ENTRIES) {
			for (const [k, times] of buckets) {
				if (times.every((t) => t <= windowStart)) buckets.delete(k);
			}
		}
	};
};
