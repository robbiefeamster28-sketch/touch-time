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
    account: false, // account / sign-in page open
    authMode: "", // signed out: "" (sign in / create) or "transfer" (from another device)
    accountMode: "" // signed in: "" (account page), "forgot" or "deactivate"
  };

  // Back to the main tabs, e.g. after switching player.
  function resetUi() {
    ui.view = "practices";
    ui.drill = ui.test = ui.practice = ui.builder = null;
    ui.account = false;
    ui.authMode = ui.accountMode = "";
    ui.query = "";
  }

  function page() {
    if (ui.account) return store.isGuest() ? V.account.signIn(ui) : V.account.page(ui);
    if (ui.builder) return V.practices.builder(ui);
    if (ui.test) return V.tests.detail(ui);
    if (ui.drill) return V.drills.detail(ui);
    if (ui.practice && V.practices.find(ui.practice)) return V.practices.detail(ui);
    ui.practice = null;
    return {
      practices: function () { return V.common.today() + V.practices.list(ui); },
      drills: V.drills.list,
      tests: V.tests.list,
      rewards: function () { return V.common.levelBar() + V.rewards.page(s.level()); }
    }[ui.view](ui);
  }

  // Which bottom tab to highlight: none while on account screens.
  function activeTab() {
    return ui.account ? "" : ui.view;
  }

  function render() {
    TT.scrollRows.save();
    u.$("app").innerHTML = V.common.topbar() + '<div class="page">' + page() + "</div>" + V.common.tabs(activeTab());
    TT.scrollRows.restore();
  }

  function top() {
    render();
    window.scrollTo(0, 0);
  }

  TT.timer.onClose(render);

  // ---- button actions: data-action="name" plus data-id / data-value / data-index ----

  var actions = {
    tab: function (el) {
      ui.drill = ui.test = ui.practice = ui.builder = null;
      ui.account = false;
      ui.authMode = ui.accountMode = "";
      ui.view = el.dataset.value;
      ui.query = "";
      top();
    },
    topic: function (el) { ui.topic = el.dataset.value; render(); },
    "test-topic": function (el) { ui.testTopic = el.dataset.value; render(); },
    "level-filter": function (el) { ui.levelFilter = el.dataset.value; render(); },
    fav: function (el) { store.toggleFav(el.dataset.id); render(); },
    length: function (el) { ui.length = +el.dataset.value; render(); },

    // From a practice's list, remember which drill of the practice it is.
    "open-drill": function (el) {
      ui.drill = el.dataset.id;
      ui.practiceIndex = el.dataset.index != null && ui.practice ? +el.dataset.index : null;
      top();
    },
    "close-drill": function () { ui.drill = null; ui.practiceIndex = null; top(); },
    // Run the practice from this drill to the end, with the breaks.
    "start-practice-here": function () {
      var p = V.practices.find(ui.practice), from = ui.practiceIndex;
      ui.drill = null; // "Return to practice" lands on the practice page
      ui.practiceIndex = null;
      render();
      TT.sessions.practice(p, ui.length, from);
    },
    "start-drill": function () { TT.sessions.drill(ui.drill, ui.length); },

    "open-test": function (el) { ui.test = el.dataset.id; top(); },
    "close-test": function () { ui.test = null; top(); },
    "start-test": function () { TT.sessions.test(ui.test); },
    "test-go": function () { TT.sessions.testGo(); },

    "open-practice": function (el) { ui.practice = el.dataset.id; top(); },
    "close-practice": function () { ui.practice = null; top(); },
    "start-practice": function () { TT.sessions.practice(V.practices.find(ui.practice), ui.length, 0); },
    "practice-go": function () { TT.sessions.practiceGo(); },
    "practice-skip": function () { TT.sessions.practiceSkip(); },

    "new-practice": function () {
      ui.builder = { id: "my" + Date.now(), name: "", drills: [], emoji: "⭐", mine: true, description: "My custom practice" };
      top();
    },
    "practice-from-favs": function () {
      ui.builder = { id: "my" + Date.now(), name: "My favorites", drills: store.state.favs.filter(s.drill), emoji: "⭐", mine: true, description: "Made from my favorite drills" };
      top();
    },
    "edit-practice": function () { ui.builder = JSON.parse(JSON.stringify(V.practices.find(ui.practice))); top(); },
    "delete-practice": function (el) {
      if (!u.confirmTap(el, "Tap again to delete")) return;
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
      var name = "touch-time-" + store.current().name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() + "-" + new Date().toISOString().slice(0, 10) + ".json";
      u.saveFile(name, store.exportJson()).catch(function (e) {
        if (!e || e.code !== "declined") u.toast("Couldn’t save the backup here.");
      });
    },

    "choose-player": function (el) {
      store.signIn(el.dataset.id); // no password needed on this device
      resetUi();
      top();
      u.toast("Hi " + store.current().name + "!");
    },
    "open-account": function () { ui.account = true; ui.authMode = ui.accountMode = ""; top(); },
    "close-account": function () { ui.account = false; ui.authMode = ui.accountMode = ""; top(); },
    "auth-transfer": function () { ui.authMode = "transfer"; top(); },
    "auth-back": function () { ui.authMode = ""; top(); },
    "account-main": function () { ui.accountMode = ""; top(); },
    "account-forgot": function () { ui.accountMode = "forgot"; top(); },
    "account-deactivate": function () { ui.accountMode = "deactivate"; top(); },
    "sign-out": function () { store.signOut(); resetUi(); top(); },
    "sync-retry": function () { TT.cloud.retry(); },
    "toggle-pw": function (el) {
      var input = u.$(el.dataset.for);
      if (!input) return;
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      el.textContent = show ? "Hide" : "Show";
      el.setAttribute("aria-label", show ? "Hide password" : "Show password");
    },

    "chips-step": function (el) { TT.scrollRows.step(el, +el.dataset.value); },

    "timer-pause": function () { TT.timer.pause(); },
    "timer-close": function () { TT.timer.close(); },
    "break-go": function () { TT.timer.skipBreak(); }
  };

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-action]");
    if (!el || !actions[el.dataset.action]) return;
    actions[el.dataset.action](el);
  });

  // ---- forms ----

  // Shows what's wrong and puts the cursor in that box. Returns false.
  function fail(input, message) {
    u.toast(message);
    if (input) {
      input.setAttribute("aria-invalid", "true");
      input.focus();
    }
    return false;
  }

  var NAME_OK = /^[\p{L}\p{N} ._'-]+$/u;
  var EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function checkNames(f, exceptId) {
    var first = f.first.value.trim(), last = f.last.value.trim(), name = f.name.value.trim();
    if (!first) return fail(f.first, "Enter your first name.");
    if (!last) return fail(f.last, "Enter your last name.");
    if (!NAME_OK.test(first) || !NAME_OK.test(last)) return fail(!NAME_OK.test(first) ? f.first : f.last, "Names can use letters, spaces, dashes and apostrophes.");
    if (name.length < 2) return fail(f.name, "Your profile name needs at least 2 characters.");
    if (!NAME_OK.test(name)) return fail(f.name, "Profile names can use letters, numbers, spaces, dots and dashes.");
    if (store.nameTaken(name, exceptId)) return fail(f.name, "“" + name + "” is already used on this device. Pick another profile name.");
    return true;
  }

  function checkNewPassword(input) {
    if (input.value.length < 6) return fail(input, "Your password needs at least 6 characters.");
    return true;
  }

  function checkEmail(input, required) {
    var v = input.value.trim();
    if (!v) return required ? fail(input, "Enter your email.") : true;
    if (!EMAIL_OK.test(v)) return fail(input, "That email doesn’t look right. Check it and try again.");
    return true;
  }

  var forms = {
    "create-player": function (f) {
      if (!checkNames(f) || !checkNewPassword(f.password) || !checkEmail(f.email, false)) return;
      store.createPlayer({
        first: f.first.value, last: f.last.value, name: f.name.value,
        password: f.password.value, email: f.email.value.trim()
      });
      TT.analytics.event("account-created");
      resetUi();
      top();
      u.toast("Welcome, " + store.current().name + "!");
    },
    transfer: function (f) {
      var file = f.file.files[0];
      if (!file) return fail(f.file, "Choose the backup file from your other device.");
      if (!f.password.value) return fail(f.password, "Enter your password.");
      file.text().then(function (text) {
        var result;
        try { result = store.signInWithBackup(text, f.password.value); } catch (e) { return fail(f.file, "That file isn’t a Touch Time backup."); }
        if (result === "no-account") return fail(f.file, "That backup has no account in it. Make it from Account › Download backup while signed in.");
        if (result === "wrong-password") return fail(f.password, "That password isn’t right for this backup.");
        resetUi();
        top();
        u.toast("Signed in as " + store.current().name);
      });
    },
    profile: function (f) {
      if (!checkNames(f, store.current().id)) return;
      store.updateProfile({ first: f.first.value, last: f.last.value, name: f.name.value });
      render();
      u.toast("Profile saved");
    },
    "set-password": function (f) {
      if (!checkNewPassword(f.password)) return;
      store.setPassword(f.password.value);
      render();
      u.toast("Password saved");
    },
    "change-password": function (f) {
      if (!f.old.value) return fail(f.old, "Enter your current password.");
      if (!checkNewPassword(f.password)) return;
      if (!store.changePassword(f.old.value, f.password.value)) return fail(f.old, "Your current password isn’t right.");
      render();
      u.toast("Password changed");
    },
    "set-email": function (f) {
      if (!checkEmail(f.email, false)) return;
      if (!f.password.value) return fail(f.password, "Enter your password to change the email.");
      if (!store.setEmail(f.email.value.trim(), f.password.value)) return fail(f.password, "That password isn’t right.");
      render();
      u.toast(f.email.value.trim() ? "Email saved" : "Email removed");
    },
    "reset-password": function (f) {
      if (!checkEmail(f.email, true) || !checkNewPassword(f.password)) return;
      if (!store.resetPassword(store.current().id, f.email.value, f.password.value)) return fail(f.email, "That isn’t the email saved on this account.");
      ui.accountMode = "";
      top();
      u.toast("New password set");
    },
    deactivate: function (f) {
      if (store.hasPassword() && !f.password.value) return fail(f.password, "Enter your password.");
      var name = store.current().name;
      if (!store.deletePlayer(f.password ? f.password.value : "")) return fail(f.password, "That password isn’t right.");
      resetUi();
      top();
      u.toast(name + "’s account was deactivated");
    },
    "test-score": function (f) {
      var raw = f.score.value.trim();
      if (raw === "") return u.toast("Enter your score.");
      var n = Number(raw);
      if (!/^\d+$/.test(raw) || n > 999) return u.toast("Enter a whole number, like 42.");
      TT.sessions.testSave(n);
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
    } else if (e.target.getAttribute("aria-invalid")) {
      e.target.removeAttribute("aria-invalid"); // they're fixing it
    }
    if (kind === "practice-name" && ui.builder) {
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

  // Online saving changed state: update the status text in place. A full
  // redraw here could swallow a tap that lands at the same moment.
  var lastStatus = TT.cloud.status();
  TT.cloud.onStatus(function (st) {
    var was = lastStatus;
    lastStatus = st;
    document.querySelectorAll(".sync").forEach(function (el) {
      el.textContent = V.account.syncText(st);
      el.className = "note sync sync-" + st;
    });
    document.querySelectorAll(".cloud-ind").forEach(function (el) {
      el.textContent = st === "synced" || st === "saving" ? " ☁️" : "";
    });
    // The account page shows a "Try again" button only while there's an error.
    if (ui.account && (st === "error" || was === "error")) render();
  });
  TT.cloud.start(function () {
    if (!store.isGuest() && !store.findPlayer(store.current().id)) store.signOut();
    render();
  });

  render();
  TT.analytics.pageview();
})();
