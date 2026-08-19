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

export const formatDate = (iso) =>
	new Date(iso).toLocaleString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
