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
  function openTargets() {
    var old = document.getElementById('fm-tg-panel'); if (old && old.parentNode) old.parentNode.removeChild(old);
    var p = document.createElement('div'); p.id = 'fm-tg-panel';
    var inp = 'width:100%;padding:11px 14px;border-radius:14px;border:1px solid rgba(148,163,184,.5);background:transparent;color:inherit;font-size:15px;font-weight:700;font-family:ui-monospace,Menlo,monospace;outline:none';
    p.innerHTML = '<p style="font-size:12.5px;opacity:.7;margin:0 0 12px">Isi target omzet. Progresnya tampil di kartu Target Omzet pada halaman Owner dan Manager. Kosongkan atau isi 0 untuk menghapus target.</p>' +
      '<label style="font-size:12px;font-weight:800;display:block;margin-bottom:4px">Target harian (Rp)</label><input id="tg-day" inputmode="numeric" autocomplete="off" placeholder="mis. 2.000.000" value="' + (targets.day ? fmt(targets.day) : '') + '" style="' + inp + '">' +
      '<label style="font-size:12px;font-weight:800;display:block;margin:12px 0 4px">Target bulanan (Rp)</label><input id="tg-month" inputmode="numeric" autocomplete="off" placeholder="mis. 40.000.000" value="' + (targets.month ? fmt(targets.month) : '') + '" style="' + inp + '">' +
      '<button type="button" data-save-tg style="all:unset;cursor:pointer;display:block;text-align:center;margin-top:16px;padding:12px;border-radius:99px;background:#2563eb;color:#fff;font-weight:800;font-size:13.5px">Simpan Target</button>';
    [].forEach.call(p.querySelectorAll('input'), function (el) { el.oninput = function () { var n = Number(String(el.value).replace(/[^0-9]/g, '')) || 0; el.value = n ? fmt(n) : ''; }; });
    p.querySelector('[data-save-tg]').onclick = saveTargets;
    if (window.FM_OPEN_PANEL) FM_OPEN_PANEL(p, 'Atur Target Omzet', 'Target harian dan bulanan toko');
    setTimeout(function () { var f = document.getElementById('tg-day'); if (f) f.focus(); }, 60);
  }
  function saveTargets() {
    var d = Number(parseThousandSeparator(document.getElementById('tg-day').value)) || 0;
    var m = Number(parseThousandSeparator(document.getElementById('tg-month').value)) || 0;
    var cx = document.querySelector('#fm-panel-modal .fm-px'); if (cx) cx.click();
    targets = { day: d, month: m };
    try { localStorage.setItem(tkey(), JSON.stringify(targets)); } catch (e) {}
    if (typeof db !== 'undefined' && db) db.collection('tenant_settings').doc(tid()).set({ targets: targets }, { merge: true }).catch(console.error);
    render();
  }
  function exportCSV() {
    var txList = cfg ? cfg.tx() : [];
    var q = function (v) { var s = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s) && isNaN(Number(s))) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
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
    if (!P.has('dashboard')) { box.innerHTML = ''; return; }
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
    var grossMonth = sMonth.reduce(function (x, t) { return x + profitOf(t); }, 0);
    var low = prods.filter(function (p) { return p.stock <= (typeof p.minStock === 'number' ? p.minStock : 5); }).sort(function (a, b) { return a.stock - b.stock; });
    var pay = { tunai: 0, qris: 0, transfer: 0, petty: 0 }; sToday.forEach(function (t) { var k = t.pay || 'tunai'; pay[k] = (pay[k] || 0) + t.amount; });

    var card = function (title, inner) { return '<div class="ios-glass fm-ic" data-fm-i="' + title + '"><h4>' + title + '</h4>' + inner + '</div>'; };
    var line = function (l, r) { return '<div class="fm-row"><span>' + l + '</span><b>' + r + '</b></div>'; };
    var bar = function (v, t) { var pct = t > 0 ? Math.min(100, Math.round(v / t * 100)) : 0; return '<div class="fm-bar"><i style="width:' + pct + '%"></i></div>' + (t > 0 ? '<div class="fm-sub">' + pct + '% dari target ' + rp(t) + '</div>' : '') ; };

    var aiCardHtml = '', aiQ = [], aiA = [];
    if (P.has('ai_asisten')) {
      if (!document.getElementById('fm-ai-font')) {
        var lk = document.createElement('link'); lk.id = 'fm-ai-font'; lk.rel = 'stylesheet';
        lk.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600&display=swap';
        document.head.appendChild(lk);
      }
      aiQ = ['Untung bulan ini berapa?', 'Stok apa yang mau habis?', 'Bagaimana kas hari ini?'];
      aiA = [
        'Bulan ini untung kotor sekitar ' + rp(grossMonth) + ' dari omzet ' + rp(omMonth) + '.',
        low.length ? ('Ada ' + low.length + ' produk di bawah batas aman: ' + low.slice(0, 3).map(function (p) { return esc(p.name) + ' (' + p.stock + ')'; }).join(', ') + (low.length > 3 ? ', dan lainnya' : '') + '.') : 'Semua stok aman, tidak ada yang mendekati batas minimum.',
        'Hari ini sudah ada ' + sToday.length + ' transaksi dengan omzet ' + rp(omToday) + '.'
      ];
      var hr0 = new Date().getHours(), yd = new Date(Date.now() - 86400000), yISO = yd.getFullYear() + '-' + String(yd.getMonth() + 1).padStart(2, '0') + '-' + String(yd.getDate()).padStart(2, '0');
      var omY = sum(sales.filter(function (t) { return t.dateISO === yISO; }));
      var aiHead;
      if (P.has('tutup_hari') && hr0 >= 4 && hr0 < 11) aiHead = 'Selamat pagi. Kemarin omzet ' + rp(omY) + (low.length ? (', dan ' + low.length + ' produk perlu dipesan hari ini.') : ', stok semua aman.');
      else if (P.has('tutup_hari') && hr0 >= 17) aiHead = 'Omzet hari ini ' + rp(omToday) + (sToday.length ? ' dari ' + sToday.length + ' transaksi. Siap tutup hari?' : '. Belum ada transaksi.');
      else aiHead = 'Omzet hari ini ' + rp(omToday) + (low.length ? (', dan ' + low.length + ' produk stoknya menipis.') : ', dan stok semua aman.');
      aiCardHtml = '<div id="fm-ai-card" class="fm-keep" style="font-family:\'Plus Jakarta Sans\',sans-serif;background:#1D1912;border-radius:20px;padding:20px 18px;margin-bottom:14px;color:#F5F0E4">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
        '<span style="width:7px;height:7px;border-radius:50%;background:#E3A638;display:inline-block"></span>' +
        '<span style="font-size:12px;font-weight:700;color:#E3A638">Asisten AI &middot; pratinjau Oneilverse 2</span>' +
        '</div>' +
        '<div data-ai-head style="font-family:\'Fraunces\',serif;font-size:18px;line-height:1.5;font-weight:500;margin-bottom:14px">' + aiHead + '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
        aiQ.map(function (q, i) { return '<button type="button" data-ai-q="' + i + '" style="all:unset;cursor:pointer;background:#262017;color:#D9D2C2;font-size:12px;padding:8px 12px;border-radius:100px">' + esc(q) + '</button>'; }).join('') +
        '</div>' +
        '<div id="fm-ai-chat" style="display:flex;flex-direction:column;gap:8px;margin-top:10px"></div>' +
        '</div>';
    }
    var h = '';
    {
      h += '<div class="fm-ins-grid">';
      if (P.has('card_ringkasan')) h += card('Ringkasan Hari Ini', line('Omzet', rp(omToday)) + line('Laba kotor', rp(gross)) + line('Jumlah nota', sToday.length) + line('Terlaris', top ? esc(top[0]) + ' (' + top[1] + ')' : '-') + line('Jam ramai', peak ? peak[0] + ':00' : '-'));
      if (P.has('card_metode')) h += card('Metode Bayar Hari Ini', line('Tunai', rp(pay.tunai)) + line('QRIS', rp(pay.qris)) + line('Transfer', rp(pay.transfer)) + (pay.petty ? line('Petty Cash', rp(pay.petty)) : '') + '<div class="fm-sub">Cocokkan uang laci dengan baris Tunai. Petty Cash dananya terpisah, tidak ikut baris Tunai.</div>');
      var tgt = '<div class="fm-sub" style="margin:0">Hari ini <b>' + rp(omToday) + '</b></div>' + bar(omToday, targets.day || 0) + '<div class="fm-sub" style="margin:6px 0 0">Bulan ini <b>' + rp(omMonth) + '</b></div>' + bar(omMonth, targets.month || 0);
      if (!targets.day && !targets.month) tgt += '<div class="fm-sub">' + (cfg.editTargets ? 'Isi target di bawah untuk melihat progres.' : 'Target belum diisi oleh owner.') + '</div>';
      if (cfg.editTargets) tgt += '<div class="fm-tg"><button type="button" data-open-tg style="grid-column:1/-1">Atur target</button></div>';
      if (P.has('card_target')) h += card('Target Omzet', tgt);
      if (P.has('card_stok')) h += card('Stok Menipis', low.length ? low.slice(0, 5).map(function (p) { return line(esc(p.name), p.stock + '/' + (typeof p.minStock === 'number' ? p.minStock : 5)); }).join('') + (low.length > 5 ? '<div class="fm-sub">+' + (low.length - 5) + ' produk lain</div>' : '') : '<div class="fm-ok">Semua stok aman.</div>');
      h += '</div>';
      var nonAgg = {};
      sales.filter(function (t) { return !t.isProduct; }).forEach(function (t) {
        var k = t.accountCode || t.accountName, a = nonAgg[k] = nonAgg[k] || { name: t.accountName || k, n: 0, rev: 0 };
        a.n += 1; a.rev += (t.amount || 0);
      });
      var nonArr = Object.keys(nonAgg).map(function (k) { return nonAgg[k]; }).sort(function (x, y) { return y.rev - x.rev; });
      var secP = aggArr.length ? '<div class="fm-scroll"><table><thead><tr><th>Produk</th><th>Terjual</th><th>Omzet</th><th>Laba</th><th>Margin</th></tr></thead><tbody>' +
        aggArr.slice(0, 20).map(function (a) { return '<tr><td>' + esc(a.name) + '</td><td>' + a.qty + '</td><td>' + rp(a.rev) + '</td><td class="' + (a.profit >= 0 ? 'pos' : 'neg') + '">' + rp(a.profit) + '</td><td>' + (a.rev ? Math.round(a.profit / a.rev * 100) : 0) + '%</td></tr>'; }).join('') +
        '</tbody></table></div>' : '';
      var secN = nonArr.length ? '<div class="fm-sub" style="margin-top:' + (aggArr.length ? '8' : '0') + 'px;font-weight:700">Penjualan non-produk (jasa dan akun pendapatan, tanpa data modal per barang)</div><div class="fm-scroll"><table><thead><tr><th>Akun</th><th>Nota</th><th>Omzet</th><th>Laba</th><th>Margin</th></tr></thead><tbody>' +
        nonArr.slice(0, 20).map(function (a) { return '<tr><td>' + esc(a.name) + '</td><td>' + a.n + '</td><td>' + rp(a.rev) + '</td><td>-</td><td>-</td></tr>'; }).join('') +
        '</tbody></table></div>' : '';
      h += '<div class="ios-glass fm-ic fm-ins-main" data-fm-i="Laba &amp; Margin per Produk"><h4>Laba & Margin per Produk</h4>' + ((secP || secN) ? secP + secN : '<div class="fm-sub">Belum ada penjualan.</div>') + '</div>';
    }
    var mid = '';
    {
      var days = [], byD = {};
      for (var di = 6; di >= 0; di--) { var dd = new Date(); dd.setDate(dd.getDate() - di); var dk = localISO(dd); days.push(dk); byD[dk] = { i: 0, o: 0 }; }
      txList.forEach(function (t) { var b = byD[t.dateISO]; if (!b) return; if (t.category === 'sales') b.i += t.amount || 0; else b.o += t.amount || 0; });
      var mx = 1; days.forEach(function (k) { mx = Math.max(mx, byD[k].i, byD[k].o); });
      var CW = 660, CH = 120, CP = 24;
      var cx = function (i) { return (CP + i * (CW - 2 * CP) / 6).toFixed(1); };
      var cy = function (v) { return (CH - 8 - (v / mx) * (CH - 24)).toFixed(1); };
      var pts = function (key) { return days.map(function (k, i) { return cx(i) + ',' + cy(byD[k][key]); }).join(' '); };
      var lbl = days.map(function (k, i) { var p = k.split('-'); return '<text x="' + cx(i) + '" y="' + (CH + 14) + '" text-anchor="middle">' + p[2] + '/' + p[1] + '</text>'; }).join('');
      var csvg = '<svg class="fm-ch" viewBox="0 0 ' + CW + ' ' + (CH + 20) + '" role="img" aria-label="Income dan outcome 7 hari terakhir"><line class="bl" x1="0" y1="' + (CH - 2) + '" x2="' + CW + '" y2="' + (CH - 2) + '"/><line class="bh" x1="0" y1="' + (CH) + '" x2="' + CW + '" y2="' + (CH) + '"/><polyline class="ci" points="' + pts('i') + '"/><polyline class="co" points="' + pts('o') + '"/>' + lbl + '</svg>' +
        '<div class="fm-lg"><span><i style="background:#7aa487"></i>Income</span><span><i style="background:#b8766a"></i>Outcome</span><span class="fm-sub" style="margin-left:auto">tertinggi ' + rp(mx) + '</span></div>';
      var recent = txList.map(function (t, i) { return [t, i]; }).sort(function (a, b) { var x = a[0].dateISO || '', y = b[0].dateISO || ''; return x < y ? 1 : x > y ? -1 : a[1] - b[1]; }).slice(0, 5);
      var rows = recent.length ? recent.map(function (r) { var t = r[0], inc = t.category === 'sales'; return '<div class="fm-tx"><span>' + esc(t.accountName || t.desc || '-') + '</span><b class="' + (inc ? 'pos' : 'neg') + '">' + (inc ? '+ ' : '- ') + rp(t.amount) + '</b></div>'; }).join('') : '<div class="fm-sub">Belum ada transaksi.</div>';
      mid = '<div class="fm-on2-mid">' + (P.has('card_grafik') ? card('Income vs Outcome · 7 hari', csvg) : '') + (P.has('card_transaksi') ? card('Transaksi terakhir', rows) : '') + '</div>';
    }
    box.innerHTML = aiCardHtml + mid + h;
    /* ---- ON2: satelit di kartu angka, rincian saat disentuh, dan pas satu layar ---- */
    try {
      var inS = 0, outS = 0, nIn = 0, nOut = 0, gIn = {}, gOut = {};
      txList.forEach(function (t) { var a = t.amount || 0, nm = t.accountName || t.desc || '-'; if (t.category === 'sales') { inS += a; nIn++; gIn[nm] = (gIn[nm] || 0) + a; } else { outS += a; nOut++; gOut[nm] = (gOut[nm] || 0) + a; } });
      var top4 = function (g) { var arr = Object.keys(g).map(function (k) { return [k, g[k]]; }).sort(function (x, y) { return y[1] - x[1]; }); return { list: arr.slice(0, 4), more: Math.max(0, arr.length - 4) }; };
      var dropHtml = function (g, cls) { var o = top4(g); return o.list.map(function (r) { return '<div><span>' + esc(r[0]) + '</span><b class="' + cls + '">' + rp(r[1]) + '</b></div>'; }).join('') + (o.more ? '<div class="mo">+ ' + o.more + ' lainnya</div>' : '') || '<div><span>Belum ada data</span></div>'; };
      var margin = inS ? Math.round((inS - outS) / inS * 100) : 0;
      var specs = [
        ['kas-total-in', nIn + ' transaksi', 'jade', dropHtml(gIn, 'pos')],
        ['kas-total-out', nOut + ' transaksi', 'rose', dropHtml(gOut, 'neg')],
        ['kas-net', 'Margin ' + margin + '%', margin < 0 ? 'rose' : 'jade', '<div><span>Income</span><b class="pos">' + rp(inS) + '</b></div><div><span>Outcome</span><b class="neg">' + rp(outS) + '</b></div><div><span>Selisih</span><b class="' + (inS - outS < 0 ? 'neg' : 'pos') + '">' + (inS - outS < 0 ? '-' : '') + rp(Math.abs(inS - outS)) + '</b></div>'],
        ['stat-total-pajak-sumbang', 'PPN 12%', '', '']
      ];
      specs.forEach(function (sp) {
        var el = document.getElementById(sp[0]), card = el && el.closest('.ios-glass'); if (!card) return;
        var ch = card.querySelector(':scope > .fm-kchip'); if (!ch) { ch = document.createElement('div'); card.appendChild(ch); }
        ch.className = 'fm-kchip ' + sp[2]; ch.textContent = sp[1];
        var dr = card.querySelector(':scope > .fm-kdrop');
        if (sp[3]) {
          if (!dr) { dr = document.createElement('div'); dr.className = 'fm-kdrop'; card.appendChild(dr); }
          dr.innerHTML = sp[3];
          if (!card._xp) {
            card._xp = 1; var ot, ct;
            card.addEventListener('mouseenter', function () { clearTimeout(ct); ot = setTimeout(function () { if (!card.classList.contains('xp')) { card.classList.add('xp'); if (window.FM_FX) FM_FX.burstEl(card.querySelector(':scope > .fm-kchip')); } }, 160); });
            card.addEventListener('mouseleave', function () { clearTimeout(ot); ct = setTimeout(function () { card.classList.remove('xp'); }, 260); });
          }
        }
      });
    } catch (e) { console.warn('kchips', e); }
    var fit = function () {
      try {
        [].forEach.call(box.querySelectorAll('.fm-ic'), function (c) {
          var rows = [].slice.call(c.querySelectorAll('.fm-row,.fm-tx')); rows.forEach(function (r) { r.style.display = ''; });
          var lim = c.getBoundingClientRect().bottom - 20; rows.forEach(function (r) { if (r.getBoundingClientRect().bottom > lim) r.style.display = 'none'; });
        });
      } catch (e) {}
    };
    fit(); setTimeout(fit, 400);
    if (!window._fmFitBound) { window._fmFitBound = 1; var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { var b = document.getElementById(cfg && cfg.el); if (b && window.FM_INSIGHTS && FM_INSIGHTS.fit) FM_INSIGHTS.fit(); }, 160); }); }
    window.FM_INSIGHTS_FIT = fit;
    try {
      var inTot = sum(sales), keysNow = txList.map(function (t, i) { return t.id != null ? String(t.id) : (t.dateISO + '|' + t.amount + '|' + t.accountCode + '|' + i); });
      window.FM_INSIGHTS_DATA = { omToday: omToday, nToday: sToday.length, gross: gross, omMonth: omMonth, grossMonth: grossMonth, top: top, peak: peak, low: low.slice(0, 5).map(function (p) { return { name: p.name, stock: p.stock }; }), pay: pay, rp: rp };
      if (window.FM_ON2 && FM_ON2.pulse && P.has('denyut')) {
        if (window.__fmSeen) { var fresh = []; txList.forEach(function (t, i) { if (!window.__fmSeen[keysNow[i]]) fresh.push(t); }); fresh.slice(0, 4).forEach(function (t, i) { setTimeout(function () { FM_ON2.pulse(t.category === 'sales' ? 'in' : 'out', t.amount); }, i * 500); }); }
        window.__fmSeen = {}; keysNow.forEach(function (k) { window.__fmSeen[k] = 1; });
      }
    } catch (e) {}
    if (window.FM_ON2 && FM_ON2.afterRender) FM_ON2.afterRender(box);
    var ob = box.querySelector('[data-open-tg]'); if (ob) { ob.onclick = openTargets; var cd = ob.closest('.fm-ic'); if (cd) { cd.style.cursor = 'pointer'; cd.onclick = function (e) { if (e.target.closest('button')) return; openTargets(); }; } }
    var chatBox = box.querySelector('#fm-ai-chat');
    if (chatBox) {
      [].forEach.call(box.querySelectorAll('[data-ai-q]'), function (btn) {
        btn.onclick = function () {
          var i = +btn.getAttribute('data-ai-q');
          var row1 = document.createElement('div');
          row1.style.cssText = 'align-self:flex-end;max-width:82%;background:#2A2117;color:#F5E9D0;padding:9px 12px;border-radius:14px;font-size:12.5px;line-height:1.4';
          row1.textContent = aiQ[i];
          var row2 = document.createElement('div');
          row2.style.cssText = 'align-self:flex-start;max-width:82%;background:#16140F;color:#D9D2C2;padding:9px 12px;border-radius:14px;font-size:12.5px;line-height:1.4';
          row2.textContent = aiA[i];
          chatBox.innerHTML = ''; chatBox.appendChild(row1); chatBox.appendChild(row2);
          var cardEl = box.querySelector('#fm-ai-card'); if (cardEl) cardEl.classList.add('asked');
          [].forEach.call(box.querySelectorAll('[data-ai-q]'), function (b2) { b2.disabled = (b2 === btn); b2.style.opacity = (b2 === btn) ? '.4' : ''; });
        };
      });
    }
  }

  window.FM_INSIGHTS = {
    fit: function () { if (window.FM_INSIGHTS_FIT) window.FM_INSIGHTS_FIT(); },
    mount: function (c) { cfg = c; render(); },
    render: render, exportCSV: exportCSV
  };
})();
