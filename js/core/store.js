// Player accounts and saved progress.
//
// Each player has their own progress. It is always saved in this browser
// (localStorage), and js/core/cloud.js also saves it to the viewer's online
// account when one is available, so it follows them to other devices.
window.TT = window.TT || {};

TT.store = (function () {
  var KEYS = {
    players: "touchtime.players", // [{ id, name, pin, created, updated }]
    current: "touchtime.current", // id of the player signed in on this device
    player: "touchtime.player.", // + id -> that player's progress
    migrated: "touchtime.migrated"
  };
  // Keys used by the original single-player app; imported into the first account.
  var LEGACY = {
    log: "touchtime.log",
    favs: "touchtime.favs",
    results: "touchtime.tests",
    mine: "touchtime.mine",
    prefs: "touchtime.prefs"
  };

  var players = [];
  var current = null; // the signed-in player object, or null

  // The signed-in player's progress. Other modules keep a reference to this
  // object, so it is always updated in place, never replaced.
  var state = {};
  resetState();

  var listeners = [];

  function resetState() {
    state.log = []; // [{ t: timestamp, s: seconds, d: drill or test id }]
    state.favs = []; // [drill id]
    state.results = []; // [{ t: timestamp, id: test id, sc: score }]
    state.mine = []; // practices this player built
    state.goal = TT.DEFAULT_DAILY_GOAL; // minutes a day
    state.avatar = 0; // index into TT.AVATARS
    state.rest = 0; // seconds of rest between practice drills
    state.prefsTime = 0; // when goal/avatar last changed (newest wins when merging)
  }

  // ---- browser storage ----

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

  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  // ---- progress format ----

  // The original app saved custom practices as { id, n, l, e, d, my }.
  function upgradePractice(p) {
    if (p.drills) return p;
    return { id: p.id, name: p.n || "My practice", drills: p.l || [], emoji: p.e || "⭐", description: p.d || "", mine: true };
  }

  // Progress as saved: { log, favs, tres, mine, goal, av, gts, rest }
  function snapshot() {
    return {
      log: state.log,
      favs: state.favs,
      tres: state.results,
      mine: state.mine,
      goal: state.goal,
      av: state.avatar,
      gts: state.prefsTime,
      rest: state.rest
    };
  }

  // Combines saved progress into the current state without losing anything
  // from either side. Used for cloud sync, backups and the old-app import.
  function merge(r) {
    if (!r) return;
    var byKey = {};
    state.log.concat(r.log || []).forEach(function (x) { byKey[x.t + "|" + x.d] = x; });
    state.log = Object.values(byKey).sort(function (a, b) { return a.t - b.t; });
    byKey = {};
    state.results.concat(r.tres || []).forEach(function (x) { byKey[x.t + "|" + x.id] = x; });
    state.results = Object.values(byKey).sort(function (a, b) { return a.t - b.t; });
    (r.favs || []).forEach(function (f) { if (state.favs.indexOf(f) < 0) state.favs.push(f); });
    (r.mine || []).map(upgradePractice).forEach(function (p) {
      var i = state.mine.findIndex(function (m) { return m.id === p.id; });
      if (i < 0) state.mine.push(p);
    });
    if ((r.gts || 0) > state.prefsTime) {
      state.goal = r.goal || state.goal;
      state.avatar = r.av || 0;
      state.prefsTime = r.gts;
    }
    if (r.rest != null && !state.rest) state.rest = r.rest;
  }

  // ---- players ----

  // Not real security: a PIN only stops siblings or teammates on a shared
  // device from opening each other's account.
  function hashPin(id, pin) {
    var s = id + ":" + pin, h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return "h" + (h >>> 0).toString(36);
  }

  function savePlayers() {
    write(KEYS.players, players);
  }

  function loadPlayer(p) {
    resetState();
    current = p;
    if (!p) return;
    merge(read(KEYS.player + p.id, {}));
  }

  function legacyData() {
    if (read(KEYS.migrated, false)) return null;
    var log = read(LEGACY.log, []), tres = read(LEGACY.results, []);
    var favs = read(LEGACY.favs, []), mine = read(LEGACY.mine, []);
    if (!log.length && !tres.length && !favs.length && !mine.length) return null;
    var p = read(LEGACY.prefs, {});
    return { log: log, tres: tres, favs: favs, mine: mine, goal: p.goal, av: p.av, gts: p.ts || 1, rest: p.rest };
  }

  function createPlayer(name, pin) {
    var id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var p = { id: id, name: name.trim().slice(0, 24), pin: pin ? hashPin(id, pin) : "", created: Date.now(), updated: Date.now() };
    players.push(p);
    savePlayers();
    write(KEYS.current, id);
    loadPlayer(p);
    // Progress from before accounts existed goes to the first account made.
    var old = legacyData();
    if (old) {
      merge(old);
      write(KEYS.migrated, true);
    }
    save();
    emit("players");
    return p;
  }

  function findPlayer(id) {
    return players.filter(function (p) { return p.id === id && !p.deleted; })[0] || null;
  }

  function activePlayers() {
    return players.filter(function (p) { return !p.deleted; });
  }

  function hasPin(id) {
    var p = findPlayer(id);
    return !!(p && p.pin);
  }

  // Returns false when the PIN is wrong.
  function signIn(id, pin) {
    var p = findPlayer(id);
    if (!p) return false;
    if (p.pin && p.pin !== hashPin(id, pin || "")) return false;
    write(KEYS.current, id);
    loadPlayer(p);
    emit("signin");
    return true;
  }

  function signOut() {
    remove(KEYS.current);
    loadPlayer(null);
    emit("signout");
  }

  function renamePlayer(name) {
    if (!current || !name.trim()) return;
    current.name = name.trim().slice(0, 24);
    current.updated = Date.now();
    savePlayers();
    emit("players");
  }

  function setPin(pin) {
    if (!current) return;
    current.pin = pin ? hashPin(current.id, pin) : "";
    current.updated = Date.now();
    savePlayers();
    emit("players");
  }

  function deletePlayer() {
    if (!current) return;
    var id = current.id;
    // Kept as a marker so online sync doesn't bring the player back.
    current.deleted = true;
    current.name = "";
    current.pin = "";
    current.updated = Date.now();
    savePlayers();
    remove(KEYS.player + id);
    signOut();
    emit("deleted", id);
  }

  // ---- saving ----

  function save() {
    if (!current) return;
    write(KEYS.player + current.id, snapshot());
    emit("progress");
  }

  function on(fn) { listeners.push(fn); }
  function emit(kind, extra) {
    listeners.forEach(function (fn) { try { fn(kind, extra); } catch (e) {} });
  }

  // ---- changes made while playing ----

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
    var i = state.mine.findIndex(function (m) { return m.id === p.id; });
    if (i > -1) state.mine[i] = p;
    else state.mine.unshift(p);
    save();
  }

  function deletePractice(id) {
    state.mine = state.mine.filter(function (m) { return m.id !== id; });
    save();
  }

  // ---- backup file ----

  function exportJson() {
    var s = snapshot();
    s.app = "touch-time";
    s.version = 2;
    s.player = current ? current.name : "";
    return JSON.stringify(s, null, 1);
  }

  function importJson(text) {
    var r = JSON.parse(text);
    if (!r || !Array.isArray(r.log)) throw new Error("Not a Touch Time backup");
    merge(r);
    save();
  }

  // ---- used by cloud.js ----

  // Adds players from the online account, keeping the newest name and PIN.
  function mergePlayers(list) {
    var changed = false;
    (list || []).forEach(function (p) {
      var mine = players.filter(function (x) { return x.id === p.id; })[0];
      if (!mine) { players.push(p); changed = true; }
      else if ((p.updated || 0) > (mine.updated || 0)) { Object.assign(mine, p); changed = true; }
    });
    if (changed) savePlayers();
    return changed;
  }

  // Saved progress for any player, signed in or not.
  function playerData(id) {
    if (current && current.id === id) return snapshot();
    return read(KEYS.player + id, {});
  }

  // Merges online progress into a player's saved progress.
  function mergePlayerData(id, data) {
    if (current && current.id === id) {
      merge(data);
      write(KEYS.player + id, snapshot());
      return;
    }
    var keep = current, saved = {};
    Object.assign(saved, state);
    resetState();
    merge(read(KEYS.player + id, {}));
    merge(data);
    write(KEYS.player + id, snapshot());
    resetState();
    Object.assign(state, saved);
    current = keep;
  }

  // ---- start up ----

  players = read(KEYS.players, []);
  loadPlayer(findPlayer(read(KEYS.current, null)));

  return {
    state: state,
    on: on,
    save: save,
    players: activePlayers,
    allPlayers: function () { return players; },
    current: function () { return current; },
    findPlayer: findPlayer,
    hasPin: hasPin,
    createPlayer: createPlayer,
    signIn: signIn,
    signOut: signOut,
    renamePlayer: renamePlayer,
    setPin: setPin,
    deletePlayer: deletePlayer,
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
    importJson: importJson,
    mergePlayers: mergePlayers,
    playerData: playerData,
    mergePlayerData: mergePlayerData
  };
})();
