// Small display helpers shared across the client.
export const getFileIcon = (name) => {
	const ext = name.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "pdf":
			return "📕";
		case "js":
		case "ts":
		case "jsx":
		case "tsx":
			return "🧩";
		case "json":
		case "yaml":
		case "yml":
		case "toml":
			return "📋";
		case "png":
		case "jpg":
		case "jpeg":
		case "gif":
		case "webp":
		case "svg":
			return "🖼️";
		case "mp4":
		case "mov":
		case "avi":
		case "mkv":
			return "🎬";
		case "mp3":
		case "wav":
		case "ogg":
			return "🎵";
		case "zip":
		case "tar":
		case "gz":
		case "7z":
			return "🗜️";
		case "txt":
		case "md":
		case "log":
			return "📄";
		default:
			return "📦";
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
