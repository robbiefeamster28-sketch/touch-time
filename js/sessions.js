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
        doneScreen(before, "✅", "+" + seconds + " sec", d.name + " complete.", "Back to drill");
      }
    });
  }

  // ---- practice: several drills in a row ----

  var run = null; // { name, drills, index, seconds, before }

  function practice(p, seconds) {
    run = { name: p.name, drills: p.drills.filter(s.drill), index: 0, seconds: seconds, before: snapshot() };
    intro();
  }

  // "Drill 2 of 5" screen with the demo and what you need.
  function intro() {
    var d = s.drill(run.drills[run.index]);
    timer.show(
      '<small class="muted">Drill ' + (run.index + 1) + " of " + run.drills.length + "</small>" +
      "<h2>" + esc(d.name) + "</h2>" +
      '<div class="demo">' + TT.demo.pitch(d) + "</div>" +
      "<p>You need: " + esc((d.needs || []).join(", ")) + "</p>" +
      '<button class="go" data-action="practice-go">Start ' + fmt(run.seconds) + "</button>" +
      '<button class="ghost" data-action="timer-close">End practice</button>'
    );
  }

  function practiceGo() {
    var d = s.drill(run.drills[run.index]);
    timer.start({
      title: d.name,
      seconds: run.seconds,
      onDone: function () {
        store.logTime(d.id, run.seconds);
        run.index++;
        if (run.index >= run.drills.length) return practiceDone();
        var rest = store.state.rest;
        if (rest > 0) timer.rest(rest, s.drill(run.drills[run.index]).name, intro);
        else intro();
      }
    });
  }

  function practiceDone() {
    doneScreen(run.before, "🏆", "+" + fmt(run.drills.length * run.seconds), run.name + " complete!", "Done");
    run = null;
  }

  // ---- test: count reps against the clock ----

  var test = null; // { t, count }

  function testIntro(id) {
    var t = s.test(id);
    test = { t: t, count: 0 };
    timer.show(
      "<h2>" + esc(t.name) + "</h2>" +
      "<p>You have " + t.seconds + " seconds. " + esc(t.howToCount) + " Tap the big button each time you complete one.</p>" +
      '<button class="go" data-action="test-go">Start</button>' +
      '<button class="ghost" data-action="timer-close">Cancel</button>'
    );
  }

  function testGo() {
    var t = test.t;
    test.count = 0;
    timer.start({
      title: t.name,
      seconds: t.seconds,
      extra: '<div class="big count" id="cnt">0</div><button class="go tap" data-action="test-count" data-value="1">Tap: +1 ' + t.unit + "</button>",
      onDone: testReview
    });
  }

  function count(n) {
    if (!test) return;
    test.count = Math.max(0, test.count + n);
    var el = u.$("cnt");
    if (el) el.textContent = test.count;
  }

  // Time's up: let the player fix a miscount before saving.
  function testReview() {
    var t = test.t;
    timer.show(
      "<h2>Time!</h2>" +
      '<div class="big" style="font-size:72px" id="cnt">' + test.count + "</div>" +
      "<div>" + t.unit + " counted. Fix the number if you miscounted.</div>" +
      '<div class="pick two"><button data-action="test-count" data-value="-1">−</button><button data-action="test-count" data-value="1">+</button></div>' +
      '<button class="go" data-action="test-save">Save result</button>' +
      '<button class="ghost" data-action="timer-close">Discard</button>'
    );
  }

  function testSave() {
    var t = test.t, n = test.count;
    var prevBest = s.bestOf(t.id);
    var prevMedal = prevBest == null ? 0 : s.medalOf(t, prevBest);
    var medal = s.medalOf(t, n);
    store.addResult(t.id, n);
    store.logTime(t.id, t.seconds);
    timer.show(
      '<div class="done"><div style="font-size:64px">' + (medal ? TT.MEDALS[medal].emoji : "💪") + "</div>" +
      '<div class="big">' + n + " " + t.unit + "</div>" +
      "<p>" + (medal ? TT.MEDALS[medal].name + " medal!" : "No medal yet. Bronze is " + t.medals.bronze + ".") + "</p>" +
      (prevBest == null || n > prevBest ? "<p><b>New personal best!</b></p>" : "") +
      (medal > prevMedal ? "<p><b>Medal upgrade!</b></p>" : "") +
      '</div><button class="go" data-action="timer-close">Done</button>'
    );
    test = null;
  }

  return {
    drill: drill,
    practice: practice,
    practiceGo: practiceGo,
    test: testIntro,
    testGo: testGo,
    count: count,
    testSave: testSave
  };
})();
