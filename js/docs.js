/* Carl — docs: scroll-spy for the sidebar and the "on this page" list. */
(function () {
  "use strict";
  var sections = Array.prototype.slice.call(document.querySelectorAll(".prose section[id]"));
  var nav = Array.prototype.slice.call(document.querySelectorAll(".docs-nav a"));
  var toc = document.querySelector(".docs-toc nav");
  if (!sections.length) return;

  // Build "on this page" from h3s
  var heads = Array.prototype.slice.call(document.querySelectorAll(".prose h3[id]"));
  if (toc) toc.innerHTML = heads.map(function (h) { return '<a href="#' + h.id + '">' + h.textContent + "</a>"; }).join("");
  var tocLinks = toc ? Array.prototype.slice.call(toc.querySelectorAll("a")) : [];

  function mark(links, id) { links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + id); }); }
  if (!("IntersectionObserver" in window)) return;
  var current = null;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { current = e.target.id; mark(nav, current); } });
  }, { rootMargin: "-20% 0px -70% 0px" });
  sections.forEach(function (s) { io.observe(s); });
  var io2 = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) mark(tocLinks, e.target.id); });
  }, { rootMargin: "-15% 0px -75% 0px" });
  heads.forEach(function (h) { io2.observe(h); });
  // keep the active sidebar pill visible on mobile
  nav.forEach(function (a) { a.addEventListener("click", function () { a.scrollIntoView({ block: "nearest", inline: "center" }); }); });
})();
