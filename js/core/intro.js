// Opening animation: "TOUCH TIME" rises in letter by letter, then the
// screen slides away to the app. Plays once per visit (each app launch),
// never blocks taps, and is skipped when the device asks for reduced motion.
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
  setTimeout(function () { el.remove(); }, 2300);
})();
