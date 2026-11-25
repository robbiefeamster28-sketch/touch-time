# Putting Touch Time in the app stores

A step-by-step guide for a Windows PC. Do the parts in order. Text to paste into the stores
(descriptions, privacy answers, screenshots) is in [`store/listing.md`](store/listing.md).

| | Google Play (Android) | App Store (iPhone) |
|---|---|---|
| Account cost | $25, one time | $99 per year |
| Built on | Your Windows PC (Android Studio) | GitHub's Mac computers (free, automatic) |
| Time to go live | About 3 weeks for a new personal account (see part 1) | Usually 1–3 days of review |

**Try it first, free:** every time the app changes, GitHub builds a test Android app.
Open the repo's **Actions** tab → **Android test build** → the newest run with a green ✓ →
scroll to **Artifacts** → download **touch-time-android-test**. Unzip it and copy the `.apk`
to an Android phone, open it, and allow "install unknown apps" when asked.

---

## Part 1: Google Play developer account

1. Go to https://play.google.com/console/signup and sign in with a Google account.
2. Choose **Yourself** (a personal account), pay the $25 fee, and verify your identity
   (photo ID) and phone number. Verification can take a few days.
3. **Important for new personal accounts:** before the app can be public, Google requires a
   **closed test with at least 12 testers who stay opted in for 14 days**. Friends,
   teammates and family count. You'll add their Gmail addresses in step 5 of part 2.

## Part 2: Build the Android app on your PC and upload it

**One-time setup**

1. Install **Node.js LTS** from https://nodejs.org (accept the defaults).
2. Install **Git** from https://git-scm.com/download/win (accept the defaults).
3. Install **Android Studio** from https://developer.android.com/studio. Open it once and let
   it download the Android SDK.
4. Open **Command Prompt** and run, one line at a time:

   ```bat
   git clone https://github.com/robbiefeamster28-sketch/touch-time
   cd touch-time
   npm install
   npm run android
   ```

   The last command prepares the app and opens it in Android Studio. Wait until the
   progress bar at the bottom finishes ("Gradle sync").

**Make the signed release file**

1. In Android Studio: **Build → Generate Signed App Bundle or APK…** → choose
   **Android App Bundle** → **Next**.
2. Under *Key store path*, click **Create new…**
   - Save it somewhere safe **outside** the touch-time folder, for example
     `Documents\touch-time-upload-key.jks`.
   - Choose a password and remember it. Alias: `upload`. Fill in your name; leave the rest.
   - **Back up this file and password** (for example to a USB stick or password manager).
     You need them for every future update. Never upload them to GitHub.
3. **Next** → choose **release** → **Create**. When it finishes, click **locate**. The file
   is `android\app\release\app-release.aab`.

**Upload to Google Play**

1. In Play Console: **Create app** → name *Touch Time*, language, **App**, **Free**, accept
   the declarations.
2. Work through **Set up your app** on the dashboard, using `store/listing.md`:
   privacy policy, app access (*all functionality available without special access*),
   ads (*no*), content rating, target audience, data safety, and the store listing with the
   screenshots and feature graphic from the `store` folder.
3. **Testing → Closed testing → Create track**. Add your testers' emails, then
   **Create new release** → upload `app-release.aab` → **Save** → **Review** → **Start rollout**.
   Google accepts the "Play App Signing" offer automatically; that's fine.
4. Send testers the opt-in link from the track's page. After 14 days with 12+ testers, apply
   for **Production** access from the dashboard, then release to production.

**Updating later:** in `android\app\build.gradle`, raise `versionCode` by 1 (and change
`versionName`, e.g. `"1.1"`), run `npm run android`, repeat *Make the signed release file*
with the **same** key file, and upload the new `.aab`.

## Part 3: The iPhone app (no Mac needed)

GitHub builds and uploads the iPhone app for you on its Mac computers. You only set up
the Apple side once and add four secrets to GitHub.

**Apple account**

1. Enroll at https://developer.apple.com/programs/enroll (individual, $99/year). Approval
   usually takes a day or two.

**Create the app in App Store Connect**

1. Go to https://appstoreconnect.apple.com → **Apps** → **+** → **New App**.
2. Platform **iOS**, name **Touch Time**, language, and for **Bundle ID** choose
   *Register a new bundle ID* (or pick it if listed) with the ID
   `io.github.robbiefeamster28.touchtime`. SKU: `touchtime`.
   (If the name *Touch Time* is taken in the App Store, try *Touch Time Soccer*.)

**Create an API key so GitHub can upload builds**

1. In App Store Connect: **Users and Access → Integrations → App Store Connect API** →
   request access if asked → **Generate API Key**. Name `GitHub`, role **Admin**.
2. Download the key file (`AuthKey_XXXXXXXXXX.p8`). Apple lets you download it **only once**.
3. Note the **Key ID** (shown next to the key) and the **Issuer ID** (shown above the list).
4. Find your **Team ID** at https://developer.apple.com/account → **Membership details**.

**Add the secrets to GitHub**

Open https://github.com/robbiefeamster28-sketch/touch-time/settings/secrets/actions →
**New repository secret**, four times:

| Name | Value |
|---|---|
| `APPLE_TEAM_ID` | Your Team ID |
| `ASC_KEY_ID` | The Key ID |
| `ASC_ISSUER_ID` | The Issuer ID |
| `ASC_KEY_P8` | Open the `.p8` file in Notepad and paste **everything**, including the `BEGIN` and `END` lines |

Secrets stay private, even though the repo is public.

**Build and upload**

1. Repo **Actions** tab → **iPhone app** → **Run workflow** → **Run workflow**.
2. After about 10–15 minutes the run turns green. The build then appears in App Store
   Connect → your app → **TestFlight** after Apple processes it (5–30 minutes).
3. **Test it:** install the **TestFlight** app on an iPhone, add yourself under
   **Internal Testing**, and open the invite.
4. **Submit:** in App Store Connect → **App Store** tab, fill in the listing from
   `store/listing.md`, upload the screenshots from `store/screenshots/apple-6.9in`, pick the
   build, complete **App Privacy** (*Data Not Collected*) and the age rating, then
   **Add for Review** → **Submit**.

**Updating later:** change the app, then run the **iPhone app** workflow again. Each run
gets a new build number automatically. For a new App Store version, also change
`MARKETING_VERSION` in Xcode settings. Ask Claude to do it.

---

## Good to know

- **Accounts in the apps** are saved on the phone, like on the website. Players move
  progress to a new phone with **Account → Download backup** and **Restore backup**.
  Syncing between devices automatically would need an online server. That's a possible
  next step.
- **Changing the app:** edit the web files (`index.html`, `css`, `js`) as usual. The
  website updates by itself; the store apps need a new upload (parts 2 and 3).
- **Icon and launch screen** come from `assets/`. To change them, edit
  `assets/make-icons.js`, run `node assets/make-icons.js`, then `npm run assets`.
