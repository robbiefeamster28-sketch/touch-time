// Keeps the website current. GitHub Pages lets browsers reuse a page for a
// while, so a returning visitor can get yesterday's version. The website
// build stamps a version into the page (TT_BUILD) and into version.json; if
// they differ, the page reloads once to fetch the new version.
// Does nothing in the store apps, the claude.ai preview, or local copies.
(function () {
  var build = window.TT_BUILD;
  if (!build || !window.fetch) return;
  var c = window.Capacitor;
  if (c && c.isNativePlatform && c.isNativePlatform()) return;
  if (!/^https?:$/.test(location.protocol)) return;

  fetch("version.json?t=" + Date.now(), { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (v) {
      if (!v || !v.build || v.build === build) return;
      var key = "touchtime.reloadedFor";
      try {
        if (sessionStorage.getItem(key) === v.build) return; // tried already: don't loop
        sessionStorage.setItem(key, v.build);
        // Let the opening animation play on the fresh page.
        if (document.getElementById("intro")) sessionStorage.removeItem("touchtime.intro");
      } catch (e) {}
      location.reload();
    })
    .catch(function () {});
})();
