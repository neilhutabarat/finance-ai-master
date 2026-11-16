/* rollout.js — rollout bertarget per toko/generasi Oneilverse.
   Tujuan: setiap toko punya "generasi" (Generasi 1 = Oneilverse, Generasi 2 = Oneilverse 2, dst, lihat
   tenant.generation — kosong/tidak diisi dianggap Generasi 1, supaya semua toko lama otomatis aman).
   Tiap generasi punya titik bekunya sendiri di Firestore (app_meta/rollout, field generations.<n>.pin):
   kalau diisi versi, toko generasi itu TERKUNCI ke folder /rilis/<versi>/ tersebut dan tidak ikut
   berubah walau kode di akar situs terus dikembangkan (misalnya saat Tower sedang membangun generasi
   berikutnya). Kalau dikosongkan, toko generasi itu mengikuti kode TERBARU di akar situs apa adanya.
   Tower juga bisa mengunci satu toko tertentu ke versi manapun lewat tenant.pinnedVersion (override,
   menang dari pengaturan generasi).

   Cara kerja: versi-versi lama disimpan sebagai salinan lengkap di folder /rilis/<versi>/.
   Skrip ini mengecek versi mana yang seharusnya dipakai toko ini (dari Firestore, dokumen publik
   app_meta/rollout, dibaca tanpa login seperti tenants_registry), lalu membandingkan dengan versi
   yang sedang berjalan di halaman ini. Jika beda, halaman dialihkan ke folder /rilis/<versi>/ yang sesuai.

   File ini SELALU dimuat dengan path absolut (/js/rollout.js) di semua halaman, termasuk salinan lama
   di dalam /rilis/, supaya toko yang terkunci ke versi lama tetap bisa "naik" saat Tower menaikkan
   titik beku generasinya — tanpa perlu menyalin ulang skrip ini ke setiap folder rilis lama. JANGAN
   pindahkan file ini ke dalam folder /rilis/ atau memuatnya dengan path relatif. */
(function () {
  'use strict';
  if (/provider|partner/.test(location.pathname)) return; // Tower & Mitra selalu memakai kode versi terbaru
  if (typeof TENANTS_CONFIG === 'undefined' || typeof fmTokoParam !== 'function') return; // tenants.js belum dimuat

  var PROJECT_ID = 'finance-ai-master-byneilverse';
  var API_KEY = 'AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI'; // kunci web Firebase (bukan rahasia)
  var CACHE_KEY = 'fm_rollout_cfg_v1';
  var SKIP_FLAG = 'fm_rollout_redirect_count';
  var MAX_REDIRECT = 3; // jaga-jaga agar tidak ada loop tak terduga

  function slug(v) { return String(v || '').trim().replace(/\s+/g, '-'); }

  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { return null; }
  }
  function writeCache(cfg) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cfg)); } catch (e) {}
  }

  function parseDoc(xhr) {
    try {
      var f = JSON.parse(xhr.responseText).fields || {};
      if (f.json && f.json.stringValue) return JSON.parse(f.json.stringValue);
    } catch (e) {}
    return null;
  }

  function fetchCfg(isAsync, done) {
    try {
      var url = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID +
        '/databases/(default)/documents/app_meta/rollout?key=' + API_KEY;
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, isAsync);
      var handle = function () {
        var c = xhr.status === 200 ? parseDoc(xhr) : null;
        if (c) writeCache(c);
        done(c || readCache());
      };
      if (isAsync) { xhr.onload = handle; xhr.onerror = function () { done(readCache()); }; }
      xhr.send();
      if (!isAsync) handle();
    } catch (e) { done(readCache()); }
  }

  /* Toko yang sudah berada di versi targetnya tidak perlu diberi tahu "versi baru" hanya karena akar situs
     sudah lebih baru: kenaikan versi toko diatur lewat Tower (Rollout Versi / kunci per toko). */
  function pinUpdateCheck() {
    try {
      if (window.__fmPinFetch || !window.fetch) return; window.__fmPinFetch = true;
      var of = window.fetch, cur = (window.FM_RELEASES && FM_RELEASES.beta) || '';
      if (!cur) return;
      window.fetch = function (u) {
        var url = String((u && u.url) || u || '');
        if (/(^|\/)version\.json(\?|$)/.test(url)) return Promise.resolve(new Response(JSON.stringify({ versi: cur }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        return of.apply(this, arguments);
      };
    } catch (e) {}
  }

  // Jaga-jaga: kalau dokumen app_meta/rollout belum diisi bentuk generations (belum sempat disimpan Tower)
  // atau Firestore tak terjangkau, Generasi 1 tetap aman terkunci ke titik ini, TIDAK ikut kode akar.
  var FALLBACK_GEN1_PIN = 'v1.0.25';

  function decide(cfg) {
    try {
      var key = String(fmTokoParam() || 'id26110901').toLowerCase().trim();
      var tn = TENANTS_CONFIG[key];
      var gen = String((tn && tn.generation) || '1');
      var target = tn && tn.pinnedVersion ? slug(tn.pinnedVersion) : '';
      if (!target) {
        var gc = cfg && cfg.generations && cfg.generations[gen];
        if (gc && gc.pin) target = slug(gc.pin);
        else if (!cfg || !cfg.generations) { if (gen === '1') target = slug(FALLBACK_GEN1_PIN); }
        // kalau titik beku generasi ini memang sengaja dikosongkan Tower, toko ikut kode terbaru di akar
      }
      var running = slug((window.FM_RELEASES && FM_RELEASES.beta) || '');
      if (target && running && target === running) { pinUpdateCheck(); return; }
      if (!target || !running) return;

      var n = 0; try { n = parseInt(sessionStorage.getItem(SKIP_FLAG) || '0', 10) || 0; } catch (e) {}
      if (n >= MAX_REDIRECT) return; // sudah dialihkan beberapa kali di sesi ini, jangan paksa lagi (hindari loop)

      var page = (location.pathname.split('/').pop() || 'index.html');
      var inRilis = /^\/rilis\/[^\/]+\//.test(location.pathname);
      function go(url) {
        try { sessionStorage.setItem(SKIP_FLAG, String(n + 1)); } catch (e) {}
        location.replace(url + location.search);
      }
      // Folder /rilis/<versi>/ hanya ada untuk versi lama yang dibekukan. Versi terbaru ada di akar (tanpa folder).
      // Jadi: cek dulu folder tujuan benar-benar ada; kalau tidak ada, jangan dialihkan ke alamat yang kosong.
      var x = new XMLHttpRequest();
      x.open('GET', '/rilis/' + target + '/version.json?c=' + Date.now(), true);
      x.onload = function () {
        if (x.status === 200) go('/rilis/' + target + '/' + page);
        else if (inRilis) go('/' + page); // tujuan = versi terbaru di akar
      };
      x.onerror = function () {};
      x.send();
    } catch (e) {}
  }

  var cached = readCache();
  if (cached) {
    decide(cached);
    fetchCfg(true, function () {}); // segarkan di latar belakang untuk pengecekan berikutnya
  } else {
    fetchCfg(false, decide); // pertama kali di perangkat ini: tunggu dulu sebelum lanjut
  }
})();
