import { test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createVault } from "../vault";
import { saveInboxUpload } from "../services/vault-upload";

test("authenticated inbox upload roundtrip, collisions, CSRF and path isolation", async () => {
	const dir = mkdtempSync(path.join(process.env.TMPDIR || process.env.RUNNER_TEMP || process.cwd(), "upload-"));
	const inbox = path.join(dir, "inbox"); mkdirSync(inbox);
	const vault = createVault({ dbPath: path.join(dir, "auth.db"), root: dir, inbox, dist: dir, secure: false });
	const token = "test-session";
	vault.db.query("INSERT INTO sessions VALUES (?,?)").run(createHash("sha256").update(token).digest("hex"), Date.now() + 60000);
	const server = vault.app.listen({ port: 0, hostname: "127.0.0.1" }).server;
	const base = server.url.origin;
	const upload = (name, { auth = true, origin = base, body = "hello inbox" } = {}) => fetch(base + "/api/v1/vault/upload?name=" + encodeURIComponent(name), { method: "POST", headers: { Origin: origin, ...(auth ? { Cookie: "vault=" + token } : {}), "Content-Type": "application/octet-stream" }, body });
	try {
		expect((await upload("unauthorized", { auth: false })).status).toBe(401);
		expect(readdirSync(inbox)).toEqual([]);
		expect((await upload("csrf", { origin: "https://evil.example" })).status).toBe(403);
		expect((await upload("report.txt")).status).toBe(201);
		expect(readFileSync(path.join(inbox, "report.txt"), "utf8")).toBe("hello inbox");
		expect((await upload("report.txt", { body: "replacement" })).status).toBe(409);
		expect(readFileSync(path.join(inbox, "report.txt"), "utf8")).toBe("hello inbox");
		for (const name of ["../outside", "/absolute", "nested/file", "back\\slash", ".hidden", " bad", "bad\nfile"]) expect((await upload(name)).status).toBe(400);
		symlinkSync(path.join(dir, "outside"), path.join(inbox, "link"));
		expect((await upload("link")).status).toBe(409);
		const download = await fetch(base + "/api/v1/vault/download?path=inbox/report.txt", { headers: { Cookie: "vault=" + token } });
		expect(await download.text()).toBe("hello inbox");
		expect(download.headers.get("content-disposition")).toContain("attachment");
		const save = (name, request) => saveInboxUpload({ name, request, inbox, limit: 3 });
		expect((await save("big", new Request(base, { method: "POST", body: "1234" }))).status).toBe(413);
		expect((await save("empty", new Request(base, { method: "POST", body: "" }))).status).toBe(400);
		const broken = new ReadableStream({ start(c) { c.enqueue(new Uint8Array([1])); c.error(new Error("disconnected")); } });
		await expect(save("broken", { body: broken, headers: new Headers() })).rejects.toThrow();
		expect(readdirSync(inbox).sort()).toEqual(["link", "report.txt"]);
	} finally { server.stop(true); vault.db.close(); rmSync(dir, { recursive: true, force: true }); }
});
