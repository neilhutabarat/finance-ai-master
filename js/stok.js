/* Form Stok Masuk (Manager & Owner): tambah stok barang yang datang, atau koreksi jumlah stok.
   Dibuka dari tombol "Tambah Stok" di halaman. Memakai STORE (store.js), sama seperti daftar produk. */
(function () {
  'use strict';
  var ov = null, mode = 'tambah', q = '', note = '';
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rp(n) { return 'Rp ' + (typeof formatThousandSeparator === 'function' ? formatThousandSeparator(Math.round(n || 0)) : Math.round(n || 0)); }
  function prods() { try { return (window.STORE && STORE.getProducts()) || []; } catch (e) { return []; } }

  var css = document.createElement('style');
  css.textContent =
    '#fm-stok{position:fixed;inset:0;z-index:2147482000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.4);font-family:Inter,system-ui,sans-serif}' +
    'html[data-fm-invert="1"] #fm-stok{filter:invert(1) hue-rotate(180deg)}' +
    '#fm-stok .sk-box{width:min(760px,100%);max-height:92vh;display:flex;flex-direction:column;border-radius:22px;background:rgba(255,255,255,.9);border:1px solid rgba(255,255,255,.7);box-shadow:0 24px 60px rgba(15,23,42,.35);color:#0f172a;overflow:hidden}' +
    '#fm-stok .sk-h{display:flex;align-items:center;gap:10px;padding:16px 20px 8px}#fm-stok .sk-h h3{margin:0;font-size:17px;font-weight:800;flex:1}' +
    '#fm-stok .sk-x{all:unset;cursor:pointer;width:32px;height:32px;border-radius:99px;background:rgba(148,163,184,.25);text-align:center;line-height:32px;font-size:15px}' +
    '#fm-stok .sk-bar{display:flex;gap:8px;flex-wrap:wrap;padding:4px 20px 10px}' +
    '#fm-stok .sk-mode{all:unset;cursor:pointer;padding:7px 14px;border-radius:99px;font-size:12.5px;font-weight:700;background:rgba(148,163,184,.22);color:#334155}#fm-stok .sk-mode.on{background:#2f55d4;color:#fff}' +
    '#fm-stok input{box-sizing:border-box;border:1px solid rgba(71,85,105,.3);background:rgba(255,255,255,.85);border-radius:12px;padding:9px 12px;font:600 13px Inter,system-ui,sans-serif;color:#0f172a;outline:none}#fm-stok input:focus{border-color:#2f55d4}' +
    '#fm-stok .sk-cari{flex:1;min-width:180px}#fm-stok .sk-note{flex:1;min-width:160px}' +
    '#fm-stok .sk-list{overflow:auto;padding:0 12px 6px;flex:1;min-height:120px}' +
    '#fm-stok .sk-row{display:flex;align-items:center;gap:10px;padding:9px 10px;border-bottom:1px solid rgba(71,85,105,.15)}' +
    '#fm-stok .sk-nm{flex:1;min-width:0}#fm-stok .sk-nm b{display:block;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#fm-stok .sk-nm span{font-size:11.5px;color:#475569}' +
    '#fm-stok .sk-st{width:74px;text-align:right;font:800 15px "JetBrains Mono",ui-monospace,monospace}#fm-stok .sk-st small{display:block;font:600 10.5px Inter,sans-serif;color:#64748b}' +
    '#fm-stok .sk-st.low{color:#be123c}#fm-stok .sk-q{width:96px;text-align:right}' +
    '#fm-stok .sk-go{all:unset;cursor:pointer;padding:9px 14px;border-radius:12px;background:#2f55d4;color:#fff;font-size:12.5px;font-weight:800;text-align:center;min-width:70px}#fm-stok .sk-go:active{transform:scale(.97)}' +
    '#fm-stok .sk-msg{padding:6px 20px 14px;font-size:12.5px;font-weight:700;min-height:18px;color:#065f46}#fm-stok .sk-msg.err{color:#be123c}' +
    '#fm-stok .sk-empty{padding:26px 10px;text-align:center;color:#64748b;font-size:13px}';
  (document.head || document.documentElement).appendChild(css);

  function build() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-stok';
    ov.innerHTML = '<div class="sk-box"><div class="sk-h"><h3>Stok Masuk</h3><button type="button" class="sk-x" data-x aria-label="Tutup">✕</button></div>' +
      '<div class="sk-bar"><button type="button" class="sk-mode on" data-mode="tambah">Tambah stok</button><button type="button" class="sk-mode" data-mode="koreksi">Koreksi jumlah stok</button>' +
      '<input class="sk-cari" id="sk-cari" placeholder="Cari / scan barcode" autocomplete="off"><input class="sk-note" id="sk-note" placeholder="Keterangan (opsional)" autocomplete="off"></div>' +
      '<div class="sk-list" id="sk-list"></div><div class="sk-msg" id="sk-msg"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    ov.querySelector('[data-x]').onclick = close;
    [].forEach.call(ov.querySelectorAll('[data-mode]'), function (b) {
      b.onclick = function () { mode = b.getAttribute('data-mode'); [].forEach.call(ov.querySelectorAll('[data-mode]'), function (x) { x.classList.toggle('on', x === b); }); render(); };
    });
    ov.querySelector('#sk-cari').oninput = function (e) { q = e.target.value; render(); };
    ov.querySelector('#sk-note').oninput = function (e) { note = e.target.value; };
    ov.querySelector('#sk-cari').onkeydown = function (e) {
      if (e.key !== 'Enter') return;
      var v = e.target.value.trim(); if (!v) return;
      var hit = window.STORE && STORE.findProductByCode ? STORE.findProductByCode(v) : null;
      if (hit) { var inp = ov.querySelector('input[data-q="' + hit.code.replace(/"/g, '\\"') + '"]'); if (inp) { inp.focus(); inp.select(); } }
    };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov && ov.style.display === 'flex') close(); });
  }
  function msg(t, err) { var m = document.getElementById('sk-msg'); if (m) { m.textContent = t || ''; m.className = 'sk-msg' + (err ? ' err' : ''); } }
  function close() { if (ov) ov.style.display = 'none'; }

  function render() {
    var box = document.getElementById('sk-list'); if (!box) return;
    var list = prods(), s = q.trim().toLowerCase();
    if (s) list = list.filter(function (p) { return (p.name + ' ' + p.code + ' ' + (p.barcode || '')).toLowerCase().indexOf(s) >= 0; });
    if (!prods().length) { box.innerHTML = '<div class="sk-empty">Belum ada produk. Tambahkan produk dulu lewat "Kelola COA &amp; Produk".</div>'; return; }
    if (!list.length) { box.innerHTML = '<div class="sk-empty">Produk tidak ditemukan.</div>'; return; }
    box.innerHTML = list.map(function (p) {
      var low = p.stock <= (typeof p.minStock === 'number' ? p.minStock : 5);
      return '<div class="sk-row"><div class="sk-nm"><b>' + esc(p.name) + '</b><span>[' + esc(p.code) + ']' + (p.barcode ? ' · ' + esc(p.barcode) : '') + ' · jual ' + rp(p.sellPrice) + '</span></div>' +
        '<div class="sk-st' + (low ? ' low' : '') + '">' + p.stock + '<small>stok' + (low ? ' menipis' : '') + '</small></div>' +
        '<input class="sk-q" type="number" min="' + (mode === 'tambah' ? 1 : 0) + '" step="1" inputmode="numeric" placeholder="' + (mode === 'tambah' ? 'Jumlah' : 'Jml baru') + '" data-q="' + esc(p.code) + '">' +
        '<button type="button" class="sk-go" data-go="' + esc(p.code) + '">' + (mode === 'tambah' ? 'Tambah' : 'Simpan') + '</button></div>';
    }).join('');
    [].forEach.call(box.querySelectorAll('[data-go]'), function (b) {
      b.onclick = function () { apply(b.getAttribute('data-go')); };
    });
    [].forEach.call(box.querySelectorAll('input[data-q]'), function (i) {
      i.onkeydown = function (e) { if (e.key === 'Enter') apply(i.getAttribute('data-q')); };
    });
  }

  function apply(code) {
    var inp = ov.querySelector('input[data-q="' + String(code).replace(/"/g, '\\"') + '"]');
    var p = prods().filter(function (x) { return x.code === code; })[0];
    if (!p || !inp) return;
    var n = Math.floor(Number(inp.value));
    if (inp.value === '' || !isFinite(n)) { msg('Isi jumlahnya dulu.', true); inp.focus(); return; }
    var before = p.stock, after, job;
    if (mode === 'tambah') {
      if (n < 1) { msg('Jumlah tambah stok minimal 1.', true); return; }
      after = before + n; job = STORE.incrementStock(code, n);
    } else {
      if (n < 0) { msg('Jumlah stok tidak boleh minus.', true); return; }
      after = n; job = STORE.saveProduct({ code: p.code, name: p.name, sellPrice: p.sellPrice, hpp: p.hpp, stock: n, barcode: p.barcode, minStock: p.minStock });
    }
    Promise.resolve(job).then(function (ok) {
      if (ok === false) { msg('Gagal menyimpan stok. Periksa koneksi lalu coba lagi.', true); return; }
      var ket = note.trim();
      try { if (typeof recordAuditLog === 'function') recordAuditLog(mode === 'tambah' ? 'STOK_MASUK' : 'KOREKSI_STOK', (mode === 'tambah' ? 'Stok masuk ' : 'Koreksi stok ') + '[' + p.code + '] ' + p.name + (ket ? ' (' + ket + ')' : ''), 'Stok ' + before, 'Stok ' + after); } catch (e) {}
      msg((mode === 'tambah' ? 'Stok ' : 'Stok dikoreksi: ') + p.name + ': ' + before + ' → ' + after);
      render();
      try { if (typeof renderProductTable === 'function') renderProductTable(); } catch (e) {}
    }).catch(function () { msg('Gagal menyimpan stok.', true); });
  }

  window.FM_STOK = {
    open: function () {
      build(); q = ''; msg('');
      var c = document.getElementById('sk-cari'); if (c) c.value = '';
      ov.style.display = 'flex'; render();
      setTimeout(function () { try { document.getElementById('sk-cari').focus(); } catch (e) {} }, 50);
    },
    close: close
  };
})();
