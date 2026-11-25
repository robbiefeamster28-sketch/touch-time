// Draws the app icon and splash screens, then saves the PNGs that
// `npm run assets` turns into every Android and iPhone size.
// Run: node assets/make-icons.js   (needs Playwright)
const { chromium } = require("playwright");
const path = require("path");

const BLUE = "#1f4fd8", NAVY = "#0a1228", CORAL = "#f2542d", INK = "#0d1a3a";

// Soccer ball: white circle, a centre pentagon and five edge patches.
function ball(cx, cy, r) {
  const pent = (x, y, rad, rot) => Array.from({ length: 5 }, (_, i) => {
    const a = rot + (i * 2 * Math.PI) / 5;
    return `${(x + rad * Math.cos(a)).toFixed(1)},${(y + rad * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  const up = -Math.PI / 2;
  let patches = "", seams = "";
  for (let i = 0; i < 5; i++) {
    const a = up + (i * 2 * Math.PI) / 5;
    const vx = cx + r * 0.36 * Math.cos(a), vy = cy + r * 0.36 * Math.sin(a);
    const px = cx + r * 0.98 * Math.cos(a + Math.PI / 5), py = cy + r * 0.98 * Math.sin(a + Math.PI / 5);
    patches += `<polygon points="${pent(px, py, r * 0.34, a + Math.PI / 5 + Math.PI)}" fill="${INK}"/>`;
    seams += `<line x1="${vx.toFixed(1)}" y1="${vy.toFixed(1)}" x2="${(cx + r * 0.62 * Math.cos(a)).toFixed(1)}" y2="${(cy + r * 0.62 * Math.sin(a)).toFixed(1)}"/>`;
  }
  return `<clipPath id="bc"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/>
    <g clip-path="url(#bc)">${patches}
      <g stroke="${INK}" stroke-width="${r * 0.035}" stroke-linecap="round">${seams}</g>
      <polygon points="${pent(cx, cy, r * 0.36, up)}" fill="${INK}"/>
    </g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${INK}" stroke-width="${r * 0.04}"/>`;
}

// The mark: ball inside a coral "goal ring" three-quarters full.
function mark(cx, cy, size) {
  const R = size * 0.42, w = size * 0.075, C = 2 * Math.PI * R;
  return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="${w}"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${CORAL}" stroke-width="${w}" stroke-linecap="round"
      stroke-dasharray="${C * 0.75} ${C}" transform="rotate(-90 ${cx} ${cy})"/>
    ${ball(cx, cy, size * 0.3)}`;
}

function stripes(w, h, bg, stripe) {
  return `<rect width="${w}" height="${h}" fill="${bg}"/>
    <pattern id="st" width="${w * 0.14}" height="${w * 0.14}" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
      <rect width="${w * 0.07}" height="${w * 0.14}" fill="${stripe}"/></pattern>
    <rect width="${w}" height="${h}" fill="url(#st)"/>`;
}

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

const files = {
  // Full icon (iPhone, older Android).
  "icon-only.png": [1024, 1024, stripes(1024, 1024, BLUE, "rgba(255,255,255,.07)") + mark(512, 512, 760)],
  // Android adaptive icon: the mark sits in the centre safe zone, background separate.
  "icon-foreground.png": [1024, 1024, mark(512, 512, 560)],
  "icon-background.png": [1024, 1024, stripes(1024, 1024, BLUE, "rgba(255,255,255,.07)")],
  // Launch screens.
  "splash.png": [2732, 2732, stripes(2732, 2732, BLUE, "rgba(255,255,255,.06)") + mark(1366, 1366, 700)],
  "splash-dark.png": [2732, 2732, stripes(2732, 2732, NAVY, "rgba(123,155,255,.08)") + mark(1366, 1366, 700)]
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [name, [w, h, body]] of Object.entries(files)) {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg(w, h, body)}</body></html>`);
    await page.screenshot({ path: path.join(__dirname, name), omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    console.log("saved", name);
  }
  await browser.close();
})();
