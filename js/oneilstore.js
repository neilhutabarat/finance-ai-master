/* oneilstore.js — OneilStore: etalase sewa fitur untuk Manager dan Owner. Harga per periode (harian, mingguan, bulanan, tahunan, permanen) dan fitur yang dijual diatur Tower lewat app_meta/store_catalog.
   - Katalog, harga, dan peta fitur ada di plans.js (FM_PLANS.STORE). Sewa aktif dibaca dari tenant_ctrl/<toko>.rentals
     (ditulis Tower, klien hanya membaca) lewat window.TENANT_CTRL yang diisi ctrl.js.
   - Permintaan sewa dikirim sebagai tiket provider_tickets bertipe 'store' (sama seperti Tiket Bantuan; aturan Firestore tidak berubah).
   - Sewa hanya MENAMBAH fitur. Saat sewa habis fitur terkunci lagi, data tidak pernah disentuh. */
(function () {
  'use strict';
  var PAGE = (location.pathname.split('/').pop() || '').toLowerCase();
  if (!/^(manager|dashboard)\.html$/.test(PAGE)) return;
  var P = function () { return window.FM_PLANS || null; };
  function role() { return PAGE === 'manager.html' ? 'manager' : 'owner'; }
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : 'default'; }
  function hasDb() { return typeof db !== 'undefined' && db && tid() !== 'default'; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function actor() { try { return (typeof user !== 'undefined' && user && (user.title || user.name)) || ''; } catch (e) { return ''; } }
  function ver() { try { return (window.FM_THEME && FM_THEME.version) || ''; } catch (e) { return ''; } }
  function rp(n) { return 'Rp' + Number(n || 0).toLocaleString('id-ID'); }
  function dstr(ms) { try { return new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } }
  function ctrl() { return window.TENANT_CTRL || {}; }
  function rentals() { return (P() && P().STORE.rentals()) || {}; }

  var ov = null, tab = 'jelajah', sheet = null, reqs = [], started = false, note = '', sending = false, lastSend = 0, sel = {};
  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var BTN = 'padding:7px 13px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12px;font-weight:800;cursor:pointer';
  var GREEN = ';background:#22c55e;color:#04210f;border-color:#22c55e';
  var VIO = ';background:#a855f7;color:#fff;border-color:#a855f7';
  var PL = { hari: 'Harian', minggu: 'Mingguan', bulan: 'Bulanan', tahun: 'Tahunan', perm: 'Permanen', gratis: 'Gratis', coba: 'Coba' };
  var PSUB = { hari: 'Aktif 1 hari', minggu: 'Aktif 7 hari', bulan: 'Aktif 1 bulan, perpanjang sendiri', tahun: 'Aktif 12 bulan', perm: 'Sekali bayar, tidak ada tanggal habis', gratis: 'Tanpa biaya, aktif tetap setelah disetujui penyedia aplikasi' };

  function start() {
    if (started || !hasDb()) return; started = true;
    try {
      db.collection('provider_tickets').where('tenantId', '==', tid()).where('type', '==', 'store').onSnapshot(function (s) {
        reqs = []; s.forEach(function (d) { var x = d.data(); x.docId = d.id; reqs.push(x); });
        reqs.sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); }); render();
      }, function () {});
    } catch (e) {}
  }
  window.addEventListener('fm:ctrl', function () { if (ov && ov.style.display !== 'none') render(); });
  window.addEventListener('fm:storecat', function () { if (ov && ov.style.display !== 'none') render(); });

  function pending(id) { return reqs.some(function (r) { return r.status === 'BARU' && (r.item === id || (r.items && r.items.indexOf(id) >= 0)); }); }
  function ownedBase(item) {
    var plans = P(), keys = plans.STORE.keysOf(item.id), role0 = role(), tnn = tn();
    var rel = keys.filter(function (k) { var f = plans.FEATURES.filter(function (x) { return x.key === k; })[0]; return f && f.r[role0]; });
    return rel.length > 0 && rel.every(function (k) { return plans.hasBase(k, role0, tnn); });
  }
  function trialOk(id) { var c = ctrl(); return !(c.trialUsed && c.trialUsed[id]) && !rentals()[id]; }
  function state(item) {
    var R = rentals()[item.id], now = Date.now();
    if (R && Number(R.until) > now) return { k: 'rent', until: Number(R.until), perm: !!R.perm, days: Math.max(1, Math.ceil((Number(R.until) - now) / 86400000)), trial: !!R.trial };
    if (item.id !== 'plus_all' && item.keys !== undefined && ownedBase(item)) return { k: 'owned' };
    return { k: 'off' };
  }
  function prodItem(p) { return { id: p.id, keys: p.keys }; }

  function badge(st, id) {
    if (pending(id)) return '<span style="font-size:10.5px;font-weight:800;color:#fbbf24">Menunggu konfirmasi</span>';
    if (st.k === 'rent') return st.perm ? '<span style="font-size:10.5px;font-weight:800;color:#4ade80">Permanen</span>' : '<span style="font-size:10.5px;font-weight:800;color:#4ade80">' + (st.trial ? 'Coba' : 'Disewa') + ' sampai ' + esc(dstr(st.until)) + ' (' + st.days + ' hari)</span>';
    if (st.k === 'owned') return '<span style="font-size:10.5px;font-weight:800;color:#94a3b8">Sudah aktif di toko ini</span>';
    return '';
  }
  function actBtn(id, st) {
    if (pending(id)) return '';
    if (st.k === 'owned') return '';
    if (st.k === 'rent' && st.perm) return '';
    return '<button data-sheet="' + esc(id) + '" style="' + BTN + (st.k === 'off' ? VIO : '') + '">' + (st.k === 'rent' ? 'Perpanjang' : (P().STORE.free(id) ? 'Ambil gratis' : 'Sewa')) + '</button>';
  }
  /* daftar harga yang dijual: hanya periode yang berharga */
  function priceLine(id) {
    var stt = P().STORE, out = [];
    if (stt.free(id)) return '<b style="color:#4ade80">Gratis</b><span style="opacity:.6"> · pilih sesuai kebutuhan</span>';
    stt.periods.forEach(function (x) { var v = stt.price(id, x[0]); if (v != null) out.push('<b>' + rp(v) + '</b><span style="opacity:.6"> ' + (x[0] === 'perm' ? 'permanen' : '/ ' + ({ hari: 'hari', minggu: 'minggu', bulan: 'bulan', tahun: 'tahun' })[x[0]]) + '</span>'); });
    return out.join(' <span style="opacity:.35">·</span> ');
  }
  function row(name, desc, id, st) {
    var pickable = st.k !== 'owned' && !(st.k === 'rent' && st.perm) && !pending(id);
    return '<div style="padding:11px 2px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:10px;align-items:center">' +
      (pickable ? '<input type="checkbox" data-pick="' + esc(id) + '" ' + (sel[id] ? 'checked ' : '') + 'aria-label="Pilih ' + esc(name) + '">' : '<span style="width:18px;flex:0 0 auto"></span>') +
      '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:13px">' + esc(name) + '</div>' +
      (desc ? '<div style="font-size:11.5px;opacity:.65;margin-top:2px;line-height:1.45">' + esc(desc) + '</div>' : '') +
      '<div style="font-size:11.5px;margin-top:3px;line-height:1.6">' + priceLine(id) + ' ' + badge(st, id) + '</div></div>' + actBtn(id, st) + '</div>';
  }
  function selIds() { var st = P().STORE; return Object.keys(sel).filter(function (k) { return sel[k] && st.item(k) && st.sold(k); }); }

  function viewJelajah() {
    var st = P().STORE, groups = [], by = {};
    st.products.forEach(function (p) { if (!st.sold(p.id)) return; if (!by[p.grp]) { by[p.grp] = []; groups.push(p.grp); } by[p.grp].push(p); });
    var d = st.disc();
    var h = '<div style="font-size:12px;opacity:.7;margin-bottom:6px">Pilih hanya fitur yang dibutuhkan. Centang beberapa fitur untuk diambil sekaligus (fitur gratis dan berbayar dipisah)' + (d.pct > 0 ? ' (diskon ' + d.pct + '% bila memilih ' + d.min + ' fitur atau lebih)' : '') + '. Fitur yang sudah aktif di toko ini tetap gratis.</div>';
    if (!groups.length) h += '<div style="opacity:.6;font-size:12px;padding:14px 2px">Belum ada fitur yang tersedia saat ini.</div>';
    groups.forEach(function (g) {
      h += '<div style="font-weight:900;font-size:12.5px;margin:12px 0 2px;color:#c084fc">' + esc(g) + '</div>';
      by[g].forEach(function (p) { h += row(p.name, p.d, p.id, state(prodItem(p))); });
    });
    return h;
  }
  function cartBar() {
    var ids = selIds(); if (!ids.length || sheet || tab !== 'jelajah') return '';
    var st = P().STORE, nf = ids.filter(st.free).length, mixed = nf > 0 && nf < ids.length, allFree = nf === ids.length;
    var per = allFree ? 'gratis' : ['bulan', 'tahun', 'hari', 'minggu', 'perm'].filter(function (x) { return st.quote(ids, x).ok; })[0], q = (per && !mixed) ? st.quote(ids, per) : null;
    return '<div style="position:sticky;bottom:-18px;margin:12px -18px -18px;padding:12px 18px;background:#14141c;border-top:1px solid rgba(168,85,247,.5);border-radius:0 0 24px 24px;display:flex;gap:10px;align-items:center"><div style="flex:1;font-size:12px"><b>' + ids.length + ' fitur dipilih</b>' +
      (q ? (allFree ? '<div style="opacity:.7;font-size:11px">Gratis</div>' : '<div style="opacity:.7;font-size:11px">mulai ' + rp(q.total) + ' (' + PL[per].toLowerCase() + ')' + (q.pct ? ', sudah diskon ' + q.pct + '%' : '') + '</div>') : '<div style="opacity:.7;font-size:11px">' + (mixed ? 'Fitur gratis dan berbayar tidak bisa digabung. Pilih salah satu jenis.' : 'Tidak ada periode yang sama untuk semua pilihan. Kurangi pilihan.') + '</div>') +
      '</div><button data-a="clear" style="' + BTN + '">Batal</button><button data-a="cart" ' + (q ? '' : 'disabled ') + 'style="' + BTN + VIO + '">' + (allFree ? 'Ambil gratis' : 'Sewa terpilih') + '</button></div>';
  }
  function viewPaket() {
    var st = P().STORE, h = '<div style="font-size:12px;opacity:.7;margin-bottom:6px">Paket jenis usaha: beberapa fitur sekaligus dengan harga lebih hemat.</div>', n = 0;
    st.packs.forEach(function (pk) {
      if (!st.sold(pk.id)) return; n++;
      var pb = st.price(pk.id, 'bulan'), sum = pk.items.reduce(function (a, i) { return a + (st.price(i, 'bulan') || (st.item(i) ? st.item(i).price : 0)); }, 0);
      var names = pk.items.map(function (i) { return st.item(i) ? st.item(i).name : ''; }).join(', ');
      var s = state({ id: pk.id });
      h += '<div style="padding:11px 2px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:10px;align-items:center"><div style="flex:1;min-width:0">' +
        '<div style="font-weight:800;font-size:13px">' + esc(pk.name) + '</div><div style="font-size:11.5px;opacity:.65;margin-top:2px;line-height:1.45">' + esc(names) + '</div>' +
        '<div style="font-size:11.5px;margin-top:3px;line-height:1.6">' + priceLine(pk.id) + (pb && sum > pb && !st.free(pk.id) ? '<span style="opacity:.6"> · hemat ' + rp(sum - pb) + ' dari harga satuan (bulanan)</span>' : '') + ' ' + badge(s, pk.id) + '</div></div>' + actBtn(pk.id, s) + '</div>';
    });
    var a = st.all, sa = state({ id: a.id });
    if (st.sold(a.id)) h += '<div style="padding:11px 2px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:10px;align-items:center"><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:13px">' + esc(a.name) + '</div>' +
      '<div style="font-size:11.5px;opacity:.65;margin-top:2px">Semua fitur Store aktif. Harga tetap, tidak perlu memilih satu per satu.</div>' +
      '<div style="font-size:11.5px;margin-top:3px;line-height:1.6">' + priceLine(a.id) + ' ' + badge(sa, a.id) + '</div></div>' + actBtn(a.id, sa) + '</div>';
    else if (!n) h += '<div style="opacity:.6;font-size:12px;padding:14px 2px">Belum ada paket yang tersedia saat ini.</div>';
    return h;
  }
  function viewPunyaku() {
    var st = P().STORE, R = rentals(), now = Date.now(), h = '';
    var ids = Object.keys(R).filter(function (k) { return st.active(k, now); });
    h += '<div style="font-weight:900;font-size:12.5px;margin:4px 0 2px;color:#c084fc">Sewa aktif</div>';
    if (!ids.length) h += '<div style="opacity:.6;font-size:12px;padding:8px 2px">Belum ada fitur yang disewa.</div>';
    ids.forEach(function (id) {
      var it = st.item(id), e = R[id]; if (!it) return;
      var days = Math.max(1, Math.ceil((Number(e.until) - now) / 86400000));
      h += '<div style="padding:9px 2px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:10px;align-items:center"><div style="flex:1"><div style="font-weight:800;font-size:13px">' + esc(it.name) + (e.trial ? ' <span style="font-size:10px;color:#fbbf24">COBA</span>' : '') + '</div>' +
        '<div style="font-size:11.5px;opacity:.7">' + (e.perm ? 'Permanen, tidak ada tanggal habis' : 'Sampai ' + esc(dstr(Number(e.until))) + ' · ' + days + ' hari lagi') + '</div></div>' + (e.perm ? '' : '<button data-sheet="' + esc(id) + '" style="' + BTN + '">Perpanjang</button>') + '</div>';
    });
    h += '<div style="font-weight:900;font-size:12.5px;margin:16px 0 2px;color:#c084fc">Permintaan saya</div>';
    if (!reqs.length) h += '<div style="opacity:.6;font-size:12px;padding:8px 2px">Belum ada permintaan.</div>';
    var STT = { BARU: ['Menunggu konfirmasi', '#fbbf24'], AKTIF: ['Sudah diaktifkan', '#4ade80'], DITOLAK: ['Ditolak', '#fb7185'] };
    reqs.slice(0, 20).forEach(function (r) {
      var s = STT[r.status] || STT.BARU, per = r.period === 'coba' ? 'coba ' + (P().STORE.trialDays) + ' hari' : (PL[r.period] || 'Bulanan').toLowerCase();
      h += '<div style="padding:9px 2px;border-top:1px solid rgba(255,255,255,.08)"><div style="display:flex;gap:8px;justify-content:space-between"><b style="font-size:12.5px">' + esc(r.itemName || r.item) + '</b><span style="font-size:11px;font-weight:800;color:' + s[1] + '">' + s[0] + '</span></div>' +
        '<div style="font-size:11.5px;opacity:.65;margin-top:2px">' + esc(per) + ' · ' + rp(r.price) + ' · ' + esc(r.requestedAt || '') + '</div>' +
        (r.note ? '<div style="margin-top:5px;padding:7px 9px;border-radius:10px;background:rgba(168,85,247,.14);font-size:12px;white-space:pre-wrap">' + esc(r.note) + '</div>' : '') + '</div>';
    });
    return h;
  }

  function sheetIds() { return sheet.ids && sheet.ids.length ? sheet.ids : [sheet.id]; }
  function viewSheet() {
    var st = P().STORE, ids = sheetIds(), its = ids.map(function (i) { return st.item(i); });
    if (its.some(function (x) { return !x; })) { sheet = null; return ''; }
    var multi = ids.length > 1, avail = ['gratis'].concat(st.periods.map(function (x) { return x[0]; })).filter(function (x) { return st.quote(ids, x).ok; });
    var per = sheet.period && (avail.indexOf(sheet.period) >= 0 || (sheet.period === 'coba' && !multi)) ? sheet.period : (avail.indexOf('gratis') >= 0 ? 'gratis' : avail.indexOf('bulan') >= 0 ? 'bulan' : avail[0]);
    sheet.period = per;
    var canTrial = !multi && !st.free(ids[0]) && trialOk(ids[0]);
    function opt(v, title, sub, price) {
      return '<label style="display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;border:1px solid ' + (per === v ? '#a855f7' : 'rgba(255,255,255,.15)') + ';background:' + (per === v ? 'rgba(168,85,247,.14)' : 'transparent') + ';margin-top:8px;cursor:pointer">' +
        '<input type="radio" name="os-per" value="' + v + '" ' + (per === v ? 'checked' : '') + ' style="accent-color:#a855f7"><span style="flex:1"><b style="font-size:13px">' + title + '</b><span style="display:block;font-size:11px;opacity:.65">' + sub + '</span></span><b style="font-size:13px">' + price + '</b></label>';
    }
    var opts = avail.map(function (v) {
      var q = st.quote(ids, v), sub = PSUB[v];
      if (q.pct) sub += ' · diskon ' + q.pct + '% (hemat ' + rp(q.save) + ')';
      return opt(v, PL[v], sub, v === 'gratis' ? 'Gratis' : rp(q.total));
    }).join('');
    if (!avail.length && !canTrial) opts = '<div style="margin-top:10px;font-size:12px;color:#fbbf24">Fitur ini sedang tidak tersedia.</div>';
    return '<div style="padding:4px 2px"><div style="font-weight:900;font-size:15px">' + esc(its.map(function (x) { return x.name; }).join(' + ')) + '</div>' +
      '<div style="font-size:12px;opacity:.7;margin-top:2px">' + (per === 'gratis' ? 'Fitur diaktifkan setelah permintaan disetujui oleh penyedia aplikasi.' : 'Pilih lama sewa. Fitur diaktifkan setelah pembayaran dikonfirmasi oleh penyedia aplikasi.') + '</div>' + opts +
      (canTrial ? opt('coba', 'Coba ' + st.trialDays + ' hari', 'Gratis, sekali untuk tiap fitur', 'Gratis') : '') +
      (note ? '<div style="margin-top:10px;font-size:12px;color:#fbbf24">' + esc(note) + '</div>' : '') +
      '<div style="display:flex;gap:8px;margin-top:14px"><button data-a="back" style="' + BTN + '">Kembali</button><button data-a="send" ' + ((sending || (!avail.length && !canTrial)) ? 'disabled ' : '') + 'style="' + BTN + VIO + ';flex:1">' + (sending ? 'Mengirim…' : 'Kirim permintaan') + '</button></div></div>';
  }

  function render() {
    if (!ov || ov.style.display === 'none' || !P()) return;
    var box0 = ov.firstChild, keepTop = box0 && box0.scrollTop || 0;
    var TB = function (id, t) { return '<button data-tab="' + id + '" style="' + BTN + (tab === id && !sheet ? VIO : '') + '">' + t + '</button>'; };
    var body = sheet ? viewSheet() : tab === 'paket' ? viewPaket() : tab === 'punyaku' ? viewPunyaku() : viewJelajah();
    var banner = (P().STORE.loadedSig() !== null && P().STORE.sig() !== P().STORE.loadedSig()) ? '<div style="margin:10px 0;padding:9px 11px;border-radius:12px;background:rgba(34,197,94,.14);font-size:12px;display:flex;gap:8px;align-items:center"><span style="flex:1">Ada perubahan sewa. Muat ulang halaman agar fitur baru tampil.</span><button data-a="reload" style="' + BTN + GREEN + '">Muat ulang</button></div>' : '';
    ov.innerHTML = '<div style="width:100%;max-width:560px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px;' + S + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><div style="font-weight:900;font-size:18px">OneilStore</div><div style="font-size:12px;opacity:.6">Sewa fitur sesuai kebutuhan usaha</div></div><button data-x style="' + BTN + '">Tutup</button></div>' +
      '<div style="display:flex;gap:6px;margin:12px 0 4px;flex-wrap:wrap">' + TB('jelajah', 'Jelajah') + TB('paket', 'Paket') + TB('punyaku', 'Punyaku' + (reqs.some(function (r) { return r.status === 'BARU'; }) ? ' •' : '')) + '</div>' + banner + body + cartBar() + '</div>';
    if (keepTop && ov.firstChild) ov.firstChild.scrollTop = keepTop;
  }

  function send() {
    var st = P().STORE, ids = sheetIds(), its = ids.map(function (i) { return st.item(i); }), per = sheet.period || 'bulan';
    if (its.some(function (x) { return !x; })) return;
    if (!hasDb()) { note = 'Tidak bisa mengirim sekarang. Periksa internet atau login ulang.'; return render(); }
    if (ids.some(pending)) { note = 'Ada fitur di pilihan ini yang permintaannya masih menunggu konfirmasi.'; return render(); }
    if (per === 'coba' && (ids.length > 1 || !trialOk(ids[0]))) { note = 'Masa coba untuk fitur ini sudah pernah dipakai.'; sheet.period = 'bulan'; return render(); }
    var q = per === 'coba' ? { ok: true, total: 0, pct: 0, save: 0 } : st.quote(ids, per);
    if (!q.ok) { note = 'Periode ini tidak dijual untuk salah satu fitur. Pilih periode lain.'; return render(); }
    if (Date.now() - lastSend < 5000) return;
    var t = tn(), now = Date.now();
    var tk = { id: 'store_' + now, type: 'store', tenantId: tid(), tenantName: (t && t.nama) || tid(), item: ids[0], itemName: its.map(function (x) { return x.name; }).join(' + '), period: per, price: q.total, status: 'BARU',
      requestedBy: actor(), role: role(), page: PAGE, ver: ver(), requestedAt: new Date().toLocaleString('id-ID'), timestamp: now };
    if (ids.length > 1) { tk.items = ids; tk.disc = q.pct; }
    sending = true; lastSend = now; render();
    db.collection('provider_tickets').doc(tk.id).set(tk).then(function () {
      sending = false; sheet = null; sel = {}; tab = 'punyaku'; note = ''; start(); render();
    }).catch(function (e) { sending = false; lastSend = 0; note = 'Gagal terkirim: ' + (e && e.message || e); render(); });
  }

  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-ostore';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482700;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; sheet = null; return; }
      var t = e.target.closest('[data-tab]'); if (t) { tab = t.getAttribute('data-tab'); sheet = null; note = ''; return render(); }
      var sh = e.target.closest('[data-sheet]'); if (sh) { var id = sh.getAttribute('data-sheet'); sheet = { id: id, period: 'bulan' }; note = ''; return render(); }
      var a = e.target.closest('[data-a]'); if (!a) return; var k = a.getAttribute('data-a');
      if (k === 'back') { sheet = null; note = ''; render(); } else if (k === 'send') send(); else if (k === 'reload') location.reload();
      else if (k === 'clear') { sel = {}; render(); } else if (k === 'cart') { var ids = selIds(); if (ids.length) { sheet = { id: ids[0], ids: ids, period: 'bulan' }; note = ''; render(); } }
    });
    ov.addEventListener('change', function (e) { if (e.target.name === 'os-per' && sheet) { sheet.period = e.target.value; note = ''; render(); } else if (e.target.hasAttribute && e.target.hasAttribute('data-pick')) { sel[e.target.getAttribute('data-pick')] = e.target.checked; render(); } });
    if (!document.getElementById('fm-ostore-css')) { var cs = document.createElement('style'); cs.id = 'fm-ostore-css'; cs.textContent = '#fm-ostore input[data-pick]{-webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:5px;border:2px solid rgba(255,255,255,.5);background:transparent center/12px no-repeat;cursor:pointer;flex:0 0 auto;margin:0}#fm-ostore input[data-pick]:checked{background-color:#a855f7;border-color:#a855f7;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 12 12%27%3E%3Cpath d=%27M2 6.5l2.5 2.5L10 3.5%27 fill=%27none%27 stroke=%27%23fff%27 stroke-width=%271.8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E")}#fm-ostore input[data-pick]:focus-visible{outline:2px solid #c084fc;outline-offset:2px}'; document.head.appendChild(cs); }
    document.body.appendChild(ov);
  }
  window.FM_OSTORE = { open: function (t) { if (!P()) return; ensure(); start(); tab = t || 'jelajah'; sheet = null; note = ''; ov.style.display = 'flex'; render(); try { P().STORE.fetchCat(); } catch (e) {} } };
  function init() { start(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 1500); }); else setTimeout(init, 1500);
})();
