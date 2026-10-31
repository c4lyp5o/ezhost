// Small display helpers shared across the client.
import {
	IconFileText,
	IconImage,
	IconFilm,
	IconMusic,
	IconArchive,
	IconCode,
	IconPdf,
	IconBox,
} from "./components/Icons.jsx";

// Returns the visual icon component for a file by extension. Colour is applied
// by the caller via the `accent` / `className` props these icons accept.
export const getFileIcon = (name) => {
	const ext = name.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "pdf":
			return IconPdf;
		case "js":
		case "ts":
		case "jsx":
		case "tsx":
		case "css":
		case "html":
		case "py":
		case "go":
		case "rs":
		case "sh":
			return IconCode;
		case "json":
		case "yaml":
		case "yml":
		case "toml":
			return IconFileText;
		case "png":
		case "jpg":
		case "jpeg":
		case "gif":
		case "webp":
		case "svg":
			return IconImage;
		case "mp4":
		case "mov":
		case "avi":
		case "mkv":
		case "webm":
			return IconFilm;
		case "mp3":
		case "wav":
		case "ogg":
		case "flac":
		case "m4a":
			return IconMusic;
		case "zip":
		case "tar":
		case "gz":
		case "7z":
		case "rar":
			return IconArchive;
		case "txt":
		case "md":
		case "log":
			return IconFileText;
		case "doc":
		case "docx":
		case "xls":
		case "xlsx":
		case "ppt":
		case "pptx":
			return IconFileText;
		default:
			return IconBox;
	}
};

export const formatBytes = (bytes) => {
	if (!bytes) return "0 B";
	const units = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

// Mirrors the backend's upload rules (backend/config.js MAX_UPLOAD_BYTES and
// files.service.js DISALLOWED_EXT) so people learn before uploading, not after.
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const BLOCKED_EXT = new Set([
	"svg", "xml", "xsl", "dtd",
	"hta", "exe", "pif", "scr", "bat", "cmd", "ps1", "sh",
]);

// Returns a reason string when the server would refuse this file, else null.
export const fileProblem = (file) => {
	const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
	if (BLOCKED_EXT.has(ext)) return `.${ext} files aren't allowed`;
	if (file.size > MAX_UPLOAD_BYTES) return "Over the 100 MB limit";
	if (file.size === 0) return "File is empty";
	return null;
};

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const STEPS = [
	["year", 365 * 24 * 3600],
	["month", 30 * 24 * 3600],
	["week", 7 * 24 * 3600],
	["day", 24 * 3600],
	["hour", 3600],
	["minute", 60],
];

// "3 hours ago", "yesterday", "just now".
export const formatRelative = (iso) => {
	const secs = (new Date(iso).getTime() - Date.now()) / 1000;
	for (const [unit, size] of STEPS) {
		if (Math.abs(secs) >= size) return rtf.format(Math.round(secs / size), unit);
	}
	return "just now";
};

export const formatDate = (iso) =>
	new Date(iso).toLocaleString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
