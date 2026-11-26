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

  // Why stats are on or off on this page: "on", "no-code", "dnt", "preview" or "local".
  function status() {
    if (!/^[a-z0-9-]+$/.test(code())) return "no-code";
    try {
      if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return "dnt";
    } catch (e) {}
    if (window.TT_FORCE_ANALYTICS || isNativeApp()) return "on";
    var host = location.hostname;
    // Not inside the claude.ai preview, or while developing and testing.
    if (/(^|\.)claude\.ai$/.test(host) || /claudeusercontent|claudeartifact/.test(host) || window.self !== window.top) return "preview";
    if (location.protocol === "file:" || host === "localhost" || host === "127.0.0.1") return "local";
    return "on";
  }

  function enabled() {
    return status() === "on";
  }

  // One line for the Account and Sign in pages, so it's easy to check.
  function statusText() {
    return {
      on: "Usage stats: counted (" + code() + ".goatcounter.com).",
      "no-code": "Usage stats: off (no GoatCounter code set).",
      dnt: "Usage stats: not counted, because this browser has Do Not Track on.",
      preview: "Usage stats: not counted on this preview page. Use the website or the app.",
      local: "Usage stats: not counted while testing on this computer."
    }[status()];
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

  return { enabled: enabled, status: status, statusText: statusText, pageview: pageview, event: event };
})();
