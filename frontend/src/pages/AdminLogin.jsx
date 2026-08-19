// Admin login — centered, premium auth card. Posts password to /login; on
// success the server sets the httpOnly auth cookie and we route to dashboard.
import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { login, isAdmin } from "../auth.js";
import { IconLock, IconLoader } from "../components/Icons.jsx";

const AdminLogin = () => {
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	// null = still checking session; true/false = result
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
			<div className="flex min-h-screen items-center justify-center bg-[var(--surface-0)] text-[var(--text-low)]">
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
		<div className="flex min-h-screen items-center justify-center bg-[var(--surface-0)] px-4">
			<div className="w-full max-w-sm">
				{/* Wordmark */}
				<div className="mb-8 flex flex-col items-center gap-4">
					<span
						className="flex h-12 w-12 items-center justify-center rounded-2xl font-bold"
						style={{
							background:
								"linear-gradient(135deg, var(--accent), var(--accent-strong))",
							color: "#fff",
							boxShadow: "0 0 0 1px var(--stroke), 0 16px 40px -16px var(--accent-ring)",
							fontSize: 20,
						}}
					>
						e
					</span>
					<div className="text-center">
						<h1 className="text-xl font-semibold tracking-tight text-[var(--text-hi)]">
							ezhost <span className="accent-text">admin</span>
						</h1>
						<p className="mt-1 text-sm text-[var(--text-low)]">
							Sign in to manage hosted files
						</p>
					</div>
				</div>

				<form onSubmit={submit} className="surface flex flex-col gap-5 rounded-2xl p-6">
					<label className="flex flex-col gap-2">
						<span className="text-[13px] font-medium text-[var(--text-mid)]">
							Admin password
						</span>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoFocus
							required
							placeholder="••••••••"
							className="rounded-lg border border-[var(--stroke)] bg-[var(--surface-2)]/50 px-3 py-2.5 text-sm text-[var(--text-hi)] placeholder-[var(--text-low)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-ring)]"
						/>
					</label>

					{error && (
						<p className="rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-[13px] text-red-600 dark:text-red-400">
							{error}
						</p>
					)}

					<button
						type="submit"
						disabled={busy}
						className="btn-accent inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium disabled:opacity-60"
					>
						{!busy && <IconLock size={15} />}
						{busy ? <IconLoader size={15} /> : null}
						{busy ? "Signing in…" : "Sign in"}
					</button>
				</form>

				<p className="mt-6 text-center text-xs text-[var(--text-low)]">
					ezhost · file hosting by{" "}
					<span className="font-medium accent-text">c4lyp5o</span>
				</p>
			</div>
		</div>
	);
};

export default AdminLogin;