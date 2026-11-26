// The full-screen timer: 3-2-1 countdown, ring timer with pause, breaks between drills.
// It only shows screens and calls back; app.js decides what each finish means.
window.TT = window.TT || {};

TT.timer = (function () {
  var u = TT.util;
  var RING = 2 * Math.PI * 115;

  var tick = null; // interval id
  var run = null; // { paused, left, end, half }
  var wakeLock = null;
  var onClose = function () {};

  // ---- sound and screen ----

  function tone(freq, seconds) {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.15;
      osc.start();
      osc.stop(ctx.currentTime + seconds);
    } catch (e) {}
  }

  function beep() { tone(880, 0.4); }

  function keepScreenOn() {
    try {
      if (navigator.wakeLock) {
        navigator.wakeLock.request("screen").then(function (l) { wakeLock = l; }).catch(function () {});
      }
    } catch (e) {}
  }

  function releaseScreen() {
    try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) {}
  }

  // ---- overlay ----

  function el() { return u.$("timer"); }

  function show(html) {
    el().className = "timer on";
    el().innerHTML = html;
  }

  function clear() {
    clearInterval(tick);
    tick = null;
  }

  // Close the overlay (End / Cancel / Done buttons).
  function close() {
    clear();
    releaseScreen();
    run = null;
    el().className = "timer";
    el().innerHTML = "";
    onClose();
  }

  function ring(seconds, small) {
    return (
      '<div class="ring' + (small ? " small" : "") + '"><svg viewBox="0 0 260 260">' +
      '<circle cx="130" cy="130" r="115" fill="none" stroke="var(--line)" stroke-width="14"/>' +
      '<circle id="arc" cx="130" cy="130" r="115" fill="none" stroke="var(--gold)" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + RING + '" stroke-dashoffset="0"/>' +
      '</svg><div class="n" id="num">' + seconds + "</div></div>"
    );
  }

  // opts: { title, seconds, extra (html under the ring), buttons (html beside Pause), onDone }
  function start(opts) {
    clear();
    keepScreenOn();
    var n = 3;
    show(
      "<h2>" + u.esc(opts.title) + "</h2>" +
      '<div class="big countdown" id="cd">3</div>' +
      '<button class="ghost" data-action="timer-close">Cancel</button>'
    );
    tone(660, 0.12);
    tick = setInterval(function () {
      n--;
      if (n <= 0) {
        clear();
        tone(880, 0.3);
        go(opts);
      } else {
        u.$("cd").textContent = n;
        tone(660, 0.12);
      }
    }, 1000);
  }

  function go(opts) {
    var T = opts.seconds;
    run = { paused: false, left: T * 1000, end: Date.now() + T * 1000, half: false };
    show(
      "<h2>" + u.esc(opts.title) + "</h2>" +
      ring(T, !!opts.extra) +
      (opts.extra || "") +
      '<div class="btnrow"><button class="ghost" id="pz" data-action="timer-pause">Pause</button>' + (opts.buttons || "") +
      '<button class="ghost" data-action="timer-close">End</button></div>'
    );
    tick = setInterval(function () {
      if (run.paused) return;
      var left = Math.max(0, run.end - Date.now());
      run.left = left;
      u.$("num").textContent = Math.ceil(left / 1000);
      u.$("arc").setAttribute("stroke-dashoffset", RING * (1 - left / (T * 1000)));
      if (!run.half && T >= 30 && left <= T * 500) {
        run.half = true;
        tone(520, 0.15); // halfway: switch sides or direction
      }
      if (left <= 0) {
        clear();
        releaseScreen();
        beep();
        opts.onDone();
      }
    }, 200);
  }

  function pause() {
    if (!run) return;
    var b = u.$("pz");
    if (run.paused) {
      run.end = Date.now() + run.left;
      run.paused = false;
      b.textContent = "Pause";
    } else {
      run.left = Math.max(0, run.end - Date.now());
      run.paused = true;
      b.textContent = "Resume";
    }
  }

  // A counted-down break: shows `html` (which holds an element with id "cd"
  // for the number), counts down once a second, then calls onDone.
  // skipBreak() ends it early and calls onDone straight away.
  function countdown(seconds, html, onDone) {
    clear();
    var n = seconds;
    show(html);
    skipBreak = function () { clear(); onDone(); };
    tick = setInterval(function () {
      n--;
      var cd = u.$("cd");
      if (cd) cd.textContent = n;
      if (n <= 3 && n > 0) tone(660, 0.08);
      if (n <= 0) {
        clear();
        skipBreak = function () {};
        onDone();
      }
    }, 1000);
  }

  var skipBreak = function () {};

  // Stop the running clock but keep the overlay open (e.g. to skip a drill).
  function cancel() {
    clear();
    releaseScreen();
    run = null;
  }

  return {
    start: start,
    cancel: cancel,
    pause: pause,
    countdown: countdown,
    skipBreak: function () { skipBreak(); },
    show: show,
    close: close,
    onClose: function (fn) { onClose = fn; }
  };
})();
