// Opening animation, about 3 seconds:
//   1. soccer-field lines draw themselves around the edge of the screen,
//   2. the ball rolls in, spinning, and the coral ring sweeps round it,
//   3. "TOUCH TIME" rises in letter by letter over the field,
//   4. everything slides up to reveal the app.
// Plays once per visit (each app launch), never blocks taps, and is skipped
// when the device asks for reduced motion.
(function () {
  var el = document.getElementById("intro");
  if (!el) return;
  var seen = false, reduce = false;
  try { seen = sessionStorage.getItem("touchtime.intro") === "1"; } catch (e) {}
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  if (seen || reduce) {
    el.remove();
    return;
  }
  try { sessionStorage.setItem("touchtime.intro", "1"); } catch (e) {}

  el.classList.add("play");
  drawField(document.getElementById("intro-field"));
  setTimeout(function () { el.remove(); }, 3000);

  // A pitch that fits the screen: tall on phones, wide on computers.
  function drawField(svg) {
    var w = window.innerWidth, h = window.innerHeight;
    var m = Math.round(Math.min(w, h) * 0.06) + 6; // margin round the pitch
    var x0 = m, y0 = m, W = w - 2 * m, H = h - 2 * m;
    var tall = H >= W;
    var len = tall ? H : W, wid = tall ? W : H; // along / across the pitch
    var cx = w / 2, cy = h / 2;
    var parts = [];

    function line(x1, y1, x2, y2) { parts.push('<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>'); }
    function rect(x, y, rw, rh) { parts.push('<rect x="' + x + '" y="' + y + '" width="' + rw + '" height="' + rh + '"/>'); }
    function circle(x, y, r) { parts.push('<circle cx="' + x + '" cy="' + y + '" r="' + r + '"/>'); }
    function spot(x, y) { parts.push('<circle class="spot" cx="' + x + '" cy="' + y + '" r="2.5"/>'); }
    function arc(x1, y1, x2, y2, r, sweep) { parts.push('<path d="M' + x1 + " " + y1 + " A" + r + " " + r + " 0 0 " + sweep + " " + x2 + " " + y2 + '"/>'); }

    // Converts "along, across" positions (from one goal line) to screen points.
    function pt(a, c, fromEnd) {
      var along = fromEnd ? len - a : a;
      return tall ? [x0 + c, y0 + along] : [x0 + along, y0 + c];
    }
    function box(depth, width, fromEnd) {
      var a = pt(0, (wid - width) / 2, fromEnd), b = pt(depth, (wid + width) / 2, fromEnd);
      rect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
    }

    rect(x0, y0, W, H); // touchlines and goal lines
    if (tall) line(x0, cy, x0 + W, cy); else line(cx, y0, cx, y0 + H); // halfway line
    // Centre circle: big enough to ring the ball sitting on the centre spot.
    var logo = el.querySelector(".intro-logo").getBoundingClientRect().width;
    var cr = Math.max(Math.min(wid * 0.2, len * 0.11), logo * 0.72);
    circle(cx, cy, cr); // centre circle
    spot(cx, cy);
    [false, true].forEach(function (end) {
      box(len * 0.15, wid * 0.62, end); // penalty area
      box(len * 0.055, wid * 0.3, end); // goal area
      var ps = pt(len * 0.105, wid / 2, end);
      spot(ps[0], ps[1]); // penalty spot
      var g1 = pt(0, wid * 0.42, end), g2 = pt(-Math.min(m - 4, 14), wid * 0.58, end);
      rect(Math.min(g1[0], g2[0]), Math.min(g1[1], g2[1]), Math.abs(g2[0] - g1[0]), Math.abs(g2[1] - g1[1])); // goal
    });
    // Corner arcs.
    var k = Math.max(8, Math.min(W, H) * 0.035);
    arc(x0 + k, y0, x0, y0 + k, k, 1);
    arc(x0 + W - k, y0, x0 + W, y0 + k, k, 0);
    arc(x0, y0 + H - k, x0 + k, y0 + H, k, 1);
    arc(x0 + W, y0 + H - k, x0 + W - k, y0 + H, k, 0);

    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.innerHTML = parts.join("").replace(/<(line|rect|circle|path) /g, '<$1 pathLength="1" ');
  }
})();
