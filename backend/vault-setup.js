import { createVault } from "./vault.js";
import { DB_PATH, PUBLIC_DIR, DIST_DIR } from "./config.js";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { writeFileSync } from "node:fs";
const { db, otp } = createVault({ dbPath: DB_PATH, root: PUBLIC_DIR, dist: DIST_DIR });
const code = process.argv[2];
if (code) {
	const row = db.query("SELECT * FROM enrollment WHERE id=1").get();
	if (!row || row.confirmed || !/^\d{6}$/.test(code) || otp(row.secret).validate({ token: code, window: 1 }) === null) throw new Error("Enrollment confirmation failed");
	db.query("UPDATE enrollment SET confirmed=1,lastStep=? WHERE id=1").run(Math.floor(Date.now()/30000));
	console.log("Enrollment confirmed. Remove the private QR file.");
} else {
	if (db.query("SELECT 1 FROM enrollment WHERE id=1 AND confirmed=1").get()) throw new Error("Already enrolled");
	let row = db.query("SELECT secret FROM enrollment WHERE id=1").get();
	if (!row) {
		const secret = new OTPAuth.Secret({ size: 20 }).base32;
		db.query("INSERT INTO enrollment(id,secret) VALUES (1,?)").run(secret);
		row = { secret };
	}
	const output = process.env.VAULT_QR_PATH;
	if (!output) throw new Error("Set VAULT_QR_PATH to a private SVG path");
	writeFileSync(output, await QRCode.toString(otp(row.secret).toString(), { type: "svg" }), { mode: 0o600, flag: "wx" });
	console.log("Private QR written. Scan locally, then run this command with the six-digit code to confirm.");
}
db.close();
