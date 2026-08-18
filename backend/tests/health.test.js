import { describe, expect, it } from "bun:test";
import { app } from "../index.js";

describe("Health", () => {
	it("allows loopback peers (Docker healthcheck path)", async () => {
		// Real socket through the live listener → requestIP is 127.0.0.1.
		const res = await fetch(
			`http://127.0.0.1:${app.server.port}/api/v1/healthcheck`,
		);
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ message: "ok" });
	});

	it("denies non-loopback peers", async () => {
		// app.handle has no socket peer → guard sees an unknown IP → 403.
		const res = await app.handle(
			new Request("http://localhost/api/v1/healthcheck"),
		);
		expect(res.status).toBe(403);
		const body = await res.json();
		expect(body.success).toBe(false);
	});
});

describe("SPA fallback", () => {
	it("serves the client shell for unknown non-API paths", async () => {
		const res = await app.handle(
			new Request("http://localhost/some/spa/route"),
		);
		expect(res.status).toBe(200);
		expect(await res.text()).toContain('<div id="root">');
	});

	it("returns JSON 404 for unknown API paths", async () => {
		const res = await app.handle(
			new Request("http://localhost/api/v1/this-does-not-exist"),
		);
		expect(res.status).toBe(404);
		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.message).toBe("Not Found");
	});
});
