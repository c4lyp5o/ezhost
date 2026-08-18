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
  const admin = db.get("SELECT * FROM admins LIMIT 1");
  if (!admin) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error("ADMIN_PASSWORD environment variable is required for first run");
      process.exit(1);
    }
    const hash = Bun.password.hash(adminPassword, { algorithm: "bcrypt" });
    db.run("INSERT INTO admins (username, password) VALUES (?, ?)", ["admin", hash]);
    console.log("Admin user created. Username: admin, Password: [from ADMIN_PASSWORD]");
  }
}

// Verify admin credentials
export async function verifyAdmin(username, password) {
  const admin = db.get("SELECT * FROM admins WHERE username = ?", [username]);
  if (!admin) return false;
  return await Bun.password.verify(password, admin.password);
}

// Get admin by ID (for session)
export function getAdminById(id) {
  return db.get("SELECT * FROM admins WHERE id = ?", [id]);
}

export default { initDB, verifyAdmin, getAdminById };