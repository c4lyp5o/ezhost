// Admin: manage hosted files. Delete files and empty folders, create
// folders, sign out. Sidebar from md up; a top bar on phones.
import { useState } from "react";
import useSWR from "swr";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "react-toastify";
import { fetcher, request, swrOptions } from "../api.js";
import { logout } from "../auth.js";
import { formatBytes, formatDate, formatRelative, getFileIcon } from "../utils.js";
import Dialog from "../components/Dialog.jsx";
import ThemeButton from "../components/ThemeButton.jsx";
import Wordmark from "../components/Wordmark.jsx";
import {
	IconFolder,
	IconTrash,
	IconExternal,
	IconLogout,
	IconFolderPlus,
} from "../components/Icons.jsx";

const ConfirmDelete = ({ open, target, onCancel, onConfirm, busy }) => (
	<Dialog open={open} onClose={onCancel} labelledBy="confirm-title" dismissible={!busy}>
		{target && (
			<>
				<h2 id="confirm-title" className="text-[24px] font-semibold tracking-[-0.01em]">
					Delete {target.isDirectory ? "folder" : "file"}?
				</h2>
				<p className="mt-2 text-[15px] text-[var(--text-mid)]">
					<span className="font-medium break-all text-[var(--text-hi)]">{target.name}</span>{" "}
					{target.isDirectory
						? "will be removed. Only empty folders can be deleted."
						: "will be removed and its link will stop working. This can't be undone."}
				</p>
				<div className="mt-6 flex gap-3">
					<button
						type="button"
						onClick={onConfirm}
						disabled={busy}
						data-autofocus
						className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--bad)] px-4 py-3 text-[15px] font-semibold text-[var(--bad-ink)] transition hover:brightness-110 disabled:opacity-60"
					>
						<IconTrash size={16} />
						{busy ? "Deleting…" : "Delete"}
					</button>
					<button
						type="button"
						onClick={onCancel}
						disabled={busy}
						className="btn-ghost h-[34px] px-4 text-[13px] font-medium"
					>
						Keep it
					</button>
				</div>
			</>
		)}
	</Dialog>
);

const AdminDashboard = () => {
	const navigate = useNavigate();
	const reduce = useReducedMotion();
	const [folderName, setFolderName] = useState("");
	const [folderError, setFolderError] = useState("");
	const [target, setTarget] = useState(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const { data, error, isLoading, mutate } = useSWR("/api/v1/files", fetcher, swrOptions);

	const files = [...(data?.files ?? [])].sort((a, b) =>
		a.isDirectory !== b.isDirectory
			? a.isDirectory ? -1 : 1
			: a.name.localeCompare(b.name),
	);
	const fileCount = files.filter((f) => !f.isDirectory).length;
	const totalBytes = files.reduce((n, f) => n + (f.isDirectory ? 0 : f.size), 0);

	// An expired or revoked session lands back on sign-in instead of
	// leaving the admin staring at "Unauthorized".
	const handleError = (err) => {
		if (err.status === 401) {
			toast.info("Your session ended. Sign in again.");
			navigate("/login", { replace: true });
			return true;
		}
		toast.error(err.message);
		return false;
	};

	const confirmDelete = async () => {
		setDeleting(true);
		try {
			await request(`/api/v1/admin/files/${encodeURIComponent(target.name)}`, {
				method: "DELETE",
			});
			toast.success(`Deleted ${target.name}`);
			setConfirmOpen(false);
			mutate();
		} catch (err) {
			handleError(err);
			setConfirmOpen(false);
		} finally {
			setDeleting(false);
		}
	};

	const createFolder = async (e) => {
		e.preventDefault();
		const name = folderName.trim().replace(/^\/+|\/+$/g, "");
		setFolderError("");
		if (!name) return;
		if (name.includes("/")) {
			setFolderError("Use a single name. Folders can't be nested.");
			return;
		}
		try {
			await request("/api/v1/admin/dirs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ path: name }),
			});
			toast.success(`Created folder ${name}`);
			setFolderName("");
			mutate();
		} catch (err) {
			if (err.status === 401) handleError(err);
			else setFolderError(err.message);
		}
	};

	const doLogout = async () => {
		await logout().catch(() => {});
		navigate("/login", { replace: true });
	};

	const themeButton = <ThemeButton />;

	return (
		<div className="flex min-h-dvh flex-col bg-[var(--surface-0)] text-[var(--text-hi)] md:flex-row">
			{/* Phone: top bar */}
			<header className="flex items-center gap-2 border-b border-[var(--stroke)] bg-[var(--surface-1)] px-4 py-3 md:hidden">
				<Wordmark size={26} suffix="admin" />
				<div className="ml-auto flex items-center gap-2">
					{themeButton}
					<Link to="/" aria-label="Public page" className="btn-ghost flex h-[34px] w-[34px] items-center justify-center rounded-xl">
						<IconExternal size={16} />
					</Link>
					<button type="button" onClick={doLogout} aria-label="Sign out" className="btn-ghost flex h-[34px] w-[34px] items-center justify-center rounded-xl text-[var(--bad)]">
						<IconLogout size={16} />
					</button>
				</div>
			</header>

			{/* Desktop: sidebar */}
			<aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-[var(--stroke)] bg-[var(--surface-1)] p-5 md:flex">
				<Wordmark size={28} suffix="admin" />
				<div className="hazard mt-5 h-1.5 rounded-full" aria-hidden="true" />
				<dl className="mt-6 space-y-3 text-[13px]">
					<div>
						<dt className="text-[var(--text-low)]">Hosting</dt>
						<dd className="num font-medium">
							{fileCount} file{fileCount === 1 ? "" : "s"}, {formatBytes(totalBytes)}
						</dd>
					</div>
					<div>
						<dt className="text-[var(--text-low)]">Signed in as</dt>
						<dd className="font-medium">admin</dd>
					</div>
				</dl>
				<div className="mt-auto space-y-2">
					<div className="flex gap-2">
						<Link
							to="/"
							className="btn-ghost inline-flex flex-1 items-center justify-center gap-2 h-[34px] px-4 text-[13px] font-medium"
						>
							<IconExternal size={15} />
							Public page
						</Link>
						{themeButton}
					</div>
					<button
						type="button"
						onClick={doLogout}
						className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--bad)]/40 px-3 py-2 text-[13px] font-medium text-[var(--bad)] transition hover:bg-[var(--bad-soft)]"
					>
						<IconLogout size={15} />
						Sign out
					</button>
				</div>
			</aside>

			<main className="w-full max-w-4xl flex-1 px-4 py-6 sm:px-8 sm:py-10">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<h1 className="text-[24px] font-semibold tracking-[-0.01em]">
						Hosted files
					</h1>
					<p className="num text-[13px] text-[var(--text-low)] md:hidden">
						{fileCount} file{fileCount === 1 ? "" : "s"}, {formatBytes(totalBytes)}
					</p>
				</div>

				<form onSubmit={createFolder} className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-start">
					<label className="flex-1">
						<span className="sr-only">New folder name</span>
						<input
							type="text"
							value={folderName}
							onChange={(e) => {
								setFolderName(e.target.value);
								setFolderError("");
							}}
							placeholder="New folder name, e.g. docs"
							aria-invalid={!!folderError}
							aria-describedby={folderError ? "folder-error" : undefined}
							className="field w-full rounded-xl px-3.5 py-2.5 text-[15px]"
						/>
						{folderError && (
							<span id="folder-error" className="mt-1.5 block text-[13px] text-[var(--bad)]">
								{folderError}
							</span>
						)}
					</label>
					<button
						type="submit"
						disabled={!folderName.trim()}
						className="btn-label inline-flex items-center justify-center gap-2 h-[34px] px-4 text-[13px]"
					>
						<IconFolderPlus size={16} />
						Create folder
					</button>
				</form>

				<div className="mt-6">
					{isLoading && <p className="py-10 text-center text-[13px] text-[var(--text-low)]">Loading files…</p>}
					{error && !data && (
						<div className="rounded-2xl border border-dashed border-[var(--bad)]/50 bg-[var(--bad-soft)] px-6 py-10 text-center" role="alert">
							<p className="font-medium">Couldn't load the file list</p>
							<p className="mt-1 text-[13px] text-[var(--text-mid)]">{error.message}</p>
							<button type="button" onClick={() => mutate()} className="btn-ghost mt-4 inline-flex h-[34px] items-center px-4 text-[13px] font-medium">
								Try again
							</button>
						</div>
					)}
					{data && files.length === 0 && (
						<p className="rounded-2xl border border-dashed border-[var(--stroke-strong)] px-6 py-10 text-center text-[13px] text-[var(--text-mid)]">
							Nothing hosted yet. Files uploaded on the public page show up here.
						</p>
					)}
					{files.length > 0 && (
						<ul className="surface divide-y divide-[var(--stroke)] overflow-hidden rounded-2xl">
							<AnimatePresence initial={false}>
								{files.map((f) => {
									const FileIcon = f.isDirectory ? IconFolder : getFileIcon(f.name);
									return (
										<motion.li
											key={f.name}
											layout={reduce ? false : "position"}
											exit={reduce ? undefined : { opacity: 0, x: -16 }}
											className="flex items-center gap-3.5 px-4 py-3 sm:px-5"
										>
											<span
												className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
													f.isDirectory
														? "bg-[var(--surface-2)] text-[var(--label-text)]"
														: "bg-[var(--surface-2)] text-[var(--text-mid)]"
												}`}
											>
												<FileIcon size={18} />
											</span>
											<div className="min-w-0 flex-1">
												{f.isDirectory ? (
													<p className="truncate text-[15px] font-medium">{f.name}</p>
												) : (
													<a
														href={f.url}
														target="_blank"
														rel="noopener noreferrer"
														className="block truncate text-[15px] font-medium hover:underline"
													>
														{f.name}
													</a>
												)}
												<p className="num flex gap-3 text-[13px] text-[var(--text-low)]">
													<span>{f.isDirectory ? "Folder" : formatBytes(f.size)}</span>
													<span title={formatDate(f.modified)}>{formatRelative(f.modified)}</span>
												</p>
											</div>
											<button
												type="button"
												onClick={() => {
													setTarget(f);
													setConfirmOpen(true);
												}}
												aria-label={`Delete ${f.name}`}
												title="Delete"
												className="shrink-0 rounded-lg p-2.5 text-[var(--text-low)] transition hover:bg-[var(--bad-soft)] hover:text-[var(--bad)]"
											>
												<IconTrash size={17} />
											</button>
										</motion.li>
									);
								})}
							</AnimatePresence>
						</ul>
					)}
				</div>
			</main>

			<ConfirmDelete
				open={confirmOpen}
				target={target}
				busy={deleting}
				onCancel={() => setConfirmOpen(false)}
				onConfirm={confirmDelete}
			/>
		</div>
	);
};

export default AdminDashboard;
