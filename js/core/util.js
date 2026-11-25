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

  // Two-tap confirmation built into the button itself (pop-up dialogs are
  // blocked on some hosts). The first tap relabels the button; a second tap
  // within 4 seconds returns true.
  function confirmTap(button, question) {
    if (button.dataset.armed) return true;
    var label = button.textContent;
    button.dataset.armed = "1";
    button.textContent = question;
    button.classList.add("armed");
    setTimeout(function () {
      if (!button.isConnected) return;
      delete button.dataset.armed;
      button.textContent = label;
      button.classList.remove("armed");
    }, 4000);
    return false;
  }

  // Saves a text file.
  // - Android/iPhone app: writes it, then opens the share sheet (save to Files, Drive, email…).
  // - claude.ai: the viewer is asked to confirm the save.
  // - Any other browser: downloads straight away.
  function saveFile(filename, text) {
    var cap = window.Capacitor;
    if (cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins.Filesystem && cap.Plugins.Share) {
      return cap.Plugins.Filesystem.writeFile({ path: filename, data: text, directory: "CACHE", encoding: "utf8" })
        .then(function (r) {
          return cap.Plugins.Share.share({ title: "Touch Time backup", files: [r.uri] });
        })
        .catch(function (e) {
          // Closing the share sheet isn't an error.
          if (e && /cancel/i.test(e.message || "")) throw { code: "declined" };
          throw e;
        });
    }
    var c = window.claude;
    var viaClaude = c && c.use ? c.use("downloads") : Promise.resolve(null);
    return viaClaude.then(function (d) {
      if (d) return d.save({ filename: filename, data: text });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
  }

  return {
    confirmTap: confirmTap,
    saveFile: saveFile,
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
