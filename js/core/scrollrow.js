// Sideways-scrolling rows of filter chips (topics, levels).
// - Touch: swipe sideways (native scrolling).
// - Mouse: click and drag, use the scroll wheel, or tap the ‹ › arrows.
// - Edges fade when more chips are hidden that way.
// - The row keeps its position when the screen redraws after a tap.
window.TT = window.TT || {};

TT.scrollRows = (function () {
  var saved = {}; // row key -> scrollLeft
  var drag = null; // { row, startX, startLeft, moved }
  var suppressClick = false;

  function rows() {
    return document.querySelectorAll(".chips");
  }

  function keyOf(row) {
    return row.dataset.row || "";
  }

  // Show or hide the fades and arrows for one row.
  function update(row) {
    var max = row.scrollWidth - row.clientWidth;
    var left = row.scrollLeft > 2;
    var right = row.scrollLeft < max - 2;
    var wrap = row.parentNode;
    if (!wrap || !wrap.classList.contains("chips-wrap")) return;
    wrap.classList.toggle("more-left", left);
    wrap.classList.toggle("more-right", right);
  }

  // Call just before the screen redraws.
  function save() {
    rows().forEach(function (row) { saved[keyOf(row)] = row.scrollLeft; });
  }

  // Call right after the screen redraws.
  function restore() {
    rows().forEach(function (row) {
      var k = keyOf(row);
      if (saved[k] != null) row.scrollLeft = saved[k];
      // Make sure the selected chip is in view.
      var on = row.querySelector('[aria-pressed="true"]');
      if (on) {
        var a = on.offsetLeft - row.offsetLeft, b = a + on.offsetWidth;
        if (a < row.scrollLeft + 16) row.scrollLeft = Math.max(0, a - 32);
        else if (b > row.scrollLeft + row.clientWidth - 16) row.scrollLeft = b - row.clientWidth + 32;
      }
      update(row);
    });
  }

  // Arrow buttons.
  function step(button, direction) {
    var row = button.parentNode.querySelector(".chips");
    if (!row) return;
    row.scrollBy({ left: direction * Math.max(120, row.clientWidth * 0.7), behavior: "smooth" });
  }

  // ---- listeners (set once, work for every row) ----

  document.addEventListener("scroll", function (e) {
    var row = e.target;
    if (row.classList && row.classList.contains("chips")) {
      saved[keyOf(row)] = row.scrollLeft;
      update(row);
    }
  }, true);

  // Mouse drag. Touch and pen use the browser's own swipe scrolling.
  document.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    var row = e.target.closest && e.target.closest(".chips");
    if (!row || row.scrollWidth <= row.clientWidth) return;
    drag = { row: row, startX: e.clientX, startLeft: row.scrollLeft, moved: false };
  });

  document.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) > 5) {
      drag.moved = true;
      drag.row.classList.add("dragging");
    }
    if (drag.moved) drag.row.scrollLeft = drag.startLeft - dx;
  });

  function endDrag() {
    if (!drag) return;
    if (drag.moved) {
      suppressClick = true; // a drag shouldn't also pick the chip under the mouse
      setTimeout(function () { suppressClick = false; }, 0);
    }
    drag.row.classList.remove("dragging");
    drag = null;
  }
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);

  document.addEventListener("click", function (e) {
    if (suppressClick) {
      e.stopPropagation();
      e.preventDefault();
      suppressClick = false;
    }
  }, true);

  // Mouse wheel scrolls the row sideways.
  document.addEventListener("wheel", function (e) {
    var row = e.target.closest && e.target.closest(".chips");
    if (!row || row.scrollWidth <= row.clientWidth) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // already sideways (trackpad)
    var max = row.scrollWidth - row.clientWidth;
    var next = Math.max(0, Math.min(max, row.scrollLeft + e.deltaY));
    if (next === row.scrollLeft) return; // at the end: let the page scroll
    row.scrollLeft = next;
    e.preventDefault();
  }, { passive: false });

  window.addEventListener("resize", function () { rows().forEach(update); });

  return { save: save, restore: restore, step: step };
})();
