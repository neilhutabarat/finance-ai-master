/* loader.js — layar pemuat + tombol "Perbarui Aplikasi".
   1) Layar "Memuat..." tampil sejak awal halaman dan baru hilang setelah halaman siap, jadi tidak terlihat susunan setengah jadi (kedip) saat F5 atau Ctrl+Shift+R.
   2) Layar yang sama muncul saat berpindah halaman.
   3) Tombol merah "Perbarui Aplikasi": hapus cache aplikasi + service worker, unduh ulang file halaman ini, lalu muat ulang.
      Login, data toko, dan pengaturan tampilan TIDAK dihapus. Progres yang ditampilkan adalah jumlah file yang benar-benar diunduh ulang. */
(function () {
  'use strict';
  if (window.__fmLoader) return; window.__fmLoader = true;
  var root = document.documentElement, ld = null, done = false, hideT = 0;

  var CSS = '#fm-ld{position:fixed;inset:0;z-index:2147483646;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#f6f3ec;color:#334155;font:700 14px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;opacity:1;transition:opacity .3s ease}' +
    '#fm-ld.fm-ld-out{opacity:0;pointer-events:none}' +
    '#fm-ld .fm-ld-sp{width:44px;height:44px;border-radius:50%;border:4px solid rgba(15,23,42,.12);border-top-color:#dc2626;animation:fmld .8s linear infinite}' +
    '#fm-ld .fm-ld-bar{width:200px;height:6px;border-radius:99px;background:rgba(15,23,42,.1);overflow:hidden;display:none}#fm-ld .fm-ld-bar i{display:block;height:100%;width:0;background:#dc2626;border-radius:99px;transition:width .2s ease}' +
    '#fm-ld.fm-ld-upd .fm-ld-bar{display:block}#fm-ld .fm-ld-s{font-weight:500;font-size:12px;opacity:.65;min-height:15px}' +
    '@keyframes fmld{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){#fm-ld .fm-ld-sp{animation-duration:2.4s}}' +
    'html body #fm-refresh{border:0!important;border-radius:999px!important;background:#dc2626!important;background-image:none!important;color:#fff!important;font:700 12px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif!important;padding:7px 13px!important;cursor:pointer;white-space:nowrap;box-shadow:0 2px 8px rgba(220,38,38,.35)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;filter:none!important;opacity:1!important;text-shadow:none!important;flex:0 0 auto}' +
    'html body #fm-refresh:hover{background:#b91c1c!important}#fm-refresh:active{transform:scale(.97)}html body #fm-refresh.fm-rf-fix{position:fixed!important;right:8px!important;top:5px!important;bottom:auto!important;margin:0!important;min-height:0!important;height:auto!important;padding:5px 10px!important;font-size:11px!important;z-index:2147483000}';
  var st = document.createElement('style'); st.id = 'fm-ld-css'; st.textContent = CSS; (document.head || root).appendChild(st);

  function build(text) {
    if (ld && ld.parentNode) { ld.classList.remove('fm-ld-out'); ld.querySelector('.fm-ld-t').textContent = text; return ld; }
    ld = document.createElement('div'); ld.id = 'fm-ld'; ld.setAttribute('role', 'status'); ld.setAttribute('aria-live', 'polite');
    ld.innerHTML = '<div class="fm-ld-sp"></div><div class="fm-ld-t"></div><div class="fm-ld-bar"><i></i></div><div class="fm-ld-s"></div>';
    ld.querySelector('.fm-ld-t').textContent = text; root.appendChild(ld); return ld;
  }
  function show(text) { clearTimeout(hideT); build(text || 'Memuat...'); }
  function hide() {
    if (!ld) return; var el = ld; el.classList.add('fm-ld-out');
    setTimeout(function () { if (el.parentNode && el.classList.contains('fm-ld-out')) el.parentNode.removeChild(el); if (ld === el) ld = null; }, 360);
  }

  /* ---- 1. tampil sejak awal, hilang setelah halaman siap ---- */
  show('Memuat...');
  var t0 = Date.now();
  function finish() { if (done) return; done = true; hide(); }
  function check() {
    if (done) return;
    var ready = root.classList.contains('fm-ready') || (document.readyState === 'complete' && Date.now() - t0 > 1500);
    if (document.readyState === 'complete' && ready) { setTimeout(finish, 120); return; }
    setTimeout(check, 60);
  }
  check();
  setTimeout(finish, 7000); /* pengaman: tidak pernah menahan layar lebih dari 7 detik */

  /* ---- 2. pindah halaman ---- */
  window.addEventListener('beforeunload', function () { if (window.__fmUpdating) return; show('Memuat...'); hideT = setTimeout(hide, 6000); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) { done = true; hide(); } });

  /* ---- 3. perbarui aplikasi ---- */
  function sameOrigin(u) { try { return new URL(u, location.href).origin === location.origin; } catch (e) { return false; } }
  function urls() {
    var l = [location.pathname + location.search, '/version.json', '/js/rollout.js'];
    [].forEach.call(document.querySelectorAll('script[src],link[rel="stylesheet"][href]'), function (n) { var u = n.getAttribute('src') || n.getAttribute('href'); if (u && sameOrigin(u)) l.push(new URL(u, location.href).pathname + new URL(u, location.href).search); });
    return l.filter(function (u, i) { return l.indexOf(u) === i; });
  }
  function run() {
    if (window.__fmUpdating) return; window.__fmUpdating = true; done = true;
    show('Memperbarui aplikasi...'); var el = ld; el.classList.add('fm-ld-upd');
    var bar = el.querySelector('.fm-ld-bar i'), sub = el.querySelector('.fm-ld-s'), t = el.querySelector('.fm-ld-t'), started = Date.now();
    function step(p, s) { bar.style.width = Math.round(p * 100) + '%'; sub.textContent = s || ''; }
    step(0.03, 'Menghapus cache lama');
    var chain = Promise.resolve();
    chain = chain.then(function () { return (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) ? navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); }) : null; }).catch(function () {});
    chain = chain.then(function () { return window.caches ? caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }) : null; }).catch(function () {});
    chain = chain.then(function () { try { localStorage.removeItem('fm_rollout_cfg_v1'); sessionStorage.removeItem('fm_rollout_redirect_count'); } catch (e) {} step(0.1, 'Mengunduh versi terbaru'); });
    chain = chain.then(function () {
      var list = urls(), n = 0, i = 0, total = list.length;
      function worker() {
        if (i >= total) return Promise.resolve();
        var u = list[i++];
        return fetch(u, { cache: 'reload', credentials: 'same-origin' }).catch(function () {}).then(function () { n++; step(0.1 + 0.8 * n / total, 'File ' + n + ' dari ' + total); return worker(); });
      }
      return Promise.all([worker(), worker(), worker(), worker()]);
    });
    chain.catch(function () {}).then(function () {
      var wait = Math.max(0, 1100 - (Date.now() - started));
      setTimeout(function () { step(1, 'Selesai'); t.textContent = 'Membuka ulang...'; setTimeout(function () { location.reload(); }, 350); }, wait);
    });
    setTimeout(function () { if (window.__fmUpdating) location.reload(); }, 25000); /* pengaman jaringan lambat */
  }

  /* tombol merah: di sebelah "Role", atau pojok kanan bawah bila halaman tidak punya header role */
  function mountBtn() {
    if (document.getElementById('fm-refresh')) return;
    var b = document.createElement('button'); b.id = 'fm-refresh'; b.type = 'button'; b.textContent = 'Perbarui Aplikasi'; b.title = 'Muat versi terbaru aplikasi (login dan data tidak hilang)';
    b.addEventListener('click', run);
    var role = document.getElementById('user-role-display'), pill = role && (role.closest('.ios-pill') || role.parentNode);
    if (pill) { b.style.setProperty('margin-left', '10px', 'important'); pill.appendChild(b); pill.style.setProperty('flex-wrap', 'nowrap', 'important'); } else { b.className = 'fm-rf-fix'; document.body.appendChild(b); }
  }
  function floatIfHidden() {
    var b = document.getElementById('fm-refresh'); if (!b || b.classList.contains('fm-rf-fix')) return;
    if (!b.offsetParent || b.getBoundingClientRect().width === 0) { b.classList.add('fm-rf-fix'); document.body.appendChild(b); }
  }
  function init() { try { mountBtn(); [400, 1500, 3500].forEach(function (ms) { setTimeout(floatIfHidden, ms); }); window.addEventListener('resize', function () { setTimeout(floatIfHidden, 200); }); } catch (e) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.FM_REFRESH = { run: run };
})();
