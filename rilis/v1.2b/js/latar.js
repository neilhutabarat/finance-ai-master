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
      'html[data-fm-latar-pro][data-fm-latar-card="dk"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body :is(main .ios-glass,main .white-ice-glass-card){background-image:radial-gradient(300px 220px at var(--cx,50%) var(--cy,-60%),rgba(255,222,150,.13),transparent 70%),linear-gradient(155deg,#2b2111 0%,#130f08 40%,#080604 72%,#1d160a 100%)!important;box-shadow:inset 0 0 0 1px rgba(205,167,92,.34),0 10px 26px -14px rgba(0,0,0,.6)!important}' +
      'html[data-fm-latar-pro][data-fm-latar-card="lt"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body :is(main .ios-glass,main .white-ice-glass-card){background-image:radial-gradient(300px 220px at var(--cx,50%) var(--cy,-60%),rgba(140,100,30,.07),transparent 70%),linear-gradient(155deg,#ecdfc3 0%,#f6efdf 40%,#fcf9f2 72%,#f0e5cd 100%)!important;box-shadow:inset 0 0 0 1px rgba(160,120,40,.28),0 10px 26px -16px rgba(90,60,10,.35)!important}' +
      'html[data-fm-latar-pro][data-fm-latar-hdr="dk"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body header.oneui-hero{background-image:radial-gradient(300px 220px at var(--cx,50%) var(--cy,-60%),rgba(255,222,150,.13),transparent 70%),linear-gradient(155deg,#2b2111 0%,#130f08 40%,#080604 72%,#1d160a 100%)!important;box-shadow:inset 0 0 0 1px rgba(205,167,92,.34),0 10px 26px -14px rgba(0,0,0,.6)!important}' +
      'html[data-fm-latar-pro][data-fm-latar-hdr="lt"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body header.oneui-hero{background-image:radial-gradient(300px 220px at var(--cx,50%) var(--cy,-60%),rgba(140,100,30,.07),transparent 70%),linear-gradient(155deg,#ecdfc3 0%,#f6efdf 40%,#fcf9f2 72%,#f0e5cd 100%)!important;box-shadow:inset 0 0 0 1px rgba(160,120,40,.28),0 10px 26px -16px rgba(90,60,10,.35)!important}' +
      'html[data-fm-latar-pro]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body main :is(.ios-glass,.white-ice-glass-card) :is(input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=button]):not([type=submit]),select,textarea):focus{border-color:#c49a45!important}' +
      'html[data-fm-latar-pro]:not(#_):not(#__):not(#___):not(#____) body #fm-latar{background:radial-gradient(620px 460px at var(--mx) var(--my),rgba(255,222,150,.16),transparent 65%),linear-gradient(155deg,#33270f 0%,#120d06 38%,#000 70%,#22190b 100%)!important}' +
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
    if (hd) { var tn = hd.querySelector('h1,h2,p,span,div') || hd, m = (getComputedStyle(tn).color.match(/[\d.]+/g) || [0, 0, 0]), lum = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255; h.setAttribute('data-fm-latar-hdr', lum > 0.5 ? 'dk' : 'lt'); }
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

  /* Pop-up mudah dibaca: panel pop-up yang tembus pandang dibuat padat (warna sama, tanpa transparansi),
     dan latar di belakangnya diredupkan + diburamkan supaya isi halaman tidak ikut terbaca. */
  var popT = 0;
  function rgba(c) { var m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; var p = m[1].split(/[,\s\/]+/).filter(Boolean).map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  function solid(el) {
    if (!el || el.nodeType !== 1 || el.hasAttribute('data-fm-solid')) return;
    var c = rgba(getComputedStyle(el).backgroundColor);
    if (!c || c.a >= 0.97) return;
    if (c.a < 0.05) return; // tidak berlatar sama sekali: biarkan (wadah tata letak)
    el.setAttribute('data-fm-solid', '1');
    el.style.setProperty('background-color', 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')', 'important');
    el.style.setProperty('-webkit-backdrop-filter', 'none', 'important'); el.style.setProperty('backdrop-filter', 'none', 'important');
  }
  function popups() {
    popT = 0;
    var W = innerWidth, H = innerHeight;
    [].forEach.call(document.body ? document.body.children : [], function (ov) {
      if (ov.id === 'fm-latar' || /^fm-upg/.test(ov.id || '') || ov.tagName === 'SCRIPT' || ov.tagName === 'STYLE') return;
      var cs = getComputedStyle(ov);
      if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return;
      var r = ov.getBoundingClientRect();
      if (r.width < W * 0.9 || r.height < H * 0.9) return;
      if (!ov.hasAttribute('data-fm-solid-ov')) {
        var oc = rgba(cs.backgroundColor);
        if (oc && oc.a > 0.02) {
          ov.setAttribute('data-fm-solid-ov', '1');
          if (oc.a < 0.5) ov.style.setProperty('background-color', 'rgba(' + oc.r + ',' + oc.g + ',' + oc.b + ',.55)', 'important');
          ov.style.setProperty('-webkit-backdrop-filter', 'blur(6px)', 'important'); ov.style.setProperty('backdrop-filter', 'blur(6px)', 'important');
        }
      }
      /* panel = anak (atau cucu, bila anaknya hanya pembungkus) yang lebih kecil dari layar */
      [].forEach.call(ov.children, function (k) {
        var kr = k.getBoundingClientRect(); if (!kr.width || !kr.height) return;
        if (kr.width < W * 0.98 || kr.height < H * 0.98) { solid(k); return; }
        [].forEach.call(k.children, function (g) { var gr = g.getBoundingClientRect(); if (gr.width && gr.height && (gr.width < W * 0.98 || gr.height < H * 0.98)) solid(g); });
      });
    });
  }
  function popLater() { if (!popT) popT = setTimeout(popups, 60); }
  function popInit() {
    try { new MutationObserver(popLater).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'open'] }); } catch (e) {}
    popLater();
  }
  if (document.body) popInit(); else document.addEventListener('DOMContentLoaded', popInit);
  /* paket Pro aktif (asli atau hasil upgrade/coba): warna latar & kartu ikut kartu Pro (hitam-emas / sampanye) */
  function syncPro() {
    var pro = false;
    try { var R = { basic: 1, plus: 2, pro: 3 }, b = 'basic'; try { b = window.FM_PLANS.tierOf(window.getActiveTenant ? getActiveTenant() : null) || 'basic'; } catch (e) {}
      var u = (window.FM_UPG && FM_UPG.tier()) || ''; pro = (R[u] || 0) >= 3 || R[b] >= 3; } catch (e) {}
    if (pro) h.setAttribute('data-fm-latar-pro', '1'); else h.removeAttribute('data-fm-latar-pro');
  }
  setTimeout(syncPro, 300); setInterval(syncPro, 4000);
  window.FM_LATAR = { ancInv: ancInv, light: light };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
