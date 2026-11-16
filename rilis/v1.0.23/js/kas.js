/* kas.js — Arus Kas, Anggaran Bulanan, Rekonsiliasi Kas. Data di tenant_settings/<id>: budgets {akun: Rp, __target: Rp}, recons {tanggal: {...}}. */
(function () {
  'use strict';
  var budgets = {}, recons = {}, started = false, ov = null, tab = 'arus', month = '', rdate = '', note = '';
  function role() { return window.FM_PLANS ? FM_PLANS.pageRole() : 'manager'; }
  function canEdit() { return role() === 'manager'; }
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : 'default'; }
  function hasDb() { return typeof db !== 'undefined' && db && tid() !== 'default'; }
  function lsKey() { return 'fm_kas_' + tid(); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rp(n) { return (n < 0 ? '-' : '') + 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.abs(Math.round(n || 0))); }
  function iso(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function f(k) { try { return !!(window.FM_PLANS && FM_PLANS.has(k)); } catch (e) { return false; } }
  function txs() { try { var l = (typeof txList !== 'undefined' && txList) ? txList : []; return (window.FM_BIZ && FM_BIZ.vf) ? FM_BIZ.vf(l) : l; } catch (e) { return []; } }
  function pay(t) { return t.pay || 'tunai'; }
  var PAYL = { tunai: 'Tunai', qris: 'QRIS', transfer: 'Transfer' };

  function start() {
    if (started) return; started = true;
    if (hasDb()) {
      try { db.collection('tenant_settings').doc(tid()).onSnapshot(function (s) { var d = s.exists ? s.data() : {}; budgets = d.budgets || {}; recons = d.recons || {}; render(); }, function () {}); } catch (e) {}
    } else { try { var x = JSON.parse(localStorage.getItem(lsKey()) || '{}'); budgets = x.budgets || {}; recons = x.recons || {}; } catch (e) {} }
  }
  function persist() {
    if (hasDb()) return db.collection('tenant_settings').doc(tid()).set({ budgets: budgets, recons: recons, updatedAt: Date.now() }, { merge: true }).catch(function (e) { alert('Gagal menyimpan: ' + (e && e.message || e)); });
    try { localStorage.setItem(lsKey(), JSON.stringify({ budgets: budgets, recons: recons })); } catch (e) {} render(); return Promise.resolve();
  }

  /* ---- hitungan ---- */
  function monthTx(m) { return txs().filter(function (t) { return String(t.dateISO || '').slice(0, 7) === m; }); }
  function flow(m) {
    var r = { inn: {}, out: {}, prive: 0, ti: 0, to: 0, meth: {}, week: {} };
    monthTx(m).forEach(function (t) {
      var a = Number(t.amount) || 0, nm = t.accountName || t.desc || '(tanpa akun)', p = pay(t);
      var wk = 'Minggu ' + Math.min(5, Math.ceil(Number(String(t.dateISO).slice(8, 10)) / 7));
      var w = r.week[wk] = r.week[wk] || { i: 0, o: 0 }, mm = r.meth[p] = r.meth[p] || { i: 0, o: 0 };
      if (t.category === 'sales') { r.inn[nm] = (r.inn[nm] || 0) + a; r.ti += a; w.i += a; mm.i += a; }
      else if (t.category === 'prive') { r.prive += a; w.o += a; mm.o += a; }
      else { r.out[nm] = (r.out[nm] || 0) + a; r.to += a; w.o += a; mm.o += a; }
    });
    return r;
  }
  function expectedCash(day, opening) {
    var i = 0, o = 0;
    txs().forEach(function (t) { if (t.dateISO !== day || pay(t) !== 'tunai') return; var a = Number(t.amount) || 0; if (t.category === 'sales') i += a; else o += a; });
    return { i: i, o: o, exp: (Number(opening) || 0) + i - o };
  }

  /* ---- tampilan ---- */
  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:13px;outline:none';
  var btn = 'padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12px;font-weight:700;cursor:pointer';
  var green = ';background:#22c55e;color:#04210f;border-color:#22c55e';
  function lab(t, el) { return '<div><label style="display:block;font-size:11.5px;font-weight:700;margin:0 0 4px;opacity:.8">' + t + '</label>' + el + '</div>'; }
  function box(t, v, bg) { return '<div style="padding:10px;border-radius:14px;background:' + bg + '"><div style="font-size:11px;opacity:.7">' + t + '</div><div style="font-weight:800;font-size:14px;margin-top:2px">' + v + '</div></div>'; }
  function lines(o, color) {
    var k = Object.keys(o).sort(function (a, b) { return o[b] - o[a]; });
    if (!k.length) return '<p style="opacity:.6;font-size:12px;margin:4px 0">Belum ada.</p>';
    return k.map(function (n) { return '<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid rgba(255,255,255,.07);font-size:12.5px"><span>' + esc(n) + '</span><b style="color:' + color + '">' + rp(o[n]) + '</b></div>'; }).join('');
  }
  function tabArus() {
    var r = flow(month), net = r.ti - r.to - r.prive, h = '';
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:12px 0">' + box('Uang masuk', rp(r.ti), 'rgba(34,197,94,.12)') + box('Uang keluar', rp(r.to), 'rgba(251,113,133,.12)') + box('Prive', rp(r.prive), 'rgba(245,158,11,.12)') + box('Arus kas bersih', rp(net), 'rgba(255,255,255,.08)') + '</div>';
    h += '<div style="font-weight:800;margin-top:8px">Uang masuk</div>' + lines(r.inn, '#4ade80') + '<div style="font-weight:800;margin-top:14px">Uang keluar</div>' + lines(r.out, '#fb7185');
    var wk = Object.keys(r.week).sort();
    if (wk.length) h += '<div style="font-weight:800;margin-top:14px">Per minggu</div><table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-top:4px"><tr style="opacity:.65;text-align:left"><th style="padding:5px 0">Minggu</th><th style="text-align:right">Masuk</th><th style="text-align:right">Keluar</th><th style="text-align:right">Bersih</th></tr>' + wk.map(function (k) { var w = r.week[k]; return '<tr style="border-top:1px solid rgba(255,255,255,.07)"><td style="padding:6px 0">' + k + '</td><td style="text-align:right;color:#4ade80">' + rp(w.i) + '</td><td style="text-align:right;color:#fb7185">' + rp(w.o) + '</td><td style="text-align:right;font-weight:700">' + rp(w.i - w.o) + '</td></tr>'; }).join('') + '</table>';
    var mk = Object.keys(r.meth);
    if (mk.length) h += '<div style="font-weight:800;margin-top:14px">Per cara bayar</div>' + mk.map(function (k) { var m = r.meth[k]; return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid rgba(255,255,255,.07);font-size:12.5px"><span>' + (PAYL[k] || esc(k)) + '</span><span>masuk <b style="color:#4ade80">' + rp(m.i) + '</b> · keluar <b style="color:#fb7185">' + rp(m.o) + '</b></span></div>'; }).join('');
    return h + '<p style="font-size:11px;opacity:.6;margin-top:10px">Transaksi lama tanpa catatan cara bayar dihitung Tunai.</p>';
  }
  function tabAnggaran() {
    var r = flow(month), ed = canEdit(), names = {};
    Object.keys(r.out).forEach(function (k) { names[k] = 1; });
    Object.keys(budgets).forEach(function (k) { if (k !== '__target') names[k] = 1; });
    txs().forEach(function (t) { if (t.category === 'expense' || t.category === 'cogs') names[t.accountName || t.desc || '(tanpa akun)'] = 1; });
    var h = '', tg = Number(budgets.__target) || 0;
    h += '<div style="margin:12px 0;padding:12px;border-radius:14px;background:rgba(255,255,255,.06)"><div style="font-weight:800;font-size:13px">Target pemasukan bulan ini</div>' +
      (tg ? bar(r.ti, tg, true) : '<div style="font-size:12px;opacity:.65;margin-top:4px">Belum diatur.</div>') +
      (ed ? '<div style="display:flex;gap:8px;margin-top:8px"><input id="kb-target" type="number" min="0" value="' + (tg || '') + '" placeholder="Rp" style="' + inp + '"><button data-a="savetarget" style="' + btn + green + '">Simpan</button></div>' : '') + '</div>';
    h += '<div style="font-weight:800;margin:6px 0">Batas pengeluaran per akun (tiap bulan)</div>';
    var ks = Object.keys(names).sort(function (a, b) { return (r.out[b] || 0) - (r.out[a] || 0); });
    if (!ks.length) h += '<p style="opacity:.65;font-size:12.5px">Belum ada akun pengeluaran.</p>';
    ks.forEach(function (n, i) {
      var b = Number(budgets[n]) || 0, a = r.out[n] || 0;
      h += '<div style="padding:9px 0;border-top:1px solid rgba(255,255,255,.07)"><div style="display:flex;justify-content:space-between;gap:8px;font-size:12.5px"><b>' + esc(n) + '</b><span>' + rp(a) + (b ? ' / ' + rp(b) : '') + '</span></div>' + (b ? bar(a, b, false) : '') +
        (ed ? '<div style="display:flex;gap:6px;margin-top:6px"><input data-bn="' + esc(n) + '" type="number" min="0" value="' + (b || '') + '" placeholder="Batas Rp" style="' + inp + ';padding:6px 9px"><button data-a="savebud" data-i="' + i + '" data-n="' + esc(n) + '" style="' + btn + ';padding:5px 10px">Simpan</button></div>' : '') + '</div>';
    });
    return h;
  }
  function bar(v, max, good) {
    var p = max > 0 ? v / max * 100 : 0, c = good ? (p >= 100 ? '#22c55e' : '#38bdf8') : (p > 100 ? '#ef4444' : p >= 80 ? '#f59e0b' : '#22c55e');
    var txt = good ? (p >= 100 ? 'Target tercapai' : Math.round(p) + '% dari target') : (p > 100 ? 'Lewat ' + rp(v - max) : p >= 80 ? 'Hampir habis (' + Math.round(p) + '%)' : 'Aman (' + Math.round(p) + '%)');
    return '<div style="height:8px;border-radius:99px;background:rgba(255,255,255,.1);margin-top:6px;overflow:hidden"><div style="height:100%;width:' + Math.min(100, p) + '%;background:' + c + '"></div></div><div style="font-size:11px;margin-top:3px;color:' + c + '">' + txt + '</div>';
  }
  function tabRekon() {
    var ed = canEdit(), rec = recons[rdate] || {}, op = rec.opening != null ? rec.opening : '', e = expectedCash(rdate, op), h = '';
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:12px 0">' +
      lab('Tanggal', '<input id="kr-date" type="date" value="' + rdate + '" style="' + inp + '">') +
      lab('Uang awal di laci (Rp)', '<input id="kr-open" type="number" min="0" value="' + op + '" ' + (ed ? '' : 'disabled') + ' style="' + inp + '">') +
      lab('Uang tunai dihitung (Rp)', '<input id="kr-count" type="number" min="0" value="' + (rec.counted != null ? rec.counted : '') + '" ' + (ed ? '' : 'disabled') + ' style="' + inp + '">') + '</div>';
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px">' + box('Tunai masuk', rp(e.i), 'rgba(34,197,94,.12)') + box('Tunai keluar', rp(e.o), 'rgba(251,113,133,.12)') + box('Seharusnya ada', rp(e.exp), 'rgba(255,255,255,.08)') + '</div>';
    if (rec.counted != null) { var d = rec.counted - e.exp, c = d === 0 ? '#22c55e' : d < 0 ? '#ef4444' : '#f59e0b'; h += '<div style="margin-top:10px;padding:10px;border-radius:12px;background:rgba(255,255,255,.06);font-size:13px">Selisih: <b style="color:' + c + '">' + (d === 0 ? 'Cocok' : (d < 0 ? 'Kurang ' : 'Lebih ') + rp(Math.abs(d))) + '</b></div>'; }
    if (ed) h += lab('Catatan', '<input id="kr-note" value="' + esc(rec.note || '') + '" placeholder="Opsional" style="' + inp + ';margin-top:10px">').replace('<div>', '<div style="margin-top:10px">') + '<div style="margin-top:10px"><button data-a="saverec" style="' + btn + green + '">Simpan rekonsiliasi</button></div>';
    var ks = Object.keys(recons).sort().reverse().slice(0, 10);
    if (ks.length) h += '<div style="font-weight:800;margin-top:16px">Riwayat terakhir</div>' + ks.map(function (k) { var x = recons[k], d = Number(x.diff) || 0; return '<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid rgba(255,255,255,.07);font-size:12.5px"><span>' + esc(k) + (x.by ? ' · ' + esc(x.by) : '') + '</span><b style="color:' + (d === 0 ? '#22c55e' : d < 0 ? '#ef4444' : '#f59e0b') + '">' + (d === 0 ? 'Cocok' : (d < 0 ? 'Kurang ' : 'Lebih ') + rp(Math.abs(d))) + '</b></div>'; }).join('');
    return h;
  }
  function tabs() { var a = []; if (f('arus_kas')) a.push(['arus', 'Arus Kas']); if (f('anggaran')) a.push(['anggaran', 'Anggaran']); if (f('rekon')) a.push(['rekon', 'Rekonsiliasi Kas']); return a; }
  function render() {
    if (!ov || ov.style.display === 'none') return;
    var T = tabs(); if (!T.length) { ov.style.display = 'none'; return; }
    if (!T.some(function (x) { return x[0] === tab; })) tab = T[0][0];
    var h = '<div style="width:100%;max-width:760px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px">' +
      '<div style="display:flex;justify-content:space-between;gap:10px"><div><div style="font-weight:800;font-size:17px">Arus Kas &amp; Anggaran</div><div style="font-size:12px;opacity:.65">' + (canEdit() ? 'Pantau uang masuk-keluar, batas pengeluaran, dan cocokkan uang laci.' : 'Tampilan baca saja.') + '</div></div><button data-x style="' + btn + '">Tutup</button></div>' +
      '<div style="display:flex;gap:6px;margin:14px 0 4px;flex-wrap:wrap;align-items:center">' + T.map(function (x) { return '<button data-tab="' + x[0] + '" style="' + btn + (tab === x[0] ? green : '') + '">' + x[1] + '</button>'; }).join('') +
      (tab !== 'rekon' ? '<input id="kb-month" type="month" value="' + month + '" style="' + inp + ';width:auto;margin-left:auto">' : '') + '</div>';
    if (note) h += '<p style="margin:10px 0;padding:10px 12px;border-radius:12px;background:rgba(34,197,94,.14);color:#86efac;font-size:12px">' + esc(note) + '</p>';
    h += tab === 'arus' ? tabArus() : tab === 'anggaran' ? tabAnggaran() : tabRekon();
    var keep = document.activeElement && document.activeElement.id;
    ov.innerHTML = h + '</div>';
    if (keep) { var el = document.getElementById(keep); if (el && el.focus) try { el.focus(); } catch (e) {} }
  }
  function g(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function who() { try { return (typeof user !== 'undefined' && user && (user.title || user.name)) || (window.currentUser && currentUser.name) || ''; } catch (e) { return ''; } }
  function act(a, el) {
    note = '';
    if (a === 'savetarget') { budgets.__target = Math.max(0, Number(g('kb-target')) || 0); note = 'Target disimpan.'; persist(); render(); }
    else if (a === 'savebud') {
      var n = el.getAttribute('data-n'), inpEl = ov.querySelector('input[data-bn="' + n.replace(/"/g, '\\"') + '"]'), v = Math.max(0, Number(inpEl && inpEl.value) || 0);
      if (v) budgets[n] = v; else delete budgets[n]; note = 'Batas "' + n + '" disimpan.'; persist(); render();
    } else if (a === 'saverec') {
      var op = Math.max(0, Number(g('kr-open')) || 0), cs = g('kr-count');
      if (cs === '') { note = 'Isi uang tunai yang dihitung.'; return render(); }
      var c = Math.max(0, Number(cs) || 0), e = expectedCash(rdate, op);
      recons[rdate] = { opening: op, counted: c, expected: e.exp, diff: c - e.exp, note: g('kr-note').trim(), by: who(), at: Date.now() };
      note = 'Rekonsiliasi ' + rdate + ' disimpan.'; persist(); render();
    }
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-kas';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var t = e.target.closest('[data-tab]'); if (t) { tab = t.getAttribute('data-tab'); note = ''; return render(); }
      var b = e.target.closest('[data-a]'); if (b) act(b.getAttribute('data-a'), b);
    });
    ov.addEventListener('change', function (e) {
      if (e.target.id === 'kb-month' && e.target.value) { month = e.target.value; note = ''; render(); }
      else if (e.target.id === 'kr-date' && e.target.value) { rdate = e.target.value; note = ''; render(); }
    });
    document.body.appendChild(ov);
  }
  window.addEventListener('fm-biz-view', function () { render(); });
  window.FM_KAS = { open: function () { ensure(); start(); month = iso().slice(0, 7); rdate = iso(); note = ''; ov.style.display = 'flex'; render(); }, flow: flow, expectedCash: expectedCash, _set: function (b, r) { budgets = b || {}; recons = r || {}; } };
})();
