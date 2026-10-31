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
			// Public CDN-style uploader by design: anyone may drop files here
			// to be statically served (HTML/JS/CSS allowed). The admin token
			// is NOT required — admin is only needed for the destructive
			// dashboard actions (delete/dirs). Bun parses multipart natively —
			// no multer needed.
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
	)
	.delete(
		"/api/v1/admin/files/:name",
		({ params: { name }, isAdmin, set }) => {
			if (!isAdmin) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}
			return FilesService.deleteFile(name);
		},
		{
			detail: {
				summary: "Delete File",
				description: "Deletes a file from public/ (admin only).",
				tags: ["Files", "Admin"],
			},
		},
	)
	.post(
		"/api/v1/admin/dirs",
		({ body, isAdmin, set }) => {
			if (!isAdmin) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}
			return FilesService.createDir(body?.path);
		},
		{
			body: t.Optional(
				t.Object({ path: t.Optional(t.String()) }),
			),
			detail: {
				summary: "Create Folder",
				description: "Creates a folder inside public/ (admin only).",
				tags: ["Files", "Admin"],
			},
		},
	);