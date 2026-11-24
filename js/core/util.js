// Small shared helpers: DOM, escaping, time formatting and date boundaries.
window.TT = window.TT || {};

TT.util = (function () {
  function $(id) {
    return document.getElementById(id);
  }

  // Escape text before putting it into HTML.
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // 75 -> "1m 15s", 3900 -> "1h 5m"
  function fmt(seconds) {
    var s = Math.round(seconds);
    if (s >= 3600) {
      var h = Math.floor(s / 3600);
      var hm = Math.floor((s % 3600) / 60);
      return h + "h" + (hm ? " " + hm + "m" : "");
    }
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m ? m + "m" + (r ? " " + r + "s" : "") : r + "s";
  }

  // Label for the drill-length picker.
  function lengthLabel(seconds) {
    return seconds === 60 ? "1 min" : seconds + " sec";
  }

  function startOfDay() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  // Weeks start on Monday.
  function startOfWeek() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getTime();
  }

  function startOfMonth() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  }

  function daysInMonth() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  }

  // A whole-number day index in local time, used for streaks.
  function dayIndex(t) {
    return Math.floor((t - new Date(t).getTimezoneOffset() * 60000) / 864e5);
  }

  var toastTimer = null;
  function toast(message) {
    var t = $("toast");
    t.textContent = message;
    t.className = "toast on";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.className = "toast";
    }, 3200);
  }

  return {
    $: $,
    esc: esc,
    fmt: fmt,
    lengthLabel: lengthLabel,
    startOfDay: startOfDay,
    startOfWeek: startOfWeek,
    startOfMonth: startOfMonth,
    daysInMonth: daysInMonth,
    dayIndex: dayIndex,
    toast: toast
  };
})();
