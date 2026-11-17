import { test, expect } from "bun:test";
import { mkdtempSync, writeFileSync, mkdirSync, symlinkSync, rmSync } from "node:fs";
import path from "node:path";
import { createVault } from "../vault";
import * as OTPAuth from "otpauth";

test("vault HTTP boundaries, replay, persistence and throttling", async () => {
	const dir = mkdtempSync(path.join(process.env.TMPDIR || process.env.RUNNER_TEMP || process.cwd(), "vault-"));
	const root = path.join(dir, "files"); mkdirSync(root);
	writeFileSync(path.join(root, "private.txt"), "private payload");
	writeFileSync(path.join(dir, "outside"), "outside");
	symlinkSync(path.join(dir, "outside"), path.join(root, "escape"));
	let vault = createVault({ dbPath: path.join(dir, "auth.sqlite"), root, dist: dir, secure: false });
	const secret = new OTPAuth.Secret({ size: 20 }).base32;
	vault.db.query("INSERT INTO enrollment(id,secret,confirmed) VALUES(1,?,1)").run(secret);
	let server = vault.app.listen({ port: 0, hostname: "127.0.0.1" }).server;
	let base = server.url.origin;
	const request = (url, options = {}) => fetch(base + url, options);
	let cookie;
	try {
		expect((await request("/api/v1/vault/files")).status).toBe(401);
		expect((await request("/api/v1/vault/download?path=private.txt")).status).toBe(401);
		expect((await request("/static/private.txt")).status).toBe(404);
		expect((await request("/api/v1/upload", { method: "POST", headers: { Origin: base } })).status).toBe(404);
		const code = vault.otp(secret).generate();
		const login = () => request("/api/v1/vault/login", { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
		const response = await login(); expect(response.status).toBe(200);
		cookie = response.headers.get("set-cookie").split(";")[0];
		expect((await login()).status).toBe(401);
		const auth = { headers: { Cookie: cookie } };
		expect((await (await request("/api/v1/vault/files", auth)).json()).files.map((f) => f.name)).toEqual(["private.txt"]);
		expect(await (await request("/api/v1/vault/download?path=private.txt", auth)).text()).toBe("private payload");
		expect((await request("/api/v1/vault/download?path=escape", auth)).status).toBe(404);
		expect((await request("/api/v1/vault/download?path=../outside", auth)).status).toBe(404);
		for (let i=0;i<4;i++) await login();
		expect((await login()).status).toBe(429);
		server.stop(true); vault.db.close();
		vault = createVault({ dbPath: path.join(dir, "auth.sqlite"), root, dist: dir, secure: false });
		server = vault.app.listen({ port: 0, hostname: "127.0.0.1" }).server; base = server.url.origin;
		expect((await login()).status).toBe(429);
		expect((await request("/api/v1/vault/files", auth)).status).toBe(200);
		expect((await request("/api/v1/vault/logout", { method: "POST", headers: { Origin: base, Cookie: cookie } })).status).toBe(200);
		expect((await request("/api/v1/vault/files", auth)).status).toBe(401);
	} finally { server.stop(true); vault.db.close(); rmSync(dir, { recursive: true, force: true }); }
});
