/* Arxon Gomperts — shared behaviour. Every block is guarded, so pages only run what they contain. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = (document.querySelector('link[href$="assets/site.css"]').getAttribute('href') || '').replace('assets/site.css', '');

  // ---------- mobile menu
  const toggle = $('.menu-toggle'), nav = $('#nav');
  if (toggle) {
    const setMenu = open => {
      nav.classList.toggle('open', open); toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.documentElement.classList.toggle('menu-lock', open);
      if (open) { const wb = document.getElementById('wind-btn'); if (wb && wb.getAttribute('aria-expanded') === 'true') wb.click(); }
    };
    toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); toggle.focus(); } });
    addEventListener('resize', () => { if (innerWidth > 1023 && nav.classList.contains('open')) setMenu(false); });
  }

  // ---------- custom cursor (same feel as arxongomperts.com): dot + trailing ring, grows on interactive elements
  const cur = $('#cursor'), ring = $('#cursorRing');
  if (cur && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.documentElement.classList.add('has-cursor');
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, rx = mx, ry = my;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; cur.classList.remove('hidden'); ring.classList.remove('hidden'); });
    const hideCur = () => { cur.classList.add('hidden'); ring.classList.add('hidden'); };
    document.addEventListener('mouseleave', hideCur);
    document.addEventListener('mouseout', e => { if (!e.relatedTarget) hideCur(); });
    addEventListener('blur', hideCur);
    const loop = () => { cx += (mx - cx) * .2; cy += (my - cy) * .2; rx += (mx - rx) * .1; ry += (my - ry) * .1;
      cur.style.left = cx + 'px'; cur.style.top = cy + 'px'; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(loop); };
    loop();
    const HOVER = 'a, button, .stat, .news-card, .sponsor, .bar-logo, .gallery figure, .wf-tile, .option, summary, .champ-band, .wf-chart .hit';
    document.addEventListener('mouseover', e => { const on = !!e.target.closest(HOVER); cur.classList.toggle('hover-active', on); ring.classList.toggle('hover-active', on); });
  }

  // ---------- scroll reveals (one motion language, like the live site)
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' }) : null;
  $$('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('visible'));

  // ---------- illustrated stats: play their animation once when scrolled into view
  const playIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-playing'); playIO.unobserve(e.target); $$('[data-num]', e.target).forEach(n => setTimeout(() => countNum(n), 700)); }
  }), { threshold: .3 }) : null;
  $$('[data-play]').forEach(el => playIO && !still ? playIO.observe(el) : el.classList.add('is-playing'));

  // ---------- count-up stats
  const countIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; countIO.unobserve(e.target);
    const el = e.target, to = +el.dataset.count; if (still) return;
    const t0 = performance.now(), dur = 1100;
    const step = t => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    el.textContent = '0'; requestAnimationFrame(step);
  }), { threshold: .6 }) : null;
  $$('[data-count]').forEach(el => countIO && countIO.observe(el));

  // ---------- sponsor shelf: auto-scroll, pause on hover, wheel/drag/touch by hand, endless loop
  const strip = $('.marquee');
  if (strip) {
    const track = $('.marquee-track', strip), SPEED = 28;
    let hovering = false, dragging = false, last = performance.now(), carry = 0;
    const half = () => track.scrollWidth / 2;
    const wrap = () => { const h = half(); if (strip.scrollLeft >= h) strip.scrollLeft -= h; else if (strip.scrollLeft <= 0) strip.scrollLeft += h; };
    strip.scrollLeft = 1;
    strip.addEventListener('mouseenter', () => hovering = true);
    strip.addEventListener('mouseleave', () => hovering = false);
    strip.addEventListener('scroll', wrap, { passive: true });
    strip.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); strip.scrollLeft += e.deltaY; wrap(); } }, { passive: false });
    let startX = 0, startLeft = 0, moved = false;
    strip.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; dragging = true; moved = false; startX = e.clientX; startLeft = strip.scrollLeft; });
    addEventListener('pointermove', e => {
      if (!dragging) return; const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) { moved = true; strip.classList.add('dragging'); }
      strip.scrollLeft = startLeft - dx; const before = strip.scrollLeft; wrap(); startLeft += strip.scrollLeft - before;
    });
    addEventListener('pointerup', () => { dragging = false; strip.classList.remove('dragging'); });
    strip.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);
    const tick = now => {
      const dt = Math.min(now - last, 64) / 1000; last = now;
      if (!still && !hovering && !dragging && !document.hidden) { carry += SPEED * dt; const s = Math.floor(carry); if (s) { strip.scrollLeft += s; carry -= s; } }
      wrap(); requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ---------- reel lightbox
  const reel = $('#reel'), reelVideo = $('#reel-video');
  $$('[data-reel]').forEach(b => b.addEventListener('click', () => {
    if (!reel || !reel.showModal) return;
    reel.showModal(); reelVideo.currentTime = 0; reelVideo.play().catch(() => {});
  }));
  if (reel) {
    const close = () => { reelVideo.pause(); reel.close(); };
    $('[data-close-reel]').addEventListener('click', close);
    reel.addEventListener('click', e => { if (e.target === reel) close(); });
    reel.addEventListener('close', () => reelVideo.pause());
  }
  const heroVideo = $('#hero-video');
  if (heroVideo && still) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }

  // ---------- results: staggered slide-in when scrolled into view, animated year filter
  $$('.results-table.animate').forEach(t => {
    if (still || !('IntersectionObserver' in window)) { t.classList.remove('animate'); return; }
    const o = new IntersectionObserver(es => { if (es[0].isIntersecting) { t.classList.add('in'); o.disconnect(); setTimeout(() => t.classList.remove('animate', 'in'), 2200); } }, { threshold: .15 });
    o.observe(t);
  });
  $$('.results').forEach(box => {
    const btns = $$('[data-year]', box).filter(b => b.tagName === 'BUTTON');
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => x.setAttribute('aria-pressed', x === b));
      let j = 0;
      $$('tbody tr', box).forEach(tr => {
        const show = b.dataset.year === 'all' || tr.dataset.year === b.dataset.year;
        tr.classList.toggle('hide', !show); tr.classList.remove('flash');
        if (show) { void tr.offsetWidth; tr.style.setProperty('--j', j++); tr.classList.add('flash'); }
      });
    }));
  });

  // ---------- sponsorship options
  const opts = [
    { name: 'Equipment', copy: 'Logo placement on race equipment, race imagery and agreed content.', list: ['Sail and board placement, seen in every race photo', 'Featured in race-day posts and recaps', 'Credited in press and event coverage'] },
    { name: 'Team kit', copy: 'Your brand on the kit Arxon wears at races, on the podium and in training.', list: ['Podium and paddock kit placement', 'Training wear at Lac Bay, seen daily', 'Product shoots on and off the water'] },
    { name: 'Digital / content', copy: 'Co-created content that puts your brand inside Arxon’s season.', list: ['Branded race and travel series', 'Behind-the-scenes training content', 'Agreed posting schedule and reporting'] },
  ];
  const optBtns = $$('.option');
  if (optBtns.length) {
    let cur = 0;
    const setOpt = i => {
      cur = i; optBtns.forEach((b, j) => b.setAttribute('aria-selected', j === i));
      const panel = $('#selected'); $('#opt-name').textContent = opts[i].name; $('#opt-copy').textContent = opts[i].copy;
      $('#opt-list').innerHTML = opts[i].list.map(t => `<li>${t}</li>`).join('');
      panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
    };
    optBtns.forEach(b => b.addEventListener('click', () => setOpt(+b.dataset.opt)));
    setOpt(0);
    const start = $('[data-start]');
    if (start) start.addEventListener('click', () => { try { sessionStorage.setItem('arxon-topic', opts[cur].name); } catch (e) {} });
  }

  // ---------- home portfolio carousel
  const folio = {
    gear: { head: 'Performance. Travel. Progress.', body: 'A close look at the equipment, racing moments and places that shape Arxon’s journey.', tags: ['North Sails', 'Future Fly', 'Fin slalom'],
      slides: [['ns-with-board', 'Future Fly slalom board'], ['ns-aruba-jump', 'Airborne in Aruba'], ['ns-planing', 'North Sails NB 2011']] },
    races: { head: 'Starts. Gybes. Finishes.', body: 'Race days on the PWA Youth Tour, from Aruba to the water he grew up on at Lac Bay.', tags: ['PWA Youth Tour', 'U17 Fin'],
      slides: [['ns-aruba-gybe', 'Gybing in Aruba'], ['ns-carve', 'Carving at Lac Bay'], ['ns-bonaire-win', 'Winning at home, 2026']] },
    momentum: { head: 'Podiums. Sunsets. Titles.', body: 'The moments around the racing: podiums, sunsets and the titles that started it all.', tags: ['Aruba', 'Bonaire'],
      slides: [['ns-u17-podium', 'U17 podium, Bonaire 2026'], ['aru-00176', 'Into the sun, Aruba'], ['champion-celebration', 'World title, 2025']] },
  };
  const slideImg = $('#slide-img');
  if (slideImg) {
    let tab = 'gear', idx = 0; const dots = $('#dots');
    const render = () => {
      const f = folio[tab], [file, cap] = f.slides[idx];
      slideImg.style.opacity = 0;
      setTimeout(() => { slideImg.src = `${root}media/photos/${file}.jpg`; slideImg.alt = cap; slideImg.style.opacity = 1; }, still ? 0 : 160);
      $('#slide-cap').textContent = cap; $('#folio-head').textContent = f.head; $('#folio-body').textContent = f.body;
      $('#folio-tags').innerHTML = f.tags.map(t => `<span>${t}</span>`).join('');
      $('#count').textContent = String(idx + 1).padStart(2, '0'); $('#total').textContent = String(f.slides.length).padStart(2, '0');
      dots.innerHTML = f.slides.map((s, i) => `<button class="dot" aria-label="Show ${s[1]}" ${i === idx ? 'aria-current="true"' : ''} data-i="${i}"></button>`).join('');
    };
    $$('[data-tab]').forEach(t => t.addEventListener('click', () => { tab = t.dataset.tab; idx = 0; $$('[data-tab]').forEach(x => x.setAttribute('aria-selected', x === t)); render(); }));
    $$('[data-step]').forEach(b => b.addEventListener('click', () => { const n = folio[tab].slides.length; idx = (idx + +b.dataset.step + n) % n; render(); }));
    dots.addEventListener('click', e => { if (e.target.dataset.i) { idx = +e.target.dataset.i; render(); } });
    render();
  }

  // ---------- portfolio page gallery: filter + lightbox
  const gal = $('#gallery');
  if (gal) {
    $$('[data-filter]').forEach(b => b.addEventListener('click', () => {
      $$('[data-filter]').forEach(x => x.setAttribute('aria-selected', x === b));
      $$('figure', gal).forEach(f => f.classList.toggle('hide', b.dataset.filter !== 'all' && f.dataset.cat !== b.dataset.filter));
    }));
    const lb = $('#lightbox');
    gal.addEventListener('click', e => {
      const fig = e.target.closest('figure'); if (!fig || !lb.showModal) return;
      const img = $('img', fig); $('img', lb).src = img.src; $('img', lb).alt = img.alt; $('p', lb).textContent = img.alt; lb.showModal();
    });
    lb.addEventListener('click', () => lb.close());
  }

  // ---------- contact form → WhatsApp (email fallback)
  const form = $('#form');
  if (form) {
    const status = $('#status');
    try { const t = sessionStorage.getItem('arxon-topic'); if (t && form.topic) { form.topic.value = 'Sponsorship'; const m = { equipment: 'sail & board logo', kit: 'team kit', digital: 'digital content' }; const box = form.querySelector(`input[name="interest"][value="${m[t.toLowerCase()] || ''}"]`); if (box) box.checked = true; if (!form.message.value) form.message.value = `I'm interested in a ${t.toLowerCase()} partnership.`; } } catch (e) {}
    const interests = () => [...form.querySelectorAll('input[name="interest"]:checked')].map(i => i.value);
    const compose = () => {
      const name = form.name.value.trim(), company = form.company.value.trim(), message = form.message.value.trim(), topic = form.topic ? form.topic.value : '';
      const ints = topic === 'Sponsorship' ? interests() : [];
      const intLine = ints.length ? `\nInterested in: ${ints.join(', ')}.` : '';
      return { company, text: `Hi Arxon's team, this is ${name || '…'}${company ? ` from ${company}` : ''}${topic ? ` (${topic})` : ''}.${intLine}\n\n${message}` };
    };
    // live preview, progress + interest chips
    const bar = $('#cx-bar'), count = $('#cx-count'), ptxt = $('#cxp-text'), ptime = $('#cxp-time'), pstate = $('#cxp-state'), interestBox = $('#cx-interest');
    let typingT;
    const refresh = () => {
      if (!ptxt) return;
      const done = [form.name.value.trim(), form.topic.value, form.message.value.trim()].filter(Boolean).length;
      bar.style.width = (done / 3 * 100) + '%'; count.textContent = `${done} / 3`; form.classList.toggle('ready', done === 3);
      ptxt.textContent = compose().text; const d = new Date(); ptime.textContent = d.toTimeString().slice(0, 5);
      interestBox.classList.toggle('off', form.topic.value !== 'Sponsorship');
      ['name', 'company', 'message'].forEach(k => form[k].closest('.field').classList.toggle('filled', !!form[k].value.trim()));
      pstate.textContent = 'typing…'; clearTimeout(typingT); typingT = setTimeout(() => pstate.textContent = 'usually replies within 48 h', 900);
    };
    form.addEventListener('input', refresh); form.addEventListener('change', refresh);
    const valid = () => {
      let ok = true;
      ['name', 'message'].forEach(k => { const bad = !form[k].value.trim(); form[k].closest('.field').classList.toggle('invalid', bad); if (bad) ok = false; });
      if (!ok) { status.textContent = 'Add your name and a message to continue.'; status.className = 'form-status err'; }
      return ok;
    };
    form.addEventListener('submit', e => {
      e.preventDefault(); if (!valid()) return;
      form.classList.add('sent'); setTimeout(() => form.classList.remove('sent'), 1600);
      window.open(`https://wa.me/5997888046?text=${encodeURIComponent(compose().text)}`, '_blank', 'noopener');
      status.textContent = 'WhatsApp opened with your message. Press send there to deliver it.'; status.className = 'form-status';
    });
    $('#mail-fallback').addEventListener('click', e => {
      e.preventDefault(); if (!valid()) return; const { text, company } = compose();
      location.href = `mailto:arxon.nb2011@gmail.com?subject=${encodeURIComponent('Partnership enquiry' + (company ? ' — ' + company : ''))}&body=${encodeURIComponent(text)}`;
    });
    form.addEventListener('input', e => { const f = e.target.closest('.field'); if (f) f.classList.remove('invalid'); if (status.classList.contains('err')) status.textContent = ''; });
    refresh();
  }

  // ---------- scroll-linked: footer sunrise (--fp) and results progress rail (--rail)
  const scene = $('.foot-scene'), rails = $$('.results-body');
  if (!still && (scene || rails.length)) {
    const clamp = v => Math.max(0, Math.min(1, v));
    const onScroll = () => {
      if (scene) { const r = scene.getBoundingClientRect(); if (r.top < innerHeight) scene.style.setProperty('--fp', clamp((innerHeight - r.top) / (innerHeight * .85)).toFixed(3)); else scene.style.setProperty('--fp', 0); }
      rails.forEach(b => { const r = b.getBoundingClientRect(); b.style.setProperty('--rail', clamp((innerHeight * .75 - r.top) / r.height).toFixed(3)); });
    };
    addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();
  } else if (scene) scene.style.setProperty('--fp', 1);

  // ---------- results rows: each animates in as it reaches the viewport
  const rowIO = 'IntersectionObserver' in window && !still ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); rowIO.unobserve(e.target); }
  }), { threshold: .35, rootMargin: '0px 0px -8% 0px' }) : null;
  $$('.results-table tbody tr').forEach(tr => { if (rowIO) { tr.classList.add('rv'); rowIO.observe(tr); } });

  // ---------- radar tooltip (sail character)
  const rdTip = $('#rd-tip');
  if (rdTip) $$('.rd-dot').forEach(d => {
    const show = () => { rdTip.textContent = d.dataset.tip; };
    d.addEventListener('mouseenter', show); d.addEventListener('focus', show);
    d.addEventListener('mouseleave', () => { rdTip.textContent = 'Hover a point for the score'; });
  });

  // ---------- footer: race-update signup (opens a pre-filled email until a mailing tool is connected)
  const sub = $('#subscribe');
  if (sub) sub.addEventListener('submit', e => {
    e.preventDefault(); const email = $('#sub-email').value.trim(), st = $('#sub-status');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { st.textContent = 'Enter a valid email address.'; st.style.color = '#ff5468'; return; }
    location.href = `mailto:arxon.nb2011@gmail.com?subject=${encodeURIComponent('Subscribe me to race updates')}&body=${encodeURIComponent('Please add ' + email + ' to Arxon\'s race updates.')}`;
    st.textContent = 'Your email app opened — press send to subscribe.'; st.style.color = '';
  });

  // ---------- footer Instagram card: live followers + latest posts via the site's /api/instagram relay
  const igGrid = $('#ig-grid');
  if (igGrid) {
    const fmt = n => n >= 10000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'K' : n.toLocaleString('en-US');
    // split-flap follower counter
    const flips = $$('[data-ig-flip]');
    const paint = (el, n, animate) => {
      const str = String(n), old = el.dataset.shown || '';
      if (el.children.length !== str.length) el.innerHTML = [...str].map(() => '<span class="fd"><b></b><i></i></span>').join('');
      [...str].forEach((ch, k) => {
        const d = el.children[k], prev = old.length === str.length ? old[k] : '';
        d.querySelector('b').textContent = ch;
        if (animate && prev && prev !== ch) { d.querySelector('i').textContent = prev; d.classList.remove('flip'); void d.offsetWidth; d.classList.add('flip'); }
      });
      el.dataset.shown = str; el.setAttribute('aria-label', `${n} followers`);
    };
    flips.forEach(el => paint(el, +el.dataset.value || 0, false));
    // spin the digits in when the footer first comes into view
    if ('IntersectionObserver' in window) flips.forEach(el => { const io = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; io.disconnect(); [...el.children].forEach((d, k) => setTimeout(() => { d.querySelector('i').textContent = '0'; d.classList.remove('flip'); void d.offsetWidth; d.classList.add('flip'); }, k * 90)); }, { threshold: .6 }); io.observe(el); });
    let last = null, gridDone = false;
    const loadIG = () => fetch(`${root}api/instagram?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(d => {
      if (!d || d.followers_count == null) return;
      const n = d.followers_count;
      flips.forEach(el => paint(el, n, last != null || +el.dataset.value !== n));
      $$('.if-live').forEach(l => l.hidden = false);
      last = n;
      if (d.media_count != null) { $$('[data-ig="posts"]').forEach(el => el.textContent = fmt(d.media_count)); }
      if (d.profile_picture_url) $$('[data-ig="avatar"]').forEach(el => el.src = d.profile_picture_url);
      const posts = (d.media && d.media.data || []).slice(0, 6);
      if (posts.length && !gridDone) { gridDone = true; igGrid.innerHTML = posts.map(p => `<a href="${p.permalink}" target="_blank" rel="noopener"><img src="${p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url}" alt="" loading="lazy"></a>`).join(''); }
    }).catch(() => {});
    loadIG();
    setInterval(() => { if (!document.hidden) loadIG(); }, 60000);
    let wentToFollow = false;
    $$('.ig-follow, .ig-handle').forEach(a => a.addEventListener('click', () => { wentToFollow = true; }));
    document.addEventListener('visibilitychange', () => { if (!document.hidden && wentToFollow) { loadIG(); setTimeout(loadIG, 8000); } });
  }

  // ---------- news feed: relative times and "breaking" badge on fresh stories
  const ago = iso => { const d = Math.round((Date.now() - new Date(iso + 'T12:00').getTime()) / 864e5);
    return d < 1 ? 'Today' : d === 1 ? 'Yesterday' : d < 14 ? `${d} days ago` : d < 60 ? `${Math.round(d / 7)} weeks ago` : d < 365 ? `${Math.round(d / 30)} months ago` : `${Math.round(d / 365)} yr ago`; };
  $$('time.ago').forEach(t => { t.title = t.textContent; t.textContent = ago(t.getAttribute('datetime')); });
  $$('.fl-badge[data-new]').forEach(b => { const d = (Date.now() - new Date(b.dataset.new + 'T12:00')) / 864e5; if (d > 45) { b.textContent = 'Latest'; b.classList.add('old'); } });

  // ---------- count-up for spec numbers when their card plays
  const countNum = el => { const to = parseFloat(el.dataset.num), dec = (el.dataset.num.split('.')[1] || '').length, t0 = performance.now();
    const step = t => { const p = Math.min(1, (t - t0) / 1100); el.textContent = (to * (1 - Math.pow(1 - p, 3))).toFixed(dec); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };

  // ---------- coach card: click / Enter / tap toggles the story (hover handles mouse users)
  $$('.quote .person').forEach(p => {
    const toggle = () => { const o = p.classList.toggle('open'); p.setAttribute('aria-expanded', o); };
    p.addEventListener('click', toggle);
    p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } if (e.key === 'Escape') { p.classList.remove('open'); p.setAttribute('aria-expanded', false); } });
  });

  // ---------- travel map: route draws with scroll, boat follows, pins + stops light up, km counts
  const tv = $('[data-travel]');
  if (tv) {
    const route = $('#tv-route', tv), boat = $('#tv-boat', tv), L = route.getTotalLength();
    const pins = $$('.tv-pin', tv), items = $$('.tv-stops li', tv), kmEl = $('[data-tv-km]', tv), stEl = $('[data-tv-stops]', tv), kmMax = +kmEl.dataset.max;
    // where along the path each stop sits (fraction of length)
    const stopAt = pins.map(p => { const [x, y] = p.getAttribute('transform').match(/[-\d.]+/g).map(Number); let best = 0, bd = 1e9;
      for (let i = 0; i <= 400; i++) { const q = route.getPointAtLength(L * i / 400), dd = (q.x - x) ** 2 + (q.y - y) ** 2; if (dd < bd) { bd = dd; best = i / 400; } } return best; });
    route.style.strokeDasharray = L;
    const sticky = getComputedStyle($('.travel-sticky', tv)).position === 'sticky' && !still;
    const render = p => {
      route.style.strokeDashoffset = L * (1 - p);
      const pt = route.getPointAtLength(Math.max(.001, p) * L), ahead = route.getPointAtLength(Math.min(L, (p + .01) * L));
      const ang = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180 / Math.PI;
      boat.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${ang + 90})`);
      let n = 0; pins.forEach((pin, i) => { const on = p >= stopAt[i] - .002; pin.classList.toggle('on', on); items[i].classList.toggle('on', on); if (on) n = i + 1; });
      items.forEach((li, i) => li.classList.toggle('now', i === n - 1));
      kmEl.textContent = Math.round(kmMax * p).toLocaleString('en-US'); stEl.textContent = n;
      tv.classList.toggle('done', p > .98);
    };
    if (sticky) {
      const onScroll = () => { const r = tv.getBoundingClientRect(), span = r.height - (innerHeight - parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'))); render(Math.max(0, Math.min(1, -r.top / span))); };
      addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();
    } else if ('IntersectionObserver' in window && !still) {
      // no pinning (phones): play the voyage once when the map comes into view
      const o = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; o.disconnect(); const t0 = performance.now();
        const step = t => { const p = Math.min(1, (t - t0) / 3200); render(1 - Math.pow(1 - p, 2)); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }, { threshold: .4 });
      o.observe(tv); render(0);
    } else render(1);
  }

  // ---------- wind: header button + expanding Wind Finder panel (Open-Meteo, no key)
  const windBtn = $('#wind-btn'), windPanel = $('#wind-panel');
  if (windBtn && windPanel) {
    const LAT = 12.0975, LON = -68.2259, TZ = 'America%2FKralendijk';
    const WX = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=wind_speed_10m,wind_gusts_10m,wind_direction_10m,temperature_2m,weather_code&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m&daily=weather_code&wind_speed_unit=kn&timezone=${TZ}&forecast_days=7`;
    const SEA = `https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}&current=wave_height&timezone=${TZ}`;
    const compass = d => ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(d / 22.5) % 16];
    const character = (kn, g) => { const r = g / Math.max(kn, 1); return r < 1.35 ? 'steady' : r < 1.7 ? 'gusty' : 'very gusty'; };
    // bands follow the skill-level wind ranges: <8 too light · 8–12 beginner · 12–15 improver · 15–22 fun zone · 22+ advanced / slalom
    const rating = kn => kn < 8 ? 'flat' : kn < 12 ? 'beginner' : kn < 15 ? 'improver' : kn < 22 ? 'fun' : 'send';
    const RATING_TXT = { flat: ['Netflix day', 'Stay home', 'Nope'], beginner: ['Meh', 'Maybe', 'Big sail only'], improver: ['Green light', 'Rig up', 'Get out there'], fun: ["Let's gooo", 'Send it', 'Get out there'], send: ['Full send', 'Send it', "Let's gooo"] };
    const REMARK = {
      flat: ['Glassy and quiet on Lac Bay — a paddle or a snorkel beats a sail today.', 'Not enough to get going. Good day to tune fins and wax the board.', 'Barely a ripple. Beginners only, and even they will be waiting for puffs.', 'Lac Bay is resting. Arxon is probably in the gym.'],
      beginner: ['Light, steady breeze — perfect for balance, steering and pulling up the sail.', 'Learner weather: flat water, no stress, plenty of time to find your feet.', 'Gentle enough to learn, enough to move. Big sail, big board, big smile.', 'Kids and first-timers out in force today.'],
      improver: ['Enough to hook in — harness and footstrap practice weather.', 'On the edge of planing: pump on the gusts and you are flying.', 'Moderate wind. Ideal for gybe drills and dialling in the harness lines.', 'Getting interesting — the first planing runs of the day.'],
      fun: ['Whitecaps on Lac Bay and fully powered planing on smaller boards.', 'Proper wind: board free, harness in, rails singing.', 'Everyone is planing. If you are on the beach, you are missing it.', 'Fast reaches across the bay — this is what the trade winds are for.'],
      send: ['High-adrenaline stuff: small sails, choppy water, flat-out slalom runs.', 'Race weather. Hold on tight and keep it pinned through the gybes.', 'Overpowered for most — exactly where Arxon trains for the World Cup.', 'Big gusts, big speed. Experts only out there.']
    };
    const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];
    const extra = (kn, g, dir, temp) => {
      const out = [], ratio = g / Math.max(kn, 1);
      if (ratio >= 1.6) out.push(`Gusty — puffs up to ${Math.round(g)} kn, so keep a hand free for the downhaul.`);
      else if (ratio < 1.25 && kn >= 12) out.push('Nice and steady, no nasty lulls.');
      if (dir != null && (dir < 45 || dir > 150)) out.push('Unusual direction for Lac Bay — expect a shifty bay.');
      if (temp != null && temp >= 31) out.push('Hot one — bring water.');
      return out;
    };
    const arxonSail = kn => kn < 12 ? null : kn < 17 ? '7.7' : kn < 22 ? '6.7' : '6.0';
    const ratingText = (r, i) => RATING_TXT[r][i % RATING_TXT[r].length];
    const cond = c => c === 0 ? ['Clear', 'sun'] : c <= 1 ? ['Mostly clear', 'sun'] : c === 2 ? ['Partly cloudy', 'part'] : c === 3 ? ['Overcast', 'cloud'] : c <= 48 ? ['Fog', 'cloud'] : c <= 67 ? ['Rain', 'rain'] : c <= 82 ? ['Showers', 'rain'] : ['Thunderstorm', 'rain'];
    const ICONS = {
      sun: '<circle cx="20" cy="20" r="7"/><path d="M20 4v4M20 32v4M4 20h4M32 20h4M8.7 8.7l2.8 2.8M28.5 28.5l2.8 2.8M8.7 31.3l2.8-2.8M28.5 11.5l2.8-2.8"/>',
      part: '<path d="M14 30h15a6 6 0 0 0 0-12 8 8 0 0 0-15-1 6.5 6.5 0 0 0 0 13z"/><path d="M27 6v3M35 10l-2 2M37 18h-3M22 9l2 2"/>',
      cloud: '<path d="M11 30h18a7 7 0 0 0 0-14 9 9 0 0 0-17-1 7.5 7.5 0 0 0-1 15z"/>',
      rain: '<path d="M11 24h18a7 7 0 0 0 0-14 9 9 0 0 0-17-1 7.5 7.5 0 0 0-1 15z"/><path d="M14 29l-2 5M21 29l-2 5M28 29l-2 5"/>'
    };
    const set = (k, v) => $$(`[data-w="${k}"]`).forEach(el => el.textContent = v);
    const hh = t => t.slice(11, 16);
    $$('.compass .ticks').forEach(g => {
      let h = '';
      for (let a = 15; a < 360; a += 15) { if (a % 90 === 0) continue; const rad = (a - 90) * Math.PI / 180; h += `<line class="tick" x1="${50 + 41 * Math.cos(rad)}" y1="${50 + 41 * Math.sin(rad)}" x2="${50 + 45 * Math.cos(rad)}" y2="${50 + 45 * Math.sin(rad)}"/>`; }
      g.innerHTML = h;
    });
    let hourly = null, dayStart = 0, current = null;
    const drawChart = (boot = false) => {
      const B_ = boot ? ' boot' : '';
      const svg = $('#wf-svg'), tip = $('#wf-tip'); if (!svg || !hourly) return;
      const W = 640, H = 250, L = 30, R = 12, T = 18, B = 182;
      const idx = []; for (let i = dayStart; i < dayStart + 13 && i < hourly.time.length; i++) idx.push(i);
      const sp = idx.map(i => hourly.wind_speed_10m[i]), top = Math.max(30, Math.ceil(Math.max(...sp) / 10) * 10);
      const x = k => L + k * (W - L - R) / (idx.length - 1), y = v => B - v / top * (B - T);
      let g = '<defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17c9d6" stop-opacity=".38"/><stop offset="1" stop-color="#17c9d6" stop-opacity=".02"/></linearGradient></defs><g class="grid">';
      for (let v = 0; v <= top; v += 10) g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`;
      g += '</g><g class="axis">';
      for (let v = 0; v <= top; v += 10) g += `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
      idx.forEach((i, k) => { if (k % 3 === 0) g += `<text x="${x(k)}" y="${H - 4}" text-anchor="middle">${hh(hourly.time[i])}</text>`; });
      g += '</g>';
      const pts = sp.map((v, k) => [x(k), y(v)]), path = pts.map((p, k) => (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      g += `<path d="${path} L${x(idx.length - 1)} ${B} L${L} ${B} Z" fill="url(#areaGrad)" class="area${B_}"/><path class="line${B_}" pathLength="1" d="${path}"/>`;
      const pk = sp.indexOf(Math.max(...sp));
      g += `<line class="cross" id="wf-cross" x1="${x(pk)}" x2="${x(pk)}" y1="${T - 6}" y2="${B + 32}"/>`;
      pts.forEach((p, k) => g += `<circle style="--k:${k}" class="dot${k === pk ? ' peak' : ''}${B_}" cx="${p[0]}" cy="${p[1]}" r="${k === pk ? 6 : 4}"/>`);
      idx.forEach((i, k) => g += `<path style="--k:${k}" class="arrow${B_}" transform="translate(${x(k)} ${B + 20}) rotate(${(hourly.wind_direction_10m[i] + 180) % 360})" d="M0 -7 L4.5 5 L0 2.5 L-4.5 5 Z"/>`);
      const bw = (W - L - R) / (idx.length - 1);
      idx.forEach((i, k) => g += `<rect class="hit" data-k="${k}" x="${x(k) - bw / 2}" y="${T - 10}" width="${bw}" height="${B - T + 46}"/>`);
      svg.innerHTML = g;
      const showAt = k => {
        const i = idx[k]; const c = $('#wf-cross', svg); c.setAttribute('x1', x(k)); c.setAttribute('x2', x(k));
        tip.innerHTML = `${hh(hourly.time[i])} · ${Math.round(hourly.wind_speed_10m[i])} kn · gusts ${Math.round(hourly.wind_gusts_10m[i])} · ${compass(hourly.wind_direction_10m[i])}`;
        const box = svg.getBoundingClientRect(), w = svg.parentElement.getBoundingClientRect();
        tip.style.left = Math.min(Math.max(box.left - w.left + x(k) / W * box.width, 120), w.width - 120) + 'px'; tip.hidden = false;
      };
      svg.onpointermove = e => { const r = e.target.closest('.hit'); if (r) showAt(+r.dataset.k); };
      svg.onpointerleave = () => showAt(pk);
      showAt(pk);
      tip.classList.toggle('boot', boot); if (boot) { void tip.offsetWidth; }
    };
    const drawDays = daily => {
      const byDay = {};
      hourly.time.forEach((t, i) => { const d = t.slice(0, 10), h = +t.slice(11, 13); if (h >= 10 && h <= 18) (byDay[d] ||= []).push(hourly.wind_speed_10m[i]); });
      $('#wf-days').innerHTML = daily.time.map((d, i) => {
        const a = byDay[d] || []; if (!a.length) return '';
        const kn = Math.round(a.reduce((s, v) => s + v, 0) / a.length), r = rating(kn);
        const name = new Date(d + 'T12:00').toLocaleDateString('en-US', { weekday: 'short' });
        return `<div class="wf-day r-${r}"><div class="d">${name}</div><div class="k">${kn}<em>kn</em></div><div class="wf-bar"><span style="--k:${i};width:${Math.min(100, kn / 30 * 100)}%"></span></div><div class="r">${ratingText(r, i)}</div></div>`;
      }).join('');
    };
    const load = async () => {
      try {
        const [wx, sea] = await Promise.all([
          fetch(WX).then(r => { if (!r.ok) throw 0; return r.json(); }),
          fetch(SEA).then(r => r.ok ? r.json() : null).catch(() => null)
        ]);
        const c = wx.current; hourly = wx.hourly;
        // Measured "now" from Flamingo Airport (TNCB) via the site's relay; model values if unavailable
        let obs = null;
        try { const r = await fetch(`${root}api/metar`, { cache: 'no-store' }); if (r.ok) { const m = (await r.json())[0]; if (m && m.wspd != null) obs = m; } } catch (e) {}
        if (obs) {
          c.wind_speed_10m = obs.wspd; if (obs.wdir !== 'VRB' && obs.wdir != null) c.wind_direction_10m = +obs.wdir;
          if (obs.wgst) c.wind_gusts_10m = obs.wgst; else c.wind_gusts_10m = Math.max(c.wind_gusts_10m, obs.wspd);
          if (obs.temp != null) c.temperature_2m = obs.temp;
        }
        c.__obs = !!obs; current = c;
        set('kn', Math.round(c.wind_speed_10m)); set('gust', Math.round(c.wind_gusts_10m)); set('temp', Math.round(c.temperature_2m));
        set('from', compass(c.wind_direction_10m)); set('char', character(c.wind_speed_10m, c.wind_gusts_10m));
        { const kn0 = Math.round(c.wind_speed_10m), g0 = c.wind_gusts_10m, sl = arxonSail(kn0), seed = new Date().getHours() + new Date().getDate() * 7;
          const parts = [pick(REMARK[rating(kn0)], seed), ...extra(kn0, g0, c.wind_direction_10m, c.temperature_2m).slice(0, 1)];
          if (sl) parts.push(pick([`Arxon would rig his ${sl}.`, `${sl} m² weather for Arxon.`, `Arxon's pick: the ${sl}.`], seed + 1));
          set('tip', parts.join(' ')); $$('[data-w="tip"]').forEach(el => el.className = 'w-tip r-' + rating(kn0)); }
        set('wave', sea && sea.current ? sea.current.wave_height.toFixed(1) : '–');
        const [ct, ci] = cond(c.weather_code); set('cond', ct); $$('[data-w="condicon"]').forEach(el => el.innerHTML = ICONS[ci]);
        $$('.compass .needle').forEach(n => n.style.transform = `rotate(${c.wind_direction_10m}deg)`);
        $$('[data-w="arrow"]').forEach(a => a.style.transform = `rotate(${(c.wind_direction_10m + 180) % 360}deg)`);
        const nowHr = +c.time.slice(11, 13), today = c.time.slice(0, 10);
        let s = hourly.time.findIndex(t => t.startsWith(today) && t.slice(11, 13) === '08'), label = '· today, 08:00–20:00';
        if (nowHr >= 19 || s < 0) { s = hourly.time.findIndex(t => !t.startsWith(today) && t.slice(11, 13) === '08'); label = '· tomorrow, 08:00–20:00'; }
        dayStart = Math.max(0, s); set('chartday', label);
        drawDays(wx.daily); if (windPanel.classList.contains('open')) drawChart();
        const obsTime = obs ? new Date(obs.obsTime * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Kralendijk' }) : null;
        set('src', obs ? `Now: measured at Flamingo Airport (TNCB) ${obsTime} · Forecast: Open-Meteo` : `Model forecast: Open-Meteo · updated ${hh(c.time)} local time`);
        if (status && !windPanel.classList.contains('booting')) status.textContent = obs ? 'Live · measured' : 'Live · model';
        windBtn.hidden = false;
      } catch (e) { windBtn.hidden = true; windPanel.classList.remove('open'); }
    };
    const scrim = $('#wind-scrim'), status = $('#wf-status'), typeEl = $('[data-type]');
    let bootTimers = [];
    const later = (fn, ms) => bootTimers.push(setTimeout(fn, ms));
    const countUp = (key, to, dur = 900, delay = 0) => $$(`.wind-panel [data-w="${key}"]`).forEach(el => {
      later(() => { const t0 = performance.now(); const step = t => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }, delay);
    });
    const boot = () => {
      bootTimers.forEach(clearTimeout); bootTimers = [];
      windPanel.classList.remove('booting'); void windPanel.offsetWidth; windPanel.classList.add('booting');
      // status readout
      const steps = [['Booting', 0], ['Reading Flamingo station', 450], ['Fetching Lac Bay forecast', 950], [current && current.__obs ? 'Live · measured' : 'Live', 1700]];
      steps.forEach(([t, ms]) => later(() => { status.textContent = t; }, ms));
      // title types itself
      const word = typeEl.dataset.type; typeEl.textContent = '';
      [...word].forEach((ch, i) => later(() => { typeEl.textContent = word.slice(0, i + 1); }, 120 + i * 55));
      // needle spins up from far behind and settles with an overshoot
      if (current) {
        const dir = current.wind_direction_10m;
        $$('.wind-panel .compass .needle').forEach(n => { n.classList.remove('boot'); n.style.transform = `rotate(${dir - 540}deg)`; void n.getBoundingClientRect(); n.classList.add('boot'); n.style.transform = `rotate(${dir}deg)`; });
        countUp('kn', Math.round(current.wind_speed_10m), 1100, 700);
        countUp('gust', Math.round(current.wind_gusts_10m), 1000, 900);
        countUp('temp', Math.round(current.temperature_2m), 900, 1000);
      }
      drawChart(true);
      later(() => windPanel.classList.remove('booting'), 2600);
    };
    const lock = on => {
      const sbw = innerWidth - document.documentElement.clientWidth;
      document.documentElement.classList.toggle('wind-lock', on);
      document.body.style.paddingRight = on && sbw ? sbw + 'px' : '';
      scrim.classList.toggle('on', on);
    };
    const setOpen = open => {
      windPanel.classList.toggle('open', open); windBtn.setAttribute('aria-expanded', open); lock(open);
      if (open) { if (still) drawChart(); else boot(); }
      else { bootTimers.forEach(clearTimeout); windPanel.classList.remove('booting'); status.textContent = 'Live'; typeEl.textContent = typeEl.dataset.type; }
    };
    windBtn.addEventListener('click', e => { e.stopPropagation(); setOpen(!windPanel.classList.contains('open')); });
    scrim.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && windPanel.classList.contains('open')) { setOpen(false); windBtn.focus(); } });
    addEventListener('resize', () => { if (windPanel.classList.contains('open')) drawChart(); });
    load(); setInterval(load, 15 * 60 * 1000);
  }
})();

/* ===== Typewriter quote ===== */
(() => {
  const els = document.querySelectorAll('[data-typewrite]');
  if (!els.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  els.forEach(el => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(' ').map(w => '<span class="tw-w" aria-hidden="true">' + [...w].map(c => '<span class="tw-c">' + c + '</span>').join('') + '</span>').join(' ');
    el.classList.add('tw-ready');
    const chars = el.querySelectorAll('.tw-c');
    if (reduce) { chars.forEach(c => c.classList.add('on')); return; }
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      let i = 0;
      el.classList.add('typing');
      const step = () => {
        if (i >= chars.length) { el.classList.remove('typing'); el.classList.add('typed'); return; }
        chars[i].classList.add('on');
        chars.forEach(c => c.classList.remove('caret'));
        chars[i].classList.add('caret');
        const ch = chars[i].textContent; i++;
        setTimeout(step, /[.,”]/.test(ch) ? 160 : 34);
      };
      step();
    }, { threshold: .45 });
    io.observe(el);
  });
})();

/* ===== Audience map: hovering a country row lights it up on the map ===== */
(() => {
  const sec = document.querySelector('.audience'); if (!sec) return;
  const svg = sec.querySelector('.aud-map svg');
  const on = cc => { svg.classList.toggle('hl-on', !!cc); sec.querySelectorAll('[data-cc]').forEach(el => el.classList.toggle('hl', el.dataset.cc === cc)); };
  sec.querySelectorAll('.aud-bars li[data-cc]').forEach(li => { li.addEventListener('mouseenter', () => on(li.dataset.cc)); li.addEventListener('mouseleave', () => on(null)); });
  sec.querySelectorAll('.aud-glow, .aud-tag').forEach(g => { g.style.cursor = 'pointer'; g.addEventListener('mouseenter', () => on(g.dataset.cc)); g.addEventListener('mouseleave', () => on(null)); });
})();

/* ===== Sponsorship ways: sail logo spaces also show from the first option, and on tap ===== */
(() => {
  const v = document.querySelector('.opp-visual'); if (!v) return;
  const opt = document.querySelector('.option[data-opt="0"]');
  if (opt) { opt.addEventListener('mouseenter', () => v.classList.add('show-sail')); opt.addEventListener('mouseleave', () => v.classList.remove('show-sail')); }
  v.addEventListener('click', () => { if (matchMedia('(hover: none)').matches) v.classList.toggle('show-sail'); });
})();

/* ===== Journey timeline (portfolio) ===== */
(() => {
  const tl = document.querySelector('[data-journey]'); if (!tl) return;
  const J = JSON.parse(tl.dataset.journey), n = J.length;
  const track = tl.querySelector('.tl-track'), knob = tl.querySelector('#tl-knob'), fill = tl.querySelector('#tl-fill');
  const nodes = [...tl.querySelectorAll('.tl-node')];
  const yr = tl.querySelector('#tl-year'), head = tl.querySelector('#tl-head'), desc = tl.querySelector('#tl-desc'), cta = tl.querySelector('#tl-cta'), kn = tl.querySelector('#tl-knob-n'), panel = tl.querySelector('.tl-panel');
  let cur = 0, auto = null, dragging = false;
  const pct = i => i / (n - 1) * 100;
  const setPos = p => { knob.style.left = p + '%'; fill.style.width = p + '%'; tl.querySelector('.tl-now').style.left = p + '%'; };
  const go = (i, user) => {
    i = Math.max(0, Math.min(n - 1, i)); const changed = i !== cur; cur = i;
    setPos(pct(i));
    nodes.forEach((b, k) => { b.setAttribute('aria-selected', k === i); b.classList.toggle('past', k < i); });
    kn.textContent = i === n - 1 ? '→' : i + 1; tl.classList.toggle('at-next', i === n - 1);
    if (changed || user === 'init') { panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap'); }
    yr.textContent = J[i].y; head.textContent = J[i].t; desc.textContent = J[i].d; cta.hidden = i !== n - 1;
    if (user === true) stop();
  };
  const stop = () => { clearInterval(auto); auto = null; };
  nodes.forEach(b => b.addEventListener('click', () => go(+b.dataset.i, true)));
  const fromX = x => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(100, (x - r.left) / r.width * 100)); };
  track.addEventListener('pointerdown', e => { if (e.target.closest('.tl-node')) return; dragging = true; stop(); track.setPointerCapture(e.pointerId); tl.classList.add('dragging'); setPos(fromX(e.clientX)); });
  track.addEventListener('pointermove', e => { if (!dragging) return; const p = fromX(e.clientX); setPos(p); const i = Math.round(p / 100 * (n - 1)); if (i !== cur) { go(i); setPos(p); } });
  const end = () => { if (!dragging) return; dragging = false; tl.classList.remove('dragging'); go(cur, true); };
  track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
  tl.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1, true); nodes[cur].focus(); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1, true); nodes[cur].focus(); } });
  go(0, 'init');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); auto = setInterval(() => { if (cur >= n - 1) return stop(); go(cur + 1); }, 2600); } }, { threshold: .5 });
    io.observe(tl);
  }
})();


/* ===== "Cool stuff" dropdown (Results + Portfolio) ===== */
(() => {
  document.querySelectorAll('.nav-group').forEach(g => {
    const b = g.querySelector('.nav-gbtn');
    const set = o => { g.classList.toggle('open', o); b.setAttribute('aria-expanded', o); };
    b.addEventListener('click', e => { e.stopPropagation(); set(!g.classList.contains('open')); });
    g.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover) and (min-width: 1024px)').matches) set(true); });
    g.addEventListener('mouseleave', () => { if (matchMedia('(hover: hover) and (min-width: 1024px)').matches) set(false); });
    document.addEventListener('click', e => { if (!g.contains(e.target)) set(false); });
    g.addEventListener('keydown', e => { if (e.key === 'Escape') { set(false); b.focus(); } });
  });
})();

/* ===== Taty's message: open it → typing dots → the quote types into a bubble ===== */
(() => {
  const card = document.getElementById('tq-card'); if (!card) return;
  const env = card.querySelector('#tq-env'), q = card.querySelector('.tq-q'), status = card.querySelector('#tq-status');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const text = q.textContent;
  q.innerHTML = text.split(' ').map(w => '<span class="tw-w" style="display:inline-block;white-space:nowrap">' + [...w].map(c => '<span class="tw-c">' + c + '</span>').join('') + '</span>').join(' ');
  const chars = q.querySelectorAll('.tw-c');
  let opened = false;
  const open = () => {
    if (opened) return; opened = true;
    env.setAttribute('aria-expanded', 'true'); card.classList.add('opened'); status.textContent = 'typing…';
    if (reduce) { chars.forEach(c => c.classList.add('on')); card.classList.add('typed', 'done'); status.textContent = 'online'; return; }
    setTimeout(() => {
      card.classList.add('typed'); let i = 0;
      const step = () => {
        if (i >= chars.length) { status.textContent = 'online'; setTimeout(() => card.classList.add('done'), 300); return; }
        chars[i].classList.add('on'); const ch = chars[i].textContent; i++;
        setTimeout(step, /[.,”]/.test(ch) ? 140 : 26);
      };
      step();
    }, 1100);
  };
  env.addEventListener('click', open);
})();

/* ===== Taty's message drops in when the section scrolls into view ===== */
(() => {
  const sec = document.querySelector('.tq-section'); if (!sec) return;
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { sec.classList.add('tq-in'); return; }
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); setTimeout(() => sec.classList.add('tq-in'), 250); } }, { threshold: .55 });
  io.observe(sec);
})();

/* ===== Race kit: tilt toward the cursor (2.5D) ===== */
(() => {
  const box = document.querySelector('[data-tilt]'); if (!box || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const stage = box.querySelector('.kit-stage'), zone = box.closest('.kit') || box;
  zone.addEventListener('pointermove', e => {
    const r = box.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    box.classList.add('tilting'); stage.style.setProperty('--ry', (x * 18).toFixed(2) + 'deg'); stage.style.setProperty('--rx', (-y * 12).toFixed(2) + 'deg');
  });
  zone.addEventListener('pointerleave', () => { box.classList.remove('tilting'); stage.style.setProperty('--ry', '0deg'); stage.style.setProperty('--rx', '0deg'); });
})();

/* ===== Results stats: tooltip on the finishing-position chart ===== */
(() => {
  const plot = document.querySelector('.sf-plot'); if (!plot) return;
  const tip = plot.querySelector('.sf-tip'), svg = plot.querySelector('svg');
  const show = g => { const c = g.querySelector('.dot'), b = c.getBoundingClientRect(), p = plot.getBoundingClientRect();
    tip.textContent = g.dataset.tip; tip.style.left = (b.left + b.width / 2 - p.left) + 'px'; tip.style.top = (b.top - p.top) + 'px'; tip.hidden = false; };
  svg.querySelectorAll('.sf-pt').forEach(g => { g.addEventListener('mouseenter', () => show(g)); g.addEventListener('focus', () => show(g)); g.addEventListener('mouseleave', () => tip.hidden = true); g.addEventListener('blur', () => tip.hidden = true); });
})();

/* ===== Day / night toggle (remembered per visitor) ===== */
(() => {
  const btn = document.getElementById('theme-btn'); if (!btn) return;
  const root = document.documentElement, meta = document.querySelector('meta[name="theme-color"]');
  const apply = t => { root.setAttribute('data-theme', t); btn.setAttribute('aria-label', t === 'light' ? 'Switch to night mode' : 'Switch to day mode'); if (meta) meta.content = t === 'light' ? '#f4f1ea' : '#031216'; };
  apply(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.classList.add('theme-anim'); apply(next); setTimeout(() => root.classList.remove('theme-anim'), 700);
    try { localStorage.setItem('arxon-theme', next); } catch (e) {}
  });
})();

/* ===== Intro loader: first page of a visit only; hides once fonts are in (min 1.5s, max 3.5s) ===== */
(() => {
  const el = document.getElementById('pageLoader'); if (!el) return;
  if (document.documentElement.classList.contains('no-loader')) { el.remove(); return; }
  const t0 = performance.now(); let done = false;
  const hide = () => { if (done) return; done = true; el.classList.add('loaded'); try { sessionStorage.setItem('arxon-intro', '1'); } catch (e) {} setTimeout(() => el.remove(), 700); };
  const ready = () => setTimeout(hide, Math.max(0, 1500 - (performance.now() - t0)));
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(ready);
  setTimeout(hide, 3500);
})();
