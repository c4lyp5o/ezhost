import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { app } from "../index.js";

describe("Health", () => {
	let port;

	beforeAll(async () => {
		// Real socket through the live listener → requestIP is 127.0.0.1.
		const server = await app.listen(0);
		port = server?.server?.port;
	});

	afterAll(() => {
		app.server?.stop(true);
	});

	it("allows loopback peers (Docker healthcheck path)", async () => {
		const res = await fetch(
			`http://127.0.0.1:${port}/api/v1/healthcheck`,
		);
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ message: "ok" });
	});

	it("denies non-loopback peers", async () => {
		// Direct handle() simulates a proxied/remote peer → guard blocks.
		const res = await app.handle(
			new Request("http://remote.example/api/v1/healthcheck"),
		);
		expect(res.status).toBe(403);
		const body = await res.json();
		expect(body.success).toBe(false);
	});
});

describe("SPA/static scope", () => {
	// Static serving runs through the live socket (@elysiajs/static doesn't
	// resolve prefix routes via app.handle once the app has listened). So
	// assert via a real fetch, exactly as production serves them.
	let port;

	beforeAll(async () => {
		const server = await app.listen(0);
		port = server?.server?.port;
	});

	afterAll(() => {
		app.server?.stop(true);
	});

	it("serves the client shell at the /app mount root", async () => {
		const res = await fetch(`http://127.0.0.1:${port}/app`);
		expect(res.status).toBe(200);
		expect(await res.text()).toContain('id="root"');
	});

	it("serves the SPA shell for unknown non-API paths (client-side routes)", async () => {
		const res = await fetch(`http://127.0.0.1:${port}/some/spa/route`);
		expect(res.status).toBe(200);
		expect(await res.text()).toContain('id="root"');
	});

	it("serves the SPA shell for unknown deep paths under /app", async () => {
		const res = await fetch(`http://127.0.0.1:${port}/app/some/spa/route`);
		expect(res.status).toBe(200);
		expect(await res.text()).toContain('id="root"');
	});

	it("returns JSON 404 for unknown API paths", async () => {
		const res = await fetch(
			`http://127.0.0.1:${port}/api/v1/this-does-not-exist`,
		);
		expect(res.status).toBe(404);
		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.message).toBe("Not Found");
	});
});