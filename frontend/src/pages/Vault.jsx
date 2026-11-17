import { useState } from "react";

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
	return <main style={{ maxWidth: 850, margin: "4rem auto", padding: 24 }}>
		<h1>Our Vault</h1>
		{files === null ? <form onSubmit={login}>
			<p>Enter your authenticator code to unlock.</p>
			<label>One-time code <input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value)} /></label>
			<button type="submit">Unlock</button><p role="alert">{error}</p>
		</form> : <>
			<button onClick={async () => { await fetch("/api/v1/vault/logout", { method: "POST" }); setFiles(null); setFolder(""); }}>Lock vault</button>
			<p>{folder || "/"} · Browse/download · Uploads go to inbox only</p>
			<label>Upload to inbox (100 MiB max) <input type="file" disabled={uploading} onChange={upload} /></label>
			<p role="status">{uploading ? "Uploading…" : uploadMessage}</p>
			{folder && <button onClick={() => load(folder.split("/").slice(0, -1).join("/"))}>Parent folder</button>}
			<ul>{files.map((file) => {
				const target = [folder, file.name].filter(Boolean).join("/");
				return <li key={file.name}>{file.isDirectory ? <button onClick={() => load(target)}>{file.name}/</button> : <a href={"/api/v1/vault/download?path=" + encodeURIComponent(target)}>{file.name}</a>}</li>;
			})}</ul>
		</>}
	</main>;
}
