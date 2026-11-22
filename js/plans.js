/* plans.js — fitur rakitan per toko dan per mode (Admin = kasir, Manager, Owner).
   - Fitur INTI selalu aktif dan tidak bisa dicabut (bahkan oleh Tower).
   - Fitur TAMBAHAN hanya tampil bila dicentang Tower (Basic: tidak ada; Plus: daftar bawaan Plus) (saat buka toko atau diubah kapan saja).
   - tenant.features[key] = { kasir: bool, manager: bool, owner: bool }
   - Toko lama yang belum punya pilihan tersimpan otomatis mendapat fitur yang sudah mereka pakai. */
(function () {
  'use strict';
  var ROLES = ['kasir', 'manager', 'owner'];
  var RLABEL = { kasir: 'Admin', manager: 'Manager', owner: 'Owner' };
  var ORDER = { basic: 0, plus: 1, pro: 2 };
  // c = inti (core), o = tambahan (opt); soon = belum tersedia
  var FEATURES = [
    { key: 'input', label: 'Catat Transaksi: form, Antrean Draft, Cetak Struk', r: { kasir: 'c' } },
    { key: 'saldo', label: 'Saldo Kas Sah, Total Masuk, Total Keluar', r: { kasir: 'c', manager: 'c', owner: 'c' } },
    { key: 'closing', label: 'Closing dan Riwayat Closing', r: { kasir: 'c', manager: 'c' } },
    { key: 'mutasi', label: 'Mutasi (buku kas)', r: { kasir: 'c', manager: 'c', owner: 'c' } },
    { key: 'coa', label: 'Kelola Akun (COA)', r: { manager: 'c', owner: 'o' } },
    { key: 'kasir_baru', label: 'Buka Kasir Baru', r: { manager: 'c', owner: 'c' } },
    { key: 'laba_rugi', label: 'Laba Rugi · Bulan Ini', r: { manager: 'c', owner: 'c' } },
    { key: 'pin', label: 'Kelola Password Staf dan Ubah Nama Peran', r: { owner: 'c' } },
    { key: 'ledger', label: 'Buku Besar', r: { kasir: 'o', manager: 'c', owner: 'o' } },
    { key: 'stok', label: 'Stok & Closing: lihat daftar stok', r: { manager: 'o', owner: 'o' } },
    { key: 'stok_input', label: 'Stok & Closing: tambah jenis dan stok masuk', r: { manager: 'o', owner: 'o' } },
    { key: 'jual_produk', label: 'Jual barang dari stok di kasir (toko dagang)', r: { kasir: 'o', manager: 'o' } },
    { key: 'satuan_ganda', label: 'Satuan Ganda (mis. 1 bal = 100 lembar) di Stok dan Kasir', r: { kasir: 'o', manager: 'o' } },
    { key: 'diskon', label: 'Diskon & Promo: promo otomatis dan diskon manual Admin berbatas', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'arus_kas', label: 'Arus Kas: uang masuk dan keluar per bulan, minggu, dan cara bayar', r: { manager: 'o', owner: 'o' } },
    { key: 'anggaran', label: 'Anggaran Bulanan: batas pengeluaran per akun dan target pemasukan', r: { manager: 'o', owner: 'o' } },
    { key: 'rekon', label: 'Rekonsiliasi Kas: cocokkan uang tunai di laci dengan catatan', r: { manager: 'o', owner: 'o' } },
    { key: 'neraca', label: 'Neraca: harta, utang, dan modal toko (Paket Plus)', r: { manager: 'o', owner: 'o' } },
    { key: 'neraca_ai', label: 'Neraca AI (uji coba): neraca dari transaksi, kunci periode', r: { manager: 'o', owner: 'o' } },
    { key: 'penjelasan', label: 'Penjelasan Laporan Keuangan: angka laporan dijelaskan dengan kalimat sederhana', r: { manager: 'o', owner: 'o' } },
    { key: 'perubahan_modal', label: 'Perubahan Modal: modal awal sampai modal akhir', r: { manager: 'o', owner: 'o' } },
    { key: 'penyusutan', label: 'Penyusutan Aset Tetap: daftar aset dan nilai buku', r: { manager: 'o', owner: 'o' } },
    { key: 'stok_habis', label: 'Perkiraan Stok Habis: produk yang perlu dibeli lagi', r: { manager: 'o', owner: 'o' } },
    { key: 'harian_wa', label: 'Laporan Harian WhatsApp: ringkasan satu hari siap kirim', r: { manager: 'o', owner: 'o' } },
    { key: 'grafik', label: 'Grafik Keuangan: penjualan, laba, kas, beban, aset dan liabilitas', r: { manager: 'o', owner: 'o' } },
    { key: 'pajak_bulanan', label: 'Laporan Pajak Bulanan: perkiraan PPh Final dan PPN per bulan', r: { manager: 'o', owner: 'o' } },
    { key: 'absensi', label: 'Absensi Karyawan: catat masuk dan pulang, rekap kehadiran bulanan', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'offline_penuh', label: 'Mode Offline Penuh: transaksi tetap tersimpan saat internet putus dan terkirim otomatis', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'backup', label: 'Backup & Ekspor Data: unduh data toko ke Excel dan arsip', r: { manager: 'o', owner: 'o' } },
    { key: 'laporan_bulanan', label: 'Laporan Bulanan: ringkasan tiap bulan untuk Owner, kirim lewat WhatsApp', r: { manager: 'o', owner: 'o' } },
    { key: 'admin_usaha', label: 'Admin tambahan per usaha: banyak akun Admin, PIN sendiri-sendiri, Owner bisa mengatur', r: { owner: 'o' } },
    { key: 'piutang', label: 'Piutang & Utang: DP, bayar sebagian, jatuh tempo, daftar pelanggan dan pemasok', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'barcode', label: 'Barcode: scan alat, scan kamera, dan cari nama di Kasir', r: { kasir: 'o', manager: 'o' } },
    { key: 'banyak_usaha', label: 'Banyak Usaha (mis. Jahit, Karung, Kelontong)', r: { manager: 'o', owner: 'o' } },
    { key: 'stok_admin', label: 'Stok untuk Admin: lihat stok usaha sendiri (tombol Stok di Kasir)', r: { kasir: 'o' } },
    { key: 'stok_scan', label: 'Scan Stok Masuk: Admin scan barcode untuk menambah stok, tercatat nama dan waktunya', r: { kasir: 'o' } },
    { key: 'properti', label: 'Modul Properti: unit sewa, penyewa, tagihan bulanan, dan pengingat WhatsApp', r: { manager: 'o', owner: 'o' } },
    { key: 'bahasa', label: 'Banyak Bahasa: tombol ID | EN untuk mengganti tampilan ke English', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'stok_closing', label: 'Stok & Closing: isi sisa stok dan Closing Mingguan', r: { manager: 'o', owner: 'o' } },
    { key: 'bukti', label: 'Foto Bukti Struk (Kamera / Berkas)', r: { kasir: 'o' } },
    { key: 'wa_receipt', label: 'Kirim Struk lewat WhatsApp', r: { kasir: 'o' } },
    { key: 'tax', label: 'Pajak PPN 12%', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'dashboard', label: 'Kartu: Ringkasan Hari Ini, Metode Bayar, Target Omzet, Stok Menipis, Laba & Margin per Produk', r: { manager: 'o', owner: 'o' } },
    { key: 'analisa', label: 'Analisa Keuangan', r: { manager: 'o', owner: 'o' } },
    { key: 'ai_asisten', label: 'Asisten AI Pembukuan (pratinjau Oneilverse 2) — kartu ringkasan & tanya-jawab AI di Ringkasan Hari Ini', r: { manager: 'o', owner: 'o' } },
    { key: 'card_ringkasan', label: 'Oneilverse 2 · Kartu Ringkasan Hari Ini', r: { manager: 'o', owner: 'o' } },
    { key: 'card_metode', label: 'Oneilverse 2 · Kartu Metode Bayar Hari Ini', r: { manager: 'o', owner: 'o' } },
    { key: 'card_target', label: 'Oneilverse 2 · Kartu Target Omzet', r: { manager: 'o', owner: 'o' } },
    { key: 'card_stok', label: 'Oneilverse 2 · Kartu Stok Menipis', r: { manager: 'o', owner: 'o' } },
    { key: 'card_grafik', label: 'Oneilverse 2 · Kartu Grafik Income vs Outcome 7 hari', r: { manager: 'o', owner: 'o' } },
    { key: 'card_transaksi', label: 'Oneilverse 2 · Kartu Transaksi Terakhir', r: { manager: 'o', owner: 'o' } },
    { key: 'sat_perbarui', label: 'Oneilverse 2 · Satelit Perbarui Aplikasi (pulau kanan)', r: { manager: 'o', owner: 'o' } },
    { key: 'denyut', label: 'Oneilverse 2 · Denyut Usaha (percikan transaksi langsung)', r: { manager: 'o', owner: 'o' } },
    { key: 'tutup_hari', label: 'Oneilverse 2 · Ritual Tutup Hari + sapaan pagi AI', r: { manager: 'o', owner: 'o' } },
    { key: 'instruksi', label: 'Instruksi & Pengawasan Admin', r: { manager: 'o' } },
    { key: 'audit', label: 'Audit (riwayat perubahan)', r: { owner: 'o' } },
    { key: 'export_csv', label: 'Unduh PDF dan CSV laporan', r: { owner: 'o' } },
    { key: 'clock', label: 'Jam dan Tanggal', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'weather', label: 'Cuaca', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'rates', label: 'Kurs dan Emas', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'billing_card', label: 'Estimasi Biaya Layanan', r: { manager: 'o', owner: 'o' } },
    { key: 'chat', label: 'Chat', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'wallpaper', label: 'Latar Belakang (di Pengaturan)', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'theme', label: 'Tema Warna (di Pengaturan)', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'mutasi_wa', label: 'Mutasi: Kirim WhatsApp dan Cetak', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'gaji', label: 'Laporan Gaji', r: { manager: 'o', owner: 'o' } },
    { key: 'gaji_auto', label: 'Gaji otomatis tercatat sebagai pengeluaran', r: { manager: 'o' } },
    { key: 'paket', label: 'Paket Basic, Plus, dan Pro', soon: true, r: { manager: 'o', owner: 'o' } }
  ];
  // nilai untuk toko lama yang belum punya pilihan tersimpan
  var LEGACY = { wa_receipt: 'plus', analisa: { owner: true }, coa: {}, ledger: { kasir: true }, mutasi_wa: {}, gaji: {}, gaji_auto: {}, stok_input: { manager: true }, stok_closing: { manager: true } };

  function find(key) { return FEATURES.filter(function (f) { return f.key === key; })[0]; }
  function tenant() { try { return (typeof getActiveTenant === 'function') ? getActiveTenant() : null; } catch (e) { return null; } }
  function pageRole() {
    var p = (location.pathname.split('/').pop() || '').toLowerCase();
    return p === 'kasir.html' ? 'kasir' : p === 'manager.html' ? 'manager' : p === 'dashboard.html' ? 'owner' : 'kasir';
  }
  /* Default per paket: Basic = hanya fitur inti (merah). Plus = fitur tambahan berikut sudah tercentang (hijau, boleh dicabut). */
  var PLUS_KEYS = ['neraca', 'dashboard', 'analisa', 'audit', 'export_csv', 'ledger', 'stok', 'stok_input:manager', 'stok_closing:manager', 'gaji', 'mutasi_wa', 'wa_receipt', 'bukti'];

  /* ===== Paket Basic/Plus/Pro (dirakit Tower, isinya kosong sampai diisi manual) =====
     Disimpan di app_meta/paket_catalog = { json } (dibaca klien tanpa login, seperti wallpaper/rollout/store_catalog).
     Bentuk: { plus: { <key>: { kasir:bool, manager:bool, owner:bool } }, pro: { ... } }.
     Pro otomatis mewarisi semua isi Plus (tidak perlu dicentang dua kali), lalu ditambah isi Pro sendiri. */
  var PAKET_KEY = 'fm_paket_cat_v1', PAKET_CAT = null, PAKET_AT = 0;
  function loadPaketCat() { try { var v = JSON.parse(localStorage.getItem(PAKET_KEY) || 'null'); PAKET_CAT = (v && typeof v === 'object') ? v : null; } catch (e) { PAKET_CAT = null; } }
  loadPaketCat();
  function setPaketCat(c) { PAKET_CAT = c && typeof c === 'object' ? c : null; try { if (PAKET_CAT) localStorage.setItem(PAKET_KEY, JSON.stringify(PAKET_CAT)); else localStorage.removeItem(PAKET_KEY); } catch (e) {} try { window.dispatchEvent(new CustomEvent('fm:paketcat')); } catch (e) {} }
  function fetchPaketCat(cb) {
    try {
      var url = 'https://firestore.googleapis.com/v1/projects/finance-ai-master-byneilverse/databases/(default)/documents/app_meta/paket_catalog?key=AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI';
      fetch(url, { cache: 'no-store' }).then(function (r) { return r.status === 404 ? { __none: 1 } : (r.ok ? r.json() : null); }).then(function (d) {
        if (d && d.__none) setPaketCat(null);
        else if (d && d.fields && d.fields.json && d.fields.json.stringValue) { var j = JSON.parse(d.fields.json.stringValue); if (j && typeof j === 'object') setPaketCat(j); }
        PAKET_AT = Date.now(); if (cb) cb();
      }).catch(function () { if (cb) cb(); });
    } catch (e) { if (cb) cb(); }
  }
  function paketHas(tier, key, role) {
    if (!PAKET_CAT) return false;
    var p = PAKET_CAT[tier]; if (!p || !p[key]) return false;
    return p[key][role] === true;
  }
  /* kadaluarsa: toko punya tenggat (planUntil) yang sudah lewat -> diperlakukan BASIC sampai Tower memperpanjang */
  function isExpired(tn) { return !!(tn && tn.planUntil && tn.tier && tn.tier !== 'basic' && Date.now() > Number(tn.planUntil)); }
  function lastPaidTier(tn) { var t = tn && tn.tier; return (t === 'pro' || t === 'plus') ? t : 'basic'; }
  function tierOf(tn) {
    if (isExpired(tn)) return 'basic';
    var t = tn && tn.tier;
    if (t === 'pro') return 'pro';
    return ORDER[t] != null && ORDER[t] >= 1 ? 'plus' : 'basic';
  }
  var ALWAYS_ON = ['wallpaper', 'theme']; /* tampilan dasar: menyala di semua paket */
  /* Penanda tingkat untuk tampilan Tower: PLUS = fitur premium (pantas bayar), sisanya BASIC. Hanya label + urutan, tidak mengubah hak akses. */
  var PLUS_FEATURES = ['barcode', 'stok_scan', 'banyak_usaha', 'admin_usaha', 'properti', 'dashboard', 'analisa', 'audit', 'export_csv', 'arus_kas', 'anggaran', 'rekon', 'neraca', 'pajak_bulanan', 'backup', 'laporan_bulanan', 'gaji', 'gaji_auto', 'ledger', 'instruksi', 'billing_card'];
  function featTier(f) { return PLUS_FEATURES.indexOf(f.key) >= 0 ? 'plus' : 'basic'; }
  var _lockCol = false; /* tampilkan kolom gembok (hanya di layar ubah fitur toko) */
  /* Oneilverse 2: isi pulau kiri/kanan, diatur per toko dari Control Tower (semua menyala bawaan) */
  var ISL_LEFT = [['pl_ai', 'Menu · Tanya AI'], ['pl_chat', 'Menu · Chat global'], ['pl_mutasi', 'Menu · Mutasi'], ['pl_pajak', 'Menu · Pajak'], ['pl_bukubesar', 'Menu · Buku Besar'], ['pl_closing', 'Menu · Closing'], ['pl_tema', 'Menu · Tema'], ['pl_pengaturan', 'Menu · Pengaturan'], ['pl_keluar', 'Menu · Keluar'], ['pl_laba', 'Menu · Laba Produk'],
    ['sl_ai', 'Satelit · Tanya AI'], ['sl_chat', 'Satelit · Chat'], ['sl_mutasi', 'Satelit · Mutasi'], ['sl_bantuan', 'Satelit · Bantuan'], ['sl_pengaturan', 'Satelit · Pengaturan'], ['sl_pajak', 'Satelit · Pajak']];
  var ISL_RIGHT = [['pr_kasir', 'Aksi · Buka Kasir Baru'], ['pr_coa', 'Aksi · Kelola Akun (COA)'], ['pr_stok', 'Aksi · Stok & Closing'], ['pr_gaji', 'Aksi · Laporan Gaji'], ['pr_piutang', 'Aksi · Piutang & Utang'], ['pr_ringkasan', 'Aksi · Ringkasan Usaha'], ['pr_diskon', 'Aksi · Diskon & Promo'], ['pr_aruskas', 'Aksi · Arus Kas & Anggaran'], ['pr_neraca', 'Aksi · Neraca'], ['pr_neracaai', 'Aksi · Neraca AI'], ['pr_grafik', 'Aksi · Grafik'], ['pr_penjelasan', 'Aksi · Penjelasan Laporan'], ['pr_modal', 'Aksi · Perubahan Modal'], ['pr_susut', 'Aksi · Penyusutan Aset'], ['pr_stokhabis', 'Aksi · Stok Habis'], ['pr_harian', 'Aksi · Laporan Harian'], ['pr_pajak', 'Aksi · Laporan Pajak'], ['pr_absensi', 'Aksi · Absensi'], ['pr_properti', 'Aksi · Properti'], ['pr_backup', 'Aksi · Backup & Ekspor'], ['pr_bulanan', 'Aksi · Laporan Bulanan'], ['pr_analisa', 'Aksi · Analisa Keuangan'], ['pr_instruksi', 'Aksi · Instruksi & Pengawasan Admin'], ['pr_fitur', 'Aksi · Fitur Toko'],
    ['sr_keluar', 'Satelit · Keluar']];
  ISL_LEFT.concat(ISL_RIGHT).forEach(function (p) { FEATURES.push({ key: p[0], label: 'Oneilverse 2 · ' + p[1], r: { manager: 'o', owner: 'o' } }); });
  var ISL_G = {
    kiri: [['pl_ai', 'Tanya AI'], ['pl_chat', 'Chat global'], ['pl_mutasi', 'Mutasi'], ['pl_pajak', 'Pajak'], ['pl_bukubesar', 'Buku Besar'], ['pl_closing', 'Closing'], ['pl_tema', 'Tema'], ['pl_pengaturan', 'Pengaturan'], ['pl_keluar', 'Keluar'], ['pl_laba', 'Laba Produk'], ['tutup_hari', 'Tutup Hari']],
    satkiri: [['sl_ai', 'Tanya AI'], ['sl_chat', 'Chat'], ['sl_mutasi', 'Mutasi'], ['sl_bantuan', 'Bantuan'], ['sl_pengaturan', 'Pengaturan'], ['sl_pajak', 'Pajak']],
    kanan: ISL_RIGHT.filter(function (p) { return p[0].indexOf('pr_') === 0; }).map(function (p) { return [p[0], p[1].replace('Aksi · ', '')]; }),
    satkanan: [['clock', 'Jam'], ['weather', 'Suhu / cuaca'], ['rates', 'Kurs'], ['sat_perbarui', 'Perbarui aplikasi'], ['sr_keluar', 'Keluar']]
  };
  var ISL_LK = ISL_LEFT.map(function (p) { return p[0]; }), ISL_RK = ISL_RIGHT.map(function (p) { return p[0]; }).concat(['sat_perbarui', 'clock', 'weather', 'rates']);
  var DEFAULT_ON = ['card_ringkasan', 'card_metode', 'card_target', 'card_stok', 'card_grafik', 'card_transaksi', 'sat_perbarui', 'denyut', 'tutup_hari'].concat(ISL_LK, ISL_RK); /* Oneilverse 2: menyala bawaan, Tower bisa mematikan per toko */
  function defaultFor(key, role, tier) {
    if (DEFAULT_ON.indexOf(key) >= 0) return true;
    if (ALWAYS_ON.indexOf(key) >= 0) return true;
    if (tier === 'basic' || !tier) return false;
    if (tier === 'plus') return PLUS_KEYS.indexOf(key) >= 0 || PLUS_KEYS.indexOf(key + ':' + role) >= 0 || paketHas('plus', key, role);
    if (tier === 'pro') return PLUS_KEYS.indexOf(key) >= 0 || PLUS_KEYS.indexOf(key + ':' + role) >= 0 || paketHas('plus', key, role) || paketHas('pro', key, role);
    return false;
  }
  /* dipakai untuk tombol "terkunci" (gelap, bukan hilang) saat paket sudah habis: apa yang SEHARUSNYA menyala
     kalau paket toko ini belum habis (dibandingkan dengan keadaan sekarang yang sudah dianggap basic). */
  function wouldHaveAtPaidTier(key, role, tn) {
    var f = find(key); if (!f || f.r[role] !== 'o') return false;
    if (!tn || !isExpired(tn)) return false;
    var v = tn.features ? tn.features[key] : undefined;
    if (v && typeof v === 'object' && typeof v[role] === 'boolean') return v[role]; // centangan manual, bukan dari paket
    if (v === true || v === false) return false; // sudah ditangani sebagai centangan manual juga
    return defaultFor(key, role, lastPaidTier(tn));
  }
  function tierDefaults(tier) {
    var out = {};
    FEATURES.forEach(function (f) { if (f.soon) return; ROLES.forEach(function (r) { if (f.r[r] === 'o') { out[f.key] = out[f.key] || {}; out[f.key][r] = defaultFor(f.key, r, tier); } }); });
    return out;
  }
  function legacyValue(f, role, tn) {
    if (tn && tn.isMaster) return true;
    return defaultFor(f.key, role, tierOf(tn));
  }
  function legacyValueOld(f, role, tn) {
    var L = LEGACY[f.key];
    if (L === 'plus') { var t = tn && ORDER[tn.tier] != null ? tn.tier : 'basic'; return ORDER[t] >= ORDER.plus; }
    if (L && typeof L === 'object') return L[role] === true;
    return true;
  }
  var ALIAS = { weather: 'weather_rates', rates: 'weather_rates' };
  var NEW_ON = ['clock', 'weather', 'rates', 'billing_card', 'chat', 'wallpaper'];
  function hasBase(key, role, tn) {
    var f = find(key); if (!f) return false;
    role = role || pageRole();
    var m = f.r[role]; if (!m) return false;
    if (m === 'c') return true;
    if (f.soon) return false;
    if (ALWAYS_ON.indexOf(key) >= 0) return true; /* wallpaper & warna halaman selalu ada */
    tn = tn || tenant();
    var v = tn && tn.features ? tn.features[key] : undefined;
    if (v === undefined && ALIAS[key] && tn && tn.features) v = tn.features[ALIAS[key]];
    if (v === true || v === false) return v;                       // format lama (berlaku untuk semua mode)
    if (v && typeof v === 'object' && typeof v[role] === 'boolean') return v[role];
    return legacyValue(f, role, tn);
  }

  /* ===== OneilStore: katalog sewa fitur =====
     Produk = kumpulan fitur teknis yang dijual satu paket. Harga per bulan (rupiah); tahunan = bayar 10 bulan.
     Sewa aktif disimpan Tower di tenant_ctrl/<toko>.rentals = { <idProduk|idPaket|plus_all>: { until: ms, trial: bool } }.
     Fitur yang sudah aktif sebelum Store (dicentang Tower) tetap aktif: sewa hanya MENAMBAH, tidak pernah mencabut. */
  var SPRODUCTS = [
    { id: 'stok', name: 'Modul Stok', grp: 'Stok & Barang', price: 25000, d: 'Daftar stok, stok masuk, closing, jual dari stok, dan stok untuk Admin', keys: ['stok', 'stok_input', 'stok_closing', 'jual_produk', 'stok_admin'] },
    { id: 'barcode', name: 'Barcode & Scan Stok', grp: 'Stok & Barang', price: 15000, d: 'Scan dengan alat atau kamera, scan stok masuk', keys: ['barcode', 'stok_scan'] },
    { id: 'satuan', name: 'Satuan Ganda', grp: 'Stok & Barang', price: 10000, d: 'Contoh: 1 bal = 100 lembar', keys: ['satuan_ganda'] },
    { id: 'diskon', name: 'Diskon & Promo', grp: 'Transaksi', price: 10000, d: 'Promo otomatis dan diskon manual', keys: ['diskon'] },
    { id: 'struk', name: 'Struk & Bukti', grp: 'Transaksi', price: 10000, d: 'Kirim struk lewat WhatsApp dan foto bukti', keys: ['wa_receipt', 'bukti'] },
    { id: 'ppn', name: 'PPN 12%', grp: 'Transaksi', price: 10000, d: 'Hitung pajak langsung di nota', keys: ['tax'] },
    { id: 'piutang', name: 'Piutang & Utang', grp: 'Keuangan', price: 20000, d: 'DP, bayar sebagian, jatuh tempo, daftar pelanggan dan pemasok', keys: ['piutang'] },
    { id: 'neraca', name: 'Neraca', grp: 'Keuangan', price: 10000, d: 'Harta, utang, dan modal toko', keys: ['neraca'] },
    { id: 'kontrol', name: 'Kontrol Keuangan', grp: 'Keuangan', price: 20000, d: 'Arus kas, anggaran bulanan, rekonsiliasi kas', keys: ['arus_kas', 'anggaran', 'rekon'] },
    { id: 'neraca_ai', name: 'Neraca AI', grp: 'Keuangan', price: 15000, perm: 750000, d: 'Neraca otomatis dari transaksi, bisa dikunci per periode (uji coba)', keys: ['neraca_ai'] },
    { id: 'analisa', name: 'Analisa Keuangan', grp: 'Keuangan', price: 20000, perm: 1000000, d: 'Temuan, saran, margin, dan titik impas dari transaksi toko', keys: ['analisa'] },
    { id: 'grafik', name: 'Grafik Keuangan', grp: 'Keuangan', price: 15000, perm: 750000, d: 'Grafik penjualan, laba, kas, beban, aset dan liabilitas', keys: ['grafik'] },
    { id: 'penjelasan', name: 'Penjelasan Laporan Keuangan', grp: 'Keuangan', price: 15000, perm: 750000, d: 'Angka laporan dijelaskan dengan kalimat sederhana, bisa disalin', keys: ['penjelasan'] },
    { id: 'perubahan_modal', name: 'Perubahan Modal', grp: 'Keuangan', price: 10000, perm: 500000, d: 'Modal awal, tambahan, laba, prive, sampai modal akhir', keys: ['perubahan_modal'] },
    { id: 'penyusutan', name: 'Penyusutan Aset Tetap', grp: 'Keuangan', price: 15000, perm: 750000, d: 'Daftar aset, penyusutan tiap bulan, dan nilai buku', keys: ['penyusutan'] },
    { id: 'stok_habis', name: 'Perkiraan Stok Habis', grp: 'Stok & Barang', price: 10000, perm: 500000, d: 'Produk yang akan habis dan saran jumlah beli', keys: ['stok_habis'] },
    { id: 'harian_wa', name: 'Laporan Harian WhatsApp', grp: 'Laporan', price: 10000, perm: 500000, d: 'Ringkasan penjualan dan laba satu hari, siap kirim lewat WhatsApp', keys: ['harian_wa'] },
    { id: 'pajak', name: 'Pajak Bulanan', grp: 'Keuangan', price: 15000, d: 'Perkiraan PPh Final dan PPN tiap bulan', keys: ['pajak_bulanan'] },
    { id: 'lapbul', name: 'Laporan Bulanan', grp: 'Laporan', price: 10000, d: 'Ringkasan tiap bulan untuk Owner, kirim lewat WhatsApp', keys: ['laporan_bulanan'] },
    { id: 'backup', name: 'Backup & Ekspor', grp: 'Laporan', price: 10000, d: 'Unduh data toko ke Excel dan arsip', keys: ['backup'] },
    { id: 'absensi', name: 'Absensi', grp: 'Operasional', price: 15000, d: 'Catat masuk dan pulang, rekap kehadiran bulanan', keys: ['absensi'] },
    { id: 'properti', name: 'Properti & Kost', grp: 'Operasional', price: 30000, d: 'Unit sewa, penyewa, tagihan bulanan, pengingat WhatsApp', keys: ['properti'] },
    { id: 'usaha', name: 'Banyak Usaha', grp: 'Toko & Akun', price: 20000, d: 'Beberapa usaha dalam satu toko', keys: ['banyak_usaha'] },
    { id: 'admin', name: 'Admin Tambahan', grp: 'Toko & Akun', price: 10000, d: 'Banyak akun Admin dengan PIN sendiri-sendiri', keys: ['admin_usaha'] },
    { id: 'instruksi', name: 'Instruksi & Pengawasan', grp: 'Toko & Akun', price: 10000, d: 'Manager mengawasi dan memberi instruksi ke Admin', keys: ['instruksi'] }
  ];
  var SPACKS = [
    { id: 'pk_laundry', name: 'Paket Laundry', price: 39000, items: ['piutang', 'struk', 'lapbul', 'backup'] },
    { id: 'pk_kos', name: 'Paket Kos & Kontrakan', price: 55000, items: ['properti', 'piutang', 'lapbul', 'backup'] },
    { id: 'pk_klinik', name: 'Paket Klinik & Jasa', price: 59000, items: ['piutang', 'neraca', 'pajak', 'lapbul', 'backup', 'absensi'] },
    { id: 'pk_konveksi', name: 'Paket Konveksi', price: 69000, items: ['stok', 'satuan', 'piutang', 'usaha', 'lapbul', 'backup'] },
    { id: 'pk_minimarket', name: 'Paket Minimarket', price: 79000, items: ['stok', 'barcode', 'satuan', 'diskon', 'struk', 'ppn', 'pajak', 'absensi'] }
  ];
  var SALL = { id: 'plus_all', name: 'Semua Fitur Store', price: 149000 }; /* batas atas: sewa satuan tak perlu melebihi ini */
  var TRIAL_DAYS = 7;
  function sprod(id) { return SPRODUCTS.filter(function (p) { return p.id === id; })[0]; }
  function spack(id) { return SPACKS.filter(function (p) { return p.id === id; })[0]; }
  /* ---- fitur satuan dan bundel (katalog baru) ----
     Id 'f:<kunci fitur>' = satu fitur; 'b:<id>' = bundel buatan Tower (daftar kunci fitur disimpan di katalog dan di data sewa).
     Id lama (stok, barcode, pk_*, plus_all) tetap dikenali supaya sewa yang sudah berjalan tidak putus. */
  var _FL = null;
  function featList() {
    if (_FL) return _FL;
    var rows = FEATURES.filter(function (f) { return !f.soon && !isCore(f) && ALWAYS_ON.indexOf(f.key) < 0; }).map(function (f) {
      var i = f.label.indexOf(':'), nm = i > 0 ? f.label.slice(0, i).trim() : f.label, d = i > 0 ? f.label.slice(i + 1).trim() : '';
      return { id: 'f:' + f.key, key: f.key, name: nm, d: d, full: f.label, keys: [f.key], cat: catOf(f) };
    });
    var seen = {}; rows.forEach(function (r) { seen[r.name] = (seen[r.name] || 0) + 1; });
    rows.forEach(function (r) { if (seen[r.name] > 1) { r.name = r.full; r.d = ''; } });
    var order = {}; CATS.forEach(function (c, i) { order[c.id] = i; });
    var lab = {}; CATS.forEach(function (c) { lab[c.id] = c.label; });
    rows.forEach(function (r) { r.grp = lab[r.cat] || 'Lainnya'; r.ord = order[r.cat] != null ? order[r.cat] : 99; });
    rows = rows.map(function (r, i) { r.i = i; return r; }).sort(function (a, b) { return a.ord - b.ord || a.i - b.i; });
    _FL = rows; return rows;
  }
  function featItem(key) { return featList().filter(function (r) { return r.key === key; })[0]; }
  function bundleItem(id) { var b = ((CAT && CAT.bundles) || []).filter(function (x) { return x.id === id; })[0]; return b ? { id: b.id, name: b.name || 'Bundel', d: b.desc || '', keys: (b.keys || []).slice(), bundle: true } : undefined; }
  function sitem(id) {
    id = String(id);
    if (id === SALL.id) return SALL;
    if (id.indexOf('f:') === 0) return featItem(id.slice(2));
    if (id.indexOf('b:') === 0) return bundleItem(id);
    return sprod(id) || spack(id);
  }

  /* ===== Katalog OneilStore yang diatur Tower =====
     Disimpan di app_meta/store_catalog = { json } (dibaca klien tanpa login, seperti wallpaper dan rollout).
     Bentuk: { v:1, items:{id:{sell,p:{hari,minggu,bulan,tahun,perm}}}, packs:{...}, all:{...}, disc:{min,pct} }.
     Item yang belum ada di katalog memakai harga standar: bulanan = price, tahunan = 10 x bulanan, permanen = perm (jika ada). */
  var PERIODS = [['hari', 'Harian'], ['minggu', 'Mingguan'], ['bulan', 'Bulanan'], ['tahun', 'Tahunan'], ['perm', 'Permanen']];
  var PERM_UNTIL = 4102444800000; /* 1 Jan 2100: sewa permanen tidak pernah habis */
  var CAT_KEY = 'fm_store_cat_v1', CAT = null, CAT_AT = 0;
  function loadCat() { try { var v = JSON.parse(localStorage.getItem(CAT_KEY) || 'null'); CAT = (v && typeof v === 'object') ? v : null; } catch (e) { CAT = null; } }
  loadCat();
  function storeSetCat(c) { CAT = c && typeof c === 'object' ? c : null; try { if (CAT) localStorage.setItem(CAT_KEY, JSON.stringify(CAT)); else localStorage.removeItem(CAT_KEY); } catch (e) {} try { window.dispatchEvent(new CustomEvent('fm:storecat')); } catch (e) {} }
  function fetchCat(cb) {
    try {
      var url = 'https://firestore.googleapis.com/v1/projects/finance-ai-master-byneilverse/databases/(default)/documents/app_meta/store_catalog?key=AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI';
      fetch(url, { cache: 'no-store' }).then(function (r) { return r.status === 404 ? { __none: 1 } : (r.ok ? r.json() : null); }).then(function (d) {
        if (d && d.__none) storeSetCat(null);
        else if (d && d.fields && d.fields.json && d.fields.json.stringValue) { var j = JSON.parse(d.fields.json.stringValue); if (j && typeof j === 'object') storeSetCat(j); }
        CAT_AT = Date.now(); if (cb) cb();
      }).catch(function () { if (cb) cb(); });
    } catch (e) { if (cb) cb(); }
  }
  function catEntry(id) {
    if (!CAT) return null; id = String(id);
    if (id.indexOf('f:') === 0) return (CAT.feats && CAT.feats[id.slice(2)]) || null;
    if (id.indexOf('b:') === 0) return ((CAT.bundles || []).filter(function (b) { return b.id === id; })[0]) || null;
    return null;
  }
  /* Katalog bawaan KOSONG: fitur baru dijual setelah Tower mengisinya.
     harga item pada satu periode; null = periode itu tidak dijual. Status gratis: klien memilih sendiri, tanpa biaya. */
  function sfree(id) { var e = catEntry(id); return !!(e && e.sell !== false && e.free === true); }
  function sprice(id, per) {
    var e = catEntry(id); if (!e || !sitem(id) || e.sell === false || e.free === true) return null;
    if (e.p && typeof e.p === 'object') { var v = Number(e.p[per]); return v > 0 ? Math.round(v) : null; }
    return null;
  }
  function ssold(id) {
    var e = catEntry(id); if (!e || e.sell === false) return false;
    return e.free === true || PERIODS.some(function (x) { return sprice(id, x[0]) != null; });
  }
  function sdisc() { var d = (CAT && CAT.disc) || {}; var mn = parseInt(d.min, 10), pc = Number(d.pct); return { min: mn >= 2 ? mn : 3, pct: (CAT && CAT.disc) ? (pc >= 0 && pc <= 50 ? pc : 0) : 0 }; }
  /* harga gabungan beberapa fitur: jumlah harga satuan, dikurangi diskon bila jumlah fitur mencapai batas.
     Fitur gratis hanya boleh digabung dengan fitur gratis (periode 'gratis'); tidak dicampur dengan yang berbayar. */
  function squote(ids, per) {
    if (per === 'gratis') { var okf = ids.length > 0 && ids.every(sfree); return { ok: okf, sub: 0, pct: 0, save: 0, total: 0 }; }
    var sub = 0, ok = ids.length > 0;
    ids.forEach(function (id) { var v = sprice(id, per); if (v == null || sfree(id)) ok = false; else sub += v; });
    var d = sdisc(), pct = (ids.length >= d.min && d.pct > 0) ? d.pct : 0, save = Math.round(sub * pct / 100 / 1000) * 1000;
    return { ok: ok, sub: sub, pct: pct, save: save, total: sub - save };
  }
  function untilForPeriod(existing, period) {
    if (existing && existing.perm) return PERM_UNTIL;
    if (period === 'perm' || period === 'gratis') return PERM_UNTIL;
    var now = Date.now(), base = (existing && Number(existing.until) > now) ? Number(existing.until) : now, d = new Date(base);
    if (period === 'coba') d.setDate(d.getDate() + TRIAL_DAYS);
    else if (period === 'hari') d.setDate(d.getDate() + 1);
    else if (period === 'minggu') d.setDate(d.getDate() + 7);
    else if (period === 'tahun') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d.getTime();
  }
  function packKeys(id) {
    id = String(id);
    if (id.indexOf('f:') === 0) return featItem(id.slice(2)) ? [id.slice(2)] : [];
    if (id.indexOf('b:') === 0) { var bi = bundleItem(id); return bi ? bi.keys.filter(function (k) { return !!find(k); }) : []; }
    if (id === SALL.id) return STORE_KEYS.slice();
    var pk = spack(id), pr = sprod(id), out = [];
    if (pk) pk.items.forEach(function (i) { var x = sprod(i); if (x) out = out.concat(x.keys); });
    else if (pr) out = pr.keys.slice();
    return out;
  }
  /* Saat halaman baru dibuka, data Tower (TENANT_CTRL) belum sampai padahal applyDom() sudah jalan. Karena itu sewa terakhir
     disimpan di cache lokal (ditulis ctrl.js) dan dipakai sampai data Tower datang. */
  function rentCacheKey() { var t = tenant(); return 'fm_rentals_' + (t && t.id ? t.id : ''); }
  function rentCached() { try { var v = JSON.parse(localStorage.getItem(rentCacheKey()) || '{}'); return (v && typeof v === 'object') ? v : {}; } catch (e) { return {}; } }
  function rentals() {
    var c = window.TENANT_CTRL;
    if (c) return (c.rentals && typeof c.rentals === 'object') ? c.rentals : {};
    return rentCached();
  }
  function rentalActive(id, now) { var e = rentals()[id]; return !!(e && Number(e.until) > (now || Date.now())); }
  function rentSig() { var R = rentals(), now = Date.now(); return Object.keys(R).filter(function (k) { return rentalActive(k, now); }).sort().join(','); }
  var LOADED_SIG = null;
  function rentedKey(key) {
    var R = rentals(), now = Date.now();
    for (var id in R) { if (!Object.prototype.hasOwnProperty.call(R, id)) continue; if (rentalActive(id, now)) { var ks = (R[id] && Array.isArray(R[id].keys)) ? R[id].keys : packKeys(id); if (ks.indexOf(key) >= 0) return true; } }
    return false;
  }
  function has(key, role, tn) {
    if (hasBase(key, role, tn)) return true;
    var f = find(key); if (!f || f.soon) return false;
    role = role || pageRole();
    return !!f.r[role] && rentedKey(key);
  }

  function activeList(role, tn) { role = role || pageRole(); return FEATURES.filter(function (f) { return f.r[role] && !f.soon && has(f.key, role, tn); }); }

  /* ---- tabel centang untuk Tower: prefix 'nt' (toko baru) atau 'ts' (ubah toko) ---- */
  var CATS = [
    { id: 'akun', label: 'Toko & Akun', keys: ['admin_usaha', 'banyak_usaha', 'instruksi'] },
    { id: 'trx', label: 'Transaksi', keys: ['mutasi_wa', 'wa_receipt', 'bukti', 'diskon', 'tax'] },
    { id: 'stok', label: 'Stok & Barang', keys: ['stok', 'stok_input', 'stok_closing', 'stok_admin', 'stok_scan', 'jual_produk', 'satuan_ganda', 'barcode', 'stok_habis'] },
    { id: 'keu', label: 'Keuangan', keys: ['ledger', 'arus_kas', 'anggaran', 'rekon', 'neraca', 'neraca_ai', 'penjelasan', 'perubahan_modal', 'penyusutan', 'pajak_bulanan', 'piutang', 'gaji', 'gaji_auto'] },
    { id: 'lap', label: 'Laporan & Analisa', keys: ['dashboard', 'analisa', 'ai_asisten', 'card_ringkasan', 'card_metode', 'card_target', 'card_stok', 'card_grafik', 'card_transaksi', 'denyut', 'tutup_hari', 'grafik', 'harian_wa', 'audit', 'export_csv', 'laporan_bulanan', 'backup'] },
    { id: 'ops', label: 'Operasional', keys: ['absensi', 'properti', 'offline_penuh'] },
    { id: 'tamp', label: 'Tampilan & Pemanis', keys: ['wallpaper', 'theme', 'bahasa', 'billing_card', 'chat'] },
    { id: 'pkr', label: 'Oneilverse 2 · Pulau KIRI (menu & satelit)', keys: ISL_LK },
    { id: 'pkn', label: 'Oneilverse 2 · Pulau KANAN (aksi cepat & satelit)', keys: ISL_RK }
  ];

  /* Penempatan fitur untuk tampilan Tower (hanya label + pengelompokan, tidak mengubah hak akses):
     INTI = terkunci merah; TAMBAHAN = fitur standar yang diberikan; STORE = layak disewa satuan di OneilStore. */
  var STORE_KEYS = ['wa_receipt', 'bukti', 'diskon', 'tax', 'admin_usaha', 'banyak_usaha', 'instruksi', 'stok', 'stok_input', 'stok_closing', 'stok_admin', 'stok_scan', 'jual_produk', 'satuan_ganda', 'barcode', 'arus_kas', 'anggaran', 'rekon', 'neraca', 'neraca_ai', 'analisa', 'grafik', 'penjelasan', 'perubahan_modal', 'penyusutan', 'stok_habis', 'harian_wa', 'pajak_bulanan', 'piutang', 'laporan_bulanan', 'backup', 'absensi', 'properti'];
  function isStore(f) { return STORE_KEYS.indexOf(f.key) >= 0; }
  function isCore(f) { return Object.keys(f.r).some(function (r) { return f.r[r] === 'c'; }); }
  function catOf(f) { for (var i = 0; i < CATS.length; i++) if (CATS[i].keys.indexOf(f.key) >= 0) return CATS[i].id; return 'lain'; }
  var BSM = 'padding:3px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:transparent;color:inherit;font-size:10.5px;cursor:pointer;margin-left:4px';
  function cnt(prefix) {
    var all = document.querySelectorAll('input[id^="' + prefix + '-f-"]'), per = {}, tot = 0;
    [].forEach.call(all, function (el) {
      if (el.disabled && el.style.opacity) return;
      var c = el.getAttribute('data-cat') || 'lain'; per[c] = per[c] || { on: 0, n: 0 };
      if (el.disabled) return;
      per[c].n++; if (el.checked) { per[c].on++; tot++; }
    });
    [].forEach.call(document.querySelectorAll('[id^="' + prefix + '-cnt-"]'), function (sp) {
      var c = sp.id.slice((prefix + '-cnt-').length), x = per[c] || { on: 0, n: 0 };
      sp.textContent = x.on + '/' + x.n;
    });
    var t = document.getElementById(prefix + '-cnt-all'); if (t) t.textContent = tot + ' fitur tambahan dipilih';
  }
  function cariFitur(prefix, q) {
    q = String(q || '').toLowerCase().trim();
    var box = document.getElementById(prefix + '-ts-features') || document, shown = 0;
    [].forEach.call(document.querySelectorAll('details[data-fmq="' + prefix + '"]'), function (d) {
      var any = 0;
      [].forEach.call(d.querySelectorAll('tr[data-q]'), function (tr) { var ok = !q || tr.getAttribute('data-q').indexOf(q) >= 0; tr.style.display = ok ? '' : 'none'; if (ok) any++; });
      shown += any; d.style.display = (!q || any) ? '' : 'none'; if (q && any) d.open = true;
    });
    var n = document.getElementById(prefix + '-qn'); if (n) { n.style.display = q ? '' : 'none'; n.textContent = q ? (shown ? shown + ' fitur cocok' : 'Tidak ada fitur yang cocok. Nama usaha ada di bagian Toko & Akun.') : ''; }
  }
  function setCat(prefix, cat, on) {
    [].forEach.call(document.querySelectorAll('input[id^="' + prefix + '-f-"][data-cat="' + cat + '"]'), function (el) { if (!el.disabled) el.checked = !!on; });
    cnt(prefix);
  }
  function tierTag(f) {
    if (f.soon || isCore(f)) return '';
    if (isStore(f)) return ' <span style="font-size:9px;font-weight:900;padding:1px 6px;border-radius:99px;background:rgba(168,85,247,.2);color:#c084fc;vertical-align:middle">STORE</span>';
    return featTier(f) === 'plus'
      ? ' <span style="font-size:9px;font-weight:900;padding:1px 6px;border-radius:99px;background:rgba(245,158,11,.18);color:#fbbf24;vertical-align:middle">PLUS</span>'
      : ' <span style="font-size:9px;font-weight:900;padding:1px 6px;border-radius:99px;background:rgba(34,197,94,.16);color:#4ade80;vertical-align:middle">BASIC</span>';
  }
  function rowHtml(prefix, f, isNew, editable, tn, cat) {
    var h = '<tr data-q="' + String(f.label || '').toLowerCase().replace(/"/g, '') + '" style="border-top:1px solid rgba(255,255,255,.08);' + (f.soon ? 'opacity:.5' : '') + '"><td style="padding:5px 6px">' + f.label + tierTag(f) + (f.soon ? ' <i>(segera)</i>' : '') + '</td>';
    ROLES.forEach(function (r) {
      var m = f.r[r], cell;
      if (m === 'c') cell = '<span title="Fitur inti: terkunci, tidak bisa dicabut" style="display:inline-flex;width:18px;height:18px;border-radius:5px;background:#ef4444;color:#fff;font-weight:900;font-size:13px;line-height:18px;align-items:center;justify-content:center">✓</span>';
      else if (!m) cell = '<input type="checkbox" disabled style="width:16px;height:16px;opacity:.25" title="Belum tersedia di mode ini">';
      else cell = '<input type="checkbox" id="' + prefix + '-f-' + f.key + '-' + r + '" data-cat="' + cat + '" onchange="FM_PLANS.cnt(\'' + prefix + '\')" ' + (((isNew ? defaultFor(f.key, r, 'basic') : has(f.key, r, tn))) ? 'checked ' : '') + ((f.soon || editable === false) ? 'disabled ' : '') + 'style="width:16px;height:16px;accent-color:#22c55e">';
      h += '<td style="text-align:center;padding:5px;width:64px">' + cell + '</td>';
    });
    if (_lockCol) {
      if (!f.soon && !isCore(f)) h += '<td style="text-align:center;padding:5px;width:54px"><input type="checkbox" id="' + prefix + '-lock-' + f.key + '" ' + ((tn && tn.featureLocks && tn.featureLocks[f.key]) ? 'checked ' : '') + (editable === false ? 'disabled ' : '') + 'title="Gembok: fitur ini tetap ada walau toko dikembalikan ke Basic" style="width:16px;height:16px;accent-color:#f59e0b"></td>';
      else h += '<td></td>';
    }
    return h + '</tr>';
  }
  function tableHtml(rows) {
    var th = 'text-align:center;padding:3px 5px;font-weight:800;white-space:nowrap';
    return '<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr><th style="text-align:left;padding:3px 6px;opacity:.6;font-weight:700">Fitur</th>' + ROLES.map(function (r) { return '<th style="' + th + '">' + RLABEL[r] + '</th>'; }).join('') + (_lockCol ? '<th style="' + th + '" title="Gembok: fitur tetap ada walau balik ke Basic">🔒</th>' : '') + '</tr></thead><tbody>' + rows + '</tbody></table>';
  }
  function checklistHtml(prefix, features, editable, tnFull) {
    var tn = tnFull || { features: features || null }, isNew = !features;
    _lockCol = (prefix === 'ts'); /* kolom gembok hanya saat mengubah fitur toko yang sudah ada */
    var box = 'border:1px solid rgba(255,255,255,.1);border-radius:12px;margin-bottom:8px;overflow:hidden';
    var sm = 'padding:8px 10px;cursor:pointer;font-weight:800;font-size:12.5px;display:flex;align-items:center;gap:8px;list-style:none';
    var h = '<div style="font-weight:800;margin-bottom:2px">Fitur toko</div>' +
      '<div style="opacity:.65;margin-bottom:6px">Merah = fitur inti (terkunci). Hijau = bebas dicentang atau dicabut; yang tidak dicentang hilang dari tampilan klien. Penanda <b style="color:#4ade80">BASIC</b>/<b style="color:#fbbf24">PLUS</b> hanya pembeda tingkat.' + (_lockCol ? ' Kolom <b>🔒</b> = gembok: fitur yang digembok tetap ada walau toko dikembalikan ke Basic.' : '') + '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:6px"><span style="opacity:.65;font-size:11px">Template cepat:</span><span id="' + prefix + '-presets" style="display:contents">' + presetButtons(prefix) + '</span></div>' +
      '<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><b id="' + prefix + '-cnt-all" style="font-size:11.5px"></b><span style="flex:1"></span><button type="button" onclick="FM_PLANS.setAll(\'' + prefix + '\',true);FM_PLANS.cnt(\'' + prefix + '\')" style="' + BSM + '">Centang semua</button><button type="button" onclick="FM_PLANS.setAll(\'' + prefix + '\',false);FM_PLANS.cnt(\'' + prefix + '\')" style="' + BSM + '">Kosongkan semua</button></div>';
    var core = FEATURES.filter(function (f) { return !f.soon && isCore(f); });
    /* kotak cari: ketik sebagian nama fitur, baris lain disembunyikan */
    h += '<div style="margin:2px 0 10px"><input id="' + prefix + '-q" type="search" placeholder="Cari fitur (mis. usaha, neraca, stok)" oninput="FM_PLANS.cariFitur(\'' + prefix + '\',this.value)" style="width:100%;box-sizing:border-box;padding:8px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:inherit;font-size:12.5px;outline:none"><div id="' + prefix + '-qn" style="font-size:11px;opacity:.65;margin-top:4px;display:none"></div></div>';
    var cats = CATS.concat([{ id: 'lain', label: 'Lainnya', keys: [] }]);
    cats.forEach(function (c) {
      var fs = FEATURES.filter(function (f) { return !f.soon && !isCore(f) && catOf(f) === c.id; });
      if (!fs.length) return;
      fs.sort(function (a, b) { return (featTier(a) === 'plus' ? 1 : 0) - (featTier(b) === 'plus' ? 1 : 0); }); /* BASIC dulu, PLUS belakangan */
      h += '<details open data-fmq="' + prefix + '" style="' + box + '"><summary style="' + sm + '"><span>' + c.label + '</span><span id="' + prefix + '-cnt-' + c.id + '" style="opacity:.7;font-weight:700;font-size:11px"></span><span style="flex:1"></span>' + (editable === false ? '' : '<button type="button" onclick="event.preventDefault();FM_PLANS.setCat(\'' + prefix + '\',\'' + c.id + '\',true)" style="' + BSM + '">Centang</button><button type="button" onclick="event.preventDefault();FM_PLANS.setCat(\'' + prefix + '\',\'' + c.id + '\',false)" style="' + BSM + '">Kosongkan</button>') + '</summary><div style="padding:2px 8px 8px">' + tableHtml(fs.map(function (f) { return rowHtml(prefix, f, isNew, editable, tn, c.id); }).join('')) + '<div id="' + prefix + '-x-' + c.id + '"></div></div></details>';
    });
    h += '<details data-fmq="' + prefix + '" style="' + box + ';border-color:rgba(239,68,68,.45)"><summary style="' + sm + '"><span style="display:inline-block;width:12px;height:12px;border-radius:4px;background:#ef4444"></span>Fitur Inti <span style="opacity:.6;font-weight:600">· terkunci · ' + core.length + ' fitur</span></summary><div style="padding:2px 8px 8px">' + tableHtml(core.map(function (f) { return rowHtml(prefix, f, isNew, editable, tn, 'inti'); }).join('')) + '</div></details>';
    var soon = FEATURES.filter(function (f) { return f.soon; });
    if (soon.length) h += '<details style="' + box + ';opacity:.7"><summary style="' + sm + '">Segera hadir <span style="opacity:.6;font-weight:600">· ' + soon.length + ' fitur</span></summary><div style="padding:2px 8px 8px">' + tableHtml(soon.map(function (f) { return rowHtml(prefix, f, isNew, editable, tn, 'soon'); }).join('')) + '</div></details>';
    setTimeout(function () { cnt(prefix); }, 0);
    return h;
  }
  var PRESETS = {
    basic: { label: 'Paket Basic', keys: [] },
    plus: { label: 'Paket Plus', keys: PLUS_KEYS },
    warung: { label: 'Warung / Kafe', keys: ['laporan_bulanan', 'backup', 'stok', 'stok_input:manager', 'stok_closing:manager', 'bukti', 'wa_receipt', 'mutasi_wa', 'clock'] },
    toko: { label: 'Toko Retail', keys: ['laporan_bulanan', 'backup', 'stok', 'stok_input:manager', 'stok_closing:manager', 'bukti', 'wa_receipt', 'mutasi_wa', 'ledger', 'coa', 'export_csv', 'clock'] },
    properti: { label: 'Properti / Kost / Sewa', keys: ['properti', 'laporan_bulanan', 'backup', 'offline_penuh', 'absensi', 'pajak_bulanan', 'neraca', 'arus_kas', 'anggaran', 'rekon', 'piutang', 'gaji', 'ledger', 'coa', 'dashboard', 'bukti', 'wa_receipt', 'mutasi_wa', 'export_csv', 'audit'] },
    jasa: { label: 'Jasa / Klinik', keys: ['laporan_bulanan', 'backup', 'offline_penuh', 'absensi', 'pajak_bulanan', 'neraca', 'arus_kas', 'anggaran', 'rekon',  'piutang','stok', 'stok_input:manager', 'stok_closing:manager', 'ledger', 'coa', 'tax', 'analisa', 'gaji', 'gaji_auto', 'audit', 'export_csv', 'mutasi_wa'] },
    umum: { label: 'Usaha Umum', keys: ['laporan_bulanan', 'backup', 'ledger', 'coa', 'dashboard', 'mutasi_wa', 'export_csv', 'clock', 'bukti'] },
    minimarket: { label: 'Minimarket', keys: ['stok_admin', 'stok_scan', 'laporan_bulanan', 'backup', 'offline_penuh', 'absensi', 'pajak_bulanan', 'neraca', 'arus_kas', 'anggaran', 'rekon', 'diskon', 'satuan_ganda', 'barcode', 'piutang', 'stok', 'stok_input:manager', 'stok_closing:manager', 'jual_produk', 'bukti', 'wa_receipt', 'mutasi_wa', 'ledger', 'coa', 'tax', 'dashboard', 'analisa', 'audit', 'export_csv', 'gaji', 'gaji_auto', 'instruksi', 'clock'] },
    konveksi: { label: 'Konveksi / Jahit', keys: ['stok_admin', 'stok_scan', 'laporan_bulanan', 'backup', 'offline_penuh', 'absensi', 'pajak_bulanan', 'neraca', 'arus_kas', 'anggaran', 'rekon', 'satuan_ganda', 'piutang', 'stok', 'stok_input:manager', 'stok_closing:manager', 'banyak_usaha', 'gaji', 'gaji_auto', 'ledger', 'coa', 'dashboard', 'analisa', 'audit', 'export_csv', 'mutasi_wa', 'bukti', 'instruksi'] },
    kafe: { label: 'Kafe & Resto', keys: ['laporan_bulanan', 'backup', 'offline_penuh', 'absensi', 'pajak_bulanan', 'neraca', 'arus_kas', 'anggaran', 'rekon', 'diskon', 'stok', 'stok_input:manager', 'stok_closing:manager', 'jual_produk', 'bukti', 'wa_receipt', 'mutasi_wa', 'dashboard', 'tax', 'gaji', 'clock', 'ledger'] },
    laundry: { label: 'Laundry', keys: ['jual_produk', 'laporan_bulanan', 'backup', 'offline_penuh', 'absensi', 'stok', 'stok_input:manager', 'ledger', 'gaji', 'wa_receipt', 'mutasi_wa', 'bukti', 'dashboard', 'export_csv'] },
    salon: { label: 'Salon & Barbershop', keys: ['laporan_bulanan', 'backup', 'offline_penuh', 'absensi', 'diskon', 'jual_produk', 'stok', 'stok_input:manager', 'gaji', 'gaji_auto', 'wa_receipt', 'dashboard', 'mutasi_wa', 'ledger'] },
    bengkel: { label: 'Bengkel', keys: ['stok_admin', 'stok_scan', 'laporan_bulanan', 'backup', 'offline_penuh', 'absensi', 'pajak_bulanan', 'neraca', 'arus_kas', 'anggaran', 'rekon', 'barcode', 'piutang', 'stok', 'stok_input:manager', 'stok_closing:manager', 'jual_produk', 'gaji', 'wa_receipt', 'ledger', 'coa', 'dashboard', 'bukti', 'mutasi_wa', 'export_csv'] },
    lengkap: { label: 'Lengkap', keys: null }
  };
  /* paket buatan sendiri (disimpan di browser Tower dan, bila ada, di provider_settings/plan_presets) */
  var CUSTOM = {};
  try { CUSTOM = JSON.parse(localStorage.getItem('fm_plan_presets') || '{}') || {}; } catch (e) { CUSTOM = {}; }
  function saveCustom() {
    try { localStorage.setItem('fm_plan_presets', JSON.stringify(CUSTOM)); } catch (e) {}
    try { if (typeof db !== 'undefined' && db) db.collection('provider_settings').doc('plan_presets').set({ list: CUSTOM }); } catch (e) {}
  }
  try { if (!/provider\.html$/i.test(location.pathname) === false && typeof db !== 'undefined' && db) db.collection('provider_settings').doc('plan_presets').get().then(function (d) { if (d.exists && d.data().list) { CUSTOM = d.data().list; try { localStorage.setItem('fm_plan_presets', JSON.stringify(CUSTOM)); } catch (e) {} } }).catch(function () {}); } catch (e) {}
  function applyPreset(prefix, name) {
    var cu = name.indexOf('custom:') === 0 ? CUSTOM[name.slice(7)] : null, pr = PRESETS[name];
    if (!pr && !cu) return;
    FEATURES.forEach(function (f) {
      if (f.soon) return;
      ROLES.forEach(function (r) {
        if (f.r[r] !== 'o') return;
        var el = document.getElementById(prefix + '-f-' + f.key + '-' + r);
        if (!el || el.disabled) return;
        if (cu) el.checked = !!cu.checks[f.key + ':' + r];
        else el.checked = !pr.keys || pr.keys.indexOf(f.key) >= 0 || pr.keys.indexOf(f.key + ':' + r) >= 0;
      });
    });
    cnt(prefix);
  }
  function saveAsPreset(prefix) {
    var name = (window.prompt ? window.prompt('Nama paket baru (mis. Basic Konveksi):', '') : '') || '';
    name = name.trim(); if (!name) return;
    var checks = {};
    FEATURES.forEach(function (f) { ROLES.forEach(function (r) { if (f.r[r] !== 'o') return; var el = document.getElementById(prefix + '-f-' + f.key + '-' + r); if (el) checks[f.key + ':' + r] = !!el.checked; }); });
    CUSTOM[name] = { label: name, checks: checks }; saveCustom();
    var box = document.getElementById(prefix + '-presets'); if (box) box.innerHTML = presetButtons(prefix);
  }
  function deletePreset(prefix, name) {
    if (!window.confirm('Hapus paket "' + name + '"?')) return;
    delete CUSTOM[name]; saveCustom();
    var box = document.getElementById(prefix + '-presets'); if (box) box.innerHTML = presetButtons(prefix);
  }
  function presetButtons(prefix) {
    var st = 'padding:4px 10px;border-radius:8px;font-size:11px;color:inherit;';
    var h = Object.keys(PRESETS).map(function (k) { return '<button type="button" onclick="FM_PLANS.applyPreset(\'' + prefix + '\',\'' + k + '\')" style="' + st + 'border:1px solid rgba(34,197,94,.45);background:rgba(34,197,94,.10)">' + PRESETS[k].label + '</button>'; }).join('');
    h += Object.keys(CUSTOM).map(function (k) { var e = k.replace(/[&<>"']/g, ''); return '<span style="display:inline-flex;gap:2px"><button type="button" onclick="FM_PLANS.applyPreset(\'' + prefix + '\',\'custom:' + e + '\')" style="' + st + 'border:1px solid rgba(59,130,246,.55);background:rgba(59,130,246,.12)">' + e + '</button><button type="button" title="Hapus paket" onclick="FM_PLANS.deletePreset(\'' + prefix + '\',\'' + e + '\')" style="' + st + 'border:1px solid rgba(244,63,94,.4);background:transparent;padding:4px 7px">×</button></span>'; }).join('');
    h += '<button type="button" onclick="FM_PLANS.saveAsPreset(\'' + prefix + '\')" style="' + st + 'border:1px dashed rgba(255,255,255,.4);background:transparent">+ Simpan susunan ini sebagai paket</button>';
    return h;
  }
  function setAll(prefix, on) {
    FEATURES.forEach(function (f) { if (f.soon) return; ROLES.forEach(function (r) { if (f.r[r] === 'o') { var el = document.getElementById(prefix + '-f-' + f.key + '-' + r); if (el && !el.disabled) el.checked = !!on; } }); });
  }
  // hasil centang -> { key: { kasir:bool, manager:bool, owner:bool } } (hanya fitur tambahan yang sudah tersedia)
  /* isi centang dari fitur toko lain (tn) — dipakai "Salin Fitur dari Toko Lain" */
  function fillFrom(prefix, tn) {
    FEATURES.forEach(function (f) { if (f.soon) return; ROLES.forEach(function (r) { if (f.r[r] !== 'o') return; var el = document.getElementById(prefix + '-f-' + f.key + '-' + r); if (el && !el.disabled) el.checked = !!has(f.key, r, tn); }); });
  }
  function readChecklist(prefix) {
    var out = {};
    FEATURES.forEach(function (f) {
      if (f.soon) return;
      ROLES.forEach(function (r) {
        if (f.r[r] !== 'o') return;
        var el = document.getElementById(prefix + '-f-' + f.key + '-' + r);
        if (el) { out[f.key] = out[f.key] || {}; out[f.key][r] = !!el.checked; }
      });
    });
    return out;
  }
  /* gembok: baca centang kunci dari tabel fitur Tower */
  function readLocks(prefix) {
    var out = {};
    FEATURES.forEach(function (f) { if (f.soon || isCore(f)) return; var el = document.getElementById(prefix + '-lock-' + f.key); if (el && el.checked) out[f.key] = true; });
    return out;
  }
  /* terapkan bawaan paket TAPI pertahankan fitur yang digembok (dipakai saat toko dikembalikan ke Basic/Plus) */
  function applyTierLocked(tn, tier) {
    var def = tierDefaults(tier), locks = (tn && tn.featureLocks) || {};
    Object.keys(locks).forEach(function (key) {
      if (!locks[key]) return;
      var f = find(key); if (!f) return;
      ROLES.forEach(function (r) { if (f.r[r] === 'o') { def[key] = def[key] || {}; def[key][r] = !!has(key, r, tn); } });
    });
    return def;
  }

  /* ---- sembunyikan fitur yang tidak aktif (dijalankan sebelum tampilan dirakit) ---- */
  function cardOf(el) { return el ? (el.closest('.ios-glass') || (el.parentElement && el.parentElement.parentElement)) : null; }
  function hide(el) { if (el) el.style.setProperty('display', 'none', 'important'); }
  function drop(sel) { [].slice.call(document.querySelectorAll(sel)).forEach(function (b) { if (b.parentNode) b.parentNode.removeChild(b); }); }
  var LOCK_MSG = 'Fitur ini mati karena paket toko sudah habis waktunya. Hubungi penyedia aplikasi untuk memperpanjang paket.';
  var _lockStyleDone = false;
  function lockEls(sel) {
    if (!_lockStyleDone) {
      _lockStyleDone = true;
      var s = document.createElement('style'); s.id = 'fm-locked-style';
      s.textContent = '.fm-locked-fitur{opacity:.4!important;filter:grayscale(.65);cursor:not-allowed!important}';
      document.head.appendChild(s);
    }
    [].slice.call(document.querySelectorAll(sel)).forEach(function (b) {
      if (b.getAttribute('data-fm-locked')) return;
      b.setAttribute('data-fm-locked', '1');
      b.classList.add('fm-locked-fitur');
      b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); alert(LOCK_MSG); }, true);
    });
  }
  /* sembunyikan total (fitur memang tidak termasuk paket apapun) ATAU kunci gelap saja (fitur pernah aktif, paket baru habis) */
  function dropOrLock(sel, key, role) {
    role = role || pageRole();
    var tn = tenant();
    if (wouldHaveAtPaidTier(key, role, tn)) lockEls(sel); else drop(sel);
  }
  function applyDom() {
    var role = pageRole();
    try { localStorage.setItem('fm_offline_full', has('offline_penuh', role) ? '1' : '0'); } catch (e) {}
    if (!has('tax', role)) { dropOrLock('button[onclick*="openModal(\'tax\')"]', 'tax', role); hide(cardOf(document.getElementById('stat-total-pajak-sumbang'))); }
    if (!has('coa', role)) dropOrLock('button[onclick*="openModal(\'coa_mgmt\')"]', 'coa', role);
    if (!has('wallpaper', role)) { try { document.documentElement.style.removeProperty('--fm-wp'); } catch (e) {} }
    if (!has('stok', role)) dropOrLock('button[onclick*="FM_STOK"]', 'stok', role);
    if (!has('gaji', role)) dropOrLock('button[onclick*="FM_GAJI"]', 'gaji', role);
    if (!has('diskon', role)) dropOrLock('button[onclick*="FM_PROMO"]', 'diskon', role);
    if (!has('laporan_bulanan', role)) dropOrLock('button[onclick*="FM_LAPBUL"]', 'laporan_bulanan', role);
    if (!has('backup', role)) dropOrLock('button[onclick*="FM_BACKUP"]', 'backup', role);
    if (!has('absensi', role)) dropOrLock('button[onclick*="FM_ABS"]', 'absensi', role);
    if (!has('properti', role)) dropOrLock('button[onclick*="FM_PROP"]', 'properti', role);
    if (!has('pajak_bulanan', role)) dropOrLock('button[onclick*="FM_PAJAK"]', 'pajak_bulanan', role);
    if (!has('neraca', role)) dropOrLock('button[onclick*="FM_NERACA."]', 'neraca', role);
    if (!has('neraca_ai', role)) dropOrLock('button[onclick*="FM_NAI"]', 'neraca_ai', role);
    if (!has('grafik', role)) dropOrLock('button[onclick*="FM_GRAFIK"]', 'grafik', role);
    if (!has('penjelasan', role)) dropOrLock('button[onclick*="FM_PENJ"]', 'penjelasan', role);
    if (!has('perubahan_modal', role)) dropOrLock('button[onclick*="FM_MODAL"]', 'perubahan_modal', role);
    if (!has('penyusutan', role)) dropOrLock('button[onclick*="FM_ASET"]', 'penyusutan', role);
    if (!has('stok_habis', role)) dropOrLock('button[onclick*="FM_STOKHABIS"]', 'stok_habis', role);
    if (!has('harian_wa', role)) dropOrLock('button[onclick*="FM_HARIAN"]', 'harian_wa', role);
    if (!has('arus_kas', role) && !has('anggaran', role) && !has('rekon', role)) dropOrLock('button[onclick*="FM_KAS"]', 'arus_kas', role);
    if (!has('banyak_usaha', role)) dropOrLock('button[onclick*="FM_USAHA_SUM"]', 'banyak_usaha', role);
    if (!has('admin_usaha', role)) dropOrLock('button[onclick*="FM_ADMINS"]', 'admin_usaha', role);
    if (!has('piutang', role)) dropOrLock('button[onclick*="FM_PIU"]', 'piutang', role);
    if (!has('ledger', role)) dropOrLock('button[onclick*="openModal(\'ledger\')"]', 'ledger', role);
    if (!has('audit', role)) dropOrLock('button[onclick*="openModal(\'audit_trail\')"]', 'audit', role);
    if (!has('export_csv', role)) dropOrLock('button[onclick*="exportCSV"], button[onclick*="FM_LAPORAN"]', 'export_csv', role);
    if (!has('instruksi', role)) dropOrLock('section[data-fm-panel="instruksi"]', 'instruksi', role);
    if (!has('analisa', role)) dropOrLock('[data-fm-panel="analisa"]', 'analisa', role);
    if (!has('wa_receipt', role)) hide(document.getElementById('btn-wa-receipt'));
    if (!has('clock', role)) { var c = document.getElementById('realtime-clock-display'); if (c) hide(c.parentElement); }
    if (!has('bukti', role)) {
      [].slice.call(document.querySelectorAll('label')).forEach(function (l) { if (/Bukti Struk/i.test(l.textContent) && l.parentElement) hide(l.parentElement); });
    }
  }
  try { LOADED_SIG = rentSig(); } catch (e) { LOADED_SIG = ''; }
  if (!/provider\.html$/i.test(location.pathname)) {
    applyDom();
    try { fetchPaketCat(function () { applyDom(); }); } catch (e) {}
  }

  /* ---- jendela "Fitur Toko" (daftar yang aktif di mode ini) ---- */
  function openModal() {
    var m = document.getElementById('fm-plans-modal');
    if (!m) {
      m = document.createElement('div'); m.id = 'fm-plans-modal';
      m.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482500;background:rgba(15,23,42,.45);align-items:center;justify-content:center;padding:14px;font-family:"Plus Jakarta Sans",-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif';
      var useDarkBase = document.documentElement.getAttribute('data-fm-native') === 'dark';
      var inv = useDarkBase ? 'filter:invert(1) hue-rotate(180deg);' : '';
      m.innerHTML = '<div style="width:100%;max-width:560px;max-height:90vh;overflow:auto;background:#ffffff;color:#0f172a;border:1px solid #e2e8f0;border-radius:22px;box-shadow:0 24px 60px rgba(15,23,42,.28);padding:20px;' + inv + '"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding-bottom:10px;border-bottom:1px solid #e2e8f0"><div><div style="font-size:18px;font-weight:800">Fitur toko ini</div><div data-sum style="font-size:12px;color:#64748b;margin-top:2px"></div></div><button data-x type="button" style="border:1px solid #cbd5e1;background:#f1f5f9;color:#0f172a;border-radius:99px;width:32px;height:32px;cursor:pointer;font-weight:700">✕</button></div><div data-body style="margin-top:8px"></div></div>';
      m.addEventListener('click', function (e) { if (e.target === m || e.target.hasAttribute('data-x')) m.style.display = 'none'; });
      document.body.appendChild(m);
    }
    var list = activeList();
    m.querySelector('[data-sum]').textContent = list.length + ' fitur aktif di mode ' + RLABEL[pageRole()] + '. Untuk menambah fitur, hubungi penyedia aplikasi.';
    m.querySelector('[data-body]').innerHTML = list.map(function (f) { return '<div style="padding:9px 4px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a"><span style="color:#059669;font-weight:800;margin-right:6px">✓</span><b>' + f.label + '</b></div>'; }).join('');
    m.style.display = 'flex';
  }

  window.FM_PLANS = { STORE: { products: SPRODUCTS, packs: SPACKS, all: SALL, trialDays: TRIAL_DAYS, item: sitem, periods: PERIODS, permUntil: PERM_UNTIL, price: sprice, sold: ssold, free: sfree, features: featList, bundles: function () { return (CAT && CAT.bundles) || []; }, trialOn: function () { return !(CAT && CAT.trial === false); }, quote: squote, disc: sdisc, untilFor: untilForPeriod, cat: function () { return CAT; }, setCat: storeSetCat, fetchCat: fetchCat, catAt: function () { return CAT_AT; }, keysOf: packKeys, active: rentalActive, rentals: rentals, sig: rentSig, loadedSig: function () { return LOADED_SIG; } }, hasBase: hasBase, FEATURES: FEATURES, ROLES: ROLES, RLABEL: RLABEL, has: has, activeList: activeList, applyDom: applyDom, checklistHtml: checklistHtml, cariFitur: cariFitur,
    ISLES: ISL_G, readChecklist: readChecklist, readLocks: readLocks, applyTierLocked: applyTierLocked, featTier: featTier, fillFrom: fillFrom, tierDefaults: tierDefaults, tierOf: tierOf, setAll: setAll, cnt: cnt, setCat: setCat, PRESETS: PRESETS, applyPreset: applyPreset, saveAsPreset: saveAsPreset, deletePreset: deletePreset, openModal: openModal, pageRole: pageRole, tier: function () { return 'basic'; }, lock: function () { return false; }, lockedHtml: function () { return ''; },
    PAKET: { cat: function () { return PAKET_CAT; }, setCat: setPaketCat, fetchCat: fetchPaketCat, isExpired: isExpired, lastPaidTier: lastPaidTier } };
})();
