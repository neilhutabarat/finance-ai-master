/* billing.js — ESTIMASI biaya layanan per detik (bukan tagihan, bukan pascabayar).
   Data disimpan di Firestore: tenant_ctrl/<ID>.billing  (ditulis Tower, dibaca halaman toko)
   {
     base, modePrice, disc, tier,        // rincian terakhir (sebelum PPN)
     a,                                  // total per siklus termasuk PPN 12% (angka terakhir)
     segs: [{ f: ms, a: total }],        // riwayat tarif (supaya ganti paket di tengah siklus tetap akurat)
     startMs, graceDays, autoFreeze, installMonths, paidCount
   }
   Siklus mengikuti tanggal & jam mulai (WIB). Jatuh tempo tiap bulan di tanggal/jam yang sama
   (bulan lebih pendek memakai tanggal terakhir bulan itu). Meter tiap siklus mulai dari 0.
   Dipakai oleh: provider.html (panel & tabel), manager.html + dashboard.html (kartu), kasir/manager/dashboard (pembekuan otomatis). */
(function () {
  'use strict';
  var WIB = 7 * 3600000, DAY = 86400000, PPN = 1.12;

  function wall(ms) { var d = new Date(ms + WIB); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds() }; }
  function dim(y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }
  function dueAt(startMs, k) {
    var w = wall(startMs), tm = w.m + k, y = w.y + Math.floor(tm / 12), m = ((tm % 12) + 12) % 12;
    return Date.UTC(y, m, Math.min(w.d, dim(y, m)), w.h, w.mi, w.s) - WIB;
  }
  function cycle(startMs, t) {
    if (t < startMs) return { k: -1, S: startMs, E: startMs };
    var a = wall(startMs), b = wall(t), k = Math.max(0, (b.y - a.y) * 12 + (b.m - a.m));
    while (k > 0 && dueAt(startMs, k) > t) k--;
    while (dueAt(startMs, k + 1) <= t) k++;
    return { k: k, S: dueAt(startMs, k), E: dueAt(startMs, k + 1) };
  }
  function segs(b) { return (b && b.segs ? b.segs.slice() : []).sort(function (x, y) { return x.f - y.f; }); }
  function curA(b, t) {
    var s = segs(b), a = s.length ? s[0].a : 0;
    for (var i = 0; i < s.length; i++) if (s[i].f <= t) a = s[i].a;
    return a || 0;
  }
  function ok(b) { return !!(b && b.startMs && segs(b).length); }
  /* nilai meter (Rp, boleh desimal) pada waktu t */
  function meter(b, t) {
    if (!ok(b) || t < b.startMs) return 0;
    var c = cycle(b.startMs, t), s = segs(b), len = c.E - c.S, sum = 0;
    for (var i = 0; i < s.length; i++) {
      var from = i === 0 ? c.S : Math.max(s[i].f, c.S);
      var to = Math.min(i + 1 < s.length ? s[i + 1].f : Infinity, t);
      if (to > from) sum += s[i].a * (to - from) / len;
    }
    return sum;
  }
  /* status pembayaran. paidCount dipisah dari meter: hanya diubah saat Tower menekan "Catat Pembayaran". */
  function status(b, t) {
    if (!ok(b)) return { state: 'none' };
    if (t < b.startMs) return { state: 'belum', E: b.startMs, k: -1 };
    var c = cycle(b.startMs, t), paid = b.paidCount || 0, grace = (typeof b.graceDays === 'number' ? b.graceDays : 3) * DAY;
    var st = { k: c.k, S: c.S, E: c.E, paid: paid, state: 'lunas' };
    if (c.k > paid) {
      var from = dueAt(b.startMs, paid + 1);
      st.overdueFrom = from; st.graceEnd = from + grace;
      st.state = t <= st.graceEnd ? 'tempo' : 'lewat';
    }
    return st;
  }
  function freezeNow(b, t) {
    if (!ok(b) || b.autoFreeze === false || !(curA(b, t) > 0)) return false;
    return status(b, t).state === 'lewat';
  }
  /* warna: hijau -> kuning mendekati jatuh tempo, merah 3 hari terakhir */
  function color(b, t, light) {
    var c = cycle(b.startMs, t), r = c.E - t, l = light ? 33 : 58;
    if (r <= 3 * DAY || (status(b, t).state !== 'lunas')) return 'hsl(2,78%,' + (light ? 42 : 60) + '%)';
    var f = Math.min(1, Math.max(0, (t - c.S) / Math.max(1, (c.E - 3 * DAY) - c.S)));
    return 'hsl(' + Math.round(145 - 97 * f) + ',78%,' + l + '%)';
  }
  function fmt(n) { return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0); }
  function fmt0(n) { return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(n || 0)); }
  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function dateText(ms) {
    var w = wall(ms), p = function (x) { return String(x).padStart(2, '0'); };
    return w.d + ' ' + BLN[w.m] + ' ' + w.y + ', ' + p(w.h) + '.' + p(w.mi) + ' WIB';
  }
  /* input datetime-local (dianggap WIB) <-> ms */
  function toLocalInput(ms) { var w = wall(ms), p = function (x) { return String(x).padStart(2, '0'); }; return w.y + '-' + p(w.m + 1) + '-' + p(w.d) + 'T' + p(w.h) + ':' + p(w.mi); }
  function fromLocalInput(v) { var t = Date.parse(String(v) + ':00Z'); return isNaN(t) ? 0 : t - WIB; }
  /* total per siklus dari komponen */
  function cycleTotal(base, modePrice, disc, ppnOn) { return Math.round(((Number(base) || 0) + Math.max(0, (Number(modePrice) || 0) - (Number(disc) || 0))) * (ppnOn === false ? 1 : PPN) * 100) / 100; }

  window.FM_BILL = { meter: meter, status: status, cycle: cycle, dueAt: dueAt, curA: curA, ok: ok, freezeNow: freezeNow, color: color, fmt: fmt, fmt0: fmt0, dateText: dateText,
    toLocalInput: toLocalInput, fromLocalInput: fromLocalInput, cycleTotal: cycleTotal, PPN: PPN, DAY: DAY };

  /* ===== kartu di halaman klien (owner & manager) ===== */
  var p = (location.pathname || '').toLowerCase();
  if (!/manager|dashboard/.test(p)) return;
  var css = document.createElement('style');
  css.textContent = '@media(min-width:1024px){main>.grid.fm-has-bill{grid-template-columns:repeat(5,minmax(0,1fr))}}' +
    '@media(max-width:1023px){main>.grid.fm-has-bill>#fm-bill{grid-column:1/-1}}' +
    '#fm-bill .fm-bill-n{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:900;font-size:clamp(16px,1.7vw,25px);margin:4px 0;white-space:nowrap;font-variant-numeric:tabular-nums}' +
    '#fm-bill .fm-bill-l{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}' +
    '#fm-bill .fm-bill-d{font-size:11px;font-weight:600;opacity:.85}';
  document.head.appendChild(css);
  var timer = null, cur = null;
  function build() {
    var b = window.TENANT_CTRL && window.TENANT_CTRL.billing;
    var grid = document.querySelector('main > .grid');
    var el = document.getElementById('fm-bill');
    var show = ok(b) && curA(b, Date.now()) > 0 && grid;
    if (!show) { if (el) el.remove(); if (grid) grid.classList.remove('fm-has-bill'); cur = null; return; }
    cur = b;
    if (!el) {
      el = document.createElement('div'); el.id = 'fm-bill'; el.className = 'ios-glass p-5 flex flex-col justify-between';
      el.innerHTML = '<div class="flex items-center justify-between"><span class="fm-bill-l fm-keep" id="fm-bill-lab">Estimasi Biaya Layanan</span></div>' +
        '<h3 class="fm-bill-n fm-keep" id="fm-bill-n">Rp 0,00</h3><div class="fm-bill-d fm-keep" id="fm-bill-d"></div>';
      grid.appendChild(el); grid.classList.add('fm-has-bill');
    }
    tick();
  }
  function tick() {
    if (!cur) return;
    var el = document.getElementById('fm-bill-n'); if (!el) return;
    var t = Date.now(), light = document.documentElement.getAttribute('data-fm-invert') === '1';
    var col = color(cur, t, light), lab = document.getElementById('fm-bill-lab');
    if (lab) lab.style.color = light ? '#334155' : '#e2e8f0';
    el.textContent = 'Rp ' + fmt(meter(cur, t)); el.style.color = col;
    var d = document.getElementById('fm-bill-d'), c = cycle(cur.startMs, t);
    if (d) { d.textContent = t < cur.startMs ? 'Mulai ' + dateText(cur.startMs) : 'Tanggal pembayaran: ' + dateText(c.E); d.style.color = col; }
  }
  function start() {
    build();
    window.addEventListener('fm:ctrl', build);
    if (!timer) timer = setInterval(function () { if (!document.hidden) tick(); }, 200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
