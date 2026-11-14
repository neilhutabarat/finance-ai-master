/* ledger.js — Buku Besar: pilih kode akun (COA) dan rentang tanggal, tampil seperti rekening koran
   (tanggal, keterangan, masuk, keluar, saldo berjalan). Hanya membaca data yang sudah ada di halaman. */
(function () {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rp(n) { return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n || 0)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dateOf(t) {
    if (t.dateISO && /^\d{4}-\d{2}-\d{2}/.test(t.dateISO)) return t.dateISO.slice(0, 10);
    var m = /(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/.exec(t.dateFull || t.date || '');
    if (m) return m[3] + '-' + pad(+m[2]) + '-' + pad(+m[1]);
    var ts = parseInt(String(t.id || '').replace(/\D/g, '').slice(-13), 10);
    if (ts > 1e12) return iso(new Date(ts));
    return '';
  }
  function show(d) { var p = d.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  var CSS = '.fml{font-size:12px}.fml *{box-sizing:border-box}.fml .r{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px}.fml input,.fml select{background:rgba(127,127,127,.16);color:inherit;border:1px solid rgba(127,127,127,.4);border-radius:10px;padding:6px 9px;font:inherit}.fml option{color:#111;background:#fff}.fml button{all:unset;cursor:pointer;border:1px solid rgba(127,127,127,.45);border-radius:999px;padding:4px 11px;font-weight:700}.fml button:hover{background:rgba(127,127,127,.2)}.fml .tb{max-height:42vh;overflow:auto;border:1px solid rgba(127,127,127,.35);border-radius:12px}.fml table{width:100%;border-collapse:collapse}.fml th{position:sticky;top:0;background:rgba(127,127,127,.28);text-align:left;padding:6px 8px;font-weight:800}.fml td{padding:5px 8px;border-top:1px solid rgba(127,127,127,.2)}.fml .n{text-align:right;white-space:nowrap;font-family:ui-monospace,Consolas,monospace}.fml .sm{opacity:.75}.fml tfoot td{font-weight:900;border-top:2px solid rgba(127,127,127,.5)}';
  function mount(container, coaList, txs) {
    container.className = 'fml';
    if (!document.getElementById('fml-css')) { var st = document.createElement('style'); st.id = 'fml-css'; st.textContent = CSS; document.head.appendChild(st); }
    var coa = {}; (coaList || []).forEach(function (c) { coa[c.code] = c; });
    var by = {}; (txs || []).forEach(function (t) { (by[t.accountCode] = by[t.accountCode] || []).push(t); });
    var codes = Object.keys(coa).sort(function (a, b) { return String(a).localeCompare(String(b), undefined, { numeric: true }); });
    Object.keys(by).forEach(function (k) { if (codes.indexOf(k) < 0) codes.push(k); });
    var first = codes.filter(function (c) { return (by[c] || []).length; })[0] || codes[0] || '';
    container.innerHTML = '<div style="position:relative;margin-bottom:8px"><input data-q placeholder="Cari kode / nama akun (COA), lalu pilih" style="width:100%" autocomplete="off"><div data-sug style="display:none;position:absolute;left:0;right:0;top:100%;z-index:5;max-height:30vh;overflow:auto;margin-top:4px;border:1px solid rgba(127,127,127,.45);border-radius:12px;background:rgba(255,255,255,.96);color:#0f172a;box-shadow:0 12px 24px -10px rgba(0,0,0,.4)"></div></div><div class="r" data-cur style="font-weight:800"></div>' +
      '<div class="r"><label class="sm">Dari</label><input type="date" data-from><label class="sm">Sampai</label><input type="date" data-to>' +
      '<button data-q1="today">Hari ini</button><button data-q1="month">Bulan ini</button><button data-q1="all">Semua</button></div>' +
      '<div data-out></div>';
    var sel = { value: first }, sug = container.querySelector('[data-sug]'), cur = container.querySelector('[data-cur]'), q = container.querySelector('[data-q]'), f = container.querySelector('[data-from]'), t = container.querySelector('[data-to]'), out = container.querySelector('[data-out]');
    function label(c) { return '[' + c + '] ' + ((coa[c] && coa[c].name) || c) + ' (' + ((by[c] || []).length) + ' transaksi)'; }
    function fill() {
      var w = q.value.trim().toLowerCase();
      var list = codes.filter(function (c) { return !w || (String(c) + ' ' + ((coa[c] && coa[c].name) || '')).toLowerCase().indexOf(w) >= 0; });
      sug.innerHTML = list.map(function (c) { return '<div data-c="' + esc(c) + '" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(127,127,127,.2)">' + esc(label(c)) + '</div>'; }).join('') || '<div style="padding:10px 12px;opacity:.7">Akun tidak ditemukan</div>';
      sug.style.display = 'block';
    }
    sug.onmousedown = function (e) { var d = e.target.closest('[data-c]'); if (!d) return; e.preventDefault(); sel.value = d.getAttribute('data-c'); q.value = ''; sug.style.display = 'none'; cur.textContent = 'Akun: ' + label(sel.value); draw(); };
    q.onfocus = fill; q.onblur = function () { setTimeout(function () { sug.style.display = 'none'; }, 150); };
    function draw() {
      var code = sel.value, c = coa[code] || {}, out_ = (c.category === 'cogs' || c.category === 'expense');
      var rows = (by[code] || []).map(function (x) { return { d: dateOf(x), x: x }; }).sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : String(a.x.id || '').localeCompare(String(b.x.id || '')); });
      var from = f.value, to = t.value, bal = 0, tin = 0, tout = 0, h = '';
      rows.forEach(function (r) { if (from && r.d && r.d < from) bal += out_ ? -r.x.amount : r.x.amount; });
      if (from) h += '<tr><td>' + esc(show(from)) + '</td><td class="sm">Saldo awal</td><td></td><td></td><td class="n">' + rp(bal) + '</td></tr>';
      var n = 0;
      rows.forEach(function (r) {
        if (from && r.d && r.d < from) return; if (to && r.d && r.d > to) return;
        var a = Number(r.x.amount) || 0; n++;
        if (out_) { tout += a; bal -= a; } else { tin += a; bal += a; }
        h += '<tr><td>' + esc(r.d ? show(r.d) : '-') + '</td><td>' + esc(r.x.desc || r.x.description || c.name || '') + ((window.FM_BIZ && FM_BIZ.tag) ? FM_BIZ.tag(r.x) : '') + '</td><td class="n">' + (out_ ? '' : rp(a)) + '</td><td class="n">' + (out_ ? rp(a) : '') + '</td><td class="n">' + rp(bal) + '</td></tr>';
      });
      if (!n) h += '<tr><td colspan="5" class="sm" style="text-align:center;padding:16px">Belum ada mutasi pada akun dan tanggal ini.</td></tr>';
      out.innerHTML = '<div class="tb"><table><thead><tr><th>Tanggal</th><th>Keterangan</th><th class="n">Masuk</th><th class="n">Keluar</th><th class="n">Saldo</th></tr></thead><tbody>' + h + '</tbody><tfoot><tr><td colspan="2">[' + esc(code) + '] ' + esc(c.name || '') + ' · ' + n + ' transaksi</td><td class="n">' + rp(tin) + '</td><td class="n">' + rp(tout) + '</td><td class="n">' + rp(bal) + '</td></tr></tfoot></table></div>';
    }
    q.oninput = fill; f.onchange = draw; t.onchange = draw;
    container.querySelectorAll('[data-q1]').forEach(function (b) {
      b.onclick = function () { var k = b.getAttribute('data-q1'), d = new Date();
        if (k === 'today') { f.value = t.value = iso(d); } else if (k === 'month') { f.value = iso(new Date(d.getFullYear(), d.getMonth(), 1)); t.value = iso(d); } else { f.value = t.value = ''; }
        draw(); };
    });
    cur.textContent = 'Akun: ' + label(first); draw();
  }
  window.FM_LEDGER = { mount: mount };
})();
