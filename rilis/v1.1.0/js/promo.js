/* promo.js — Diskon & Promo. Manager mengatur promo otomatis dan batas diskon manual Admin;
   Kasir memotong harga barang otomatis. Data di tenant_settings/<id> (promos, promoCfg). */
(function () {
  'use strict';
  var promos = [], cfg = { maxManualPct: 0 }, started = false, ov = null, form = null, note = '';
  function role() { return window.FM_PLANS ? FM_PLANS.pageRole() : 'manager'; }
  function canEdit() { return role() === 'manager'; }
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : 'default'; }
  function hasDb() { return typeof db !== 'undefined' && db && tid() !== 'default'; }
  function lsKey() { return 'fm_promo_' + tid(); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rp(n) { return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n || 0)); }
  function iso(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function on() { try { return !!(window.FM_PLANS && FM_PLANS.has('diskon')); } catch (e) { return false; } }

  function start() {
    if (started) return; started = true;
    if (hasDb()) {
      try { db.collection('tenant_settings').doc(tid()).onSnapshot(function (s) { var d = s.exists ? s.data() : {}; promos = Array.isArray(d.promos) ? d.promos : []; cfg = Object.assign({ maxManualPct: 0 }, d.promoCfg || {}); render(); try { if (typeof renderProductGrid === 'function') renderProductGrid(); if (typeof applyQtyToForm === 'function' && typeof selectedProductOption === 'function' && selectedProductOption()) applyQtyToForm(); } catch (e) {} }, function () {}); } catch (e) {}
    } else { try { var x = JSON.parse(localStorage.getItem(lsKey()) || '{}'); promos = x.promos || []; cfg = Object.assign({ maxManualPct: 0 }, x.promoCfg || {}); } catch (e) {} }
  }
  function persist() {
    if (hasDb()) return db.collection('tenant_settings').doc(tid()).set({ promos: promos, promoCfg: cfg, updatedAt: Date.now() }, { merge: true }).catch(function (e) { alert('Gagal menyimpan: ' + (e && e.message)); });
    try { localStorage.setItem(lsKey(), JSON.stringify({ promos: promos, promoCfg: cfg })); } catch (e) {} render(); return Promise.resolve();
  }

  /* ---- dipakai Kasir ---- */
  function activeNow(p, day) { return p.active !== false && (!p.from || day >= p.from) && (!p.to || day <= p.to); }
  function applies(p, prod) {
    if (p.scope === 'induk') return String(prod.group || '').toLowerCase() === String(p.target || '').toLowerCase();
    if (p.scope === 'produk') return prod.code === p.target;
    return true;
  }
  function best(prod, un, qty, gross) {
    if (!on()) return { disc: 0, name: '' };
    start(); var day = iso(), top = { disc: 0, name: '' };
    promos.forEach(function (p) {
      if (!activeNow(p, day) || !applies(p, prod) || qty < (Number(p.minQty) || 1)) return;
      var d = p.kind === 'nominal' ? (Number(p.value) || 0) * qty : Math.round(gross * (Number(p.value) || 0) / 100);
      d = Math.min(d, gross);
      if (d > top.disc) top = { disc: d, name: p.name };
    });
    return top;
  }
  function maxManualPct() { start(); return on() ? Math.max(0, Math.min(100, Number(cfg.maxManualPct) || 0)) : 0; }

  /* ---- layar Manager ---- */
  function monthDisc() {
    var m = iso().slice(0, 7), t = 0, n = 0;
    try { (typeof txList !== 'undefined' ? txList : []).forEach(function (x) { if (x.discount && String(x.dateISO || '').slice(0, 7) === m) { t += x.discount; n++; } }); } catch (e) {}
    return { t: t, n: n };
  }
  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:13px;outline:none';
  var btn = 'padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12px;font-weight:700;cursor:pointer';
  var green = ';background:#22c55e;color:#04210f;border-color:#22c55e';
  function prods() { try { return STORE.getProducts(); } catch (e) { return []; } }
  function groups() { var s = {}, o = []; prods().forEach(function (p) { if (p.group && !s[p.group.toLowerCase()]) { s[p.group.toLowerCase()] = 1; o.push(p.group); } }); return o; }
  function lab(t, el) { return '<div><label style="display:block;font-size:11.5px;font-weight:700;margin:0 0 4px;opacity:.8">' + t + '</label>' + el + '</div>'; }
  function describe(p) {
    var w = p.scope === 'induk' ? 'Induk ' + p.target : p.scope === 'produk' ? (prods().filter(function (x) { return x.code === p.target; })[0] || { name: p.target }).name : 'Semua barang';
    return (p.kind === 'nominal' ? rp(p.value) + ' per satuan' : p.value + '%') + ' · ' + w + (p.minQty > 1 ? ' · min ' + p.minQty : '') + ' · ' + (p.from ? p.from : 'mulai kini') + ' s/d ' + (p.to ? p.to : 'tanpa batas');
  }
  function render() {
    if (!ov || ov.style.display === 'none') return;
    var ed = canEdit(), md = monthDisc();
    var h = '<div style="width:100%;max-width:760px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px">' +
      '<div style="display:flex;justify-content:space-between;gap:10px"><div><div style="font-weight:800;font-size:17px">Diskon &amp; Promo</div><div style="font-size:12px;opacity:.65">' + (ed ? 'Promo berlaku otomatis di Kasir untuk barang yang cocok.' : 'Tampilan baca saja.') + '</div></div><button data-x style="' + btn + '">Tutup</button></div>';
    if (note) h += '<p style="margin:10px 0;padding:10px 12px;border-radius:12px;background:rgba(245,158,11,.14);color:#fbbf24;font-size:12px">' + esc(note) + '</p>';
    if (form) { ov.innerHTML = h + formHtml() + '</div>'; return; }
    h += '<div style="margin:12px 0;padding:10px;border-radius:14px;background:rgba(255,255,255,.07);font-size:12.5px">Diskon yang diberikan bulan ini: <b>' + rp(md.t) + '</b> dalam ' + md.n + ' transaksi</div>';
    h += '<div style="display:flex;gap:10px;align-items:end;flex-wrap:wrap;margin-bottom:12px"><div style="flex:1;min-width:210px">' + lab('Diskon manual Admin maksimal (% dari harga, 0 = tidak boleh)', '<input id="pm-max" type="number" min="0" max="100" value="' + (Number(cfg.maxManualPct) || 0) + '" style="' + inp + '"' + (ed ? '' : ' disabled') + '>') + '</div>' + (ed ? '<button data-a="savemax" style="' + btn + '">Simpan batas</button><button data-a="new" style="' + btn + green + '">+ Promo baru</button>' : '') + '</div>';
    if (!promos.length) h += '<p style="opacity:.7;text-align:center;padding:16px;font-size:13px">Belum ada promo.</p>';
    var day = iso();
    promos.forEach(function (p) {
      var live = activeNow(p, day), st = p.active === false ? 'Mati' : (p.to && day > p.to ? 'Berakhir' : (p.from && day < p.from ? 'Belum mulai' : 'Aktif'));
      h += '<div style="padding:10px;margin-bottom:6px;border-radius:12px;background:rgba(255,255,255,.05);display:flex;gap:10px;align-items:center"><div style="flex:1"><b>' + esc(p.name) + '</b> <span style="padding:2px 8px;border-radius:99px;font-size:10.5px;font-weight:800;background:' + (live ? 'rgba(34,197,94,.2);color:#4ade80' : 'rgba(148,163,184,.2);color:#cbd5e1') + '">' + st + '</span><div style="font-size:11.5px;opacity:.7;margin-top:2px">' + esc(describe(p)) + '</div></div>' +
        (ed ? '<button data-a="tog" data-id="' + esc(p.id) + '" style="' + btn + ';padding:5px 10px">' + (p.active === false ? 'Nyalakan' : 'Matikan') + '</button><button data-a="edit" data-id="' + esc(p.id) + '" style="' + btn + ';padding:5px 10px">Ubah</button><button data-a="del" data-id="' + esc(p.id) + '" style="' + btn + ';padding:5px 10px;color:#fb7185">Hapus</button>' : '') + '</div>';
    });
    ov.innerHTML = h + '</div>';
  }
  function formHtml() {
    var f = form;
    return '<div style="margin-top:14px;font-weight:800">' + (f.isNew ? 'Promo baru' : 'Ubah promo') + '</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:10px">' +
      lab('Nama promo', '<input id="pm-name" value="' + esc(f.name) + '" placeholder="mis. Diskon Akhir Pekan" style="' + inp + '">') +
      lab('Jenis', '<select id="pm-kind" style="' + inp + '"><option value="persen"' + (f.kind === 'persen' ? ' selected' : '') + '>Persen (%)</option><option value="nominal"' + (f.kind === 'nominal' ? ' selected' : '') + '>Potongan Rp per satuan</option></select>') +
      lab('Nilai', '<input id="pm-val" type="number" min="1" value="' + (f.value || '') + '" style="' + inp + '">') +
      lab('Berlaku untuk', '<select id="pm-scope" onchange="FM_PROMO._scope()" style="' + inp + '"><option value="semua"' + (f.scope === 'semua' ? ' selected' : '') + '>Semua barang</option><option value="induk"' + (f.scope === 'induk' ? ' selected' : '') + '>Satu Induk</option><option value="produk"' + (f.scope === 'produk' ? ' selected' : '') + '>Satu barang</option></select>') +
      lab('Pilih Induk / barang', '<select id="pm-target" style="' + inp + '"></select>') +
      lab('Minimal jumlah beli', '<input id="pm-min" type="number" min="1" value="' + (f.minQty || 1) + '" style="' + inp + '">') +
      lab('Mulai (kosong = sekarang)', '<input id="pm-from" type="date" value="' + esc(f.from || '') + '" style="' + inp + '">') +
      lab('Sampai (kosong = tanpa batas)', '<input id="pm-to" type="date" value="' + esc(f.to || '') + '" style="' + inp + '">') +
      '</div><p style="font-size:11.5px;opacity:.65;margin:8px 0 0">Bila beberapa promo cocok, Kasir memakai yang potongannya paling besar (tidak ditumpuk).</p><div style="display:flex;gap:8px;margin-top:12px"><button data-a="save" style="' + btn + green + '">Simpan</button><button data-a="cancel" style="' + btn + '">Batal</button></div>';
  }
  function fillTarget() {
    var sc = document.getElementById('pm-scope'), t = document.getElementById('pm-target'); if (!sc || !t) return;
    var o = sc.value === 'induk' ? groups().map(function (g) { return [g, g]; }) : sc.value === 'produk' ? prods().map(function (p) { return [p.code, p.name]; }) : [];
    t.innerHTML = o.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (form && form.target === x[0] ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join(''); t.disabled = !o.length;
  }
  function g(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  async function act(a, id) {
    note = ''; var p = promos.filter(function (x) { return x.id === id; })[0];
    if (a === 'new') { form = { isNew: true, kind: 'persen', scope: 'semua', minQty: 1 }; render(); fillTarget(); }
    else if (a === 'edit' && p) { form = Object.assign({ isNew: false }, p); render(); fillTarget(); }
    else if (a === 'cancel') { form = null; render(); }
    else if (a === 'tog' && p) { p.active = p.active === false; persist(); }
    else if (a === 'del' && p) { if (await (window.fmAsk ? fmAsk('Hapus promo "' + p.name + '"?') : confirm('Hapus?'))) { promos = promos.filter(function (x) { return x.id !== id; }); persist(); } }
    else if (a === 'savemax') { cfg.maxManualPct = Math.max(0, Math.min(100, Number(g('pm-max')) || 0)); persist(); note = 'Batas diskon manual disimpan: ' + cfg.maxManualPct + '%.'; render(); }
    else if (a === 'save') {
      var nm = g('pm-name').trim(), val = Number(g('pm-val')) || 0, kind = g('pm-kind'), sc = g('pm-scope');
      if (!nm) { note = 'Nama promo wajib diisi.'; return render(), fillTarget(); }
      if (val < 1 || (kind === 'persen' && val > 100)) { note = 'Nilai tidak valid.'; return render(), fillTarget(); }
      if (sc !== 'semua' && !g('pm-target')) { note = 'Pilih Induk atau barangnya.'; return render(), fillTarget(); }
      var rec = { id: form.isNew ? 'pr_' + Date.now() : form.id, name: nm, kind: kind, value: val, scope: sc, target: sc === 'semua' ? '' : g('pm-target'), minQty: Math.max(1, Number(g('pm-min')) || 1), from: g('pm-from'), to: g('pm-to'), active: form.isNew ? true : form.active !== false };
      if (rec.from && rec.to && rec.to < rec.from) { note = 'Tanggal sampai lebih awal dari mulai.'; return render(), fillTarget(); }
      if (form.isNew) promos.push(rec); else promos = promos.map(function (x) { return x.id === rec.id ? rec : x; });
      form = null; persist(); render();
    }
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-promo';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var b = e.target.closest('[data-a]'); if (b) act(b.getAttribute('data-a'), b.getAttribute('data-id'));
    });
    document.body.appendChild(ov);
  }
  window.FM_PROMO = { open: function () { ensure(); start(); form = null; note = ''; ov.style.display = 'flex'; render(); }, best: best, maxManualPct: maxManualPct, start: start, _scope: function () { fillTarget(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(function () { if (on()) start(); }, 700); }); else setTimeout(function () { if (on()) start(); }, 700);
})();
