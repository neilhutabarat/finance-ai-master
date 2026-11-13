/* langit.js — latar dan kaca, versi ringan (Beta 11). Tanpa animasi, tanpa cuaca, tanpa pengukuran PC.
   - Kaca (kartu/tombol tembus pandang) dipasang sama untuk Kasir, Manager, dan Owner.
   - Gambar latar diatur dari Tower (app_meta/wallpaper, dibaca tanpa login) dan diperiksa ulang tiap 30 detik,
     jadi berganti sendiri tanpa klien memuat ulang. Klien tidak punya pengaturan latar. */
(function () {
  'use strict';
  var ROLE = window.FM_ROLE || '';
  var PID = 'finance-ai-master-byneilverse', AK = 'AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI';
  window.FM_LANGIT = {};
  function fetchCfg() {
    var url = 'https://firestore.googleapis.com/v1/projects/' + PID + '/databases/(default)/documents/app_meta/wallpaper?key=' + AK;
    return fetch(url, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      var f = d && d.fields; if (!f || !f.json || !f.json.stringValue) return;
      var j = JSON.parse(f.json.stringValue);
      if (j && typeof j === 'object') localStorage.setItem('fm_wp_cfg', JSON.stringify({ mode: j.mode, fixed: j.fixed, order: j.order, start: j.start, day: j.day, hour: j.hour }));
    }).catch(function () {});
  }
  function refresh() { return fetchCfg().then(function () { if (window.FM_WP && FM_WP.update) FM_WP.update(); }); }

  /* ---------- kaca ---------- */
  var ELS = '.ios-glass,.white-ice-glass-card,header.oneui-hero,#fm-dock,.fm-act';
  function glassCss(kind) {
    var P = 'html' + '[data-fm-glass]'.repeat(6), D = P + '[data-fm-black="1"]', L = P + ':not([data-fm-black="1"])';
    function sel(pre) { return ELS.split(',').map(function (e) { return pre + ' ' + e; }).join(','); }
    var bfLight, bfDark, extraLight = '', extraDark = '', shadowL, shadowD;
    if (kind === 'blur') {
      bfLight = bfDark = 'blur(14px) saturate(1.4)';
      shadowL = 'inset 0 1px 0 rgba(255,255,255,.8),0 14px 28px -14px rgba(4,22,48,.45)'; shadowD = 'inset 0 1px 0 rgba(255,255,255,.3),0 14px 28px -14px rgba(0,0,0,.7)';
    } else {
      bfLight = bfDark = 'blur(12px) saturate(1.6) brightness(1.08)';
      shadowL = 'inset 0 0 0 1px rgba(255,255,255,.3),inset 0 2px 1px rgba(255,255,255,.9),inset 0 -2px 2px rgba(255,255,255,.3),inset 0 0 22px rgba(255,255,255,.22),0 20px 38px -16px rgba(4,22,48,.5)';
      shadowD = 'inset 0 0 0 1px rgba(255,255,255,.16),inset 0 2px 1px rgba(255,255,255,.4),inset 0 -2px 2px rgba(255,255,255,.12),inset 0 0 22px rgba(255,255,255,.08),0 20px 38px -16px rgba(0,0,0,.75)';
      if (kind === 'ice') {
        extraLight = 'linear-gradient(112deg,transparent 14%,rgba(255,255,255,.55) 21%,rgba(255,255,255,.06) 25%,transparent 31%),linear-gradient(112deg,transparent 60%,rgba(255,255,255,.3) 64%,transparent 68%),radial-gradient(circle at 18% 78%,rgba(255,255,255,.8) 0 1.8px,transparent 2.8px),radial-gradient(circle at 82% 26%,rgba(255,255,255,.75) 0 2px,transparent 3px),radial-gradient(ellipse at 50% 125%,rgba(130,200,255,.3),transparent 60%),';
        extraDark = 'linear-gradient(112deg,transparent 14%,rgba(255,255,255,.22) 21%,rgba(255,255,255,.03) 25%,transparent 31%),radial-gradient(circle at 18% 78%,rgba(255,255,255,.5) 0 1.8px,transparent 2.8px),radial-gradient(circle at 82% 26%,rgba(255,255,255,.5) 0 2px,transparent 3px),';
      } else {
        extraLight = 'linear-gradient(112deg,transparent 16%,rgba(255,255,255,.32) 22%,transparent 27%),'; extraDark = 'linear-gradient(112deg,transparent 16%,rgba(255,255,255,.12) 22%,transparent 27%),';
      }
    }
    var css = '';
    css += sel(L) + '{background:' + extraLight + 'linear-gradient(160deg,rgba(255,255,255,var(--fm-ga,.42)),rgba(255,255,255,var(--fm-gb,.14)) 55%,rgba(255,255,255,var(--fm-gc,.3)))!important;backdrop-filter:' + bfLight + '!important;-webkit-backdrop-filter:' + bfLight.replace('url(#fm-refr) ', '') + '!important;border:1px solid rgba(255,255,255,.6)!important;box-shadow:' + shadowL + '!important;text-shadow:0 1px 0 rgba(255,255,255,.6)}';
    css += sel(D) + '{background:' + extraDark + 'linear-gradient(160deg,rgba(18,26,42,var(--fm-da,.5)),rgba(18,26,42,var(--fm-db,.3)) 55%,rgba(18,26,42,var(--fm-dc,.45)))!important;backdrop-filter:' + bfDark + '!important;-webkit-backdrop-filter:' + bfDark.replace('url(#fm-refr) ', '') + '!important;border:1px solid rgba(255,255,255,.2)!important;box-shadow:' + shadowD + '!important}';
    /* selubung latar dikurangi agar gambar terlihat; kartu yang menjaga keterbacaan */
    css += L + ' body[class]{background-image:linear-gradient(rgba(255,255,255,.05),rgba(255,255,255,.03)),var(--fm-wp)!important}';
    css += D + ' body[class]{background-image:linear-gradient(rgba(8,11,17,.3),rgba(8,11,17,.42)),var(--fm-wp)!important}';
    return css;
  }

  function setGlass() {
    var h = document.documentElement, st = document.getElementById('fm-glass-css');
    if (!st) { st = document.createElement('style'); st.id = 'fm-glass-css'; st.textContent = glassCss('lite'); document.head.appendChild(st); }
    h.setAttribute('data-fm-glass', '1');
  }
  function boot() {
    if (ROLE === 'kasir' || ROLE === 'manager' || ROLE === 'owner') setGlass();
    refresh();
    setInterval(function () { if (!document.hidden) refresh(); }, 30000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
