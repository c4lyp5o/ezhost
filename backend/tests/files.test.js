import path from "node:path";
import { afterAll, describe, expect, it } from "bun:test";
import { app } from "../index.js";
import { PUBLIC_DIR } from "../config.js";

// Uploads are intentionally public (no auth) — see FilesRoutes.
const upload = (form) =>
	app.handle(
		new Request("http://localhost/api/v1/upload", {
			method: "POST",
			body: form,
		}),
	);

describe("Files API", () => {
	const seeded = "hello-ezhost";

	afterAll(() => {
		// Cleanup the throwaway public dir contents created by this file.
		for (const name of ["seed.txt", "note.txt", "page.html", "style.css", "app.js"]) {
			try {
				Bun.file(path.join(PUBLIC_DIR, name)).delete();
			} catch {}
		}
	});

	it("GET /api/v1/files lists uploaded files with metadata", async () => {
		await Bun.write(path.join(PUBLIC_DIR, "seed.txt"), seeded);

		const res = await app.handle(new Request("http://localhost/api/v1/files"));
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);

		const entry = body.files.find((f) => f.name === "seed.txt");
		expect(entry).toBeDefined();
		expect(entry.url).toBe("/static/seed.txt");
		expect(entry.size).toBe(seeded.length);
		expect(entry.isDirectory).toBe(false);
		expect(typeof entry.modified).toBe("string");
	});

	it("POST /api/v1/upload persists multipart files", async () => {
		const form = new FormData();
		form.append("files", new File(["uploaded-content"], "note.txt"));

		const res = await upload(form);
		expect(res.status).toBe(201);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.files).toHaveLength(1);
		expect(body.files[0].name).toBe("note.txt");
		expect(body.files[0].url).toBe("/static/note.txt");
		expect(body.files[0].size).toBe("uploaded-content".length);

		// Bytes actually landed in public/.
		expect(await Bun.file(path.join(PUBLIC_DIR, "note.txt")).text()).toBe(
			"uploaded-content",
		);
	});

	it("accepts HTML/CSS/JS uploads (content-type loosened by design)", async () => {
		for (const [name, content] of [
			["page.html", "<h1>hi</h1>"],
			["style.css", "body { color: red; }"],
			["app.js", "console.log('hi')"],
		]) {
			const form = new FormData();
			form.append("files", new File([content], name));
			const res = await upload(form);
			expect(res.status).toBe(201);
		}
	});

	it("still rejects ambiguous active markup and executables", async () => {
		for (const name of ["vector.svg", "doc.xml", "setup.exe", "run.sh"]) {
			const form = new FormData();
			form.append("files", new File(["x"], name));
			const res = await upload(form);
			expect(res.status).toBe(415);
		}
	});

	it("POST /api/v1/upload never escapes public/ with traversal names", async () => {
		// Hand-rolled raw multipart: bypasses FormData/File construction so the
		// string hits Bun's parser exactly as an attacker would send it.
		const raw =
			'--X\r\nContent-Disposition: form-data; name="files"; filename="../../evil.txt"\r\n' +
			"Content-Type: text/plain\r\n\r\nx\r\n--X--\r\n";

		const res = await app.handle(
			new Request("http://localhost/api/v1/upload", {
				method: "POST",
				headers: { "Content-Type": "multipart/form-data; boundary=X" },
				body: raw,
			}),
		);

		// Bun's parser basenames the filename (→ evil.txt, so 201); our own
		// safeBasename guard would 400 if it ever got a dirty name. Either way
		// the file must land inside public/ — never one level up.
		expect([201, 400]).toContain(res.status);
		expect(await Bun.file(path.join(PUBLIC_DIR, "../evil.txt")).exists()).toBe(
			false,
		);
	});

	it("POST /api/v1/upload rejects empty payloads", async () => {
		const res = await upload(new FormData());
		expect(res.status).toBe(400);
	});
});
