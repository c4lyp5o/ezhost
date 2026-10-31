// Small shared hooks (kept out of component files for react-refresh).
import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";

// navigator.clipboard only exists on HTTPS/localhost. ezhost often runs on a
// plain-http LAN address, so fall back to the old execCommand route there.
const writeClipboard = async (text) => {
	if (window.isSecureContext && navigator.clipboard) {
		await navigator.clipboard.writeText(text);
		return;
	}
	const ta = document.createElement("textarea");
	ta.value = text;
	ta.setAttribute("readonly", "");
	ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
	document.body.appendChild(ta);
	ta.select();
	const ok = document.execCommand("copy");
	ta.remove();
	if (!ok) throw new Error("copy failed");
};

// Copy text to the clipboard; `copied` flips true for a moment as feedback.
export const useCopy = () => {
	const [copied, setCopied] = useState(false);
	const timer = useRef(null);

	const copy = useCallback(async (text) => {
		try {
			await writeClipboard(text);
			setCopied(true);
			clearTimeout(timer.current);
			timer.current = setTimeout(() => setCopied(false), 1600);
			return true;
		} catch {
			toast.error("Couldn't copy. Select the link and copy it manually.");
			return false;
		}
	}, []);

	return [copied, copy];
};

export const absoluteUrl = (path) => new URL(path, window.location.origin).href;
