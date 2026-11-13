/* tower-wall.js — tampilan toko dari Tower: wallpaper (galeri + unggah), jadwal, kejelasan kaca, hujan di kaca, wallpaper portal.
   Global : app_meta/wallpaper = { json } ; gambar unggahan: app_meta/wpimg_<id> = { d: dataURL, t: thumbnail }
            (dibaca semua toko tanpa login, hanya Tower yang menulis).
   Per toko: tenant_ctrl/<toko>.glass (1-5) dan .rain ('on'|'off'); kosong = ikut global.
   Klien hanya membaca; berganti sekitar 30 detik tanpa muat ulang. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;
  var DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var GL = [['1', '1 Buram'], ['2', '2'], ['3', '3 Normal'], ['4', '4'], ['5', '5 Bening']];
  var ov = null, cfg = null, sel = 0, msg = '', saving = false, tab = 'gambar', ctrls = {}, rowMsg = {}, q = '', listening = false, thumbs = {}, busy = '';
  function DB() { return (typeof db !== 'undefined' && db) ? db : null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function c5(v, d) { v = parseInt(v, 10); return v >= 1 && v <= 5 ? v : d; }
  function norm(c) {
    c = c || {}; var d = { mode: c.mode === 'fixed' ? 'fixed' : 'auto' };
    d.items = FM_WP.items(c); var n = d.items.length;
    d.fixed = Math.min(n, Math.max(1, parseInt(c.fixed, 10) || 1));
    d.order = FM_WP.order(c); d.start = parseInt(c.start, 10) || 0;
    var dy = parseInt(c.day, 10); d.day = (dy >= 0 && dy <= 6) ? dy : 1;
    d.hour = Math.min(23, Math.max(0, parseInt(c.hour, 10) || 0));
    d.glass = c5(c.glass, 3);
    d.rain = { on: !!(c.rain && c.rain.on), size: c5(c.rain && c.rain.size, 3), rate: c5(c.rain && c.rain.rate, 3) };
    var p = c.portal; d.portal = (p === 'none') ? 'none' : ((parseInt(p, 10) >= 1 && parseInt(p, 10) <= n) ? parseInt(p, 10) : 'same');
    return d;
  }
  function fmtWhen(ms) { try { return new Date(ms).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace(/\./g, ':') + ' WIB'; } catch (e) { return ''; } }
  function opts(list, cur) { return list.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  var BTN = 'padding:9px 14px;border-radius:12px;border:0;font-weight:800;font-size:12.5px;cursor:pointer;color:#fff;';
  var SEL = 'padding:7px 9px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#f5f5f7;font-size:12.5px';
  var BOX = 'margin-top:14px;padding:12px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)';
  function chip(on, attr, label) { return '<button ' + attr + ' style="all:unset;cursor:pointer;padding:7px 12px;border-radius:10px;font-size:12px;font-weight:800;background:' + (on ? '#2563eb' : 'rgba(255,255,255,.1)') + '">' + label + '</button>'; }

  /* ---------- muat / simpan ---------- */
  function load() {
    var d = DB(); if (!d) return;
    d.collection('app_meta').doc('wallpaper').get().then(function (s) {
      if (s.exists) { try { cfg = norm(JSON.parse((s.data() || {}).json || '{}')); } catch (e) {} }
      sel = cfg.mode === 'fixed' ? cfg.fixed - 1 : FM_WP.pick(cfg); draw();
    }).catch(function () { draw(); });
  }
  function save(note) {
    var d = DB(); if (!d) { msg = 'Gagal: Firestore belum terhubung.'; draw(); return Promise.resolve(); }
    var c = norm(cfg); if (c.mode === 'fixed') c.fixed = Math.min(c.items.length, sel + 1);
    saving = true; msg = ''; draw();
    return d.collection('app_meta').doc('wallpaper').set({ json: JSON.stringify(c), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(function () {
      cfg = c; try { localStorage.setItem('fm_wp_cfg', JSON.stringify(c)); } catch (e) {}
      saving = false; msg = note || 'Tersimpan. Semua toko berganti dalam sekitar 30 detik, tanpa muat ulang.'; draw();
    }).catch(function (e) { saving = false; msg = 'Gagal: ' + (e && e.message ? e.message : 'tidak bisa menyimpan'); draw(); });
  }
  function setThisWeek(x) {
    var t = JSON.parse(JSON.stringify(cfg)); t.mode = 'auto'; t.start = 0;
    var p0 = FM_WP.pick(t) + 1, pos0 = cfg.order.indexOf(p0), posX = cfg.order.indexOf(x), n = cfg.order.length;
    if (pos0 >= 0 && posX >= 0) cfg.start = (((posX - pos0) % n) + n) % n;
  }
  function resetOrder() { var o = []; for (var i = 1; i <= cfg.items.length; i++) o.push(i); cfg.order = o; cfg.start = 0; cfg.fixed = Math.min(cfg.fixed, cfg.items.length); if (sel >= cfg.items.length) sel = cfg.items.length - 1; if (cfg.portal !== 'none' && cfg.portal !== 'same' && cfg.portal > cfg.items.length) cfg.portal = 'same'; }

  /* ---------- galeri: unggah, hapus ---------- */
  function thumbOf(key) {
    if (/^b[1-4]$/.test(key)) return 'img/wp/t' + key.charAt(1) + '.jpg';
    if (thumbs[key]) return thumbs[key];
    var d = DB(); if (d && thumbs[key] !== false) { thumbs[key] = false; d.collection('app_meta').doc('wpimg_' + key.slice(2)).get().then(function (s) { var v = s.exists && (s.data() || {}).t; if (v) { thumbs[key] = v; if (ov && tab === 'gambar') draw(); } }).catch(function () {}); }
    return '';
  }
  function resize(img, maxW, q) { var k = Math.min(1, maxW / img.width), cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); return cv.toDataURL('image/jpeg', q); }
  function addFile(file) {
    var d = DB(); if (!d) { msg = 'Gagal: Firestore belum terhubung.'; return draw(); }
    if (!file || !/^image\//.test(file.type)) { msg = 'Gagal: pilih file gambar (JPG, PNG, atau WebP).'; return draw(); }
    if (cfg.items.length >= 10) { msg = 'Gagal: maksimal 10 gambar. Hapus satu dulu.'; return draw(); }
    busy = 'Memproses gambar...'; msg = ''; draw();
    var fr = new FileReader();
    fr.onload = function () {
      var im = new Image();
      im.onload = function () {
        var qv = .84, data = resize(im, 1600, qv);
        while (data.length > 760000 && qv > .4) { qv -= .08; data = resize(im, 1600, qv); }
        if (data.length > 900000) { data = resize(im, 1280, .6); }
        var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5), key = 'u_' + id, th = resize(im, 320, .7);
        busy = 'Mengunggah...'; draw();
        d.collection('app_meta').doc('wpimg_' + id).set({ d: data, t: th, at: firebase.firestore.FieldValue.serverTimestamp() }).then(function () {
          thumbs[key] = th; cfg.items.push(key); resetOrder(); busy = ''; return save('Gambar ditambahkan dan tersimpan. Atur jadwalnya bila perlu.');
        }).catch(function (e) { busy = ''; msg = 'Gagal: ' + (e && e.message ? e.message : 'tidak bisa mengunggah (gambar mungkin terlalu besar)'); draw(); });
      };
      im.onerror = function () { busy = ''; msg = 'Gagal: gambar tidak bisa dibaca.'; draw(); };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  function removeItem(i) {
    if (cfg.items.length <= 1) { msg = 'Gagal: minimal satu gambar harus ada.'; return draw(); }
    var key = cfg.items[i]; if (!confirm('Hapus gambar ' + (i + 1) + ' dari galeri?' + (key.charAt(0) === 'u' ? ' File unggahan ikut dihapus.' : ' (Gambar bawaan bisa dipulihkan.)'))) return;
    cfg.items.splice(i, 1); resetOrder();
    var d = DB(); if (key.charAt(0) === 'u' && d) d.collection('app_meta').doc('wpimg_' + key.slice(2)).delete().catch(function () {});
    save('Gambar dihapus.');
  }
  function restoreBuiltin() { ['b1', 'b2', 'b3', 'b4'].forEach(function (k) { if (cfg.items.indexOf(k) < 0 && cfg.items.length < 10) cfg.items.push(k); }); resetOrder(); save('Gambar bawaan dipulihkan.'); }

  /* ---------- tampilan ---------- */
  function tabs() { return '<div style="display:flex;gap:6px;margin:10px 0 0;flex-wrap:wrap">' + [['gambar', 'Gambar & portal'], ['kaca', 'Kaca & hujan'], ['toko', 'Per toko']].map(function (t) { return '<button data-tab="' + t[0] + '" style="all:unset;cursor:pointer;padding:7px 14px;border-radius:99px;font-size:12.5px;font-weight:800;background:' + (tab === t[0] ? '#2563eb' : 'rgba(255,255,255,.1)') + '">' + t[1] + '</button>'; }).join('') + '</div>'; }
  function tabGambar() {
    var n = cfg.items.length, cur = FM_WP.pick(cfg), nx = FM_WP.next(cfg);
    var h = '<div style="margin:10px 0;font-size:12.5px;line-height:1.6;color:#c7cbd6">Tampil sekarang di semua toko: <b style="color:#fff">Gambar ' + (cur + 1) + '</b>' + (nx ? '. Berganti pada ' + esc(fmtWhen(nx)) : ' (dikunci)') + '.</div>';
    h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">';
    cfg.items.forEach(function (key, i) {
      var t = thumbOf(key);
      h += '<div style="position:relative;border-radius:14px;overflow:hidden;border:2px solid ' + (i === sel ? '#60a5fa' : 'rgba(255,255,255,.12)') + ';background:#111"><button data-pick="' + i + '" style="all:unset;cursor:pointer;display:block;width:100%">' + (t ? '<img src="' + esc(t) + '" alt="" style="display:block;width:100%;aspect-ratio:16/9;object-fit:cover">' : '<div style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;font-size:11px;color:#94a3b8">Memuat...</div>') + '</button>' +
        '<span style="position:absolute;left:6px;top:6px;padding:2px 9px;border-radius:99px;background:rgba(0,0,0,.6);font-size:11px;font-weight:800">' + (i + 1) + (i === cur ? ' · tampil' : '') + '</span>' +
        '<button data-del="' + i + '" title="Hapus" style="all:unset;cursor:pointer;position:absolute;right:6px;top:6px;width:24px;height:24px;border-radius:50%;background:rgba(190,18,60,.9);color:#fff;font-weight:900;text-align:center;line-height:24px;font-size:14px">×</button></div>';
    });
    if (n < 10) h += '<label style="display:flex;align-items:center;justify-content:center;aspect-ratio:16/9;border-radius:14px;border:2px dashed rgba(255,255,255,.25);cursor:pointer;font-size:12.5px;font-weight:800;color:#c7cbd6;text-align:center;padding:6px">+ Unggah gambar<input type="file" accept="image/*" data-up style="display:none"></label>';
    h += '</div>';
    if (busy) h += '<div style="margin-top:8px;font-size:12px;color:#fbbf24">' + esc(busy) + '</div>';
    h += '<div style="margin-top:8px"><button data-restore style="' + BTN + 'background:rgba(255,255,255,.12);padding:6px 12px;font-size:11.5px">Pulihkan gambar bawaan</button></div>';
    h += '<div style="' + BOX + '"><label style="display:flex;gap:8px;align-items:center;font-size:13px;font-weight:700"><input type="radio" name="fm-tw-mode" value="auto" ' + (cfg.mode === 'auto' ? 'checked' : '') + '> Otomatis bergilir tiap minggu</label>' +
      '<div style="display:' + (cfg.mode === 'auto' ? 'grid' : 'none') + ';grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 4px">' +
      '<label style="font-size:11.5px;color:#c7cbd6">Hari berganti<br><select data-g="day" style="' + SEL + ';width:100%">' + opts(DAYS.map(function (x, k) { return [k, x]; }), cfg.day) + '</select></label>' +
      '<label style="font-size:11.5px;color:#c7cbd6">Jam berganti (WIB)<br><select data-g="hour" style="' + SEL + ';width:100%">' + opts(Array.apply(null, Array(24)).map(function (_, k) { return [k, ('0' + k).slice(-2) + ':00']; }), cfg.hour) + '</select></label>' +
      '<label style="font-size:11.5px;color:#c7cbd6;grid-column:1/3">Urutan gambar (pisahkan koma)<br><input data-g="order" value="' + esc(cfg.order.join(',')) + '" style="' + SEL + ';width:100%;box-sizing:border-box"></label>' +
      '<div style="grid-column:1/3;font-size:11.5px;color:#c7cbd6">Gambar minggu ini: <select data-g="thisweek" style="' + SEL + '">' + opts(cfg.order.map(function (x) { return [x, 'Gambar ' + x]; }), cur + 1) + '</select></div></div>' +
      '<label style="display:flex;gap:8px;align-items:center;font-size:13px;font-weight:700;margin-top:8px"><input type="radio" name="fm-tw-mode" value="fixed" ' + (cfg.mode === 'fixed' ? 'checked' : '') + '> Kunci satu gambar' + (cfg.mode === 'fixed' ? ': Gambar ' + (sel + 1) + ' (pilih di atas)' : '') + '</label></div>';
    var pOpts = [['same', 'Sama seperti toko'], ['none', 'Polos (tanpa gambar)']].concat(cfg.items.map(function (k, i) { return [i + 1, 'Gambar ' + (i + 1)]; }));
    h += '<div style="' + BOX + '"><b style="font-size:13px">Wallpaper portal (halaman login)</b><div style="margin-top:8px"><select data-portal style="' + SEL + '">' + opts(pOpts, cfg.portal) + '</select></div></div>';
    return h;
  }
  function tabKaca() {
    var h = '<div style="' + BOX + '"><b style="font-size:13px">Kejelasan kaca (semua toko dan portal)</b><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' + GL.map(function (g) { return chip(String(cfg.glass) === g[0], 'data-gl="' + g[0] + '"', g[1]); }).join('') + '</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-top:6px">Klien melapor tulisan kurang jelas: naikkan ke buram untuk toko itu di tab "Per toko".</div></div>';
    h += '<div style="' + BOX + '"><label style="display:flex;gap:8px;align-items:center;font-size:13px;font-weight:800"><input type="checkbox" data-rain-on ' + (cfg.rain.on ? 'checked' : '') + '> Efek hujan di kaca (tetesan air pada kartu, tombol, pop-up, header, dock)</label>' +
      '<div style="display:' + (cfg.rain.on ? 'block' : 'none') + '"><div style="font-size:12px;color:#c7cbd6;margin:10px 0 6px">Ukuran butiran</div><div style="display:flex;gap:6px;flex-wrap:wrap">' + [1, 2, 3, 4, 5].map(function (v) { return chip(cfg.rain.size === v, 'data-rsize="' + v + '"', v === 1 ? '1 Halus' : v === 5 ? '5 Besar' : String(v)); }).join('') + '</div>' +
      '<div style="font-size:12px;color:#c7cbd6;margin:10px 0 6px">Deras</div><div style="display:flex;gap:6px;flex-wrap:wrap">' + [1, 2, 3, 4, 5].map(function (v) { return chip(cfg.rain.rate === v, 'data-rrate="' + v + '"', v === 1 ? '1 Gerimis' : v === 5 ? '5 Deras' : String(v)); }).join('') + '</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-top:8px">Efek ini memakai tenaga komputer. Bila PC toko lemah, matikan per toko di tab "Per toko". Aplikasi juga berhenti sendiri bila terasa berat.</div></div></div>';
    return h;
  }
  function tabToko() {
    var list = tenantsList().filter(function (t) { return !q || (t.nama + ' ' + t.id).toLowerCase().indexOf(q.toLowerCase()) >= 0; });
    var h = '<input data-q placeholder="Cari toko..." value="' + esc(q) + '" style="' + SEL + ';width:100%;box-sizing:border-box;margin:10px 0">';
    h += list.map(function (t) {
      var c = ctrls[t.id] || {}, gcur = c.glass || '', rcur = c.rain || '';
      return '<div data-row="' + esc(t.id) + '" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);margin-bottom:6px"><div><b style="font-size:13px">' + esc(t.nama) + '</b><div style="font-size:11px;color:#94a3b8">' + esc(t.id) + '</div></div>' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="font-size:11px;color:' + (/^Gagal/.test(rowMsg[t.id] || '') ? '#fca5a5' : '#86efac') + '">' + esc(rowMsg[t.id] || '') + '</span>' +
        '<select data-f="glass" title="Kejelasan kaca" style="' + SEL + '"><option value="">Kaca: ikut global (' + cfg.glass + ')</option>' + GL.map(function (g) { return '<option value="' + g[0] + '"' + (String(gcur) === g[0] ? ' selected' : '') + '>Kaca ' + esc(g[1]) + '</option>'; }).join('') + '</select>' +
        '<select data-f="rain" title="Hujan di kaca" style="' + SEL + '"><option value="">Hujan: ikut global (' + (cfg.rain.on ? 'nyala' : 'mati') + ')</option><option value="on"' + (rcur === 'on' ? ' selected' : '') + '>Hujan nyala</option><option value="off"' + (rcur === 'off' ? ' selected' : '') + '>Hujan mati</option></select></div></div>';
    }).join('') || '<div style="color:#94a3b8;font-size:12.5px">Tidak ada toko.</div>';
    return h;
  }
  function tenantsList() { var out = []; try { var T = (typeof TENANTS_CONFIG !== 'undefined') ? TENANTS_CONFIG : {}; Object.keys(T).forEach(function (k) { var t = T[k]; if (t && t.id) out.push({ id: t.id, nama: t.nama || t.id }); }); } catch (e) {} out.sort(function (a, b) { return String(a.nama).localeCompare(String(b.nama)); }); return out; }
  function startListen() { var d = DB(); if (listening || !d) return; listening = true; d.collection('tenant_ctrl').onSnapshot(function (sn) { ctrls = {}; sn.forEach(function (x) { ctrls[x.id] = x.data() || {}; }); if (ov && tab === 'toko') draw(); }, function () { listening = false; }); }
  function saveRow(id, field, v) {
    var d = DB(); if (!d) { rowMsg[id] = 'Gagal: Firestore belum terhubung.'; return draw(); }
    var o = {}; o[field] = v ? (field === 'glass' ? parseInt(v, 10) : v) : firebase.firestore.FieldValue.delete();
    d.collection('tenant_ctrl').doc(id).set(o, { merge: true }).then(function () { rowMsg[id] = 'Tersimpan'; draw(); }).catch(function (e) { rowMsg[id] = 'Gagal: ' + (e && e.message ? e.message : 'tidak bisa menyimpan'); draw(); });
  }
  function draw() {
    if (!ov) return;
    var h = '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><b style="font-size:16px">Tampilan Toko</b><button data-x style="' + BTN + 'background:rgba(255,255,255,.12)">Tutup</button></div>' + tabs();
    h += tab === 'gambar' ? tabGambar() : tab === 'kaca' ? tabKaca() : tabToko();
    if (tab !== 'toko') h += '<div style="display:flex;gap:10px;align-items:center;margin-top:14px;flex-wrap:wrap"><button data-save style="' + BTN + 'background:#2563eb;padding:11px 18px"' + (saving ? ' disabled' : '') + '>' + (saving ? 'Menyimpan...' : 'Simpan') + '</button><span style="font-size:12px;color:' + (/^Gagal/.test(msg) ? '#fca5a5' : '#86efac') + '">' + esc(msg) + '</span></div>';
    var keep = ov.firstChild.scrollTop; ov.firstChild.innerHTML = h; wire(); ov.firstChild.scrollTop = keep;
  }
  function wire() {
    ov.querySelector('[data-x]').onclick = close;
    ov.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { tab = b.getAttribute('data-tab'); msg = ''; if (tab === 'toko') startListen(); draw(); }; });
    ov.querySelectorAll('[data-pick]').forEach(function (b) { b.onclick = function () { sel = parseInt(b.getAttribute('data-pick'), 10); if (cfg.mode === 'fixed') cfg.fixed = sel + 1; draw(); }; });
    ov.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { removeItem(parseInt(b.getAttribute('data-del'), 10)); }; });
    var up = ov.querySelector('[data-up]'); if (up) up.onchange = function () { if (up.files && up.files[0]) addFile(up.files[0]); };
    var rs = ov.querySelector('[data-restore]'); if (rs) rs.onclick = restoreBuiltin;
    ov.querySelectorAll('input[name="fm-tw-mode"]').forEach(function (r) { r.onchange = function () { cfg.mode = r.value; if (cfg.mode === 'fixed') cfg.fixed = sel + 1; draw(); }; });
    ov.querySelectorAll('[data-g]').forEach(function (e) {
      e.onchange = function () {
        var f = e.getAttribute('data-g');
        if (f === 'day') cfg.day = parseInt(e.value, 10); else if (f === 'hour') cfg.hour = parseInt(e.value, 10);
        else if (f === 'order') { var o = e.value.split(/[\s,]+/).map(function (v) { return parseInt(v, 10); }).filter(function (v, i, a) { return v >= 1 && v <= cfg.items.length && a.indexOf(v) === i; }); if (o.length) cfg.order = o; }
        else if (f === 'thisweek') setThisWeek(parseInt(e.value, 10));
        draw();
      };
    });
    var pt = ov.querySelector('[data-portal]'); if (pt) pt.onchange = function () { cfg.portal = (pt.value === 'same' || pt.value === 'none') ? pt.value : parseInt(pt.value, 10); };
    ov.querySelectorAll('[data-gl]').forEach(function (b) { b.onclick = function () { cfg.glass = parseInt(b.getAttribute('data-gl'), 10); draw(); }; });
    var ro = ov.querySelector('[data-rain-on]'); if (ro) ro.onchange = function () { cfg.rain.on = ro.checked; draw(); };
    ov.querySelectorAll('[data-rsize]').forEach(function (b) { b.onclick = function () { cfg.rain.size = parseInt(b.getAttribute('data-rsize'), 10); draw(); }; });
    ov.querySelectorAll('[data-rrate]').forEach(function (b) { b.onclick = function () { cfg.rain.rate = parseInt(b.getAttribute('data-rrate'), 10); draw(); }; });
    var sv = ov.querySelector('[data-save]'); if (sv) sv.onclick = function () { save(); };
    ov.querySelectorAll('[data-row]').forEach(function (row) {
      var id = row.getAttribute('data-row');
      row.querySelectorAll('select[data-f]').forEach(function (s) { s.onchange = function () { saveRow(id, s.getAttribute('data-f'), s.value); }; });
    });
    var qi = ov.querySelector('[data-q]'); if (qi) qi.oninput = function () { q = qi.value; var pos = qi.selectionStart; draw(); var nn = ov.querySelector('[data-q]'); if (nn) { nn.focus(); nn.setSelectionRange(pos, pos); } };
  }
  function close() { if (ov) { ov.remove(); ov = null; } }
  function open() {
    if (!window.FM_WP) { alert('Modul wallpaper belum termuat. Muat ulang halaman.'); return; }
    close(); tab = 'gambar'; cfg = norm(FM_WP.cfg()); sel = cfg.mode === 'fixed' ? cfg.fixed - 1 : FM_WP.pick(cfg); msg = ''; busy = '';
    ov = document.createElement('div'); ov.id = 'fm-twall';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147482500;background:rgba(0,0,0,.6);display:flex;align-items:flex-start;justify-content:center;padding:18px 12px;font-family:-apple-system,system-ui,sans-serif';
    ov.innerHTML = '<div style="width:100%;max-width:760px;max-height:calc(100vh - 36px);overflow:auto;background:rgba(24,26,34,.97);color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:16px;box-sizing:border-box"></div>';
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.body.appendChild(ov); draw(); load();
  }
  window.FM_TWALL = { open: open };
})();
