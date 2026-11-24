// Online saving. When the app runs as a claude.ai page and the visitor is
// signed in, every player account and its progress is also saved to that
// visitor's private online storage, so it's there on any device they sign in
// on. Anywhere else (GitHub Pages, opening the file), this does nothing and
// progress stays saved in the browser.
//
// Layout (private to each visitor):
//   data/users/<uid>/touchtime                 { players: [...], updated }
//   data/users/<uid>/touchtime/players/<pid>   { json: "<progress>" }
window.TT = window.TT || {};

TT.cloud = (function () {
  var store = TT.store;
  var db = null, uid = null;
  var status = "local"; // local | connecting | synced | saving | error
  var listeners = [];
  var timer = null, dirtyPlayers = {}, dirtyList = false, busy = false;

  function setStatus(s) {
    if (status === s) return;
    status = s;
    listeners.forEach(function (fn) { fn(s); });
  }

  function root() { return db.doc("data/users/" + uid + "/touchtime"); }
  function playerDoc(id) { return root().collection("players").doc(id); }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) { setTimeout(function () { reject({ code: "timeout" }); }, ms); })
    ]);
  }

  // Pull everything down once, merge it with this device, then push the result.
  function pull() {
    return withTimeout(root().get(), 10000).then(function (snap) {
      var remote = snap.exists ? snap.data().players || [] : [];
      store.mergePlayers(remote);
      return Promise.all(store.allPlayers().map(function (p) {
        if (p.deleted) return null;
        return playerDoc(p.id).get().then(function (ps) {
          if (ps.exists && ps.data().json) store.mergePlayerData(p.id, JSON.parse(ps.data().json));
          dirtyPlayers[p.id] = true;
        });
      }));
    }).then(function () {
      dirtyList = true;
      return flush();
    });
  }

  // Save what changed. Writes one document at a time.
  function flush() {
    if (!db || busy) return Promise.resolve();
    var ids = Object.keys(dirtyPlayers);
    if (!dirtyList && !ids.length) {
      setStatus("synced");
      return Promise.resolve();
    }
    busy = true;
    setStatus("saving");
    var work = Promise.resolve();
    if (dirtyList) {
      dirtyList = false;
      work = work.then(function () {
        return root().set({ players: store.allPlayers(), updated: Date.now() });
      });
    }
    ids.forEach(function (id) {
      delete dirtyPlayers[id];
      var p = store.allPlayers().filter(function (x) { return x.id === id; })[0];
      work = work.then(function () {
        if (!p || p.deleted) return playerDoc(id).delete();
        return playerDoc(id).set({ json: JSON.stringify(store.playerData(id)), updated: Date.now() });
      });
    });
    return work.then(function () {
      busy = false;
      if (dirtyList || Object.keys(dirtyPlayers).length) return flush();
      setStatus("synced");
    }).catch(function (e) {
      busy = false;
      // A visitor who may not save online keeps saving on this device only.
      if (e && (e.code === "invalid_argument" || e.code === "not_granted" || e.code === "revoked")) {
        db = null;
        setStatus("local");
      } else {
        setStatus("error");
      }
    });
  }

  function later() {
    clearTimeout(timer);
    timer = setTimeout(flush, 1200);
  }

  store.on(function (kind, extra) {
    if (!db) return;
    var cur = store.current();
    if (kind === "progress" && cur) dirtyPlayers[cur.id] = true;
    if (kind === "players" && cur) { dirtyList = true; dirtyPlayers[cur.id] = true; }
    if (kind === "deleted") { dirtyList = true; dirtyPlayers[extra] = true; }
    later();
  });

  function start(onReady) {
    var c = window.claude;
    if (!c || !c.use) return;
    setStatus("connecting");
    Promise.all([c.use("user"), c.use("db")]).then(function (r) {
      var user = r[0];
      db = r[1];
      if (!user || !db) throw { code: "not_granted" };
      return user.id();
    }).then(function (id) {
      if (!id) throw { code: "not_granted" };
      uid = id;
      return pull();
    }).then(function () {
      onReady();
    }).catch(function () {
      db = null;
      setStatus("local");
      onReady();
    });
  }

  return {
    start: start,
    status: function () { return status; },
    onStatus: function (fn) { listeners.push(fn); },
    retry: function () { if (db) flush(); }
  };
})();
