# VGU Study Hub

Student notes and question paper sharing website with OTP login, PDF uploads, comments, likes, and shared server storage.

## Run Locally

```powershell
npm start
```

Open:

```text
http://localhost:3000
```

For other devices on the same Wi-Fi, open your computer IP with port `3000`.

## Storage

Uploads and app data are saved on the server:

- Notes metadata: `data/notes.json`
- Verified users: `data/users.json`
- PDFs: `uploads/`

These files are ignored by Git so private user data and PDFs are not committed.

For hosting, set `STORAGE_DIR` to a persistent disk path. Example:

```text
STORAGE_DIR=/var/data
```

Then the app stores:

- `/var/data/data/notes.json`
- `/var/data/data/users.json`
- `/var/data/uploads/`

## Deploy With GitHub + Render

1. Push this project to GitHub.
2. Create a new Render Web Service from your GitHub repo.
3. Use:
   - Build command: `npm install`
   - Start command: `npm start`
4. Add a persistent disk mounted at `/var/data`.
5. Add environment variable:
   - `STORAGE_DIR=/var/data`
6. Deploy.

`render.yaml` is included, so Render Blueprint deploy can also pick these settings.

## Important

GitHub Pages will not work for uploads because it cannot run `server.js`. Use a Node hosting service with persistent storage.

OTP is currently demo mode: the OTP appears on the login screen and in the server logs. For real production, connect an email/SMS provider and stop returning `devOtp` from the API.
