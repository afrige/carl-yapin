/* Carl — searchable command directory (renders from commands-data.js). */
(function () {
  "use strict";
  var data = window.CARL_COMMANDS;
  var list = document.getElementById("cmdList"), search = document.getElementById("cmdSearch"),
      chipsEl = document.getElementById("cmdChips"), countEl = document.getElementById("cmdCount");
  if (!data || !list) return;
  var cmds = data.commands || [], cats = data.categories || [];
  var active = "all", q = "";
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var catLabel = function (id) { var c = cats.filter(function (x) { return x.id === id; })[0]; return c ? c.label : id; };
  var copyIcon = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';

  var pref = document.getElementById("prefixValue"), prefTag = document.getElementById("prefixTag");
  if (pref) pref.textContent = data.prefix || "";
  if (prefTag) { prefTag.textContent = data.prefixVerified ? "Verified" : "Unverified"; prefTag.className = "tag " + (data.prefixVerified ? "tag-accent" : "tag-warn"); }

  function buildChips() {
    var counts = { all: cmds.length };
    cmds.forEach(function (c) { counts[c.category] = (counts[c.category] || 0) + 1; });
    var items = [{ id: "all", label: "All" }].concat(cats.filter(function (c) { return counts[c.id]; }));
    chipsEl.innerHTML = items.map(function (c) {
      return '<button class="chip" type="button" data-cat="' + esc(c.id) + '" aria-pressed="' + (c.id === active) + '">' + esc(c.label) + ' <span class="count">' + counts[c.id] + '</span></button>';
    }).join("");
  }
  function render() {
    var term = q.trim().toLowerCase();
    var out = cmds.filter(function (c) {
      if (active !== "all" && c.category !== active) return false;
      if (!term) return true;
      return (c.name + " " + c.description + " " + c.usage + " " + catLabel(c.category)).toLowerCase().indexOf(term) !== -1;
    });
    countEl.textContent = out.length + (out.length === 1 ? " command" : " commands");
    if (!out.length) {
      list.innerHTML = '<div class="empty"><img src="/assets/carl.svg" alt="" width="84" height="84"><h3>' +
        (cmds.length ? "No commands match your search" : "No commands listed yet") + '</h3><p>' +
        (cmds.length ? "Try a different keyword or clear the category filter." : "Add Carl's real commands to js/commands-data.js and they will appear here.") + '</p></div>';
      return;
    }
    list.innerHTML = out.map(function (c) {
      return '<article class="cmd-item"><code>' + esc((data.prefix || "") + c.name) + '</code>' +
        '<div><h3>' + esc(c.name) + '</h3><p>' + esc(c.description) + '</p>' +
        '<div class="cmd-usage"><code>' + esc(c.usage) + '</code><button class="copy-btn" type="button" data-copy="' + esc(c.usage) + '" aria-label="Copy usage for ' + esc(c.name) + '">' + copyIcon + '</button></div></div>' +
        '<div class="cmd-meta"><span class="tag">' + esc(catLabel(c.category)) + '</span>' +
        (c.verified ? '<span class="tag tag-accent">Verified</span>' : '<span class="tag tag-warn" title="Not yet checked against the bot">Unverified example</span>') + '</div></article>';
    }).join("");
  }
  chipsEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]"); if (!b) return;
    active = b.getAttribute("data-cat");
    Array.prototype.forEach.call(chipsEl.children, function (c) { c.setAttribute("aria-pressed", String(c === b)); });
    render();
  });
  search.addEventListener("input", function () { q = search.value; render(); });
  document.addEventListener("keydown", function (e) {
    var t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if (e.key === "/" && !typing) { e.preventDefault(); search.focus(); }
    if (e.key === "Escape" && t === search) { search.value = ""; q = ""; render(); search.blur(); }
  });
  buildChips(); render();
})();
