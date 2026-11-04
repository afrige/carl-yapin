/* Carl — status page. Shows only what /api/status actually reports. */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var hero = $("#statusHero"), rows = $("#statusRows"), meta = $("#statusMeta"), btn = $("#refreshBtn");
  if (!rows) return;
  var ICON = {
    ok: '<svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
    warn: '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
    idle: '<svg class="ic" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'
  };
  function row(name, desc, cls, label) {
    return '<div class="status-row"><span class="status-dot ' + cls + '"></span><div class="info"><b>' + name + '</b><small>' + desc + '</small></div><span class="state ' + cls + '">' + label + '</span></div>';
  }
  function banner(kind, title, text) {
    hero.className = "status-hero " + (kind === "ok" ? "" : kind);
    hero.querySelector(".big").innerHTML = ICON[kind === "ok" ? "ok" : kind === "idle" ? "idle" : "warn"];
    hero.querySelector("h2").textContent = title;
    hero.querySelector("p").textContent = text;
  }
  function render(res) {
    var html = row("Website", "This page was served successfully.", "ok", "Online");
    if (!res.ok) {
      html += row("Status API", "Could not reach /api/status. It only runs on the deployed site (Vercel).", "warn", "Unreachable");
      html += row("Media storage", "Unknown while the status API is unreachable.", "", "Unknown");
      html += row("Carl bot", "Unknown while the status API is unreachable.", "", "Unknown");
      rows.innerHTML = html;
      banner("warn", "Live checks unavailable", "The website is up, but the status API could not be reached, so nothing else can be reported.");
      meta.innerHTML = "<span>Checked at " + new Date().toLocaleTimeString() + "</span>";
      return;
    }
    var d = res.data, bot = d.bot || {}, st = d.storage || {};
    html += row("Status API", "Responding.", "ok", "Online");
    html += st.configured ? (st.ok ? row("Media storage", "Vercel Blob storage is reachable (homepage media).", "ok", "Connected") : row("Media storage", "Blob store is connected but a test read failed.", "bad", "Error"))
                          : row("Media storage", "No Blob store connected. Homepage uploads are unavailable.", "warn", "Not configured");
    var botDesc, botCls, botLabel;
    if (!bot.configured) { botDesc = "No live status source is connected. Set BOT_STATUS_URL to report real bot status."; botCls = ""; botLabel = "Not connected"; }
    else if (bot.online === true) { botDesc = "Status endpoint responded" + (typeof bot.responseMs === "number" ? " in " + bot.responseMs + " ms" : "") + "."; botCls = "ok"; botLabel = "Online"; }
    else if (bot.online === false) { botDesc = "Status endpoint check failed" + (bot.error ? " (" + String(bot.error).replace(/[<>&]/g, "") + ")" : "") + "."; botCls = "bad"; botLabel = "Offline"; }
    else { botDesc = "Status endpoint is configured but returned no usable result."; botCls = "warn"; botLabel = "Unknown"; }
    html += row("Carl bot", botDesc, botCls, botLabel);
    rows.innerHTML = html;

    if (bot.configured && bot.online === false) banner("bad", "Carl bot is not responding", "The website is up, but the bot's status endpoint failed its latest check.");
    else if (st.configured && !st.ok) banner("warn", "Partial issue", "The website is up but media storage failed its latest check.");
    else if (!bot.configured) banner("idle", "Website online", "Bot status is not connected yet, so Carl's own uptime is not being reported.");
    else banner("ok", "All connected systems operational", "Every connected check passed on the latest run.");

    var parts = [];
    var t = d.checkedAt ? new Date(d.checkedAt) : new Date();
    parts.push("<span>Last checked " + t.toLocaleTimeString() + "</span>");
    if (typeof bot.servers === "number") parts.push("<span>Servers: " + bot.servers.toLocaleString() + "</span>");
    if (typeof bot.users === "number") parts.push("<span>Members: " + bot.users.toLocaleString() + "</span>");
    meta.innerHTML = parts.join("");
  }
  function run(force) {
    document.body.classList.add("refreshing"); btn.disabled = true;
    window.CarlStatus.load(force).then(function (res) { render(res); }).then(function () { document.body.classList.remove("refreshing"); btn.disabled = false; });
  }
  btn.addEventListener("click", function () { run(true); });
  setInterval(function () { if (!document.hidden) run(true); }, 30000);
  run(false);
})();
