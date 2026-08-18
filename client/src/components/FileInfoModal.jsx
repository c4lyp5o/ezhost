// File info sheet — bottom sheet on mobile, centered card on desktop.
// Offers the shareable URL and a copy action.
import { useState } from "react";
import { formatBytes, getFileIcon } from "../utils.js";

const FileInfoModal = ({ file, onClose }) => {
	const [copied, setCopied] = useState(false);
	const url = new URL(file.url, window.location.origin).href;

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			/* clipboard blocked — the open button still works */
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
			onClick={onClose}
		>
			<div
				className="w-full rounded-t-2xl border border-stone-200 bg-white p-6 shadow-xl sm:max-w-md sm:rounded-xl dark:border-stone-700 dark:bg-stone-900"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mb-4 text-center">
					<div className="mb-2 text-5xl" aria-hidden>
						{file.isDirectory ? "📁" : getFileIcon(file.name)}
					</div>
					<h2 className="break-all text-lg font-medium text-stone-900 dark:text-stone-100">
						{file.name}
					</h2>
					<p className="text-sm text-stone-500 dark:text-stone-400">
						{file.isDirectory ? "Folder" : formatBytes(file.size)}
					</p>
				</div>

				{!file.isDirectory && (
					<div className="mb-4 flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 p-2 dark:border-stone-700 dark:bg-stone-950">
						<span className="min-w-0 flex-1 truncate px-1 text-xs text-stone-500 dark:text-stone-400">
							{url}
						</span>
						<button
							type="button"
							onClick={copy}
							className="shrink-0 rounded-md bg-stone-800 px-3 py-2 text-xs font-medium text-white transition hover:bg-stone-700 dark:bg-stone-700 dark:hover:bg-stone-600"
						>
							{copied ? "Copied ✓" : "Copy"}
						</button>
					</div>
				)}

				<div className="flex gap-3">
					{!file.isDirectory && (
						<a
							href={url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex-1 rounded-md bg-purple-600 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-purple-500"
						>
							Open
						</a>
					)}
					<button
						type="button"
						onClick={onClose}
						className="flex-1 rounded-md border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

export default FileInfoModal;
