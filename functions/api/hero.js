export async function onRequestGet({ env }) {
  if (!env.CARL_MEDIA) return Response.json({ url: null });
  const object = await env.CARL_MEDIA.get("homepage/hero");
  if (!object) return Response.json({ url: null });
  const version = object.uploaded ? new Date(object.uploaded).getTime() : (object.etag || Date.now());
  return Response.json({ url: "/api/hero-image?v=" + encodeURIComponent(version) });
}
