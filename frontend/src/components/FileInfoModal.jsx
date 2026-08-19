// File info sheet — bottom sheet on mobile, centered card on desktop.
// Offers the shareable URL, copy action and an external open link.
import { useState } from "react";
import { formatBytes, getFileIcon } from "../utils.js";
import {
	IconFolder,
	IconCopy,
	IconCheck,
	IconExternal,
	IconX,
} from "./Icons.jsx";

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

	const FileIcon = getFileIcon(file.name);
	const Meta = ({ label, value }) => (
		<div>
			<dt className="text-[11px] uppercase tracking-wider text-[var(--text-low)]">
				{label}
			</dt>
			<dd className="mono mt-0.5 text-xs text-[var(--text-hi)]">{value}</dd>
		</div>
	);

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] sm:items-center"
			onClick={onClose}
		>
			<div
				className="surface w-full rounded-t-2xl p-6 shadow-2xl sm:max-w-md sm:rounded-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mb-5 flex items-start justify-between gap-3">
					<div className="flex items-center gap-3">
						<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--surface-2)] ring-1 ring-[var(--stroke)]">
							{file.isDirectory ? (
								<IconFolder size={22} className="accent-text" />
							) : (
								<FileIcon size={21} className="accent-text" />
							)}
						</span>
						<div className="min-w-0">
							<h2 className="truncate text-sm font-semibold tracking-tight text-[var(--text-hi)]">
								{file.name}
							</h2>
							<p className="text-xs text-[var(--text-mid)]">
								{file.isDirectory ? "Folder" : formatBytes(file.size)}
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-mid)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-hi)]"
					>
						<IconX size={16} />
					</button>
				</div>

				{!file.isDirectory && (
					<>
						<dl className="mb-4 grid grid-cols-2 gap-4">
							<Meta label="Size" value={formatBytes(file.size)} />
							<Meta label="Modified" value={formatDateOnly(file)} />
						</dl>

						<div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--stroke)] bg-[var(--surface-2)]/50 p-1.5 pl-3">
							<span className="mono min-w-0 flex-1 truncate text-xs text-[var(--text-mid)]">
								{url}
							</span>
							<button
								type="button"
								onClick={copy}
								className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
									copied
										? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
										: "btn-ghost"
								}`}
							>
								{copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
								{copied ? "Copied" : "Copy"}
							</button>
						</div>
					</>
				)}

				<div className="flex gap-3">
					{!file.isDirectory && (
						<a
							href={url}
							target="_blank"
							rel="noopener noreferrer"
							className="btn-accent inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium"
						>
							<IconExternal size={15} />
							Open
						</a>
					)}
					<button
						type="button"
						onClick={onClose}
						className={`btn-ghost rounded-lg px-4 py-2.5 text-sm font-medium ${
							file.isDirectory ? "flex-1" : ""
						}`}
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

const formatDateOnly = (file) =>
	new Date(file.modified).toLocaleString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

export default FileInfoModal;