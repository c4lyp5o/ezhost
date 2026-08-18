import fs from "node:fs";
import path from "node:path";
import { MAX_UPLOAD_BYTES, PUBLIC_DIR } from "../config";
import { logger } from "../logger";
import { HttpError, safeBasename } from "../utils";

// Blocked extensions: uploading active content (HTML/SVG/JS/XML) would let a
// public uploader serve script that runs same-origin (stored XSS). Everything
// else is fair game for a file host.
const DISALLOWED_EXT = new Set([
	"html", "htm", "xhtml", "shtml", // markup that executes scripts
	"svg", // inlines scripts / event handlers
	"js", "mjs", "cjs", // scripts
	"xml", "xsl", // XXE / stylesheet tricks in some browsers
	"hta", "exe", "pif", "scr", "bat", "cmd", "ps1", "sh", // executable
]);

export const FilesService = {
	// List every file in public/ with the metadata the client renders.
	// Sync reads keep this trivial and race-free; the dir is small.
	listFiles: () => {
		const files = fs.readdirSync(PUBLIC_DIR).map((name) => {
			const stats = fs.statSync(path.join(PUBLIC_DIR, name));
			return {
				name,
				isDirectory: stats.isDirectory(),
				size: stats.size,
				// ISO string — Elysia's response schema (t.String) rejects Date.
				modified: stats.mtime.toISOString(),
				url: `/static/${name}`,
			};
		});

		return { success: true, files };
	},

	// Persist uploaded files into public/. All-or-nothing: any invalid file
	// rejects the whole request so the dir never ends up half-written.
	saveUploads: async (files) => {
		if (!files || files.length === 0) {
			throw new HttpError(400, "No files uploaded");
		}

		const tooLarge = files.find((file) => file.size > MAX_UPLOAD_BYTES);
		if (tooLarge) {
			throw new HttpError(413, `File "${tooLarge.name}" exceeds the 100MB limit`);
		}

		// Validate every name up front, then write — sanitized basenames only.
		const entries = files.map((file) => {
			const name = safeBasename(file.name);
			if (!name) {
				throw new HttpError(400, `Invalid file name: "${file.name}"`);
			}
			const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
			if (DISALLOWED_EXT.has(ext)) {
				throw new HttpError(
					415,
					`File type ".${ext}" is not allowed for security reasons`,
				);
			}
			return { name, file };
		});

		const saved = [];
		for (const { name, file } of entries) {
			const buffer = Buffer.from(await file.arrayBuffer());
			await Bun.write(path.join(PUBLIC_DIR, name), buffer);
			saved.push({ name, url: `/static/${name}`, size: buffer.length });
			logger.info(`[files] 📤 uploaded ${name} (${buffer.length} bytes)`);
		}

		return {
			success: true,
			message: `${saved.length} file(s) uploaded successfully`,
			files: saved,
		};
	},

	// Delete a file from public/. name is already sanitized by safeBasename;
	// the resolved path is re-joined and verified to stay inside PUBLIC_DIR.
	deleteFile: (name) => {
		const base = safeBasename(name);
		if (!base) {
			throw new HttpError(400, `Invalid file name: "${name}"`);
		}
		const target = path.resolve(PUBLIC_DIR, base);
		if (!target.startsWith(path.resolve(PUBLIC_DIR))) {
			throw new HttpError(400, "Invalid file path");
		}
		if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
			throw new HttpError(404, `File "${base}" not found`);
		}
		fs.unlinkSync(target);
		logger.info(`[files] 🗑️ deleted ${base}`);
		return { success: true, message: `Deleted "${base}"` };
	},

	// Create a directory inside public/. Accepts a "/"-joined path; each segment
	// is sanitized with safeBasename so "../" cannot escape PUBLIC_DIR.
	createDir: (dirPath = "") => {
		const segments = String(dirPath)
			.split(/[/\\]+/)
			.map(safeBasename)
			.filter(Boolean);
		if (segments.length === 0) {
			throw new HttpError(400, `Invalid folder path: "${dirPath}"`);
		}
		const target = path.resolve(PUBLIC_DIR, ...segments);
		if (!target.startsWith(path.resolve(PUBLIC_DIR))) {
			throw new HttpError(400, "Invalid folder path");
		}
		fs.mkdirSync(target, { recursive: true });
		logger.info(`[files] 📁 created dir ${path.relative(PUBLIC_DIR, target)}`);
		return { success: true, message: `Created folder`, path: segments.join("/") };
	},
};
