// EZHOST 2.0 — file hosting, ezjot-themed, dark-first with a light toggle.
import { useState } from "react";
import useSWR from "swr";
import Header from "./components/Header.jsx";
import FileList from "./components/FileList.jsx";
import UploadModal from "./components/UploadModal.jsx";
import FileInfoModal from "./components/FileInfoModal.jsx";

const fetcher = (url) => fetch(url).then((res) => res.json());

const App = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedFile, setSelectedFile] = useState(null);
	const [showUpload, setShowUpload] = useState(false);

	const { data, error, isLoading, mutate } = useSWR("/api/v1/files", fetcher);

	const files = (data?.files ?? [])
		.filter((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
		.sort((a, b) => new Date(b.modified) - new Date(a.modified));

	return (
		<div className="flex min-h-screen flex-col bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
			<Header
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				onUpload={() => setShowUpload(true)}
			/>

			<main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
				{isLoading && (
					<div className="flex h-64 items-center justify-center text-sm text-stone-500 dark:text-stone-400">
						<span className="animate-pulse">Loading files…</span>
					</div>
				)}

				{error && (
					<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
						Failed to load files — is the API up?
					</div>
				)}

				{!isLoading && !error && files.length === 0 && (
					<div className="flex h-64 flex-col items-center justify-center gap-2 text-stone-500 dark:text-stone-400">
						<span className="text-4xl" aria-hidden>
							🗂️
						</span>
						<p className="text-sm">
							{searchTerm ? "No files match your search" : "Nothing hosted yet"}
						</p>
					</div>
				)}

				{!isLoading && !error && files.length > 0 && (
					<FileList files={files} onSelect={setSelectedFile} />
				)}
			</main>

			<footer className="border-t border-stone-200 py-4 text-center text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
				EZHOST 2.0 · {files.length} file{files.length !== 1 ? "s" : ""} · by c4lyp5o
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
				<FileInfoModal file={selectedFile} onClose={() => setSelectedFile(null)} />
			)}
		</div>
	);
};

export default App;
