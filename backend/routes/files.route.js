import { Elysia, t } from "elysia";
import { FilesService } from "../services/files.service";

export const FilesRoutes = new Elysia({ name: "FilesRoutes" })
	.get(
		"/api/v1/files",
		() => FilesService.listFiles(),
		{
			response: t.Object({
				success: t.Boolean(),
				files: t.Array(
					t.Object({
						name: t.String(),
						isDirectory: t.Boolean(),
						size: t.Number(),
						modified: t.String(),
						url: t.String(),
					}),
				),
			}),
			detail: {
				summary: "List Uploaded Files",
				description: "Returns every file in the public/ upload directory.",
				tags: ["Files"],
			},
		},
	)
	.post(
		"/api/v1/upload",
		async ({ request, set }) => {
			// Bun parses multipart natively — no multer needed.
			const formData = await request.formData();
			const files = formData
				.getAll("files")
				.filter((part) => typeof part !== "string");

			const result = await FilesService.saveUploads(files);
			set.status = 201;
			return result;
		},
		{
			response: t.Object({
				success: t.Boolean(),
				message: t.String(),
				files: t.Array(
					t.Object({
						name: t.String(),
						url: t.String(),
						size: t.Number(),
					}),
				),
			}),
			detail: {
				summary: "Upload Files",
				description:
					"Multipart upload (field name: files). Files land in public/ and are served under /static/.",
				tags: ["Files"],
			},
		},
	);
