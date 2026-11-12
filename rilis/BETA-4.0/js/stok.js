/* Stok (Manager & Owner), bentuknya seperti COA: ada INDUK (mis. KAIN) dan JENIS di bawahnya (mis. Katun, Satin).
   1) Tab "Daftar Jenis": semua jenis stok diinput sekali di awal.
   2) Tab "Stok Masuk": saat barang datang tinggal pilih Induk lalu Jenis, isi jumlah.
   Setiap jenis disimpan sebagai produk toko (STORE) dengan field group/variant/unit, jadi ikut terbaca di Kasir. */
(function () {
  'use strict';
  var ov = null, tab = 'masuk', mode = 'tambah', selG = '', selC = '', note = '';
  var NONE = '__none';
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function can(k) { try { return !(window.FM_PLANS && FM_PLANS.has) || FM_PLANS.has(k); } catch (e) { return true; } }
  function canIn() { return can('stok_input'); }
  function canCl() { return can('stok_closing'); }
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
      '<div class="sk-tabs"><button type="button" class="sk-chip on" data-tab="masuk">Stok Masuk</button><button type="button" class="sk-chip" data-tab="jenis">Daftar Jenis Stok</button><button type="button" class="sk-chip" data-tab="closing">Sisa Stok &amp; Closing</button></div>' +
      '<div class="sk-body" id="sk-body"></div><div class="sk-msg" id="sk-msg"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    ov.querySelector('[data-x]').onclick = close;
    [].forEach.call(ov.querySelectorAll('[data-tab]'), function (b) {
      b.onclick = function () { tab = b.getAttribute('data-tab'); msg(''); [].forEach.call(ov.querySelectorAll('[data-tab]'), function (x) { x.classList.toggle('on', x === b); }); render(); };
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov && ov.style.display === 'flex' && !document.getElementById('fm-dlg')) close(); });
  }
  function fmt(n) { return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0)); }
  function rawNum(v) { return Number(String(v == null ? '' : v).replace(/[^0-9]/g, '')) || 0; }
  function money(id) {
    var e = document.getElementById(id); if (!e) return;
    e.addEventListener('input', function () { var d = e.value.replace(/[^0-9]/g, ''); e.value = d ? fmt(d) : ''; });
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
        return '<div class="sk-row"><div class="nm">' + esc(vLabel(p)) + ' <span class="cd">' + esc(p.code) + '</span></div><div class="cd" style="white-space:nowrap;text-align:right">' + (p.hpp ? 'Rp ' + fmt(p.hpp) + '/' + esc(unit(p)) + ' · nilai Rp ' + fmt(p.hpp * p.stock) : 'harga beli belum diisi') + '</div><div class="sk-st' + (low(p) ? ' low' : '') + '">' + p.stock + ' ' + esc(unit(p)) + '</div>' +
          (withDel || !canCl() ? '' : '<div style="width:96px" title="Sisa stok hasil hitung fisik (diisi manager tiap minggu)"><input data-end="' + esc(p.code) + '" type="number" min="0" step="1" inputmode="numeric" placeholder="sisa" value="' + (typeof p.endStock === 'number' ? p.endStock : '') + '" style="padding:6px 8px"></div>') +
          (withDel ? '<button type="button" class="sk-del" data-del="' + esc(p.code) + '">Hapus</button>' : '') + '</div>';
      }).join('');
    }).join('');
  }

  function render() { if (tab === 'jenis') renderJenis(); else if (tab === 'closing') renderClosing(); else renderMasuk(); }

  /* ---------- tab Stok Masuk ---------- */
  function saveEnd(i) {
    var q = prods().filter(function (x) { return x.code === i.getAttribute('data-end'); })[0]; if (!q) return;
    var v = i.value === '' ? null : Math.max(0, Math.floor(Number(i.value) || 0));
    Promise.resolve(STORE.saveProduct({ code: q.code, name: q.name, sellPrice: q.sellPrice, hpp: q.hpp, stock: q.stock, endStock: v, barcode: q.barcode, minStock: q.minStock, group: q.group, variant: q.variant, unit: q.unit })).then(function () { msg(v === null ? 'Sisa stok ' + q.name + ' dikosongkan.' : 'Sisa stok ' + q.name + ' tersimpan: ' + v + ' ' + unit(q) + '. Tekan Closing bila semua sudah diisi.'); });
  }
  function renderMasuk() {
    var box = document.getElementById('sk-body'), gs = groups();
    if (!canIn()) { box.innerHTML = gs.length ? '<div class="sk-info">Daftar stok, harga beli, dan nilainya. Input stok dilakukan oleh Manager.</div>' + listHtml(false) : '<div class="sk-empty">Belum ada jenis stok.</div>';
      if (canCl()) { [].forEach.call(box.querySelectorAll('[data-end]'), function (i) { i.onchange = function () { saveEnd(i); }; }); }
      return; }
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
      '<div><label>Harga beli per satuan (Rp)</label><input id="sk-h" type="text" inputmode="numeric" autocomplete="off" placeholder="0" value="' + (cur && cur.hpp ? fmt(cur.hpp) : '') + '"></div>' +
      '<div><label>Keterangan (opsional)</label><input id="sk-n" placeholder="mis. nota supplier" value="' + esc(note) + '"></div></div>' +
      '<div style="margin-bottom:6px"><button type="button" class="sk-go" id="sk-go">' + (mode === 'tambah' ? 'Tambah Stok' : 'Simpan Koreksi') + '</button></div>' +
      (canCl() ? '<div style="margin-top:10px;font-size:12px;font-weight:800;color:#475569">Stok saat ini dan <span style="color:#2f55d4">sisa stok mingguan</span> (isi kolom "sisa", otomatis tersimpan)</div>' : '<div style="margin-top:10px;font-size:12px;font-weight:800;color:#475569">Stok saat ini</div>') + listHtml(false) + '<div style="margin:12px 0 4px"><button type="button" class="sk-go" id="sk-tocl" style="background:#0f766e">Lanjut ke Closing Mingguan</button></div>';
    [].forEach.call(box.querySelectorAll('[data-end]'), function (i) { i.onchange = function () { saveEnd(i); }; });
    if (!canCl()) { var tc = box.querySelector('#sk-tocl'); if (tc && tc.parentNode) tc.parentNode.removeChild(tc.parentNode === box ? tc : tc); }
    if (box.querySelector('#sk-tocl')) box.querySelector('#sk-tocl').onclick = function () { tab = 'closing'; [].forEach.call(ov.querySelectorAll('[data-tab]'), function (x) { x.classList.toggle('on', x.getAttribute('data-tab') === 'closing'); }); render(); };
    [].forEach.call(box.querySelectorAll('[data-mode]'), function (b) { b.onclick = function () { mode = b.getAttribute('data-mode'); render(); }; });
    box.querySelector('#sk-g').onchange = function (e) { selG = e.target.value; selC = ''; renderMasuk(); };
    box.querySelector('#sk-c').onchange = function (e) { selC = e.target.value; renderMasuk(); };
    money('sk-h');
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
    if (mode === 'tambah') { if (n < 1) { msg('Jumlah masuk minimal 1.', true); return; } after = before + n; var hb = rawNum((document.getElementById('sk-h') || {}).value); job = (hb && hb !== (p.hpp || 0)) ? STORE.saveProduct({ code: p.code, name: p.name, sellPrice: p.sellPrice, hpp: hb, stock: after, barcode: p.barcode, minStock: p.minStock, group: p.group, variant: p.variant, unit: p.unit }) : STORE.incrementStock(p.code, n); }
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
      '<div><label>Stok akhir (sisa)</label><input id="sj-e" type="number" min="0" step="1" inputmode="numeric" placeholder="boleh kosong"></div></div>' +
      '<div class="sk-grid"><div><label>Harga beli per satuan (Rp)</label><input id="sj-h" type="text" inputmode="numeric" placeholder="0" autocomplete="off"></div>' +
      '<div><label>Batas stok menipis</label><input id="sj-m" type="number" min="0" step="1" inputmode="numeric" value="5"></div></div>' +
      '<div style="margin-bottom:6px"><button type="button" class="sk-go" id="sj-go">Simpan Jenis</button></div>' + listHtml(true);
    money('sj-h');
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
    Promise.resolve(STORE.saveProduct({ code: code, name: name, sellPrice: 0, hpp: rawNum(v('sj-h')), stock: stock, openStock: stock, endStock: v('sj-e') === '' ? null : Math.max(0, Math.floor(Number(v('sj-e')) || 0)), barcode: '', minStock: v('sj-m'), group: g, variant: vr, unit: v('sj-u').trim() || 'pcs' })).then(function () {
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


  /* ---------- tab Closing Mingguan ---------- */
  function txAll() { try { return (typeof txList !== 'undefined' && txList) ? txList : []; } catch (e) { return []; } }
  function tsOf(t) { return t.timestamp || (t.dateISO ? Date.parse(t.dateISO) : 0) || 0; }
  function isBeli(t) { return t.category === 'cogs' && (String(t.accountCode) === '201' || /pembelian/i.test(t.accountName || '')); }
  function lastClosing() { try { return (STORE.getStockClosings() || [])[0] || null; } catch (e) { return null; } }
  function pembelian() {
    var lc = lastClosing(), since = lc ? lc.at : 0;
    return txAll().filter(function (t) { return isBeli(t) && tsOf(t) > since; }).reduce(function (a, t) { return a + (t.amount || 0); }, 0);
  }
  function calc() {
    var items = prods(), awal = 0, sisa = 0, ok = true;
    items.forEach(function (p) {
      var i = document.getElementById('cl-' + p.code), o = typeof p.openStock === 'number' ? p.openStock : p.stock;
      awal += o * (p.hpp || 0);
      if (!i || i.value === '') { ok = false; return; }
      sisa += Math.max(0, Math.floor(Number(i.value) || 0)) * (p.hpp || 0);
    });
    var beli = pembelian();
    return { awal: awal, beli: beli, sisa: sisa, hpp: awal + beli - sisa, ok: ok };
  }
  function renderClosing() {
    var box = document.getElementById('sk-body'), items = prods(), lc = lastClosing();
    if (!items.length) { box.innerHTML = '<div class="sk-empty">Belum ada jenis stok. Input dulu di tab <b>Daftar Jenis Stok</b>.</div>'; return; }
    var hist = (STORE.getStockClosings() || []).slice(0, 8);
    if (!canCl()) { box.innerHTML = '<div class="sk-info">Riwayat closing stok mingguan. Closing dilakukan oleh Manager.</div>' + (hist.length ? hist.map(function (h) { return '<div class="sk-row"><div class="nm">' + esc(h.label) + ' <span class="cd">oleh ' + esc(h.by || '-') + ' · awal Rp ' + fmt(h.nilaiAwal) + ' · beli Rp ' + fmt(h.pembelian) + ' · sisa Rp ' + fmt(h.nilaiSisa) + '</span></div><div class="sk-st">HPP Rp ' + fmt(h.hpp) + '</div></div>'; }).join('') : '<div class="sk-empty">Belum ada closing stok.</div>'); return; }
    box.innerHTML =
      '<div class="sk-info">Closing mingguan: isi <b>sisa stok</b> tiap jenis, lalu tekan Closing. Sisa stok jadi stok awal minggu depan.<br>HPP = stok awal + pembelian (akun COA Pembelian) − sisa stok.</div>' +
      '<div style="font-size:11.5px;color:#64748b;font-weight:700;margin-bottom:6px">Periode: ' + (lc ? 'sejak closing ' + esc(lc.label) : 'sejak awal pencatatan') + '</div>' +
      groups().map(function (g) {
        return '<div class="sk-gh"><span>' + esc(gLabel(g)) + '</span><span></span></div>' + ofGroup(g).map(function (p) {
          var o = typeof p.openStock === 'number' ? p.openStock : p.stock;
          return '<div class="sk-row"><div class="nm">' + esc(vLabel(p)) + ' <span class="cd">awal ' + o + ' ' + esc(unit(p)) + ' × Rp ' + fmt(p.hpp) + ' = Rp ' + fmt(o * (p.hpp || 0)) + '</span></div><div style="width:110px"><input id="cl-' + esc(p.code) + '" type="number" min="0" step="1" inputmode="numeric" placeholder="sisa" value="' + (typeof p.endStock === 'number' ? p.endStock : '') + '"></div></div>';
        }).join('');
      }).join('') +
      '<div id="cl-sum" style="margin:14px 0 8px;padding:12px 14px;border-radius:14px;background:rgba(47,85,212,.08);font-size:13px;font-weight:700;line-height:1.8"></div>' +
      '<div style="margin-bottom:8px"><button type="button" class="sk-go" id="cl-go">Closing Minggu Ini</button></div>' +
      (hist.length ? '<div style="margin-top:12px;font-size:12px;font-weight:800;color:#475569">Riwayat closing</div>' + hist.map(function (h) { return '<div class="sk-row"><div class="nm">' + esc(h.label) + ' <span class="cd">oleh ' + esc(h.by || '-') + '</span></div><div class="sk-st">HPP Rp ' + fmt(h.hpp) + '</div></div>'; }).join('') : '');
    function sum() {
      var c = calc(), el = document.getElementById('cl-sum'); if (!el) return;
      el.innerHTML = 'Stok awal: Rp ' + fmt(c.awal) + '<br>Pembelian (COA): Rp ' + fmt(c.beli) + '<br><b>Barang tersedia untuk dijual: Rp ' + fmt(c.awal + c.beli) + '</b><br>Stok akhir (sisa): Rp ' + fmt(c.sisa) + (c.ok ? '' : ' <span style="color:#be123c">(isi semua sisa stok)</span>') + '<br><span style="font-size:15px;font-weight:900">HPP (barang terpakai untuk dijual): Rp ' + fmt(c.hpp) + '</span>';
    }
    [].forEach.call(box.querySelectorAll('input[id^="cl-"]'), function (i) { if (i.id !== 'cl-sum') i.oninput = sum; });
    sum();
    box.querySelector('#cl-go').onclick = doClosing;
  }
  function doClosing() {
    var items = prods(), c = calc();
    if (!c.ok) { msg('Isi sisa stok semua jenis dulu.', true); return; }
    var ask = window.fmAsk ? window.fmAsk('Closing stok sekarang?\n\nHPP minggu ini: Rp ' + fmt(c.hpp) + '\nSisa stok jadi stok awal minggu depan. Aksi ini tidak bisa dibatalkan.', { ok: 'Ya, Closing', judul: 'Closing Mingguan' }) : Promise.resolve(confirm('Closing stok sekarang?'));
    Promise.resolve(ask).then(function (yes) {
      if (!yes) return;
      var now = new Date(), pad = function (n) { return String(n).padStart(2, '0'); };
      var BL = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      var rec = { id: 'sc_' + now.getTime(), at: now.getTime(), dateISO: now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()), label: now.getDate() + ' ' + BL[now.getMonth()] + ' ' + now.getFullYear() + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()), by: '', nilaiAwal: c.awal, pembelian: c.beli, nilaiSisa: c.sisa, hpp: c.hpp, rows: [] };
      try { rec.by = (typeof user !== 'undefined' && user && user.title) || ''; } catch (e) {}
      var jobs = items.map(function (p) {
        var sisa = Math.max(0, Math.floor(Number(document.getElementById('cl-' + p.code).value) || 0));
        rec.rows.push({ code: p.code, name: p.name, group: p.group || '', variant: p.variant || '', unit: unit(p), awal: typeof p.openStock === 'number' ? p.openStock : p.stock, sisa: sisa, hb: p.hpp || 0 });
        return STORE.saveProduct({ code: p.code, name: p.name, sellPrice: p.sellPrice, hpp: p.hpp, stock: sisa, openStock: sisa, endStock: null, barcode: p.barcode, minStock: p.minStock, group: p.group, variant: p.variant, unit: p.unit });
      });
      return Promise.all(jobs).then(function () { return STORE.addStockClosing(rec); }).then(function () {
        audit('CLOSING_STOK', 'Closing stok mingguan, HPP Rp ' + fmt(c.hpp), 'Pembelian Rp ' + fmt(c.beli), 'Sisa Rp ' + fmt(c.sisa));
        renderClosing(); msg('Closing tersimpan. HPP Rp ' + fmt(c.hpp) + ' masuk ke Laba Rugi.'); refreshOthers();
        try { if (window.FM_LR && FM_LR.refresh) FM_LR.refresh(); } catch (e) {}
      });
    }).catch(function () { msg('Closing gagal disimpan. Periksa koneksi lalu coba lagi.', true); });
  }

  window.FM_STOK = {
    open: function (t) {
      build(); msg('');
      tab = t === 'jenis' ? 'jenis' : t === 'closing' ? 'closing' : 'masuk';
      if (tab === 'jenis' && !canIn()) tab = 'masuk';
      [].forEach.call(ov.querySelectorAll('[data-tab]'), function (x) {
        var k = x.getAttribute('data-tab');
        x.style.display = (k === 'jenis' && !canIn()) ? 'none' : '';
        if (k === 'closing') x.innerHTML = canCl() ? 'Sisa Stok &amp; Closing' : 'Riwayat Closing';
        if (k === 'masuk') x.innerHTML = canIn() ? 'Stok Masuk' : 'Stok';
        x.classList.toggle('on', k === tab);
      });
      ov.style.display = 'flex'; render();
    },
    close: close
  };
})();
