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
import Vault from "./pages/Vault.jsx";

const vaultMode = await fetch("/api/v1/vault/status").then((r) => r.ok ? r.json() : null).then((data) => data?.mode === "vault").catch(() => false);

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<ThemeProvider>
			<MotionRoot>
				{vaultMode ? <Vault /> : <RouterProvider router={router} /> }
				<ThemedToast />
			</MotionRoot>
		</ThemeProvider>
	</StrictMode>,
);
