// Sign in / create account, signing in from another device, the Account page,
// password reset and deactivation.
window.TT = window.TT || {};
TT.views = TT.views || {};

TT.views.account = (function () {
  var store = TT.store, u = TT.util;
  var esc = u.esc;

  function syncText(s) {
    return {
      local: "Progress is saved on this device.",
      connecting: "Connecting to your account…",
      saving: "☁️ Saving to your account…",
      synced: "☁️ Saved to your account. Sign in on any device to pick up where you left off.",
      error: "Couldn’t reach your account. Progress is saved on this device and will try again."
    }[s];
  }

  function syncNote() {
    var s = TT.cloud.status();
    return '<p class="note sync sync-' + s + '" aria-live="polite">' + syncText(s) + "</p>";
  }

  // ---- form pieces ----

  function field(id, label, attrs, hint) {
    return '<label class="lbl" for="' + id + '">' + label + "</label>" +
      '<input class="field" id="' + id + '" ' + attrs + ">" +
      (hint ? '<p class="hint">' + hint + "</p>" : "");
  }

  // Password box with a Show / Hide button.
  function password(id, label, name, autocomplete, hint) {
    return '<label class="lbl" for="' + id + '">' + label + "</label>" +
      '<div class="pw"><input class="field" id="' + id + '" name="' + name + '" type="password" autocomplete="' + autocomplete + '" minlength="6" maxlength="64" required>' +
      '<button type="button" class="pw-toggle" data-action="toggle-pw" data-for="' + id + '" aria-label="Show password">Show</button></div>' +
      (hint ? '<p class="hint">' + hint + "</p>" : "");
  }

  function fullName(p) {
    return [p.first, p.last].filter(Boolean).join(" ");
  }

  // ---- signed out (guest) ----

  function signIn(ui) {
    if (ui.authMode === "transfer") return transfer();
    var list = store.players();
    var loading = TT.cloud.status() === "connecting";
    var hasGuestProgress = store.state.log.length || store.state.results.length || store.state.favs.length || store.state.mine.length;
    return (
      '<button class="back" data-action="close-account">‹ Back</button>' +
      '<div class="detail">' +
      (list.length
        ? "<h2>Sign in</h2><p class=\"note\">Pick your profile.</p>" +
          list.map(function (p) {
            return '<button class="drill mb" data-action="choose-player" data-id="' + p.id + '">' +
              '<span class="em">' + esc((p.name || "?").charAt(0).toUpperCase()) + "</span>" +
              "<span><h3>" + esc(p.name) + "</h3><small>" + esc(fullName(p) || "Tap to play") + "</small></span></button>";
          }).join("") +
          '<h2 class="sec">Create an account</h2>'
        : "<h2>Create an account</h2><p>Save your time, test scores, favorites and practices to your own account.</p>") +
      (hasGuestProgress ? '<p class="note">What you’ve done as a guest moves into your new account.</p>' : "") +
      (loading ? '<p class="note">Loading your profiles…</p>' : "") +
      '<form class="account-form" data-form="create-player" novalidate>' +
      '<div class="name-row">' +
      '<div>' + field("first", "First name", 'name="first" maxlength="30" autocomplete="given-name" required') + "</div>" +
      '<div>' + field("last", "Last name", 'name="last" maxlength="30" autocomplete="family-name" required') + "</div>" +
      "</div>" +
      field("pname", "Profile name", 'name="name" maxlength="20" autocomplete="nickname" placeholder="e.g. SamTheStriker" required', "Shown in the app. Letters, numbers, spaces, dots, dashes.") +
      password("pw", "Password", "password", "new-password", "At least 6 characters. You only need it to sign in on another device or to deactivate your account.") +
      field("email", 'Email <span class="muted">(optional)</span>', 'name="email" type="email" maxlength="120" autocomplete="email" inputmode="email"', "Only used to reset a forgotten password.") +
      '<button class="go" type="submit">Create account</button>' +
      "</form>" +
      '<button class="ghost wide" style="margin-top:16px" data-action="auth-transfer">Signed up on another device? Sign in</button>' +
      syncNote() +
      "</div>"
    );
  }

  // Sign in on this device using the backup file from the other one.
  function transfer() {
    return (
      '<button class="back" data-action="auth-back">‹ Back</button>' +
      '<div class="detail"><h2>Sign in from another device</h2>' +
      '<ol class="steps"><li>On the other device, open <b>Account</b> and tap <b>Download backup</b>.</li>' +
      "<li>Get that file onto this device (email it to yourself, or use Drive or Files).</li>" +
      "<li>Choose it below and enter your password.</li></ol>" +
      '<form class="account-form" data-form="transfer" novalidate>' +
      '<label class="lbl" for="tfile">Backup file</label>' +
      '<input class="field" id="tfile" name="file" type="file" accept="application/json,.json" required>' +
      password("tpw", "Password", "password", "current-password") +
      '<button class="go" type="submit">Sign in</button></form></div>'
    );
  }

  // ---- signed in ----

  function page(ui) {
    if (ui.accountMode === "forgot") return forgot();
    if (ui.accountMode === "deactivate") return deactivate();
    var p = store.current(), hasPw = store.hasPassword();
    return (
      '<button class="back" data-action="close-account">‹ Back</button>' +
      '<div class="detail"><h2>' + TT.AVATARS[store.state.avatar].emoji + " " + esc(p.name) + "</h2>" +
      (fullName(p) ? '<p class="note">' + esc(fullName(p)) + "</p>" : "") +
      syncNote() +
      (TT.cloud.status() === "error" ? '<button class="ghost wide" data-action="sync-retry">Try again</button>' : "") +

      '<h3 class="need">Profile</h3>' +
      '<form class="account-form" data-form="profile" novalidate>' +
      '<div class="name-row">' +
      "<div>" + field("pfirst", "First name", 'name="first" maxlength="30" autocomplete="given-name" required value="' + esc(p.first || "") + '"') + "</div>" +
      "<div>" + field("plast", "Last name", 'name="last" maxlength="30" autocomplete="family-name" required value="' + esc(p.last || "") + '"') + "</div>" +
      "</div>" +
      field("pprofile", "Profile name", 'name="name" maxlength="20" autocomplete="nickname" required value="' + esc(p.name) + '"') +
      '<button class="ghost wide" type="submit">Save profile</button></form>' +

      '<h3 class="need">Password</h3>' +
      (hasPw
        ? '<form class="account-form" data-form="change-password" novalidate>' +
          password("oldpw", "Current password", "old", "current-password") +
          password("newpw", "New password", "password", "new-password", "At least 6 characters.") +
          '<button class="ghost wide" type="submit">Change password</button></form>' +
          '<button class="link" data-action="account-forgot">Forgot your password?</button>'
        : '<p class="note">This account doesn’t have a password yet. Add one to sign in on another device.</p>' +
          '<form class="account-form" data-form="set-password" novalidate>' +
          password("newpw", "New password", "password", "new-password", "At least 6 characters.") +
          '<button class="ghost wide" type="submit">Set password</button></form>') +

      (hasPw
        ? '<h3 class="need">Email for password resets</h3>' +
          '<p class="note">' + (store.hasEmail() ? "✓ An email is saved. You can change or remove it." : "Optional. Add one so you can reset a forgotten password.") + "</p>" +
          '<form class="account-form" data-form="set-email" novalidate>' +
          field("memail", store.hasEmail() ? 'New email <span class="muted">(leave empty to remove)</span>' : "Email", 'name="email" type="email" maxlength="120" autocomplete="email" inputmode="email"') +
          password("mpw", "Your password", "password", "current-password") +
          '<button class="ghost wide" type="submit">' + (store.hasEmail() ? "Update email" : "Save email") + "</button></form>"
        : "") +

      '<h3 class="need">Backup</h3><p class="note">Download a backup to keep your progress safe or to sign in on another device.</p>' +
      '<div class="backup"><button class="ghost" data-action="export">Download backup</button>' +
      '<label class="ghost" style="text-align:center;cursor:pointer">Restore backup<input type="file" accept="application/json,.json" hidden data-input="import"></label></div>' +

      '<button class="go" style="margin-top:20px" data-action="sign-out">Sign out</button>' +
      '<button class="ghost wide danger" style="margin-top:12px" data-action="account-deactivate">Deactivate account</button>' +
      "</div>"
    );
  }

  function deactivate() {
    var p = store.current(), hasPw = store.hasPassword();
    return (
      '<button class="back" data-action="account-main">‹ Back</button>' +
      '<div class="detail"><h2>Deactivate account</h2>' +
      "<p>This removes <b>" + esc(p.name) + "</b> and all its progress from this device. It can’t be undone. Download a backup first if you might want it back.</p>" +
      '<form class="account-form" data-form="deactivate" novalidate>' +
      (hasPw ? password("dpw", "Password", "password", "current-password") : "") +
      '<button class="go danger-fill" type="submit">Deactivate account</button></form>' +
      (hasPw ? '<button class="link" data-action="account-forgot">Forgot your password?</button>' : "") +
      "</div>"
    );
  }

  function forgot() {
    var has = store.hasEmail();
    return (
      '<button class="back" data-action="account-main">‹ Back</button>' +
      '<div class="detail"><h2>Reset your password</h2>' +
      (has
        ? "<p>Enter the email you saved on this account, and choose a new password.</p>" +
          '<form class="account-form" data-form="reset-password" novalidate>' +
          field("remail", "Email", 'name="email" type="email" maxlength="120" autocomplete="email" inputmode="email" required') +
          password("rpw", "New password", "password", "new-password", "At least 6 characters.") +
          '<button class="go" type="submit">Set new password</button></form>'
        : "<p>This account has no reset email saved, so its password can’t be reset. You can keep using the account on this device as normal.</p>") +
      "</div>"
    );
  }

  return { signIn: signIn, page: page, syncText: syncText };
})();
