// Practices tab, a practice's page, and the practice builder.
window.TT = window.TT || {};
TT.views = TT.views || {};

TT.views.practices = (function () {
  var c = TT.views.common, s = TT.stats, store = TT.store, u = TT.util;
  var esc = u.esc;

  function all() {
    return store.state.mine.concat(TT.PRACTICES);
  }

  function find(id) {
    return all().filter(function (p) { return p.id === id; })[0];
  }

  // Ignores ids of drills that no longer exist.
  function drillsOf(p) {
    return p.drills.filter(s.drill);
  }

  function card(p, tag) {
    return (
      '<button class="drill mb" data-action="open-practice" data-id="' + esc(p.id) + '">' +
      '<span class="em">' + (p.emoji || "⭐") + "</span>" +
      "<span>" + (tag ? "<small>" + tag + "</small>" : "") + "<h3>" + esc(p.name) + '</h3><span class="dd">' + esc(p.description || "") + "</span></span>" +
      '<span class="t">' + drillsOf(p).length + "<br>drills</span></button>"
    );
  }

  function list() {
    var favs = store.state.favs.filter(s.drill), pod = s.practiceOfTheDay();
    return (
      '<button class="feature" data-action="open-practice" data-id="' + esc(pod.id) + '">' +
      '<span class="eyebrow">Practice of the day</span>' +
      '<span class="feature-name">' + pod.emoji + " " + esc(pod.name) + "</span>" +
      '<span class="feature-desc">' + esc(pod.description) + "</span>" +
      '<span class="feature-go">' + drillsOf(pod).length + " drills · Start ›</span></button>" +
      '<div class="actions-row"><button class="go slim" data-action="new-practice">+ Build your own</button>' +
      (favs.length > 1 ? '<button class="ghost" data-action="practice-from-favs">From my ' + favs.length + " favorites</button>" : "") + "</div>" +
      '<h2 class="sec">Practices</h2>' +
      all().map(function (p) { return card(p, p.mine ? "My practice" : ""); }).join("")
    );
  }

  function drillRow(d, i, length) {
    return (
      '<div class="row"><button class="drill" data-action="open-drill" data-id="' + d.id + '">' +
      '<span class="em">' + d.emoji + "</span><span><h3>" + (i + 1) + ". " + esc(d.name) + "</h3><small>" + d.level + "</small></span>" +
      '<span class="t">' + u.fmt(length) + "</span></button>" + c.starButton(d) + "</div>"
    );
  }

  function detail(ui) {
    var p = find(ui.practice);
    var ids = drillsOf(p), n = ids.length, rest = store.state.rest;
    return (
      c.back("All practices", "close-practice") +
      '<div class="detail"><h2>' + (p.emoji || "⭐") + " " + esc(p.name) + "</h2><p>" + esc(p.description || "") + "</p>" +
      '<h3 class="need">Time per drill</h3>' + c.lengthPicker(ui.length) +
      '<h3 class="need">Rest between drills</h3><div class="pick four">' +
      [0, 10, 20, 30].map(function (sec) {
        return '<button aria-pressed="' + (rest === sec) + '" data-action="rest" data-value="' + sec + '">' + (sec ? sec + "s" : "None") + "</button>";
      }).join("") + "</div>" +
      '<p class="note">' + n + " drills · about " + u.fmt(n * ui.length + Math.max(0, n - 1) * rest) + " in total</p>" +
      ids.map(function (id, i) { return drillRow(s.drill(id), i, ui.length); }).join("") +
      '<button class="go" style="margin-top:8px" data-action="start-practice">Start practice</button>' +
      (p.mine ? '<div class="vctl" style="margin-top:8px"><button class="ghost" data-action="edit-practice">Edit</button><button class="ghost" data-action="delete-practice">Delete</button></div>' : "") +
      "</div>"
    );
  }

  function builder(ui) {
    var b = ui.builder;
    var picked = b.drills.filter(s.drill);
    var choices = TT.DRILLS.filter(function (d) {
      return ui.builderTopic === "fav" ? store.isFav(d.id) : d.topic === ui.builderTopic;
    });
    return (
      c.back("Cancel", "cancel-builder") +
      '<div class="detail"><h2>Build a practice</h2>' +
      '<input class="field" placeholder="Practice name" value="' + esc(b.name) + '" data-input="practice-name" aria-label="Practice name">' +
      '<h3 class="need">Your drills (' + picked.length + ")</h3>" +
      (picked.length
        ? picked.map(function (id, i) {
            return '<div class="row"><div class="drill mini"><h3>' + (i + 1) + ". " + esc(s.drill(id).name) + "</h3></div>" +
              '<button class="star icon" data-action="builder-move" data-index="' + i + '" data-value="-1" aria-label="Move up">↑</button>' +
              '<button class="star icon" data-action="builder-move" data-index="' + i + '" data-value="1" aria-label="Move down">↓</button>' +
              '<button class="star icon" data-action="builder-remove" data-index="' + i + '" aria-label="Remove">✕</button></div>';
          }).join("")
        : '<p class="muted">Add drills below.</p>') +
      '<h3 class="need">Add drills</h3>' +
      c.chips(TT.TOPICS, ui.builderTopic, "builder-topic") +
      choices.map(function (d) {
        return '<div class="row"><div class="drill mini"><h3>' + esc(d.name) + "</h3></div>" +
          '<button class="star icon" data-action="builder-add" data-id="' + d.id + '" aria-label="Add drill">+</button></div>';
      }).join("") +
      '<button class="go" style="margin-top:10px" data-action="save-practice">Save practice</button></div>'
    );
  }

  return { all: all, find: find, drillsOf: drillsOf, list: list, detail: detail, builder: builder };
})();
