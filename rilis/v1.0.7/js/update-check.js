/* Mengecek apakah ada versi aplikasi yang lebih baru di server, lewat version.json.
   Tidak mengganggu pekerjaan yang sedang berlangsung: pop-up kecil mengambang, bukan menutupi layar,
   dan muat ulang otomatis hanya dijalankan saat layar benar-benar tidak disentuh (idle). */
(function () {
  'use strict';
  if (/partner/.test(location.pathname)) return; // Partner memakai alurnya sendiri
  var CEK_MS = 4 * 60 * 1000, IDLE_MS = 5 * 60 * 1000;
  var versiBerjalan = (window.FM_RELEASES && FM_RELEASES.beta) || '';
  var versiBaru = null, lastTouch = Date.now(), pill = null;

  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'].forEach(function (ev) {
    document.addEventListener(ev, function () { lastTouch = Date.now(); }, { passive: true });
  });

  function cek() {
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !j.versi) return;
      if (versiBerjalan && j.versi !== versiBerjalan && j.versi !== versiBaru) { versiBaru = j.versi; tampilkanPopup(); }
    }).catch(function () {});
  }

  function tampilkanPopup() {
    if (pill) return;
    pill = document.createElement('div');
    pill.id = 'fm-update-pill';
    pill.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:2147483100;background:rgba(255,255,255,.9);color:#0f172a;border:1px solid rgba(255,255,255,.9);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:16px;padding:10px 14px;font:13px system-ui,sans-serif;box-shadow:0 8px 28px -8px rgba(15,23,42,.35);display:flex;align-items:center;gap:10px;max-width:92vw';
    pill.innerHTML = '<span>Versi baru tersedia' + (versiBaru ? ' (' + versiBaru.replace('1.0.0 ', '').replace('BETA ', 'Beta ') + ')' : '') + '. Muat ulang halaman untuk memperbarui.</span>' +
      '<button id="fm-update-go" style="all:unset;cursor:pointer;background:#2563eb;color:#fff;border-radius:10px;padding:6px 12px;font-weight:700;font-size:12.5px">Muat ulang</button>' +
      '<button id="fm-update-later" style="all:unset;cursor:pointer;color:#334155;font-size:12.5px;padding:6px 8px">Nanti</button>';
    document.body.appendChild(pill);
    document.getElementById('fm-update-go').onclick = muatUlang;
    document.getElementById('fm-update-later').onclick = function () { pill.remove(); pill = null; };
  }

  function muatUlang() {
    /* segarkan dulu salinan halaman di cache browser, baru muat ulang, agar tidak kembali ke versi lama */
    var go = function () { location.reload(); };
    var refresh = function () { return fetch(location.pathname + location.search, { cache: 'reload' }).catch(function () {}); };
    var sw = ('serviceWorker' in navigator) ? navigator.serviceWorker.getRegistration().then(function (reg) { return reg ? reg.update() : null; }).catch(function () {}) : Promise.resolve();
    Promise.all([refresh(), sw]).then(go, go);
  }

  setInterval(function () {
    cek();
    if (versiBaru && Date.now() - lastTouch > IDLE_MS) muatUlang();
  }, CEK_MS);
  setTimeout(cek, 3000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) cek(); });
  window.addEventListener('focus', cek);
  try { var cs = document.createElement('style'); cs.textContent = 'html[data-fm-invert="1"] #fm-update-pill{filter:invert(1) hue-rotate(180deg)}#fm-update-pill{max-width:min(94vw,560px);flex-wrap:wrap;justify-content:center}'; document.head.appendChild(cs); } catch (e) {}

  /* "Yang baru" sekali tampil setelah versi berganti di perangkat ini */
  function tampilkanCatatanBaru() {
    if (!versiBerjalan || !window.FM_RELEASES) return;
    var sudah = null; try { sudah = localStorage.getItem('fm_seen_version'); } catch (e) {}
    if (sudah === versiBerjalan) return;
    var n = FM_RELEASES.last(1)[0]; if (!n) return;
    var ov = document.createElement('div');
    ov.id = 'fm-whatsnew';
    ov.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:2147483050;max-width:320px;background:rgba(255,255,255,.9);color:#0f172a;border:1px solid rgba(255,255,255,.9);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:18px;padding:14px 16px;font:13px/1.5 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35)';
    var items = (n[2] || []).slice(0, 5).map(function (t) { return '<li style="margin:3px 0">' + String(t).replace(/^\[(\w+)\]\s*/, '').replace(/[<>&]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]; }) + '</li>'; }).join('');
    ov.innerHTML = '<b style="display:block;margin-bottom:4px">Yang baru di ' + (/^\d/.test(n[0]) ? 'v' : '') + n[0] + '</b><ul style="margin:0;padding-left:18px;color:#475569;font-size:12px">' + items + '</ul>' +
      '<button id="fm-whatsnew-ok" style="all:unset;cursor:pointer;display:block;margin-top:10px;text-align:center;background:#2563eb;color:#fff;border-radius:10px;padding:6px 0;font-weight:700;font-size:12.5px">Mengerti</button>';
    document.body.appendChild(ov);
    function tutup() { try { localStorage.setItem('fm_seen_version', versiBerjalan); } catch (e) {} if (!ov.parentNode) return; ov.style.transition = 'opacity .5s'; ov.style.opacity = '0'; setTimeout(function () { ov.remove(); }, 520); }
    document.getElementById('fm-whatsnew-ok').onclick = tutup;
    /* cukup tampil sekitar 5 detik, lalu hilang sendiri; catatan lengkap ada di Pengaturan > Catatan Rilis */
    try { localStorage.setItem('fm_seen_version', versiBerjalan); } catch (e) {}
    setTimeout(tutup, 5000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tampilkanCatatanBaru); else tampilkanCatatanBaru();
})();
