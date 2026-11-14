/* pajak.js — Laporan Pajak Bulanan (estimasi). PPh Final UMKM atas omzet dan PPN (opsional) per bulan.
   Pengaturan di tenant_settings/<id>.pajak: { pphOn, pphRate, free500, ppnOn, ppnRate, paid: {'YYYY-MM': {amount, at}} }. */
(function () {
  'use strict';
  var C = { pphOn: true, pphRate: 0.5, free500: false, ppnOn: false, ppnRate: 11, paid: {} }, started = false, ov = null, year = '', note = '';
  var FREE = 500000000;
  function role() { return window.FM_PLANS ? FM_PLANS.pageRole() : 'manager'; }
  function canEdit() { return role() === 'manager'; }
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : 'default'; }
  function hasDb() { return typeof db !== 'undefined' && db && tid() !== 'default'; }
  function lsKey() { return 'fm_pajak_' + tid(); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rp(n) { return (n < 0 ? '-' : '') + 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.abs(Math.round(n || 0))); }
  function txs() { try { return typeof txList !== 'undefined' ? txList : []; } catch (e) { return []; } }
  var MON = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  function norm(x) { x = x || {}; return { pphOn: x.pphOn !== false, pphRate: x.pphRate != null ? Number(x.pphRate) : 0.5, free500: !!x.free500, ppnOn: !!x.ppnOn, ppnRate: x.ppnRate != null ? Number(x.ppnRate) : 11, paid: x.paid || {} }; }

  function start() {
    if (started) return; started = true;
    if (hasDb()) { try { db.collection('tenant_settings').doc(tid()).onSnapshot(function (s) { C = norm(s.exists ? s.data().pajak : null); render(); }, function () {}); } catch (e) {} }
    else { try { C = norm(JSON.parse(localStorage.getItem(lsKey()) || '{}')); } catch (e) {} }
  }
  function persist() {
    if (hasDb()) return db.collection('tenant_settings').doc(tid()).set({ pajak: C, updatedAt: Date.now() }, { merge: true }).catch(function (e) { alert('Gagal menyimpan: ' + (e && e.message || e)); });
    try { localStorage.setItem(lsKey(), JSON.stringify(C)); } catch (e) {} render(); return Promise.resolve();
  }

  /* ---- hitungan ---- */
  function calc(y) {
    var m = [], cum = 0;
    for (var i = 0; i < 12; i++) m.push({ ym: y + '-' + String(i + 1).padStart(2, '0'), omzet: 0, masukan: 0 });
    txs().forEach(function (t) {
      var d = String(t.dateISO || ''); if (d.slice(0, 4) !== y) return; var k = Number(d.slice(5, 7)) - 1; if (k < 0 || k > 11) return;
      if (t.category === 'sales') m[k].omzet += Number(t.amount) || 0;
      else if (t.category !== 'prive') m[k].masukan += Number(t.tax12) || 0;
    });
    m.forEach(function (r) {
      var before = cum; cum += r.omzet; r.cum = cum;
      var base = r.omzet;
      if (C.free500) base = Math.max(0, cum - FREE) - Math.max(0, before - FREE);
      r.pphBase = base; r.pph = C.pphOn ? Math.round(base * C.pphRate / 100) : 0;
      r.keluaran = C.ppnOn ? Math.round(r.omzet * C.ppnRate / (100 + C.ppnRate)) : 0;
      r.masukanPakai = C.ppnOn ? Math.round(r.masukan) : 0;
      r.ppn = C.ppnOn ? r.keluaran - r.masukanPakai : 0;
      r.total = r.pph + Math.max(0, r.ppn);
    });
    return m;
  }

  /* ---- tampilan ---- */
  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:13px;outline:none';
  var btn = 'padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12px;font-weight:700;cursor:pointer';
  var green = ';background:#22c55e;color:#04210f;border-color:#22c55e';
  function lab(t, el) { return '<div><label style="display:block;font-size:11.5px;font-weight:700;margin:0 0 4px;opacity:.8">' + t + '</label>' + el + '</div>'; }
  function chk(id, t, on, ed) { return '<label style="display:flex;gap:8px;align-items:center;font-size:12.5px"><input id="' + id + '" type="checkbox"' + (on ? ' checked' : '') + (ed ? '' : ' disabled') + '> ' + t + '</label>'; }
  function box(t, v) { return '<div style="padding:10px;border-radius:14px;background:rgba(255,255,255,.07)"><div style="font-size:11px;opacity:.7">' + t + '</div><div style="font-weight:800;font-size:14px;margin-top:2px">' + v + '</div></div>'; }
  function render() {
    if (!ov || ov.style.display === 'none') return;
    var ed = canEdit(), m = calc(year), nowYm = (function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); })(new Date());
    var tO = 0, tP = 0, tN = 0; m.forEach(function (r) { tO += r.omzet; tP += r.pph; tN += Math.max(0, r.ppn); });
    var h = '<div style="width:100%;max-width:820px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px">' +
      '<div style="display:flex;justify-content:space-between;gap:10px"><div><div style="font-weight:800;font-size:17px">Laporan Pajak Bulanan</div><div style="font-size:12px;opacity:.65">Perkiraan pajak dari omzet toko. Konfirmasi ke konsultan atau kantor pajak sebelum menyetor.</div></div><button data-x style="' + btn + '">Tutup</button></div>';
    if (note) h += '<p style="margin:10px 0;padding:10px 12px;border-radius:12px;background:rgba(34,197,94,.14);color:#86efac;font-size:12px">' + esc(note) + '</p>';
    h += '<div style="display:flex;gap:8px;align-items:end;margin:12px 0;flex-wrap:wrap"><div style="width:130px">' + lab('Tahun', '<input id="pj-year" type="number" min="2020" max="2100" value="' + year + '" style="' + inp + '">') + '</div><button data-a="copy" style="' + btn + '">Salin teks</button><button data-a="csv" style="' + btn + '">Unduh CSV</button></div>';
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:12px">' + box('Omzet ' + year, rp(tO)) + box('PPh Final', rp(tP)) + (C.ppnOn ? box('PPN kurang bayar', rp(tN)) : '') + box('Total perkiraan', rp(tP + tN)) + '</div>';
    h += '<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12.5px;min-width:520px"><thead><tr style="text-align:left;opacity:.65"><th style="padding:6px 4px">Bulan</th><th style="text-align:right">Omzet</th><th style="text-align:right">PPh Final</th>' + (C.ppnOn ? '<th style="text-align:right">PPN</th>' : '') + '<th style="text-align:right">Total</th><th style="text-align:right">Setor</th></tr></thead><tbody>';
    m.forEach(function (r, i) {
      if (!r.omzet && !r.masukan && r.ym > nowYm) return;
      var pd = C.paid[r.ym];
      h += '<tr style="border-top:1px solid rgba(255,255,255,.07)"><td style="padding:7px 4px">' + MON[i] + '</td><td style="text-align:right">' + rp(r.omzet) + '</td><td style="text-align:right">' + rp(r.pph) + '</td>' + (C.ppnOn ? '<td style="text-align:right">' + rp(r.ppn) + '</td>' : '') + '<td style="text-align:right;font-weight:800">' + rp(r.total) + '</td><td style="text-align:right">' +
        (pd ? '<span style="color:#4ade80;font-size:11.5px">Sudah ' + rp(pd.amount) + '</span>' + (ed ? ' <button data-a="unpay" data-ym="' + r.ym + '" style="' + btn + ';padding:1px 8px;font-size:10.5px">Batal</button>' : '') : (ed && r.total > 0 ? '<button data-a="pay" data-ym="' + r.ym + '" style="' + btn + ';padding:3px 9px;font-size:11px">Tandai sudah disetor</button>' : '<span style="opacity:.5;font-size:11.5px">' + (r.total > 0 ? 'Belum' : '-') + '</span>')) + '</td></tr>';
    });
    h += '</tbody></table></div>';
    if (C.free500) h += '<p style="font-size:11px;opacity:.65;margin:8px 0 0">Omzet sampai Rp 500 juta per tahun dibebaskan; PPh Final dihitung dari omzet yang melewatinya.</p>';
    if (C.ppnOn) h += '<p style="font-size:11px;opacity:.65;margin:4px 0 0">PPN keluaran dihitung dari omzet (harga sudah termasuk PPN). PPN masukan diambil dari pajak yang tercatat pada transaksi pengeluaran.</p>';
    h += '<div style="margin-top:16px;padding:12px;border-radius:14px;background:rgba(255,255,255,.05)"><div style="font-weight:800;margin-bottom:8px">Pengaturan pajak</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px">' +
      chk('pj-pph', 'Hitung PPh Final atas omzet', C.pphOn, ed) + lab('Tarif PPh Final (%)', '<input id="pj-rate" type="number" min="0" max="100" step="0.1" value="' + C.pphRate + '" ' + (ed ? '' : 'disabled') + ' style="' + inp + '">') +
      chk('pj-free', 'Bebas pajak untuk omzet sampai Rp 500 juta per tahun (WP orang pribadi)', C.free500, ed) +
      chk('pj-ppn', 'Toko adalah PKP, hitung PPN', C.ppnOn, ed) + lab('Tarif PPN (%)', '<input id="pj-ppnrate" type="number" min="0" max="100" step="0.5" value="' + C.ppnRate + '" ' + (ed ? '' : 'disabled') + ' style="' + inp + '">') + '</div>' +
      (ed ? '<div style="margin-top:10px"><button data-a="savecfg" style="' + btn + green + '">Simpan pengaturan</button></div>' : '') + '</div>';
    var keep = document.activeElement && document.activeElement.id;
    ov.innerHTML = h + '</div>';
    if (keep) { var el = document.getElementById(keep); if (el && el.focus) try { el.focus(); } catch (e) {} }
  }
  function text() {
    var t = tn(), m = calc(year), L = ['LAPORAN PAJAK ' + ((t && t.nama) || 'Toko') + ' ' + year, '(perkiraan)', ''];
    m.forEach(function (r, i) { if (r.omzet || r.total) L.push(MON[i] + ': omzet ' + rp(r.omzet) + ', PPh ' + rp(r.pph) + (C.ppnOn ? ', PPN ' + rp(r.ppn) : '') + ', total ' + rp(r.total) + (C.paid[r.ym] ? ' (sudah disetor)' : '')); });
    return L.join('\n');
  }
  function csv() {
    var rows = [['Bulan', 'Omzet', 'Dasar PPh', 'PPh Final', 'PPN Keluaran', 'PPN Masukan', 'PPN', 'Total', 'Sudah disetor']];
    calc(year).forEach(function (r, i) { rows.push([MON[i] + ' ' + year, r.omzet, r.pphBase, r.pph, r.keluaran, r.masukanPakai, r.ppn, r.total, C.paid[r.ym] ? C.paid[r.ym].amount : 0]); });
    return rows.map(function (r) { return r.join(','); }).join('\n');
  }
  function act(a, ym) {
    note = '';
    if (a === 'savecfg') {
      C.pphOn = !!document.getElementById('pj-pph').checked; C.pphRate = Math.max(0, Math.min(100, Number(document.getElementById('pj-rate').value) || 0));
      C.free500 = !!document.getElementById('pj-free').checked; C.ppnOn = !!document.getElementById('pj-ppn').checked; C.ppnRate = Math.max(0, Math.min(100, Number(document.getElementById('pj-ppnrate').value) || 0));
      note = 'Pengaturan pajak disimpan.'; persist(); render();
    } else if (a === 'pay') { var r = calc(year).filter(function (x) { return x.ym === ym; })[0]; C.paid[ym] = { amount: r ? r.total : 0, at: Date.now() }; note = 'Ditandai sudah disetor.'; persist(); render(); }
    else if (a === 'unpay') { delete C.paid[ym]; persist(); render(); }
    else if (a === 'copy') { (navigator.clipboard ? navigator.clipboard.writeText(text()) : Promise.reject()).then(function () { note = 'Laporan disalin.'; render(); }, function () { note = 'Gagal menyalin.'; render(); }); }
    else if (a === 'csv') {
      try { var b = new Blob(['﻿' + csv()], { type: 'text/csv' }), u = URL.createObjectURL(b), l = document.createElement('a'); l.href = u; l.download = 'laporan-pajak-' + year + '.csv'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000); } catch (e) { note = 'Gagal mengunduh.'; render(); }
    }
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-pajak';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var b = e.target.closest('[data-a]'); if (b) act(b.getAttribute('data-a'), b.getAttribute('data-ym'));
    });
    ov.addEventListener('change', function (e) { if (e.target.id === 'pj-year' && /^\d{4}$/.test(e.target.value)) { year = e.target.value; note = ''; render(); } });
    document.body.appendChild(ov);
  }
  window.FM_PAJAK = { open: function () { ensure(); start(); year = String(new Date().getFullYear()); note = ''; ov.style.display = 'flex'; render(); }, calc: calc, _cfg: function (x) { C = norm(x); } };
})();
