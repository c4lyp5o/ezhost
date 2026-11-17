import { useState } from "react";
import { IconLock as LockKeyhole, IconFolder as Folder, IconFile as File, IconChevron as ArrowUpLeft, IconExternal as ArrowDownToLine, IconUpload as Upload, IconShield as ShieldCheck } from "../components/Icons";
import ThemeButton from "../components/ThemeButton";
import "./vault.css";

export default function Vault() {
	const [files, setFiles] = useState(null);
	const [folder, setFolder] = useState("");
	const [code, setCode] = useState("");
	const [error, setError] = useState("");
	const [uploading, setUploading] = useState(false);
	const [uploadMessage, setUploadMessage] = useState("");
	async function load(next = folder) {
		const response = await fetch("/api/v1/vault/files?path=" + encodeURIComponent(next));
		if (!response.ok) { setFiles(null); return; }
		setFiles((await response.json()).files); setFolder(next);
	}
	async function login(event) {
		event.preventDefault(); setError("");
		const response = await fetch("/api/v1/vault/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
		setCode("");
		if (!response.ok) { setError(response.status === 429 ? "Too many attempts. Wait five minutes." : "Invalid or already used code."); return; }
		await load("");
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
			if (response.status === 401) { setFiles(null); return; }
			setUploadMessage(response.ok ? "Uploaded to inbox: " + result.name : result.message || "Upload failed.");
			if (response.ok) await load("inbox");
		} catch { setUploadMessage("Upload failed. Check the inbox before retrying."); }
		finally { setUploading(false); }
	}
	return <main className="vault-shell">
		<header className="vault-header"><a href="/" className="vault-brand"><LockKeyhole size={18} />our<span>vault</span></a><div className="vault-header-right"><span className="vault-eyebrow">PRIVATE SPACE</span><ThemeButton /></div></header>
		{files === null ? <form className="vault-login" onSubmit={login}>
			<div className="vault-lock-icon"><LockKeyhole size={28} strokeWidth={1.3} /></div>
			<span className="vault-eyebrow">JUST BETWEEN US</span><h1>Our Vault<span>.</span></h1>
			<p className="vault-intro">A quiet place for the things we share.<br />Unlock with your authenticator to step inside.</p>
			<label className="vault-code-label">One-time code <input className="field vault-code" placeholder="000000" aria-label="One-time code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value)} /></label>
			<button className="btn-label vault-unlock" type="submit">Unlock vault <ArrowUpLeft size={16} /></button><p className="vault-error" role="alert">{error}</p>
			<div className="vault-login-note"><ShieldCheck size={14} /> Private access · Authenticator protected</div>
		</form> : <>
			<section className="vault-browser"><div className="vault-browser-heading"><div><span className="vault-eyebrow">OUR SHARED SPACE</span><h1>Your files<span>.</span></h1></div><button className="btn-ghost vault-action" onClick={async () => { await fetch("/api/v1/vault/logout", { method: "POST" }); setFiles(null); setFolder(""); }}><LockKeyhole size={14} /> Lock vault</button></div>
			<div className="vault-upload"><div><Upload size={19} /><div><strong>Leave something for us</strong><p>Uploads land in the inbox. Up to 100 MiB, no overwrites.</p></div></div><label className="btn-label vault-action">{uploading ? "Uploading…" : "Choose file"}<input className="vault-file-input" aria-label="Upload to inbox" type="file" disabled={uploading} onChange={upload} /></label></div>
			<p role="status">{uploading ? "Uploading…" : uploadMessage}</p>
			<div className="vault-path"><span className="url">vault / {folder}</span><span>{files.length} {files.length === 1 ? "item" : "items"}</span></div>
			{folder && <button className="vault-parent" onClick={() => load(folder.split("/").slice(0, -1).join("/"))}><ArrowUpLeft size={16} /> Parent folder</button>}
			<ul className="vault-files">{files.map((file) => {
				const target = [folder, file.name].filter(Boolean).join("/");
				return <li key={file.name}>{file.isDirectory ? <button onClick={() => load(target)}><Folder size={19} /><span>{file.name}</span><small>Folder</small></button> : <a href={"/api/v1/vault/download?path=" + encodeURIComponent(target)}><File size={19} /><span>{file.name}</span><ArrowDownToLine size={16} /></a>}</li>;
			})}</ul>{files.length === 0 && <div className="vault-empty"><Folder size={28} /><p>A little room for something new.</p><span>This folder is empty.</span></div>}</section>
		</>}
		<footer className="vault-footer"><span>OUR VAULT</span><span>For you & me.</span></footer>
	</main>;
}
