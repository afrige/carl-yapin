# Carl — Yapper website (`carl-yapin.best`)

Multi-page site for Carl, a multipurpose moderation and community bot built for Yapper.
Black + emerald design system, dark/light themes, Yapin login for the dashboard, live status, and a homepage-image uploader.
Hosted on **Vercel**, deployed from **GitHub**. Static pages at the repo root; server code in `api/` (Vercel Functions).

## Pages
`index.html` · `features.html` · `commands.html` · `docs.html` · `status.html` · `dashboard.html` · `admin.html`

## Brand assets (`assets/`)
`carl.svg` (master logo) · `carl.png` · `favicon.ico` · `homehero.gif` (animated hero, ~4.4 MB — compressing it would speed up first load).
The hero shows the image uploaded in `admin.html` if one exists, otherwise `assets/homehero.gif`.

## Deploy (GitHub → Vercel → your domain)
1. Push this folder's contents to the **root** of a GitHub repo (`api/` next to `index.html`).
2. vercel.com → Add New → Project → import the repo. Framework preset **Other**; no build command; leave output directory empty.
3. Project → **Storage** → create a **Blob** store and connect it (this adds `BLOB_READ_WRITE_TOKEN` automatically; needed for the admin image uploader).
4. Project → Settings → **Environment Variables** (mark secrets Sensitive), then redeploy:

| Name | Value |
| --- | --- |
| `YAPPER_CLIENT_SECRET` | from your Yapin app page (secret) |
| `SESSION_SECRET` | long random string: `openssl rand -base64 48` |
| `ADMIN_PASSWORD` | long, unique |
| `SITE_URL` | `https://carl-yapin.best` (recommended) |
| `BOT_STATUS_URL` | optional HTTPS endpoint for live bot status; JSON `{ "online": true, "servers": 0, "users": 0 }` |
| `YAPPER_SERVERS_URL` | optional, enables the server picker |

   Already defaulted in code (override only if needed): `YAPPER_CLIENT_ID`, `YAPPER_AUTH_URL` (`https://www.yapin.gg/oauth/authorize`), `YAPPER_SCOPES` (`identify`), `YAPPER_TOKEN_URL` (`https://www.yapin.gg/api/oauth/token`, falls back to `/oauth/token` on 404) and `YAPPER_USER_URL` (`https://www.yapin.gg/api/oauth/me`, falls back to `/oauth/me`). The token/user defaults come from a third-party description of Yapin's login, not official docs; if login fails, check https://www.yapin.gg/developers.
5. Project → Settings → **Domains** → add `carl-yapin.best` (and `www.carl-yapin.best`). Vercel shows the exact DNS records to set at your registrar. You keep your domain; nothing is transferred.
6. In your Yapin app settings, set the redirect URL to `https://carl-yapin.best/api/auth/callback`.

Never commit secrets. For local testing: `npm i -g vercel`, `vercel link`, `vercel env pull .env.local`, `vercel dev` (`.env*` is git-ignored).

## What is real and what is not
- **Real:** theme toggle, searchable commands, Yapin login (OAuth2 code + PKCE, signed HttpOnly session), live `/api/status` checks, admin sign-in/upload/remove.
- **Not connected:** saving dashboard settings to the bot. Drafts are stored only in the visitor's browser, and the UI says so.
- **Unverified:** the command list and `c!` prefix are the previous site's examples, labelled as unverified. Edit `js/commands-data.js`.
- **Status:** shows only real checks. Bot status appears only if `BOT_STATUS_URL` is set. No uptime or latency numbers are invented.
- **Upload limit:** 4 MB (Vercel request-body limit).

## Login notes
- If Yapin's user/server JSON uses different field names, edit `normalizeUser` / `normalizeServers` in `api/auth/callback.js`.
- Future settings APIs must call `requireSession()` from `api/_lib/session.js`; the static dashboard page alone is not a security boundary.

## Security
- Never put a bot token or client secret in front-end files.
- The admin password lives in browser memory only while the page is open. For production also enable Vercel password protection or an allow-list for `/admin.html`.
