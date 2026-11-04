/* Carl — dashboard. Requires a Yapper session (/api/me). Settings are drafts only; nothing is sent to the bot. */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var KEY = "carl-dashboard-draft", SERVER_KEY = "carl-dashboard-server";
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  var loading = $("#authLoading"), gate = $("#authGate"), app = $("#dashApp");

  /* ---------- Auth gate ---------- */
  var MESSAGES = {
    unconfigured: ["Login is not configured yet", "The site owner still needs to add Yapper OAuth details in Vercel."],
    failed: ["Sign-in did not complete", "Something went wrong while signing in. Please try again."],
    denied: ["Sign-in was cancelled", "You did not approve the request on Yapper."],
    unreachable: ["Login service unreachable", "The login API could not be reached. It only runs on the deployed site."]
  };
  function showGate(kind, configured) {
    loading.hidden = true; app.hidden = true; gate.hidden = false;
    var box = $("#authMsg");
    if (kind && MESSAGES[kind]) {
      box.hidden = false; box.querySelector("b").textContent = MESSAGES[kind][0]; box.querySelector("p").textContent = MESSAGES[kind][1];
    } else box.hidden = true;
    var off = configured === false || kind === "unconfigured" || kind === "unreachable";
    $("#authSetup").hidden = !off;
    var btn = $("#loginBtn");
    if (off) { btn.setAttribute("aria-disabled", "true"); btn.removeAttribute("href"); } else { btn.removeAttribute("aria-disabled"); btn.setAttribute("href", "/api/auth/login"); }
  }
  function cleanUrl() { if (location.search) history.replaceState(null, "", location.pathname + location.hash); }

  var authParam = new URLSearchParams(location.search).get("auth");
  cleanUrl();

  fetch("/api/me", { cache: "no-store", credentials: "same-origin" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (me) {
      if (!me.configured) return showGate("unconfigured", false);
      if (!me.authenticated) return showGate(authParam, true);
      start(me);
    })
    .catch(function () { showGate("unreachable", false); });

  /* ---------- Signed-in app ---------- */
  function start(me) {
    loading.hidden = true; gate.hidden = true; app.hidden = false;
    var u = me.user || {};
    $("#userName").textContent = u.name || "Signed in";
    var av = $("#userAvatar");
    if (u.avatar) av.style.backgroundImage = 'url("' + String(u.avatar).replace(/"/g, "%22") + '")'; else av.textContent = (u.name || "?").charAt(0).toUpperCase();

    // server picker (only real servers returned by Yapper)
    var sel = $("#serverSelect"), servers = me.servers || [];
    if (servers.length) {
      sel.innerHTML = servers.map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.name) + "</option>"; }).join("");
      try { var saved = localStorage.getItem(SERVER_KEY); if (saved && servers.some(function (s) { return s.id === saved; })) sel.value = saved; } catch (e) {}
      sel.addEventListener("change", function () { try { localStorage.setItem(SERVER_KEY, sel.value); } catch (e) {} });
      $("#serverHint").textContent = servers.length + (servers.length === 1 ? " server" : " servers") + " available";
      $("#serverTag").textContent = "Ready"; $("#serverTag").className = "tag tag-accent";
    } else {
      sel.disabled = true;
      $("#serverHint").textContent = "Yapper did not return a server list (set YAPPER_SERVERS_URL)";
    }

    $("#logoutBtn").addEventListener("click", function () {
      fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).finally(function () { location.reload(); });
    });

    initTabs(); initDrafts(); initStatus();
  }

  /* ---------- Live status ---------- */
  var ICON = {
    ok: '<svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
    warn: '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
    idle: '<svg class="ic" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'
  };
  function row(name, desc, cls, label) {
    return '<div class="status-row"><span class="status-dot ' + cls + '"></span><div class="info"><b>' + name + "</b><small>" + desc + '</small></div><span class="state ' + cls + '">' + label + "</span></div>";
  }
  function banner(kind, title, text) {
    var h = $("#dashStatusHero");
    h.className = "status-hero " + (kind === "ok" ? "" : kind);
    h.querySelector(".big").innerHTML = ICON[kind === "ok" ? "ok" : kind === "idle" ? "idle" : "warn"];
    h.querySelector("h2").textContent = title; h.querySelector("p").textContent = text;
  }
  function renderStatus(res) {
    var rows = $("#dashStatusRows"), meta = $("#dashStatusMeta");
    if (!res.ok) {
      rows.innerHTML = row("Website", "This page loaded.", "ok", "Online") + row("Carl bot", "Unknown — the status API could not be reached.", "", "Unknown");
      banner("warn", "Live checks unavailable", "The status API could not be reached, so Carl's status is unknown.");
      meta.innerHTML = "<span>Checked at " + new Date().toLocaleTimeString() + "</span>"; return;
    }
    var d = res.data, bot = d.bot || {}, st = d.storage || {};
    var botRow;
    if (!bot.configured) botRow = row("Carl bot", "No live status source connected. Set BOT_STATUS_URL.", "", "Not connected");
    else if (bot.online === true) botRow = row("Carl bot", "Status endpoint responded" + (typeof bot.responseMs === "number" ? " in " + bot.responseMs + " ms" : "") + ".", "ok", "Online");
    else if (bot.online === false) botRow = row("Carl bot", "Status check failed" + (bot.error ? " (" + esc(bot.error) + ")" : "") + ".", "bad", "Offline");
    else botRow = row("Carl bot", "Configured but returned no usable result.", "warn", "Unknown");
    rows.innerHTML = row("Website", "Serving normally.", "ok", "Online") + botRow +
      (st.configured ? row("Media storage", st.ok ? "Blob storage reachable." : "Blob storage read failed.", st.ok ? "ok" : "bad", st.ok ? "Connected" : "Error") : row("Media storage", "No Blob store connected.", "warn", "Not configured"));
    if (bot.configured && bot.online === false) banner("bad", "Carl is not responding", "The latest status check failed.");
    else if (!bot.configured) banner("idle", "Website online", "Bot status is not connected, so Carl's own status is not reported.");
    else banner("ok", "Carl is online", "The latest status check passed.");
    var parts = ["<span>Last checked " + (d.checkedAt ? new Date(d.checkedAt) : new Date()).toLocaleTimeString() + "</span>"];
    if (typeof bot.servers === "number") parts.push("<span>Servers: " + bot.servers.toLocaleString() + "</span>");
    if (typeof bot.users === "number") parts.push("<span>Members: " + bot.users.toLocaleString() + "</span>");
    meta.innerHTML = parts.join("");
  }
  function initStatus() {
    var btn = $("#dashRefresh");
    function run(force) {
      btn.disabled = true; btn.classList.add("refreshing");
      window.CarlStatus.load(force).then(renderStatus).then(function () { btn.disabled = false; btn.classList.remove("refreshing"); });
    }
    btn.addEventListener("click", function () { run(true); });
    setInterval(function () { if (!document.hidden) run(true); }, 30000);
    run(false);
  }

  /* ---------- Tabs ---------- */
  function initTabs() {
    var tabs = $$("[data-tab]"), panels = $$(".dash-panel");
    function show(id, push) {
      if (!panels.some(function (p) { return p.id === "panel-" + id; })) id = "overview";
      tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t.getAttribute("data-tab") === id)); });
      panels.forEach(function (p) { p.classList.toggle("active", p.id === "panel-" + id); });
      if (push) history.replaceState(null, "", "#" + id);
    }
    tabs.forEach(function (t) { t.addEventListener("click", function () { show(t.getAttribute("data-tab"), true); }); });
    addEventListener("hashchange", function () { show(location.hash.slice(1)); });
    show(location.hash.slice(1));
  }

  /* ---------- Local drafts ---------- */
  function initDrafts() {
    var fields = {
      welcomeChannel: $("#welcomeChannel"), welcomeMessage: $("#welcomeMessage"),
      modEnabled: $("#modEnabled"), modLog: $("#modLog"), logChannel: $("#logChannel"),
      levelEnabled: $("#levelEnabled"), levelMessage: $("#levelMessage")
    };
    function collect() { var o = {}; Object.keys(fields).forEach(function (k) { var f = fields[k]; o[k] = f.type === "checkbox" ? f.checked : f.value; }); return o; }
    function fill(o) { Object.keys(fields).forEach(function (k) { if (o && k in o) { var f = fields[k]; if (f.type === "checkbox") f.checked = !!o[k]; else f.value = o[k]; } }); }
    function sample(t) { return t.replace(/\{user\}/g, "@NewMember").replace(/\{server\}/g, "Your Server").replace(/\{level\}/g, "5"); }
    function previews() {
      var w = fields.welcomeMessage.value.trim(), l = fields.levelMessage.value.trim(), wp = $("#welcomePreview"), lp = $("#levelPreview");
      wp.textContent = w ? sample(w) : "Your welcome message will appear here."; wp.style.opacity = w ? 1 : .5;
      lp.textContent = l ? sample(l) : "Your level-up message will appear here."; lp.style.opacity = l ? 1 : .5;
      $("#modSummary").textContent = (fields.modEnabled.checked ? "Moderation tools: on" : "Moderation tools: off") + " · " + (fields.modLog.checked ? "action logging: on" : "action logging: off");
    }
    try { fill(JSON.parse(localStorage.getItem(KEY) || "null")); } catch (e) {}
    Object.keys(fields).forEach(function (k) { fields[k].addEventListener("input", previews); fields[k].addEventListener("change", previews); });
    previews();
    var fb = $("#dashboardFeedback");
    function say(m, err) { fb.textContent = m; fb.className = "feedback" + (err ? " error" : ""); }
    $$("[data-save-draft]").forEach(function (b) { b.addEventListener("click", function () {
      try { localStorage.setItem(KEY, JSON.stringify(collect())); say("Draft saved in this browser only. It has not been applied to Carl."); } catch (e) { say("Could not save a local draft (browser storage unavailable).", true); }
    }); });
    $$("[data-clear-draft]").forEach(function (b) { b.addEventListener("click", function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      Object.keys(fields).forEach(function (k) { var f = fields[k]; if (f.type === "checkbox") f.checked = false; else f.value = ""; });
      previews(); say("Draft cleared.");
    }); });
  }
})();
