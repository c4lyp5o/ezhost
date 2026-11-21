import { useState } from "react";
import useSWR from "swr";
import { formatBytes, formatDate } from "../utils";

async function vaultFetch(url) {
	const response = await fetch(url, { cache: "no-store" });
	if (!response.ok) throw Object.assign(new Error("Unable to refresh files."), { status: response.status });
	return response.json();
}
import { IconLock as LockKeyhole, IconFolder as Folder, IconFile as File, IconChevron as ArrowUpLeft, IconExternal as ArrowDownToLine, IconUpload as Upload, IconShield as ShieldCheck } from "../components/Icons";
import ThemeButton from "../components/ThemeButton";
import "./vault.css";

export default function Vault() {
	const [folder, setFolder] = useState("");
	const [sort, setSort] = useState("name");
	const [direction, setDirection] = useState("asc");
	const session = useSWR("/api/v1/vault/session", async (url) => {
		try { return await vaultFetch(url); }
		catch (error) { if (error.status === 401) return null; throw error; }
	}, { shouldRetryOnError: false });
	const listing = useSWR(session.data?.authenticated ? "/api/v1/vault/files?path=" + encodeURIComponent(folder) : null, vaultFetch, {
		refreshInterval: 5000,
		onError: (error) => { if (error.status === 401) session.mutate(null, false); },
		shouldRetryOnError: (error) => error.status !== 401,
		errorRetryInterval: 5000,
	});
	const files = session.data?.authenticated && listing.error?.status !== 401 ? listing.data?.files ?? [] : null;
	const sortedFiles = [...(files || [])].sort((a, b) => {
		if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
		const comparison = sort === "name" ? a.name.localeCompare(b.name, "en", { numeric: true }) : sort === "size" ? (a.size ?? 0) - (b.size ?? 0) : (Date.parse(a[sort]) || 0) - (Date.parse(b[sort]) || 0);
		return (direction === "asc" ? 1 : -1) * (comparison || a.name.localeCompare(b.name));
	});
	const [code, setCode] = useState("");
	const [error, setError] = useState("");
	const [uploading, setUploading] = useState(false);
	const [uploadMessage, setUploadMessage] = useState("");
	async function load(next = folder) {
		setFolder(next);
		if (next === folder) await listing.mutate();
	}
	async function login(event) {
		event.preventDefault(); setError("");
		const response = await fetch("/api/v1/vault/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
		setCode("");
		if (!response.ok) { setError(response.status === 429 ? "Too many attempts. Wait five minutes." : "Invalid or already used code."); return; }
		setFolder("");
		await session.mutate();
	}
	async function upload(event) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;
		if (file.size > 100 * 1024 * 1024) { setUploadMessage("Maximum file size is 100 MiB."); return; }
		setUploading(true); setUploadMessage("");
		try {
			const response = await fetch("/api/v1/vault/upload?name=" + encodeURIComponent(file.name), { method: "POST", headers: { "Content-Type": "application/octet-stream" }, body: file });
			const result = await response.json();
			if (response.status === 401) { session.mutate(null, false); return; }
			setUploadMessage(response.ok ? "Uploaded to inbox: " + result.name : result.message || "Upload failed.");
			if (response.ok) await load("inbox");
		} catch { setUploadMessage("Upload failed. Check the inbox before retrying."); }
		finally { setUploading(false); }
	}
	return <main className="vault-shell">
		<header className="vault-header"><a href="/" className="vault-brand"><LockKeyhole size={18} />our<span>vault</span></a><div className="vault-header-right"><span className="vault-eyebrow">PRIVATE SPACE</span><ThemeButton /></div></header>
		{session.isLoading ? <p role="status">Checking vault session…</p> : files === null ? <form className="vault-login" onSubmit={login}>
			<div className="vault-lock-icon"><LockKeyhole size={28} strokeWidth={1.3} /></div>
			<span className="vault-eyebrow">JUST BETWEEN US</span><h1>Our Vault<span>.</span></h1>
			<p className="vault-intro">A quiet place for the things we share.<br />Unlock with your authenticator to step inside.</p>
			<label className="vault-code-label">One-time code <input className="field vault-code" placeholder="000000" aria-label="One-time code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value)} /></label>
			<button className="btn-label vault-unlock" type="submit">Unlock vault <ArrowUpLeft size={16} /></button><p className="vault-error" role="alert">{error}</p>
			<div className="vault-login-note"><ShieldCheck size={14} /> Private access · Authenticator protected</div>
		</form> : <>
			<section className="vault-browser"><div className="vault-browser-heading"><div><span className="vault-eyebrow">OUR SHARED SPACE</span><h1>Your files<span>.</span></h1></div><button type="button" className="btn-ghost vault-action" onClick={async () => { await fetch("/api/v1/vault/logout", { method: "POST" }); session.mutate(null, false); setFolder(""); }}><LockKeyhole size={14} /> Lock vault</button></div>
			<div className="vault-upload"><div><Upload size={19} /><div><strong>Leave something for us</strong><p>Uploads land in the inbox. Up to 100 MiB, no overwrites.</p></div></div><label className="btn-label vault-action">{uploading ? "Uploading…" : "Choose file"}<input className="vault-file-input" aria-label="Upload to inbox" type="file" disabled={uploading} onChange={upload} /></label></div>
			<p role="status">{uploading ? "Uploading…" : uploadMessage}</p>
			<div className="vault-path"><span className="url">vault / {folder}</span><span>{files.length} {files.length === 1 ? "item" : "items"}</span></div>
			{folder && <button type="button" className="vault-parent" onClick={() => load(folder.split("/").slice(0, -1).join("/"))}><ArrowUpLeft size={16} /> Parent folder</button>}
			<div className="vault-sort"><label>Sort by <select aria-label="Sort by" value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Name</option><option value="createdAt">Created date</option><option value="updatedAt">Updated date</option><option value="size">Size</option></select></label><button type="button" className="btn-ghost" onClick={() => setDirection(direction === "asc" ? "desc" : "asc")}>{direction === "asc" ? "Ascending ↑" : "Descending ↓"}</button><span role="status">{listing.error ? "Refresh failed. Retrying…" : "Auto-refresh · 5 seconds"}</span></div>
			<ul className="vault-files">{sortedFiles.map((file) => {
				const target = [folder, file.name].filter(Boolean).join("/");
				return <li key={file.name}>{file.isDirectory ? <button type="button" onClick={() => load(target)}><Folder size={19} /><span className="vault-file-details"><span>{file.name}</span><small>{file.isDirectory ? "Folder" : formatBytes(file.size)} · Created: {file.createdAt ? formatDate(file.createdAt) : "Unavailable"} · Updated: {formatDate(file.updatedAt)}</small></span><small>Folder</small></button> : <a href={"/api/v1/vault/download?path=" + encodeURIComponent(target)}><File size={19} /><span className="vault-file-details"><span>{file.name}</span><small>{file.isDirectory ? "Folder" : formatBytes(file.size)} · Created: {file.createdAt ? formatDate(file.createdAt) : "Unavailable"} · Updated: {formatDate(file.updatedAt)}</small></span><ArrowDownToLine size={16} /></a>}</li>;
			})}</ul>{files.length === 0 && <div className="vault-empty"><Folder size={28} /><p>A little room for something new.</p><span>This folder is empty.</span></div>}</section>
		</>}
		<footer className="vault-footer"><span>OUR VAULT</span><span>For you & me.</span></footer>
	</main>;
}
