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
// Cache-busting: add ?v=<content hash> to every local style and script link,
// so browsers always load the files that match this page instead of old copies.
const crypto = require("crypto");
for (const page of ["index.html", "privacy.html"]) {
  const file = path.join(out, page);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8").replace(
    /(src|href)="((?:css|js|fonts|icons)\/[^"?#]+)"/g,
    (all, attr, url) => {
      const target = path.join(out, url);
      if (!fs.existsSync(target)) return all;
      const v = crypto.createHash("sha1").update(fs.readFileSync(target)).digest("hex").slice(0, 8);
      return `${attr}="${url}?v=${v}"`;
    }
  );
  fs.writeFileSync(file, html);
}

console.log("www/ ready:", fs.readdirSync(out).join(", "));
