// File list — refined table: icon, name, meta columns. Row hover lifts the
// surface; icon colour is derived from file type (single accent, restrained).
import { formatBytes, formatDate, getFileIcon } from "../utils.js";
import { IconFolder, IconChevron } from "./Icons.jsx";

const FileList = ({ files, onSelect }) => (
	<ul className="surface overflow-hidden rounded-xl">
		{/* Header row */}
		<li className="flex items-center gap-3 border-b border-[var(--stroke)] bg-[var(--surface-2)]/60 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-low)]">
			<span className="flex-1">Name</span>
			<span className="hidden w-40 shrink-0 text-right sm:block">Modified</span>
			<span className="hidden w-24 shrink-0 text-right sm:block">Size</span>
			<span className="w-4" />
		</li>
		{files.map((file) => {
			const FileIcon = getFileIcon(file.name);
			return (
				<li key={file.name}>
					<button
						type="button"
						onClick={() => onSelect(file)}
						className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)] focus:outline-none focus-visible:bg-[var(--surface-2)]"
					>
						<span className="flex items-center justify-center text-[var(--text-low)] transition-colors group-hover:text-[var(--accent)]">
							{file.isDirectory ? (
								<IconFolder size={19} className="accent-text" />
							) : (
								<FileIcon size={18} />
							)}
						</span>

						<span className="min-w-0 flex-1">
							<span className="block truncate text-sm font-medium text-[var(--text-hi)]">
								{file.name}
							</span>
							<span className="block text-xs text-[var(--text-mid)] sm:hidden">
								{file.isDirectory ? "Folder" : formatBytes(file.size)} ·{" "}
								{formatDate(file.modified)}
							</span>
						</span>

						<span className="mono hidden w-40 shrink-0 text-right text-xs text-[var(--text-mid)] sm:block">
							{formatDate(file.modified)}
						</span>
						<span className="mono hidden w-24 shrink-0 text-right text-xs text-[var(--text-mid)] sm:block">
							{file.isDirectory ? "Folder" : formatBytes(file.size)}
						</span>

						<span className="w-4 text-[var(--text-low)] opacity-0 transition-opacity group-hover:opacity-100">
							<IconChevron size={16} />
						</span>
					</button>
				</li>
			);
		})}
	</ul>
);

export default FileList;