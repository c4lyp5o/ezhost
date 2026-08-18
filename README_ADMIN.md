# Ezhost Admin Interface

## Setup

1. Set the admin password (only on first run):
   ```bash
   export ADMIN_PASSWORD="your-secure-password-here"
   ```

2. Start the server:
   ```bash
   cd ~/ezhost
   PORT=3180 bun run backend/index.js
   ```

   The server will create an admin user with:
   - Username: `admin`
   - Password: `[value of ADMIN_PASSWORD]`

## Access

- **Admin Dashboard**: Open `http://localhost:3180/` in your browser
- **Login Page**: If not logged in, you'll be redirected to `http://localhost:3180/login`

## API Endpoints (Admin)

All admin endpoints require authentication via the admin session cookie set after logging in.

### Create a Folder
```bash
curl -X POST http://localhost:3180/api/v1/admin/dirs \
  -H "Content-Type: application/json" \
  -d '{"path":"/test-admin-folder"}'
```

### Delete a File
```bash
# Replace :id with the actual file ID from the file list
curl -X DELETE http://localhost:3180/api/v1/admin/files/:id
```

### List Files (Public)
```bash
curl http://localhost:3180/api/v1/files
```

## Live Demo
- Open browser at `http://localhost:3180/` after server starts
- You'll see file list with delete buttons in the UI

## Password Note
- The admin password is hashed using Bun.password.bcrypt and stored in a SQLite database (`ezhost.sqlite`).
- On subsequent runs, the server will use the existing admin credentials; you do not need to set `ADMIN_PASSWORD` again unless you want to change the password (which requires deleting the database and restarting).
- The admin dashboard provides a UI for file management, including folder creation and file deletion.

## Testing with curl

1. **Get admin session**:
```bash
# First login to get cookie
LOGIN_RESP=$(curl -s -X POST http://localhost:3180/login -H "Content-Type: application/json" -d '{"password":"ezhost-admin-2026"}' | jq -r '.cookies | keys[]')
echo "Login response: $LOGIN_RESP"
```

2. **Create a folder** (using cookie from login):
```bash
curl -X POST http://localhost:3180/api/v1/admin/dirs \
  -H "Content-Type: application/json" \
  -H "Cookie: auth=$LOGIN_RESP" \
  -d '{"path":"/test-admin-folder"}' 2>&1 | jq
```

### Expected responses:
- `201 Created` for successful folder creation
- `401 Unauthorized` if not logged in
- `400 Bad Request` for invalid JSON paths

## Troubleshooting

- **Server not responding**: Check if process is running:
  ```bash
  ps aux | grep "bun backend"
  ```
- **Connection refused**: Ensure server is running on port 3180
- **401 Unauthorized**: Verify login credentials and that you're sending the correct cookie

## Commitment to Calypso's Style

✅ Bun native (no native dependencies)
✅ Elysia framework with proper routing
✅ Type hints and structured responses
✅ Error handling with proper HTTP status codes
✅ Mobile-friendly admin UI with dark theme