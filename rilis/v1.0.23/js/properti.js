/* properti.js — Modul Properti (BETA 8.8-8.9): kost, kontrakan, ruko, atau unit sewa lain.
   Unit -> Penyewa (kontrak) -> Tagihan sewa bulanan -> Bayar (otomatis masuk Mutasi sebagai pemasukan) -> Pengingat WhatsApp.
   Data memakai koleksi pu_<id toko> (jenis dokumen: xu = unit, xs = penyewa/kontrak, xb = tagihan), jadi tidak butuh aturan Firestore baru. */
(function () {
  'use strict';
  var rows = [], started = false, ov = null, tab = 'ringkas', month = '', form = null, payF = null, note = '', noteErr = false;
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : 'default'; }
  function col() { return 'pu_' + tid(); }
  function hasDb() { return typeof db !== 'undefined' && db && tid() !== 'default'; }
  function lsKey() { return 'fm_prop_' + tid(); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rp(n) { return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n || 0)); }
  function num(v) { return parseInt(String(v || '').replace(/[^0-9]/g, ''), 10) || 0; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dmy(s) { var p = String(s || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : '-'; }
  var BL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  function mLabel(m) { var p = String(m || '').split('-'); return p.length === 2 ? BL[(Number(p[1]) || 1) - 1] + ' ' + p[0] : m; }
  function who() { return (window.user && user.title) || (window.FM_PLANS && FM_PLANS.pageRole && FM_PLANS.pageRole() === 'owner' ? 'Owner' : 'Manager'); }
  function uid(p) { return p + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4); }
  function byT(t) { return rows.filter(function (x) { return x.t === t; }); }
  function units() { return byT('xu').sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'id', { numeric: true }); }); }
  function sewas() { return byT('xs'); }
  function bills() { return byT('xb'); }
  function unitById(id) { return units().filter(function (u) { return u.id === id; })[0]; }
  function sewaById(id) { return sewas().filter(function (s) { return s.id === id; })[0]; }
  function activeSewaOf(unitId) { return sewas().filter(function (s) { return s.unitId === unitId && s.status === 'aktif'; })[0]; }
  function sisa(b) { return Math.max(0, (b.amount || 0) - (b.paid || 0)); }
  function late(b) { return sisa(b) > 0 && b.dueISO && b.dueISO < iso(); }

  function start() {
    if (started) return; started = true;
    if (hasDb()) {
      try {
        db.collection(col()).onSnapshot(function (s) {
          rows = []; s.forEach(function (d) { var x = d.data(); if (/^x[usb]$/.test(x.t || '')) { x.id = x.id || d.id; rows.push(x); } }); note = ''; render();
        }, function (e) { note = 'Data belum bisa dibaca dari server (' + ((e && e.code) || 'ditolak') + ').'; noteErr = true; render(); });
      } catch (e) { note = String(e.message || e); noteErr = true; }
    } else { try { rows = JSON.parse(localStorage.getItem(lsKey()) || '[]'); } catch (e) { rows = []; } }
  }
  function save(r) {
    if (hasDb()) return db.collection(col()).doc(r.id).set(r).catch(function (e) { alert('Gagal menyimpan: ' + (e && e.message)); });
    var i = rows.findIndex(function (x) { return x.id === r.id; }); if (i >= 0) rows[i] = r; else rows.push(r);
    try { localStorage.setItem(lsKey(), JSON.stringify(rows)); } catch (e) {} render(); return Promise.resolve();
  }
  function del(id) {
    if (hasDb()) return db.collection(col()).doc(id).delete().catch(function (e) { alert('Gagal menghapus: ' + (e && e.message)); });
    rows = rows.filter(function (x) { return x.id !== id; }); try { localStorage.setItem(lsKey(), JSON.stringify(rows)); } catch (e) {} render(); return Promise.resolve();
  }
  function say(t, err) { note = t || ''; noteErr = !!err; }

  /* ---- uang sewa yang diterima -> Mutasi ---- */
  function salesCoa() { try { return (STORE.getCOA() || []).filter(function (a) { return a.category === 'sales'; }); } catch (e) { return []; } }
  function defAcc() { var l = salesCoa(), sv = ''; try { sv = localStorage.getItem('fm_prop_acc_' + tid()) || ''; } catch (e) {} return l.filter(function (a) { return String(a.code) === sv; })[0] || l.filter(function (a) { return /sewa|kost|kontrak/i.test(a.name); })[0] || l[0]; }
  function postTx(b, s, u, amount, pay, accCode) {
    var acc = salesCoa().filter(function (a) { return String(a.code) === String(accCode); })[0] || defAcc();
    if (!acc) { alert('Belum ada akun Pendapatan di COA. Tambahkan dulu di Kelola Akun (COA), mis. "Pendapatan Sewa".'); return null; }
    try { localStorage.setItem('fm_prop_acc_' + tid(), String(acc.code)); } catch (e) {}
    if (typeof txList === 'undefined') return 'tanpa-mutasi';
    var now = new Date(), t = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var tx = { id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), accountCode: acc.code, accountName: acc.name, category: acc.category, isProduct: false, qty: 1, unitPrice: amount, amount: amount,
      tax12: 0, dpp: amount, desc: 'Terima sewa ' + u.name + ' - ' + s.name + ' (' + mLabel(b.month) + ')', staff: who(), isClosed: false, pay: pay || 'tunai', dateISO: iso(now), date: t, dateFull: now.toLocaleDateString('id-ID'), timestamp: Date.now(), propBillId: b.id };
    txList.unshift(tx);
    try { persistData(); } catch (x) {}
    try { if (typeof db !== 'undefined' && db && typeof tenantFirestoreCol !== 'undefined') db.collection(tenantFirestoreCol).add(Object.assign({}, tx, { timestamp: firebase.firestore.FieldValue.serverTimestamp() })).catch(console.error); } catch (x) {}
    try { if (typeof renderAllReports === 'function') renderAllReports(); } catch (x) {}
    return tx.id;
  }

  /* ---- hitungan ---- */
  function monthBills(m) { return bills().filter(function (b) { return b.month === m; }); }
  function summary(m) {
    var us = units(), occ = us.filter(function (u) { return !!activeSewaOf(u.id); }).length, mb = monthBills(m);
    var due = 0, got = 0; mb.forEach(function (b) { due += b.amount || 0; got += b.paid || 0; });
    var pot = us.reduce(function (a, u) { var s = activeSewaOf(u.id); return a + (s ? (s.rate || 0) : 0); }, 0);
    return { total: us.length, occ: occ, pct: us.length ? Math.round(occ * 100 / us.length) : 0, due: due, got: got, left: Math.max(0, due - got), pot: pot, tunggak: bills().filter(late) };
  }
  function genBills(m) {
    var made = 0, jobs = [];
    sewas().filter(function (s) { return s.status === 'aktif'; }).forEach(function (s) {
      if ((s.startISO || '').slice(0, 7) > m) return;
      if (s.endISO && s.endISO.slice(0, 7) < m) return;
      var id = 'xb_' + s.id + '_' + m;
      if (bills().some(function (b) { return b.id === id; })) return;
      var dd = Math.min(28, Math.max(1, Number(s.dueDay) || 1));
      jobs.push(save({ t: 'xb', id: id, sewaId: s.id, unitId: s.unitId, month: m, amount: s.rate || 0, dueISO: m + '-' + pad(dd), paid: 0, payments: [], status: 'belum' })); made++;
    });
    return Promise.all(jobs).then(function () { return made; });
  }
  function waLink(b) {
    var s = sewaById(b.sewaId), u = unitById(b.unitId); if (!s || !s.phone) return '';
    var p = String(s.phone).replace(/[^0-9]/g, ''); if (p.indexOf('0') === 0) p = '62' + p.slice(1); else if (p.indexOf('62') !== 0) p = '62' + p;
    var tx = 'Halo ' + s.name + ', ini pengingat sewa ' + (u ? u.name : '') + ' bulan ' + mLabel(b.month) + ' sebesar ' + rp(sisa(b)) + ', jatuh tempo ' + dmy(b.dueISO) + '. Terima kasih.';
    return 'https://wa.me/' + p + '?text=' + encodeURIComponent(tx);
  }

  /* ---- tampilan ---- */
  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:13px;outline:none';
  var btn = 'padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-block';
  var green = ';background:#22c55e;color:#04210f;border-color:#22c55e';
  var red = ';background:rgba(239,68,68,.18);color:#fca5a5;border-color:rgba(239,68,68,.4)';
  function lab(t, el) { return '<div><label style="display:block;font-size:11.5px;font-weight:700;margin:0 0 4px;opacity:.8">' + t + '</label>' + el + '</div>'; }
  function field(id, t, v, extra) { return lab(t, '<input id="' + id + '" value="' + esc(v == null ? '' : v) + '" style="' + inp + '" ' + (extra || '') + '>'); }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-prop';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var t = e.target.closest('[data-tab]'); if (t) { tab = t.getAttribute('data-tab'); form = payF = null; say(''); return render(); }
      var b = e.target.closest('[data-a]'); if (b) act(b.getAttribute('data-a'), b.getAttribute('data-id'));
    });
    ov.addEventListener('input', function (e) { if (e.target.hasAttribute('data-money')) { var d = num(e.target.value); e.target.value = d ? new Intl.NumberFormat('id-ID').format(d) : ''; } });
    ov.addEventListener('change', function (e) { if (e.target.id === 'pr-month' && e.target.value) { month = e.target.value; render(); } });
    document.body.appendChild(ov);
  }
  function render() {
    if (!ov || ov.style.display === 'none') return;
    var tabs = [['ringkas', 'Ringkasan'], ['unit', 'Unit'], ['sewa', 'Penyewa'], ['tagih', 'Tagihan']];
    var h = '<div style="width:100%;max-width:900px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><div style="font-size:17px;font-weight:800;flex:1">Properti</div><button data-x style="' + btn + '">Tutup</button></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' + tabs.map(function (t) { return '<button data-tab="' + t[0] + '" style="' + btn + (tab === t[0] ? green : '') + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      (note ? '<div style="margin-bottom:10px;font-size:12.5px;font-weight:700;color:' + (noteErr ? '#fca5a5' : '#86efac') + '">' + esc(note) + '</div>' : '') +
      (tab === 'unit' ? vUnit() : tab === 'sewa' ? vSewa() : tab === 'tagih' ? vTagih() : vRingkas()) + '</div>';
    ov.innerHTML = h;
  }
  function card(t, v, sub) { return '<div style="flex:1;min-width:150px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.06)"><div style="font-size:11.5px;opacity:.7;font-weight:700">' + t + '</div><div style="font-size:19px;font-weight:800;margin-top:3px">' + v + '</div>' + (sub ? '<div style="font-size:11px;opacity:.65;margin-top:2px">' + sub + '</div>' : '') + '</div>'; }
  function vRingkas() {
    var m = month, s = summary(m);
    var h = '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">' + card('Okupansi', s.pct + '%', s.occ + ' dari ' + s.total + ' unit terisi') + card('Potensi sewa per bulan', rp(s.pot), 'dari penyewa aktif') + card('Ditagih ' + mLabel(m), rp(s.due), 'terbayar ' + rp(s.got)) + card('Belum dibayar ' + mLabel(m), rp(s.left)) + '</div>';
    h += '<div style="font-weight:800;font-size:13px;margin:6px 0">Tunggakan (lewat jatuh tempo)</div>';
    h += s.tunggak.length ? s.tunggak.sort(function (a, b) { return a.dueISO < b.dueISO ? -1 : 1; }).map(function (b) {
      var se = sewaById(b.sewaId), u = unitById(b.unitId);
      return '<div style="display:flex;gap:10px;align-items:center;padding:8px 4px;border-bottom:1px solid rgba(255,255,255,.08);font-size:13px"><div style="flex:1"><b>' + esc(u ? u.name : '-') + '</b> · ' + esc(se ? se.name : '-') + '<div style="font-size:11.5px;opacity:.7">' + mLabel(b.month) + ' · jatuh tempo ' + dmy(b.dueISO) + '</div></div><div style="font-weight:800;color:#fca5a5">' + rp(sisa(b)) + '</div></div>';
    }).join('') : '<div style="opacity:.7;font-size:12.5px;padding:8px 0">Tidak ada tunggakan.</div>';
    if (!s.total) h += '<div style="margin-top:12px;padding:12px;border-radius:14px;background:rgba(255,255,255,.06);font-size:12.5px">Mulai dari tab <b>Unit</b> (daftar kamar atau ruko), lalu <b>Penyewa</b>, lalu <b>Tagihan</b>.</div>';
    return h;
  }
  function vUnit() {
    var f = form && form.k === 'unit' ? form : null, us = units();
    var h = '<div style="display:flex;justify-content:flex-end;margin-bottom:8px"><button data-a="unit-new" style="' + btn + green + '">+ Tambah unit</button></div>';
    if (f) {
      h += '<div style="padding:12px;border-radius:16px;background:rgba(255,255,255,.06);margin-bottom:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px">' +
        field('pu-name', 'Nama unit (mis. Kamar 1)', f.v.name) + field('pu-kind', 'Jenis (kost, kontrakan, ruko)', f.v.kind) + field('pu-rate', 'Tarif sewa per bulan (Rp)', f.v.rate ? new Intl.NumberFormat('id-ID').format(f.v.rate) : '', 'data-money inputmode="numeric"') + field('pu-note', 'Catatan (opsional)', f.v.note) +
        '<div style="display:flex;gap:8px;align-items:end"><button data-a="unit-save" style="' + btn + green + '">Simpan</button><button data-a="cancel" style="' + btn + '">Batal</button></div></div>';
    }
    h += us.length ? us.map(function (u) {
      var s = activeSewaOf(u.id);
      return '<div style="display:flex;gap:10px;align-items:center;padding:9px 4px;border-bottom:1px solid rgba(255,255,255,.08);font-size:13px"><div style="flex:1"><b>' + esc(u.name) + '</b> <span style="opacity:.65">' + esc(u.kind || '') + '</span><div style="font-size:11.5px;opacity:.7">' + rp(u.rate) + ' per bulan' + (u.note ? ' · ' + esc(u.note) : '') + '</div></div>' +
        '<span style="font-size:11.5px;font-weight:800;color:' + (s ? '#86efac' : '#fcd34d') + '">' + (s ? 'Terisi: ' + esc(s.name) : 'Kosong') + '</span><button data-a="unit-edit" data-id="' + u.id + '" style="' + btn + '">Ubah</button><button data-a="unit-del" data-id="' + u.id + '" style="' + btn + red + '">Hapus</button></div>';
    }).join('') : '<div style="opacity:.7;font-size:12.5px;padding:8px 0">Belum ada unit.</div>';
    return h;
  }
  function vSewa() {
    var f = form && form.k === 'sewa' ? form : null, all = sewas().sort(function (a, b) { return (a.status === 'aktif' ? 0 : 1) - (b.status === 'aktif' ? 0 : 1) || String(a.name).localeCompare(String(b.name)); });
    var free = units().filter(function (u) { return !activeSewaOf(u.id); });
    var h = '<div style="display:flex;justify-content:flex-end;margin-bottom:8px"><button data-a="sewa-new" style="' + btn + green + '">+ Tambah penyewa</button></div>';
    if (f) {
      h += '<div style="padding:12px;border-radius:16px;background:rgba(255,255,255,.06);margin-bottom:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px">' +
        lab('Unit yang disewa', '<select id="ps-unit" style="' + inp + '">' + (free.length ? free.map(function (u) { return '<option value="' + u.id + '" data-rate="' + (u.rate || 0) + '">' + esc(u.name) + ' (' + rp(u.rate) + ')</option>'; }).join('') : '<option value="">Tidak ada unit kosong</option>') + '</select>') +
        field('ps-name', 'Nama penyewa', f.v.name) + field('ps-phone', 'No. WhatsApp (08...)', f.v.phone, 'inputmode="tel"') +
        field('ps-rate', 'Sewa per bulan (Rp)', f.v.rate ? new Intl.NumberFormat('id-ID').format(f.v.rate) : (free[0] ? new Intl.NumberFormat('id-ID').format(free[0].rate || 0) : ''), 'data-money inputmode="numeric"') +
        field('ps-start', 'Mulai sewa', f.v.startISO || iso(), 'type="date"') + field('ps-due', 'Jatuh tempo tiap tanggal (1-28)', f.v.dueDay || 1, 'type="number" min="1" max="28"') +
        field('ps-dep', 'Uang jaminan / deposit (Rp)', f.v.deposit ? new Intl.NumberFormat('id-ID').format(f.v.deposit) : '', 'data-money inputmode="numeric"') +
        '<div style="display:flex;gap:8px;align-items:end"><button data-a="sewa-save" style="' + btn + green + '">Simpan</button><button data-a="cancel" style="' + btn + '">Batal</button></div></div>';
    }
    h += all.length ? all.map(function (s) {
      var u = unitById(s.unitId);
      return '<div style="display:flex;gap:10px;align-items:center;padding:9px 4px;border-bottom:1px solid rgba(255,255,255,.08);font-size:13px;opacity:' + (s.status === 'aktif' ? 1 : .55) + '"><div style="flex:1"><b>' + esc(s.name) + '</b> · ' + esc(u ? u.name : '-') + '<div style="font-size:11.5px;opacity:.7">' + rp(s.rate) + ' per bulan · tiap tgl ' + (s.dueDay || 1) + ' · sejak ' + dmy(s.startISO) + (s.deposit ? ' · deposit ' + rp(s.deposit) : '') + (s.status !== 'aktif' ? ' · selesai ' + dmy(s.endISO) : '') + '</div></div>' +
        (s.status === 'aktif' ? '<button data-a="sewa-end" data-id="' + s.id + '" style="' + btn + red + '">Akhiri sewa</button>' : '<span style="font-size:11.5px;font-weight:800">Selesai</span>') + '</div>';
    }).join('') : '<div style="opacity:.7;font-size:12.5px;padding:8px 0">Belum ada penyewa.</div>';
    return h;
  }
  function vTagih() {
    var mb = monthBills(month).sort(function (a, b) { var ua = unitById(a.unitId), ub = unitById(b.unitId); return String(ua ? ua.name : '').localeCompare(String(ub ? ub.name : ''), 'id', { numeric: true }); });
    var h = '<div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin-bottom:10px"><div style="width:190px">' + lab('Bulan', '<input id="pr-month" type="month" value="' + month + '" style="' + inp + '">') + '</div><button data-a="bill-gen" style="' + btn + green + '">Buat tagihan bulan ini</button></div>';
    if (payF) {
      var b = bills().filter(function (x) { return x.id === payF; })[0], s = b && sewaById(b.sewaId), u = b && unitById(b.unitId), accs = salesCoa(), da = defAcc();
      if (b) h += '<div style="padding:12px;border-radius:16px;background:rgba(255,255,255,.06);margin-bottom:12px"><div style="font-weight:800;margin-bottom:8px">Terima pembayaran: ' + esc(u ? u.name : '') + ' · ' + esc(s ? s.name : '') + ' (sisa ' + rp(sisa(b)) + ')</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px">' +
        field('pb-amt', 'Jumlah dibayar (Rp)', new Intl.NumberFormat('id-ID').format(sisa(b)), 'data-money inputmode="numeric"') +
        lab('Cara bayar', '<select id="pb-pay" style="' + inp + '"><option value="tunai">Tunai</option><option value="transfer">Transfer</option><option value="qris">QRIS</option></select>') +
        lab('Dicatat ke akun', '<select id="pb-acc" style="' + inp + '">' + accs.map(function (a) { return '<option value="' + esc(a.code) + '"' + (da && String(da.code) === String(a.code) ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('') + '</select>') +
        '<div style="display:flex;gap:8px;align-items:end"><button data-a="pay-save" data-id="' + b.id + '" style="' + btn + green + '">Simpan</button><button data-a="cancel" style="' + btn + '">Batal</button></div></div></div>';
    }
    h += mb.length ? mb.map(function (b) {
      var s = sewaById(b.sewaId), u = unitById(b.unitId), st = sisa(b) === 0 ? ['Lunas', '#86efac'] : late(b) ? ['Terlambat', '#fca5a5'] : (b.paid ? ['Dicicil', '#fcd34d'] : ['Belum bayar', '#fcd34d']), wa = sisa(b) > 0 ? waLink(b) : '';
      return '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:9px 4px;border-bottom:1px solid rgba(255,255,255,.08);font-size:13px"><div style="flex:1;min-width:180px"><b>' + esc(u ? u.name : '-') + '</b> · ' + esc(s ? s.name : '-') + '<div style="font-size:11.5px;opacity:.7">' + rp(b.amount) + ' · jatuh tempo ' + dmy(b.dueISO) + (b.paid ? ' · terbayar ' + rp(b.paid) : '') + '</div></div>' +
        '<span style="font-size:11.5px;font-weight:800;color:' + st[1] + '">' + st[0] + '</span>' +
        (sisa(b) > 0 ? '<button data-a="pay-new" data-id="' + b.id + '" style="' + btn + green + '">Terima bayar</button>' : '') + (wa ? '<a href="' + wa + '" target="_blank" rel="noopener" style="' + btn + '">Ingatkan WA</a>' : '') +
        (!b.paid ? '<button data-a="bill-del" data-id="' + b.id + '" style="' + btn + red + '">Hapus</button>' : '') + '</div>';
    }).join('') : '<div style="opacity:.7;font-size:12.5px;padding:8px 0">Belum ada tagihan ' + mLabel(month) + '. Tekan <b>Buat tagihan bulan ini</b>.</div>';
    return h;
  }
  function val(id) { var e = document.getElementById(id); return e ? e.value : ''; }

  function act(a, id) {
    if (a === 'cancel') { form = payF = null; say(''); return render(); }
    if (a === 'unit-new') { form = { k: 'unit', v: {} }; return render(); }
    if (a === 'unit-edit') { var u = unitById(id); form = { k: 'unit', v: Object.assign({}, u) }; return render(); }
    if (a === 'unit-save') {
      var name = val('pu-name').trim(); if (!name) { say('Nama unit wajib diisi.', true); return render(); }
      var cur = form && form.v && form.v.id ? form.v : {}, r = Object.assign({}, cur, { t: 'xu', id: cur.id || uid('xu'), name: name, kind: val('pu-kind').trim(), rate: num(val('pu-rate')), note: val('pu-note').trim() });
      form = null; say('Unit tersimpan: ' + name); return void save(r);
    }
    if (a === 'unit-del') {
      var un = unitById(id); if (!un) return;
      if (activeSewaOf(id)) { say('Unit ini masih disewa. Akhiri sewanya dulu.', true); return render(); }
      if (!confirm('Hapus unit ' + un.name + '?')) return; say('Unit dihapus.'); return void del(id);
    }
    if (a === 'sewa-new') { form = { k: 'sewa', v: {} }; return render(); }
    if (a === 'sewa-save') {
      var uid0 = val('ps-unit'), nm = val('ps-name').trim(); if (!uid0) { say('Pilih unit yang kosong dulu. Tambah unit di tab Unit.', true); return render(); }
      if (!nm) { say('Nama penyewa wajib diisi.', true); return render(); }
      if (activeSewaOf(uid0)) { say('Unit itu sudah disewa.', true); return render(); }
      var s = { t: 'xs', id: uid('xs'), unitId: uid0, name: nm, phone: val('ps-phone').trim(), rate: num(val('ps-rate')), startISO: val('ps-start') || iso(), dueDay: Math.min(28, Math.max(1, Number(val('ps-due')) || 1)), deposit: num(val('ps-dep')), status: 'aktif' };
      if (!s.rate) { say('Isi sewa per bulan.', true); return render(); }
      form = null; say('Penyewa tersimpan: ' + nm); return void save(s);
    }
    if (a === 'sewa-end') {
      var se = sewaById(id); if (!se) return;
      var open = bills().filter(function (b) { return b.sewaId === id && sisa(b) > 0; });
      if (!confirm('Akhiri sewa ' + se.name + '?' + (open.length ? '\n\nMasih ada ' + open.length + ' tagihan belum lunas, tetap tercatat sebagai tunggakan.' : '') + (se.deposit ? '\nDeposit ' + rp(se.deposit) + ' dikembalikan di luar aplikasi ini.' : ''))) return;
      say('Sewa diakhiri. Unit kembali kosong.'); return void save(Object.assign({}, se, { status: 'selesai', endISO: iso() }));
    }
    if (a === 'bill-gen') { genBills(month).then(function (n) { say(n ? n + ' tagihan ' + mLabel(month) + ' dibuat.' : 'Tidak ada tagihan baru untuk ' + mLabel(month) + '.'); render(); }); return; }
    if (a === 'bill-del') { if (!confirm('Hapus tagihan ini?')) return; say('Tagihan dihapus.'); return void del(id); }
    if (a === 'pay-new') { payF = id; return render(); }
    if (a === 'pay-save') {
      var b = bills().filter(function (x) { return x.id === id; })[0]; if (!b) return;
      var amt = num(val('pb-amt')); if (amt < 1) { say('Isi jumlah pembayaran.', true); return render(); }
      if (amt > sisa(b)) { say('Jumlah melebihi sisa tagihan (' + rp(sisa(b)) + ').', true); return render(); }
      var s2 = sewaById(b.sewaId), u2 = unitById(b.unitId), pay = val('pb-pay') || 'tunai';
      var tx = postTx(b, s2 || {}, u2 || {}, amt, pay, val('pb-acc')); if (tx === null) return;
      var r = Object.assign({}, b); r.payments = (b.payments || []).concat([{ ms: Date.now(), amount: amt, pay: pay, by: who(), txId: tx === 'tanpa-mutasi' ? '' : tx }]);
      r.paid = (b.paid || 0) + amt; r.status = r.paid >= r.amount ? 'lunas' : 'cicil';
      payF = null; say('Pembayaran ' + rp(amt) + ' tercatat dan masuk ke Mutasi.'); return void save(r);
    }
  }

  window.FM_PROP = {
    open: function () { ensure(); start(); if (!month) month = iso().slice(0, 7); tab = 'ringkas'; form = payF = null; say(''); ov.style.display = 'flex'; render(); },
    all: function () { start(); return rows.slice(); }, summary: summary
  };
})();
