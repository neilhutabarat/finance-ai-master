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
        lsSet('fm_wp_cfg', JSON.stringify({ mode: j.mode, fixed: j.fixed, order: j.order, start: j.start, day: j.day, hour: j.hour }));
        lsSet(KEY_G, String(clampLv(j.glass)));
      }
    }).catch(function () {});
  }
  function clampLv(v) { v = parseInt(v, 10); return v >= 1 && v <= 5 ? v : 3; }
  function level() {
    var s = lsGet(KEY_S), v = null;
    try { var o = JSON.parse(s || 'null'); if (o && o.v >= 1 && o.v <= 5) v = o.v; } catch (e) {}
    return v || clampLv(lsGet(KEY_G));
  }
  function look() { try { var p = window.FM_THEME_PREF && FM_THEME_PREF(); return (p && p.look === 'base') ? 'base' : 'original'; } catch (e) { return 'original'; } }

  /* ---------- kaca ---------- */
  /* tingkat 1..5: kepekatan lapisan kaca (atas, tengah, bawah), kekaburan, kejenuhan latar */
  var LV = { 1: { a: [.9, .78, .86], b: 24, s: 1.1 }, 2: { a: [.7, .52, .64], b: 19, s: 1.25 }, 3: { a: [.5, .22, .4], b: 14, s: 1.45 }, 4: { a: [.3, .09, .22], b: 9, s: 1.6 }, 5: { a: [.16, .03, .1], b: 5, s: 1.7 } };
  var MIRR = ['.ios-glass', '.white-ice-glass-card:not([style*="0f172a"])', '.fixed.inset-0[id*="modal"]>div'];
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
    var bf = 'blur(' + p.b + 'px) saturate(' + p.s + ')', bfInv = 'invert(1) hue-rotate(180deg) ' + bf;
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
    /* selubung latar tipis: gambar tetap terlihat, kartu yang menjaga keterbacaan */
    o += P + ':not([data-fm-invert]) body[class]{background-image:linear-gradient(rgba(255,255,255,.04),rgba(255,255,255,.02)),var(--fm-wp)!important}';
    return o;
  }
  /* tombol berwarna: tiap tombol beda warna, tulisan berwarna, tombol tetap kaca */
  var STATIC = (function () {
    var o = '';
    COLORS.forEach(function (c, i) { o += '.fm-actions .fm-act:nth-child(8n+' + (i + 1) + '){--fc:' + c + '}'; });
    o += '.fm-actions .fm-act,.fm-actions .fm-act *{color:var(--fc,#1d4ed8)!important}';
    o += '.fm-actions .fm-act i{background:color-mix(in srgb,var(--fc,#1d4ed8) 14%,transparent)!important}';
    o += 'html[data-fm-page="manager"] .fm-actions,html[data-fm-page="owner"] .fm-actions{display:flex!important;flex-wrap:wrap;gap:8px!important;align-content:flex-start!important;grid-template-columns:none!important;grid-auto-rows:auto!important;max-height:none!important}';
    o += 'html[data-fm-page] .fm-actions .fm-act{flex:0 0 auto!important;grid-column:auto!important;min-height:0!important;height:38px!important;padding:0 15px 0 8px!important;border-radius:999px!important;font-size:12.5px!important;font-weight:800!important;gap:8px!important;flex-direction:row!important;text-align:left!important}';
    o += 'html[data-fm-page] .fm-actions .fm-act i{width:24px!important;height:24px!important;border-radius:50%!important}.fm-actions .fm-act svg{width:14px!important;height:14px!important}';
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
    /* Base: putih polos, tanpa latar gambar */
    o += 'html[data-fm-look="base"]{--fm-wp:none!important}';
    o += 'html[data-fm-look="base"][data-fm-invert="1"]{background:rgb(41,48,60)!important}html[data-fm-look="base"][data-fm-invert="1"] body{background:transparent!important}';
    o += 'html[data-fm-look="base"] .fm-actions .fm-act{background:rgba(255,255,255,.92)!important;border:1px solid rgba(15,23,42,.12)!important;box-shadow:0 4px 10px -6px rgba(15,23,42,.3)!important}';
    return o;
  })();

  function setLook() {
    var h = document.documentElement, st = document.getElementById('fm-glass-css');
    var on = look() === 'original' && (ROLE === 'kasir' || ROLE === 'manager' || ROLE === 'owner');
    h.setAttribute('data-fm-look', look());
    if (!st) { st = document.createElement('style'); st.id = 'fm-glass-css'; document.head.appendChild(st); }
    var key = (on ? level() : 0) + '|' + (on ? 1 : 0);
    if (st.getAttribute('data-k') !== key) { st.setAttribute('data-k', key); st.textContent = STATIC + (on ? css(level()) : ''); }
    if (on) h.setAttribute('data-fm-glass', '1'); else h.removeAttribute('data-fm-glass');
  }
  function refresh() { return fetchCfg().then(function () { setLook(); if (window.FM_WP && FM_WP.update) FM_WP.update(); }); }
  window.FM_LANGIT.apply = setLook;
  window.addEventListener('fm:glass', setLook);
  window.addEventListener('fm:theme', setLook);
  function boot() {
    setLook();
    refresh();
    setInterval(function () { if (!document.hidden) refresh(); }, 30000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
