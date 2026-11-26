// Tests tab and a single test's page with star targets and score history.
window.TT = window.TT || {};
TT.views = TT.views || {};

TT.views.tests = (function () {
  var c = TT.views.common, s = TT.stats, u = TT.util;
  var esc = u.esc;

  function row(t) {
    var best = s.bestOf(t.id);
    return (
      '<button class="drill mb" data-action="open-test" data-id="' + t.id + '">' +
      '<span class="em">' + t.emoji + "</span>" +
      "<span><h3>" + esc(t.name) + "</h3><small>" + t.seconds + " sec · count " + t.unit + '</small><span class="dd">' + esc(t.description) + "</span></span>" +
      '<span class="t">' + (best == null ? "—" : TT.starRow(s.starsOf(t, best)) + "<br>" + best + " " + (s.retestDue(t.id) ? "· retest due" : "best")) + "</span></button>"
    );
  }

  function results(ui) {
    var base = ui.query.trim() ? TT.TESTS : TT.TESTS.filter(function (t) { return t.topic === ui.testTopic; });
    return c.groupedList(c.filter(base, ui.query, ui.levelFilter), row);
  }

  function list(ui) {
    return c.chips(TT.TEST_TOPICS, ui.testTopic, "test-topic") + c.searchControls(ui.query, ui.levelFilter) +
      '<div id="results">' + results(ui) + "</div>";
  }

  // Line chart of the last 12 scores, with a dashed line for each star target.
  function chart(t) {
    var a = TT.store.state.results.filter(function (r) { return r.id === t.id; }).slice(-12);
    if (a.length < 2) return "";
    var W = 300, H = 130;
    var scores = a.map(function (r) { return r.sc; });
    var hi = Math.max(t.stars[4], Math.max.apply(null, scores));
    var lo = Math.min(t.stars[0], Math.min.apply(null, scores));
    // Show from a bit below the lowest point to a bit above the highest, so the star lines spread out.
    var pad = Math.max(1, (hi - lo) * 0.12), min = Math.max(0, lo - pad), max = hi + pad;
    var X = function (i) { return 24 + (i * (W - 36)) / (a.length - 1); };
    var Y = function (v) { return H - 10 - ((v - min) / (max - min)) * (H - 20); };
    var lastLabel = Infinity;
    var lines = t.stars.map(function (need, i) {
      var y = Y(need), label = "";
      if (lastLabel - y >= 11) { label = '<text x="0" y="' + (y + 4) + '" font-size="10">' + (i + 1) + "★</text>"; lastLabel = y; }
      return '<line x1="22" x2="' + (W - 6) + '" y1="' + y + '" y2="' + y + '" stroke="var(--line)" stroke-dasharray="4 4"/>' + label;
    }).join("");
    return (
      '<h3 class="need">Your history</h3><svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Score history">' + lines +
      '<polyline fill="none" stroke="var(--gold)" stroke-width="3" points="' + a.map(function (r, i) { return X(i) + "," + Y(r.sc); }).join(" ") + '"/>' +
      a.map(function (r, i) { return '<circle cx="' + X(i) + '" cy="' + Y(r.sc) + '" r="4" fill="var(--gold)"/>'; }).join("") +
      "</svg>"
    );
  }

  function detail(ui) {
    var t = s.test(ui.test), best = s.bestOf(t.id), have = best == null ? 0 : s.starsOf(t, best);
    return (
      c.back("All tests", "close-test") +
      '<div class="detail">' + TT.demo.media(t) +
      "<h2>" + t.emoji + " " + esc(t.name) + "</h2><p>" + esc(t.description) + "</p>" +
      (t.videoText ? '<h3 class="need">In the video</h3><p>' + esc(t.videoText) + "</p>" : "") +
      (t.steps ? '<h3 class="need">How to do it</h3>' + c.list(t.steps, "ol") : "") +
      '<h3 class="need">How to count</h3><p>' + esc(t.howToCount) + "</p>" +
      '<h3 class="need">What you need</h3>' + c.list(t.needs || [], "ul") +
      '<h3 class="need">Stars in ' + t.seconds + " seconds</h3>" +
      (t.ageTargets ? '<p class="note">1★ is good for a 13-year-old, 3★ for a 15-year-old, and 5★ for a 17-year-old.</p>' : "") +
      '<ol class="star-targets">' +
      t.stars.map(function (need, i) {
        return '<li class="' + (i < have ? "got" : "") + '">' + TT.starRow(i + 1) + '<span class="need-n">' + need + " " + esc(t.unit) + "</span></li>";
      }).join("") + "</ol>" +
      '<p class="muted">' + (best == null ? "No attempts yet." : "Your best: " + best + " " + esc(t.unit) + " (" + have + (have === 1 ? " star" : " stars") + ")") +
      (s.retestDue(t.id) ? " · Last tested over 2 weeks ago. Time to retest!" : "") + "</p>" +
      chart(t) +
      '<button class="go" data-action="start-test">Start test</button></div>'
    );
  }

  return { list: list, results: results, detail: detail };
})();
