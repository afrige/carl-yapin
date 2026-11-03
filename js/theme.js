/* Carl — theme + boot flags. Loaded synchronously in <head> to avoid a flash of the wrong theme. */
(function () {
  var d = document.documentElement, KEY = "carl-theme";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function apply(t) {
    d.setAttribute("data-theme", t);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "light" ? "#f6f8f7" : "#050807");
  }

  var saved = read();
  // Dark is the brand default; a saved choice always wins.
  var initial = saved === "light" || saved === "dark" ? saved : "dark";
  apply(initial);

  d.classList.add("js");
  try { if (reduce || sessionStorage.getItem("carl-seen")) d.classList.add("no-loader"); } catch (e) {}
  // Safety net: never leave entrance animations paused if site.js fails to load.
  setTimeout(function () { d.classList.add("is-ready"); }, 3500);

  document.addEventListener("DOMContentLoaded", function () {
    apply(d.getAttribute("data-theme"));
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = d.getAttribute("data-theme") === "dark" ? "light" : "dark";
        d.classList.add("theme-anim");
        apply(next); write(next);
        btn.setAttribute("aria-label", next === "dark" ? "Switch to light theme" : "Switch to dark theme");
        setTimeout(function () { d.classList.remove("theme-anim"); }, 450);
      });
      btn.setAttribute("aria-label", d.getAttribute("data-theme") === "dark" ? "Switch to light theme" : "Switch to dark theme");
    });
  });

  // Keep multiple tabs in sync.
  window.addEventListener("storage", function (e) {
    if (e.key === KEY && (e.newValue === "light" || e.newValue === "dark")) apply(e.newValue);
  });
})();
