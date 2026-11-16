/* stokhabis.js — Perkiraan Stok Habis (Manager dan Owner). Laju jual per hari dihitung dari penjualan produk 30 hari terakhir;
   perkiraan = stok sekarang / laju per hari. Hanya membaca stok dan transaksi. Perkiraan kasar: tidak mengenal musim atau promo. */
(function () {
  'use strict';
  var L = window.FM_LAPX; if (!L) return;
  var note = '', last = null;
  function compute() {
    var today = L.iso(), from = L.addDays(today, -29), s = L.sum(from, today), prods = (window.STORE && STORE.getProducts) ? STORE.getProducts() : [], rows = [], idle = 0;
    // hari pengamatan: sejak penjualan produk pertama di jendela, minimal 7 hari
    var first = null; L.txs().forEach(function (t) { if (t.category === 'sales' && t.isProduct && t.dateISO >= from && t.dateISO <= today && (!first || t.dateISO < first)) first = t.dateISO; });
    var span = first ? Math.max(7, Math.round((L.parse(today) - L.parse(first)) / 86400000) + 1) : 30;
    prods.forEach(function (p) {
      var o = s.prod[p.code] || s.prod[p.name]; var stock = Math.max(0, Number(p.stock) || 0);
      if (!o) { if (stock > 0) idle++; return; }
      var rate = o.qty / span, days = rate > 0 ? stock / rate : Infinity, need = Math.max(0, Math.ceil(rate * 14 - stock));
      rows.push({ name: p.name || p.code, stock: stock, rate: rate, days: days, need: need, sold: o.qty });
    });
    rows.sort(function (a, b) { return a.days - b.days; });
    return { rows: rows, idle: idle, span: span };
  }
  function lvl(d) { return d <= 3 ? ['Segera habis', '#fb7185'] : d <= 7 ? ['Minggu ini', '#fbbf24'] : d <= 14 ? ['Dua minggu', '#60a5fa'] : ['Aman', '#34d399']; }
  function body() {
    var r = last = compute(), h = '<div style="font-size:12px;opacity:.7;margin-top:8px;line-height:1.5">Dihitung dari penjualan produk ' + r.span + ' hari terakhir. Perkiraan kasar: tidak memperhitungkan musim atau promo.</div>';
    if (!r.rows.length) return h + '<div style="padding:24px 6px;text-align:center;opacity:.75;font-size:13px">Belum ada penjualan produk bertanda stok dalam 30 hari terakhir, jadi belum ada yang bisa diperkirakan.</div>';
    var urgent = r.rows.filter(function (x) { return x.days <= 7; }).length;
    h += '<div style="margin-top:10px;font-size:13px"><b>' + urgent + ' produk</b> diperkirakan habis dalam 7 hari.</div>';
    r.rows.slice(0, 40).forEach(function (x) {
      var l = lvl(x.days);
      h += '<div style="padding:10px 0;border-top:1px solid rgba(255,255,255,.08)"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:13px">' + L.esc(x.name) + '</b><span style="font-size:11px;font-weight:800;color:' + l[1] + '">' + l[0] + '</span></div>' +
        '<div style="font-size:12px;opacity:.8;margin-top:3px;line-height:1.55">Stok ' + x.stock + ' · terjual ±' + (x.rate >= 10 ? Math.round(x.rate) : x.rate.toFixed(1)) + ' per hari · habis sekitar ' + (x.stock === 0 ? '<b style="color:#fb7185">sekarang</b>' : Math.max(1, Math.round(x.days)) + ' hari lagi') + (x.need > 0 ? ' · saran beli <b>' + x.need + '</b> untuk 14 hari' : '') + '</div></div>';
    });
    if (r.rows.length > 40) h += '<div style="font-size:11.5px;opacity:.65;padding-top:8px">Menampilkan 40 produk yang paling cepat habis.</div>';
    if (r.idle) h += '<div style="font-size:11.5px;opacity:.65;margin-top:10px">' + r.idle + ' produk punya stok tapi tidak terjual 30 hari terakhir (tidak masuk daftar).</div>';
    h += '<div style="display:flex;gap:8px;margin-top:12px;align-items:center"><button data-lx="copy" style="' + L.BTN + L.VIO + '">Salin daftar belanja</button><span style="font-size:12px;color:#4ade80">' + L.esc(note) + '</span></div>';
    return h;
  }
  function act(a) {
    if (a !== 'copy' || !last) return;
    var t = 'DAFTAR BELANJA STOK (untuk 14 hari)\n' + L.iso() + '\n'; var any = 0;
    last.rows.filter(function (x) { return x.need > 0; }).forEach(function (x) { any++; t += '\n' + x.name + ': ' + x.need; });
    if (!any) t += '\nTidak ada produk yang perlu dibeli.';
    L.copy(t, function (ok) { note = ok ? 'Tersalin.' : 'Gagal menyalin.'; L.render('stokhabis'); setTimeout(function () { note = ''; L.render('stokhabis'); }, 2200); });
  }
  window.FM_STOKHABIS = { open: function () { if (!L.has('stok_habis')) return; note = ''; L.open('stokhabis', { title: 'Perkiraan Stok Habis', sub: 'Produk mana yang perlu dibeli lagi', body: body, act: act }); }, _compute: compute };
})();
