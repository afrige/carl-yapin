# Carl — Yapper website (`carl-yapin.best`)

Multi-page Cloudflare Pages site for Carl, a multipurpose moderation and community bot built for Yapper.
Black + emerald design system, dark/light themes, and a real homepage-media uploader backed by Cloudflare R2.

## Pages
`index.html` · `features.html` · `commands.html` · `docs.html` · `status.html` · `dashboard.html` · `admin.html`

## Brand assets (`assets/`)
| File | Use |
| --- | --- |
| `carl.svg` | Master logo — navbar, footer, loader, dashboard, SVG favicon |
| `carl.png` | PNG logo — apple-touch-icon and social previews |
| `favicon.ico` | Browser tab icon (generated from `carl.png`, 16–256 px) |
| `homehero.gif` | Animated homepage hero (default). Stays animated. |

The hero shows the image uploaded in `admin.html` (stored in R2) if one exists, otherwise `assets/homehero.gif`.
`homehero.gif` is ~4.4 MB; compressing it would speed up first load.

## What is real and what is not
- **Real:** theme toggle, navigation, searchable command directory, admin sign-in/upload/remove, `/api/status` checks.
- **Not connected:** the dashboard is a front-end preview. It never saves to the bot. "Save local draft" stores text in the visitor's own browser only.
- **Unverified:** the command list and `c!` prefix come from the previous site and are labelled as unverified examples. Replace `js/commands-data.js` with the real list and set `verified: true`.
- **Invite link:** not configured. Set `inviteUrl` in `js/config.js`; until then "Add Carl" opens the docs invite section.
- **Status:** shows only real checks. Bot status appears only if `BOT_STATUS_URL` is set. No uptime or latency numbers are invented.

## Deploy on Cloudflare Pages
1. Create an R2 bucket `carl-website-media`.
2. Deploy with Git integration or `npx wrangler pages deploy . --project-name carl-yapin-website` (plain drag-and-drop may not deploy Functions).
3. Pages project settings:
   - R2 binding: `CARL_MEDIA` -> `carl-website-media`
   - Secret `ADMIN_PASSWORD`: long, unique
   - Optional `BOT_STATUS_URL`: HTTPS endpoint returning `200`; optional JSON `{ "online": true, "servers": 0, "users": 0 }`
4. Open `/admin.html`, sign in, upload a hero image.

## Customize
- Design tokens (colors, type, themes): `css/main.css`
- Invite URL: `js/config.js`
- Commands: `js/commands-data.js`
- Pages share the same header/footer markup, so edit navigation in each HTML file.

## Security
- Never put a bot token in front-end files.
- The admin password lives in memory only while the page is open. For production use Cloudflare Access on `/admin.html` and add rate limiting.
