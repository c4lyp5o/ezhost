import { createVault } from "./vault.js";
import { DB_PATH, PUBLIC_DIR, DIST_DIR } from "./config.js";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { writeFileSync } from "node:fs";

const { db, otp } = createVault({ dbPath: DB_PATH, root: PUBLIC_DIR, dist: DIST_DIR });
try {
	if (process.argv[2] === "--show") {
		if (!process.stdout.isTTY) throw new Error("QR display requires an interactive terminal");
		const row = db.query("SELECT secret FROM enrollment WHERE id=1 AND confirmed=1").get();
		if (!row) throw new Error("Not enrolled; generate a private QR first");
		console.log(await QRCode.toString(otp(row.secret).toString(), { type: "terminal", small: true }));
	} else {
	if (process.argv[2]) throw new Error("Use no arguments to enroll, or --show to display the existing QR.");
	if (db.query("SELECT 1 FROM enrollment WHERE id=1 AND confirmed=1").get()) throw new Error("Already enrolled");
	const output = process.env.VAULT_QR_PATH;
	if (!output) throw new Error("Set VAULT_QR_PATH to a private SVG path");
	let row = db.query("SELECT secret FROM enrollment WHERE id=1").get();
	if (!row) {
		const secret = new OTPAuth.Secret({ size: 20 }).base32;
		db.query("INSERT INTO enrollment(id,secret) VALUES (1,?)").run(secret);
		row = { secret };
	}
	writeFileSync(output, await QRCode.toString(otp(row.secret).toString(), { type: "svg" }), { mode: 0o600, flag: "wx" });
	db.query("UPDATE enrollment SET confirmed=1 WHERE id=1").run();
	console.log("Private QR written; enrollment active. Scan locally, then sign in. Delete the QR after scanning.");
	}
} finally {
	db.close();
}
