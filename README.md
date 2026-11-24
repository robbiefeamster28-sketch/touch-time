# Touch Time – Soccer Drills

A soccer training app: 133 drills, 61 timed skill tests with medals, 14 practices plus a practice builder, and rewards (daily goals, streaks, weekly challenges, topic mastery, levels, badges and avatars).

No build step, no server code, no dependencies. It's plain HTML, CSS and JavaScript.

## Use it

- **On your computer:** open `index.html` in a browser.
- **Online with GitHub Pages:** push this repo to GitHub, then go to **Settings → Pages → Source** and choose **GitHub Actions**. The workflow in `.github/workflows/pages.yml` publishes the app on every push to `main`, at `https://<your-username>.github.io/<repo-name>/`.

Progress is saved in the browser you use. To move it to another device, go to **Rewards → Backup → Download backup**, then use **Restore backup** on the other device.

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
  store.js              Saving and loading progress, backup and restore
  stats.js              Totals, levels, streaks, medals, practice of the day
  demo.js               The animated pitch diagram (or a video)
  timer.js              Full-screen countdown, pause, rest breaks, sounds
js/views/               One file per page; each returns HTML
  common.js             Header, tabs, filters, search, shared pieces
  practices.js          Practices list, practice page, practice builder
  drills.js             Drills list and drill page
  tests.js              Tests list, test page, score chart
  rewards.js            Rewards page
js/sessions.js          Doing a drill, running a practice, taking a test
js/app.js               Connects it all: page state, drawing, button actions
videos/                 Optional drill videos (see videos/README.md)
```

Buttons say what they do with a `data-action` attribute, for example `data-action="open-drill"`. Each action is handled in one place: the `actions` list in `js/app.js`.

## Common changes

- **Add a drill:** add a line to `js/data/drills.js` with a new unique `id` and an existing `topic`.
- **Add a practice:** add a line to `js/data/practices.js` that lists drill ids.
- **Add a video:** put the file in `videos/` and add `"video": "videos/your-file.mp4"` to the drill.
- **Change medal targets:** edit `medals` on the test in `js/data/tests.js`.
