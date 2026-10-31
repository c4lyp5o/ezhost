// Top bar: wordmark, search, theme toggle. Sticky, blurred, hairline below.
import { Link } from "react-router-dom";
import { useTheme } from "../theme-context.js";
import { IconSearch, IconSun, IconMoon } from "./Icons.jsx";
import Wordmark from "./Wordmark.jsx";

const Header = ({ searchTerm, setSearchTerm }) => {
	const { theme, toggle } = useTheme();
	const dark = theme === "dark";

	return (
		<header className="sticky top-0 z-40 border-b border-[var(--stroke)] bg-[var(--surface-0)]/85 backdrop-blur-md">
			<div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
				<Link to="/" className="shrink-0 rounded-lg" aria-label="ezhost home">
					<Wordmark size={30} />
				</Link>
				<div className="ml-auto flex min-w-0 items-center gap-2">
					<label className="relative block w-full min-w-0 sm:w-72">
						<span className="sr-only">Search files</span>
						<span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-low)]">
							<IconSearch size={15} />
						</span>
						<input
							type="search"
							placeholder="Search files"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="field w-full rounded-xl py-2 pr-3 pl-9 text-sm"
						/>
					</label>
					<button
						type="button"
						onClick={toggle}
						aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
						title={dark ? "Light theme" : "Dark theme"}
						className="btn-ghost flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-mid)]"
					>
						{dark ? <IconSun size={16} /> : <IconMoon size={16} />}
					</button>
				</div>
			</div>
		</header>
	);
};

export default Header;
