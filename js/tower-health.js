/* tower-health.js — Kesehatan Sistem (hanya halaman Tower).
   1) Pindai          : hanya membaca, tidak mengubah apa pun.
   2) Bersihkan Server: hapus sisa data yang tidak dipakai (toko yang sudah tidak ada).
   3) Periksa & Perbaiki Bug Data: temukan data yang salah per toko; yang jelas aman bisa diperbaiki otomatis.
   Toko yang masih terdaftar (aktif, dibekukan, atau arsip 90 hari) tidak pernah disentuh oleh pembersihan. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;

  var BTN = 'padding:9px 13px;border-radius:12px;font-weight:800;font-size:12px;color:#fff;border:0;cursor:pointer;';
  var last = null;   /* hasil pindai terakhir */
  var busy = false;

  function H(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function DB() { return (typeof db !== 'undefined' && db) ? db : null; }
  function low(x) { return String(x == null ? '' : x).toLowerCase(); }
  function fmtN(n) { return Number(n || 0).toLocaleString('id-ID'); }

  /* ---------- daftar toko yang MASIH DIPAKAI (diambil segar dari server) ---------- */
  function aliveSet() {
    var d = DB(), set = {};
    return Promise.all([d.collection('tenants_registry').get(), d.collection('former_tenants').get()]).then(function (r) {
      var n = 0;
      r[0].forEach(function (x) { set[low(x.id)] = 1; n++; });
      r[1].forEach(function (x) { var v = x.data(); if (v.status !== 'purged') set[low(x.id)] = 1; });
      try { Object.keys(TENANTS_CONFIG).forEach(function (k) { set[low(k)] = 1; }); } catch (e) {}
      if (!n && Object.keys(set).length < 1) throw new Error('Daftar toko kosong, pembersihan dibatalkan demi keamanan.');
      return set;
    });
  }
  function getAll(col, lim) {
    var q = DB().collection(col); if (lim) q = q.limit(lim);
    return q.get().then(function (s) { var a = []; s.forEach(function (x) { var v = x.data(); v._id = x.id; v._ref = x.ref; a.push(v); }); return a; });
  }
  function hasDocs(col) { return DB().collection(col).limit(1).get().then(function (s) { return !s.empty; }).catch(function () { return false; }); }
  function chunkDelete(refs) {
    var p = Promise.resolve();
    for (var i = 0; i < refs.length; i += 400) (function (part) { p = p.then(function () { var b = DB().batch(); part.forEach(function (r) { b.delete(r); }); return b.commit(); }); })(refs.slice(i, i + 400));
    return p;
  }

  /* =====================================================================
     PINDAI SAMPAH (kind: 'clean')
     ===================================================================== */
  function scanClean() {
    var out = [];
    return aliveSet().then(function (alive) {
      var d = DB(), now = Date.now(), DAY = 86400000, orphanIds = {};
      var markOrphan = function (id) { if (id) orphanIds[low(id)] = id; };
      var tasks = [];

      /* dokumen yang kuncinya = ID toko */
      [['tenant_ctrl', 'Kontrol toko (kuota, billing)'], ['tenant_settings', 'Pengaturan toko (COA, target)'], ['tenant_logos', 'Logo toko'], ['tenant_access_cfg', 'Nomor akun login toko'], [ 'tower_lab', 'Catatan uji Rakit Akun']].forEach(function (c) {
        tasks.push(getAll(c[0]).then(function (list) {
          var dead = list.filter(function (x) { return !alive[low(x._id)]; });
          dead.forEach(function (x) { markOrphan(x._id); });
          if (dead.length) out.push({ kind: 'clean', key: 'doc:' + c[0], title: c[1] + ' milik toko yang sudah tidak ada', count: dead.length, detail: dead.slice(0, 6).map(function (x) { return x._id; }).join(', '), refs: dead.map(function (x) { return x._ref; }) });
        }));
      });
      /* akun login yatim */
      tasks.push(getAll('tenant_access').then(function (list) {
        var dead = list.filter(function (x) { return x.tenant && !alive[low(x.tenant)]; });
        dead.forEach(function (x) { markOrphan(x.tenant); });
        if (dead.length) out.push({ kind: 'clean', key: 'acc', title: 'Akun login milik toko yang sudah tidak ada', count: dead.length, detail: dead.slice(0, 6).map(function (x) { return x.tenant + ' (' + x.role + ')'; }).join(', '), refs: dead.map(function (x) { return x._ref; }) });
      }));
      /* sesi online */
      tasks.push(getAll('tenant_presence').then(function (list) {
        var dead = list.filter(function (x) { return (x.tenantId && !alive[low(x.tenantId)]) || (x.ms && now - x.ms > 2 * DAY); });
        if (dead.length) out.push({ kind: 'clean', key: 'pres', title: 'Sesi online yang sudah basi (lebih dari 2 hari atau toko tidak ada)', count: dead.length, detail: '', refs: dead.map(function (x) { return x._ref; }) });
      }));
      /* audit & tiket & pengumuman */
      tasks.push(getAll('manager_audit_logs', 3000).then(function (list) {
        var dead = list.filter(function (x) { return x.tenantId && (low(x.tenantId) === 'sistem' || (/^ID\d+$/i.test(String(x.tenantId)) && !alive[low(x.tenantId)])); });
        dead.forEach(function (x) { if (/^ID\d+$/i.test(String(x.tenantId))) markOrphan(x.tenantId); });
        if (dead.length) out.push({ kind: 'clean', key: 'audit', title: 'Riwayat audit milik toko yang sudah tidak ada', count: dead.length, detail: '', refs: dead.map(function (x) { return x._ref; }) });
      }));
      tasks.push(getAll('provider_tickets').then(function (list) {
        var dead = list.filter(function (x) { return x.tenantId && !alive[low(x.tenantId)]; });
        if (dead.length) out.push({ kind: 'clean', key: 'tiket', title: 'Permohonan terminal milik toko yang sudah tidak ada', count: dead.length, detail: '', refs: dead.map(function (x) { return x._ref; }) });
      }));
      tasks.push(getAll('provider_notices').then(function (list) {
        var dead = list.filter(function (x) {
          var expired = x.expiresAt && x.expiresAt > 0 && x.expiresAt < now;
          var orphan = x.targetTenant && /^ID\d+$/i.test(String(x.targetTenant)) && !alive[low(x.targetTenant)];
          return expired || orphan;
        });
        if (dead.length) out.push({ kind: 'clean', key: 'notice', title: 'Pengumuman yang sudah kedaluwarsa atau tokonya tidak ada', count: dead.length, detail: '', refs: dead.map(function (x) { return x._ref; }) });
      }));
      /* arsip yang sudah dihapus tapi datanya mungkin tertinggal */
      tasks.push(getAll('former_tenants').then(function (list) { list.forEach(function (x) { if (x.status === 'purged') markOrphan(x.id || x._id); }); }));

      return Promise.all(tasks).then(function () {
        /* koleksi besar milik toko yatim (tx_, tp_, gaji_) */
        var ids = Object.keys(orphanIds), jobs = [];
        ids.forEach(function (k) {
          var id = orphanIds[k];
          ['tx_', 'tp_', 'gaji_'].forEach(function (pre) {
            jobs.push(hasDocs(pre + id).then(function (has) {
              if (has) out.push({ kind: 'clean', key: 'col:' + pre + id, title: 'Data ' + (pre === 'tx_' ? 'transaksi' : pre === 'tp_' ? 'stok & produk' : 'gaji') + ' toko yang sudah tidak ada', count: 0, detail: id, col: pre + id });
            }));
          });
        });
        return Promise.all(jobs);
      }).then(function () { return out; });
    });
  }

  function runClean(items, say) {
    return aliveSet().then(function (alive) {
      var p = Promise.resolve(), n = 0;
      items.forEach(function (it) {
        p = p.then(function () {
          say('Membersihkan: ' + it.title + '…');
          if (it.col) {
            var id = it.col.replace(/^(tx_|tp_|gaji_)/, '');
            if (alive[low(id)]) return;           /* pengaman: toko muncul lagi di daftar */
            return deleteCollectionChunks(it.col).then(function () { n++; });
          }
          var safe = it.refs.filter(function (r) { return !alive[low(r.id)] || it.key === 'acc' || it.key === 'pres' || it.key === 'audit' || it.key === 'tiket' || it.key === 'notice'; });
          if (/^doc:/.test(it.key)) safe = it.refs.filter(function (r) { return !alive[low(r.id)]; });
          return chunkDelete(safe).then(function () { n += safe.length; });
        });
      });
      return p.then(function () { return n; });
    });
  }

  /* =====================================================================
     PERIKSA BUG DATA (kind: 'fix' | 'info')
     ===================================================================== */
  function tenantsToCheck() {
    return listNetworkTenants().filter(function (t) { return !t.deletedByTower && !t.isSinglePage && isManaged(t); });
  }
  function checkTenant(t) {
    var d = DB(), id = t.id, nama = (t.nama || id), out = [];
    var usaha = String(t.usaha || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    return Promise.all([
      d.collection('tp_' + id).get(),
      d.collection('tenant_settings').doc(id).get(),
      d.collection('tx_' + id).limit(500).get(),
      d.collection('tenant_access_cfg').doc(id).get()
    ]).then(function (r) {
      var prods = []; r[0].forEach(function (x) { var v = x.data(); v._id = x.id; v._ref = x.ref; prods.push(v); });
      var coa = (r[1].exists && r[1].data().coa) || [];
      var txs = []; r[2].forEach(function (x) { var v = x.data(); v._id = x.id; txs.push(v); });
      var cfg = r[3].exists ? r[3].data() : null;
      var A = function (o) { o.tenant = id; o.nama = nama; out.push(o); };

      var neg = prods.filter(function (p) { return typeof p.stock === 'number' && p.stock < 0; });
      if (neg.length) A({ kind: 'fix', key: 'stokminus', title: 'Stok minus', count: neg.length, detail: neg.slice(0, 5).map(function (p) { return (p.name || p.code) + ' (' + p.stock + ')'; }).join(', '), fixLabel: 'Jadikan 0',
        run: function () { return writeAll(neg.map(function (p) { return [p._ref, { stock: 0 }]; })); } });
      var nop = prods.filter(function (p) { return p.forSale === true && !(Number(p.sellPrice) > 0); });
      if (nop.length) A({ kind: 'fix', key: 'jualtanpaharga', title: 'Produk "dijual di kasir" tetapi harga jual kosong', count: nop.length, detail: nop.slice(0, 5).map(function (p) { return p.name || p.code; }).join(', '), fixLabel: 'Matikan "dijual di kasir"',
        run: function () { return writeAll(nop.map(function (p) { return [p._ref, { forSale: false }]; })); } });
      var seen = {}, dup = {};
      prods.forEach(function (p) { var c = low(p.code); if (!c) return; if (seen[c]) dup[c] = 1; seen[c] = 1; });
      if (Object.keys(dup).length) A({ kind: 'info', key: 'kodeganda', title: 'Kode produk ganda', count: Object.keys(dup).length, detail: Object.keys(dup).slice(0, 6).join(', ') });
      var noname = prods.filter(function (p) { return !String(p.name || '').trim() || !String(p.code || '').trim(); });
      if (noname.length) A({ kind: 'info', key: 'tanpanama', title: 'Produk tanpa nama atau kode', count: noname.length, detail: noname.slice(0, 5).map(function (p) { return p._id; }).join(', ') });
      if (usaha.length) {
        var bad = prods.filter(function (p) { return p.biz && usaha.indexOf(p.biz) < 0; });
        if (bad.length) A({ kind: 'info', key: 'usahaasing', title: 'Produk memakai usaha yang tidak ada di daftar usaha toko', count: bad.length, detail: bad.slice(0, 4).map(function (p) { return (p.name || p.code) + ' → ' + p.biz; }).join(', ') });
      }
      var codes = {}, dc = {};
      coa.forEach(function (c) { var k = String(c.code); if (codes[k]) dc[k] = 1; codes[k] = 1; });
      if (Object.keys(dc).length) A({ kind: 'info', key: 'coaganda', title: 'Kode akun COA ganda', count: Object.keys(dc).length, detail: Object.keys(dc).slice(0, 6).join(', ') });
      var badTx = txs.filter(function (x) { return !(Number(x.amount) > 0); });
      if (badTx.length) A({ kind: 'info', key: 'txnol', title: 'Transaksi dengan nominal kosong atau nol (dari 500 terakhir)', count: badTx.length, detail: badTx.slice(0, 4).map(function (x) { return x._id; }).join(', ') });
      if (coa.length) {
        var lost = txs.filter(function (x) { return x.accountCode != null && x.accountCode !== '' && !codes[String(x.accountCode)]; });
        if (lost.length) A({ kind: 'info', key: 'txakun', title: 'Transaksi memakai akun COA yang sudah tidak ada (dari 500 terakhir)', count: lost.length, detail: Object.keys(lost.reduce(function (m, x) { m[x.accountCode] = 1; return m; }, {})).slice(0, 6).join(', ') });
      }
      /* fitur yang saling bergantung */
      var dep = [['stok_input', 'stok'], ['stok_closing', 'stok'], ['jual_produk', 'stok'], ['gaji_auto', 'gaji']], msgs = [];
      dep.forEach(function (p) {
        ['kasir', 'manager', 'owner'].forEach(function (role) {
          var fa = FM_PLANS.FEATURES.filter(function (f) { return f.key === p[0]; })[0], fb = FM_PLANS.FEATURES.filter(function (f) { return f.key === p[1]; })[0];
          if (!fa || !fb || fa.r[role] !== 'o') return;
          if (FM_PLANS.has(p[0], role, t) && fb.r[role] && !FM_PLANS.has(p[1], role, t)) msgs.push('"' + fa.label.split(':')[0] + '" aktif tapi "' + fb.label.split(':')[0] + '" mati untuk ' + ({ kasir: 'Admin', manager: 'Manager', owner: 'Owner' })[role]);
        });
      });
      if (msgs.length) A({ kind: 'info', key: 'fiturbergantung', title: 'Fitur yang saling bergantung belum lengkap', count: msgs.length, detail: msgs.slice(0, 3).join('; ') });
      if (!t.isMaster && (!cfg || !cfg.uid || !Object.keys(cfg.uid).length)) A({ kind: 'info', key: 'noakun', title: 'Toko belum punya akun login', count: 1, detail: 'Buat lewat menu Akun Login' });
      return out;
    }).catch(function (e) { return [{ kind: 'info', key: 'err', tenant: id, nama: nama, title: 'Tidak bisa diperiksa', count: 1, detail: (e && e.message) || String(e) }]; });
  }
  function writeAll(pairs) {
    var p = Promise.resolve();
    for (var i = 0; i < pairs.length; i += 400) (function (part) { p = p.then(function () { var b = DB().batch(); part.forEach(function (x) { b.update(x[0], x[1]); }); return b.commit(); }); })(pairs.slice(i, i + 400));
    return p;
  }
  function scanData(say) {
    var list = tenantsToCheck(), res = [], p = Promise.resolve();
    list.forEach(function (t, i) { p = p.then(function () { say('Memeriksa ' + (t.nama || t.id) + ' (' + (i + 1) + '/' + list.length + ')…'); return checkTenant(t).then(function (r) { res = res.concat(r); }); }); });
    return p.then(function () { return res; });
  }

  /* =====================================================================
     TAMPILAN
     ===================================================================== */
  function open() {
    if (!DB()) return alert('Firestore belum terhubung. Masuk ke Tower dulu.');
    last = last || { clean: null, data: null, at: 0 };
    var ov = towerOverlay('tw-health', 'Kesehatan Sistem', 'Pindai, bersihkan server, dan periksa bug data',
      '<div style="overflow:auto;padding:0 18px 16px"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
      '<button data-a="scan" style="' + BTN + 'background:#0891b2">1. Pindai</button>' +
      '<button data-a="clean" style="' + BTN + 'background:#7c3aed">2. Bersihkan Server</button>' +
      '<button data-a="fix" style="' + BTN + 'background:#059669">3. Periksa &amp; Perbaiki Bug Data</button>' +
      '<button data-a="copy" style="' + BTN + 'background:#334155">Salin Laporan</button></div>' +
      '<div id="hl-note" style="font-size:12px;opacity:.75;margin-bottom:8px">Pindai hanya membaca. Toko yang masih terdaftar tidak pernah disentuh oleh pembersihan. Bug di tampilan atau tombol aplikasi tidak bisa dideteksi di sini: kirim screenshot-nya ke Claude.</div>' +
      '<div id="hl-out"></div></div>');
    var out = ov.el.querySelector('#hl-out'), note = ov.el.querySelector('#hl-note');
    var say = function (m) { note.innerHTML = '<span style="color:#67e8f9">' + H(m) + '</span>'; };
    function guard(fn) { return function () { if (busy) return alert('Masih ada proses berjalan.'); busy = true; Promise.resolve().then(fn).catch(function (e) { out.innerHTML = '<div style="color:#fda4af;font-size:12px">Gagal: ' + H(e && e.message) + '</div>'; }).then(function () { busy = false; }); }; }

    function rowsHtml(items, withCheck, title, color) {
      if (!items.length) return '';
      return '<div style="margin:12px 0 4px;font-weight:900;font-size:13px;color:' + color + '">' + title + '</div>' + items.map(function (it, i) {
        return '<label style="display:flex;gap:9px;align-items:flex-start;padding:8px 10px;margin-bottom:5px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);font-size:12px;cursor:' + (withCheck ? 'pointer' : 'default') + '">' +
          (withCheck ? '<input type="checkbox" data-i="' + i + '" checked style="width:16px;height:16px;margin-top:2px">' : '') +
          '<span style="flex:1"><b>' + (it.nama ? H(it.nama) + ': ' : '') + H(it.title) + (it.count ? ' — ' + fmtN(it.count) : '') + '</b>' +
          (it.detail ? '<span style="display:block;opacity:.65;font-size:11px;margin-top:2px">' + H(it.detail) + '</span>' : '') +
          (it.fixLabel ? '<span style="display:block;color:#6ee7b7;font-size:11px;margin-top:2px">Perbaikan: ' + H(it.fixLabel) + '</span>' : '') + '</span></label>';
      }).join('');
    }
    function picked(items) { return [].slice.call(out.querySelectorAll('input[data-i]:checked')).map(function (i) { return items[+i.getAttribute('data-i')]; }); }

    ov.el.querySelector('[data-a=scan]').onclick = guard(function () {
      say('Memindai server…');
      return scanClean().then(function (c) { last.clean = c; return scanData(say); }).then(function (dd) {
        last.data = dd; last.at = Date.now();
        var fixable = dd.filter(function (x) { return x.kind === 'fix'; }), info = dd.filter(function (x) { return x.kind === 'info'; });
        note.innerHTML = '<b style="color:#6ee7b7">Pindai selesai.</b> Sampah: ' + last.clean.length + ' jenis · Bug data bisa diperbaiki: ' + fixable.length + ' · Perlu keputusanmu: ' + info.length + '. Tidak ada yang diubah.';
        out.innerHTML = rowsHtml(last.clean, false, 'Sampah di server (bisa dibersihkan)', '#c4b5fd') + rowsHtml(fixable, false, 'Bug data yang bisa diperbaiki otomatis', '#6ee7b7') + rowsHtml(info, false, 'Perlu keputusanmu (hanya dilaporkan)', '#fcd34d') +
          ((last.clean.length + dd.length) ? '' : '<div style="padding:16px;text-align:center;font-size:13px;color:#6ee7b7">Server bersih, tidak ada temuan.</div>');
      });
    });
    ov.el.querySelector('[data-a=clean]').onclick = guard(function () {
      say('Mencari sampah…');
      return scanClean().then(function (c) {
        last.clean = c;
        if (!c.length) { note.innerHTML = '<b style="color:#6ee7b7">Server bersih.</b> Tidak ada sisa data.'; out.innerHTML = ''; return; }
        note.textContent = 'Centang bagian yang mau dibersihkan, lalu tekan tombol di bawah. Penghapusan tidak bisa dibatalkan.';
        out.innerHTML = rowsHtml(c, true, 'Sampah di server', '#c4b5fd') + '<button id="hl-do" style="' + BTN + 'background:#be123c;width:100%;margin-top:8px">Bersihkan yang dicentang</button>';
        out.querySelector('#hl-do').onclick = guard(function () {
          var sel = picked(c); if (!sel.length) return alert('Centang minimal satu.');
          if (!confirm('Hapus permanen ' + sel.length + ' jenis sampah? Toko yang masih terdaftar tidak disentuh.')) return;
          return runClean(sel, say).then(function (n) {
            note.innerHTML = '<b style="color:#6ee7b7">Selesai. ' + fmtN(n) + ' item dibersihkan.</b>'; out.innerHTML = '';
          });
        });
      });
    });
    ov.el.querySelector('[data-a=fix]').onclick = guard(function () {
      say('Memeriksa data toko…');
      return scanData(say).then(function (dd) {
        last.data = dd;
        var fixable = dd.filter(function (x) { return x.kind === 'fix'; }), info = dd.filter(function (x) { return x.kind === 'info'; });
        note.innerHTML = '<b style="color:#6ee7b7">Pemeriksaan selesai.</b> ' + fixable.length + ' bisa diperbaiki otomatis, ' + info.length + ' hanya dilaporkan.';
        out.innerHTML = rowsHtml(fixable, true, 'Bisa diperbaiki otomatis', '#6ee7b7') + (fixable.length ? '<button id="hl-fx" style="' + BTN + 'background:#059669;width:100%;margin-top:8px">Perbaiki yang dicentang</button>' : '') + rowsHtml(info, false, 'Perlu keputusanmu (hanya dilaporkan)', '#fcd34d') +
          (dd.length ? '' : '<div style="padding:16px;text-align:center;font-size:13px;color:#6ee7b7">Tidak ada bug data.</div>');
        var b = out.querySelector('#hl-fx');
        if (b) b.onclick = guard(function () {
          var sel = picked(fixable); if (!sel.length) return alert('Centang minimal satu.');
          if (!confirm('Perbaiki ' + sel.length + ' temuan secara otomatis?')) return;
          var p = Promise.resolve(), n = 0;
          sel.forEach(function (it) { p = p.then(function () { say('Memperbaiki ' + it.nama + ': ' + it.title + '…'); return it.run().then(function () { n++; try { ctAudit(it.tenant, 'PERBAIKI_DATA', it.title + ': ' + it.fixLabel, '-', String(it.count)); } catch (e) {} }); }); });
          return p.then(function () { note.innerHTML = '<b style="color:#6ee7b7">Selesai. ' + n + ' temuan diperbaiki.</b> Jalankan pemeriksaan lagi untuk memastikan.'; out.innerHTML = ''; });
        });
      });
    });
    ov.el.querySelector('[data-a=copy]').onclick = function () {
      if (!last || (!last.clean && !last.data)) return alert('Belum ada hasil. Tekan Pindai dulu.');
      var L = ['LAPORAN KESEHATAN SISTEM — ' + new Date().toLocaleString('id-ID')];
      (last.clean || []).forEach(function (x) { L.push('[SAMPAH] ' + x.title + (x.count ? ' — ' + x.count : '') + (x.detail ? ' (' + x.detail + ')' : '')); });
      (last.data || []).forEach(function (x) { L.push('[' + (x.kind === 'fix' ? 'BISA DIPERBAIKI' : 'LAPORAN') + '] ' + x.nama + ' [' + x.tenant + ']: ' + x.title + (x.count ? ' — ' + x.count : '') + (x.detail ? ' (' + x.detail + ')' : '')); });
      if (L.length === 1) L.push('Tidak ada temuan.');
      var txt = L.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { alert('Laporan tersalin. Tempel ke Claude bila perlu.'); }, function () { prompt('Salin laporan:', txt); });
      else prompt('Salin laporan:', txt);
    };
  }
  window.FM_HEALTH = { open: open, _scanClean: scanClean, _scanData: scanData, _runClean: runClean };
})();
