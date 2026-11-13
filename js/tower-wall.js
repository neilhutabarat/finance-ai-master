/* tower-wall.js — pengaturan Wallpaper dari Tower (hanya halaman Tower).
   Menulis app_meta/wallpaper = { json: '{"mode":"auto|fixed","fixed":1..4,"order":[1,2,3,4],"start":0,"day":1,"hour":0}' }
   yang dibaca semua toko tanpa login (lihat js/langit.js). Mengubah ini tidak menyentuh data toko. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;
  var DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var STATES = [['siang', 'Siang'], ['fajar', 'Fajar'], ['senja', 'Senja'], ['malam', 'Malam cerah'], ['malamawan', 'Malam berawan'], ['mendung', 'Mendung'], ['hujan', 'Hujan'], ['petir', 'Petir'], ['kabut', 'Kabut']];
  var ov = null, cfg = null, sel = 0, st = 'siang', msg = '', saving = false, seq = 0;
  function DB() { return (typeof db !== 'undefined' && db) ? db : null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dflt() { return { mode: 'auto', fixed: 1, order: [1, 2, 3, 4], start: 0, day: 1, hour: 0 }; }
  function norm(c) {
    var d = dflt(); c = c || {};
    d.mode = c.mode === 'fixed' ? 'fixed' : 'auto';
    d.fixed = Math.min(4, Math.max(1, parseInt(c.fixed, 10) || 1));
    d.order = window.FM_WP ? FM_WP.order(c) : [1, 2, 3, 4];
    d.start = parseInt(c.start, 10) || 0;
    var dy = parseInt(c.day, 10); d.day = (dy >= 0 && dy <= 6) ? dy : 1;
    d.hour = Math.min(23, Math.max(0, parseInt(c.hour, 10) || 0));
    return d;
  }
  function load() {
    var d = DB(); cfg = norm(window.FM_WP ? FM_WP.cfg() : null);
    if (!d) return;
    d.collection('app_meta').doc('wallpaper').get().then(function (s) {
      if (s.exists) { try { cfg = norm(JSON.parse((s.data() || {}).json || '{}')); } catch (e) {} }
      var cur = FM_WP.pick(cfg); if (cfg.mode === 'fixed') sel = cfg.fixed - 1; else sel = cur; draw();
    }).catch(function () { draw(); });
  }
  function fmtWhen(ms) { try { return new Date(ms).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace(/\./g, ':') + ' WIB'; } catch (e) { return ''; } }
  function nowIdx() { return FM_WP.pick(cfg); }
  function draw() {
    if (!ov) return;
    var cur = nowIdx(), nx = FM_WP.next(cfg), nextIdx = nx ? FM_WP.pick(cfg, nx + 1000) : null;
    var BTN = 'padding:9px 14px;border-radius:12px;border:0;font-weight:800;font-size:12.5px;cursor:pointer;color:#fff;';
    var SEL = 'padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#f5f5f7;font-size:12.5px';
    var h = '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><b style="font-size:16px">Wallpaper</b><button data-x style="' + BTN + 'background:rgba(255,255,255,.12)">Tutup</button></div>';
    h += '<div style="margin:8px 0 12px;font-size:12.5px;line-height:1.6;color:#c7cbd6">Tampil sekarang di semua toko: <b style="color:#fff">Gambar ' + (cur + 1) + '</b>' +
      (nx ? '. Berganti ke <b style="color:#fff">Gambar ' + (nextIdx + 1) + '</b> pada ' + esc(fmtWhen(nx)) : ' (dikunci, tidak berganti)') + '.</div>';
    h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">';
    for (var i = 0; i < 4; i++) {
      h += '<button data-pick="' + i + '" style="all:unset;cursor:pointer;display:block;border-radius:12px;overflow:hidden;border:2px solid ' + (i === sel ? '#60a5fa' : 'rgba(255,255,255,.12)') + ';position:relative"><img src="img/wp/t' + (i + 1) + '.jpg" alt="" style="display:block;width:100%;aspect-ratio:16/9;object-fit:cover">' +
        '<span style="position:absolute;left:6px;top:6px;padding:2px 8px;border-radius:99px;background:rgba(0,0,0,.6);font-size:11px;font-weight:800">' + (i + 1) + (i === cur ? ' · tampil' : '') + '</span></button>';
    }
    h += '</div>';
    h += '<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px">' + STATES.map(function (s) { return '<button data-st="' + s[0] + '" style="all:unset;cursor:pointer;padding:6px 11px;border-radius:99px;font-size:11.5px;font-weight:800;background:' + (st === s[0] ? '#2563eb' : 'rgba(255,255,255,.1)') + '">' + s[1] + '</button>'; }).join('') + '</div>';
    h += '<canvas id="fm-tw-cv" width="760" style="display:block;width:100%;border-radius:14px;margin-top:10px;background:#000"></canvas>';
    h += '<p style="font-size:11px;color:#94a3b8;margin:6px 0 0">Pratinjau memakai pengolah yang sama dengan di toko. Di toko, kondisi mengikuti jam matahari dan cuaca nyata di lokasinya.</p>';
    h += '<div style="margin-top:14px;padding:12px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)">' +
      '<label style="display:flex;gap:8px;align-items:center;font-size:13px;font-weight:700"><input type="radio" name="fm-tw-mode" value="auto" ' + (cfg.mode === 'auto' ? 'checked' : '') + '> Otomatis bergilir tiap minggu</label>' +
      '<div style="display:' + (cfg.mode === 'auto' ? 'grid' : 'none') + ';grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 4px">' +
      '<label style="font-size:11.5px;color:#c7cbd6">Hari berganti<br><select data-f="day" style="' + SEL + ';width:100%">' + DAYS.map(function (n, k) { return '<option value="' + k + '"' + (cfg.day === k ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>' +
      '<label style="font-size:11.5px;color:#c7cbd6">Jam berganti (WIB)<br><select data-f="hour" style="' + SEL + ';width:100%">' + Array.apply(null, Array(24)).map(function (_, k) { return '<option value="' + k + '"' + (cfg.hour === k ? ' selected' : '') + '>' + ('0' + k).slice(-2) + ':00</option>'; }).join('') + '</select></label>' +
      '<label style="font-size:11.5px;color:#c7cbd6;grid-column:1/3">Urutan gambar (pisahkan koma)<br><input data-f="order" value="' + esc(cfg.order.join(',')) + '" style="' + SEL + ';width:100%;box-sizing:border-box"></label>' +
      '<div style="grid-column:1/3;font-size:11.5px;color:#c7cbd6">Gambar yang tampil minggu ini: <select data-f="thisweek" style="' + SEL + '">' + cfg.order.map(function (n) { return '<option value="' + n + '"' + (n === cur + 1 ? ' selected' : '') + '>Gambar ' + n + '</option>'; }).join('') + '</select> <span style="color:#94a3b8">(minggu-minggu berikutnya mengikuti urutan)</span></div></div>' +
      '<label style="display:flex;gap:8px;align-items:center;font-size:13px;font-weight:700;margin-top:8px"><input type="radio" name="fm-tw-mode" value="fixed" ' + (cfg.mode === 'fixed' ? 'checked' : '') + '> Kunci satu gambar' + (cfg.mode === 'fixed' ? ': Gambar ' + (sel + 1) + ' (pilih di atas)' : '') + '</label></div>';
    h += '<div style="display:flex;gap:10px;align-items:center;margin-top:14px"><button data-save style="' + BTN + 'background:#2563eb;padding:11px 18px"' + (saving ? ' disabled' : '') + '>' + (saving ? 'Menyimpan...' : 'Simpan') + '</button><span style="font-size:12px;color:' + (/^Gagal/.test(msg) ? '#fca5a5' : '#86efac') + '">' + esc(msg) + '</span></div>';
    ov.firstChild.innerHTML = h; wire(); preview();
  }
  function preview() {
    var cv = ov && ov.querySelector('#fm-tw-cv'); if (!cv || !window.FM_LANGIT) return; var my = ++seq;
    FM_LANGIT.renderTo(cv, sel, st).then(function () { if (my !== seq) return; }).catch(function () {});
  }
  function readForm() {
    var c = JSON.parse(JSON.stringify(cfg));
    ov.querySelectorAll('[data-f]').forEach(function (e) {
      var f = e.getAttribute('data-f');
      if (f === 'day') c.day = parseInt(e.value, 10);
      else if (f === 'hour') c.hour = parseInt(e.value, 10);
      else if (f === 'order') { var o = e.value.split(/[\s,]+/).map(function (v) { return parseInt(v, 10); }).filter(function (v, i, a) { return v >= 1 && v <= 4 && a.indexOf(v) === i; }); if (o.length) c.order = o; }
    });
    return c;
  }
  function wire() {
    ov.querySelector('[data-x]').onclick = close;
    ov.querySelectorAll('[data-pick]').forEach(function (b) { b.onclick = function () { cfg = readForm(); sel = parseInt(b.getAttribute('data-pick'), 10); if (cfg.mode === 'fixed') cfg.fixed = sel + 1; draw(); }; });
    ov.querySelectorAll('[data-st]').forEach(function (b) { b.onclick = function () { st = b.getAttribute('data-st'); draw(); }; });
    ov.querySelectorAll('input[name="fm-tw-mode"]').forEach(function (r) { r.onchange = function () { cfg = readForm(); cfg.mode = r.value; if (cfg.mode === 'fixed') cfg.fixed = sel + 1; draw(); }; });
    ov.querySelectorAll('select[data-f],input[data-f]').forEach(function (e) { e.onchange = function () { var f = e.getAttribute('data-f'); cfg = readForm(); if (f === 'thisweek') { setThisWeek(parseInt(e.value, 10)); } draw(); }; });
    ov.querySelector('[data-save]').onclick = save;
  }
  /* atur 'start' agar minggu ini menampilkan gambar X sesuai urutan */
  function setThisWeek(x) {
    var t = JSON.parse(JSON.stringify(cfg)); t.mode = 'auto'; t.start = 0;
    var p0 = FM_WP.pick(t) + 1, pos0 = cfg.order.indexOf(p0), posX = cfg.order.indexOf(x), n = cfg.order.length;
    if (pos0 >= 0 && posX >= 0) cfg.start = (((posX - pos0) % n) + n) % n;
  }
  function save() {
    var d = DB(); if (!d) { msg = 'Gagal: Firestore belum terhubung.'; draw(); return; }
    cfg = norm(readForm()); if (cfg.mode === 'fixed') cfg.fixed = sel + 1;
    var tw = ov.querySelector('select[data-f="thisweek"]'); if (tw && cfg.mode === 'auto') setThisWeek(parseInt(tw.value, 10));
    saving = true; msg = ''; draw();
    d.collection('app_meta').doc('wallpaper').set({ json: JSON.stringify(cfg), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(function () {
      try { localStorage.setItem('fm_wp_cfg', JSON.stringify(cfg)); } catch (e) {}
      saving = false; msg = 'Tersimpan. Toko memakai pengaturan ini dalam beberapa menit.'; draw();
    }).catch(function (e) { saving = false; msg = 'Gagal: ' + (e && e.message ? e.message : 'tidak bisa menyimpan'); draw(); });
  }
  function close() { if (ov) { ov.remove(); ov = null; } }
  function open() {
    if (!window.FM_WP || !window.FM_LANGIT) { alert('Modul wallpaper belum termuat. Muat ulang halaman.'); return; }
    close(); cfg = norm(FM_WP.cfg()); sel = FM_WP.pick(cfg); msg = ''; st = 'siang';
    ov = document.createElement('div'); ov.id = 'fm-twall';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147482500;background:rgba(0,0,0,.6);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:18px 12px;font-family:-apple-system,system-ui,sans-serif';
    ov.innerHTML = '<div style="width:100%;max-width:780px;background:rgba(24,26,34,.97);color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:16px;box-sizing:border-box"></div>';
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.body.appendChild(ov); draw(); load();
  }
  window.FM_TWALL = { open: open };
})();
