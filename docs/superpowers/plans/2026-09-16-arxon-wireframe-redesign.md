# Arxon Wireframe Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild arxongomperts.com as a six-page static site matching the new sponsor-pitch wireframe, reusing the existing brand system unchanged.

**Architecture:** Extract the shared CSS and JS out of the current single-file `index.html` into `assets/style.css` and `assets/site.js`, then build six pages against them. Each page keeps a small inline `<style>` block for sections only it uses. No build step, no package manager, no runtime libraries, so GitHub Pages keeps serving the files unchanged.

**Tech Stack:** Hand-written HTML5, CSS3 (custom properties, grid, flexbox, `IntersectionObserver`-driven reveals), vanilla ES2020. Node 22 is used only for the offline link checker, never at runtime. Headless Chrome for visual verification.

## Global Constraints

- **No runtime dependencies.** No CDN scripts, no frameworks, no package installs that the site loads. Google Fonts is the sole existing external request and stays as-is.
- **No build step.** Every file is served exactly as committed.
- **Brand tokens are frozen:** `--black: #0a0a0a`, `--dark: #111111`, `--panel: #161616`, `--border: rgba(255,255,255,0.08)`, `--accent: #00e5ff`, `--accent2: #ff6b00`, `--white: #f5f5f5`, `--muted: rgba(245,245,245,0.45)`.
- **Fonts are frozen:** Bebas Neue (display), DM Sans (body), Space Mono (labels/micro-copy).
- **No em-dashes in site copy.** Not `—`, not `--`. Rewrite existing copy that uses them as it moves.
- **No email address anywhere on the site.** WhatsApp is the only contact channel. `arxon@email.com` must not survive into any page.
- **`CNAME` must not be modified or deleted.** It carries the custom domain.
- **All work happens on branch `redesign/wireframe-2026-09`.** Nothing merges to `main` in this plan.
- **Placeholder content must be greppable.** Every unverified value carries a `TODO(client)` comment in the HTML next to it.
- **Verified stats only:** 2x U15 world titles, 4 world cup wins, 5+ podium finishes, 4+ countries. The wireframe's 20+/50+/1M+ are NOT used.
- Breakpoints match the existing site: `900px` and `480px`.

---

## File Structure

| File | Responsibility |
|---|---|
| `assets/style.css` | Tokens, loader, cursor, nav, hamburger, mobile nav, section label, reveal system, buttons, footer, scroll progress, shared responsive rules |
| `assets/site.js` | Loader, cursor, nav scroll state, scroll progress, hamburger, reveal observer, counters, smooth anchors, WhatsApp form |
| `index.html` | Wireframe homepage: hero, logo bar, accomplishments, sponsorship ways, reviews, portfolio, connect |
| `about.html` | Bio, portrait, discipline tags |
| `races.html` | Results table with year filter, career stat cards |
| `sponsorship.html` | Three sponsorship ways expanded, logo wall, partner CTA |
| `news.html` | Curated post-card grid, follow CTA |
| `contact.html` | Form and WhatsApp CTA |
| `scripts/check-links.mjs` | Offline verifier: every local asset exists, every internal link resolves |

**Deleted:** the six-chapter story section (HTML `1833-1977`, CSS `661-954`, JS `2280-2372`), the "more from the water" strip, and the dead `DISCIPLINES` CSS block (`464-560`, its markup was already removed in a prior commit).

---

### Task 1: Link and asset checker

The site has no test framework and does not need one, but a multi-page static site fails in exactly one boring way: a `src` or `href` that points at nothing. This task builds the harness that catches it, and every later task runs it.

**Files:**
- Create: `scripts/check-links.mjs`
- Create (temporary fixture): `scripts/__fixture__/broken.html`

**Interfaces:**
- Produces: `node scripts/check-links.mjs` exits `0` when clean, exits `1` and prints offending `file -> reference` pairs when not. Later tasks invoke exactly this command.

- [ ] **Step 1: Write the failing test fixture**

Create `scripts/__fixture__/broken.html`:

```html
<!DOCTYPE html>
<html><body>
<img src="does-not-exist.jpg">
<a href="nope.html">broken</a>
<a href="#anchor-ok">fine</a>
<a href="https://example.com">external fine</a>
</body></html>
```

- [ ] **Step 2: Run the checker to verify it fails**

Run: `node scripts/check-links.mjs scripts/__fixture__`
Expected: FAIL, because `scripts/check-links.mjs` does not exist yet ("Cannot find module").

- [ ] **Step 3: Write the checker**

Create `scripts/check-links.mjs`:

```js
#!/usr/bin/env node
// Verifies every local asset reference and internal link in the site's HTML
// resolves to a file that exists. External URLs, anchors, and mailto/tel/wa.me
// links are skipped. Exits 1 on any miss.
import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? '.');

function htmlFiles(dir) {
  return readdirSync(dir).flatMap(name => {
    if (name === 'node_modules' || name === '.git' || name === 'docs') return [];
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') ? [full] : [];
  });
}

const REF = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
const SKIP = /^(https?:|data:|mailto:|tel:|#|\/\/)/i;

const misses = [];
for (const file of htmlFiles(root)) {
  const html = readFileSync(file, 'utf8');
  for (const [, ref] of html.matchAll(REF)) {
    if (SKIP.test(ref)) continue;
    const target = ref.split('#')[0].split('?')[0];
    if (!target) continue;
    const onDisk = resolve(dirname(file), decodeURIComponent(target));
    if (!existsSync(onDisk)) misses.push(`${file} -> ${ref}`);
  }
}

if (misses.length) {
  console.error(`FAIL: ${misses.length} broken reference(s)`);
  for (const m of misses) console.error('  ' + m);
  process.exit(1);
}
console.log('OK: all local references resolve');
```

- [ ] **Step 4: Run against the fixture to verify it catches both misses**

Run: `node scripts/check-links.mjs scripts/__fixture__`
Expected: FAIL, exit 1, listing exactly two misses: `does-not-exist.jpg` and `nope.html`. The `#anchor-ok` and `https://example.com` references must NOT appear.

- [ ] **Step 5: Delete the fixture and run against the real site**

```bash
rm -rf scripts/__fixture__
node scripts/check-links.mjs .
```

Expected: `OK: all local references resolve`. If the current `index.html` reports misses, stop and report them, because that is a pre-existing bug on the live site worth knowing about.

- [ ] **Step 6: Commit**

```bash
git add scripts/check-links.mjs
git commit -m "Add offline link and asset checker"
```

---

### Task 2: Extract shared CSS and JS

Pure refactor. The homepage must look and behave identically at the end of this task. Nothing is redesigned yet.

**Files:**
- Create: `assets/style.css`, `assets/site.js`
- Modify: `index.html` (replace inline `<style>` and `<script>` with links)

**Interfaces:**
- Produces: `assets/style.css` defines `.nav`, `.section-label`, `.reveal`, `.reveal-delay-1..4`, `.btn-primary`, `.btn-outline`, `.page-loader`, `.cursor`, `.cursor-ring`, `.scroll-progress`, and the footer classes. `assets/site.js` auto-initialises on `DOMContentLoaded` and requires no per-page calls. Every later task relies on these names.

- [ ] **Step 1: Capture the before-state screenshot**

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --screenshot=/tmp/arxon-before.png \
  --window-size=1440,3000 --hide-scrollbars \
  "file://$PWD/index.html"
```

Expected: `/tmp/arxon-before.png` written. Open it and confirm it shows the current site.

- [ ] **Step 2: Move the shared CSS into `assets/style.css`**

Copy these line ranges from the current `index.html` `<style>` block into `assets/style.css`, in this order:

| Source lines | Block |
|---|---|
| 25-50 | `:root` tokens, reset, `html`, `body` |
| 51-99 | PAGE LOADER |
| 100-129 | CUSTOM CURSOR |
| 130-197 | NAV |
| 198-217 | HAMBURGER |
| 218-251 | MOBILE NAV OVERLAY |
| 252-266 | SECTION LABEL |
| 267-280 | REVEAL ANIMATION |
| 458-463 | SECTIONS |
| 955-1011 | LIGHTBOX |
| 1614-1658 | FOOTER + SCROLL PROGRESS |
| 1659-1705 | RESPONSIVE |

Do NOT copy `464-560` (DISCIPLINES, dead) or `661-954` (GALLERY/story, being retired).

- [ ] **Step 3: Add the oblique display heading rule**

Append to `assets/style.css`:

```css
/* Display headings are oblique to match the wireframe. Bebas Neue ships no
   true italic, so a measured skew stands in. -8deg reads athletic without
   tipping into distortion. */
.display-head {
  font-family: var(--font-display);
  font-style: normal;
  transform: skewX(-8deg);
  transform-origin: left bottom;
  letter-spacing: 0.02em;
  line-height: 0.92;
}
```

- [ ] **Step 4: Move the shared JS into `assets/site.js`**

Copy these blocks from the current `<script>` into `assets/site.js`: PAGE LOADER (2163-2168), CUSTOM CURSOR (2169-2203), NAV SCROLL (2204-2208), SCROLL PROGRESS (2209-2216), HAMBURGER MENU (2217-2229), REVEAL ON SCROLL (2230-2240), COUNTER ANIMATION (2241-2263), SMOOTH ANCHOR LINKS (2519-2528).

Do NOT copy STORY (2280-2372) or GALLERY STRIP (2347-2372), both retired.

Guard every `getElementById` against `null`, because not every page has every element. Wrap the anchor-link handler so it only intercepts same-page anchors:

```js
// Only intercept pure same-page anchors. Cross-page links like
// "races.html#results" must navigate normally.
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
```

- [ ] **Step 5: Point `index.html` at the extracted files**

Replace the entire inline `<style>` block with, in `<head>`:

```html
<link rel="stylesheet" href="assets/style.css">
<style>
/* Homepage-only sections live here. */
</style>
```

Move the page-specific CSS (HERO 281-457, MARQUEE 430-457, STATS 561-660, ABOUT 1012-1130, RESULTS 1131-1236, SPONSORS 1237-1507, CONTACT 1508-1613) into that inline block for now. Later tasks relocate each to the page that owns it.

Replace the inline `<script>` block with, before `</body>`:

```html
<script src="assets/site.js" defer></script>
<script>
/* Homepage-only behaviour lives here. */
</script>
```

Move the page-specific JS (RESULTS FILTER, LIGHTBOX, HERO PARTICLES, PARALLAX, SPONSORS AUTO-SCROLL) into that inline block.

- [ ] **Step 6: Verify nothing changed visually**

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --screenshot=/tmp/arxon-after.png \
  --window-size=1440,3000 --hide-scrollbars \
  "file://$PWD/index.html"
node scripts/check-links.mjs .
```

Expected: checker prints OK. Open `/tmp/arxon-before.png` and `/tmp/arxon-after.png` side by side and confirm they match. Any difference is a botched extraction, not an improvement. Fix before continuing.

- [ ] **Step 7: Commit**

```bash
git add assets/ index.html
git commit -m "Extract shared CSS and JS into assets/"
```

---

### Task 3: Six-page shell with shared nav and footer

**Files:**
- Create: `about.html`, `races.html`, `sponsorship.html`, `news.html`, `contact.html`
- Modify: `index.html` (nav and footer markup), `assets/style.css` (nav CTA, active state)

**Interfaces:**
- Produces: the canonical nav and footer markup that all six pages copy verbatim, and the `.nav-link.is-active` convention (each page marks its own link).

- [ ] **Step 1: Write the canonical nav**

This exact block goes at the top of `<body>` on all six pages. Only the `is-active` class moves.

```html
<nav id="navbar">
  <a href="index.html" class="nav-logo">ARXON<span>.</span></a>
  <ul class="nav-links">
    <li><a href="index.html" class="nav-link is-active">Home</a></li>
    <li><a href="about.html" class="nav-link">About</a></li>
    <li><a href="races.html" class="nav-link">Races</a></li>
    <li><a href="sponsorship.html" class="nav-link">Sponsorship</a></li>
    <li><a href="news.html" class="nav-link">News</a></li>
    <li><a href="contact.html" class="nav-link">Contact</a></li>
  </ul>
  <a href="contact.html" class="nav-cta">Become a Partner <span>&rarr;</span></a>
  <button class="hamburger" id="hamburger" aria-label="Toggle menu">
    <span></span><span></span><span></span>
  </button>
</nav>
<div class="mobile-nav" id="mobileNav">
  <a href="index.html">Home</a>
  <a href="about.html">About</a>
  <a href="races.html">Races</a>
  <a href="sponsorship.html">Sponsorship</a>
  <a href="news.html">News</a>
  <a href="contact.html">Contact</a>
</div>
```

Note the mobile nav links no longer need `onclick="closeMobileNav()"`, because they navigate away. Remove that attribute and the now-unused global.

- [ ] **Step 2: Write the canonical footer**

```html
<footer>
  <a href="index.html" class="footer-logo">ARXON<span>.</span></a>
  <div class="footer-roles">Windsurfing <i>|</i> Competition <i>|</i> A Brighter Tomorrow</div>
  <ul class="footer-socials">
    <li><a href="#" aria-label="Instagram" data-todo="client-handle">IG</a></li>
    <li><a href="#" aria-label="YouTube" data-todo="client-handle">YT</a></li>
    <li><a href="#" aria-label="TikTok" data-todo="client-handle">TT</a></li>
    <li><a href="#" aria-label="Facebook" data-todo="client-handle">FB</a></li>
  </ul>
  <div class="footer-follow">Follow the journey</div>
</footer>
<!-- TODO(client): social URLs unknown. Placeholders marked data-todo="client-handle". -->
```

- [ ] **Step 3: Add the active-state style**

Append to `assets/style.css`:

```css
.nav-link.is-active { color: var(--accent); }
.nav-link.is-active::after { width: 100%; }
.footer-roles { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
.footer-roles i { color: var(--border); font-style: normal; margin: 0 8px; }
.footer-follow { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
```

- [ ] **Step 4: Create the five new pages as shells**

Each new page is the nav, an empty `<main>`, and the footer, with the correct `is-active` link and its own `<title>`. Use this template, substituting per page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ABOUT — ARXON GOMPERTS</title>
<meta name="description" content="Arxon Gomperts, fin slalom windsurfer from Bonaire.">
<link rel="canonical" href="https://arxongomperts.com/about.html">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<div class="scroll-progress" id="scrollProgress"></div>
<div class="cursor" id="cursor"></div>
<div class="cursor-ring" id="cursorRing"></div>
<!-- nav from Step 1, with about.html marked is-active -->
<main></main>
<!-- footer from Step 2 -->
<script src="assets/site.js" defer></script>
</body>
</html>
```

Titles and canonicals: `ABOUT`, `RACES`, `SPONSORSHIP`, `NEWS`, `CONTACT`.

Note the page loader markup is deliberately omitted from sub-pages. A 2.2 second loader on every navigation would be hostile. It stays on `index.html` only.

- [ ] **Step 5: Verify all six pages and every nav link resolve**

```bash
node scripts/check-links.mjs .
```

Expected: `OK: all local references resolve`. This proves all thirty nav links plus the footer resolve to real files.

- [ ] **Step 6: Commit**

```bash
git add index.html about.html races.html sponsorship.html news.html contact.html assets/style.css assets/site.js
git commit -m "Add six-page shell with shared nav and footer"
```

---

### Task 4: Homepage hero

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `.display-head` from Task 2, nav from Task 3.
- Produces: `.hero` section. The play button is rendered only when `HERO_VIDEO` is non-empty (see Step 3), so no dead button ships.

- [ ] **Step 1: Replace the hero markup**

```html
<section class="hero">
  <div class="hero-media">
    <img src="arxon-sunset-01.jpg" alt="Arxon Gomperts windsurfing at sunset" loading="eager">
  </div>
  <div class="hero-inner">
    <h1 class="hero-title display-head">
      Put your brand on<br>the <span>world stage.</span>
    </h1>
    <p class="hero-sub">High-performance windsurfing. Global reach. Real impact.</p>
    <a href="contact.html" class="btn-primary hero-cta">Become a Partner <span>&rarr;</span></a>
  </div>
  <button class="hero-play" id="heroPlay" hidden aria-label="Watch the video">
    <span class="hero-play-icon"></span>
    <span class="hero-play-label">Watch video</span>
  </button>
  <div class="hero-footer">
    <div class="hero-footer-left">
      <strong>Arxon Gomperts</strong>
      <span>Windsurfer <i>|</i> Competitor <i>|</i> Ambassador</span>
    </div>
    <div class="hero-footer-right">More than a sport.<br>A brighter tomorrow.</div>
  </div>
</section>
```

- [ ] **Step 2: Style it**

Add to the homepage inline `<style>`:

```css
.hero { position: relative; min-height: 100vh; display: flex; align-items: center; overflow: hidden; }
.hero-media { position: absolute; inset: 0; z-index: 0; }
.hero-media img { width: 100%; height: 100%; object-fit: cover; }
.hero-media::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(100deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.55) 45%, rgba(10,10,10,0.25) 100%);
}
.hero-inner { position: relative; z-index: 2; padding: 0 clamp(24px, 6vw, 96px); max-width: 780px; }
.hero-title { font-size: clamp(44px, 7vw, 104px); color: var(--white); margin-bottom: 20px; }
.hero-title span { color: var(--accent); }
.hero-sub {
  font-family: var(--font-mono); font-size: clamp(11px, 1.1vw, 13px);
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted);
  margin-bottom: 32px; line-height: 1.9;
}
.hero-cta { display: inline-flex; align-items: center; gap: 10px; }
.hero-footer {
  position: absolute; z-index: 2; left: 0; right: 0; bottom: 0;
  display: flex; justify-content: space-between; align-items: flex-end;
  padding: clamp(20px, 3vw, 40px) clamp(24px, 6vw, 96px);
  font-family: var(--font-mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
}
.hero-footer-left strong { display: block; color: var(--white); font-weight: 700; margin-bottom: 6px; }
.hero-footer-left span, .hero-footer-right { color: var(--muted); }
.hero-footer-left i { color: var(--border); font-style: normal; margin: 0 6px; }
.hero-footer-right { text-align: right; line-height: 1.8; }
.hero-play {
  position: absolute; z-index: 2; left: 50%; top: 50%; transform: translate(-50%, -50%);
  background: none; border: none; color: var(--white); cursor: none;
  display: flex; flex-direction: column; align-items: center; gap: 14px;
}
.hero-play[hidden] { display: none; }
.hero-play-icon {
  width: 64px; height: 64px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.7);
  display: grid; place-items: center; transition: background 0.3s, border-color 0.3s;
}
.hero-play-icon::after {
  content: ''; border-left: 14px solid var(--white);
  border-top: 9px solid transparent; border-bottom: 9px solid transparent; margin-left: 4px;
}
.hero-play:hover .hero-play-icon { background: var(--accent); border-color: var(--accent); }
.hero-play:hover .hero-play-icon::after { border-left-color: var(--black); }
.hero-play-label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; }
@media (max-width: 900px) {
  .hero-play { top: auto; bottom: 22%; }
  .hero-footer { flex-direction: column; align-items: flex-start; gap: 14px; }
  .hero-footer-right { text-align: left; }
}
```

- [ ] **Step 3: Gate the play button on a real video existing**

Add to the homepage inline `<script>`:

```js
// TODO(client): no hero video supplied yet. Set HERO_VIDEO to a file path or
// embed URL and the play button appears. Left empty, the button stays hidden
// rather than shipping a control that promises a video and delivers nothing.
const HERO_VIDEO = '';
if (HERO_VIDEO) {
  const play = document.getElementById('heroPlay');
  play.hidden = false;
  play.addEventListener('click', () => window.open(HERO_VIDEO, '_blank', 'noopener'));
}
```

- [ ] **Step 4: Verify**

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --screenshot=/tmp/arxon-hero.png \
  --window-size=1440,900 --hide-scrollbars "file://$PWD/index.html"
node scripts/check-links.mjs .
```

Expected: checker OK. Screenshot shows the headline left with "world stage." in cyan, the sunset photo behind a left-weighted dark gradient, the CTA, and the bottom bar. No play button, because `HERO_VIDEO` is empty.

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "Build homepage hero"
```

---

### Task 5: Sponsor logo bar

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: the 15 files in `sponsors/`.
- Produces: `.logobar` section, placed directly after `.hero`.

- [ ] **Step 1: Add the markup**

The wireframe shows six fixed slots. There are fifteen real sponsors, so this is a marquee. The first set carries real `alt` text; the duplicate set is `aria-hidden` so screen readers hear each sponsor once.

```html
<section class="logobar" aria-label="Sponsors and partners">
  <div class="logobar-track">
    <!-- set 1 -->
    <div class="logobar-item"><img src="sponsors/north-sails.png" alt="North Sails" loading="lazy"></div>
    <div class="logobar-item light-bg"><img src="sponsors/mysharxon.png" alt="MySharxon" loading="lazy"></div>
    <div class="logobar-item"><img src="sponsors/heroms.png" alt="Heroms" loading="lazy"></div>
    <div class="logobar-item light-bg"><img src="sponsors/ibo.png" alt="IBO" loading="lazy"></div>
    <div class="logobar-item"><img src="sponsors/frans-paradise.png" alt="Frans Paradise" loading="lazy"></div>
    <div class="logobar-item"><img src="sponsors/paradise-rentals.png" alt="Paradise Rentals" loading="lazy"></div>
    <div class="logobar-item light-bg"><img src="sponsors/inebon.png" alt="INEBON" loading="lazy"></div>
    <div class="logobar-item"><img src="sponsors/concilium.png" alt="Concilium" loading="lazy"></div>
    <div class="logobar-item light-bg"><img src="sponsors/rocargo.png" alt="Rocargo" loading="lazy"></div>
    <div class="logobar-item"><img src="sponsors/ead.png" alt="EAD" loading="lazy"></div>
    <div class="logobar-item light-bg"><img src="sponsors/dsg.png" alt="DSG" loading="lazy"></div>
    <div class="logobar-item"><img src="sponsors/bbx.png" alt="BBX" loading="lazy"></div>
    <div class="logobar-item"><img src="sponsors/manno.png" alt="Manno" loading="lazy"></div>
    <div class="logobar-item light-bg"><img src="sponsors/play-learn-grow.png" alt="Play, Learn, Grow Together" loading="lazy"></div>
    <div class="logobar-item"><img src="sponsors/ontrack.png" alt="OnTrack" loading="lazy"></div>
    <!-- set 2, duplicate for a seamless loop -->
    <!-- Repeat all fifteen items verbatim, with alt="" and aria-hidden="true" on each wrapper. -->
  </div>
</section>
```

- [ ] **Step 2: Style it**

```css
.logobar { background: var(--dark); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); overflow: hidden; padding: 28px 0; }
.logobar-track { display: flex; align-items: center; gap: 64px; width: max-content; animation: logobarScroll 48s linear infinite; }
.logobar:hover .logobar-track { animation-play-state: paused; }
.logobar-item { flex: 0 0 auto; height: 34px; display: grid; place-items: center; }
.logobar-item img { max-height: 34px; max-width: 150px; object-fit: contain; filter: grayscale(1) brightness(1.7); opacity: 0.6; transition: filter 0.3s, opacity 0.3s; }
.logobar-item:hover img { filter: grayscale(0) brightness(1); opacity: 1; }
.logobar-item.light-bg { background: rgba(255,255,255,0.92); border-radius: 6px; padding: 6px 14px; height: auto; }
.logobar-item.light-bg img { filter: none; opacity: 0.75; }
.logobar-item.light-bg:hover img { opacity: 1; }
@keyframes logobarScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) {
  .logobar-track { animation: none; }
  .logobar { overflow-x: auto; }
}
```

The `translateX(-50%)` end state is why the duplicate set must be an exact copy. If the sets differ in width the loop visibly jumps.

- [ ] **Step 3: Verify**

```bash
node scripts/check-links.mjs .
```

Expected: OK, proving all thirty `sponsors/` references resolve. Then open `index.html` in a real browser and watch one full loop confirming no jump at the wrap point.

- [ ] **Step 4: Commit**

```bash
git add index.html && git commit -m "Add sponsor logo bar to homepage"
```

---

### Task 6: Accomplishments

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `.display-head`, `.section-label`, `.reveal`.
- Produces: `.accolades` section.

- [ ] **Step 1: Add the markup**

Stats are the verified ones per Global Constraints, not the wireframe's.

```html
<section class="accolades">
  <div class="accolades-head">
    <h2 class="display-head reveal">Accomplishments</h2>
    <div class="section-label reveal">Results <i>&middot;</i> Progression <i>&middot;</i> A global stage</div>
  </div>
  <div class="accolades-grid">
    <figure class="accolade reveal">
      <img src="arxon-portrait-celebrate.jpg" alt="Arxon Gomperts on the podium" loading="lazy">
      <figcaption><span class="accolade-num">2&times;</span> World Champion</figcaption>
    </figure>
    <figure class="accolade reveal reveal-delay-1">
      <img src="arxon-action-carve.jpg" alt="Arxon Gomperts carving at speed" loading="lazy">
      <figcaption><span class="accolade-num">4</span> World Cup Wins</figcaption>
    </figure>
    <figure class="accolade reveal reveal-delay-2">
      <img src="arxon-aerial-reef-01.jpg" alt="Aerial view of Arxon Gomperts on open water" loading="lazy">
      <figcaption><span class="accolade-num">5+</span> International Podiums</figcaption>
    </figure>
  </div>
  <p class="accolades-foot reveal">Competing in world championships, international divisions and races around the globe.</p>
</section>
<!-- TODO(client): "2x World Champion" is sponsor-billed and the title years are
     unconfirmed. Confirm or soften before any press push. -->
```

- [ ] **Step 2: Style it**

```css
.accolades { padding: clamp(64px, 9vw, 120px) clamp(24px, 6vw, 96px); }
.accolades-head { display: flex; justify-content: space-between; align-items: baseline; gap: 24px; flex-wrap: wrap; margin-bottom: 36px; }
.accolades-head h2 { font-size: clamp(34px, 5vw, 64px); color: var(--white); }
.accolades-head .section-label i { color: var(--border); font-style: normal; margin: 0 8px; }
.accolades-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.accolade { position: relative; margin: 0; aspect-ratio: 4 / 3; overflow: hidden; border-radius: 4px; }
.accolade img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.7s cubic-bezier(0.23,1,0.32,1); }
.accolade:hover img { transform: scale(1.05); }
.accolade figcaption {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 20px;
  background: linear-gradient(to top, rgba(10,10,10,0.9), transparent);
  font-family: var(--font-display); font-size: clamp(18px, 1.8vw, 26px);
  letter-spacing: 0.04em; color: var(--white);
}
.accolade figcaption::before { content: ''; display: block; width: 26px; height: 2px; background: var(--accent); margin-bottom: 10px; }
.accolade-num { color: var(--accent); }
.accolades-foot { text-align: center; margin-top: 30px; color: var(--muted); font-size: 14px; }
@media (max-width: 900px) { .accolades-grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 3: Verify**

```bash
node scripts/check-links.mjs .
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --screenshot=/tmp/arxon-accolades.png --window-size=1440,2400 --hide-scrollbars "file://$PWD/index.html"
```

Expected: checker OK. Screenshot shows three photo cards, each with a cyan rule above a stat caption.

- [ ] **Step 4: Commit**

```bash
git add index.html && git commit -m "Add accomplishments section"
```

---

### Task 7: Sponsorship Ways

**Files:**
- Modify: `index.html`

**Interfaces:**
- Produces: `.ways` section with `.way` rows that expand on click.

- [ ] **Step 1: Add the markup**

Each row is a `<button>` controlling a panel, so keyboard and screen-reader users get the same affordance as mouse users.

```html
<section class="ways">
  <div class="ways-media">
    <img src="arxon-action-solo.jpg" alt="Arxon Gomperts racing a fully powered slalom sail" loading="lazy">
  </div>
  <div class="ways-body">
    <div class="ways-head">
      <h2 class="display-head reveal">Sponsorship Ways</h2>
      <div class="section-label reveal">Real exposure.<br>Real opportunities.</div>
    </div>
    <div class="ways-list">
      <div class="way reveal">
        <button class="way-trigger" aria-expanded="false" aria-controls="way-1">
          <span class="way-icon" aria-hidden="true">&#9651;</span>
          <span class="way-label">Sail, board &amp; equipment</span>
          <span class="way-chev" aria-hidden="true">&rsaquo;</span>
        </button>
        <div class="way-panel" id="way-1" hidden>
          <p>Put your brand on the gear that crosses the finish line. Sail, board and fin branding travels to every event on the calendar and lands in every race photo.</p>
        </div>
      </div>
      <div class="way reveal reveal-delay-1">
        <button class="way-trigger" aria-expanded="false" aria-controls="way-2">
          <span class="way-icon" aria-hidden="true">&#9650;</span>
          <span class="way-label">Team kit &amp; athlete wear</span>
          <span class="way-chev" aria-hidden="true">&rsaquo;</span>
        </button>
        <div class="way-panel" id="way-2" hidden>
          <p>Race jerseys, training kit and podium wear. Your logo on the athlete, on the water and on the podium, in front of event media and international crowds.</p>
        </div>
      </div>
      <div class="way reveal reveal-delay-2">
        <button class="way-trigger" aria-expanded="false" aria-controls="way-3">
          <span class="way-icon" aria-hidden="true">&#9633;</span>
          <span class="way-label">Digital sponsorship / UGC / social</span>
          <span class="way-chev" aria-hidden="true">&rsaquo;</span>
        </button>
        <div class="way-panel" id="way-3" hidden>
          <p>Dedicated posts, reels and behind-the-scenes content from training in Bonaire and racing abroad. Built for your channels as much as his.</p>
        </div>
      </div>
    </div>
    <a href="contact.html" class="btn-primary reveal">Become a Partner <span>&rarr;</span></a>
  </div>
</section>
```

Correct the icon entities to plain glyphs if any fail to render: use `&#9651;` (triangle), `&#128085;` is not available in all fonts so prefer a simple `&#9650;`, and `&#9633;` (square). Verify visually in Step 3 and substitute inline SVG if a glyph shows as tofu.

- [ ] **Step 2: Style and wire it**

```css
.ways { display: grid; grid-template-columns: 1fr 1fr; align-items: stretch; background: var(--black); }
.ways-media { position: relative; min-height: 460px; }
.ways-media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ways-body { padding: clamp(40px, 6vw, 88px) clamp(24px, 5vw, 72px); display: flex; flex-direction: column; justify-content: center; gap: 26px; }
.ways-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
.ways-head h2 { font-size: clamp(30px, 3.4vw, 48px); color: var(--white); }
.ways-head .section-label { text-align: right; line-height: 1.9; }
.ways-list { display: flex; flex-direction: column; gap: 12px; }
.way { border: 1px solid var(--border); border-radius: 4px; background: rgba(255,255,255,0.02); transition: border-color 0.3s; }
.way:hover { border-color: rgba(0,229,255,0.4); }
.way-trigger { width: 100%; display: flex; align-items: center; gap: 16px; padding: 18px 20px; background: none; border: none; color: var(--white); font-family: var(--font-body); font-size: 15px; text-align: left; cursor: none; }
.way-icon { color: var(--accent); font-size: 18px; width: 24px; }
.way-label { flex: 1; }
.way-chev { color: var(--muted); font-size: 22px; transition: transform 0.3s, color 0.3s; }
.way-trigger[aria-expanded="true"] .way-chev { transform: rotate(90deg); color: var(--accent); }
.way-panel { padding: 0 20px 20px 60px; color: var(--muted); font-size: 14px; line-height: 1.8; }
.way-panel[hidden] { display: none; }
@media (max-width: 900px) {
  .ways { grid-template-columns: 1fr; }
  .ways-media { min-height: 300px; }
  .ways-head .section-label { text-align: left; }
}
```

```js
// Sponsorship ways: one open at a time.
document.querySelectorAll('.way-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    const open = trigger.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('.way-trigger').forEach(t => {
      t.setAttribute('aria-expanded', 'false');
      document.getElementById(t.getAttribute('aria-controls')).hidden = true;
    });
    if (!open) { trigger.setAttribute('aria-expanded', 'true'); panel.hidden = false; }
  });
});
```

- [ ] **Step 3: Verify**

Open `index.html` in a browser. Click each of the three rows: it opens, the chevron rotates, and the previously open row closes. Tab to a row and press Enter: same behaviour. Confirm no icon renders as a tofu box.

- [ ] **Step 4: Commit**

```bash
git add index.html && git commit -m "Add sponsorship ways section"
```

---

### Task 8: Reviews

**Files:**
- Modify: `index.html`

**Interfaces:**
- Produces: `.reviews` section.

- [ ] **Step 1: Add the markup**

Attributions stay unnamed. Inventing a named quote from a real person, in particular his coach, would be fabricating a testimonial, so the placeholder is honest about being one.

```html
<section class="reviews">
  <div class="reviews-label">
    <h2 class="display-head reveal">Reviews /<br>Testimonials</h2>
    <div class="section-label reveal">Real people.<br>Real support.<br>Real progress.</div>
  </div>
  <div class="reviews-quotes">
    <blockquote class="reveal">
      <p>"Arxon's dedication and positive attitude make him a special talent. He has the mindset to go far."</p>
      <cite>A mentor</cite>
    </blockquote>
    <blockquote class="reveal reveal-delay-1">
      <p>"A true professional and a great representative for our brand. Arxon delivers on and off the water."</p>
      <cite>A sponsor</cite>
    </blockquote>
  </div>
  <div class="reviews-photo reveal">
    <img src="arxon-portrait-celebrate.jpg" alt="Arxon Gomperts celebrating a win" loading="lazy">
  </div>
</section>
<!-- TODO(client): both quotes are placeholders and the attributions are
     deliberately unnamed. Replace with real quotes and real names before launch.
     Do not attach these words to a named person. -->
```

- [ ] **Step 2: Style it**

```css
.reviews { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 0; background: var(--dark); border-top: 1px solid var(--border); align-items: stretch; }
.reviews-label { padding: clamp(36px, 5vw, 64px) clamp(24px, 4vw, 48px); display: flex; flex-direction: column; gap: 18px; justify-content: center; }
.reviews-label h2 { font-size: clamp(24px, 2.6vw, 38px); color: var(--white); }
.reviews-label .section-label { line-height: 2; }
.reviews-quotes { display: grid; grid-template-columns: 1fr 1fr; border-left: 1px solid var(--border); }
.reviews-quotes blockquote { margin: 0; padding: clamp(36px, 5vw, 64px) clamp(20px, 2.6vw, 40px); display: flex; flex-direction: column; justify-content: center; gap: 22px; }
.reviews-quotes blockquote + blockquote { border-left: 1px solid var(--border); }
.reviews-quotes p { font-size: 15px; line-height: 1.85; font-style: italic; color: rgba(245,245,245,0.82); }
.reviews-quotes cite { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); font-style: normal; }
.reviews-quotes cite::before { content: ''; display: block; width: 26px; height: 2px; background: var(--accent); margin-bottom: 12px; }
.reviews-photo { position: relative; min-height: 260px; }
.reviews-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
@media (max-width: 900px) {
  .reviews { grid-template-columns: 1fr; }
  .reviews-quotes { grid-template-columns: 1fr; border-left: none; border-top: 1px solid var(--border); }
  .reviews-quotes blockquote + blockquote { border-left: none; border-top: 1px solid var(--border); }
}
```

- [ ] **Step 3: Verify**

Screenshot at 1440 and at 390 wide. Expected: three columns on desktop collapsing to a single stack on mobile, with dividers moving from vertical to horizontal.

- [ ] **Step 4: Commit**

```bash
git add index.html && git commit -m "Add reviews section"
```

---

### Task 9: Portfolio with tabs and carousel

**Files:**
- Modify: `index.html`

**Interfaces:**
- Produces: `.portfolio` section. Tab state drives which slide set the carousel shows.

- [ ] **Step 1: Add the markup**

```html
<section class="portfolio">
  <div class="portfolio-head">
    <h2 class="display-head reveal">Portfolio</h2>
    <div class="portfolio-tabs reveal" role="tablist">
      <button class="ptab is-active" role="tab" aria-selected="true" data-set="gear">Gear</button>
      <button class="ptab" role="tab" aria-selected="false" data-set="races">Races</button>
      <button class="ptab" role="tab" aria-selected="false" data-set="momentum">Momentum</button>
    </div>
  </div>
  <div class="portfolio-grid">
    <div class="portfolio-carousel">
      <div class="pcar-viewport"><img id="pcarImg" src="arxon-aerial-reef-01.jpg" alt="" loading="lazy"></div>
      <button class="pcar-arrow pcar-prev" id="pcarPrev" aria-label="Previous image">&lsaquo;</button>
      <button class="pcar-arrow pcar-next" id="pcarNext" aria-label="Next image">&rsaquo;</button>
      <div class="pcar-dots" id="pcarDots"></div>
    </div>
    <div class="portfolio-copy">
      <h3 class="reveal">Performance. Travel. Progress.</h3>
      <p class="reveal">A look into my gear, racing moments and life on tour. Follow the journey and see what drives me forward.</p>
      <div class="portfolio-stats reveal">
        <div><span class="counter" data-target="4">0</span><i>+</i><small>Countries</small></div>
        <div><span class="counter" data-target="6">0</span><i>+</i><small>World Cup Events</small></div>
        <div><span class="counter" data-target="5">0</span><i>+</i><small>Podiums</small></div>
      </div>
    </div>
  </div>
</section>
<!-- TODO(client): the wireframe asked for 20+ countries, 50+ races and 1M+
     online reach. Those contradict the verified figures used here. Confirm the
     real numbers and swap them in. -->
```

- [ ] **Step 2: Wire the tabs and carousel**

```js
// Portfolio: three named slide sets, one carousel.
const PORTFOLIO_SETS = {
  gear:     ['arxon-action-solo.jpg', 'arxon-action-carve.jpg', 'arxon-water-thumbsup.jpg'],
  races:    ['arxon-action-duo.jpg', 'arxon-portrait-celebrate.jpg', 'arxon-jump-splash.jpg'],
  momentum: ['arxon-aerial-reef-01.jpg', 'arxon-aerial-shallow.jpg', 'arxon-jump-airborne.jpg'],
};

const pcarImg = document.getElementById('pcarImg');
const pcarDots = document.getElementById('pcarDots');
let pcarSet = 'gear';
let pcarIndex = 0;

function pcarRender() {
  const slides = PORTFOLIO_SETS[pcarSet];
  pcarIndex = (pcarIndex + slides.length) % slides.length;
  pcarImg.src = slides[pcarIndex];
  pcarImg.alt = `${pcarSet} image ${pcarIndex + 1} of ${slides.length}`;
  pcarDots.innerHTML = slides
    .map((_, i) => `<button class="pcar-dot${i === pcarIndex ? ' is-active' : ''}" data-i="${i}" aria-label="Go to image ${i + 1}"></button>`)
    .join('');
}

document.getElementById('pcarPrev').addEventListener('click', () => { pcarIndex--; pcarRender(); });
document.getElementById('pcarNext').addEventListener('click', () => { pcarIndex++; pcarRender(); });
pcarDots.addEventListener('click', e => {
  const dot = e.target.closest('.pcar-dot');
  if (dot) { pcarIndex = Number(dot.dataset.i); pcarRender(); }
});
document.querySelectorAll('.ptab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ptab').forEach(t => {
      t.classList.remove('is-active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('is-active');
    tab.setAttribute('aria-selected', 'true');
    pcarSet = tab.dataset.set;
    pcarIndex = 0;
    pcarRender();
  });
});
pcarRender();
```

- [ ] **Step 3: Style it**

```css
.portfolio { padding: clamp(64px, 9vw, 120px) clamp(24px, 6vw, 96px); background: var(--black); }
.portfolio-head { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; margin-bottom: 32px; }
.portfolio-head h2 { font-size: clamp(34px, 5vw, 64px); color: var(--white); }
.portfolio-tabs { display: flex; gap: 8px; }
.ptab { padding: 11px 26px; border: 1px solid var(--border); background: none; color: var(--muted); font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; cursor: none; transition: all 0.25s; }
.ptab.is-active { background: var(--accent); border-color: var(--accent); color: var(--black); }
.portfolio-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: clamp(28px, 4vw, 64px); align-items: center; }
.portfolio-carousel { position: relative; }
.pcar-viewport { aspect-ratio: 16 / 10; overflow: hidden; border-radius: 4px; background: var(--panel); }
.pcar-viewport img { width: 100%; height: 100%; object-fit: cover; }
.pcar-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 42px; height: 42px; border-radius: 50%; border: 1px solid var(--border); background: rgba(10,10,10,0.6); color: var(--white); font-size: 22px; cursor: none; transition: background 0.25s, border-color 0.25s; }
.pcar-arrow:hover { background: var(--accent); border-color: var(--accent); color: var(--black); }
.pcar-prev { left: 14px; } .pcar-next { right: 14px; }
.pcar-dots { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); display: flex; gap: 7px; }
.pcar-dot { width: 7px; height: 7px; border-radius: 50%; border: none; background: rgba(255,255,255,0.35); cursor: none; padding: 0; }
.pcar-dot.is-active { background: var(--accent); }
.portfolio-copy h3 { font-family: var(--font-body); font-weight: 500; font-size: clamp(19px, 1.8vw, 24px); margin-bottom: 14px; }
.portfolio-copy p { color: var(--muted); line-height: 1.85; font-size: 14px; margin-bottom: 30px; }
.portfolio-stats { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--border); padding-top: 24px; }
.portfolio-stats > div { text-align: center; }
.portfolio-stats > div + div { border-left: 1px solid var(--border); }
.portfolio-stats span, .portfolio-stats i { font-family: var(--font-display); font-size: clamp(28px, 3vw, 40px); color: var(--white); font-style: normal; }
.portfolio-stats small { display: block; margin-top: 6px; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
@media (max-width: 900px) { .portfolio-grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 4: Verify**

```bash
node scripts/check-links.mjs .
```

Expected: OK. Note this does NOT cover the nine filenames in `PORTFOLIO_SETS`, because they live in JS. Verify those by hand:

```bash
for f in arxon-action-solo arxon-action-carve arxon-water-thumbsup arxon-action-duo \
         arxon-portrait-celebrate arxon-jump-splash arxon-aerial-reef-01 \
         arxon-aerial-shallow arxon-jump-airborne; do
  [ -f "$f.jpg" ] || echo "MISSING: $f.jpg"
done
echo "portfolio image check done"
```

Expected: no `MISSING` lines. Then in a browser, click all three tabs and confirm the image, dots and alt text update, and the arrows wrap around at both ends.

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "Add portfolio tabs and carousel"
```

---

### Task 10: Let's Connect and the WhatsApp flow

This is the site's only conversion path, so it gets the most care. There is no backend.

**Files:**
- Modify: `index.html`, `assets/site.js`

**Interfaces:**
- Produces: `window.ARXON_WHATSAPP` (string, digits only, no `+`) and the shared `initWhatsAppForm(formEl)` used by both `index.html` and `contact.html`.

- [ ] **Step 1: Add the shared WhatsApp helper to `assets/site.js`**

```js
// TODO(client): real WhatsApp number required. Digits only, country code first,
// no plus sign and no spaces. Example for a Dutch mobile: '31612345678'.
// While this is empty, the form warns instead of opening a dead wa.me link.
window.ARXON_WHATSAPP = '';

function initWhatsAppForm(form) {
  if (!form) return;
  const note = form.querySelector('.wa-note');
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!window.ARXON_WHATSAPP) {
      if (note) note.textContent = 'WhatsApp is not configured yet.';
      return;
    }
    const name = form.querySelector('[name="name"]').value.trim();
    const msg = form.querySelector('[name="message"]').value.trim();
    const text = `Hi Arxon, this is ${name || 'someone'} reaching out via arxongomperts.com.` + (msg ? `\n\n${msg}` : '');
    window.open(`https://wa.me/${window.ARXON_WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
}
window.initWhatsAppForm = initWhatsAppForm;
```

- [ ] **Step 2: Add the markup**

```html
<section class="connect">
  <div class="connect-intro">
    <h2 class="display-head reveal">Let's Connect</h2>
    <div class="section-label reveal">Sponsorships. Collaborations. Opportunities.<br>Chat directly with Arxon.</div>
  </div>
  <form class="connect-form reveal" id="connectForm" novalidate>
    <input type="text" name="name" placeholder="Name" autocomplete="name">
    <textarea name="message" placeholder="Message (optional)" rows="2"></textarea>
    <p class="wa-note" role="status"></p>
  </form>
  <button type="submit" form="connectForm" class="btn-whatsapp reveal">
    <span class="wa-icon" aria-hidden="true">&#9993;</span>
    Continue in WhatsApp <span>&rarr;</span>
  </button>
</section>
```

The button sits outside the `<form>` and binds via `form="connectForm"`, which is how the wireframe's layout puts it in its own column while keeping it a real submit button.

- [ ] **Step 3: Style and initialise**

```css
.connect { display: grid; grid-template-columns: 1fr 1.1fr 1fr; gap: clamp(24px, 3vw, 48px); align-items: center; padding: clamp(56px, 7vw, 96px) clamp(24px, 6vw, 96px); background: var(--dark); border-top: 1px solid var(--border); }
.connect-intro h2 { font-size: clamp(28px, 3.4vw, 46px); color: var(--white); margin-bottom: 14px; }
.connect-intro .section-label { line-height: 1.9; }
.connect-form { display: flex; flex-direction: column; gap: 10px; }
.connect-form input, .connect-form textarea { width: 100%; padding: 15px 18px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 3px; color: var(--white); font-family: var(--font-body); font-size: 14px; resize: none; }
.connect-form input::placeholder, .connect-form textarea::placeholder { color: var(--muted); }
.connect-form input:focus, .connect-form textarea:focus { outline: none; border-color: var(--accent); }
.wa-note { min-height: 16px; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent2); }
.btn-whatsapp { display: inline-flex; align-items: center; justify-content: center; gap: 12px; padding: 20px 30px; background: var(--accent); border: none; color: var(--black); font-family: var(--font-mono); font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; cursor: none; transition: filter 0.25s; }
.btn-whatsapp:hover { filter: brightness(1.12); }
.wa-icon { font-size: 17px; }
@media (max-width: 900px) { .connect { grid-template-columns: 1fr; } }
```

```js
initWhatsAppForm(document.getElementById('connectForm'));
```

- [ ] **Step 4: Verify both branches**

In a browser with `ARXON_WHATSAPP` empty, type a name and submit. Expected: no new tab opens, and the note reads "WhatsApp is not configured yet." Then temporarily set it to `31612345678` in the console and resubmit. Expected: a `wa.me` tab opens with the name interpolated into the prefilled text. Reset to empty afterwards.

- [ ] **Step 5: Confirm no email survived**

```bash
grep -rn "arxon@email.com\|mailto:" --include=*.html . || echo "CLEAN: no email on the site"
```

Expected: `CLEAN: no email on the site`.

- [ ] **Step 6: Commit**

```bash
git add index.html assets/site.js && git commit -m "Add Let's Connect section with WhatsApp flow"
```

---

### Task 11: about.html

**Files:**
- Modify: `about.html`

- [ ] **Step 1: Fill `<main>`**

Copy carries over from the current `#about` section with em-dashes removed per Global Constraints.

```html
<main class="page">
  <header class="page-head">
    <div class="section-label reveal">Who I am</div>
    <h1 class="display-head reveal">Built by<br><span>the wind</span></h1>
  </header>
  <div class="about-grid">
    <div class="about-copy">
      <p class="reveal">Arxon Gomperts is a professional windsurfer specialising in fin slalom racing. Driven by a relentless passion for speed and technical mastery, he has been pushing his limits on international waters since a young age.</p>
      <p class="reveal">Powering a fully loaded slalom sail through tactical buoy racing and blazing downwind runs, Arxon brings raw commitment, precision, and a hunger to reach the top of the sport.</p>
      <p class="reveal">He trains out of Lac Bay in Bonaire and races sail number NB-2011 on the international youth circuit.</p>
      <div class="about-tags reveal">
        <span>Fin Slalom</span><span>Buoy Racing</span><span>Downwind</span><span>Speed</span><span>Open Water</span>
      </div>
      <a href="contact.html" class="btn-primary reveal">Become a Partner <span>&rarr;</span></a>
    </div>
    <div class="about-photo reveal">
      <img src="arxon-portrait-armscrossed.jpg" alt="Portrait of Arxon Gomperts" loading="lazy">
    </div>
  </div>
</main>
```

- [ ] **Step 2: Add page CSS in an inline `<style>` block**

```css
.page { padding: clamp(110px, 12vw, 170px) clamp(24px, 6vw, 96px) clamp(64px, 8vw, 110px); }
.page-head { margin-bottom: clamp(32px, 4vw, 56px); }
.page-head h1 { font-size: clamp(40px, 6vw, 84px); color: var(--white); margin-top: 12px; }
.page-head h1 span { color: var(--accent); }
.about-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: clamp(28px, 4vw, 64px); align-items: start; }
.about-copy p { color: var(--muted); line-height: 1.9; margin-bottom: 20px; }
.about-tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 26px 0 30px; }
.about-tags span { padding: 8px 16px; border: 1px solid var(--border); border-radius: 100px; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
.about-photo img { width: 100%; border-radius: 4px; }
@media (max-width: 900px) { .about-grid { grid-template-columns: 1fr; } }
```

The generous `padding-top` clears the fixed nav. Every sub-page reuses `.page`, so this block moves to `assets/style.css` in Task 16 once all five pages confirm they want the same treatment.

- [ ] **Step 3: Verify**

```bash
node scripts/check-links.mjs .
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --screenshot=/tmp/arxon-about.png --window-size=1440,1400 --hide-scrollbars "file://$PWD/about.html"
```

Expected: checker OK, and the heading is not hidden behind the nav.

- [ ] **Step 4: Commit**

```bash
git add about.html && git commit -m "Build about page"
```

---

### Task 12: races.html

The results table is the strongest credibility asset on the site. It moves here intact, filter and all.

**Files:**
- Modify: `races.html`
- Remove from: `index.html` (the old `#stats` and `#results` markup, CSS and the results-filter JS still parked in the inline block from Task 2)

- [ ] **Step 1: Move the markup**

Move the `<table class="results-table" id="resultsTable">` block and the four `.stat-card` elements out of `index.html` into `races.html`'s `<main class="page">`, under this header:

```html
<header class="page-head">
  <div class="section-label reveal">Competition results</div>
  <h1 class="display-head reveal">Races &amp;<br><span>results</span></h1>
</header>
```

Keep the year filter buttons (All / 2026 / 2025 / 2024), the six result rows, and the "Results verified via PWA World Tour and event reports" note. Rewrite that note without its em-dash.

- [ ] **Step 2: Move the CSS and JS**

Move the STATS (`561-660`) and RESULTS (`1131-1236`) CSS blocks, and the RESULTS FILTER JS, from `index.html`'s inline blocks into `races.html`'s inline blocks. Delete them from `index.html`.

- [ ] **Step 3: Verify the filter still works**

Open `races.html`. Click 2026: one row. Click 2025: four rows. Click 2024: one row. Click All: six rows. Confirm the counters in the stat cards still count up on scroll, which proves `assets/site.js` reaches this page.

- [ ] **Step 4: Confirm the homepage lost nothing it still needs**

```bash
node scripts/check-links.mjs .
grep -c "resultsTable\|stat-card" index.html
```

Expected: checker OK, and the grep returns `0`.

- [ ] **Step 5: Commit**

```bash
git add races.html index.html && git commit -m "Build races page with results table and career stats"
```

---

### Task 13: sponsorship.html

**Files:**
- Modify: `sponsorship.html`

- [ ] **Step 1: Fill `<main>`**

```html
<main class="page">
  <header class="page-head">
    <div class="section-label reveal">Partnership</div>
    <h1 class="display-head reveal">Three ways to<br><span>work together</span></h1>
  </header>
  <div class="tier-grid">
    <article class="tier reveal">
      <div class="tier-icon" aria-hidden="true">&#9651;</div>
      <h2>Sail, board &amp; equipment</h2>
      <p>Put your brand on the gear that crosses the finish line. Sail, board and fin branding travels to every event on the calendar and lands in every race photo and event report.</p>
    </article>
    <article class="tier reveal reveal-delay-1">
      <div class="tier-icon" aria-hidden="true">&#9650;</div>
      <h2>Team kit &amp; athlete wear</h2>
      <p>Race jerseys, training kit and podium wear. Your logo on the athlete, on the water and on the podium, in front of event media and international crowds.</p>
    </article>
    <article class="tier reveal reveal-delay-2">
      <div class="tier-icon" aria-hidden="true">&#9633;</div>
      <h2>Digital sponsorship / UGC / social</h2>
      <p>Dedicated posts, reels and behind-the-scenes content from training in Bonaire and racing abroad. Built for your channels as much as his.</p>
    </article>
  </div>
  <section class="wall">
    <div class="section-label reveal">Current partners</div>
    <div class="wall-grid reveal">
      <!-- All fifteen sponsors/*.png as <div class="wall-item"><img ...></div>,
           carrying the same light-bg class assignments used in Task 5. -->
    </div>
  </section>
  <section class="partner-cta reveal">
    <h2 class="display-head">Become a partner</h2>
    <p>Support a rising international windsurfer. Get your brand on the water.</p>
    <a href="contact.html" class="btn-primary">Start the conversation <span>&rarr;</span></a>
  </section>
</main>
```

- [ ] **Step 2: Add page CSS**

```css
.tier-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: clamp(48px, 7vw, 90px); }
.tier { border: 1px solid var(--border); border-radius: 4px; padding: clamp(24px, 3vw, 38px); background: rgba(255,255,255,0.02); transition: border-color 0.3s; }
.tier:hover { border-color: rgba(0,229,255,0.4); }
.tier-icon { font-size: 26px; color: var(--accent); margin-bottom: 18px; }
.tier h2 { font-family: var(--font-body); font-weight: 500; font-size: 18px; margin-bottom: 12px; }
.tier p { color: var(--muted); font-size: 14px; line-height: 1.85; }
.wall { margin-bottom: clamp(48px, 7vw, 90px); }
.wall-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin-top: 22px; }
.wall-item { aspect-ratio: 5 / 2; display: grid; place-items: center; border: 1px solid var(--border); border-radius: 4px; padding: 14px; }
.wall-item img { max-width: 100%; max-height: 100%; object-fit: contain; filter: grayscale(1) brightness(1.7); opacity: 0.6; transition: filter 0.3s, opacity 0.3s; }
.wall-item:hover img { filter: grayscale(0) brightness(1); opacity: 1; }
.wall-item.light-bg { background: rgba(255,255,255,0.92); }
.wall-item.light-bg img { filter: none; opacity: 0.8; }
.partner-cta { text-align: center; border: 1px solid var(--border); border-radius: 4px; padding: clamp(36px, 5vw, 64px); }
.partner-cta h2 { font-size: clamp(28px, 3.4vw, 44px); color: var(--white); display: inline-block; }
.partner-cta p { color: var(--muted); margin: 14px 0 26px; }
@media (max-width: 900px) { .tier-grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 3: Verify**

```bash
node scripts/check-links.mjs .
```

Expected: OK, proving all fifteen wall logos resolve. Confirm visually that no logo is squashed, since `object-fit: contain` plus a fixed aspect ratio is what prevents the distortion bug that hit the Little John site.

- [ ] **Step 4: Commit**

```bash
git add sponsorship.html && git commit -m "Build sponsorship page"
```

---

### Task 14: news.html

Per the spec, this is a curated card grid, not a live embed. Instagram removed public profile-feed embedding, and the alternatives need either a server this static site does not have or a paid third-party script.

**Files:**
- Modify: `news.html`

- [ ] **Step 1: Fill `<main>`**

```html
<main class="page">
  <header class="page-head">
    <div class="section-label reveal">From the water</div>
    <h1 class="display-head reveal">News &amp;<br><span>updates</span></h1>
  </header>
  <div class="news-grid">
    <article class="news-card reveal">
      <a href="#" data-todo="client-post-url">
        <img src="arxon-portrait-celebrate.jpg" alt="" loading="lazy">
        <div class="news-meta">
          <time datetime="2026-07">July 2026</time>
          <h2>U17 champion at Aruba Hi-Winds</h2>
        </div>
      </a>
    </article>
    <article class="news-card reveal reveal-delay-1">
      <a href="#" data-todo="client-post-url">
        <img src="arxon-action-duo.jpg" alt="" loading="lazy">
        <div class="news-meta">
          <time datetime="2025-08">August 2025</time>
          <h2>Three world cup wins in a single season</h2>
        </div>
      </a>
    </article>
    <article class="news-card reveal reveal-delay-2">
      <a href="#" data-todo="client-post-url">
        <img src="arxon-aerial-shallow.jpg" alt="" loading="lazy">
        <div class="news-meta">
          <time datetime="2025-06">June 2025</time>
          <h2>Training season on Lac Bay</h2>
        </div>
      </a>
    </article>
  </div>
  <section class="follow-cta reveal">
    <h2 class="display-head">Follow the journey</h2>
    <p>Race updates, training clips and life on tour.</p>
    <a href="#" class="btn-primary" data-todo="client-handle">Follow on Instagram <span>&rarr;</span></a>
  </section>
</main>
<!-- TODO(client): Instagram handle unknown, so every link here is a placeholder
     marked data-todo. The three cards are drawn from real verified results but
     point nowhere until the handle and post URLs arrive. -->
```

- [ ] **Step 2: Add page CSS**

```css
.news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; margin-bottom: clamp(48px, 7vw, 90px); }
.news-card a { display: block; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; text-decoration: none; color: inherit; transition: border-color 0.3s; }
.news-card a:hover { border-color: rgba(0,229,255,0.4); }
.news-card img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; transition: transform 0.7s cubic-bezier(0.23,1,0.32,1); }
.news-card a:hover img { transform: scale(1.04); }
.news-meta { padding: 20px; }
.news-meta time { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); }
.news-meta h2 { font-family: var(--font-body); font-weight: 500; font-size: 16px; margin-top: 10px; line-height: 1.5; }
.follow-cta { text-align: center; border: 1px solid var(--border); border-radius: 4px; padding: clamp(36px, 5vw, 64px); }
.follow-cta h2 { font-size: clamp(28px, 3.4vw, 44px); color: var(--white); display: inline-block; }
.follow-cta p { color: var(--muted); margin: 14px 0 26px; }
```

- [ ] **Step 3: Verify**

```bash
node scripts/check-links.mjs .
grep -c 'data-todo' news.html
```

Expected: checker OK, and the grep returns `4`, confirming every placeholder link is greppable for the handover.

- [ ] **Step 4: Commit**

```bash
git add news.html && git commit -m "Build news page"
```

---

### Task 15: contact.html

**Files:**
- Modify: `contact.html`

**Interfaces:**
- Consumes: `initWhatsAppForm` and `window.ARXON_WHATSAPP` from Task 10.

- [ ] **Step 1: Fill `<main>`**

```html
<main class="page">
  <header class="page-head">
    <div class="section-label reveal">Get in touch</div>
    <h1 class="display-head reveal">Let's<br><span>connect</span></h1>
  </header>
  <div class="contact-grid">
    <div class="contact-copy">
      <p class="reveal">Sponsorship enquiries, media requests, or just want to talk windsurfing. Messages go straight to WhatsApp, so expect a fast reply.</p>
      <ul class="contact-facts reveal">
        <li><span>Based in</span> Bonaire, Caribbean</li>
        <li><span>Sail number</span> NB-2011</li>
        <li><span>Discipline</span> Fin slalom</li>
      </ul>
    </div>
    <form class="contact-form reveal" id="contactForm" novalidate>
      <input type="text" name="name" placeholder="Name" autocomplete="name">
      <textarea name="message" placeholder="Message (optional)" rows="5"></textarea>
      <p class="wa-note" role="status"></p>
      <button type="submit" class="btn-whatsapp">
        <span class="wa-icon" aria-hidden="true">&#9993;</span>
        Continue in WhatsApp <span>&rarr;</span>
      </button>
    </form>
  </div>
</main>
```

- [ ] **Step 2: Add page CSS and initialise**

```css
.contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(28px, 4vw, 64px); align-items: start; }
.contact-copy p { color: var(--muted); line-height: 1.9; margin-bottom: 28px; }
.contact-facts { list-style: none; border-top: 1px solid var(--border); }
.contact-facts li { padding: 15px 0; border-bottom: 1px solid var(--border); font-size: 14px; display: flex; justify-content: space-between; gap: 16px; }
.contact-facts span { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); }
.contact-form { display: flex; flex-direction: column; gap: 10px; }
.contact-form input, .contact-form textarea { width: 100%; padding: 15px 18px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 3px; color: var(--white); font-family: var(--font-body); font-size: 14px; resize: vertical; }
.contact-form input::placeholder, .contact-form textarea::placeholder { color: var(--muted); }
.contact-form input:focus, .contact-form textarea:focus { outline: none; border-color: var(--accent); }
@media (max-width: 900px) { .contact-grid { grid-template-columns: 1fr; } }
```

The `.wa-note` and `.btn-whatsapp` rules are already global by this point. If they are still parked in the homepage's inline block, move them to `assets/style.css` now, because two pages use them.

```js
initWhatsAppForm(document.getElementById('contactForm'));
```

- [ ] **Step 3: Verify**

Open `contact.html`, submit the form, and confirm the same "not configured" note appears as on the homepage, proving the shared helper is reachable from both pages.

- [ ] **Step 4: Commit**

```bash
git add contact.html assets/style.css && git commit -m "Build contact page"
```

---

### Task 16: Dead code removal, full-site verification, and handover

**Files:**
- Modify: `index.html`, `assets/style.css`
- Create: `HANDOVER.md`

- [ ] **Step 1: Delete every trace of the retired story**

```bash
grep -rn "chapter\|story-intro\|storyRail\|pos-bl\|pos-br\|More from the water" --include=*.html --include=*.css --include=*.js . \
  || echo "CLEAN: story fully removed"
```

Expected: `CLEAN: story fully removed`. If anything reports, delete it. Also confirm the dead `DISCIPLINES` CSS never made it into `assets/style.css`.

- [ ] **Step 2: Hoist `.page` and `.page-head` into the shared stylesheet**

All five sub-pages use them. Move the two rules from the per-page inline blocks into `assets/style.css` and delete the duplicates.

- [ ] **Step 3: Run the full verification sweep**

```bash
node scripts/check-links.mjs .
grep -rn "arxon@email.com\|mailto:" --include=*.html . || echo "CLEAN: no email"
grep -rn $'—' --include=*.html . || echo "CLEAN: no em-dashes in copy"
ls CNAME && cat CNAME
```

Expected: checker OK, both CLEAN lines, and `CNAME` still contains `arxongomperts.com`.

- [ ] **Step 4: Screenshot all six pages at desktop and mobile**

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for p in index about races sponsorship news contact; do
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --screenshot="/tmp/arxon-$p-desktop.png" --window-size=1440,2600 "file://$PWD/$p.html"
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --screenshot="/tmp/arxon-$p-mobile.png" --window-size=390,2600 "file://$PWD/$p.html"
done
echo "12 screenshots written to /tmp"
```

Review all twelve. Check specifically for horizontal overflow at 390px and for any image rendering at a distorted aspect ratio. Both have bitten prior builds on this machine.

- [ ] **Step 5: Write `HANDOVER.md`**

```markdown
# Arxon site redesign: what the client still owes us

Branch `redesign/wireframe-2026-09`. Not merged, not deployed.
Every item below ships as a flagged placeholder. Grep `TODO(client)` in the
HTML and `data-todo` on the affected elements.

## Blocking launch

1. **WhatsApp number.** `assets/site.js`, `window.ARXON_WHATSAPP`. Digits only,
   country code first, no plus sign. The entire contact flow is dead until this
   is set, on both the homepage and the contact page.
2. **Instagram handle and post URLs.** `news.html` has three cards and one
   follow button pointing at `#`. Footer socials on all six pages too.

## Needs a decision

3. **Hero video.** `index.html`, `HERO_VIDEO`. Empty, so the play button is
   hidden rather than shipping a control that does nothing. Set it and the
   button appears.
4. **Testimonials.** `index.html`, the reviews section. Both quotes are
   placeholders attributed to "a mentor" and "a sponsor". They were left
   unnamed on purpose: attaching invented words to a real, named person is
   not something to ship. Replace with real quotes and real names.
5. **The stat conflict.** The wireframe claimed 20+ countries, 50+ races and
   1M+ online reach. The build uses the verified figures instead: 4+ countries,
   6+ world cup events, 5+ podiums. Confirm the real numbers.
6. **"2x World Champion".** Sponsor-billed, title years unconfirmed. It appears
   in the accomplishments section. Confirm or soften before any press push.

## Deliberate departures from the wireframe

- **Logo bar** shows the 15 real sponsors as a marquee, not the wireframe's six
  fixed slots (North Sails, Future Fly, bright, Prisma, ION, Duotone). Only
  North Sails overlaps with the real sponsor list.
- **News** is a curated card grid, not a live Instagram feed. Instagram removed
  public profile-feed embedding; a live feed needs either a server this static
  site does not have, or a paid third-party script.
- **No email anywhere.** WhatsApp is the only channel, by request. The old
  `arxon@email.com` placeholder that was live on the previous site is gone.

## Still to come

UI polish, animation and effects, performance, and the accessibility pass are
a separate follow-up, agreed as out of scope for this structural rebuild.
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Remove retired story code, add handover notes"
```

---

## Self-Review

**Spec coverage.** Every spec section maps to a task: architecture and extraction to Task 2; the six-page structure to Task 3; the nine homepage sections to Tasks 4 through 10; the five sub-pages to Tasks 11 through 15; the Instagram substitution to Task 14; the stat conflict to Tasks 6, 9 and 16; the no-email rule to Tasks 10 and 16; the `CNAME` regression risk to Task 16 Step 3; the retired story to Task 16 Step 1; the client TODO list to Task 16 Step 5.

**Placeholder scan.** Every code step carries real code. `TODO(client)` markers are deliberate product artifacts handed to the client, not gaps in the plan, and each is paired with the exact file and identifier to change.

**Type consistency.** `window.ARXON_WHATSAPP` and `initWhatsAppForm` are defined in Task 10 and consumed by the same names in Task 15. `PORTFOLIO_SETS` keys (`gear`, `races`, `momentum`) match the `data-set` attributes on the tabs. `.display-head`, `.section-label`, `.reveal`, `.btn-primary` and `.btn-whatsapp` are defined once and referenced consistently.

**Known gap, deliberately accepted.** `check-links.mjs` parses HTML attributes only, so image paths held in JS (`PORTFOLIO_SETS`) are invisible to it. Task 9 Step 4 covers those with an explicit shell loop rather than growing the checker into a JS parser.
