import { Database } from "bun:sqlite";

const db = new Database("./ezhost.sqlite");

// Initialize the database schema
export function initDB() {
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
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
    const hash = Bun.password.hash(adminPassword, { algorithm: "bcrypt" });
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

// Get admin by ID (for session)
export function getAdminById(id) {
  return db.query("SELECT * FROM admins WHERE id = ?").get(id);
}

export default { initDB, verifyAdmin, getAdminById };