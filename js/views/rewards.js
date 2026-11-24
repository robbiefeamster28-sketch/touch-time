// Rewards tab: goals, streaks, challenges, mastery, avatars, tests, levels, badges.
window.TT = window.TT || {};
TT.views = TT.views || {};

TT.views.rewards = (function () {
  var c = TT.views.common, s = TT.stats, store = TT.store, u = TT.util;
  var fmt = u.fmt, esc = u.esc;

  function badge(earned, emoji, title, sub) {
    return '<div class="badge' + (earned ? "" : " lock") + '"><span class="em">' + emoji + "</span><span><b>" + esc(title) + "</b><small>" + sub + "</small></span></div>";
  }

  function bar(pct) {
    return '<div class="xp"><i style="width:' + Math.min(100, pct) + '%"></i></div>';
  }

  function goal() {
    var g = store.state.goal;
    return (
      '<h2 class="sec">Daily goal</h2><div class="vctl" style="align-items:center">' +
      '<button class="ghost" data-action="goal" data-value="-5" aria-label="Lower goal">−</button>' +
      '<b class="big" style="flex:1;text-align:center;font-size:26px">' + g + " min a day</b>" +
      '<button class="ghost" data-action="goal" data-value="5" aria-label="Raise goal">+</button></div>' +
      '<p class="muted" style="margin:0 0 4px">Weekly goal: ' + g * 7 + " min · Monthly goal: " + s.monthGoal() + " min</p>"
    );
  }

  function goalBar(title, secs, minutes) {
    return (
      '<h2 class="sec">' + title + ": " + fmt(secs) + " / " + fmt(minutes * 60) + "</h2>" + bar((secs / 60 / minutes) * 100) +
      '<p class="muted" style="margin:0 0 4px">' + (secs >= minutes * 60 ? "Goal reached!" : fmt(minutes * 60 - secs) + " to go.") + "</p>"
    );
  }

  function streaks() {
    var now = s.streak(), best = s.longestStreak();
    return (
      '<h2 class="sec">Streak: ' + now + " day" + (now === 1 ? "" : "s") + '</h2><div class="badges">' +
      TT.STREAK_BADGES.map(function (n) {
        return badge(best >= n, "🔥", n + "-day streak", best >= n ? "Earned" : "Best: " + best + " days");
      }).join("") + "</div>"
    );
  }

  function challenges() {
    var ws = u.startOfWeek(), days = {}, topics = {};
    store.state.log.forEach(function (x) {
      if (x.t < ws) return;
      days[u.dayIndex(x.t)] = 1;
      var k = s.topicOf(x.d);
      if (k) topics[k] = 1;
    });
    var tests = store.state.results.filter(function (r) { return r.t >= ws; }).length;
    var list = [
      ["Practice on 5 different days", Object.keys(days).length, 5],
      ["Try drills from 3 topics", Object.keys(topics).length, 3],
      ["Take 2 tests", tests, 2]
    ];
    return '<h2 class="sec">Weekly challenges</h2>' + list.map(function (ch) {
      var p = Math.min(ch[1], ch[2]);
      return '<p class="challenge"><b>' + (p >= ch[2] ? "✅ " : "") + ch[0] + '</b> <span class="muted">' + p + "/" + ch[2] + "</span></p>" + bar((p / ch[2]) * 100);
    }).join("");
  }

  function mastery() {
    var secs = {};
    store.state.log.forEach(function (x) {
      var k = s.topicOf(x.d);
      if (k) secs[k] = (secs[k] || 0) + x.s;
    });
    var M = TT.MASTERY_MINUTES;
    return '<h2 class="sec">Topic mastery</h2><div class="badges">' + TT.TOPICS.filter(function (t) { return t.id !== "fav"; }).map(function (t) {
      var min = (secs[t.id] || 0) / 60;
      var i = min >= M[2] ? 3 : min >= M[1] ? 2 : min >= M[0] ? 1 : 0;
      return badge(i > 0, ["⚪", "🥉", "🥈", "🥇"][i], t.label, fmt(min * 60) + (i < 3 ? " · next at " + M[i] + " min" : " · maxed"));
    }).join("") + "</div>";
  }

  function avatars() {
    var tot = s.total();
    return '<h2 class="sec">Avatars</h2><div class="badges four">' + TT.AVATARS.map(function (a, i) {
      var ok = tot >= a.minutes * 60;
      return '<button class="badge avatar' + (ok ? "" : " lock") + (store.state.avatar === i ? " on" : "") + '" data-action="avatar" data-value="' + i +
        '" aria-label="Avatar ' + (ok ? "" : "(locked) ") + a.emoji + '">' + a.emoji + "</button>";
    }).join("") + '</div><p class="muted" style="margin:6px 0 0">Unlock more avatars with your total practice time.</p>';
  }

  function testTotals() {
    var counts = [0, 0, 0, 0], reps = 0;
    TT.TESTS.forEach(function (t) {
      var b = s.bestOf(t.id);
      if (b != null) counts[s.medalOf(t, b)]++;
    });
    store.state.results.forEach(function (r) { reps += r.sc; });
    var taken = TT.TESTS.filter(function (t) { return s.bestOf(t.id) != null; });
    return (
      '<h2 class="sec">Tests</h2><div class="stats">' +
      c.stat("🥇 " + counts[3], "Gold") + c.stat("🥈 " + counts[2], "Silver") + c.stat("🥉 " + counts[1], "Bronze") +
      '</div><p class="note">' + store.state.results.length + " tests taken · " + reps + ' total reps counted</p><div class="badges">' +
      taken.map(function (t) {
        var b = s.bestOf(t.id), m = s.medalOf(t, b);
        return badge(m > 0, m ? TT.MEDALS[m].emoji : t.emoji, t.name, "Best " + b + " " + t.unit);
      }).join("") + "</div>"
    );
  }

  function levels(L, month) {
    var goalSecs = s.monthGoal() * 60;
    return (
      '<h2 class="sec">Monthly levels</h2><p class="note">' + (L.next ? fmt(L.need) + " until " + L.next + "." : "World class this month. Keep it up!") + '</p><div class="badges">' +
      TT.LEVELS.slice(1).map(function (lv, k) {
        var need = (goalSecs * (k + 1)) / 4;
        return badge(month >= need, lv.emoji, "Level " + (k + 1) + ": " + lv.name, fmt(need) + " this month");
      }).join("") + "</div>"
    );
  }

  function badges() {
    var tot = s.total();
    return '<h2 class="sec">Badges</h2><div class="badges">' + TT.BADGES.map(function (b) {
      var ok = tot >= b.minutes * 60;
      return badge(ok, b.emoji, b.name, ok ? "Earned" : b.minutes + " min total");
    }).join("") + "</div>";
  }

  function backup() {
    return (
      '<h2 class="sec">Backup</h2><p class="note">Progress is saved in this browser. Download a backup to keep it safe or move it to another device.</p>' +
      '<div class="backup"><button class="ghost" data-action="export">Download backup</button>' +
      '<label class="ghost" style="text-align:center;cursor:pointer">Restore backup<input type="file" accept="application/json,.json" hidden data-input="import"></label></div>'
    );
  }

  function page(L) {
    var g = store.state.goal, month = s.month();
    return (
      goal() +
      goalBar("Today", s.today(), g) +
      goalBar("This week", s.week(), g * 7) +
      goalBar("This month", month, s.monthGoal()) +
      streaks() + challenges() + mastery() + avatars() + testTotals() + levels(L, month) + badges() + backup()
    );
  }

  return { page: page };
})();
