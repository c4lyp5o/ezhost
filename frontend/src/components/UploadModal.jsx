// Upload sheet: pick or drop files, see problems before sending (blocked
// type, over 100 MB, empty), then upload with real progress.
import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "react-toastify";
import { uploadFiles } from "../api.js";
import { fileProblem, formatBytes } from "../utils.js";
import Dialog from "./Dialog.jsx";
import { IconUpload, IconX, IconCloud, IconCheck, IconLoader } from "./Icons.jsx";

const keyOf = (f) => `${f.name}:${f.size}:${f.lastModified}`;

const UploadModal = ({ open, initialFiles, onClose, onUploaded }) => {
	const [files, setFiles] = useState(initialFiles ?? []);
	const [phase, setPhase] = useState("idle"); // idle | uploading | done
	const [progress, setProgress] = useState(0);
	const [dragOver, setDragOver] = useState(false);
	const inputRef = useRef(null);
	const reduce = useReducedMotion();
	const busy = phase !== "idle";

	const pick = (list) => {
		const picked = Array.from(list || []);
		if (!picked.length) return;
		setFiles((prev) => {
			const seen = new Set(prev.map(keyOf));
			return [...prev, ...picked.filter((f) => !seen.has(keyOf(f)))];
		});
	};
	const remove = (key) => setFiles((prev) => prev.filter((f) => keyOf(f) !== key));

	const problems = files.map(fileProblem);
	const blocked = problems.filter(Boolean).length;
	const totalBytes = files.reduce((n, f) => n + f.size, 0);

	const upload = async () => {
		if (!files.length || blocked) return;
		setPhase("uploading");
		setProgress(0);
		try {
			const body = await uploadFiles(files, setProgress);
			setProgress(1);
			setPhase("done");
			const n = body.files.length;
			toast.success(`Uploaded ${n} file${n === 1 ? "" : "s"}`);
			setTimeout(() => onUploaded(body.files.map((f) => f.name)), reduce ? 0 : 650);
		} catch (err) {
			toast.error(err.message);
			setPhase("idle");
			setProgress(0);
		}
	};

	const pct = Math.round(progress * 100);

	return (
		<Dialog open={open} onClose={onClose} labelledBy="upload-title" dismissible={!busy}>
			<div className="mb-5 flex items-center justify-between">
				<h2 id="upload-title" className="text-[24px] font-semibold tracking-[-0.01em]">
					Upload files
				</h2>
				<button
					type="button"
					onClick={onClose}
					disabled={busy}
					aria-label="Close"
					className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-mid)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-hi)] disabled:opacity-40"
				>
					<IconX size={17} />
				</button>
			</div>

			<label
				data-over={dragOver}
				onDragOver={(e) => {
					e.preventDefault();
					setDragOver(true);
				}}
				onDragLeave={() => setDragOver(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragOver(false);
					if (!busy) pick(e.dataTransfer.files);
				}}
				className="dock-drop block cursor-pointer rounded-xl p-6 text-center has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-[var(--ring)]"
			>
				<input
					ref={inputRef}
					type="file"
					multiple
					onChange={(e) => {
						pick(e.target.files);
						e.target.value = "";
					}}
					disabled={busy}
					className="sr-only"
					data-autofocus
				/>
				<span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent-dim text-accent">
					<IconCloud size={22} />
				</span>
				<p className="mt-3 text-[15px] font-medium text-[var(--text-hi)]">
					Choose files or drop them here
				</p>
				<p className="mt-1 text-[13px] text-[var(--text-low)]">Up to 100 MB each</p>
			</label>

			{files.length > 0 && (
				<ul className="mt-4 max-h-56 space-y-1.5 overflow-y-auto">
					<AnimatePresence initial={false}>
						{files.map((f, i) => {
							const problem = problems[i];
							return (
								<motion.li
									key={keyOf(f)}
									layout={reduce ? false : "position"}
									initial={reduce ? false : { opacity: 0, x: -8 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 8 }}
									className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
										problem
											? "border-[var(--bad)]/50 bg-[var(--bad-soft)]"
											: "border-[var(--stroke)] bg-[var(--surface-2)]/40"
									}`}
								>
									<span className="min-w-0 flex-1">
										<span className="block truncate text-[13px] text-[var(--text-hi)]">{f.name}</span>
										{problem && (
											<span className="block text-[12.5px] text-[var(--bad)]">{problem}</span>
										)}
									</span>
									<span className="num shrink-0 text-[12.5px] text-[var(--text-low)]">
										{formatBytes(f.size)}
									</span>
									<button
										type="button"
										onClick={() => remove(keyOf(f))}
										disabled={busy}
										className="shrink-0 rounded p-1 text-[var(--text-low)] transition hover:text-[var(--bad)] disabled:opacity-40"
										aria-label={`Remove ${f.name}`}
									>
										<IconX size={14} />
									</button>
								</motion.li>
							);
						})}
					</AnimatePresence>
				</ul>
			)}

			{blocked > 0 && (
				<p className="mt-3 text-[13px] text-[var(--bad)]" role="alert">
					Remove {blocked === 1 ? "the file" : `the ${blocked} files`} marked in red to
					continue.
				</p>
			)}

			{busy && (
				<div className="mt-4" aria-live="polite">
					<div
						className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]"
						role="progressbar"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={pct}
						aria-label="Upload progress"
					>
						<motion.div
							className="hazard h-full rounded-full"
							initial={{ width: 0 }}
							animate={{ width: `${pct}%` }}
							transition={{ ease: "easeOut", duration: reduce ? 0 : 0.2 }}
						/>
					</div>
					<p className="num mt-2 flex justify-between text-[13px] text-[var(--text-low)]">
						<span>{phase === "done" ? "Uploaded" : "Uploading…"}</span>
						<span>{pct}%</span>
					</p>
				</div>
			)}

			<div className="mt-5 flex gap-3">
				<button
					type="button"
					onClick={upload}
					disabled={!files.length || blocked > 0 || busy}
					className="btn-label inline-flex flex-1 items-center justify-center gap-2 h-[34px] px-4 text-[13px]"
				>
					{phase === "done" ? (
						<IconCheck size={16} />
					) : phase === "uploading" ? (
						<IconLoader size={16} />
					) : (
						<IconUpload size={16} />
					)}
					{phase === "done"
						? "Uploaded"
						: phase === "uploading"
							? "Uploading…"
							: files.length
								? `Upload ${files.length} file${files.length === 1 ? "" : "s"} (${formatBytes(totalBytes)})`
								: "Upload"}
				</button>
				<button
					type="button"
					onClick={onClose}
					disabled={busy}
					className="btn-ghost h-[34px] px-4 text-[13px] font-medium disabled:opacity-40"
				>
					Cancel
				</button>
			</div>
		</Dialog>
	);
};

export default UploadModal;
