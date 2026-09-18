# Arxon site rebuild: handover

Branch `redesign/wireframe-2026-09`. **Not merged, not deployed.** The live site
at arxongomperts.com is still the old one-page build on `main`.

Last updated 2026-09-18. Grep `TODO(client)` in the HTML and `data-todo` on the
affected elements to find every placeholder.

## Structure

```
index.html         homepage: hero, accomplishments, quiver, sponsorship ways,
                   reviews, portfolio, connect
about.html         bio, portrait, quick facts
races.html         PWA results table with year filter + career stats
sponsorship.html   three tiers, partner wall, CTA
news.html          curated post cards + follow CTA
contact.html       email + Instagram
assets/style.css   tokens, both display modes, nav, footer, chips, buttons
assets/site.js     loader, cursor, nav, reveal, counters, mode toggle
assets/sponsors.js canonical sponsor list, drives hero strip + partner wall
scripts/           check-links.mjs, check-mobile.sh, mobile-probe.html
```

Retired: the six-chapter scrollytelling story and the "more from the water"
strip, both recoverable from git at `6b4bc76`.

## Settled

- **Palette** is Deep Ocean / Open Water / Lagoon / Mangrove / Signal Orange /
  Bone. Orange is reserved for calls to action, race numbers and spec chips,
  per the palette note. It is not a general accent.
- **Sun / shade toggle** on every page, persisted in `localStorage` and applied
  by a blocking head script so it never flashes. Sun mode deliberately drops
  the Open Water accent for Mangrove: light teal on Bone is unreadable in the
  direct sunlight the mode exists for.
- **Contact is email only**, `Arxong2011@gmail.com`, spelling confirmed.
  WhatsApp has been removed entirely, helper and styles included.
- **Instagram is `@arxon.nb2011`**, confirmed via North Windsurfing and World
  of Windsurf tagging him. No YouTube, TikTok or Facebook account exists, so
  those footer icons were removed rather than left pointing nowhere.
- **Sponsor list** is the 18-name list, held in `assets/sponsors.js`. Logo art
  supplied for 14, all converted to PNG.

## Blocking launch

1. **Logo art** for Damascus NV, Arxi BV and Momade. These three currently show
   as typeset wordmarks, which look deliberate but are stand-ins.
2. **Real testimonial quotes** with named attributions. The three on the
   homepage carousel are placeholder text I wrote, and that section is now the
   visual centrepiece of the page. Invented quotes presented modestly are a
   TODO; invented quotes as the hero of a section are a liability.
3. **Photo rights** on the five watermarked frames, below.

## Photo rights

Five photos carry a burned-in `(c)CARTER / PWAWORLDTOUR.COM` watermark:

```
arxon-action-carve.jpg    arxon-action-duo.jpg    arxon-action-solo.jpg
arxon-jump-airborne.jpg   arxon-portrait-closeup.jpg
```

None are used anywhere on the site. Four had been in prominent slots including
the hero and the Open Graph share image. Two separate problems, same answer:
the licence is unclear, and a third-party watermark on a premium sponsor pitch
looks amateur regardless.

These are the five strongest action frames, so the site is visually weaker
without them. Worth asking PWA or the photographer for clean originals, since
athlete use is often granted.

The twelve clean files: all five sunsets, all three aerials, `jump-splash`,
`portrait-armscrossed`, `portrait-celebrate`, `water-thumbsup`.

## Needs a decision

4. **A latest-event photo** for the hero. Currently a sunset frame. The latest
   confirmed results are the 2026 IFCA Europeans (Hvide Sande, Sept 2026) and
   Cold Hawaii U17 (Sept 2026); no photography from either was supplied.
5. **Hero video.** `index.html`, `HERO_VIDEO`. Empty, so the play button stays
   hidden rather than shipping a control that promises a video and delivers
   nothing. Set it and the button appears.
6. **The second world title.** Only the **2024 PWA U15 Boys Slalom Fin** title
   is sourced to the governing body, on PWA's own standings page. The two-time
   claim traces to exactly two promotional pages, WindForce's ambassador page
   and a Bonaire tourism-board announcement, and Point-7's own Hall of Fame
   contradicts it by listing him as U13. He almost certainly did win 2025, on
   best-three scoring with three event wins, but PWA never published those
   standings. Confirm before any press push.
7. **Two live-site results are wrong** and still need correcting on
   `races.html`:
   - 2025 Alacati is listed as 2nd. He was **8th** after an OCS. SailScores,
     SURF Magazin and PWA's own report all agree. The "2nd" looks like a drift
     from his genuine 4th at Alacati in **2024**.
   - 2024 Aruba is listed as 4th. PWA's 2024 season table scores that round at
     10300, which is the winner's score on that table, so it reads as a **win**.
8. **He is no longer a U15 athlete.** Since 2026 he has raced U17 and won
   Aruba and Bonaire, placed 2nd at Cold Hawaii, and was named best junior at
   the IFCA Fin Slalom Europeans. Copy that leads on U15 reads dated.

## Asset problems worth fixing

- **Salty Code Studio's own SVG cannot be used as an image.** Its wordmark is
  live Space Grotesk text, which this site does not load, so it renders in a
  fallback face. Needs text converted to outlines. The `~<` logomark itself is
  paths and would work fine.
- **Caribbean Homes** supplied a full illustrated scene (umbrella, sky, sand)
  rather than a logo lockup, so it reads as a grey blob at chip size.
- **Several logos are square canvases** with the mark in a thin band surrounded
  by empty space, which limits how large they can render. Tight-cropped
  versions would improve the strip noticeably.

## Deliberate departures from the brief

- **Sponsor chip treatment.** Each logo carries a tone flag deciding whether it
  needs a light ground or inversion, decided by testing every file. A uniform
  filter was tried first and blanked eight of them into empty rectangles: a
  blue roundel, several colour marks on white, and one white-on-black. All
  chips now share one light ground, greyscale at rest, colour on hover.
- **News is a curated card grid, not a live Instagram feed.** Instagram removed
  public profile-feed embedding. A live feed needs either a server, which a
  static GitHub Pages site does not have, or a paid third-party script. The
  grid looks the same to a visitor and costs nothing to run.
- **Photo overlays stay dark in both display modes.** The hero and the
  accomplishment caption sit on full-bleed photography, where dark lettering on
  a sunlit sea would be unreadable whatever the mode.

## Known environment hazard

All 17 photos became unreadable at the filesystem level mid-session: EPERM on
read, 404 from the local server, despite correct ownership and `rw-r--r--`
permissions. They carried `com.apple.macl`, `com.apple.provenance` and
`com.apple.quarantine`; files created during this project carry none and were
unaffected.

Fixed by restoring all 17 from their git blobs with each SHA verified against
`HEAD`. `git status` reported no change afterwards, so the image data is
provably byte-identical and only the restrictive attributes are gone.

Correlates with `sips` crop operations run against exactly these 17 files
during the watermark audit. Not proven, but avoid running `sips` against the
originals. The `sips -g` metadata reads against `sponsors/*.png` did not lock
those files.

## Superseded files kept on disk

Thirteen files in `sponsors/` are no longer referenced: older versions of North
Sails, Indebon, Mysharxon and Frans Paradise, plus nine sponsors no longer on
the list (bbx, concilium, dsg, ead, heroms, ibo, manno, paradise-rentals,
play-learn-grow). Left as an archive rather than deleted.

## Queued, not yet built

- **GoFundMe donate tile** on the sponsorship page:
  `https://www.gofundme.com/f/help-arxon-defend-his-world-champion-title`
- **Press page** from the confirmed research: roughly 20 verified articles
  across SURF Magazin (7), Bonaire.Nu (6), Windsurf Journal (3), PWA editorial
  (4), plus the InfoBonaire piece naming him a 2026 Bonaire Local Ambassador.
- **Results linked to source.** SailScores has official primary pages for the
  2025 and 2026 events, which is what the clickable-stats request needs.
- **About, Races and Sponsorship page rewrites** per the latest brief.

## Checks

```bash
node scripts/check-links.mjs .   # every local asset and internal link, markup and JS
./scripts/check-mobile.sh        # zero horizontal overflow, all six pages at a true 390px
```

Headless Chrome clamps its own window to 500px, so `check-mobile.sh` renders
each page inside a 390px iframe. That is the only way to exercise the real
mobile viewport. The link checker scans script blocks too, because the sponsor
list and the portfolio sets keep their filenames in JS.

## Still out of scope

UI polish, animation and effects, performance, and the accessibility pass,
agreed as a separate follow-up.
