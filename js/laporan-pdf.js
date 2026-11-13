/* Unduh laporan transaksi: PDF A4 berkop (tanpa pustaka luar, bisa dipakai offline) + CSV untuk Excel.
   Dibuka dari tile "Unduh PDF" di laman Owner: pilih periode, lalu unduh. */
(function () {
  'use strict';
  var st = { p: 'bulan', from: '', to: '' }, ov = null;
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function fmt(n) { return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(Math.abs(n) || 0)); }
  function rp(n) { return (n < 0 ? '-' : '') + 'Rp ' + fmt(n); }
  function txs() { try { var l = (typeof txList !== 'undefined' && txList) ? txList : []; return (window.FM_BIZ && FM_BIZ.vf) ? FM_BIZ.vf(l) : l; } catch (e) { return []; } }
  function ten() { try { return getActiveTenant() || {}; } catch (e) { return {}; } }
  function dOf(t) { return t.dateISO || (t.timestamp ? iso(new Date(t.timestamp)) : ''); }
  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function dtxt(s) { var p = String(s).split('-'); return p.length === 3 ? parseInt(p[2], 10) + ' ' + BLN[parseInt(p[1], 10) - 1] + ' ' + p[0] : s; }
  function range() {
    var n = new Date(), y = n.getFullYear(), m = n.getMonth(), d = n.getDate();
    if (st.p === 'hari') return [iso(n), iso(n)];
    if (st.p === 'minggu') { var dow = (n.getDay() + 6) % 7; return [iso(new Date(y, m, d - dow)), iso(new Date(y, m, d - dow + 6))]; }
    if (st.p === 'tahun') return [y + '-01-01', y + '-12-31'];
    if (st.p === 'kustom') return [st.from || iso(n), st.to || iso(n)];
    return [iso(new Date(y, m, 1)), iso(new Date(y, m + 1, 0))];
  }
  function rows() {
    var r = range(), list = txs().filter(function (t) { var d = dOf(t); return d && d >= r[0] && d <= r[1]; });
    var key = window.fmTxKey || function (t) { return t.seq || t.timestamp || 0; };
    list.sort(function (a, b) { return dOf(a).localeCompare(dOf(b)) || (key(a) - key(b)); });
    return list;
  }
  function sgn(t) { return t.category === 'sales' ? 1 : -1; }

  /* ---------- PDF ---------- */
  function ascii(t) {
    t = String(t == null ? '' : t).replace(/\s+/g, ' ').trim();
    try { t = t.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {}
    return t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—−]/g, '-').replace(/[^\x20-\x7e]/g, '');
  }
  function pe(t) { return t.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  function build() {
    var r = range(), list = rows(), tn = ten();
    var W = 595.28, H = 841.89, MX = 36, LH = 13, FS = 8.5, pages = [], cur = null, y = 0;
    function newPage() { cur = []; pages.push(cur); y = H - 40; }
    function text(x, yy, s, font, size) { cur.push('/' + (font || 'F1') + ' ' + (size || FS) + ' Tf 1 0 0 1 ' + x.toFixed(1) + ' ' + yy.toFixed(1) + ' Tm (' + pe(ascii(s)) + ') Tj'); }
    function rtext(xr, yy, s, font, size) { var w = ascii(s).length * (size || FS) * 0.5; text(xr - w, yy, s, font, size); }
    function line(yy, g) { cur.push('ET ' + (g || 0.6) + ' G 0.5 w ' + MX + ' ' + yy.toFixed(1) + ' m ' + (W - MX) + ' ' + yy.toFixed(1) + ' l S BT'); }
    function cut(s, n) { s = ascii(s); return s.length > n ? s.slice(0, n - 1) + '.' : s; }
    var income = 0, outcome = 0;
    list.forEach(function (t) { if (t.category === 'sales') income += t.amount || 0; else outcome += t.amount || 0; });
    var lr = null; try { if (window.FM_LR && FM_LR.compute) lr = FM_LR.compute(st.p === 'kustom' ? 'kustom' : st.p); } catch (e) {}
    newPage();
    text(MX, y, tn.nama || 'Laporan Transaksi', 'F2', 15); y -= 16;
    text(MX, y, 'ID Toko: ' + (tn.id ? String(tn.id).toUpperCase() : '-') + '   |   Laporan Transaksi', 'F1', 9); y -= 12;
    text(MX, y, 'Periode: ' + dtxt(r[0]) + (r[0] !== r[1] ? ' s/d ' + dtxt(r[1]) : '') + '   |   Dicetak: ' + new Date().toLocaleString('id-ID'), 'F1', 9); y -= 10;
    line(y); y -= 18;
    text(MX, y, 'RINGKASAN', 'F2', 10); y -= 15;
    [['Total Income (pemasukan)', rp(income)], ['Total Outcome (pengeluaran)', rp(-outcome)], ['Selisih kas', rp(income - outcome)]].concat(lr && st.p !== 'kustom' ? [['Laba Rugi periode ini (HPP dari closing stok)', rp(lr.net)]] : []).forEach(function (a) {
      text(MX + 6, y, a[0], 'F1', 9.5); rtext(W - MX, y, a[1], 'F2', 9.5); y -= 14;
    });
    y -= 6; line(y); y -= 16;
    text(MX, y, 'RINCIAN TRANSAKSI (urut sesuai input)', 'F2', 10); y -= 16;
    var X = { tgl: MX, akun: MX + 62, ket: MX + 190, pay: MX + 330, staff: MX + 385, amt: W - MX };
    function head() { text(X.tgl, y, 'Tanggal', 'F2'); text(X.akun, y, 'Akun', 'F2'); text(X.ket, y, 'Keterangan', 'F2'); text(X.pay, y, 'Bayar', 'F2'); text(X.staff, y, 'Petugas', 'F2'); rtext(X.amt, y, 'Jumlah', 'F2'); y -= 4; line(y); y -= 12; }
    head();
    if (!list.length) { text(MX, y, 'Tidak ada transaksi pada periode ini.'); y -= LH; }
    list.forEach(function (t) {
      if (y < 60) { newPage(); head(); }
      var jam = t.date && /\d:\d/.test(t.date) ? ' ' + String(t.date).slice(0, 5) : '';
      text(X.tgl, y, dtxt(dOf(t)).replace(/ 20(\d\d)$/, ' $1'));
      text(X.akun, y, cut(t.accountName || t.accountCode, 24));
      text(X.ket, y, cut(t.desc || '', 26));
      text(X.pay, y, cut(t.pay || '', 9));
      text(X.staff, y, cut(t.staff || '', 16));
      rtext(X.amt, y, (sgn(t) < 0 ? '-' : '') + fmt(t.amount), 'F1'); y -= LH;
    });
    y -= 2; line(y); y -= 14;
    if (y < 60) { newPage(); }
    text(MX, y, 'TOTAL BERSIH (income - outcome)', 'F2', 9.5); rtext(W - MX, y, rp(income - outcome), 'F2', 9.5);
    pages.forEach(function (pg, i) { cur = pg; text(W / 2 - 30, 22, 'Halaman ' + (i + 1) + ' / ' + pages.length, 'F1', 8); });
    var objs = [], pageIds = [], n = 4;
    var contents = pages.map(function (pg) { return 'BT\n' + pg.join('\n') + '\nET'; });
    var parts = [];
    contents.forEach(function (c, i) { pageIds.push(5 + i * 2); });
    objs.push('<< /Type /Catalog /Pages 2 0 R >>');
    objs.push('<< /Type /Pages /Kids [' + pageIds.map(function (i) { return i + ' 0 R'; }).join(' ') + '] /Count ' + pages.length + ' >>');
    objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    contents.forEach(function (c, i) {
      objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + (6 + i * 2) + ' 0 R >>');
      objs.push('<< /Length ' + c.length + ' >>\nstream\n' + c + '\nendstream');
    });
    var out = '%PDF-1.4\n', offs = [];
    objs.forEach(function (o, i) { offs.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
    var xr = out.length;
    out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(function (o) { return ('0000000000' + o).slice(-10) + ' 00000 n \n'; }).join('');
    out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF';
    var u = new Uint8Array(out.length); for (var i = 0; i < out.length; i++) u[i] = out.charCodeAt(i) & 255;
    return new Blob([u], { type: 'application/pdf' });
  }
  function save(blob, name) {
    var a = document.createElement('a'), u = URL.createObjectURL(blob);
    a.href = u; a.download = name; a.style.display = 'none'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(u); if (a.parentNode) a.parentNode.removeChild(a); }, 4000);
  }
  function fname(ext) { var r = range(), t = ten(); return 'laporan_' + String(t.id || 'toko').toLowerCase() + '_' + r[0] + (r[0] !== r[1] ? '_sd_' + r[1] : '') + '.' + ext; }
  function pdf() { save(build(), fname('pdf')); }
  function csv() {
    var q = function (v) { var s = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s) && isNaN(Number(s))) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    var head = ['Tanggal', 'Jam', 'Kode Akun', 'Nama', 'Kategori', 'Qty', 'Harga Satuan', 'Jumlah', 'PPN', 'Metode Bayar', 'Petugas', 'Keterangan'];
    var body = rows().map(function (t) { return [dOf(t), t.date, t.accountCode, t.accountName, t.category, t.qty || '', t.unitPrice || '', t.amount, t.tax12 || 0, t.pay || '', t.staff || '', t.desc || ''].map(q).join(','); });
    save(new Blob(['﻿' + head.map(q).join(',') + '\n' + body.join('\n')], { type: 'text/csv;charset=utf-8' }), fname('csv'));
  }

  /* ---------- jendela pilih periode ---------- */
  var css = document.createElement('style');
  css.textContent = '#fm-lap{position:fixed;inset:0;z-index:2147482000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.4);font-family:Inter,system-ui,sans-serif}' +
    'html[data-fm-invert="1"] #fm-lap{filter:invert(1) hue-rotate(180deg)}' +
    '#fm-lap .lp{width:min(460px,100%);border-radius:22px;background:rgba(255,255,255,.93);border:1px solid rgba(255,255,255,.7);box-shadow:0 24px 60px rgba(15,23,42,.35);color:#0f172a;padding:18px 20px}' +
    '#fm-lap h3{margin:0 0 4px;font-size:17px;font-weight:800}#fm-lap p{margin:0 0 12px;font-size:12px;color:#475569}' +
    '#fm-lap .ch{all:unset;cursor:pointer;padding:7px 13px;border-radius:99px;font-size:12.5px;font-weight:700;background:rgba(148,163,184,.22);color:#334155;margin:0 6px 6px 0;display:inline-block}#fm-lap .ch.on{background:#2f55d4;color:#fff}' +
    '#fm-lap input[type=date]{border:1px solid rgba(71,85,105,.3);border-radius:10px;padding:7px 9px;font:600 12.5px Inter,system-ui,sans-serif;background:#fff;color:#0f172a}' +
    '#fm-lap .go{all:unset;cursor:pointer;padding:11px 18px;border-radius:12px;background:#2f55d4;color:#fff;font-size:13px;font-weight:800;text-align:center}' +
    '#fm-lap .go.sec{background:rgba(148,163,184,.25);color:#1e293b}#fm-lap .info{margin:8px 0 12px;font-size:12.5px;font-weight:700;color:#334155}';
  (document.head || document.documentElement).appendChild(css);
  function draw() {
    var r = range(), n = rows().length;
    ov.querySelector('.lp').innerHTML = '<h3>Unduh Laporan</h3><p>Pilih periode, lalu unduh PDF (laporan rapi berkop) atau CSV (untuk Excel).</p>' +
      [['hari', 'Hari ini'], ['minggu', 'Minggu ini'], ['bulan', 'Bulan ini'], ['tahun', 'Tahun ini'], ['kustom', 'Kustom']].map(function (c) { return '<button type="button" class="ch' + (st.p === c[0] ? ' on' : '') + '" data-p="' + c[0] + '">' + c[1] + '</button>'; }).join('') +
      (st.p === 'kustom' ? '<div style="margin:4px 0 6px"><input type="date" id="lp-f" value="' + esc(r[0]) + '"> s/d <input type="date" id="lp-t" value="' + esc(r[1]) + '"></div>' : '') +
      '<div class="info">' + dtxt(r[0]) + (r[0] !== r[1] ? ' s/d ' + dtxt(r[1]) : '') + ' · ' + n + ' transaksi</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="go" id="lp-pdf">Unduh PDF</button><button type="button" class="go sec" id="lp-csv">Unduh CSV (Excel)</button><button type="button" class="go sec" id="lp-x">Tutup</button></div>';
    [].forEach.call(ov.querySelectorAll('[data-p]'), function (b) { b.onclick = function () { st.p = b.getAttribute('data-p'); draw(); }; });
    var f = ov.querySelector('#lp-f'), t = ov.querySelector('#lp-t');
    if (f) f.onchange = function () { st.from = f.value; draw(); }; if (t) t.onchange = function () { st.to = t.value; draw(); };
    ov.querySelector('#lp-pdf').onclick = pdf; ov.querySelector('#lp-csv').onclick = csv; ov.querySelector('#lp-x').onclick = function () { ov.style.display = 'none'; };
  }
  window.FM_LAPORAN = {
    open: function () {
      if (!ov) { ov = document.createElement('div'); ov.id = 'fm-lap'; ov.innerHTML = '<div class="lp"></div>'; ov.addEventListener('mousedown', function (e) { if (e.target === ov) ov.style.display = 'none'; }); document.body.appendChild(ov); }
      draw(); ov.style.display = 'flex';
    },
    blob: build
  };
})();
