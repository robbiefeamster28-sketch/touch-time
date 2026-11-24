// Pieces shared by several pages. Every view returns an HTML string; buttons
// carry data-action="..." and app.js handles the click.
window.TT = window.TT || {};
TT.views = TT.views || {};

TT.views.common = (function () {
  var u = TT.util, s = TT.stats, store = TT.store;
  var esc = u.esc, fmt = u.fmt;

  // Simple line icons, drawn with the current text colour.
  var ICONS = {
    practices: '<path d="M8 4h8v3H8zM6 6H5v15h14V6h-1"/><path d="M9 12h6M9 16h4"/>',
    drills: '<path d="M12 3 5 20h14z"/><path d="M8.5 12h7M7 16h10"/>',
    tests: '<circle cx="12" cy="13" r="7.5"/><path d="M12 13V9M10 2.5h4M18 6l1.5-1.5"/>',
    rewards: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9.5 18h5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
  };

  function icon(name) {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + "</svg>";
  }

  // Top bar: name on the left, Sign in / account on the right.
  function topbar() {
    var p = store.current(), cloud = TT.cloud.status();
    var acct = store.isGuest()
      ? '<button class="acct signin" data-action="open-account">' + icon("user") + "<span>Sign in</span></button>"
      : '<button class="acct" data-action="open-account" aria-label="Account: ' + esc(p.name) + '">' +
        '<span class="av" aria-hidden="true">' + TT.AVATARS[store.state.avatar].emoji + "</span><span class=\"nm\">" + esc(p.name) + "</span>" +
        '<span class="cloud-ind" aria-hidden="true">' + (cloud === "synced" || cloud === "saving" ? " ☁️" : "") + "</span></button>";
    return '<header class="topbar"><span class="brand"><span class="ball" aria-hidden="true"></span>Touch Time</span>' + acct + "</header>";
  }

  // Bottom tab bar, like a phone app.
  function tabs(current) {
    var list = [["practices", "Train"], ["drills", "Drills"], ["tests", "Tests"], ["rewards", "Rewards"]];
    return (
      '<nav class="tabbar" aria-label="Sections">' +
      list.map(function (t) {
        var on = current === t[0];
        return '<button class="tab"' + (on ? ' aria-current="page"' : "") + ' data-action="tab" data-value="' + t[0] + '">' + icon(t[0]) + "<span>" + t[1] + "</span></button>";
      }).join("") +
      "</nav>"
    );
  }

  // Ring showing how much of today's goal is done.
  function goalRing(done, goal) {
    var r = 42, C = 2 * Math.PI * r, pct = Math.min(1, done / goal);
    return (
      '<div class="goal-ring"><svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="' + r + '" class="track"/>' +
      '<circle cx="50" cy="50" r="' + r + '" class="fill" stroke-dasharray="' + C + '" stroke-dashoffset="' + C * (1 - pct) + '"/>' +
      '</svg><div class="goal-num"><b>' + Math.floor(done / 60) + "</b><span>of " + Math.round(goal / 60) + " min</span></div></div>"
    );
  }

  // Home screen summary: today's goal, streak, level and totals.
  function today() {
    var goal = store.state.goal * 60, done = s.today(), sk = s.streak(), L = s.level();
    var who = store.isGuest() ? "" : esc(store.current().name.split(" ")[0]) + ", ";
    return (
      '<section class="today" aria-label="Today">' +
      '<div class="today-main">' + goalRing(done, goal) +
      '<div class="today-text"><p class="eyebrow">Today</p>' +
      "<h2>" + (done >= goal ? who + "goal reached 🎉" : who + u.fmt(goal - done) + " to go") + "</h2>" +
      "<p>" + (sk ? "🔥 " + sk + "-day streak · " : "") + "Level " + L.index + " · " + L.name + "</p></div></div>" +
      '<div class="today-stats">' +
      stat(fmt(s.week()), "This week") + stat(fmt(s.month()), "This month") + stat(fmt(s.total()), "All time") +
      "</div></section>"
    );
  }

  // Level progress strip for the Rewards tab.
  function levelBar() {
    var L = s.level();
    return '<p class="level-line"><b>Level ' + L.index + " · " + L.name + "</b>" + (L.next ? '<span class="muted"> ' + fmt(L.need) + " to " + L.next + "</span>" : "") + "</p>" +
      '<div class="xp" aria-label="Progress to next level"><i style="width:' + L.pct + '%"></i></div>';
  }

  function stat(big, label) {
    return '<div class="stat"><div class="big">' + big + "</div><span>" + label + "</span></div>";
  }

  // options: [{id,label}], action sets the chosen id.
  function chips(options, current, action) {
    return (
      '<div class="chips-wrap">' +
      '<button class="chips-arrow left" data-action="chips-step" data-value="-1" aria-label="Scroll left" tabindex="-1">‹</button>' +
      '<div class="chips" data-row="' + action + '" role="group">' +
      options.map(function (o) {
        return '<button class="chip" aria-pressed="' + (current === o.id) + '" data-action="' + action + '" data-value="' + o.id + '">' + o.label + "</button>";
      }).join("") +
      "</div>" +
      '<button class="chips-arrow right" data-action="chips-step" data-value="1" aria-label="Scroll right" tabindex="-1">›</button>' +
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
    topbar: topbar,
    tabs: tabs,
    today: today,
    levelBar: levelBar,
    icon: icon,
    stat: stat,
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
