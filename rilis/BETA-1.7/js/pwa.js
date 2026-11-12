/* PWA per toko: manifest dibuat saat halaman dibuka (bukan file tetap), supaya tiap toko dapat
   nama, warna, dan ikon sendiri dari logo yang sudah mereka unggah (atau inisial bila belum ada logo).
   Tidak berlaku di provider.html/partner.html (dipakai internal, bukan untuk dipasang klien). */
(function () {
  'use strict';
  var PATH = (location.pathname || '').toLowerCase();
  if (/provider|partner/.test(PATH)) return;

  function g(fn, d) { try { var v = fn(); return v === undefined ? d : v; } catch (e) { return d; } }
  function tenant() { return g(function () { return getActiveTenant(); }, null); }

  function initials(nama) {
    return String(nama || 'ON').replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('') || 'ON';
  }

  /* ikon kotak: pakai logo toko (tenant_settings/{id}.logo, data-url) bila ada, kalau tidak gambar inisial di atas warna toko */
  function drawIcon(size, warna, text, logoUrl) {
    return new Promise(function (resolve) {
      var c = document.createElement('canvas'); c.width = size; c.height = size;
      var ctx = c.getContext('2d');
      function finishPlain() {
        ctx.fillStyle = warna || '#2563eb'; ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#fff'; ctx.font = '700 ' + Math.round(size * 0.42) + 'px system-ui,-apple-system,Segoe UI,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, size / 2, size * 0.56);
        resolve(c.toDataURL('image/png'));
      }
      if (!logoUrl) return finishPlain();
      var im = new Image();
      im.onload = function () {
        ctx.fillStyle = warna || '#2563eb'; ctx.fillRect(0, 0, size, size);
        var pad = size * 0.1, w = size - pad * 2;
        try { ctx.drawImage(im, pad, pad, w, w); resolve(c.toDataURL('image/png')); } catch (e) { finishPlain(); }
      };
      im.onerror = finishPlain;
      im.src = logoUrl;
    });
  }

  function fetchLogo(id) {
    return new Promise(function (resolve) {
      if (!g(function () { return typeof db !== 'undefined' && db; }, false)) return resolve('');
      db.collection('tenant_settings').doc(id).get().then(function (s) { resolve((s.exists && s.data().logo) || ''); }).catch(function () { resolve(''); });
    });
  }

  function dataUrlToBlobUrl(dataUrl) {
    var parts = dataUrl.split(','), mime = parts[0].match(/:(.*?);/)[1], bin = atob(parts[1]), n = bin.length, u8 = new Uint8Array(n);
    while (n--) u8[n] = bin.charCodeAt(n);
    return URL.createObjectURL(new Blob([u8], { type: mime }));
  }

  var installEvt = null, btn = null;
  function isStandalone() { return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }

  function buildButton(label, onClick) {
    if (btn) btn.remove();
    btn = document.createElement('button'); btn.type = 'button'; btn.id = 'pwa-install-btn'; btn.textContent = label;
    btn.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:14px;z-index:2147481000;background:#111;color:#fff;border:0;border-radius:99px;padding:9px 18px;font:600 12.5px system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer';
    btn.onclick = onClick;
    document.body.appendChild(btn);
  }

  function setup() {
    var tn = tenant(); if (!tn || !tn.id) return;
    var id = String(tn.id).toUpperCase(), warna = tn.warna || '#2563eb', text = initials(tn.nama);
    fetchLogo(id).then(function (logo) {
      Promise.all([drawIcon(192, warna, text, logo), drawIcon(512, warna, text, logo)]).then(function (icons) {
        var manifest = {
          name: tn.nama || 'Oneilverse', short_name: (tn.nama || 'Oneilverse').slice(0, 14),
          start_url: location.pathname.split('/').pop() + '?toko=' + encodeURIComponent(id),
          scope: './', display: 'standalone', orientation: 'any',
          background_color: '#0b1020', theme_color: warna,
          icons: [{ src: icons[0], sizes: '192x192', type: 'image/png' }, { src: icons[1], sizes: '512x512', type: 'image/png' }]
        };
        var blobUrl = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }));
        var link = document.querySelector('link[rel="manifest"]'); if (!link) { link = document.createElement('link'); link.rel = 'manifest'; document.head.appendChild(link); }
        link.href = blobUrl;
        var apple = document.querySelector('link[rel="apple-touch-icon"]'); if (!apple) { apple = document.createElement('link'); apple.rel = 'apple-touch-icon'; document.head.appendChild(apple); }
        apple.href = icons[1];
        var tc = document.querySelector('meta[name="theme-color"]'); if (!tc) { tc = document.createElement('meta'); tc.name = 'theme-color'; document.head.appendChild(tc); }
        tc.content = warna;
      });
    });
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); installEvt = e;
    if (isStandalone()) return;
    buildButton('Pasang aplikasi toko ini', function () {
      if (!installEvt) return;
      installEvt.prompt();
      installEvt.userChoice.then(function () { installEvt = null; if (btn) { btn.remove(); btn = null; } });
    });
  });
  window.addEventListener('appinstalled', function () { if (btn) { btn.remove(); btn = null; } });

  function maybeIosTip() {
    if (!isIOS() || isStandalone()) return;
    try { if (localStorage.getItem('fm_pwa_ios_tip_v1')) return; } catch (e) {}
    buildButton('Pasang: tombol Bagikan → Tambah ke Layar Utama', function () {
      try { localStorage.setItem('fm_pwa_ios_tip_v1', '1'); } catch (e) {}
      if (btn) { btn.remove(); btn = null; }
    });
  }

  var tries = 0;
  (function wait() {
    if (tenant()) { setup(); maybeIosTip(); return; }
    if (++tries < 60) setTimeout(wait, 300);
  })();
})();
