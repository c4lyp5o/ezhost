// Theme provider — dark-first with a user-toggleable light mode. The choice
// persists under "ezhost-theme"; html.dark drives Tailwind's dark: variant.
import { useEffect, useState } from "react";
import { STORAGE_KEY, ThemeContext } from "./theme-context.js";

export const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState(() => {
		try {
			return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
		} catch {
			return "dark";
		}
	});

	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute("content", theme === "dark" ? "#0F1A2E" : "#EEF2F7");
		try {
			localStorage.setItem(STORAGE_KEY, theme);
		} catch {
			/* private mode — the toggle still works for this visit */
		}
	}, [theme]);

	const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

	return (
		<ThemeContext.Provider value={{ theme, toggle }}>
			{children}
		</ThemeContext.Provider>
	);
};
