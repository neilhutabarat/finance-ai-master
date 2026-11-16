/* grafik.js — Grafik Keuangan (Manager dan Owner). Dihitung langsung dari transaksi toko ini (mengikuti filter usaha), tanpa server dan tanpa AI.
   Empat grafik: penjualan dan laba, kas masuk dan keluar, beban terbesar, dan aset lawan liabilitas (bila Neraca AI aktif). Hanya membaca data, tidak mengubah apa pun. */
(function () {
  'use strict';
  var PAGE = (location.pathname.split('/').pop() || '').toLowerCase();
  if (!/^(manager|dashboard)\.html$/.test(PAGE)) return;
  var ov = null, mode = 'hari';
  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var BTN = 'padding:7px 13px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12px;font-weight:800;cursor:pointer';
  var VIO = ';background:#a855f7;color:#fff;border-color:#a855f7';
  var C = { a: '#60a5fa', b: '#fbbf24', g: '#34d399', r: '#fb7185', t: '#94a3b8', grid: 'rgba(148,163,184,.18)' };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rp(n) { return (n < 0 ? '-' : '') + 'Rp' + Math.abs(Math.round(n || 0)).toLocaleString('id-ID'); }
  function short(n) {
    var a = Math.abs(n), s = n < 0 ? '-' : '';
    if (a >= 1e9) return s + (a / 1e9).toFixed(a >= 1e10 ? 0 : 1).replace('.0', '') + ' M';
    if (a >= 1e6) return s + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.0', '') + ' jt';
    if (a >= 1e3) return s + Math.round(a / 1e3) + ' rb';
    return s + Math.round(a);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function txs() {
    try { var l = (typeof txList !== 'undefined' && txList) ? txList : []; return (typeof fmV === 'function') ? fmV(l) : l; } catch (e) { return []; }
  }
  function has(k) { try { return !window.FM_PLANS || FM_PLANS.has(k, PAGE === 'manager.html' ? 'manager' : 'owner'); } catch (e) { return true; } }

  /* kelompokkan transaksi per hari (30 hari terakhir) atau per bulan (12 bulan terakhir) */
  function buckets() {
    var now = new Date(), out = [], idx = {}, i, d;
    if (mode === 'hari') {
      for (i = 29; i >= 0; i--) { d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i); out.push({ key: iso(d), label: String(d.getDate()), full: d.getDate() + ' ' + MON[d.getMonth()], sales: 0, cogs: 0, exp: 0, prive: 0 }); }
    } else {
      for (i = 11; i >= 0; i--) { d = new Date(now.getFullYear(), now.getMonth() - i, 1); out.push({ key: d.getFullYear() + '-' + pad(d.getMonth() + 1), label: MON[d.getMonth()], full: MON[d.getMonth()] + ' ' + d.getFullYear(), sales: 0, cogs: 0, exp: 0, prive: 0 }); }
    }
    out.forEach(function (b, k) { idx[b.key] = k; });
    var exp = {}, n = 0;
    txs().forEach(function (t) {
      var di = t && t.dateISO || ''; if (!/^\d{4}-\d{2}-\d{2}$/.test(di)) return;
      var a = Math.round(Number(t.amount) || 0); if (!(a > 0)) return;
      var k = idx[mode === 'hari' ? di : di.slice(0, 7)]; if (k == null) return;
      var b = out[k], c = t.category; n++;
      if (c === 'sales') b.sales += a; else if (c === 'cogs') b.cogs += a; else if (c === 'prive') b.prive += a; else b.exp += a;
      if (c === 'cogs' || (c !== 'sales' && c !== 'prive')) { var nm = String(t.accountName || (c === 'cogs' ? 'Harga pokok' : 'Biaya lain')); exp[nm] = (exp[nm] || 0) + a; }
    });
    out.forEach(function (b) { b.laba = b.sales - b.cogs - b.exp; b.keluar = b.cogs + b.exp + b.prive; });
    return { rows: out, n: n, exp: exp };
  }

  /* grafik batang berkelompok; mendukung nilai negatif. series: [{name,color,get(row)}] */
  function bars(rows, series, opt) {
    var W = 560, H = 210, L = 46, R = 8, T = 8, B = 24, pw = W - L - R, ph = H - T - B;
    var mx = 0, mn = 0; rows.forEach(function (r) { series.forEach(function (s) { var v = s.get(r); if (v > mx) mx = v; if (v < mn) mn = v; }); });
    if (mx === 0 && mn === 0) mx = 1;
    var step = Math.pow(10, Math.floor(Math.log10(Math.max(mx, -mn)))), nice = [1, 2, 2.5, 5, 10].map(function (m) { return m * step; }).filter(function (v) { return (mx - mn) / v <= 5; })[0] || step * 10;
    var top = Math.ceil(mx / nice) * nice, bot = Math.floor(mn / nice) * nice; if (top === bot) top = bot + nice;
    function y(v) { return T + ph * (1 - (v - bot) / (top - bot)); }
    var g = '', v;
    for (v = bot; v <= top + nice / 2; v += nice) g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '" stroke="' + (v === 0 ? 'rgba(148,163,184,.55)' : C.grid) + '"/><text x="' + (L - 5) + '" y="' + (y(v) + 3.5).toFixed(1) + '" text-anchor="end" font-size="10" fill="' + C.t + '">' + short(v) + '</text>';
    var slot = pw / rows.length, bw = Math.max(2, Math.min(18, slot * 0.8 / series.length)), body = '';
    rows.forEach(function (r, i) {
      var x0 = L + slot * i + (slot - bw * series.length) / 2;
      series.forEach(function (s, j) {
        var val = s.get(r), y1 = y(Math.max(val, 0)), y2 = y(Math.min(val, 0)), h = Math.max(val === 0 ? 0 : 1.5, y2 - y1);
        body += '<rect x="' + (x0 + bw * j).toFixed(1) + '" y="' + y1.toFixed(1) + '" width="' + (bw - 1).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="1.5" fill="' + (s.neg && val < 0 ? s.neg : s.color) + '"><title>' + esc(r.full + ' · ' + s.name + ': ' + rp(val)) + '</title></rect>';
      });
      if (rows.length <= 12 || i % 5 === 0 || i === rows.length - 1) body += '<text x="' + (L + slot * i + slot / 2).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle" font-size="10" fill="' + C.t + '">' + esc(r.label) + '</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="' + esc(opt.label) + '" style="display:block;max-width:100%;height:auto">' + g + body + '</svg>';
  }
  function legend(series) { return '<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:11.5px;margin:2px 0 4px">' + series.map(function (s) { return '<span style="display:inline-flex;gap:5px;align-items:center"><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:' + s.color + '"></i>' + esc(s.name) + '</span>'; }).join('') + '</div>'; }
  function card(title, sub, inner) { return '<div style="padding:12px 14px;margin-top:12px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)"><div style="font-weight:800;font-size:13.5px">' + esc(title) + '</div>' + (sub ? '<div style="font-size:11.5px;opacity:.7;margin:2px 0 6px;line-height:1.5">' + sub + '</div>' : '') + inner + '</div>'; }

  function hbars(list, total) {
    var mx = list.length ? list[0][1] : 1, h = '';
    list.forEach(function (x) {
      h += '<div style="margin:7px 0"><div style="display:flex;justify-content:space-between;gap:8px;font-size:12px"><span>' + esc(x[0]) + '</span><b>' + rp(x[1]) + ' <span style="opacity:.6;font-weight:600">(' + Math.round(x[1] / total * 100) + '%)</span></b></div>' +
        '<div style="height:8px;border-radius:99px;background:rgba(148,163,184,.18);margin-top:3px;overflow:hidden"><div style="height:100%;width:' + Math.max(2, Math.round(x[1] / mx * 100)) + '%;background:' + C.b + ';border-radius:99px"></div></div></div>';
    });
    return h;
  }
  function neracaBars() {
    if (!has('neraca_ai') || !window.FM_NAI || !FM_NAI._calc) return '';
    var c; try { c = FM_NAI._calc(iso(new Date())); } catch (e) { return ''; }
    if (!c || (!c.aset && !c.liab && !c.ek)) return '';
    var rows = [{ label: 'Aset', full: 'Aset', v: c.aset }, { label: 'Liabilitas', full: 'Liabilitas', v: c.liab }, { label: 'Ekuitas', full: 'Ekuitas', v: c.ek }];
    var mx = Math.max.apply(null, rows.map(function (r) { return Math.abs(r.v); })) || 1, h = '';
    rows.forEach(function (r, i) {
      h += '<div style="margin:7px 0"><div style="display:flex;justify-content:space-between;font-size:12px"><span>' + r.label + '</span><b>' + rp(r.v) + '</b></div><div style="height:10px;border-radius:99px;background:rgba(148,163,184,.18);margin-top:3px;overflow:hidden"><div style="height:100%;width:' + Math.max(2, Math.round(Math.abs(r.v) / mx * 100)) + '%;background:' + [C.a, C.r, C.g][i] + ';border-radius:99px"></div></div></div>';
    });
    var ok = Math.abs(c.selisih || 0) < 1;
    return card('Aset, liabilitas, dan ekuitas', 'Posisi hari ini dari Neraca AI. Semua usaha, tidak mengikuti filter usaha.' + (ok ? ' Neraca seimbang.' : ' <b style="color:#fbbf24">Neraca belum seimbang (selisih ' + rp(c.selisih) + '). Buka Neraca AI untuk detailnya.</b>'), h);
  }

  function render() {
    if (!ov || ov.style.display === 'none') return;
    var d = buckets(), rows = d.rows, tot = { sales: 0, cogs: 0, exp: 0, prive: 0, laba: 0, keluar: 0 };
    rows.forEach(function (r) { ['sales', 'cogs', 'exp', 'prive', 'laba', 'keluar'].forEach(function (k) { tot[k] += r[k]; }); });
    var TB = function (id, t) { return '<button data-m="' + id + '" style="' + BTN + (mode === id ? VIO : '') + '">' + t + '</button>'; };
    var per = mode === 'hari' ? '30 hari terakhir' : '12 bulan terakhir';
    var h = '<div style="width:100%;max-width:640px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px;' + S + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><div style="font-weight:900;font-size:18px">Grafik Keuangan</div><div style="font-size:12px;opacity:.6">Dari transaksi toko, ' + per + '</div></div><button data-x style="' + BTN + '">Tutup</button></div>' +
      '<div style="display:flex;gap:6px;margin:12px 0 2px">' + TB('hari', '30 hari') + TB('bulan', '12 bulan') + '</div>';
    if (!d.n) {
      h += '<div style="padding:26px 6px;text-align:center;opacity:.75;font-size:13px">Belum ada transaksi di ' + per + '. Grafik muncul setelah transaksi tercatat.</div></div>';
      ov.innerHTML = h; return;
    }
    var margin = tot.sales > 0 ? Math.round(tot.laba / tot.sales * 100) : 0;
    h += '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px">' +
      [['Penjualan', rp(tot.sales), C.a], ['Laba bersih', rp(tot.laba), tot.laba < 0 ? C.r : C.g], ['Margin bersih', margin + '%', '#f5f5f7']].map(function (x) { return '<div style="padding:10px;border-radius:14px;background:rgba(255,255,255,.05)"><div style="font-size:10.5px;opacity:.7">' + x[0] + '</div><div style="font-weight:800;font-size:13.5px;margin-top:2px;color:' + x[2] + '">' + x[1] + '</div></div>'; }).join('') + '</div>';
    var best = rows.slice().sort(function (a, b) { return b.sales - a.sales; })[0];
    var s1 = [{ name: 'Penjualan', color: C.a, get: function (r) { return r.sales; } }, { name: 'Laba bersih', color: C.g, neg: C.r, get: function (r) { return r.laba; } }];
    h += card('Penjualan dan laba', 'Laba = penjualan dikurangi modal bahan dan biaya. Batang merah = rugi pada periode itu. Penjualan tertinggi: <b>' + esc(best.full) + '</b> (' + rp(best.sales) + ').', legend([s1[0], s1[1]]) + bars(rows, s1, { label: 'Penjualan dan laba' }));
    var s2 = [{ name: 'Uang masuk (penjualan)', color: C.a, get: function (r) { return r.sales; } }, { name: 'Uang keluar (modal, biaya, prive)', color: C.b, get: function (r) { return r.keluar; } }];
    var net = tot.sales - tot.keluar;
    h += card('Uang masuk dan keluar', 'Selisih periode ini: <b style="color:' + (net < 0 ? C.r : C.g) + '">' + rp(net) + '</b>' + (net < 0 ? '. Uang keluar lebih besar dari uang masuk.' : '.'), legend(s2) + bars(rows, s2, { label: 'Uang masuk dan keluar' }));
    var list = Object.keys(d.exp).map(function (k) { return [k, d.exp[k]]; }).sort(function (a, b) { return b[1] - a[1]; }), totExp = list.reduce(function (s, x) { return s + x[1]; }, 0);
    if (list.length) {
      var shown = list.slice(0, 6), rest = list.slice(6).reduce(function (s, x) { return s + x[1]; }, 0); if (rest > 0) shown.push(['Lainnya', rest]);
      h += card('Pengeluaran terbesar', 'Modal bahan dan biaya, total ' + rp(totExp) + (tot.prive ? '. Prive (' + rp(tot.prive) + ') tidak dihitung di sini.' : '.'), hbars(shown, totExp));
    }
    h += neracaBars();
    h += '<div style="font-size:11px;opacity:.55;margin-top:12px;line-height:1.5">Angka dihitung dari transaksi yang tercatat di aplikasi dan mengikuti pilihan usaha di layar utama. Transaksi tanpa tanggal valid tidak ikut.</div></div>';
    var top = ov.firstChild && ov.firstChild.scrollTop || 0;
    ov.innerHTML = h; if (top && ov.firstChild) ov.firstChild.scrollTop = top;
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-grafik';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var m = e.target.closest('[data-m]'); if (m) { mode = m.getAttribute('data-m'); render(); }
    });
    document.body.appendChild(ov);
  }
  window.FM_GRAFIK = { open: function () { if (!has('grafik')) return; ensure(); ov.style.display = 'flex'; render(); setTimeout(render, 900); }, _buckets: buckets, _mode: function (m) { mode = m; } };
})();
