# ClipNest — automatic Markdown blog setup

## Add a blog post later
1. Open the `blogs/` folder in your GitHub repository.
2. Add one new `.md` file, e.g. `my-new-article.md`.
3. Start it with frontmatter, then write the article in Markdown:

```md
---
title: "My new article title"
description: "A short SEO description for this article."
date: "2026-10-20"
category: "Guides"
readTime: "4 min read"
---

Write your introduction here.

## First heading

Your paragraph here.

- First bullet
- Second bullet
```

4. Commit the file. Cloudflare Pages will rebuild the site and automatically add the post to `blog.html`, generate a page named `blog-my-new-article.html`, and include it in `sitemap.xml`. You do not need to edit the blog index or build a new HTML page manually.

## Cloudflare Pages settings
- Framework preset: `None`
- Build command: `npm run build` (or `node build.js`)
- Build output directory: `dist`
- Environment variable (recommended): `SITE_URL` = your full canonical domain, e.g. `https://example.com`

Node.js is available in Cloudflare Pages build environments. This build uses no external npm dependencies.

## Website pages
- `index.html` — homepage
- `tools.html` — tools directory
- separate Pinterest, TikTok and Facebook tool pages
- `about.html`, `contact.html`, `privacy.html`, `terms.html`
- `blogs/` — all article source files in Markdown
- `build.js` — generates article pages, blog listing, sitemap and robots file

## Important
This site is a frontend starter. The downloader forms validate URL formats but do not retrieve media. The contact form is a demo and does not send messages. Connect permitted media processing and a contact provider before launch. Review privacy/terms for your real implementation.
