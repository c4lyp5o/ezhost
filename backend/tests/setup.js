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

fs.mkdirSync(process.env.PUBLIC_DIR, { recursive: true });
fs.mkdirSync(process.env.DIST_DIR, { recursive: true });
// Fake SPA shell so the fallback route can be exercised in tests.
fs.writeFileSync(path.join(process.env.DIST_DIR, "index.html"), "<html>spa</html>");
