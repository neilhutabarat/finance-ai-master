/* Mendaftarkan mode offline dan menampilkan penanda kecil saat tidak ada internet. */
(function () {
  var src = document.currentScript && document.currentScript.src;
  if ('serviceWorker' in navigator && src && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () {
      try { navigator.serviceWorker.register(new URL('../sw.js', src).href).catch(function () {}); } catch (e) {}
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
