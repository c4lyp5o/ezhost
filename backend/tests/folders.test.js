import { describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { PUBLIC_DIR } from "../config.js";
import { FilesService } from "../services/files.service.js";

describe("folders", () => {
	it("creates a single-level folder, tolerating slashes", () => {
		expect(FilesService.createDir("/docs/").path).toBe("docs");
		expect(fs.statSync(path.join(PUBLIC_DIR, "docs")).isDirectory()).toBe(true);
	});

	it("rejects nested folders (they'd be invisible in the flat listing)", () => {
		expect(() => FilesService.createDir("docs/2026")).toThrow(/nested/);
	});

	it("deletes an empty folder but refuses a non-empty one", () => {
		FilesService.createDir("full");
		fs.writeFileSync(path.join(PUBLIC_DIR, "full", "x.txt"), "x");
		expect(() => FilesService.deleteFile("full")).toThrow(/isn't empty/);

		FilesService.createDir("empty");
		expect(FilesService.deleteFile("empty").success).toBe(true);
		expect(fs.existsSync(path.join(PUBLIC_DIR, "empty"))).toBe(false);
	});
});
