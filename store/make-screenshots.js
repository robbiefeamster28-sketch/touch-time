// Store screenshots and the Google Play feature graphic.
// Run: npm run build:www, serve www/ on port 8766, then: node store/make-screenshots.js
const { chromium } = require("playwright");
const path = require("path");
const OUT = path.join(__dirname, "screenshots");
const URL = "http://localhost:8766/";

// [folder, css width, css height, scale] -> pixels
const SIZES = [
  ["google-play", 360, 640, 3], // 1080 x 1920
  ["apple-6.9in", 440, 956, 3], // 1320 x 2868
  ["apple-6.5in", 428, 926, 3]  // 1284 x 2778
];

// A few days of example progress so screens aren't empty.
function seed() {
  const now = Date.now(), D = 864e5, log = [], ids = ["toe", "dr_box", "dr_drag", "n_vs", "p1_b", "jl1", "s_vb_r", "dr_v"];
  for (let day = 6; day >= 1; day--) for (let k = 0; k < 6; k++) log.push({ t: now - day * D - k * 6e5, s: 60, d: ids[(day + k) % 8] });
  for (let k = 0; k < 19; k++) log.push({ t: now - k * 6e4, s: 60, d: ids[k % 8] });
  sessionStorage.setItem("touchtime.intro", "1"); // skip the opening animation
  localStorage.setItem("touchtime.players", JSON.stringify([{ id: "pdemo", name: "Alex", pin: "", created: now, updated: now }]));
  localStorage.setItem("touchtime.current", JSON.stringify("pdemo"));
  localStorage.setItem("touchtime.player.pdemo", JSON.stringify({
    log, favs: ["toe", "dr_box", "n_vs"], mine: [], goal: 30, av: 3, gts: now, rest: 10,
    tres: [62, 71, 80, 86, 98].map((sc, i) => ({ t: now - (5 - i) * 2 * D, id: "t_toe", sc }))
  }));
}

(async () => {
  const browser = await chromium.launch();
  for (const [folder, w, h, scale] of SIZES) {
    const dir = path.join(OUT, folder);
    require("fs").mkdirSync(dir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
    await page.goto(URL);
    await page.evaluate(seed);
    await page.reload();
    await page.waitForTimeout(800);
    const shot = (n) => page.screenshot({ path: path.join(dir, n + ".png") });
    await shot("1-today");
    await page.click('.tab:has-text("Drills")');
    await shot("2-drills");
    await page.click('[data-action=open-drill][data-id=n_vs]');
    await page.waitForTimeout(1200);
    await shot("3-drill");
    await page.click('.tab:has-text("Tests")');
    await page.click('[data-id=t_toe]');
    await page.evaluate(() => document.querySelector("svg.chart").scrollIntoView({ block: "center" }));
    await shot("4-test-medals");
    await page.click('[data-action=close-test]');
    await page.click('.tab:has-text("Train")');
    await page.evaluate(() => TT.sessions.drill("n_vs", 60));
    await page.waitForTimeout(3000 + 9000);
    await shot("5-timer");
    await page.click("#timer >> text=End");
    await page.click('.tab:has-text("Rewards")');
    await page.evaluate(() => { const h = [...document.querySelectorAll("h2.sec")].find((x) => x.textContent.startsWith("Streak")); h.scrollIntoView(); scrollBy(0, -70); });
    await shot("6-rewards");
    await page.close();
    console.log("saved", folder);
  }

  // Google Play feature graphic, 1024 x 500.
  const page = await browser.newPage({ viewport: { width: 1024, height: 500 } });
  await page.goto(URL + "privacy.html"); // same folder, so the bundled fonts load
  await page.setContent(`<html><head><style>
    @font-face { font-family: BSD; src: url("${URL}fonts/big-shoulders-display.woff2"); font-weight: 100 900; }
    @font-face { font-family: DMS; src: url("${URL}fonts/dm-sans.woff2"); font-weight: 100 1000; }
    body { margin: 0; width: 1024px; height: 500px; overflow: hidden; display: flex; align-items: center; gap: 56px; padding: 0 72px; box-sizing: border-box;
      background: repeating-linear-gradient(115deg, #1f4fd8 0 60px, #2a58dc 60px 120px); color: #fff; font-family: DMS; }
    img { width: 300px; height: 300px; border-radius: 64px; box-shadow: 0 18px 40px rgba(5, 14, 50, .35); }
    h1 { font: 800 112px/0.9 BSD; margin: 0 0 18px; text-transform: uppercase; letter-spacing: .01em; }
    p { font-size: 32px; line-height: 1.3; margin: 0; max-width: 520px; }
    b { color: #ffb199; }
  </style></head><body><img src="data:image/png;base64,${require("fs").readFileSync(path.join(__dirname, "..", "assets", "icon-only.png")).toString("base64")}">
    <div><h1>Touch Time</h1><p>Soccer drills, skill tests and <b>daily streaks</b>. Train anywhere, with just a ball.</p></div></body></html>`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(__dirname, "feature-graphic.png") });
  console.log("saved feature-graphic.png");
  await browser.close();
})();
