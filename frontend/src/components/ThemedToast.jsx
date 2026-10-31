// Toasts follow the app theme.
import { ToastContainer } from "react-toastify";
import { useTheme } from "../theme-context.js";

const ThemedToast = () => {
	const { theme } = useTheme();
	return (
		<ToastContainer position="bottom-right" autoClose={3000} theme={theme} />
	);
};

export default ThemedToast;
