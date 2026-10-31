// Admin sign-in. On success the server sets the httpOnly session cookie and
// we go to /admin. Already signed in? Skip straight there.
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { login, isAdmin } from "../auth.js";
import Wordmark from "../components/Wordmark.jsx";
import { IconLock, IconLoader } from "../components/Icons.jsx";

const AdminLogin = () => {
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const [authed, setAuthed] = useState(null);
	const [shake, setShake] = useState(0);
	const navigate = useNavigate();
	const reduce = useReducedMotion();

	useEffect(() => {
		let alive = true;
		isAdmin().then((ok) => alive && setAuthed(ok));
		return () => {
			alive = false;
		};
	}, []);

	if (authed === null) {
		return (
			<div className="flex min-h-dvh items-center justify-center bg-[var(--surface-0)] text-sm text-[var(--text-low)]">
				Checking your session…
			</div>
		);
	}
	if (authed) return <Navigate to="/admin" replace />;

	const submit = async (e) => {
		e.preventDefault();
		setError("");
		setBusy(true);
		try {
			await login(password);
			navigate("/admin", { replace: true });
		} catch (err) {
			setError(
				err.status === 401
					? "That password isn't right."
					: err.status
						? err.message
						: "Can't reach the server. Check that it's running.",
			);
			setShake((n) => n + 1);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="flex min-h-dvh items-center justify-center bg-[var(--surface-0)] px-4 py-10">
			<div className="w-full max-w-sm">
				<div className="mb-8 flex flex-col items-start gap-4">
					<Link to="/" className="rounded-lg" aria-label="Back to the public page">
						<Wordmark size={40} />
					</Link>
					<h1 className="display text-4xl font-extrabold" style={{ fontVariationSettings: '"wdth" 82' }}>
						Admin sign in
					</h1>
				</div>

				<motion.form
					key={shake}
					onSubmit={submit}
					className="surface relative flex flex-col gap-5 overflow-hidden rounded-2xl p-6 pl-8"
					animate={shake && !reduce ? { x: [0, -10, 9, -6, 4, 0] } : undefined}
					transition={{ duration: 0.38 }}
				>
					<div className="hazard absolute inset-y-0 left-0 w-2" aria-hidden="true" />
					<label className="flex flex-col gap-2">
						<span className="text-sm font-medium text-[var(--text-mid)]">Admin password</span>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoFocus
							required
							autoComplete="current-password"
							aria-invalid={!!error}
							aria-describedby={error ? "login-error" : undefined}
							className="field rounded-xl px-3.5 py-3 text-[15px]"
						/>
					</label>

					{error && (
						<p id="login-error" role="alert" className="text-sm text-[var(--bad)]">
							{error}
						</p>
					)}

					<button
						type="submit"
						disabled={busy}
						className="btn-label inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px]"
					>
						{busy ? <IconLoader size={16} /> : <IconLock size={16} />}
						{busy ? "Signing in…" : "Sign in"}
					</button>
				</motion.form>

				<p className="mt-6 text-sm text-[var(--text-low)]">
					Just here for files?{" "}
					<Link to="/" className="font-medium text-[var(--text-hi)] underline underline-offset-4">
						Go to the public page
					</Link>
				</p>
			</div>
		</div>
	);
};

export default AdminLogin;
