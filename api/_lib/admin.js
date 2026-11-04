// Shared admin password check (constant-time).
import { json, sha256B64u } from "./session.js";
import { timingSafeEqual } from "node:crypto";
export async function adminCheck(request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return json({ error: "ADMIN_PASSWORD is not configured" }, 503);
  const given = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(await sha256B64u(given)), b = Buffer.from(await sha256B64u(expected));
  return timingSafeEqual(a, b) ? null : json({ error: "Unauthorized" }, 401);
}
