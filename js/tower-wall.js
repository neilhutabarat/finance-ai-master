/* tower-wall.js — ganti wallpaper dari Tower. Hanya halaman Tower.
   Disimpan di app_meta/wallpaper = { json: '{"mode","fixed","order","start","day","hour"}' } (dibaca semua toko, hanya Tower yang menulis).
   Toko memeriksa ulang tiap 30 detik, jadi gambar berganti tanpa klien memuat ulang. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;
  var DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var ov = null, cfg = null, sel = 0, msg = '', saving = false, tab = 'gambar', ctrls = {}, rowMsg = {}, q = '', listening = false;
  var GL = [['1', '1 Buram'], ['2', '2'], ['3', '3 Normal'], ['4', '4'], ['5', '5 Bening']];
  function DB() { return (typeof db !== 'undefined' && db) ? db : null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(c) {
    c = c || {}; var d = { mode: c.mode === 'fixed' ? 'fixed' : 'auto' };
    d.fixed = Math.min(4, Math.max(1, parseInt(c.fixed, 10) || 1));
    d.order = FM_WP.order(c); d.start = parseInt(c.start, 10) || 0;
    var dy = parseInt(c.day, 10); d.day = (dy >= 0 && dy <= 6) ? dy : 1;
    d.hour = Math.min(23, Math.max(0, parseInt(c.hour, 10) || 0));
    var g = parseInt(c.glass, 10); d.glass = (g >= 1 && g <= 5) ? g : 3; return d;
  }
  function fmtWhen(ms) { try { return new Date(ms).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace(/\./g, ':') + ' WIB'; } catch (e) { return ''; } }
  function opts(list, cur) { return list.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  var BTN = 'padding:9px 14px;border-radius:12px;border:0;font-weight:800;font-size:12.5px;cursor:pointer;color:#fff;';
  var SEL = 'padding:7px 9px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#f5f5f7;font-size:12.5px';

  function load() {
    var d = DB(); if (!d) return;
    d.collection('app_meta').doc('wallpaper').get().then(function (s) {
      if (s.exists) { try { cfg = norm(JSON.parse((s.data() || {}).json || '{}')); } catch (e) {} }
      sel = cfg.mode === 'fixed' ? cfg.fixed - 1 : FM_WP.pick(cfg); draw();
    }).catch(function () { draw(); });
  }
  function save() {
    var d = DB(); if (!d) { msg = 'Gagal: Firestore belum terhubung.'; draw(); return; }
    var c = norm(cfg); if (c.mode === 'fixed') c.fixed = sel + 1;
    saving = true; msg = ''; draw();
    d.collection('app_meta').doc('wallpaper').set({ json: JSON.stringify(c), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(function () {
      cfg = c; try { localStorage.setItem('fm_wp_cfg', JSON.stringify(c)); } catch (e) {}
      saving = false; msg = 'Tersimpan. Semua toko berganti dalam sekitar 30 detik, tanpa muat ulang.'; draw();
    }).catch(function (e) { saving = false; msg = 'Gagal: ' + (e && e.message ? e.message : 'tidak bisa menyimpan'); draw(); });
  }
  function setThisWeek(x) {
    var t = JSON.parse(JSON.stringify(cfg)); t.mode = 'auto'; t.start = 0;
    var p0 = FM_WP.pick(t) + 1, pos0 = cfg.order.indexOf(p0), posX = cfg.order.indexOf(x), n = cfg.order.length;
    if (pos0 >= 0 && posX >= 0) cfg.start = (((posX - pos0) % n) + n) % n;
  }
  function draw() {
    if (!ov) return;
    var cur = FM_WP.pick(cfg), nx = FM_WP.next(cfg);
    var h = '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><b style="font-size:16px">Wallpaper Toko</b><button data-x style="' + BTN + 'background:rgba(255,255,255,.12)">Tutup</button></div>';
    h += '<div style="display:flex;gap:6px;margin:10px 0 0">' + [['gambar', 'Gambar & kaca'], ['toko', 'Kaca per toko']].map(function (t) { return '<button data-tab="' + t[0] + '" style="all:unset;cursor:pointer;padding:7px 14px;border-radius:99px;font-size:12.5px;font-weight:800;background:' + (tab === t[0] ? '#2563eb' : 'rgba(255,255,255,.1)') + '">' + t[1] + '</button>'; }).join('') + '</div>';
    if (tab === 'toko') { ov.firstChild.innerHTML = h + tabToko(); wireTabs(); return; }
    h += '<div style="margin:10px 0;font-size:12.5px;line-height:1.6;color:#c7cbd6">Tampil sekarang di semua toko: <b style="color:#fff">Gambar ' + (cur + 1) + '</b>' + (nx ? '. Berganti pada ' + esc(fmtWhen(nx)) : ' (dikunci)') + '.</div>';
    h += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">';
    for (var i = 0; i < 4; i++) h += '<button data-pick="' + i + '" style="all:unset;cursor:pointer;display:block;border-radius:14px;overflow:hidden;border:2px solid ' + (i === sel ? '#60a5fa' : 'rgba(255,255,255,.12)') + ';position:relative"><img src="img/wp/t' + (i + 1) + '.jpg" alt="" style="display:block;width:100%;aspect-ratio:16/9;object-fit:cover"><span style="position:absolute;left:8px;top:8px;padding:2px 9px;border-radius:99px;background:rgba(0,0,0,.6);font-size:11px;font-weight:800">' + (i + 1) + (i === cur ? ' · tampil' : '') + '</span></button>';
    h += '</div><div style="margin-top:14px;padding:12px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)">' +
      '<label style="display:flex;gap:8px;align-items:center;font-size:13px;font-weight:700"><input type="radio" name="fm-tw-mode" value="auto" ' + (cfg.mode === 'auto' ? 'checked' : '') + '> Otomatis bergilir tiap minggu</label>' +
      '<div style="display:' + (cfg.mode === 'auto' ? 'grid' : 'none') + ';grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 4px">' +
      '<label style="font-size:11.5px;color:#c7cbd6">Hari berganti<br><select data-g="day" style="' + SEL + ';width:100%">' + opts(DAYS.map(function (n, k) { return [k, n]; }), cfg.day) + '</select></label>' +
      '<label style="font-size:11.5px;color:#c7cbd6">Jam berganti (WIB)<br><select data-g="hour" style="' + SEL + ';width:100%">' + opts(Array.apply(null, Array(24)).map(function (_, k) { return [k, ('0' + k).slice(-2) + ':00']; }), cfg.hour) + '</select></label>' +
      '<label style="font-size:11.5px;color:#c7cbd6;grid-column:1/3">Urutan gambar (pisahkan koma)<br><input data-g="order" value="' + esc(cfg.order.join(',')) + '" style="' + SEL + ';width:100%;box-sizing:border-box"></label>' +
      '<div style="grid-column:1/3;font-size:11.5px;color:#c7cbd6">Gambar minggu ini: <select data-g="thisweek" style="' + SEL + '">' + opts(cfg.order.map(function (n) { return [n, 'Gambar ' + n]; }), cur + 1) + '</select></div></div>' +
      '<label style="display:flex;gap:8px;align-items:center;font-size:13px;font-weight:700;margin-top:8px"><input type="radio" name="fm-tw-mode" value="fixed" ' + (cfg.mode === 'fixed' ? 'checked' : '') + '> Kunci satu gambar' + (cfg.mode === 'fixed' ? ': Gambar ' + (sel + 1) + ' (pilih di atas)' : '') + '</label></div>';
    h += '<div style="margin-top:14px;padding:12px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)"><b style="font-size:13px">Kejelasan kaca (semua toko)</b><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' + GL.map(function (g) { return '<button data-gl="' + g[0] + '" style="all:unset;cursor:pointer;padding:7px 12px;border-radius:10px;font-size:12px;font-weight:800;background:' + (String(cfg.glass) === g[0] ? '#2563eb' : 'rgba(255,255,255,.1)') + '">' + g[1] + '</button>'; }).join('') + '</div><div style="font-size:11px;color:#94a3b8;margin-top:6px">Klien melapor tulisan kurang jelas: naikkan ke buram untuk toko itu di tab "Kaca per toko".</div></div>';
    h += '<div style="display:flex;gap:10px;align-items:center;margin-top:14px"><button data-save style="' + BTN + 'background:#2563eb;padding:11px 18px"' + (saving ? ' disabled' : '') + '>' + (saving ? 'Menyimpan...' : 'Simpan') + '</button><span style="font-size:12px;color:' + (/^Gagal/.test(msg) ? '#fca5a5' : '#86efac') + '">' + esc(msg) + '</span></div>';
    var keep = ov.firstChild.scrollTop; ov.firstChild.innerHTML = h; wire(); ov.firstChild.scrollTop = keep;
  }
  function wire() {
    wireTabs();
    ov.querySelectorAll('[data-gl]').forEach(function (b) { b.onclick = function () { cfg.glass = parseInt(b.getAttribute('data-gl'), 10); draw(); }; });
    ov.querySelectorAll('[data-pick]').forEach(function (b) { b.onclick = function () { sel = parseInt(b.getAttribute('data-pick'), 10); if (cfg.mode === 'fixed') cfg.fixed = sel + 1; draw(); }; });
    ov.querySelectorAll('input[name="fm-tw-mode"]').forEach(function (r) { r.onchange = function () { cfg.mode = r.value; if (cfg.mode === 'fixed') cfg.fixed = sel + 1; draw(); }; });
    ov.querySelectorAll('[data-g]').forEach(function (e) {
      e.onchange = function () {
        var f = e.getAttribute('data-g');
        if (f === 'day') cfg.day = parseInt(e.value, 10); else if (f === 'hour') cfg.hour = parseInt(e.value, 10);
        else if (f === 'order') { var o = e.value.split(/[\s,]+/).map(function (v) { return parseInt(v, 10); }).filter(function (v, i, a) { return v >= 1 && v <= 4 && a.indexOf(v) === i; }); if (o.length) cfg.order = o; }
        else if (f === 'thisweek') setThisWeek(parseInt(e.value, 10));
        draw();
      };
    });
    ov.querySelector('[data-save]').onclick = save;
  }
  function wireTabs() {
    ov.querySelector('[data-x]').onclick = close;
    ov.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { tab = b.getAttribute('data-tab'); startListen(); draw(); }; });
    ov.querySelectorAll('[data-row]').forEach(function (row) {
      var id = row.getAttribute('data-row'), sl = row.querySelector('select');
      sl.onchange = function () { saveRow(id, sl.value); };
    });
    var qi = ov.querySelector('[data-q]'); if (qi) qi.oninput = function () { q = qi.value; var pos = qi.selectionStart; draw(); var n = ov.querySelector('[data-q]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } };
  }
  function tenantsList() { var out = []; try { var T = (typeof TENANTS_CONFIG !== 'undefined') ? TENANTS_CONFIG : {}; Object.keys(T).forEach(function (k) { var t = T[k]; if (t && t.id) out.push({ id: t.id, nama: t.nama || t.id }); }); } catch (e) {} out.sort(function (a, b) { return String(a.nama).localeCompare(String(b.nama)); }); return out; }
  function startListen() { var d = DB(); if (listening || !d) return; listening = true; d.collection('tenant_ctrl').onSnapshot(function (sn) { ctrls = {}; sn.forEach(function (x) { ctrls[x.id] = x.data() || {}; }); if (ov && tab === 'toko') draw(); }, function () { listening = false; }); }
  function saveRow(id, v) {
    var d = DB(); if (!d) { rowMsg[id] = 'Gagal: Firestore belum terhubung.'; return draw(); }
    var val = v ? parseInt(v, 10) : firebase.firestore.FieldValue.delete();
    d.collection('tenant_ctrl').doc(id).set({ glass: val }, { merge: true }).then(function () { rowMsg[id] = v ? 'Tersimpan (tingkat ' + v + ')' : 'Ikut global'; draw(); }).catch(function (e) { rowMsg[id] = 'Gagal: ' + (e && e.message ? e.message : 'tidak bisa menyimpan'); draw(); });
  }
  function tabToko() {
    var list = tenantsList().filter(function (t) { return !q || (t.nama + ' ' + t.id).toLowerCase().indexOf(q.toLowerCase()) >= 0; });
    var h = '<input data-q placeholder="Cari toko..." value="' + esc(q) + '" style="' + SEL + ';width:100%;box-sizing:border-box;margin:10px 0">';
    h += list.map(function (t) {
      var cur = (ctrls[t.id] || {}).glass || '';
      return '<div data-row="' + esc(t.id) + '" style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);margin-bottom:6px"><div><b style="font-size:13px">' + esc(t.nama) + '</b><div style="font-size:11px;color:#94a3b8">' + esc(t.id) + '</div></div><div style="display:flex;align-items:center;gap:8px"><span style="font-size:11px;color:' + (/^Gagal/.test(rowMsg[t.id] || '') ? '#fca5a5' : '#86efac') + '">' + esc(rowMsg[t.id] || '') + '</span><select style="' + SEL + '"><option value="">Ikut global (' + cfg.glass + ')</option>' + GL.map(function (g) { return '<option value="' + g[0] + '"' + (String(cur) === g[0] ? ' selected' : '') + '>' + esc(g[1]) + '</option>'; }).join('') + '</select></div></div>';
    }).join('') || '<div style="color:#94a3b8;font-size:12.5px">Tidak ada toko.</div>';
    return h;
  }
  function close() { if (ov) { ov.remove(); ov = null; } }
  function open() {
    if (!window.FM_WP) { alert('Modul wallpaper belum termuat. Muat ulang halaman.'); return; }
    close(); tab = 'gambar'; cfg = norm(FM_WP.cfg()); sel = cfg.mode === 'fixed' ? cfg.fixed - 1 : FM_WP.pick(cfg); msg = '';
    ov = document.createElement('div'); ov.id = 'fm-twall';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147482500;background:rgba(0,0,0,.6);display:flex;align-items:flex-start;justify-content:center;padding:18px 12px;font-family:-apple-system,system-ui,sans-serif';
    ov.innerHTML = '<div style="width:100%;max-width:720px;max-height:calc(100vh - 36px);overflow:auto;background:rgba(24,26,34,.97);color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:16px;box-sizing:border-box"></div>';
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.body.appendChild(ov); draw(); load();
  }
  window.FM_TWALL = { open: open };
})();
