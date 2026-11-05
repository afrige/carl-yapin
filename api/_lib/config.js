// Settings. Public Yapin values have defaults; secrets come only from Vercel environment variables.
export function getConfig(env = process.env) {
  return {
    clientId: env.YAPPER_CLIENT_ID || "6800cf86-10cf-40b2-a56b-8e8c730e2c75",
    clientSecret: env.YAPPER_CLIENT_SECRET || "",
    authUrl: env.YAPPER_AUTH_URL || "https://www.yapin.gg/oauth/authorize",
    // Defaults below come from a third-party description of Yapin's login, not official docs. Override with env vars if Yapin says otherwise.
    tokenUrl: env.YAPPER_TOKEN_URL || "https://www.yapin.gg/api/oauth/token",
    tokenFallback: env.YAPPER_TOKEN_URL ? "" : "https://www.yapin.gg/oauth/token",
    userUrl: env.YAPPER_USER_URL || "https://www.yapin.gg/api/oauth/me",
    userFallback: env.YAPPER_USER_URL ? "" : "https://www.yapin.gg/oauth/me",
    serversUrl: env.YAPPER_SERVERS_URL || "",
    scopes: env.YAPPER_SCOPES || "identify",
    sessionSecret: env.SESSION_SECRET || "",
    siteUrl: (env.SITE_URL || "").replace(/\/$/, "")
  };
}
// Login works only when every required value exists. Nothing is guessed.
export const authConfigured = (c) => Boolean(c.clientId && c.clientSecret && c.authUrl && c.tokenUrl && c.userUrl && c.sessionSecret);
export const siteOrigin = (request, c) => c.siteUrl || new URL(request.url).origin;
export const redirectUri = (request, c) => siteOrigin(request, c) + "/api/auth/callback";
