// EZHOST 2.0 — file hosting. Linear-grade dark console, dark-first w/ light toggle.
import { useState } from "react";
import useSWR from "swr";
import Header from "./components/Header.jsx";
import FileList from "./components/FileList.jsx";
import UploadModal from "./components/UploadModal.jsx";
import FileInfoModal from "./components/FileInfoModal.jsx";
import { IconInbox, IconBox } from "./components/Icons.jsx";

const fetcher = (url) => fetch(url).then((res) => res.json());

const EmptyState = ({ searching }) => (
	<div className="surface flex h-64 flex-col items-center justify-center gap-3 rounded-xl text-center">
		<span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-low)] ring-1 ring-[var(--stroke)]">
			{searching ? <IconBox size={24} /> : <IconInbox size={24} />}
		</span>
		<p className="text-sm font-medium text-[var(--text-mid)]">
			{searching ? "No files match your search" : "Nothing hosted yet"}
		</p>
		{!searching && (
			<p className="max-w-xs text-xs text-[var(--text-low)]">
				Drop files here or hit <span className="mono">Upload</span> to start
				sharing them with a link.
			</p>
		)}
	</div>
);

const App = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedFile, setSelectedFile] = useState(null);
	const [showUpload, setShowUpload] = useState(false);

	const { data, error, isLoading, mutate } = useSWR("/api/v1/files", fetcher);

	const files = (data?.files ?? [])
		.filter((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
		.sort((a, b) => new Date(b.modified) - new Date(a.modified));

	return (
		<div className="flex min-h-screen flex-col bg-[var(--surface-0)] text-[var(--text-hi)]">
			<Header
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				onUpload={() => setShowUpload(true)}
			/>

			<main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
				{isLoading && (
					<div className="flex h-64 items-center justify-center text-sm text-[var(--text-low)]">
						<span className="animate-pulse">Loading files…</span>
					</div>
				)}

				{error && (
					<div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-400">
						Failed to load files — is the API up?
					</div>
				)}

				{!isLoading && !error && files.length === 0 && (
					<EmptyState searching={!!searchTerm} />
				)}

				{!isLoading && !error && files.length > 0 && (
					<FileList files={files} onSelect={setSelectedFile} />
				)}
			</main>

			<footer className="border-t border-[var(--stroke)] py-4 text-center text-xs text-[var(--text-low)]">
				<span className="font-medium accent-text">ezhost</span> ·{" "}
				{files.length} file{files.length !== 1 ? "s" : ""} · by c4lyp5o
			</footer>

			{showUpload && (
				<UploadModal
					onClose={() => setShowUpload(false)}
					onUploaded={() => {
						setShowUpload(false);
						mutate();
					}}
				/>
			)}

			{selectedFile && (
				<FileInfoModal
					file={selectedFile}
					onClose={() => setSelectedFile(null)}
				/>
			)}
		</div>
	);
};

export default App;