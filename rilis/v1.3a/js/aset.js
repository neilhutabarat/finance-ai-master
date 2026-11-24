/* aset.js — Penyusutan Aset Tetap (Manager mengisi, Owner hanya melihat). Metode garis lurus:
   penyusutan per bulan = (harga - nilai sisa) / umur (bulan), dihitung per bulan penuh sejak tanggal beli.
   Data disimpan di tenant_settings/<id>.asetTetap. Daftar ini BERDIRI SENDIRI: belum otomatis masuk ke angka Neraca. */
(function () {
  'use strict';
  var L = window.FM_LAPX; if (!L) return;
  var items = [], started = false, asof = '', note = '', form = null;
  function canEdit() { return L.role() === 'manager'; }
  function hasDb() { return typeof db !== 'undefined' && db && L.tid() !== 'default'; }
  function lsKey() { return 'fm_aset_' + L.tid(); }
  function norm(a) { return (Array.isArray(a) ? a : []).map(function (x) { return { id: String(x.id || ''), name: String(x.name || '').slice(0, 60), cost: Math.max(0, Math.round(Number(x.cost) || 0)), date: String(x.date || ''), life: Math.max(1, Math.round(Number(x.life) || 1)), residu: Math.max(0, Math.round(Number(x.residu) || 0)) }; }).filter(function (x) { return x.id && x.name && x.cost > 0 && L.parse(x.date); }); }
  function start() {
    if (started) return; started = true;
    if (hasDb()) { try { db.collection('tenant_settings').doc(L.tid()).onSnapshot(function (s) { items = norm(s.exists ? (s.data() || {}).asetTetap : []); L.render('aset'); }, function () {}); } catch (e) {} }
    else { try { items = norm(JSON.parse(localStorage.getItem(lsKey()) || '[]')); } catch (e) {} }
  }
  function persist() {
    if (hasDb()) { L.render('aset'); return db.collection('tenant_settings').doc(L.tid()).set({ asetTetap: items, updatedAt: Date.now() }, { merge: true }).catch(function (e) { note = 'Gagal menyimpan: ' + (e && e.message || e); L.render('aset'); }); }
    try { localStorage.setItem(lsKey(), JSON.stringify(items)); } catch (e) {} L.render('aset'); return Promise.resolve();
  }
  /* bulan penuh sejak tanggal beli sampai tanggal acuan */
  function months(a, day) {
    var d1 = L.parse(a), d2 = L.parse(day); if (!d1 || !d2 || d2 < d1) return 0;
    var m = (d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth(); if (d2.getDate() < d1.getDate()) m--; return Math.max(0, m);
  }
  function calcOne(x, day) {
    var per = (x.cost - x.residu) / x.life, n = Math.min(x.life, months(x.date, day)), acc = Math.min(x.cost - x.residu, Math.round(per * n));
    return { per: Math.round(per), n: n, acc: acc, book: x.cost - acc, done: n >= x.life };
  }
  function body() {
    if (form && document.getElementById('as-name')) form = Object.assign({}, form, readForm());
    var rp = L.rp, day = asof || L.iso(), h = '<div style="font-size:12px;opacity:.7;margin-top:8px;line-height:1.5">Metode garis lurus, per bulan penuh sejak tanggal beli. Daftar ini terpisah dan belum otomatis mengubah angka Neraca.</div>';
    h += '<div style="display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap"><label style="font-size:12px;opacity:.8">Per tanggal</label><input id="as-day" type="date" value="' + L.esc(day) + '" style="' + L.INP + '">' + (canEdit() ? '<button data-lx="add" style="' + L.BTN + L.VIO + ';margin-left:auto">+ Tambah aset</button>' : '') + '</div>';
    if (form && canEdit()) {
      var f = form; function fld(id, lab, v, t, ph) { return '<label style="display:block;font-size:11.5px;opacity:.8;margin-top:8px">' + lab + '<input id="as-' + id + '" type="' + (t || 'text') + '" value="' + L.esc(v) + '" placeholder="' + (ph || '') + '" style="' + L.INP + ';width:100%;margin-top:3px"></label>'; }
      h += '<div style="margin-top:12px;padding:12px;border-radius:14px;background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.3)"><b style="font-size:13px">' + (f.id ? 'Ubah aset' : 'Aset baru') + '</b>' + fld('name', 'Nama aset', f.name, 'text', 'Mesin jahit, motor, laptop') + fld('cost', 'Harga beli (Rp)', f.cost || '', 'text', '3000000') + fld('date', 'Tanggal beli', f.date, 'date') + fld('life', 'Umur manfaat (bulan)', f.life || '', 'text', '48') + fld('residu', 'Nilai sisa di akhir umur (Rp, boleh 0)', f.residu || '', 'text', '0') +
        (note ? '<div style="margin-top:8px;font-size:12px;color:#b45309">' + L.esc(note) + '</div>' : '') + '<div style="display:flex;gap:8px;margin-top:12px"><button data-lx="cancel" style="' + L.BTN + '">Batal</button><button data-lx="save" style="' + L.BTN + L.VIO + ';flex:1">Simpan</button></div></div>';
    } else if (note) h += '<div style="margin-top:8px;font-size:12px;color:#b45309">' + L.esc(note) + '</div>';
    if (!items.length) return h + '<div style="padding:22px 6px;text-align:center;opacity:.75;font-size:13px">Belum ada aset tetap.' + (canEdit() ? ' Tekan "+ Tambah aset".' : ' Manager yang mengisi daftar ini.') + '</div>';
    var tot = { cost: 0, acc: 0, book: 0, per: 0 }, rows = '';
    items.forEach(function (x) {
      var c = calcOne(x, day); if (L.parse(x.date) > L.parse(day)) { c = { per: Math.round((x.cost - x.residu) / x.life), n: 0, acc: 0, book: x.cost, done: false, future: true }; }
      tot.cost += x.cost; tot.acc += c.acc; tot.book += c.book; if (!c.done && !c.future) tot.per += c.per;
      rows += '<div style="padding:10px 0;border-top:1px solid #e2e8f0"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:13px">' + L.esc(x.name) + '</b><span style="font-size:11px;opacity:.7">' + (c.future ? 'belum dibeli pada tanggal ini' : c.done ? 'sudah habis disusutkan' : c.n + ' dari ' + x.life + ' bulan') + '</span></div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 12px;font-size:12px;margin-top:4px"><span style="opacity:.7">Harga beli</span><b style="text-align:right">' + rp(x.cost) + '</b><span style="opacity:.7">Penyusutan per bulan</span><b style="text-align:right">' + rp(c.per) + '</b><span style="opacity:.7">Akumulasi penyusutan</span><b style="text-align:right">' + rp(c.acc) + '</b><span style="opacity:.7">Nilai buku</span><b style="text-align:right;color:#15803d">' + rp(c.book) + '</b></div>' +
        (canEdit() ? '<div style="display:flex;gap:6px;margin-top:6px"><button data-lx="edit" data-id="' + L.esc(x.id) + '" style="' + L.BTN + ';padding:4px 10px;font-size:11px">Ubah</button><button data-lx="del" data-id="' + L.esc(x.id) + '" style="' + L.BTN + ';padding:4px 10px;font-size:11px">Hapus</button></div>' : '') + '</div>';
    });
    h += '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px">' + [['Total harga beli', rp(tot.cost)], ['Penyusutan bulan ini', rp(tot.per)], ['Total nilai buku', rp(tot.book)]].map(function (x) { return '<div style="padding:10px;border-radius:14px;background:#f8fafc"><div style="font-size:10.5px;opacity:.7">' + x[0] + '</div><div style="font-weight:800;font-size:13px;margin-top:2px">' + x[1] + '</div></div>'; }).join('') + '</div>' + '<div style="margin-top:6px">' + rows + '</div>';
    h += '<div style="display:flex;gap:8px;margin-top:12px"><button data-lx="copy" style="' + L.BTN + '">Salin ringkasan</button></div>';
    return h;
  }
  function textOut() {
    var day = asof || L.iso(); var t = 'DAFTAR PENYUSUTAN ASET TETAP\nPer ' + day + '\n';
    items.forEach(function (x) { var c = calcOne(x, day); t += '\n' + x.name + ': harga ' + L.rp(x.cost) + ', akumulasi ' + L.rp(c.acc) + ', nilai buku ' + L.rp(c.book); }); return t;
  }
  function readForm() { var g = function (k) { var e = document.getElementById('as-' + k); return e ? e.value : ''; }; return { id: form && form.id || '', name: g('name').trim(), cost: Number(String(g('cost')).replace(/[^0-9]/g, '')) || 0, date: g('date'), life: Number(String(g('life')).replace(/[^0-9]/g, '')) || 0, residu: Number(String(g('residu')).replace(/[^0-9]/g, '')) || 0 }; }
  function act(a, el) {
    if (a === 'add') { form = { id: '', name: '', cost: 0, date: L.iso(), life: 0, residu: 0 }; note = ''; }
    else if (a === 'cancel') { form = null; note = ''; }
    else if (a === 'edit') { var x = items.filter(function (i) { return i.id === el.getAttribute('data-id'); })[0]; if (x) { form = Object.assign({}, x); note = ''; } }
    else if (a === 'del') { var id = el.getAttribute('data-id'), it = items.filter(function (i) { return i.id === id; })[0]; if (it && confirm('Hapus aset "' + it.name + '" dari daftar?')) { items = items.filter(function (i) { return i.id !== id; }); persist(); } return; }
    else if (a === 'copy') { L.copy(textOut(), function (ok) { note = ok ? 'Ringkasan tersalin.' : 'Gagal menyalin.'; L.render('aset'); }); return; }
    else if (a === 'save') {
      var f = readForm();
      if (!f.name) { note = 'Isi nama aset.'; } else if (!(f.cost > 0)) { note = 'Isi harga beli.'; } else if (!L.parse(f.date)) { note = 'Isi tanggal beli.'; } else if (!(f.life >= 1)) { note = 'Isi umur manfaat dalam bulan.'; } else if (f.residu >= f.cost) { note = 'Nilai sisa harus lebih kecil dari harga beli.'; }
      else { note = ''; if (f.id) items = items.map(function (i) { return i.id === f.id ? f : i; }); else { f.id = 'a' + Date.now(); items.push(f); } form = null; persist(); return; }
    }
    L.render('aset');
  }
  window.FM_ASET = { open: function () { if (!L.has('penyusutan')) return; start(); form = null; note = ''; asof = ''; L.open('aset', { title: 'Penyusutan Aset Tetap', sub: 'Nilai buku aset dari waktu ke waktu', body: body, act: act, change: function (t) { if (t.id === 'as-day' && t.value) { asof = t.value; L.render('aset'); } } }); }, _set: function (a) { items = norm(a); started = true; }, _calc: calcOne };
})();
