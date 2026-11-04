// Tells the dashboard whether the visitor is signed in. Never returns tokens.
import { getConfig, authConfigured } from "./_lib/config.js";
import { getSession, json } from "./_lib/session.js";
export async function GET(request) {
  const c = getConfig(); const configured = authConfigured(c);
  const s = configured ? await getSession(request, c.sessionSecret) : null;
  return json({ configured, authenticated: Boolean(s), user: s ? s.user : null, servers: s ? s.servers || [] : [] });
}
