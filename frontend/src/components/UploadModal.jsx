// Upload modal — bottom sheet on mobile, centered card on desktop.
// Supports multi-select, drag & drop, live progress and a designed drop zone.
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import {
	IconUpload,
	IconX,
	IconCloud,
	IconCheck,
	IconLoader,
} from "./Icons.jsx";
import { formatBytes } from "../utils.js";

const UploadModal = ({ onClose, onUploaded }) => {
	const [files, setFiles] = useState([]);
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [dragOver, setDragOver] = useState(false);
	const inputRef = useRef(null);

	const pick = (list) => {
		const picked = Array.from(list || []);
		if (picked.length) setFiles((prev) => [...prev, ...picked]);
	};

	const remove = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

	const upload = async () => {
		if (!files.length) return;

		const form = new FormData();
		for (const f of files) form.append("files", f);

		setUploading(true);
		setProgress(0);
		try {
			const res = await fetch("/api/v1/upload", { method: "POST", body: form });
			const json = await res.json();
			if (!res.ok) throw new Error(json.message || "Upload failed");

			setProgress(100);
			toast.success(
				`Uploaded ${json.files.length} file${json.files.length !== 1 ? "s" : ""}`
			);
			setTimeout(onUploaded, 600); // let the success state render before closing
		} catch (err) {
			toast.error(err.message || "Upload failed");
			setUploading(false);
			setProgress(0);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] sm:items-center"
			onClick={() => !uploading && onClose()}
		>
			<div
				className="surface w-full rounded-t-2xl p-6 shadow-2xl sm:max-w-md sm:rounded-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-base font-semibold tracking-tight text-[var(--text-hi)]">
						Upload Files
					</h2>
					<button
						type="button"
						onClick={onClose}
						disabled={uploading}
						aria-label="Close"
						className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-mid)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-hi)] disabled:opacity-40"
					>
						<IconX size={16} />
					</button>
				</div>

				{/* Drop zone */}
				<label
					onDragOver={(e) => {
						e.preventDefault();
						setDragOver(true);
					}}
					onDragLeave={() => setDragOver(false)}
					onDrop={(e) => {
						e.preventDefault();
						setDragOver(false);
						pick(e.dataTransfer.files);
					}}
					className={`block cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
						dragOver
							? "border-[var(--accent)] bg-[var(--accent-soft)]"
							: "border-[var(--stroke-strong)] hover:border-[var(--accent)]/60 hover:bg-[var(--surface-2)]/50"
					}`}
				>
					<input
						ref={inputRef}
						type="file"
						multiple
						onChange={(e) => pick(e.target.files)}
						disabled={uploading}
						className="hidden"
					/>
					<span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--accent)] ring-1 ring-[var(--stroke)]">
						<IconCloud size={22} />
					</span>
					<p className="mt-3 text-sm font-medium text-[var(--text-hi)]">
						Tap to choose files or drop them here
					</p>
					<p className="mt-1 text-xs text-[var(--text-low)]">
						Anything goes — they land under a shareable link
					</p>
				</label>

				{/* Selected files */}
				{files.length > 0 && (
					<ul className="mt-4 space-y-2">
						{files.map((f, i) => (
							<li
								key={`${f.name}-${i}`}
								className="flex items-center gap-3 rounded-lg border border-[var(--stroke)] bg-[var(--surface-2)]/40 px-3 py-2"
							>
								<span className="mono min-w-0 flex-1 truncate text-xs text-[var(--text-hi)]">
									{f.name}
								</span>
								<span className="mono shrink-0 text-[11px] text-[var(--text-low)]">
									{formatBytes(f.size)}
								</span>
								<button
									type="button"
									onClick={() => remove(i)}
									disabled={uploading}
									className="shrink-0 text-[var(--text-low)] transition hover:text-[var(--bad)] disabled:opacity-40"
									aria-label={`Remove ${f.name}`}
								>
									<IconX size={14} />
								</button>
							</li>
						))}
					</ul>
				)}

				{uploading && (
					<div className="mt-4">
						<div className="h-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
							<div
								className="h-full rounded-full bg-[var(--accent)] transition-all duration-200"
								style={{ width: `${progress}%` }}
							/>
						</div>
						<p className="mt-2 text-center text-xs text-[var(--text-low)]">
							{progress < 100 ? "Uploading…" : "Done"}
						</p>
					</div>
				)}

				<div className="mt-5 flex gap-3">
					<button
						type="button"
						onClick={upload}
						disabled={!files.length || uploading}
						className="btn-accent inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
					>
						{uploading && progress >= 100 ? (
							<IconCheck size={15} />
						) : uploading ? (
							<IconLoader size={15} />
						) : (
							<IconUpload size={15} />
						)}
						{uploading && progress >= 100
							? "Done"
							: uploading
							? "Uploading…"
							: "Upload"}
					</button>
					<button
						type="button"
						onClick={onClose}
						disabled={uploading}
						className="btn-ghost flex-1 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-40"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
};

export default UploadModal;