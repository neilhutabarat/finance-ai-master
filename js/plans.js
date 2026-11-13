/* plans.js — fitur rakitan per toko dan per mode (Admin = kasir, Manager, Owner).
   - Fitur INTI selalu aktif dan tidak bisa dicabut (bahkan oleh Tower).
   - Fitur TAMBAHAN hanya tampil bila dicentang Tower (Basic: tidak ada; Plus: daftar bawaan Plus) (saat buka toko atau diubah kapan saja).
   - tenant.features[key] = { kasir: bool, manager: bool, owner: bool }
   - Toko lama yang belum punya pilihan tersimpan otomatis mendapat fitur yang sudah mereka pakai. */
(function () {
  'use strict';
  var ROLES = ['kasir', 'manager', 'owner'];
  var RLABEL = { kasir: 'Admin', manager: 'Manager', owner: 'Owner' };
  var ORDER = { basic: 0, plus: 1, pro: 1 };
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
  function tierOf(tn) { var t = tn && tn.tier; return ORDER[t] != null && ORDER[t] >= 1 ? 'plus' : 'basic'; }
  var ALWAYS_ON = ['wallpaper', 'theme']; /* tampilan dasar: menyala di semua paket */
  /* Penanda tingkat untuk tampilan Tower: PLUS = fitur premium (pantas bayar), sisanya BASIC. Hanya label + urutan, tidak mengubah hak akses. */
  var PLUS_FEATURES = ['barcode', 'stok_scan', 'banyak_usaha', 'admin_usaha', 'properti', 'dashboard', 'analisa', 'audit', 'export_csv', 'arus_kas', 'anggaran', 'rekon', 'neraca', 'pajak_bulanan', 'backup', 'laporan_bulanan', 'gaji', 'gaji_auto', 'ledger', 'instruksi', 'billing_card'];
  function featTier(f) { return PLUS_FEATURES.indexOf(f.key) >= 0 ? 'plus' : 'basic'; }
  var _lockCol = false; /* tampilkan kolom gembok (hanya di layar ubah fitur toko) */
  function defaultFor(key, role, tier) {
    if (ALWAYS_ON.indexOf(key) >= 0) return true;
    if (tier !== 'plus') return false;
    return PLUS_KEYS.indexOf(key) >= 0 || PLUS_KEYS.indexOf(key + ':' + role) >= 0;
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
  function has(key, role, tn) {
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
  function activeList(role, tn) { role = role || pageRole(); return FEATURES.filter(function (f) { return f.r[role] && !f.soon && has(f.key, role, tn); }); }

  /* ---- tabel centang untuk Tower: prefix 'nt' (toko baru) atau 'ts' (ubah toko) ---- */
  var CATS = [
    { id: 'trx', label: 'Transaksi', keys: ['mutasi_wa', 'wa_receipt', 'bukti', 'diskon', 'tax'] },
    { id: 'akun', label: 'Toko & Akun', keys: ['admin_usaha', 'banyak_usaha', 'instruksi'] },
    { id: 'stok', label: 'Stok & Barang', keys: ['stok', 'stok_input', 'stok_closing', 'stok_admin', 'stok_scan', 'jual_produk', 'satuan_ganda', 'barcode'] },
    { id: 'keu', label: 'Keuangan', keys: ['ledger', 'arus_kas', 'anggaran', 'rekon', 'neraca', 'pajak_bulanan', 'piutang', 'gaji', 'gaji_auto'] },
    { id: 'lap', label: 'Laporan & Analisa', keys: ['dashboard', 'analisa', 'audit', 'export_csv', 'laporan_bulanan', 'backup'] },
    { id: 'ops', label: 'Operasional', keys: ['absensi', 'properti', 'offline_penuh'] },
    { id: 'tamp', label: 'Tampilan & Pemanis', keys: ['wallpaper', 'theme', 'bahasa', 'clock', 'weather', 'rates', 'billing_card', 'chat'] }
  ];

  /* Penempatan fitur untuk tampilan Tower (hanya label + pengelompokan, tidak mengubah hak akses):
     INTI = terkunci merah; TAMBAHAN = fitur standar yang diberikan; STORE = layak disewa satuan di OneilStore. */
  var STORE_KEYS = ['wa_receipt', 'bukti', 'diskon', 'tax', 'admin_usaha', 'banyak_usaha', 'instruksi', 'stok', 'stok_input', 'stok_closing', 'stok_admin', 'stok_scan', 'jual_produk', 'satuan_ganda', 'barcode', 'arus_kas', 'anggaran', 'rekon', 'neraca', 'pajak_bulanan', 'piutang', 'laporan_bulanan', 'backup', 'absensi', 'properti'];
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
    var h = '<tr style="border-top:1px solid rgba(255,255,255,.08);' + (f.soon ? 'opacity:.5' : '') + '"><td style="padding:5px 6px">' + f.label + tierTag(f) + (f.soon ? ' <i>(segera)</i>' : '') + '</td>';
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
    h += '<details style="' + box + ';border-color:rgba(239,68,68,.45)"><summary style="' + sm + '"><span style="display:inline-block;width:12px;height:12px;border-radius:4px;background:#ef4444"></span>Fitur Inti <span style="opacity:.6;font-weight:600">· terkunci · ' + core.length + ' fitur</span></summary><div style="padding:2px 8px 8px">' + tableHtml(core.map(function (f) { return rowHtml(prefix, f, isNew, editable, tn, 'inti'); }).join('')) + '</div></details>';
    var cats = CATS.concat([{ id: 'lain', label: 'Lainnya', keys: [] }]);
    [{ id: 'extra', label: 'Fitur Tambahan', note: 'standar, diberikan ke toko', col: '#22c55e' }, { id: 'store', label: 'Fitur Store', note: 'layak disewa satuan di OneilStore', col: '#a855f7' }].forEach(function (T) {
    var tcount = FEATURES.filter(function (f) { return !f.soon && !isCore(f) && (isStore(f) === (T.id === 'store')); }).length;
    h += '<div style="display:flex;align-items:center;gap:8px;margin:12px 2px 6px;font-weight:900;font-size:13px"><span style="display:inline-block;width:12px;height:12px;border-radius:4px;background:' + T.col + '"></span>' + T.label + ' <span style="opacity:.6;font-weight:600;font-size:11px">· ' + T.note + ' · ' + tcount + ' fitur</span></div>';
    cats.forEach(function (c) {
      var fs = FEATURES.filter(function (f) { return !f.soon && !isCore(f) && catOf(f) === c.id && (isStore(f) === (T.id === 'store')); });
      if (!fs.length) return;
      fs.sort(function (a, b) { return (featTier(a) === 'plus' ? 1 : 0) - (featTier(b) === 'plus' ? 1 : 0); }); /* BASIC dulu, PLUS belakangan */
      h += '<details open style="' + box + '"><summary style="' + sm + '"><span>' + c.label + '</span><span id="' + prefix + '-cnt-' + T.id + '-' + c.id + '" style="opacity:.7;font-weight:700;font-size:11px"></span><span style="flex:1"></span>' + (editable === false ? '' : '<button type="button" onclick="event.preventDefault();FM_PLANS.setCat(\'' + prefix + '\',\'' + T.id + '-' + c.id + '\',true)" style="' + BSM + '">Centang</button><button type="button" onclick="event.preventDefault();FM_PLANS.setCat(\'' + prefix + '\',\'' + T.id + '-' + c.id + '\',false)" style="' + BSM + '">Kosongkan</button>') + '</summary><div style="padding:2px 8px 8px">' + tableHtml(fs.map(function (f) { return rowHtml(prefix, f, isNew, editable, tn, T.id + '-' + c.id); }).join('')) + '</div></details>';
    });
    });
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
  function applyDom() {
    var role = pageRole();
    try { localStorage.setItem('fm_offline_full', has('offline_penuh', role) ? '1' : '0'); } catch (e) {}
    if (!has('tax', role)) { drop('button[onclick*="openModal(\'tax\')"]'); hide(cardOf(document.getElementById('stat-total-pajak-sumbang'))); }
    if (!has('coa', role)) drop('button[onclick*="openModal(\'coa_mgmt\')"]');
    if (!has('wallpaper', role)) { try { document.documentElement.style.removeProperty('--fm-wp'); } catch (e) {} }
    if (!has('stok', role)) drop('button[onclick*="FM_STOK"]');
    if (!has('gaji', role)) drop('button[onclick*="FM_GAJI"]');
    if (!has('diskon', role)) drop('button[onclick*="FM_PROMO"]');
    if (!has('laporan_bulanan', role)) drop('button[onclick*="FM_LAPBUL"]');
    if (!has('backup', role)) drop('button[onclick*="FM_BACKUP"]');
    if (!has('absensi', role)) drop('button[onclick*="FM_ABS"]');
    if (!has('properti', role)) drop('button[onclick*="FM_PROP"]');
    if (!has('pajak_bulanan', role)) drop('button[onclick*="FM_PAJAK"]');
    if (!has('neraca', role)) drop('button[onclick*="FM_NERACA"]');
    if (!has('arus_kas', role) && !has('anggaran', role) && !has('rekon', role)) drop('button[onclick*="FM_KAS"]');
    if (!has('banyak_usaha', role)) drop('button[onclick*="FM_USAHA_SUM"]');
    if (!has('admin_usaha', role)) drop('button[onclick*="FM_ADMINS"]');
    if (!has('piutang', role)) drop('button[onclick*="FM_PIU"]');
    if (!has('ledger', role)) drop('button[onclick*="openModal(\'ledger\')"]');
    if (!has('audit', role)) drop('button[onclick*="openModal(\'audit_trail\')"]');
    if (!has('export_csv', role)) drop('button[onclick*="exportCSV"], button[onclick*="FM_LAPORAN"]');
    if (!has('instruksi', role)) drop('section[data-fm-panel="instruksi"]');
    if (!has('analisa', role)) drop('[data-fm-panel="analisa"]');
    if (!has('wa_receipt', role)) hide(document.getElementById('btn-wa-receipt'));
    if (!has('clock', role)) { var c = document.getElementById('realtime-clock-display'); if (c) hide(c.parentElement); }
    if (!has('bukti', role)) {
      [].slice.call(document.querySelectorAll('label')).forEach(function (l) { if (/Bukti Struk/i.test(l.textContent) && l.parentElement) hide(l.parentElement); });
    }
  }
  if (!/provider\.html$/i.test(location.pathname)) applyDom();

  /* ---- jendela "Fitur Toko" (daftar yang aktif di mode ini) ---- */
  function openModal() {
    var m = document.getElementById('fm-plans-modal');
    if (!m) {
      m = document.createElement('div'); m.id = 'fm-plans-modal';
      m.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482500;background:rgba(0,0,0,.7);align-items:center;justify-content:center;padding:14px;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif';
      m.innerHTML = '<div style="width:100%;max-width:520px;max-height:90vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div><div style="font-size:18px;font-weight:800">Fitur toko ini</div><div data-sum style="font-size:12px;opacity:.7;margin-top:2px"></div></div><button data-x type="button" style="border:0;background:rgba(255,255,255,.1);color:#fff;border-radius:99px;width:32px;height:32px;cursor:pointer">✕</button></div><div data-body style="margin-top:12px"></div></div>';
      m.addEventListener('click', function (e) { if (e.target === m || e.target.hasAttribute('data-x')) m.style.display = 'none'; });
      document.body.appendChild(m);
    }
    var list = activeList();
    m.querySelector('[data-sum]').textContent = list.length + ' fitur aktif di mode ' + RLABEL[pageRole()] + '. Untuk menambah fitur, hubungi penyedia aplikasi.';
    m.querySelector('[data-body]').innerHTML = list.map(function (f) { return '<div style="padding:9px 2px;border-top:1px solid rgba(255,255,255,.08);font-size:13px"><b>✓ ' + f.label + '</b></div>'; }).join('');
    m.style.display = 'flex';
  }

  window.FM_PLANS = { FEATURES: FEATURES, ROLES: ROLES, RLABEL: RLABEL, has: has, activeList: activeList, applyDom: applyDom, checklistHtml: checklistHtml,
    readChecklist: readChecklist, readLocks: readLocks, applyTierLocked: applyTierLocked, featTier: featTier, fillFrom: fillFrom, tierDefaults: tierDefaults, tierOf: tierOf, setAll: setAll, cnt: cnt, setCat: setCat, PRESETS: PRESETS, applyPreset: applyPreset, saveAsPreset: saveAsPreset, deletePreset: deletePreset, openModal: openModal, pageRole: pageRole, tier: function () { return 'basic'; }, lock: function () { return false; }, lockedHtml: function () { return ''; } };
})();
