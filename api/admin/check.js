import { adminCheck } from "../_lib/admin.js";
import { json } from "../_lib/session.js";
export async function GET(request) {
  const r = await adminCheck(request); if (r) return r;
  return json({ ok: true });
}
