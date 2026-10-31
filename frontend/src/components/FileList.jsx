// The manifest: one row per file. The whole row opens details; "Copy link"
// is right there on the row, since copying the link is the main job.
// Rows animate into place when the list re-sorts or filters (Motion layout);
// rows from the latest upload get a brief label-yellow wash.
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "react-toastify";
import { absoluteUrl, useCopy } from "../hooks.js";
import { formatBytes, formatDate, formatRelative, getFileIcon } from "../utils.js";
import { IconFolder, IconCopy, IconCheck } from "./Icons.jsx";

const CopyLink = ({ file }) => {
	const [copied, copy] = useCopy();
	return (
		<button
			type="button"
			onClick={async () => {
				if (await copy(absoluteUrl(file.url))) toast.success(`Link to ${file.name} copied`);
			}}
			aria-label={`Copy link to ${file.name}`}
			className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition ${
				copied
					? "bg-[var(--label)] text-[var(--label-ink)]"
					: "text-[var(--text-mid)] hover:bg-[var(--surface-2)] hover:text-[var(--text-hi)]"
			}`}
		>
			{copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
			<span className="hidden sm:inline">{copied ? "Copied" : "Copy link"}</span>
		</button>
	);
};

const FileList = ({ files, fresh, onSelect }) => {
	const reduce = useReducedMotion();
	return (
		<ul className="surface divide-y divide-[var(--stroke)] overflow-hidden rounded-2xl">
			<AnimatePresence initial={false}>
				{files.map((file) => {
					const FileIcon = file.isDirectory ? IconFolder : getFileIcon(file.name);
					return (
						<motion.li
							key={file.name}
							layout={reduce ? false : "position"}
							initial={reduce ? false : { opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							className={`flex items-center gap-1 pr-2 ${fresh?.has(file.name) ? "row-fresh" : ""}`}
						>
							<button
								type="button"
								onClick={() => onSelect(file)}
								className="flex min-w-0 flex-1 items-center gap-3.5 py-3 pr-2 pl-4 text-left transition-colors hover:bg-[var(--surface-2)]/60 sm:pl-5"
							>
								<span
									className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
										file.isDirectory
											? "bg-[var(--surface-2)] text-[var(--label-text)]"
											: "bg-[var(--surface-2)] text-[var(--text-mid)]"
									}`}
								>
									<FileIcon size={18} />
								</span>
								<span className="min-w-0 flex-1">
									<span className="block truncate text-[15px] font-medium text-[var(--text-hi)]">
										{file.name}
									</span>
									<span className="num mt-0.5 flex gap-3 text-[13px] text-[var(--text-low)] sm:hidden">
										<span>{file.isDirectory ? "Folder" : formatBytes(file.size)}</span>
										<span>{formatRelative(file.modified)}</span>
									</span>
								</span>
								<span className="num hidden w-24 shrink-0 text-right text-[13px] text-[var(--text-mid)] sm:block">
									{file.isDirectory ? "Folder" : formatBytes(file.size)}
								</span>
								<span
									className="num hidden w-32 shrink-0 text-right text-[13px] text-[var(--text-low)] sm:block"
									title={formatDate(file.modified)}
								>
									{formatRelative(file.modified)}
								</span>
							</button>
							{file.isDirectory ? (
								<span aria-hidden="true" className="w-9 shrink-0 sm:w-[106px]" />
							) : (
								<CopyLink file={file} />
							)}
						</motion.li>
					);
				})}
			</AnimatePresence>
		</ul>
	);
};

export default FileList;
