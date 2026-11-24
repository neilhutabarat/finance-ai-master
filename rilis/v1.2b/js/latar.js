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
    s.textContent = '#fm-latar{position:fixed;left:0;top:0;right:0;bottom:0;z-index:-1;pointer-events:none;--mx:30%;--my:12%;background:radial-gradient(620px 460px at 30% 12%,rgba(255,255,255,.2),transparent 65%),linear-gradient(155deg,#26262b 0%,#0a0a0c 38%,#000 70%,#16161a 100%)}' +
      'html[data-fm-latar-on]:not(#_):not(#__):not(#___):not(#____) body{background:transparent!important;background-image:none!important}' +
      'html[data-fm-latar-card]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body :is(main .ios-glass,main .white-ice-glass-card){background-color:transparent!important;background-repeat:no-repeat!important;background-size:auto!important}' +
      'html[data-fm-latar-card="dk"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body :is(main .ios-glass,main .white-ice-glass-card){background-image:linear-gradient(155deg,#1f1f24 0%,#101013 40%,#08080a 72%,#141418 100%)!important}' +
      'html[data-fm-latar-card="lt"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body :is(main .ios-glass,main .white-ice-glass-card){background-image:linear-gradient(155deg,#e9e9ee 0%,#f5f5f8 40%,#fcfcfd 72%,#f0f0f3 100%)!important}' +
      'html[data-fm-latar-card="lt"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body main :is(.ios-glass,.white-ice-glass-card) :is(input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=button]):not([type=submit]),select,textarea){border:1.5px solid rgba(20,20,30,.34)!important;background-color:#fff!important;box-shadow:inset 0 1px 2px rgba(0,0,0,.05)!important}' +
      'html[data-fm-latar-card="dk"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body main :is(.ios-glass,.white-ice-glass-card) :is(input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=button]):not([type=submit]),select,textarea){border:1.5px solid rgba(255,255,255,.34)!important;background-color:rgba(255,255,255,.07)!important}' +
      'html[data-fm-latar-hdr]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body header.oneui-hero{background-color:transparent!important;background-repeat:no-repeat!important;background-size:auto!important}' +
      'html[data-fm-latar-hdr="dk"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body header.oneui-hero{background-image:linear-gradient(155deg,#1f1f24 0%,#101013 40%,#08080a 72%,#141418 100%)!important}' +
      'html[data-fm-latar-hdr="lt"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body header.oneui-hero{background-image:linear-gradient(155deg,#e9e9ee 0%,#f5f5f8 40%,#fcfcfd 72%,#f0f0f3 100%)!important}' +
      'html[data-fm-latar-pro][data-fm-latar-card="dk"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body :is(main .ios-glass,main .white-ice-glass-card){background-image:linear-gradient(155deg,#2b2111 0%,#130f08 40%,#080604 72%,#1d160a 100%)!important;box-shadow:inset 0 0 0 1px rgba(205,167,92,.34),0 10px 26px -14px rgba(0,0,0,.6)!important}' +
      'html[data-fm-latar-pro][data-fm-latar-card="lt"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body :is(main .ios-glass,main .white-ice-glass-card){background-image:linear-gradient(155deg,#ecdfc3 0%,#f6efdf 40%,#fcf9f2 72%,#f0e5cd 100%)!important;box-shadow:inset 0 0 0 1px rgba(160,120,40,.28),0 10px 26px -16px rgba(90,60,10,.35)!important}' +
      'html[data-fm-latar-pro][data-fm-latar-hdr="dk"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body header.oneui-hero{background-image:linear-gradient(155deg,#2b2111 0%,#130f08 40%,#080604 72%,#1d160a 100%)!important;box-shadow:inset 0 0 0 1px rgba(205,167,92,.34),0 10px 26px -14px rgba(0,0,0,.6)!important}' +
      'html[data-fm-latar-pro][data-fm-latar-hdr="lt"]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body header.oneui-hero{background-image:linear-gradient(155deg,#ecdfc3 0%,#f6efdf 40%,#fcf9f2 72%,#f0e5cd 100%)!important;box-shadow:inset 0 0 0 1px rgba(160,120,40,.28),0 10px 26px -16px rgba(90,60,10,.35)!important}' +
      'html[data-fm-latar-pro]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______) body main :is(.ios-glass,.white-ice-glass-card) :is(input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=button]):not([type=submit]),select,textarea):focus{border-color:#c49a45!important}' +
      'html[data-fm-latar-pro]:not(#_):not(#__):not(#___):not(#____) body #fm-latar{background:radial-gradient(620px 460px at 30% 12%,rgba(255,222,150,.16),transparent 65%),linear-gradient(155deg,#33270f 0%,#120d06 38%,#000 70%,#22190b 100%)!important}' +
      'html body #fm-latar#fm-latar{filter:none!important}html body #fm-latar#fm-latar.si{filter:invert(1) hue-rotate(180deg)!important}';
    document.head.appendChild(s);
  }
  /* Pada mode tertentu halaman dibalik warnanya oleh pembungkusnya. Hitung jumlah pembalikan di atas elemen ini
     supaya hasil akhirnya sesuai tema: terang = kartu perak, gelap = kartu hitam. */
  function ancInv(node) { var n = 0, e = node.parentElement; while (e) { try { if (/invert/.test(getComputedStyle(e).filter)) n++; } catch (x) {} e = e.parentElement; } return n % 2; }
  function light() { return h.getAttribute('data-fm-gelap') !== '1'; }
  function sync() {
    var on = h.getAttribute('data-fm-look') === 'base';
    if (!on) { h.removeAttribute('data-fm-latar-on'); h.removeAttribute('data-fm-latar-card'); h.removeAttribute('data-fm-latar-hdr'); if (el) { el.remove(); el = null; } glow(); return; }
    h.setAttribute('data-fm-latar-on', '1');
    css();
    if (!el) { el = document.createElement('div'); el.id = 'fm-latar'; el.setAttribute('aria-hidden', 'true'); document.body.insertBefore(el, document.body.firstChild); }
    var si = (light() ? 1 : 0) ^ ancInv(el);
    el.className = si ? 'si' : '';
    var c = document.querySelector('main .ios-glass, main .white-ice-glass-card');
    if (c) { var odd = ancInv(c.firstElementChild || c) ^ (/invert/.test(getComputedStyle(c).filter) ? 1 : 0); h.setAttribute('data-fm-latar-card', ((light() ? 0 : 1) ^ odd) ? 'dk' : 'lt'); }
    var hd = document.querySelector('header.oneui-hero');
    if (hd) { var tn = hd.querySelector('h1,h2,p,span,div') || hd, m = (getComputedStyle(tn).color.match(/[\d.]+/g) || [0, 0, 0]), lum = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255; h.setAttribute('data-fm-latar-hdr', lum > 0.5 ? 'dk' : 'lt'); }
    glow();
  }
  /* Bayangan kursor = satu lapisan bulat yang hanya digeser (transform) mengikuti kursor.
     Tidak ada gambar ulang kartu atau latar setiap gerakan, jadi bayangan menempel di kursor tanpa tertinggal.
     Lapisan ada di dalam shadow DOM supaya gerakannya tidak memicu pengamat halaman lain. */
  var gHost = null, gDot = null, gx = -9999, gy = -9999;
  function glow() {
    if (!h.hasAttribute('data-fm-latar-on')) { if (gHost) { gHost.remove(); gHost = gDot = null; } return; }
    if (!gHost) {
      gHost = document.createElement('div'); gHost.id = 'fm-glow'; gHost.setAttribute('aria-hidden', 'true');
      gHost.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:40;pointer-events:none';
      var sr = gHost.attachShadow ? gHost.attachShadow({ mode: 'open' }) : gHost;
      sr.innerHTML = '<style>i{position:fixed;left:-260px;top:-260px;width:520px;height:520px;border-radius:50%;pointer-events:none;will-change:transform;transform:translate3d(-9999px,-9999px,0);opacity:0;transition:opacity .25s}i.on{opacity:1}' +
        'i.w{background:radial-gradient(closest-side,rgba(255,255,255,.11),rgba(255,255,255,.04) 55%,transparent)}i.k{background:radial-gradient(closest-side,rgba(0,0,0,.06),rgba(0,0,0,.02) 55%,transparent)}' +
        'i.w.p{background:radial-gradient(closest-side,rgba(255,220,140,.14),rgba(255,220,140,.05) 55%,transparent)}i.k.p{background:radial-gradient(closest-side,rgba(130,90,20,.08),rgba(130,90,20,.025) 55%,transparent)}</style><i></i>';
      gDot = sr.querySelector('i'); document.body.appendChild(gHost);
    }
    /* mode gelap = cahaya terang; mode terang = bayangan tipis. Dibalik bila lapisan ikut terkena filter invert halaman. */
    var wantLight = (light() ? 0 : 1) ^ ancInv(gHost);
    gDot.className = (wantLight ? 'w' : 'k') + (h.hasAttribute('data-fm-latar-pro') ? ' p' : '') + (gx > -9000 ? ' on' : '');
  }
  function move(e) {
    if (e.pointerType === 'touch') return;
    gx = e.clientX; gy = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0; if (!gDot) return;
      gDot.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
      if (gDot.className.indexOf(' on') < 0) gDot.className += ' on';
    });
  }
  function init() {
    sync(); document.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () { if (gDot) gDot.className = gDot.className.replace(' on', ''); });
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
    var was = h.hasAttribute('data-fm-latar-pro'); if (pro) h.setAttribute('data-fm-latar-pro', '1'); else h.removeAttribute('data-fm-latar-pro'); if (was !== pro && gDot) glow();
  }
  setTimeout(syncPro, 300); setInterval(syncPro, 4000);
  window.FM_LATAR = { ancInv: ancInv, light: light };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
