/* tower-lab.js — Rakit Akun, Reset Statistik, Template, Ubah ID, dan status Published (hanya halaman Tower).
   Data catatan uji & status Published disimpan di koleksi tower_lab/<id toko> dan template di tower_templates
   (koleksi di luar aturan toko, jadi hanya Tower yang bisa membaca/menulis). Klien tidak melihat apa pun dari sini. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;

  var COL = 'tower_lab', TPL = 'tower_templates';
  var labMap = {}, tplMap = {}, listening = false, cur = null;
  var ALWAYS_ON = ['wallpaper', 'theme'];
  var BTN = 'padding:8px 12px;border-radius:12px;font-weight:800;font-size:12px;color:#fff;border:0;cursor:pointer;';
  var INP = 'width:100%;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:12px;outline:none;';

  function H(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function DB() { return (typeof db !== 'undefined' && db) ? db : null; }
  function FV() { return firebase.firestore.FieldValue; }
  function T(id) { return (typeof TENANTS_CONFIG !== 'undefined') ? TENANTS_CONFIG[String(id).toLowerCase()] : null; }
  function lab(id) { return labMap[id] || {}; }
  function isPub(id) { return !!lab(id).published; }
  function usable(t) { return t && !t.isMaster && !t.isSinglePage && !t.deletedByTower && isManaged(t); }
  function allTenants() { return listNetworkTenants().filter(usable); }
  function fail(e) { alert('Gagal: ' + (e && e.message ? e.message : e)); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- daftar fitur yang bisa diuji ---------- */
  function optFeatures() {
    return FM_PLANS.FEATURES.filter(function (f) { return !f.soon && FM_PLANS.ROLES.some(function (r) { return f.r[r] === 'o'; }); });
  }
  function featRoles(f) { return FM_PLANS.ROLES.filter(function (r) { return f.r[r] === 'o'; }); }
  function isOn(f, t) { return featRoles(f).some(function (r) { return FM_PLANS.has(f.key, r, t); }); }
  var RL = { kasir: 'Admin', manager: 'Manager', owner: 'Owner' };

  /* status tampil: lolos | uji | gagal | terlewat (aktif tapi belum diuji) | belum (belum diaktifkan) */
  function stateOf(f, t, L) {
    var it = (L.items || {})[f.key] || {};
    if (it.s === 'gagal') return 'gagal';
    if (it.s === 'uji') return 'uji';
    if (it.s === 'lolos') return 'lolos';
    return isOn(f, t) ? 'terlewat' : 'belum';
  }
  function summary(id) {
    var t = T(id), L = lab(id), c = { lolos: 0, uji: 0, gagal: 0, terlewat: 0, belum: 0 }, names = { gagal: [], terlewat: [], uji: [] };
    if (!t) return { c: c, scope: 0, names: names };
    optFeatures().forEach(function (f) {
      var s = stateOf(f, t, L); c[s]++;
      if (names[s]) names[s].push(f.label.length > 46 ? f.label.slice(0, 44) + '…' : f.label);
    });
    return { c: c, scope: c.lolos + c.uji + c.gagal + c.terlewat, names: names };
  }

  /* ---------- tanda di daftar toko ---------- */
  function badge(id) {
    var t = T(id); if (!usable(t)) return '';
    if (isPub(id)) return '<span title="Sudah diserahkan ke klien: Reset dan Ubah ID terkunci" class="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">PUBLISHED</span>';
    var s = summary(id), bad = s.c.gagal + s.c.terlewat;
    return '<span title="Masih tahap uji coba' + (bad ? ': ada ' + bad + ' fitur gagal / terlewat' : '') + '" class="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/30">UJI COBA' + (bad ? ' !' : '') + '</span>';
  }

  /* ---------- listener ---------- */
  function refresh() {
    try { if (typeof renderUMKMDirectory === 'function') renderUMKMDirectory(); } catch (e) {}
    if (cur && document.getElementById('tw-lab')) {
      var ae = document.activeElement;
      if (cur.kind === 'rakit' && !(ae && ae.closest && ae.closest('#tw-lab') && /INPUT|TEXTAREA/.test(ae.tagName))) renderRakit();
    }
  }
  function listen() {
    if (listening) return;
    var d = DB(), u = window.FM_AUTH && FM_AUTH.curUser();
    if (!d || !u) return;
    listening = true;
    d.collection(COL).onSnapshot(function (s) { labMap = {}; s.forEach(function (x) { labMap[x.id] = x.data(); }); refresh(); }, function () { listening = false; });
    d.collection(TPL).onSnapshot(function (s) { tplMap = {}; s.forEach(function (x) { var v = x.data(); v._id = x.id; tplMap[x.id] = v; }); if (cur && cur.kind === 'template') renderTemplate(); }, function () {});
  }
  setInterval(listen, 2500); setTimeout(listen, 800);

  /* ---------- pemilih toko ---------- */
  function pick(title, sub, filter, cb, hint) {
    var ov = towerOverlay('tw-lab-pick', title, sub,
      '<div style="padding:0 18px 10px"><input id="lp-q" placeholder="Cari nama atau ID toko" style="' + INP + '"></div><div id="lp-l" style="overflow:auto;padding:0 12px 14px"></div>');
    var q = ov.el.querySelector('#lp-q'), L = ov.el.querySelector('#lp-l');
    function draw() {
      var k = q.value.trim().toLowerCase(); L.innerHTML = '';
      var list = allTenants().filter(function (t) { return (!filter || filter(t)) && (!k || (t.id + ' ' + (t.nama || '')).toLowerCase().indexOf(k) >= 0); });
      if (!list.length) { L.innerHTML = '<div style="padding:18px;text-align:center;opacity:.6;font-size:13px">Tidak ada toko yang cocok</div>'; return; }
      list.forEach(function (t) {
        var b = document.createElement('button');
        b.style.cssText = 'display:flex;width:100%;align-items:center;justify-content:space-between;gap:10px;text-align:left;padding:11px 12px;margin-bottom:6px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff';
        b.innerHTML = '<span><span style="font-weight:800;font-size:13px">' + H(t.nama || t.id) + '</span><span style="display:block;opacity:.6;font-size:11px;font-family:monospace">' + H(t.id) + '</span></span>' + badge(t.id);
        b.onclick = function () { ov.close(); cb(t); };
        L.appendChild(b);
      });
    }
    q.oninput = draw; draw(); setTimeout(function () { q.focus(); }, 50);
    if (hint) { var h = document.createElement('div'); h.style.cssText = 'padding:0 18px 12px;font-size:11px;opacity:.65'; h.textContent = hint; ov.el.firstChild.insertBefore(h, ov.el.querySelector('#lp-l')); }
  }
  function lockedMsg(t) { alert(t.nama + ' [' + t.id + '] sudah Published (diserahkan ke klien), jadi tindakan ini dikunci supaya data klien tidak terhapus.\n\nJika memang perlu, cabut dulu status Published lewat menu Published.'); }

  /* =====================================================================
     1. RAKIT AKUN
     ===================================================================== */
  function openRakit(t) {
    cur = { kind: 'rakit', id: t.id };
    towerOverlay('tw-lab', 'Rakit Akun', H(t.nama) + ' [' + t.id + ']', '<div id="rk-body" style="overflow:auto;padding:0 18px 16px"></div>');
    var box = document.getElementById('tw-lab'); box.firstChild.style.width = 'min(760px,100%)';
    var x = box.querySelector('[data-x]'); var old = x.onclick; x.onclick = function () { cur = null; old(); };
    box.onclick = function (e) { if (e.target === box) { cur = null; box.remove(); } };
    renderRakit();
  }
  var CHIP = {
    lolos: ['Lolos', 'rgba(16,185,129,.2)', '#6ee7b7'],
    uji: ['Sedang diuji', 'rgba(59,130,246,.22)', '#93c5fd'],
    gagal: ['Gagal / ada bug', 'rgba(244,63,94,.22)', '#fda4af'],
    terlewat: ['Terlewat: aktif, belum diuji', 'rgba(245,158,11,.22)', '#fcd34d'],
    belum: ['Belum diaktifkan', 'rgba(148,163,184,.15)', '#94a3b8']
  };
  function chip(s) { var c = CHIP[s]; return '<span style="font-size:10px;font-weight:900;padding:3px 9px;border-radius:99px;white-space:nowrap;background:' + c[1] + ';color:' + c[2] + '">' + c[0] + '</span>'; }

  function renderRakit() {
    var box = document.getElementById('rk-body'); if (!box || !cur) return;
    var t = T(cur.id); if (!t) return;
    var L = lab(t.id), s = summary(t.id), c = s.c, N = s.scope;
    var seg = function (n, col) { return n ? '<div title="' + n + '" style="flex:' + n + ';background:' + col + '"></div>' : ''; };
    var bar = '<div style="display:flex;height:14px;border-radius:99px;overflow:hidden;background:rgba(255,255,255,.08)">' +
      (N ? seg(c.lolos, '#10b981') + seg(c.uji, '#3b82f6') + seg(c.terlewat, '#f59e0b') + seg(c.gagal, '#f43f5e') : '') + '</div>';
    var line = N ? (c.lolos + ' dari ' + N + ' fitur lolos uji') : 'Belum ada fitur aktif. Tekan "Aktifkan fitur berikutnya" untuk mulai.';
    var warn = '';
    if (c.gagal) warn += '<div style="margin-top:8px;padding:9px 11px;border-radius:12px;background:rgba(244,63,94,.14);border:1px solid rgba(244,63,94,.4);color:#fecdd3;font-size:12px"><b>' + c.gagal + ' fitur gagal / ada bug:</b> ' + H(s.names.gagal.join(', ')) + '</div>';
    if (c.terlewat) warn += '<div style="margin-top:8px;padding:9px 11px;border-radius:12px;background:rgba(245,158,11,.14);border:1px solid rgba(245,158,11,.4);color:#fde68a;font-size:12px"><b>' + c.terlewat + ' fitur terlewat</b> (sudah aktif di toko tapi belum pernah diuji): ' + H(s.names.terlewat.join(', ')) + '</div>';
    if (c.uji) warn += '<div style="margin-top:8px;padding:9px 11px;border-radius:12px;background:rgba(59,130,246,.14);border:1px solid rgba(59,130,246,.4);color:#bfdbfe;font-size:12px"><b>' + c.uji + ' fitur masih diuji:</b> ' + H(s.names.uji.join(', ')) + '</div>';
    if (N && !c.gagal && !c.terlewat && !c.uji) warn += '<div style="margin-top:8px;padding:9px 11px;border-radius:12px;background:rgba(16,185,129,.14);border:1px solid rgba(16,185,129,.4);color:#a7f3d0;font-size:12px"><b>Semua fitur aktif sudah lolos uji.</b> Toko siap diserahkan.</div>';

    var rows = optFeatures().map(function (f) {
      var st = stateOf(f, t, L), it = (L.items || {})[f.key] || {}, on = isOn(f, t), fixed = ALWAYS_ON.indexOf(f.key) >= 0;
      var inScope = st !== 'belum';
      return '<div style="padding:9px 10px;margin-bottom:6px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid ' + (st === 'gagal' ? 'rgba(244,63,94,.5)' : st === 'terlewat' ? 'rgba(245,158,11,.5)' : 'rgba(255,255,255,.08)') + ';' + (st === 'belum' ? 'opacity:.7' : '') + '">' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:200px"><div style="font-size:12.5px;font-weight:700">' + H(f.label) + '</div>' +
        '<div style="font-size:10.5px;opacity:.6">' + featRoles(f).map(function (r) { return RL[r]; }).join(' · ') + '</div></div>' + chip(st) + '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:7px;align-items:center">' +
        (fixed ? '<span style="font-size:10.5px;opacity:.6">Selalu aktif</span>' :
          '<button data-act="tog" data-k="' + f.key + '" style="' + BTN + 'background:' + (on ? '#475569' : '#0891b2') + '">' + (on ? 'Matikan' : 'Aktifkan') + '</button>') +
        (inScope ? '<button data-act="lolos" data-k="' + f.key + '" style="' + BTN + 'background:#059669">Lolos</button>' +
          '<button data-act="gagal" data-k="' + f.key + '" style="' + BTN + 'background:#e11d48">Ada bug</button>' +
          '<button data-act="uji" data-k="' + f.key + '" style="' + BTN + 'background:#2563eb">Sedang diuji</button>' +
          '<input data-note="' + f.key + '" value="' + H(it.note || '') + '" placeholder="Catatan (mis. tombol simpan tidak merespons)" style="' + INP + 'flex:1;min-width:160px;width:auto">' : '') +
        '</div></div>';
    }).join('');

    box.innerHTML =
      '<div style="font-size:12px;opacity:.7;margin-bottom:6px">' + line + '</div>' + bar + warn +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">' +
      '<button data-act="next" style="' + BTN + 'background:#0891b2">Aktifkan fitur berikutnya</button>' +
      '<button data-act="clear" style="' + BTN + 'background:#334155">Mulai dari awal (hanya fitur inti)</button>' +
      '<button data-act="pub" style="' + BTN + 'background:#059669">' + (isPub(t.id) ? 'Status Published…' : 'Serahkan / Published…') + '</button></div>' +
      '<div style="font-size:11px;opacity:.6;margin-bottom:8px">Urutan kerja: Aktifkan satu fitur, uji di akun toko, tekan Lolos atau Ada bug. Fitur yang sudah aktif tapi belum diberi hasil tampil sebagai Terlewat.</div>' + rows;
    wire(box, t);
  }
  function wire(box, t) {
    [].slice.call(box.querySelectorAll('[data-act]')).forEach(function (b) {
      b.onclick = function () {
        var a = b.getAttribute('data-act'), k = b.getAttribute('data-k');
        if (a === 'tog') return toggleFeat(t, k);
        if (a === 'lolos' || a === 'gagal' || a === 'uji') return setStatus(t.id, k, a);
        if (a === 'next') return nextFeat(t);
        if (a === 'clear') return clearFeats(t);
        if (a === 'pub') return openPublish(t);
      };
    });
    [].slice.call(box.querySelectorAll('[data-note]')).forEach(function (i) {
      i.onchange = function () {
        var k = i.getAttribute('data-note'), it = (lab(t.id).items || {})[k] || {};
        var o = {}; o[k] = { s: it.s || 'uji', note: i.value.trim(), ts: Date.now() };
        DB().collection(COL).doc(t.id).set({ items: o }, { merge: true }).catch(fail);
      };
    });
  }
  function setStatus(id, key, s) {
    var it = (lab(id).items || {})[key] || {}, o = {}; o[key] = { s: s, note: it.note || '', ts: Date.now() };
    return DB().collection(COL).doc(id).set({ items: o }, { merge: true }).catch(fail);
  }
  function saveFeats(t, feats, detail, key) {
    return towerSaveFeatures(t, feats).then(function () { t.features = feats; ctAudit(t.id, 'FITUR_RAKIT', detail, '-', key || '-'); }).catch(fail);
  }
  function toggleFeat(t, key) {
    var f = optFeatures().filter(function (x) { return x.key === key; })[0]; if (!f) return;
    var on = !isOn(f, t), feats = towerEffFeatures(t); feats[key] = feats[key] || {};
    featRoles(f).forEach(function (r) { feats[key][r] = on; });
    saveFeats(t, feats, 'Rakit: fitur "' + f.label + '" ' + (on ? 'diaktifkan' : 'dimatikan'), key).then(function () {
      if (on && !(lab(t.id).items || {})[key]) return setStatus(t.id, key, 'uji');
    }).then(function () { renderRakit(); });
  }
  function nextFeat(t) {
    var L = lab(t.id), f = optFeatures().filter(function (x) { return stateOf(x, t, L) === 'belum' && ALWAYS_ON.indexOf(x.key) < 0; })[0];
    if (!f) return alert('Semua fitur sudah diaktifkan.');
    toggleFeat(t, f.key);
  }
  function clearFeats(t) {
    if (!confirm('Mulai dari awal?\n\nSemua fitur tambahan dimatikan (fitur inti tetap). Catatan uji lama tetap tersimpan.')) return;
    saveFeats(t, FM_PLANS.tierDefaults('basic'), 'Rakit: mulai dari awal (hanya fitur inti)', 'basic').then(renderRakit);
  }

  /* =====================================================================
     2. RESET STATISTIK
     ===================================================================== */
  function delWhere(col, field, val) {
    return DB().collection(col).where(field, '==', val).limit(400).get().then(function (snap) {
      if (snap.empty) return;
      var b = DB().batch(); snap.forEach(function (d) { b.delete(d.ref); });
      return b.commit().then(function () { if (snap.size >= 400) return delWhere(col, field, val); });
    });
  }
  function eachChunk(col, fn) {
    return DB().collection(col).get().then(function (snap) {
      var docs = []; snap.forEach(function (d) { docs.push(d); });
      var p = Promise.resolve();
      for (var i = 0; i < docs.length; i += 400) (function (part) { p = p.then(function () { var b = DB().batch(); part.forEach(function (d) { fn(b, d); }); return b.commit(); }); })(docs.slice(i, i + 400));
      return p.then(function () { return docs.length; });
    });
  }
  function zeroStock(id) {
    return eachChunk('tp_' + id, function (b, d) { b.update(d.ref, { stock: 0, openStock: 0, endStock: null }); });
  }
  function openReset(t) {
    var n = 0; try { n = getTenantTxList(t.id).length; } catch (e) {}
    var rows = [
      ['tx', 'Transaksi dan penjualan (' + n + ' tercatat)', 1],
      ['stok', 'Jumlah stok jadi 0 (daftar produk, harga modal, dan harga jual tetap)', 1],
      ['closing', 'Closing stok mingguan', 1],
      ['gaji', 'Catatan gaji', 1],
      ['audit', 'Riwayat audit', 1],
      ['tiket', 'Permohonan terminal kasir', 1],
      ['katalog', 'Hapus juga daftar produk (biasanya JANGAN dicentang)', 0]
    ].map(function (r) { return '<label style="display:flex;gap:9px;align-items:center;padding:7px 4px;font-size:12.5px"><input type="checkbox" data-o="' + r[0] + '" ' + (r[2] ? 'checked' : '') + ' style="width:16px;height:16px"><span>' + r[1] + '</span></label>'; }).join('');
    var ov = towerOverlay('tw-lab', 'Reset Statistik', H(t.nama) + ' [' + t.id + ']',
      '<div style="overflow:auto;padding:0 18px 16px"><div style="font-size:12px;opacity:.75;margin-bottom:6px">Yang <b>tidak</b> disentuh: paket, fitur, usaha, tema, logo, COA, target, kuota, akun login dan PIN.</div>' + rows +
      '<div style="margin-top:10px;font-size:12px">Ketik <b style="font-family:monospace">' + H(t.id) + '</b> untuk konfirmasi:</div><input id="rs-c" style="' + INP + 'margin-top:5px;font-family:monospace" autocomplete="off">' +
      '<div id="rs-log" style="margin-top:10px;font-size:12px;opacity:.8;min-height:16px"></div>' +
      '<button id="rs-go" style="' + BTN + 'background:#e11d48;margin-top:10px;width:100%">Reset sekarang</button></div>');
    var go = ov.el.querySelector('#rs-go'), log = ov.el.querySelector('#rs-log');
    go.onclick = function () {
      if (isPub(t.id)) return lockedMsg(t);
      if (ov.el.querySelector('#rs-c').value.trim().toUpperCase() !== String(t.id).toUpperCase()) return alert('Konfirmasi belum cocok. Ketik ID toko persis.');
      var o = {}; [].slice.call(ov.el.querySelectorAll('[data-o]')).forEach(function (i) { o[i.getAttribute('data-o')] = i.checked; });
      if (!Object.keys(o).some(function (k) { return o[k]; })) return alert('Centang minimal satu hal yang mau di-reset.');
      go.disabled = true;
      runReset(t, o, function (m) { log.textContent = m; }).then(function () {
        log.innerHTML = '<b style="color:#6ee7b7">Selesai. Statistik toko sudah kembali ke 0, pengaturan tidak berubah.</b>';
        go.style.display = 'none';
      }).catch(function (e) { go.disabled = false; log.innerHTML = '<span style="color:#fda4af">Gagal: ' + H(e && e.message) + '</span>'; });
    };
  }
  function runReset(t, o, say) {
    var id = t.id, d = DB(), steps = [];
    var add = function (label, fn) { steps.push([label, fn]); };
    if (o.tx) add('Menghapus transaksi', function () { return deleteCollectionChunks('tx_' + id); });
    if (o.gaji) add('Menghapus catatan gaji', function () { return deleteCollectionChunks('gaji_' + id); });
    if (o.katalog) add('Menghapus daftar produk', function () { return deleteCollectionChunks('tp_' + id); });
    else if (o.stok) add('Mengosongkan jumlah stok', function () { return zeroStock(id); });
    if (o.closing) add('Menghapus closing stok', function () { return d.collection('tenant_settings').doc(id).set({ stockClosings: FV().delete() }, { merge: true }); });
    if (o.audit) add('Menghapus riwayat audit', function () { return delWhere('manager_audit_logs', 'tenantId', id); });
    if (o.tiket) add('Menghapus permohonan terminal', function () { return delWhere('provider_tickets', 'tenantId', id); });
    add('Membersihkan sesi lama', function () { return delWhere('tenant_presence', 'tenantId', id); });
    var p = Promise.resolve();
    steps.forEach(function (s, i) { p = p.then(function () { say('(' + (i + 1) + '/' + steps.length + ') ' + s[0] + '…'); return s[1](); }); });
    return p.then(function () {
      try { localStorage.removeItem('fm_v11_tx_' + id); } catch (e) {}
      try { if (typeof tenantTxMap !== 'undefined' && o.tx) tenantTxMap[id] = []; } catch (e) {}
      var what = Object.keys(o).filter(function (k) { return o[k]; }).join(', ');
      return d.collection(COL).doc(id).set({ lastResetAt: Date.now(), lastResetWhat: what }, { merge: true }).then(function () {
        ctAudit(id, 'RESET_STATISTIK', 'Tower mereset statistik uji coba: ' + what, '-', 'reset');
        try { refreshProviderViews(); } catch (e) {}
      });
    });
  }

  /* =====================================================================
     3. PUBLISHED
     ===================================================================== */
  function openPublish(t) {
    var s = summary(t.id), c = s.c, pub = isPub(t.id), n = 0; try { n = getTenantTxList(t.id).length; } catch (e) {}
    var probs = [];
    if (c.gagal) probs.push(c.gagal + ' fitur gagal / ada bug (' + s.names.gagal.join(', ') + ')');
    if (c.terlewat) probs.push(c.terlewat + ' fitur terlewat, belum diuji (' + s.names.terlewat.join(', ') + ')');
    if (c.uji) probs.push(c.uji + ' fitur masih diuji (' + s.names.uji.join(', ') + ')');
    var body;
    if (pub) {
      var when = lab(t.id).publishedAt ? new Date(lab(t.id).publishedAt).toLocaleString('id-ID') : '-';
      body = '<div style="overflow:auto;padding:0 18px 16px"><div style="padding:10px 12px;border-radius:12px;background:rgba(16,185,129,.14);border:1px solid rgba(16,185,129,.4);font-size:12.5px"><b style="color:#6ee7b7">PUBLISHED</b> sejak ' + H(when) + '. Reset Statistik dan Ubah ID terkunci.</div>' +
        '<div style="margin-top:12px;font-size:12px">Hanya jika benar-benar perlu, ketik <b style="font-family:monospace">' + H(t.id) + '</b> untuk mencabut status:</div><input id="pb-c" style="' + INP + 'margin-top:5px;font-family:monospace" autocomplete="off">' +
        '<button id="pb-go" style="' + BTN + 'background:#e11d48;margin-top:10px;width:100%">Cabut status Published</button></div>';
    } else {
      body = '<div style="overflow:auto;padding:0 18px 16px"><div style="font-size:12.5px;opacity:.85">Setelah ditandai Published, <b>Reset Statistik</b> dan <b>Ubah ID</b> dikunci untuk toko ini, supaya data klien tidak terhapus karena salah pencet.</div>' +
        (probs.length ? '<div style="margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(245,158,11,.14);border:1px solid rgba(245,158,11,.45);font-size:12px;color:#fde68a"><b>Perhatian, uji coba belum bersih:</b><ul style="margin:6px 0 0 16px;list-style:disc">' + probs.map(function (p) { return '<li>' + H(p) + '</li>'; }).join('') + '</ul>' +
          '<label style="display:flex;gap:8px;margin-top:8px;align-items:center"><input type="checkbox" id="pb-ok" style="width:16px;height:16px"><span>Saya tahu, serahkan tetap</span></label></div>' :
          '<div style="margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(16,185,129,.14);border:1px solid rgba(16,185,129,.4);font-size:12px;color:#a7f3d0">Semua fitur aktif sudah lolos uji.</div>') +
        '<label style="display:flex;gap:8px;margin-top:12px;align-items:center;font-size:12.5px"><input type="checkbox" id="pb-rs" ' + (n > 0 ? 'checked' : '') + ' style="width:16px;height:16px"><span>Reset statistik uji coba dulu (transaksi, stok jadi 0, closing, gaji, audit)' + (n ? ' — ' + n + ' transaksi tercatat' : '') + '</span></label>' +
        '<div id="pb-log" style="margin-top:8px;font-size:12px;min-height:14px"></div>' +
        '<button id="pb-go" style="' + BTN + 'background:#059669;margin-top:10px;width:100%">Tandai Published</button></div>';
    }
    var ov = towerOverlay('tw-lab-pub', pub ? 'Status Published' : 'Serahkan ke klien', H(t.nama) + ' [' + t.id + ']', body);
    var go = ov.el.querySelector('#pb-go'), d = DB();
    go.onclick = function () {
      if (pub) {
        if (ov.el.querySelector('#pb-c').value.trim().toUpperCase() !== String(t.id).toUpperCase()) return alert('Konfirmasi belum cocok.');
        d.collection(COL).doc(t.id).set({ published: false, unpublishedAt: Date.now() }, { merge: true }).then(function () { ctAudit(t.id, 'CABUT_PUBLISHED', 'Status Published dicabut', 'PUBLISHED', 'UJI COBA'); ov.close(); }).catch(fail);
        return;
      }
      if (probs.length && !ov.el.querySelector('#pb-ok').checked) return alert('Masih ada fitur gagal / terlewat. Perbaiki dulu, atau centang "Saya tahu, serahkan tetap".');
      var doReset = ov.el.querySelector('#pb-rs').checked, log = ov.el.querySelector('#pb-log');
      go.disabled = true;
      var p = doReset ? runReset(t, { tx: true, stok: true, closing: true, gaji: true, audit: true, tiket: true }, function (m) { log.textContent = m; }) : Promise.resolve();
      p.then(function () {
        return d.collection(COL).doc(t.id).set({ published: true, publishedAt: Date.now() }, { merge: true });
      }).then(function () { ctAudit(t.id, 'PUBLISHED', 'Toko diserahkan ke klien' + (doReset ? ' (statistik direset)' : ''), 'UJI COBA', 'PUBLISHED'); ov.close(); })
        .catch(function (e) { go.disabled = false; log.innerHTML = '<span style="color:#fda4af">Gagal: ' + H(e && e.message) + '</span>'; });
    };
  }

  /* =====================================================================
     4. UBAH ID
     ===================================================================== */
  function openRename(t) {
    var ov = towerOverlay('tw-lab', 'Ubah ID Toko', H(t.nama) + ' [' + t.id + ']',
      '<div style="overflow:auto;padding:0 18px 16px"><div style="font-size:12px;opacity:.8;line-height:1.5">Semua data dipindah ke ID baru (transaksi, stok, pengaturan, logo, kuota, billing). Dampaknya:<ul style="margin:6px 0 0 16px;list-style:disc"><li>Link toko berubah ke ID baru, link lama tidak berlaku.</li><li>Akun login dibuat ulang dengan PIN acak baru (ditampilkan sekali di akhir).</li><li>Perangkat yang sedang login terlempar ke halaman login.</li></ul></div>' +
      '<div style="margin-top:12px;font-size:12px">ID baru (ID + 8 atau 9 angka):</div><input id="rn-id" placeholder="ID261113501" style="' + INP + 'margin-top:5px;font-family:monospace" autocomplete="off">' +
      '<div id="rn-log" style="margin-top:10px;font-size:12px;min-height:16px"></div>' +
      '<button id="rn-go" style="' + BTN + 'background:#7c3aed;margin-top:10px;width:100%">Ubah ID sekarang</button></div>');
    var go = ov.el.querySelector('#rn-go'), log = ov.el.querySelector('#rn-log');
    go.onclick = function () {
      if (isPub(t.id)) return lockedMsg(t);
      var nid = ov.el.querySelector('#rn-id').value.trim().toUpperCase();
      if (!/^ID\d{8,9}$/.test(nid)) return alert('Format ID harus ID diikuti 8 atau 9 angka, contoh ID261113501.');
      if (nid === String(t.id).toUpperCase()) return alert('ID baru sama dengan ID sekarang.');
      if (T(nid) || (typeof formerMap !== 'undefined' && formerMap[nid.toLowerCase()])) return alert('ID ' + nid + ' sudah pernah dipakai (aktif atau arsip).');
      if (!confirm('Ubah ID ' + t.id + ' menjadi ' + nid + '?\n\nProses ini memindahkan seluruh data dan membuat PIN baru. Jangan tutup halaman sampai selesai.')) return;
      go.disabled = true;
      runRename(t, nid, function (m) { log.textContent = m; }).then(function (res) {
        showRenameResult(ov, res);
      }).catch(function (e) { go.disabled = false; log.innerHTML = '<span style="color:#fda4af">Gagal: ' + H(e && e.message) + '. Data ID lama masih utuh.</span>'; });
    };
  }
  function copyCol(from, to, oldId, newId) {
    var up = String(oldId).toUpperCase();
    return Promise.resolve().then(function () {
      return DB().collection(from).get().then(function (snap) {
        var docs = []; snap.forEach(function (d) { docs.push(d); });
        var p = Promise.resolve();
        for (var i = 0; i < docs.length; i += 400) (function (part) {
          p = p.then(function () {
            var b = DB().batch();
            part.forEach(function (d) {
              var x = Object.assign({}, d.data());
              ['tenantId', 'tenant', 'tid', 'idToko'].forEach(function (k) { if (typeof x[k] === 'string' && x[k].toUpperCase() === up) x[k] = newId; });
              b.set(DB().collection(to).doc(d.id), x);
            });
            return b.commit();
          });
        })(docs.slice(i, i + 400));
        return p;
      });
    });
  }
  function copyDoc(col, oldId, newId, patch) {
    return DB().collection(col).doc(oldId).get().then(function (s) {
      if (!s.exists) return;
      return DB().collection(col).doc(newId).set(Object.assign({}, s.data(), patch || {}));
    });
  }
  function retarget(col, field, oldId, newId) {
    return DB().collection(col).where(field, '==', oldId).limit(400).get().then(function (snap) {
      if (snap.empty) return;
      var b = DB().batch(); snap.forEach(function (d) { var o = {}; o[field] = newId; b.update(d.ref, o); });
      return b.commit().then(function () { if (snap.size >= 400) return retarget(col, field, oldId, newId); });
    });
  }
  function runRename(t, nid, say) {
    var d = DB(), oid = t.id, okey = String(oid).toLowerCase(), nkey = nid.toLowerCase(), step = 0, total = 9;
    var S = function (m) { say('(' + (++step) + '/' + total + ') ' + m + '…'); };
    var roles = [], oldUids = [], cfgNew = null;
    return d.collection('tenants_registry').doc(nkey).get().then(function (s) {
      if (s.exists) throw new Error('ID baru sudah terdaftar di server.');
      return d.collection('tenant_ctrl').doc(nid).get();
    }).then(function (s) {
      if (s.exists) throw new Error('ID baru sudah memiliki data kontrol di server.');
      S('Membaca akun login lama');
      return d.collection('tenant_access_cfg').doc(oid).get();
    }).then(function (s) {
      var c = s.exists ? s.data() : {}; var u = c.uid || {};
      Object.keys(u).forEach(function (r) { roles.push(r); oldUids.push(u[r]); });
      S('Menyalin transaksi'); return copyCol('tx_' + oid, 'tx_' + nid, oid, nid);
    }).then(function () { S('Menyalin stok dan produk'); return copyCol('tp_' + oid, 'tp_' + nid, oid, nid); })
      .then(function () { return copyCol('gaji_' + oid, 'gaji_' + nid, oid, nid); })
      .then(function () {
        S('Menyalin pengaturan, logo, kuota, dan billing');
        return Promise.all([copyDoc('tenant_settings', oid, nid), copyDoc('tenant_logos', oid, nid), copyDoc('tenant_ctrl', oid, nid), copyDoc(COL, oid, nid, { published: false })]);
      }).then(function () {
        S('Mendaftarkan ID baru');
        cfgNew = JSON.parse(JSON.stringify(t)); delete cfgNew.fromRegistry; cfgNew.id = nid;
        return d.collection('tenants_registry').doc(nkey).set({ id: nid, nama: cfgNew.nama, json: JSON.stringify(cfgNew), createdAt: FV().serverTimestamp() });
      }).then(function () {
        S('Membuat akun login baru');
        var map = {}, pins = {}; roles.forEach(function (r) { pins[r] = FM_AUTH.randomPin(); map[r] = pins[r]; });
        if (!roles.length) return { pins: {}, made: [] };
        return FM_AUTH.provisionMany(nid, map).then(function (done) { return { pins: pins, made: done }; }, function (e) { return { pins: pins, made: [], err: e }; });
      }).then(function (acc) {
        S('Memindahkan riwayat dan tiket');
        return Promise.all([retarget('manager_audit_logs', 'tenantId', oid, nid), retarget('provider_tickets', 'tenantId', oid, nid), retarget('provider_notices', 'targetTenant', oid, nid), delWhere('tenant_presence', 'tenantId', oid)]).then(function () { return acc; });
      }).then(function (acc) {
        S('Menghapus ID lama');
        var tasks = [deleteCollectionChunks('tx_' + oid), deleteCollectionChunks('tp_' + oid), deleteCollectionChunks('gaji_' + oid)];
        var b = d.batch();
        ['tenant_settings', 'tenant_logos', 'tenant_ctrl', COL, 'tenant_access_cfg'].forEach(function (c) { b.delete(d.collection(c).doc(oid)); });
        b.delete(d.collection('tenants_registry').doc(okey));
        oldUids.forEach(function (u) { if (u) b.delete(d.collection('tenant_access').doc(u)); });
        b.set(d.collection('former_tenants').doc(okey), { id: oid, nama: t.nama, endedAt: Date.now(), purgedAt: Date.now(), status: 'purged', downloadRequested: false, movedTo: nid });
        tasks.push(b.commit());
        return Promise.all(tasks).then(function () { return acc; });
      }).then(function (acc) {
        S('Memperbarui tampilan Tower');
        try { if (tenantUnsubs[oid]) { tenantUnsubs[oid](); delete tenantUnsubs[oid]; } delete tenantTxMap[oid]; } catch (e) {}
        try { delete TENANTS_CONFIG[okey]; } catch (e) {}
        try { registryMergeLocal(cfgNew); } catch (e) {}
        ctAudit(nid, 'UBAH_ID', 'ID toko diubah dari ' + oid + ' menjadi ' + nid, oid, nid);
        try { refreshProviderViews(); } catch (e) {}
        return { nid: nid, pins: acc.pins, made: acc.made, err: acc.err };
      }).catch(function (e) {
        /* gagal sebelum ID lama dihapus: bersihkan salinan di ID baru supaya tidak tertinggal */
        return Promise.all([deleteCollectionChunks('tx_' + nid), deleteCollectionChunks('tp_' + nid), deleteCollectionChunks('gaji_' + nid)]).catch(function () {})
          .then(function () { if (step < 6) { var b = d.batch(); ['tenant_settings', 'tenant_logos', 'tenant_ctrl', COL].forEach(function (c) { b.delete(d.collection(c).doc(nid)); }); b.delete(d.collection('tenants_registry').doc(nkey)); return b.commit().catch(function () {}); } })
          .then(function () { throw e; });
      });
  }
  function showRenameResult(ov, res) {
    var link = tenantLink(res.nid), RLN = { staff: 'Admin', manager: 'Manager', owner: 'Owner', partner: 'Partner' };
    var pins = Object.keys(res.pins).map(function (r) { return (RLN[r] || r) + ': ' + res.pins[r] + (res.made.indexOf(r) < 0 ? ' (GAGAL dibuat, buat ulang lewat menu Akun Login)' : ''); }).join('\n');
    var box = ov.el.firstChild;
    box.innerHTML = '<div style="padding:18px"><div style="font-weight:900;font-size:16px;color:#6ee7b7">ID berhasil diubah menjadi ' + H(res.nid) + '</div>' +
      '<div style="margin-top:10px;font-size:12px;opacity:.8">Link baru:</div><input readonly value="' + H(link) + '" style="' + INP + 'font-family:monospace;color:#67e8f9">' +
      (pins ? '<div style="margin-top:12px;font-size:12px;opacity:.8">PIN baru (catat sekarang, tidak ditampilkan lagi):</div><textarea readonly rows="' + (Object.keys(res.pins).length + 1) + '" style="' + INP + 'font-family:monospace">' + H(pins) + '</textarea>' : '<div style="margin-top:12px;font-size:12px;opacity:.8">Toko ini belum punya akun login. Buat lewat menu Akun Login.</div>') +
      (res.err ? '<div style="margin-top:8px;font-size:12px;color:#fda4af">Sebagian akun gagal dibuat: ' + H(res.err.message) + '</div>' : '') +
      '<button id="rn-ok" style="' + BTN + 'background:#334155;margin-top:12px;width:100%">Tutup</button></div>';
    box.querySelector('#rn-ok').onclick = function () { ov.close(); };
  }

  /* =====================================================================
     5. TEMPLATE (simpan & salin pengaturan)
     ===================================================================== */
  var PARTS = [
    ['fitur', 'Fitur per peran', 1], ['usaha', 'Daftar usaha (Banyak Usaha)', 1], ['tampilan', 'Warna toko', 1],
    ['coa', 'Daftar akun (COA)', 1], ['target', 'Target omzet', 1], ['katalog', 'Daftar produk dan harga (stok jadi 0)', 1],
    ['paket', 'Paket (Basic / Plus)', 0], ['kuota', 'Kuota terminal', 0]
  ];
  function partChecks(prefix, have) {
    return PARTS.map(function (p) {
      var ok = !have || have[p[0]];
      return '<label style="display:inline-flex;gap:6px;align-items:center;font-size:12px;margin:3px 12px 3px 0;' + (ok ? '' : 'opacity:.4') + '"><input type="checkbox" data-' + prefix + '="' + p[0] + '" ' + (p[2] && ok ? 'checked ' : '') + (ok ? '' : 'disabled ') + 'style="width:15px;height:15px"><span>' + p[1] + '</span></label>';
    }).join('');
  }
  function snapshot(t, parts) {
    var d = DB(), snap = { parts: {} }, jobs = [];
    var has = function (k) { return !parts || parts[k]; };
    if (has('fitur')) { snap.features = towerEffFeatures(t); snap.parts.fitur = 1; }
    if (has('usaha')) { snap.usaha = t.usaha || ''; snap.parts.usaha = 1; }
    if (has('tampilan')) { snap.warna = t.warna || ''; snap.warnaAksen = t.warnaAksen || ''; snap.parts.tampilan = 1; }
    if (has('paket')) { snap.tier = t.tier || 'basic'; snap.parts.paket = 1; }
    if (has('kuota')) { snap.kuota = { kasir: getQuota(t.id, 'kasir'), manager: getQuota(t.id, 'manager'), owner: getQuota(t.id, 'owner') }; snap.parts.kuota = 1; }
    if (has('coa') || has('target')) jobs.push(d.collection('tenant_settings').doc(t.id).get().then(function (s) {
      var x = s.exists ? s.data() : {};
      if (has('coa') && x.coa) { snap.coa = x.coa; snap.parts.coa = 1; }
      if (has('target') && x.targets) { snap.targets = x.targets; snap.parts.target = 1; }
    }));
    if (has('katalog')) jobs.push(d.collection('tp_' + t.id).get().then(function (s) {
      var arr = []; s.forEach(function (x) { var v = Object.assign({}, x.data()); v.stock = 0; v.openStock = 0; v.endStock = null; arr.push({ id: x.id, v: v }); });
      if (arr.length) { snap.catalog = arr; snap.parts.katalog = 1; }
    }));
    return Promise.all(jobs).then(function () { return snap; });
  }
  function applySnap(target, snap, parts) {
    var d = DB(), id = target.id, jobs = [], has = function (k) { return parts[k] && snap.parts && snap.parts[k]; };
    var cfg = JSON.parse(JSON.stringify(target)); delete cfg.fromRegistry;
    var cfgChanged = false;
    if (has('fitur') && snap.features) { cfg.features = snap.features; cfgChanged = true; }
    if (has('usaha')) { cfg.usaha = snap.usaha; cfgChanged = true; }
    if (has('tampilan') && snap.warna) { cfg.warna = snap.warna; if (snap.warnaAksen) cfg.warnaAksen = snap.warnaAksen; cfgChanged = true; }
    if (has('paket')) { cfg.tier = snap.tier; cfgChanged = true; }
    if (cfgChanged) jobs.push(d.collection('tenants_registry').doc(String(id).toLowerCase()).set({ id: cfg.id, nama: cfg.nama, json: JSON.stringify(cfg), createdAt: FV().serverTimestamp() }, { merge: true }).then(function () {
      var ct = {}; if (cfg.features && cfg.features.gaji) ct.gajiOwner = !!cfg.features.gaji.owner;
      return Object.keys(ct).length ? d.collection('tenant_ctrl').doc(id).set(ct, { merge: true }) : null;
    }).then(function () { target.features = cfg.features; target.usaha = cfg.usaha; target.warna = cfg.warna; target.warnaAksen = cfg.warnaAksen; target.tier = cfg.tier; }));
    var st = {}; if (has('coa')) st.coa = snap.coa; if (has('target')) st.targets = snap.targets;
    if (Object.keys(st).length) { st.updatedAt = FV().serverTimestamp(); jobs.push(d.collection('tenant_settings').doc(id).set(st, { merge: true })); }
    if (has('kuota')) jobs.push(d.collection('tenant_ctrl').doc(id).set({ allowedCashiers: snap.kuota.kasir, allowedManagers: snap.kuota.manager, allowedOwners: snap.kuota.owner }, { merge: true }));
    if (has('katalog')) {
      var cat = snap.catalog || [], p = Promise.resolve();
      for (var i = 0; i < cat.length; i += 400) (function (part) { p = p.then(function () { var b = d.batch(); part.forEach(function (x) { b.set(d.collection('tp_' + id).doc(x.id), x.v); }); return b.commit(); }); })(cat.slice(i, i + 400));
      jobs.push(p);
    }
    return Promise.all(jobs);
  }
  function openTemplate(presetTarget) {
    cur = { kind: 'template', target: presetTarget || '' };
    towerOverlay('tw-lab', 'Template & Salin Pengaturan', 'Simpan susunan toko, lalu pakai lagi di toko lain atau toko baru', '<div id="tp-body" style="overflow:auto;padding:0 18px 16px"></div>');
    var box = document.getElementById('tw-lab'); box.firstChild.style.width = 'min(720px,100%)';
    var x = box.querySelector('[data-x]'); var old = x.onclick; x.onclick = function () { cur = null; old(); };
    box.onclick = function (e) { if (e.target === box) { cur = null; box.remove(); } };
    renderTemplate();
  }
  function renderTemplate() {
    var box = document.getElementById('tp-body'); if (!box) return;
    var tl = allTenants(), tpls = Object.keys(tplMap).map(function (k) { return tplMap[k]; }).sort(function (a, b) { return (b.createdMs || 0) - (a.createdMs || 0); });
    var opt = function (t, selected) { return '<option value="' + H(t.id) + '"' + (selected ? ' selected' : '') + '>' + H((t.nama || t.id) + ' [' + t.id + ']' + (isPub(t.id) ? ' — Published' : '')) + '</option>'; };
    var sec = 'padding:12px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);margin-bottom:12px';
    var h3 = 'font-weight:900;font-size:13px;margin-bottom:6px';
    box.innerHTML =
      '<div style="' + sec + '"><div style="' + h3 + '">1. Simpan susunan toko sebagai template</div>' +
      '<select id="tp-src" style="' + INP + '">' + tl.map(function (t) { return opt(t); }).join('') + '</select>' +
      '<input id="tp-name" placeholder="Nama template (mis. Konveksi lengkap)" style="' + INP + 'margin-top:6px"><div style="margin-top:6px">' + partChecks('sp') + '</div>' +
      '<button id="tp-save" style="' + BTN + 'background:#7c3aed;margin-top:8px;width:100%">Simpan template</button><div id="tp-slog" style="font-size:12px;margin-top:6px;min-height:14px"></div></div>' +
      '<div style="' + sec + '"><div style="' + h3 + '">2. Terapkan ke toko</div>' +
      '<div style="font-size:11.5px;opacity:.7;margin-bottom:4px">Ambil dari (template tersimpan atau toko lain langsung):</div>' +
      '<select id="ap-src" style="' + INP + '"><optgroup label="Template tersimpan">' + (tpls.length ? tpls.map(function (p) { return '<option value="tpl:' + H(p._id) + '">' + H(p.name) + '</option>'; }).join('') : '<option value="" disabled>(belum ada template)</option>') + '</optgroup>' +
      '<optgroup label="Salin langsung dari toko">' + tl.map(function (t) { return '<option value="toko:' + H(t.id) + '">' + H((t.nama || t.id) + ' [' + t.id + ']') + '</option>'; }).join('') + '</optgroup></select>' +
      '<div style="font-size:11.5px;opacity:.7;margin:8px 0 4px">Terapkan ke toko:</div>' +
      '<select id="ap-dst" style="' + INP + '">' + tl.map(function (t) { return opt(t, cur && cur.target && t.id === cur.target); }).join('') + '</select>' +
      '<div style="margin-top:6px">' + partChecks('ap') + '</div>' +
      '<button id="ap-go" style="' + BTN + 'background:#059669;margin-top:8px;width:100%">Terapkan</button><div id="ap-log" style="font-size:12px;margin-top:6px;min-height:14px"></div></div>' +
      '<div style="' + sec + '"><div style="' + h3 + '">Template tersimpan</div>' + (tpls.length ? tpls.map(function (p) {
        var parts = PARTS.filter(function (x) { return p.snap && p.snap.parts && p.snap.parts[x[0]]; }).map(function (x) { return x[1]; }).join(', ');
        return '<div style="display:flex;gap:8px;align-items:center;padding:7px 0;border-top:1px solid rgba(255,255,255,.08)"><div style="flex:1"><b style="font-size:12.5px">' + H(p.name) + '</b><div style="font-size:10.5px;opacity:.6">dari ' + H(p.fromNama || '-') + ' · ' + H(parts) + '</div></div><button data-del="' + H(p._id) + '" style="' + BTN + 'background:#be123c">Hapus</button></div>';
      }).join('') : '<div style="font-size:12px;opacity:.6">Belum ada template.</div>') + '</div>';
    box.querySelector('#tp-save').onclick = saveTpl;
    box.querySelector('#ap-go').onclick = applyTpl;
    [].slice.call(box.querySelectorAll('[data-del]')).forEach(function (b) {
      b.onclick = function () { var p = tplMap[b.getAttribute('data-del')]; if (p && confirm('Hapus template "' + p.name + '"? Toko yang sudah memakainya tidak berubah.')) DB().collection(TPL).doc(p._id).delete().catch(fail); };
    });
  }
  function checked(box, prefix) { var o = {}; [].slice.call(box.querySelectorAll('[data-' + prefix + ']')).forEach(function (i) { o[i.getAttribute('data-' + prefix)] = i.checked && !i.disabled; }); return o; }
  function saveTpl() {
    var box = document.getElementById('tp-body'), log = box.querySelector('#tp-slog');
    var t = T(box.querySelector('#tp-src').value), name = box.querySelector('#tp-name').value.trim();
    if (!t) return alert('Pilih toko sumber.');
    if (!name) return alert('Isi nama template.');
    var parts = checked(box, 'sp'); log.textContent = 'Menyimpan…';
    snapshot(t, parts).then(function (snap) {
      var size = JSON.stringify(snap).length;
      if (size > 900000) throw new Error('Template terlalu besar (daftar produk terlalu banyak). Hilangkan centang "Daftar produk".');
      return DB().collection(TPL).add({ name: name, from: t.id, fromNama: t.nama || t.id, createdMs: Date.now(), snap: snap });
    }).then(function () { log.innerHTML = '<b style="color:#6ee7b7">Template tersimpan.</b>'; box.querySelector('#tp-name').value = ''; })
      .catch(function (e) { log.innerHTML = '<span style="color:#fda4af">Gagal: ' + H(e && e.message) + '</span>'; });
  }
  function applyTpl() {
    var box = document.getElementById('tp-body'), log = box.querySelector('#ap-log');
    var src = box.querySelector('#ap-src').value, dst = T(box.querySelector('#ap-dst').value);
    if (!src) return alert('Pilih sumber template atau toko.');
    if (!dst) return alert('Pilih toko tujuan.');
    if (isPub(dst.id)) return lockedMsg(dst);
    var parts = checked(box, 'ap');
    if (!Object.keys(parts).some(function (k) { return parts[k]; })) return alert('Centang minimal satu bagian.');
    var kind = src.split(':')[0], key = src.slice(kind.length + 1), label, getSnap;
    if (kind === 'tpl') { var p = tplMap[key]; if (!p) return alert('Template tidak ditemukan.'); label = 'template "' + p.name + '"'; getSnap = Promise.resolve(p.snap); }
    else { var s = T(key); if (!s) return alert('Toko sumber tidak ditemukan.'); if (s.id === dst.id) return alert('Sumber dan tujuan sama.'); label = 'toko ' + (s.nama || s.id); getSnap = snapshot(s, null); }
    var names = PARTS.filter(function (x) { return parts[x[0]]; }).map(function (x) { return x[1]; }).join(', ');
    if (!confirm('Terapkan ' + label + ' ke ' + (dst.nama || dst.id) + ' [' + dst.id + ']?\n\nBagian yang ditimpa: ' + names + '.\nTransaksi dan akun login tidak disentuh.')) return;
    log.textContent = 'Menerapkan…';
    getSnap.then(function (snap) { return applySnap(dst, snap, parts); }).then(function () {
      ctAudit(dst.id, 'TERAPKAN_TEMPLATE', 'Menerapkan ' + label + ': ' + names, '-', label);
      log.innerHTML = '<b style="color:#6ee7b7">Selesai. Fitur baru aktif di toko saat halaman toko dibuka kembali.</b>';
      try { refreshProviderViews(); } catch (e) {}
    }).catch(function (e) { log.innerHTML = '<span style="color:#fda4af">Gagal: ' + H(e && e.message) + '</span>'; });
  }

  /* =====================================================================
     pintu masuk dari menu Tower
     ===================================================================== */
  var NEED_DB = 'Firestore belum terhubung. Masuk ke Tower dulu.';
  function open(kind, arg) {
    if (!DB()) return alert(NEED_DB);
    listen();
    if (kind === 'template') return openTemplate(arg);
    var map = {
      rakit: ['Rakit Akun', 'Aktifkan fitur satu per satu dan catat hasil ujinya', null, openRakit],
      reset: ['Reset Statistik', 'Pilih toko uji coba yang statistiknya dikembalikan ke 0', function (t) { return !isPub(t.id); }, openReset],
      rename: ['Ubah ID', 'Hanya toko yang belum Published', function (t) { return !isPub(t.id); }, openRename],
      publish: ['Published', 'Tandai toko yang sudah diserahkan ke klien', null, openPublish]
    }[kind];
    if (!map) return;
    pick(map[0], map[1], map[2], map[3], kind === 'reset' || kind === 'rename' ? 'Toko yang sudah Published tidak ditampilkan karena terkunci.' : '');
  }
  window.FM_LAB = { open: open, badge: badge, isPublished: isPub };
})();
