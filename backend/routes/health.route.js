import { Elysia, t } from "elysia";

export const HealthRoute = new Elysia({ name: "HealthRoute" }).get(
	"/api/v1/healthcheck",
	() => ({ message: "ok" }),
	{
		response: t.Object({
			message: t.String(),
		}),
		detail: {
			summary: "Health Check",
			description:
				"Localhost-only probe used by the Docker healthcheck. Returns ok when the API is up.",
			tags: ["General"],
		},
	},
);
