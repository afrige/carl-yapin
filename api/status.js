// Public status: only what can really be checked.
//  - this API (it answered)
//  - Vercel Blob storage (a real read) if BLOB_READ_WRITE_TOKEN exists
//  - the bot, ONLY if BOT_STATUS_URL is set (real HTTPS request, 4s timeout)
// Optional bot JSON: { "online": true, "servers": 123, "users": 4567 }
import { list } from "@vercel/blob";
import { json } from "./_lib/session.js";

export async function GET() {
  const storage = { configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN), ok: false };
  if (storage.configured) { try { await list({ prefix: "homepage/", limit: 1 }); storage.ok = true; } catch { storage.ok = false; } }

  const bot = { configured: false };
  const url = (process.env.BOT_STATUS_URL || "").trim();
  if (url) {
    bot.configured = true;
    if (!/^https:\/\//i.test(url)) { bot.online = null; bot.error = "BOT_STATUS_URL must start with https://"; }
    else {
      const started = Date.now(), ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 4000);
      try {
        const res = await fetch(url, { signal: ctl.signal, headers: { accept: "application/json" } });
        bot.responseMs = Date.now() - started;
        if (!res.ok) { bot.online = false; bot.error = "HTTP " + res.status; }
        else {
          let j = null; try { j = await res.json(); } catch {}
          bot.online = j && typeof j.online === "boolean" ? j.online : true;
          if (j && Number.isFinite(j.servers)) bot.servers = j.servers;
          if (j && Number.isFinite(j.users)) bot.users = j.users;
        }
      } catch { bot.online = false; bot.error = "unreachable"; } finally { clearTimeout(timer); }
    }
  }
  return json({ checkedAt: new Date().toISOString(), website: { ok: true }, storage, bot });
}
