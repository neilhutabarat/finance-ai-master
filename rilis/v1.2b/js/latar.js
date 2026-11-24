/* latar.js — latar halaman bergaya kartu Plus (v1.2b): gradasi perak di mode terang, hitam di mode gelap,
   dengan bayangan lembut yang mengikuti kursor. Hanya aktif pada tampilan dasar (tanpa wallpaper).
   Dipakai Kasir, Manager, dan Owner. Tidak menyentuh data apa pun. */
(function () {
  'use strict';
  var PAGE = (location.pathname.split('/').pop() || '').toLowerCase();
  if (!/^(kasir|manager|dashboard)\.html$/.test(PAGE)) return;
  var h = document.documentElement, el = null, mx = 30, my = 12, raf = 0;
  function css() {
    if (document.getElementById('fm-latar-css')) return;
    var s = document.createElement('style'); s.id = 'fm-latar-css';
    s.textContent = '#fm-latar{position:fixed;left:0;top:0;right:0;bottom:0;z-index:-1;pointer-events:none;--mx:30%;--my:12%;background:radial-gradient(620px 460px at var(--mx) var(--my),rgba(255,255,255,.2),transparent 65%),linear-gradient(155deg,#26262b 0%,#0a0a0c 38%,#000 70%,#16161a 100%)}' +
      'html[data-fm-latar-on]:not(#_):not(#__):not(#___):not(#____) body{background:transparent!important;background-image:none!important}' +
      'html[data-fm-latar-card]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body :is(main .ios-glass,main .white-ice-glass-card){background-color:transparent!important;background-repeat:no-repeat!important;background-size:auto!important}' +
      'html[data-fm-latar-card="dk"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body :is(main .ios-glass,main .white-ice-glass-card){background-image:radial-gradient(300px 220px at var(--cx,50%) var(--cy,-60%),rgba(255,255,255,.10),transparent 70%),linear-gradient(155deg,#1f1f24 0%,#101013 40%,#08080a 72%,#141418 100%)!important}' +
      'html[data-fm-latar-card="lt"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body :is(main .ios-glass,main .white-ice-glass-card){background-image:radial-gradient(300px 220px at var(--cx,50%) var(--cy,-60%),rgba(0,0,0,.045),transparent 70%),linear-gradient(155deg,#e9e9ee 0%,#f5f5f8 40%,#fcfcfd 72%,#f0f0f3 100%)!important}' +
      'html[data-fm-latar-card="lt"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body main :is(.ios-glass,.white-ice-glass-card) :is(input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=button]):not([type=submit]),select,textarea){border:1.5px solid rgba(20,20,30,.34)!important;background-color:#fff!important;box-shadow:inset 0 1px 2px rgba(0,0,0,.05)!important}' +
      'html[data-fm-latar-card="dk"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body main :is(.ios-glass,.white-ice-glass-card) :is(input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=button]):not([type=submit]),select,textarea){border:1.5px solid rgba(255,255,255,.34)!important;background-color:rgba(255,255,255,.07)!important}' +
      'html[data-fm-latar-hdr]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body header.oneui-hero{background-color:transparent!important;background-repeat:no-repeat!important;background-size:auto!important}' +
      'html[data-fm-latar-hdr="dk"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body header.oneui-hero{background-image:radial-gradient(300px 220px at var(--cx,50%) var(--cy,-60%),rgba(255,255,255,.10),transparent 70%),linear-gradient(155deg,#1f1f24 0%,#101013 40%,#08080a 72%,#141418 100%)!important}' +
      'html[data-fm-latar-hdr="lt"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body header.oneui-hero{background-image:radial-gradient(300px 220px at var(--cx,50%) var(--cy,-60%),rgba(0,0,0,.045),transparent 70%),linear-gradient(155deg,#e9e9ee 0%,#f5f5f8 40%,#fcfcfd 72%,#f0f0f3 100%)!important}' +
      'html body #fm-latar#fm-latar{filter:none!important}html body #fm-latar#fm-latar.si{filter:invert(1) hue-rotate(180deg)!important}';
    document.head.appendChild(s);
  }
  /* Pada mode tertentu halaman dibalik warnanya oleh pembungkusnya. Hitung jumlah pembalikan di atas elemen ini
     supaya hasil akhirnya sesuai tema: terang = kartu perak, gelap = kartu hitam. */
  function ancInv(node) { var n = 0, e = node.parentElement; while (e) { try { if (/invert/.test(getComputedStyle(e).filter)) n++; } catch (x) {} e = e.parentElement; } return n % 2; }
  function light() { return h.getAttribute('data-fm-gelap') !== '1'; }
  function sync() {
    var on = h.getAttribute('data-fm-look') === 'base';
    if (!on) { h.removeAttribute('data-fm-latar-on'); h.removeAttribute('data-fm-latar-card'); h.removeAttribute('data-fm-latar-hdr'); if (el) { el.remove(); el = null; } return; }
    h.setAttribute('data-fm-latar-on', '1');
    css();
    if (!el) { el = document.createElement('div'); el.id = 'fm-latar'; el.setAttribute('aria-hidden', 'true'); document.body.insertBefore(el, document.body.firstChild); }
    var si = (light() ? 1 : 0) ^ ancInv(el);
    el.className = si ? 'si' : '';
    var c = document.querySelector('main .ios-glass, main .white-ice-glass-card');
    if (c) { var odd = ancInv(c.firstElementChild || c) ^ (/invert/.test(getComputedStyle(c).filter) ? 1 : 0); h.setAttribute('data-fm-latar-card', ((light() ? 0 : 1) ^ odd) ? 'dk' : 'lt'); }
    var hd = document.querySelector('header.oneui-hero');
    if (hd) { var o2 = ancInv(hd.firstElementChild || hd) ^ (/invert/.test(getComputedStyle(hd).filter) ? 1 : 0); h.setAttribute('data-fm-latar-hdr', ((light() ? 0 : 1) ^ o2) ? 'dk' : 'lt'); }
  }
  function move(e) {
    mx = e.clientX / Math.max(1, innerWidth) * 100; my = e.clientY / Math.max(1, innerHeight) * 100;
    if (raf) return; var px = e.clientX, py = e.clientY;
    raf = requestAnimationFrame(function () {
      raf = 0; if (el) { el.style.setProperty('--mx', mx.toFixed(1) + '%'); el.style.setProperty('--my', my.toFixed(1) + '%'); }
      if (!h.hasAttribute('data-fm-latar-card')) return;
      var hh = document.querySelector('header.oneui-hero'); if (hh) { var hr = hh.getBoundingClientRect(); hh.style.setProperty('--cx', (px - hr.left).toFixed(0) + 'px'); hh.style.setProperty('--cy', (py - hr.top).toFixed(0) + 'px'); }
      [].forEach.call(document.querySelectorAll('main .ios-glass, main .white-ice-glass-card'), function (c) {
        var r = c.getBoundingClientRect(); if (r.bottom < -300 || r.top > innerHeight + 300) return;
        c.style.setProperty('--cx', (px - r.left).toFixed(0) + 'px'); c.style.setProperty('--cy', (py - r.top).toFixed(0) + 'px');
      });
    });
  }
  function init() {
    sync(); document.addEventListener('pointermove', move, { passive: true });
    try { new MutationObserver(function () { sync(); }).observe(h, { attributes: true, attributeFilter: ['data-fm-look', 'data-fm-gelap', 'data-fm-invert', 'data-fm-black'] }); } catch (e) {}
    window.addEventListener('fm:gelap', sync);
    setTimeout(sync, 1500);
  }
  window.FM_LATAR = { ancInv: ancInv, light: light };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
