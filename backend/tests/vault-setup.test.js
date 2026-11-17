import { test, expect } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { Database } from "bun:sqlite";
import * as OTPAuth from "otpauth";

test("private enrollment generates QR, confirms once, survives restart", async () => {
	const dir = mkdtempSync(path.join(process.env.TMPDIR || "/home/calypso/.hermes/cache/scratch", "enroll-"));
	const dbPath = path.join(dir, "vault.sqlite");
	const qr = path.join(dir, "qr.svg");
	const run = async (...args) => {
		const process = Bun.spawn([Bun.which("bun") || "/home/calypso/.bun/bin/bun", path.join(import.meta.dir, "../vault-setup.js"), ...args], { env: { ...Bun.env, EZHOST_DB: dbPath, VAULT_QR_PATH: qr }, stdout: "pipe", stderr: "pipe" });
		return { code: await process.exited, output: await new Response(process.stdout).text() };
	};
	try {
		expect((await run()).code).toBe(0);
		expect(readFileSync(qr, "utf8")).toContain("<svg");
		expect(statSync(qr).mode & 0o777).toBe(0o600);
		const db = new Database(dbPath);
		const row = db.query("SELECT * FROM enrollment").get();
		expect(row.confirmed).toBe(0);
		const code = new OTPAuth.TOTP({ secret: row.secret }).generate();
		const result = await run(code);
		expect(result.code).toBe(0);
		expect(result.output).not.toContain(row.secret);
		expect(db.query("SELECT confirmed FROM enrollment").get().confirmed).toBe(1);
		expect((await run()).code).not.toBe(0);
		db.close();
	} finally { rmSync(dir, { recursive: true, force: true }); }
});
