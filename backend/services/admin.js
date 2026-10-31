import { Database } from "bun:sqlite";
import { DB_PATH } from "../config";

export { DB_PATH };
const db = new Database(DB_PATH);

// Initialize the database schema
export async function initDB() {
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  // Opaque login sessions. Only a SHA-256 of the token is stored, so a DB leak
  // does not leak live sessions; the cookie never carries the password.
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL
    )
  `);

  // If no admin exists, create one from environment variable
  const admin = db.query("SELECT * FROM admins LIMIT 1").get();
  if (!admin) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error("ADMIN_PASSWORD environment variable is required for first run");
      process.exit(1);
    }
    const hash = await Bun.password.hash(adminPassword, { algorithm: "bcrypt" });
    // Use prepared statement to avoid binding issues
    const stmt = db.prepare("INSERT INTO admins (username, password) VALUES (?, ?)");
    stmt.run("admin", hash);
    console.log("Admin user created. Username: admin, Password: [from ADMIN_PASSWORD]");
  }
}

// Verify admin credentials
export async function verifyAdmin(username, password) {
  const admin = db.query("SELECT * FROM admins WHERE username = ?").get(username);
  if (!admin) return false;
  return await Bun.password.verify(password, admin.password);
}

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const hashToken = (token) =>
  new Bun.CryptoHasher("sha256").update(token).digest("hex");

// Mint a random session token (returned to the caller for the cookie) and
// store only its hash. Expired rows are purged opportunistically here.
export function createSession() {
  const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
  const now = Date.now();
  db.run("DELETE FROM sessions WHERE expires_at <= ?", now);
  db.run(
    "INSERT INTO sessions (token_hash, expires_at) VALUES (?, ?)",
    hashToken(token),
    now + SESSION_TTL_MS,
  );
  return token;
}

// Cheap per-request check (one SHA-256 + indexed lookup — no bcrypt).
export function verifySession(token) {
  if (!token || typeof token !== "string") return false;
  const row = db
    .query("SELECT expires_at FROM sessions WHERE token_hash = ?")
    .get(hashToken(token));
  return !!row && row.expires_at > Date.now();
}

// Server-side revocation on logout.
export function deleteSession(token) {
  if (!token || typeof token !== "string") return;
  db.run("DELETE FROM sessions WHERE token_hash = ?", hashToken(token));
}

// Get admin by ID (for session)
export function getAdminById(id) {
  return db.query("SELECT * FROM admins WHERE id = ?").get(id);
}

export default { initDB, verifyAdmin, getAdminById };