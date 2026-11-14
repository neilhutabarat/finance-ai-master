/* langit.js — latar dan kaca (Beta 12). Tanpa animasi berat, tanpa cuaca, tanpa pengukuran PC.
   - Tema "Original" = kaca bening; "Base" = putih polos tanpa elemen kaca (desain sama). Dipilih klien di Pengaturan.
   - Kejelasan kaca 5 tingkat (1 buram ... 5 bening): ditentukan Tower (global, atau per toko). Klien tidak bisa mengubahnya.
   - Gambar latar diatur dari Tower (app_meta/wallpaper, dibaca tanpa login), diperiksa ulang tiap 30 detik. */
(function () {
  'use strict';
  var ROLE = window.FM_ROLE || '';
  var PID = 'finance-ai-master-byneilverse', AK = 'AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI';
  window.FM_LANGIT = {};
  var KEY_G = 'fm_glass_g', KEY_S = 'fm_glass_s';
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function fetchCfg() {
    var url = 'https://firestore.googleapis.com/v1/projects/' + PID + '/databases/(default)/documents/app_meta/wallpaper?key=' + AK;
    return fetch(url, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      var f = d && d.fields; if (!f || !f.json || !f.json.stringValue) return;
      var j = JSON.parse(f.json.stringValue);
      if (j && typeof j === 'object') {
        lsSet('fm_wp_cfg', JSON.stringify({ mode: j.mode, fixed: j.fixed, order: j.order, start: j.start, day: j.day, hour: j.hour, items: j.items, portal: j.portal }));
        lsSet(KEY_G, String(clampLv(j.glass)));
        lsSet('fm_rain_g', JSON.stringify({ on: !!(j.rain && j.rain.on), size: clamp5(j.rain && j.rain.size), rate: clamp5(j.rain && j.rain.rate) }));
      }
    }).catch(function () {});
  }
  function clamp5(v) { v = parseInt(v, 10); return v >= 1 && v <= 5 ? v : 3; }
  function clampLv(v) { v = parseInt(v, 10); return v >= 1 && v <= 5 ? v : 3; }
  function level() {
    var s = lsGet(KEY_S), v = null;
    try { var o = JSON.parse(s || 'null'); if (o && o.v >= 1 && o.v <= 5) v = o.v; } catch (e) {}
    if (ROLE === 'tower') { var tv = parseInt(lsGet('fm_glass_tw'), 10); return tv >= 1 && tv <= 5 ? tv : 3; }
    return v || clampLv(lsGet(KEY_G));
  }
  function look() { try { var p = window.FM_THEME_PREF && FM_THEME_PREF(); return (p && p.look === 'base') ? 'base' : 'original'; } catch (e) { return 'original'; } }

  /* ---------- kaca ---------- */
  /* tingkat 1..5: kepekatan lapisan kaca (atas, tengah, bawah), kekaburan, kejenuhan latar */
  var LV = { 1: { a: [.9, .78, .86], b: 24, s: 1.1 }, 2: { a: [.7, .52, .64], b: 19, s: 1.25 }, 3: { a: [.5, .22, .4], b: 14, s: 1.45 }, 4: { a: [.3, .09, .22], b: 9, s: 1.6 }, 5: { a: [.16, .03, .1], b: 5, s: 1.7 } };
  var MIRR = ['#tw-bar', '#tw-strip', '#tw-tbw', '#tw-bot .bx', '.ios-glass', '.white-ice-glass-card:not([style*="0f172a"])', '.fixed.inset-0[id*="modal"]>div'];
  var AUTH = ['header.oneui-hero', '#fm-dock', '.fm-act', '.fm-fab', '#fm-dlg .fm-dlg-box', '.white-ice-glass-card[style*="0f172a"]'];
  var PLUGOV = '[style*="inset: 0px"][style*="z-index: 21474"][style*="background: rgba(0, 0, 0,"]', PLUG = [PLUGOV + '>div'];
  var COLORS = ['#1d4ed8', '#047857', '#b91c1c', '#7c3aed', '#b45309', '#0e7490', '#be185d', '#4d7c0f'];

  function css(lv) {
    var P = 'html' + '[data-fm-glass]'.repeat(6), p = LV[lv], a = p.a;
    function sel(list, pre) { return list.map(function (e) { return pre + ' ' + e; }).join(','); }
    function grad(T) { return 'linear-gradient(160deg,rgba(' + T + ',' + T + ',' + T + ',' + a[0] + '),rgba(' + T + ',' + T + ',' + T + ',' + a[1] + ') 55%,rgba(' + T + ',' + T + ',' + T + ',' + a[2] + '))'; }
    function shine(T) { return 'linear-gradient(112deg,transparent 16%,rgba(' + T + ',' + T + ',' + T + ',' + (.36 - lv * .04).toFixed(2) + ') 22%,transparent 27%)'; }
    function edge(T, sh) { var t = 'rgba(' + T + ',' + T + ',' + T + ','; return 'inset 0 0 0 1px ' + t + '.3),inset 0 2px 1px ' + t + '.9),inset 0 -2px 2px ' + t + '.3),inset 0 0 20px ' + t + '.2),0 18px 34px -16px ' + sh; }
    function printed(T) { var t = 'rgba(' + T + ',' + T + ',' + T + ','; return 'text-shadow:0 1px 0 ' + t + (.55 + lv * .06).toFixed(2) + '),0 0 7px ' + t + (.18 + lv * .08).toFixed(2) + ')!important;'; }
    var bf = 'blur(' + Math.min(p.b, 14) + 'px) saturate(' + Math.min(p.s, 1.25) + ')', bfInv = 'invert(1) hue-rotate(180deg) ' + bf;
    var SH = 'rgba(4,22,48,.5)', SHI = 'rgba(235,225,205,.5)';
    var o = '';
    /* halaman biasa (Kasir) : semuanya kaca terang */
    var all = MIRR.concat(AUTH);
    o += sel(all, P + ':not([data-fm-invert])') + '{background:' + shine(255) + ',' + grad(255) + '!important;backdrop-filter:' + bf + '!important;-webkit-backdrop-filter:' + bf + '!important;border:1px solid rgba(255,255,255,.55)!important;box-shadow:' + edge(255, SH) + '!important;' + printed(255) + '}';
    o += sel(PLUG, P + ':not([data-fm-invert])') + '{filter:invert(1) hue-rotate(180deg);background:' + shine(0) + ',' + grad(0) + '!important;backdrop-filter:' + bfInv + '!important;-webkit-backdrop-filter:' + bfInv + '!important;border:1px solid rgba(0,0,0,.55)!important;box-shadow:' + edge(0, SHI) + '!important;' + printed(0) + '}';
    o += P + ':not([data-fm-invert]) ' + PLUGOV + '{background:rgba(15,23,42,.36)!important}' + P + '[data-fm-invert="1"] ' + PLUGOV + '{background:rgba(242,246,252,.4)!important}';
    /* halaman yang memakai pembalik warna (Manager, Owner): kartu = cermin; elemen yang dibalik lagi = kaca biasa dengan latar dikembalikan */
    o += sel(MIRR.concat(PLUG), P + '[data-fm-invert="1"]') + '{background:' + shine(0) + ',' + grad(0) + '!important;backdrop-filter:' + bf + '!important;-webkit-backdrop-filter:' + bf + '!important;border:1px solid rgba(0,0,0,.55)!important;box-shadow:' + edge(0, SHI) + '!important;' + printed(0) + '}';
    o += sel(AUTH, P + '[data-fm-invert="1"]') + '{filter:invert(1) hue-rotate(180deg);background:' + shine(255) + ',' + grad(255) + '!important;backdrop-filter:' + bfInv + '!important;-webkit-backdrop-filter:' + bfInv + '!important;border:1px solid rgba(255,255,255,.55)!important;box-shadow:' + edge(255, SH) + '!important;' + printed(255) + '}';
    var sm = 'blur(5px)', smI = 'invert(1) hue-rotate(180deg) blur(5px)', SMS = ['.fm-act', '.fm-fab', '#fm-dock'];
    o += sel(SMS, P + ':not([data-fm-invert])') + '{backdrop-filter:' + sm + '!important;-webkit-backdrop-filter:' + sm + '!important}';
    o += sel(SMS, P + '[data-fm-invert="1"]') + '{backdrop-filter:' + smI + '!important;-webkit-backdrop-filter:' + smI + '!important}';
    /* selubung latar tipis: gambar tetap terlihat, kartu yang menjaga keterbacaan */
    o += P + ':not([data-fm-invert]) body[class]{background-image:linear-gradient(rgba(255,255,255,.04),rgba(255,255,255,.02)),var(--fm-wp)!important}';
    return o;
  }
  /* tombol berwarna: tiap tombol beda warna, tulisan berwarna, tombol tetap kaca */
  var STATIC = (function () {
    var o = '';
    COLORS.forEach(function (c, i) { o += '.fm-actions .fm-act:nth-child(8n+' + (i + 1) + '){--fc:' + c + '}'; });
    o += '.fm-actions .fm-act,.fm-actions .fm-act span{color:#000!important}.fm-actions .fm-act svg{color:var(--fc,#1d4ed8)!important}';
    o += '.fm-actions .fm-act i{background:color-mix(in srgb,var(--fc,#1d4ed8) 14%,transparent)!important}';
    o += 'html[data-fm-page="manager"] .fm-actions,html[data-fm-page="owner"] .fm-actions{display:flex!important;flex-wrap:wrap;gap:8px!important;align-content:flex-start!important;grid-template-columns:none!important;grid-auto-rows:auto!important;max-height:none!important}';
    o += 'html[data-fm-page] .fm-actions .fm-act{flex:0 0 auto!important;grid-column:auto!important;min-height:0!important;height:38px!important;padding:0 15px 0 8px!important;border-radius:999px!important;font-size:12.5px!important;font-weight:800!important;gap:8px!important;flex-direction:row!important;text-align:left!important}';
    o += 'html[data-fm-page] .fm-actions .fm-act i{width:24px!important;height:24px!important;border-radius:50%!important}.fm-actions .fm-act svg{width:14px!important;height:14px!important}';
    o += 'html[data-fm-page="manager"] [class*="text-[9px]"],html[data-fm-page="owner"] [class*="text-[9px]"],html[data-fm-page="manager"] [class*="text-[10px]"],html[data-fm-page="owner"] [class*="text-[10px]"]{font-size:11.5px!important}html[data-fm-page="manager"] [class*="text-[11px]"],html[data-fm-page="owner"] [class*="text-[11px]"],html[data-fm-page="manager"] .text-xs,html[data-fm-page="owner"] .text-xs{font-size:12.5px!important}';
    o += 'html[data-fm-page][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass] body #fm-dock .fm-dk svg,html[data-fm-page] body #fm-dock .fm-dk svg{color:#000!important;stroke:#000!important;width:26px!important;height:26px!important;stroke-width:2!important}html[data-fm-page][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass] body #fm-dock .fm-dk,html[data-fm-page][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass] body #fm-dock .fm-dk span,html[data-fm-page][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass] body #fm-dock .fm-dk b,html[data-fm-page] body #fm-dock .fm-dk,html[data-fm-page] body #fm-dock .fm-dk span,html[data-fm-page] body #fm-dock .fm-dk b{color:#000!important;text-shadow:none!important;font-size:13px!important;font-weight:800!important}html[data-fm-page][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass] body #fm-dock .fm-dk,html[data-fm-page] body #fm-dock .fm-dk{width:72px!important;height:64px!important}';
    o += '@media(max-width:560px){html[data-fm-page][data-fm-glass] body #fm-dock .fm-dk,html[data-fm-page] body #fm-dock .fm-dk{width:50px!important;height:58px!important}html[data-fm-page][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass] body #fm-dock .fm-dk,html[data-fm-page][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass] body #fm-dock .fm-dk span{font-size:10.5px!important;width:auto}html[data-fm-page][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass] body #fm-dock .fm-dk{width:50px!important}html[data-fm-page][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass] body #fm-dock .fm-dk svg{width:22px!important;height:22px!important}}';
    o += '.fm-actions .fm-act span{display:block!important;white-space:nowrap!important;-webkit-line-clamp:unset!important}';
    /* tombol melayang Absen / Stok / Piutang */
    o += '.fm-fab{border-radius:999px!important;font-weight:800!important;font-size:12.5px!important;padding:0 16px!important;height:38px!important;line-height:36px!important;cursor:pointer;background:rgba(255,255,255,.88)!important;border:1px solid rgba(255,255,255,.9)!important;box-shadow:0 6px 16px -6px rgba(15,23,42,.35)!important}';
    o += '.fm-fab[data-fc="piu"]{color:#2f55d4!important}.fm-fab[data-fc="stk"]{color:#047857!important}.fm-fab[data-fc="abs"]{color:#0e7490!important}';
    o += '#fm-help-fab{right:46px!important;bottom:60px!important;background:rgba(255,255,255,.85)!important;color:#1e293b!important;border:1px solid rgba(255,255,255,.9)!important;box-shadow:0 6px 16px -6px rgba(15,23,42,.35)!important}';
    o += 'html[data-fm-invert="1"] .fm-act,html[data-fm-invert="1"] .fm-fab,html[data-fm-invert="1"] #fm-help-fab{filter:invert(1) hue-rotate(180deg)}';
    /* Manager/Owner: isi halaman berhenti di atas dock (tidak tertimpa), bagian tengah mengecil bila layar pendek */
    o += 'html[data-fm-page="manager"] main,html[data-fm-page="owner"] main{padding-bottom:96px!important;box-sizing:border-box!important}';
    o += 'html[data-fm-fit][data-fm-page="manager"] #fm-insights,html[data-fm-fit][data-fm-page="owner"] #fm-insights{flex:1 1 0!important;min-height:96px!important;overflow:hidden!important}';
    /* alamat toko ditulis penuh dan boleh turun ke baris berikutnya */
    o += '#topbar-store-slogan{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;max-width:min(440px,34vw)!important;display:block!important;-webkit-line-clamp:unset!important;line-height:1.25!important}';
    o += 'html[data-fm-portal] body{background-image:var(--fm-wp)!important;background-size:cover!important;background-position:center!important;background-attachment:fixed!important;background-repeat:no-repeat!important}';
    o += 'html[data-fm-invert="1"] #fm-rain{filter:invert(1) hue-rotate(180deg)}';
    /* Tower memakai latar dan kaca yang sama dengan toko */
    o += 'html[data-fm-page="tower"]::before{content:"";position:fixed;left:0;top:0;right:0;bottom:0;z-index:-1;pointer-events:none;background:linear-gradient(rgba(255,255,255,.06),rgba(255,255,255,.06)),var(--fm-wp,url("/img/wp/1.jpg")) center bottom/cover no-repeat}html[data-fm-page="tower"] body{background:transparent!important}';
    o += 'html[data-tw-ck] body>header,html[data-tw-ck] body>main,html[data-tw-ck] body>section,html[data-tw-ck] body>footer,html[data-tw-ck] body>nav{visibility:hidden!important}';
    o += 'html[data-fm-page="tower"][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass] [style*="inset: 0px"][style*="z-index: 21474"][style*="background: rgba(0, 0, 0,"]>div{filter:none!important;background:linear-gradient(160deg,rgba(8,14,26,.72),rgba(8,14,26,.58))!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;border:1px solid rgba(255,255,255,.4)!important;color:#f1f5f9!important}html[data-fm-page="tower"][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass][data-fm-glass] [style*="inset: 0px"][style*="z-index: 21474"][style*="background: rgba(0, 0, 0,"]{background:rgba(0,0,0,.35)!important}html[data-fm-glass]:not([data-fm-invert]):not([data-fm-page="tower"]) [style*="inset: 0px"][style*="z-index: 21474"][style*="background: rgba(0, 0, 0,"]>div img,html[data-fm-glass]:not([data-fm-invert]):not([data-fm-page="tower"]) [style*="inset: 0px"][style*="z-index: 21474"][style*="background: rgba(0, 0, 0,"]>div canvas{filter:invert(1) hue-rotate(180deg)}';
    o += 'html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root *{color:#0f172a}html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root .g,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root .caret,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root .ln.sale .m,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root .ln.up .m{color:#047857!important}html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root .r,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root .ln.alarm .m,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root #tw-bar .pl.bad{color:#b91c1c!important}html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root .y,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root .ln.down .m{color:#b45309!important}html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root .m,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root .sm,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root small,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root th,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root h4,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root .ln .t,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root .ln.cost .m,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root .tw-chat .fmc-t{color:#475569!important}html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root #tw-bar .pgs button{color:#334155!important}html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root #tw-bar .pgs button.on{background:#0f172a!important;color:#fff!important}html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root #tw-bar .pl{color:#0f172a!important;border-color:rgba(15,23,42,.35)!important}html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root #tw-bar .pgs{border-color:rgba(15,23,42,.35)!important}html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root #tw-tbw th{border-bottom-color:rgba(15,23,42,.3)!important}html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root #tw-strip>div{border-right-color:rgba(15,23,42,.18)!important}html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root input,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root textarea{background:rgba(255,255,255,.8)!important;color:#0f172a!important;border:1px solid rgba(15,23,42,.25)!important}html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root .tw-head b,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root #tw-ken .tw-head b{color:#0f172a!important;text-shadow:none!important}html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root #tw-ken .fm-act,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root #tw-ken .fm-act span{color:#000!important;text-shadow:none!important}html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root #tw-ken .fm-act small{color:#334155!important}html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page] #tw-root #tw-ken .fm-act svg{color:var(--fc,#1d4ed8)!important}html[data-fm-look="base"][data-fm-page="tower"]{background:#e9edf3}html[data-fm-look="base"][data-fm-page="tower"] #tw-bar,html[data-fm-look="base"][data-fm-page="tower"] #tw-strip,html[data-fm-look="base"][data-fm-page="tower"] #tw-tbw,html[data-fm-look="base"][data-fm-page="tower"] #tw-bot .bx,html[data-fm-look="base"][data-fm-page="tower"] #tw-ken .fm-act{background:rgba(255,255,255,.95)!important;border:1px solid rgba(15,23,42,.12)!important;border-radius:14px}html[data-fm-page] .fm-actions{justify-content:center!important}';
    o += 'html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page][data-fm-page][data-fm-page] #tw-ken #fm-actions .tw-group .fm-act{background:linear-gradient(160deg,rgba(255,255,255,.62),rgba(255,255,255,.34))!important;border:1px solid rgba(255,255,255,.7)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 6px 14px -8px rgba(4,22,48,.5)!important;backdrop-filter:blur(5px)!important;-webkit-backdrop-filter:blur(5px)!important}html[data-fm-look="base"][data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page][data-fm-page][data-fm-page] #tw-ken #fm-actions .tw-group .fm-act{background:rgba(255,255,255,.96)!important;border:1px solid rgba(15,23,42,.12)!important;backdrop-filter:none!important}';
    o += 'html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page][data-fm-page][data-fm-page] #tw-ken #fm-actions .tw-group .fm-act i{background:color-mix(in srgb,var(--fc,#1d4ed8) 16%,rgba(255,255,255,.7))!important}html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page][data-fm-page][data-fm-page] #tw-ken #fm-actions .tw-group .fm-act i svg,html[data-fm-page="tower"][data-fm-page][data-fm-page][data-fm-page][data-fm-page][data-fm-page] #tw-ken #fm-actions .tw-group .fm-act svg{color:var(--fc,#1d4ed8)!important;stroke:var(--fc,#1d4ed8)!important}';
    o += 'html[data-fm-page="tower"] #tw-root{background:transparent!important}html[data-fm-page="tower"] #tw-bar{margin:10px 16px 8px;border-radius:18px!important;padding:9px 16px}html[data-fm-page="tower"] #tw-strip,html[data-fm-page="tower"] #tw-tbw,html[data-fm-page="tower"] #tw-bot .bx{border-radius:18px!important}html[data-fm-page="tower"] #tw-strip{margin-top:2px}html[data-fm-page="tower"] #tw-tbw{margin-top:8px;padding:4px 10px}html[data-fm-page="tower"] #tw-bot .bx{padding:10px 14px}html[data-fm-page="tower"] #tw-tbw th{background:transparent!important}';
    /* Base: putih polos, tanpa latar gambar */
    o += 'html[data-fm-look="base"]{--fm-wp:none!important}';
    o += 'html[data-fm-look="base"][data-fm-invert="1"]{background:rgb(41,48,60)!important}html[data-fm-look="base"][data-fm-invert="1"] body{background:transparent!important}';
    o += 'html[data-fm-look="base"] .fm-actions .fm-act{background:rgba(255,255,255,.92)!important;border:1px solid rgba(15,23,42,.12)!important;box-shadow:0 4px 10px -6px rgba(15,23,42,.3)!important}';
    return o;
  })();

  function setLook() {
    var h = document.documentElement, st = document.getElementById('fm-glass-css');
    var on = look() === 'original' && (ROLE === 'kasir' || ROLE === 'manager' || ROLE === 'owner' || ROLE === 'login' || ROLE === 'tower');
    h.setAttribute('data-fm-look', look());
    if (!st) { st = document.createElement('style'); st.id = 'fm-glass-css'; document.head.appendChild(st); }
    var key = (on ? level() : 0) + '|' + (on ? 1 : 0);
    if (st.getAttribute('data-k') !== key) { st.setAttribute('data-k', key); st.textContent = STATIC + (on ? css(level()) : ''); }
    if (on) h.setAttribute('data-fm-glass', '1'); else h.removeAttribute('data-fm-glass');
    if (ROLE === 'login') h.setAttribute('data-fm-portal', '1');
    syncRain();
  }

  /* ---------- efek hujan di kaca (hanya tetesan air pada elemen kaca; diatur Tower) ---------- */
  var RAIN_ROLES = { kasir: 1, manager: 1, owner: 1, login: 1 };
  var RS_ALL = MIRR.concat(AUTH, PLUG).join(',');
  var RS_MODAL = PLUGOV + '>div,.fixed.inset-0[id*="modal"]>div,#fm-dlg .fm-dlg-box';
  var rain = { cv: null, cx: null, raf: 0, regs: [], path: null, area: 0, drops: [], last: 0, lastDraw: 0, lastCol: 0, spr: {}, cost: 0, n: 0, half: false, W: 0, H: 0 };
  function rainCfg() {
    var g = { on: false, size: 3, rate: 3 };
    try { var o = JSON.parse(lsGet('fm_rain_g') || 'null'); if (o) g = { on: !!o.on, size: clamp5(o.size), rate: clamp5(o.rate) }; } catch (e) {}
    try { var sv = JSON.parse(lsGet('fm_rain_s') || 'null'); if (sv && sv.v === 'off') g.on = false; else if (sv && sv.v === 'on') g.on = true; } catch (e) {}
    return g;
  }
  function rainWanted() {
    if (!RAIN_ROLES[ROLE] || look() !== 'original' || !rainCfg().on) return false;
    try { if (sessionStorage.getItem('fm_rain_slow') === '1') return false; } catch (e) {}
    return true;
  }
  function sprite(r) {
    var k = Math.round(r * 2), S0 = rain.spr[k]; if (S0) return S0;
    var rr = k / 2, S = Math.ceil(rr * 2 + 6), c = document.createElement('canvas'); c.width = c.height = S;
    var x = c.getContext('2d'), m = S / 2;
    x.beginPath(); x.arc(m, m + .4, rr, 0, 6.2832);
    var g = x.createRadialGradient(m - rr * .25, m - rr * .3, rr * .08, m, m, rr);
    g.addColorStop(0, 'rgba(255,255,255,.06)'); g.addColorStop(.7, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(10,30,60,.3)');
    x.fillStyle = g; x.fill();
    x.lineWidth = Math.max(.7, rr * .16); x.strokeStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.arc(m, m + .4, rr - x.lineWidth / 2, .15 * Math.PI, .62 * Math.PI); x.stroke();
    x.lineWidth = Math.max(.5, rr * .1); x.strokeStyle = 'rgba(10,30,60,.35)'; x.beginPath(); x.arc(m, m + .4, rr - x.lineWidth / 2, 1.1 * Math.PI, 1.6 * Math.PI); x.stroke();
    x.beginPath(); x.ellipse(m - rr * .32, m - rr * .36, Math.max(.6, rr * .3), Math.max(.4, rr * .19), -.6, 0, 6.2832); x.fillStyle = 'rgba(255,255,255,.97)'; x.fill();
    return (rain.spr[k] = { c: c, S: S });
  }
  function collect() {
    var W = innerWidth, H = innerHeight, all = document.querySelectorAll(RS_ALL), modal = [], base = [], i;
    for (i = 0; i < all.length; i++) {
      var el = all[i], rc = el.getBoundingClientRect();
      if (rc.width < 24 || rc.height < 14 || rc.bottom < 0 || rc.top > H || rc.right < 0 || rc.left > W) continue;
      var cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < .2) continue;
      var rad = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, rc.width / 2, rc.height / 2);
      var o = { x: rc.left, y: rc.top, w: rc.width, h: rc.height, r: rad };
      (el.matches(RS_MODAL) ? modal : base).push(o);
    }
    var regs = modal.length ? modal : base, pth = new Path2D(), area = 0;
    regs.forEach(function (q) { if (pth.roundRect) pth.roundRect(q.x, q.y, q.w, q.h, q.r); else pth.rect(q.x, q.y, q.w, q.h); area += q.w * q.h; });
    rain.regs = regs; rain.path = pth; rain.area = area;
  }
  function pickRegion() {
    var t = Math.random() * rain.area, i, q;
    for (i = 0; i < rain.regs.length; i++) { q = rain.regs[i]; t -= q.w * q.h; if (t <= 0) return q; }
    return rain.regs[rain.regs.length - 1];
  }
  function spawn(cfg) {
    var q = pickRegion(); if (!q) return;
    var rmin = 1.2 + cfg.size * .55, rmax = 2.6 + cfg.size * 1.9, r = rmin + (rmax - rmin) * Math.pow(Math.random(), 2.4);
    rain.drops.push({ x: q.x + Math.random() * q.w, y: q.y + Math.random() * q.h, r: r, sl: false, vy: 0, sy: 0, age: 0, life: 7 + Math.random() * 16, a: 0, slideAt: r > rmax * .55 ? Math.random() * 6 : 1e9, rmin: rmin, trav: 0 });
  }
  function frame(ts) {
    rain.raf = requestAnimationFrame(frame);
    if (document.hidden) { rain.last = ts; return; }
    if (ts - rain.lastDraw < 32) return;                    /* sekitar 30 gambar per detik */
    var dt = Math.min(.08, (ts - (rain.last || ts)) / 1000); rain.last = ts; rain.lastDraw = ts;
    var t0 = performance.now(), cfg = rainCfg();
    if (ts - rain.lastCol > 450) { rain.lastCol = ts; collect(); }
    var W = rain.W, H = rain.H, cx = rain.cx, d = rain.drops, i;
    var maxN = Math.min(rain.half ? 150 : 340, Math.round(rain.area / 10000 * cfg.rate * (rain.half ? .6 : 1)));
    var want = Math.min(maxN - d.length, Math.ceil(cfg.rate * 14 * dt * (rain.half ? .6 : 1)));
    for (i = 0; i < want; i++) spawn(cfg);
    cx.clearRect(0, 0, W, H);
    if (!rain.regs.length) { return; }
    cx.save(); cx.clip(rain.path);
    for (i = d.length - 1; i >= 0; i--) {
      var o = d[i]; o.age += dt; o.a = Math.min(1, o.a + dt * 2.2);
      if (!o.sl && o.age > o.slideAt) { o.sl = true; o.vy = 14; o.sy = o.y; o.trav = 0; o.len = 40 + Math.random() * 150; }
      if (o.sl) { o.vy = Math.min(230, o.vy + 150 * dt); o.y += o.vy * dt; o.trav += o.vy * dt; o.x += (Math.random() - .5) * 5 * dt; o.r = Math.max(o.rmin * .8, o.r * (1 - dt * .045)); if (o.trav > o.len || o.y > H + 30) { o.sl = false; o.slideAt = 1e9; o.life = o.age + 4 + Math.random() * 5; } }
      var fade = o.age > o.life ? Math.max(0, 1 - (o.age - o.life) * .6) : 1;
      if (fade <= 0 || o.y > H + 30) { d.splice(i, 1); continue; }
      var al = o.a * fade;
      if (o.sl) {
        var y0 = Math.max(o.sy, o.y - 70);
        cx.globalAlpha = .13 * al; cx.strokeStyle = '#fff'; cx.lineCap = 'round'; cx.lineWidth = o.r * .8; cx.beginPath(); cx.moveTo(o.x, y0); cx.lineTo(o.x, o.y); cx.stroke();
        cx.globalAlpha = .24 * al; cx.lineWidth = Math.max(.7, o.r * .28); cx.beginPath(); cx.moveTo(o.x, y0); cx.lineTo(o.x, o.y); cx.stroke();
      }
      var sp = sprite(o.r), st = o.sl ? 1.25 : 1;
      cx.globalAlpha = al; cx.drawImage(sp.c, o.x - sp.S / 2, o.y - sp.S / 2 * st, sp.S, sp.S * st);
    }
    cx.restore(); cx.globalAlpha = 1;
    /* pelindung: bila terlalu berat, kurangi dulu; bila tetap berat, berhenti untuk sesi ini */
    rain.cost += performance.now() - t0; rain.n++;
    if (rain.n >= 60) {
      var avg = rain.cost / rain.n; rain.cost = 0; rain.n = 0;
      if (avg > 14) { if (!rain.half) { rain.half = true; rain.drops.length = Math.min(rain.drops.length, 100); } else { try { sessionStorage.setItem('fm_rain_slow', '1'); } catch (e) {} stopRain(); } }
    }
  }
  function sizeRain() { if (!rain.cv) return; rain.W = rain.cv.width = innerWidth; rain.H = rain.cv.height = innerHeight; }
  function startRain() {
    if (rain.cv || !window.Path2D) return;
    var c = document.createElement('canvas'); c.id = 'fm-rain'; c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483640';
    document.body.appendChild(c); rain.cv = c; rain.cx = c.getContext('2d'); rain.drops = []; rain.last = 0; rain.lastCol = 0; sizeRain();
    rain.raf = requestAnimationFrame(frame);
  }
  function stopRain() { if (rain.raf) cancelAnimationFrame(rain.raf); rain.raf = 0; if (rain.cv) { rain.cv.remove(); rain.cv = null; rain.cx = null; } rain.drops = []; }
  function syncRain() { if (rainWanted()) startRain(); else stopRain(); }
  window.addEventListener('resize', sizeRain);

  function refresh() { return fetchCfg().then(function () { setLook(); if (window.FM_WP && FM_WP.update) FM_WP.update(); }); }
  window.FM_LANGIT.apply = setLook;
  window.addEventListener('fm:glass', setLook);
  window.addEventListener('fm:theme', setLook);
  function boot() {
    setLook();
    refresh().then(function () {
      var done = function () { if (window.FM_BOOT_DONE) FM_BOOT_DONE(); };
      try {
        var m = /url\("?([^")]+)"?\)/.exec(document.documentElement.style.getPropertyValue('--fm-wp') || '');
        if (m) { var im = new Image(); im.onload = im.onerror = done; im.src = m[1]; setTimeout(done, 1200); } else done();
      } catch (e) { done(); }
    });
    setInterval(function () { if (!document.hidden) refresh(); }, 30000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
