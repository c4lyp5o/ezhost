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
			className="surface relative grid overflow-hidden rounded-lg sm:grid-cols-[1fr_minmax(220px,38%)]"
		>
			<div className="hazard absolute inset-y-0 left-0 w-px" aria-hidden="true" />

			<div className="relative z-10 flex flex-col gap-4 py-8 pr-6 pl-6 sm:py-10 sm:pl-8">
				<motion.h1
					id="dock-title"
					className="display max-w-[18ch] text-[30px] font-semibold text-[var(--text-hi)]"
					initial={reduce ? false : { opacity: 0, y: 14 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
				>
					{dragOver ? "Let go to upload." : "Drop a file, get a link."}
				</motion.h1>
				<p className="max-w-[46ch] text-[14px] text-[var(--text-low)]">
					Anyone can upload and anyone with the link can open it. Up to 100 MB
					per file.
				</p>
				<div className="flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={onChoose}
						className="btn-label inline-flex h-[34px] items-center gap-2 px-4 text-[13px]"
					>
						<IconUpload size={17} />
						Choose files
					</button>
					<span className="text-[12px] text-[var(--text-low)] [@media(pointer:coarse)]:hidden">
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
