/* Carl — dashboard preview. Nothing here talks to the bot; drafts live only in this browser. */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var KEY = "carl-dashboard-draft";

  /* Tabs */
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
  $$("[data-goto]").forEach(function (b) { b.addEventListener("click", function () { show(b.getAttribute("data-goto"), true); scrollTo({ top: 0 }); }); });

  /* Form state */
  var fields = {
    welcomeChannel: $("#welcomeChannel"), welcomeMessage: $("#welcomeMessage"),
    modEnabled: $("#modEnabled"), modLog: $("#modLog"), logChannel: $("#logChannel"),
    levelEnabled: $("#levelEnabled"), levelMessage: $("#levelMessage")
  };
  function collect() {
    var o = {};
    Object.keys(fields).forEach(function (k) { var f = fields[k]; o[k] = f.type === "checkbox" ? f.checked : f.value; });
    return o;
  }
  function fill(o) {
    Object.keys(fields).forEach(function (k) { if (o && k in o) { var f = fields[k]; if (f.type === "checkbox") f.checked = !!o[k]; else f.value = o[k]; } });
  }
  function sample(text) {
    return text.replace(/\{user\}/g, "@NewMember").replace(/\{server\}/g, "Your Server").replace(/\{level\}/g, "5");
  }
  function previews() {
    var w = fields.welcomeMessage.value.trim(), l = fields.levelMessage.value.trim();
    var wp = $("#welcomePreview"), lp = $("#levelPreview");
    wp.textContent = w ? sample(w) : "Your welcome message will appear here."; wp.style.opacity = w ? 1 : .5;
    lp.textContent = l ? sample(l) : "Your level-up message will appear here."; lp.style.opacity = l ? 1 : .5;
    var mod = fields.modEnabled.checked, lg = fields.modLog.checked;
    $("#modSummary").textContent = (mod ? "Moderation tools: on" : "Moderation tools: off") + " · " + (lg ? "action logging: on" : "action logging: off");
  }
  try { fill(JSON.parse(localStorage.getItem(KEY) || "null")); } catch (e) {}
  Object.keys(fields).forEach(function (k) { fields[k].addEventListener("input", previews); fields[k].addEventListener("change", previews); });
  previews();

  var fb = $("#dashboardFeedback");
  function say(msg, err) { fb.textContent = msg; fb.className = "feedback" + (err ? " error" : ""); }
  $$("[data-save-draft]").forEach(function (b) {
    b.addEventListener("click", function () {
      try { localStorage.setItem(KEY, JSON.stringify(collect())); say("Draft saved in this browser only. It has not been applied to Carl."); }
      catch (e) { say("Could not save a local draft (browser storage is unavailable).", true); }
    });
  });
  $$("[data-clear-draft]").forEach(function (b) {
    b.addEventListener("click", function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      Object.keys(fields).forEach(function (k) { var f = fields[k]; if (f.type === "checkbox") f.checked = false; else f.value = ""; });
      previews(); say("Draft cleared.");
    });
  });
})();
