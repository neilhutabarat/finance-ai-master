/* ui110.js — dock pulau v1.1.0.
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
        /* warna bayangan & tepi: biasa, dan versi pra-balik untuk halaman yang dibalik */
        'html' + PG + '{--u-sh1:rgba(15,23,42,.05);--u-sh2:rgba(15,23,42,.20);--u-edge:rgba(255,255,255,.6)}' +
        'html' + PG + '[data-fm-invert]{--u-sh1:rgba(240,232,213,.05);--u-sh2:rgba(240,232,213,.20);--u-edge:rgba(0,0,0,.6)}' +
        /* Base: tanpa garis abu, diganti bayangan halus berlapis; kilap kaca dilepas supaya bersih */
        KB + 'main .ios-glass{border-color:transparent!important;border-radius:20px!important;box-shadow:0 1px 2px var(--u-sh1),0 10px 26px -14px var(--u-sh2)!important}' +
        KB + 'main .ios-glass::before{display:none!important}' +
        /* Original (kaca): bahan kaca tetap, tepinya dibuat tipis dan terang */
        KO + 'main .ios-glass{border:1px solid var(--u-edge)!important;border-radius:20px!important}' +
        /* angka: huruf rapi dengan lebar digit seragam, tidak goyang saat berubah */
        K + 'main .ios-glass .font-mono,' + K + 'main .fm-ic b,' + K + 'main .fm-ic td{font-family:' + NUM + '!important;font-variant-numeric:tabular-nums;letter-spacing:-.02em}' +
        K + 'main>.grid:first-child h3{font-weight:800!important;letter-spacing:-.03em!important}' +
        K + 'main>.grid:first-child>.ios-glass>div:first-child>span{font-weight:700!important;letter-spacing:.05em!important}' +
        /* ikon kartu atas: kotak lembut, warnanya mengikuti arti angka */
        K + 'main>.grid:first-child>.ios-glass>div:first-child>svg,' + K + 'main>.grid:first-child>.ios-glass>div:first-child>i{width:24px!important;height:24px!important;padding:5px;margin:-4px 0;border-radius:8px;box-sizing:border-box;flex:none;' +
          'background:color-mix(in srgb,currentColor 14%,transparent);stroke-width:2.2}' +
        /* kartu ringkasan: ikon kecil di depan judul, baris dipisah garis halus */
        K + 'main .fm-ic h4{position:relative;padding-left:24px!important;min-height:18px;display:flex;align-items:center}' +
        K + 'main .fm-ic h4::before{content:"";position:absolute;left:0;top:50%;width:18px;height:18px;margin-top:-9px;border-radius:6px;background:color-mix(in srgb,currentColor 9%,transparent)}' +
        K + 'main .fm-ic h4::after{content:"";position:absolute;left:3px;top:50%;width:12px;height:12px;margin-top:-6px;background:currentColor;opacity:.7;-webkit-mask:var(--u-ik) center/contain no-repeat;mask:var(--u-ik) center/contain no-repeat}' +
        K + 'main .fm-ic .fm-row+.fm-row{border-top:1px solid color-mix(in srgb,currentColor 9%,transparent)}' +
        K + 'main .fm-ic .fm-row b{font-weight:700}' +
        K + 'main .fm-tg button{border-radius:999px!important;font-weight:700!important}';
      Object.keys(IKON).forEach(function (n) {
        kc += K + 'main .fm-ic[data-fm-i="' + n.replace(/"/g, '\\"') + '"]{--u-ik:' + mk(IKON[n]) + '}';
      });
      /* judul tanpa ikon yang dikenal: tanpa kotak, tanpa geser */
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
        /* angka rupiah: huruf rapi, lebar digit seragam (kolom isian nominal tidak diubah) */
        Q + 'main .font-mono:not(input){font-family:' + NUMK + '!important;font-variant-numeric:tabular-nums;letter-spacing:-.02em!important}' +
        Q + '#kasir-live-balance{font-weight:800!important;letter-spacing:-.035em!important}' +
        Q + '#kas-total-in,' + Q + '#kas-total-out,' + Q + '#kas-net,' + Q + '#draft-total-amount{font-weight:800!important}';
      var qs = document.createElement('style'); qs.id = 'fm-ui110-kasir'; qs.textContent = qc;
      (document.head || document.documentElement).appendChild(qs);
    }
  } catch (e) {}

  try { if (!window.matchMedia || !matchMedia('(min-width:1024px)').matches) return; } catch (e) { return; }

  var LOGO = '<svg viewBox="0 0 120 120" width="28" height="28" fill="none" aria-hidden="true"><g transform="scale(1.875)" fill="currentColor" fill-rule="evenodd"><path d="M33.7 9.1L32.3 9.2L30.9 9.3L29.5 9.4L28.1 9.6L26.7 9.9L25.3 10.3L24 10.7L22.6 11.2L21.3 11.8L19.9 12.5L18.6 13.3L17.4 14.1L16.2 15L15 16L13.9 17.1L12.8 18.2L11.8 19.3L10.9 20.5L10 21.8L9.2 23L8.6 24.3L8 25.7L7.4 27L7 28.4L6.6 29.8L6.3 31.2L6.2 32.6L6 34L6 35.3L6 36.7L6.2 38.1L6.4 39.4L6.7 40.8L7.1 42L7.6 43.2L8.2 44.4L8.9 45.5L9.8 46.5L10.7 47.3L11.6 48L12.7 48.6L13.8 49L15 49.3L16.2 49.4L17.4 49.2L18.6 49L19.7 48.5L20.9 47.9L22 47.1L23 46.3L24 45.3L25 44.2L25.9 43L26.7 41.8L27.5 40.5L28.2 39.2L28.9 37.8L29.5 36.5L30.1 35.1L30.6 33.7L31.1 32.3L31.5 30.9L31.9 29.6L32.3 28.2L32.6 26.9L32.9 25.6L33.1 24.4L33.2 23.3L33.2 22.3L33.2 21.4L33.1 20.7L32.9 20.1L32.6 19.7L32.2 19.5L31.8 19.5L31.3 19.7L30.8 20.1L30.3 20.6L29.8 21.4L29.2 22.3L28.8 23.3L28.3 24.4L27.8 25.6L27.3 26.9L26.9 28.1L26.4 29.5L25.9 30.8L25.4 32.1L24.9 33.5L24.3 34.8L23.6 36L22.9 37.2L22.2 38.3L21.4 39.3L20.5 40.1L19.6 40.9L18.6 41.4L17.6 41.7L16.6 41.9L15.7 41.8L14.8 41.6L13.9 41.1L13.1 40.5L12.4 39.7L11.8 38.7L11.4 37.7L11 36.5L10.8 35.3L10.7 34L10.7 32.7L10.9 31.4L11.1 30L11.4 28.7L11.9 27.4L12.4 26.1L13.1 24.8L13.8 23.6L14.6 22.5L15.5 21.4L16.5 20.4L17.6 19.5L18.7 18.7L19.9 18L21.1 17.4L22.4 16.8L23.7 16.4L25 16L26.4 15.8L27.8 15.6L29.1 15.4L30.5 15.3L31.9 15.3L33.3 15.3L34.7 15.3L36.1 15.4L37.5 15.6L38.8 15.8L40.2 16.2L41.5 16.6L42.8 17.1L44 17.7L45.2 18.5L46.3 19.3L47.3 20.3L48.3 21.3L49.1 22.4L49.9 23.6L50.6 24.8L51.1 26.1L51.6 27.4L51.9 28.8L52.1 30.2L52.2 31.5L52.2 32.9L52 34.3L51.8 35.6L51.4 37L51 38.3L50.4 39.6L49.7 40.9L48.9 42.1L48 43.3L47 44.5L46 45.5L44.9 46.5L43.8 47.5L42.6 48.4L41.5 49.2L40.4 50L39.4 50.8L38.5 51.4L37.7 52.1L37.1 52.6L36.7 53.2L36.5 53.6L36.5 54L36.7 54.4L37.1 54.6L37.7 54.8L38.5 54.9L39.5 54.8L40.5 54.7L41.6 54.4L42.9 54.1L44.1 53.6L45.3 53.1L46.6 52.4L47.8 51.7L49 50.8L50.1 49.9L51.2 48.9L52.2 47.8L53.2 46.7L54 45.5L54.8 44.2L55.5 42.9L56.1 41.6L56.6 40.3L57.1 38.9L57.4 37.5L57.7 36.2L57.9 34.8L58 33.4L58 32L57.9 30.6L57.8 29.2L57.6 27.8L57.3 26.4L56.9 25L56.4 23.7L55.9 22.4L55.2 21.1L54.5 19.8L53.7 18.6L52.9 17.4L51.9 16.3L50.8 15.2L49.7 14.2L48.6 13.4L47.3 12.6L46.1 11.9L44.8 11.2L43.4 10.7L42.1 10.3L40.7 9.9L39.3 9.6L37.9 9.4L36.5 9.2L35.1 9.2Z"/><g transform="translate(35.5 33) rotate(-4) scale(.62) translate(-32 -32)"><path d="M29.5 12.2L29 12.4L28.6 12.7L28.1 13.1L27.6 13.6L27.1 14.1L26.6 14.8L26.1 15.4L25.6 16.1L25.1 16.9L24.7 17.6L24.2 18.4L23.8 19.2L23.3 20L22.9 20.8L22.5 21.6L22 22.4L21.6 23.2L21.2 24L20.7 24.8L20.3 25.6L19.9 26.4L19.5 27.2L19.1 28L18.6 28.8L18.2 29.6L17.8 30.4L17.4 31.2L17 32.1L16.6 32.9L16.2 33.7L15.8 34.5L15.4 35.3L15 36.1L14.6 37L14.2 37.8L13.8 38.6L13.4 39.4L13.1 40.2L12.7 41.1L12.3 41.9L12 42.7L11.6 43.5L11.3 44.3L11 45.1L10.8 45.9L10.5 46.7L10.4 47.4L10.3 48.1L10.3 48.8L10.3 49.4L10.5 49.9L10.7 50.4L10.9 50.7L11.3 50.9L11.6 50.9L12 50.9L12.4 50.7L12.9 50.4L13.3 50L13.7 49.5L14.1 48.9L14.5 48.2L14.9 47.5L15.3 46.8L15.7 46L16.1 45.3L16.6 44.5L17 43.7L17.4 42.9L17.9 42.1L18.4 41.4L18.9 40.6L19.4 39.9L19.9 39.2L20.5 38.5L21.1 37.9L21.8 37.4L22.5 36.8L23.1 36.4L23.9 36L24.6 35.6L25.3 35.4L26.1 35.3L26.8 35.2L27.4 35.3L28.1 35.4L28.7 35.7L29.3 36L29.8 36.5L30.2 37L30.6 37.7L30.9 38.4L31.2 39.1L31.5 39.9L31.7 40.8L31.9 41.6L32.1 42.5L32.3 43.4L32.5 44.3L32.7 45.2L33 46L33.3 46.8L33.7 47.6L34.1 48.4L34.5 49.1L35 49.8L35.6 50.4L36.2 50.9L36.9 51.4L37.6 51.8L38.3 52.2L39.1 52.4L39.8 52.6L40.6 52.7L41.5 52.7L42.3 52.6L43.1 52.5L43.9 52.2L44.7 52L45.5 51.6L46.2 51.2L47 50.8L47.7 50.3L48.4 49.8L49 49.2L49.6 48.7L50.2 48L50.8 47.4L51.3 46.7L51.8 46L52.2 45.3L52.6 44.5L52.9 43.8L53.1 43.1L53.3 42.4L53.4 41.8L53.4 41.2L53.4 40.7L53.3 40.2L53.1 39.9L52.8 39.7L52.5 39.6L52.2 39.6L51.8 39.8L51.4 40.1L51 40.5L50.6 40.9L50.2 41.5L49.7 42.1L49.2 42.7L48.7 43.4L48.2 44L47.6 44.6L47 45.2L46.3 45.8L45.7 46.3L45 46.7L44.3 47L43.5 47.3L42.8 47.5L42.1 47.6L41.4 47.6L40.7 47.4L40 47.2L39.5 46.9L38.9 46.4L38.4 45.9L38 45.3L37.7 44.6L37.4 43.8L37.1 43L36.9 42.2L36.8 41.3L36.6 40.4L36.5 39.5L36.3 38.6L36.2 37.7L36 36.8L35.8 36L35.5 35.1L35.2 34.3L34.9 33.6L34.5 32.9L34 32.2L33.5 31.6L32.9 31.1L32.3 30.6L31.6 30.1L31 29.7L30.3 29.3L29.7 28.9L29.1 28.4L28.6 28L28.1 27.5L27.8 27L27.5 26.4L27.3 25.8L27.2 25.1L27.3 24.4L27.4 23.7L27.5 23L27.8 22.2L28.1 21.4L28.4 20.7L28.7 19.9L29.1 19.1L29.5 18.3L29.9 17.5L30.2 16.8L30.5 16.1L30.7 15.4L30.9 14.7L31 14.1L31.1 13.5L31 13.1L30.9 12.7L30.6 12.4L30.3 12.2L29.9 12.2Z"/></g></g></svg>';
  var IC = {"chat": "<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"/>", "tema": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4\"/>", "absen": "<path d=\"M9 11l3 3L22 4\"/><path d=\"M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11\"/>", "stok": "<path d=\"M21 16V8l-9-5-9 5v8l9 5z\"/><path d=\"m3.3 7.5 8.7 5 8.7-5M12 22V12.5\"/>"};
  var S = 'html:not(#_):not(#__):not(#___) body ', R = 'html:not(#_):not(#__):not(#___) ';
  var CSS =
    S + 'header.oneui-hero{padding-top:6px!important;padding-bottom:6px!important}' +
    S + 'header.oneui-hero h1,' + S + 'header.oneui-hero .text-3xl{font-size:19px!important;line-height:1.15!important}' +
    /* sembunyikan yang lama tanpa mengubah tata letaknya */
    S + '#fm-dock.fm-hid,' + S + '#fmc-tab.fm-hid,' + S + '#fm-absen-fab.fm-hid,' + S + '#fm-stokadm-fab.fm-hid{visibility:hidden!important;pointer-events:none!important}' +
    /* rel */
    R + '#fm-rail{position:fixed;left:0;right:0;display:flex;align-items:center;justify-content:center;pointer-events:none;height:56px}' +
    R + '#fm-rail>*{pointer-events:auto}' +
    /* pulau tengah */
    R + '#fm-pil{position:relative;z-index:3;display:flex;align-items:center;justify-content:center;height:52px;padding:0 8px;' +
      'background:#fff;border-radius:999px;box-shadow:0 2px 6px rgba(15,23,42,.07),0 16px 36px -14px rgba(15,23,42,.38);' +
      'overflow:hidden;width:60px;transition:width 1.56s cubic-bezier(.16,1,.3,1);box-sizing:border-box}' +
    R + '#fm-rail.fm-open #fm-pil{width:var(--fmw,420px)}' +
    R + '#fm-pil>*{flex:none}' +
    R + '#fm-pil .fm-lg{width:40px;min-width:40px;height:40px;display:grid;place-items:center;color:#0f172a;cursor:pointer}' +
    R + '#fm-pil .fm-i2{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 11px;border-radius:14px;' +
      'border:0;background:transparent;color:#5b6676;cursor:pointer;font:700 10px "Plus Jakarta Sans",system-ui,sans-serif;' +
      'opacity:0;transition:opacity .7s .34s ease;white-space:nowrap}' +
    R + '#fm-rail.fm-open #fm-pil .fm-i2{opacity:1}' +
    R + '#fm-pil .fm-i2 svg{width:17px;height:17px;stroke-width:2;fill:none;stroke:currentColor}' +
    R + '#fm-pil .fm-i2:hover{background:#f1f5f9;color:#0f172a}' +
    R + '#fm-pil .fm-i2.fm-dg{color:#dc2626}' + R + '#fm-pil .fm-i2.fm-dg:hover{background:#fee2e2;color:#dc2626}' +
    /* satelit */
    R + '#fm-rail .fm-s2{position:absolute;top:50%;display:flex;align-items:center;gap:7px;height:46px;padding:0 15px;border:0;' +
      'background:#fff;border-radius:999px;box-shadow:0 2px 6px rgba(15,23,42,.07),0 16px 36px -14px rgba(15,23,42,.38);' +
      'color:#0f172a;cursor:pointer;font:700 12px "Plus Jakarta Sans",system-ui,sans-serif;z-index:2;white-space:nowrap;' +
      'transition:transform 1.68s cubic-bezier(.16,1,.3,1)}' +
    R + '#fm-rail .fm-s2 svg{width:15px;height:15px;stroke-width:2.1;fill:none;stroke:currentColor;flex:none}' +
    R + '#fm-rail .fm-s2.fmL{right:50%} ' + R + '#fm-rail .fm-s2.fmR{left:50%}' +
    R + '#fm-rail .fm-s2.fmL1{transform:translateY(-50%) translateX(calc(var(--h0,30px) * -1 - 8px))}' +
    R + '#fm-rail .fm-s2.fmL2{transform:translateY(-50%) translateX(calc(var(--h0,30px) * -1 - 8px - var(--w1,96px)))}' +
    R + '#fm-rail .fm-s2.fmR1{transform:translateY(-50%) translateX(calc(var(--h0,30px) + 8px))}' +
    R + '#fm-rail .fm-s2.fmR2{transform:translateY(-50%) translateX(calc(var(--h0,30px) + 8px + var(--w3,96px)))}' +
    R + '#fm-rail.fm-open .fm-s2.fmL1{transform:translateY(-50%) translateX(calc(var(--hw,210px) * -1 - 8px))}' +
    R + '#fm-rail.fm-open .fm-s2.fmL2{transform:translateY(-50%) translateX(calc(var(--hw,210px) * -1 - 8px - var(--w1,96px)))}' +
    R + '#fm-rail.fm-open .fm-s2.fmR1{transform:translateY(-50%) translateX(calc(var(--hw,210px) + 8px))}' +
    R + '#fm-rail.fm-open .fm-s2.fmR2{transform:translateY(-50%) translateX(calc(var(--hw,210px) + 8px + var(--w3,96px)))}' +
    'html[data-fm-invert="1"] #fm-rail{filter:invert(1) hue-rotate(180deg)}' +
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
      function teks(b) { var s = b.querySelector('span'); return ((s ? s.textContent : b.textContent) || '').trim(); }
      var temaAsli = null, isi = [];
      dk.forEach(function (b) {
        var t = teks(b);
        if (/^tema$/i.test(t)) { temaAsli = b; return; }   /* Tema jadi satelit, bukan isi pulau */
        isi.push(b);
      });
      var tengah = Math.ceil(isi.length / 2);
      isi.forEach(function (b, i) {
        if (i === tengah) { var lg = document.createElement('span'); lg.className = 'fm-lg'; lg.innerHTML = LOGO; pil.appendChild(lg); }
        var n = document.createElement('button'); n.type = 'button';
        n.className = 'fm-i2' + (b.classList.contains('danger') ? ' fm-dg' : '');
        n.innerHTML = b.innerHTML;
        n.addEventListener('click', function () { b.click(); });
        pil.appendChild(n);
      });
      if (tengah >= isi.length) { var lg2 = document.createElement('span'); lg2.className = 'fm-lg'; lg2.innerHTML = LOGO; pil.appendChild(lg2); }
      rail.appendChild(pil);

      var daftar = [
        [document.getElementById('fmc-tab'), 'Chat', IC.chat, 'fmL fmL1'],
        [temaAsli, 'Tema', IC.tema, 'fmL fmL2'],
        [document.getElementById('fm-absen-fab'), 'Absen', IC.absen, 'fmR fmR1'],
        [document.getElementById('fm-stokadm-fab'), 'Stok', IC.stok, 'fmR fmR2']
      ];
      var kiri1 = null, kanan1 = null;
      daftar.forEach(function (x) {
        var asli = x[0]; if (!asli) return;
        var b = document.createElement('button'); b.type = 'button';
        b.className = 'fm-s2 ' + x[3]; b.innerHTML = sv(x[2]) + x[1];
        b.addEventListener('click', function () { asli.click(); });
        rail.appendChild(b);
        if (x[3].indexOf('fmL1') >= 0) kiri1 = b;
        if (x[3].indexOf('fmR1') >= 0) kanan1 = b;
        if (asli !== temaAsli) { asli.classList.add('fm-hid'); sembunyi.push(asli); }
      });
      document.documentElement.appendChild(rail);
      dock.classList.add('fm-hid'); sembunyi.push(dock);

      function ukur() {
        try {
          var semula = rail.classList.contains('fm-open'), tr = pil.style.transition;
          pil.style.transition = 'none'; rail.classList.add('fm-open');
          pil.style.width = 'auto'; var lebar = pil.offsetWidth; pil.style.width = '';
          if (!semula) rail.classList.remove('fm-open');
          void pil.offsetWidth; pil.style.transition = tr;
          if (!(lebar > 0)) return;
          rail.style.setProperty('--fmw', lebar + 'px');
          rail.style.setProperty('--hw', (lebar / 2) + 'px');
          rail.style.setProperty('--h0', '30px');
          if (kiri1) rail.style.setProperty('--w1', (kiri1.offsetWidth + 8) + 'px');
          if (kanan1) rail.style.setProperty('--w3', (kanan1.offsetWidth + 8) + 'px');
        } catch (e) {}
      }
      function buka(v) { rail.classList.toggle('fm-open', !!v); }
      var lg3 = pil.querySelector('.fm-lg');
      if (lg3) { lg3.addEventListener('mouseenter', function () { buka(true); }); lg3.addEventListener('click', function () { buka(!rail.classList.contains('fm-open')); }); }
      pil.addEventListener('mouseleave', function () { buka(false); });
      /* tombol yang dibuat belakangan (mis. Chat menunggu data) ikut dijadikan satelit */
      var sudah = {};
      daftar.forEach(function (x) { if (x[0]) sudah[x[1]] = 1; });
      var nTunggu = 0, tTunggu = setInterval(function () {
        nTunggu++;
        try {
          var ids = { Chat: 'fmc-tab', Absen: 'fm-absen-fab', Stok: 'fm-stokadm-fab' }, baru = false;
          daftar.forEach(function (x) {
            if (sudah[x[1]] || !ids[x[1]]) return;
            var asli = document.getElementById(ids[x[1]]); if (!asli) return;
            sudah[x[1]] = 1; baru = true;
            var b = document.createElement('button'); b.type = 'button';
            b.className = 'fm-s2 ' + x[3]; b.innerHTML = sv(x[2]) + x[1];
            b.addEventListener('click', function () { asli.click(); });
            rail.appendChild(b);
            if (x[3].indexOf('fmL1') >= 0) kiri1 = b;
            if (x[3].indexOf('fmR1') >= 0) kanan1 = b;
            asli.classList.add('fm-hid'); sembunyi.push(asli);
          });
          if (baru) ukur();
        } catch (e) {}
        if (nTunggu > 80 || (sudah.Chat && sudah.Absen && sudah.Stok)) clearInterval(tTunggu);
      }, 250);
      /* bila ada lapisan halaman yang menutupi pulau, naikkan pulau di atasnya */
      function cekTutup() {
        try {
          var r = pil.getBoundingClientRect(); if (!r.width) return;
          var titik = [[r.left + r.width / 2, r.top + 3], [r.left + r.width / 2, r.top + r.height / 2]];
          var tertutup = titik.some(function (t) { var e = document.elementFromPoint(t[0], t[1]); return e && !rail.contains(e); });
          if (tertutup) { rail.style.zIndex = '2147482000'; try { console.info('[ui110] pulau dinaikkan di atas lapisan yang menutupinya'); } catch (e) {} }
        } catch (e) {}
      }
      ukur(); setTimeout(ukur, 700); setTimeout(ukur, 2200);
      setTimeout(cekTutup, 1200); setTimeout(cekTutup, 4000);
      window.addEventListener('resize', function () { clearTimeout(pasang._t); pasang._t = setTimeout(ukur, 150); });
      return true;
    } catch (e) {
      /* gagal: kembalikan seperti semula */
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
