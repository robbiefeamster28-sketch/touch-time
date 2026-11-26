# Touch Time – Soccer Drills

A soccer training app: 133 drills, 61 timed skill tests with medals, 14 practices plus a practice builder, and rewards (daily goals, streaks, weekly challenges, topic mastery, levels, badges and avatars).

No build step, no server code, no dependencies. It's plain HTML, CSS and JavaScript.

## Use it

- **On your computer:** open `index.html` in a browser.
- **Online with GitHub Pages:** push this repo to GitHub, then go to **Settings → Pages → Source** and choose **GitHub Actions**. The workflow in `.github/workflows/pages.yml` publishes the app on every push to `main`, at `https://<your-username>.github.io/<repo-name>/`.

## Android and iPhone apps

The same app is wrapped for Google Play and the App Store with [Capacitor](https://capacitorjs.com).
The step-by-step guide is in **[APP-STORES.md](APP-STORES.md)**, and the store text and
screenshots are in [`store/`](store/).

- `npm install`, then `npm run sync` copies the web app into `www/` and updates `android/` and `ios/`.
- GitHub builds a test Android app (`.apk`) on every push, and the iPhone app on demand.

## Usage stats

Anonymous counts (visits, accounts created, drills, practices and tests finished) go to
GoatCounter. Setup and how to read the numbers: **[STATS.md](STATS.md)**.

## Player accounts

Each player creates an account with a name and an optional 4-digit PIN. Several players can share one device, and each keeps their own time, test scores, favorites and practices.

- **On claude.ai** (the published preview), accounts and progress are also saved to the visitor's online claude.ai storage, so they follow them to any device where they sign in to claude.ai.
- **Everywhere else** (GitHub Pages, opening the file), accounts are saved in that browser. To move progress to another device, use **Account → Download backup**, then **Restore backup** on the other device.

The PIN only keeps people on a shared device out of each other's account. It isn't strong security.

## Project layout

```
index.html              Page shell; loads the scripts below in order
css/styles.css          All styling (light and dark mode)
js/data/                The content: edit these to add or change things
  drills.js             Every drill: steps, what you need, demo animation
  tests.js              Every test: time, what to count, medal targets
  practices.js          Built-in practices (lists of drill ids)
  rewards.js            Topics, daily goal, levels, badges, avatars, medals
js/core/
  util.js               Helpers: time formatting, dates, toast messages
  store.js              Player accounts, saving progress, backup and restore
  cloud.js              Online saving when running on claude.ai
  analytics.js          Anonymous usage counts (GoatCounter)
  stats.js              Totals, levels, streaks, medals, practice of the day
  demo.js               The animated pitch diagram (or a video)
  timer.js              Full-screen countdown, pause, rest breaks, sounds
js/views/               One file per page; each returns HTML
  common.js             Header, tabs, filters, search, shared pieces
  practices.js          Practices list, practice page, practice builder
  drills.js             Drills list and drill page
  tests.js              Tests list, test page, score chart
  rewards.js            Rewards page
  account.js            Sign-in, new player, PIN, account settings
js/config.js            Settings: your GoatCounter code
js/sessions.js          Doing a drill, running a practice, taking a test
js/app.js               Connects it all: page state, drawing, button actions
videos/                 Optional drill videos (see videos/README.md)
fonts/                  Bundled fonts, so the app works offline
privacy.html            Privacy policy (linked from the app stores)
android/, ios/          Native app projects (Capacitor)
assets/                 App icon and launch screen sources
store/                  Store listing text, screenshots, feature graphic
scripts/build-www.js    Copies the web app into www/ for the native apps
```

Buttons say what they do with a `data-action` attribute, for example `data-action="open-drill"`. Each action is handled in one place: the `actions` list in `js/app.js`.

## Common changes

- **Add a drill:** add a line to `js/data/drills.js` with a new unique `id` and an existing `topic`.
- **Add a practice:** add a line to `js/data/practices.js` that lists drill ids.
- **Add a video:** put the file in `videos/` and add `"video": "videos/your-file.mp4"` to the drill.
- **Change medal targets:** edit `medals` on the test in `js/data/tests.js`.
