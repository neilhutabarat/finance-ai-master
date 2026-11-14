/* neraca.js — Neraca sederhana (Aset = Utang + Modal). Saldo awal dan akun neraca diisi Manager di tenant_settings/<id>.neraca;
   Kas dihitung dari transaksi sejak tanggal mulai, Piutang/Utang dari modul Piutang & Utang, Persediaan dari stok x HPP. */
(function () {
  'use strict';
  var N = { start: '', kasAwal: 0, modalAwal: 0, items: [], byBiz: {} }, started = false, ov = null, asof = '', note = '', form = null;
  function role() { return window.FM_PLANS ? FM_PLANS.pageRole() : 'manager'; }
  function canEdit() { return role() === 'manager'; }
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : 'default'; }
  function hasDb() { return typeof db !== 'undefined' && db && tid() !== 'default'; }
  function lsKey() { return 'fm_neraca_' + tid(); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rp(n) { return (n < 0 ? '-' : '') + 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.abs(Math.round(n || 0))); }
  function iso(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function f(k) { try { return !!(window.FM_PLANS && FM_PLANS.has(k)); } catch (e) { return false; } }
  /* Toko banyak usaha: neraca ikut pilihan "Tampilkan usaha" di Manager/Owner. Saldo awal disimpan per usaha (byBiz). */
  function bv() { try { return (window.FM_BIZ && FM_BIZ.enabled()) ? (FM_BIZ.view() || '') : ''; } catch (e) { return ''; } }
  function txs() { try { var l = typeof txList !== 'undefined' ? txList : []; return (window.FM_BIZ && FM_BIZ.vf) ? FM_BIZ.vf(l) : l; } catch (e) { return []; } }
  function prods() { try { var l = STORE.getProducts(), v = bv(); return v ? l.filter(function (p) { return FM_BIZ.canon(p.biz) === v; }) : l; } catch (e) { return []; } }
  function norm(x) { x = x || {}; var bb = {}; if (x.byBiz && typeof x.byBiz === 'object') Object.keys(x.byBiz).forEach(function (k) { var o = x.byBiz[k] || {}; bb[k] = { kasAwal: Number(o.kasAwal) || 0, modalAwal: Number(o.modalAwal) || 0 }; });
    return { start: x.start || '', kasAwal: Number(x.kasAwal) || 0, modalAwal: Number(x.modalAwal) || 0, items: Array.isArray(x.items) ? x.items : [], byBiz: bb }; }
  /* saldo awal yang berlaku untuk tampilan sekarang: satu usaha, atau jumlah semua usaha + umum */
  function opening() {
    var v = bv(), bb = N.byBiz || {};
    if (v) { var o = bb[v] || {}; return { kas: o.kasAwal || 0, modal: o.modalAwal || 0 }; }
    var k = N.kasAwal, m = N.modalAwal; Object.keys(bb).forEach(function (n) { k += bb[n].kasAwal || 0; m += bb[n].modalAwal || 0; });
    return { kas: k, modal: m };
  }
  function editOpening() { var v = bv(), o = (N.byBiz || {})[v]; return v ? { kas: o ? o.kasAwal : 0, modal: o ? o.modalAwal : 0 } : { kas: N.kasAwal, modal: N.modalAwal }; }

  function start() {
    if (started) return; started = true;
    if (hasDb()) { try { db.collection('tenant_settings').doc(tid()).onSnapshot(function (s) { N = norm(s.exists ? s.data().neraca : null); render(); }, function () {}); } catch (e) {} }
    else { try { N = norm(JSON.parse(localStorage.getItem(lsKey()) || '{}')); } catch (e) {} }
    try { if (f('piutang') && window.FM_PIU && FM_PIU.start) FM_PIU.start(); } catch (e) {}
  }
  function persist() {
    if (hasDb()) return db.collection('tenant_settings').doc(tid()).set({ neraca: N, updatedAt: Date.now() }, { merge: true }).catch(function (e) { alert('Gagal menyimpan: ' + (e && e.message || e)); });
    try { localStorage.setItem(lsKey(), JSON.stringify(N)); } catch (e) {} render(); return Promise.resolve();
  }

  /* ---- hitungan ---- */
  function calc(day) {
    var s = N.start || '0000-00-00', sales = 0, cogs = 0, exp = 0, prive = 0;
    txs().forEach(function (t) {
      var d = t.dateISO || ''; if (d < s || d > day) return; var a = Number(t.amount) || 0;
      if (t.category === 'sales') sales += a; else if (t.category === 'cogs') cogs += a; else if (t.category === 'prive') prive += a; else exp += a;
    });
    var op = opening(), kas = op.kas + sales - cogs - exp - prive, laba = sales - cogs - exp;
    var tot = { piutang: 0, utang: 0 };
    try { if (f('piutang') && window.FM_PIU && FM_PIU.totals) tot = FM_PIU.totals(bv()); } catch (e) {}
    var persed = 0; if (f('stok')) prods().forEach(function (p) { persed += Math.max(0, Number(p.stock) || 0) * (Number(p.hpp) || 0); });
    var its = N.items.filter(function (i) { return !bv() || (i.biz || '') === bv(); });
    var asetItems = its.filter(function (i) { return i.type === 'aset'; }), utangItems = its.filter(function (i) { return i.type === 'utang'; }), modalItems = its.filter(function (i) { return i.type === 'modal'; });
    var sum = function (a) { return a.reduce(function (x, i) { return x + (Number(i.amount) || 0); }, 0); };
    var aset = kas + tot.piutang + persed + sum(asetItems), liab = tot.utang + sum(utangItems);
    var modalTambah = sum(modalItems), ekuitasDicatat = op.modal + modalTambah + laba - prive, plug = aset - liab - ekuitasDicatat;
    return { kas: kas, laba: laba, prive: prive, piutang: tot.piutang, utang: tot.utang, persed: persed, asetItems: asetItems, utangItems: utangItems, modalItems: modalItems,
      aset: aset, liab: liab, modalAwal: op.modal, modalTambah: modalTambah, plug: plug, ekuitas: aset - liab };
  }

  /* ---- tampilan ---- */
  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:13px;outline:none';
  var btn = 'padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12px;font-weight:700;cursor:pointer';
  var green = ';background:#22c55e;color:#04210f;border-color:#22c55e';
  function lab(t, el) { return '<div><label style="display:block;font-size:11.5px;font-weight:700;margin:0 0 4px;opacity:.8">' + t + '</label>' + el + '</div>'; }
  function row(n, v, opt) { opt = opt || {}; return '<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid rgba(255,255,255,.07);font-size:12.5px' + (opt.b ? ';font-weight:800' : '') + '"><span>' + n + (opt.del ? ' <button data-a="del" data-id="' + esc(opt.del) + '" style="' + btn + ';padding:1px 8px;font-size:10.5px">Hapus</button>' : '') + '</span><span>' + rp(v) + '</span></div>'; }
  function head(t) { return '<div style="font-weight:800;margin:14px 0 2px">' + t + '</div>'; }
  var TYPES = { aset: 'Aset (tanah, kendaraan, peralatan, dll.)', utang: 'Utang (pinjaman bank, utang lain)', modal: 'Tambahan modal dari pemilik' };
  function items(a, ed) { return a.map(function (i) { return row(esc(i.name), Number(i.amount) || 0, { del: ed ? i.id : '' }); }).join(''); }
  function text(day) {
    var c = calc(day), t = tn(), L = ['NERACA ' + ((t && t.nama) || 'Toko') + (bv() ? ' - ' + bv() : ''), 'Per ' + day, '', 'ASET', 'Kas: ' + rp(c.kas)];
    if (c.piutang) L.push('Piutang: ' + rp(c.piutang)); if (c.persed) L.push('Persediaan: ' + rp(c.persed));
    c.asetItems.forEach(function (i) { L.push(i.name + ': ' + rp(i.amount)); });
    L.push('Total aset: ' + rp(c.aset), '', 'UTANG'); if (c.utang) L.push('Utang usaha: ' + rp(c.utang));
    c.utangItems.forEach(function (i) { L.push(i.name + ': ' + rp(i.amount)); });
    L.push('Total utang: ' + rp(c.liab), '', 'MODAL (aset - utang): ' + rp(c.ekuitas), 'Laba berjalan: ' + rp(c.laba), 'Prive: ' + rp(c.prive));
    return L.join('\n');
  }
  function render() {
    if (!ov || ov.style.display === 'none') return;
    var ed = canEdit(), c = calc(asof);
    var h = '<div style="width:100%;max-width:760px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px">' +
      '<div style="display:flex;justify-content:space-between;gap:10px"><div><div style="font-weight:800;font-size:17px">Neraca' + (bv() ? ' - ' + esc(bv()) : (window.FM_BIZ && FM_BIZ.enabled() ? ' - Semua usaha' : '')) + '</div><div style="font-size:12px;opacity:.65">Gambaran harta, utang, dan modal toko.' + (ed ? '' : ' Tampilan baca saja.') + '</div></div><button data-x style="' + btn + '">Tutup</button></div>';
    if (note) h += '<p style="margin:10px 0;padding:10px 12px;border-radius:12px;background:rgba(34,197,94,.14);color:#86efac;font-size:12px">' + esc(note) + '</p>';
    if (form) { ov.innerHTML = h + formHtml() + '</div>'; return; }
    if (!N.start) h += '<p style="margin:12px 0;padding:10px 12px;border-radius:12px;background:rgba(245,158,11,.14);color:#fbbf24;font-size:12px">' + (ed ? 'Isi dulu tanggal mulai dan saldo awal di bawah agar Kas dan Modal akurat.' : 'Manager belum mengisi saldo awal.') + '</p>';
    h += '<div style="display:flex;gap:8px;align-items:end;margin:12px 0;flex-wrap:wrap"><div style="flex:1;min-width:170px">' + lab('Per tanggal', '<input id="nr-asof" type="date" value="' + asof + '" style="' + inp + '">') + '</div><button data-a="copy" style="' + btn + '">Salin teks</button></div>';
    h += head('Aset') + row('Kas &amp; rekening', c.kas) + (c.piutang ? row('Piutang usaha', c.piutang) : '') + (c.persed ? row('Persediaan (stok x HPP)', c.persed) : '') + items(c.asetItems, ed) + row('Total aset', c.aset, { b: 1 });
    h += head('Utang') + (c.utang ? row('Utang usaha', c.utang) : '') + items(c.utangItems, ed) + row('Total utang', c.liab, { b: 1 });
    h += head('Modal') + row('Modal awal', c.modalAwal) + items(c.modalItems, ed).replace(/Hapus/g, 'Hapus') + row('Laba berjalan sejak mulai', c.laba) + row('Prive (diambil pemilik)', -c.prive) +
      (Math.abs(c.plug) >= 1 ? row('Penyesuaian nilai', c.plug) : '') + row('Total modal (aset - utang)', c.ekuitas, { b: 1 });
    if (Math.abs(c.plug) >= 1) h += '<p style="font-size:11px;opacity:.65;margin:6px 0 0">Penyesuaian nilai muncul karena persediaan, piutang, dan utang berjalan belum dicatat sebagai transaksi, atau saldo awal belum lengkap.</p>';
    if (ed) {
      var eo = editOpening(); eo.tag = bv() ? ' - ' + esc(bv()) : (window.FM_BIZ && FM_BIZ.enabled() ? ' - tanpa usaha (Umum)' : '');
      h += head('Saldo awal') + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:6px">' +
        lab('Tanggal mulai pencatatan', '<input id="nr-start" type="date" value="' + esc(N.start) + '" style="' + inp + '">') +
        lab('Kas &amp; rekening saat mulai (Rp)' + eo.tag, '<input id="nr-kas" type="number" min="0" value="' + (eo.kas || '') + '" style="' + inp + '">') +
        lab('Modal awal pemilik (Rp)' + eo.tag, '<input id="nr-modal" type="number" min="0" value="' + (eo.modal || '') + '" style="' + inp + '">') + '</div>' +
        '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button data-a="saveopen" style="' + btn + green + '">Simpan saldo awal</button><button data-a="new" style="' + btn + '">Tambah aset / utang / modal</button></div>';
    }
    ov.innerHTML = h + '</div>';
  }
  function formHtml() {
    return '<div style="margin-top:14px;font-weight:800">Tambah akun neraca</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:10px">' +
      lab('Jenis', '<select id="nr-type" style="' + inp + '">' + Object.keys(TYPES).map(function (k) { return '<option value="' + k + '">' + TYPES[k] + '</option>'; }).join('') + '</select>') +
      lab('Nama', '<input id="nr-name" placeholder="mis. Mesin jahit, Pinjaman bank" style="' + inp + '">') +
      lab('Nilai (Rp)', '<input id="nr-amt" type="number" min="1" style="' + inp + '">') + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:12px"><button data-a="saveitem" style="' + btn + green + '">Simpan</button><button data-a="cancel" style="' + btn + '">Batal</button></div>';
  }
  function g(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  async function act(a, id) {
    note = '';
    if (a === 'new') { form = {}; render(); }
    else if (a === 'cancel') { form = null; render(); }
    else if (a === 'saveopen') { N.start = g('nr-start'); var kk = Math.max(0, Number(g('nr-kas')) || 0), mm = Math.max(0, Number(g('nr-modal')) || 0);
      if (bv()) { N.byBiz = N.byBiz || {}; N.byBiz[bv()] = { kasAwal: kk, modalAwal: mm }; } else { N.kasAwal = kk; N.modalAwal = mm; } note = 'Saldo awal disimpan.'; persist(); render(); }
    else if (a === 'saveitem') {
      var nm = g('nr-name').trim(), amt = Number(g('nr-amt')) || 0;
      if (!nm || amt < 1) { note = 'Nama dan nilai wajib diisi.'; form = null; return render(); }
      var ni = { id: 'n_' + Date.now(), type: g('nr-type'), name: nm, amount: amt }; if (bv()) ni.biz = bv(); N.items.push(ni); form = null; note = 'Akun neraca ditambahkan.'; persist(); render();
    } else if (a === 'del') {
      var it = N.items.filter(function (x) { return x.id === id; })[0];
      if (it && await (window.fmAsk ? fmAsk('Hapus "' + it.name + '"?') : confirm('Hapus?'))) { N.items = N.items.filter(function (x) { return x.id !== id; }); persist(); render(); }
    } else if (a === 'copy') {
      try { await navigator.clipboard.writeText(text(asof)); note = 'Neraca disalin, tinggal ditempel ke WhatsApp atau catatan.'; } catch (e) { note = 'Gagal menyalin.'; }
      render();
    }
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-neraca';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var b = e.target.closest('[data-a]'); if (b) act(b.getAttribute('data-a'), b.getAttribute('data-id'));
    });
    ov.addEventListener('change', function (e) { if (e.target.id === 'nr-asof' && e.target.value) { asof = e.target.value; note = ''; render(); } });
    document.body.appendChild(ov);
  }
  window.addEventListener('fm-biz-view', function () { render(); });
  window.FM_NERACA = { open: function () { ensure(); start(); asof = iso(); form = null; note = ''; ov.style.display = 'flex'; render(); setTimeout(render, 900); }, calc: calc, _set: function (x) { N = norm(x); } };
})();
