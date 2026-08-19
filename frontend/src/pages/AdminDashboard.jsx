// Admin dashboard — React port of the old server-rendered DASHBOARD_HTML.
// Lists files (same /api/v1/files payload the public browser uses), plus the
// admin-only destructive actions: delete file, create folder, logout. All
// admin API calls carry the httpOnly auth cookie automatically (same-origin).
import { useState } from "react";
import useSWR from "swr";
import { useNavigate } from "react-router-dom";
import { logout } from "../auth.js";
import { formatBytes, formatDate, getFileIcon } from "../utils.js";

const fetcher = (url) => fetch(url).then((res) => res.json());

const AdminDashboard = () => {
	const [folderPath, setFolderPath] = useState("");
	const [notice, setNotice] = useState("");
	const [error, setError] = useState("");
	const navigate = useNavigate();
	const { data, error: loadError, isLoading, mutate } = useSWR(
		"/api/v1/files",
		fetcher,
	);
	const files = data?.files ?? [];

	const deleteFile = async (name) => {
		if (!confirm(`Delete ${name}?`)) return;
		setError("");
		setNotice("");
		try {
			const res = await fetch(
				`/api/v1/admin/files/${encodeURIComponent(name)}`,
				{ method: "DELETE" },
			);
			if (!res.ok) throw new Error((await res.json()).message || "Delete failed");
			setNotice(`Deleted ${name}`);
			mutate();
		} catch (err) {
			setError(err.message);
		}
	};

	const createDir = async (e) => {
		e.preventDefault();
		const path = folderPath.trim();
		if (!path) return;
		setError("");
		setNotice("");
		try {
			const res = await fetch("/api/v1/admin/dirs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ path }),
			});
			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				throw new Error(json.message || "Failed to create folder");
			}
			setNotice(`Created folder ${path}`);
			setFolderPath("");
			mutate();
		} catch (err) {
			setError(err.message);
		}
	};

	const doLogout = async () => {
		await logout().catch(() => {});
		navigate("/login", { replace: true });
	};

	return (
		<div className="flex min-h-screen bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
			{/* Sidebar */}
			<aside className="flex w-60 shrink-0 flex-col border-r border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
				<h1 className="text-xl font-bold tracking-tight">
					EZHOST <span className="text-purple-500">2.0</span>
				</h1>
				<p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
					Logged in as <span className="font-medium">admin</span>
				</p>
				<div className="mt-auto">
					<a
						href="/app"
						className="mb-3 block rounded-md border border-stone-200 px-3 py-2 text-center text-sm font-medium text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
					>
						↗ Public file browser
					</a>
					<button
						type="button"
						onClick={doLogout}
						className="w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500"
					>
						Logout
					</button>
				</div>
			</aside>

			{/* Content */}
			<main className="flex-1 overflow-y-auto p-6">
				<h2 className="text-lg font-semibold">File Management</h2>

				{(notice || error) && (
					<div
						className={`mt-4 rounded-md border px-3 py-2 text-sm ${
							error
								? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
								: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400"
						}`}
					>
						{error || notice}
					</div>
				)}

				<div className="mt-4 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
					<ul className="divide-y divide-stone-200 dark:divide-stone-800">
						{isLoading && (
							<li className="px-4 py-6 text-center text-sm text-stone-500 dark:text-stone-400">
								<span className="animate-pulse">Loading files…</span>
							</li>
						)}
						{loadError && (
							<li className="px-4 py-6 text-center text-sm text-red-600 dark:text-red-400">
								Failed to load files — is the API up?
							</li>
						)}
						{!isLoading && !loadError && files.length === 0 && (
							<li className="px-4 py-6 text-center text-sm text-stone-500 dark:text-stone-400">
								No files yet.
							</li>
						)}
						{files.map((f) => (
							<li
								key={f.name}
								className="flex items-center gap-3 px-4 py-3"
							>
								<span className="text-xl" aria-hidden>
									{f.isDirectory ? "📁" : getFileIcon(f.name)}
								</span>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
										{f.name}
									</p>
									<p className="text-xs text-stone-500 dark:text-stone-400">
										{f.isDirectory ? "Folder" : formatBytes(f.size)}
										{f.isDirectory ? "" : ` · ${formatDate(f.modified)}`}
									</p>
								</div>
								<button
									type="button"
									onClick={() => deleteFile(f.name)}
									className="shrink-0 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-red-500"
								>
									Delete
								</button>
							</li>
						))}
					</ul>
				</div>

				{/* Create folder */}
				<form
					onSubmit={createDir}
					className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end"
				>
					<label className="flex flex-1 flex-col gap-1 text-sm">
						<span className="font-medium text-stone-700 dark:text-stone-300">
							Create new folder
						</span>
						<input
							type="text"
							value={folderPath}
							onChange={(e) => setFolderPath(e.target.value)}
							placeholder="e.g. /docs/2026"
							className="rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
						/>
					</label>
					<button
						type="submit"
						className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-500"
					>
						Create Folder
					</button>
				</form>
			</main>
		</div>
	);
};

export default AdminDashboard;