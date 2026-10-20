// ClipNest zero-dependency static blog builder.
// Cloudflare Pages build command: node build.js
// Build output directory: dist
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const BLOG_DIR = path.join(ROOT, "blogs");
const DIST = path.join(ROOT, "dist");
const DOMAIN = (process.env.SITE_URL || "https://YOUR-DOMAIN.example").replace(/\/$/, "");

function escapeHtml(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function inline(s) {
  return escapeHtml(s)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
function parseMarkdown(raw, filename) {
  let metadata = {};
  let body = raw;
  if (raw.startsWith("---\n")) {
    const end = raw.indexOf("\n---", 4);
    if (end !== -1) {
      const block = raw.slice(4, end);
      body = raw.slice(end + 4).trim();
      for (const line of block.split(/\r?\n/)) {
        const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
        if (match) {
          let value = match[2].trim();
          try { value = JSON.parse(value); } catch {}
          metadata[match[1]] = value;
        }
      }
    }
  }
  const slug = path.basename(filename, path.extname(filename));
  metadata.title = metadata.title || slug.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  metadata.description = metadata.description || `Read ${metadata.title} on ClipNest.`;
  metadata.date = metadata.date || new Date().toISOString().slice(0, 10);
  metadata.category = metadata.category || "Guides";
  metadata.readTime = metadata.readTime || "4 min read";
  return { ...metadata, slug, html: markdownToHtml(body) };
}
function markdownToHtml(md) {
  const lines = md.replace(/\r/g, "").split("\n");
  const out = [];
  let para = [], list = null;
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const line of lines) {
    const t = line.trim();
    if (!t) { flushPara(); flushList(); continue; }
    const h = t.match(/^(#{1,3})\s+(.+)$/);
    if (h) { flushPara(); flushList(); const n = h[1].length; out.push(`<h${n+1}>${inline(h[2])}</h${n+1}>`); continue; }
    const ul = t.match(/^[-*]\s+(.+)$/);
    const ol = t.match(/^\d+\.\s+(.+)$/);
    if (ul || ol) {
      flushPara(); const type = ul ? "ul" : "ol";
      if (list !== type) { flushList(); list = type; out.push(`<${list}>`); }
      out.push(`<li>${inline((ul || ol)[1])}</li>`); continue;
    }
    flushList(); para.push(t);
  }
  flushPara(); flushList();
  return out.join("\n");
}
function shell(title, description, body, active = "") {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${escapeHtml(description)}"><meta name="theme-color" content="#d9273e">
<title>${escapeHtml(title)} — ClipNest</title><link rel="stylesheet" href="styles.css"></head>
<body><div id="header"></div>${body}<div id="footer"></div><script src="layout.js"></script><script src="app.js"></script></body></html>`;
}
function articlePage(p) {
  const body = `<section class="page-hero"><div class="article-meta">${escapeHtml(p.category.toUpperCase())} · ${escapeHtml(p.readTime.toUpperCase())}</div><h1 class="article-title">${escapeHtml(p.title)}</h1><p>${escapeHtml(p.description)}</p></section>
  <article class="content-wrap">${p.html}<p><a href="blog.html">← Back to all articles</a></p></article>`;
  return shell(p.title, p.description, body);
}
function blogIndex(posts) {
  const cards = posts.map(p => `<article class="blog-card"><div class="blog-art ${p.cardClass}"><span>${escapeHtml(p.cardLabel)}</span></div><div class="blog-meta">${escapeHtml(p.category.toUpperCase())} · ${escapeHtml(p.readTime.toUpperCase())}</div><h3><a href="${p.url}">${escapeHtml(p.title)}</a></h3><p>${escapeHtml(p.description)}</p><a class="underlink" href="${p.url}">Read article →</a></article>`).join("\n");
  const body = `<section class="page-hero"><div class="section-kicker">THE CLIPNEST BLOG</div><h1>Helpful tips. <span class="red-word">Clear answers.</span></h1><p>Practical guides for sharing links, understanding download limitations and using online tools more safely.</p></section><main class="section-wrap"><div class="blog-grid">${cards || "<p>New articles are coming soon.</p>"}</div></main>`;
  return shell("Blog & Guides", "Read ClipNest guides on copying links, safe downloads and troubleshooting social media URLs.", body);
}
function main() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  for (const name of fs.readdirSync(ROOT)) {
    if (["dist", "blogs", "node_modules"].includes(name) || name === "build.js" || name === "package.json") continue;
    const from = path.join(ROOT, name), to = path.join(DIST, name);
    if (fs.statSync(from).isFile()) fs.copyFileSync(from, to);
  }
  const markdownFiles = fs.readdirSync(BLOG_DIR).filter(n => /\.md$/i.test(n)).sort((a,b)=>a.localeCompare(b));
  const posts = markdownFiles.map(file => parseMarkdown(fs.readFileSync(path.join(BLOG_DIR, file), "utf8"), file));
  const used = new Set();
  posts.forEach((p, i) => {
    let slug = p.slug;
    if (used.has(slug)) throw new Error(`Duplicate blog filename/slug: ${slug}`);
    used.add(slug);
    p.url = `blog-${slug}.html`;
    p.cardClass = ["blog-art-red", "blog-art-cream", "blog-art-dark"][i % 3];
    p.cardLabel = p.title.length > 26 ? `${p.title.slice(0, 22)}…` : p.title;
    fs.writeFileSync(path.join(DIST, p.url), articlePage(p), "utf8");
  });
  fs.writeFileSync(path.join(DIST, "blog.html"), blogIndex(posts), "utf8");
  const pages = ["", "tools.html", "pinterest-downloader.html", "tiktok-downloader.html", "facebook-downloader.html", "blog.html", "about.html", "contact.html", "privacy.html", "terms.html", ...posts.map(p=>p.url)];
  const urls = pages.map(p => `<url><loc>${DOMAIN}/${p}</loc></url>`).join("\n");
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, "utf8");
  const robots = `User-agent: *\nAllow: /\nSitemap: ${DOMAIN}/sitemap.xml\n`;
  fs.writeFileSync(path.join(DIST, "robots.txt"), robots, "utf8");
  console.log(`Built ClipNest into dist/ with ${posts.length} blog posts.`);
}
main();
