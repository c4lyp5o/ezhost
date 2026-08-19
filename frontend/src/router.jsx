// React Router config — the SPA serves BOTH the public file browser and the
// admin dashboard from the same built bundle. The backend loads the bundle at
// "/" and "/app/*", so no router nested under a <BrowserRouter basename> —
// routes here are absolute (root path "/" = admin, "/app" = public browser).
import { useEffect, useState } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import { isAdmin } from "./auth.js";

// Require the admin session; show a brief loading state while the session
// endpoint answers (the auth cookie is httpOnly, so we can't read it in JS),
// then redirect unauthenticated users to login.
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
			<div className="flex min-h-screen items-center justify-center bg-stone-100 text-stone-500 dark:bg-stone-950 dark:text-stone-400">
				Checking session…
			</div>
		);
	}

	return authed ? children : <Navigate to="/login" replace />;
};

const router = createBrowserRouter([
	{
		path: "/",
		element: (
			<RequireAdmin>
				<AdminDashboard />
			</RequireAdmin>
		),
	},
	{
		path: "/login",
		element: <AdminLogin />,
	},
	{
		path: "/app/*",
		element: <App />,
	},
]);

export default router;