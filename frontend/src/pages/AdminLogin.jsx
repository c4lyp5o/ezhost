// Admin login — React port of the old server-rendered LOGIN_HTML, themed to
// match the rest of the SPA (dark-first, purple accent). Posts the password to
// /login; on success the server sets the httpOnly auth cookie and we redirect
// to the dashboard.
import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { login, isAdmin } from "../auth.js";

const AdminLogin = () => {
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	// null = still checking session; true/false = result (so logged-in users
	// skip the form straight to the dashboard).
	const [authed, setAuthed] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		let alive = true;
		isAdmin().then((ok) => alive && setAuthed(ok));
		return () => {
			alive = false;
		};
	}, []);

	if (authed === null) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-stone-100 text-stone-500 dark:bg-stone-950 dark:text-stone-400">
				Checking session…
			</div>
		);
	}

	if (authed) return <Navigate to="/" replace />;

	const submit = async (e) => {
		e.preventDefault();
		setError("");
		setBusy(true);
		try {
			const res = await login(password);
			if (res.ok) {
				navigate("/", { replace: true });
			} else {
				setError("Invalid password");
			}
		} catch {
			setError("Login failed — is the server up?");
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-stone-100 px-4 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
			<div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
				<h1 className="mb-1 text-2xl font-bold tracking-tight">
					EZHOST <span className="text-purple-500">2.0</span>
				</h1>
				<p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
					Admin login
				</p>

				<form onSubmit={submit} className="flex flex-col gap-4">
					<label className="flex flex-col gap-1 text-sm">
						<span className="font-medium text-stone-700 dark:text-stone-300">
							Password
						</span>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoFocus
							required
							className="rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
						/>
					</label>

					{error && (
						<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
					)}

					<button
						type="submit"
						disabled={busy}
						className="rounded-md bg-purple-600 px-3 py-2 font-medium text-white transition hover:bg-purple-500 disabled:opacity-60"
					>
						{busy ? "Logging in…" : "Login"}
					</button>
				</form>
			</div>
		</div>
	);
};

export default AdminLogin;