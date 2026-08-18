import fs from "node:fs";
import path from "node:path";
import { MAX_UPLOAD_BYTES, PUBLIC_DIR } from "../config";
import { logger } from "../logger";
import { HttpError, safeBasename } from "../utils";

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
};
