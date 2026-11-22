/* backup.js — Backup & Ekspor Mandiri. Owner/Manager mengunduh data toko sendiri: file Excel (.xlsx, beberapa lembar)
   dan salinan mentah (.json). Dibuat di perangkat tanpa pustaka luar. */
(function () {
  'use strict';
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : 'default'; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function f(k) { try { return !!(window.FM_PLANS && FM_PLANS.has(k)); } catch (e) { return false; } }
  function iso(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---- penulis .xlsx minimal (zip tanpa kompresi) ---- */
  var CRC = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function u16(n) { return [n & 255, (n >>> 8) & 255]; }
  function u32(n) { return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]; }
  function zip(files) {
    var enc = new TextEncoder(), parts = [], cen = [], off = 0;
    files.forEach(function (fl) {
      var nm = enc.encode(fl.name), data = enc.encode(fl.data), crc = crc32(data);
      var lh = [0x50, 0x4b, 3, 4].concat(u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(nm.length), u16(0));
      parts.push(new Uint8Array(lh), nm, data);
      cen.push(new Uint8Array([0x50, 0x4b, 1, 2].concat(u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(nm.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off))), nm);
      off += lh.length + nm.length + data.length;
    });
    var cs = 0; cen.forEach(function (c) { cs += c.length; });
    var end = new Uint8Array([0x50, 0x4b, 5, 6].concat(u16(0), u16(0), u16(files.length), u16(files.length), u32(cs), u32(off), u16(0)));
    return new Blob(parts.concat(cen, [end]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function col(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function clean(s) { return esc(String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')); }
  function sheetXml(rows) {
    var x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="30" width="18" customWidth="1"/></cols><sheetData>';
    rows.forEach(function (r, ri) {
      x += '<row r="' + (ri + 1) + '">';
      r.forEach(function (v, ci) {
        var ref = col(ci) + (ri + 1), st = ri === 0 ? ' s="1"' : '';
        if (v === '' || v == null) return;
        if (typeof v === 'number' && isFinite(v)) x += '<c r="' + ref + '"' + st + '><v>' + v + '</v></c>';
        else x += '<c r="' + ref + '"' + st + ' t="inlineStr"><is><t xml:space="preserve">' + clean(v) + '</t></is></c>';
      });
      x += '</row>';
    });
    return x + '</sheetData></worksheet>';
  }
  function xlsx(sheets) {
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets.map(function (s, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>';
    var files = [{ name: '[Content_Types].xml', data: ct },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map(function (s, i) { return '<sheet name="' + clean(s.name.replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map(function (s, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') + '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>' }];
    sheets.forEach(function (s, i) { files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: sheetXml(s.rows) }); });
    return zip(files);
  }

  /* ---- data toko ---- */
  function getAll() {
    var tx = [], prods = [], coa = [];
    try { tx = (typeof txList !== 'undefined' ? txList : []).slice(); } catch (e) {}
    try { prods = STORE.getProducts(); } catch (e) {} try { coa = STORE.getCOA(); } catch (e) {}
    var piu = [], abs = null;
    try { if (f('piutang') && window.FM_PIU && FM_PIU.all) piu = FM_PIU.all(); } catch (e) {}
    try { if (f('absensi') && window.FM_ABS && FM_ABS.all) abs = FM_ABS.all(); } catch (e) {}
    var pr = []; try { if (f('properti') && window.FM_PROP && FM_PROP.all) pr = FM_PROP.all(); } catch (e) {}
    return { tx: tx, prods: prods, coa: coa, piu: piu.filter(function (x) { return x.t === 'p' || x.t === 'e'; }), abs: abs, properti: pr };
  }
  function build(D) {
    var biz = function (t) { try { return (window.FM_BIZ && FM_BIZ.ofTx && FM_BIZ.ofTx(t)) || ''; } catch (e) { return ''; } };
    var tx = D.tx.slice().sort(function (a, b) { return String(a.dateISO || '').localeCompare(String(b.dateISO || '')); });
    var S = [{ name: 'Transaksi', rows: [['Tanggal', 'Jam', 'Kode akun', 'Nama akun', 'Kategori', 'Usaha', 'Keterangan', 'Jumlah barang', 'Satuan', 'Harga satuan', 'Diskon', 'Promo', 'Jumlah (Rp)', 'Pajak', 'Cara bayar', 'Petugas']].concat(tx.map(function (t) {
      return [t.dateISO || '', t.time || '', t.accountCode || '', t.accountName || '', t.category || '', biz(t), t.desc || '', Number(t.qty) || '', t.unitName || '', Number(t.unitPrice) || '', Number(t.discount) || '', t.promo || '', Number(t.amount) || 0, Number(t.tax12) || '', t.pay || '', t.staff || ''];
    })) }];
    if (D.prods.length) S.push({ name: 'Produk & Stok', rows: [['Kode', 'Nama', 'Induk', 'Satuan', 'Harga pokok', 'Harga jual', 'Stok', 'Barcode', 'Nilai stok (stok x HPP)']].concat(D.prods.map(function (p) {
      return [p.code || '', p.name || '', p.group || '', p.unit || '', Number(p.hpp) || 0, Number(p.sellPrice) || 0, Number(p.stock) || 0, p.barcode || '', (Number(p.stock) || 0) * (Number(p.hpp) || 0)]; })) });
    if (D.coa.length) S.push({ name: 'Daftar Akun', rows: [['Kode', 'Nama', 'Kategori']].concat(D.coa.map(function (c) { return [c.code || '', c.name || '', c.category || '']; })) });
    var ents = D.piu.filter(function (x) { return x.t === 'e'; });
    if (ents.length) S.push({ name: 'Piutang & Utang', rows: [['Jenis', 'Pihak', 'Keterangan', 'Total', 'Terbayar', 'Sisa', 'Jatuh tempo', 'Status']].concat(ents.map(function (e) { return [e.kind === 'piutang' ? 'Piutang' : 'Utang', e.partyName || '', e.desc || '', Number(e.total) || 0, Number(e.paid) || 0, Math.max(0, (Number(e.total) || 0) - (Number(e.paid) || 0)), e.dueISO || '', e.status || '']; })) });
    if (D.abs && D.abs.rows.length) S.push({ name: 'Absensi', rows: [['Tanggal', 'Karyawan', 'Status', 'Masuk', 'Pulang']].concat(D.abs.rows.slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); }).map(function (r) { return [r.date || '', r.name || '', r.status || 'hadir', r.inAt || '', r.outAt || '']; })) });
    var P = D.properti || [];
    if (P.length) {
      var un = {}; P.forEach(function (x) { if (x.t === 'xu') un[x.id] = x; });
      var sw = {}; P.forEach(function (x) { if (x.t === 'xs') sw[x.id] = x; });
      S.push({ name: 'Properti Unit', rows: [['Unit', 'Jenis', 'Tarif sewa per bulan', 'Catatan']].concat(P.filter(function (x) { return x.t === 'xu'; }).map(function (u) { return [u.name || '', u.kind || '', Number(u.rate) || 0, u.note || '']; })) });
      S.push({ name: 'Properti Penyewa', rows: [['Penyewa', 'Unit', 'No. WhatsApp', 'Sewa per bulan', 'Mulai', 'Selesai', 'Deposit', 'Status']].concat(P.filter(function (x) { return x.t === 'xs'; }).map(function (x) { return [x.name || '', (un[x.unitId] || {}).name || '', x.phone || '', Number(x.rate) || 0, x.startISO || '', x.endISO || '', Number(x.deposit) || 0, x.status || '']; })) });
      S.push({ name: 'Properti Tagihan', rows: [['Bulan', 'Unit', 'Penyewa', 'Tagihan', 'Terbayar', 'Sisa', 'Jatuh tempo', 'Status']].concat(P.filter(function (x) { return x.t === 'xb'; }).sort(function (a, b) { return String(a.month).localeCompare(String(b.month)); }).map(function (b) { return [b.month || '', (un[b.unitId] || {}).name || '', (sw[b.sewaId] || {}).name || '', Number(b.amount) || 0, Number(b.paid) || 0, Math.max(0, (Number(b.amount) || 0) - (Number(b.paid) || 0)), b.dueISO || '', b.status || '']; })) });
    }
    return S;
  }
  function save(blob, name) {
    var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 3000);
  }
  function name(ext) { var t = tn(); return 'backup-' + String((t && (t.nama || t.id)) || 'toko').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + iso() + '.' + ext; }
  function stamp() { try { localStorage.setItem('fm_backup_last_' + tid(), String(Date.now())); } catch (e) {} }
  function lastTxt() { try { var v = Number(localStorage.getItem('fm_backup_last_' + tid())); return v ? new Date(v).toLocaleString('id-ID') : 'belum pernah di perangkat ini'; } catch (e) { return ''; } }

  var ov = null, busy = false, note = '';
  var S0 = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var btn = 'padding:11px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:13px;font-weight:700;cursor:pointer';
  var green = ';background:#22c55e;color:#04210f;border-color:#22c55e';
  function render() {
    if (!ov || ov.style.display === 'none') return;
    ov.innerHTML = '<div style="width:100%;max-width:520px;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px">' +
      '<div style="display:flex;justify-content:space-between;gap:10px"><div><div style="font-weight:800;font-size:17px">Backup &amp; Ekspor Data</div><div style="font-size:12px;opacity:.65">Unduh data toko Anda sendiri kapan saja.</div></div><button data-x style="' + btn + ';padding:7px 12px;font-size:12px">Tutup</button></div>' +
      (note ? '<p style="margin:12px 0;padding:10px 12px;border-radius:12px;background:rgba(34,197,94,.14);color:#86efac;font-size:12px">' + esc(note) + '</p>' : '') +
      '<div style="display:grid;gap:10px;margin:14px 0"><button data-a="xlsx" style="' + btn + green + '"' + (busy ? ' disabled' : '') + '>Unduh Excel (.xlsx)</button><button data-a="json" style="' + btn + '"' + (busy ? ' disabled' : '') + '>Unduh salinan lengkap (.json)</button></div>' +
      '<div style="font-size:12px;opacity:.75;line-height:1.5">Excel berisi lembar Transaksi, Produk &amp; Stok, Daftar Akun' + (f('piutang') ? ', Piutang &amp; Utang' : '') + (f('absensi') ? ', Absensi' : '') + '. File .json dipakai untuk arsip utuh.<br>Backup terakhir: <b>' + esc(lastTxt()) + '</b></div></div>';
  }
  async function run(kind) {
    if (busy) return; busy = true; note = 'Menyiapkan data…'; render();
    try {
      try { if (f('piutang') && window.FM_PIU && FM_PIU.start) FM_PIU.start(); if (f('absensi') && window.FM_ABS && FM_ABS.all) FM_ABS.all(); if (f('properti') && window.FM_PROP && FM_PROP.all) FM_PROP.all(); } catch (e) {}
      await wait(1200);
      var D = getAll();
      if (kind === 'xlsx') save(xlsx(build(D)), name('xlsx'));
      else save(new Blob([JSON.stringify({ toko: (tn() || {}).nama || tid(), dibuat: new Date().toISOString(), transaksi: D.tx, produk: D.prods, akun: D.coa, piutangUtang: D.piu, absensi: D.abs, properti: D.properti }, null, 1)], { type: 'application/json' }), name('json'));
      stamp(); note = 'File sudah diunduh (' + D.tx.length + ' transaksi, ' + D.prods.length + ' produk).';
    } catch (e) { note = 'Gagal membuat file: ' + (e && e.message || e); }
    busy = false; render();
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-backup';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S0;
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; } var b = e.target.closest('[data-a]'); if (b) run(b.getAttribute('data-a')); });
    document.body.appendChild(ov);
  }
  window.FM_BACKUP = { open: function () { ensure(); note = ''; ov.style.display = 'flex'; render(); }, _xlsx: xlsx, _build: build };
})();
