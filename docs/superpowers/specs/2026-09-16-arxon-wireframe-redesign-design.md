# Arxon Gomperts site: wireframe redesign

Date: 2026-09-16
Status: approved, ready for implementation plan

## Goal

Rebuild arxongomperts.com against a new wireframe that repositions the site from
"athlete portfolio" to "sponsor pitch". Keep the existing brand system exactly.
Structure and content only in this pass. UI polish, animation, and effects are a
separate later pass.

## What is changing

The current site is a single 2,531-line `index.html`, a one-page scroll with a
hero, career stats, a six-chapter pinned scrollytelling story, an about block, a
results table, a sponsor marquee, and a contact section.

The new wireframe is a multi-page site whose homepage leads with a sponsor-facing
headline ("PUT YOUR BRAND ON THE WORLD STAGE") and sells reach rather than
narrating a career.

## Decisions taken

| Question | Decision |
|---|---|
| One page or many | Multi-page: 6 HTML files |
| Six-chapter scrollytelling story | Retired. Recoverable from git history at `6b4bc76` |
| Results table | Kept. Moves to `races.html` with its year filter intact |
| Logo bar contents | The real 15 sponsor logos in `sponsors/`, not the wireframe's brands |
| Missing content | Honest placeholders, flagged in a TODO handed over at the end |
| Sub-page depth | Homepage matches wireframe fully. Others are real and complete but simpler |
| News page | Hand-curated post-card grid, not a third-party widget (see Risks) |
| Contact channel | WhatsApp only. No email address anywhere on the site |

## Architecture

```
arxon/
  index.html          wireframe homepage
  about.html
  races.html
  sponsorship.html
  news.html
  contact.html
  assets/
    style.css         tokens, nav, footer, buttons, typography, reveal system
    site.js           loader, custom cursor, nav, scroll reveal, counters
  sponsors/*.png
  *.jpg
  CNAME
```

Shared CSS and JS are extracted from the current inline blocks into
`assets/style.css` and `assets/site.js`. Each page keeps a small inline `<style>`
block for sections unique to it.

No build step, no package manager, no runtime libraries. Plain relative paths so
GitHub Pages serves the files unchanged. Deployment is identical to today.

### Why extraction is required

Six pages each need the nav, footer, cursor, loader, reveal observer, and the
full token set. Duplicating ~1,700 lines of CSS into six files would guarantee
drift the first time a color or nav item changes. One shared stylesheet is the
only maintainable option.

## Brand system (unchanged)

Carried over verbatim from the current site:

- `--black: #0a0a0a`, `--dark: #111111`, `--panel: #161616`
- `--accent: #00e5ff` (cyan, primary), `--accent2: #ff6b00` (orange, secondary)
- `--white: #f5f5f5`, `--muted: rgba(245,245,245,0.45)`
- Bebas Neue (display), DM Sans (body), Space Mono (labels and micro-copy)
- Custom cursor, page loader, scroll-reveal system

### One deliberate change

The wireframe sets display headings in **oblique** Bebas. The current site is
upright. Display headings gain a slight skew to match. This is the single
largest reason the wireframe reads differently from the current site despite an
identical palette.

### Copy style

No em-dashes in site copy. Existing copy that uses them is rewritten as it moves.

## Homepage sections

1. **Nav.** Sticky, transparent over the hero, solid on scroll. `ARXON.` wordmark
   left, six links center, cyan "BECOME A PARTNER" pill right. Hamburger below
   the tablet breakpoint.

2. **Hero.** Full-bleed `arxon-sunset-01.jpg` under a dark gradient. Headline left:
   "PUT YOUR BRAND ON THE WORLD STAGE." with "WORLD STAGE." in cyan. Mono sub-line
   "HIGH-PERFORMANCE WINDSURFING. GLOBAL REACH. REAL IMPACT." Cyan CTA below.
   Circular play button with "WATCH VIDEO" over the image. Bottom bar: name and
   roles left, "MORE THAN A SPORT. A BRIGHTER TOMORROW." right.

3. **Logo bar.** Full-width strip. All 15 real sponsor logos in an auto-scrolling
   marquee, reusing the existing light-bg treatment for logos that need it.

4. **Accomplishments.** Oblique heading left, mono "RESULTS / PROGRESSION /
   A GLOBAL STAGE" right. Three photo cards, each with a stat overlaid
   bottom-left above a short cyan rule. Centered caption line below.

5. **Sponsorship Ways.** Fifty-fifty split. Full-bleed action photo left. Right:
   heading, "REAL EXPOSURE. REAL OPPORTUNITIES.", three bordered expandable rows
   (sail/board/equipment, team kit and athlete wear, digital/UGC/social), then
   the cyan CTA.

6. **Reviews.** Three columns: label block left, two quotes with a divider
   center, portrait right.

7. **Portfolio.** Heading with Gear / Races / Momentum tabs. Carousel with prev
   and next arrows and dot indicators. Right column carries body copy and a
   three-stat row.

8. **Let's Connect.** Heading and sub-line left, a Name plus Message form center,
   WhatsApp CTA right. The form composes a prefilled WhatsApp message; there is
   no server and no email fallback.

9. **Footer.** `ARXON.` wordmark, role list, social icons, "FOLLOW THE JOURNEY".

## Sub-pages

- **about.html** Bio, portrait, discipline tags, career narrative. Absorbs the
  copy from the current `#about` section.
- **races.html** The verified PWA results table with its year filter, plus the
  career stat cards from the current `#stats` section. This is the strongest
  credibility asset on the site.
- **sponsorship.html** The three sponsorship ways expanded into full detail, the
  sponsor logo wall, and the partner CTA.
- **news.html** Curated post-card grid plus a "Follow on Instagram" CTA.
- **contact.html** Form and WhatsApp CTA. No email.

## Contact behaviour

There is no backend. The form on the homepage and on `contact.html` collects a
name and an optional message, then opens `wa.me/<number>` with the text
prefilled. If JavaScript is unavailable the WhatsApp button still works as a
plain link.

## Risks and open items

### Instagram embed is not viable as asked

Instagram no longer supports public profile-feed embeds. A live feed requires
either a Meta app token with server-side oEmbed calls, which this static site
cannot do, or a third-party script such as LightWidget or Elfsight, which is an
external dependency, frequently paid, and slow.

Resolution: `news.html` ships as a hand-curated grid of post cards (image,
caption, outbound link) styled on-brand, with a prominent follow CTA. Visually
equivalent, zero dependencies. Revisit if a live feed becomes a hard requirement.

### Stat conflict

The wireframe claims 20+ countries, 50+ races, and 1M+ online reach. The current
live site claims 4+ countries and 5+ podium finishes. Project notes record that
the "2x World Champion" billing comes from sponsors with unconfirmed title years.

Resolution: build with the conservative verified numbers. The larger figures go
on the TODO for the client to confirm or deny.

### Content blocked on the client

Placeholders ship for all of these and are listed in a handover TODO:

- WhatsApp number (the entire contact flow depends on it)
- Instagram handle and the first few post cards
- Hero video file or embed URL
- Two testimonial quotes with real, named attributions
- Confirmation or correction of the reach and race-count stats

### Live-site regression risk

The current site is live on a production custom domain. Work happens on a branch
and is reviewed locally before anything reaches `main`. `CNAME` must survive the
rebuild or the custom domain breaks.

## Out of scope

Animation and effects polish, micro-interactions, performance tuning, and the
accessibility pass. All are a deliberate follow-up once structure is agreed.
