import { clearCookie, SESSION_COOKIE } from "../_lib/session.js";
export async function POST() {
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", "Set-Cookie": clearCookie(SESSION_COOKIE), "Cache-Control": "no-store" } });
}
