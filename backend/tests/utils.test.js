import { describe, expect, it } from "bun:test";
import { isInside } from "../utils.js";

describe("isInside", () => {
	it("accepts the root and paths under it", () => {
		expect(isInside("/app/public", "/app/public")).toBe(true);
		expect(isInside("/app/public", "/app/public/a/b.txt")).toBe(true);
	});

	it("rejects siblings sharing the root's prefix and escapes", () => {
		// startsWith("/app/public") would have accepted this one.
		expect(isInside("/app/public", "/app/public-backup/x")).toBe(false);
		expect(isInside("/app/public", "/app/public/../secret")).toBe(false);
		expect(isInside("/app/public", "/etc/passwd")).toBe(false);
	});
});
