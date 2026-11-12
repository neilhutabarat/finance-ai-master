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
    { key: 'input', label: 'Input transaksi, draft, metode bayar, cetak struk', r: { kasir: 'c' } },
    { key: 'saldo', label: 'Saldo kas, total masuk dan keluar', r: { kasir: 'c', manager: 'c', owner: 'c' } },
    { key: 'closing', label: 'Closing kasir dan riwayatnya', r: { kasir: 'c', manager: 'c' } },
    { key: 'mutasi', label: 'Mutasi / buku kas', r: { kasir: 'c', manager: 'c', owner: 'c' } },
    { key: 'coa', label: 'Kelola akun (COA)', r: { manager: 'c', owner: 'o' } },
    { key: 'kasir_baru', label: 'Pengajuan kasir baru', r: { manager: 'c', owner: 'c' } },
    { key: 'laba_rugi', label: 'Laba Rugi', r: { manager: 'c', owner: 'c' } },
    { key: 'pin', label: 'Kelola PIN dan nama peran', r: { owner: 'c' } },
    { key: 'ledger', label: 'Buku Besar', r: { kasir: 'o', manager: 'c', owner: 'o' } },
    { key: 'stok', label: 'Stok: lihat daftar stok, harga beli, nilai, dan riwayat closing', r: { manager: 'o', owner: 'o' } },
    { key: 'stok_input', label: 'Stok: input jenis stok dan stok masuk', r: { manager: 'o', owner: 'o' } },
    { key: 'jual_produk', label: 'Jual produk dari stok di kasir (sakelar per Induk di Stok, untuk minimarket/kelontong)', r: { kasir: 'o', manager: 'o' } },
    { key: 'banyak_usaha', label: 'Banyak usaha dalam satu toko (label usaha per akun dan stok, laporan per usaha; nama usaha diisi di bawah tabel)', r: { manager: 'o', owner: 'o' } },
    { key: 'stok_closing', label: 'Stok: isi sisa stok dan Closing Mingguan (HPP)', r: { manager: 'o', owner: 'o' } },
    { key: 'bukti', label: 'Foto bukti transaksi', r: { kasir: 'o' } },
    { key: 'wa_receipt', label: 'Struk lewat WhatsApp', r: { kasir: 'o' } },
    { key: 'tax', label: 'Pajak PPN 12%', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'dashboard', label: 'Dashboard ringkasan (target, stok menipis, margin)', r: { manager: 'o', owner: 'o' } },
    { key: 'analisa', label: 'Analisa Keuangan', r: { manager: 'o', owner: 'o' } },
    { key: 'instruksi', label: 'Instruksi dan pengawasan admin', r: { manager: 'o' } },
    { key: 'audit', label: 'Riwayat audit manager', r: { owner: 'o' } },
    { key: 'export_csv', label: 'Unduh laporan (PDF dan CSV)', r: { owner: 'o' } },
    { key: 'clock', label: 'Jam', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'weather', label: 'Cuaca', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'rates', label: 'Kurs dan Emas', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'billing_card', label: 'Kartu Estimasi Biaya Layanan', r: { manager: 'o', owner: 'o' } },
    { key: 'chat', label: 'Chat global', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'wallpaper', label: 'Pilihan Latar Belakang (wallpaper)', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'theme', label: 'Pilih warna halaman dan logo usaha', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'mutasi_wa', label: 'Mutasi dikirim lewat WA dan dicetak', r: { kasir: 'o', manager: 'o', owner: 'o' } },
    { key: 'gaji', label: 'Laporan gaji (Manager mencatat; Owner hanya melihat)', r: { manager: 'o', owner: 'o' } },
    { key: 'gaji_auto', label: 'Gaji yang dibayar otomatis tercatat sebagai pengeluaran', r: { manager: 'o' } },
    { key: 'paket', label: 'Paket Basic, Plus, dan Pro', soon: true, r: { manager: 'o', owner: 'o' } },
    { key: 'neraca', label: 'Neraca', soon: true, r: { manager: 'o', owner: 'o' } }
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
  var PLUS_KEYS = ['dashboard', 'analisa', 'audit', 'export_csv', 'ledger', 'stok', 'stok_input:manager', 'stok_closing:manager', 'gaji', 'mutasi_wa', 'wa_receipt', 'bukti'];
  function tierOf(tn) { var t = tn && tn.tier; return ORDER[t] != null && ORDER[t] >= 1 ? 'plus' : 'basic'; }
  var ALWAYS_ON = ['wallpaper', 'theme']; /* tampilan dasar: menyala di semua paket */
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
  function checklistHtml(prefix, features, editable, tnFull) {
    var tn = tnFull || { features: features || null }, isNew = !features;
    var th = 'text-align:center;padding:4px 6px;font-weight:800;white-space:nowrap';
    var h = '<div style="font-weight:800;margin-bottom:2px">Fitur toko</div>' +
      '<div style="opacity:.65;margin-bottom:6px">Merah = fitur inti (terkunci). Hijau = bebas ditambah atau dicabut per toko; yang tidak dicentang hilang dari tampilan klien.</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:6px"><button type="button" onclick="FM_PLANS.setAll(\'' + prefix + '\',true)" style="padding:4px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:transparent;color:inherit;font-size:11px">Centang semua tambahan</button>' +
      '<button type="button" onclick="FM_PLANS.setAll(\'' + prefix + '\',false)" style="padding:4px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:transparent;color:inherit;font-size:11px">Kosongkan tambahan</button></div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:6px"><span style="opacity:.65;font-size:11px">Template cepat:</span>' + '<span id="' + prefix + '-presets" style="display:contents">' + presetButtons(prefix) + '</span></div>' +
      '<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr><th style="text-align:left;padding:4px 6px">Fitur</th>' +
      ROLES.map(function (r) { return '<th style="' + th + '">' + RLABEL[r] + '</th>'; }).join('') + '</tr></thead><tbody>';
    var order = FEATURES.filter(function (f) { return !f.soon && Object.keys(f.r).some(function (r) { return f.r[r] === 'c'; }); })
      .concat(FEATURES.filter(function (f) { return !f.soon && !Object.keys(f.r).some(function (r) { return f.r[r] === 'c'; }); }))
      .concat(FEATURES.filter(function (f) { return f.soon; }));
    order.forEach(function (f) {
      h += '<tr style="border-top:1px solid rgba(255,255,255,.08);' + (f.soon ? 'opacity:.5' : '') + '"><td style="padding:6px">' + f.label + (f.soon ? ' <i>(segera)</i>' : '') + '</td>';
      ROLES.forEach(function (r) {
        var m = f.r[r], cell;
        if (m === 'c') cell = '<span title="Fitur inti: terkunci, tidak bisa dicabut" style="display:inline-flex;width:18px;height:18px;border-radius:5px;background:#ef4444;color:#fff;font-weight:900;font-size:13px;line-height:18px;align-items:center;justify-content:center">✓</span>';
        else if (!m) cell = '<input type="checkbox" disabled title="Belum tersedia di mode ini" style="width:16px;height:16px;opacity:.25">';
        else cell = '<input type="checkbox" id="' + prefix + '-f-' + f.key + '-' + r + '" ' + (((isNew ? defaultFor(f.key, r, 'basic') : has(f.key, r, tn))) ? 'checked ' : '') + ((f.soon || editable === false) ? 'disabled ' : '') + 'style="width:16px;height:16px;accent-color:#22c55e">';
        h += '<td style="text-align:center;padding:6px">' + cell + '</td>';
      });
      h += '</tr>';
    });
    return h + '</tbody></table></div>';
  }
  var PRESETS = {
    basic: { label: 'Paket Basic', keys: [] },
    plus: { label: 'Paket Plus', keys: PLUS_KEYS },
    warung: { label: 'Warung / Kafe', keys: ['stok', 'stok_input:manager', 'stok_closing:manager', 'bukti', 'wa_receipt', 'mutasi_wa', 'clock'] },
    toko: { label: 'Toko Retail', keys: ['stok', 'stok_input:manager', 'stok_closing:manager', 'bukti', 'wa_receipt', 'mutasi_wa', 'ledger', 'coa', 'export_csv', 'clock'] },
    jasa: { label: 'Jasa / Klinik', keys: ['stok', 'stok_input:manager', 'stok_closing:manager', 'ledger', 'coa', 'tax', 'analisa', 'gaji', 'gaji_auto', 'audit', 'export_csv', 'mutasi_wa'] },
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

  /* ---- sembunyikan fitur yang tidak aktif (dijalankan sebelum tampilan dirakit) ---- */
  function cardOf(el) { return el ? (el.closest('.ios-glass') || (el.parentElement && el.parentElement.parentElement)) : null; }
  function hide(el) { if (el) el.style.setProperty('display', 'none', 'important'); }
  function drop(sel) { [].slice.call(document.querySelectorAll(sel)).forEach(function (b) { if (b.parentNode) b.parentNode.removeChild(b); }); }
  function applyDom() {
    var role = pageRole();
    if (!has('tax', role)) { drop('button[onclick*="openModal(\'tax\')"]'); hide(cardOf(document.getElementById('stat-total-pajak-sumbang'))); }
    if (!has('coa', role)) drop('button[onclick*="openModal(\'coa_mgmt\')"]');
    if (!has('wallpaper', role)) { try { document.documentElement.style.removeProperty('--fm-wp'); } catch (e) {} }
    if (!has('stok', role)) drop('button[onclick*="FM_STOK"]');
    if (!has('gaji', role)) drop('button[onclick*="FM_GAJI"]');
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
    readChecklist: readChecklist, fillFrom: fillFrom, tierDefaults: tierDefaults, tierOf: tierOf, setAll: setAll, applyPreset: applyPreset, saveAsPreset: saveAsPreset, deletePreset: deletePreset, openModal: openModal, pageRole: pageRole, tier: function () { return 'basic'; }, lock: function () { return false; }, lockedHtml: function () { return ''; } };
})();
