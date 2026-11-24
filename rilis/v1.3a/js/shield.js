/* shield.js — PEMUAT Oneil Shield (bukan implementasinya langsung).
   Oneil Shield sekarang punya jalur rilis sendiri, terpisah dari versi aplikasi utama (BETA di theme.js),
   supaya toko paket Plus bisa dapat pembaruan Oneil Shield lebih dulu, sementara Basic tetap di versi
   yang sudah teruji sampai Tower menaikkannya. Satu toko tertentu juga bisa dikunci manual ke versi
   Shield manapun, terlepas dari paketnya (lihat Kendali Versi > Rollout Oneil Shield di Tower).

   Implementasi sungguhan Oneil Shield ada di file terpisah: js/shield/shield-<versi>.js
   (contoh: js/shield/shield-2.0.js). File ini HANYA memutuskan versi mana yang dipakai toko ini,
   lalu memuatnya di tempat yang sama persis supaya window.FM_SHIELD tetap siap sebelum skrip
   berikutnya (theme.js, struk-pdf.js, laporan-pdf.js) berjalan — sama seperti sebelumnya.

   Cara kerja baca versi: sama seperti js/rollout.js — baca dokumen publik Firestore
   app_meta/rollout_shield (tanpa login), dengan cadangan cache di perangkat supaya kunjungan
   berikutnya tetap cepat walau jaringan lambat/putus.

   PENTING kalau menambah versi Shield baru:
   1) Taruh file barunya di js/shield/shield-<versi>.js (jangan hapus versi lama yang masih
      mungkin dikunci toko manapun).
   2) Tambahkan angka versinya ke KNOWN_VERSIONS di bawah ini. Versi yang TIDAK ada di daftar ini
      tidak akan pernah dipakai (jaga-jaga supaya tidak ada toko yang dialihkan ke file yang belum/
      tidak ada — beda dengan masalah lama "Rollout Versi" yang pernah balik ke Prototype). */
(function () {
    'use strict';
    var p = (location.pathname.split('/').pop() || '').toLowerCase();
    var IS_CLIENT_PAGE = /kasir|manager|dashboard/.test(p);
    var IS_LOGIN_PAGE = /^index\.html?$|^$/.test(p);
    if (!IS_CLIENT_PAGE && !IS_LOGIN_PAGE) return; // hanya halaman klien + portal login

    var KNOWN_VERSIONS = ['2.0', '2.1', '3.0']; // <- tambahkan versi baru di sini begitu filenya dibuat
    var DEFAULT_VERSION = '2.0';

    function slug(v) { return String(v || '').replace(/^v/i, '').trim(); }
    function pick(v) { return (v && KNOWN_VERSIONS.indexOf(slug(v)) >= 0) ? slug(v) : DEFAULT_VERSION; }

    function load(ver) {
        document.write('<script src="js/shield/shield-' + ver + '.js?v=s' + ver.replace(/\./g, '') + 'r4"><' + '/script>');
    }

    if (IS_LOGIN_PAGE) { load(DEFAULT_VERSION); return; } // portal login belum terikat toko/paket tertentu

    if (typeof TENANTS_CONFIG === 'undefined' || typeof fmTokoParam !== 'function') { load(DEFAULT_VERSION); return; }

    var PROJECT_ID = 'finance-ai-master-byneilverse';
    var API_KEY = 'AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI'; // kunci web Firebase (bukan rahasia)
    var CACHE_KEY = 'fm_shield_cfg_v1';

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
                '/databases/(default)/documents/app_meta/rollout_shield?key=' + API_KEY;
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

    function targetFor(cfg) {
        try {
            var key = String(fmTokoParam() || '').toLowerCase().trim();
            var tn = TENANTS_CONFIG[key];
            if (tn && tn.shieldVersion) return tn.shieldVersion;
            var tier = (tn && tn.tier) || 'basic';
            /* DIPERBAIKI 18 Nov 2026: Tower menyimpan pilihan sebagai { default: '2.1' }, bukan per paket.
               Sebelumnya baris ini hanya mencari cfg[tier] dan cfg.basic, jadi pilihan Tower selalu terabaikan
               dan semua toko tetap memakai versi bawaan 2.0. */
            return (cfg && (cfg[tier] || cfg.default || cfg.basic)) || DEFAULT_VERSION;
        } catch (e) { return DEFAULT_VERSION; }
    }

    var cached = readCache();
    if (cached) {
        load(pick(targetFor(cached)));
        fetchCfg(true, function () {}); // segarkan di latar belakang untuk kunjungan berikutnya
    } else {
        fetchCfg(false, function (cfg) { load(pick(targetFor(cfg))); }); // pertama kali di perangkat ini: tunggu dulu sebelum lanjut
    }
})();
