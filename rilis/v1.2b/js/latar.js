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
      'html body #fm-latar#fm-latar{filter:none!important}html body #fm-latar#fm-latar.si{filter:invert(1) hue-rotate(180deg)!important}';
    document.head.appendChild(s);
  }
  /* Pada mode tertentu halaman dibalik warnanya oleh pembungkusnya. Hitung jumlah pembalikan di atas elemen ini
     supaya hasil akhirnya sesuai tema: terang = kartu perak, gelap = kartu hitam. */
  function ancInv(node) { var n = 0, e = node.parentElement; while (e) { try { if (/invert/.test(getComputedStyle(e).filter)) n++; } catch (x) {} e = e.parentElement; } return n % 2; }
  function light() { return h.getAttribute('data-fm-gelap') !== '1'; }
  function sync() {
    var on = h.getAttribute('data-fm-look') === 'base';
    if (!on) { if (el) { el.remove(); el = null; } return; }
    css();
    if (!el) { el = document.createElement('div'); el.id = 'fm-latar'; el.setAttribute('aria-hidden', 'true'); document.body.insertBefore(el, document.body.firstChild); }
    var si = (light() ? 1 : 0) ^ ancInv(el);
    el.className = si ? 'si' : '';
  }
  function move(e) {
    mx = e.clientX / Math.max(1, innerWidth) * 100; my = e.clientY / Math.max(1, innerHeight) * 100;
    if (raf) return; raf = requestAnimationFrame(function () { raf = 0; if (el) { el.style.setProperty('--mx', mx.toFixed(1) + '%'); el.style.setProperty('--my', my.toFixed(1) + '%'); } });
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
