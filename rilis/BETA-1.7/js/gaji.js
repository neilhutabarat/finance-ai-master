/* gaji.js — Laporan Gaji. Manager mencatat dan melihat; Owner hanya melihat bila diizinkan di Tower.
   Data di Firestore koleksi gaji_<id toko> (dilindungi aturan Firestore). Tanpa Firebase, tersimpan di perangkat. */
(function () {
  'use strict';
  var cfg = {}, rows = [], unsub = null, month = '', editing = null, started = false, note = '';
  var ov = null;
  function role() { return window.FM_PLANS ? FM_PLANS.pageRole() : 'manager'; }
  function canEdit() { return role() === 'manager'; }
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : 'default'; }
  function col() { return 'gaji_' + tid(); }
  function hasDb() { return typeof db !== 'undefined' && db && tid() !== 'default'; }
  function lsKey() { return 'fm_gaji_' + tid(); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rp(n) { return 'Rp ' + (typeof formatThousandSeparator === 'function' ? formatThousandSeparator(Math.round(n || 0)) : Math.round(n || 0)); }
  function num(v) { return parseInt(String(v || '').replace(/[^0-9]/g, ''), 10) || 0; }
  function thisMonth() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  var BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  function monthLabel(m) { var p = (m || '').split('-'); return (BLN[parseInt(p[1], 10) - 1] || '') + ' ' + p[0]; }
  function storeName() { var t = tn(); return (t && t.nama) || document.title || 'Toko'; }

  function start() {
    if (started) return; started = true;
    if (hasDb()) {
      try {
        unsub = db.collection(col()).onSnapshot(function (s) {
          rows = []; s.forEach(function (d) { var x = d.data(); x.id = x.id || d.id; rows.push(x); }); note = ''; render();
        }, function (e) {
          note = 'Data gaji belum bisa dibaca dari server (' + ((e && e.code) || 'ditolak') + '). Pastikan aturan Firestore terbaru sudah dipasang dan akses gaji untuk peran ini sudah diizinkan.'; render();
        });
      } catch (e) { note = String(e.message || e); }
    } else {
      try { rows = JSON.parse(localStorage.getItem(lsKey()) || '[]'); } catch (e) { rows = []; }
    }
  }
  function persistLocal() { if (!hasDb()) { try { localStorage.setItem(lsKey(), JSON.stringify(rows)); } catch (e) {} } }
  function saveRec(r) {
    if (hasDb()) return db.collection(col()).doc(r.id).set(r).catch(function (e) { alert('Gagal menyimpan: ' + (e && e.message)); });
    var i = rows.findIndex(function (x) { return x.id === r.id; }); if (i >= 0) rows[i] = r; else rows.push(r); persistLocal(); render(); return Promise.resolve();
  }
  function delRec(id) {
    if (hasDb()) return db.collection(col()).doc(id).delete().catch(function (e) { alert('Gagal menghapus: ' + (e && e.message)); });
    rows = rows.filter(function (x) { return x.id !== id; }); persistLocal(); render(); return Promise.resolve();
  }

  /* ---- jurnal otomatis ke pengeluaran (opsional, dicentang di Tower) ---- */
  function autoOn() { return window.FM_PLANS && FM_PLANS.has('gaji_auto', 'manager'); }
  function postExpense(r) {
    if (!autoOn() || !cfg.addTx || r.txId) return null;
    var coa = (window.STORE && STORE.getCOA) ? STORE.getCOA() : [];
    var acc = coa.filter(function (c) { return c.category === 'expense' && /gaji|upah/i.test(c.name); })[0];
    if (!acc) { alert('Gaji tercatat, tetapi belum masuk pengeluaran: akun COA bertuliskan "Gaji" atau "Upah" (kategori Operasional) belum ada. Tambahkan di Kelola COA lalu tandai Dibayar lagi.'); return null; }
    var now = new Date(), full = now.toLocaleDateString('id-ID'), t = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var iso = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    var tx = { id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), accountCode: acc.code, accountName: acc.name, category: 'expense', isProduct: false, qty: 1, unitPrice: r.total, amount: r.total,
      tax12: 0, dpp: r.total, desc: 'Gaji ' + r.nama + ' ' + monthLabel(r.bulan), staff: (window.user && user.title) || 'Manager', isClosed: false, pay: 'tunai', dateISO: iso, date: t, dateFull: full, timestamp: Date.now() };
    cfg.addTx(tx); return tx.id;
  }

  /* ---- tampilan ---- */
  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-gaji';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var b = e.target.closest('[data-a]'); if (b) act(b.getAttribute('data-a'), b.getAttribute('data-id'));
    });
    ov.addEventListener('input', function (e) { if (e.target.hasAttribute('data-money')) { var d = num(e.target.value); e.target.value = d ? new Intl.NumberFormat('id-ID').format(d) : ''; sumForm(); } });
    ov.addEventListener('change', function (e) { if (e.target.id === 'gj-month') { month = e.target.value || thisMonth(); render(); } });
    document.body.appendChild(ov);
  }
  function monthRows() { return rows.filter(function (r) { return r.bulan === month; }).sort(function (a, b) { return String(a.nama).localeCompare(String(b.nama)); }); }
  var inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:13px;outline:none';
  var btn = 'padding:8px 13px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12px;font-weight:700;cursor:pointer';
  function render() {
    if (!ov || ov.style.display === 'none') return;
    var ed = canEdit(), list = monthRows(), tot = 0, paid = 0;
    list.forEach(function (r) { tot += r.total; if (r.status === 'dibayar') paid += r.total; });
    var h = '<div style="width:100%;max-width:920px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><div style="font-weight:800;font-size:17px">Laporan Gaji</div><div style="font-size:12px;opacity:.65">' + (ed ? 'Hanya Manager yang bisa mencatat dan mengubah.' : 'Tampilan baca saja.') + '</div></div><button data-x style="' + btn + '">Tutup</button></div>';
    if (note) h += '<p style="margin:10px 0;padding:10px 12px;border-radius:12px;background:rgba(245,158,11,.14);color:#fbbf24;font-size:12px">' + esc(note) + '</p>';
    if (editing) { ov.innerHTML = h + formHtml() + '</div>'; sumForm(); return; }
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:14px 0"><input id="gj-month" type="month" value="' + month + '" style="' + inp + ';width:auto">' +
      (ed ? '<button data-a="add" style="' + btn + ';background:#22c55e;color:#04210f;border-color:#22c55e">+ Tambah karyawan</button>' : '') +
      '<button data-a="printall" style="' + btn + '">Cetak laporan</button></div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px">' +
      [['Total gaji ' + monthLabel(month), tot], ['Sudah dibayar', paid], ['Belum dibayar', tot - paid]].map(function (x) { return '<div style="padding:10px;border-radius:14px;background:rgba(255,255,255,.07)"><div style="font-size:10.5px;opacity:.7">' + x[0] + '</div><div style="font-weight:800;font-size:14px;margin-top:2px">' + rp(x[1]) + '</div></div>'; }).join('') + '</div>';
    if (!list.length) h += '<p style="font-size:13px;opacity:.75;padding:18px 0;text-align:center">Belum ada data gaji untuk ' + monthLabel(month) + '.' + (ed ? ' Tekan "Tambah karyawan".' : '') + '</p>';
    else {
      h += '<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12px;min-width:640px"><thead><tr style="text-align:left;opacity:.7">' + ['Nama', 'Pokok', 'Tunjangan', 'Potongan', 'Total', 'Status', ''].map(function (t, i) { return '<th style="padding:7px 6px;' + (i > 0 && i < 5 ? 'text-align:right' : '') + '">' + t + '</th>'; }).join('') + '</tr></thead><tbody>';
      list.forEach(function (r) {
        h += '<tr style="border-top:1px solid rgba(255,255,255,.08)"><td style="padding:8px 6px"><b>' + esc(r.nama) + '</b><br><span style="opacity:.6;font-size:11px">' + esc(r.jabatan || '') + '</span></td>' +
          '<td style="text-align:right;padding:8px 6px">' + rp(r.pokok) + '</td><td style="text-align:right;padding:8px 6px">' + rp(r.tunjangan) + '</td><td style="text-align:right;padding:8px 6px">' + rp(r.potongan) + '</td>' +
          '<td style="text-align:right;padding:8px 6px;font-weight:800">' + rp(r.total) + '</td>' +
          '<td style="padding:8px 6px"><span style="padding:3px 9px;border-radius:99px;font-size:11px;font-weight:800;background:' + (r.status === 'dibayar' ? 'rgba(34,197,94,.2);color:#4ade80' : 'rgba(245,158,11,.2);color:#fbbf24') + '">' + (r.status === 'dibayar' ? 'Dibayar' : 'Belum') + (r.tglBayar && r.status === 'dibayar' ? ' ' + esc(r.tglBayar) : '') + '</span></td>' +
          '<td style="padding:8px 6px;white-space:nowrap;text-align:right"><button data-a="slip" data-id="' + esc(r.id) + '" style="' + btn + ';padding:5px 10px">Slip</button>' +
          (ed ? ' <button data-a="toggle" data-id="' + esc(r.id) + '" style="' + btn + ';padding:5px 10px">' + (r.status === 'dibayar' ? 'Batalkan' : 'Tandai dibayar') + '</button> <button data-a="edit" data-id="' + esc(r.id) + '" style="' + btn + ';padding:5px 10px">Ubah</button> <button data-a="del" data-id="' + esc(r.id) + '" style="' + btn + ';padding:5px 10px;color:#fb7185">Hapus</button>' : '') + '</td></tr>';
      });
      h += '</tbody></table></div>';
    }
    ov.innerHTML = h + '</div>';
  }
  function formHtml() {
    var r = editing, f = function (id, label, val, extra) { return '<div><label style="display:block;font-size:11.5px;font-weight:700;margin:0 0 4px;opacity:.8">' + label + '</label><input id="' + id + '" value="' + esc(val) + '" ' + (extra || '') + ' style="' + inp + '"></div>'; };
    return '<div style="margin-top:14px;font-weight:800">' + (r.isNew ? 'Tambah karyawan' : 'Ubah data gaji') + ' <span style="opacity:.6;font-weight:600">· ' + monthLabel(r.bulan) + '</span></div>' +
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px">' +
      f('gj-nama', 'Nama karyawan', r.nama) + f('gj-jab', 'Jabatan', r.jabatan) +
      f('gj-pokok', 'Gaji pokok (Rp)', r.pokok ? new Intl.NumberFormat('id-ID').format(r.pokok) : '', 'data-money inputmode="numeric"') + f('gj-tunj', 'Tunjangan (Rp)', r.tunjangan ? new Intl.NumberFormat('id-ID').format(r.tunjangan) : '', 'data-money inputmode="numeric"') +
      f('gj-pot', 'Potongan (Rp)', r.potongan ? new Intl.NumberFormat('id-ID').format(r.potongan) : '', 'data-money inputmode="numeric"') +
      '<div><label style="display:block;font-size:11.5px;font-weight:700;margin:0 0 4px;opacity:.8">Total diterima</label><div id="gj-total" style="padding:9px 11px;border-radius:12px;background:rgba(34,197,94,.12);font-weight:800;font-size:14px"></div></div>' +
      '<div style="grid-column:1/-1">' + f('gj-cat', 'Catatan (opsional)', r.catatan) + '</div></div>' +
      '<div style="display:flex;gap:8px;margin-top:14px"><button data-a="save" style="' + btn + ';background:#22c55e;color:#04210f;border-color:#22c55e">Simpan</button><button data-a="cancel" style="' + btn + '">Batal</button></div>';
  }
  function sumForm() { var t = document.getElementById('gj-total'); if (!t) return; var v = function (id) { var e = document.getElementById(id); return e ? num(e.value) : 0; }; t.textContent = rp(Math.max(0, v('gj-pokok') + v('gj-tunj') - v('gj-pot'))); }
  function act(a, id) {
    var r = id ? rows.filter(function (x) { return x.id === id; })[0] : null;
    if (a === 'add') { editing = { isNew: true, id: 'gj_' + Date.now(), bulan: month, nama: '', jabatan: '', pokok: 0, tunjangan: 0, potongan: 0, catatan: '', status: 'belum' }; render(); }
    else if (a === 'edit' && r) { editing = Object.assign({ isNew: false }, r); render(); }
    else if (a === 'cancel') { editing = null; render(); }
    else if (a === 'save') {
      var g = function (i) { return (document.getElementById(i) || {}).value || ''; };
      var nama = g('gj-nama').trim(); if (!nama) return alert('Nama karyawan wajib diisi.');
      var pokok = num(g('gj-pokok')), tj = num(g('gj-tunj')), pt = num(g('gj-pot'));
      var rec = { id: editing.id, tenantId: tid(), bulan: editing.bulan, nama: nama, jabatan: g('gj-jab').trim(), pokok: pokok, tunjangan: tj, potongan: pt, total: Math.max(0, pokok + tj - pt), catatan: g('gj-cat').trim(), status: editing.status || 'belum', tglBayar: editing.tglBayar || '', txId: editing.txId || '', updatedAt: Date.now() };
      editing = null; saveRec(rec).then(render);
    }
    else if (a === 'toggle' && r) {
      var rec2 = Object.assign({}, r);
      if (r.status === 'dibayar') { if (r.txId && !confirm('Pembayaran ini sudah tercatat sebagai pengeluaran. Membatalkan status TIDAK menghapus catatan pengeluarannya (hapus manual di Mutasi bila perlu). Lanjut?')) return; rec2.status = 'belum'; rec2.tglBayar = ''; }
      else { rec2.status = 'dibayar'; rec2.tglBayar = new Date().toLocaleDateString('id-ID'); var tx = postExpense(rec2); if (tx) rec2.txId = tx; }
      saveRec(rec2);
    }
    else if (a === 'del' && r) { if (confirm('Hapus data gaji ' + r.nama + ' bulan ' + monthLabel(r.bulan) + '?')) delRec(r.id); }
    else if (a === 'slip' && r) printSlip(r);
    else if (a === 'printall') printAll();
  }
  function printWin(title, body) {
    var w = window.open('', '_blank'); if (!w) return alert('Pop-up dicegah browser. Izinkan pop-up untuk mencetak.');
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>body{font-family:Arial,sans-serif;color:#111;margin:24px}h1{font-size:18px;margin:0}h2{font-size:14px;margin:2px 0 14px;font-weight:400;color:#555}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border-bottom:1px solid #ccc;padding:7px 6px;text-align:left}td.r,th.r{text-align:right}.tot td{font-weight:700;border-top:2px solid #111}.sign{margin-top:50px;display:flex;justify-content:space-between;font-size:13px}.sign div{text-align:center;width:40%}@media print{button{display:none}}</style></head><body>' + body + '<p style="margin-top:20px"><button onclick="window.print()">Cetak</button></p></body></html>');
    w.document.close(); setTimeout(function () { try { w.focus(); w.print(); } catch (e) {} }, 400);
  }
  function printAll() {
    var list = monthRows(); if (!list.length) return alert('Belum ada data untuk dicetak.');
    var tot = 0, h = '<h1>' + esc(storeName()) + '</h1><h2>Laporan Gaji ' + monthLabel(month) + '</h2><table><thead><tr><th>Nama</th><th>Jabatan</th><th class="r">Pokok</th><th class="r">Tunjangan</th><th class="r">Potongan</th><th class="r">Total</th><th>Status</th></tr></thead><tbody>';
    list.forEach(function (r) { tot += r.total; h += '<tr><td>' + esc(r.nama) + '</td><td>' + esc(r.jabatan || '') + '</td><td class="r">' + rp(r.pokok) + '</td><td class="r">' + rp(r.tunjangan) + '</td><td class="r">' + rp(r.potongan) + '</td><td class="r">' + rp(r.total) + '</td><td>' + (r.status === 'dibayar' ? 'Dibayar' : 'Belum') + '</td></tr>'; });
    printWin('Laporan Gaji', h + '<tr class="tot"><td colspan="5">Total</td><td class="r">' + rp(tot) + '</td><td></td></tr></tbody></table>');
  }
  function printSlip(r) {
    var h = '<h1>' + esc(storeName()) + '</h1><h2>Slip Gaji ' + monthLabel(r.bulan) + '</h2><table><tr><td>Nama</td><td>' + esc(r.nama) + '</td></tr><tr><td>Jabatan</td><td>' + esc(r.jabatan || '-') + '</td></tr><tr><td>Gaji pokok</td><td class="r">' + rp(r.pokok) + '</td></tr><tr><td>Tunjangan</td><td class="r">' + rp(r.tunjangan) + '</td></tr><tr><td>Potongan</td><td class="r">- ' + rp(r.potongan) + '</td></tr><tr class="tot"><td>Total diterima</td><td class="r">' + rp(r.total) + '</td></tr>' + (r.catatan ? '<tr><td>Catatan</td><td>' + esc(r.catatan) + '</td></tr>' : '') + '<tr><td>Status</td><td>' + (r.status === 'dibayar' ? 'Dibayar ' + esc(r.tglBayar || '') : 'Belum dibayar') + '</td></tr></table><div class="sign"><div>Penerima<br><br><br>(' + esc(r.nama) + ')</div><div>Pemberi<br><br><br>(................)</div></div>';
    printWin('Slip Gaji ' + r.nama, h);
  }
  function open() { ensure(); start(); month = month || thisMonth(); editing = null; ov.style.display = 'flex'; render(); }
  window.FM_GAJI = { mount: function (c) { cfg = c || {}; }, open: open };
})();
