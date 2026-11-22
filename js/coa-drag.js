/* Pindah urutan akun COA dengan klik dan seret (mouse maupun sentuh) pada tabel #coa-table-body.
   Pegangan ".coa-h" di tiap baris; saat dilepas, urutan disimpan lewat STORE.reorderCOA. */
(function () {
  'use strict';
  var drag = null;
  function rowOf(el) { while (el && el.tagName !== 'TR') el = el.parentNode; return el; }
  document.addEventListener('pointerdown', function (e) {
    var h = e.target.closest && e.target.closest('.coa-h'); if (!h) return;
    var tr = rowOf(h); if (!tr || !tr.dataset.coa) return;
    e.preventDefault();
    drag = { tr: tr, code: tr.dataset.coa, over: null };
    tr.style.opacity = '.55'; h.style.cursor = 'grabbing';
    try { h.setPointerCapture(e.pointerId); } catch (x) {}
  });
  document.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var el = document.elementFromPoint(e.clientX, e.clientY), tr = rowOf(el);
    [].forEach.call(document.querySelectorAll('#coa-table-body tr'), function (r) { r.style.boxShadow = ''; });
    drag.over = null;
    if (tr && tr.dataset && tr.dataset.coa && tr.parentNode === drag.tr.parentNode && tr !== drag.tr) {
      drag.over = tr; tr.style.boxShadow = 'inset 0 3px 0 #2f55d4';
    }
  });
  function end() {
    if (!drag) return;
    var d = drag; drag = null;
    d.tr.style.opacity = '';
    [].forEach.call(document.querySelectorAll('#coa-table-body tr'), function (r) { r.style.boxShadow = ''; });
    if (d.over && window.STORE) {
      Promise.resolve(STORE.reorderCOA(d.code, d.over.dataset.coa)).then(function () { if (typeof renderCOATable === 'function') renderCOATable(); });
    }
  }
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);

  /* ---- Import COA dari Excel (.xls/.xlsx) atau CSV ---- */
  function mapCat(rawCat, name) {
    var c = String(rawCat || '').trim().toLowerCase(), n = String(name || '').trim().toLowerCase();
    if (/petty|kas kecil/.test(n) || /petty/.test(c)) return 'petty';
    if (/bank/.test(n) && (/aset|asset|kas|bank/.test(c) || !c)) return 'bank';
    if (/sales|penjualan|pendapatan|income|omzet/.test(c)) return 'sales';
    if (/cogs|hpp|harga pokok/.test(c)) return 'cogs';
    if (/expense|bop|biaya|beban|operasional/.test(c)) return 'expense';
    if (/prive/.test(c)) return 'prive';
    if (/modal|ekuitas|equity/.test(c)) return 'modal';
    if (/hutang|utang|kewajiban|liability/.test(c)) return 'hutang';
    if (/aset|asset|aktiva/.test(c)) return 'aset';
    return 'expense';
  }
  function parseCsv(text) {
    return String(text || '').split(/\r?\n/).map(function (ln) {
      var sep = ln.indexOf(';') >= 0 && ln.indexOf(',') < 0 ? ';' : ln.indexOf('\t') >= 0 ? '\t' : ',';
      return ln.split(sep).map(function (x) { return x.replace(/^["']|["']$/g, '').trim(); });
    });
  }
  function importRows(rows) {
    if (!rows || !rows.length || !window.STORE) return alert('File kosong atau STORE belum siap.');
    var out = [];
    rows.forEach(function (r) {
      if (!r || r.length < 2) return;
      var code = String(r[0] == null ? '' : r[0]).trim().replace(/\.0+$/, '');
      var name = String(r[1] == null ? '' : r[1]).trim();
      var catRaw = String(r[2] == null ? '' : r[2]).trim();
      if (!code || !name || /kode/i.test(code)) return;
      out.push({ code: code, name: name, category: mapCat(catRaw, name) });
    });
    if (!out.length) return alert('Tidak ada baris COA yang terbaca. Pastikan kolom: Kode Akun, Nama Akun, Kategori.');
    if (!confirm('Ditemukan ' + out.length + ' akun COA. Tambahkan / perbarui ke daftar COA toko ini?')) return;
    var cur = (STORE.getCOA && STORE.getCOA()) ? STORE.getCOA().slice() : [];
    out.forEach(function (it) {
      var idx = cur.findIndex(function (x) { return String(x.code) === String(it.code); });
      if (idx >= 0) cur[idx] = Object.assign({}, cur[idx], it);
      else cur.push(it);
    });
    Promise.resolve(STORE.saveCOA(cur)).then(function () {
      if (typeof renderCOATable === 'function') renderCOATable();
      alert('Berhasil mengimpor ' + out.length + ' akun COA.');
    }).catch(function (e) { alert('Gagal menyimpan COA: ' + (e && e.message || e)); });
  }
  function loadXlsx(cb) {
    if (window.XLSX) return cb();
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = cb; s.onerror = function () { alert('Gagal memuat pembaca Excel. Coba simpan sebagai CSV terlebih dahulu.'); };
    document.head.appendChild(s);
  }
  function mountImport() {
    var box = document.getElementById('popup-content-coa_mgmt');
    if (!box || document.getElementById('fm-coa-import-btn')) return;
    var saveBtn = box.querySelector('button[onclick*="saveNewCOAByManager"]');
    if (!saveBtn || !saveBtn.parentNode) return;
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.csv,.tsv,.txt,.xls,.xlsx'; inp.style.display = 'none';
    var btn = document.createElement('button'); btn.id = 'fm-coa-import-btn'; btn.type = 'button';
    btn.className = 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold py-2 px-3 rounded-xl text-xs transition active:scale-95 mr-2';
    btn.textContent = 'Import Excel / CSV';
    btn.onclick = function () { inp.value = ''; inp.click(); };
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      if (/\.xlsx?$/i.test(f.name)) {
        loadXlsx(function () {
          var fr = new FileReader();
          fr.onload = function (ev) {
            var wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
            var ws = wb.Sheets[wb.SheetNames[0]];
            importRows(XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }));
          };
          fr.readAsArrayBuffer(f);
        });
      } else {
        var fr = new FileReader();
        fr.onload = function (ev) { importRows(parseCsv(ev.target.result)); };
        fr.readAsText(f);
      }
    };
    saveBtn.parentNode.insertBefore(inp, saveBtn);
    saveBtn.parentNode.insertBefore(btn, saveBtn);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountImport); else mountImport();
  setTimeout(mountImport, 800);
})();
