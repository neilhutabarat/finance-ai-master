/* labarugi.js — Kartu & laporan Laba Rugi (manager + owner).
   Struktur baku: Pendapatan - HPP = Laba Kotor; Laba Kotor - Beban Operasional = Laba Bersih.
   Prive (penarikan pribadi owner) BUKAN biaya: ditampilkan terpisah dan tidak mengurangi laba.
   Data diambil dari daftar transaksi yang sudah dimuat halaman (txList), tanpa baca Firestore tambahan. */
(function () {
  'use strict';
  var state = { period: 'bulan', from: '', to: '', biz: '' };
  function bizOn() { return !!(window.FM_BIZ && FM_BIZ.enabled()); }
  function bizPass(b, f) { return !f || (f === '__umum' ? !b : b === f); }
  function bizName(f) { return !f ? 'Semua usaha' : f === '__umum' ? 'Umum' : f; }
  var panel = null;

  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function num(n) { return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(n || 0)); }
  function rp(n) { return (n < 0 ? '-Rp ' : 'Rp ') + num(Math.abs(n)); }
  function pct(a, b) { return b > 0 ? (Math.round(a / b * 1000) / 10).toLocaleString('id-ID') + '%' : '-'; }
  function txs() { try { return (typeof txList !== 'undefined' && txList) ? txList : []; } catch (e) { return []; } }
  function txDate(t) { if (t.dateISO) return t.dateISO; if (t.timestamp) return iso(new Date(t.timestamp)); return ''; }
  function tenant() { try { return getActiveTenant() || {}; } catch (e) { return {}; } }

  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function dtxt(s) { var p = String(s).split('-'); return p.length === 3 ? parseInt(p[2], 10) + ' ' + BLN[parseInt(p[1], 10) - 1] + ' ' + p[0] : s; }
  function range(period) {
    var n = new Date(), y = n.getFullYear(), m = n.getMonth(), d = n.getDate();
    if (period === 'hari') return [iso(n), iso(n), 'Hari ini'];
    if (period === 'minggu') {
      var dow = (n.getDay() + 6) % 7, a = new Date(y, m, d - dow), b = new Date(y, m, d - dow + 6);
      return [iso(a), iso(b), 'Minggu ini'];
    }
    if (period === 'tahun') return [y + '-01-01', y + '-12-31', 'Tahun ' + y];
    if (period === 'kustom') return [state.from || iso(n), state.to || iso(n), 'Kustom'];
    return [iso(new Date(y, m, 1)), iso(new Date(y, m + 1, 0)), 'Bulan ini'];
  }

  function compute(period, biz) {
    var r = range(period), from = r[0], to = r[1];
    biz = bizOn() ? (biz === undefined ? state.biz : biz) : '';
    var G = { sales: {}, cogs: {}, expense: {}, prive: {} };
    var T = { sales: 0, cogs: 0, expense: 0, prive: 0 };
    var cls = []; try { cls = (window.STORE && STORE.getStockClosings && STORE.getStockClosings()) || []; } catch (e) {}
    var pakaiClosing = cls.length > 0;
    txs().forEach(function (t) {
      var c = G[t.category]; if (!c) return;
      if (biz && !bizPass(FM_BIZ.ofTx(t), biz)) return;
      /* setelah ada closing stok, pembelian tidak dihitung langsung: HPP diambil dari closing (stok awal + pembelian - sisa) */
      if (pakaiClosing && t.category === 'cogs' && (String(t.accountCode) === '201' || /pembelian/i.test(t.accountName || ''))) return;
      var d = txDate(t); if (!d || d < from || d > to) return;
      var k = t.accountCode || t.accountName || '-';
      var g = c[k] = c[k] || { name: t.accountName || k, count: 0, total: 0 };
      g.count++; g.total += (t.amount || 0); T[t.category] += (t.amount || 0);
    });
    cls.forEach(function (h) {
      if (!h.dateISO || h.dateISO < from || h.dateISO > to) return;
      var hv = h.hpp || 0;
      if (biz) {
        hv = 0; var bb = h.beliBiz || { '': h.pembelian || 0 };
        (h.rows || []).forEach(function (rw) { var b = rw.biz !== undefined ? FM_BIZ.canon(rw.biz) : FM_BIZ.ofGroup(rw.group); if (bizPass(b, biz)) hv += ((rw.awal || 0) - (rw.sisa || 0)) * (rw.hb || 0); });
        Object.keys(bb).forEach(function (k) { if (bizPass(FM_BIZ.canon(k), biz)) hv += bb[k] || 0; });
      }
      if (biz && !hv) return;
      var g = G.cogs['closing:' + h.id] = { name: 'HPP closing stok ' + h.label + ' (awal + pembelian - sisa)', count: 0, total: hv };
      T.cogs += hv;
    });
    var gross = T.sales - T.cogs, net = gross - T.expense;
    return { biz: biz, bizLabel: biz ? bizName(biz) : '', from: from, to: to, label: r[2], G: G, T: T, gross: gross, net: net, afterPrive: net - T.prive };
  }
  function rows(g) { return Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return b.total - a.total; }); }

  /* ----- kartu di halaman ----- */
  function decorate() {
    var h = document.getElementById('card-net-profit') || document.getElementById('kas-net');
    if (!h) return false;
    var card = h.closest('.ios-glass'); if (!card) return false;
    if (!card.getAttribute('data-fm-lr')) {
      card.setAttribute('data-fm-lr', '1'); card.style.cursor = 'pointer'; card.setAttribute('role', 'button'); card.setAttribute('tabindex', '0');
      card.addEventListener('click', openReport);
      card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openReport(); } });
      var lab = card.querySelector('span'); if (lab) lab.textContent = 'Laba Rugi · Bulan Ini';
      h.style.display = 'none';
      var n = document.createElement('h3'); n.id = 'fm-lr-n'; n.className = 'text-2xl sm:text-3xl font-black my-1 font-mono text-emerald-400'; n.textContent = 'Rp 0';
      var m = document.createElement('div'); m.id = 'fm-lr-m'; m.className = 'text-[11px] font-semibold text-slate-400'; m.textContent = 'Margin bersih -';
      h.parentNode.insertBefore(n, h); h.parentNode.insertBefore(m, h);
    }
    return true;
  }
  function refreshCard() {
    var n = document.getElementById('fm-lr-n'); if (!n) return;
    var c = compute('bulan', '');
    n.textContent = rp(c.net);
    n.className = 'text-2xl sm:text-3xl font-black my-1 font-mono ' + (c.net >= 0 ? 'text-emerald-400' : 'text-rose-400');
    var m = document.getElementById('fm-lr-m'); if (m) m.textContent = 'Margin bersih ' + pct(c.net, c.T.sales) + ' · ketuk untuk laporan';
  }

  /* ----- laporan ----- */
  function section(title, items, total, cls) {
    var h = '<tr><td colspan="3" style="padding:10px 0 4px;font-weight:800;font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.7">' + title + '</td></tr>';
    if (!items.length) h += '<tr><td colspan="3" style="padding:4px 0;font-size:12px;opacity:.55">Tidak ada transaksi pada periode ini.</td></tr>';
    items.forEach(function (i) {
      h += '<tr><td style="padding:5px 0;font-size:12.5px">' + esc(i.name) + '</td><td style="padding:5px 8px;text-align:center;font-size:11px;opacity:.6">' + i.count + ' nota</td><td style="padding:5px 0;text-align:right;font-family:ui-monospace,monospace;font-size:12.5px">' + rp(i.total) + '</td></tr>';
    });
    h += '<tr><td colspan="2" style="padding:6px 0;font-weight:800;border-top:1px solid rgba(148,163,184,.35)">Total ' + title.toLowerCase() + '</td><td class="' + cls + '" style="padding:6px 0;text-align:right;font-weight:800;font-family:ui-monospace,monospace;border-top:1px solid rgba(148,163,184,.35)">' + rp(total) + '</td></tr>';
    return h;
  }
  function result(label, val, sub) {
    return '<tr><td colspan="2" style="padding:11px 0;font-weight:900;font-size:14px;border-top:2px solid rgba(148,163,184,.5)">' + label + (sub ? ' <span style="font-weight:600;font-size:11px;opacity:.65">' + sub + '</span>' : '') + '</td><td class="' + (val >= 0 ? 'text-emerald-400' : 'text-rose-400') + '" style="padding:11px 0;text-align:right;font-weight:900;font-size:15px;font-family:ui-monospace,monospace;border-top:2px solid rgba(148,163,184,.5)">' + rp(val) + '</td></tr>';
  }
  function draw() {
    var c = compute(state.period);
    var chips = [['hari', 'Hari ini'], ['minggu', 'Minggu ini'], ['bulan', 'Bulan ini'], ['tahun', 'Tahun ini'], ['kustom', 'Kustom']].map(function (p) {
      var on = state.period === p[0];
      return '<button type="button" data-p="' + p[0] + '" style="all:unset;cursor:pointer;padding:7px 13px;border-radius:99px;font-size:12px;font-weight:700;border:1px solid rgba(148,163,184,.4);' + (on ? 'background:#2563eb;color:#fff;border-color:#2563eb' : '') + '">' + p[1] + '</button>';
    }).join('');
    var bizChips = '', bizSum = '';
    if (bizOn()) {
      var opts = [['', 'Semua usaha']].concat(FM_BIZ.list().map(function (n) { return [n, n]; })).concat([['__umum', 'Umum']]);
      bizChips = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">' + opts.map(function (p) {
        var on = state.biz === p[0];
        return '<button type="button" data-b="' + esc(p[0]) + '" style="all:unset;cursor:pointer;padding:7px 13px;border-radius:99px;font-size:12px;font-weight:700;border:1px solid rgba(148,163,184,.4);' + (on ? 'background:#047857;color:#fff;border-color:#047857' : '') + '">' + esc(p[1]) + '</button>';
      }).join('') + '</div>';
      if (!state.biz) {
        bizSum = '<div style="margin-top:14px;padding:12px 14px;border-radius:16px;border:1px dashed rgba(148,163,184,.5)"><div style="font-weight:800;font-size:12px;margin-bottom:6px">Ringkasan per usaha</div><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="opacity:.6"><th style="text-align:left;padding:3px 0">Usaha</th><th style="text-align:right">Pendapatan</th><th style="text-align:right">HPP + beban</th><th style="text-align:right">Laba bersih</th></tr></thead><tbody>' +
          opts.slice(1).map(function (p) { var x = compute(state.period, p[0]); return '<tr><td style="padding:3px 0">' + esc(p[1]) + '</td><td style="text-align:right;font-family:ui-monospace,Menlo,monospace">' + rp(x.T.sales) + '</td><td style="text-align:right;font-family:ui-monospace,Menlo,monospace">' + rp(x.T.cogs + x.T.expense) + '</td><td style="text-align:right;font-weight:800;font-family:ui-monospace,Menlo,monospace">' + rp(x.net) + '</td></tr>'; }).join('') +
          '</tbody></table><div style="font-size:11px;opacity:.6;margin-top:6px">Akun tanpa label usaha dihitung sebagai Umum. Biaya bersama (sewa, listrik) sebaiknya diberi label Umum.</div></div>';
      }
    }
    var inp = 'padding:7px 10px;border-radius:12px;border:1px solid rgba(148,163,184,.4);background:transparent;color:inherit;font-size:12px';
    var custom = state.period === 'kustom' ? '<div style="display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap"><input type="date" id="fm-lr-from" value="' + esc(c.from) + '" style="' + inp + '"><span>s/d</span><input type="date" id="fm-lr-to" value="' + esc(c.to) + '" style="' + inp + '"></div>' : '';
    var html = bizChips + '<div style="display:flex;gap:6px;flex-wrap:wrap">' + chips + '</div>' + custom +
      '<p style="font-size:12px;opacity:.7;margin:10px 0 0">Periode: ' + dtxt(c.from) + (c.from !== c.to ? ' s/d ' + dtxt(c.to) : '') + '</p>' +
      '<table style="width:100%;border-collapse:collapse;margin-top:6px">' +
      section('Pendapatan', rows(c.G.sales), c.T.sales, 'text-emerald-400') +
      section('HPP', rows(c.G.cogs), c.T.cogs, 'text-rose-400') +
      result('LABA KOTOR', c.gross, 'margin ' + pct(c.gross, c.T.sales)) +
      section('Beban Operasional', rows(c.G.expense), c.T.expense, 'text-rose-400') +
      result('LABA BERSIH', c.net, 'margin ' + pct(c.net, c.T.sales)) +
      '</table>' +
      bizSum +
      '<div style="margin-top:14px;padding:12px 14px;border-radius:16px;border:1px dashed rgba(148,163,184,.5)"><div style="font-weight:800;font-size:12px;margin-bottom:6px">Prive (penarikan pribadi owner) &mdash; tidak mengurangi laba</div>' +
      (rows(c.G.prive).length ? rows(c.G.prive).map(function (i) { return '<div style="display:flex;justify-content:space-between;font-size:12.5px;padding:2px 0"><span>' + esc(i.name) + ' <span style="opacity:.6">(' + i.count + ' nota)</span></span><span style="font-family:ui-monospace,monospace">' + rp(i.total) + '</span></div>'; }).join('') : '<div style="font-size:12px;opacity:.6">Tidak ada prive pada periode ini.</div>') +
      '<div style="display:flex;justify-content:space-between;font-weight:800;font-size:12.5px;margin-top:6px;padding-top:6px;border-top:1px solid rgba(148,163,184,.35)"><span>Sisa laba setelah prive</span><span style="font-family:ui-monospace,monospace">' + rp(c.afterPrive) + '</span></div></div>' +
      '<p style="font-size:11px;opacity:.6;margin:10px 0 0">Berdasarkan kas yang dicatat: HPP dan beban dihitung dari transaksi kategori HPP dan Beban Operasional (sudah termasuk PPN 12% pada biaya).</p>' +
      '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button type="button" id="fm-lr-pdf" style="all:unset;cursor:pointer;padding:10px 18px;border-radius:99px;background:#2563eb;color:#fff;font-weight:800;font-size:12.5px">Unduh PDF</button>' +
      '<button type="button" id="fm-lr-csv" style="all:unset;cursor:pointer;padding:10px 18px;border-radius:99px;border:1px solid rgba(148,163,184,.5);font-weight:800;font-size:12.5px">Unduh CSV</button></div>';
    panel.innerHTML = html;
    [].slice.call(panel.querySelectorAll('[data-b]')).forEach(function (b) { b.onclick = function () { state.biz = b.getAttribute('data-b'); draw(); }; });
    [].slice.call(panel.querySelectorAll('[data-p]')).forEach(function (b) { b.onclick = function () { state.period = b.getAttribute('data-p'); draw(); }; });
    var f = panel.querySelector('#fm-lr-from'), t = panel.querySelector('#fm-lr-to');
    if (f) f.onchange = function () { state.from = f.value; draw(); };
    if (t) t.onchange = function () { state.to = t.value; draw(); };
    panel.querySelector('#fm-lr-csv').onclick = function () { exportCSV(c); };
    panel.querySelector('#fm-lr-pdf').onclick = function () { exportPDF(c); };
  }
  function openReport() {
    if (!panel) { panel = document.createElement('div'); panel.id = 'fm-lr-panel'; }
    state.period = 'bulan'; state.from = ''; state.to = ''; state.biz = '';
    draw();
    if (window.FM_OPEN_PANEL) FM_OPEN_PANEL(panel, 'Laporan Laba Rugi', 'Pendapatan, HPP, beban, dan laba bersih per periode');
  }

  function flat(c) {
    var out = [];
    [['Pendapatan', 'sales', c.T.sales], ['HPP', 'cogs', c.T.cogs]].forEach(function (s) {
      rows(c.G[s[1]]).forEach(function (i) { out.push([s[0], i.name, i.count, i.total]); });
      out.push([s[0], 'TOTAL ' + s[0].toUpperCase(), '', s[2]]);
    });
    out.push(['Laba Kotor', 'LABA KOTOR', '', c.gross]);
    rows(c.G.expense).forEach(function (i) { out.push(['Beban Operasional', i.name, i.count, i.total]); });
    out.push(['Beban Operasional', 'TOTAL BEBAN OPERASIONAL', '', c.T.expense]);
    out.push(['Laba Bersih', 'LABA BERSIH', '', c.net]);
    rows(c.G.prive).forEach(function (i) { out.push(['Prive (info)', i.name, i.count, i.total]); });
    out.push(['Prive (info)', 'TOTAL PRIVE (tidak mengurangi laba)', '', c.T.prive]);
    out.push(['Sisa', 'SISA LABA SETELAH PRIVE', '', c.afterPrive]);
    return out;
  }
  function fname(c, ext) { var t = tenant(); return 'laba_rugi_' + (t.id || 'toko') + (c.bizLabel ? '_' + c.bizLabel.replace(/[^A-Za-z0-9]+/g, '-') : '') + '_' + c.from + '_' + c.to + '.' + ext; }
  function exportCSV(c) {
    var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
    var lines = [['Laporan Laba Rugi', tenant().nama || ''], ['Periode', c.from + ' s/d ' + c.to]].concat(c.bizLabel ? [['Usaha', c.bizLabel]] : []).concat([[], ['Bagian', 'Keterangan', 'Nota', 'Nominal']]).concat(flat(c));
    var blob = new Blob(['﻿' + lines.map(function (r) { return r.map(q).join(','); }).join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fname(c, 'csv');
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function exportPDF(c) {
    try {
      var J = window.jspdf && window.jspdf.jsPDF; if (!J) throw new Error('lib');
      var doc = new J({ unit: 'pt', format: 'a4' }), W = doc.internal.pageSize.getWidth();
      doc.setFontSize(16); doc.setFont(undefined, 'bold'); doc.text('Laporan Laba Rugi', 40, 48);
      doc.setFontSize(10); doc.setFont(undefined, 'normal');
      doc.text(String(tenant().nama || ''), 40, 66); doc.text('Periode: ' + dtxt(c.from) + ' s/d ' + dtxt(c.to) + (c.bizLabel ? '   |   Usaha: ' + c.bizLabel : ''), 40, 80);
      var body = flat(c).map(function (r) { return [r[1], r[2] === '' ? '' : r[2] + ' nota', rp(r[3])]; });
      var bold = flat(c).map(function (r) { return /^(TOTAL|LABA|SISA)/.test(r[1]); });
      doc.autoTable({
        startY: 96, head: [['Keterangan', 'Nota', 'Nominal']], body: body, styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [30, 41, 59] }, columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
        didParseCell: function (d) { if (d.section === 'body' && bold[d.row.index]) { d.cell.styles.fontStyle = 'bold'; d.cell.styles.fillColor = [241, 245, 249]; } }
      });
      var y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 400) + 20;
      doc.setFontSize(8); doc.text('Dihitung dari kas yang dicatat. Prive tidak mengurangi laba. Dicetak ' + new Date().toLocaleString('id-ID'), 40, Math.min(y, 800));
      doc.save(fname(c, 'pdf'));
    } catch (e) { alert('PDF belum bisa dibuat (pustaka PDF belum termuat, periksa internet). Gunakan Unduh CSV.'); }
  }

  function start() {
    var tries = 0, iv = setInterval(function () {
      if (decorate() || ++tries > 40) { clearInterval(iv); refreshCard(); setInterval(refreshCard, 1500); }
    }, 250);
  }
  window.FM_LR = { open: openReport, compute: compute, refresh: refreshCard };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
