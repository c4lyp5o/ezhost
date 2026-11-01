// Public page: the dock (upload) on top, the manifest (all hosted files)
// below. Files can be dropped anywhere on the page.
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { AnimatePresence, motion } from "motion/react";
import { Stagger, StaggerItem } from "./ez/motion";
import { fetcher, swrOptions } from "./api.js";
import Header from "./components/Header.jsx";
import Dock from "./components/Dock.jsx";
import FileList from "./components/FileList.jsx";
import UploadModal from "./components/UploadModal.jsx";
import FileInfoModal from "./components/FileInfoModal.jsx";
import { IconGithub } from "./components/Icons.jsx";
import { formatBytes } from "./utils.js";

const hasFiles = (e) => [...(e.dataTransfer?.types ?? [])].includes("Files");

const Notice = ({ title, children, tone }) => (
	<div
		className={`flex flex-col items-start gap-1 rounded border border-dashed px-4 py-3 ${
			tone === "bad"
				? "border-[var(--bad)]/50 bg-[var(--bad-soft)]"
				: "border-[var(--stroke-strong)]"
		}`}
		role={tone === "bad" ? "alert" : undefined}
	>
		
		<p className="text-[13px] text-[var(--text-mid)]">{title}</p>
		<div className="max-w-prose text-[12px] text-[var(--text-low)]">{children}</div>
	</div>
);

const App = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selected, setSelected] = useState(null);
	const [infoOpen, setInfoOpen] = useState(false);
	const [upload, setUpload] = useState({ open: false, session: 0, files: [] });
	const [pageDrag, setPageDrag] = useState(false);
	const [fresh, setFresh] = useState(() => new Set());
	const dragDepth = useRef(0);

	const { data, error, isLoading, mutate } = useSWR("/api/v1/files", fetcher, swrOptions);

	const openUpload = (files = []) =>
		setUpload((u) => ({ open: true, session: u.session + 1, files }));

	// Page-wide drop target. dragenter/leave fire for every child element, so
	// count depth instead of trusting a single leave event.
	useEffect(() => {
		const enter = (e) => {
			if (!hasFiles(e)) return;
			dragDepth.current += 1;
			setPageDrag(true);
		};
		const leave = (e) => {
			if (!hasFiles(e)) return;
			dragDepth.current = Math.max(0, dragDepth.current - 1);
			if (dragDepth.current === 0) setPageDrag(false);
		};
		const over = (e) => hasFiles(e) && e.preventDefault();
		const drop = (e) => {
			if (!hasFiles(e)) return;
			e.preventDefault();
			dragDepth.current = 0;
			setPageDrag(false);
			// The upload sheet handles its own drops while open.
			if (!upload.open && e.dataTransfer.files.length) openUpload([...e.dataTransfer.files]);
		};
		window.addEventListener("dragenter", enter);
		window.addEventListener("dragleave", leave);
		window.addEventListener("dragover", over);
		window.addEventListener("drop", drop);
		return () => {
			window.removeEventListener("dragenter", enter);
			window.removeEventListener("dragleave", leave);
			window.removeEventListener("dragover", over);
			window.removeEventListener("drop", drop);
		};
	}, [upload.open]);

	const all = data?.files ?? [];
	const q = searchTerm.trim().toLowerCase();
	const files = all
		.filter((f) => f.name.toLowerCase().includes(q))
		.sort((a, b) =>
			a.isDirectory !== b.isDirectory
				? a.isDirectory ? -1 : 1
				: new Date(b.modified) - new Date(a.modified),
		);
	const fileCount = all.filter((f) => !f.isDirectory).length;
	const totalBytes = all.reduce((n, f) => n + (f.isDirectory ? 0 : f.size), 0);

	const select = (file) => {
		setSelected(file);
		setInfoOpen(true);
	};

	return (
		<div className="flex min-h-dvh flex-col bg-[var(--surface-0)] text-[var(--text-hi)]">
			<Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

			<main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-12 sm:px-6 sm:pt-8">
				<Stagger>
				<StaggerItem>
				<Dock
					excited={pageDrag || upload.open}
					dragOver={pageDrag}
					onChoose={() => openUpload()}
				/>
				</StaggerItem>

				<StaggerItem>
				<div className="mt-8 mb-3 flex items-end justify-between gap-4">
					<h2 className="text-[15px] font-semibold">Hosted files</h2>
					{data && (
						<p className="num text-[13px] text-[var(--text-low)]">
							{q
								? `${files.length} of ${all.length} match`
								: `${fileCount} file${fileCount === 1 ? "" : "s"}, ${formatBytes(totalBytes)}`}
						</p>
					)}
				</div>

				{isLoading && (
					<div className="surface space-y-px overflow-hidden rounded-lg" aria-busy="true" aria-label="Loading files">
						{[0, 1, 2].map((i) => (
							<div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
								<span className="h-9 w-9 rounded-lg bg-[var(--color-shade)]" />
								<span className="h-3.5 w-48 rounded bg-[var(--color-shade)]" />
							</div>
						))}
					</div>
				)}

				{error && !data && (
					<Notice title="Couldn't load the file list" tone="bad">
						<p>{error.message}</p>
						<button
							type="button"
							onClick={() => mutate()}
							className="btn-ghost mt-4 inline-flex h-[34px] items-center px-4 text-[13px] font-medium"
						>
							Try again
						</button>
					</Notice>
				)}

				{data && files.length === 0 &&
					(q ? (
						<Notice title={`Nothing named “${searchTerm.trim()}”`}>
							Check the spelling or clear the search to see every file.
						</Notice>
					) : (
						<Notice title="Nothing hosted yet">
							Upload the first file and its link will show up here.
						</Notice>
					))}

				{data && files.length > 0 && (
					<FileList files={files} fresh={fresh} onSelect={select} />
				)}
				</StaggerItem>
				</Stagger>
			</main>

			<footer className="flex items-center justify-center gap-2 border-t border-[var(--stroke)] py-5 text-[13px] text-[var(--text-low)]">
				<span>ezhost</span>
				<span aria-hidden="true">·</span>
				<a
					href="https://github.com/c4lyp5o"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="c4lyp5o on GitHub"
					title="c4lyp5o on GitHub"
					className="rounded p-1 transition-colors hover:text-[var(--text-hi)]"
				>
					<IconGithub size={16} />
				</a>
			</footer>

			{/* Page-wide drop overlay: the whole window becomes the dock. */}
			<AnimatePresence>
				{pageDrag && !upload.open && (
					<motion.div
						className="pointer-events-none fixed inset-3 z-[60] flex items-center justify-center rounded-xl border border-dashed border-accent bg-[var(--surface-0)]/90"
						initial={{ opacity: 0, scale: 1.02 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 1.02 }}
						transition={{ duration: 0.16 }}
					>
						<p className="px-6 text-center text-[30px] font-semibold">
							Drop to upload
						</p>
					</motion.div>
				)}
			</AnimatePresence>

			<UploadModal
				key={upload.session}
				open={upload.open}
				initialFiles={upload.files}
				onClose={() => setUpload((u) => ({ ...u, open: false }))}
				onUploaded={(names) => {
					setUpload((u) => ({ ...u, open: false }));
					setFresh(new Set(names));
					setSearchTerm("");
					mutate();
				}}
			/>

			<FileInfoModal file={selected} open={infoOpen} onClose={() => setInfoOpen(false)} />
		</div>
	);
};

export default App;
