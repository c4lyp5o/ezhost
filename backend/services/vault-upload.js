import { open, unlink } from "node:fs/promises";
import { lstatSync, realpathSync } from "node:fs";
import path from "node:path";

export const MAX_INBOX_BYTES = 100 * 1024 * 1024;

export async function saveInboxUpload({ request, name, inbox, limit = MAX_INBOX_BYTES }) {
	if (!inbox) return { status: 503, message: "Inbox is not configured" };
	// biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting control characters in file names is the point
	if (typeof name !== "string" || !name || name.startsWith(".") || /[\\/\x00-\x1f\x7f]/.test(name) || Buffer.byteLength(name) > 200 || name.trim() !== name) {
		return { status: 400, message: "Use a plain filename (no paths or hidden files)" };
	}
	if (!request.body) return { status: 400, message: "Empty upload" };
	const length = request.headers.get("content-length");
	if (length && (!/^\d+$/.test(length) || Number(length) > limit)) return { status: 413, message: "Maximum file size is 100 MiB" };
	if (lstatSync(inbox).isSymbolicLink() || !lstatSync(inbox).isDirectory()) throw new Error("Invalid inbox");
	const target = path.join(realpathSync(inbox), name);
	let handle;
	try { handle = await open(target, "wx", 0o600); }
	catch (error) {
		if (error.code === "EEXIST") return { status: 409, message: "That filename already exists" };
		throw error;
	}
	let complete = false;
	let reader;
	try {
		let size = 0;
		reader = request.body.getReader();
		while (true) {
			const { done, value: chunk } = await reader.read();
			if (done) break;
			size += chunk.byteLength;
			if (size > limit) return { status: 413, message: "Maximum file size is 100 MiB" };
			let offset = 0;
			while (offset < chunk.byteLength) {
				const { bytesWritten } = await handle.write(chunk, offset, chunk.byteLength - offset);
				offset += bytesWritten;
			}
		}
		if (!size) return { status: 400, message: "Empty upload" };
		complete = true;
		return { status: 201, name, size };
	} finally {
		if (reader && !complete) {
			try { await reader.cancel(); } catch { /* Disconnected streams already failed. */ }
		}
		await handle.close();
		if (!complete) await unlink(target);
	}
}
