// Drills tab and a single drill's page.
window.TT = window.TT || {};
TT.views = TT.views || {};

TT.views.drills = (function () {
  var c = TT.views.common, s = TT.stats, store = TT.store, u = TT.util;
  var esc = u.esc;

  function inTopic(d, topic) {
    return topic === "fav" ? store.isFav(d.id) : d.topic === topic;
  }

  function row(d) {
    return (
      '<div class="row"><button class="drill" data-action="open-drill" data-id="' + d.id + '">' +
      '<span class="em">' + d.emoji + "</span>" +
      "<span><h3>" + esc(d.name) + "</h3><small>" + d.level + '</small><span class="dd">' + esc(d.description) + "</span></span>" +
      '<span class="t">' + u.fmt(s.sum(0, d.id)) + "<br>total</span></button>" +
      c.starButton(d) + "</div>"
    );
  }

  // Just the list, so typing in search doesn't redraw the search box.
  function results(ui) {
    var searching = ui.query.trim();
    var base = searching ? TT.DRILLS : TT.DRILLS.filter(function (d) { return inTopic(d, ui.topic); });
    var hint = ui.topic === "fav" && !store.state.favs.length && !searching
      ? '<p class="muted">Tap the ☆ on any drill to add it to your favorites.</p>'
      : "";
    return hint + c.groupedList(c.filter(base, ui.query, ui.levelFilter), row);
  }

  function list(ui) {
    return c.chips(TT.TOPICS, ui.topic, "topic") + c.searchControls(ui.query, ui.levelFilter) +
      '<div id="results">' + results(ui) + "</div>";
  }

  // Opened from a practice's drill list (so it can run the rest of the practice).
  function inPractice(ui) {
    if (ui.practiceIndex == null || !ui.practice) return false;
    var p = TT.views.practices.find(ui.practice);
    return !!p && TT.views.practices.drillsOf(p)[ui.practiceIndex] === ui.drill;
  }

  function detail(ui) {
    var d = s.drill(ui.drill);
    return (
      '<div class="detail">' +
      c.back(ui.practice ? "Back to practice" : "All drills", "close-drill") +
      TT.demo.media(d) +
      "<h2>" + esc(d.name) + c.starButton(d) + "</h2><p>" + esc(d.description) + "</p>" +
      (d.videoText ? '<h3 class="need">In the video</h3><p>' + esc(d.videoText) + "</p>" : "") +
      '<h3 class="need">What you need</h3>' + c.list(d.needs || [], "ul") +
      '<h3 class="need">How to do it</h3>' + c.list(d.steps || [], "ol") +
      c.lengthPicker(ui.length) +
      (inPractice(ui)
        ? '<button class="go" data-action="start-practice-here">Start practice here</button>' +
          (function () {
            var n = TT.views.practices.drillsOf(TT.views.practices.find(ui.practice)).length;
            return '<p class="note small" style="text-align:center;margin:6px 0 10px">Drill ' + (ui.practiceIndex + 1) + " of " + n +
              (ui.practiceIndex + 1 < n ? ", then a 15-second break and preview before each next drill." : ". It’s the last drill in this practice.") + "</p>";
          })() +
          '<button class="ghost wide" data-action="start-drill">Do just this drill</button>'
        : '<button class="go" data-action="start-drill">Do drill</button>') +
      '<p class="muted small">You’ve put in ' + u.fmt(s.sum(0, d.id)) + " on this drill.</p></div>"
    );
  }

  return { list: list, results: results, detail: detail };
})();
