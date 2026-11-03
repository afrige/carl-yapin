export async function onRequestGet({ env }) {
  const object = await env.CARL_MEDIA.get("homepage/hero");
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=300");
  return new Response(object.body, { headers });
}