import { Elysia } from "elysia";
import { logger } from "./logger";
import { staticPlugin } from "@elysiajs/static";
import { 
    DIST_DIR,
    DIST_MAX_AGE,
    NODE_ENV,
    PORT,
    PUBLIC_DIR,
    RATE_LIMIT,
    UPLOADS_MAX_AGE,
} from "./config";
import { HttpError } from "./utils";
import { rateLimitHandler } from "./plugins/rate-limit.plugin";
import { localOnlyGuard } from "./plugins/local-only.plugin";
import { HealthRoute } from "./routes/health.route";
import { FilesRoutes } from "./routes/files.route";
import { initDB, verifyAdmin } from "./services/admin";
import { authPlugin } from "./plugins/auth.plugin";

// Initialize the database and create admin if needed.
// Must be awaited BEFORE the server handles its first request, or the admin
// seed can still be writing when a request verifies credentials.
await initDB();

export const app = new Elysia()
    .onError(({ code, error, set, request }) => {
        if (error instanceof HttpError) {
            set.status = error.status;
            return { success: false, message: error.message };
        }

        if (code === "VALIDATION") {
            NODE_ENV === "development" && logger.error(error);
            set.status = 400;
            return { success: false, message: "Bad request" };
        }

        if (code === "NOT_FOUND") {
            // Thrown by @elysiajs/static for an unknown path under a static
            // prefix (e.g. a deep route under /app or /static). Turn it into a
            // clean 404 response instead of letting it propagate.
            set.status = 404;
            return { success: false, message: "Not Found" };
        }

        throw error;
    })
    .use(authPlugin)
    .derive({ as: "global" }, ({ request, set }) => {
        if (RATE_LIMIT > 0) {
            rateLimitHandler(request, set);
        }
        logger.info(`${request.method} ${request.url}`);
    })
    .guard((api) => api.onBeforeHandle(localOnlyGuard).use(HealthRoute))
    .use(FilesRoutes)
    .get("/login", () => {
        return new Response(LOGIN_HTML, {
            headers: { "Content-Type": "text/html" }
        });
    })
    .post("/login", async ({ body, set, cookie: { auth } }) => {
        const { password } = body;
        const isValid = await verifyAdmin("admin", password);
        if (!isValid) {
            set.status = 401;
            return { success: false, message: "Invalid password" };
        }
        auth.set = {
            value: password,
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24
        };
        set.status = 302;
        set.headers = { Location: "/" };
        return { success: true };
    })
    .get("/", ({ isAdmin }) => {
        if (!isAdmin) {
            return new Response(LOGIN_HTML, {
                headers: { "Content-Type": "text/html" }
            });
        }
        return new Response(DASHBOARD_HTML, {
            headers: { "Content-Type": "text/html" }
        });
    })
    .use(staticPlugin({ 
        assets: DIST_DIR, 
        prefix: "/app" 
    }))
    // Serve uploaded files (public/) under /static — where uploads point.
    // Short cache life because files are re-uploaded under the same name.
    .use(staticPlugin({
        assets: PUBLIC_DIR,
        prefix: "/static",
        maxAge: UPLOADS_MAX_AGE,
    }))
    .get("/*", ({ path }) => {
        if (path.startsWith("/api/")) {
            // Unknown API endpoint → consistent JSON 404 for API consumers.
            return new Response(JSON.stringify({ success: false, message: "Not Found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }
        return new Response("Not found", { status: 404 });
    });

export const LOGIN_HTML = `<!DOCTYPE html>
<html>
<head>
    <title>Ezhost Admin Login</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: sans-serif; display: flex; height: 100vh; align-items: center; justify-content: center; background: #f0f0f0; }
        .form { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
        h2 { text-align: center; margin-bottom: 1.5rem; }
        input { width: 100%; padding: 0.75rem; margin: 0.5rem 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; padding: 0.75rem; background: #4a90e2; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #357ab8; }
    </style>
</head>
<body>
    <div class="form">
        <h2>Admin Login</h2>
        <form id="loginForm">
            <input type="password" id="password" placeholder="Enter admin password" required>
            <button type="submit">Login</button>
        </form>
    </div>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const res = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            if (res.ok) {
                window.location.href = '/';
            } else {
                alert('Invalid password');
            }
        });
    </script>
</body>
</html>`;

export const DASHBOARD_HTML = `<!DOCTYPE html>
<html>
<head>
    <title>Ezhost Admin Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: sans-serif; margin: 0; padding: 0; display: flex; height: 100vh; }
        .sidebar { width: 250px; background: #2c3e50; color: white; padding: 2rem; }
        .content { flex: 1; padding: 2rem; overflow-y: auto; background: #ecf0f1; }
        h1, h2 { color: #2c3e50; }
        .file-list { margin-top: 1rem; }
        .file-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid #ddd; }
        .file-item:hover { background: #f5f5f5; }
        .btn { background: #4a90e2; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #357ab8; }
        .btn-danger { background: #e74c3c; }
        .btn-danger:hover { background: #c0392b; }
        input, select { padding: 0.5rem; margin: 0.5rem 0; width: 100%; box-sizing: border-box; }
    </style>
</head>
<body>
    <div class="sidebar">
        <h1>Ezhost Admin</h1>
        <p>Logged in as admin</p>
        <button id="logoutBtn" class="btn btn-danger" style="width: 100%; margin-top: 2rem;">Logout</button>
    </div>
    <div class="content">
        <h2>File Management</h2>
        <div class="file-list" id="fileList">
            <p>Loading files...</p>
        </div>
        <div style="margin-top: 2rem;">
            <h3>Create New Folder</h3>
            <input type="text" id="newDirPath" placeholder="Enter folder path (e.g., /docs/2026)">
            <button id="createDirBtn" class="btn">Create Folder</button>
        </div>
    </div>
    <script>
        // Load files from the API
        async function loadFiles() {
            const res = await fetch('/api/v1/files');
            if (!res.ok) {
                document.getElementById('fileList').innerHTML = '<p>Error loading files</p>';
                return;
            }
            const files = await res.json();
            const list = document.getElementById('fileList');
            if (files.length === 0) {
                list.innerHTML = '<p>No files yet.</p>';
                return;
            }
            list.innerHTML = files.map(function(file) {
                return '<div class="file-item">' +
                    '<div>' +
                        '<strong>' + file.name + '</strong><br>' +
                        '<small>' + new Date(file.uploadedAt).toLocaleString() + '</small>' +
                    '</div>' +
                    '<div>' +
                        '<button class="btn btn-danger" data-id="' + file.id + '">Delete</button>' +
                    '</div>' +
                '</div>';
            }).join('');

            // Add event listeners to delete buttons
            document.querySelectorAll('.file-item .btn-danger').forEach(function(btn) {
                btn.addEventListener('click', async function() {
                    if (!confirm('Are you sure you want to delete this file?')) return;
                    const id = btn.dataset.id;
                    const res = await fetch('/api/v1/admin/files/' + id, {
                        method: 'DELETE'
                    });
                    if (res.ok) {
                        loadFiles();
                    } else {
                        alert('Failed to delete file');
                    }
                });
            });
        }

        // Create folder
        document.getElementById('createDirBtn').addEventListener('click', async function() {
            const path = document.getElementById('newDirPath').value.trim();
            if (!path) {
                alert('Please enter a folder path');
                return;
            }
            const res = await fetch('/api/v1/admin/dirs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path })
            });
            if (res.ok) {
                alert('Folder created');
                document.getElementById('newDirPath').value = '';
                loadFiles();
            } else {
                const resText = await res.text();
                alert('Failed to create folder: ' + resText);
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', async function() {
            const res = await fetch('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: '' }) });
            window.location.href = '/login';
        });

        // Initial load
        loadFiles();
    </script>
</body>
</html>`;
