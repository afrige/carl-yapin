# Carl — Yapper website

A multi-page Cloudflare Pages starter for `carl-yapin.lol`, with a dark/light green theme and a real homepage media uploader backed by Cloudflare R2.

## What's included

- Home, Features, Commands, Docs, Status, Dashboard, and Admin pages.
- Dark / light theme toggle (saved in the browser).
- Responsive mobile navigation and layout.
- Admin-only homepage image upload and removal (GIF, PNG, JPG, WebP; max 8 MB).
- Cloudflare Pages Functions API and R2 object storage.

## Important honesty note

The website dashboard is currently a **front-end preview**. It is not yet connected to your Yapper bot's live server settings, OAuth, or command handlers. The command examples are explicitly examples. The R2-backed homepage image uploader is implemented once deployed with the configuration below.

## Deploy on Cloudflare Pages

1. Create an R2 bucket named `carl-website-media` in Cloudflare.
2. Upload this folder to a Git repository, or deploy it using the Cloudflare Pages upload flow that supports Functions. **A plain drag-and-drop static upload may not deploy Pages Functions.** Use Git integration or Wrangler Pages deployment.
3. In Cloudflare Pages, create a project and set the build output directory to `.`. No build command is required.
4. Add a Pages R2 binding:
   - Variable name: `CARL_MEDIA`
   - R2 bucket: `carl-website-media`
5. Add an environment variable:
   - `ADMIN_PASSWORD` = a long, unique password (keep it private).
6. Deploy, then open `https://carl-yapin.lol/admin.html`, enter the password, and upload your homepage GIF.

## Deploy with Wrangler

Install Wrangler and authenticate with your Cloudflare account, then run:

```bash
npx wrangler pages deploy . --project-name carl-yapin-website
```

Configure the R2 binding and `ADMIN_PASSWORD` in the Pages project settings as described above. `wrangler.toml` documents the binding for Wrangler-compatible workflows; verify the Pages project binding in its dashboard.

## Security notes

- Never put your Yapper bot token in frontend JavaScript or HTML.
- Keep `ADMIN_PASSWORD` only in Cloudflare Pages environment variables.
- Use a unique password. The browser holds it in page memory only while the admin page is open; it is not written to local storage.
- For a production admin system, replace the shared password with Cloudflare Access or a proper authenticated identity flow and add rate limiting.

## Customize

- Colors and layout: `css/main.css`
- Homepage text: `index.html`
- Brand mark: `assets/carl-mark.svg`
- Theme behavior: `js/theme.js`
- Homepage uploader: `admin.html`, `js/admin.js`, `functions/api/`
- Add your actual Yapper invite URL and exact command list before publishing.
