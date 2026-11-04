// Signed-cookie sessions (Web Crypto only).
const enc = new TextEncoder();
const dec = new TextDecoder();
export const SESSION_COOKIE = "carl_session";
export const OAUTH_COOKIE = "carl_oauth";
export const SESSION_SECONDS = 60 * 60 * 24 * 7;
const NO_STORE = { "Cache-Control": "no-store" };
export const json = (data, status = 200, extra = {}) => Response.json(data, { status, headers: { ...NO_STORE, ...extra } });

export function b64u(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = ""; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function fromB64u(str) {
  const s = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(s); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export const randomB64u = (n) => b64u(crypto.getRandomValues(new Uint8Array(n)));
export const sha256B64u = async (t) => b64u(await crypto.subtle.digest("SHA-256", enc.encode(t)));
const hmacKey = (secret) => crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

export async function sign(payload, secret) {
  const body = b64u(enc.encode(JSON.stringify(payload)));
  return body + "." + b64u(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(body)));
}
export async function verify(token, secret) {
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  let ok = false;
  try { ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromB64u(sig), enc.encode(body)); } catch { return null; }
  if (!ok) return null;
  let p; try { p = JSON.parse(dec.decode(fromB64u(body))); } catch { return null; }
  if (p.exp && Date.now() / 1000 > p.exp) return null;
  return p;
}
export function parseCookies(request) {
  const out = {};
  (request.headers.get("cookie") || "").split(";").forEach((p) => { const i = p.indexOf("="); if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
  return out;
}
export const setCookie = (name, value, maxAge) => `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
export const clearCookie = (name) => setCookie(name, "", 0);

export async function getSession(request, secret) {
  if (!secret) return null;
  const s = await verify(parseCookies(request)[SESSION_COOKIE], secret);
  return s && s.user ? s : null;
}
// Call at the top of any future API route that reads or changes a server's settings.
export async function requireSession(request, secret) {
  const s = await getSession(request, secret);
  return s ? { session: s } : { response: json({ error: "Not signed in" }, 401) };
}
