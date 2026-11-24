// Tests tab and a single test's page with medals and score history.
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
      '<span class="t">' + (best == null ? "—" : TT.MEDALS[s.medalOf(t, best)].emoji + " " + best) + "<br>" + (s.retestDue(t.id) ? "retest due" : "best") + "</span></button>"
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

  // Line chart of the last 12 scores with medal lines.
  function chart(t) {
    var a = TT.store.state.results.filter(function (r) { return r.id === t.id; }).slice(-12);
    if (a.length < 2) return "";
    var W = 300, H = 130;
    var max = Math.max(t.medals.gold, Math.max.apply(null, a.map(function (r) { return r.sc; }))) * 1.1;
    var X = function (i) { return 24 + (i * (W - 36)) / (a.length - 1); };
    var Y = function (v) { return H - 14 - (v / max) * (H - 26); };
    var lines = [[t.medals.bronze, "🥉"], [t.medals.silver, "🥈"], [t.medals.gold, "🥇"]].map(function (m) {
      return '<line x1="22" x2="' + (W - 6) + '" y1="' + Y(m[0]) + '" y2="' + Y(m[0]) + '" stroke="var(--line)" stroke-dasharray="4 4"/>' +
        '<text x="0" y="' + (Y(m[0]) + 4) + '" font-size="11">' + m[1] + "</text>";
    }).join("");
    return (
      '<h3 class="need">Your history</h3><svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Score history">' + lines +
      '<polyline fill="none" stroke="var(--gold)" stroke-width="3" points="' + a.map(function (r, i) { return X(i) + "," + Y(r.sc); }).join(" ") + '"/>' +
      a.map(function (r, i) { return '<circle cx="' + X(i) + '" cy="' + Y(r.sc) + '" r="4" fill="var(--gold)"/>'; }).join("") +
      "</svg>"
    );
  }

  function detail(ui) {
    var t = s.test(ui.test), best = s.bestOf(t.id), m = t.medals;
    return (
      c.back("All tests", "close-test") +
      '<div class="detail">' + TT.demo.media(t) +
      "<h2>" + t.emoji + " " + esc(t.name) + "</h2><p>" + esc(t.description) + "</p>" +
      (t.videoText ? '<h3 class="need">In the video</h3><p>' + esc(t.videoText) + "</p>" : "") +
      (t.steps ? '<h3 class="need">How to do it</h3>' + c.list(t.steps, "ol") : "") +
      '<h3 class="need">How to count</h3><p>' + esc(t.howToCount) + "</p>" +
      '<h3 class="need">What you need</h3>' + c.list(t.needs || [], "ul") +
      '<h3 class="need">Medals in ' + t.seconds + " seconds</h3>" +
      (t.ageTargets ? '<p class="note">Targets are what is considered good for a 13-year-old (bronze), a 15-year-old (silver) and a 17-year-old (gold).</p>' : "") +
      '<div class="stats">' +
      [[1, m.bronze], [2, m.silver], [3, m.gold]].map(function (x) {
        return c.stat(TT.MEDALS[x[0]].emoji + " " + x[1], TT.MEDALS[x[0]].name);
      }).join("") + "</div>" +
      '<p class="muted">' + (best == null ? "No attempts yet." : "Your best: " + best + " " + t.unit + " (" + TT.MEDALS[s.medalOf(t, best)].name + ")") +
      (s.retestDue(t.id) ? " · Last tested over 2 weeks ago. Time to retest!" : "") + "</p>" +
      chart(t) +
      '<button class="go" data-action="start-test">Start test</button></div>'
    );
  }

  return { list: list, results: results, detail: detail };
})();
