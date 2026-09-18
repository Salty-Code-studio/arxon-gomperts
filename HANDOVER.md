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

---

# Update, 2026-09-18

## Resolved

- **Email confirmed** as `Arxong2011@gmail.com`, spelling as supplied. Live on
  the homepage connect block and on contact.html. WhatsApp is fully removed.
- **Instagram confirmed** as `@arxon.nb2011`. Wired into the footer and the
  contact page. No YouTube, TikTok or Facebook account exists, so those three
  footer icons were removed rather than left pointing at nothing.
- **GoFundMe** received:
  `https://www.gofundme.com/f/help-arxon-defend-his-world-champion-title`
  Queued for the donate tile on the sponsorship page, not yet placed.
- **Sponsor list** rebuilt from the 18-name list. Logo art supplied for 14.
  All art converted to PNG. The canonical list lives in `assets/sponsors.js`
  and drives both the hero strip and the partner wall.

## Photo access incident

All 17 photos became unreadable at the filesystem level mid-session: EPERM on
read, HTTP 404 from the local server, despite correct ownership and `rw-r--r--`
permissions. They carried `com.apple.macl`, `com.apple.provenance` and
`com.apple.quarantine` extended attributes; files created during this project
carry none and were unaffected.

Fixed by restoring all 17 from their git blobs, with each SHA verified against
`HEAD` before the swap. `git status` reported no change afterwards, proving the
image data is byte-identical. Only the restrictive attributes are gone.

Possible cause: the watermark audit ran `sips` crop operations against exactly
these 17 files and nothing else. Not proven, but worth avoiding `sips` on the
originals in future. The `sips -g` metadata reads run against `sponsors/*.png`
did not lock those files.

## Photo rights, unresolved

Five photos carry a burned-in `(c)CARTER / PWAWORLDTOUR.COM` watermark:

    arxon-action-carve.jpg      arxon-action-duo.jpg
    arxon-action-solo.jpg       arxon-jump-airborne.jpg
    arxon-portrait-closeup.jpg

None are used anywhere on the site. Four had been in prominent slots including
the hero and the Open Graph share image. These are the five strongest action
frames, so the site is visually weaker without them. Worth asking PWA or the
photographer for clean originals, since athlete use is often granted.

The twelve clean files are all five sunsets, all three aerials, `jump-splash`,
`portrait-armscrossed`, `portrait-celebrate` and `water-thumbsup`.

## Still needed

1. **Logo art** for Damascus NV, Arxi BV and Momade. Currently typeset
   wordmarks.
2. **Salty Code Studio's own logo** cannot be used as supplied. The SVG's
   wordmark is live Space Grotesk text, which this site does not load, so it
   would render in a fallback face. Needs text converted to outlines. The
   `~<` logomark itself is paths and would work.
3. **A cleaner Caribbean Homes logo.** The supplied file is a full illustrated
   scene (umbrella, sky, sand) rather than a logo lockup, so it reads as a grey
   blob at chip size.
4. **A latest-event photo** for the hero. Currently a sunset frame.
5. **Real testimonial quotes** with named attributions. The three on the
   homepage carousel are still placeholder text I wrote, and that section is
   now the visual centrepiece of the page.
6. **Confirmation of the second world title.** Only the 2024 PWA U15 Slalom
   Fin title is sourced to the governing body. The two-time claim traces to a
   sponsor page and a tourism-board announcement, and Point-7's own Hall of
   Fame page contradicts it by listing him as U13.

## Superseded files kept on disk

Thirteen logo files in `sponsors/` are no longer referenced: older versions of
North Sails, Indebon, Mysharxon and Frans Paradise, plus nine sponsors no
longer on the list (bbx, concilium, dsg, ead, heroms, ibo, manno,
paradise-rentals, play-learn-grow). Left in place as an archive rather than
deleted.
