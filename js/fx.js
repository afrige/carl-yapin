/* Carl — ambient particles. Tiny, DPR-capped, paused when the tab is hidden, disabled for reduced motion. */
(function () {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var canvas = document.getElementById("fx");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  var w = 0, h = 0, dpr = 1, ps = [], raf = 0, last = 0, rgb = "110,231,183", boost = 1;
  var weak = (navigator.hardwareConcurrency || 4) <= 2;

  function theme() {
    var light = document.documentElement.getAttribute("data-theme") === "light";
    rgb = light ? "5,150,105" : "110,231,183"; boost = light ? .6 : 1;
  }
  function seed() {
    var n = Math.min(weak ? 18 : 44, Math.round((w * h) / 30000));
    ps = [];
    for (var i = 0; i < n; i++) ps.push({
      x: Math.random() * w, y: Math.random() * h, r: .6 + Math.random() * 1.5,
      vy: -(.008 + Math.random() * .022), vx: (Math.random() - .5) * .012, a: .15 + Math.random() * .45, t: Math.random() * 6.28, s: .0006 + Math.random() * .0012
    });
  }
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    var dt = Math.min(now - last, 50); last = now;
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.t += p.s * dt;
      if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
      if (p.x < -4) p.x = w + 4; else if (p.x > w + 4) p.x = -4;
      var a = p.a * (.55 + .45 * Math.sin(p.t)) * boost;
      ctx.beginPath(); ctx.fillStyle = "rgba(" + rgb + "," + a.toFixed(3) + ")";
      ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
    }
  }
  function start() { if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 200); });
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  new MutationObserver(theme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  theme(); resize(); start();
})();
