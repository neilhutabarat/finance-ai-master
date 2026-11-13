/* theme.js — tampilan bersama: font bergaya iPhone, gerakan halus, mode Terang / Gelap Pekat, warna pilihan pengguna,
   menu Pengaturan (tema, warna, logo usaha, versi, catatan rilis). Dipakai Tower, kasir, manager, owner.
   Preferensi tersimpan di perangkat ini, terpisah per toko dan per peran. */
(function () {
  var APP_VERSION = '1.0.0';
  var BETA = 'Beta 12';
  /* Catatan rilis HANYA untuk aplikasi yang dipakai klien (kasir, manager, owner, partner, login).
     Perbaikan dapur (Tower, master APK, pembukuan pribadi) tidak ditulis di sini.
     Setiap rilis wajib memuat [Perbaikan] dan [Keamanan]. Terbaru di atas. */
  var RELEASE_NOTES = [
    ['Beta 12', '14 Nov 2026', [
      '[Baru] Tema Original (kaca bening) dan Base (putih polos) di Pengaturan; mode gelap dihapus',
      '[Baru] Kartu, tombol, header, dock, dan pop-up berdesain kaca yang sama di Kasir, Manager, dan Owner; tulisan tampak tercetak di atas kaca dan tetap jelas',
      '[Baru] Tombol menu Manager dan Owner kini ringkas seukuran Absen, Stok, dan Piutang, berwarna berbeda-beda, sehingga halaman tidak perlu digulir',
      '[Baru] Tingkat kejelasan kaca (1 buram sampai 5 bening) diatur pengelola layanan, per toko bila perlu',
      '[Perbaikan] Tampilan Manager dan Owner yang rusak (kartu gelap, tulisan tidak terbaca) sudah diperbaiki dan sama dengan Kasir',
      '[Perbaikan] Alamat toko tampil penuh dan turun ke baris berikutnya; tombol bantuan (?) dipindah ke atas tombol Piutang',
      '[Perbaikan] Saldo kas laci tidak lagi kembali setelah closing lalu memuat ulang halaman',
      '[Keamanan] Tingkat kaca dan latar hanya bisa diubah oleh pengelola layanan; aplikasi toko hanya membaca dan tidak mengirim data toko'
    ]],
    ['Beta 9', '14 Nov 2026', [
      '[Baru] Latar belakang baru bergaya lukisan (4 gambar) menggantikan latar lama. Gambar berganti otomatis tiap minggu',
      '[Baru] Latar hidup: terang-gelap mengikuti matahari terbit dan terbenam di lokasi toko, malam cerah diterangi bulan, dan cuaca nyata (mendung, hujan, petir, kabut) tampil di layar',
      '[Baru] Pengaturan Gerakan (Otomatis, Selalu, Diam): hujan bergerak hanya di layar lebar yang lancar, dan berhenti sendiri di perangkat yang berat',
      '[Perbaikan] Latar lama dihapus sehingga aplikasi lebih ringan dan tampilan seragam di semua toko',
      '[Keamanan] Lokasi hanya dipakai untuk mengambil cuaca dan jam matahari; tidak ada data toko yang dikirim keluar'
    ]],
    ['Beta 8', '13 Nov 2026', [
      '[Baru] OneilStore kini tampil langsung di dock bawah (Manager dan Owner), tidak perlu lagi membuka menu dulu',
      '[Perbaikan] Tombol Tema dipindah ke Pengaturan agar dock cukup untuk OneilStore; nama tombol kini lengkap "OneilStore"',
      '[Keamanan] Tidak ada perubahan akses data; OneilStore tetap hanya dapat dibuka akun Manager dan Owner'
    ]],
    ['Beta 7', '13 Nov 2026', [
      '[Baru] Mode demo: toko uji coba tampil label "DEMO · sisa N hari" di layar, dan terkunci otomatis saat masa demo habis. Data demo tidak dihapus',
      '[Perbaikan] Layar kunci saat masa demo habis kini berbeda dari layar pembekuan pembayaran, dengan pesan yang lebih jelas',
      '[Keamanan] Masa demo hanya dapat diatur dan dicabut oleh penyedia aplikasi (Tower); toko hanya membaca'
    ]],
    ['Beta 6', '13 Nov 2026', [
      '[Baru] OneilStore: Manager dan Owner kini bisa menyewa fitur tambahan sesuai kebutuhan usaha, satuan atau lewat paket jenis usaha (laundry, kos, klinik, konveksi, minimarket), lengkap dengan masa coba 7 hari',
      '[Baru] Tab Punyaku menampilkan fitur yang disewa, sisa harinya, dan status permintaan',
      '[Perbaikan] Fitur yang sudah aktif di toko tetap gratis. Sewa hanya menambah fitur, dan saat masa sewa habis fitur hanya terkunci, data toko tidak pernah dihapus atau diubah',
      '[Keamanan] Permintaan sewa dikirim lewat jalur tiket yang sudah dilindungi aturan toko, dan hanya penyedia aplikasi yang dapat mengaktifkan atau mencabut sewa'
    ]],
    ['Beta 5', '13 Nov 2026', [
      '[Perbaikan] Nota yang tanggalnya dikosongkan di Kasir kini otomatis memakai tanggal hari ini (sebelumnya tersimpan sebagai "Invalid Date")',
      '[Perbaikan] Tanggal koreksi Owner dan bulan berjalan di laporan pajak kini mengikuti waktu setempat (sebelumnya bisa mundur satu hari antara pukul 00.00 dan 07.00)',
      '[Perbaikan] Tombol Edit dan Hapus akun COA tidak lagi rusak bila kode akun memuat tanda kutip',
      '[Keamanan] Kode akun, kategori, jam tutup kasir, dan notifikasi Partner kini disaring sebelum ditampilkan di semua akun',
      '[Keamanan] File CSV hasil ekspor kini aman dari rumus tersembunyi (keterangan yang diawali tanda = + - @ tidak lagi dijalankan Excel)'
    ]],
    ['Beta 4', '13 Nov 2026', [
      '[Perbaikan] Mode gelap di akun Kasir dirapikan menyeluruh: kolom isian, jam, tombol, menu bawah, dan semua jendela kini gelap dan jelas terbaca (sebelumnya sebagian masih terang atau hampir tak terlihat)',
      '[Perbaikan] Tombol di akun Manager dan Owner kini seragam: lebar dan tinggi sama, baris dibagi rata',
      '[Keamanan] Catatan keterangan transaksi kini disaring sebelum ditampilkan, menutup celah penyisipan skrip dari akun kasir ke akun manager/owner',
      '[Baru] Terjemahan Bahasa Inggris dilengkapi lagi pada layar utama dan jendela-jendelanya'
    ]],
    ['Beta 3', '13 Nov 2026', [
      '[Perbaikan] Mode gelap dirombak total: sebelumnya hanya membalik warna layar, kini memakai palet gelap yang dirancang khusus sehingga tulisan jernih dan tidak lagi terlihat rusak',
      '[Perbaikan] Mode terang dibuat lebih mudah dibaca: kartu sedikit lebih pekat dan garisnya lebih tegas, latar dedaunan tetap terlihat',
      '[Perbaikan] Nama tombol yang panjang kini turun ke dua baris, tidak lagi terpotong menjadi titik-titik',
      '[Perbaikan] Tombol Piutang & Utang yang sempat tampil tanpa nama sudah kembali normal',
      '[Baru] Cakupan Bahasa Inggris diperluas lebih dari tiga kali lipat, termasuk tanggal, nama bulan, dan kalimat berangka'
    ]],
    ['Beta 2', '13 Nov 2026', [
      '[Perbaikan] Tombol Stok, Absen, dan Bantuan dipindah ke bawah agar tidak lagi menutupi formulir kasir',
      '[Perbaikan] Pemberitahuan "versi baru siap" kini muncul otomatis saat ada pembaruan aplikasi'
    ]],
    ['Beta', '13 Nov 2026', [
      '[Baru] Oneil Shield — pusat keamanan toko: lihat perlindungan datamu langsung di menu Pengaturan',
      '[Baru] Ganti bahasa Indonesia / English kini rapi di dalam menu Pengaturan',
      '[Perbaikan] Tombol-tombol di layar Kasir ditata ulang agar tidak lagi saling bertumpuk',
      '[Keamanan] Oneil Shield menjaga akses dan data toko, dan mengunci aplikasi otomatis bila lama tak tersambung ke server'
    ]],
    ['Prototype', '13 Nov 2026', [
      '[Baru] Kasir untuk toko, kafe, laundry, salon, bengkel, dan jasa, lengkap dengan tunai, QRIS, transfer, struk, dan piutang',
      '[Baru] Pembukuan otomatis: laba rugi, arus kas, neraca, pajak, dan gaji, langsung dari transaksi kasir',
      '[Baru] Stok dengan scanner barcode atau kamera, riwayat barang masuk per Admin, dan pemisahan stok per usaha',
      '[Baru] Beberapa Admin dalam satu toko, masing-masing dengan pembukuan usahanya sendiri',
      '[Baru] Absensi karyawan, Properti (unit, penyewa, tagihan bulanan dan pengingat WhatsApp), dan Chat Universe',
      '[Baru] Pilihan bahasa Indonesia dan English, mode terang dan gelap, serta mode offline',
      '[Baru] Cadangan data ke Excel dan JSON, laporan siap cetak, dan tiket bantuan langsung ke tim Oneilverse',
      '[Perbaikan] Tampilan login dan halaman setelah masuk tidak lagi berkedip tampilan lama sebelum tampilan yang benar',
      '[Keamanan] Data tiap toko terpisah penuh, sandi tersimpan terenkripsi, dan kolom PIN tidak lagi ditawari simpan sandi oleh browser'
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
    // ===== MODE GELAP =====
    // Palet gelap yang dirancang khusus (bukan efek balik warna), jadi kontras tulisan tetap nyaman dibaca.
    'html[data-fm-black="1"]{color-scheme:dark;--d-bg:#080b11;--d-surf:rgba(21,26,36,.9);--d-surf2:rgba(30,36,48,.92);--d-line:rgba(255,255,255,.1);--d-line2:rgba(255,255,255,.17);--d-t1:#eef1f7;--d-t2:#c2cad9;--d-t3:#939db1}',
    'html[data-fm-black="1"] body{background:var(--d-bg)!important;background-image:none!important;color:var(--d-t1)}',
    'html[data-fm-black="1"] .ios-glass{background:var(--d-surf)!important;border-color:var(--d-line)!important;box-shadow:0 1px 0 rgba(255,255,255,.05) inset,0 10px 30px -18px rgba(0,0,0,.9)!important}',
    'html[data-fm-black="1"] .glass-capsule,html[data-fm-black="1"] .glass-capsule-dark{background:rgba(12,15,21,.92)!important;border-color:var(--d-line2)!important}',
    'html[data-fm-black="1"] .bg-slate-900,html[data-fm-black="1"] .bg-slate-950{background-color:#05070b!important}',
    'html[data-fm-black="1"] .text-slate-400{color:var(--d-t2)!important}html[data-fm-black="1"] .text-slate-500{color:var(--d-t3)!important}html[data-fm-black="1"] .text-slate-600{color:var(--d-t3)!important}',
    // Halaman yang markup aslinya terang (kasir & halaman masuk): warnanya diganti satu per satu,
    // supaya tidak lagi terlihat seperti kerusakan sistem saat mode gelap dinyalakan.
    'html[data-fm-black="1"][data-fm-native="light"]{--s-surf:var(--d-surf)!important;--s-line:var(--d-line)!important;--s-tint:rgba(255,255,255,.07)!important;--s-hi:rgba(255,255,255,.07)!important;--s-shadow:rgba(0,0,0,.7)!important;--s-gloss:rgba(255,255,255,.04)!important;--s-bg:var(--d-bg)!important;--s-b2:var(--d-surf)!important;--s-b2l:var(--d-line2)!important;--s-b2t:var(--d-t1)!important}',
    'html[data-fm-black="1"][data-fm-native="light"] body{background-color:var(--d-bg)!important;background-image:linear-gradient(rgba(8,11,17,.86),rgba(8,11,17,.94)),var(--fm-wp,url("/img/wp/1.jpg"))!important;background-size:cover!important;background-position:center bottom!important;background-repeat:no-repeat!important;background-attachment:fixed!important;color:var(--d-t1)!important}',
    'html[data-fm-black="1"][data-fm-native="light"] .bg-white,html[data-fm-black="1"][data-fm-native="light"] [class*="bg-white/"]{background-color:var(--d-surf)!important}',
    'html[data-fm-black="1"][data-fm-native="light"] .bg-slate-50,html[data-fm-black="1"][data-fm-native="light"] .bg-slate-100,html[data-fm-black="1"][data-fm-native="light"] .bg-slate-200{background-color:var(--d-surf2)!important}',
    'html[data-fm-black="1"][data-fm-native="light"] .text-slate-900,html[data-fm-black="1"][data-fm-native="light"] .text-slate-800,html[data-fm-black="1"][data-fm-native="light"] .text-black{color:var(--d-t1)!important}',
    'html[data-fm-black="1"][data-fm-native="light"] .text-slate-700,html[data-fm-black="1"][data-fm-native="light"] .text-slate-600{color:var(--d-t2)!important}',
    'html[data-fm-black="1"][data-fm-native="light"] [class*="border-slate-"],html[data-fm-black="1"][data-fm-native="light"] .border-white,html[data-fm-black="1"][data-fm-native="light"] [class*="border-white/"]{border-color:var(--d-line2)!important}',
    'html[data-fm-black="1"][data-fm-native="light"] input:not([type=checkbox]):not([type=radio]):not([type=color]),html[data-fm-black="1"][data-fm-native="light"] select,html[data-fm-black="1"][data-fm-native="light"] textarea{background-color:rgba(10,13,19,.94)!important;color:var(--d-t1)!important;border-color:var(--d-line2)!important;box-shadow:none!important}',
    'html[data-fm-black="1"][data-fm-native="light"] input::placeholder,html[data-fm-black="1"][data-fm-native="light"] textarea::placeholder,html[data-fm-black="1"][data-fm-native="light"] [class*="placeholder-slate-"]::placeholder{color:#7f899d!important}',
    'html[data-fm-black="1"][data-fm-native="light"] table thead th{background-color:rgba(12,15,21,.9)!important;color:var(--d-t2)!important}',
    'html[data-fm-black="1"][data-fm-native="light"] tbody tr:nth-child(even){background-color:rgba(255,255,255,.025)!important}',
    // Warna penanda (merah/hijau/kuning/biru) dinaikkan terangnya agar tetap terbaca di atas gelap.
    'html[data-fm-black="1"][data-fm-native="light"] [class*="text-rose-"],html[data-fm-black="1"][data-fm-native="light"] [class*="text-red-"]{color:#fb8a9c!important}',
    'html[data-fm-black="1"][data-fm-native="light"] [class*="text-emerald-"],html[data-fm-black="1"][data-fm-native="light"] [class*="text-green-"]{color:#45dba6!important}',
    'html[data-fm-black="1"][data-fm-native="light"] [class*="text-amber-"],html[data-fm-black="1"][data-fm-native="light"] [class*="text-yellow-"],html[data-fm-black="1"][data-fm-native="light"] [class*="text-orange-"]{color:#fbc02d!important}',
    'html[data-fm-black="1"][data-fm-native="light"] [class*="text-indigo-"],html[data-fm-black="1"][data-fm-native="light"] [class*="text-blue-"],html[data-fm-black="1"][data-fm-native="light"] [class*="text-violet-"],html[data-fm-black="1"][data-fm-native="light"] [class*="text-purple-"]{color:#a3b0fc!important}',
    'html[data-fm-black="1"][data-fm-native="light"] [class*="text-cyan-"],html[data-fm-black="1"][data-fm-native="light"] [class*="text-sky-"],html[data-fm-black="1"][data-fm-native="light"] [class*="text-teal-"]{color:#5fd8f0!important}',
    // Kotak peringatan/info berwarna muda: dasarnya dijadikan gelap bernuansa, bukan putih menyilaukan.
    'html[data-fm-black="1"][data-fm-native="light"] [class*="bg-amber-1"],html[data-fm-black="1"][data-fm-native="light"] [class*="bg-amber-50"],html[data-fm-black="1"][data-fm-native="light"] [class*="bg-yellow-1"],html[data-fm-black="1"][data-fm-native="light"] [class*="bg-yellow-50"]{background-color:rgba(120,78,8,.52)!important;border-color:rgba(251,192,45,.34)!important}',
    'html[data-fm-black="1"][data-fm-native="light"] [class*="bg-rose-1"],html[data-fm-black="1"][data-fm-native="light"] [class*="bg-rose-50"],html[data-fm-black="1"][data-fm-native="light"] [class*="bg-red-1"],html[data-fm-black="1"][data-fm-native="light"] [class*="bg-red-50"]{background-color:rgba(118,29,45,.52)!important;border-color:rgba(251,138,156,.32)!important}',
    'html[data-fm-black="1"][data-fm-native="light"] [class*="bg-emerald-1"],html[data-fm-black="1"][data-fm-native="light"] [class*="bg-emerald-50"],html[data-fm-black="1"][data-fm-native="light"] [class*="bg-green-1"],html[data-fm-black="1"][data-fm-native="light"] [class*="bg-green-50"]{background-color:rgba(10,85,62,.52)!important;border-color:rgba(69,219,166,.3)!important}',
    'html[data-fm-black="1"][data-fm-native="light"] [class*="bg-cyan-1"],html[data-fm-black="1"][data-fm-native="light"] [class*="bg-cyan-50"],html[data-fm-black="1"][data-fm-native="light"] [class*="bg-sky-1"],html[data-fm-black="1"][data-fm-native="light"] [class*="bg-sky-50"],html[data-fm-black="1"][data-fm-native="light"] [class*="bg-indigo-1"],html[data-fm-black="1"][data-fm-native="light"] [class*="bg-indigo-50"]{background-color:rgba(18,62,106,.52)!important;border-color:rgba(95,216,240,.26)!important}',
    'html[data-fm-black="1"][data-fm-native="light"] [class*="bg-amber-1"] [class*="text-amber-9"],html[data-fm-black="1"][data-fm-native="light"] [class*="bg-amber-1"] [class*="text-amber-8"]{color:#ffd978!important}',
    'html[data-fm-black="1"] .fixed button[class*="bg-white/10"]{color:#e2e8f0!important}',
    // ikon ubin & tombol aksi: sedikit lebih terang agar jelas di atas latar gelap
    'html[data-fm-black="1"] .fm-actions .fm-act i{color:#b4c0ff!important}',
    // Jendela/panel bawaan aplikasi (konfirmasi, stok, laporan) ikut digelapkan supaya tidak menyilaukan.
    'html[data-fm-black="1"] #fm-dlg .fm-dlg-box,html[data-fm-black="1"] #fm-lap .lp,html[data-fm-black="1"] #fm-stok .sk-box,html[data-fm-black="1"] #fm-stok .sk-ed>div,html[data-fm-black="1"] #fm-stokadm-modal .sa-box{background:rgba(21,26,36,.95)!important;border-color:rgba(255,255,255,.12)!important;color:#eef1f7!important}',
    'html[data-fm-black="1"] #fm-dlg .fm-dlg-box h3,html[data-fm-black="1"] #fm-dlg .fm-dlg-box p,html[data-fm-black="1"] #fm-lap .lp h3,html[data-fm-black="1"] #fm-lap .lp p,html[data-fm-black="1"] #fm-stok .sk-box h3,html[data-fm-black="1"] #fm-stokadm-modal .sa-box h3{color:#eef1f7!important}',
    'html[data-fm-black="1"] #fm-dlg .fm-dlg-no{background:rgba(148,163,184,.26)!important;color:#e7ebf3!important}',
    'html[data-fm-black="1"] #fm-stok .sk-chip:not(.on){background:rgba(148,163,184,.22)!important;color:#c7cfdd!important}',
    'html[data-fm-black="1"] #fm-stok .sk-box table th{background:rgba(12,15,21,.9)!important;color:#c2cad9!important}',
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
  /* Latar belakang: 4 gambar bergaya lukisan. Gambar yang tampil diatur dari Tower (app_meta/wallpaper):
     otomatis bergilir tiap minggu, atau dikunci satu gambar. Kaca dan pembaruan otomatis di js/langit.js. */
  var WP_FILES = ['img/wp/1.jpg', 'img/wp/2.jpg', 'img/wp/3.jpg', 'img/wp/4.jpg'];
  var WP_TZ = 7 * 3600000; /* WIB: pergantian mingguan mengikuti jam Indonesia barat */
  function wpCfg() { try { return JSON.parse(localStorage.getItem('fm_wp_cfg') || 'null') || {}; } catch (e) { return {}; } }
  function wpDays(now, cfg) { var hr = Math.max(0, Math.min(23, parseInt(cfg.hour, 10) || 0)); return { t: now + WP_TZ - hr * 3600000, hr: hr }; }
  function wpShift(cfg) { var d = parseInt(cfg.day, 10); if (!(d >= 0 && d <= 6)) d = 1; return (d - 1 + 7) % 7; }
  function wpOrder(cfg) {
    var o = (cfg.order || []).map(function (v) { return parseInt(v, 10); }).filter(function (v, i, a) { return v >= 1 && v <= WP_FILES.length && a.indexOf(v) === i; });
    return o.length ? o : [1, 2, 3, 4];
  }
  /* indeks gambar (0..3) yang berlaku pada waktu now */
  function wpPick(cfg, now) {
    cfg = cfg || wpCfg(); now = now || Date.now();
    if (cfg.mode === 'fixed') { var f = parseInt(cfg.fixed, 10); return (f >= 1 && f <= WP_FILES.length) ? f - 1 : 0; }
    var o = wpOrder(cfg), days = Math.floor(wpDays(now, cfg).t / 86400000);
    var wk = Math.floor((days - 4 - wpShift(cfg)) / 7), n = o.length, k = (((wk + (parseInt(cfg.start, 10) || 0)) % n) + n) % n;
    return o[k] - 1;
  }
  /* kapan gambar berikutnya berganti (ms epoch); null bila dikunci */
  function wpNext(cfg, now) {
    cfg = cfg || wpCfg(); now = now || Date.now();
    if (cfg.mode === 'fixed') return null;
    var w = wpDays(now, cfg), days = Math.floor(w.t / 86400000), wk = Math.floor((days - 4 - wpShift(cfg)) / 7);
    return (4 + wpShift(cfg) + (wk + 1) * 7) * 86400000 + w.hr * 3600000 - WP_TZ;
  }
  window.FM_THEME_PREF = function () { return pref; };
  window.FM_ROLE = ROLE;
  window.FM_WP = { files: WP_FILES, pick: wpPick, next: wpNext, cfg: wpCfg, order: wpOrder };
  function updateWp() {
    try { document.documentElement.style.setProperty('--fm-wp', 'url("' + WP_FILES[wpPick()] + '")'); } catch (e) {}
  }
  window.FM_WP.update = updateWp;
  function apply() {
    var h = document.documentElement;
    updateWp();
    var mode = (ROLE === 'tower') ? (pref.mode || DEFAULT_MODE) : 'light';     /* mode gelap dihapus (Beta 12): hanya Original (kaca) dan Base (putih polos) */
    h.setAttribute('data-fm-native', NATIVE);
    ['data-fm-black', 'data-fm-invert', 'data-fm-accent'].forEach(function (a) { h.removeAttribute(a); });
    if (!LITE && ROLE !== 'lain') {
      /* gelap = tema gelap sungguhan (tidak lagi memakai efek balik warna yang bikin tampilan rusak);
         terang di halaman yang markup-nya memang gelap (manager/owner) tetap memakai pembalik seperti semula */
      if (mode === 'dark') h.setAttribute('data-fm-black', '1');
      else if (mode !== NATIVE) h.setAttribute('data-fm-invert', '1');
      if (pref.accent) { h.setAttribute('data-fm-accent', '1'); h.style.setProperty('--fm-accent', pref.accent); }
      else h.style.removeProperty('--fm-accent');
      h.style.setProperty('--fm-on', onColor(pref.accent || '#3d63dd'));
    }
    try { window.dispatchEvent(new CustomEvent('fm:theme')); } catch (e) {}
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
    var look = pref.look === 'base' ? 'base' : 'original';
    h += '<div class="fm-sec"><div class="fm-lab">Tema</div><div class="fm-modes">' +
      '<button class="fm-mode ' + (look === 'original' ? 'on' : '') + '" data-look="original"><div class="fm-prev fm-keep" style="background:linear-gradient(135deg,#bfe3ff,#e8f6ff 45%,#9fd6c0)"></div>Original</button>' +
      '<button class="fm-mode ' + (look === 'base' ? 'on' : '') + '" data-look="base"><div class="fm-prev fm-keep" style="background:linear-gradient(135deg,#ffffff,#eceff4)"></div>Base</button></div></div>';
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
    if (window.FM_I18N && FM_I18N.has && FM_I18N.has()) { var _ln = FM_I18N.lang(); h += '<div class="fm-sec"><div class="fm-lab">Bahasa / Language</div><div class="fm-modes"><button class="fm-mode ' + (_ln === 'id' ? 'on' : '') + '" data-lang="id">Indonesia</button><button class="fm-mode ' + (_ln === 'en' ? 'on' : '') + '" data-lang="en">English</button></div></div>'; }
    if (window.FM_PLANS) h += '<div class="fm-sec"><button class="fm-btn pri" data-plans style="width:100%;padding:13px">✨ Fitur Toko</button></div>';
    if (window.FM_SHIELD) h += '<div class="fm-sec"><button class="fm-btn" data-shield style="width:100%;padding:13px">🛡️ Oneil Shield — Keamanan</button></div>';
    if (false) h += '<div class="fm-sec"><button class="fm-btn" data-logout style="width:100%;padding:13px;color:#fda4af">Keluar dari Akun</button></div>';
    h += '<div class="fm-sec"><div class="fm-lab">Versi Aplikasi</div><div class="fm-card" style="display:flex;justify-content:space-between;font-size:13px"><span>Oneilverse POS</span><b>v' + APP_VERSION + ' · ' + BETA + '</b></div></div>';
    h += '<div class="fm-sec"><div class="fm-lab">Catatan Rilis</div>' + RELEASE_NOTES.slice(0, SHOW_LAST).map(function (n, i) {
      return '<details ' + (i === 0 ? 'open' : '') + '><summary>v' + n[0] + ' · ' + n[1] + '</summary><ul>' + n[2].map(function (t) { var m = /^\[(\w+)\]\s*/.exec(t); var tag = m ? m[1] : ''; return '<li>' + (tag ? '<i class="fm-tag fm-tag-' + tag.toLowerCase() + '">' + esc(tag) + '</i>' : '') + esc(t.replace(/^\[\w+\]\s*/, '')) + '</li>'; }).join('') + '</ul></details>';
    }).join('') + '</div>';
    box.innerHTML = h;

    var lo = box.querySelector('[data-logout]'); if (lo) lo.onclick = function () { document.getElementById('fm-set').style.display = 'none'; window.FM_LOGOUT(); };
    var pb = box.querySelector('[data-plans]'); if (pb) pb.onclick = function () { document.getElementById('fm-set').style.display = 'none'; if (window.FM_PLANS) FM_PLANS.openModal(); };
    var sh = box.querySelector('[data-shield]'); if (sh) sh.onclick = function () { document.getElementById('fm-set').style.display = 'none'; if (window.FM_SHIELD) FM_SHIELD.openPanel(); };
    box.querySelector('[data-close]').onclick = function () { document.getElementById('fm-set').style.display = 'none'; };
    box.querySelectorAll('[data-look]').forEach(function (b) { b.onclick = function () { pref.look = b.getAttribute('data-look'); savePref(pref); apply(); render(); }; });
    box.querySelectorAll('[data-lang]').forEach(function (b) { b.onclick = function () { if (window.FM_I18N) FM_I18N.set(b.getAttribute('data-lang')); }; });
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
  window.FM_THEME = { version: APP_VERSION, toggle: function () { pref.look = (pref.look === 'base') ? 'original' : 'base'; savePref(pref); apply(); return pref.look; }, mode: function () { return pref.mode || DEFAULT_MODE; }, open: function () { document.getElementById('fm-gear').click(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
