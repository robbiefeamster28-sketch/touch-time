// Saved progress. Everything lives in the browser's localStorage, using the
// same keys as the original app so existing progress carries over.
window.TT = window.TT || {};

TT.store = (function () {
  var KEYS = {
    log: "touchtime.log", // [{ t: timestamp, s: seconds, d: drill or test id }]
    favs: "touchtime.favs", // [drill id]
    results: "touchtime.tests", // [{ t: timestamp, id: test id, sc: score }]
    mine: "touchtime.mine", // [practice] built by the player
    prefs: "touchtime.prefs" // { goal, av, ts, rest }
  };

  var state = {
    log: [],
    favs: [],
    results: [],
    mine: [],
    goal: TT.DEFAULT_DAILY_GOAL, // minutes a day
    avatar: 0, // index into TT.AVATARS
    rest: 0, // seconds of rest between practice drills
    prefsTime: 0 // when goal/avatar last changed, used when merging backups
  };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Storage can be blocked (private mode); the app still works for this visit.
    }
  }

  // The original app saved custom practices as { id, n, l, e, d, my }.
  function upgradePractice(p) {
    if (p.drills) return p;
    return { id: p.id, name: p.n || "My practice", drills: p.l || [], emoji: p.e || "⭐", description: p.d || "", mine: true };
  }

  function load() {
    state.log = read(KEYS.log, []);
    state.favs = read(KEYS.favs, []);
    state.results = read(KEYS.results, []);
    state.mine = read(KEYS.mine, []).map(upgradePractice);
    var p = read(KEYS.prefs, {});
    state.goal = p.goal || TT.DEFAULT_DAILY_GOAL;
    state.avatar = p.av || 0;
    state.prefsTime = p.ts || 0;
    state.rest = p.rest || 0;
  }

  function save() {
    write(KEYS.log, state.log);
    write(KEYS.favs, state.favs);
    write(KEYS.results, state.results);
    write(KEYS.mine, state.mine);
    write(KEYS.prefs, { goal: state.goal, av: state.avatar, ts: state.prefsTime, rest: state.rest });
  }

  // ---- changes ----

  function logTime(id, seconds) {
    state.log.push({ t: Date.now(), s: seconds, d: id });
    save();
  }

  function addResult(testId, score) {
    state.results.push({ t: Date.now(), id: testId, sc: score });
    save();
  }

  function toggleFav(id) {
    var i = state.favs.indexOf(id);
    if (i > -1) state.favs.splice(i, 1);
    else state.favs.push(id);
    save();
  }

  function isFav(id) {
    return state.favs.indexOf(id) > -1;
  }

  function setGoal(minutes) {
    state.goal = Math.max(5, Math.min(120, minutes));
    state.prefsTime = Date.now();
    save();
  }

  function setAvatar(i) {
    state.avatar = i;
    state.prefsTime = Date.now();
    save();
  }

  function setRest(seconds) {
    state.rest = seconds;
    save();
  }

  function savePractice(p) {
    var i = state.mine.findIndex(function (m) {
      return m.id === p.id;
    });
    if (i > -1) state.mine[i] = p;
    else state.mine.unshift(p);
    save();
  }

  function deletePractice(id) {
    state.mine = state.mine.filter(function (m) {
      return m.id !== id;
    });
    save();
  }

  // ---- backup: lets players move progress between devices ----

  function exportJson() {
    return JSON.stringify(
      {
        app: "touch-time",
        version: 1,
        log: state.log,
        favs: state.favs,
        tres: state.results,
        mine: state.mine,
        goal: state.goal,
        av: state.avatar,
        gts: state.prefsTime
      },
      null,
      1
    );
  }

  // Merges a backup into current progress without losing anything on either side.
  function importJson(text) {
    var r = JSON.parse(text);
    if (!r || !Array.isArray(r.log)) throw new Error("Not a Touch Time backup");
    var byKey = {};
    state.log.concat(r.log).forEach(function (x) {
      byKey[x.t + "|" + x.d] = x;
    });
    state.log = Object.values(byKey).sort(function (a, b) {
      return a.t - b.t;
    });
    byKey = {};
    state.results.concat(r.tres || []).forEach(function (x) {
      byKey[x.t + "|" + x.id] = x;
    });
    state.results = Object.values(byKey).sort(function (a, b) {
      return a.t - b.t;
    });
    (r.favs || []).forEach(function (f) {
      if (state.favs.indexOf(f) < 0) state.favs.push(f);
    });
    (r.mine || []).map(upgradePractice).forEach(function (p) {
      if (!state.mine.some(function (m) { return m.id === p.id; })) state.mine.push(p);
    });
    if ((r.gts || 0) > state.prefsTime) {
      state.goal = r.goal || state.goal;
      state.avatar = r.av || 0;
      state.prefsTime = r.gts;
    }
    save();
  }

  load();

  return {
    state: state,
    save: save,
    logTime: logTime,
    addResult: addResult,
    toggleFav: toggleFav,
    isFav: isFav,
    setGoal: setGoal,
    setAvatar: setAvatar,
    setRest: setRest,
    savePractice: savePractice,
    deletePractice: deletePractice,
    exportJson: exportJson,
    importJson: importJson
  };
})();
