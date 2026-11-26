# Seeing how many people use Touch Time

Touch Time sends anonymous counts to **GoatCounter**, a free, privacy-friendly stats service.
You get a dashboard with visitors per day and counts of what people do in the app.

Nothing is counted until you finish part 1. Counting starts from that moment; earlier visits
can't be recovered.

## 1. One-time setup (about 3 minutes)

1. Go to https://www.goatcounter.com/signup.
2. **Code**: type a short name, for example `touchtime`. Your dashboard will be at
   `https://touchtime.goatcounter.com`. If it's taken, try `touchtime-soccer`.
3. **Site domain**: `robbiefeamster28-sketch.github.io`
4. Enter your email and a password, and sign up.
5. Turn the stats on in the app. Either:
   - **Easiest:** send the code to Claude, or
   - **Yourself:** on GitHub, open `js/config.js`, tap the pencil ✏️, put the code between the
     quotes (`goatcounter: "touchtime"`), and click **Commit changes**. The website updates
     within a couple of minutes.

The Android and iPhone apps start counting from the next version you upload to the stores.

## 2. Reading the dashboard

Sign in at `https://<your-code>.goatcounter.com`. Pick the date range at the top.

| You'll see | What it means |
|---|---|
| `/` | Someone opened the **website** |
| `/app/android`, `/app/ios` | Someone opened the **Android** or **iPhone app** |
| `account-created` | A new player account was made |
| `drill-completed` | A single drill was finished (the timer ran out) |
| `practice-completed` | A whole practice was finished |
| `test-taken` | A skill test result was saved |

- **Visitors** (unique) is roughly how many different people came; **pageviews** is how many
  times the app was opened.
- Events (the names without a `/`) are listed with the pages. Click one to see it over time.
- The side panels show countries, browsers, phones vs computers, and which sites sent people to you.

## Good to know

- Only counts are sent: never names, PINs, scores or progress. See `privacy.html`.
- Not counted: the claude.ai preview, testing on your own computer, and visitors whose
  browser has **Do Not Track** turned on. So real numbers may be a little higher.
- To turn stats off, empty the quotes in `js/config.js` again.
- GoatCounter is free for personal and non-commercial use. If the app becomes a business,
  check their pricing page.
