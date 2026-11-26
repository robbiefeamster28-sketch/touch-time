# Store listing text

Copy and paste these into Google Play Console and App Store Connect.

## Basics (both stores)

| Field | Value |
|---|---|
| App name | Touch Time |
| Package / Bundle ID | `io.github.robbiefeamster28.touchtime` |
| Category | Sports (secondary on Apple: Health & Fitness) |
| Price | Free |
| Privacy policy URL | https://robbiefeamster28-sketch.github.io/touch-time/privacy.html |
| Support URL | https://github.com/robbiefeamster28-sketch/touch-time/issues |
| Contact email | Use your own; both stores require one. |

## Apple subtitle (30 characters max)

Soccer drills, tests & streaks

## Google Play short description (80 characters max)

Soccer drills, timed skill tests and daily streaks. Train anywhere with a ball.

## Full description (both stores)

Touch Time helps soccer players get more touches on the ball, every day, with nothing but a ball and a bit of space.

DRILLS FOR EVERY PART OF YOUR GAME
• 133 drills across dribbling, passing, wall work, juggling, shooting and indoor training
• Each drill shows an animated demo, what you need, and step-by-step instructions
• Filter by topic and level (Beginner, Intermediate, Advanced), search, and star your favorites

PRACTICES THAT RUN THEMSELVES
• 14 ready-made practices, plus a new Practice of the Day
• Build your own practice from any drills, in any order
• Built-in timer with 3-2-1 countdown, halfway beep, pause, and rest breaks between drills

SKILL TESTS WITH STARS
• 61 timed tests: toe taps, juggling, wall passes, cone weaves and more
• Do as many reps as you can, then enter your score
• Earn 1 to 5 stars, track personal bests, and see your progress chart

STAY MOTIVATED
• Daily goal ring, day streaks and weekly challenges
• Monthly levels, badges, topic mastery and unlockable avatars

FOR FAMILIES AND TEAMS
• Use it straight away as a guest, or create player accounts
• Several players can share one phone, each with their own account and progress
• Works offline. No ads and no tracking: only anonymous usage counts.

## Keywords (Apple, 100 characters max)

soccer,football,drills,training,juggling,dribbling,ball mastery,skills,practice,coach,touches

## Content rating questionnaires

Answer **No** to everything: no violence, sexual content, profanity, drugs, gambling,
user-generated content shared with others, location sharing, or purchases.

- Google Play: expected rating **Everyone / PEGI 3**.
- Apple: expected age rating **4+**.
- Google Play "Target audience": choose **13 and over** for the simplest review. If you pick
  ages under 13, Google applies the Families policy, which this app meets (no ads, no data
  collection) but which adds extra review questions.

## Google Play: Data safety form

- Does your app collect or share any of the required user data types? **Yes**
- Is all of the user data collected by your app encrypted in transit? **Yes**
- Do you provide a way for users to request that their data is deleted? **Yes**: in the app, Account > Deactivate account.
- Data types: tick only **App activity › App interactions**. For it:
  - Collected: **Yes**. Shared: **No**.
  - Processed ephemerally: **No**. Required: **Yes** (users can't turn it off in the app).
  - Purpose: **Analytics** only.
- Leave every other type unticked (no personal info, location, device IDs, etc.).

## Apple: App Privacy ("nutrition label")

- Do you or your third-party partners collect data from this app? **Yes**
- Data type: **Usage Data › Product Interaction** only.
  - Used for: **Analytics**.
  - Linked to the user's identity? **No**.
  - Used for tracking? **No**.
  Result: **Data Not Linked to You: Usage Data**. No App Tracking Transparency prompt is needed.

## Apple: App Review notes

> Touch Time is a soccer training app. No login is needed: it opens as a guest. Player
> accounts are optional, stored only on the device, and can be removed in Account >
> Deactivate account (needs the account's password). Timers play short beeps; no special permissions are used.

## Screenshots and graphics

| Store | Upload | Files |
|---|---|---|
| Google Play | Phone screenshots (2–8) | `store/screenshots/google-play/` (1080 × 1920) |
| Google Play | Feature graphic | `store/feature-graphic.png` (1024 × 500) |
| Google Play | App icon (512 × 512) | `assets/icon-only.png` (scale to 512 if asked) |
| Apple | iPhone 6.9" display | `store/screenshots/apple-6.9in/` (1320 × 2868) |
| Apple | iPhone 6.5" display (if asked) | `store/screenshots/apple-6.5in/` (1284 × 2778) |

To remake them after changing the app: `npm run build:www`, serve `www/` on port 8766
(`cd www && python3 -m http.server 8766`), then `node store/make-screenshots.js`.
