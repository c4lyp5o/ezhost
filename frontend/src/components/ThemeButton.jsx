// Theme switch, ezchrono style: a round hairline button showing the CURRENT
// theme (moon in dark, sun in light).
import { useTheme } from "../theme-context.js";

const ThemeButton = () => {
	const { theme, toggle } = useTheme();
	const dark = theme === "dark";
	const next = dark ? "light" : "dark";
	return (
		<button
			type="button"
			role="switch"
			aria-checked={dark}
			aria-label={`Theme: ${theme}. Switch to ${next} mode`}
			title={`Switch to ${next} mode`}
			onClick={toggle}
			className="inline-grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border border-[var(--stroke-strong)] text-[var(--text-low)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--text-hi)]"
		>
			<svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
				{dark ? (
					<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
				) : (
					<>
						<circle cx="12" cy="12" r="4" />
						<path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
					</>
				)}
			</svg>
		</button>
	);
};

export default ThemeButton;
