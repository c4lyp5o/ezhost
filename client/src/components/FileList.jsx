// File list — compact card rows that read as a table on desktop and stay
// thumb-friendly on mobile (meta line under the name below sm).
import { formatBytes, formatDate, getFileIcon } from "../utils.js";

const FileList = ({ files, onSelect }) => (
	<ul className="divide-y divide-stone-200 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
		{files.map((file) => (
			<li key={file.name}>
				<button
					type="button"
					onClick={() => onSelect(file)}
					className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-stone-50 focus:outline-none focus-visible:bg-stone-50 sm:py-3.5 dark:hover:bg-stone-800/70 dark:focus-visible:bg-stone-800/70"
				>
					<span className="text-2xl" aria-hidden>
						{file.isDirectory ? "📁" : getFileIcon(file.name)}
					</span>

					<span className="min-w-0 flex-1">
						<span className="block truncate text-sm font-medium text-stone-900 dark:text-stone-100">
							{file.name}
						</span>
						{/* Meta line — mobile only, desktop shows columns on the right */}
						<span className="block text-xs text-stone-500 sm:hidden dark:text-stone-400">
							{file.isDirectory ? "Folder" : formatBytes(file.size)} · {formatDate(file.modified)}
						</span>
					</span>

					<span className="hidden shrink-0 text-xs text-stone-500 sm:block dark:text-stone-400">
						{formatDate(file.modified)}
					</span>
					<span className="hidden w-24 shrink-0 text-right text-xs text-stone-500 sm:block dark:text-stone-400">
						{file.isDirectory ? "Folder" : formatBytes(file.size)}
					</span>

					<span className="text-stone-400" aria-hidden>
						›
					</span>
				</button>
			</li>
		))}
	</ul>
);

export default FileList;
