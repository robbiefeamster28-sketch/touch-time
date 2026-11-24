// Connects everything: holds what's on screen, draws the right page, and
// handles every button through data-action attributes.
window.TT = window.TT || {};

(function () {
  var u = TT.util, s = TT.stats, store = TT.store, V = TT.views;

  // What the player is looking at (not saved).
  var ui = {
    view: "practices", // practices | drills | tests | rewards
    topic: "dribbling", // drills tab filter
    testTopic: "dribbling", // tests tab filter
    query: "",
    levelFilter: "",
    length: 30, // seconds per drill
    drill: null, // open drill id
    test: null, // open test id
    practice: null, // open practice id
    builder: null, // practice being built: { id, name, drills, ... }
    builderTopic: "dribbling",
    account: false, // account page open
    pinFor: null // player id waiting for their PIN
  };

  // Back to the main tabs, e.g. after switching player.
  function resetUi() {
    ui.view = "practices";
    ui.drill = ui.test = ui.practice = ui.builder = ui.pinFor = null;
    ui.account = false;
    ui.query = "";
  }

  function page() {
    if (ui.account) return V.account.page();
    if (ui.builder) return V.practices.builder(ui);
    if (ui.test) return V.tests.detail(ui);
    if (ui.drill) return V.drills.detail(ui);
    if (ui.practice && V.practices.find(ui.practice)) return V.practices.detail(ui);
    ui.practice = null;
    var c = V.common;
    var body = {
      practices: V.practices.list,
      drills: V.drills.list,
      tests: V.tests.list,
      rewards: function () { return V.rewards.page(s.level()); }
    }[ui.view](ui);
    return c.statRow() + c.tabs(ui.view) + body;
  }

  function render() {
    var app = u.$("app");
    if (!store.current()) {
      app.innerHTML = ui.pinFor ? V.account.pinEntry(ui) : V.account.signIn(ui);
      var first = u.$(ui.pinFor ? "pinin" : "pname");
      if (first && ui.pinFor) first.focus();
      return;
    }
    app.innerHTML = V.common.header(s.level()) + page();
  }

  function top() {
    render();
    window.scrollTo(0, 0);
  }

  TT.timer.onClose(render);

  // ---- button actions: data-action="name" plus data-id / data-value / data-index ----

  var actions = {
    tab: function (el) { ui.view = el.dataset.value; ui.query = ""; render(); },
    topic: function (el) { ui.topic = el.dataset.value; render(); },
    "test-topic": function (el) { ui.testTopic = el.dataset.value; render(); },
    "level-filter": function (el) { ui.levelFilter = el.dataset.value; render(); },
    fav: function (el) { store.toggleFav(el.dataset.id); render(); },
    length: function (el) { ui.length = +el.dataset.value; render(); },
    rest: function (el) { store.setRest(+el.dataset.value); render(); },

    "open-drill": function (el) { ui.drill = el.dataset.id; top(); },
    "close-drill": function () { ui.drill = null; top(); },
    "start-drill": function () { TT.sessions.drill(ui.drill, ui.length); },

    "open-test": function (el) { ui.test = el.dataset.id; top(); },
    "close-test": function () { ui.test = null; top(); },
    "start-test": function () { TT.sessions.test(ui.test); },
    "test-go": function () { TT.sessions.testGo(); },
    "test-count": function (el) { TT.sessions.count(+el.dataset.value); },
    "test-save": function () { TT.sessions.testSave(); },

    "open-practice": function (el) { ui.practice = el.dataset.id; top(); },
    "close-practice": function () { ui.practice = null; top(); },
    "start-practice": function () { TT.sessions.practice(V.practices.find(ui.practice), ui.length); },
    "practice-go": function () { TT.sessions.practiceGo(); },

    "new-practice": function () {
      ui.builder = { id: "my" + Date.now(), name: "", drills: [], emoji: "⭐", mine: true, description: "My custom practice" };
      top();
    },
    "practice-from-favs": function () {
      ui.builder = { id: "my" + Date.now(), name: "My favorites", drills: store.state.favs.filter(s.drill), emoji: "⭐", mine: true, description: "Made from my favorite drills" };
      top();
    },
    "edit-practice": function () { ui.builder = JSON.parse(JSON.stringify(V.practices.find(ui.practice))); top(); },
    "delete-practice": function () {
      if (!window.confirm("Delete this practice?")) return;
      store.deletePractice(ui.practice);
      ui.practice = null;
      top();
    },
    "cancel-builder": function () { ui.builder = null; top(); },
    "builder-topic": function (el) { ui.builderTopic = el.dataset.value; render(); },
    "builder-add": function (el) { ui.builder.drills.push(el.dataset.id); render(); },
    "builder-remove": function (el) { ui.builder.drills.splice(+el.dataset.index, 1); render(); },
    "builder-move": function (el) {
      var list = ui.builder.drills, i = +el.dataset.index, j = i + +el.dataset.value;
      if (j < 0 || j >= list.length) return;
      var t = list[i]; list[i] = list[j]; list[j] = t;
      render();
    },
    "save-practice": function () {
      var b = ui.builder;
      if (!b.name.trim()) return u.toast("Give your practice a name.");
      if (!b.drills.length) return u.toast("Add at least one drill.");
      b.name = b.name.trim();
      store.savePractice(b);
      ui.practice = b.id;
      ui.builder = null;
      top();
      u.toast("Practice saved");
    },

    goal: function (el) { store.setGoal(store.state.goal + +el.dataset.value); render(); },
    avatar: function (el) {
      var i = +el.dataset.value, need = TT.AVATARS[i].minutes;
      if (s.total() < need * 60) return u.toast("Locked: practice " + need + " min in total to unlock.");
      store.setAvatar(i);
      render();
    },
    export: function () {
      var blob = new Blob([store.exportJson()], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "touch-time-backup-" + new Date().toISOString().slice(0, 10) + ".json";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    },

    "choose-player": function (el) {
      var id = el.dataset.id;
      if (store.hasPin(id)) { ui.pinFor = id; return top(); }
      store.signIn(id);
      resetUi();
      top();
    },
    "cancel-pin": function () { ui.pinFor = null; top(); },
    "open-account": function () { ui.account = true; top(); },
    "close-account": function () { ui.account = false; top(); },
    "sign-out": function () { store.signOut(); resetUi(); top(); },
    "remove-pin": function () { store.setPin(""); render(); u.toast("PIN removed"); },
    "sync-retry": function () { TT.cloud.retry(); },
    "delete-player": function () {
      var name = store.current().name;
      if (!window.confirm("Delete " + name + "’s account and all their progress? This can’t be undone.")) return;
      store.deletePlayer();
      resetUi();
      top();
      u.toast("Account deleted");
    },

    "timer-pause": function () { TT.timer.pause(); },
    "timer-close": function () { TT.timer.close(); },
    "rest-skip": function () { TT.timer.skipRest(); }
  };

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-action]");
    if (!el || !actions[el.dataset.action]) return;
    actions[el.dataset.action](el);
  });

  // ---- forms ----

  var forms = {
    "create-player": function (f) {
      var name = f.name.value.trim(), pin = f.pin.value.trim();
      if (!name) return u.toast("Enter a player name.");
      if (pin && !/^[0-9]{4}$/.test(pin)) return u.toast("A PIN is 4 numbers.");
      var taken = store.players().some(function (p) { return p.name.toLowerCase() === name.toLowerCase(); });
      if (taken) return u.toast("There’s already a player called " + name + ".");
      store.createPlayer(name, pin);
      ui.draftName = "";
      resetUi();
      top();
      u.toast("Welcome, " + store.current().name + "!");
    },
    pin: function (f) {
      if (store.signIn(ui.pinFor, f.pin.value.trim())) {
        resetUi();
        top();
      } else {
        f.pin.value = "";
        u.toast("That PIN isn’t right.");
      }
    },
    rename: function (f) {
      var name = f.name.value.trim();
      if (!name) return;
      store.renamePlayer(name);
      render();
      u.toast("Name saved");
    },
    "set-pin": function (f) {
      var pin = f.pin.value.trim();
      if (!/^[0-9]{4}$/.test(pin)) return u.toast("A PIN is 4 numbers.");
      store.setPin(pin);
      render();
      u.toast("PIN saved");
    }
  };

  document.addEventListener("submit", function (e) {
    var kind = e.target.dataset.form;
    if (!forms[kind]) return;
    e.preventDefault();
    forms[kind](e.target);
  });

  // ---- typing and file inputs ----

  document.addEventListener("input", function (e) {
    var kind = e.target.dataset.input;
    if (kind === "search") {
      ui.query = e.target.value;
      var box = u.$("results");
      if (box) box.innerHTML = ui.view === "tests" ? V.tests.results(ui) : V.drills.results(ui);
    } else if (e.target.id === "pname") {
      ui.draftName = e.target.value; // kept if the screen redraws while typing
    } else if (kind === "practice-name" && ui.builder) {
      ui.builder.name = e.target.value;
    }
  });

  document.addEventListener("change", function (e) {
    if (e.target.dataset.input !== "import") return;
    var file = e.target.files[0];
    if (!file) return;
    file.text().then(function (text) {
      store.importJson(text);
      render();
      u.toast("Backup restored");
    }).catch(function () {
      u.toast("That file isn’t a Touch Time backup.");
    });
  });

  // Redraw when online saving changes state (unless a timer is on screen).
  TT.cloud.onStatus(function () {
    var typing = document.activeElement && /INPUT/.test(document.activeElement.tagName);
    if (!typing) render();
  });
  TT.cloud.start(function () {
    if (store.current() && !store.findPlayer(store.current().id)) store.signOut();
    render();
  });

  render();
})();
