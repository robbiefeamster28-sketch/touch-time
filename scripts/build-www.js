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

// Version stamp for js/core/update-check.js: one id for this whole build, put
// into the page and into version.json, so an out-of-date page can tell.
const all = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir).sort()) {
    const f = path.join(dir, name);
    if (fs.statSync(f).isDirectory()) walk(f);
    else all.push(fs.readFileSync(f));
  }
})(out);
const build = crypto.createHash("sha1").update(Buffer.concat(all)).digest("hex").slice(0, 12);
const indexFile = path.join(out, "index.html");
fs.writeFileSync(indexFile, fs.readFileSync(indexFile, "utf8").replace("<head>", `<head>\n  <script>window.TT_BUILD = "${build}";</script>`));
fs.writeFileSync(path.join(out, "version.json"), JSON.stringify({ build: build }) + "\n");

console.log("www/ ready:", fs.readdirSync(out).join(", "), "· build", build);
