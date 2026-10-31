import path from "node:path";
import net from "node:net";

// Error carrying an HTTP status, so services can fail with intent and the
// onError handler maps it to the right response code.
export class HttpError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

// Reduce a user-supplied name to a bare file name. The old multer setup wrote
// files with the raw originalname — a path-traversal hole (e.g. ../../x could
// land anywhere). Uploads must always stay inside public/.
export const safeBasename = (name = "") => {
	const base = path.basename(String(name)).replace(/[\u0000-\u001f]/g, "");
	if (!base || base === "." || base === "..") return null;
	return base;
};

// True when `target` is `root` itself or inside it. A bare startsWith(root)
// would also accept a sibling like /app/public-backup.
export const isInside = (root, target) => {
	const rel = path.relative(path.resolve(root), path.resolve(target));
	return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
};

const isPrivateIpv4 = (ip) => {
	const [a, b] = ip.split(".").map(Number);

	// 10.0.0.0/8
	if (a === 10) return true;

	// 127.0.0.0/8 (loopback)
	if (a === 127) return true;

	// 169.254.0.0/16 (link-local)
	if (a === 169 && b === 254) return true;

	// 172.16.0.0/12 (docker networks)
	if (a === 172 && b >= 16 && b <= 31) return true;

	// 192.168.0.0/16
	if (a === 192 && b === 168) return true;

	// 100.64.0.0/10 (carrier-grade NAT)
	if (a === 100 && b >= 64 && b <= 127) return true;

	return false;
};

const isPrivateIpv6 = (ip) => {
	const normalized = ip.toLowerCase();

	// :: / ::1
	if (normalized === "::" || normalized === "::1") return true;

	// fc00::/7 (unique local addresses)
	if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

	// fe80::/10 (link-local unicast)
	if (normalized.startsWith("fe8") || normalized.startsWith("fe9")) return true;
	if (normalized.startsWith("fea") || normalized.startsWith("feb")) return true;

	// ::ffff:127.0.0.1 etc (IPv4-mapped IPv6) — treat as suspicious
	if (normalized.startsWith("::ffff:")) return true;

	return false;
};

const isIpDisallowed = (ip) => {
	const family = net.isIP(ip);

	if (family === 4) return isPrivateIpv4(ip);
	if (family === 6) return isPrivateIpv6(ip);

	// not an IP string
	return true;
};

// Real client IP for rate limiting. Bun's Request has no .ip property; the
// socket peer is only reachable via server.requestIP(request) (Elysia injects
// `server` into hooks). X-Forwarded-For is only trusted when the direct peer
// is a reverse proxy (private/loopback) — otherwise a public client could
// spoof the header and bypass the limiter.
export const getClientIp = (request, server) => {
	const directIp =
		server?.requestIP?.(request)?.address?.replace(/^::ffff:/, "") ?? null;

	const xff = request.headers.get("x-forwarded-for");
	if (xff && directIp && isIpDisallowed(directIp)) {
		return xff.split(",")[0].trim();
	}

	return directIp ?? "unknown";
};
