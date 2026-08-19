// Top bar — brand, search, theme toggle and the upload trigger.
// Stacks into two rows on mobile, one row from sm up.
import { useTheme } from "../theme.jsx";

const Header = ({ searchTerm, setSearchTerm, onUpload }) => {
	const { theme, toggle } = useTheme();

	return (
		<header className="sticky top-0 z-40 border-b border-stone-200 bg-white/85 backdrop-blur dark:border-stone-800 dark:bg-stone-900/85">
			<div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<div className="flex items-center justify-between gap-3">
					<h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
						EZHOST <span className="text-purple-500">2.0</span>
					</h1>
					{/* Theme toggle — full-size touch target */}
					<button
						type="button"
						onClick={toggle}
						aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
						title={theme === "dark" ? "Light mode" : "Dark mode"}
						className="flex h-11 w-11 items-center justify-center rounded-md border border-stone-200 bg-white text-lg transition hover:bg-stone-100 sm:hidden dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
					>
						{theme === "dark" ? "☀️" : "🌙"}
					</button>
				</div>

				<div className="flex items-center gap-2">
					<input
						type="search"
						placeholder="Search files..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-500 sm:w-64 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:placeholder-stone-500"
						style={{ height: 44 }}
					/>
					<button
						type="button"
						onClick={onUpload}
						className="h-11 shrink-0 rounded-md bg-purple-600 px-4 text-sm font-medium text-white transition hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
					>
						+ Upload
					</button>
					{/* Theme toggle — desktop placement */}
					<button
						type="button"
						onClick={toggle}
						aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
						title={theme === "dark" ? "Light mode" : "Dark mode"}
						className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-white text-lg transition hover:bg-stone-100 sm:flex dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
					>
						{theme === "dark" ? "☀️" : "🌙"}
					</button>
				</div>
			</div>
		</header>
	);
};

export default Header;
