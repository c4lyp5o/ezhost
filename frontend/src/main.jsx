import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import router from "./router.jsx";
import { ThemeProvider } from "./theme.jsx";
import ThemedToast from "./components/ThemedToast.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<ThemeProvider>
			<RouterProvider router={router} />
			<ThemedToast />
		</ThemeProvider>
	</StrictMode>,
);
