const TYPES = new Set(["image/gif", "image/png", "image/jpeg", "image/webp"]);
function authorized(request, env) {
  const expected = env.ADMIN_PASSWORD;
  const supplied = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  return Boolean(expected && supplied && supplied === expected);
}
export async function onRequestPost({ request, env }) {
  if (!authorized(request, env)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file.arrayBuffer !== "function") return Response.json({ error: "Choose an image file." }, { status: 400 });
  if (!TYPES.has(file.type)) return Response.json({ error: "Only GIF, PNG, JPG, and WebP images are allowed." }, { status: 415 });
  if (file.size > 8 * 1024 * 1024) return Response.json({ error: "Maximum file size is 8 MB." }, { status: 413 });
  await env.CARL_MEDIA.put("homepage/hero", await file.arrayBuffer(), { httpMetadata: { contentType: file.type, cacheControl: "public, max-age=300" }, customMetadata: { uploaded: new Date().toISOString() } });
  return Response.json({ ok: true });
}
export async function onRequestDelete({ request, env }) {
  if (!authorized(request, env)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await env.CARL_MEDIA.delete("homepage/hero");
  return Response.json({ ok: true });
}