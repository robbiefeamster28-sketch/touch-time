// Pieces shared by several pages. Every view returns an HTML string; buttons
// carry data-action="..." and app.js handles the click.
window.TT = window.TT || {};
TT.views = TT.views || {};

TT.views.common = (function () {
  var u = TT.util, s = TT.stats, store = TT.store;
  var esc = u.esc, fmt = u.fmt;

  function header(L) {
    var sk = s.streak(), p = store.current();
    var cloud = TT.cloud.status();
    return (
      "<header><h1>Touch Time</h1>" +
      '<button class="acct" data-action="open-account" aria-label="Account: ' + esc(p.name) + '">' +
      TT.AVATARS[store.state.avatar].emoji + " " + esc(p.name) +
      (cloud === "synced" || cloud === "saving" ? ' <span aria-hidden="true">☁️</span>' : "") + "</button></header>" +
      '<p class="lvl">' + (sk ? "🔥 " + sk + "-day streak · " : "") + "Level " + L.index + " this month · <b>" + L.name + "</b></p>" +
      '<div class="xp" aria-label="Progress to next level"><i style="width:' + L.pct + '%"></i></div>'
    );
  }

  function statRow() {
    return (
      '<div class="stats">' +
      stat(fmt(s.week()), "This week") +
      stat(fmt(s.month()), "This month") +
      stat(fmt(s.total()), "All time") +
      "</div>"
    );
  }

  function stat(big, label) {
    return '<div class="stat"><div class="big">' + big + "</div><span>" + label + "</span></div>";
  }

  function tabs(current) {
    var list = [["practices", "Practices"], ["drills", "Drills"], ["tests", "Tests"], ["rewards", "Rewards"]];
    return (
      '<div class="tabs" role="tablist">' +
      list.map(function (t) {
        return '<button class="tab" role="tab" aria-selected="' + (current === t[0]) + '" data-action="tab" data-value="' + t[0] + '">' + t[1] + "</button>";
      }).join("") +
      "</div>"
    );
  }

  // options: [{id,label}], action sets the chosen id.
  function chips(options, current, action) {
    return (
      '<div class="chips">' +
      options.map(function (o) {
        return '<button class="chip" aria-pressed="' + (current === o.id) + '" data-action="' + action + '" data-value="' + o.id + '">' + o.label + "</button>";
      }).join("") +
      "</div>"
    );
  }

  function searchControls(query, levelFilter) {
    var levels = [
      { id: "", label: "Any level" },
      { id: "Beginner", label: "Beginner" },
      { id: "Intermediate", label: "Intermediate" },
      { id: "Advanced", label: "Advanced" }
    ];
    return (
      '<input class="srch" type="search" placeholder="Search all" value="' + esc(query) + '" data-input="search" aria-label="Search">' +
      chips(levels, levelFilter, "level-filter")
    );
  }

  // Filter by search text and level.
  function filter(items, query, levelFilter) {
    var q = query.trim().toLowerCase();
    return items.filter(function (x) {
      return (!levelFilter || (x.level || "Beginner") === levelFilter) &&
        (!q || (x.name + " " + x.description).toLowerCase().indexOf(q) > -1);
    });
  }

  // Lists items, adding a heading for each "Group: name" family with 2+ items.
  function groupedList(items, row) {
    var group = function (x) { return x.name.indexOf(":") > 0 ? x.name.split(":")[0] : ""; };
    var counts = {};
    items.forEach(function (x) { counts[group(x)] = (counts[group(x)] || 0) + 1; });
    var last = null, html = "";
    items.forEach(function (x) {
      var g = group(x);
      if (g && g !== last && counts[g] > 1) html += '<h3 class="grp">' + esc(g) + "</h3>";
      last = g;
      html += row(x);
    });
    return html || '<p class="muted">Nothing found.</p>';
  }

  function starButton(drill, extraClass) {
    var on = store.isFav(drill.id);
    return '<button class="star' + (extraClass ? " " + extraClass : "") + '" aria-label="' + (on ? "Remove from" : "Add to") +
      ' favorites" aria-pressed="' + on + '" data-action="fav" data-id="' + drill.id + '">' + (on ? "★" : "☆") + "</button>";
  }

  function lengthPicker(current) {
    return (
      '<div class="pick">' +
      [30, 60, 90].map(function (sec) {
        return '<button aria-pressed="' + (current === sec) + '" data-action="length" data-value="' + sec + '">' + u.lengthLabel(sec) + "</button>";
      }).join("") +
      "</div>"
    );
  }

  function list(items, tag) {
    return "<" + tag + ' class="' + (tag === "ol" ? "steps" : "needs") + '">' +
      items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</" + tag + ">";
  }

  function back(label, action) {
    return '<button class="back" data-action="' + action + '">‹ ' + label + "</button>";
  }

  return {
    header: header,
    statRow: statRow,
    stat: stat,
    tabs: tabs,
    chips: chips,
    searchControls: searchControls,
    filter: filter,
    groupedList: groupedList,
    starButton: starButton,
    lengthPicker: lengthPicker,
    list: list,
    back: back
  };
})();
