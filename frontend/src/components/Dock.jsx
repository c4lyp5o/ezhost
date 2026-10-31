// The dock: the page's one loud element. Hazard-tape edge, a big Bricolage
// line saying what to do, and the three.js parcel that reacts to dragging
// and uploading. The parcel is lazy-loaded; a flat SVG parcel stands in
// until it arrives (and permanently if WebGL is unavailable).
import { lazy, Suspense, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "../theme-context.js";
import { IconUpload } from "./Icons.jsx";

const Parcel3D = lazy(() => import("./Parcel3D.jsx"));

const FlatParcel = () => (
	<svg viewBox="0 0 120 120" className="h-full w-full p-6 opacity-90" aria-hidden="true">
		<path d="M20 42l40-22 40 22v40l-40 22-40-22z" fill="var(--surface-2)" stroke="var(--stroke-strong)" strokeWidth="2" strokeLinejoin="round" />
		<path d="M20 42l40 22 40-22M60 64v40" fill="none" stroke="var(--stroke-strong)" strokeWidth="2" strokeLinejoin="round" />
		<path d="M40 31l40 22v12" fill="none" stroke="var(--label)" strokeWidth="7" strokeLinejoin="round" />
	</svg>
);

const Dock = ({ excited, onChoose, dragOver }) => {
	const { theme } = useTheme();
	const reduce = useReducedMotion();
	const [glReady, setGlReady] = useState(false);

	return (
		<section
			aria-labelledby="dock-title"
			className="surface relative grid overflow-hidden rounded-2xl sm:grid-cols-[1fr_minmax(220px,38%)]"
		>
			<div className="hazard absolute inset-y-0 left-0 w-2.5" aria-hidden="true" />

			<div className="relative z-10 flex flex-col gap-5 py-8 pr-6 pl-8 sm:py-10 sm:pl-11">
				<motion.h1
					id="dock-title"
					className="display max-w-[14ch] font-extrabold text-[var(--text-hi)]"
					style={{
						fontSize: "clamp(2.35rem, 6.2vw, 4.1rem)",
						fontVariationSettings: '"wdth" 80',
					}}
					initial={reduce ? false : { opacity: 0, y: 14 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
				>
					{dragOver ? "Let go to upload." : "Drop a file, get a link."}
				</motion.h1>
				<p className="max-w-[46ch] text-[15px] text-[var(--text-mid)]">
					Anyone can upload and anyone with the link can open it. Up to 100 MB
					per file.
				</p>
				<div className="flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={onChoose}
						className="btn-label inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[15px]"
					>
						<IconUpload size={17} />
						Choose files
					</button>
					<span className="text-sm text-[var(--text-low)] [@media(pointer:coarse)]:hidden">
						or drop them anywhere on this page
					</span>
				</div>
			</div>

			<div className="relative -mt-4 h-40 sm:mt-0 sm:h-auto sm:min-h-[260px]">
				{!glReady && (
					<div className="absolute inset-0 flex items-center justify-center">
						<FlatParcel />
					</div>
				)}
				<Suspense fallback={null}>
					<Parcel3D
						excited={excited}
						theme={theme}
						reduceMotion={!!reduce}
						onReady={() => setGlReady(true)}
					/>
				</Suspense>
			</div>
		</section>
	);
};

export default Dock;
