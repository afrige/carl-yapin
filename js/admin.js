/* Carl — homepage media studio. The admin password is held in memory only. */
document.addEventListener("DOMContentLoaded", function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var DEFAULT_SRC = "/assets/homehero.gif", MAX = 8 * 1024 * 1024;
  var TYPES = ["image/gif", "image/png", "image/jpeg", "image/webp"];
  var password = "", file = null, objectUrl = null, busy = false, hasCustom = false;

  var loginArea = $("#loginArea"), studio = $("#studioArea"), loginFb = $("#loginFeedback"), upFb = $("#uploadFeedback"),
      pw = $("#adminPassword"), preview = $("#currentPreview"), badge = $("#currentBadge"),
      drop = $("#dropzone"), input = $("#heroFile"), info = $("#fileInfo"),
      upBtn = $("#uploadButton"), rmBtn = $("#removeButton"), prog = $("#progress"), bar = $("#progress i");

  function say(el, msg, err) { el.textContent = msg; el.className = "feedback" + (err ? " error" : ""); }
  function api(path, opts) {
    opts = opts || {}; opts.headers = Object.assign({}, opts.headers, { Authorization: "Bearer " + password });
    return fetch(path, opts);
  }
  function size(n) { return n > 1048576 ? (n / 1048576).toFixed(2) + " MB" : Math.round(n / 1024) + " KB"; }

  function loadCurrent() {
    return fetch("/api/hero", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (d) {
      hasCustom = !!(d && d.url);
      preview.querySelector("img").src = hasCustom ? d.url : DEFAULT_SRC;
      badge.textContent = hasCustom ? "Custom · stored in R2" : "Default · bundled homehero.gif";
      badge.className = "tag badge " + (hasCustom ? "tag-accent" : "");
      rmBtn.disabled = !hasCustom || busy;
    });
  }
  function pick(f) {
    say(upFb, "");
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
    if (!f) { file = null; info.hidden = true; upBtn.disabled = true; return; }
    if (TYPES.indexOf(f.type) === -1) { file = null; info.hidden = true; upBtn.disabled = true; say(upFb, "Only GIF, PNG, JPG, and WebP images are allowed.", true); return; }
    if (f.size > MAX) { file = null; info.hidden = true; upBtn.disabled = true; say(upFb, "That file is " + size(f.size) + ". The maximum is 8 MB.", true); return; }
    file = f; objectUrl = URL.createObjectURL(f);
    info.querySelector("img").src = objectUrl;
    info.querySelector("b").textContent = f.name;
    info.querySelector("small").textContent = f.type.replace("image/", "").toUpperCase() + " · " + size(f.size);
    info.hidden = false; upBtn.disabled = false;
  }

  function signIn() {
    password = pw.value;
    if (!password) { say(loginFb, "Enter your admin password.", true); return; }
    say(loginFb, "Checking…");
    api("/api/admin/check").then(function (r) {
      if (r.ok) { loginArea.hidden = true; studio.hidden = false; say(loginFb, ""); return loadCurrent(); }
      password = "";
      return r.json().catch(function () { return {}; }).then(function (d) {
        say(loginFb, r.status === 503 ? "ADMIN_PASSWORD is not configured in Cloudflare Pages." : "That password did not work.", true);
      });
    }).catch(function () { password = ""; say(loginFb, "Could not reach the admin API. It only runs on a deployed Cloudflare Pages site.", true); });
  }
  $("#loginButton").addEventListener("click", signIn);
  pw.addEventListener("keydown", function (e) { if (e.key === "Enter") signIn(); });
  $("#logoutButton").addEventListener("click", function () {
    password = ""; pw.value = ""; pick(null); input.value = "";
    studio.hidden = true; loginArea.hidden = false; say(upFb, "");
  });

  input.addEventListener("change", function () { pick(input.files[0]); });
  ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("drag"); }); });
  ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("drag"); }); });
  drop.addEventListener("drop", function (e) { var f = e.dataTransfer && e.dataTransfer.files[0]; if (f) pick(f); });
  info.querySelector("[data-clear]").addEventListener("click", function () { input.value = ""; pick(null); });

  upBtn.addEventListener("click", function () {
    if (!file || busy) return;
    busy = true; upBtn.disabled = true; rmBtn.disabled = true; prog.hidden = false; bar.style.width = "0%"; say(upFb, "Uploading…");
    var form = new FormData(); form.append("file", file);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.setRequestHeader("Authorization", "Bearer " + password);
    xhr.upload.onprogress = function (e) { if (e.lengthComputable) bar.style.width = Math.round(e.loaded / e.total * 100) + "%"; };
    xhr.onload = function () {
      var d = {}; try { d = JSON.parse(xhr.responseText); } catch (e) {}
      busy = false; prog.hidden = true;
      if (xhr.status >= 200 && xhr.status < 300) {
        input.value = ""; pick(null); say(upFb, "Uploaded. Your homepage now uses this image."); loadCurrent();
      } else { say(upFb, d.error || "Upload failed (" + xhr.status + ").", true); upBtn.disabled = !file; rmBtn.disabled = !hasCustom; }
    };
    xhr.onerror = function () { busy = false; prog.hidden = true; upBtn.disabled = !file; rmBtn.disabled = !hasCustom; say(upFb, "Network error during upload.", true); };
    xhr.send(form);
  });

  rmBtn.addEventListener("click", function () {
    if (!hasCustom || busy) return;
    if (!confirm("Remove the custom homepage image? The bundled homehero.gif will be shown instead.")) return;
    busy = true; rmBtn.disabled = true;
    api("/api/admin/upload", { method: "DELETE" }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        busy = false;
        if (r.ok) { say(upFb, "Custom image removed. The bundled hero GIF is back."); return loadCurrent(); }
        say(upFb, d.error || "Could not remove the image.", true); rmBtn.disabled = false;
      });
    }).catch(function () { busy = false; rmBtn.disabled = false; say(upFb, "Network error.", true); });
  });
});
