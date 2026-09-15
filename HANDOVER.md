# Arxon site redesign: handover

Branch `redesign/wireframe-2026-09`. **Not merged, not deployed.** The live site
at arxongomperts.com is still the old one-page build on `main`.

Every item below ships as a flagged placeholder. Grep `TODO(client)` in the HTML,
and `data-todo` on the affected elements.

## Blocking launch

1. **WhatsApp number.** `assets/site.js`, `window.ARXON_WHATSAPP`. Digits only,
   country code first, no plus sign, no spaces. A Curaçao/Bonaire mobile would
   look like `5999123456`.

   This is the only contact channel on the whole site, by request. Until it is
   set, both forms show "WhatsApp is not configured yet." instead of opening a
   dead `wa.me` link. One string, two pages fixed.

2. **Instagram handle and post URLs.** `news.html` has three cards and one
   follow button pointing at `#`. The footer socials on all six pages too
   (IG / YT / TT / FB).

## Needs a decision

3. **Hero video.** `index.html`, `HERO_VIDEO`. Empty, so the play button is
   hidden rather than shipping a control that promises a video and delivers
   nothing. Set it to a file path or embed URL and the button appears.

4. **Testimonials.** `index.html`, the reviews section. Both quotes are
   placeholders attributed to "a mentor" and "a sponsor". They were left
   unnamed deliberately: putting invented words in a real, named person's mouth
   is not something to ship, and Arxon's actual coach is a real identifiable
   person. Replace with real quotes and real names.

5. **The stat conflict.** The wireframe claimed 20+ countries, 50+ races and
   1M+ online reach. The build uses conservative verified figures instead:

   | Wireframe claimed | Built with | Where |
   |---|---|---|
   | 20+ countries | 4+ countries | homepage portfolio |
   | 50+ races | 6+ world cup events | homepage portfolio |
   | 1M+ online reach | omitted | homepage portfolio |

   If the bigger numbers are real, they are a much stronger sell. Confirm them
   and they go straight in.

6. **"2x World Champion".** Sponsor-billed, and the title years were never
   confirmed. It headlines the accomplishments section. Confirm or soften
   before any press push.

## Deliberate departures from the wireframe

- **Logo bar** shows the 15 real sponsors as a marquee, not the wireframe's six
  fixed slots (North Sails, Future Fly, bright, Prisma, ION, Duotone). Only
  North Sails overlaps with the real sponsor list, so the rest would have been
  brands he is not actually with.

- **News** is a curated card grid, not a live Instagram feed. Instagram removed
  public profile-feed embedding; a live feed now needs either a server, which a
  static GitHub Pages site does not have, or a paid third-party script. The grid
  looks the same to a visitor and costs nothing to run. Paste in a new card when
  he posts.

- **Sponsor logo treatment.** A probe of all fifteen source PNGs showed they are
  already light art on transparency, built for dark backgrounds. The old site
  put twelve of them on white pills, which was rendering white art on white.
  They now get a uniform white-silhouette treatment, which also rescues
  `mysharxon.png` (dark red, unreadable raw) and `ibo.png`.

- **No email anywhere.** WhatsApp only, by request. Note the old live site has
  `arxon@email.com` hardcoded in its contact section, which is a placeholder
  that shipped. It is gone from this rebuild.

## What the structure looks like now

```
index.html         wireframe homepage, 7 sections
about.html         bio, portrait, quick facts
races.html         verified PWA results table + career stats
sponsorship.html   three tiers, 15-logo partner wall, CTA
news.html          curated cards + follow CTA
contact.html       form + WhatsApp
assets/style.css   shared tokens, nav, footer, buttons, reveal system
assets/site.js     loader, cursor, nav, reveal, counters, WhatsApp helper
scripts/           check-links.mjs, check-mobile.sh, mobile-probe.html
```

Retired: the six-chapter pinned scrollytelling story and the "more from the
water" strip. Both are recoverable from git at commit `6b4bc76`.

## Checks you can run

```bash
node scripts/check-links.mjs .   # every local asset and internal link resolves
./scripts/check-mobile.sh        # zero horizontal overflow on all six pages at 390px
```

Headless Chrome clamps its own window to 500px wide, which is why
`check-mobile.sh` renders each page inside a 390px iframe instead. That is the
only way to exercise the real mobile viewport.

## Still to come

UI polish, animation and effects, performance, and the accessibility pass are a
separate follow-up, agreed as out of scope for this structural rebuild.
