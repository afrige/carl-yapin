// Upload / remove the custom homepage image (Vercel Blob). Vercel limits request bodies to ~4.5 MB.
import { put, list, del } from "@vercel/blob";
import { adminCheck } from "../_lib/admin.js";
import { json } from "../_lib/session.js";

const MAX = 4 * 1024 * 1024;
const KINDS = { "image/gif": "gif", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
function sniff(b) {
  const s = (o, n) => Buffer.from(b.slice(o, o + n)).toString("latin1");
  if (s(0, 3) === "GIF") return "image/gif";
  if (b[0] === 0x89 && s(1, 3) === "PNG") return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8) return "image/jpeg";
  if (s(0, 4) === "RIFF" && s(8, 4) === "WEBP") return "image/webp";
  return null;
}
const noStorage = () => json({ error: "Storage is not configured (add a Vercel Blob store to this project)." }, 503);

export async function POST(request) {
  const denied = await adminCheck(request); if (denied) return denied;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return noStorage();
  let file;
  try { file = (await request.formData()).get("file"); } catch { return json({ error: "Invalid upload." }, 400); }
  if (!file || typeof file === "string") return json({ error: "No file received." }, 400);
  if (file.size > MAX) return json({ error: "Image is too large. The limit is 4 MB." }, 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type || !KINDS[type]) return json({ error: "Only GIF, PNG, JPG or WebP images are allowed." }, 415);
  try {
    const { blobs } = await list({ prefix: "homepage/hero" });
    await put("homepage/hero." + KINDS[type], bytes, { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: type, cacheControlMaxAge: 60 });
    const stale = blobs.filter((b) => !b.pathname.endsWith("." + KINDS[type])).map((b) => b.url);
    if (stale.length) await del(stale);
    return json({ ok: true });
  } catch { return json({ error: "Upload failed." }, 500); }
}

export async function DELETE(request) {
  const denied = await adminCheck(request); if (denied) return denied;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return noStorage();
  try {
    const { blobs } = await list({ prefix: "homepage/hero" });
    if (blobs.length) await del(blobs.map((b) => b.url));
    return json({ ok: true });
  } catch { return json({ error: "Could not remove the image." }, 500); }
}
