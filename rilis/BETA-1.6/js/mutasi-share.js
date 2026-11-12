/* mutasi-share.js — kirim mutasi lewat WhatsApp dan cetak. Dipasang di popup Mutasi bila fiturnya dicentang di Tower. */
(function () {
  'use strict';
  var cfg = null;
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rp(n) { return 'Rp ' + (typeof formatThousandSeparator === 'function' ? formatThousandSeparator(Math.round(n || 0)) : Math.round(n || 0)); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function store() { var t = tn(); return (t && t.nama) || document.title || 'Toko'; }
  function dmy(s) { var p = String(s || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s; }

  function range() {
    var v = (document.getElementById('ms-period') || {}).value || 'today', now = new Date(), t = iso(now);
    if (v === 'today') return [t, t];
    if (v === '7') return [iso(addDays(now, -6)), t];
    if (v === 'month') return [t.slice(0, 7) + '-01', t];
    var a = (document.getElementById('ms-from') || {}).value || t, b = (document.getElementById('ms-to') || {}).value || t;
    return a <= b ? [a, b] : [b, a];
  }
  function data() {
    var all = ((cfg && cfg.tx && cfg.tx()) || []).slice();
    var r = range(), open = 0, inn = 0, out = 0, list = [];
    all.forEach(function (t) {
      var sg = t.category === 'sales' ? 1 : -1, d = t.dateISO || '';
      if (d < r[0]) open += sg * t.amount;
      else if (d <= r[1]) { list.push(t); if (sg > 0) inn += t.amount; else out += t.amount; }
    });
    list.sort(function (x, y) { return String(x.dateISO).localeCompare(String(y.dateISO)) || String(x.date).localeCompare(String(y.date)); });
    return { r: r, open: open, inn: inn, out: out, list: list, close: open + inn - out };
  }
  function periodText(d) { return d.r[0] === d.r[1] ? dmy(d.r[0]) : dmy(d.r[0]) + ' s/d ' + dmy(d.r[1]); }
  function sendWA() {
    var d = data(); if (!d.list.length) return alert('Tidak ada transaksi pada periode ini.');
    var num = ((document.getElementById('ms-wa') || {}).value || '').replace(/[^0-9]/g, '');
    if (num) { try { localStorage.setItem('fm_ms_wa', num); } catch (e) {} if (num[0] === '0') num = '62' + num.slice(1); }
    var L = ['*Mutasi ' + store() + '*', 'Periode: ' + periodText(d), ''];
    var max = 40; d.list.slice(0, max).forEach(function (t) { L.push(dmy(t.dateISO).slice(0, 5) + ' ' + (t.category === 'sales' ? '+' : '-') + rp(t.amount) + ' ' + (t.accountName || '') + (t.desc && t.desc !== t.accountName ? ' (' + t.desc + ')' : '')); });
    if (d.list.length > max) L.push('... dan ' + (d.list.length - max) + ' transaksi lainnya');
    L.push('', 'Saldo awal: ' + rp(d.open), 'Total masuk: ' + rp(d.inn), 'Total keluar: ' + rp(d.out), '*Saldo akhir: ' + rp(d.close) + '*');
    window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(L.join('\n')), '_blank');
  }
  function printIt() {
    var d = data(); if (!d.list.length) return alert('Tidak ada transaksi pada periode ini.');
    var bal = d.open, h = '<h1>' + esc(store()) + '</h1><h2>Mutasi ' + esc(periodText(d)) + '</h2><table><thead><tr><th>Tanggal</th><th>Uraian</th><th class="r">Debit</th><th class="r">Kredit</th><th class="r">Saldo</th></tr></thead><tbody><tr><td colspan="4">Saldo awal</td><td class="r">' + rp(d.open) + '</td></tr>';
    d.list.forEach(function (t) { var sg = t.category === 'sales'; bal += sg ? t.amount : -t.amount; h += '<tr><td>' + esc(dmy(t.dateISO)) + ' ' + esc(t.date || '') + '</td><td>[' + esc(t.accountCode) + '] ' + esc(t.accountName) + (t.desc && t.desc !== t.accountName ? '<br><small>' + esc(t.desc) + '</small>' : '') + '</td><td class="r">' + (sg ? rp(t.amount) : '-') + '</td><td class="r">' + (sg ? '-' : rp(t.amount)) + '</td><td class="r">' + rp(bal) + '</td></tr>'; });
    h += '<tr class="tot"><td colspan="2">Total</td><td class="r">' + rp(d.inn) + '</td><td class="r">' + rp(d.out) + '</td><td class="r">' + rp(d.close) + '</td></tr></tbody></table>';
    var w = window.open('', '_blank'); if (!w) return alert('Pop-up dicegah browser. Izinkan pop-up untuk mencetak.');
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Mutasi</title><style>body{font-family:Arial,sans-serif;color:#111;margin:24px}h1{font-size:18px;margin:0}h2{font-size:14px;margin:2px 0 14px;font-weight:400;color:#555}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border-bottom:1px solid #ccc;padding:6px;text-align:left;vertical-align:top}td.r,th.r{text-align:right}.tot td{font-weight:700;border-top:2px solid #111}@media print{button{display:none}}</style></head><body>' + h + '<p><button onclick="window.print()">Cetak</button></p></body></html>');
    w.document.close(); setTimeout(function () { try { w.focus(); w.print(); } catch (e) {} }, 400);
  }
  function inject() {
    var pop = document.getElementById('popup-content-mutasi');
    if (!pop || document.getElementById('ms-bar') || !(window.FM_PLANS && FM_PLANS.has('mutasi_wa'))) return;
    var f = 'padding:8px 10px;border-radius:12px;border:1px solid rgba(148,163,184,.4);background:rgba(148,163,184,.12);color:inherit;font-size:12px;outline:none';
    var b = 'padding:8px 14px;border-radius:999px;border:1px solid rgba(148,163,184,.45);background:rgba(148,163,184,.14);color:inherit;font-size:12px;font-weight:800;cursor:pointer';
    var bar = document.createElement('div'); bar.id = 'ms-bar'; bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px';
    var saved = ''; try { saved = localStorage.getItem('fm_ms_wa') || ''; } catch (e) {}
    bar.innerHTML = '<select id="ms-period" style="' + f + '"><option value="today">Hari ini</option><option value="7">7 hari terakhir</option><option value="month">Bulan ini</option><option value="range">Pilih tanggal</option></select>' +
      '<span id="ms-dates" style="display:none;gap:6px"><input id="ms-from" type="date" style="' + f + '"><input id="ms-to" type="date" style="' + f + '"></span>' +
      '<input id="ms-wa" type="tel" inputmode="numeric" placeholder="No. WhatsApp tujuan (08...)" value="' + esc(saved) + '" style="' + f + ';width:190px">' +
      '<button type="button" id="ms-send" style="' + b + ';background:#22c55e;color:#04210f;border-color:#22c55e">Kirim WA</button><button type="button" id="ms-print" style="' + b + '">Cetak</button>';
    pop.insertBefore(bar, pop.firstChild);
    document.getElementById('ms-period').onchange = function () { document.getElementById('ms-dates').style.display = this.value === 'range' ? 'inline-flex' : 'none'; };
    document.getElementById('ms-send').onclick = sendWA; document.getElementById('ms-print').onclick = printIt;
  }
  window.FM_MUTASI = { mount: function (c) { cfg = c; inject(); }, data: data };
})();
