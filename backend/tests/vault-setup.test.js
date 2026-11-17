import { test, expect } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { Database } from "bun:sqlite";
import * as OTPAuth from "otpauth";

test("private QR activates enrollment and login without confirmation, survives restart", async () => {
	const dir = mkdtempSync(path.join(process.env.TMPDIR || process.env.RUNNER_TEMP || process.cwd(), "enroll-"));
	const dbPath = path.join(dir, "vault.sqlite");
	const qr = path.join(dir, "qr.svg");
	const run = async (...args) => {
		const process = Bun.spawn([Bun.which("bun") || "/home/calypso/.bun/bin/bun", path.join(import.meta.dir, "../vault-setup.js"), ...args], { env: { ...Bun.env, EZHOST_DB: dbPath, VAULT_QR_PATH: qr }, stdout: "pipe", stderr: "pipe" });
		return { code: await process.exited, output: await new Response(process.stdout).text() };
	};
	try {
		// A failed exclusive QR write must never activate enrollment.
		const { writeFileSync, unlinkSync } = await import("node:fs");
		writeFileSync(qr, "existing private file");
		expect((await run()).code).not.toBe(0);
		const pending = new Database(dbPath);
		expect(pending.query("SELECT confirmed FROM enrollment").get().confirmed).toBe(0);
		pending.close();
		unlinkSync(qr);
		expect((await run()).code).toBe(0);
		expect(readFileSync(qr, "utf8")).toContain("<svg");
		expect(statSync(qr).mode & 0o777).toBe(0o600);
		const db = new Database(dbPath);
		const row = db.query("SELECT * FROM enrollment").get();
		expect(row.confirmed).toBe(1);
		const { createVault } = await import("../vault.js");
		const vault = createVault({ dbPath, root: dir, dist: dir, secure: false });
		const code = new OTPAuth.TOTP({ secret: row.secret }).generate();
		const response = await vault.app.handle(new Request("http://localhost/api/v1/vault/login", { method: "POST", headers: { Origin: "http://localhost", "Content-Type": "application/json" }, body: JSON.stringify({ code }) }));
		expect(response.status).toBe(200);
		vault.db.close();
		expect((await run()).output).not.toContain(row.secret);
		expect(db.query("SELECT confirmed FROM enrollment").get().confirmed).toBe(1);
		expect((await run()).code).not.toBe(0);
		db.close();
	} finally { rmSync(dir, { recursive: true, force: true }); }
});
