/* ui110.js — dock pulau v1.1.0 (BETA 1).
   Cara kerja: dock bawaan (#fm-dock) TIDAK dibongkar, hanya disembunyikan,
   lalu dock pulau digambar sendiri dengan gayanya sendiri. Setiap tombol
   meneruskan klik ke tombol aslinya, jadi fungsinya persis sama.
   Matikan dengan menambahkan ?ui=0 pada alamat. Bila ada langkah yang gagal,
   semuanya dikembalikan dan dock lama tampil seperti semula. */
(function () {
  'use strict';
  try {
    var pth = (location.pathname.split('/').pop() || '').toLowerCase();
    if (!/kasir|manager|dashboard|partner/.test(pth)) return;
    if (/[?&]ui=0/.test(location.search)) return;
  } catch (e) { return; }

  /* ===== KARTU (v1.1.0) — hanya rupa: posisi, ukuran grid, dan urutan tidak diubah =====
     Halaman Owner/Manager pada tema Base dibalik warnanya oleh theme.js (filter invert),
     jadi semua warna di sini memakai currentColor atau variabel yang ikut terbalik. */
  try {
    var PG = ':is([data-fm-page="owner"],[data-fm-page="manager"])';
    if (/dashboard|manager/.test(pth) && !document.getElementById('fm-ui110-kartu')) {
      var K = 'html' + PG + ':not(#_):not(#__):not(#___) body ';
      var KB = 'html' + PG + '[data-fm-look="base"]:not(#_):not(#__):not(#___) body ';
      var KO = 'html' + PG + '[data-fm-look="original"]:not(#_):not(#__):not(#___) body ';
      var NUM = '"Plus Jakarta Sans",-apple-system,BlinkMacSystemFont,system-ui,sans-serif';
      function mk(d) {
        return 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>') + '")';
      }
      var IKON = {
        'Ringkasan Hari Ini': '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>',
        'Metode Bayar Hari Ini': '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/>',
        'Target Omzet': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
        'Stok Menipis': '<path d="M21 16V8l-9-5-9 5v8l9 5z"/><path d="m3.3 7.5 8.7 5 8.7-5M12 22V12.5"/>',
        'Laba & Margin per Produk': '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M8 17v-4M13 17V9M18 17v-7"/>'
      };
      var kc =
        'html' + PG + '{--u-sh1:rgba(15,23,42,.05);--u-sh2:rgba(15,23,42,.20);--u-edge:rgba(255,255,255,.6)}' +
        'html' + PG + '[data-fm-invert]{--u-sh1:rgba(240,232,213,.05);--u-sh2:rgba(240,232,213,.20);--u-edge:rgba(0,0,0,.6)}' +
        KB + 'main .ios-glass{border-color:transparent!important;border-radius:20px!important;box-shadow:0 1px 2px var(--u-sh1),0 10px 26px -14px var(--u-sh2)!important}' +
        KB + 'main .ios-glass::before{display:none!important}' +
        KO + 'main .ios-glass{border:1px solid var(--u-edge)!important;border-radius:20px!important}' +
        K + 'main .ios-glass .font-mono,' + K + 'main .fm-ic b,' + K + 'main .fm-ic td{font-family:' + NUM + '!important;font-variant-numeric:tabular-nums;letter-spacing:-.02em}' +
        K + 'main>.grid:first-child h3{font-weight:800!important;letter-spacing:-.03em!important}' +
        K + 'main>.grid:first-child>.ios-glass>div.justify-between:not(.absolute)>span{font-weight:700!important;letter-spacing:.05em!important}' +
        K + 'main>.grid:first-child>.ios-glass>div.justify-between:not(.absolute)>svg,' + K + 'main>.grid:first-child>.ios-glass>div.justify-between:not(.absolute)>i{width:24px!important;height:24px!important;padding:5px;margin:-4px 0;border-radius:8px;box-sizing:border-box;flex:none;' +
          'background:color-mix(in srgb,currentColor 14%,transparent);stroke-width:2.2}' +
        K + 'main .fm-ic h4{position:relative;padding-left:24px!important;min-height:18px;display:flex;align-items:center}' +
        K + 'main .fm-ic h4::before{content:"";position:absolute;left:0;top:50%;width:18px;height:18px;margin-top:-9px;border-radius:6px;background:color-mix(in srgb,currentColor 9%,transparent)}' +
        K + 'main .fm-ic h4::after{content:"";position:absolute;left:3px;top:50%;width:12px;height:12px;margin-top:-6px;background:currentColor;opacity:.7;-webkit-mask:var(--u-ik) center/contain no-repeat;mask:var(--u-ik) center/contain no-repeat}' +
        K + 'main .fm-ic .fm-row+.fm-row{border-top:1px solid color-mix(in srgb,currentColor 9%,transparent)}' +
        K + 'main .fm-ic .fm-row b{font-weight:700}' +
        K + 'main .fm-tg button{border-radius:999px!important;font-weight:700!important}';
      Object.keys(IKON).forEach(function (n) {
        kc += K + 'main .fm-ic[data-fm-i="' + n.replace(/"/g, '\\"') + '"]{--u-ik:' + mk(IKON[n]) + '}';
      });
      kc += K + 'main .fm-ic:not(' + Object.keys(IKON).map(function (n) { return '[data-fm-i="' + n + '"]'; }).join('):not(') + ') h4{padding-left:0!important}' +
            K + 'main .fm-ic:not(' + Object.keys(IKON).map(function (n) { return '[data-fm-i="' + n + '"]'; }).join('):not(') + ') h4::before,' +
            K + 'main .fm-ic:not(' + Object.keys(IKON).map(function (n) { return '[data-fm-i="' + n + '"]'; }).join('):not(') + ') h4::after{display:none}';
      var ks = document.createElement('style'); ks.id = 'fm-ui110-kartu'; ks.textContent = kc;
      (document.head || document.documentElement).appendChild(ks);
    }
  } catch (e) {}

  /* ===== KARTU KASIR (v1.1.0) — hanya rupa, posisi dan ukuran tetap ===== */
  try {
    if (/kasir/.test(pth) && !document.getElementById('fm-ui110-kasir')) {
      var Q = 'html[data-fm-page="kasir"]:not(#_):not(#__):not(#___) body ';
      var QB = 'html[data-fm-page="kasir"][data-fm-look="base"]:not([data-fm-black]):not(#_):not(#__):not(#___) body ';
      var QO = 'html[data-fm-page="kasir"][data-fm-look="original"]:not([data-fm-black]):not(#_):not(#__):not(#___) body ';
      var NUMK = '"Plus Jakarta Sans",-apple-system,BlinkMacSystemFont,system-ui,sans-serif';
      var qc =
        QB + 'main .white-ice-glass-card{border-color:transparent!important;border-radius:20px!important;box-shadow:0 1px 2px rgba(15,23,42,.05),0 10px 26px -14px rgba(15,23,42,.22)!important}' +
        QB + 'main .white-ice-glass-card::before{display:none!important}' +
        QO + 'main .white-ice-glass-card{border:1px solid rgba(255,255,255,.6)!important;border-radius:20px!important}' +
        Q + 'main .font-mono:not(input){font-family:' + NUMK + '!important;font-variant-numeric:tabular-nums;letter-spacing:-.02em!important}' +
        Q + '#kasir-live-balance{font-weight:800!important;letter-spacing:-.035em!important}' +
        Q + '#kas-total-in,' + Q + '#kas-total-out,' + Q + '#kas-net,' + Q + '#draft-total-amount{font-weight:800!important}';
      var qs = document.createElement('style'); qs.id = 'fm-ui110-kasir'; qs.textContent = qc;
      (document.head || document.documentElement).appendChild(qs);
    }
  } catch (e) {}

  /* ===== TAMPILAN DARI CT (Tower) + TERANG/GELAP ===== */
  var TOKO0 = '';
  try { TOKO0 = (new URLSearchParams(location.search).get('toko') || '').toLowerCase().trim(); } catch (e) {}
  var KGELAP = 'fm_gelap_' + (TOKO0 || 'master');

  function gelapAktif() { try { return localStorage.getItem(KGELAP) === '1'; } catch (e) { return false; } }
  function terapkanGelap() {
    try {
      var h = document.documentElement;
      var asli = h.getAttribute('data-fm-native') === 'dark' ? 'dark' : 'light';
      var g = gelapAktif();
      if (g) h.setAttribute('data-fm-gelap', '1'); else h.removeAttribute('data-fm-gelap');
      var balik = g ? (asli === 'light') : (asli === 'dark');
      if (balik) h.setAttribute('data-fm-invert', '1'); else h.removeAttribute('data-fm-invert');
    } catch (e) {}
  }
  function setGelap(v) {
    try { localStorage.setItem(KGELAP, v ? '1' : '0'); } catch (e) {}
    terapkanGelap();
    try { window.dispatchEvent(new CustomEvent('fm:gelap')); } catch (e) {}
  }

  try {
    var tn0 = (typeof getActiveTenant === 'function') ? getActiveTenant() : null;
    var tpl = (tn0 && tn0.tampilan) || {};
    if (/^(kabut|krem|netral|daun)$/.test(tpl.latar || '')) document.documentElement.setAttribute('data-fm-latar', tpl.latar);
    var lookCt = (tpl.look === 'original') ? 'original' : 'base';
    if (TOKO0) {
      try { localStorage.setItem('fm_look_' + TOKO0, lookCt); } catch (e) {}
      try { localStorage.setItem('fm_look_master', lookCt); } catch (e) {}
      var kini = document.documentElement.getAttribute('data-fm-look');
      if (kini && kini !== lookCt && !sessionStorage.getItem('fm_ct_look_rl')) {
        sessionStorage.setItem('fm_ct_look_rl', '1');
        location.reload();
        return;
      }
      if (kini === lookCt) { try { sessionStorage.removeItem('fm_ct_look_rl'); } catch (e) {} }
    }
  } catch (e) {}

  terapkanGelap();
  try { window.addEventListener('fm:theme', function () { setTimeout(terapkanGelap, 0); }); } catch (e) {}

  function pasangTombolTema() {
    try {
      if (!window.FM_THEME) window.FM_THEME = {};
      if (window.FM_THEME.__gelap110) return;
      window.FM_THEME.__gelap110 = true;
      window.FM_THEME.toggle = function () { setGelap(!gelapAktif()); return gelapAktif() ? 'gelap' : 'terang'; };
      window.FM_THEME.gelap = gelapAktif;
      window.FM_THEME.setGelap = setGelap;
    } catch (e) {}
  }
  pasangTombolTema();
  setTimeout(pasangTombolTema, 400); setTimeout(pasangTombolTema, 1500);

  try {
    if (!document.getElementById('fm-ui110-set')) {
      var sc = document.createElement('style'); sc.id = 'fm-ui110-set';
      sc.textContent = 'html:not(#_) body .fm-sec:has([data-look]){display:none!important}' +
        'html:not(#_) body .fm-sec.fm-tg110 .fm-prev{height:34px;border-radius:10px;margin-bottom:5px}';
      (document.head || document.documentElement).appendChild(sc);
    }
    var pasangSet = function () {
      try {
        var old = document.querySelector('[data-look]');
        if (!old) return;
        var sec = old.closest('.fm-sec'); if (!sec) return;
        sec.style.display = 'none';
        if (sec.parentNode.querySelector('.fm-tg110')) {
          var on = gelapAktif();
          sec.parentNode.querySelectorAll('.fm-tg110 [data-gelap]').forEach(function (b) {
            b.classList.toggle('on', (b.getAttribute('data-gelap') === '1') === on);
          });
          return;
        }
        var box = document.createElement('div'); box.className = 'fm-sec fm-tg110';
        box.innerHTML = '<div class="fm-lab">Tema</div><div class="fm-modes">' +
          '<button class="fm-mode' + (gelapAktif() ? '' : ' on') + '" data-gelap="0" type="button"><div class="fm-prev fm-keep" style="background:linear-gradient(135deg,#ffffff,#e7ebf2)"></div>Terang</button>' +
          '<button class="fm-mode' + (gelapAktif() ? ' on' : '') + '" data-gelap="1" type="button"><div class="fm-prev fm-keep" style="background:linear-gradient(135deg,#0b0d12,#1b2029)"></div>Gelap</button></div>';
        box.querySelectorAll('[data-gelap]').forEach(function (b) {
          b.addEventListener('click', function () { setGelap(b.getAttribute('data-gelap') === '1'); pasangSet(); });
        });
        sec.parentNode.insertBefore(box, sec);
      } catch (e) {}
    };
    document.addEventListener('click', function () { setTimeout(pasangSet, 60); }, true);
    window.addEventListener('fm:gelap', function () { setTimeout(pasangSet, 0); });
  } catch (e) {}

  /* ===== RUPA ONE UI (v1.1.0) ===== */
  try {
    if (!document.getElementById('fm-ui110-oneui')) {
      var H = 'html:not(#_):not(#__):not(#___)';
      var B0 = H + '[data-fm-look="base"]';
      var JK = '"Plus Jakarta Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif';
      var oc =
        'html{--o-pil:#ffffff;--o-ink:#0f172a;--o-bg:#eef1f6;--o-surf:#ffffff;--o-surf2:#f4f6fa;--o-line:#e5e9f0;--o-ink2:#5b6676;--o-acc:var(--fm-accent,#4f46e5);--o-on:#ffffff;--o-sh:rgba(15,23,42,.07);--o-sh2:rgba(15,23,42,.18);--o-ash:rgba(79,70,229,.45)}' +
        'html[data-fm-latar="krem"]{--o-bg:#f4efe6}html[data-fm-latar="netral"]{--o-bg:#f1f1f2}html[data-fm-latar="daun"]{--o-bg:#e9f1ec}' +
        'html[data-fm-native="dark"][data-fm-latar="krem"]{--o-bg:#140f06!important}html[data-fm-native="dark"][data-fm-latar="netral"]{--o-bg:#0e0e0f!important}html[data-fm-native="dark"][data-fm-latar="daun"]{--o-bg:#0a120d!important}' +
        'html[data-fm-native="dark"]{--o-pil:#07090d;--o-ink:#e1e9fc;--o-bg:#0c0f14;--o-surf:#000000;--o-surf2:#0b0906;--o-line:#13171e;--o-ink2:#909bab;--o-acc:#8693ff;--o-on:#000000;--o-sh:rgba(240,232,213,.07);--o-sh2:rgba(240,232,213,.18);--o-ash:rgba(134,147,255,.45)}' +
        'html[data-fm-gelap][data-fm-native="dark"]:not(#_):not(#__):not(#___){--s-surf:rgba(255,255,255,.06)!important;--s-line:rgba(255,255,255,.1)!important;' +
          '--s-hi:rgba(255,255,255,.13)!important;--s-shadow:rgba(0,0,0,.75)!important;--s-gloss:rgba(255,255,255,.045)!important;--s-bg:#05060a!important;' +
          '--s-tint:rgba(255,255,255,.05)!important;--s-b2:rgba(255,255,255,.1)!important;--s-b2l:rgba(255,255,255,.14)!important;--s-b2t:#f3f4f6!important}' +
        'html[data-fm-gelap][data-fm-native="dark"]:not(#_):not(#__):not(#___) .fm-actions .fm-act{background:rgba(255,255,255,.06)!important;' +
          'border:1px solid rgba(255,255,255,.12)!important;color:var(--o-ink)!important;box-shadow:none!important}' +
        'html[data-fm-gelap][data-fm-native="dark"]:not(#_):not(#__):not(#___) .fm-actions .fm-act span,' +
          'html[data-fm-gelap][data-fm-native="dark"]:not(#_):not(#__):not(#___) .fm-actions .fm-act b{color:var(--o-ink)!important}' +
        H + ' body,' + H + ' body button,' + H + ' body input,' + H + ' body select,' + H + ' body textarea,' + H + ' body h1,' + H + ' body h2,' + H + ' body h3,' + H + ' body h4{font-family:' + JK + '!important}' +
        H + ' body main .font-mono:not(input){font-family:' + JK + '!important;font-variant-numeric:tabular-nums;letter-spacing:-.02em!important}' +
        B0 + ',' + B0 + ' body{background:var(--o-bg)!important;background-image:none!important}' +
        B0 + '::before{display:none!important}' +
        B0 + ' body main .ios-glass,' + B0 + ' body main .white-ice-glass-card{background:var(--o-surf)!important;background-image:none!important;border:0!important;border-radius:20px!important;' +
          'box-shadow:0 1px 2px var(--o-sh),0 10px 26px -14px var(--o-sh2)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' +
        B0 + ' body main .ios-glass>.absolute[class*="blur"],' + B0 + ' body main .white-ice-glass-card>.absolute[class*="blur"]{display:none!important}' +
        B0 + ' body main .ios-glass::before,' + B0 + ' body main .white-ice-glass-card::before{display:none!important}' +
        B0 + ' body header.oneui-hero{border:0!important;box-shadow:0 1px 2px var(--o-sh),0 10px 26px -16px var(--o-sh2)!important}' +
        B0 + ' body main .glass-input,' + B0 + ' body main select.glass-input{background:var(--o-surf2)!important;border:1px solid transparent!important;box-shadow:none!important}' +
        B0 + ' body main .glass-input:focus{border-color:var(--o-acc)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--o-acc) 18%,transparent)!important}' +
        B0 + ' body main .white-ice-glass-card [class*="bg-white/"],' + B0 + ' body main .ios-glass [class*="bg-white/"]{background:var(--o-surf2)!important;border-color:transparent!important}' +
        B0 + ' body main .white-ice-glass-card button[class*="bg-slate-900"]:not([id]),' + B0 + ' body main .white-ice-glass-card button[class*="bg-white"]{background:var(--o-surf2)!important;border-color:transparent!important;box-shadow:none!important;color:var(--o-ink)!important}' +
        H + ' body #btn-save-draft,' + H + ' body #btn-finalize,' + H + ' body main .fm-tg button,' + H + ' body main button[class*="bg-gradient"]{background:var(--o-acc)!important;background-image:none!important;color:var(--o-on)!important;' +
          'border:0!important;border-radius:999px!important;box-shadow:0 6px 14px -6px var(--o-ash)!important}' +
        H + ' body #btn-save-draft *,' + H + ' body #btn-finalize *{color:inherit!important}' +
        H + ' body #btn-save-draft:active,' + H + ' body #btn-finalize:active{transform:translateY(1px)!important}' +
        H + ' body main>.grid:first-child>.ios-glass>div.justify-between:not(.absolute){flex-direction:row-reverse!important;justify-content:flex-end!important;gap:8px!important}' +
        H + ' body main>.grid:first-child>.ios-glass>div.justify-between:not(.absolute)>span{color:var(--o-ink2)!important}' +
        H + ' body main>.grid:first-child h3{font-weight:800!important;letter-spacing:-.03em!important}' +
        H + ' body main>.grid:first-child>.ios-glass>div.justify-between:not(.absolute)>svg{width:24px!important;height:24px!important;padding:5px;margin:-4px 0;border-radius:8px;box-sizing:border-box;flex:none;background:color-mix(in srgb,currentColor 14%,transparent);stroke-width:2.2}' +
        '@media(min-width:1024px){' +
          H + ' body header.oneui-hero .font-mono{font-family:' + JK + '!important;font-variant-numeric:tabular-nums;letter-spacing:0!important}' +
          H + ' body header.oneui-hero>div>div:last-child{gap:6px!important;justify-content:flex-end!important}' +
          H + ' body header.oneui-hero #premium-widgets-container{display:contents!important}' +
        '}' +
        H + ' body main .fm-ic .fm-row>span{color:var(--o-ink2)!important;opacity:1!important}' +
        H + ' body main .fm-ic .fm-row b{font-weight:700}';
      var os = document.createElement('style'); os.id = 'fm-ui110-oneui'; os.textContent = oc;
      (document.head || document.documentElement).appendChild(os);
    }
  } catch (e) {}

  try { if (!window.matchMedia || !matchMedia('(min-width:1024px)').matches) return; } catch (e) { return; }

  var LOGO = '<svg viewBox="0 0 120 120" width="28" height="28" fill="none" aria-hidden="true"><g transform="scale(1.875)" fill="currentColor" fill-rule="evenodd"><path d="M33.7 9.1L32.3 9.2L30.9 9.3L29.5 9.4L28.1 9.6L26.7 9.9L25.3 10.3L24 10.7L22.6 11.2L21.3 11.8L19.9 12.5L18.6 13.3L17.4 14.1L16.2 15L15 16L13.9 17.1L12.8 18.2L11.8 19.3L10.9 20.5L10 21.8L9.2 23L8.6 24.3L8 25.7L7.4 27L7 28.4L6.6 29.8L6.3 31.2L6.2 32.6L6 34L6 35.3L6 36.7L6.2 38.1L6.4 39.4L6.7 40.8L7.1 42L7.6 43.2L8.2 44.4L8.9 45.5L9.8 46.5L10.7 47.3L11.6 48L12.7 48.6L13.8 49L15 49.3L16.2 49.4L17.4 49.2L18.6 49L19.7 48.5L20.9 47.9L22 47.1L23 46.3L24 45.3L25 44.2L25.9 43L26.7 41.8L27.5 40.5L28.2 39.2L28.9 37.8L29.5 36.5L30.1 35.1L30.6 33.7L31.1 32.3L31.5 30.9L31.9 29.6L32.3 28.2L32.6 26.9L32.9 25.6L33.1 24.4L33.2 23.3L33.2 22.3L33.2 21.4L33.1 20.7L32.9 20.1L32.6 19.7L32.2 19.5L31.8 19.5L31.3 19.7L30.8 20.1L30.3 20.6L29.8 21.4L29.2 22.3L28.8 23.3L28.3 24.4L27.8 25.6L27.3 26.9L26.9 28.1L26.4 29.5L25.9 30.8L25.4 32.1L24.9 33.5L24.3 34.8L23.6 36L22.9 37.2L22.2 38.3L21.4 39.3L20.5 40.1L19.6 40.9L18.6 41.4L17.6 41.7L16.6 41.9L15.7 41.8L14.8 41.6L13.9 41.1L13.1 40.5L12.4 39.7L11.8 38.7L11.4 37.7L11 36.5L10.8 35.3L10.7 34L10.7 32.7L10.9 31.4L11.1 30L11.4 28.7L11.9 27.4L12.4 26.1L13.1 24.8L13.8 23.6L14.6 22.5L15.5 21.4L16.5 20.4L17.6 19.5L18.7 18.7L19.9 18L21.1 17.4L22.4 16.8L23.7 16.4L25 16L26.4 15.8L27.8 15.6L29.1 15.4L30.5 15.3L31.9 15.3L33.3 15.3L34.7 15.3L36.1 15.4L37.5 15.6L38.8 15.8L40.2 16.2L41.5 16.6L42.8 17.1L44 17.7L45.2 18.5L46.3 19.3L47.3 20.3L48.3 21.3L49.1 22.4L49.9 23.6L50.6 24.8L51.1 26.1L51.6 27.4L51.9 28.8L52.1 30.2L52.2 31.5L52.2 32.9L52 34.3L51.8 35.6L51.4 37L51 38.3L50.4 39.6L49.7 40.9L48.9 42.1L48 43.3L47 44.5L46 45.5L44.9 46.5L43.8 47.5L42.6 48.4L41.5 49.2L40.4 50L39.4 50.8L38.5 51.4L37.7 52.1L37.1 52.6L36.7 53.2L36.5 53.6L36.5 54L36.7 54.4L37.1 54.6L37.7 54.8L38.5 54.9L39.5 54.8L40.5 54.7L41.6 54.4L42.9 54.1L44.1 53.6L45.3 53.1L46.6 52.4L47.8 51.7L49 50.8L50.1 49.9L51.2 48.9L52.2 47.8L53.2 46.7L54 45.5L54.8 44.2L55.5 42.9L56.1 41.6L56.6 40.3L57.1 38.9L57.4 37.5L57.7 36.2L57.9 34.8L58 33.4L58 32L57.9 30.6L57.8 29.2L57.6 27.8L57.3 26.4L56.9 25L56.4 23.7L55.9 22.4L55.2 21.1L54.5 19.8L53.7 18.6L52.9 17.4L51.9 16.3L50.8 15.2L49.7 14.2L48.6 13.4L47.3 12.6L46.1 11.9L44.8 11.2L43.4 10.7L42.1 10.3L40.7 9.9L39.3 9.6L37.9 9.4L36.5 9.2L35.1 9.2Z"/><g transform="translate(35.5 33) rotate(-4) scale(.62) translate(-32 -32)"><path d="M29.5 12.2L29 12.4L28.6 12.7L28.1 13.1L27.6 13.6L27.1 14.1L26.6 14.8L26.1 15.4L25.6 16.1L25.1 16.9L24.7 17.6L24.2 18.4L23.8 19.2L23.3 20L22.9 20.8L22.5 21.6L22 22.4L21.6 23.2L21.2 24L20.7 24.8L20.3 25.6L19.9 26.4L19.5 27.2L19.1 28L18.6 28.8L18.2 29.6L17.8 30.4L17.4 31.2L17 32.1L16.6 32.9L16.2 33.7L15.8 34.5L15.4 35.3L15 36.1L14.6 37L14.2 37.8L13.8 38.6L13.4 39.4L13.1 40.2L12.7 41.1L12.3 41.9L12 42.7L11.6 43.5L11.3 44.3L11 45.1L10.8 45.9L10.5 46.7L10.4 47.4L10.3 48.1L10.3 48.8L10.3 49.4L10.5 49.9L10.7 50.4L10.9 50.7L11.3 50.9L11.6 50.9L12 50.9L12.4 50.7L12.9 50.4L13.3 50L13.7 49.5L14.1 48.9L14.5 48.2L14.9 47.5L15.3 46.8L15.7 46L16.1 45.3L16.6 44.5L17 43.7L17.4 42.9L17.9 42.1L18.4 41.4L18.9 40.6L19.4 39.9L19.9 39.2L20.5 38.5L21.1 37.9L21.8 37.4L22.5 36.8L23.1 36.4L23.9 36L24.6 35.6L25.3 35.4L26.1 35.3L26.8 35.2L27.4 35.3L28.1 35.4L28.7 35.7L29.3 36L29.8 36.5L30.2 37L30.6 37.7L30.9 38.4L31.2 39.1L31.5 39.9L31.7 40.8L31.9 41.6L32.1 42.5L32.3 43.4L32.5 44.3L32.7 45.2L33 46L33.3 46.8L33.7 47.6L34.1 48.4L34.5 49.1L35 49.8L35.6 50.4L36.2 50.9L36.9 51.4L37.6 51.8L38.3 52.2L39.1 52.4L39.8 52.6L40.6 52.7L41.5 52.7L42.3 52.6L43.1 52.5L43.9 52.2L44.7 52L45.5 51.6L46.2 51.2L47 50.8L47.7 50.3L48.4 49.8L49 49.2L49.6 48.7L50.2 48L50.8 47.4L51.3 46.7L51.8 46L52.2 45.3L52.6 44.5L52.9 43.8L53.1 43.1L53.3 42.4L53.4 41.8L53.4 41.2L53.4 40.7L53.3 40.2L53.1 39.9L52.8 39.7L52.5 39.6L52.2 39.6L51.8 39.8L51.4 40.1L51 40.5L50.6 40.9L50.2 41.5L49.7 42.1L49.2 42.7L48.7 43.4L48.2 44L47.6 44.6L47 45.2L46.3 45.8L45.7 46.3L45 46.7L44.3 47L43.5 47.3L42.8 47.5L42.1 47.6L41.4 47.6L40.7 47.4L40 47.2L39.5 46.9L38.9 46.4L38.4 45.9L38 45.3L37.7 44.6L37.4 43.8L37.1 43L36.9 42.2L36.8 41.3L36.6 40.4L36.5 39.5L36.3 38.6L36.2 37.7L36 36.8L35.8 36L35.5 35.1L35.2 34.3L34.9 33.6L34.5 32.9L34 32.2L33.5 31.6L32.9 31.1L32.3 30.6L31.6 30.1L31 29.7L30.3 29.3L29.7 28.9L29.1 28.4L28.6 28L28.1 27.5L27.8 27L27.5 26.4L27.3 25.8L27.2 25.1L27.3 24.4L27.4 23.7L27.5 23L27.8 22.2L28.1 21.4L28.4 20.7L28.7 19.9L29.1 19.1L29.5 18.3L29.9 17.5L30.2 16.8L30.5 16.1L30.7 15.4L30.9 14.7L31 14.1L31.1 13.5L31 13.1L30.9 12.7L30.6 12.4L30.3 12.2L29.9 12.2Z"/></g></g></svg>';
  var IC = {"chat": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', "tema": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', "absen": '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>', "stok": '<path d="M21 16V8l-9-5-9 5v8l9 5z"/><path d="m3.3 7.5 8.7 5 8.7-5M12 22V12.5"/>', "piutang": '<path d="M3 6h18v12H3z"/><circle cx="12" cy="12" r="2.5"/><path d="M7 12h.01M17 12h.01"/>', "menu": '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>', "gelap": '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'};
  var S = 'html:not(#_):not(#__):not(#___) body ', R = 'html:not(#_):not(#__):not(#___) ';
  var CSS =
    S + 'header.oneui-hero{padding-top:6px!important;padding-bottom:6px!important}' +
    S + 'header.oneui-hero h1,' + S + 'header.oneui-hero .text-3xl{font-size:19px!important;line-height:1.15!important}' +
    S + '#fm-dock.fm-hid,' + S + '#fmc-tab.fm-hid,' + S + '#fm-absen-fab.fm-hid,' + S + '#fm-stokadm-fab.fm-hid{visibility:hidden!important;pointer-events:none!important}' +
    R + '#fm-rail{position:fixed;left:0;right:0;display:flex;align-items:center;justify-content:center;pointer-events:none;height:56px}' +
    R + '#fm-rail>*{pointer-events:auto}' +
    R + '#fm-pil{position:relative;z-index:3;display:flex;align-items:center;justify-content:center;height:52px;padding:0;' +
      'background:var(--o-pil,#fff);border-radius:999px;box-shadow:0 2px 6px var(--o-sh,rgba(15,23,42,.07)),0 16px 36px -14px var(--o-sh2,rgba(15,23,42,.38));' +
      'overflow:hidden;width:60px;will-change:width;transition:width .55s cubic-bezier(.16,1,.3,1);box-sizing:border-box}' +
    R + '#fm-rail.fm-open #fm-pil{width:var(--fmw,420px)}' +
    R + '#fm-pil .fm-lg{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:44px;height:44px;display:grid;place-items:center;' +
      'color:var(--o-ink,#0f172a);cursor:pointer;z-index:5;background:var(--o-pil,#fff);border-radius:50%}' +
    R + '#fm-pil .fm-wing{position:absolute;top:0;bottom:0;display:flex;align-items:center;gap:2px}' +
    R + '#fm-pil .fm-wing-l{right:calc(50% + 26px)}' +
    R + '#fm-pil .fm-wing-r{left:calc(50% + 26px)}' +
    R + '#fm-pil .fm-i2{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 11px;border-radius:14px;' +
      'border:0;background:transparent;color:var(--o-ink2,#5b6676);cursor:pointer;font:700 10px "Plus Jakarta Sans",system-ui,sans-serif;' +
      'opacity:0;pointer-events:none;transform:scale(.9);transition:opacity .32s .12s ease,transform .4s .08s cubic-bezier(.16,1,.3,1);white-space:nowrap}' +
    R + '#fm-rail.fm-open #fm-pil .fm-i2{opacity:1;pointer-events:auto;transform:scale(1)}' +
    R + '#fm-pil .fm-i2 svg{width:17px;height:17px;stroke-width:2;fill:none;stroke:currentColor}' +
    R + '#fm-pil .fm-i2:hover{background:color-mix(in srgb,currentColor 11%,transparent);color:var(--o-ink,#0f172a)}' +
    R + '#fm-pil .fm-i2.fm-dg{color:#dc2626}' + R + '#fm-pil .fm-i2.fm-dg:hover{background:#fee2e2;color:#dc2626}' +
    R + '#fm-rail .fm-s2{position:absolute;top:50%;display:flex;align-items:center;gap:7px;height:46px;padding:0 15px;border:0;' +
      'background:var(--o-pil,#fff);border-radius:999px;box-shadow:0 2px 6px var(--o-sh,rgba(15,23,42,.07)),0 16px 36px -14px var(--o-sh2,rgba(15,23,42,.38));' +
      'color:var(--o-ink,#0f172a);cursor:pointer;font:700 12px "Plus Jakarta Sans",system-ui,sans-serif;z-index:2;white-space:nowrap;' +
      'transition:transform .58s cubic-bezier(.16,1,.3,1)}' +
    R + '#fm-rail .fm-s2 svg{width:15px;height:15px;stroke-width:2.1;fill:none;stroke:currentColor;flex:none}' +
    R + '#fm-rail .fm-s2.fmL{right:50%}' + R + '#fm-rail .fm-s2.fmR{left:50%}' +
    R + '#fm-rail .fm-s2.fmL1{transform:translateY(-50%) translateX(calc(var(--h0,30px) * -1 - 8px))}' +
    R + '#fm-rail .fm-s2.fmL2{transform:translateY(-50%) translateX(calc(var(--h0,30px) * -1 - 8px - var(--w1,96px)))}' +
    R + '#fm-rail .fm-s2.fmR1{transform:translateY(-50%) translateX(calc(var(--h0,30px) + 8px))}' +
    R + '#fm-rail .fm-s2.fmR2{transform:translateY(-50%) translateX(calc(var(--h0,30px) + 8px + var(--w3,96px)))}' +
    R + '#fm-rail.fm-open .fm-s2.fmL1{transform:translateY(-50%) translateX(calc(var(--pl,210px) * -1 - 8px))}' +
    R + '#fm-rail.fm-open .fm-s2.fmL2{transform:translateY(-50%) translateX(calc(var(--pl,210px) * -1 - 8px - var(--w1,96px)))}' +
    R + '#fm-rail.fm-open .fm-s2.fmR1{transform:translateY(-50%) translateX(calc(var(--pr,210px) + 8px))}' +
    R + '#fm-rail.fm-open .fm-s2.fmR2{transform:translateY(-50%) translateX(calc(var(--pr,210px) + 8px + var(--w3,96px)))}' +
    '@media(prefers-reduced-motion:reduce){' + R + '#fm-pil,' + R + '#fm-rail .fm-s2{transition:none!important}}';

  function sv(d) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'; }

  function pasang() {
    var dock = document.getElementById('fm-dock');
    if (!dock || document.getElementById('fm-rail')) return !!document.getElementById('fm-rail');
    var dk = [].slice.call(dock.querySelectorAll('.fm-dk'));
    if (!dk.length) return false;
    var sembunyi = [];
    try {
      if (!document.getElementById('fm-ui110')) {
        var st = document.createElement('style'); st.id = 'fm-ui110'; st.textContent = CSS;
        (document.head || document.documentElement).appendChild(st);
      }
      var rail = document.createElement('div'); rail.id = 'fm-rail';
      try {
        var cs = getComputedStyle(dock);
        rail.style.bottom = (cs.bottom && cs.bottom !== 'auto') ? cs.bottom : '16px';
        rail.style.zIndex = (cs.zIndex && cs.zIndex !== 'auto') ? cs.zIndex : '60';
      } catch (e) { rail.style.bottom = '16px'; rail.style.zIndex = '60'; }

      var pil = document.createElement('div'); pil.id = 'fm-pil';
      rail.appendChild(pil);
      document.documentElement.appendChild(rail);
      dock.classList.add('fm-hid'); sembunyi.push(dock);

      function teks(b) { var q = b.querySelector('span'); return ((q ? q.textContent : b.textContent) || '').trim(); }
      function logoEl() { var lg = document.createElement('span'); lg.className = 'fm-lg'; lg.innerHTML = LOGO; return lg; }
      var EKOR = /^(pengaturan|keluar|store|lainnya|desktop|ponsel)$/i;
      var kiri1 = null, kanan1 = null, sidik = '';

      function kumpulkan() {
        var dkk = [].slice.call(dock.querySelectorAll('.fm-dk'));
        var tema = null, ekor = [], hal = [];
        dkk.forEach(function (x) {
          var t = teks(x);
          if (/^tema$/i.test(t)) { tema = x; return; }
          (EKOR.test(t) ? ekor : hal).push(x);
        });
        var L = [], R = [];
        var chat = document.getElementById('fmc-tab');
        if (chat) L.push({ el: chat, nama: 'Chat', ik: IC.chat, sem: true });
        L.push({ nama: 'Tema', ik: gelapAktif() ? IC.tema : IC.gelap, tema: true, el: tema });
        var abs = document.getElementById('fm-absen-fab');
        if (abs) R.push({ el: abs, nama: 'Absen', ik: IC.absen, sem: true });
        var stk = document.getElementById('fm-stokadm-fab');
        if (stk) R.push({ el: stk, nama: 'Stok', ik: IC.stok, sem: true });
        var piu = document.querySelector('.fm-fab[data-fc="piu"],[onclick*="FM_PIU.open"]');
        if (piu && R.length < 2) R.push({ el: piu, nama: 'Piutang', ik: IC.piutang, sem: true });
        var naik = [], sisa = 2 - R.length;
        while (sisa > 0 && hal.length - naik.length > 1) { naik.unshift(hal[hal.length - 1 - naik.length]); sisa--; }
        naik.forEach(function (x) { R.push({ dk: x, nama: teks(x), ik: IC.menu }); });
        var isi = hal.filter(function (x) { return naik.indexOf(x) < 0; }).concat(ekor);
        return {
          L: L.slice(0, 2), R: R.slice(0, 2), isi: isi,
          sidik: dkk.map(teks).join('|') + '#' + [chat, abs, stk, piu].map(function (x) { return x ? 1 : 0; }).join('')
        };
      }

      function buatItemPil(x) {
        var n = document.createElement('button'); n.type = 'button';
        n.className = 'fm-i2' + (x.classList.contains('danger') ? ' fm-dg' : '');
        n.innerHTML = x.innerHTML;
        n.addEventListener('click', function () { x.click(); });
        return n;
      }

      function bangun() {
        var c = kumpulkan();
        if (c.sidik === sidik || rail.classList.contains('fm-open')) return;
        sidik = c.sidik;
        [].slice.call(rail.querySelectorAll('.fm-s2')).forEach(function (x) { rail.removeChild(x); });
        sembunyi.forEach(function (el) { if (el !== dock) el.classList.remove('fm-hid'); });
        sembunyi = [dock];
        pil.innerHTML = ''; kiri1 = kanan1 = null;

        var tengah = Math.ceil(c.isi.length / 2);
        var wingL = document.createElement('div'); wingL.className = 'fm-wing fm-wing-l';
        var wingR = document.createElement('div'); wingR.className = 'fm-wing fm-wing-r';

        c.isi.forEach(function (x, i) {
          if (i < tengah) wingL.appendChild(buatItemPil(x));
          else wingR.appendChild(buatItemPil(x));
        });

        pil.appendChild(wingL);
        pil.appendChild(logoEl());
        pil.appendChild(wingR);

        function sat(x, kls) {
          var b = document.createElement('button'); b.type = 'button';
          b.className = 'fm-s2 ' + kls; b.innerHTML = sv(x.ik) + x.nama;
          if (x.tema) b.setAttribute('data-tema', '1');
          b.addEventListener('click', function () {
            if (x.tema) {
              if (window.FM_THEME && FM_THEME.toggle) FM_THEME.toggle();
              else if (x.el) x.el.click();
              return;
            }
            var t = x.dk || x.el; if (t) t.click();
          });
          rail.appendChild(b);
          if (x.sem && x.el) { x.el.classList.add('fm-hid'); sembunyi.push(x.el); }
          return b;
        }
        c.L.forEach(function (x, i) { var b = sat(x, 'fmL fmL' + (i + 1)); if (i === 0) kiri1 = b; });
        c.R.forEach(function (x, i) { var b = sat(x, 'fmR fmR' + (i + 1)); if (i === 0) kanan1 = b; });

        var lg3 = pil.querySelector('.fm-lg');
        if (lg3) {
          lg3.addEventListener('mouseenter', function () { buka(true); });
          lg3.addEventListener('click', function () { buka(!rail.classList.contains('fm-open')); });
        }
        ukur();
      }

      function ukur() {
        try {
          var wL = pil.querySelector('.fm-wing-l');
          var wR = pil.querySelector('.fm-wing-r');
          var lebarL = wL ? wL.offsetWidth : 0;
          var lebarR = wR ? wR.offsetWidth : 0;
          var setengah = Math.ceil(26 + Math.max(lebarL, lebarR) + 12);
          var totalW = Math.max(60, setengah * 2);
          rail.style.setProperty('--fmw', totalW + 'px');
          rail.style.setProperty('--pl', setengah + 'px');
          rail.style.setProperty('--pr', setengah + 'px');
          rail.style.setProperty('--h0', '30px');
          if (kiri1) rail.style.setProperty('--w1', (kiri1.offsetWidth + 8) + 'px');
          if (kanan1) rail.style.setProperty('--w3', (kanan1.offsetWidth + 8) + 'px');
        } catch (e) {}
      }
      function buka(v) { ukur(); rail.classList.toggle('fm-open', !!v); }
      pil.addEventListener('mouseleave', function () { buka(false); });
      var nT = 0, tT = setInterval(function () {
        nT++; try { bangun(); } catch (e) {}
        if (nT > 80) clearInterval(tT);
      }, 250);
      window.addEventListener('fm:gelap', function () {
        try {
          var t = rail.querySelector('.fm-s2[data-tema]');
          if (t) t.innerHTML = sv(gelapAktif() ? IC.tema : IC.gelap) + 'Tema';
        } catch (e) {}
      });
      function cekTutup() {
        try {
          var r = pil.getBoundingClientRect(); if (!r.width) return;
          var titik = [[r.left + r.width / 2, r.top + 3], [r.left + r.width / 2, r.top + r.height / 2]];
          var tertutup = titik.some(function (t) { var e = document.elementFromPoint(t[0], t[1]); return e && !rail.contains(e); });
          if (tertutup) { rail.style.zIndex = '2147482000'; try { console.info('[ui110] pulau dinaikkan di atas lapisan yang menutupinya'); } catch (e) {} }
        } catch (e) {}
      }
      bangun(); setTimeout(ukur, 700); setTimeout(ukur, 2200);
      setTimeout(cekTutup, 1200); setTimeout(cekTutup, 4000);
      window.addEventListener('resize', function () { clearTimeout(pasang._t); pasang._t = setTimeout(ukur, 150); });
      return true;
    } catch (e) {
      try {
        sembunyi.forEach(function (el) { el.classList.remove('fm-hid'); });
        var r = document.getElementById('fm-rail'); if (r) r.parentNode.removeChild(r);
        var s2 = document.getElementById('fm-ui110'); if (s2) s2.parentNode.removeChild(s2);
      } catch (e2) {}
      return true;
    }
  }

  var n = 0, t = setInterval(function () {
    n++; try { if (pasang() || n > 120) clearInterval(t); } catch (e) { clearInterval(t); }
  }, 250);
})();
