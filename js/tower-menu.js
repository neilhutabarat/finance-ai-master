/* Menu Control Tower: ubin dikelompokkan (Klien / Uang / Sistem), ubin "segera" untuk fitur yang belum bisa dipakai,
   dan palet warna yang lebih tenang. Hanya aktif di halaman Tower. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;

  var DEFAULT_GROUPS = [
    { id: 'klien', title: '1. Toko & Klien', hint: 'Buka toko baru, profil, akun & lokasi live', c: '#2563eb', items: [
      { key: 'klien_baru', t: 'Tambah Toko Baru', dup: true, ic: 'store', run: "openModal('add_tenant')", d: 'Daftarkan toko & jenis usaha' },
      { key: 'profil_toko', t: 'Profil & Logo Toko', ic: 'store', run: "towerPick('profil')", d: 'Ubah nama, slogan, warna, logo' },
      { key: 'coa_toko', t: 'Daftar Akun (COA) Toko', ic: 'list', run: "towerPick('coa')", d: 'Atur akun pemasukan/pengeluaran' },
      { key: 'stok_katalog', t: 'Template Katalog & Stok', ic: 'box', run: "FM_LAB.open('template')", d: 'Salin katalog awal ke toko baru' },
      { key: 'link_toko', t: 'Salin Link Login', ic: 'send', run: "towerPick('link')", d: 'Bagikan link masuk ke klien' },
      { key: 'akun_login', t: 'PIN & Akun Login', ic: 'key', find: 'Akun Login', d: 'Cek PIN Admin, Manager, Owner' },
      { key: 'lokasi_aktivitas', t: 'Lokasi & Aktivitas Live', ic: 'shield', run: "towerPick('lokasi')", d: 'Pantau GPS & transaksi toko' },
      { key: 'permohonan_kasir', t: 'Permohonan Kasir Baru', ic: 'users', run: "openModal('tickets')", badge: 'stat-pending-tickets', d: 'Setujui/tolak perangkat kasir' }
    ] },
    { id: 'bangun', title: '2. Fitur, Kuota & Status', hint: 'Atur hak akses, batas terminal & bekukan toko', c: '#0d9488', items: [
      { key: 'fitur_toko', t: 'Atur Fitur per Toko', ic: 'grid', run: "towerPick('fitur')", d: 'Centang fitur Admin/Manager/Owner' },
      { key: 'salin_fitur', t: 'Salin Fitur Toko Lain', ic: 'grid', run: "towerPick('salin')", d: 'Tiru susunan fitur toko lain' },
      { key: 'kuota_terminal', t: 'Batas Jumlah Terminal', ic: 'users', run: "towerPick('kuota')", d: 'Atur jatah Kasir, Manager, Owner' },
      { key: 'bekukan_aktifkan', t: 'Bekukan / Aktifkan Toko', ic: 'moon', run: "towerPick('freeze')", d: 'Hentikan sementara akses toko' },
      { key: 'kendali_massal', t: 'Aksi Massal Banyak Toko', ic: 'users', run: "towerMass()", d: 'Bekukan/kirim pesan sekaligus' },
      { key: 'toko_berhenti', t: 'Arsip Toko Berhenti', ic: 'archive', find: 'Toko Berhenti', d: 'Daftar toko yang nonaktif' },
      { key: 'hapus_pulihkan', t: 'Hapus / Pulihkan Toko', ic: 'trash', run: "towerPick('hapus')", d: 'Hapus klien atau kembalikan' }
    ] },
    { id: 'layanan', title: '3. Paket, Tagihan & Store', hint: 'Langganan Basic/Plus/Pro, tagihan & sewa fitur', c: '#ea580c', items: [
      { key: 'paket_billing', t: 'Ubah Paket Toko', ic: 'tag', run: "towerPick('paket')", d: 'Setel Basic, Plus, Pro & durasi' },
      { key: 'isi_paket_fitur', t: 'Isi Paket Plus & Pro', ic: 'list', run: "openModal('paket_fitur')", d: 'Atur daftar fitur bawaan paket' },
      { key: 'billing_toko', t: 'Tagihan per Toko', ic: 'chart', run: "towerPick('billing')", d: 'Biaya & pembayaran satu toko' },
      { key: 'billing_jaringan', t: 'Tagihan Semua Toko', ic: 'chart', find: 'Billing Jaringan', d: 'Rekap tagihan & jatuh tempo' },
      { key: 'pengingat_jatuh_tempo', t: 'Pengingat Jatuh Tempo', ic: 'bell', run: "towerDue()", d: 'Cek toko yang hampir habis masa' },
      { key: 'store', t: 'OneilStore (Sewa Fitur)', ic: 'tag', run: "FM_TSTORE.open()", d: 'Atur harga & sewa fitur satuan' },
      { key: 'demo_toko', t: 'Atur Toko Demo', ic: 'moon', run: "FM_TSTORE.openDemo()", d: 'Ubah jadi toko demo atau asli' }
    ] },
    { id: 'pantau', title: '4. Pantau, Error & Kas Tower', hint: 'Bantuan klien, error sistem & kas internal', c: '#6366f1', items: [
      { key: 'tiket_bantuan', t: 'Tiket Bantuan Klien', ic: 'bell', run: "FM_HELPDESK.open()", d: 'Balas pertanyaan dari toko' },
      { key: 'pemantauan_error', t: 'Laporan Error Aplikasi', ic: 'bell', run: "FM_MON.open('error')", d: 'Lacak error dari perangkat toko' },
      { key: 'log_login', t: 'Riwayat Login Perangkat', ic: 'users', run: "FM_MON.open('login')", d: 'Siapa masuk, kapan & di mana' },
      { key: 'kesehatan_sistem', t: 'Pindai & Perbaiki Data', ic: 'shield', run: "FM_HEALTH.open()", d: 'Cek kesehatan server & data' },
      { key: 'pajak_jaringan', t: 'Pajak Semua Toko', ic: 'tax', run: "openModal('tax_net')", d: 'Total pajak dari tiap toko' },
      { key: 'catat_pembukuan', t: 'Catat Kas Provider', dup: true, ic: 'swap', run: "openModal('provider_input_tx')", d: 'Pemasukan & pengeluaran Tower' },
      { key: 'coa_provider', t: 'Daftar Akun Provider', ic: 'list', find: 'COA Provider', d: 'Akun kas internal Provider' },
      { key: 'kurs_emas', t: 'Kurs & Harga Emas', ic: 'coins', find: 'Kurs', d: 'Perbarui kurs & harga emas' }
    ] },
    { id: 'versi', title: '5. Versi, Uji & Serah Terima', hint: 'Kunci versi rilis, uji coba & serah terima', c: '#9333ea', items: [
      { key: 'versi_toko', t: 'Kunci Versi Toko', ic: 'swap', run: "towerPick('versi')", d: 'Kunci toko ke versi tertentu' },
      { key: 'rollout_versi', t: 'Atur Rollout Versi', ic: 'box', run: "if(window.openRolloutModal)openRolloutModal()", d: 'Titik beku rilis & Oneil Shield' },
      { key: 'rakit_uji', t: 'Uji Fitur Satu per Satu', ic: 'grid', run: "FM_LAB.open('rakit')", d: 'Catat hasil uji fitur toko' },
      { key: 'ubah_id', t: 'Ganti ID Toko', ic: 'key', run: "FM_LAB.open('rename')", d: 'Ubah ID toko sebelum diserahkan' },
      { key: 'published', t: 'Tandai Sudah Diserahkan', ic: 'send', run: "FM_LAB.open('publish')", d: 'Tandai toko siap pakai klien' },
      { key: 'data_demo', t: 'Isi Data Transaksi Demo', ic: 'grid', run: "FM_DEMO.open()", d: 'Isi toko uji dengan contoh' },
      { key: 'uji_mandiri', t: 'Cek Kelayakan Aplikasi', ic: 'shield', run: "FM_QA.open()", d: 'Verifikasi file & data toko' },
      { key: 'reset_statistik', t: 'Reset Data Uji ke 0', warn: true, ic: 'trash', run: "FM_LAB.open('reset')", d: 'Hapus data uji coba toko' }
    ] },
    { id: 'tampil', title: '6. Tampilan, Chat & ON2', hint: 'Wallpaper, pengumuman, chat & Oneilverse 2', c: '#059669', items: [
      { key: 'wallpaper', t: 'Wallpaper & Efek Kaca', ic: 'spark', run: "FM_TWALL.open()", d: 'Atur latar & kaca aplikasi' },
      { key: 'pesan_siaran', t: 'Kirim Pengumuman', dup: true, ic: 'send', run: "openModal('broadcast_modal')", d: 'Kirim pesan siaran ke semua toko' },
      { key: 'catatan_rilis', t: 'Catatan Rilis Klien', ic: 'book', find: 'Catatan Rilis', d: 'Riwayat pembaruan aplikasi' },
      { key: 'chat_global', t: 'Moderasi Chat Global', ic: 'bell', run: "if(window.FM_CHAT)FM_CHAT.openModeration()", d: 'Bisukan atau atur Chat Global' },
      { key: 'hapus_semua_chat', t: 'Kosongkan Semua Chat', ic: 'trash', run: "if(window.FM_CHAT)FM_CHAT.clearAll()", d: 'Hapus seluruh isi Chat Universe' },
      { key: 'susun_pulau', t: 'Susun Menu Pulau (ON2)', ic: 'grid', run: "towerPick('susun')", d: 'Urutan pulau kiri/kanan Gen 2' },
      { key: 'pulau_on2', t: 'Kartu & Fitur ON2', ic: 'spark', run: "towerPick('pulau')", d: 'Atur kartu & denyut Gen 2' }
    ] }
  ];

  /* ============ menu kustom (disimpan di Firestore, app_meta/tower_menu) ============ */
  var PALETTE = ['#8fb8e8', '#9fa8e6', '#d9b872', '#e0a47a', '#6fc7c0', '#c9a8e0', '#f0a8c0', '#e29a9a', '#8fd0b0', '#7dd3c0', '#f0c674'];
  var CUSTOM = null;
  var GROUPS = DEFAULT_GROUPS;
  function esc2(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function allItemsFlat() {
    var out = []; DEFAULT_GROUPS.forEach(function (g) { g.items.forEach(function (it) { out.push(it); }); }); return out;
  }
  function defaultItemGroupMap() {
    var m = {}; DEFAULT_GROUPS.forEach(function (g) { g.items.forEach(function (it) { m[it.key] = g.id; }); }); return m;
  }
  function defaultGroupMeta() {
    var m = {}; DEFAULT_GROUPS.forEach(function (g) { m[g.id] = { title: g.title, hint: g.hint, c: g.c }; }); return m;
  }
  function effectiveGroups() {
    var meta = defaultGroupMeta();
    var base = (CUSTOM && CUSTOM.groups && CUSTOM.groups.length) ? CUSTOM.groups.slice() : DEFAULT_GROUPS.map(function (g) { return { id: g.id, title: g.title }; });
    var groups = base.map(function (g, i) {
      var m = meta[g.id] || {};
      return { id: g.id, title: g.title || m.title || 'Kategori', hint: m.hint || '', c: m.c || PALETTE[i % PALETTE.length], items: [] };
    });
    var byId = {}; groups.forEach(function (g) { byId[g.id] = g; });
    var itemGroupMap = (CUSTOM && CUSTOM.itemGroup) || {};
    var defMap = defaultItemGroupMap();
    allItemsFlat().forEach(function (it) {
      var gid = itemGroupMap[it.key] || defMap[it.key];
      var g = byId[gid] || byId[defMap[it.key]] || groups[0];
      g.items.push(it);
    });
    return groups.filter(function (g) { return g.items.length > 0; });
  }
  function fsdb() { try { return (typeof db !== 'undefined' && db) ? db : null; } catch (e) { return null; } }
  function loadCustomConfig(done) {
    var d = fsdb(); if (!d) { done(); return; }
    d.collection('app_meta').doc('tower_menu').get().then(function (s) {
      try { if (s.exists && s.data().json) CUSTOM = JSON.parse(s.data().json); } catch (e) {}
      done();
    }).catch(function () { done(); });
  }
  function saveCustomConfig(groups, itemGroup, cb) {
    var d = fsdb(); if (!d) { cb && cb(false); return; }
    d.collection('app_meta').doc('tower_menu').set({ json: JSON.stringify({ groups: groups, itemGroup: itemGroup }), updatedAt: firebase.firestore.FieldValue.serverTimestamp() })
      .then(function () { cb && cb(true); }).catch(function () { cb && cb(false); });
  }
  function resetCustomConfig(cb) {
    var d = fsdb(); if (!d) { cb && cb(false); return; }
    d.collection('app_meta').doc('tower_menu').delete().then(function () { cb && cb(true); }).catch(function () { cb && cb(false); });
  }

  function openMenuEditor() {
    var cur = effectiveGroups();
    var draftGroups = cur.map(function (g) { return { id: g.id, title: g.title }; });
    var draftItemGroup = {};
    cur.forEach(function (g) { g.items.forEach(function (it) { draftItemGroup[it.key] = g.id; }); });

    var old = document.getElementById('tw-menu-editor'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'tw-menu-editor';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483300;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,sans-serif';
    ov.innerHTML = '<div style="width:100%;max-width:640px;max-height:88vh;overflow:auto;background:#0b0f17;color:#e2e8f0;border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:18px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><b style="font-size:16px">Atur Menu Kendali</b><button data-x style="all:unset;cursor:pointer;color:#94a3b8;font-size:13px">Tutup</button></div>' +
      '<p style="font-size:11.5px;color:#94a3b8;margin:0 0 12px">Ubah nama kategori, tambah/hapus kategori, atau pindahkan tombol ke kategori lain. Tersimpan untuk semua perangkat.</p>' +
      '<div id="tme-groups" style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px"></div>' +
      '<button id="tme-addgroup" style="all:unset;cursor:pointer;color:#93c5fd;font-size:12.5px;font-weight:700;margin-bottom:16px">+ Kategori Baru</button>' +
      '<div style="border-top:1px solid rgba(255,255,255,.1);padding-top:12px">' +
      '<b style="font-size:13px">Tombol</b>' +
      '<div id="tme-items" style="display:flex;flex-direction:column;gap:6px;margin-top:8px"></div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:16px;align-items:center">' +
      '<button id="tme-reset" style="all:unset;cursor:pointer;color:#f87171;font-size:12px;padding:9px 14px;border:1px solid rgba(248,113,113,.4);border-radius:10px">Kembalikan ke Bawaan</button>' +
      '<span style="flex:1"></span>' +
      '<button id="tme-save" style="all:unset;cursor:pointer;color:#04120c;background:#34d399;font-weight:800;font-size:12.5px;padding:10px 18px;border-radius:10px">Simpan</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(ov);

    function renderGroups() {
      var box = ov.querySelector('#tme-groups');
      box.innerHTML = draftGroups.map(function (g) {
        return '<div style="display:flex;gap:6px;align-items:center"><input data-gid="' + esc2(g.id) + '" value="' + esc2(g.title) + '" style="flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:6px 9px;color:#fff;font-size:12.5px;outline:none"><button data-delg="' + esc2(g.id) + '" title="Hapus kategori" style="all:unset;cursor:pointer;color:#f87171;padding:4px 8px">✕</button></div>';
      }).join('');
      [].slice.call(box.querySelectorAll('[data-gid]')).forEach(function (inp) {
        inp.oninput = function () {
          var g = draftGroups.filter(function (x) { return x.id === inp.getAttribute('data-gid'); })[0];
          if (g) g.title = inp.value;
          renderItems();
        };
      });
      [].slice.call(box.querySelectorAll('[data-delg]')).forEach(function (btn) {
        btn.onclick = function () {
          if (draftGroups.length <= 1) { alert('Minimal harus ada 1 kategori.'); return; }
          var gid = btn.getAttribute('data-delg');
          draftGroups = draftGroups.filter(function (x) { return x.id !== gid; });
          var fallback = draftGroups[0].id;
          Object.keys(draftItemGroup).forEach(function (k) { if (draftItemGroup[k] === gid) draftItemGroup[k] = fallback; });
          renderGroups(); renderItems();
        };
      });
    }
    function renderItems() {
      var box = ov.querySelector('#tme-items');
      var opt = function (selId) { return draftGroups.map(function (g) { return '<option value="' + esc2(g.id) + '"' + (g.id === selId ? ' selected' : '') + '>' + esc2(g.title) + '</option>'; }).join(''); };
      box.innerHTML = allItemsFlat().map(function (it) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06)"><span style="font-size:12.5px">' + esc2(it.t) + '</span><select data-key="' + esc2(it.key) + '" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:5px 8px;color:#fff;font-size:12px;outline:none">' + opt(draftItemGroup[it.key]) + '</select></div>';
      }).join('');
      [].slice.call(box.querySelectorAll('select[data-key]')).forEach(function (sel) {
        sel.onchange = function () { draftItemGroup[sel.getAttribute('data-key')] = sel.value; };
      });
    }

    renderGroups(); renderItems();

    ov.querySelector('#tme-addgroup').onclick = function () {
      var nama = prompt('Nama kategori baru:'); if (!nama) return;
      draftGroups.push({ id: 'g_' + Date.now(), title: nama });
      renderGroups(); renderItems();
    };
    ov.querySelector('#tme-reset').onclick = function () {
      if (!confirm('Kembalikan semua ke susunan bawaan? Perubahanmu akan hilang.')) return;
      resetCustomConfig(function (ok) {
        if (!ok) { alert('Gagal, cek koneksi Firestore.'); return; }
        location.reload();
      });
    };
    ov.querySelector('#tme-save').onclick = function () {
      saveCustomConfig(draftGroups, draftItemGroup, function (ok) {
        if (!ok) { alert('Gagal menyimpan, cek koneksi Firestore.'); return; }
        alert('Tersimpan. Halaman akan dimuat ulang.');
        location.reload();
      });
    };
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.hasAttribute('data-x')) ov.remove(); });
  }

  var CSS = [
    /* palet tenang: biru-abu lembut, kartu tidak terlalu pekat */
    'html[data-fm-page="tower"][data-fm-native="dark"]:not([data-fm-invert]){--s-bg:#000;--s-surf:rgba(255,255,255,.04);--s-line:rgba(255,255,255,.11);--s-hi:rgba(255,255,255,.14);--s-shadow:rgba(0,0,0,.9);--s-gloss:rgba(255,255,255,.02)}',
    'html[data-fm-page="tower"][data-fm-native="dark"]:not([data-fm-invert]) body{background:#000!important;background-image:none!important;color:#dfe5f2}',
    'html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child>*{background:#07090c!important;background-image:none!important;border-color:rgba(255,255,255,.12)!important}',
    'html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child .text-white,html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child h3{color:#e6ebf6!important}',
    'html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child .text-indigo-300,html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child .text-cyan-300,html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child .text-amber-300,html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child .text-rose-300{filter:saturate(.7)}',
    /* kelompok menu */
    'html[data-fm-page="tower"] #fm-actions.tw-grouped{display:flex!important;flex-direction:column;gap:8px;flex:1 1 0!important;min-height:0;overflow:hidden;grid-template-columns:none!important;padding:2px 2px 76px}',
    '.tw-group{display:flex;flex-direction:column;gap:5px}',
    '.tw-head{display:flex;align-items:baseline;gap:10px;padding:0 4px}',
    '.tw-head b{font-size:13px;font-weight:800;letter-spacing:.01em;color:var(--g)}',
    '.tw-head span{font-size:11px;opacity:.55}',
    '.tw-head:before{content:"";align-self:center;width:4px;height:14px;border-radius:3px;background:var(--g)}',
    '.tw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:7px}',
    'html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act{flex-direction:row!important;justify-content:flex-start!important;text-align:left!important;gap:11px!important;min-height:36px;height:auto;font-size:12px!important;font-weight:700!important;padding:5px 11px!important;position:relative;border-radius:16px}',
    'html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act i{width:28px!important;height:28px!important;border-radius:12px!important;background:color-mix(in srgb,var(--g) 18%,transparent)!important;color:var(--g)!important}',
    'html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act svg{width:16px!important;height:16px!important}',
    'html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act span{white-space:normal!important;line-height:1.2}',
    '.tw-soon{opacity:.42;filter:grayscale(.55);border-style:dashed!important;cursor:default!important}',
    '.tw-soon:hover{transform:none!important;filter:grayscale(.55)!important}',
    '.tw-pill{margin-left:auto;flex:none;font-size:9.5px;font-weight:800;padding:2px 8px;border-radius:999px;background:rgba(188,201,230,.16);color:#cdd6ea}',
    '.tw-cnt{margin-left:auto;flex:none;min-width:22px;text-align:center;font-size:11px;font-weight:800;padding:2px 7px;border-radius:999px;background:#c9706f;color:#fff}',
    '.tw-rowbtns button{white-space:nowrap}',
    '.fm-act small{display:none}@media(max-width:1023px){.tw-dup{display:none!important}}',
    '@media(max-width:640px){.tw-grid{grid-template-columns:repeat(2,minmax(0,1fr))}html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act{padding:8px 10px!important;font-size:12.5px!important;gap:8px!important}html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act i{width:30px!important;height:30px!important}}'
  ].join('\n');

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function tile(it, g) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'fm-act' + (it.warn ? ' tw-warn' : '') + (it.soon ? ' tw-soon' : '') + (it.dup ? ' tw-dup' : ''); b.setAttribute('data-tw', it.t);
    if (it.d) b.title = it.t + ' — ' + it.d;
    b.innerHTML = '<i>' + (window.FM_SVG ? FM_SVG(it.ic) : '') + '</i><span>' + esc(it.t) + '</span>' + (it.soon ? '<em class="tw-pill" style="font-style:normal">segera</em>' : '') + (it.d ? '<small>' + esc(it.d) + '</small>' : '');
    if (it.soon) { b.title = 'Segera hadir'; b.setAttribute('aria-disabled', 'true'); b.onclick = function (e) { e.preventDefault(); }; }
    return b;
  }

  function build() {
    var host = document.getElementById('fm-actions');
    if (!host || host.classList.contains('tw-grouped')) return;
    var old = [].slice.call(host.querySelectorAll('.fm-act'));
    if (!old.length) return;
    var byText = function (frag) {
      for (var i = 0; i < old.length; i++) if ((old[i].textContent || '').indexOf(frag) >= 0) return old[i];
      return null;
    };
    var dirTile = byText('Jaringan Mitra');
    var frag = document.createDocumentFragment();
    GROUPS.forEach(function (g) {
      var sec = document.createElement('section'); sec.className = 'tw-group'; sec.setAttribute('data-g', g.id); sec.style.setProperty('--g', g.c);
      sec.innerHTML = '<div class="tw-head"><b>' + esc(g.title) + '</b><span>' + esc(g.hint) + '</span></div>';
      var grid = document.createElement('div'); grid.className = 'tw-grid'; sec.appendChild(grid);
      g.items.forEach(function (it) {
        var el;
        if (it.find) {
          var src = byText(it.find);
          if (src) { el = src; var sp = el.querySelector('span'); if (sp && it.t) sp.textContent = it.t; if (it.d && !el.querySelector('small')) { var sm = document.createElement('small'); sm.textContent = it.d; el.appendChild(sm); } }
        }
        if (!el && it.edit) {
          el = tile(it, g);
          el.onclick = function () {
            if (dirTile) dirTile.click();
            setTimeout(function () { var s = document.getElementById('dir-search'); if (s) { s.focus(); s.placeholder = 'Ketik nama/ID toko, lalu tekan Edit Toko di barisnya'; } }, 250);
          };
        } else if (!el && it.run) {
          el = tile(it, g);
          el.onclick = function () { new Function(it.run)(); };
        } else if (!el) {
          el = tile(it, g);
        }
        if (it.badge) {
          var c = document.createElement('em'); c.className = 'tw-cnt'; c.style.fontStyle = 'normal'; c.setAttribute('data-tw-badge', it.badge); c.style.display = 'none';
          el.appendChild(c);
        }
        grid.appendChild(el);
      });
      frag.appendChild(sec);
    });
    host.innerHTML = '';
    var nav = document.createElement('div'); nav.className = 'tw-tabs';
    var qIn = document.createElement('input'); qIn.type = 'search'; qIn.className = 'tw-ken-q'; qIn.placeholder = '🔍 Cari tombol kendali (mis. paket, fitur, versi, coa, demo)...';
    qIn.oninput = function () {
      var q = (qIn.value || '').toLowerCase().trim();
      [].slice.call(host.querySelectorAll('.tw-group')).forEach(function (sec) {
        var any = 0;
        [].slice.call(sec.querySelectorAll('.fm-act')).forEach(function (btn) {
          var txt = ((btn.getAttribute('data-tw') || '') + ' ' + (btn.textContent || '')).toLowerCase();
          var ok = !q || txt.indexOf(q) >= 0;
          btn.style.setProperty('display', ok ? '' : 'none', ok ? '' : 'important');
          if (ok) any++;
        });
        sec.style.setProperty('display', (!q || any) ? 'flex' : 'none', 'important');
      });
    };
    nav.appendChild(qIn);
    var editBtn = document.createElement('button'); editBtn.type = 'button'; editBtn.className = 'tw-tab tw-tab-edit'; editBtn.textContent = '✏️ Atur Menu';
    editBtn.onclick = function (e) { e.stopPropagation(); openMenuEditor(); };
    nav.appendChild(editBtn);
    var board = document.createElement('div'); board.id = 'tw-board';
    board.appendChild(frag);
    host.appendChild(nav); host.appendChild(board);
    host.classList.add('tw-grouped');
  }

  function badges() {
    [].slice.call(document.querySelectorAll('[data-tw-badge]')).forEach(function (c) {
      var src = document.getElementById(c.getAttribute('data-tw-badge'));
      var n = src ? parseInt(src.textContent, 10) || 0 : 0;
      c.textContent = n; c.style.display = n > 0 ? '' : 'none';
    });
  }

  var CSS2 = [
    '.tw-tabs{display:flex;align-items:center;gap:10px;padding:0;flex:none}',
    '.tw-ken-q{flex:1;max-width:420px;padding:7px 14px;border-radius:12px;border:1px solid #cbd5e1;background:#ffffff;color:#0f172a;font-size:12.5px;font-weight:600;outline:none;box-shadow:0 2px 6px -2px rgba(15,23,42,.05)}',
    '.tw-ken-q:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}',
    '.tw-tab{all:unset;box-sizing:border-box;cursor:pointer;padding:7px 14px;border-radius:10px;font-size:12px;font-weight:700;color:#334155;background:#ffffff;border:1px solid #cbd5e1}',
    '.tw-tab:hover{background:#f8fafc;color:#0f172a}',
    '#tw-board{flex:1 1 0;min-height:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));gap:10px}',
    '.tw-group{display:flex!important;flex-direction:column;gap:8px;min-height:0;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:11px 13px;box-shadow:0 4px 12px -6px rgba(15,23,42,.06);overflow:hidden}',
    'html[data-tw-ck] #tw-ken .tw-group .tw-head{display:flex!important;align-items:baseline;gap:8px;padding:0 2px;flex:none}',
    'html[data-tw-ck] #tw-ken .tw-group .tw-head:before{display:block!important;content:"";align-self:center;width:4px;height:14px;border-radius:3px;background:var(--g,#2563eb)}',
    'html[data-tw-ck] #tw-ken .tw-group .tw-head b{font-size:13px!important;font-weight:800!important;color:#0f172a!important;letter-spacing:.01em;white-space:nowrap}',
    'html[data-tw-ck] #tw-ken .tw-group .tw-head span{display:inline!important;font-size:11px!important;color:#64748b!important;opacity:1!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    'html[data-tw-ck] #tw-ken .tw-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-auto-rows:minmax(44px,1fr)!important;gap:6px!important;flex:1 1 0!important;min-height:0!important;align-content:stretch}',
    'html[data-fm-page="tower"] #tw-ken #fm-actions .tw-group .fm-act.tw-warn{border-color:rgba(220,38,38,.45)!important}',
    'html[data-fm-page="tower"] #tw-ken #fm-actions .tw-group .fm-act.tw-warn i{background:rgba(220,38,38,.12)!important;color:#dc2626!important}',
    '.tw-tab-edit{background:#ffffff!important;border:1px dashed #94a3b8!important;color:#334155!important;margin-left:auto}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'tw-menu-css'; st.textContent = CSS + '\n' + CSS2; document.head.appendChild(st);
  function start() {
    var tries = 0;
    (function wait() {
      var h = document.getElementById('fm-actions');
      var dbReady = (typeof db !== 'undefined' && db);
      if (h && h.querySelector('.fm-act') && (dbReady || tries > 20)) {
        loadCustomConfig(function () { GROUPS = effectiveGroups(); build(); badges(); setInterval(badges, 1500); });
        return;
      }
      if (++tries < 40) setTimeout(wait, 150);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
