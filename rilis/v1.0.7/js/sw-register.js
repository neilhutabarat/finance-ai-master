/* Mendaftarkan mode offline dan menampilkan penanda kecil saat tidak ada internet. */
(function () {
  var src = document.currentScript && document.currentScript.src;
  function showUpdateReady() {
    if (document.getElementById('fm-upd-ready') || !document.body) return;
    var b = document.createElement('div'); b.id = 'fm-upd-ready';
    b.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:2147483200;background:#111;color:#fff;border-radius:16px;padding:10px 14px;font:13px system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35);display:flex;gap:10px;align-items:center;max-width:94vw;flex-wrap:wrap;justify-content:center';
    b.innerHTML = '<span>Versi baru aplikasi sudah siap.</span><button id="fm-upd-go" style="all:unset;cursor:pointer;background:#2563eb;color:#fff;border-radius:10px;padding:6px 12px;font-weight:700;font-size:12.5px">Muat ulang</button><button id="fm-upd-no" style="all:unset;cursor:pointer;color:#e5e7eb;font-size:12.5px;padding:6px 8px">Nanti</button>';
    document.body.appendChild(b);
    document.getElementById('fm-upd-go').onclick = function () { location.reload(); };
    document.getElementById('fm-upd-no').onclick = function () { b.remove(); };
  }
  if ('serviceWorker' in navigator && src && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () {
      try {
        navigator.serviceWorker.register(new URL('../sw.js', src).href).then(function (reg) {
          if (!reg) return;
          try { reg.update(); } catch (e) {} // paksa cek versi SW terbaru tiap muat (lewati cache skrip SW browser)
          reg.addEventListener('updatefound', function () {
            var nw = reg.installing; if (!nw) return;
            nw.addEventListener('statechange', function () {
              // ada SW baru terpasang DAN sudah ada SW lama (= pembaruan, bukan pemasangan pertama)
              if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdateReady();
            });
          });
        }).catch(function () {});
      } catch (e) {}
    });
  }
  var pill = null;
  function show() {
    if (navigator.onLine) { if (pill) { pill.remove(); pill = null; } return; }
    if (pill || !document.body) return;
    pill = document.createElement('div');
    pill.textContent = 'Mode offline: data terbaru belum tersinkron';
    pill.style.cssText = 'position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147483000;background:#3a2a05;color:#f5c542;border:1px solid #6b4e0a;border-radius:99px;padding:4px 14px;font:600 12px system-ui,sans-serif;pointer-events:none';
    document.body.appendChild(pill);
  }
  window.addEventListener('offline', show); window.addEventListener('online', show);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show); else show();
})();
