// Loopback-only guard, mirror of the old localOnly middleware.
// Uses the raw socket peer (NOT X-Forwarded-For): a reverse proxy in front
// must never be able to pass this check, so only the Docker healthcheck
// (which curls localhost from inside the container) gets through.
export const localOnlyGuard = ({ server, request, set }) => {
	const ip = server?.requestIP?.(request)?.address?.replace(/^::ffff:/, "") ?? "";

	if (ip !== "127.0.0.1" && ip !== "::1") {
		set.status = 403;
		return { success: false, message: "Forbidden" };
	}
};
