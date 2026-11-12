/* theme.js — tampilan bersama: font bergaya iPhone, gerakan halus, mode Terang / Gelap Pekat, warna pilihan pengguna,
   menu Pengaturan (tema, warna, logo usaha, versi, catatan rilis). Dipakai Tower, kasir, manager, owner.
   Preferensi tersimpan di perangkat ini, terpisah per toko dan per peran. */
(function () {
  var APP_VERSION = '1.0.0';
  var BETA = 'BETA 6.1';
  /* Catatan rilis HANYA untuk aplikasi yang dipakai klien (kasir, manager, owner, partner, login).
     Perbaikan dapur (Tower, master APK, pembukuan pribadi) tidak ditulis di sini.
     Setiap rilis wajib memuat [Perbaikan] dan [Keamanan]. Terbaru di atas. */
  var RELEASE_NOTES = [
    ['1.0.0 (BETA 6.1)', '13 Nov 2026', [
      '[Perbaikan] Atur Target Omzet kini lewat pop-up: Owner mengetuk kartu Target Omzet, mengisi target harian dan bulanan, lalu menyimpan. Kartu jadi lebih ringkas dan muat satu layar',
      '[Perbaikan] Menu Stok kini selalu menampilkan harga modal dan harga jual tiap barang, lengkap dengan pilihan "Jual" per barang untuk ditampilkan di kasir, tanpa perlu membuka pengaturan tambahan',
      '[Keamanan] Perubahan harga jual dan status jual di kasir tercatat di riwayat audit'
    ]],
    ['1.0.0 (BETA 6.0)', '13 Nov 2026', [
      '[Fitur] Banyak Usaha dalam satu toko: akun COA dan kelompok stok bisa diberi label usaha (mis. Jahit, Karung, Kelontong). Laporan Laba Rugi bisa disaring per usaha, termasuk unduhan PDF dan CSV, dan ada ringkasan perbandingan antar usaha. Fitur ini aktif sesuai kebutuhan usaha; toko satu usaha tidak melihat perubahan',
      '[Perbaikan] Transaksi lama tanpa label usaha tetap terbaca sebagai Umum, sehingga angka laporan gabungan tidak berubah',
      '[Keamanan] Perubahan label usaha pada akun dan stok tercatat di riwayat audit'
    ]],
    ['1.0.0 (BETA 5.9)', '13 Nov 2026', [
      '[Fitur] Usaha dagang kini bisa menjual barang dari stok langsung di kasir: stok berkurang otomatis tiap penjualan. Manager menentukan kelompok stok mana yang dijual lewat sakelar "Dijual di kasir" dan mengisi harga jual; kelompok bahan (mis. kain) tetap tidak tampil di kasir. Fitur ini aktif sesuai kebutuhan usaha',
      '[Fitur] Kartu Laba & Margin kini menampilkan penjualan produk dan penjualan non-produk (jasa dan akun pendapatan) secara terpisah, tidak lagi kosong bila belum ada penjualan produk',
      '[Perbaikan] Pengaturan "dijual di kasir" dan harga jual tetap tersimpan saat stok masuk dan closing mingguan',
      '[Keamanan] Perubahan sakelar dan harga jual tercatat di riwayat audit'
    ]],
    ['1.0.0 (BETA 5.8)', '13 Nov 2026', [
      '[Perbaikan] Halaman owner dan manager kini otomatis memadatkan kartu dan tombol mengikuti tinggi layar, sehingga seluruh fitur muat dalam satu layar tanpa digulir. Semua keterangan di kartu dan tombol tetap ada',
      '[Keamanan] Tidak ada perubahan data atau akses; pembaruan hanya pada tampilan'
    ]],
    ['1.0.0 (BETA 5.7)', '13 Nov 2026', [
      '[Perbaikan] Halaman owner dan manager tidak lagi bertumpuk saat seluruh fitur aktif: kartu ringkasan, tabel, dan tombol aksi kini tersusun rapi dan halaman bisa digulir ke bawah',
      '[Keamanan] Tidak ada perubahan data atau akses; pembaruan hanya pada tampilan'
    ]],
    ['1.0.0 (BETA 5.6)', '13 Nov 2026', [
      '[Perbaikan] Tata letak bagian atas dirapikan: logo di tengah tidak lagi menimpa jam, cuaca, dan kurs saat widget tersebut aktif. Di layar kecil logo tampil di baris sendiri',
      '[Keamanan] Tidak ada perubahan data atau akses; pembaruan hanya pada tampilan'
    ]],
    ['1.0.0 (BETA 5.5)', '13 Nov 2026', [
      '[Tampilan] Latar belakang kini punya versi layar lebar sendiri, sehingga gambar tampil utuh di komputer dan tablet mendatar, tidak terpotong lagi. Layar HP tetap memakai versi tegak',
      '[Perbaikan] Pilihan latar belakang dan warna halaman selalu tersedia di Pengaturan, tidak hilang saat paket toko diubah',
      '[Keamanan] Pengecekan ulang aturan akses dan izin tiap peran; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 5.4)', '13 Nov 2026', [
      '[Tampilan] Latar belakang baru bergaya komik: Perbukitan Pagi, Pantai Senja, Kota Malam, Sawah Berundak, dan Gunung & Danau. Perbukitan Pagi menjadi latar bawaan',
      '[Perbaikan] Pilihan latar belakang dan warna halaman kini selalu tersedia di Pengaturan, tidak hilang lagi saat paket toko diubah',
      '[Keamanan] Pengecekan ulang aturan akses dan izin tiap peran; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 5.3)', '13 Nov 2026', [
      '[Perbaikan] Kirim struk lewat WhatsApp diperbaiki: sebelumnya WhatsApp bisa tidak terbuka karena diblokir browser. Kini nomor pelanggan diisi di kotak khusus, nomor terakhir diingat, dan WhatsApp langsung terbuka',
      '[Keamanan] Pengecekan ulang aturan akses dan izin tiap peran; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 5.2)', '13 Nov 2026', [
      '[Tampilan] Logo Oneilverse dan tulisan oneilverse kini berada di tengah bagian atas, sejajar dengan baris nama toko. Foto dan inisial toko dihilangkan; di bawah nama toko tampil alamat toko yang terdaftar',
      '[Perbaikan] Pengaturan unggah foto/logo toko dihapus dari akun Owner dan Manager agar tampilan seragam',
      '[Keamanan] Pengecekan ulang aturan akses dan izin tiap peran; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 5.0)', '13 Nov 2026', [
      '[Tampilan] Logo Oneilverse baru di halaman masuk dan di tengah bagian atas semua halaman, lengkap dengan ikon aplikasi. Toko berpaket Plus ditandai tanda "+" miring di ujung tulisan oneilverse',
      '[Perbaikan] Tampilan paket toko di bagian atas halaman kini ikut berubah otomatis saat paket diganti, tanpa perlu muat ulang',
      '[Keamanan] Pengecekan ulang aturan akses dan izin tiap peran; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 4.1)', '13 Nov 2026', [
      '[Fitur] Tampilan halaman kini lebih fleksibel per toko: jam, cuaca, kurs dan emas, kartu estimasi biaya layanan, chat, dan pilihan latar belakang dapat disesuaikan untuk Admin, Manager, dan Owner sesuai kebutuhan usaha',
      '[Perbaikan] Fitur yang tidak dipakai toko kini hilang sepenuhnya dari tampilan, tidak sekadar disembunyikan sebagian',
      '[Keamanan] Pengecekan ulang aturan akses dan izin tiap peran; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 4.0)', '12 Nov 2026', [
      '[Perbaikan] Versi stabil: seluruh menu Admin, Manager, dan Owner diperiksa ulang dan dirapikan',
      '[Keamanan] Pengecekan ulang aturan akses, sesi login, dan izin tiap peran; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 3.0)', '12 Nov 2026', [
      '[Fitur] Pilihan Latar Belakang di Pengaturan: Hujan Gerimis, Senja Orbit, dan Malam Rasi N (gambar orisinal Oneilverse)',
      '[Fitur] Unduh PDF di laman Owner menggantikan Ekspor CSV: laporan berkop dengan ringkasan dan rincian transaksi, pilihan periode hari ini sampai kustom; CSV untuk Excel tetap tersedia di jendela yang sama',
      '[Perbaikan] Tulisan tombol konfirmasi di Kasir dirapikan (tidak lagi menyebut potong stok)',
      '[Keamanan] Pengecekan ulang aturan akses dan sesi login; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 2.9)', '12 Nov 2026', [
      '[Fitur] Izin Stok kini bisa diatur per peran: lihat stok, input stok, dan closing stok. Peran yang hanya boleh melihat tidak melihat form input dan tombol closing',
      '[Perbaikan] Susunan fitur toko bisa disimpan sebagai paket dan dipakai ulang',
      '[Keamanan] Pengecekan ulang aturan akses dan sesi login; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 2.8)', '12 Nov 2026', [
      '[Perbaikan] Daftar Fitur Toko disesuaikan dengan fitur yang benar-benar ada (Stok dan Closing Stok ditambahkan; barcode dan label produk yang sudah tidak ada dihapus)',
      '[Perbaikan] Tombol Fitur Toko dipindah ke tepi agar menu yang sering dipakai lebih mudah dijangkau',
      '[Keamanan] Pengecekan ulang aturan akses dan sesi login; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 2.7)', '12 Nov 2026', [
      '[Perbaikan] Sisa stok mingguan kini bisa diisi langsung di daftar Stok (kolom "sisa"), lalu lanjut ke Closing; tab Closing diberi nama Sisa Stok & Closing',
      '[Keamanan] Pengecekan ulang aturan akses dan sesi login; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 2.6)', '12 Nov 2026', [
      '[Perbaikan] Menu Stok & Closing dirapikan: tiap jenis menampilkan harga beli dan nilainya; harga beli bisa diperbarui saat stok masuk; tidak ada tombol ganda di dock',
      '[Keamanan] Pengecekan ulang aturan akses dan sesi login; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 2.5)', '12 Nov 2026', [
      '[Perbaikan] Tombol Closing di dock Manager kembali berfungsi (Rekap Closing Kasir bisa dibuka lagi)',
      '[Fitur] Menu Stok & Closing: tiap jenis menampilkan harga beli dan nilainya; harga beli bisa diperbarui saat stok masuk; layar closing menampilkan Barang tersedia untuk dijual sebelum HPP',
      '[Keamanan] Pengecekan ulang aturan akses dan sesi login; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 2.4)', '12 Nov 2026', [
      '[Fitur] Closing Mingguan di menu Stok (Manager dan Owner): isi sisa stok, sisa jadi stok awal minggu berikutnya, HPP dihitung otomatis (stok awal + pembelian - sisa stok) dan masuk ke Laporan Laba Rugi',
      '[Perbaikan] Form jenis stok: harga beli (bukan harga jual), kolom Stok akhir, dan angka Rupiah otomatis bertitik ribuan agar tidak salah input',
      '[Perbaikan] Urutan akun di Kelola Akun kini cukup klik dan seret; bagian Produk yang dobel dengan Stok dihapus, dan Kasir tidak lagi menjual produk stok',
      '[Keamanan] Pengecekan ulang aturan akses dan sesi login; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 2.3)', '12 Nov 2026', [
      '[Fitur] Form Stok di Manager dan Owner kini berbentuk Induk dan Jenis seperti COA: input semua jenis stok sekali di awal (mis. induk Kain, jenis Katun, Satin), lalu saat stok masuk tinggal pilih induk dan jenisnya',
      '[Perbaikan] Data jenis stok (induk, jenis, satuan) kini tersimpan permanen dan tidak hilang saat produk diedit',
      '[Keamanan] Pengecekan ulang aturan akses dan sesi login; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 2.2)', '12 Nov 2026', [
      '[Perbaikan] Daftar Mutasi kini berurutan sesuai transaksi yang diinput lebih dulu (dari lama ke baru), saldo berjalan mengikuti urutan itu',
      '[Fitur] Struk bisa disimpan sebagai PDF kecil (ukuran kertas struk) lewat tombol Simpan PDF; di HP bisa langsung dikirim ke WhatsApp atau disimpan ke galeri/berkas',
      '[Fitur] Manager dan Owner punya form Tambah Stok: tambah stok barang masuk atau koreksi jumlah stok, tercatat di audit',
      '[Keamanan] Pengecekan ulang aturan akses dan sesi login; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 2.1)', '12 Nov 2026', [
      '[Perbaikan] Struk dan total antrean kini benar: penjualan menambah, pengeluaran (mis. transportasi) mengurangi; total ditulis "Total Bersih" bila ada pengeluaran',
      '[Perbaikan] Istilah di struk disamakan (Petugas); struk WhatsApp ikut memakai nilai yang benar',
      '[Keamanan] Pengecekan ulang aturan akses dan sesi login; tidak ditemukan celah baru'
    ]],
    ['1.0.0 (BETA 2)', '12 Nov 2026', [
      '[Tampilan] Latar ilustrasi hujan gerimis; kartu, menu bawah, dan pop-up tembus pandang tetapi tulisan tetap jelas, dengan mode terang sebagai tampilan awal',
      '[Tampilan] Tombol Tema ada di menu bawah: sekali tekan langsung berganti terang atau gelap',
      '[Perbaikan] Halaman memakai seluruh tinggi layar tanpa gulir yang tidak perlu; kotak konfirmasi dan pemberitahuan tampil di tengah layar dengan desain rapi',
      '[Perbaikan] Pemberitahuan versi baru muncul jelas lalu hilang sendiri; aplikasi bisa dipasang ke Chrome dari tombol Pasang aplikasi',
      '[Keamanan] Pengecekan ulang aturan akses database dan sesi login; tidak ditemukan celah baru'
    ]]
  ];
  var SHOW_LAST = 10;
  window.FM_RELEASES = { all: RELEASE_NOTES, last: function (n) { return RELEASE_NOTES.slice(0, n || SHOW_LAST); }, beta: BETA, version: APP_VERSION };
  window.fmEsc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var ACCENTS = ['#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#e11d48', '#ea580c', '#ca8a04', '#059669', '#0d9488', '#475569'];

  var script = document.currentScript;
  var LITE = !!(script && script.hasAttribute('data-lite'));
  var path = (location.pathname || '').toLowerCase();
  var ROLE = path.indexOf('kasir') >= 0 ? 'kasir' : path.indexOf('manager') >= 0 ? 'manager' : path.indexOf('dashboard') >= 0 ? 'owner' : path.indexOf('provider') >= 0 ? 'tower' : path.indexOf('partner') >= 0 ? 'partner' : (path.indexOf('index') >= 0 || /\/$/.test(path)) ? 'login' : 'lain';
  var NATIVE = (ROLE === 'kasir' || ROLE === 'login') ? 'light' : 'dark';
  var DEFAULT_MODE = (ROLE === 'tower') ? NATIVE : 'light';   // tampilan bawaan: terang untuk semua toko; Tower tetap gelap
  var TOKO = ''; try { TOKO = (new URLSearchParams(location.search).get('toko') || '').toLowerCase().trim(); } catch (e) {}
  var KEY = 'fm_theme2_' + (TOKO || 'master') + '_' + ROLE;

  function loadPref() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function savePref(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  var pref = loadPref();

  var CSS = [
    'html,body,button,input,select,textarea{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display",Inter,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif!important}',
    '.font-mono{font-family:ui-monospace,"SF Mono",Menlo,"JetBrains Mono",Consolas,monospace!important}',
    'html{-webkit-text-size-adjust:100%}',
    '@media(max-width:640px){input,select,textarea{font-size:16px!important}button,select,input:not([type=checkbox]):not([type=radio]):not([type=color]){min-height:40px}body{padding-bottom:env(safe-area-inset-bottom)}table{font-size:12px}}',
    'body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;letter-spacing:-.011em}',
    // gerakan halus
    'button,[onclick],a,select,input,.ios-glass,.white-ice-glass-card{transition:transform .18s cubic-bezier(.2,.8,.2,1),background-color .22s ease,border-color .22s ease,box-shadow .22s ease,opacity .22s ease,color .22s ease}',
    'button:active,[role=button]:active{transform:scale(.97)}',
    '@keyframes fmFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
    '@keyframes fmSheet{from{opacity:0;transform:translateY(24px) scale(.98)}to{opacity:1;transform:none}}',
    '@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}',
    // keterbacaan: teks sangat kecil dinaikkan sedikit
    '.text-\\[9px\\]{font-size:10.5px!important}.text-\\[10px\\]{font-size:11.5px!important}.text-\\[11px\\]{font-size:12px!important}',
    // gelap pekat (halaman bawaan gelap)
    'html[data-fm-black="1"] body{background:#000!important;background-image:none!important;color:#f5f5f7}',
    'html[data-fm-black="1"] .ios-glass{background:rgba(10,10,12,.97)!important;border-color:rgba(255,255,255,.1)!important;box-shadow:0 1px 0 rgba(255,255,255,.05) inset!important}',
    'html[data-fm-black="1"] .glass-capsule,html[data-fm-black="1"] .glass-capsule-dark{background:#000!important;border-color:rgba(255,255,255,.14)!important}',
    'html[data-fm-black="1"] .bg-slate-900,html[data-fm-black="1"] .bg-slate-950{background-color:#050507!important}',
    'html[data-fm-black="1"] .text-slate-500{color:#aab2c5!important}html[data-fm-black="1"] .text-slate-400{color:#b6bece!important}html[data-fm-black="1"] .text-slate-600{color:#7f8799!important}',
    // mode kebalikan (terang pada halaman gelap / gelap pada halaman terang)
    'html[data-fm-invert="1"]{filter:invert(1) hue-rotate(180deg);background:#fff}',
    'html[data-fm-invert="1"] body{background-color:#fff!important;background-image:none!important}',
    'html[data-fm-invert="1"] img,html[data-fm-invert="1"] video,html[data-fm-invert="1"] canvas,html[data-fm-invert="1"] .oneui-hero,html[data-fm-invert="1"] header.bg-gradient-to-r,html[data-fm-invert="1"] .fm-keep{filter:invert(1) hue-rotate(180deg)}',
    '@media print{html[data-fm-invert="1"]{filter:none!important;background:#fff!important}html[data-fm-invert="1"] img,html[data-fm-invert="1"] .oneui-hero,html[data-fm-invert="1"] header.bg-gradient-to-r{filter:none!important}}',
    // warna pilihan pengguna
    'html[data-fm-accent] .oneui-hero{background:linear-gradient(160deg,#0b0e13 0%,color-mix(in srgb,var(--fm-accent) 30%,#0b0e13) 100%)!important}',
    'html[data-fm-accent] header.bg-gradient-to-r{background:linear-gradient(90deg,#000 0%,color-mix(in srgb,var(--fm-accent) 45%,#000) 55%,#000 100%)!important}',
    'html[data-fm-accent]:not([data-fm-black]):not([data-fm-invert]) body{background-image:radial-gradient(at 8% 8%,color-mix(in srgb,var(--fm-accent) 9%,transparent) 0,transparent 45%),radial-gradient(at 92% 92%,color-mix(in srgb,var(--fm-accent) 6%,transparent) 0,transparent 50%)!important}',
    'html[data-fm-accent] input:focus,html[data-fm-accent] select:focus,html[data-fm-accent] textarea:focus{border-color:var(--fm-accent)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--fm-accent) 25%,transparent)!important}',
    'html[data-fm-accent] ::selection{background:var(--fm-accent);color:#fff}',
    // tombol & panel pengaturan
    '#fm-gear{position:fixed;left:14px;bottom:14px;z-index:2147480000;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(18,18,22,.92);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.45);}',
    '#fm-gear:hover{transform:rotate(30deg)}',
    '#fm-set{display:none;position:fixed;inset:0;z-index:2147481000;background:rgba(0,0,0,.66);align-items:flex-end;justify-content:center}',
    '@media(min-width:640px){#fm-set{align-items:center}}',
    '#fm-set .fm-sheet{width:100%;max-width:460px;max-height:90vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:26px 26px 0 0;padding:20px 18px 26px;animation:fmSheet .3s cubic-bezier(.16,1,.3,1)}',
    '@media(min-width:640px){#fm-set .fm-sheet{border-radius:26px}}',
    '#fm-set h3{font-size:18px;font-weight:800;margin:0}',
    '#fm-set .fm-sec{margin-top:18px}#fm-set .fm-lab{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#aab2c5;margin-bottom:8px}',
    '#fm-set .fm-card{background:#15151b;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:12px 14px}',
    '#fm-set .fm-modes{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
    '#fm-set .fm-mode{border:2px solid rgba(255,255,255,.1);border-radius:16px;padding:12px;cursor:pointer;background:#15151b;text-align:left;color:#f5f5f7;font-weight:700;font-size:13px}',
    '#fm-set .fm-mode.on{border-color:var(--fm-pick,#2563eb);box-shadow:0 0 0 3px color-mix(in srgb,var(--fm-pick,#2563eb) 28%,transparent)}',
    '#fm-set .fm-prev{height:46px;border-radius:10px;margin-bottom:8px;border:1px solid rgba(255,255,255,.12)}',
    '#fm-set .fm-sw{display:flex;flex-wrap:wrap;gap:10px;align-items:center}',
    '#fm-set .fm-dot{width:34px;height:34px;border-radius:50%;border:3px solid transparent;cursor:pointer;outline:1px solid rgba(255,255,255,.2)}',
    '#fm-set .fm-dot.on{border-color:#fff}',
    '#fm-set .fm-btn{border:0;border-radius:12px;padding:10px 14px;font-weight:800;font-size:12px;cursor:pointer;background:#2a2a33;color:#fff}',
    '#fm-set .fm-btn.pri{background:color-mix(in srgb,var(--fm-pick,#2563eb) 84%,#000);color:var(--fm-on,#fff)}',
    '#fm-set details{background:#15151b;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px 14px;margin-bottom:8px}',
    '#fm-set summary{cursor:pointer;font-weight:700;font-size:13px}',
    '#fm-set .fm-tag{display:inline-block;font-style:normal;font-size:9.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;padding:1px 7px;border-radius:99px;margin-right:7px;vertical-align:1px;background:rgba(255,255,255,.12);color:#e5e7eb}#fm-set .fm-tag-keamanan{background:rgba(251,191,36,.2);color:#fcd34d}#fm-set .fm-tag-perbaikan{background:rgba(52,211,153,.2);color:#6ee7b7}#fm-set .fm-tag-fitur{background:rgba(96,165,250,.22);color:#93c5fd}#fm-set .fm-tag-tampilan{background:rgba(192,132,252,.22);color:#d8b4fe}',
    '#fm-set ul{margin:8px 0 0;padding-left:18px;font-size:12px;line-height:1.7;color:#c7cbd6}'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.id = 'fm-theme-css';
  styleEl.textContent = CSS;
  (document.head || document.documentElement).appendChild(styleEl);

  /* warna teks di atas warna aksen: putih atau hampir-hitam, mana yang kontrasnya lebih tinggi */
  function onColor(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '')); if (!m) return '#fff';
    var v = [0, 2, 4].map(function (i) { var c = parseInt(m[1].substr(i, 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    var L = 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.0543) ? '#fff' : '#0b0d12';
  }
  /* Latar belakang bawaan (gambar buatan sendiri, bergaya Oneilverse). Tambahan baru hanya saat versi besar. */
  var WALLPAPERS = [
    { id: 'bukit', name: 'Perbukitan Pagi', file: 'img/wp-bukit.svg' },
    { id: 'pantai', name: 'Pantai Senja', file: 'img/wp-pantai.svg' },
    { id: 'kota', name: 'Kota Malam', file: 'img/wp-kota.svg' },
    { id: 'sawah', name: 'Sawah Berundak', file: 'img/wp-sawah.svg' },
    { id: 'gunung', name: 'Gunung & Danau', file: 'img/wp-gunung.svg' }
  ];
  function wpOf(id) { return WALLPAPERS.filter(function (w) { return w.id === id; })[0] || WALLPAPERS[0]; }
  /* Latar gambar: layar lebar (desktop/tablet mendatar) memakai versi mendatar (-l), layar tegak (HP) memakai versi tegak */
  function wpFile(w) { var land = (window.innerWidth || 0) > (window.innerHeight || 0); return land ? w.file.replace('.svg', '-l.svg') : w.file; }
  function updateWp() {
    try { document.documentElement.style.setProperty('--fm-wp', 'url("' + wpFile(wpOf(pref.wp)) + '")'); } catch (e) {}
  }
  var wpTimer = null;
  window.addEventListener('resize', function () { clearTimeout(wpTimer); wpTimer = setTimeout(updateWp, 200); });
  function apply() {
    var h = document.documentElement;
    updateWp();
    var mode = pref.mode || DEFAULT_MODE;     // 'light' | 'dark'
    h.setAttribute('data-fm-native', NATIVE);
    ['data-fm-black', 'data-fm-invert', 'data-fm-accent'].forEach(function (a) { h.removeAttribute(a); });
    if (!LITE && ROLE !== 'lain') {
      if (mode !== NATIVE) h.setAttribute('data-fm-invert', '1');
      else if (mode === 'dark') h.setAttribute('data-fm-black', '1');
      if (pref.accent) { h.setAttribute('data-fm-accent', '1'); h.style.setProperty('--fm-accent', pref.accent); }
      else h.style.removeProperty('--fm-accent');
      h.style.setProperty('--fm-on', onColor(pref.accent || '#3d63dd'));
    }
  }
  apply();
  if (LITE || ROLE === 'lain') return;
  if (ROLE === 'login' || ROLE === 'partner') { /* tema & gerigi tersedia; logo/pengaturan toko tidak */ }

  // ---------- menu Pengaturan ----------
  var TENANT_ID = (TOKO && TOKO !== 'oneilverse') ? TOKO.toUpperCase() : 'ID26110901';
  var CAN_LOGO = false; /* foto/logo toko dihapus: logo Oneilverse dipakai di semua toko */
  var logoData = null;

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function build() {
    var gear = document.createElement('button');
    gear.id = 'fm-gear'; gear.type = 'button'; gear.setAttribute('aria-label', 'Pengaturan');
    gear.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
    document.body.appendChild(gear);
    var set = document.createElement('div');
    set.id = 'fm-set';
    set.innerHTML = '<div class="fm-sheet"></div>';
    document.body.appendChild(set);
    gear.onclick = function () { render(); set.style.display = 'flex'; };
    set.addEventListener('click', function (e) { if (e.target === set) set.style.display = 'none'; });
  }

  function render() {
    var box = document.querySelector('#fm-set .fm-sheet');
    var mode = pref.mode || DEFAULT_MODE;
    var pick = pref.accent || '#2563eb';
    box.style.setProperty('--fm-pick', pick);
    var h = '<div style="display:flex;justify-content:space-between;align-items:center"><h3>Pengaturan</h3><button class="fm-btn" data-close>Tutup</button></div>';
    var THEME_ON = !(window.FM_PLANS && !FM_PLANS.has('theme'));
    if (!document.documentElement.hasAttribute('data-fm-dock')) h += '<div class="fm-sec"><div class="fm-lab">Tema</div><div class="fm-modes">' +
      '<button class="fm-mode ' + (mode === 'light' ? 'on' : '') + '" data-mode="light"><div class="fm-prev" style="background:linear-gradient(135deg,#ffffff,#e2e8f0)"></div>Terang</button>' +
      '<button class="fm-mode ' + (mode === 'dark' ? 'on' : '') + '" data-mode="dark"><div class="fm-prev" style="background:#000"></div>Gelap Pekat</button></div></div>';
    if (ROLE !== 'lain' && ROLE !== 'login' && ROLE !== 'tower' && ROLE !== 'provider' && !(window.FM_PLANS && !FM_PLANS.has('wallpaper'))) h += '<div class="fm-sec"><div class="fm-lab">Latar Belakang</div><div class="fm-modes" style="grid-template-columns:1fr 1fr 1fr">' +
      WALLPAPERS.map(function (w) { return '<button class="fm-mode ' + (wpOf(pref.wp).id === w.id ? 'on' : '') + '" data-wp="' + w.id + '" style="padding:8px"><div class="fm-prev" style="height:54px;background:url(' + w.file + ') center/cover"></div><span style="font-size:11.5px">' + w.name + '</span></button>'; }).join('') + '</div></div>';
    if (false) h += '<div class="fm-sec"><div class="fm-lab">Atur Warna Halaman</div><div class="fm-card"><div class="fm-sw">' +
      ACCENTS.map(function (c) { return '<span class="fm-dot ' + (pref.accent === c ? 'on' : '') + '" data-acc="' + c + '" style="background:' + c + '"></span>'; }).join('') +
      '</div><div style="display:flex;gap:10px;align-items:center;margin-top:12px"><label style="font-size:12px;color:#c7cbd6">Warna bebas</label><input type="color" id="fm-acc-custom" value="' + esc(pick) + '" style="width:44px;height:30px;border:0;background:none;padding:0"><button class="fm-btn" data-accreset style="margin-left:auto">Kembali ke Bawaan</button></div></div></div>';
    if (CAN_LOGO && THEME_ON) {
      h += '<div class="fm-sec"><div class="fm-lab">Logo Usaha</div><div class="fm-card">' +
        '<div style="display:flex;gap:12px;align-items:center"><div id="fm-logo-prev" style="width:64px;height:64px;border-radius:16px;background:#22222b;display:flex;align-items:center;justify-content:center;overflow:hidden;font-weight:800;color:#aab2c5;font-size:12px">' + (logoData ? '<img src="' + esc(logoData) + '" style="width:100%;height:100%;object-fit:contain">' : 'Inisial') + '</div>' +
        '<div style="flex:1;font-size:12px;line-height:1.55;color:#c7cbd6">Unggah logo (JPG, PNG, atau WebP). <b style="color:#fff">Ukuran logo dibatasi maksimal 100 KB.</b> Gambar yang lebih besar akan diperkecil otomatis; disarankan bentuk persegi. Jika tidak ada logo, tampil inisial nama usaha.</div></div>' +
        '<div style="display:flex;gap:8px;margin-top:10px"><label class="fm-btn pri" style="cursor:pointer">Pilih Gambar<input type="file" id="fm-logo-file" accept="image/*" style="display:none"></label>' + (logoData ? '<button class="fm-btn" data-logodel>Hapus Logo</button>' : '') + '</div>' +
        '<p id="fm-logo-msg" style="font-size:12px;margin:8px 0 0;color:#fca5a5"></p></div></div>';
    }
    if (window.FM_PLANS) h += '<div class="fm-sec"><button class="fm-btn pri" data-plans style="width:100%;padding:13px">✨ Fitur Toko</button></div>';
    if (false) h += '<div class="fm-sec"><button class="fm-btn" data-logout style="width:100%;padding:13px;color:#fda4af">Keluar dari Akun</button></div>';
    h += '<div class="fm-sec"><div class="fm-lab">Versi Aplikasi</div><div class="fm-card" style="display:flex;justify-content:space-between;font-size:13px"><span>Oneilverse POS</span><b>v' + APP_VERSION + ' · ' + BETA + '</b></div></div>';
    h += '<div class="fm-sec"><div class="fm-lab">Catatan Rilis</div>' + RELEASE_NOTES.slice(0, SHOW_LAST).map(function (n, i) {
      return '<details ' + (i === 0 ? 'open' : '') + '><summary>v' + n[0] + ' · ' + n[1] + '</summary><ul>' + n[2].map(function (t) { var m = /^\[(\w+)\]\s*/.exec(t); var tag = m ? m[1] : ''; return '<li>' + (tag ? '<i class="fm-tag fm-tag-' + tag.toLowerCase() + '">' + esc(tag) + '</i>' : '') + esc(t.replace(/^\[\w+\]\s*/, '')) + '</li>'; }).join('') + '</ul></details>';
    }).join('') + '</div>';
    box.innerHTML = h;

    var lo = box.querySelector('[data-logout]'); if (lo) lo.onclick = function () { document.getElementById('fm-set').style.display = 'none'; window.FM_LOGOUT(); };
    var pb = box.querySelector('[data-plans]'); if (pb) pb.onclick = function () { document.getElementById('fm-set').style.display = 'none'; if (window.FM_PLANS) FM_PLANS.openModal(); };
    box.querySelector('[data-close]').onclick = function () { document.getElementById('fm-set').style.display = 'none'; };
    box.querySelectorAll('[data-mode]').forEach(function (b) { b.onclick = function () { pref.mode = b.getAttribute('data-mode'); savePref(pref); apply(); render(); }; });
    box.querySelectorAll('[data-wp]').forEach(function (b) { b.onclick = function () { pref.wp = b.getAttribute('data-wp'); savePref(pref); apply(); render(); }; });
    box.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function () { pref.accent = b.getAttribute('data-acc'); savePref(pref); apply(); render(); }; });
    var ac = box.querySelector('#fm-acc-custom');
    if (ac) { ac.oninput = function (e) { pref.accent = e.target.value; savePref(pref); apply(); }; ac.onchange = function () { render(); }; }
    var ar = box.querySelector('[data-accreset]'); if (ar) ar.onclick = function () { delete pref.accent; savePref(pref); apply(); render(); };
    var lf = box.querySelector('#fm-logo-file'); if (lf) lf.onchange = function () { if (lf.files && lf.files[0]) uploadLogo(lf.files[0]); };
    var ld = box.querySelector('[data-logodel]'); if (ld) ld.onclick = function () { saveLogo(''); };
  }

  // ---------- logo usaha ----------
  function logoMsg(t, ok) { var m = document.getElementById('fm-logo-msg'); if (m) { m.style.color = ok ? '#86efac' : '#fca5a5'; m.textContent = t; } }
  function compress(file) {
    return new Promise(function (res, rej) {
      if (!/^image\//.test(file.type)) return rej(new Error('File harus berupa gambar.'));
      if (file.size > 10 * 1024 * 1024) return rej(new Error('Gambar terlalu besar (maks. 10 MB sebelum diperkecil).'));
      var fr = new FileReader();
      fr.onerror = function () { rej(new Error('Gagal membaca file.')); };
      fr.onload = function () {
        var img = new Image();
        img.onerror = function () { rej(new Error('Gambar tidak dapat dibuka.')); };
        img.onload = function () {
          var sizes = [256, 192, 144, 112, 80], MAX = 100 * 1024;
          for (var s = 0; s < sizes.length; s++) {
            var c = document.createElement('canvas'), d = sizes[s];
            c.width = d; c.height = d;
            var ctx = c.getContext('2d');
            var r = Math.min(d / img.width, d / img.height), w = img.width * r, hh = img.height * r;
            ctx.drawImage(img, (d - w) / 2, (d - hh) / 2, w, hh);
            var qs = [0.92, 0.8, 0.65, 0.5];
            for (var q = 0; q < qs.length; q++) {
              var u = c.toDataURL('image/webp', qs[q]);
              if (u.indexOf('data:image/webp') !== 0) u = c.toDataURL('image/png');   // peramban tanpa WebP
              if ((u.length - u.indexOf(',') - 1) * 0.75 <= MAX) return res(u);
              if (u.indexOf('data:image/png') === 0) break;                           // PNG tidak punya kualitas: perkecil dimensi
            }
          }
          rej(new Error('Gambar tidak bisa diperkecil hingga 100 KB. Coba gambar yang lebih sederhana.'));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  // gambar mini (untuk daftar klien di Tower) disimpan terpisah agar Tower tidak perlu mengunduh logo penuh
  function makeThumb(dataUrl) {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () {
        var c = document.createElement('canvas'); c.width = 64; c.height = 64;
        var r = Math.min(64 / im.width, 64 / im.height), w = im.width * r, h = im.height * r;
        c.getContext('2d').drawImage(im, (64 - w) / 2, (64 - h) / 2, w, h);
        var u = c.toDataURL('image/webp', 0.75); if (u.indexOf('data:image/webp') !== 0) u = c.toDataURL('image/png');
        res(u);
      };
      im.onerror = function () { res(''); };
      im.src = dataUrl;
    });
  }
  function uploadLogo(file) {
    logoMsg('Memproses...', true);
    compress(file).then(saveLogo).catch(function (e) { logoMsg(e.message, false); });
  }
  function saveLogo(data) {
    if (!(typeof db !== 'undefined' && db)) { logoMsg('Belum terhubung ke server. Coba lagi sebentar.', false); return; }
    var upd = data ? { logo: data, logoUpdatedAt: Date.now() } : { logo: firebase.firestore.FieldValue.delete(), logoUpdatedAt: Date.now() };
    var thumbP = data ? makeThumb(data) : Promise.resolve('');
    thumbP.then(function (thumb) {
      var w = db.collection('tenant_logos').doc(TENANT_ID);
      return Promise.all([db.collection('tenant_settings').doc(TENANT_ID).set(upd, { merge: true }), data ? w.set({ thumb: thumb, updatedAt: Date.now() }) : w.delete()]);
    }).then(function () {
      logoData = data || null; applyLogo(); render();
      logoMsg(data ? 'Logo tersimpan (' + Math.round((data.length - data.indexOf(',') - 1) * 0.75 / 1024) + ' KB).' : 'Logo dihapus.', true);
    }).catch(function (e) { logoMsg('Gagal menyimpan: ' + e.message, false); });
  }
  function applyLogo() { return;
    try {
      var nameEl = document.getElementById('topbar-store-name');
      if (!nameEl) return;
      var box = nameEl, svg = null;
      while (box && box.parentElement && !svg) { box = box.parentElement; svg = box.querySelector('svg'); }
      if (!svg || !svg.parentElement) return;
      var holder = svg.parentElement, badge = document.getElementById('ctrl-logo-badge'), img = document.getElementById('fm-logo-img');
      if (logoData) {
        if (!img) { img = document.createElement('img'); img.id = 'fm-logo-img'; img.alt = 'Logo'; img.style.cssText = 'width:100%;height:100%;min-height:40px;object-fit:contain;border-radius:14px'; holder.appendChild(img); }
        img.src = logoData; svg.style.display = 'none'; if (badge) badge.style.display = 'none';
        var ri = document.getElementById('receipt-logo-img'); if (ri) { ri.src = logoData; ri.classList.remove('hidden'); }
      } else {
        var ri2 = document.getElementById('receipt-logo-img'); if (ri2) ri2.classList.add('hidden');
        if (img) img.remove();
        if (badge) badge.style.display = 'flex'; else svg.style.display = '';
      }
    } catch (e) {}
  }
  function startLogo() {
    var tries = 0, t = setInterval(function () {
      tries++;
      if (typeof db !== 'undefined' && db) {
        clearInterval(t);
        db.collection('tenant_settings').doc(TENANT_ID).onSnapshot(function (snap) {
          var d = snap.exists ? snap.data() : null;
          logoData = (d && d.logo) || null;
          applyLogo(); setTimeout(applyLogo, 600); setTimeout(applyLogo, 2500);
        }, function () {});
      } else if (tries > 100) clearInterval(t);
    }, 100);
  }

  // logo di halaman login (belum ada koneksi Firebase di sana: baca lewat REST)
  function loginLogo() {
    if (ROLE !== 'login' || !TOKO || TOKO === 'oneilverse') return;
    try {
      var x = new XMLHttpRequest();
      x.open('GET', 'https://firestore.googleapis.com/v1/projects/finance-ai-master-byneilverse/databases/(default)/documents/tenant_settings/' + encodeURIComponent(TENANT_ID) + '?key=AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI', true);
      x.onload = function () {
        if (x.status !== 200) return;
        try { var f = JSON.parse(x.responseText).fields || {}; logoData = (f.logo && f.logo.stringValue) || null; applyLoginLogo(); } catch (e) {}
      };
      x.send();
    } catch (e) {}
  }
  function applyLoginLogo() {
    var trig = document.getElementById('login-logo-trigger'); if (!trig) return;
    var img = document.getElementById('fm-login-logo'), svg = trig.querySelector('svg'), badge = document.getElementById('login-logo-badge');
    if (logoData) {
      if (!img) { img = document.createElement('img'); img.id = 'fm-login-logo'; img.alt = 'Logo'; img.style.cssText = 'width:80px;height:80px;object-fit:contain;border-radius:24px'; trig.appendChild(img); }
      img.src = logoData; if (svg) svg.style.display = 'none'; if (badge) badge.style.display = 'none';
    } else if (img) img.remove();
  }
  function init() {
    build();
    if (ROLE === 'login') {
      var o = window.applyTenantBranding;
      if (typeof o === 'function') window.applyTenantBranding = function (tn) { o(tn); applyLoginLogo(); };
    }
  }
  window.FM_THEME = { version: APP_VERSION, toggle: function () { pref.mode = ((pref.mode || DEFAULT_MODE) === 'dark') ? 'light' : 'dark'; savePref(pref); apply(); return pref.mode; }, mode: function () { return pref.mode || DEFAULT_MODE; }, open: function () { document.getElementById('fm-gear').click(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
