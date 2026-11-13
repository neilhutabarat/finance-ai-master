/* piutang.js — Piutang (pelanggan berutang) dan Utang (toko berutang ke pemasok), dengan DP dan bayar sebagian.
   Data di Firestore koleksi pu_<id toko>: dokumen t:'p' = pelanggan/pemasok, t:'e' = catatan piutang/utang.
   Setiap uang yang benar-benar diterima/dibayar otomatis masuk ke Mutasi (pemasukan / pengeluaran). */
(function () {
  'use strict';
  var rows = [], unsub = null, started = false, note = '', ov = null;
  var tab = 'piutang', flt = 'berjalan', form = null, payF = null, detail = null, pform = null;
  function role() { return window.FM_PLANS ? FM_PLANS.pageRole() : 'manager'; }
  function canEdit() { return role() === 'kasir' || role() === 'manager'; }
  function canUtang() { return role() !== 'kasir'; }
  function canDel() { return role() === 'manager'; }
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : 'default'; }
  function col() { return 'pu_' + tid(); }
  function hasDb() { return typeof db !== 'undefined' && db && tid() !== 'default'; }
  function lsKey() { return 'fm_pu_' + tid(); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rp(n) { return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n || 0)); }
  function num(v) { return parseInt(String(v || '').replace(/[^0-9]/g, ''), 10) || 0; }
  function iso(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function dmy(s) { var p = String(s || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : '-'; }
  function who() { return (window.user && user.title) || (role() === 'kasir' ? 'Admin' : 'Manager'); }
  function parties(r) { return rows.filter(function (x) { return x.t === 'p' && x.role === r; }).sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); }); }
  function entries(kind) { return rows.filter(function (x) { return x.t === 'e' && x.kind === kind; }); }
  function sisa(e) { return Math.max(0, (e.total || 0) - (e.paid || 0)); }
  function overdue(e) { return sisa(e) > 0 && e.dueISO && e.dueISO < iso(); }

  function start() {
    if (started) return; started = true;
    if (hasDb()) {
      try {
        unsub = db.collection(col()).onSnapshot(function (s) {
          rows = []; s.forEach(function (d) { var x = d.data(); x.id = x.id || d.id; rows.push(x); }); note = ''; render(); badge();
        }, function (e) { note = 'Data belum bisa dibaca dari server (' + ((e && e.code) || 'ditolak') + '). Pastikan aturan Firestore terbaru sudah dipasang.'; render(); });
      } catch (e) { note = String(e.message || e); }
    } else { try { rows = JSON.parse(localStorage.getItem(lsKey()) || '[]'); } catch (e) { rows = []; } }
  }
  function persistLocal() { if (!hasDb()) { try { localStorage.setItem(lsKey(), JSON.stringify(rows)); } catch (e) {} } }
  function save(r) {
    if (hasDb()) return db.collection(col()).doc(r.id).set(r).catch(function (e) { alert('Gagal menyimpan: ' + (e && e.message)); });
    var i = rows.findIndex(function (x) { return x.id === r.id; }); if (i >= 0) rows[i] = r; else rows.push(r); persistLocal(); render(); badge(); return Promise.resolve();
  }
  function del(id) {
    if (hasDb()) return db.collection(col()).doc(id).delete().catch(function (e) { alert('Gagal menghapus: ' + (e && e.message)); });
    rows = rows.filter(function (x) { return x.id !== id; }); persistLocal(); render(); badge(); return Promise.resolve();
  }

  /* ---- uang masuk/keluar nyata -> Mutasi ---- */
  function coaOf(kind) {
    var c = (window.STORE && STORE.getCOA) ? STORE.getCOA() : [];
    return c.filter(function (a) { return kind === 'piutang' ? a.category === 'sales' : (a.category === 'cogs' || a.category === 'expense'); });
  }
  function postTx(e, amount, pay) {
    var acc = coaOf(e.kind).filter(function (a) { return String(a.code) === String(e.accCode); })[0] || coaOf(e.kind)[0];
    if (!acc) { alert('Belum ada akun COA yang cocok untuk dicatat. Tambahkan dulu di Kelola Akun (COA).'); return null; }
    if (typeof txList === 'undefined') return 'tanpa-mutasi';
    var now = new Date(), full = now.toLocaleDateString('id-ID'), t = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var masuk = e.kind === 'piutang';
    var tx = { id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), accountCode: acc.code, accountName: acc.name, category: acc.category, isProduct: false, qty: 1, unitPrice: amount, amount: amount,
      tax12: 0, dpp: amount, desc: (masuk ? 'Terima bayar piutang ' : 'Bayar utang ') + e.partyName + (e.desc ? ' — ' + e.desc : ''), staff: who(), isClosed: false, pay: pay || 'tunai', dateISO: iso(now), date: t, dateFull: full, timestamp: Date.now(), piutangId: e.id };
    try { if (window.FM_BIZ && FM_BIZ.enabled() && e.biz) tx.biz = e.biz; } catch (x) {}
    try { var cu = JSON.parse(localStorage.getItem('currentUser') || 'null'); if (cu && cu.role === 'staff' && cu.slot) { tx.adminSlot = cu.slot; if (cu.biz && !tx.biz) tx.biz = cu.biz; } } catch (x) {}
    txList.unshift(tx);
    try { persistData(); } catch (x) {}
    try { if (typeof db !== 'undefined' && db && typeof tenantFirestoreCol !== 'undefined') db.collection(tenantFirestoreCol).add(Object.assign({}, tx, { timestamp: firebase.firestore.FieldValue.serverTimestamp() })).catch(console.error); } catch (x) {}
    try { if (typeof renderAllReports === 'function') renderAllReports(); } catch (x) {}
    return tx.id;
  }
  function addPayment(e, amount, pay) {
    var id = postTx(e, amount, pay); if (id === null) return false;
    var r = Object.assign({}, e); r.payments = (e.payments || []).concat([{ ms: Date.now(), amount: amount, pay: pay || 'tunai', by: who(), txId: id === 'tanpa-mutasi' ? '' : id }]);
    r.paid = (e.paid || 0) + amount; r.status = r.paid >= r.total ? 'lunas' : 'berjalan';
    save(r); return true;
  }

  function badge() {
    var n = entries('piutang').filter(overdue).length + (canUtang() ? entries('utang').filter(overdue).length : 0);
    [].forEach.call(document.querySelectorAll('[data-piu-badge]'), function (b) { b.textContent = n ? ' · ' + n + ' jatuh tempo' : ''; });
  }

  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:13px;outline:none';
  var btn = 'padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12px;font-weight:700;cursor:pointer';
  var green = ';background:#22c55e;color:#04210f;border-color:#22c55e';
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-piu';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var b = e.target.closest('[data-a]'); if (b) act(b.getAttribute('data-a'), b.getAttribute('data-id'));
    });
    ov.addEventListener('input', function (e) { if (e.target.hasAttribute('data-money')) { var d = num(e.target.value); e.target.value = d ? new Intl.NumberFormat('id-ID').format(d) : ''; } });
    document.body.appendChild(ov);
  }
  function lab(t, el) { return '<div><label style="display:block;font-size:11.5px;font-weight:700;margin:0 0 4px;opacity:.8">' + t + '</label>' + el + '</div>'; }
  function field(id, t, v, extra) { return lab(t, '<input id="' + id + '" value="' + esc(v == null ? '' : v) + '" style="' + inp + '" ' + (extra || '') + '>'); }
  function shell(inner) {
    return '<div style="width:100%;max-width:880px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px">' + inner + '</div>';
  }
  function head(sub) { return '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><div style="font-weight:800;font-size:17px">Piutang &amp; Utang</div><div style="font-size:12px;opacity:.65">' + sub + '</div></div><button data-x style="' + btn + '">Tutup</button></div>'; }

  function render() {
    if (!ov || ov.style.display === 'none') return;
    var ed = canEdit(), h = head(ed ? 'Catat, terima bayar, dan pantau jatuh tempo.' : 'Tampilan baca saja.');
    if (note) h += '<p style="margin:10px 0;padding:10px 12px;border-radius:12px;background:rgba(245,158,11,.14);color:#fbbf24;font-size:12px">' + esc(note) + '</p>';
    if (form) { ov.innerHTML = shell(h + formHtml()); return; }
    if (payF) { ov.innerHTML = shell(h + payHtml()); return; }
    if (detail) { ov.innerHTML = shell(h + detailHtml()); return; }
    if (pform) { ov.innerHTML = shell(h + partyFormHtml()); return; }
    var tabs = [['piutang', 'Piutang (pelanggan)']].concat(canUtang() ? [['utang', 'Utang (pemasok)']] : []).concat([['pihak', canUtang() ? 'Pelanggan & Pemasok' : 'Pelanggan']]);
    var pi = entries('piutang'), ut = entries('utang');
    var sumP = pi.reduce(function (a, e) { return a + sisa(e); }, 0), sumU = ut.reduce(function (a, e) { return a + sisa(e); }, 0);
    var od = pi.filter(overdue).length + (canUtang() ? ut.filter(overdue).length : 0);
    h += '<div style="display:grid;grid-template-columns:repeat(' + (canUtang() ? 3 : 2) + ',minmax(0,1fr));gap:8px;margin:14px 0">' +
      '<div style="padding:10px;border-radius:14px;background:rgba(34,197,94,.12)"><div style="font-size:10.5px;opacity:.7">Piutang belum dibayar</div><div style="font-weight:800;font-size:14px">' + rp(sumP) + '</div></div>' +
      (canUtang() ? '<div style="padding:10px;border-radius:14px;background:rgba(251,113,133,.12)"><div style="font-size:10.5px;opacity:.7">Utang belum dibayar</div><div style="font-weight:800;font-size:14px">' + rp(sumU) + '</div></div>' : '') +
      '<div style="padding:10px;border-radius:14px;background:rgba(255,255,255,.07)"><div style="font-size:10.5px;opacity:.7">Lewat jatuh tempo</div><div style="font-weight:800;font-size:14px;color:' + (od ? '#fbbf24' : 'inherit') + '">' + od + ' catatan</div></div></div>';
    h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' + tabs.map(function (t) { return '<button data-a="tab" data-id="' + t[0] + '" style="' + btn + (tab === t[0] ? green : '') + '">' + t[1] + '</button>'; }).join('') + '</div>';
    if (tab === 'pihak') h += pihakHtml(ed); else h += listHtml(tab, ed);
    ov.innerHTML = shell(h);
  }
  function listHtml(kind, ed) {
    var all = entries(kind), list = all.filter(function (e) { return flt === 'semua' || (flt === 'lunas' ? e.status === 'lunas' : e.status !== 'lunas'); })
      .sort(function (a, b) { return (a.dueISO || '9999') < (b.dueISO || '9999') ? -1 : 1; });
    var h = '<div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;flex-wrap:wrap">' + ['berjalan', 'lunas', 'semua'].map(function (f) { return '<button data-a="flt" data-id="' + f + '" style="' + btn + ';padding:5px 10px' + (flt === f ? green : '') + '">' + f[0].toUpperCase() + f.slice(1) + '</button>'; }).join('') +
      '<span style="flex:1"></span>' + (ed ? '<button data-a="new" data-id="' + kind + '" style="' + btn + green + '">+ Catat ' + (kind === 'piutang' ? 'piutang' : 'utang') + '</button>' : '') + '</div>';
    if (!list.length) return h + '<p style="font-size:13px;opacity:.75;padding:18px 0;text-align:center">Belum ada catatan ' + flt + '.</p>';
    h += '<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12px;min-width:600px"><thead><tr style="text-align:left;opacity:.7"><th style="padding:7px 6px">' + (kind === 'piutang' ? 'Pelanggan' : 'Pemasok') + '</th><th style="text-align:right">Total</th><th style="text-align:right">Terbayar</th><th style="text-align:right">Sisa</th><th>Jatuh tempo</th><th></th></tr></thead><tbody>';
    list.forEach(function (e) {
      var od = overdue(e);
      h += '<tr style="border-top:1px solid rgba(255,255,255,.08)"><td style="padding:8px 6px"><b>' + esc(e.partyName) + '</b><br><span style="opacity:.6;font-size:11px">' + esc(e.desc || '') + '</span></td>' +
        '<td style="text-align:right">' + rp(e.total) + '</td><td style="text-align:right">' + rp(e.paid) + '</td><td style="text-align:right;font-weight:800">' + (e.status === 'lunas' ? '<span style="color:#4ade80">Lunas</span>' : rp(sisa(e))) + '</td>' +
        '<td style="color:' + (od ? '#fbbf24' : 'inherit') + ';font-weight:' + (od ? 800 : 500) + '">' + dmy(e.dueISO) + (od ? ' ⚠' : '') + '</td>' +
        '<td style="white-space:nowrap;text-align:right">' + (ed && e.status !== 'lunas' ? '<button data-a="pay" data-id="' + esc(e.id) + '" style="' + btn + ';padding:5px 10px' + green + '">' + (kind === 'piutang' ? 'Terima' : 'Bayar') + '</button> ' : '') +
        '<button data-a="det" data-id="' + esc(e.id) + '" style="' + btn + ';padding:5px 10px">Riwayat</button></td></tr>';
    });
    return h + '</tbody></table></div>';
  }
  function pihakHtml(ed) {
    var h = '<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">' + (ed ? '<button data-a="pnew" data-id="pelanggan" style="' + btn + green + '">+ Pelanggan</button>' + (canUtang() ? '<button data-a="pnew" data-id="pemasok" style="' + btn + '">+ Pemasok</button>' : '') : '') + '</div>';
    var list = parties('pelanggan').concat(canUtang() ? parties('pemasok') : []);
    if (!list.length) return h + '<p style="font-size:13px;opacity:.75;padding:18px 0;text-align:center">Belum ada data. Nama juga otomatis tersimpan saat kamu mencatat piutang atau utang.</p>';
    h += '<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12px;min-width:520px"><tbody>';
    list.forEach(function (p) {
      var k = p.role === 'pelanggan' ? 'piutang' : 'utang', owe = entries(k).filter(function (e) { return e.partyId === p.id; }).reduce(function (a, e) { return a + sisa(e); }, 0);
      h += '<tr style="border-top:1px solid rgba(255,255,255,.08)"><td style="padding:8px 6px"><b>' + esc(p.name) + '</b> <span style="opacity:.6;font-size:11px">' + p.role + '</span><br><span style="opacity:.6;font-size:11px">' + esc(p.phone || '') + (p.note ? ' · ' + esc(p.note) : '') + '</span></td>' +
        '<td style="text-align:right;font-weight:800;color:' + (owe ? '#fbbf24' : 'inherit') + '">' + (owe ? 'Sisa ' + rp(owe) : '—') + '</td><td style="text-align:right;white-space:nowrap">' +
        (owe && p.phone ? '<button data-a="wa" data-id="' + esc(p.id) + '" style="' + btn + ';padding:5px 10px">' + (k === 'piutang' ? 'Tagih WA' : 'Hubungi WA') + '</button> ' : '') +
        (ed ? '<button data-a="pedit" data-id="' + esc(p.id) + '" style="' + btn + ';padding:5px 10px">Ubah</button>' : '') + (canDel() && !owe ? ' <button data-a="pdel" data-id="' + esc(p.id) + '" style="' + btn + ';padding:5px 10px;color:#fb7185">Hapus</button>' : '') + '</td></tr>';
    });
    return h + '</tbody></table></div>';
  }
  function formHtml() {
    var f = form, k = f.kind, ps = parties(k === 'piutang' ? 'pelanggan' : 'pemasok'), ac = coaOf(k);
    return '<div style="margin-top:14px;font-weight:800">Catat ' + (k === 'piutang' ? 'piutang (pelanggan berutang)' : 'utang (toko berutang)') + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px">' +
      lab(k === 'piutang' ? 'Pelanggan' : 'Pemasok', '<input id="pu-party" list="pu-pl" autocomplete="off" placeholder="ketik nama atau pilih" style="' + inp + '"><datalist id="pu-pl">' + ps.map(function (p) { return '<option value="' + esc(p.name) + '">'; }).join('') + '</datalist>') +
      field('pu-desc', 'Keterangan', '', 'placeholder="mis. 2 bal kertas"') +
      field('pu-total', 'Total (Rp)', '', 'data-money inputmode="numeric"') + field('pu-dp', 'DP / dibayar sekarang (Rp, boleh kosong)', '', 'data-money inputmode="numeric"') +
      field('pu-due', 'Jatuh tempo', '', 'type="date"') +
      lab('Metode DP', '<select id="pu-pay" style="' + inp + '"><option value="tunai">Tunai</option><option value="qris">QRIS</option><option value="transfer">Transfer</option></select>') +
      lab('Dicatat ke akun ' + (k === 'piutang' ? 'pemasukan' : 'pengeluaran'), '<select id="pu-acc" style="' + inp + '">' + ac.map(function (a) { return '<option value="' + esc(a.code) + '">[' + esc(a.code) + '] ' + esc(a.name) + '</option>'; }).join('') + '</select>') +
      '</div><p style="font-size:11.5px;opacity:.65;margin:8px 0 0">Uang baru masuk ke Mutasi saat benar-benar ' + (k === 'piutang' ? 'diterima' : 'dibayar') + ' (DP dan tiap cicilan).</p>' +
      '<div style="display:flex;gap:8px;margin-top:14px"><button data-a="fsave" style="' + btn + green + '">Simpan</button><button data-a="cancel" style="' + btn + '">Batal</button></div>';
  }
  function payHtml() {
    var e = payF, masuk = e.kind === 'piutang';
    return '<div style="margin-top:14px;font-weight:800">' + (masuk ? 'Terima pembayaran' : 'Bayar utang') + ' · ' + esc(e.partyName) + '</div><div style="font-size:12px;opacity:.7">Sisa ' + rp(sisa(e)) + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px">' + field('pp-amt', 'Jumlah (Rp)', new Intl.NumberFormat('id-ID').format(sisa(e)), 'data-money inputmode="numeric"') +
      lab('Metode', '<select id="pp-pay" style="' + inp + '"><option value="tunai">Tunai</option><option value="qris">QRIS</option><option value="transfer">Transfer</option></select>') + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:14px"><button data-a="psave" style="' + btn + green + '">Simpan pembayaran</button><button data-a="cancel" style="' + btn + '">Batal</button></div>';
  }
  function detailHtml() {
    var e = detail, h = '<div style="margin-top:14px;font-weight:800">' + esc(e.partyName) + ' · ' + esc(e.desc || '') + '</div><div style="font-size:12px;opacity:.7">Total ' + rp(e.total) + ' · terbayar ' + rp(e.paid) + ' · sisa ' + rp(sisa(e)) + ' · tempo ' + dmy(e.dueISO) + '</div>';
    h += (e.payments || []).length ? '<div style="margin-top:10px">' + e.payments.map(function (p) { return '<div style="display:flex;justify-content:space-between;padding:7px 0;border-top:1px solid rgba(255,255,255,.08);font-size:12.5px"><span>' + new Date(p.ms).toLocaleString('id-ID') + ' · ' + esc(p.pay) + ' · ' + esc(p.by || '') + '</span><b>' + rp(p.amount) + '</b></div>'; }).join('') + '</div>' : '<p style="opacity:.7;font-size:12.5px;margin-top:10px">Belum ada pembayaran.</p>';
    return h + '<div style="display:flex;gap:8px;margin-top:14px"><button data-a="cancel" style="' + btn + '">Kembali</button>' + (canDel() && !(e.payments || []).length ? '<button data-a="edel" data-id="' + esc(e.id) + '" style="' + btn + ';color:#fb7185">Hapus catatan</button>' : '') + '</div>';
  }
  function partyFormHtml() {
    var p = pform;
    return '<div style="margin-top:14px;font-weight:800">' + (p.isNew ? 'Tambah ' : 'Ubah ') + p.role + '</div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px">' +
      field('pf-name', 'Nama', p.name) + field('pf-phone', 'No. WhatsApp (mis. 0812...)', p.phone || '', 'inputmode="tel"') + '<div style="grid-column:1/-1">' + field('pf-note', 'Catatan (opsional)', p.note || '') + '</div></div>' +
      '<div style="display:flex;gap:8px;margin-top:14px"><button data-a="pfsave" style="' + btn + green + '">Simpan</button><button data-a="cancel" style="' + btn + '">Batal</button></div>';
  }
  function g(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function ensureParty(role, name, phone) {
    var nm = name.trim(), ex = parties(role).filter(function (p) { return p.name.toLowerCase() === nm.toLowerCase(); })[0];
    if (ex) return ex;
    var p = { id: 'pp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 3), t: 'p', tenantId: tid(), role: role, name: nm, phone: phone || '', note: '', createdMs: Date.now() };
    save(p); return p;
  }
  async function act(a, id) {
    var e = id ? rows.filter(function (x) { return x.id === id; })[0] : null;
    if (a === 'tab') { tab = id; render(); }
    else if (a === 'flt') { flt = id; render(); }
    else if (a === 'cancel') { form = payF = detail = pform = null; render(); }
    else if (a === 'new') { form = { kind: id }; render(); }
    else if (a === 'pay' && e) { payF = e; render(); }
    else if (a === 'det' && e) { detail = e; render(); }
    else if (a === 'pnew') { pform = { isNew: true, role: id, name: '' }; render(); }
    else if (a === 'pedit' && e) { pform = Object.assign({ isNew: false }, e); render(); }
    else if (a === 'pdel' && e) { if (await fmAsk('Hapus ' + e.name + ' dari daftar?')) del(e.id); }
    else if (a === 'edel' && e) { if (await fmAsk('Hapus catatan ini?')) { detail = null; del(e.id); } }
    else if (a === 'wa' && e) {
      var k = e.role === 'pelanggan' ? 'piutang' : 'utang', owe = entries(k).filter(function (x) { return x.partyId === e.id && sisa(x) > 0; });
      var tot = owe.reduce(function (s, x) { return s + sisa(x); }, 0), ph = String(e.phone).replace(/[^0-9]/g, ''); if (ph[0] === '0') ph = '62' + ph.slice(1);
      var tk = tn(), msg = k === 'piutang' ? 'Halo ' + e.name + ', kami dari ' + ((tk && tk.nama) || 'toko') + '. Mengingatkan sisa pembayaran ' + rp(tot) + '. Terima kasih.' : 'Halo ' + e.name + ', dari ' + ((tk && tk.nama) || 'toko') + '. Terkait tagihan kami sebesar ' + rp(tot) + '.';
      window.open('https://wa.me/' + ph + '?text=' + encodeURIComponent(msg), '_blank');
    }
    else if (a === 'pfsave') {
      var nm = g('pf-name').trim(); if (!nm) return alert('Nama wajib diisi.');
      var rec = Object.assign({}, pform); delete rec.isNew;
      if (pform.isNew) rec = { id: 'pp_' + Date.now(), t: 'p', tenantId: tid(), role: pform.role, createdMs: Date.now() };
      rec.name = nm; rec.phone = g('pf-phone').trim(); rec.note = g('pf-note').trim();
      pform = null; await save(rec); render();
    }
    else if (a === 'fsave') {
      var k2 = form.kind, party = g('pu-party').trim(), total = num(g('pu-total')), dp = num(g('pu-dp'));
      if (!party) return alert('Nama wajib diisi.'); if (total < 1) return alert('Total harus lebih dari 0.');
      if (dp > total) return alert('DP tidak boleh lebih besar dari total.');
      var pt = ensureParty(k2 === 'piutang' ? 'pelanggan' : 'pemasok', party);
      var ent = { id: 'pe_' + Date.now(), t: 'e', tenantId: tid(), kind: k2, partyId: pt.id, partyName: pt.name, desc: g('pu-desc').trim(), total: total, paid: 0, dueISO: g('pu-due') || '', dateISO: iso(), status: 'berjalan', accCode: g('pu-acc'), payments: [], createdMs: Date.now(), by: who() };
      form = null;
      if (dp > 0) { if (!addPayment(ent, dp, g('pu-pay'))) { form = { kind: k2 }; return; } } else await save(ent);
      render();
    }
    else if (a === 'psave') {
      var amt = num(g('pp-amt')); if (amt < 1) return alert('Jumlah tidak valid.'); if (amt > sisa(payF)) return alert('Melebihi sisa ' + rp(sisa(payF)) + '.');
      var ee = payF; if (addPayment(ee, amt, g('pp-pay'))) { payF = null; render(); }
    }
  }
  function open() { ensure(); start(); form = payF = detail = pform = null; if (tab === 'utang' && !canUtang()) tab = 'piutang'; ov.style.display = 'flex'; render(); }
  window.FM_PIU = { open: open, mount: function () {}, start: start, all: function () { start(); return rows.slice(); },
    totals: function () { start(); var a = 0, b = 0; entries('piutang').forEach(function (e) { a += sisa(e); }); entries('utang').forEach(function (e) { b += sisa(e); }); return { piutang: a, utang: b, ready: rows.length > 0 || started }; } };
  function floatBtn() {
    try { if (!(window.FM_PLANS && FM_PLANS.has('piutang'))) return; } catch (e) { return; }
    start();
    if (document.querySelector('[onclick*="FM_PIU"]')) return;
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('onclick', 'FM_PIU.open()');
    b.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:2147482000;padding:11px 16px;border-radius:999px;background:#2f55d4;color:#fff;font:800 12.5px -apple-system,sans-serif;border:0;box-shadow:0 8px 24px rgba(0,0,0,.35)';
    b.innerHTML = 'Piutang<span data-piu-badge></span>'; document.body.appendChild(b); badge();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(floatBtn, 600); }); else setTimeout(floatBtn, 600);
})();
