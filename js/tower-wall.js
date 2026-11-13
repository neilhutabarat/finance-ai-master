/* tower-wall.js — kontrol tampilan (wallpaper, kaca, cuaca) dari Tower. Hanya halaman Tower.
   Global  : app_meta/wallpaper = { json: '{"mode","fixed","order","start","day","hour","roles":{kasir,manager,owner},"cond":{mode,until}}' }
             (dibaca semua toko tanpa login, hanya Tower yang menulis — lihat js/langit.js)
   Per toko: tenant_ctrl/<toko>.look = { roles:{kasir?,manager?,owner?}, cond:{mode,until} }  (kosong = ikut global)
   Ukur PC : tenant_ctrl/<toko>.perf = { rec, fps, cores, mem, w, h, br, n, t } — diisi Tower dari data kehadiran (tenant_presence.perf).
   Klien hanya membaca; tidak ada pengaturan ini di sisi klien. Tidak menyentuh data toko. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;
  var DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var STATES = [['siang', 'Siang'], ['fajar', 'Fajar'], ['senja', 'Senja'], ['malam', 'Malam cerah'], ['malamawan', 'Malam berawan'], ['mendung', 'Mendung'], ['hujan', 'Hujan'], ['petir', 'Petir'], ['kabut', 'Kabut']];
  var LEVELS = [['off', 'Mati (polos)'], ['img', 'Gambar saja'], ['static', 'Statis'], ['720', '720p'], ['1080', '1080p'], ['1440', '1440p']];
  var ROLES = [['kasir', 'Kasir'], ['manager', 'Manager'], ['owner', 'Owner']];
  var DEFROLE = { kasir: '1080', manager: 'off', owner: 'off' };
  var RANK = { static: 0, '720': 1, '1080': 2, '1440': 3 };
  var LABEL = { static: 'Sangat lemah', '720': 'Lemah', '1080': 'Sedang', '1440': 'Kuat' };
  var REC = { static: 'Statis', '720': '720p', '1080': '1080p', '1440': '1440p' };
  var DUR = [['0', 'Terus'], ['1', '1 jam'], ['3', '3 jam'], ['tmr', 'Sampai besok 00:00 WIB']];
  var ov = null, cfg = null, sel = 0, st = 'siang', msg = '', saving = false, seq = 0, tab = 'gambar', ctrls = {}, q = '', rowMsg = {}, started = false;

  function DB() { return (typeof db !== 'undefined' && db) ? db : null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function validLevel(v) { return LEVELS.some(function (l) { return l[0] === v; }); }
  function dflt() { return { mode: 'auto', fixed: 1, order: [1, 2, 3, 4], start: 0, day: 1, hour: 0, roles: { kasir: '1080', manager: 'off', owner: 'off' }, cond: { mode: 'auto', until: 0 } }; }
  function norm(c) {
    var d = dflt(); c = c || {};
    d.mode = c.mode === 'fixed' ? 'fixed' : 'auto';
    d.fixed = Math.min(4, Math.max(1, parseInt(c.fixed, 10) || 1));
    d.order = window.FM_WP ? FM_WP.order(c) : [1, 2, 3, 4];
    d.start = parseInt(c.start, 10) || 0;
    var dy = parseInt(c.day, 10); d.day = (dy >= 0 && dy <= 6) ? dy : 1;
    d.hour = Math.min(23, Math.max(0, parseInt(c.hour, 10) || 0));
    ROLES.forEach(function (r) { var v = c.roles && c.roles[r[0]]; d.roles[r[0]] = validLevel(v) ? v : DEFROLE[r[0]]; });
    var cm = c.cond && c.cond.mode; d.cond = { mode: (cm && (cm === 'auto' || STATES.some(function (s) { return s[0] === cm; }))) ? cm : 'auto', until: Number(c.cond && c.cond.until) || 0 };
    return d;
  }
  function tenantsList() {
    var out = []; try { var T = (typeof TENANTS_CONFIG !== 'undefined') ? TENANTS_CONFIG : {}; Object.keys(T).forEach(function (k) { var t = T[k]; if (t && t.id) out.push({ id: t.id, nama: t.nama || t.id }); }); } catch (e) {}
    out.sort(function (a, b) { return String(a.nama).localeCompare(String(b.nama)); }); return out;
  }
  function untilMs(v) {
    if (v === '0') return 0;
    if (v === 'tmr') { var t = Date.now() + 7 * 3600000, d = Math.floor(t / 86400000) + 1; return d * 86400000 - 7 * 3600000; }
    return Date.now() + parseInt(v, 10) * 3600000;
  }
  function fmtWhen(ms) { try { return new Date(ms).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace(/\./g, ':') + ' WIB'; } catch (e) { return ''; } }
  function ago(ms) { var m = Math.round((Date.now() - ms) / 60000); return m < 60 ? m + ' mnt lalu' : m < 1440 ? Math.round(m / 60) + ' jam lalu' : Math.round(m / 1440) + ' hari lalu'; }

  /* ---------- ukur PC: kumpulkan dari data kehadiran, simpan hasil terakhir di tenant_ctrl ---------- */
  function startAgg() {
    var d = DB(); if (started) return; if (!d) { setTimeout(startAgg, 2500); return; } started = true;
    d.collection('tenant_ctrl').onSnapshot(function (s) { ctrls = {}; s.forEach(function (x) { ctrls[x.id] = x.data() || {}; }); if (ov && tab === 'toko') draw(); }, function () {});
    var lastW = {};
    d.collection('tenant_presence').onSnapshot(function (s) {
      var by = {};
      s.forEach(function (x) { var v = x.data() || {}; if (!v.tenantId || !v.perf || !isFinite(v.perf.fps) || RANK[v.perf.rec] == null) return; (by[v.tenantId] = by[v.tenantId] || []).push(v.perf); });
      Object.keys(by).forEach(function (id) {
        var l = by[id], w = l.slice().sort(function (a, b) { return RANK[a.rec] - RANK[b.rec] || a.fps - b.fps; })[0];
        var old = (ctrls[id] || {}).perf, sig = w.rec + '|' + Math.round(w.fps / 5);
        var changed = !old || old.rec !== w.rec || Math.abs((old.fps || 0) - w.fps) >= 8 || (Date.now() - (old.t || 0)) > 12 * 3600000;
        if (!changed || lastW[id] === sig) return; lastW[id] = sig;
        d.collection('tenant_ctrl').doc(id).set({ perf: { rec: w.rec, fps: w.fps, cores: w.cores || 0, mem: w.mem || 0, w: w.w || 0, h: w.h || 0, br: String(w.br || ''), n: l.length, t: Date.now() } }, { merge: true }).catch(function () {});
      });
    }, function () {});
  }
  /* lencana untuk kartu toko di daftar klien */
  function badge(c) {
    var p = c && c.perf; if (!p || RANK[p.rec] == null) return '<span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-500/20 text-slate-300 border border-slate-400/30" title="Belum diukur: toko belum membuka versi terbaru">PC ?</span>';
    var col = p.rec === '1440' ? 'emerald' : p.rec === '1080' ? 'sky' : p.rec === '720' ? 'amber' : 'rose';
    return '<span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-' + col + '-500/20 text-' + col + '-300 border border-' + col + '-400/30" title="' + esc(Math.round(p.fps) + ' fps, ' + p.cores + ' inti, ' + (p.mem ? p.mem + ' GB, ' : '') + p.w + 'x' + p.h + ', ' + p.br) + '">PC ' + esc(LABEL[p.rec]) + ' · ' + esc(REC[p.rec]) + '</span>';
  }

  /* ---------- muat / simpan ---------- */
  function load() {
    var d = DB(); cfg = norm(window.FM_WP ? FM_WP.cfg() : null);
    if (!d) return;
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
      saving = false; msg = 'Tersimpan. Toko memakai pengaturan ini dalam beberapa menit.'; draw();
    }).catch(function (e) { saving = false; msg = 'Gagal: ' + (e && e.message ? e.message : 'tidak bisa menyimpan'); draw(); });
  }
  function setThisWeek(x) {
    var t = JSON.parse(JSON.stringify(cfg)); t.mode = 'auto'; t.start = 0;
    var p0 = FM_WP.pick(t) + 1, pos0 = cfg.order.indexOf(p0), posX = cfg.order.indexOf(x), n = cfg.order.length;
    if (pos0 >= 0 && posX >= 0) cfg.start = (((posX - pos0) % n) + n) % n;
  }

  /* ---------- tampilan ---------- */
  var BTN = 'padding:9px 14px;border-radius:12px;border:0;font-weight:800;font-size:12.5px;cursor:pointer;color:#fff;';
  var SEL = 'padding:7px 9px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#f5f5f7;font-size:12.5px';
  function opts(list, cur) { return list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function tabs() {
    return '<div style="display:flex;gap:6px;margin:10px 0 12px;flex-wrap:wrap">' + [['gambar', 'Gambar & jadwal'], ['tampilan', 'Tampilan & kondisi'], ['toko', 'Per toko']].map(function (t) {
      return '<button data-tab="' + t[0] + '" style="all:unset;cursor:pointer;padding:7px 14px;border-radius:99px;font-size:12.5px;font-weight:800;background:' + (tab === t[0] ? '#2563eb' : 'rgba(255,255,255,.1)') + '">' + t[1] + '</button>'; }).join('') + '</div>';
  }
  function tabGambar() {
    var cur = FM_WP.pick(cfg), nx = FM_WP.next(cfg), nextIdx = nx ? FM_WP.pick(cfg, nx + 1000) : null;
    var h = '<div style="margin:0 0 10px;font-size:12.5px;line-height:1.6;color:#c7cbd6">Tampil sekarang di semua toko: <b style="color:#fff">Gambar ' + (cur + 1) + '</b>' + (nx ? '. Berganti ke <b style="color:#fff">Gambar ' + (nextIdx + 1) + '</b> pada ' + esc(fmtWhen(nx)) : ' (dikunci, tidak berganti)') + '.</div>';
    h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">';
    for (var i = 0; i < 4; i++) h += '<button data-pick="' + i + '" style="all:unset;cursor:pointer;display:block;border-radius:12px;overflow:hidden;border:2px solid ' + (i === sel ? '#60a5fa' : 'rgba(255,255,255,.12)') + ';position:relative"><img src="img/wp/t' + (i + 1) + '.jpg" alt="" style="display:block;width:100%;aspect-ratio:16/9;object-fit:cover"><span style="position:absolute;left:6px;top:6px;padding:2px 8px;border-radius:99px;background:rgba(0,0,0,.6);font-size:11px;font-weight:800">' + (i + 1) + (i === cur ? ' · tampil' : '') + '</span></button>';
    h += '</div><div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px">' + STATES.map(function (s) { return '<button data-st="' + s[0] + '" style="all:unset;cursor:pointer;padding:6px 11px;border-radius:99px;font-size:11.5px;font-weight:800;background:' + (st === s[0] ? '#2563eb' : 'rgba(255,255,255,.1)') + '">' + s[1] + '</button>'; }).join('') + '</div>';
    h += '<canvas id="fm-tw-cv" width="760" style="display:block;width:100%;border-radius:14px;margin-top:10px;background:#000"></canvas>';
    h += '<p style="font-size:11px;color:#94a3b8;margin:6px 0 0">Pratinjau memakai pengolah yang sama dengan di toko.</p>';
    h += '<div style="margin-top:14px;padding:12px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)">' +
      '<label style="display:flex;gap:8px;align-items:center;font-size:13px;font-weight:700"><input type="radio" name="fm-tw-mode" value="auto" ' + (cfg.mode === 'auto' ? 'checked' : '') + '> Otomatis bergilir tiap minggu</label>' +
      '<div style="display:' + (cfg.mode === 'auto' ? 'grid' : 'none') + ';grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 4px">' +
      '<label style="font-size:11.5px;color:#c7cbd6">Hari berganti<br><select data-g="day" style="' + SEL + ';width:100%">' + opts(DAYS.map(function (n, k) { return [k, n]; }), cfg.day) + '</select></label>' +
      '<label style="font-size:11.5px;color:#c7cbd6">Jam berganti (WIB)<br><select data-g="hour" style="' + SEL + ';width:100%">' + opts(Array.apply(null, Array(24)).map(function (_, k) { return [k, ('0' + k).slice(-2) + ':00']; }), cfg.hour) + '</select></label>' +
      '<label style="font-size:11.5px;color:#c7cbd6;grid-column:1/3">Urutan gambar (pisahkan koma)<br><input data-g="order" value="' + esc(cfg.order.join(',')) + '" style="' + SEL + ';width:100%;box-sizing:border-box"></label>' +
      '<div style="grid-column:1/3;font-size:11.5px;color:#c7cbd6">Gambar minggu ini: <select data-g="thisweek" style="' + SEL + '">' + opts(cfg.order.map(function (n) { return [n, 'Gambar ' + n]; }), cur + 1) + '</select></div></div>' +
      '<label style="display:flex;gap:8px;align-items:center;font-size:13px;font-weight:700;margin-top:8px"><input type="radio" name="fm-tw-mode" value="fixed" ' + (cfg.mode === 'fixed' ? 'checked' : '') + '> Kunci satu gambar' + (cfg.mode === 'fixed' ? ': Gambar ' + (sel + 1) + ' (pilih di atas)' : '') + '</label></div>';
    return h;
  }
  function tabTampilan() {
    var h = '<div style="font-size:12.5px;color:#c7cbd6;line-height:1.6;margin-bottom:8px"><b style="color:#fff">Siapa yang dapat dan tingkat kualitas</b> (semua toko). Pengaturan per toko di tab "Per toko" menimpa ini.</div>';
    h += '<div style="display:grid;gap:8px">' + ROLES.map(function (r) { return '<label style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);font-size:13px;font-weight:700">' + r[1] + '<select data-role="' + r[0] + '" style="' + SEL + '">' + opts(LEVELS, cfg.roles[r[0]]) + '</select></label>'; }).join('') + '</div>';
    h += '<p style="font-size:11px;color:#94a3b8;margin:6px 0 0;line-height:1.55"><b>Mati</b>: polos. <b>Gambar saja</b>: gambar di belakang selubung, tanpa kaca. <b>Statis</b>: mengikuti jam dan cuaca, kaca buram, tanpa hujan bergerak. <b>720p/1080p/1440p</b>: tingkat detail kaca dan hujan yang bergerak (1080p kaca cair, 1440p paling detail). PC yang lemah turun satu tingkat otomatis sebagai pelindung.</p>';
    var cm = cfg.cond.mode, active = cm !== 'auto' && (!cfg.cond.until || cfg.cond.until > Date.now());
    h += '<div style="margin-top:14px;padding:12px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)"><b style="font-size:13px">Kondisi manual</b>' +
      '<div style="font-size:12px;color:#c7cbd6;margin:4px 0 8px">' + (active ? 'Sekarang dipaksa: <b style="color:#fff">' + esc((STATES.filter(function (s) { return s[0] === cm; })[0] || [0, cm])[1]) + '</b>' + (cfg.cond.until ? ' sampai ' + esc(fmtWhen(cfg.cond.until)) : ' (terus)') : 'Otomatis: mengikuti jam matahari dan cuaca nyata di lokasi toko.') + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><select data-cm style="' + SEL + '">' + opts([['auto', 'Otomatis (nyata)']].concat(STATES), cm) + '</select><select data-cd style="' + SEL + '">' + opts(DUR, '0') + '</select></div></div>';
    return h;
  }
  function tabToko() {
    var list = tenantsList().filter(function (t) { return !q || (t.nama + ' ' + t.id).toLowerCase().indexOf(q.toLowerCase()) >= 0; });
    var h = '<input data-q placeholder="Cari toko..." value="' + esc(q) + '" style="' + SEL + ';width:100%;box-sizing:border-box;margin-bottom:10px">';
    h += list.map(function (t) {
      var c = ctrls[t.id] || {}, L = c.look || {}, rl = L.roles || {}, cd = L.cond || {}, p = c.perf;
      var perf = p && RANK[p.rec] != null ? 'PC <b style="color:#fff">' + esc(LABEL[p.rec]) + '</b> · saran <b style="color:#86efac">' + esc(REC[p.rec]) + '</b> · ' + Math.round(p.fps) + ' fps, ' + p.cores + ' inti' + (p.mem ? ', ' + p.mem + ' GB' : '') + ', ' + p.w + 'x' + p.h + ', ' + esc(p.br) + (p.n > 1 ? ' (terlemah dari ' + p.n + ' perangkat)' : '') + ' · ' + esc(ago(p.t)) : 'Belum diukur (toko belum membuka versi terbaru)';
      var eff = ROLES.map(function (r) { return r[1] + ' ' + esc((LEVELS.filter(function (l) { return l[0] === (rl[r[0]] || cfg.roles[r[0]]); })[0] || [0, '-'])[1]); }).join(' · ');
      return '<div data-row="' + esc(t.id) + '" style="padding:11px 12px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);margin-bottom:8px">' +
        '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b style="font-size:13px">' + esc(t.nama) + '</b><span style="font-size:11px;color:#94a3b8;font-family:ui-monospace,monospace">' + esc(t.id) + '</span></div>' +
        '<div style="font-size:11.5px;color:#c7cbd6;margin:4px 0">' + perf + '</div><div style="font-size:11px;color:#94a3b8;margin-bottom:6px">Berlaku sekarang: ' + eff + '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px">' + ROLES.map(function (r) { return '<label style="font-size:11px;color:#c7cbd6">' + r[1] + '<br><select data-lr="' + r[0] + '" style="' + SEL + ';width:100%"><option value="">Ikut global</option>' + opts(LEVELS, rl[r[0]] || '') + '</select></label>'; }).join('') +
        '<label style="font-size:11px;color:#c7cbd6">Kondisi<br><select data-lc style="' + SEL + ';width:100%"><option value="">Ikut global</option>' + opts([['auto', 'Otomatis (nyata)']].concat(STATES), cd.mode || '') + '</select></label>' +
        '<label style="font-size:11px;color:#c7cbd6">Durasi kondisi<br><select data-ld style="' + SEL + ';width:100%">' + opts(DUR, '0') + '</select></label></div>' +
        '<div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap"><button data-save-row style="' + BTN + 'background:#2563eb;padding:7px 14px">Simpan</button>' +
        (p && RANK[p.rec] != null ? '<button data-apply-rec="' + esc(p.rec) + '" style="' + BTN + 'background:rgba(34,197,94,.3);padding:7px 12px">Terapkan saran (Kasir ' + esc(REC[p.rec]) + ')</button>' : '') +
        '<button data-clear-row style="' + BTN + 'background:rgba(255,255,255,.12);padding:7px 12px">Ikut global</button><span style="font-size:11.5px;color:' + (/^Gagal/.test(rowMsg[t.id] || '') ? '#fca5a5' : '#86efac') + '">' + esc(rowMsg[t.id] || '') + '</span></div></div>';
    }).join('') || '<div style="color:#94a3b8;font-size:12.5px">Tidak ada toko.</div>';
    return h;
  }
  function draw() {
    if (!ov) return;
    var h = '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><b style="font-size:16px">Tampilan Toko</b><button data-x style="' + BTN + 'background:rgba(255,255,255,.12)">Tutup</button></div>' + tabs();
    h += tab === 'gambar' ? tabGambar() : tab === 'tampilan' ? tabTampilan() : tabToko();
    if (tab !== 'toko') h += '<div style="display:flex;gap:10px;align-items:center;margin-top:14px"><button data-save style="' + BTN + 'background:#2563eb;padding:11px 18px"' + (saving ? ' disabled' : '') + '>' + (saving ? 'Menyimpan...' : 'Simpan') + '</button><span style="font-size:12px;color:' + (/^Gagal/.test(msg) ? '#fca5a5' : '#86efac') + '">' + esc(msg) + '</span></div>';
    var keep = ov.firstChild.scrollTop; ov.firstChild.innerHTML = h; wire(); if (tab === 'gambar') preview(); ov.firstChild.scrollTop = keep;
  }
  function preview() {
    var cv = ov && ov.querySelector('#fm-tw-cv'); if (!cv || !window.FM_LANGIT) return; var my = ++seq;
    FM_LANGIT.renderTo(cv, sel, st).then(function () { if (my !== seq) return; }).catch(function () {});
  }
  function rowRead(row) {
    var roles = {}; row.querySelectorAll('[data-lr]').forEach(function (e) { if (e.value && validLevel(e.value)) roles[e.getAttribute('data-lr')] = e.value; });
    var cm = row.querySelector('[data-lc]').value, dur = row.querySelector('[data-ld]').value, look = {};
    if (Object.keys(roles).length) look.roles = roles;
    if (cm) look.cond = { mode: cm, until: cm === 'auto' ? 0 : untilMs(dur) };
    return look;
  }
  function saveRow(id, look) {
    var d = DB(); if (!d) { rowMsg[id] = 'Gagal: Firestore belum terhubung.'; draw(); return; }
    var ref = d.collection('tenant_ctrl').doc(id), has = look && Object.keys(look).length;
    ref.set({ look: has ? look : firebase.firestore.FieldValue.delete() }, { mergeFields: ['look'] }).then(function () { rowMsg[id] = has ? 'Tersimpan' : 'Ikut global'; draw(); }).catch(function (e) { rowMsg[id] = 'Gagal: ' + (e && e.message ? e.message : 'tidak bisa menyimpan'); draw(); });
  }
  function wire() {
    ov.querySelector('[data-x]').onclick = close;
    ov.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { tab = b.getAttribute('data-tab'); msg = ''; draw(); }; });
    ov.querySelectorAll('[data-pick]').forEach(function (b) { b.onclick = function () { sel = parseInt(b.getAttribute('data-pick'), 10); if (cfg.mode === 'fixed') cfg.fixed = sel + 1; draw(); }; });
    ov.querySelectorAll('[data-st]').forEach(function (b) { b.onclick = function () { st = b.getAttribute('data-st'); draw(); }; });
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
    ov.querySelectorAll('[data-role]').forEach(function (e) { e.onchange = function () { cfg.roles[e.getAttribute('data-role')] = e.value; }; });
    var cm = ov.querySelector('[data-cm]'), cd = ov.querySelector('[data-cd]');
    if (cm) { var upd = function () { cfg.cond = { mode: cm.value, until: cm.value === 'auto' ? 0 : untilMs(cd.value) }; }; cm.onchange = function () { upd(); draw(); }; cd.onchange = upd; }
    var sv = ov.querySelector('[data-save]'); if (sv) sv.onclick = save;
    var qi = ov.querySelector('[data-q]'); if (qi) { qi.oninput = function () { q = qi.value; var pos = qi.selectionStart; draw(); var n = ov.querySelector('[data-q]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }; }
    ov.querySelectorAll('[data-row]').forEach(function (row) {
      var id = row.getAttribute('data-row');
      var s1 = row.querySelector('[data-save-row]'); if (s1) s1.onclick = function () { saveRow(id, rowRead(row)); };
      var s2 = row.querySelector('[data-clear-row]'); if (s2) s2.onclick = function () { saveRow(id, null); };
      var s3 = row.querySelector('[data-apply-rec]'); if (s3) s3.onclick = function () { var l = rowRead(row); l.roles = l.roles || {}; l.roles.kasir = s3.getAttribute('data-apply-rec'); saveRow(id, l); };
    });
  }
  function close() { if (ov) { ov.remove(); ov = null; } }
  function open(t) {
    if (!window.FM_WP || !window.FM_LANGIT) { alert('Modul tampilan belum termuat. Muat ulang halaman.'); return; }
    close(); cfg = norm(FM_WP.cfg()); sel = cfg.mode === 'fixed' ? cfg.fixed - 1 : FM_WP.pick(cfg); msg = ''; st = 'siang'; tab = t || 'gambar'; startAgg();
    ov = document.createElement('div'); ov.id = 'fm-twall';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147482500;background:rgba(0,0,0,.6);display:flex;align-items:flex-start;justify-content:center;padding:18px 12px;font-family:-apple-system,system-ui,sans-serif';
    ov.innerHTML = '<div style="width:100%;max-width:820px;max-height:calc(100vh - 36px);overflow:auto;background:rgba(24,26,34,.97);color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:16px;box-sizing:border-box"></div>';
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.body.appendChild(ov); draw(); load();
  }
  window.FM_TWALL = { open: open, badge: badge };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(startAgg, 4000); }); else setTimeout(startAgg, 4000);
})();
