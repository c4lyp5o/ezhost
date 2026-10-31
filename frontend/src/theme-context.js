// Theme context + hook live apart from the provider component so
// react-refresh can hot-reload theme.jsx (a file must export only components).
import { createContext, useContext } from "react";

export const STORAGE_KEY = "ezhost-theme";
export const ThemeContext = createContext({ theme: "dark", toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);
