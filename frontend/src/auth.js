// Client-side admin auth helpers. The server sets an httpOnly session cookie
// on login; JS can't read it, so "am I signed in?" goes to the session
// endpoint. The server enforces every admin call — this is only a UX signal.
import { request } from "./api.js";

export const isAdmin = async () => {
	try {
		const body = await request("/api/v1/admin/session");
		return body?.isAdmin === true;
	} catch {
		return false;
	}
};

// Under /api so the vite dev proxy forwards it (POST /login is a legacy alias).
export const login = (password) =>
	request("/api/v1/admin/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ password }),
	});

export const logout = () =>
	request("/api/v1/admin/logout", { method: "POST" });
