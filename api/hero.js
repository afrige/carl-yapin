// Returns the custom homepage image URL (Vercel Blob) or null.
import { list } from "@vercel/blob";
import { json } from "./_lib/session.js";
export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return json({ url: null });
  try {
    const { blobs } = await list({ prefix: "homepage/hero", limit: 1 });
    const b = blobs[0];
    if (!b) return json({ url: null });
    return json({ url: b.url + "?v=" + new Date(b.uploadedAt).getTime() });
  } catch { return json({ url: null }); }
}
