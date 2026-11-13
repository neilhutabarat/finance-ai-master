/* offline.js — Mode Offline Penuh (opsional per toko). Memuat sebelum core.js: bila fitur menyala, Firestore memakai
   penyimpanan di perangkat (IndexedDB) sehingga transaksi yang dicatat saat internet putus tidak hilang dan terkirim sendiri
   saat online. Penanda kecil menampilkan jumlah catatan yang menunggu dikirim. Flag 'fm_offline_full' diisi plans.js. */
(function () {
  'use strict';
  function flag() { try { return localStorage.getItem('fm_offline_full') === '1'; } catch (e) { return false; } }
  var persisted = false;
  try {
    if (flag() && window.firebase && firebase.firestore && typeof APP_CONFIG !== 'undefined' && APP_CONFIG.firebase) {
      if (!firebase.apps.length) firebase.initializeApp(APP_CONFIG.firebase);
      firebase.firestore().enablePersistence({ synchronizeTabs: true }).then(function () { persisted = true; }).catch(function (e) { window.FM_OFFLINE_ERR = (e && e.code) || 'gagal'; });
    }
  } catch (e) { window.FM_OFFLINE_ERR = 'gagal'; }

  var pill = null, last = 0, hideT = null;
  function show(txt, color) {
    if (!document.body) return;
    if (!pill) {
      pill = document.createElement('div');
      pill.style.cssText = 'position:fixed;top:36px;left:50%;transform:translateX(-50%);z-index:2147482900;border-radius:99px;padding:4px 14px;font:700 11px -apple-system,Segoe UI,sans-serif;max-width:92vw;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.35)';
      document.body.appendChild(pill);
    }
    pill.style.background = color === 'ok' ? '#052e16' : '#1e1b4b'; pill.style.color = color === 'ok' ? '#86efac' : '#c7d2fe'; pill.style.border = '1px solid ' + (color === 'ok' ? '#166534' : '#3730a3');
    pill.textContent = txt;
  }
  function hide() { if (pill) { pill.remove(); pill = null; } }
  function update(n) {
    clearTimeout(hideT);
    if (n > 0) { last = n; show(navigator.onLine ? 'Mengirim ' + n + ' catatan ke server…' : n + ' catatan tersimpan di perangkat, dikirim saat online', 'wait'); }
    else if (last > 0) { last = 0; show('Semua catatan sudah tersinkron', 'ok'); hideT = setTimeout(hide, 4000); }
    else hide();
  }
  function watch() {
    try {
      if (!flag() || typeof db === 'undefined' || !db || typeof tenantFirestoreCol === 'undefined') return;
      db.collection(tenantFirestoreCol).onSnapshot({ includeMetadataChanges: true }, function (s) {
        var n = 0; s.forEach(function (d) { if (d.metadata.hasPendingWrites) n++; }); update(n);
      }, function () {});
      window.addEventListener('online', function () { update(last); });
      window.addEventListener('offline', function () { update(last); });
    } catch (e) {}
  }
  window.FM_OFFLINE = { on: flag, persisted: function () { return persisted; }, err: function () { return window.FM_OFFLINE_ERR || ''; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(watch, 1500); }); else setTimeout(watch, 1500);
})();
