import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import router from "./router.jsx";
import { ThemeProvider } from "./theme.jsx";
import ThemedToast from "./components/ThemedToast.jsx";
import "@fontsource-variable/public-sans";
import "./index.css";
import { MotionRoot } from "./ez/motion";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<ThemeProvider>
			<MotionRoot>
				<RouterProvider router={router} />
				<ThemedToast />
			</MotionRoot>
		</ThemeProvider>
	</StrictMode>,
);
