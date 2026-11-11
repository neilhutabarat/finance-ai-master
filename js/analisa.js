/* analisa.js — Analisa Keuangan (owner & manager).
   Dihitung langsung dari transaksi dan produk toko ini, tanpa server dan tanpa biaya. Bukan AI: semuanya aturan hitung yang transparan. */
(function () {
  'use strict';
  var cfg = null;
  var DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  function fmt(n) { return (typeof formatThousandSeparator === 'function') ? formatThousandSeparator(n) : String(n); }
  function rp(n) { return (n < 0 ? '-' : '') + 'Rp ' + fmt(Math.abs(Math.round(n || 0))); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function sum(a) { return a.reduce(function (s, t) { return s + (t.amount || 0); }, 0); }
  function pct(a, b) { return b > 0 ? Math.round((a - b) / b * 100) : null; }
  function median(arr) { var s = arr.slice().sort(function (x, y) { return x - y; }), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
  function hourOf(t) { var m = /(\d{1,2})[.:](\d{2})/.exec(t.date || ''); return m ? parseInt(m[1], 10) : null; }

  function compute() {
    var tx = (cfg && cfg.tx && cfg.tx()) || [];
    var prods = (window.STORE && STORE.getProducts) ? STORE.getProducts() : [];
    var pm = {}; prods.forEach(function (p) { pm[p.code] = p; });
    var now = new Date(), today = iso(now), month = today.slice(0, 7);
    var lm = new Date(now.getFullYear(), now.getMonth() - 1, 1), lastMonth = iso(lm).slice(0, 7), dom = now.getDate();
    var inRange = function (t, a, b) { var d = t.dateISO || t.dateFull || ''; return d >= a && d <= b; };
    var cat = function (list, c) { return list.filter(function (t) { return t.category === c; }); };
    var out = { f: [], stat: null, enough: true };
    var add = function (level, title, detail, tip) { out.f.push({ level: level, title: title, detail: detail, tip: tip }); };

    var mtx = tx.filter(function (t) { return (t.dateISO || '').slice(0, 7) === month; });
    var omzet = sum(cat(mtx, 'sales')), hpp = sum(cat(mtx, 'cogs')), beban = sum(cat(mtx, 'expense')), prive = sum(cat(mtx, 'prive'));
    var laba = omzet - hpp - beban;
    out.stat = { omzet: omzet, laba: laba, margin: omzet > 0 ? Math.round(laba / omzet * 100) : 0 };
    var salesDays = {}; cat(tx, 'sales').forEach(function (t) { salesDays[t.dateISO] = 1; });
    var nDays = Object.keys(salesDays).length;
    if (nDays < 3) { out.enough = false; return out; }

    // 1. laba bulan ini
    if (omzet > 0 || hpp > 0 || beban > 0) {
      if (laba < 0) add('warn', 'Bulan ini usaha masih rugi ' + rp(-laba), 'Pendapatan ' + rp(omzet) + ' belum menutup modal bahan ' + rp(hpp) + ' dan biaya ' + rp(beban) + '.', 'Cek pos biaya terbesar dan produk yang marginnya tipis (lihat temuan di bawah).');
      else add('good', 'Laba bersih bulan ini ' + rp(laba), 'Margin bersih ' + out.stat.margin + '% dari pendapatan ' + rp(omzet) + '.', null);
    }
    // 2. omzet vs bulan lalu pada rentang hari yang sama
    var lmStart = lastMonth + '-01', lmEnd = lastMonth + '-' + String(Math.min(dom, new Date(lm.getFullYear(), lm.getMonth() + 1, 0).getDate())).padStart(2, '0');
    var omLast = sum(cat(tx.filter(function (t) { return inRange(t, lmStart, lmEnd); }), 'sales'));
    var dOm = pct(omzet, omLast);
    if (dOm !== null) {
      if (dOm <= -10) add('warn', 'Pendapatan turun ' + Math.abs(dOm) + '% dari bulan lalu', 'Sampai tanggal ' + dom + ': ' + rp(omzet) + ' (bulan lalu ' + rp(omLast) + ').', 'Lihat hari dan produk yang melemah, lalu pertimbangkan promo ringan di jam sepi.');
      else if (dOm >= 5) add('good', 'Pendapatan naik ' + dOm + '% dari bulan lalu', 'Sampai tanggal ' + dom + ': ' + rp(omzet) + ' (bulan lalu ' + rp(omLast) + ').', null);
    }
    // 3. rasio HPP dan beban
    if (omzet > 0) {
      if (hpp / omzet > 0.6) add('warn', 'Modal bahan menyerap ' + Math.round(hpp / omzet * 100) + '% pendapatan', 'HPP bulan ini ' + rp(hpp) + ' dari pendapatan ' + rp(omzet) + '.', 'Tinjau harga jual dan harga beli bahan. Naikkan harga produk yang marginnya tipis.');
      if (beban / omzet > 0.5) add('warn', 'Biaya operasional ' + Math.round(beban / omzet * 100) + '% dari pendapatan', 'Total biaya ' + rp(beban) + ' bulan ini.', 'Periksa biaya tetap seperti sewa, gaji, dan listrik. Bandingkan dengan pendapatan harian rata-rata.');
    }
    // 4. tren 7 hari
    var w1 = sum(cat(tx.filter(function (t) { return inRange(t, iso(addDays(now, -6)), today); }), 'sales'));
    var w0 = sum(cat(tx.filter(function (t) { return inRange(t, iso(addDays(now, -13)), iso(addDays(now, -7))); }), 'sales'));
    var dW = pct(w1, w0);
    if (dW !== null && Math.abs(dW) >= 10) add(dW > 0 ? 'good' : 'warn', '7 hari terakhir ' + (dW > 0 ? 'naik ' : 'turun ') + Math.abs(dW) + '%', rp(w1) + ' dibanding ' + rp(w0) + ' pada 7 hari sebelumnya.', dW > 0 ? null : 'Cari tahu penyebabnya: stok kosong, cuaca, atau pelanggan berpindah.');
    // 5. hari terbaik (butuh data 2 minggu)
    if (nDays >= 14) {
      var byDow = {}, cnt = {};
      Object.keys(salesDays).forEach(function (d) { var dd = new Date(d + 'T00:00:00'); cnt[dd.getDay()] = (cnt[dd.getDay()] || 0) + 1; });
      cat(tx, 'sales').forEach(function (t) { var dd = new Date(t.dateISO + 'T00:00:00'); byDow[dd.getDay()] = (byDow[dd.getDay()] || 0) + t.amount; });
      var best = Object.keys(byDow).map(function (k) { return [k, byDow[k] / cnt[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
      var worst = best[best.length - 1];
      if (best.length >= 5) add('info', DAYS[best[0][0]] + ' hari paling ramai', 'Rata-rata ' + rp(best[0][1]) + ' per hari. Paling sepi: ' + DAYS[worst[0]] + ' (' + rp(worst[1]) + ').', 'Pastikan stok dan petugas cukup di hari ramai, dan coba promo di hari sepi.');
    }
    // 6. jam ramai
    var hrs = {}, nS = 0; cat(tx, 'sales').forEach(function (t) { var h = hourOf(t); if (h != null) { hrs[h] = (hrs[h] || 0) + 1; nS++; } });
    if (nS >= 30) { var th = Object.keys(hrs).map(function (k) { return [k, hrs[k]]; }).sort(function (a, b) { return b[1] - a[1]; })[0]; add('info', 'Jam paling ramai sekitar ' + th[0] + ':00', Math.round(th[1] / nS * 100) + '% transaksi terjadi pada jam ini.', 'Siapkan stok siap saji dan tambah petugas sebelum jam tersebut.'); }
    // 7. produk laris tapi margin tipis (30 hari)
    var from30 = iso(addDays(now, -29)), sold = {};
    tx.filter(function (t) { return t.category === 'sales' && t.isProduct && inRange(t, from30, today); }).forEach(function (t) { var o = sold[t.accountCode] = sold[t.accountCode] || { qty: 0, name: t.accountName }; o.qty += (t.qty || 1); });
    var thin = Object.keys(sold).map(function (k) { return { code: k, qty: sold[k].qty, p: pm[k] }; }).filter(function (x) { return x.p && x.p.sellPrice > 0; })
      .sort(function (a, b) { return b.qty - a.qty; }).slice(0, 5).filter(function (x) { return (x.p.sellPrice - x.p.hpp) / x.p.sellPrice < 0.2; });
    if (thin.length) add('warn', thin[0].p.name + ' laris tapi marginnya tipis', thin.map(function (x) { return esc(x.p.name) + ' (margin ' + Math.round((x.p.sellPrice - x.p.hpp) / x.p.sellPrice * 100) + '%, terjual ' + x.qty + ')'; }).join('; ') + '.', 'Pertimbangkan menaikkan harga sedikit atau mencari bahan yang lebih murah.');
    // 8. biaya naik (30 hari vs 30 hari sebelumnya)
    var p0 = iso(addDays(now, -59)), p1 = iso(addDays(now, -30)), cur = {}, prev = {};
    tx.filter(function (t) { return t.category === 'cogs' || t.category === 'expense'; }).forEach(function (t) {
      if (inRange(t, from30, today)) cur[t.accountName] = (cur[t.accountName] || 0) + t.amount;
      else if (inRange(t, p0, p1)) prev[t.accountName] = (prev[t.accountName] || 0) + t.amount;
    });
    var om30 = sum(cat(tx.filter(function (t) { return inRange(t, from30, today); }), 'sales'));
    var rise = Object.keys(cur).filter(function (k) { var d = cur[k] - (prev[k] || 0); return prev[k] > 0 && cur[k] / prev[k] >= 1.3 && d >= Math.max(100000, om30 * 0.03); })
      .sort(function (a, b) { return (cur[b] - prev[b]) - (cur[a] - prev[a]); }).slice(0, 2);
    rise.forEach(function (k) { add('warn', k + ' naik ' + pct(cur[k], prev[k]) + '%', rp(cur[k]) + ' dalam 30 hari terakhir, sebelumnya ' + rp(prev[k]) + '.', 'Periksa apakah kenaikan ini wajar. Cek nota dan bandingkan harga pemasok.'); });
    // 9. transaksi janggal (14 hari terakhir, jauh di atas biasanya)
    var hist = {}; tx.filter(function (t) { return (t.category === 'cogs' || t.category === 'expense') && inRange(t, iso(addDays(now, -90)), today); }).forEach(function (t) { (hist[t.accountName] = hist[t.accountName] || []).push(t.amount); });
    var odd = tx.filter(function (t) {
      if (!((t.category === 'cogs' || t.category === 'expense') && inRange(t, iso(addDays(now, -13)), today))) return false;
      var h = hist[t.accountName] || []; return h.length >= 4 && t.amount >= 100000 && t.amount > 3 * median(h);
    }).slice(0, 3);
    if (odd.length) add('warn', odd.length + ' pengeluaran jauh di atas biasanya', odd.map(function (t) { return esc(t.accountName) + ' ' + rp(t.amount) + ' (' + esc(t.dateISO) + ')'; }).join('; ') + '.', 'Pastikan nominalnya benar dan ada bukti nota.');
    // 10. stok kritis
    var low = prods.filter(function (p) { return p.stock <= (typeof p.minStock === 'number' ? p.minStock : 5); });
    if (low.length) add('warn', low.length + ' produk stoknya menipis', low.slice(0, 4).map(function (p) { return esc(p.name) + ' (' + p.stock + ')'; }).join(', ') + (low.length > 4 ? ', dan lainnya' : '') + '.', 'Siapkan belanja ulang sebelum barang habis.');
    // 11. prive dan arus kas
    if (prive > 0 && prive > Math.max(laba, 0)) add('warn', 'Pengambilan pribadi (prive) melebihi laba', 'Prive bulan ini ' + rp(prive) + ' sedangkan laba bersih ' + rp(laba) + '.', 'Kurangi prive agar modal usaha tidak terkikis.');
    var kasNet = sum(cat(mtx, 'sales')) - hpp - beban - prive;
    if (kasNet < 0 && laba >= 0) add('warn', 'Kas bulan ini negatif ' + rp(kasNet), 'Uang keluar (termasuk prive) lebih besar dari uang masuk.', 'Tahan pengeluaran yang belum mendesak.');
    if (!out.f.length) add('good', 'Tidak ada hal yang perlu diwaspadai', 'Angka bulan ini terlihat sehat dan stabil.', null);
    out.f.sort(function (a, b) { var o = { warn: 0, info: 1, good: 2 }; return o[a.level] - o[b.level]; });
    return out;
  }

  function render() {
    if (!cfg) return;
    var box = document.getElementById(cfg.el); if (!box) return;
    var r; try { r = compute(); } catch (e) { box.innerHTML = '<p class="fm-sub">Analisa belum bisa dihitung. Muat ulang halaman.</p>'; return; }
    var col = { warn: '#f59e0b', good: '#34d399', info: '#60a5fa' }, tag = { warn: 'Perlu perhatian', good: 'Baik', info: 'Info' };
    var h = '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap"><div><p style="font-size:12px;opacity:.7;margin:2px 0 0">Dihitung dari transaksi toko ini, diperbarui setiap dibuka.</p></div>' +
      '<button type="button" data-an-refresh style="padding:7px 14px;border-radius:99px;border:1px solid rgba(148,163,184,.4);background:rgba(148,163,184,.12);color:inherit;font-size:12px;font-weight:700;cursor:pointer">Perbarui</button></div>';
    if (!r.enough) {
      h += '<p style="margin-top:14px;font-size:13px;opacity:.85">Data belum cukup. Analisa makin tajam setelah transaksi tercatat selama beberapa hari.</p>';
    } else {
      h += '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:14px 0">' +
        [['Pendapatan bulan ini', rp(r.stat.omzet)], ['Laba bersih', rp(r.stat.laba)], ['Margin bersih', r.stat.margin + '%']].map(function (x) {
          return '<div style="padding:10px;border-radius:14px;background:rgba(148,163,184,.12)"><div style="font-size:10.5px;opacity:.7">' + x[0] + '</div><div style="font-weight:800;font-size:14px;margin-top:2px">' + x[1] + '</div></div>';
        }).join('') + '</div>';
      h += r.f.map(function (f) {
        return '<div style="border-left:4px solid ' + col[f.level] + ';padding:8px 12px;margin-top:8px;border-radius:0 12px 12px 0;background:rgba(148,163,184,.08)">' +
          '<div style="font-size:10px;font-weight:800;color:' + col[f.level] + '">' + tag[f.level] + '</div>' +
          '<div style="font-weight:800;font-size:13.5px;margin-top:1px">' + f.title + '</div>' +
          '<div style="font-size:12px;opacity:.85;margin-top:2px;line-height:1.5">' + f.detail + '</div>' +
          (f.tip ? '<div style="font-size:12px;margin-top:4px;line-height:1.5"><b>Saran:</b> ' + f.tip + '</div>' : '') + '</div>';
      }).join('');
    }
    box.innerHTML = h;
    var b = box.querySelector('[data-an-refresh]'); if (b) b.onclick = render;
  }
  window.FM_ANALISA = { mount: function (c) { cfg = c; render(); }, render: render, compute: compute };
})();
