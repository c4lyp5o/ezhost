// One place for talking to the backend. Every non-2xx response becomes an
// ApiError, so a 429 or 500 surfaces as an error instead of an empty list.

export class ApiError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

const messageFor = (status, body) => {
	if (body?.message) return body.message;
	if (status === 429) return "Too many requests. Wait a minute and try again.";
	if (status === 401) return "Your session ended. Sign in again.";
	return `Request failed (${status})`;
};

export const request = async (url, options = {}) => {
	const res = await fetch(url, { credentials: "same-origin", ...options });
	const body = await res.json().catch(() => null);
	if (!res.ok) throw new ApiError(res.status, messageFor(res.status, body));
	return body;
};

// SWR fetcher. Don't retry a 429 immediately — it only burns more budget.
export const fetcher = (url) => request(url);
export const swrOptions = {
	revalidateOnFocus: false,
	onErrorRetry: (err, _key, _cfg, revalidate, { retryCount }) => {
		if (err.status === 401 || err.status === 404 || retryCount >= 3) return;
		const wait = err.status === 429 ? 30_000 : 2_000 * 2 ** retryCount;
		setTimeout(() => revalidate({ retryCount }), wait);
	},
};

// Multipart upload with REAL progress. fetch() can't report upload progress,
// so this uses XMLHttpRequest's upload.onprogress.
export const uploadFiles = (files, onProgress) =>
	new Promise((resolve, reject) => {
		const form = new FormData();
		for (const f of files) form.append("files", f);

		const xhr = new XMLHttpRequest();
		xhr.open("POST", "/api/v1/upload");
		xhr.responseType = "json";
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) onProgress?.(e.loaded / e.total);
		};
		xhr.onload = () => {
			const body = xhr.response;
			if (xhr.status >= 200 && xhr.status < 300) resolve(body);
			else reject(new ApiError(xhr.status, messageFor(xhr.status, body)));
		};
		xhr.onerror = () =>
			reject(new ApiError(0, "Upload failed. Check your connection and try again."));
		xhr.send(form);
	});
