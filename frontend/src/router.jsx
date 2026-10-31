// Routes. "/" is the public page (what most visitors want), "/admin" the
// dashboard. "/app" was the old public URL and redirects to "/".
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import NotFound from "./pages/NotFound.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";

const router = createBrowserRouter([
	{ path: "/", element: <App /> },
	{
		path: "/admin",
		element: (
			<RequireAdmin>
				<AdminDashboard />
			</RequireAdmin>
		),
	},
	{ path: "/login", element: <AdminLogin /> },
	{ path: "/app/*", element: <Navigate to="/" replace /> },
	{ path: "*", element: <NotFound /> },
]);

export default router;
