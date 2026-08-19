// Top bar — refined wordmark, search, upload trigger, theme toggle.
// Linear-style blurred sticky bar with hairline bottom border.
import { useTheme } from "../theme.jsx";
import { IconSearch, IconUpload, IconSun, IconMoon } from "./Icons.jsx";

const Wordmark = () => (
	<h1 className="flex items-center gap-2.5">
		<span
			className="flex h-7 w-7 items-center justify-center rounded-[7px] font-bold"
			style={{
				background:
					"linear-gradient(135deg, var(--accent), var(--accent-strong))",
				color: "#fff",
				boxShadow: "0 0 0 1px var(--stroke), 0 6px 18px -8px var(--accent-ring)",
				fontSize: 13,
				letterSpacing: "-0.02em",
			}}
		>
			e
		</span>
		<span className="text-[15px] font-semibold tracking-tight text-[var(--text-hi)]">
			ezhost
		</span>
	</h1>
);

const Header = ({ searchTerm, setSearchTerm, onUpload }) => {
	const { theme, toggle } = useTheme();
	const dark = theme === "dark";

	return (
		<header className="sticky top-0 z-40 border-b border-[var(--stroke)] bg-[var(--surface-0)]/80 backdrop-blur-md">
			<div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<Wordmark />
				<div className="flex items-center gap-2">
					<label className="group relative block w-full sm:w-64">
						<span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-[var(--text-low)] transition-colors [.group:focus-within_&]:text-[var(--accent)]">
							<IconSearch size={15} />
						</span>
						<input
							type="search"
							placeholder="Search files..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full rounded-lg border border-[var(--stroke)] bg-[var(--surface-1)] py-2 pl-8 pr-3 text-sm text-[var(--text-hi)] placeholder-[var(--text-low)] transition hover:border-[var(--stroke-strong)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
						/>
					</label>
					<button
						type="button"
						onClick={toggle}
						aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
						title={dark ? "Light mode" : "Dark mode"}
						className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--stroke)] bg-[var(--surface-1)] text-[var(--text-mid)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-hi)]"
					>
						{dark ? <IconSun size={16} /> : <IconMoon size={16} />}
					</button>
					<button
						type="button"
						onClick={onUpload}
						className="btn-accent inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
					>
						<IconUpload size={15} />
						<span className="hidden sm:inline">Upload</span>
					</button>
				</div>
			</div>
		</header>
	);
};

export default Header;