import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Isolate every test run: random port (no clashes between parallel test
// files), throwaway upload + dist dirs (never touches real data).
process.env.PORT = "0";
process.env.NODE_ENV = "test";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ezhost-test-"));
process.env.PUBLIC_DIR = path.join(tmp, "public");
process.env.DIST_DIR = path.join(tmp, "dist");
// Isolate the admin DB too, so `bun test` never reads or rewrites the real
// dev ./ezhost.sqlite (auth tests seed their own throwaway admin here).
process.env.EZHOST_DB = path.join(tmp, "ezhost.sqlite");

fs.mkdirSync(process.env.PUBLIC_DIR, { recursive: true });
fs.mkdirSync(process.env.DIST_DIR, { recursive: true });
// Fake SPA shell so the fallback route can be exercised in tests.
fs.writeFileSync(
	path.join(process.env.DIST_DIR, "index.html"),
	'<!DOCTYPE html><html><body><div id="root"></div></body></html>',
);

// The app-wide rate limiter keeps in-process buckets, and every test file
// shares this process — reset per test so suites can't throttle each other.
import { beforeEach } from "bun:test";
import { resetRateLimitBuckets } from "../plugins/rate-limit.plugin.js";
beforeEach(() => resetRateLimitBuckets());
