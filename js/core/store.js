// Player accounts and saved progress.
//
// Nobody has to sign in: until they do, people train as a guest, saved in
// this browser. Creating an account moves the guest's progress into it.
//
// Each player has their own progress. It is always saved in this browser
// (localStorage), and js/core/cloud.js also saves it to the viewer's online
// account when one is available, so it follows them to other devices.
window.TT = window.TT || {};

TT.store = (function () {
  var KEYS = {
    players: "touchtime.players", // [player], see "players" below
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

  var GUEST = { id: "guest", name: "Guest", guest: true };
  var players = [];
  var current = GUEST; // the signed-in player, or GUEST

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
  //
  // A player: { id, first, last, name (profile name), pwd, salt, mail, msalt,
  //             created, updated, deleted? }
  // pwd and mail are slow salted fingerprints (js/core/hash.js), each with its
  // own salt: the password and email themselves are never stored. On this device players switch
  // without a password; it's needed to deactivate the account, to sign in on
  // another device from a backup, and to change the password.

  function savePlayers() {
    write(KEYS.players, players);
  }

  // Loads a player's progress, or the guest's when p is null.
  function loadPlayer(p) {
    resetState();
    current = p || GUEST;
    merge(read(KEYS.player + current.id, {}));
    // Progress from before accounts existed belongs to whoever opens the app first.
    if (current.guest) {
      var old = legacyData();
      if (old) {
        merge(old);
        write(KEYS.migrated, true);
        write(KEYS.player + GUEST.id, snapshot());
      }
    }
  }

  function legacyData() {
    if (read(KEYS.migrated, false)) return null;
    var log = read(LEGACY.log, []), tres = read(LEGACY.results, []);
    var favs = read(LEGACY.favs, []), mine = read(LEGACY.mine, []);
    if (!log.length && !tres.length && !favs.length && !mine.length) return null;
    var p = read(LEGACY.prefs, {});
    return { log: log, tres: tres, favs: favs, mine: mine, goal: p.goal, av: p.av, gts: p.ts || 1, rest: p.rest };
  }

  function clean(v, max) {
    return String(v || "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function emailKey(email) {
    return String(email || "").trim().toLowerCase();
  }

  // Is this profile name free on this device? (ignores the player `exceptId`)
  function nameTaken(name, exceptId) {
    var n = clean(name, 20).toLowerCase();
    return activePlayers().some(function (p) { return p.id !== exceptId && String(p.name).toLowerCase() === n; });
  }

  // info: { first, last, name, password, email (optional) }
  function createPlayer(info) {
    var id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var salt = TT.hash.salt();
    var p = {
      id: id,
      first: clean(info.first, 30),
      last: clean(info.last, 30),
      name: clean(info.name, 20),
      salt: salt,
      pwd: TT.hash.secret(info.password, salt),
      msalt: "",
      mail: "",
      created: Date.now(),
      updated: Date.now()
    };
    if (info.email) fingerprintEmail(p, info.email);
    var fromGuest = current.guest ? snapshot() : null;
    players.push(p);
    savePlayers();
    write(KEYS.current, id);
    loadPlayer(p);
    // What they did as a guest moves into the new account.
    if (fromGuest) {
      merge(JSON.parse(JSON.stringify(fromGuest)));
      remove(KEYS.player + GUEST.id);
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

  // Accounts made before passwords existed have none yet.
  function hasPassword(p) {
    p = p || current;
    return !!(p && p.pwd && p.salt);
  }

  function checkPassword(password, p) {
    p = p || current;
    if (!hasPassword(p)) return true;
    return TT.hash.secret(String(password || ""), p.salt) === p.pwd;
  }

  // Switching players on this device needs no password.
  function signIn(id) {
    var p = findPlayer(id);
    if (!p) return false;
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

  function touch() {
    current.updated = Date.now();
    savePlayers();
    emit("players");
  }

  // { first, last, name }
  function updateProfile(info) {
    if (current.guest) return;
    if (info.first != null) current.first = clean(info.first, 30);
    if (info.last != null) current.last = clean(info.last, 30);
    if (info.name != null && clean(info.name, 20)) current.name = clean(info.name, 20);
    touch();
  }

  function fingerprintEmail(p, email) {
    p.msalt = email ? TT.hash.salt() : "";
    p.mail = email ? TT.hash.secret(emailKey(email), p.msalt) : "";
  }

  function fingerprintPassword(p, password) {
    p.salt = TT.hash.salt();
    p.pwd = TT.hash.secret(password, p.salt);
  }

  // For accounts made before passwords existed (no current password).
  function setPassword(password) {
    if (current.guest || hasPassword()) return false;
    fingerprintPassword(current, password);
    touch();
    return true;
  }

  function changePassword(oldPassword, newPassword) {
    if (current.guest || !checkPassword(oldPassword)) return false;
    fingerprintPassword(current, newPassword);
    touch();
    return true;
  }

  function hasEmail(p) {
    p = p || current;
    return !!(p && p.mail && p.msalt);
  }

  // Add, change or (with an empty email) remove the reset email.
  function setEmail(email, password) {
    if (current.guest || !hasPassword() || !checkPassword(password)) return false;
    fingerprintEmail(current, email);
    touch();
    return true;
  }

  function mailMatches(p, email) {
    return hasEmail(p) && TT.hash.secret(emailKey(email), p.msalt) === p.mail;
  }

  // Forgot password: the email given at sign-up lets you choose a new one.
  function resetPassword(id, email, newPassword) {
    var p = findPlayer(id);
    if (!p || !mailMatches(p, email)) return false;
    fingerprintPassword(p, newPassword);
    p.updated = Date.now();
    savePlayers();
    emit("players");
    return true;
  }

  // Deactivate: removes the account and its progress from this device.
  function deletePlayer(password) {
    if (current.guest || !checkPassword(password)) return false;
    var id = current.id;
    // Kept as a marker so online sync doesn't bring the player back.
    current.deleted = true;
    ["first", "last", "name", "pwd", "salt", "mail", "msalt"].forEach(function (k) { current[k] = ""; });
    current.updated = Date.now();
    savePlayers();
    remove(KEYS.player + id);
    signOut();
    emit("deleted", id);
    return true;
  }

  // ---- saving ----

  function save() {
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
  // A backup holds the account (names and password fingerprint, never the
  // password itself) and its progress, so it can sign in on another device.

  function exportJson() {
    var s = snapshot();
    s.app = "touch-time";
    s.version = 3;
    if (!current.guest) {
      s.account = {
        id: current.id, first: current.first || "", last: current.last || "", name: current.name,
        pwd: current.pwd || "", salt: current.salt || "", mail: current.mail || "", msalt: current.msalt || "",
        created: current.created, updated: current.updated
      };
    }
    return JSON.stringify(s, null, 1);
  }

  function parseBackup(text) {
    var r = JSON.parse(text);
    if (!r || !Array.isArray(r.log)) throw new Error("Not a Touch Time backup");
    return r;
  }

  // Restore into the signed-in player (or guest): adds the backup's progress.
  function importJson(text) {
    merge(parseBackup(text));
    save();
  }

  // Sign in on this device with a backup from another one.
  // Returns "ok", "no-account" (backup has no account), or "wrong-password".
  function signInWithBackup(text, password) {
    var r = parseBackup(text), a = r.account;
    if (!a || !a.id) return "no-account";
    if (!checkPassword(password, a)) return "wrong-password";
    var existing = players.filter(function (p) { return p.id === a.id; })[0];
    if (existing) {
      if (existing.deleted) existing.deleted = false;
      ["first", "last", "name", "pwd", "salt", "mail", "msalt", "created"].forEach(function (k) { existing[k] = a[k]; });
      existing.updated = Date.now();
    } else {
      var copy = {};
      ["id", "first", "last", "name", "pwd", "salt", "mail", "msalt", "created", "updated"].forEach(function (k) { copy[k] = a[k]; });
      // Don't clash with a different player of the same profile name here.
      if (nameTaken(copy.name, copy.id)) copy.name = clean(copy.name, 17) + " (2)";
      players.push(copy);
    }
    savePlayers();
    write(KEYS.current, a.id);
    loadPlayer(findPlayer(a.id));
    merge(r);
    save();
    emit("players");
    return "ok";
  }

  // ---- used by cloud.js ----

  // Adds players from the online account, keeping the newest details.
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
    if (current.id === id) return snapshot();
    return read(KEYS.player + id, {});
  }

  // Merges online progress into a player's saved progress.
  function mergePlayerData(id, data) {
    if (current.id === id) {
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
    isGuest: function () { return !!current.guest; },
    findPlayer: findPlayer,
    nameTaken: nameTaken,
    createPlayer: createPlayer,
    signIn: signIn,
    signOut: signOut,
    updateProfile: updateProfile,
    hasPassword: hasPassword,
    checkPassword: checkPassword,
    setPassword: setPassword,
    changePassword: changePassword,
    hasEmail: hasEmail,
    setEmail: setEmail,
    resetPassword: resetPassword,
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
    signInWithBackup: signInWithBackup,
    mergePlayers: mergePlayers,
    playerData: playerData,
    mergePlayerData: mergePlayerData
  };
})();
