/* tower-demo.js — Data Demo (hanya halaman Tower). Mengisi toko uji dengan transaksi contoh 45 hari agar bisa ditunjukkan ke calon klien,
   dan menghapusnya lagi. Semua catatan contoh diberi tanda demo:true sehingga yang asli tidak ikut terhapus. Toko Published ditolak. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;
  function H(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function DB() { return (typeof db !== 'undefined' && db) ? db : null; }
  function shops() { try { return Object.keys(TENANTS_CONFIG).map(function (k) { return TENANTS_CONFIG[k]; }).filter(function (t) { return t && t.id; }).sort(function (a, b) { return String(a.nama).localeCompare(String(b.nama)); }); } catch (e) { return []; } }
  var ov = null, busy = false, msg = '', sel = '';
  var B = 'padding:9px 14px;border-radius:12px;font-weight:800;font-size:12.5px;color:#fff;border:0;cursor:pointer;';
  var FALLBACK = [{ code: '101', name: 'Penjualan', category: 'sales' }, { code: '102', name: 'Jasa', category: 'sales' }, { code: '201', name: 'Pembelian Barang', category: 'cogs' }, { code: '301', name: 'Listrik & Air', category: 'expense' }, { code: '302', name: 'Transport', category: 'expense' }];
  function rnd(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function pick(a) { return a[rnd(0, a.length - 1)]; }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function gen(id, coa) {
    var sales = coa.filter(function (c) { return c.category === 'sales'; }), outs = coa.filter(function (c) { return c.category === 'cogs' || c.category === 'expense'; });
    if (!sales.length) sales = FALLBACK.filter(function (c) { return c.category === 'sales'; });
    if (!outs.length) outs = FALLBACK.filter(function (c) { return c.category !== 'sales'; });
    var list = [], now = new Date(), pays = ['tunai', 'tunai', 'tunai', 'qris', 'transfer'];
    for (var i = 44; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i), ds = iso(d), full = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), base = (d.getDay() === 0 || d.getDay() === 6) ? 1.4 : 1;
      var ns = Math.round(rnd(4, 9) * base), no = rnd(1, 3), k;
      for (k = 0; k < ns; k++) { var s = pick(sales), amt = rnd(8, 120) * 5000, q = rnd(1, 4); list.push({ date: full, dateISO: ds, dateFull: full, accountCode: s.code, accountName: s.name, category: 'sales', qty: q, unitPrice: Math.round(amt / q), amount: amt, tax12: 0, dpp: amt, desc: 'Contoh penjualan', staff: 'Demo', pay: pick(pays), time: String(rnd(8, 20)).padStart(2, '0') + ':' + String(rnd(0, 59)).padStart(2, '0'), isClosed: true, demo: true, timestamp: d.getTime() + k * 1000 }); }
      for (k = 0; k < no; k++) { var o = pick(outs), am = rnd(4, 60) * 5000; list.push({ date: full, dateISO: ds, dateFull: full, accountCode: o.code, accountName: o.name, category: o.category === 'cogs' ? 'cogs' : 'expense', qty: 1, unitPrice: am, amount: am, tax12: Math.round(am * 0.12), dpp: am - Math.round(am * 0.12), desc: 'Contoh pengeluaran', staff: 'Demo', pay: 'tunai', time: String(rnd(8, 18)).padStart(2, '0') + ':' + String(rnd(0, 59)).padStart(2, '0'), isClosed: true, demo: true, timestamp: d.getTime() + 50000 + k * 1000 }); }
    }
    return list;
  }
  function commit(ops) {
    var d = DB(), chunks = [], i; for (i = 0; i < ops.length; i += 400) chunks.push(ops.slice(i, i + 400));
    return chunks.reduce(function (p, ch) { return p.then(function () { var b = d.batch(); ch.forEach(function (o) { o(b); }); return b.commit(); }); }, Promise.resolve());
  }
  function isPublished(id) { return DB().collection('tower_lab').doc(id).get().then(function (s) { return !!(s.exists && s.data().published); }); }
  function say(t) { msg = t; render(); }
  function fill() {
    var d = DB(); if (!d || !sel || busy) return; var t = shops().filter(function (x) { return x.id === sel; })[0]; if (!t) return;
    busy = true; say('Memeriksa toko…');
    isPublished(sel).then(function (pub) {
      if (pub) { busy = false; return say(t.nama + ' sudah Published (diserahkan ke klien). Data demo ditolak agar data klien tidak tercampur.'); }
      if (!confirm('Isi ' + t.nama + ' [' + t.id + '] dengan sekitar 400 transaksi contoh (45 hari terakhir)?\n\nTiap catatan diberi tanda demo sehingga bisa dihapus lagi.')) { busy = false; return say(''); }
      return d.collection('tenant_settings').doc(sel).get().then(function (s) { var coa = (s.exists && Array.isArray(s.data().coa)) ? s.data().coa : []; var list = gen(sel, coa); say('Menulis ' + list.length + ' catatan…');
        return commit(list.map(function (x) { return function (b) { b.set(d.collection('tx_' + sel).doc(), x); }; })).then(function () { busy = false; say('Selesai: ' + list.length + ' transaksi contoh ditambahkan ke ' + t.nama + '. Muat ulang halaman toko untuk melihatnya.'); }); });
    }).catch(function (e) { busy = false; say('Gagal: ' + (e && e.message || e)); });
  }
  function wipe() {
    var d = DB(); if (!d || !sel || busy) return; var t = shops().filter(function (x) { return x.id === sel; })[0]; if (!t) return;
    if (!confirm('Hapus semua transaksi contoh (bertanda demo) di ' + t.nama + '? Transaksi asli tidak disentuh.')) return;
    busy = true; say('Mencari catatan demo…');
    d.collection('tx_' + sel).where('demo', '==', true).get().then(function (s) {
      var refs = []; s.forEach(function (x) { refs.push(x.ref); });
      if (!refs.length) { busy = false; return say('Tidak ada catatan demo di ' + t.nama + '.'); }
      return commit(refs.map(function (r) { return function (b) { b.delete(r); }; })).then(function () { busy = false; say(refs.length + ' catatan demo dihapus dari ' + t.nama + '.'); });
    }).catch(function (e) { busy = false; say('Gagal: ' + (e && e.message || e)); });
  }
  function render() {
    if (!ov || ov.style.display === 'none') return;
    var S = shops();
    ov.innerHTML = '<div style="width:100%;max-width:520px;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:18px;font-family:-apple-system,Segoe UI,sans-serif"><div style="display:flex;justify-content:space-between;gap:10px"><div><div style="font-weight:800;font-size:17px">Data Demo</div><div style="font-size:12px;opacity:.65">Transaksi contoh untuk presentasi ke calon klien.</div></div><button data-x style="' + B + 'background:#334155;padding:7px 12px">Tutup</button></div>' +
      '<label style="display:block;font-size:11.5px;font-weight:700;margin:14px 0 4px;opacity:.8">Toko (gunakan toko uji, bukan klien asli)</label><select id="dm-shop" style="width:100%;padding:9px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:#12131a;color:#f5f5f7;font-size:13px"><option value="">Pilih toko…</option>' + S.map(function (t) { return '<option value="' + H(t.id) + '"' + (sel === t.id ? ' selected' : '') + '>' + H(t.nama) + ' [' + H(t.id) + ']</option>'; }).join('') + '</select>' +
      '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button data-a="fill" style="' + B + 'background:#16a34a"' + (busy || !sel ? ' disabled' : '') + '>Isi data contoh</button><button data-a="wipe" style="' + B + 'background:#9f1239"' + (busy || !sel ? ' disabled' : '') + '>Hapus data contoh</button></div>' +
      (msg ? '<p style="margin:12px 0 0;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.07);font-size:12.5px">' + H(msg) + '</p>' : '') +
      '<p style="font-size:11px;opacity:.6;margin:12px 0 0">Memakai akun COA toko itu sendiri. Toko berstatus Published ditolak. Hapus data contoh sebelum toko diserahkan.</p></div>';
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-demo';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px';
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; } var b = e.target.closest('[data-a]'); if (b) (b.getAttribute('data-a') === 'fill' ? fill : wipe)(); });
    ov.addEventListener('change', function (e) { if (e.target.id === 'dm-shop') { sel = e.target.value; msg = ''; render(); } });
    document.body.appendChild(ov);
  }
  window.FM_DEMO = { open: function () { ensure(); msg = ''; ov.style.display = 'flex'; render(); }, _gen: gen };
})();
