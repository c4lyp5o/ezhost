// Gate for admin routes: ask the session endpoint (the cookie is httpOnly),
// then render the page or send the visitor to /login.
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAdmin } from "../auth.js";

const RequireAdmin = ({ children }) => {
	const [authed, setAuthed] = useState(null);

	useEffect(() => {
		let alive = true;
		isAdmin().then((ok) => alive && setAuthed(ok));
		return () => {
			alive = false;
		};
	}, []);

	if (authed === null) {
		return (
			<div className="flex min-h-dvh items-center justify-center bg-[var(--surface-0)] text-[13px] text-[var(--text-low)]">
				Checking your session…
			</div>
		);
	}
	return authed ? children : <Navigate to="/login" replace />;
};

export default RequireAdmin;
