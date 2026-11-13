/* oneilstore.js — OneilStore: etalase sewa fitur untuk Manager dan Owner.
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

  var ov = null, tab = 'jelajah', sheet = null, reqs = [], started = false, note = '', sending = false, lastSend = 0;
  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var BTN = 'padding:7px 13px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12px;font-weight:800;cursor:pointer';
  var GREEN = ';background:#22c55e;color:#04210f;border-color:#22c55e';
  var VIO = ';background:#a855f7;color:#fff;border-color:#a855f7';

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

  function pending(id) { return reqs.some(function (r) { return r.item === id && r.status === 'BARU'; }); }
  function ownedBase(item) {
    var plans = P(), keys = plans.STORE.keysOf(item.id), role0 = role(), tnn = tn();
    var rel = keys.filter(function (k) { var f = plans.FEATURES.filter(function (x) { return x.key === k; })[0]; return f && f.r[role0]; });
    return rel.length > 0 && rel.every(function (k) { return plans.hasBase(k, role0, tnn); });
  }
  function trialOk(id) { var c = ctrl(); return !(c.trialUsed && c.trialUsed[id]) && !rentals()[id]; }
  function state(item) {
    var R = rentals()[item.id], now = Date.now();
    if (R && Number(R.until) > now) return { k: 'rent', until: Number(R.until), days: Math.max(1, Math.ceil((Number(R.until) - now) / 86400000)), trial: !!R.trial };
    if (item.id !== 'plus_all' && item.keys !== undefined && ownedBase(item)) return { k: 'owned' };
    return { k: 'off' };
  }
  function prodItem(p) { return { id: p.id, keys: p.keys }; }

  function badge(st, id) {
    if (pending(id)) return '<span style="font-size:10.5px;font-weight:800;color:#fbbf24">Menunggu konfirmasi</span>';
    if (st.k === 'rent') return '<span style="font-size:10.5px;font-weight:800;color:#4ade80">' + (st.trial ? 'Coba' : 'Disewa') + ' sampai ' + esc(dstr(st.until)) + ' (' + st.days + ' hari)</span>';
    if (st.k === 'owned') return '<span style="font-size:10.5px;font-weight:800;color:#94a3b8">Sudah aktif di toko ini</span>';
    return '';
  }
  function actBtn(id, st) {
    if (pending(id)) return '';
    if (st.k === 'owned') return '';
    return '<button data-sheet="' + esc(id) + '" style="' + BTN + (st.k === 'off' ? VIO : '') + '">' + (st.k === 'rent' ? 'Perpanjang' : 'Sewa') + '</button>';
  }
  function row(name, desc, price, id, st) {
    return '<div style="padding:11px 2px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:10px;align-items:center">' +
      '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:13px">' + esc(name) + '</div>' +
      (desc ? '<div style="font-size:11.5px;opacity:.65;margin-top:2px;line-height:1.45">' + esc(desc) + '</div>' : '') +
      '<div style="font-size:11.5px;margin-top:3px"><b>' + rp(price) + '</b><span style="opacity:.6"> / bulan</span> ' + badge(st, id) + '</div></div>' + actBtn(id, st) + '</div>';
  }

  function viewJelajah() {
    var st = P().STORE, groups = [], by = {};
    st.products.forEach(function (p) { if (!by[p.grp]) { by[p.grp] = []; groups.push(p.grp); } by[p.grp].push(p); });
    var h = '<div style="font-size:12px;opacity:.7;margin-bottom:6px">Sewa hanya fitur yang dibutuhkan. Fitur yang sudah aktif di toko ini tetap gratis.</div>';
    groups.forEach(function (g) {
      h += '<div style="font-weight:900;font-size:12.5px;margin:12px 0 2px;color:#c084fc">' + esc(g) + '</div>';
      by[g].forEach(function (p) { h += row(p.name, p.d, p.price, p.id, state(prodItem(p))); });
    });
    return h;
  }
  function viewPaket() {
    var st = P().STORE, h = '<div style="font-size:12px;opacity:.7;margin-bottom:6px">Paket jenis usaha: beberapa fitur sekaligus dengan harga lebih hemat.</div>';
    st.packs.forEach(function (pk) {
      var sum = pk.items.reduce(function (a, i) { return a + (st.item(i) ? st.item(i).price : 0); }, 0);
      var names = pk.items.map(function (i) { return st.item(i) ? st.item(i).name : ''; }).join(', ');
      var s = state({ id: pk.id });
      h += '<div style="padding:11px 2px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:10px;align-items:center"><div style="flex:1;min-width:0">' +
        '<div style="font-weight:800;font-size:13px">' + esc(pk.name) + '</div><div style="font-size:11.5px;opacity:.65;margin-top:2px;line-height:1.45">' + esc(names) + '</div>' +
        '<div style="font-size:11.5px;margin-top:3px"><b>' + rp(pk.price) + '</b><span style="opacity:.6"> / bulan · hemat ' + rp(sum - pk.price) + ' dari harga satuan</span> ' + badge(s, pk.id) + '</div></div>' + actBtn(pk.id, s) + '</div>';
    });
    var a = st.all, sa = state({ id: a.id });
    h += '<div style="padding:11px 2px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:10px;align-items:center"><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:13px">' + esc(a.name) + '</div>' +
      '<div style="font-size:11.5px;opacity:.65;margin-top:2px">Semua fitur Store aktif. Harga tetap, tidak perlu memilih satu per satu.</div>' +
      '<div style="font-size:11.5px;margin-top:3px"><b>' + rp(a.price) + '</b><span style="opacity:.6"> / bulan</span> ' + badge(sa, a.id) + '</div></div>' + actBtn(a.id, sa) + '</div>';
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
        '<div style="font-size:11.5px;opacity:.7">Sampai ' + esc(dstr(Number(e.until))) + ' · ' + days + ' hari lagi</div></div><button data-sheet="' + esc(id) + '" style="' + BTN + '">Perpanjang</button></div>';
    });
    h += '<div style="font-weight:900;font-size:12.5px;margin:16px 0 2px;color:#c084fc">Permintaan saya</div>';
    if (!reqs.length) h += '<div style="opacity:.6;font-size:12px;padding:8px 2px">Belum ada permintaan.</div>';
    var STT = { BARU: ['Menunggu konfirmasi', '#fbbf24'], AKTIF: ['Sudah diaktifkan', '#4ade80'], DITOLAK: ['Ditolak', '#fb7185'] };
    reqs.slice(0, 20).forEach(function (r) {
      var s = STT[r.status] || STT.BARU, per = r.period === 'tahun' ? 'tahunan' : r.period === 'coba' ? 'coba ' + (P().STORE.trialDays) + ' hari' : 'bulanan';
      h += '<div style="padding:9px 2px;border-top:1px solid rgba(255,255,255,.08)"><div style="display:flex;gap:8px;justify-content:space-between"><b style="font-size:12.5px">' + esc(r.itemName || r.item) + '</b><span style="font-size:11px;font-weight:800;color:' + s[1] + '">' + s[0] + '</span></div>' +
        '<div style="font-size:11.5px;opacity:.65;margin-top:2px">' + esc(per) + ' · ' + rp(r.price) + ' · ' + esc(r.requestedAt || '') + '</div>' +
        (r.note ? '<div style="margin-top:5px;padding:7px 9px;border-radius:10px;background:rgba(168,85,247,.14);font-size:12px;white-space:pre-wrap">' + esc(r.note) + '</div>' : '') + '</div>';
    });
    return h;
  }

  function viewSheet() {
    var st = P().STORE, it = st.item(sheet.id); if (!it) { sheet = null; return ''; }
    var per = sheet.period || 'bulan', canTrial = trialOk(it.id);
    function opt(v, title, sub, price) {
      return '<label style="display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;border:1px solid ' + (per === v ? '#a855f7' : 'rgba(255,255,255,.15)') + ';background:' + (per === v ? 'rgba(168,85,247,.14)' : 'transparent') + ';margin-top:8px;cursor:pointer">' +
        '<input type="radio" name="os-per" value="' + v + '" ' + (per === v ? 'checked' : '') + ' style="accent-color:#a855f7"><span style="flex:1"><b style="font-size:13px">' + title + '</b><span style="display:block;font-size:11px;opacity:.65">' + sub + '</span></span><b style="font-size:13px">' + price + '</b></label>';
    }
    var yr = it.price * 10;
    return '<div style="padding:4px 2px"><div style="font-weight:900;font-size:15px">' + esc(it.name) + '</div>' +
      '<div style="font-size:12px;opacity:.7;margin-top:2px">Pilih lama sewa. Fitur diaktifkan setelah pembayaran dikonfirmasi oleh penyedia aplikasi.</div>' +
      opt('bulan', 'Bulanan', 'Perpanjang tiap bulan', rp(it.price)) +
      opt('tahun', 'Tahunan', 'Bayar 10 bulan, pakai 12 bulan (hemat ' + rp(it.price * 2) + ')', rp(yr)) +
      (canTrial ? opt('coba', 'Coba ' + st.trialDays + ' hari', 'Gratis, sekali untuk tiap fitur', 'Gratis') : '') +
      (note ? '<div style="margin-top:10px;font-size:12px;color:#fbbf24">' + esc(note) + '</div>' : '') +
      '<div style="display:flex;gap:8px;margin-top:14px"><button data-a="back" style="' + BTN + '">Kembali</button><button data-a="send" ' + (sending ? 'disabled ' : '') + 'style="' + BTN + VIO + ';flex:1">' + (sending ? 'Mengirim…' : 'Kirim permintaan') + '</button></div></div>';
  }

  function render() {
    if (!ov || ov.style.display === 'none' || !P()) return;
    var TB = function (id, t) { return '<button data-tab="' + id + '" style="' + BTN + (tab === id && !sheet ? VIO : '') + '">' + t + '</button>'; };
    var body = sheet ? viewSheet() : tab === 'paket' ? viewPaket() : tab === 'punyaku' ? viewPunyaku() : viewJelajah();
    var banner = (P().STORE.loadedSig() !== null && P().STORE.sig() !== P().STORE.loadedSig()) ? '<div style="margin:10px 0;padding:9px 11px;border-radius:12px;background:rgba(34,197,94,.14);font-size:12px;display:flex;gap:8px;align-items:center"><span style="flex:1">Ada perubahan sewa. Muat ulang halaman agar fitur baru tampil.</span><button data-a="reload" style="' + BTN + GREEN + '">Muat ulang</button></div>' : '';
    ov.innerHTML = '<div style="width:100%;max-width:560px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px;' + S + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><div style="font-weight:900;font-size:18px">OneilStore</div><div style="font-size:12px;opacity:.6">Sewa fitur sesuai kebutuhan usaha</div></div><button data-x style="' + BTN + '">Tutup</button></div>' +
      '<div style="display:flex;gap:6px;margin:12px 0 4px;flex-wrap:wrap">' + TB('jelajah', 'Jelajah') + TB('paket', 'Paket') + TB('punyaku', 'Punyaku' + (reqs.some(function (r) { return r.status === 'BARU'; }) ? ' •' : '')) + '</div>' + banner + body + '</div>';
  }

  function send() {
    var st = P().STORE, it = st.item(sheet.id), per = sheet.period || 'bulan';
    if (!it) return;
    if (!hasDb()) { note = 'Tidak bisa mengirim sekarang. Periksa internet atau login ulang.'; return render(); }
    if (pending(it.id)) { note = 'Permintaan untuk fitur ini masih menunggu konfirmasi.'; return render(); }
    if (per === 'coba' && !trialOk(it.id)) { note = 'Masa coba untuk fitur ini sudah pernah dipakai.'; per = 'bulan'; sheet.period = 'bulan'; return render(); }
    if (Date.now() - lastSend < 5000) return;
    var t = tn(), now = Date.now(), price = per === 'coba' ? 0 : per === 'tahun' ? it.price * 10 : it.price;
    var tk = { id: 'store_' + now, type: 'store', tenantId: tid(), tenantName: (t && t.nama) || tid(), item: it.id, itemName: it.name, period: per, price: price, status: 'BARU',
      requestedBy: actor(), role: role(), page: PAGE, ver: ver(), requestedAt: new Date().toLocaleString('id-ID'), timestamp: now };
    sending = true; lastSend = now; render();
    db.collection('provider_tickets').doc(tk.id).set(tk).then(function () {
      sending = false; sheet = null; tab = 'punyaku'; note = ''; start(); render();
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
    });
    ov.addEventListener('change', function (e) { if (e.target.name === 'os-per' && sheet) { sheet.period = e.target.value; note = ''; render(); } });
    document.body.appendChild(ov);
  }
  window.FM_OSTORE = { open: function (t) { if (!P()) return; ensure(); start(); tab = t || 'jelajah'; sheet = null; note = ''; ov.style.display = 'flex'; render(); } };
  function init() { start(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 1500); }); else setTimeout(init, 1500);
})();
