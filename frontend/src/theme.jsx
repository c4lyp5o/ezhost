// Theme provider — dark-first with a user-toggleable light mode.
// The choice persists under "ezhost-theme"; dark wins unless the user
// explicitly chose light. The html.dark class drives Tailwind's dark: variant.
import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "ezhost-theme";

const ThemeContext = createContext(null);

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
		try {
			localStorage.setItem(STORAGE_KEY, theme);
		} catch {
			/* private mode — toggle still works for the session */
		}
	}, [theme]);

	const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

	return (
		<ThemeContext.Provider value={{ theme, toggle }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = () => useContext(ThemeContext);
