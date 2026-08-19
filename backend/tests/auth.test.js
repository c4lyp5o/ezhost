import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { app } from "../index.js";
import { Database } from "bun:sqlite";

// Regression test for two real bugs found in the live E2E audit:
//  1. login emitted NO Set-Cookie header (auth.set = {...} is a no-op; must
//     use auth.set({...}) — assignment vs method call).
//  2. httpOnly cookie is the session, so a successful login must actually set
//     it, and the session endpoint must flip isAdmin true with it held.
// setup.js runs NODE_ENV=test, so secure is OFF and the cookie round-trips
// over the plain-HTTP test socket.
describe("Auth", () => {
	let port;
	let adminPassword = "auth-test-secret-123";

	beforeAll(async () => {
		// setup.js preloads EZHOST_DB to a throwaway tmp sqlite, so seeding a
		// dedicated admin here never touches the real dev DB.
		const db = new Database(process.env.EZHOST_DB);
		db.run("DELETE FROM admins WHERE username = ?", "admin");
		const hash = await Bun.password.hash(adminPassword, { algorithm: "bcrypt" });
		db.run(
			"INSERT INTO admins (username, password) VALUES (?, ?)",
			"admin",
			hash,
		);
		db.close();

		const server = await app.listen(0);
		port = server?.server?.port;
	});

	afterAll(() => {
		app.server?.stop(true);
	});

	function session() {
		return fetch(`http://127.0.0.1:${port}/api/v1/admin/session`, {
			credentials: "include",
		});
	}

	it("rejects a wrong password with 401", async () => {
		const res = await fetch(`http://127.0.0.1:${port}/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ password: "nope" }),
		});
		expect(res.status).toBe(401);
		expect((await res.json()).success).toBe(false);
	});

	it("sets an httpOnly auth cookie on correct login", async () => {
		// Cookie must round-trip, so drive the fetch with a manual Request that
		// the listener response can Set-Cookie on, then read the header.
		const res = await app.handle(
			new Request(`http://127.0.0.1:${port}/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password: adminPassword }),
			}),
		);
		expect(res.status).toBe(200);
		const setCookie = res.headers.get("set-cookie") || "";
		expect(setCookie).toContain("HttpOnly");
		expect(setCookie).toMatch(/auth=/);
	});

	it("reports isAdmin=true for a session holding the auth cookie", async () => {
		const loginRes = await app.handle(
			new Request(`http://127.0.0.1:${port}/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password: adminPassword }),
			}),
		);
		const cookie = loginRes.headers.get("set-cookie").split(";")[0];

		const res = await app.handle(
			new Request(`http://127.0.0.1:${port}/api/v1/admin/session`, {
				headers: { cookie },
			}),
		);
		expect(res.status).toBe(200);
		expect((await res.json()).isAdmin).toBe(true);
	});

	it("guards admin deletes without the auth cookie (401)", async () => {
		const res = await app.handle(
			new Request(`http://127.0.0.1:${port}/api/v1/admin/files/x.txt`, {
				method: "DELETE",
			}),
		);
		expect(res.status).toBe(401);
	});

	it("clears the session after logout", async () => {
		const loginRes = await app.handle(
			new Request(`http://127.0.0.1:${port}/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password: adminPassword }),
			}),
		);
		const cookie = loginRes.headers.get("set-cookie").split(";")[0];

		const logoutRes = await app.handle(
			new Request(`http://127.0.0.1:${port}/api/v1/admin/logout`, {
				method: "POST",
				headers: { cookie },
			}),
		);
		expect(logoutRes.status).toBe(200);
		// A real browser overwrites its stored cookie with the response's
		// Set-Cookie (empty + Max-Age=0). Mirror that: keep the CLEARED cookie,
		// not the pre-logout one — the app can't revoke a cookie the client
		// refuses to discard.
		const clearedCookie =
			(logoutRes.headers.get("set-cookie") || "").split(";")[0];

		const sessionRes = await app.handle(
			new Request(`http://127.0.0.1:${port}/api/v1/admin/session`, {
				headers: { cookie: clearedCookie },
			}),
		);
		expect((await sessionRes.json()).isAdmin).toBe(false);
	});
});