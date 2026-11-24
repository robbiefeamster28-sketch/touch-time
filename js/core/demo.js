// The animated pitch diagram shown for each drill and test.
window.TT = window.TT || {};

TT.demo = (function () {
  var esc = TT.util.esc;

  function cone(c) {
    var x = c[0], y = c[1];
    return '<polygon points="' + (x - 7) + "," + (y + 7) + " " + (x + 7) + "," + (y + 7) + " " + x + "," + (y - 9) + '" fill="#f08a24"/>';
  }

  // item: a drill or test with a `demo` field.
  function pitch(item) {
    var d = item.demo;
    if (!d) return "";
    var scenery = "";
    if (d.scene === "wall") scenery = '<rect x="90" y="18" width="120" height="10" fill="#c9c3ad"/>';
    if (d.scene === "goal") scenery = '<rect x="90" y="8" width="120" height="14" fill="rgba(255,255,255,.15)" stroke="#fff" stroke-width="3"/>';
    return (
      '<svg class="pitch" viewBox="0 0 300 180" role="img" aria-label="Animated demo of ' + esc(item.name) + '">' +
      '<g stroke="rgba(255,255,255,.7)" fill="none" stroke-width="2">' +
      '<rect x="6" y="6" width="288" height="168"/>' +
      '<line x1="150" y1="6" x2="150" y2="174" opacity=".3"/>' +
      '<circle cx="150" cy="90" r="30" opacity=".3"/>' +
      "</g>" +
      scenery +
      '<path d="' + d.path + '" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2" stroke-dasharray="4 5"/>' +
      (d.cones || []).map(cone).join("") +
      '<circle r="8" fill="#fff" stroke="#111" stroke-width="1.5">' +
      '<animateMotion dur="' + (d.seconds || 4) + 's" repeatCount="indefinite" path="' + d.path + '"/>' +
      "</circle></svg>"
    );
  }

  // A real video if the item has one, otherwise the animated pitch.
  function media(item) {
    if (item.video) {
      return '<video class="pitch" controls playsinline preload="metadata" src="' + esc(item.video) + '"></video>' +
        '<div class="cap"><span>Video example</span></div>';
    }
    if (!item.demo) return "";
    return pitch(item) + '<div class="cap"><span>Animated demo</span></div>';
  }

  return { pitch: pitch, media: media };
})();
