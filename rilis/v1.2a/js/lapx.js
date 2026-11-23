/* lapx.js — alat bersama untuk laporan tambahan Manager dan Owner (Penjelasan Laporan, Perubahan Modal, Penyusutan Aset,
   Perkiraan Stok Habis, Laporan Harian WhatsApp). Isinya hanya pembantu: jendela, format angka, periode, dan penjumlahan transaksi.
   Semua laporan HANYA membaca transaksi; tidak ada yang mengubah data transaksi. */
(function () {
  'use strict';
  var PAGE = (location.pathname.split('/').pop() || '').toLowerCase();
  if (!/^(manager|dashboard)\.html$/.test(PAGE)) return;
  var MON = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var BTN = 'padding:7px 13px;border-radius:999px;border:1px solid #cbd5e1;background:#f1f5f9;color:#0f172a;font-size:12px;font-weight:800;cursor:pointer';
  var VIO = ';background:#7c3aed;color:#ffffff;border-color:#7c3aed';
  var INP = 'box-sizing:border-box;padding:8px 10px;border-radius:10px;border:1px solid #cbd5e1;background:#f8fafc;color:#0f172a;font-size:12.5px;outline:none';

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rp(n) { return (n < 0 ? '-' : '') + 'Rp' + Math.abs(Math.round(n || 0)).toLocaleString('id-ID'); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function role() { return PAGE === 'manager.html' ? 'manager' : 'owner'; }
  function has(k) { try { return !window.FM_PLANS || FM_PLANS.has(k, role()); } catch (e) { return true; } }
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : 'default'; }
  function pct(a, b) { return b > 0 ? Math.round((a - b) / b * 100) : null; }

  /* transaksi: raw = semua usaha (dipakai Neraca), selain itu mengikuti pilihan usaha di layar utama */
  function txs(raw) {
    try { var l = (typeof txList !== 'undefined' && txList) ? txList : []; return (!raw && typeof fmV === 'function') ? fmV(l) : l; } catch (e) { return []; }
  }
  /* jumlahkan transaksi pada rentang tanggal [a, b] (YYYY-MM-DD). Aturan kategori sama dengan Neraca AI. */
  function sum(a, b, raw) {
    var r = { sales: 0, cogs: 0, exp: 0, prive: 0, n: 0, nSales: 0, byExp: {}, byPay: { tunai: 0, qris: 0, transfer: 0 }, prod: {}, keluar: 0 };
    txs(raw).forEach(function (t) {
      var d = t && t.dateISO || ''; if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < a || d > b) return;
      var v = Math.round(Number(t.amount) || 0); if (!(v > 0)) return;
      var c = t.category; r.n++;
      if (c === 'sales') {
        r.sales += v; r.nSales++; var pm = (t.pay === 'qris' || t.pay === 'transfer') ? t.pay : 'tunai'; r.byPay[pm] += v;
        if (t.isProduct) { var k = t.accountCode || t.accountName || '?'; var o = r.prod[k] = r.prod[k] || { name: t.accountName || k, qty: 0, amt: 0 }; o.qty += (Number(t.qty) > 0 ? Number(t.qty) : 1); o.amt += v; }
      } else if (c === 'modal') {
        r.modal = (r.modal || 0) + v;
      } else {
        if (c === 'prive') r.prive += v; else if (c === 'cogs') r.cogs += v; else r.exp += v;
        if (c !== 'prive') { var nm = String(t.accountName || (c === 'cogs' ? 'Modal bahan' : 'Biaya lain')); r.byExp[nm] = (r.byExp[nm] || 0) + v; }
      }
    });
    r.laba = r.sales - r.cogs - r.exp; r.keluar = r.cogs + r.exp + r.prive; return r;
  }
  /* periode laporan: 'bulan' (bulan ini sampai hari ini), 'lalu' (bulan lalu penuh), 'tahun' (tahun ini sampai hari ini); prev = pembanding */
  function period(key) {
    var now = new Date(), y = now.getFullYear(), m = now.getMonth(), td = iso(now);
    function monthRange(yy, mm, upto) { var first = new Date(yy, mm, 1), last = new Date(yy, mm + 1, 0), a = iso(first), b = iso(last); if (upto && upto < b) b = upto; return { a: a, b: b, label: MON[first.getMonth()] + ' ' + first.getFullYear() }; }
    if (key === 'lalu') { var cur = monthRange(y, m - 1), pv = monthRange(y, m - 2); return { key: key, a: cur.a, b: cur.b, label: cur.label, prev: pv }; }
    if (key === 'tahun') {
      var ly = y - 1, ub = ly + '-' + pad(m + 1) + '-' + pad(Math.min(now.getDate(), new Date(ly, m + 1, 0).getDate()));
      return { key: key, a: y + '-01-01', b: td, label: 'tahun ' + y + ' (sampai hari ini)', prev: { a: ly + '-01-01', b: ub, label: 'periode yang sama tahun ' + ly } };
    }
    var c0 = monthRange(y, m, td), p0 = monthRange(y, m - 1), pb = new Date(y, m - 1, 1), pend = iso(new Date(pb.getFullYear(), pb.getMonth(), Math.min(now.getDate(), new Date(pb.getFullYear(), pb.getMonth() + 1, 0).getDate())));
    return { key: 'bulan', a: c0.a, b: c0.b, label: c0.label + ' (sampai hari ini)', prev: { a: p0.a, b: pend, label: p0.label + ' pada tanggal yang sama' } };
  }
  function periodTabs(cur) {
    return '<div style="display:flex;gap:6px;margin:12px 0 2px;flex-wrap:wrap">' + [['bulan', 'Bulan ini'], ['lalu', 'Bulan lalu'], ['tahun', 'Tahun ini']].map(function (x) { return '<button data-lx-per="' + x[0] + '" style="' + BTN + (cur === x[0] ? VIO : '') + '">' + x[1] + '</button>'; }).join('') + '</div>';
  }

  /* jendela: lx.open(id, {title, sub, body: function -> html, act: function(name, el), per: function(key)}) */
  var wins = {};
  function open(id, o) {
    var w = wins[id];
    if (!w) {
      var el = document.createElement('div'); el.id = 'fm-lx-' + id;
      el.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(15,23,42,.45);align-items:center;justify-content:center;padding:12px;' + S;
      w = wins[id] = { el: el, o: o };
      el.addEventListener('click', function (e) {
        if (e.target === el || e.target.hasAttribute('data-x')) { el.style.display = 'none'; return; }
        var p = e.target.closest('[data-lx-per]'); if (p && w.o.per) { w.o.per(p.getAttribute('data-lx-per')); return render(id); }
        var a = e.target.closest('[data-lx]'); if (a && !a.disabled && w.o.act) { w.o.act(a.getAttribute('data-lx'), a); }
      });
      el.addEventListener('change', function (e) { if (w.o.change) w.o.change(e.target); });
      document.body.appendChild(el);
    }
    w.o = o; w.el.style.display = 'flex'; render(id); return w;
  }
  function render(id) {
    var w = wins[id]; if (!w || w.el.style.display === 'none') return;
    var o = w.o, top = w.el.firstChild && w.el.firstChild.scrollTop || 0, html;
    try { html = o.body(); } catch (e) { html = '<p style="opacity:.75;font-size:13px">Laporan belum bisa dihitung. Muat ulang halaman.</p>'; if (window.console) console.warn('lapx', id, e); }
    w.el.innerHTML = '<div style="width:100%;max-width:' + (o.width || 640) + 'px;max-height:92vh;overflow:auto;background:#ffffff;color:#0f172a;border:1px solid #e2e8f0;box-shadow:0 24px 60px rgba(15,23,42,.25);border-radius:24px;padding:18px;' + (document.documentElement.getAttribute('data-fm-native') === 'dark' ? 'filter:invert(1) hue-rotate(180deg);' : '') + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><div style="font-weight:900;font-size:18px">' + esc(o.title) + '</div>' + (o.sub ? '<div style="font-size:12px;opacity:.6">' + esc(o.sub) + '</div>' : '') + '</div><button data-x style="' + BTN + '">Tutup</button></div>' + html + '</div>';
    if (top && w.el.firstChild) w.el.firstChild.scrollTop = top;
  }
  function copy(text, done) {
    function ok() { if (done) done(true); }
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(ok, function () { fallback(); }); return; } } catch (e) {}
    fallback();
    function fallback() { try { var t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); ok(); } catch (e) { if (done) done(false); } }
  }
  function card(title, inner, sub) { return '<div style="padding:12px 14px;margin-top:12px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0"><div style="font-weight:800;font-size:13.5px">' + esc(title) + '</div>' + (sub ? '<div style="font-size:11.5px;opacity:.7;margin:2px 0 6px;line-height:1.5">' + sub + '</div>' : '') + inner + '</div>'; }

  window.FM_LAPX = { esc: esc, rp: rp, iso: iso, pad: pad, parse: parse, addDays: addDays, pct: pct, role: role, has: has, tid: tid, txs: txs, sum: sum, period: period, periodTabs: periodTabs,
    open: open, render: render, copy: copy, card: card, MON: MON, BTN: BTN, VIO: VIO, INP: INP, S: S };
})();
