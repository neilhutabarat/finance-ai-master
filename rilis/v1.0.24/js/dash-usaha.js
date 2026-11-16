/* dash-usaha.js — Ringkasan per Usaha (Manager & Owner): pemasukan, pengeluaran, selisih, dan rincian per Admin. */
(function () {
  'use strict';
  var ov = null, per = 'bulan', openBiz = '';
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rp(n) { return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n || 0)); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function txs() { try { return (typeof txList !== 'undefined' && txList) ? txList : []; } catch (e) { return []; } }
  function from() {
    var d = new Date();
    if (per === 'hari') return iso(d);
    if (per === 'minggu') { d.setDate(d.getDate() - 6); return iso(d); }
    if (per === 'bulan') return iso(d).slice(0, 8) + '01';
    return '0000-00-00';
  }
  function data() {
    var f = from(), by = {};
    txs().forEach(function (t) {
      var d = t.dateISO || ''; if (d < f) return;
      var b = (window.FM_BIZ && FM_BIZ.ofTx) ? (FM_BIZ.ofTx(t) || '') : '';
      var k = b || '(Umum)', o = by[k] = by[k] || { name: k, in: 0, out: 0, n: 0, staff: {} };
      var isIn = t.category === 'sales', a = Number(t.amount) || 0;
      if (t.category === 'prive') return;
      o.n++; if (isIn) o.in += a; else o.out += a;
      var s = o.staff[t.staff || '-'] = o.staff[t.staff || '-'] || { in: 0, out: 0, n: 0 }; s.n++; if (isIn) s.in += a; else s.out += a;
    });
    return Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.in - a.in; });
  }
  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var btn = 'padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12px;font-weight:700;cursor:pointer';
  function render() {
    if (!ov || ov.style.display === 'none') return;
    var rows = data(), ti = 0, to = 0;
    rows.forEach(function (r) { ti += r.in; to += r.out; });
    var h = '<div style="width:100%;max-width:820px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px">' +
      '<div style="display:flex;justify-content:space-between;gap:10px"><div><div style="font-weight:800;font-size:17px">Ringkasan per Usaha</div><div style="font-size:12px;opacity:.65">Pemasukan dan pengeluaran tiap usaha, ketuk baris untuk melihat per Admin. Prive tidak dihitung.</div></div><button data-x style="' + btn + '">Tutup</button></div>' +
      '<div style="display:flex;gap:6px;margin:14px 0;flex-wrap:wrap">' + [['hari', 'Hari ini'], ['minggu', '7 hari'], ['bulan', 'Bulan ini'], ['semua', 'Semua']].map(function (p) { return '<button data-p="' + p[0] + '" style="' + btn + (per === p[0] ? ';background:#22c55e;color:#04210f;border-color:#22c55e' : '') + '">' + p[1] + '</button>'; }).join('') + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px">' +
      [['Pemasukan', ti, 'rgba(34,197,94,.12)'], ['Pengeluaran', to, 'rgba(251,113,133,.12)'], ['Selisih', ti - to, 'rgba(255,255,255,.07)']].map(function (x) { return '<div style="padding:10px;border-radius:14px;background:' + x[2] + '"><div style="font-size:10.5px;opacity:.7">' + x[0] + '</div><div style="font-weight:800;font-size:14px">' + rp(x[1]) + '</div></div>'; }).join('') + '</div>';
    if (!rows.length) h += '<p style="opacity:.7;text-align:center;padding:18px;font-size:13px">Belum ada transaksi pada periode ini.</p>';
    else {
      h += '<table style="width:100%;border-collapse:collapse;font-size:12.5px"><thead><tr style="text-align:left;opacity:.7"><th style="padding:6px">Usaha</th><th style="text-align:right">Masuk</th><th style="text-align:right">Keluar</th><th style="text-align:right">Selisih</th><th style="text-align:right">Transaksi</th></tr></thead><tbody>';
      rows.forEach(function (r) {
        h += '<tr data-b="' + esc(r.name) + '" style="border-top:1px solid rgba(255,255,255,.08);cursor:pointer"><td style="padding:9px 6px;font-weight:800">' + esc(r.name) + '</td><td style="text-align:right;color:#4ade80">' + rp(r.in) + '</td><td style="text-align:right;color:#fb7185">' + rp(r.out) + '</td><td style="text-align:right;font-weight:800">' + rp(r.in - r.out) + '</td><td style="text-align:right">' + r.n + '</td></tr>';
        if (openBiz === r.name) Object.keys(r.staff).forEach(function (s) { var x = r.staff[s]; h += '<tr style="background:rgba(255,255,255,.04);font-size:12px"><td style="padding:6px 6px 6px 22px;opacity:.85">↳ ' + esc(s) + '</td><td style="text-align:right">' + rp(x.in) + '</td><td style="text-align:right">' + rp(x.out) + '</td><td style="text-align:right">' + rp(x.in - x.out) + '</td><td style="text-align:right">' + x.n + '</td></tr>'; });
      });
      h += '</tbody></table>';
    }
    ov.innerHTML = h + '</div>';
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-usaha-sum';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var p = e.target.closest('[data-p]'); if (p) { per = p.getAttribute('data-p'); render(); return; }
      var b = e.target.closest('[data-b]'); if (b) { var n = b.getAttribute('data-b'); openBiz = openBiz === n ? '' : n; render(); }
    });
    document.body.appendChild(ov);
  }
  window.FM_USAHA_SUM = { open: function () { ensure(); ov.style.display = 'flex'; render(); } };
})();
