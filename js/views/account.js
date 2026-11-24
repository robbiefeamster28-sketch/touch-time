// Sign-in screen ("Who's playing?"), PIN entry, and the Account page.
window.TT = window.TT || {};
TT.views = TT.views || {};

TT.views.account = (function () {
  var store = TT.store, u = TT.util;
  var esc = u.esc;

  function syncNote() {
    var s = TT.cloud.status();
    var text = {
      local: "Progress is saved on this device.",
      connecting: "Connecting to your account…",
      saving: "☁️ Saving to your account…",
      synced: "☁️ Saved to your account. Sign in on any device to pick up where you left off.",
      error: "Couldn’t reach your account. Progress is saved on this device and will try again."
    }[s];
    return '<p class="note sync sync-' + s + '">' + text + "</p>";
  }

  function brand() {
    return '<header><h1>Touch Time</h1></header>';
  }

  // Shown whenever nobody is signed in on this device.
  function signIn(ui) {
    var list = store.players();
    var loading = TT.cloud.status() === "connecting";
    return (
      brand() +
      '<div class="detail">' +
      (list.length
        ? "<h2>Who’s playing?</h2>" +
          list.map(function (p) {
            return '<button class="drill mb" data-action="choose-player" data-id="' + p.id + '">' +
              '<span class="em">' + esc((p.name || "?").charAt(0).toUpperCase()) + "</span>" +
              "<span><h3>" + esc(p.name) + "</h3><small>" + (p.pin ? "🔒 PIN protected" : "Tap to play") + "</small></span></button>";
          }).join("") +
          '<h2 class="sec">New player</h2>'
        : "<h2>Welcome!</h2><p>Create your player account to start training. Your time, test scores, favorites and practices are saved to it.</p>") +
      (loading ? '<p class="note">Loading your players…</p>' : "") +
      '<form class="account-form" data-form="create-player">' +
      '<label class="lbl" for="pname">Player name</label>' +
      '<input class="field" id="pname" name="name" maxlength="24" autocomplete="nickname" placeholder="e.g. Sam" required value="' + esc(ui.draftName || "") + '">' +
      '<label class="lbl" for="ppin">4-digit PIN <span class="muted">(optional)</span></label>' +
      '<input class="field" id="ppin" name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off" placeholder="Leave blank for no PIN">' +
      '<button class="go" type="submit">Create player</button>' +
      "</form>" +
      '<p class="note small">A PIN stops others on a shared device from opening your account.</p>' +
      syncNote() +
      "</div>"
    );
  }

  function pinEntry(ui) {
    var p = store.findPlayer(ui.pinFor);
    return (
      brand() +
      '<button class="back" data-action="cancel-pin">‹ Back</button>' +
      '<div class="detail"><h2>Hi ' + esc(p.name) + "!</h2><p>Enter your PIN.</p>" +
      '<form data-form="pin">' +
      '<input class="field pin" id="pinin" name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off" aria-label="PIN" required>' +
      '<button class="go" type="submit">Sign in</button></form></div>'
    );
  }

  // Account settings for the signed-in player.
  function page() {
    var p = store.current();
    return (
      '<button class="back" data-action="close-account">‹ Back</button>' +
      '<div class="detail"><h2>' + TT.AVATARS[store.state.avatar].emoji + " " + esc(p.name) + "</h2>" +
      syncNote() +
      (TT.cloud.status() === "error" ? '<button class="ghost wide" data-action="sync-retry">Try again</button>' : "") +
      '<h3 class="need">Name</h3>' +
      '<form class="row" data-form="rename"><input class="field" name="name" maxlength="24" required value="' + esc(p.name) + '" aria-label="Player name" style="margin:0">' +
      '<button class="ghost" type="submit">Save</button></form>' +
      '<h3 class="need">PIN</h3>' +
      '<form class="row" data-form="set-pin"><input class="field" name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off" placeholder="' + (p.pin ? "New 4-digit PIN" : "4-digit PIN") + '" aria-label="PIN" style="margin:0">' +
      '<button class="ghost" type="submit">' + (p.pin ? "Change" : "Set") + "</button></form>" +
      (p.pin ? '<button class="ghost wide" style="margin-top:8px" data-action="remove-pin">Remove PIN</button>' : "") +
      '<h3 class="need">Backup</h3><p class="note">Download your progress as a file, or restore one.</p>' +
      '<div class="backup"><button class="ghost" data-action="export">Download backup</button>' +
      '<label class="ghost" style="text-align:center;cursor:pointer">Restore backup<input type="file" accept="application/json,.json" hidden data-input="import"></label></div>' +
      '<button class="go" style="margin-top:20px" data-action="sign-out">Switch player</button>' +
      '<button class="ghost wide danger" style="margin-top:12px" data-action="delete-player">Delete this account</button>' +
      "</div>"
    );
  }

  return { signIn: signIn, pinEntry: pinEntry, page: page };
})();
