import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/

// Footer: the running version and the source link, baked in at build time.
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const APP_DEFINE = {
	__APP_VERSION__: JSON.stringify(pkg.version),
	__APP_REPO__: JSON.stringify("https://github.com/c4lyp5o/ezhost"),
};

export default defineConfig({
	define: APP_DEFINE,
	server: {
		// Listen on all interfaces (0.0.0.0) so phones/other machines on the
		// LAN can open the dev server; Vite prints the Network URLs on start.
		host: true,
		port: 3000,
		// Backend-owned paths go to :5000. /api covers login too
		// (/api/v1/admin/login); /static is where uploaded files are served.
		proxy: {
			"/api": { target: "http://localhost:5000", changeOrigin: true },
			"/static": { target: "http://localhost:5000", changeOrigin: true },
		},
	},
	plugins: [
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
		tailwindcss(),
	],
	build: {
		outDir: "../dist",
		emptyOutDir: true,
	},
});
