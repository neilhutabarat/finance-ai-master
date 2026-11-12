/* Mode offline Oneilverse (service worker).
   Aturan: saat ada internet, halaman dan skrip SELALU diambil terbaru dari server (batas tunggu 5 detik).
   Jika server GitHub lambat/mati atau internet putus, dipakai salinan terakhir yang tersimpan di browser.
   Data toko (Firestore/Auth/API) tidak pernah disentuh di sini. Naikkan VERSI setiap rilis. */
var VERSI = 'v1.0.0-beta-2';
var CACHE = 'oneilverse-' + VERSI;
var TUNGGU_MS = 5000;
var PRE = ['index.html', '404.html', 'kasir.html', 'manager.html', 'dashboard.html', 'partner.html', 'provider.html',
  'js/sw-register.js', 'js/dialog.js', 'js/pwa.js', 'js/update-check.js', 'js/auth.js', 'js/analisa.js', 'js/billing.js', 'js/chat.js', 'js/config.js', 'js/core.js', 'js/ctrl.js', 'js/gaji.js', 'js/insights.js',
  'js/labarugi.js', 'js/logo.js', 'js/mutasi-share.js', 'js/plans.js', 'js/rollout.js', 'js/skin.js', 'js/store.js', 'js/tenants.js', 'js/theme.js',
  'js/tower-cockpit.js', 'js/tower-menu.js', 'js/widgets.js', 'version.json'];
/* pustaka luar yang boleh disimpan (statis). Firestore, Auth, dan API lain sengaja tidak ada di sini. */
function pustakaLuar(u) {
  return u.hostname === 'cdn.tailwindcss.com' || u.hostname === 'unpkg.com' || u.hostname === 'cdnjs.cloudflare.com' ||
    u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com' ||
    (u.hostname === 'www.gstatic.com' && u.pathname.indexOf('/firebasejs/') === 0);
}

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (ch) {
    return Promise.all(PRE.map(function (p) {
      return fetch(p, { cache: 'reload' }).then(function (r) { if (r && r.ok) return ch.put(p, r); }).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('oneilverse-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function dariCache(req) {
  var u = new URL(req.url);
  return caches.match(req, { ignoreSearch: true }).then(function (r) {
    if (r) return r;
    if (req.mode !== 'navigate') return null;
    var p = u.pathname;
    var file = /\/[^\/]*\.[a-z0-9]+$/i.test(p);
    return caches.match(new Request(new URL(file ? p : (/\/$/.test(p) ? 'index.html' : '404.html'), new URL('./', self.registration.scope)).href), { ignoreSearch: true })
      .then(function (x) { return x || caches.match(new URL('index.html', self.registration.scope).href, { ignoreSearch: true }); });
  });
}

function jaringanDulu(req) {
  return new Promise(function (resolve) {
    var selesai = false;
    var timer = setTimeout(function () { dariCache(req).then(function (r) { if (r && !selesai) { selesai = true; resolve(r); } }); }, TUNGGU_MS);
    fetch(req).then(function (res) {
      clearTimeout(timer);
      if (res && res.ok && res.type === 'basic' && !res.redirected) { var c = res.clone(); caches.open(CACHE).then(function (ch) { ch.put(req, c); }); }
      if (!selesai) { selesai = true; resolve(res); }
    }).catch(function () {
      clearTimeout(timer);
      if (selesai) return;
      dariCache(req).then(function (r) { selesai = true; resolve(r || new Response('Tidak ada koneksi dan halaman belum tersimpan.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })); });
    });
  });
}

function simpanLalu(req) {
  return caches.open(CACHE).then(function (ch) {
    return ch.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) { if (res && (res.ok || res.type === 'opaque')) ch.put(req, res.clone()); return res; }).catch(function () { return hit; });
      return hit || net;
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var u;
  try { u = new URL(req.url); } catch (x) { return; }
  if (u.origin === self.location.origin) { e.respondWith(jaringanDulu(req)); return; }
  if (pustakaLuar(u)) e.respondWith(simpanLalu(req));
});
