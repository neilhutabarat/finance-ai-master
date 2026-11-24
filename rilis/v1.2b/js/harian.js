/* harian.js — Laporan Harian WhatsApp (Manager dan Owner). Ringkasan satu hari: penjualan, uang masuk dan keluar, laba, produk terlaris.
   Bisa disalin atau dikirim lewat WhatsApp ke nomor yang diketik (disimpan di perangkat ini saja). Hanya membaca transaksi. */
(function () {
  'use strict';
  var L = window.FM_LAPX; if (!L) return;
  var day = '', note = '';
  function numKey() { return 'fm_harian_wa_' + L.tid(); }
  function getNum() { try { return localStorage.getItem(numKey()) || ''; } catch (e) { return ''; } }
  function setNum(v) { try { localStorage.setItem(numKey(), v); } catch (e) {} }
  function normNum(v) { var d = String(v || '').replace(/[^0-9]/g, ''); if (d.indexOf('0') === 0) d = '62' + d.slice(1); else if (d.indexOf('8') === 0) d = '62' + d; return d; }
  function name() { var t = null; try { t = typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) {} return (t && t.nama) || 'Toko'; }
  function build() {
    var d = day || L.iso(), c = L.sum(d, d), p = L.sum(L.addDays(d, -1), L.addDays(d, -1)), rp = L.rp, dS = L.pct(c.sales, p.sales);
    var top = Object.keys(c.prod).map(function (k) { return c.prod[k]; }).sort(function (a, b) { return b.qty - a.qty; }).slice(0, 3);
    var kotor = c.sales - c.cogs;
    var t = 'LAPORAN HARIAN - ' + name() + '\n' + d + '\n\n' + 'Penjualan: ' + rp(c.sales) + ' (' + c.nSales + ' transaksi)' + (dS !== null ? '\nDibanding kemarin: ' + (dS >= 0 ? 'naik ' : 'turun ') + Math.abs(dS) + '%' : '') +
      '\nTunai ' + rp(c.byPay.tunai) + ', QRIS ' + rp(c.byPay.qris) + ', Transfer ' + rp(c.byPay.transfer) +
      '\n\nModal bahan: ' + rp(c.cogs) + '\nLaba kotor: ' + rp(kotor) + '\nBiaya: ' + rp(c.exp) + '\nLaba bersih: ' + rp(c.laba) + (c.prive ? '\nPrive: ' + rp(c.prive) : '') +
      (top.length ? '\n\nTerlaris: ' + top.map(function (x) { return x.name + ' (' + x.qty + ')'; }).join(', ') : '') + '\n\nDari transaksi yang tercatat di aplikasi.';
    return { d: d, c: c, text: t, empty: !c.n };
  }
  var last = null;
  function body() {
    var r = last = build(), h = '<div style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap"><label style="font-size:12px;opacity:.8">Tanggal</label><input id="hr-day" type="date" value="' + L.esc(r.d) + '" style="' + L.INP + '"></div>';
    h += '<div style="font-size:11.5px;opacity:.65;margin-top:6px">Mengikuti pilihan usaha di layar utama.</div>';
    if (r.empty) return h + '<div style="padding:24px 6px;text-align:center;opacity:.75;font-size:13px">Belum ada transaksi pada tanggal ini.</div>';
    h += '<pre style="white-space:pre-wrap;font:12.5px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;background:#f8fafc;border-radius:14px;padding:12px 14px;margin:12px 0 0">' + L.esc(r.text) + '</pre>';
    h += '<label style="display:block;font-size:11.5px;opacity:.8;margin-top:12px">Nomor WhatsApp tujuan (mis. 0812xxxxxxx)<input id="hr-num" inputmode="numeric" value="' + L.esc(getNum()) + '" placeholder="08xxxxxxxxxx" style="' + L.INP + ';width:100%;margin-top:3px"></label>' +
      '<div style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap"><button data-lx="wa" style="' + L.BTN + ';background:#16a34a;color:#ffffff;border-color:#16a34a">Kirim lewat WhatsApp</button><button data-lx="copy" style="' + L.BTN + '">Salin teks</button><span style="font-size:12px;color:#b45309">' + L.esc(note) + '</span></div>' +
      '<div style="font-size:11px;opacity:.55;margin-top:10px;line-height:1.5">Nomor hanya disimpan di perangkat ini. Tombol WhatsApp membuka aplikasi WhatsApp dengan teks siap kirim; pengiriman tetap kamu tekan sendiri.</div>';
    return h;
  }
  function act(a) {
    if (!last) return;
    if (a === 'copy') L.copy(last.text, function (ok) { note = ok ? 'Tersalin.' : 'Gagal menyalin.'; L.render('harian'); });
    else if (a === 'wa') {
      var el = document.getElementById('hr-num'), n = normNum(el && el.value); if (el) setNum(el.value);
      if (n.length < 10) { note = 'Isi nomor WhatsApp yang benar.'; return L.render('harian'); }
      note = ''; window.open('https://wa.me/' + n + '?text=' + encodeURIComponent(last.text), '_blank', 'noopener');
    }
  }
  window.FM_HARIAN = { open: function () { if (!L.has('harian_wa')) return; day = ''; note = ''; L.open('harian', { title: 'Laporan Harian', sub: 'Ringkasan satu hari, siap dikirim lewat WhatsApp', body: body, act: act, change: function (t) { if (t.id === 'hr-day' && t.value) { day = t.value; note = ''; L.render('harian'); } } }); }, _build: build, _day: function (d) { day = d; } };
})();
