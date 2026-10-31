# 👋 HELLO!

Welcome to **ezhost** — a tiny file host that serves whatever you drop in.

## How to upload a file

**Option 1 — the web UI (easiest)**

1. Click **Upload** in the top-right corner.
2. Pick one or more files — or just drag & drop them onto the window.
3. Watch the progress bar, then copy your link from the file row.

**Option 2 — curl (no browser needed)**

```bash
curl -F "files=@your-file.pdf" https://<your-host>/api/v1/upload
```

The response returns a public `url` for every uploaded file.

## How files work

| Action | How |
|---|---|
| List files | `GET /api/v1/files` |
| Serve a file | `https://<your-host>/static/<filename>` |
| Delete a file | Admin dashboard only — sign in top right |

No accounts needed for uploads — anyone can drop a file and get a link.
Admin is reserved for the destructive stuff (delete, folders).

Happy hosting! ✨
