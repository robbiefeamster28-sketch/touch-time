// Copies the web app into www/, the folder the Android and iPhone apps load.
// Run with: npm run build:www  (npm run sync also updates the native projects)
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "www");
const include = ["index.html", "privacy.html", "css", "js", "fonts", "icons", "videos"];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const item of include) {
  const from = path.join(root, item);
  if (fs.existsSync(from)) fs.cpSync(from, path.join(out, item), { recursive: true });
}
console.log("www/ ready:", fs.readdirSync(out).join(", "));
