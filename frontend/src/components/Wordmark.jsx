// The ezhost mark: a yellow label tile with a parcel outline, then the name
// set in Bricolage. `size` scales both together.
const Wordmark = ({ size = 28, suffix }) => (
	<span className="inline-flex items-center gap-2.5">
		<svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
			<rect width="32" height="32" rx="8" fill="var(--label)" />
			<path
				d="M9 12l7-4 7 4v8l-7 4-7-4zM9 12l7 4 7-4M16 16v8"
				fill="none"
				stroke="var(--label-ink)"
				strokeWidth="2.2"
				strokeLinejoin="round"
			/>
		</svg>
		<span
			className="display font-bold text-[var(--text-hi)]"
			style={{ fontSize: size * 0.68, fontVariationSettings: '"wdth" 85' }}
		>
			ezhost
			{suffix && <span className="ml-1.5 font-medium text-[var(--text-low)]">{suffix}</span>}
		</span>
	</span>
);

export default Wordmark;
