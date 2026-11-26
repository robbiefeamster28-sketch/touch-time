// Topics, goals, levels, badges and avatars.
window.TT = window.TT || {};

TT.TOPICS = [{"id": "fav", "label": "★ Favorites"}, {"id": "dribbling", "label": "Dribbling"}, {"id": "passing", "label": "Passing"}, {"id": "wall", "label": "Wall work"}, {"id": "juggling", "label": "Juggling"}, {"id": "shooting", "label": "Shooting"}, {"id": "indoor", "label": "Indoor"}];

TT.TEST_TOPICS = [{"id": "dribbling", "label": "Dribbling"}, {"id": "juggling", "label": "Juggling"}, {"id": "wall", "label": "Wall work"}, {"id": "goalkeeper", "label": "Goalkeeper"}];

TT.DEFAULT_DAILY_GOAL = 30; // minutes

// A month's goal is split into four equal steps; each step reached is a level.
TT.LEVELS = [{"name": "Rookie", "emoji": "⚽"}, {"name": "Academy", "emoji": "🎓"}, {"name": "Second team", "emoji": "🥈"}, {"name": "Starter", "emoji": "⭐"}, {"name": "World class", "emoji": "🌍"}];

// Earned by total practice time (minutes).
TT.BADGES = [{"minutes": 1, "name": "First touch", "emoji": "⚽"}, {"minutes": 5, "name": "Warm-up", "emoji": "🔥"}, {"minutes": 15, "name": "Fifteen club", "emoji": "🥉"}, {"minutes": 30, "name": "Half hour hero", "emoji": "🥈"}, {"minutes": 60, "name": "Hour player", "emoji": "🥇"}, {"minutes": 120, "name": "Two-hour grinder", "emoji": "💪"}, {"minutes": 300, "name": "Five-hour legend", "emoji": "🏆"}, {"minutes": 600, "name": "Ten-hour icon", "emoji": "👑"}];

// Unlocked by total practice time (minutes).
TT.AVATARS = [{"minutes": 0, "emoji": "⚽"}, {"minutes": 5, "emoji": "🔥"}, {"minutes": 30, "emoji": "🦁"}, {"minutes": 60, "emoji": "🐯"}, {"minutes": 120, "emoji": "🦅"}, {"minutes": 300, "emoji": "🐉"}, {"minutes": 600, "emoji": "👑"}];

TT.STREAK_BADGES = [3, 7, 14, 30]; // days

// Minutes in a topic for bronze, silver and gold topic mastery.
TT.MASTERY_MINUTES = [30, 90, 180];

// Tests are rated 0-5 stars (targets per test in tests.js).
TT.STARS = 5;

// "★★★☆☆" as HTML: filled stars gold, empty ones faded.
TT.starRow = function (n) {
  var on = "", off = "";
  for (var i = 0; i < TT.STARS; i++) { if (i < n) on += "★"; else off += "☆"; }
  return '<span class="stars" role="img" aria-label="' + n + " of " + TT.STARS + ' stars">' + on + '<span class="off">' + off + "</span></span>";
};
