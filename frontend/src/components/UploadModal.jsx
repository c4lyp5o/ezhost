// Upload modal — bottom sheet on mobile, centered card on desktop.
// Supports multi-select, drag & drop and shows progress while uploading.
import { useRef, useState } from "react";
import { toast } from "react-toastify";

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
			toast.success(`Uploaded ${json.files.length} file${json.files.length !== 1 ? "s" : ""} 🎉`);
			setTimeout(onUploaded, 700); // let the success bar render before closing
		} catch (err) {
			toast.error(err.message || "Upload failed");
			setUploading(false);
			setProgress(0);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
			onClick={() => !uploading && onClose()}
		>
			<div
				className="w-full rounded-t-2xl border border-stone-200 bg-white p-6 shadow-xl sm:max-w-md sm:rounded-xl dark:border-stone-700 dark:bg-stone-900"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">
						Upload Files
					</h2>
					<button
						type="button"
						onClick={onClose}
						disabled={uploading}
						aria-label="Close"
						className="flex h-9 w-9 items-center justify-center rounded-md text-lg text-stone-500 transition hover:bg-stone-100 disabled:opacity-40 dark:hover:bg-stone-800"
					>
						✕
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
					className={`block cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition ${
						dragOver
							? "border-purple-500 bg-purple-500/10"
							: "border-stone-300 hover:border-purple-400 dark:border-stone-700"
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
					<div className="text-3xl" aria-hidden>
						📤
					</div>
					<p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
						Tap to choose files or drop them here
					</p>
					<p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
						Anything goes — they land under /static/
					</p>
				</label>

				{/* Pending selection */}
				{files.length > 0 && (
					<ul className="mt-3 max-h-32 space-y-1 overflow-y-auto">
						{files.map((f, i) => (
							<li
								key={`${f.name}-${i}`}
								className="flex items-center justify-between rounded-md bg-stone-100 px-3 py-1.5 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-300"
							>
								<span className="min-w-0 truncate">{f.name}</span>
								<span className="ml-2 shrink-0 text-stone-500 dark:text-stone-400">
									{(f.size / 1024).toFixed(1)} KB
								</span>
							</li>
						))}
					</ul>
				)}

				{/* Progress */}
				{uploading && (
					<div className="mt-4">
						<div className="h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
							<div
								className="h-full rounded-full bg-purple-500 transition-all"
								style={{ width: `${progress}%` }}
							/>
						</div>
						<p className="mt-1 text-center text-xs text-stone-500 dark:text-stone-400">
							Uploading... {progress}%
						</p>
					</div>
				)}

				<button
					type="button"
					onClick={upload}
					disabled={!files.length || uploading}
					className="mt-4 w-full rounded-md bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
				>
					{uploading ? "Uploading…" : `Upload ${files.length ? `(${files.length})` : ""}`}
				</button>
			</div>
		</div>
	);
};

export default UploadModal;
