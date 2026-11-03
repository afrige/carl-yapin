export async function onRequestGet({ env }) {
  const object = await env.CARL_MEDIA.get("homepage/hero");
  if (!object) return Response.json({ url: null });
  return Response.json({ url: "/api/hero-image?v=" + (object.uploaded || object.etag || Date.now()) });
}