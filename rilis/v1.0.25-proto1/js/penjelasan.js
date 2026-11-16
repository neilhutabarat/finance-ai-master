/* penjelasan.js — Penjelasan Laporan Keuangan (Manager dan Owner). Menyusun kalimat sederhana dari angka transaksi pada satu periode,
   dibandingkan dengan periode sebelumnya. Hitungan otomatis, bukan AI. Hanya membaca data. */
(function () {
  'use strict';
  var L = window.FM_LAPX; if (!L) return;
  var per = 'bulan', note = '';
  function up(n) { return n >= 0 ? 'naik' : 'turun'; }
  function build() {
    var P = L.period(per), c = L.sum(P.a, P.b), p = L.sum(P.prev.a, P.prev.b), out = [], rp = L.rp;
    if (!c.n) return { empty: true, P: P };
    var margin = c.sales > 0 ? Math.round(c.laba / c.sales * 100) : null, dS = L.pct(c.sales, p.sales);
    // 1. penjualan
    var s1 = 'Pada ' + P.label + ', penjualan tercatat ' + rp(c.sales) + ' dari ' + c.nSales + ' transaksi.';
    if (dS !== null) s1 += ' Ini ' + up(dS) + ' ' + Math.abs(dS) + '% dibanding ' + P.prev.label + ' (' + rp(p.sales) + ').';
    else if (p.sales === 0) s1 += ' Belum ada penjualan di ' + P.prev.label + ' sebagai pembanding.';
    out.push(['Penjualan', s1]);
    // 2. laba
    var s2 = 'Setelah modal bahan ' + rp(c.cogs) + ' dan biaya operasional ' + rp(c.exp) + ', ' + (c.laba >= 0 ? 'laba bersih ' + rp(c.laba) : 'usaha rugi ' + rp(-c.laba)) + (margin !== null ? ' (margin bersih ' + margin + '%)' : '') + '.';
    if (p.n) s2 += ' Pada ' + P.prev.label + ' hasilnya ' + (p.laba >= 0 ? 'laba ' : 'rugi ') + rp(Math.abs(p.laba)) + '.';
    out.push(['Laba atau rugi', s2]);
    // 3. penyebab perubahan
    if (p.n) {
      var dl = c.laba - p.laba, parts = [['penjualan', c.sales - p.sales, 1], ['modal bahan', c.cogs - p.cogs, -1], ['biaya operasional', c.exp - p.exp, -1]].map(function (x) { return { n: x[0], d: x[1], eff: x[1] * x[2] }; }).sort(function (a, b) { return Math.abs(b.eff) - Math.abs(a.eff); });
      var top = parts[0];
      if (Math.abs(dl) >= 1 && Math.abs(top.eff) >= 1) out.push(['Penyebab perubahan', 'Laba ' + up(dl) + ' ' + rp(Math.abs(dl)) + ' dibanding pembanding. Faktor terbesar: ' + top.n + ' ' + up(top.d) + ' ' + rp(Math.abs(top.d)) + (top.eff >= 0 ? ', yang menambah laba.' : ', yang mengurangi laba.')]);
      else out.push(['Penyebab perubahan', 'Laba hampir sama dengan pembanding.']);
    }
    // 4. biaya terbesar
    var ex = Object.keys(c.byExp).map(function (k) { return [k, c.byExp[k]]; }).sort(function (a, b) { return b[1] - a[1]; }), tot = ex.reduce(function (s, x) { return s + x[1]; }, 0);
    if (ex.length) out.push(['Pengeluaran terbesar', 'Pengeluaran terbesar: ' + ex.slice(0, 3).map(function (x) { return x[0] + ' ' + rp(x[1]) + ' (' + Math.round(x[1] / tot * 100) + '%)'; }).join(', ') + '. Total modal bahan dan biaya ' + rp(tot) + '.']);
    // 5. kas
    var net = c.sales - c.keluar;
    out.push(['Uang masuk dan keluar', 'Uang masuk ' + rp(c.sales) + ', uang keluar ' + rp(c.keluar) + (c.prive ? ' (termasuk prive ' + rp(c.prive) + ')' : '') + '. Selisihnya ' + (net >= 0 ? 'lebih ' + rp(net) : 'kurang ' + rp(-net)) + '.' + (net < 0 ? ' Uang keluar lebih besar dari uang masuk, perhatikan kas.' : '')]);
    // 6. piutang dan utang
    try { if (L.has('piutang') && window.FM_PIU && FM_PIU.totals) { var t = FM_PIU.totals(''); if (t && (t.piutang || t.utang)) out.push(['Piutang dan utang', 'Saat ini piutang (uang yang belum diterima) ' + rp(t.piutang || 0) + ' dan utang (yang harus dibayar) ' + rp(t.utang || 0) + '.']); } } catch (e) {}
    // 7. neraca
    try {
      if (window.FM_NAI && FM_NAI._calc) { FM_NAI._start && FM_NAI._start(); var nb = FM_NAI._calc(P.b), nl = FM_NAI._nl ? FM_NAI._nl() : null;
        if (nb && nl && nl.start && (nb.aset || nb.liab)) out.push(['Posisi neraca', 'Pada ' + P.b + ': aset ' + rp(nb.aset) + ', liabilitas ' + rp(nb.liab) + ', ekuitas ' + rp(nb.ek) + (Math.abs(nb.selisih || 0) >= 1 ? '. Neraca belum seimbang (selisih ' + rp(nb.selisih) + '), periksa data di menu Neraca.' : '. Neraca seimbang.') + ' Angka neraca mencakup semua usaha.']); }
    } catch (e) {}
    return { P: P, out: out, text: 'PENJELASAN LAPORAN KEUANGAN\n' + P.label + '\n\n' + out.map(function (x) { return x[0] + ': ' + x[1]; }).join('\n\n') + '\n\nDihitung dari transaksi yang tercatat di aplikasi.' };
  }
  var last = null;
  function body() {
    var r = last = build(), h = L.periodTabs(per);
    if (r.empty) return h + '<div style="padding:24px 6px;text-align:center;opacity:.75;font-size:13px">Belum ada transaksi pada ' + L.esc(r.P.label) + '.</div>';
    h += '<div style="font-size:11.5px;opacity:.65;margin:8px 0 0">' + L.esc(r.P.label) + ', dibanding ' + L.esc(r.P.prev.label) + '. Mengikuti pilihan usaha di layar utama.</div>';
    r.out.forEach(function (x) { h += '<div style="margin-top:12px"><div style="font-weight:800;font-size:12.5px;color:#c084fc">' + L.esc(x[0]) + '</div><div style="font-size:13px;line-height:1.6;margin-top:2px">' + L.esc(x[1]) + '</div></div>'; });
    h += '<div style="display:flex;gap:8px;margin-top:16px;align-items:center"><button data-lx="copy" style="' + L.BTN + L.VIO + '">Salin teks</button><span style="font-size:12px;color:#4ade80">' + L.esc(note) + '</span></div>' +
      '<div style="font-size:11px;opacity:.55;margin-top:10px;line-height:1.5">Penjelasan dibuat otomatis dari aturan hitung, bukan AI. Periksa angkanya sebelum dikirim ke pihak lain.</div>';
    return h;
  }
  function act(a) { if (a === 'copy' && last && last.text) L.copy(last.text, function (ok) { note = ok ? 'Tersalin.' : 'Gagal menyalin.'; L.render('penj'); setTimeout(function () { note = ''; L.render('penj'); }, 2200); }); }
  window.FM_PENJ = { open: function () { if (!L.has('penjelasan')) return; per = 'bulan'; note = ''; L.open('penj', { title: 'Penjelasan Laporan Keuangan', sub: 'Angka laporan dijelaskan dengan kalimat sederhana', body: body, act: act, per: function (k) { per = k; } }); }, _build: build, _per: function (k) { per = k; } };
})();
