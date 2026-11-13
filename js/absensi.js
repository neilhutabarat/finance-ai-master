/* absensi.js — Absensi Karyawan. Kasir mencatat Masuk/Pulang, Manager mengatur daftar karyawan, jam kerja, dan melihat rekap;
   Owner hanya melihat. Catatan di koleksi ab_<id toko> (satu dokumen per karyawan per hari), pengaturan di tenant_settings/<id>.absensi. */
(function () {
  'use strict';
  var cfg = { staff: [], jamMasuk: '08:00', jamPulang: '17:00', toleransi: 10 }, rows = [], started = false, ov = null, tab = 'hari', month = '', note = '', who = '', form = null;
  function role() { return window.FM_PLANS ? FM_PLANS.pageRole() : 'manager'; }
  function isMgr() { return role() === 'manager'; }
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : 'default'; }
  function hasDb() { return typeof db !== 'undefined' && db && tid() !== 'default'; }
  function col() { return 'ab_' + tid(); }
  function lsKey(k) { return 'fm_abs_' + k + '_' + tid(); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function iso(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function hm(d) { d = d || new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function mins(t) { var p = String(t || '').split(':'); return p.length < 2 ? null : (Number(p[0]) || 0) * 60 + (Number(p[1]) || 0); }
  function normCfg(x) { x = x || {}; return { staff: Array.isArray(x.staff) ? x.staff : [], jamMasuk: x.jamMasuk || '08:00', jamPulang: x.jamPulang || '17:00', toleransi: x.toleransi != null ? Number(x.toleransi) || 0 : 10 }; }
  function on() { try { return !!(window.FM_PLANS && FM_PLANS.has('absensi')); } catch (e) { return false; } }

  function start() {
    if (started) return; started = true;
    if (hasDb()) {
      try { db.collection('tenant_settings').doc(tid()).onSnapshot(function (s) { cfg = normCfg(s.exists ? s.data().absensi : null); render(); }, function () {}); } catch (e) {}
      try { db.collection(col()).onSnapshot(function (s) { rows = []; s.forEach(function (d) { var x = d.data(); x.id = x.id || d.id; rows.push(x); }); render(); }, function (e) { note = 'Data absensi belum bisa dibaca (' + ((e && e.code) || 'ditolak') + '). Pastikan aturan Firestore terbaru sudah dipasang.'; render(); }); } catch (e) {}
    } else {
      try { cfg = normCfg(JSON.parse(localStorage.getItem(lsKey('cfg')) || '{}')); rows = JSON.parse(localStorage.getItem(lsKey('rows')) || '[]'); } catch (e) {}
    }
  }
  function saveCfg() {
    if (hasDb()) return db.collection('tenant_settings').doc(tid()).set({ absensi: cfg, updatedAt: Date.now() }, { merge: true }).catch(function (e) { alert('Gagal menyimpan: ' + (e && e.message || e)); });
    try { localStorage.setItem(lsKey('cfg'), JSON.stringify(cfg)); } catch (e) {} render(); return Promise.resolve();
  }
  function saveRow(r) {
    if (hasDb()) return db.collection(col()).doc(r.id).set(r, { merge: true }).catch(function (e) { alert('Gagal menyimpan: ' + (e && e.message || e)); });
    var i = rows.findIndex(function (x) { return x.id === r.id; }); if (i >= 0) rows[i] = Object.assign(rows[i], r); else rows.push(r);
    try { localStorage.setItem(lsKey('rows'), JSON.stringify(rows)); } catch (e) {} render(); return Promise.resolve();
  }
  function actor() { try { return (typeof user !== 'undefined' && user && (user.title || user.name)) || ''; } catch (e) { return ''; } }
  function find(sid, day) { return rows.filter(function (r) { return r.staffId === sid && r.date === day; })[0]; }
  function late(r) { var a = mins(r.inAt), b = mins(cfg.jamMasuk); return a != null && b != null && a > b + (Number(cfg.toleransi) || 0); }
  function hours(r) { var a = mins(r.inAt), b = mins(r.outAt); return a != null && b != null && b >= a ? (b - a) / 60 : 0; }
  function fh(h) { return h ? Math.floor(h) + ' j ' + String(Math.round((h % 1) * 60)).padStart(2, '0') + ' m' : '-'; }

  /* ---- catat masuk / pulang ---- */
  function clockIn(sid) {
    var s = cfg.staff.filter(function (x) { return x.id === sid; })[0]; if (!s) return;
    var day = iso(), ex = find(sid, day);
    if (ex && ex.inAt) { note = s.name + ' sudah absen masuk pukul ' + ex.inAt + '.'; return render(); }
    var r = { id: sid + '_' + day, staffId: sid, name: s.name, date: day, status: 'hadir', inAt: hm(), by: actor(), at: Date.now() };
    saveRow(r); note = s.name + ' masuk pukul ' + r.inAt + (late(r) ? ' (terlambat)' : '') + '.'; render();
  }
  function clockOut(sid) {
    var s = cfg.staff.filter(function (x) { return x.id === sid; })[0]; if (!s) return;
    var day = iso(), ex = find(sid, day);
    if (!ex || !ex.inAt) { note = s.name + ' belum absen masuk hari ini.'; return render(); }
    if (ex.outAt) { note = s.name + ' sudah absen pulang pukul ' + ex.outAt + '.'; return render(); }
    saveRow({ id: ex.id, outAt: hm(), outBy: actor() }); note = s.name + ' pulang pukul ' + hm() + '.'; render();
  }

  /* ---- tampilan ---- */
  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:13px;outline:none';
  var btn = 'padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12px;font-weight:700;cursor:pointer';
  var green = ';background:#22c55e;color:#04210f;border-color:#22c55e';
  function lab(t, el) { return '<div><label style="display:block;font-size:11.5px;font-weight:700;margin:0 0 4px;opacity:.8">' + t + '</label>' + el + '</div>'; }
  function stBadge(r) { var c = { hadir: '#4ade80', izin: '#38bdf8', sakit: '#fbbf24', alpha: '#fb7185' }[r.status || 'hadir'] || '#fff'; return '<span style="color:' + c + ';font-weight:700">' + esc((r.status || 'hadir').replace(/^./, function (x) { return x.toUpperCase(); })) + '</span>' + (late(r) && (r.status || 'hadir') === 'hadir' ? ' <span style="color:#fb7185;font-size:11px">terlambat</span>' : ''); }
  function head() {
    return '<div style="display:flex;justify-content:space-between;gap:10px"><div><div style="font-weight:800;font-size:17px">Absensi Karyawan</div><div style="font-size:12px;opacity:.65">' + (role() === 'kasir' ? 'Pilih nama lalu tekan Masuk atau Pulang.' : (isMgr() ? 'Atur karyawan dan lihat rekap kehadiran.' : 'Tampilan baca saja.')) + '</div></div><button data-x style="' + btn + '">Tutup</button></div>' +
      (note ? '<p style="margin:10px 0;padding:10px 12px;border-radius:12px;background:rgba(34,197,94,.14);color:#86efac;font-size:12px">' + esc(note) + '</p>' : '');
  }
  function kasirView() {
    var day = iso(), h = head();
    if (!cfg.staff.length) return h + '<p style="opacity:.7;text-align:center;padding:18px;font-size:13px">Belum ada karyawan terdaftar. Minta Manager menambahkannya.</p>';
    h += '<div style="margin-top:12px">' + lab('Nama karyawan', '<select id="ab-who" style="' + inp + '">' + cfg.staff.map(function (s) { return '<option value="' + esc(s.id) + '"' + (who === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '</select>') + '</div>';
    var sid = who || cfg.staff[0].id, r = find(sid, day);
    h += '<div style="margin:12px 0;padding:12px;border-radius:14px;background:rgba(255,255,255,.07);font-size:13px">Hari ini: ' + (r ? (r.inAt ? 'masuk <b>' + r.inAt + '</b>' : '') + (r.outAt ? ', pulang <b>' + r.outAt + '</b>' : ', belum pulang') + ' · ' + stBadge(r) : 'belum absen') + '</div>';
    h += '<div style="display:flex;gap:10px"><button data-a="in" style="' + btn + green + ';flex:1;padding:12px">Masuk</button><button data-a="out" style="' + btn + ';flex:1;padding:12px">Pulang</button></div>';
    h += '<p style="font-size:11px;opacity:.6;margin-top:10px">Jam kerja ' + esc(cfg.jamMasuk) + ' - ' + esc(cfg.jamPulang) + ', toleransi ' + cfg.toleransi + ' menit.</p>';
    return h;
  }
  function tabHari() {
    var day = iso(), h = '';
    if (!cfg.staff.length) return '<p style="opacity:.7;font-size:13px">Belum ada karyawan.</p>';
    cfg.staff.forEach(function (s) { var r = find(s.id, day); h += '<div style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-top:1px solid rgba(255,255,255,.07);font-size:12.5px"><b>' + esc(s.name) + '</b><span>' + (r ? (r.inAt || '-') + ' - ' + (r.outAt || '...') + ' · ' + stBadge(r) : '<span style="opacity:.55">Belum absen</span>') + '</span></div>'; });
    return h;
  }
  function recap() {
    return cfg.staff.map(function (s) {
      var o = { s: s, hadir: 0, izin: 0, sakit: 0, alpha: 0, tel: 0, jam: 0 };
      rows.forEach(function (r) { if (r.staffId !== s.id || String(r.date).slice(0, 7) !== month) return; var st = r.status || 'hadir'; o[st] = (o[st] || 0) + 1; if (st === 'hadir') { if (late(r)) o.tel++; o.jam += hours(r); } });
      return o;
    });
  }
  function tabRekap() {
    var R = recap(); if (!R.length) return '<p style="opacity:.7;font-size:13px">Belum ada karyawan.</p>';
    return '<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12.5px;min-width:480px"><thead><tr style="text-align:left;opacity:.65"><th style="padding:6px 4px">Karyawan</th><th style="text-align:right">Hadir</th><th style="text-align:right">Terlambat</th><th style="text-align:right">Izin</th><th style="text-align:right">Sakit</th><th style="text-align:right">Alpha</th><th style="text-align:right">Total jam</th></tr></thead><tbody>' +
      R.map(function (o) { return '<tr style="border-top:1px solid rgba(255,255,255,.07)"><td style="padding:7px 4px;font-weight:700">' + esc(o.s.name) + '</td><td style="text-align:right">' + o.hadir + '</td><td style="text-align:right;color:' + (o.tel ? '#fb7185' : 'inherit') + '">' + o.tel + '</td><td style="text-align:right">' + o.izin + '</td><td style="text-align:right">' + o.sakit + '</td><td style="text-align:right;color:' + (o.alpha ? '#fb7185' : 'inherit') + '">' + o.alpha + '</td><td style="text-align:right">' + fh(o.jam) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function tabKaryawan() {
    var h = '<div style="display:flex;gap:8px;align-items:end;margin-top:4px">' + '<div style="flex:1">' + lab('Nama karyawan baru', '<input id="ab-new" placeholder="mis. Sari" style="' + inp + '">') + '</div><button data-a="addstaff" style="' + btn + green + '">Tambah</button></div>';
    h += cfg.staff.map(function (s) { return '<div style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-top:1px solid rgba(255,255,255,.07);font-size:12.5px"><b>' + esc(s.name) + '</b><button data-a="delstaff" data-id="' + esc(s.id) + '" style="' + btn + ';padding:2px 10px;font-size:11px">Hapus</button></div>'; }).join('');
    h += '<div style="font-weight:800;margin:16px 0 6px">Jam kerja</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">' + lab('Jam masuk', '<input id="ab-jm" type="time" value="' + esc(cfg.jamMasuk) + '" style="' + inp + '">') + lab('Jam pulang', '<input id="ab-jp" type="time" value="' + esc(cfg.jamPulang) + '" style="' + inp + '">') + lab('Toleransi terlambat (menit)', '<input id="ab-tol" type="number" min="0" max="120" value="' + cfg.toleransi + '" style="' + inp + '">') + '</div>' +
      '<div style="margin-top:10px"><button data-a="savejam" style="' + btn + green + '">Simpan jam kerja</button></div>';
    h += '<div style="font-weight:800;margin:16px 0 6px">Koreksi / catat izin, sakit, alpha</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">' +
      lab('Karyawan', '<select id="ab-fs" style="' + inp + '">' + cfg.staff.map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.name) + '</option>'; }).join('') + '</select>') + lab('Tanggal', '<input id="ab-fd" type="date" value="' + iso() + '" style="' + inp + '">') +
      lab('Status', '<select id="ab-fst" style="' + inp + '"><option value="hadir">Hadir</option><option value="izin">Izin</option><option value="sakit">Sakit</option><option value="alpha">Alpha</option></select>') + lab('Jam masuk', '<input id="ab-fi" type="time" style="' + inp + '">') + lab('Jam pulang', '<input id="ab-fo" type="time" style="' + inp + '">') + '</div>' +
      '<div style="margin-top:10px"><button data-a="savefix" style="' + btn + green + '">Simpan koreksi</button></div>';
    return h;
  }
  function render() {
    if (!ov || ov.style.display === 'none') return;
    var keep = document.activeElement && document.activeElement.id, h;
    if (role() === 'kasir') h = kasirView();
    else {
      var T = [['hari', 'Hari ini'], ['rekap', 'Rekap bulan']]; if (isMgr()) T.push(['staf', 'Karyawan & jam']);
      if (!T.some(function (x) { return x[0] === tab; })) tab = 'hari';
      h = head() + '<div style="display:flex;gap:6px;margin:14px 0 8px;flex-wrap:wrap;align-items:center">' + T.map(function (x) { return '<button data-tab="' + x[0] + '" style="' + btn + (tab === x[0] ? green : '') + '">' + x[1] + '</button>'; }).join('') + (tab === 'rekap' ? '<input id="ab-month" type="month" value="' + month + '" style="' + inp + ';width:auto;margin-left:auto">' : '') + '</div>' + (tab === 'hari' ? tabHari() : tab === 'rekap' ? tabRekap() : tabKaryawan());
    }
    ov.innerHTML = '<div style="width:100%;max-width:640px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px">' + h + '</div>';
    if (keep) { var el = document.getElementById(keep); if (el && el.focus) try { el.focus(); } catch (e) {} }
  }
  function g(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function act(a, id) {
    note = '';
    if (a === 'in') clockIn(g('ab-who') || (cfg.staff[0] && cfg.staff[0].id));
    else if (a === 'out') clockOut(g('ab-who') || (cfg.staff[0] && cfg.staff[0].id));
    else if (a === 'addstaff') {
      var nm = g('ab-new').trim(); if (!nm) { note = 'Isi nama karyawan.'; return render(); }
      if (cfg.staff.some(function (s) { return s.name.toLowerCase() === nm.toLowerCase(); })) { note = 'Nama itu sudah ada.'; return render(); }
      cfg.staff.push({ id: 's' + Date.now().toString(36), name: nm }); note = nm + ' ditambahkan.'; saveCfg(); render();
    } else if (a === 'delstaff') { cfg.staff = cfg.staff.filter(function (s) { return s.id !== id; }); note = 'Karyawan dihapus dari daftar (riwayat absensi tetap tersimpan).'; saveCfg(); render(); }
    else if (a === 'savejam') { cfg.jamMasuk = g('ab-jm') || '08:00'; cfg.jamPulang = g('ab-jp') || '17:00'; cfg.toleransi = Math.max(0, Math.min(120, Number(g('ab-tol')) || 0)); note = 'Jam kerja disimpan.'; saveCfg(); render(); }
    else if (a === 'savefix') {
      var sid = g('ab-fs'), d = g('ab-fd'), s = cfg.staff.filter(function (x) { return x.id === sid; })[0];
      if (!s || !d) { note = 'Pilih karyawan dan tanggal.'; return render(); }
      var st = g('ab-fst'), rec = { id: sid + '_' + d, staffId: sid, name: s.name, date: d, status: st, inAt: st === 'hadir' ? g('ab-fi') : '', outAt: st === 'hadir' ? g('ab-fo') : '', by: actor(), fixed: true, at: Date.now() };
      saveRow(rec); note = 'Koreksi ' + s.name + ' ' + d + ' disimpan.'; render();
    }
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-absen';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var t = e.target.closest('[data-tab]'); if (t) { tab = t.getAttribute('data-tab'); note = ''; return render(); }
      var b = e.target.closest('[data-a]'); if (b) act(b.getAttribute('data-a'), b.getAttribute('data-id'));
    });
    ov.addEventListener('change', function (e) { if (e.target.id === 'ab-who') { who = e.target.value; note = ''; render(); } else if (e.target.id === 'ab-month' && e.target.value) { month = e.target.value; render(); } });
    document.body.appendChild(ov);
  }
  function floatBtn() {
    if (role() !== 'kasir' || !on() || document.getElementById('fm-absen-fab')) return;
    var b = document.createElement('button'); b.id = 'fm-absen-fab'; b.className = 'fm-fab'; b.setAttribute('data-fc', 'abs'); b.type = 'button'; b.textContent = 'Absen';
    b.style.cssText = 'position:fixed;right:214px;bottom:14px;z-index:2147482000;padding:10px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:#0ea5e9;color:#04121c;font-weight:800;font-size:13px;box-shadow:0 6px 18px rgba(0,0,0,.35);cursor:pointer;' + S;
    b.onclick = function () { FM_ABS.open(); }; document.body.appendChild(b);
  }
  window.FM_ABS = { all: function () { start(); return { cfg: cfg, rows: rows.slice() }; }, open: function () { ensure(); start(); month = iso().slice(0, 7); note = ''; who = ''; ov.style.display = 'flex'; render(); }, _cfg: function (c, r) { cfg = normCfg(c); rows = r || []; }, late: late, hours: hours };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(floatBtn, 800); }); else setTimeout(floatBtn, 800);
})();
