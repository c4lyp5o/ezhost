// File details: image preview when it's an image, the public link with
// copy, size/date/type, and Open. Folders get a short explanation instead.
import { useState } from "react";
import { absoluteUrl, useCopy } from "../hooks.js";
import { formatBytes, formatDate, getFileIcon } from "../utils.js";
import Dialog from "./Dialog.jsx";
import { IconFolder, IconCopy, IconCheck, IconExternal, IconX } from "./Icons.jsx";

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif"]);
const extOf = (name) => (name.includes(".") ? name.split(".").pop().toLowerCase() : "");

const Meta = ({ label, children }) => (
	<div>
		<dt className="text-[12.5px] text-[var(--text-low)]">{label}</dt>
		<dd className="num mt-0.5 text-sm text-[var(--text-hi)]">{children}</dd>
	</div>
);

const Preview = ({ src, name }) => {
	const [failed, setFailed] = useState(false);
	if (failed) return null;
	return (
		<div className="mb-5 flex max-h-64 items-center justify-center overflow-hidden rounded-xl border border-[var(--stroke)] bg-[repeating-conic-gradient(var(--surface-2)_0%_25%,transparent_0%_50%)] bg-[length:20px_20px]">
			<img
				src={src}
				alt={`Preview of ${name}`}
				className="max-h-64 w-auto object-contain"
				onError={() => setFailed(true)}
			/>
		</div>
	);
};

const FileInfoModal = ({ file, open, onClose }) => {
	const [copied, copy] = useCopy();
	if (!file) return null;
	const url = absoluteUrl(file.url);
	const ext = extOf(file.name);
	const FileIcon = file.isDirectory ? IconFolder : getFileIcon(file.name);

	return (
		<Dialog open={open} onClose={onClose} labelledBy="file-title" wide>
			<div className="mb-5 flex items-start gap-3">
				<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--label)] text-[var(--label-ink)]">
					<FileIcon size={21} />
				</span>
				<div className="min-w-0 flex-1">
					<h2 id="file-title" className="display truncate text-xl font-bold">
						{file.name}
					</h2>
					<p className="text-[13px] text-[var(--text-mid)]">
						{file.isDirectory ? "Folder" : formatBytes(file.size)}
					</p>
				</div>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close"
					className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-mid)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-hi)]"
				>
					<IconX size={17} />
				</button>
			</div>

			{file.isDirectory ? (
				<p className="mb-5 text-sm text-[var(--text-mid)]">
					Folders are created by the admin to keep things organised. Uploads go
					to the main list.
				</p>
			) : (
				<>
					{IMAGE_EXT.has(ext) && <Preview src={url} name={file.name} />}

					<dl className="mb-5 grid grid-cols-3 gap-4">
						<Meta label="Size">{formatBytes(file.size)}</Meta>
						<Meta label="Type">{ext ? `.${ext}` : "None"}</Meta>
						<Meta label="Uploaded">{formatDate(file.modified)}</Meta>
					</dl>

					<div className="mb-5 flex items-center gap-2 rounded-xl border border-[var(--stroke)] bg-[var(--surface-2)]/50 p-1.5 pl-3">
						<span className="url min-w-0 flex-1 truncate text-[var(--text-mid)]">{url}</span>
						<button
							type="button"
							onClick={() => copy(url)}
							className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
								copied ? "bg-[var(--label)] text-[var(--label-ink)]" : "btn-ghost"
							}`}
						>
							{copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
							{copied ? "Copied" : "Copy link"}
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
						className="btn-label inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px]"
					>
						<IconExternal size={16} />
						Open file
					</a>
				)}
				<button
					type="button"
					onClick={onClose}
					className={`btn-ghost rounded-xl px-4 py-3 text-[15px] font-medium ${
						file.isDirectory ? "flex-1" : ""
					}`}
				>
					Close
				</button>
			</div>
		</Dialog>
	);
};

export default FileInfoModal;
