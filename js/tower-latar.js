/* tower-latar.js — Control Tower bergaya kartu Plus (sama seperti laman klien v1.3):
   latar perak, panel bergradasi perak, dan cahaya lembut yang mengikuti kursor.
   Tema gelap Tower membalik seluruh #tw-root (filter invert), jadi perak otomatis menjadi hitam.
   Hanya tampilan; tidak menyentuh data apa pun. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;
  var P = 'html[data-tw-ck]:not(#_):not(#__):not(#___):not(#____):not(#_____):not(#______)';
  var BG = 'linear-gradient(155deg,#d4d4da 0%,#e9e9ed 38%,#f8f8fa 70%,#dfdfe4 100%)';
  var CARD = 'linear-gradient(155deg,#dadae0 0%,#ebebef 40%,#f8f8fa 72%,#e2e2e7 100%)';
  var PANELS = ['#tw-bar', '#tw-ctrl', '#tw-tbw', '#tw-strip', '.bx', '#tw-ken .tw-group'].map(function (s) { return P + ' #tw-root ' + s; }).join(',');
  var css =
    P + ' #tw-root{background:radial-gradient(900px 600px at 28% 8%,rgba(255,255,255,.75),transparent 62%),' + BG + '!important;background-attachment:fixed!important}' +
    PANELS + '{background:' + CARD + '!important;background-color:#ebebef!important;border-color:rgba(20,20,30,.10)!important;box-shadow:0 10px 26px -16px rgba(15,15,25,.35),inset 0 1px 0 rgba(255,255,255,.8)!important}' +
    /* isi panel tetap putih bersih supaya kontras dengan perak */
    P + ' #tw-root #tw-ken .tw-group .fm-act.tw-tile{background:#fbfbfc!important;border-color:rgba(20,20,30,.10)!important}' +
    P + ' #tw-root #tw-ctrl :is(input,select){background:#fff!important;border-color:rgba(20,20,30,.22)!important}';
  var st = document.createElement('style'); st.id = 'tw-latar-css'; st.textContent = css; document.head.appendChild(st);

  /* cahaya kursor: satu lapisan bulat yang hanya digeser (transform), di dalam shadow DOM supaya tidak memicu pengamat lain */
  var host = null, dot = null, x = 0, y = 0, raf = 0;
  function ensure() {
    var root = document.getElementById('tw-root'); if (!root) return null;
    if (host && host.parentNode === root) return dot;
    host = document.createElement('div'); host.id = 'tw-glow'; host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:5;pointer-events:none';
    var sr = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    /* bayangan tipis gelap: di tema terang tampak sebagai bayangan, di tema gelap (dibalik) tampak sebagai cahaya */
    sr.innerHTML = '<style>i{position:fixed;left:-260px;top:-260px;width:520px;height:520px;border-radius:50%;pointer-events:none;will-change:transform;opacity:0;transition:opacity .25s;' +
      'background:radial-gradient(closest-side,rgba(0,0,0,.07),rgba(0,0,0,.025) 55%,transparent)}i.on{opacity:1}</style><i></i>';
    dot = sr.querySelector('i'); root.appendChild(host); return dot;
  }
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    x = e.clientX; y = e.clientY; if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0; var d = ensure(); if (!d) return;
      d.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; if (!d.classList.contains('on')) d.classList.add('on');
    });
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', function () { if (dot) dot.classList.remove('on'); });
})();
