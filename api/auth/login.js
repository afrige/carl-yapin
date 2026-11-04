// Starts the Yapin OAuth2 authorization-code flow (state + PKCE).
import { getConfig, authConfigured, siteOrigin, redirectUri } from "../_lib/config.js";
import { randomB64u, sha256B64u, sign, setCookie, OAUTH_COOKIE } from "../_lib/session.js";

export async function GET(request) {
  const c = getConfig();
  const origin = siteOrigin(request, c);
  if (!authConfigured(c)) return Response.redirect(origin + "/dashboard.html?auth=unconfigured", 302);

  const state = randomB64u(16), verifier = randomB64u(32);
  const pre = await sign({ state, verifier, exp: Math.floor(Date.now() / 1000) + 600 }, c.sessionSecret);
  const url = new URL(c.authUrl);
  url.searchParams.set("client_id", c.clientId);
  url.searchParams.set("redirect_uri", redirectUri(request, c));
  url.searchParams.set("response_type", "code");
  if (c.scopes) url.searchParams.set("scope", c.scopes);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", await sha256B64u(verifier));
  url.searchParams.set("code_challenge_method", "S256");
  return new Response(null, { status: 302, headers: { Location: url.toString(), "Set-Cookie": setCookie(OAUTH_COOKIE, pre, 600), "Cache-Control": "no-store" } });
}
