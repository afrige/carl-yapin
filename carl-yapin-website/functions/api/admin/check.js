export async function onRequestGet({ request, env }) {
  const expected = env.ADMIN_PASSWORD;
  if (!expected) return Response.json({ error: "ADMIN_PASSWORD is not configured." }, { status: 503 });
  const supplied = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (supplied !== expected) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ ok: true });
}