// Finishes the OAuth2 flow and stores a signed, HttpOnly session cookie.
import { getConfig, authConfigured, siteOrigin, redirectUri } from "../_lib/config.js";
import { parseCookies, verify, sign, setCookie, clearCookie, OAUTH_COOKIE, SESSION_COOKIE, SESSION_SECONDS } from "../_lib/session.js";

// ADJUST HERE if Yapin's user JSON uses other field names.
function normalizeUser(u) {
  if (u && typeof u === "object" && u.data && typeof u.data === "object" && !u.id) u = u.data;
  const id = u.id ?? u.user_id ?? u.sub;
  const name = u.username ?? u.name ?? u.display_name ?? u.handle;
  const avatar = u.avatar_url ?? u.avatar ?? u.picture ?? null;
  if (id == null || !name) return null;
  return { id: String(id), name: String(name).slice(0, 64), avatar: typeof avatar === "string" && avatar.startsWith("https://") ? avatar : null };
}
function normalizeServers(data) {
  const list = Array.isArray(data) ? data : (data && (data.servers || data.guilds || data.communities)) || [];
  return list.slice(0, 25).map((s) => ({ id: String(s.id ?? s.server_id ?? ""), name: String(s.name ?? s.title ?? "").slice(0, 48) })).filter((s) => s.id && s.name);
}

export async function GET(request) {
  const c = getConfig();
  const origin = siteOrigin(request, c);
  const fail = (why) => { const h = new Headers({ Location: origin + "/dashboard.html?auth=" + why }); h.append("Set-Cookie", clearCookie(OAUTH_COOKIE)); return new Response(null, { status: 302, headers: h }); };
  if (!authConfigured(c)) return fail("unconfigured");

  const q = new URL(request.url).searchParams;
  if (q.get("error")) return fail("denied");
  const code = q.get("code"), state = q.get("state");
  const pre = await verify(parseCookies(request)[OAUTH_COOKIE], c.sessionSecret);
  if (!code || !state || !pre || pre.state !== state) return fail("failed");

  try {
    const tokenRes = await fetch(c.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri(request, c), client_id: c.clientId, client_secret: c.clientSecret, code_verifier: pre.verifier })
    });
    if (!tokenRes.ok) return fail("failed");
    const token = (await tokenRes.json()).access_token;
    if (!token) return fail("failed");

    const auth = { Authorization: "Bearer " + token, Accept: "application/json" };
    const userRes = await fetch(c.userUrl, { headers: auth });
    if (!userRes.ok) return fail("failed");
    const user = normalizeUser(await userRes.json());
    if (!user) return fail("failed");

    let servers = [];
    if (c.serversUrl) { try { const r = await fetch(c.serversUrl, { headers: auth }); if (r.ok) servers = normalizeServers(await r.json()); } catch {} }
    const payload = { user, servers, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS };
    let val = await sign(payload, c.sessionSecret);
    while (val.length > 3600 && payload.servers.length) { payload.servers.pop(); val = await sign(payload, c.sessionSecret); }

    const h = new Headers({ Location: origin + "/dashboard.html", "Cache-Control": "no-store" });
    h.append("Set-Cookie", setCookie(SESSION_COOKIE, val, SESSION_SECONDS));
    h.append("Set-Cookie", clearCookie(OAUTH_COOKIE));
    return new Response(null, { status: 302, headers: h });
  } catch { return fail("failed"); }
}
