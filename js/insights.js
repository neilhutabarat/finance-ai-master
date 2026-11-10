/* insights.js — kartu ringkasan paket Plus (dipakai owner & manager).
   Dihitung dari data yang sudah dimuat halaman (tanpa baca Firestore tambahan). */
(function () {
  'use strict';
  var cfg = null, targets = {}, synced = false;
  function tid() { try { var t = (typeof getActiveTenant === 'function') ? getActiveTenant() : null; return (t && t.id) ? String(t.id).toUpperCase() : 'ID26110901'; } catch (e) { return 'ID26110901'; } }
  function tkey() { return 'fm_targets_' + tid(); }
  function fmt(n) { return (typeof formatThousandSeparator === 'function') ? formatThousandSeparator(n) : String(n); }
  function rp(n) { return 'Rp ' + fmt(Math.round(n || 0)); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function localISO(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function txHour(t) { var m = /(\d{1,2})[.:](\d{2})/.exec(t.date || ''); return m ? parseInt(m[1], 10) : null; }
  try { targets = JSON.parse(localStorage.getItem(tkey()) || '{}') || {}; } catch (e) { targets = {}; }

  function sync() {
    if (synced || typeof db === 'undefined' || !db) return; synced = true;
    db.collection('tenant_settings').doc(tid()).get().then(function (d) {
      var t = d.exists && d.data().targets;
      if (t) { targets = t; try { localStorage.setItem(tkey(), JSON.stringify(t)); } catch (e) {} render(); }
    }).catch(function () {});
  }
  function saveTargets() {
    var d = Number(parseThousandSeparator(document.getElementById('tg-day').value)) || 0;
    var m = Number(parseThousandSeparator(document.getElementById('tg-month').value)) || 0;
    targets = { day: d, month: m };
    try { localStorage.setItem(tkey(), JSON.stringify(targets)); } catch (e) {}
    if (typeof db !== 'undefined' && db) db.collection('tenant_settings').doc(tid()).set({ targets: targets }, { merge: true }).catch(console.error);
    render();
  }
  function exportCSV() {
    var txList = cfg ? cfg.tx() : [];
    var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
    var head = ['Tanggal', 'Jam', 'Kode Akun', 'Nama', 'Kategori', 'Qty', 'Harga Satuan', 'Jumlah', 'PPN', 'Metode Bayar', 'Petugas', 'Keterangan'];
    var rows = txList.map(function (t) { return [t.dateISO || t.dateFull, t.date, t.accountCode, t.accountName, t.category, t.qty || '', t.unitPrice || '', t.amount, t.tax12 || 0, t.pay || '', t.staff || '', t.desc || ''].map(q).join(','); });
    var blob = new Blob(['﻿' + head.map(q).join(',') + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'transaksi_' + tid() + '_' + localISO() + '.csv';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function render() {
    if (!cfg) return;
    var box = document.getElementById(cfg.el); if (!box) return;
    var P = window.FM_PLANS; if (!P || !window.STORE) return;
    sync();
    var txList = cfg.tx() || [];
    var prods = STORE.getProducts(); var pm = {}; prods.forEach(function (p) { pm[p.code] = p; });
    var today = localISO(), month = today.slice(0, 7);
    var sales = txList.filter(function (t) { return t.category === 'sales'; });
    var sToday = sales.filter(function (t) { return t.dateISO === today; });
    var sMonth = sales.filter(function (t) { return (t.dateISO || '').slice(0, 7) === month; });
    var sum = function (a) { return a.reduce(function (x, t) { return x + (t.amount || 0); }, 0); };
    var profitOf = function (t) { var p = pm[t.accountCode]; return (t.isProduct && p) ? (t.amount - (p.hpp || 0) * (t.qty || 1)) : (t.amount || 0); };
    var omToday = sum(sToday), omMonth = sum(sMonth);
    var agg = {};
    sales.filter(function (t) { return t.isProduct; }).forEach(function (t) {
      var a = agg[t.accountCode] = agg[t.accountCode] || { name: t.accountName, qty: 0, rev: 0, profit: 0 };
      a.qty += (t.qty || 1); a.rev += t.amount; a.profit += profitOf(t);
    });
    var aggArr = Object.keys(agg).map(function (k) { return agg[k]; }).sort(function (x, y) { return y.profit - x.profit; });
    var aggToday = {}; sToday.filter(function (t) { return t.isProduct; }).forEach(function (t) { aggToday[t.accountName] = (aggToday[t.accountName] || 0) + (t.qty || 1); });
    var top = Object.keys(aggToday).map(function (k) { return [k, aggToday[k]]; }).sort(function (a, b) { return b[1] - a[1]; })[0];
    var hrs = {}; sToday.forEach(function (t) { var h = txHour(t); if (h != null) hrs[h] = (hrs[h] || 0) + 1; });
    var peak = Object.keys(hrs).map(function (k) { return [k, hrs[k]]; }).sort(function (a, b) { return b[1] - a[1]; })[0];
    var gross = sToday.reduce(function (x, t) { return x + profitOf(t); }, 0);
    var low = prods.filter(function (p) { return p.stock <= (typeof p.minStock === 'number' ? p.minStock : 5); }).sort(function (a, b) { return a.stock - b.stock; });
    var pay = { tunai: 0, qris: 0, transfer: 0 }; sToday.forEach(function (t) { var k = t.pay || 'tunai'; pay[k] = (pay[k] || 0) + t.amount; });

    var card = function (title, inner) { return '<div class="ios-glass fm-ic"><h4>' + title + '</h4>' + inner + '</div>'; };
    var line = function (l, r) { return '<div class="fm-row"><span>' + l + '</span><b>' + r + '</b></div>'; };
    var bar = function (v, t) { var pct = t > 0 ? Math.min(100, Math.round(v / t * 100)) : 0; return '<div class="fm-bar"><i style="width:' + pct + '%"></i></div>' + (t > 0 ? '<div class="fm-sub">' + pct + '% dari target ' + rp(t) + '</div>' : '') ; };

    var h = '';
    if (P.has('today_summary')) {
      h += '<div class="fm-ins-grid">';
      h += card('Ringkasan Hari Ini', line('Omzet', rp(omToday)) + line('Laba kotor', rp(gross)) + line('Jumlah nota', sToday.length) + line('Terlaris', top ? esc(top[0]) + ' (' + top[1] + ')' : '-') + line('Jam ramai', peak ? peak[0] + ':00' : '-'));
      h += card('Metode Bayar Hari Ini', line('Tunai', rp(pay.tunai)) + line('QRIS', rp(pay.qris)) + line('Transfer', rp(pay.transfer)) + '<div class="fm-sub">Cocokkan uang laci dengan baris Tunai.</div>');
      var tgt = '<div class="fm-sub" style="margin:0">Hari ini <b>' + rp(omToday) + '</b></div>' + bar(omToday, targets.day || 0) + '<div class="fm-sub" style="margin:6px 0 0">Bulan ini <b>' + rp(omMonth) + '</b></div>' + bar(omMonth, targets.month || 0);
      if (!targets.day && !targets.month) tgt += '<div class="fm-sub">' + (cfg.editTargets ? 'Isi target di bawah untuk melihat progres.' : 'Target belum diisi oleh owner.') + '</div>';
      if (cfg.editTargets) tgt += '<div class="fm-tg"><input id="tg-day" inputmode="numeric" placeholder="Target harian" value="' + (targets.day ? fmt(targets.day) : '') + '"><input id="tg-month" inputmode="numeric" placeholder="Target bulanan" value="' + (targets.month ? fmt(targets.month) : '') + '"><button type="button" data-save-tg>Simpan</button></div>';
      h += card('Target Omzet', tgt);
      h += card('Stok Menipis', low.length ? low.slice(0, 5).map(function (p) { return line(esc(p.name), p.stock + '/' + (typeof p.minStock === 'number' ? p.minStock : 5)); }).join('') + (low.length > 5 ? '<div class="fm-sub">+' + (low.length - 5) + ' produk lain</div>' : '') : '<div class="fm-ok">Semua stok aman.</div>');
      h += '</div>';
      h += '<div class="ios-glass fm-ic fm-ins-main"><h4>Laba & Margin per Produk</h4>' + (aggArr.length ? '<div class="fm-scroll"><table><thead><tr><th>Produk</th><th>Terjual</th><th>Omzet</th><th>Laba</th><th>Margin</th></tr></thead><tbody>' +
        aggArr.slice(0, 20).map(function (a) { return '<tr><td>' + esc(a.name) + '</td><td>' + a.qty + '</td><td>' + rp(a.rev) + '</td><td class="' + (a.profit >= 0 ? 'pos' : 'neg') + '">' + rp(a.profit) + '</td><td>' + (a.rev ? Math.round(a.profit / a.rev * 100) : 0) + '%</td></tr>'; }).join('') +
        '</tbody></table></div>' : '<div class="fm-sub">Belum ada penjualan produk.</div>') + '</div>';
    } else {
      var teaser = 'Hari ini omzet Anda <b>' + rp(omToday) + '</b> dari ' + sToday.length + ' nota' + (low.length ? ', dan <b>' + low.length + ' produk</b> hampir habis.' : '.') + ' Buka laba per produk, jam ramai, rekap metode bayar, dan target dengan paket Plus.';
      h += P.lockedHtml('today_summary', teaser);
    }
    box.innerHTML = h;
    var sb = box.querySelector('[data-save-tg]'); if (sb) sb.onclick = saveTargets;
  }

  window.FM_INSIGHTS = {
    mount: function (c) { cfg = c; render(); },
    render: render, exportCSV: exportCSV
  };
})();
