// Client-side admin auth helpers.
// The server sets an httpOnly `auth` cookie on successful login. Because it's
// httpOnly, JS can't read its value via document.cookie — so "are we logged
// in?" is answered by the session endpoint instead. The server still enforces
// every admin API call; this is purely a routing/UX signal, not a boundary.

export const isAdmin = async () => {
	try {
		const res = await fetch("/api/v1/admin/session", {
			credentials: "same-origin",
			headers: { "Content-Type": "application/json" },
		});
		if (!res.ok) return false;
		const body = await res.json();
		return body?.isAdmin === true;
	} catch {
		return false;
	}
};

export const login = async (password) => {
	const res = await fetch("/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ password }),
		credentials: "same-origin",
	});
	return res;
};

export const logout = async () => {
	const res = await fetch("/api/v1/admin/logout", {
		method: "POST",
		credentials: "same-origin",
	});
	return res;
};