// Everything calculated from saved progress: totals, levels, streaks, test stars.
window.TT = window.TT || {};

TT.stats = (function () {
  var u = TT.util;
  var st = TT.store.state;

  var drillById = {};
  TT.DRILLS.forEach(function (d) { drillById[d.id] = d; });
  var testById = {};
  TT.TESTS.forEach(function (t) { testById[t.id] = t; });

  function drill(id) { return drillById[id]; }
  function test(id) { return testById[id]; }

  // Seconds practised since `from`, optionally for one drill or test.
  function sum(from, id) {
    return st.log.reduce(function (a, x) {
      return a + (x.t >= from && (!id || x.d === id) ? x.s : 0);
    }, 0);
  }

  function total() { return sum(0); }
  function today() { return sum(u.startOfDay()); }
  function week() { return sum(u.startOfWeek()); }
  function month() { return sum(u.startOfMonth()); }

  // Minutes.
  function monthGoal() { return st.goal * u.daysInMonth(); }

  // Level 0-4 for this month, based on quarters of the monthly goal.
  function level(monthSeconds) {
    if (monthSeconds == null) monthSeconds = month();
    var goal = monthGoal() * 60;
    var i = 0;
    for (var k = 1; k <= 4; k++) if (monthSeconds >= (goal * k) / 4) i = k;
    var lo = (goal * i) / 4;
    var hi = (goal * (i + 1)) / 4;
    return {
      index: i,
      name: TT.LEVELS[i].name,
      next: i < 4 ? TT.LEVELS[i + 1].name : null,
      need: Math.max(0, hi - monthSeconds),
      pct: i < 4 ? ((monthSeconds - lo) / (hi - lo)) * 100 : 100
    };
  }

  // Days in a row with practice, counting today or ending yesterday.
  function streak() {
    var days = {};
    st.log.forEach(function (x) { days[u.dayIndex(x.t)] = 1; });
    var d = u.dayIndex(Date.now());
    var n = 0;
    if (!days[d]) d--;
    while (days[d]) { n++; d--; }
    return n;
  }

  function longestStreak() {
    var days = {};
    st.log.forEach(function (x) { days[u.dayIndex(x.t)] = 1; });
    var list = Object.keys(days).map(Number).sort(function (a, b) { return a - b; });
    var best = 0, run = 0;
    list.forEach(function (x, i) {
      run = i && x === list[i - 1] + 1 ? run + 1 : 1;
      if (run > best) best = run;
    });
    return best;
  }

  // How many stars (0-5) a score earns on a test.
  function starsOf(t, score) {
    var n = 0;
    t.stars.forEach(function (need) { if (score >= need) n++; });
    return n;
  }

  function bestOf(testId) {
    var best = null;
    st.results.forEach(function (r) {
      if (r.id === testId && (best == null || r.sc > best)) best = r.sc;
    });
    return best;
  }

  function lastTested(testId) {
    var last = 0;
    st.results.forEach(function (r) { if (r.id === testId && r.t > last) last = r.t; });
    return last;
  }

  // Retest is due two weeks after the last attempt.
  function retestDue(testId) {
    var last = lastTested(testId);
    return last && Date.now() - last > 14 * 864e5;
  }

  function topicOf(id) {
    var x = drill(id) || test(id);
    return x ? x.topic : null;
  }

  // Badges newly earned between two totals (seconds).
  function newBadges(before, after) {
    return TT.BADGES.filter(function (b) {
      return before < b.minutes * 60 && after >= b.minutes * 60;
    });
  }

  // Built-in practice of the day, rotating daily.
  function practiceOfTheDay() {
    var d = new Date();
    var n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
    return TT.PRACTICES[n % TT.PRACTICES.length];
  }

  return {
    drill: drill,
    test: test,
    sum: sum,
    total: total,
    today: today,
    week: week,
    month: month,
    monthGoal: monthGoal,
    level: level,
    streak: streak,
    longestStreak: longestStreak,
    starsOf: starsOf,
    bestOf: bestOf,
    lastTested: lastTested,
    retestDue: retestDue,
    topicOf: topicOf,
    newBadges: newBadges,
    practiceOfTheDay: practiceOfTheDay
  };
})();
