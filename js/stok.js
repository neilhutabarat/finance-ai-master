/* Stok (Manager & Owner), bentuknya seperti COA: ada INDUK (mis. KAIN) dan JENIS di bawahnya (mis. Katun, Satin).
   1) Tab "Daftar Jenis": semua jenis stok diinput sekali di awal.
   2) Tab "Stok Masuk": saat barang datang tinggal pilih Induk lalu Jenis, isi jumlah.
   Setiap jenis disimpan sebagai produk toko (STORE) dengan field group/variant/unit, jadi ikut terbaca di Kasir. */
(function () {
  'use strict';
  var ov = null, tab = 'masuk', mode = 'tambah', selG = '', selC = '', note = '';
  var NONE = '__none';
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function prods() { try { return (window.STORE && STORE.getProducts()) || []; } catch (e) { return []; } }
  function gOf(p) { return p.group ? String(p.group) : ''; }
  function groups() {
    var seen = {}, out = [], none = false;
    prods().forEach(function (p) { var g = gOf(p); if (!g) { none = true; return; } var k = g.toLowerCase(); if (!seen[k]) { seen[k] = 1; out.push(g); } });
    out.sort(function (a, b) { return a.localeCompare(b); });
    if (none) out.push(NONE);
    return out;
  }
  function gLabel(g) { return g === NONE ? 'Lainnya (tanpa induk)' : g; }
  function ofGroup(g) { return prods().filter(function (p) { return g === NONE ? !gOf(p) : gOf(p).toLowerCase() === String(g).toLowerCase(); }); }
  function vLabel(p) { return p.variant || p.name; }
  function unit(p) { return p && p.unit ? p.unit : 'pcs'; }
  function low(p) { return p.stock <= (typeof p.minStock === 'number' ? p.minStock : 5); }

  var css = document.createElement('style');
  css.textContent =
    '#fm-stok{position:fixed;inset:0;z-index:2147482000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.4);font-family:Inter,system-ui,sans-serif}' +
    'html[data-fm-invert="1"] #fm-stok{filter:invert(1) hue-rotate(180deg)}' +
    '#fm-stok .sk-box{width:min(820px,100%);max-height:92vh;display:flex;flex-direction:column;border-radius:22px;background:rgba(255,255,255,.92);border:1px solid rgba(255,255,255,.7);box-shadow:0 24px 60px rgba(15,23,42,.35);color:#0f172a;overflow:hidden}' +
    '#fm-stok .sk-h{display:flex;align-items:center;gap:10px;padding:16px 20px 6px}#fm-stok .sk-h h3{margin:0;font-size:17px;font-weight:800;flex:1}' +
    '#fm-stok .sk-x{all:unset;cursor:pointer;width:32px;height:32px;border-radius:99px;background:rgba(148,163,184,.25);text-align:center;line-height:32px;font-size:15px}' +
    '#fm-stok .sk-tabs{display:flex;gap:8px;padding:6px 20px 10px;flex-wrap:wrap}' +
    '#fm-stok .sk-chip{all:unset;cursor:pointer;padding:7px 14px;border-radius:99px;font-size:12.5px;font-weight:700;background:rgba(148,163,184,.22);color:#334155}#fm-stok .sk-chip.on{background:#2f55d4;color:#fff}' +
    '#fm-stok .sk-body{overflow:auto;padding:0 20px 8px;flex:1;min-height:140px}' +
    '#fm-stok label{display:block;font-size:11.5px;font-weight:800;color:#334155;margin:0 0 4px}' +
    '#fm-stok input,#fm-stok select{box-sizing:border-box;width:100%;border:1px solid rgba(71,85,105,.3);background:rgba(255,255,255,.9);border-radius:12px;padding:9px 12px;font:600 13px Inter,system-ui,sans-serif;color:#0f172a;outline:none}#fm-stok input:focus,#fm-stok select:focus{border-color:#2f55d4}' +
    '#fm-stok .sk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:10px}' +
    '#fm-stok .sk-go{all:unset;cursor:pointer;display:inline-block;padding:10px 18px;border-radius:12px;background:#2f55d4;color:#fff;font-size:13px;font-weight:800;text-align:center}#fm-stok .sk-go:active{transform:scale(.97)}' +
    '#fm-stok .sk-del{all:unset;cursor:pointer;padding:6px 10px;border-radius:10px;background:rgba(225,29,72,.12);color:#be123c;font-size:12px;font-weight:800}' +
    '#fm-stok .sk-info{padding:8px 12px;border-radius:12px;background:rgba(47,85,212,.1);font-size:12.5px;font-weight:700;margin-bottom:10px}' +
    '#fm-stok .sk-gh{display:flex;justify-content:space-between;align-items:center;margin:14px 0 4px;padding:6px 10px;border-radius:10px;background:rgba(71,85,105,.12);font-size:12.5px;font-weight:800;text-transform:uppercase}' +
    '#fm-stok .sk-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-bottom:1px solid rgba(71,85,105,.15);font-size:13px}' +
    '#fm-stok .sk-row .nm{flex:1;min-width:0;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#fm-stok .sk-row .cd{font-size:11px;color:#64748b;font-weight:600}' +
    '#fm-stok .sk-st{font:800 14px "JetBrains Mono",ui-monospace,monospace;white-space:nowrap}#fm-stok .sk-st.low{color:#be123c}' +
    '#fm-stok .sk-msg{padding:8px 20px 14px;font-size:12.5px;font-weight:700;min-height:18px;color:#065f46}#fm-stok .sk-msg.err{color:#be123c}' +
    '#fm-stok .sk-empty{padding:24px 10px;text-align:center;color:#64748b;font-size:13px}#fm-stok .sk-opt{font-size:11px;color:#64748b;font-weight:600;margin:2px 0 8px}';
  (document.head || document.documentElement).appendChild(css);

  function build() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-stok';
    ov.innerHTML = '<div class="sk-box"><div class="sk-h"><h3>Stok</h3><button type="button" class="sk-x" data-x aria-label="Tutup">✕</button></div>' +
      '<div class="sk-tabs"><button type="button" class="sk-chip on" data-tab="masuk">Stok Masuk</button><button type="button" class="sk-chip" data-tab="jenis">Daftar Jenis Stok</button></div>' +
      '<div class="sk-body" id="sk-body"></div><div class="sk-msg" id="sk-msg"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    ov.querySelector('[data-x]').onclick = close;
    [].forEach.call(ov.querySelectorAll('[data-tab]'), function (b) {
      b.onclick = function () { tab = b.getAttribute('data-tab'); msg(''); [].forEach.call(ov.querySelectorAll('[data-tab]'), function (x) { x.classList.toggle('on', x === b); }); render(); };
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov && ov.style.display === 'flex' && !document.getElementById('fm-dlg')) close(); });
  }
  function msg(t, err) { var m = document.getElementById('sk-msg'); if (m) { m.textContent = t || ''; m.className = 'sk-msg' + (err ? ' err' : ''); } }
  function close() { if (ov) ov.style.display = 'none'; }
  function audit(a, d, b, c) { try { if (typeof recordAuditLog === 'function') recordAuditLog(a, d, b, c); } catch (e) {} }
  function refreshOthers() { try { if (typeof renderProductTable === 'function') renderProductTable(); } catch (e) {} }

  /* ---------- daftar stok per induk (dipakai kedua tab) ---------- */
  function listHtml(withDel) {
    var gs = groups(); if (!gs.length) return '';
    return gs.map(function (g) {
      var items = ofGroup(g), tot = items.reduce(function (a, p) { return a + p.stock; }, 0);
      return '<div class="sk-gh"><span>' + esc(gLabel(g)) + '</span><span>' + items.length + ' jenis</span></div>' + items.map(function (p) {
        return '<div class="sk-row"><div class="nm">' + esc(vLabel(p)) + ' <span class="cd">' + esc(p.code) + '</span></div><div class="sk-st' + (low(p) ? ' low' : '') + '">' + p.stock + ' ' + esc(unit(p)) + '</div>' +
          (withDel ? '<button type="button" class="sk-del" data-del="' + esc(p.code) + '">Hapus</button>' : '') + '</div>';
      }).join('');
    }).join('');
  }

  function render() { if (tab === 'jenis') renderJenis(); else renderMasuk(); }

  /* ---------- tab Stok Masuk ---------- */
  function renderMasuk() {
    var box = document.getElementById('sk-body'), gs = groups();
    if (!gs.length) { box.innerHTML = '<div class="sk-empty">Belum ada jenis stok.<br>Buka tab <b>Daftar Jenis Stok</b> dan input dulu (induk dan jenisnya), lalu kembali ke sini.</div>'; return; }
    if (gs.indexOf(selG) < 0) selG = gs[0];
    var items = ofGroup(selG);
    if (!items.some(function (p) { return p.code === selC; })) selC = items[0] ? items[0].code : '';
    var cur = items.filter(function (p) { return p.code === selC; })[0];
    box.innerHTML =
      '<div class="sk-tabs" style="padding:0 0 10px"><button type="button" class="sk-chip' + (mode === 'tambah' ? ' on' : '') + '" data-mode="tambah">Tambah stok</button><button type="button" class="sk-chip' + (mode === 'koreksi' ? ' on' : '') + '" data-mode="koreksi">Koreksi jumlah stok</button></div>' +
      '<div class="sk-grid"><div><label>Induk</label><select id="sk-g">' + gs.map(function (g) { return '<option value="' + esc(g) + '"' + (g === selG ? ' selected' : '') + '>' + esc(gLabel(g)) + '</option>'; }).join('') + '</select></div>' +
      '<div><label>Jenis</label><select id="sk-c">' + items.map(function (p) { return '<option value="' + esc(p.code) + '"' + (p.code === selC ? ' selected' : '') + '>' + esc(vLabel(p)) + ' (stok ' + p.stock + ' ' + esc(unit(p)) + ')</option>'; }).join('') + '</select></div>' +
      '<div><label>' + (mode === 'tambah' ? 'Jumlah masuk' : 'Jumlah stok yang benar') + (cur ? ' (' + esc(unit(cur)) + ')' : '') + '</label><input id="sk-q" type="number" min="' + (mode === 'tambah' ? 1 : 0) + '" step="1" inputmode="numeric" placeholder="0"></div>' +
      '<div><label>Keterangan (opsional)</label><input id="sk-n" placeholder="mis. nota supplier" value="' + esc(note) + '"></div></div>' +
      '<div style="margin-bottom:6px"><button type="button" class="sk-go" id="sk-go">' + (mode === 'tambah' ? 'Tambah Stok' : 'Simpan Koreksi') + '</button></div>' +
      '<div style="margin-top:10px;font-size:12px;font-weight:800;color:#475569">Stok saat ini</div>' + listHtml(false);
    [].forEach.call(box.querySelectorAll('[data-mode]'), function (b) { b.onclick = function () { mode = b.getAttribute('data-mode'); render(); }; });
    box.querySelector('#sk-g').onchange = function (e) { selG = e.target.value; selC = ''; renderMasuk(); };
    box.querySelector('#sk-c').onchange = function (e) { selC = e.target.value; };
    box.querySelector('#sk-n').oninput = function (e) { note = e.target.value; };
    box.querySelector('#sk-go').onclick = applyMasuk;
    box.querySelector('#sk-q').onkeydown = function (e) { if (e.key === 'Enter') applyMasuk(); };
  }

  function applyMasuk() {
    var p = prods().filter(function (x) { return x.code === selC; })[0];
    var inp = document.getElementById('sk-q');
    if (!p) { msg('Pilih jenis stoknya dulu.', true); return; }
    var n = Math.floor(Number(inp.value));
    if (inp.value === '' || !isFinite(n)) { msg('Isi jumlahnya dulu.', true); inp.focus(); return; }
    var before = p.stock, after, job;
    if (mode === 'tambah') { if (n < 1) { msg('Jumlah masuk minimal 1.', true); return; } after = before + n; job = STORE.incrementStock(p.code, n); }
    else { if (n < 0) { msg('Jumlah stok tidak boleh minus.', true); return; } after = n; job = STORE.saveProduct({ code: p.code, name: p.name, sellPrice: p.sellPrice, hpp: p.hpp, stock: n, barcode: p.barcode, minStock: p.minStock, group: p.group, variant: p.variant, unit: p.unit }); }
    Promise.resolve(job).then(function (ok) {
      if (ok === false) { msg('Gagal menyimpan stok. Periksa koneksi lalu coba lagi.', true); return; }
      var ket = note.trim();
      audit(mode === 'tambah' ? 'STOK_MASUK' : 'KOREKSI_STOK', (mode === 'tambah' ? 'Stok masuk ' : 'Koreksi stok ') + '[' + p.code + '] ' + p.name + (ket ? ' (' + ket + ')' : ''), 'Stok ' + before, 'Stok ' + after);
      renderMasuk(); msg((mode === 'tambah' ? 'Tersimpan: ' : 'Dikoreksi: ') + p.name + ' ' + before + ' → ' + after + ' ' + unit(p));
      refreshOthers();
    }).catch(function () { msg('Gagal menyimpan stok.', true); });
  }

  /* ---------- tab Daftar Jenis ---------- */
  function newCode(g) {
    var pre = String(g || 'STK').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'STK', all = prods().map(function (p) { return p.code; }), n = 1, c;
    do { c = pre + '-' + String(n++).padStart(3, '0'); } while (all.indexOf(c) >= 0);
    return c;
  }
  function renderJenis() {
    var box = document.getElementById('sk-body'), gs = groups().filter(function (g) { return g !== NONE; });
    box.innerHTML =
      '<div class="sk-info">Input sekali di awal: induk (mis. KAIN) lalu tiap jenisnya (mis. Katun, Satin). Saat stok masuk tinggal dipilih.</div>' +
      '<div class="sk-grid"><div><label>Induk</label><input id="sj-g" list="sj-gl" placeholder="mis. Kain" autocomplete="off"><datalist id="sj-gl">' + gs.map(function (g) { return '<option value="' + esc(g) + '">'; }).join('') + '</datalist></div>' +
      '<div><label>Jenis</label><input id="sj-v" placeholder="mis. Katun Jepang" autocomplete="off"></div>' +
      '<div><label>Satuan</label><input id="sj-u" value="pcs" placeholder="pcs / meter / roll" autocomplete="off"></div>' +
      '<div><label>Stok awal</label><input id="sj-s" type="number" min="0" step="1" inputmode="numeric" value="0"></div>' +
      '<div><label>Batas stok menipis</label><input id="sj-m" type="number" min="0" step="1" inputmode="numeric" value="5"></div></div>' +
      '<div class="sk-opt">Harga jual dan HPP (opsional, isi bila barang ini dijual di Kasir)</div>' +
      '<div class="sk-grid"><div><label>Harga jual (Rp)</label><input id="sj-p" type="number" min="0" inputmode="numeric" value="0"></div><div><label>HPP / modal (Rp)</label><input id="sj-h" type="number" min="0" inputmode="numeric" value="0"></div></div>' +
      '<div style="margin-bottom:6px"><button type="button" class="sk-go" id="sj-go">Simpan Jenis</button></div>' + listHtml(true);
    box.querySelector('#sj-go').onclick = saveJenis;
    box.querySelector('#sj-v').onkeydown = function (e) { if (e.key === 'Enter') saveJenis(); };
    [].forEach.call(box.querySelectorAll('[data-del]'), function (b) { b.onclick = function () { delJenis(b.getAttribute('data-del')); }; });
  }
  function v(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function saveJenis() {
    var g = v('sj-g').trim().replace(/\s+/g, ' '), vr = v('sj-v').trim().replace(/\s+/g, ' ');
    if (!g || !vr) { msg('Induk dan jenis wajib diisi.', true); return; }
    var ex = groups().filter(function (x) { return x !== NONE && x.toLowerCase() === g.toLowerCase(); })[0]; if (ex) g = ex;
    var name = g + ' - ' + vr;
    if (prods().some(function (p) { return String(p.name).toLowerCase() === name.toLowerCase(); })) { msg('Jenis "' + name + '" sudah ada.', true); return; }
    var code = newCode(g), stock = Math.max(0, Math.floor(Number(v('sj-s')) || 0));
    Promise.resolve(STORE.saveProduct({ code: code, name: name, sellPrice: Number(v('sj-p')) || 0, hpp: Number(v('sj-h')) || 0, stock: stock, barcode: '', minStock: v('sj-m'), group: g, variant: vr, unit: v('sj-u').trim() || 'pcs' })).then(function () {
      audit('TAMBAH_JENIS_STOK', 'Menambahkan jenis stok [' + code + '] ' + name, '-', 'Stok awal ' + stock);
      selG = g; msg('Tersimpan: ' + name + ' (' + code + ')'); renderJenis(); refreshOthers();
      var gi = document.getElementById('sj-g'); if (gi) { gi.value = g; document.getElementById('sj-v').focus(); }
    }).catch(function () { msg('Gagal menyimpan jenis stok.', true); });
  }
  function delJenis(code) {
    var p = prods().filter(function (x) { return x.code === code; })[0]; if (!p) return;
    var ask = window.fmAsk ? window.fmAsk('Hapus jenis stok [' + p.code + '] ' + p.name + '?\n\nSisa stok ' + p.stock + ' ' + unit(p) + ' ikut terhapus. Aksi ini dicatat ke audit.', { ok: 'Ya, Hapus', bahaya: true }) : Promise.resolve(confirm('Hapus ' + p.name + '?'));
    Promise.resolve(ask).then(function (yes) {
      if (!yes) return;
      return Promise.resolve(STORE.deleteProduct(code)).then(function () { audit('HAPUS_JENIS_STOK', 'Menghapus jenis stok [' + p.code + '] ' + p.name, 'Stok ' + p.stock, 'DIHAPUS'); msg('Dihapus: ' + p.name); renderJenis(); refreshOthers(); });
    });
  }

  window.FM_STOK = {
    open: function (t) {
      build(); msg('');
      tab = t === 'jenis' ? 'jenis' : 'masuk';
      [].forEach.call(ov.querySelectorAll('[data-tab]'), function (x) { x.classList.toggle('on', x.getAttribute('data-tab') === tab); });
      ov.style.display = 'flex'; render();
    },
    close: close
  };
})();
