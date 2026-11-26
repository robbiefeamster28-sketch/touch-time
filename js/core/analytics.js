// Anonymous usage counts, sent to GoatCounter (see STATS.md and privacy.html).
// Only counts are sent: a page view when the app opens, and the names of a
// few events (account-created, drill-completed, practice-completed,
// test-taken). Never a player's name, PIN, scores or any other progress.
window.TT = window.TT || {};

TT.analytics = (function () {
  function code() {
    return ((TT.CONFIG && TT.CONFIG.goatcounter) || "").trim().toLowerCase();
  }

  function isNativeApp() {
    var c = window.Capacitor;
    return !!(c && c.isNativePlatform && c.isNativePlatform());
  }

  function platform() {
    if (!isNativeApp()) return "web";
    var c = window.Capacitor;
    return (c.getPlatform && c.getPlatform()) || "app";
  }

  function enabled() {
    if (!/^[a-z0-9-]+$/.test(code())) return false;
    try {
      if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return false;
    } catch (e) {}
    if (window.TT_FORCE_ANALYTICS || isNativeApp()) return true;
    var host = location.hostname;
    // Not while developing, testing, or inside the claude.ai preview.
    if (location.protocol === "file:" || host === "localhost" || host === "127.0.0.1" || /(^|\.)claude\.ai$/.test(host) || /claudeusercontent/.test(host)) return false;
    return true;
  }

  function send(path, title, isEvent) {
    if (!enabled()) return;
    var q = [
      "p=" + encodeURIComponent(path),
      "t=" + encodeURIComponent(title),
      "s=" + encodeURIComponent((screen.width || 0) + "," + (screen.height || 0) + "," + (window.devicePixelRatio || 1)),
      "r=" + encodeURIComponent(isEvent || isNativeApp() ? "" : document.referrer || ""),
      "rnd=" + Math.random().toString(36).slice(2)
    ];
    if (isEvent) q.push("e=true");
    var url = "https://" + code() + ".goatcounter.com/count?" + q.join("&");
    // sendBeacon is delivered even if the screen changes straight after
    // (GoatCounter's own script uses it); an image request is the fallback.
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(url)) return;
    } catch (e) {}
    try { new Image().src = url; } catch (e) {}
  }

  // One visit each time the app opens: "/" on the website, "/app/android" or
  // "/app/ios" in the store apps.
  function pageview() {
    var p = platform();
    send(p === "web" ? "/" : "/app/" + p, p === "web" ? "Touch Time website" : "Touch Time app (" + p + ")", false);
  }

  function event(name) {
    send(name, name, true);
  }

  return { enabled: enabled, pageview: pageview, event: event };
})();
