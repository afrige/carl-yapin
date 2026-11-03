/* Carl — shared site behaviour: navigation, reveal, card lighting, status, hero media. */
(function () {
  "use strict";
  var d = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Loader / ready ---------- */
  function ready() { d.classList.add("is-ready"); }
  function initLoader() {
    var loader = $("#loader");
    if (!loader || d.classList.contains("no-loader")) { ready(); return; }
    var start = performance.now(), done = false;
    function finish() {
      if (done) return; done = true;
      var wait = Math.max(0, 650 - (performance.now() - start));
      setTimeout(function () {
        loader.classList.add("hide"); ready();
        try { sessionStorage.setItem("carl-seen", "1"); } catch (e) {}
        setTimeout(function () { loader.remove(); }, 600);
      }, wait);
    }
    if (document.readyState === "complete") finish(); else addEventListener("load", finish);
    setTimeout(finish, 2200);
  }

  /* ---------- Navigation ---------- */
  function initNav() {
    var nav = $(".nav"), menu = $(".menu-toggle");
    if (!nav) return;
    var ind = $(".nav-indicator", nav), links = $$("a", nav), active = $("a.active", nav);
    function move(el) {
      if (!ind || !el || innerWidth <= 820) return;
      ind.style.width = el.offsetWidth + "px";
      ind.style.transform = "translateX(" + el.offsetLeft + "px)";
      ind.classList.add("on");
    }
    function rest() { if (active) move(active); else if (ind) ind.classList.remove("on"); }
    links.forEach(function (a) {
      a.addEventListener("pointerenter", function () { move(a); });
      a.addEventListener("focus", function () { move(a); });
    });
    nav.addEventListener("pointerleave", rest);
    nav.addEventListener("focusout", function (e) { if (!nav.contains(e.relatedTarget)) rest(); });
    addEventListener("resize", rest);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rest);
    rest();

    if (menu) {
      var setOpen = function (o) { nav.classList.toggle("open", o); menu.setAttribute("aria-expanded", String(o)); };
      menu.addEventListener("click", function () { setOpen(!nav.classList.contains("open")); });
      links.forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
      addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
      document.addEventListener("click", function (e) { if (!nav.contains(e.target) && !menu.contains(e.target)) setOpen(false); });
    }
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var els = $$(".reveal");
    if (!els.length) return;
    if (reduce || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: .12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- Card spotlight (event delegation, rAF throttled) ---------- */
  function initGlow() {
    if (reduce || !matchMedia("(hover: hover)").matches) return;
    var raf = 0, ev = null;
    document.addEventListener("pointermove", function (e) {
      ev = e; if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var card = ev.target.closest && ev.target.closest(".glow-card");
        if (!card) return;
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (ev.clientX - r.left) + "px");
        card.style.setProperty("--my", (ev.clientY - r.top) + "px");
      });
    }, { passive: true });
  }

  /* ---------- Copy buttons ---------- */
  function initCopy() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-copy]");
      if (!btn) return;
      var text = btn.getAttribute("data-copy");
      if (text.charAt(0) === "#") { var t = $(text); text = t ? t.innerText : ""; }
      var ok = function () {
        btn.classList.add("done");
        var label = btn.getAttribute("data-label");
        if (label) { btn.dataset.prev = btn.textContent; btn.textContent = "Copied"; }
        setTimeout(function () { btn.classList.remove("done"); if (btn.dataset.prev) { btn.textContent = btn.dataset.prev; } }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () {});
    });
  }

  /* ---------- Chip filters (features) ---------- */
  function initFilters() {
    $$("[data-filter-group]").forEach(function (group) {
      var chips = $$("[data-filter]", group), items = $$("[data-cat]");
      chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
          var f = chip.getAttribute("data-filter");
          chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
          items.forEach(function (it) { it.hidden = !(f === "all" || it.getAttribute("data-cat") === f); });
        });
      });
    });
  }

  /* ---------- Add Carl links ---------- */
  function initInvite() {
    var url = (window.CARL_CONFIG && window.CARL_CONFIG.inviteUrl || "").trim();
    $$("[data-add-carl]").forEach(function (a) {
      if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; }
      else { a.href = "/docs.html#invite"; a.title = "Invite link not configured yet — see the docs"; }
    });
    $$("[data-invite-configured]").forEach(function (el) { el.hidden = !url; });
    $$("[data-invite-missing]").forEach(function (el) { el.hidden = !!url; });
  }

  /* ---------- Live status (shared) ---------- */
  var statusPromise = null;
  window.CarlStatus = {
    load: function (force) {
      if (statusPromise && !force) return statusPromise;
      var ctl = ("AbortController" in window) ? new AbortController() : null;
      var timer = ctl && setTimeout(function () { ctl.abort(); }, 8000);
      statusPromise = fetch("/api/status", { cache: "no-store", signal: ctl ? ctl.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (data) { return { ok: true, data: data }; })
        .catch(function (err) { return { ok: false, error: err }; })
        .then(function (res) { if (timer) clearTimeout(timer); return res; });
      return statusPromise;
    }
  };
  function fmt(n) { try { return new Intl.NumberFormat().format(n); } catch (e) { return String(n); } }
  function initStatusWidgets() {
    var pills = $$("[data-status-pill]"), stats = $("#liveStats");
    if (!pills.length && !stats) return;
    window.CarlStatus.load().then(function (res) {
      var state = "warn", text = "Status unavailable";
      var bot = res.ok && res.data && res.data.bot;
      if (res.ok && bot) {
        if (!bot.configured) { state = ""; text = "Live status not connected"; }
        else if (bot.online === true) { state = "ok"; text = "Carl is online"; }
        else if (bot.online === false) { state = "bad"; text = "Carl is offline"; }
        else { state = "warn"; text = "Status unavailable"; }
      }
      pills.forEach(function (p) {
        var dot = $(".status-dot", p), label = $("[data-status-text]", p);
        if (dot) dot.className = "status-dot" + (state ? " " + state : "");
        if (label) label.textContent = text;
      });
      if (stats && bot && bot.configured) {
        var shown = 0;
        [["servers", "Servers"], ["users", "Members"]].forEach(function (k) {
          var el = $("[data-stat='" + k[0] + "']", stats);
          if (!el) return;
          var v = bot[k[0]];
          if (typeof v === "number" && isFinite(v)) { $("strong", el).textContent = fmt(v); el.hidden = false; shown++; }
        });
        if (shown) stats.hidden = false;
      }
    });
  }

  /* ---------- Hero media: custom R2 upload if present, bundled GIF otherwise ---------- */
  function initHero() {
    var img = $("#heroImg");
    if (!img) return;
    var fallback = img.getAttribute("data-fallback");
    var set = function (src) { if (img.getAttribute("src") !== src) img.src = src; };
    img.addEventListener("error", function () { if (img.getAttribute("src") !== fallback) img.src = fallback; });
    var ctl = ("AbortController" in window) ? new AbortController() : null;
    var timer = ctl && setTimeout(function () { ctl.abort(); }, 2500);
    fetch("/api/hero", { signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { set(data && data.url ? data.url : fallback); })
      .catch(function () { set(fallback); })
      .then(function () { if (timer) clearTimeout(timer); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLoader(); initNav(); initReveal(); initGlow(); initCopy(); initFilters(); initInvite(); initStatusWidgets(); initHero();
  });
})();
