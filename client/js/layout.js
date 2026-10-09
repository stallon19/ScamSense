// Shared layout: nav, footer, theme, intro, scroll animations, parallax, small helpers.
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---------- helpers other scripts use ---------- */
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }
  function setLabel(btn, text) {
    var inner = $('.roll-in', btn);
    if (inner) { inner.textContent = text; inner.setAttribute('data-t', text); } else btn.textContent = text;
  }
  window.SS = { esc: esc, toast: toast, setLabel: setLabel, reduce: reduce };

  /* ---------- nav + footer ---------- */
  var path = (location.pathname.replace(/\/+$/, '').replace(/\.html$/, '') || '/').replace(/^\/index$/, '/');
  var LINKS = [['/', 'Home'], ['/check', 'Check message'], ['/practice', 'Practice Mode'], ['/learn', 'Learn'], ['/about', 'About']];
  var LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3l11 4v8c0 7-4.6 11.6-11 14C9.6 26.6 5 22 5 15V7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M11 17h10" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round"/></svg>';
  var link = function (l) { return '<a href="' + l[0] + '"' + (l[0] === path ? ' aria-current="page"' : '') + '>' + l[1] + '</a>'; };

  var nav = $('#site-nav');
  if (nav) {
    nav.innerHTML =
      '<header class="nav" id="nav"><div class="container nav-inner">' +
      '<a class="brand" href="/" aria-label="ScamSense home">' + LOGO + '<span>ScamSense</span></a>' +
      '<nav class="nav-links" aria-label="Main">' + LINKS.map(link).join('') + '</nav>' +
      '<div class="nav-actions">' +
      '<button class="icon-btn theme-toggle" id="themeBtn" type="button" aria-label="Switch between light and dark theme">' +
      '<svg class="moon" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>' +
      '<svg class="sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>' +
      '<a class="btn btn-primary btn-sm nav-cta" href="/check">Check a message</a>' +
      '<button class="icon-btn menu-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="mobileMenu" aria-label="Open menu">' +
      '<svg class="open" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg><svg class="close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '</div></div>' +
      '<div class="mobile-menu" id="mobileMenu">' + LINKS.map(link).join('') + '<a class="btn btn-primary" href="/check">Check a message</a></div></header>';
  }
  var foot = $('#site-footer');
  if (foot) {
    foot.innerHTML =
      '<footer class="footer"><div class="container"><div class="footer-grid">' +
      '<div><a class="brand" href="/">' + LOGO + '<span>ScamSense</span></a><p class="muted" style="max-width:34ch;margin:16px 0 0">Check a suspicious message, see the proof, and practise saying no.</p></div>' +
      '<nav aria-label="Product"><b>Product</b><a href="/check">Check message</a><a href="/practice">Practice Mode</a><a href="/forecast">Scam forecast</a><a href="/learn">Scam library</a></nav>' +
      '<nav aria-label="Company"><b>More</b><a href="/about">About</a><a href="/help">I lost money</a><a href="/privacy">Privacy and terms</a></nav>' +
      '</div><div class="footer-note"><span>ScamSense is an AI assistant and can be wrong. If you lost money, call 1930 or visit cybercrime.gov.in.</span><span>2026 ScamSense</span></div></div></footer>';
  }

  /* ---------- theme ---------- */
  var themeBtn = $('#themeBtn');
  function applyThemeColor() {
    var m = $('meta[name="theme-color"]');
    if (m) m.setAttribute('content', root.dataset.theme === 'dark' ? '#0F1412' : '#F7F5F0');
  }
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('ss-theme', next); } catch (e) {}
    applyThemeColor();
  });
  applyThemeColor();

  /* ---------- mobile menu ---------- */
  var menuBtn = $('#menuBtn'), menu = $('#mobileMenu');
  if (menuBtn && menu) {
    var setMenu = function (open) { menu.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
    menuBtn.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    matchMedia('(min-width: 1080px)').addEventListener('change', function () { setMenu(false); });
  }

  /* ---------- button label roll ---------- */
  $$('.btn:not([data-noroll])').forEach(function (b) {
    if (b.children.length || !b.textContent.trim()) return;
    var t = b.textContent.trim();
    b.innerHTML = '<span class="roll"><span class="roll-in" data-t="' + esc(t) + '">' + esc(t) + '</span></span>';
  });

  /* ---------- word-by-word headings ---------- */
  $$('[data-split]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w, i) { return '<span class="w"><span style="--i:' + i + '">' + esc(w) + '</span></span>'; }).join(' ');
  });

  /* ---------- scroll progress + nav state ---------- */
  var bar = $('#progress'), navEl = $('#nav');
  function onScroll() {
    var h = root.scrollHeight - innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
    if (navEl) navEl.classList.toggle('scrolled', scrollY > 8);
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- reveal on scroll ---------- */
  function startReveal() {
    var targets = $$('[data-split], .reveal');
    if (!('IntersectionObserver' in window) || reduce) { targets.forEach(function (t) { t.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (t) { io.observe(t); });

    var steps = $$('.step');
    if (steps.length) {
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { steps.forEach(function (s) { s.classList.toggle('active', s === e.target); }); } });
      }, { rootMargin: '-35% 0px -45% 0px' });
      steps.forEach(function (s) { so.observe(s); });
    }
  }

  /* ---------- parallax: scroll depth for every [data-depth], plus mouse on the hero stage ---------- */
  var layers = [];
  function measure() {
    layers = $$('[data-depth]').map(function (el) {
      var prev = el.style.transform; el.style.transform = 'none';
      var r = el.getBoundingClientRect();
      var l = { el: el, depth: parseFloat(el.dataset.depth) || 0, top: r.top + scrollY, h: r.height, mouse: !!el.closest('.stage') };
      el.style.transform = prev; return l;
    });
  }
  if (!reduce) {
    var tx = 0, ty = 0, cx = 0, cy = 0, lastY = -1;
    var fine = matchMedia('(pointer: fine)').matches;
    if (fine) addEventListener('mousemove', function (e) { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });
    var frame = function () {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      var moved = scrollY !== lastY || Math.abs(tx - cx) > 0.0005 || Math.abs(ty - cy) > 0.0005;
      if (moved) {
        lastY = scrollY;
        var vh = innerHeight;
        for (var i = 0; i < layers.length; i++) {
          var l = layers[i], d = scrollY + vh / 2 - (l.top + l.h / 2);
          if (Math.abs(d) > vh * 1.8) continue;
          var x = l.mouse ? cx * l.depth * 150 : 0;
          var y = d * l.depth + (l.mouse ? cy * l.depth * 100 : 0);
          l.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
        }
      }
      requestAnimationFrame(frame);
    };
    measure(); requestAnimationFrame(frame);
    addEventListener('resize', function () { measure(); lastY = -1; });
    addEventListener('load', function () { measure(); lastY = -1; });
  }

  /* ---------- intro, then start page animations ---------- */
  function ready() {
    root.classList.remove('intro-on');
    root.classList.add('ready');
    startReveal();
    if (!reduce) setTimeout(function () { measure(); }, 50);
  }
  var intro = $('#intro');
  if (intro && root.classList.contains('intro-on')) {
    var done = false;
    var finish = function () {
      if (done) return; done = true;
      try { sessionStorage.setItem('ss-intro', '1'); } catch (e) {}
      intro.classList.add('out');
      setTimeout(ready, 700);
    };
    var skip = $('#introSkip'); if (skip) { skip.addEventListener('click', finish); skip.focus(); }
    setTimeout(finish, 2300);
  } else {
    ready();
  }
})();
