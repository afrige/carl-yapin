// Public status endpoint. Reports only what can really be checked:
//  - the site/API (this response)
//  - the R2 media binding (a real read)
//  - the bot, ONLY if BOT_STATUS_URL is configured (a real HTTPS request with a 4s timeout)
// Optional bot JSON: { "online": true, "servers": 123, "users": 4567 } — numbers are passed through only if present.
export async function onRequestGet({ env }) {
  const storage = { configured: Boolean(env.CARL_MEDIA), ok: false };
  if (storage.configured) {
    try { await env.CARL_MEDIA.head("homepage/hero"); storage.ok = true; } catch (e) { storage.ok = false; }
  }

  const bot = { configured: false };
  const url = (env.BOT_STATUS_URL || "").trim();
  if (url) {
    bot.configured = true;
    if (!/^https:\/\//i.test(url)) {
      bot.online = null; bot.error = "BOT_STATUS_URL must start with https://";
    } else {
      const started = Date.now();
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 4000);
      try {
        const res = await fetch(url, { signal: ctl.signal, headers: { accept: "application/json" } });
        bot.responseMs = Date.now() - started;
        if (!res.ok) { bot.online = false; bot.error = "HTTP " + res.status; }
        else {
          let j = null;
          try { j = await res.json(); } catch (e) {}
          bot.online = j && typeof j.online === "boolean" ? j.online : true;
          if (j && Number.isFinite(j.servers)) bot.servers = j.servers;
          if (j && Number.isFinite(j.users)) bot.users = j.users;
        }
      } catch (e) {
        bot.online = false; bot.error = "unreachable";
      } finally { clearTimeout(timer); }
    }
  }

  return Response.json(
    { checkedAt: new Date().toISOString(), website: { ok: true }, storage, bot },
    { headers: { "Cache-Control": "no-store" } }
  );
}
