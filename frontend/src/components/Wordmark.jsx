// The ezhost mark in the ez family style: a small rounded tile with the
// parcel drawn in the accent, then the name. `size` scales both together.
const Wordmark = ({ size = 28, suffix, collapse }) => (
	<span className="inline-flex items-center gap-2.5">
		<svg width={size * 0.8} height={size * 0.8} viewBox="0 0 32 32" aria-hidden="true">
			<rect x="0.5" y="0.5" width="31" height="31" rx="7" fill="var(--color-surface)" stroke="var(--color-line-strong)" />
			<path
				d="M9 12l7-4 7 4v8l-7 4-7-4zM9 12l7 4 7-4M16 16v8"
				fill="none"
				stroke="var(--color-accent)"
				strokeWidth="2.2"
				strokeLinejoin="round"
			/>
		</svg>
		<span className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-hi)]">
			ezhost
			{suffix && <span className={`${collapse ? "max-sm:hidden " : ""}ml-3 border-l border-[var(--stroke-strong)] pl-3 text-[12px] font-normal text-[var(--text-low)]`}>{suffix}</span>}
		</span>
	</span>
);

export default Wordmark;
