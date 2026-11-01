// Top bar, ezchrono style: mark, name, description, search, theme switch.
import { Link } from "react-router-dom";
import { IconSearch } from "./Icons.jsx";
import ThemeButton from "./ThemeButton.jsx";
import Wordmark from "./Wordmark.jsx";

const Header = ({ searchTerm, setSearchTerm }) => {
	return (
		<header className="sticky top-0 z-40 border-b border-[var(--stroke)] bg-[var(--surface-0)]">
			<div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
				<Link to="/" className="shrink-0 rounded-lg" aria-label="ezhost home">
					<Wordmark size={28} suffix="Self-hosted file hosting" collapse />
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
							className="field w-full rounded-xl py-2 pr-3 pl-9 text-[13px]"
						/>
					</label>
					<ThemeButton />
				</div>
			</div>
		</header>
	);
};

export default Header;
