import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import router from "./router.jsx";
import { ThemeProvider, useTheme } from "./theme.jsx";
import "./index.css";

// Toasts follow the app theme (dark-first, but light in light mode).
const ThemedToast = () => {
	const { theme } = useTheme();
	return <ToastContainer position="top-right" autoClose={3000} theme={theme} />;
};

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<ThemeProvider>
			<RouterProvider router={router} />
			<ThemedToast />
		</ThemeProvider>
	</StrictMode>
);