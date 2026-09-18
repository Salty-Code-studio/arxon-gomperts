/* ARXON GOMPERTS, canonical sponsor list.
   Single source of truth, consumed by the hero strip on index.html and the
   partner wall on sponsorship.html. The list has already changed twice, so it
   lives in one place rather than being duplicated per page.

   FIELDS
     name  display name, also the alt text and aria-label
     file  path to logo art, or null to fall back to a typeset wordmark
     url   outbound link, or null for no link
     tone  which ground the art needs, decided by testing each file rather
           than by guessing:
             'dark'  the art is dark or full colour, so it needs a LIGHT chip
             'light' the art is white or sits on black, so it needs a DARK chip
           Getting this wrong makes a logo invisible. A uniform treatment was
           tried first and blanked eight of them into empty rectangles.
*/
window.ARXON_SPONSORS = [
  { name: 'North Sails',                 file: 'sponsors/north-sails-2026.png',      url: 'https://northactionsports.com/pages/homepage-windsurfing', tone: 'dark'  },
  // Art is white-on-black, so a dark chip lets the black ground disappear.
  { name: 'Future Fly',                  file: 'sponsors/future-fly.png',           url: 'https://futurefly.world/',                                 tone: 'light' },
  { name: 'Hang Out Beachbar',           file: 'sponsors/hangout-beachbar.png',      url: 'https://www.hangoutbeachbar.com/',                         tone: 'light' },
  // TODO(client): rocargo.com serves an expired TLS certificate, so clicking
  // it would throw a browser security warning. Pointed at their Facebook
  // until the cert is renewed.
  { name: 'Rocargo',                     file: 'sponsors/rocargo.png',               url: 'https://www.facebook.com/rocargologisitics/',              tone: 'dark'  },
  { name: 'eZone',                       file: 'sponsors/ezone.png',                 url: 'https://getezone.com/locations/bonaire',                   tone: 'dark'  },
  { name: 'WindForce',                   file: 'sponsors/windforce.png',             url: 'https://windforce.ca/',                                    tone: 'dark'  },
  { name: 'WEB Bonaire',                 file: 'sponsors/web-bonaire.png',           url: 'https://www.webbonaire.com/?lang=en',                      tone: 'dark'  },
  { name: 'Caribbean Homes',             file: 'sponsors/caribbean-homes.png',       url: 'https://caribbeanhomesbonaire.com/',                       tone: 'dark'  },
  { name: 'Indebon',                     file: 'sponsors/indebon-2026.png',          url: 'https://www.bonairesport.com/',                            tone: 'dark'  },
  { name: 'The Frans Paradise',          file: 'sponsors/frans-paradise-2026.png',   url: 'https://fransparadise.com/',                               tone: 'dark'  },
  // Client's list says "Phocena Fins". The brand is spelled Phocoena, after
  // the harbour-porpoise genus, and the supplied logo art confirms it.
  { name: 'Phocoena',                    file: 'sponsors/phocoena.png',              url: 'https://phocoena.no/',                                     tone: 'dark'  },
  // TODO(client): no logo art and no URL supplied for Damascus NV.
  { name: 'Damascus NV',                 file: null,                                 url: null,                                                       tone: 'light' },
  { name: 'Prestige Property Management',file: 'sponsors/prestige-property.png',     url: null,                                                       tone: 'dark'  },
  { name: 'Mysharxon BV',                file: 'sponsors/mysharxon-2026.png',        url: null,                                                       tone: 'dark'  },
  // TODO(client): no logo art and no URL supplied for Arxi BV.
  { name: 'Arxi BV',                     file: null,                                 url: null,                                                       tone: 'light' },
  { name: 'OnTrack BV',                  file: 'sponsors/ontrack.png',               url: null,                                                       tone: 'light' },
  // TODO(client): their own SVG cannot be used as an image. Its wordmark is
  // live Space Grotesk text, which this site does not load, so it would render
  // in a fallback face. Needs text converted to outlines.
  { name: 'Salty Code Studio',           file: null,                                 url: 'https://saltycodestudio.com/',                             tone: 'light' },
  // TODO(client): no brand presence found for Momade. Confirm whether this
  // should link anywhere, or be listed as a supporter without a link.
  { name: 'Momade',                      file: null,                                 url: null,                                                       tone: 'light' },
];

/* Builds one sponsor cell. Used by both the hero strip and the partner wall,
   which differ only in their wrapper class.
     opts.cls    base class for the cell
     opts.ghost  true for the marquee's duplicate half: no alt text, no link,
                 hidden from screen readers so each sponsor is announced once */
window.arxonSponsorCell = function (s, opts) {
  const cls = opts.cls;
  const ghost = !!opts.ghost;
  const inner = s.file
    ? `<img src="${s.file}" alt="${ghost ? '' : s.name}" loading="lazy">`
    : `<span class="${cls}-word">${s.name}</span>`;
  const cell = `<div class="${cls} ${cls}--${s.tone}"${ghost ? ' aria-hidden="true"' : ''}>${inner}</div>`;
  if (ghost || !s.url) return cell;
  return `<a href="${s.url}" target="_blank" rel="noopener" class="${cls}-link" aria-label="${s.name}">${cell}</a>`;
};
