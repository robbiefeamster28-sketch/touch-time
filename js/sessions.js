// What happens when you do a drill, run a practice, or take a test.
// Uses TT.timer for the screens and TT.store to save the result.
window.TT = window.TT || {};

TT.sessions = (function () {
  var u = TT.util, s = TT.stats, store = TT.store, timer = TT.timer;
  var esc = u.esc, fmt = u.fmt;

  // Celebration screen. Snapshot is taken before saving so we can spot level-ups and new badges.
  function snapshot() {
    return { total: s.total(), level: s.level().index };
  }

  function doneScreen(before, emojiFallback, big, line, buttonLabel) {
    var L = s.level();
    var badges = s.newBadges(before.total, s.total());
    timer.show(
      '<div class="done"><div style="font-size:64px">' + (badges.length ? badges[0].emoji : emojiFallback) + "</div>" +
      '<div class="big">' + big + "</div><p>" + esc(line) + "</p>" +
      (L.index > before.level ? "<p><b>Level up! You’re now " + L.name + ".</b></p>" : "") +
      (badges.length ? "<p><b>New badge: " + badges.map(function (b) { return b.name; }).join(", ") + "</b></p>" : "") +
      '</div><button class="go" data-action="timer-close">' + buttonLabel + "</button>"
    );
  }

  // ---- single drill ----

  function drill(id, seconds) {
    var d = s.drill(id);
    timer.start({
      title: d.name,
      seconds: seconds,
      onDone: function () {
        var before = snapshot();
        store.logTime(d.id, seconds);
        TT.analytics.event("drill-completed");
        doneScreen(before, "✅", "+" + seconds + " sec", d.name + " complete.", "Back to drill");
      }
    });
  }

  // ---- practice: several drills in a row ----
  // The first drill waits for Start. After each finished drill there's a
  // 15-second break showing the next drill; it then starts by itself (or
  // straight away with "Go to next drill"). Any drill can be skipped, and
  // "Return to practice" goes back to the practice page.

  var BREAK = 15; // seconds between drills
  var run = null; // { name, drills, index, seconds, before, done, skipped, last }

  function practice(p, seconds) {
    run = { name: p.name, drills: p.drills.filter(s.drill), index: 0, seconds: seconds, before: snapshot(), done: 0, skipped: 0, last: null };
    intro();
  }

  function lastLine() {
    if (!run.last) return "";
    return '<p class="practice-last">' + (run.last.skipped ? "Skipped " : "✓ ") + esc(run.last.name) + (run.last.skipped ? "" : " done") + "</p>";
  }

  // The next drill: number, name, animated demo and what you need.
  function preview(d) {
    return '<small class="muted">Drill ' + (run.index + 1) + " of " + run.drills.length + "</small>" +
      "<h2>" + esc(d.name) + "</h2>" +
      '<div class="demo">' + TT.demo.pitch(d) + "</div>" +
      "<p>You need: " + esc((d.needs || []).join(", ")) + "</p>";
  }

  var BACK = '<button class="ghost" data-action="timer-close">Return to practice</button>';

  // Waits for Start: the first drill, and the one after a skipped drill.
  function intro() {
    var d = s.drill(run.drills[run.index]);
    timer.show(
      lastLine() + preview(d) +
      '<button class="go" data-action="practice-go">Start ' + fmt(run.seconds) + "</button>" +
      '<div class="btnrow"><button class="ghost" data-action="practice-skip">Skip this drill</button>' + BACK + "</div>"
    );
  }

  // 15-second break after a finished drill, then the next one starts.
  function breakScreen() {
    var d = s.drill(run.drills[run.index]);
    timer.countdown(
      BREAK,
      lastLine() +
      '<div class="break-count"><span>Next drill in</span><b class="big" id="cd">' + BREAK + "</b></div>" +
      preview(d) +
      '<button class="go" data-action="break-go">Go to next drill</button>' +
      '<div class="btnrow"><button class="ghost" data-action="practice-skip">Skip this drill</button>' + BACK + "</div>",
      practiceGo
    );
  }

  function practiceGo() {
    var d = s.drill(run.drills[run.index]);
    timer.start({
      title: d.name,
      seconds: run.seconds,
      buttons: '<button class="ghost" data-action="practice-skip">Skip</button>',
      onDone: function () {
        store.logTime(d.id, run.seconds);
        run.done++;
        next(d, false);
      }
    });
  }

  // Skip the current drill: from its screen, from the break, or while it's
  // running (no time is counted for a skipped drill).
  function practiceSkip() {
    if (!run) return;
    timer.cancel();
    run.skipped++;
    next(s.drill(run.drills[run.index]), true);
  }

  function next(d, skipped) {
    run.last = { name: d.name, skipped: skipped };
    run.index++;
    if (run.index >= run.drills.length) return practiceDone();
    if (skipped) intro();
    else breakScreen();
  }

  function practiceDone() {
    var summary = run.done + (run.done === 1 ? " drill" : " drills") + " done" + (run.skipped ? ", " + run.skipped + " skipped" : "");
    if (run.done) TT.analytics.event("practice-completed");
    doneScreen(run.before, run.done ? "🏆" : "👋", "+" + fmt(run.done * run.seconds), run.name + ": " + summary + ".", "Done");
    run = null;
  }

  // ---- test: do as many reps as you can, then type the score ----

  var test = null; // { t }

  function testIntro(id) {
    var t = s.test(id);
    test = { t: t };
    timer.show(
      "<h2>" + esc(t.name) + "</h2>" +
      "<p>You have " + t.seconds + " seconds. " + esc(t.howToCount) + " Keep count in your head, then enter your score when the time is up.</p>" +
      '<button class="go" data-action="test-go">Start</button>' +
      '<button class="ghost" data-action="timer-close">Cancel</button>'
    );
  }

  function testGo() {
    var t = test.t;
    timer.start({ title: t.name, seconds: t.seconds, onDone: testReview });
  }

  // Time's up: the player types how many they got.
  function testReview() {
    var t = test.t;
    timer.show(
      "<h2>Time!</h2>" +
      '<form class="score-form" data-form="test-score">' +
      '<label class="score-label" for="score">How many ' + esc(t.unit) + " did you get?</label>" +
      '<input class="score-input" id="score" name="score" type="number" inputmode="numeric" min="0" max="999" step="1" autocomplete="off" placeholder="0">' +
      '<button class="go" type="submit">Save result</button>' +
      "</form>" +
      '<button class="ghost" data-action="timer-close">Discard</button>'
    );
    var input = u.$("score");
    if (input) input.focus();
  }

  function testSave(n) {
    var t = test.t;
    var prevBest = s.bestOf(t.id);
    var prevStars = prevBest == null ? 0 : s.starsOf(t, prevBest);
    var stars = s.starsOf(t, n);
    store.addResult(t.id, n);
    store.logTime(t.id, t.seconds);
    TT.analytics.event("test-taken");
    timer.show(
      '<div class="done"><div class="result-stars">' + TT.starRow(stars) + "</div>" +
      '<div class="big">' + n + " " + t.unit + "</div>" +
      "<p>" + (stars ? stars + (stars === 1 ? " star!" : " stars!") + (stars < 5 ? " " + (stars + 1) + "★ is " + t.stars[stars] + "." : " Top score!") : "No stars yet. 1★ is " + t.stars[0] + ".") + "</p>" +
      (prevBest == null || n > prevBest ? "<p><b>New personal best!</b></p>" : "") +
      (stars > prevStars ? "<p><b>Star upgrade!</b></p>" : "") +
      '</div><button class="go" data-action="timer-close">Done</button>'
    );
    test = null;
  }

  return {
    drill: drill,
    practice: practice,
    practiceGo: practiceGo,
    practiceSkip: practiceSkip,
    test: testIntro,
    testGo: testGo,
    testSave: testSave
  };
})();
