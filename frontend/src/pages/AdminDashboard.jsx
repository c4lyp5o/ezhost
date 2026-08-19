// Admin dashboard — file management console. Lists files (same payload the
// public browser uses), plus admin-only actions: delete, create folder, logout.
// Admin API calls carry the httpOnly auth cookie automatically (same-origin).
import { useState } from "react";
import useSWR from "swr";
import { useNavigate } from "react-router-dom";
import { logout } from "../auth.js";
import { formatBytes, formatDate, getFileIcon } from "../utils.js";
import {
	IconFolder,
	IconTrash,
	IconExternal,
	IconLogout,
	IconFolderPlus,
} from "../components/Icons.jsx";

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
		<div className="flex min-h-screen bg-[var(--surface-0)] text-[var(--text-hi)]">
			{/* Sidebar */}
			<aside className="flex w-60 shrink-0 flex-col border-r border-[var(--stroke)] bg-[var(--surface-1)] p-5">
				<div className="flex items-center gap-2.5">
					<span
						className="flex h-8 w-8 items-center justify-center rounded-[9px] font-bold"
						style={{
							background:
								"linear-gradient(135deg, var(--accent), var(--accent-strong))",
							color: "#fff",
							boxShadow: "0 0 0 1px var(--stroke), 0 8px 20px -10px var(--accent-ring)",
							fontSize: 15,
						}}
					>
						e
					</span>
					<span className="text-[15px] font-semibold tracking-tight">
						ezhost <span className="accent-text">admin</span>
					</span>
				</div>
				<p className="mt-1.5 text-xs text-[var(--text-low)]">
					Logged in as <span className="font-medium text-[var(--text-mid)]">admin</span>
				</p>

				<div className="mt-auto">
					<a
						href="/app"
						className="btn-ghost mb-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
					>
						<IconExternal size={15} />
						Public browser
					</a>
					<button
						type="button"
						onClick={doLogout}
						className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500/20 dark:text-red-400"
					>
						<IconLogout size={15} />
						Logout
					</button>
				</div>
			</aside>

			{/* Content */}
			<main className="flex-1 overflow-y-auto p-6">
				<h2 className="text-lg font-semibold tracking-tight">
					File Management
				</h2>

				{(notice || error) && (
					<div
						className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
							error
								? "border-red-500/40 bg-red-500/5 text-red-600 dark:text-red-400"
								: "border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
						}`}
					>
						{error || notice}
					</div>
				)}

				<div className="surface mt-4 overflow-hidden rounded-xl">
					<ul className="divide-y divide-[var(--stroke)]">
						{isLoading && (
							<li className="px-4 py-6 text-center text-sm text-[var(--text-low)]">
								<span className="animate-pulse">Loading files…</span>
							</li>
						)}
						{loadError && (
							<li className="px-4 py-6 text-center text-sm text-red-600 dark:text-red-400">
								Failed to load files — is the API up?
							</li>
						)}
						{!isLoading && !loadError && files.length === 0 && (
							<li className="px-4 py-6 text-center text-sm text-[var(--text-low)]">
								No files yet.
							</li>
						)}
						{files.map((f) => {
							const FileIcon = getFileIcon(f.name);
							return (
								<li
									key={f.name}
									className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-2)]/50"
								>
									<span className="text-[var(--text-low)]">
										{f.isDirectory ? (
											<IconFolder size={19} className="accent-text" />
										) : (
											<FileIcon size={18} />
										)}
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium text-[var(--text-hi)]">
											{f.name}
										</p>
										<p className="mono text-xs text-[var(--text-mid)]">
											{f.isDirectory ? "Folder" : formatBytes(f.size)}
											{f.isDirectory ? "" : ` · ${formatDate(f.modified)}`}
										</p>
									</div>
									<button
										type="button"
										onClick={() => deleteFile(f.name)}
										aria-label={`Delete ${f.name}`}
										title="Delete"
										className="shrink-0 rounded-lg p-2 text-[var(--text-low)] transition hover:bg-red-500/10 hover:text-red-500"
									>
										<IconTrash size={16} />
									</button>
								</li>
							);
						})}
					</ul>
				</div>

				{/* Create folder */}
				<form
					onSubmit={createDir}
					className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end"
				>
					<label className="flex flex-1 flex-col gap-1.5 text-sm">
						<span className="text-[13px] font-medium text-[var(--text-mid)]">
							Create new folder
						</span>
						<input
							type="text"
							value={folderPath}
							onChange={(e) => setFolderPath(e.target.value)}
							placeholder="e.g. /docs/2026"
							className="rounded-lg border border-[var(--stroke)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-hi)] placeholder-[var(--text-low)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-ring)]"
						/>
					</label>
					<button
						type="submit"
						className="btn-accent inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
					>
						<IconFolderPlus size={15} />
						Create Folder
					</button>
				</form>
			</main>
		</div>
	);
};

export default AdminDashboard;