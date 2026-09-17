/* ARXON GOMPERTS, shared behaviour.
   Loaded by all six pages. Every lookup is null-guarded, because not every
   page carries every element (only the homepage has the loader, for example). */

// ============ PAGE LOADER ============
// Homepage only. A 2.2s loader on every navigation would be hostile.
window.addEventListener('load', () => {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;
  setTimeout(() => loader.classList.add('loaded'), 2200);
});

// ============ CUSTOM CURSOR ============
const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');
if (cursor && cursorRing) {
  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let ringX = 0, ringY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  // Smooth cursor follow with lerp
  (function animateCursor() {
    const speed = 0.2;
    const ringSpeed = 0.1;
    cursorX += (mouseX - cursorX) * speed;
    cursorY += (mouseY - cursorY) * speed;
    ringX += (mouseX - ringX) * ringSpeed;
    ringY += (mouseY - ringY) * ringSpeed;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';
    requestAnimationFrame(animateCursor);
  })();
  document.querySelectorAll('a, button, .accolade, .news-card, .wall-item').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hover-active');
      cursorRing.classList.add('hover-active');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hover-active');
      cursorRing.classList.remove('hover-active');
    });
  });
}

// ============ NAV SCROLL ============
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ============ SCROLL PROGRESS ============
const scrollProgress = document.getElementById('scrollProgress');
if (scrollProgress) {
  window.addEventListener('scroll', () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    // Short pages have no scrollable height. Guard against dividing by zero.
    const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    scrollProgress.style.width = pct + '%';
  });
}

// ============ HAMBURGER MENU ============
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileNav.classList.toggle('open');
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
  });
}

// ============ REVEAL ON SCROLL ============
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ============ COUNTER ANIMATION ============
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting || entry.target.dataset.counted) return;
    entry.target.dataset.counted = 'true';
    const target = parseInt(entry.target.dataset.target, 10);
    const duration = 1500;
    const start = performance.now();
    (function updateCount(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      entry.target.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(updateCount);
    })(start);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

// ============ SMOOTH ANCHOR LINKS ============
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
