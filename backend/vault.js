import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import { randomBytes, createHash } from "node:crypto";
import { chmodSync, lstatSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import * as OTPAuth from "otpauth";
import { saveInboxUpload } from "./services/vault-upload";

export function createVault({ dbPath, root, dist, secure = true, trustedProxy = "", origin = "", inbox = "" }) {
	const db = new Database(dbPath, { create: true });
	if (dbPath !== ":memory:") chmodSync(dbPath, 0o600);
	db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS enrollment (id INTEGER PRIMARY KEY, secret TEXT NOT NULL, confirmed INTEGER DEFAULT 0, lastStep INTEGER DEFAULT -1); CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, expires INTEGER); CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY, count INTEGER, until INTEGER);");
	const hash = (s) => createHash("sha256").update(s).digest("hex");
	const otp = (secret) => new OTPAuth.TOTP({ issuer: "ezhost", label: "Our Vault", algorithm: "SHA1", digits: 6, period: 30, secret });
	function verify(code) {
		if (!/^\d{6}$/.test(code || "")) return false;
		const row = db.query("SELECT * FROM enrollment WHERE id=1 AND confirmed=1").get();
		if (!row) return false;
		const delta = otp(row.secret).validate({ token: code, window: 1 });
		if (delta === null) return false;
		const step = Math.floor(Date.now() / 30000) + delta;
		return db.query("UPDATE enrollment SET lastStep=? WHERE id=1 AND lastStep<?").run(step, step).changes === 1;
	}
	function allowed(key, limit) {
		const now = Date.now();
		db.query("DELETE FROM attempts WHERE until<?").run(now);
		const row = db.query("SELECT * FROM attempts WHERE key=?").get(key);
		if (row && row.count >= limit) return false;
		db.query("INSERT INTO attempts VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1").run(key, now + 300000);
		return true;
	}
	function resolve(rel = "") {
		if (typeof rel !== "string" || rel.includes("\0")) throw new Error("Invalid path");
		const base = realpathSync(root);
		const target = path.resolve(base, rel);
		if (target !== base && !target.startsWith(base + path.sep)) throw new Error("Invalid path");
		let current = base;
		for (const part of path.relative(base, target).split(path.sep).filter(Boolean)) {
			current = path.join(current, part);
			if (lstatSync(current).isSymbolicLink()) throw new Error("Invalid path");
		}
		return target;
	}
	const app = new Elysia()
		.onError(({ set }) => { set.status = 404; return { success: false, message: "Not found" }; })
		.onRequest(({ set }) => {
			set.headers["Cache-Control"] = "no-store";
			set.headers["X-Content-Type-Options"] = "nosniff";
			set.headers["Referrer-Policy"] = "no-referrer";
			set.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
		})
		.onBeforeHandle(({ request, server, cookie, set }) => {
			const url = new URL(request.url);
			if (request.method !== "GET" && request.headers.get("origin") !== (origin || url.origin)) {
				set.status = 403; return { success: false };
			}
			if (url.pathname === "/api/v1/vault/login") {
				const peer = server?.requestIP(request)?.address || "unknown";
				const ip = trustedProxy && peer === trustedProxy ? request.headers.get("x-real-ip") || peer : peer;
				if (!allowed("global", 30) || !allowed(hash(ip), 5)) { set.status = 429; set.headers["Retry-After"] = "300"; return { success: false }; }
			}
			if (url.pathname.startsWith("/api/") && !["/api/v1/vault/login", "/api/v1/vault/status", "/api/v1/healthcheck"].includes(url.pathname)) {
				const token = cookie.vault?.value;
				if (typeof token !== "string" || !db.query("SELECT 1 FROM sessions WHERE hash=? AND expires>?").get(hash(token), Date.now())) {
					set.status = 401; return { success: false };
				}
			}
		})
		.get("/api/v1/healthcheck", () => ({ success: true }))
		.get("/api/v1/vault/status", () => ({ mode: "vault" }))
		.post("/api/v1/vault/login", ({ body, cookie, set }) => {
			if (!verify(body?.code)) { set.status = 401; return { success: false, message: "Invalid or already used code" }; }
			const token = randomBytes(32).toString("hex");
			db.query("DELETE FROM sessions WHERE expires<?").run(Date.now());
			db.query("INSERT INTO sessions VALUES (?,?)").run(hash(token), Date.now() + 1800000);
			cookie.vault.set({ value: token, httpOnly: true, secure, sameSite: "strict", path: "/", maxAge: 1800 });
			return { success: true };
		})
		.post("/api/v1/vault/logout", ({ cookie }) => {
			if (typeof cookie.vault?.value === "string") db.query("DELETE FROM sessions WHERE hash=?").run(hash(cookie.vault.value));
			cookie.vault.remove(); return { success: true };
		})
		.post("/api/v1/vault/upload", async ({ request, query, set }) => {
			const result = await saveInboxUpload({ request, name: query.name, inbox });
			set.status = result.status;
			return { success: result.status === 201, ...result };
		}, { parse: "none", detail: { summary: "Upload to private inbox", description: "Authenticated, exclusive-create upload; 100 MiB maximum.", tags: ["Vault"] } })
		.get("/api/v1/vault/files", ({ query }) => {
			const dir = resolve(query.path);
			return { files: readdirSync(dir, { withFileTypes: true }).filter((e) => !e.isSymbolicLink() && (e.isDirectory() || e.isFile())).map((e) => ({ name: e.name, isDirectory: e.isDirectory() })) };
		})
		.get("/api/v1/vault/download", ({ query, set }) => {
			const file = resolve(query.path);
			if (!lstatSync(file).isFile()) { set.status = 404; return { success: false }; }
			set.headers["Content-Disposition"] = "attachment; filename*=UTF-8''" + encodeURIComponent(path.basename(file));
			set.headers["Content-Type"] = "application/octet-stream";
			return Bun.file(file);
		})
		.get("/*", ({ path: requested, set }) => {
			if (requested.startsWith("/api/") || requested.startsWith("/static/")) { set.status = 404; return "Not found"; }
			if (requested.startsWith("/assets/") && !requested.includes("..")) {
				const asset = path.join(dist, requested);
				return Bun.file(asset);
			}
			return Bun.file(path.join(dist, "index.html"));
		});
	return { app, db, otp };
}
