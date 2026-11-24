/* shield.js — Oneil Shield v2.1 (= v2.0 + tambahan di bawah; v2.0 tidak diubah). Tambahan v2.1:
   A) Peringatan perangkat baru untuk Owner/Manager: spanduk kecil bila ada login dari perangkat baru dalam 24 jam terakhir.
   B) Skor Keamanan lebih jujur: ikut turun bila lama tidak kontak server atau ada perangkat baru minggu ini.
   C) Panel menampilkan rincian skor (apa yang menurunkan) dan daftar perangkat baru 7 hari.
   Isi v2.0:
   1) Kunci Total: bila aplikasi tidak tersambung ke server Oneilverse lebih dari 7 hari (klien kabur ke offline),
      aplikasi mengunci diri di perangkat itu. Begitu tersambung lagi dan toko tidak dibekukan, kunci terbuka otomatis.
   2) Kunci PIN salah SUNGGUHAN (server, Firestore), bukan cuma di localStorage browser: 3x salah -> 5 menit,
      5x salah -> 10 menit, 10x salah -> diblokir sampai dibuka manual. Dicek ulang di aturan Firestore (login_security),
      jadi tidak bisa dilewati cuma dengan hapus data browser atau ganti browser.
   3) Log Login per akun (waktu + perangkat), dan tanda "perangkat baru" kalau belum pernah dipakai akun itu.
   4) Catatan ke Tower & Owner (manager_audit_logs) tiap ada akun kena kunci/blokir atau login dari perangkat baru.
   5) Skor Keamanan sederhana + panel "Oneil Shield" yang menampilkan semua perlindungan di atas.
   6) Lencana "Dilindungi Oneil Shield" (dipakai ulang di index.html, struk, laporan PDF).
   7) Ringkasan keamanan bulanan untuk Owner (dipicu saat Owner buka halaman, bukan cron sungguhan — lihat maybeMonthlyReport).
   Catatan jujur: ini menaikkan standar jauh dari sekadar localStorage, tapi tanpa Cloud Functions (paket Spark),
   aturan Firestore untuk login_security tidak bisa divalidasi 100% ketat. Tembok paling kuat tetap aturan server
   yang menolak data toko dibekukan — itu sudah ada di tempat lain, bukan di sini. */
(function () {
  'use strict';
  var p = (location.pathname.split('/').pop() || '').toLowerCase();
  var IS_CLIENT_PAGE = /kasir|manager|dashboard/.test(p);
  var IS_LOGIN_PAGE = /^index\.html?$|^$/.test(p);
  if (!IS_CLIENT_PAGE && !IS_LOGIN_PAGE) return; // hanya halaman klien + portal login

  var VER = '2.1';
  var KEY = 'fm_shield_seen', LOCK_MS = 7 * 24 * 60 * 60 * 1000;
  function now() { return Date.now(); }
  function seen() { try { return +localStorage.getItem(KEY) || 0; } catch (e) { return 0; } }
  function save(t) { try { localStorage.setItem(KEY, String(t)); } catch (e) {} }
  function days(ms) { return Math.max(0, Math.floor(ms / 86400000)); }

  /* ============ Kunci Total (tidak berubah dari versi sebelumnya) ============ */
  var lockId = 'fm-shield-lock';
  function locked() { return !!document.getElementById(lockId); }
  function showLock() {
    if (locked()) return;
    var el = document.createElement('div'); el.id = lockId;
    el.style.cssText = 'position:fixed;inset:0;z-index:2147483600;background:rgba(2,6,23,.985);display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,-apple-system,sans-serif';
    el.innerHTML = '<div style="max-width:430px;text-align:center;color:#e2e8f0"><div style="font-size:46px">🛡️</div>'
      + '<h2 style="font-size:20px;font-weight:900;margin:12px 0 8px">Aplikasi Terkunci</h2>'
      + '<p style="font-size:13px;line-height:1.65;color:#94a3b8">Aplikasi ini belum tersambung ke server Oneilverse selama lebih dari 7 hari. Demi keamanan data, aplikasi dikunci sementara.<br><br>Sambungkan perangkat ke internet untuk membuka otomatis, atau hubungi <b style="color:#fff">Oneilverse</b>.</p>'
      + '<button id="fm-shield-retry" style="margin-top:18px;padding:11px 22px;border-radius:12px;background:#2563eb;color:#fff;font-weight:800;font-size:13px;border:0;cursor:pointer">Coba Sambungkan</button>'
      + '<div style="margin-top:14px;font-size:11px;color:#475569">Dilindungi Oneil Shield v' + VER + '</div></div>';
    document.body.appendChild(el);
    var b = document.getElementById('fm-shield-retry'); if (b) b.onclick = function () { location.reload(); };
  }
  function hideLock() { var el = document.getElementById(lockId); if (el) el.remove(); }
  function touch() { save(now()); hideLock(); }
  function checkOffline() {
    var s = seen();
    if (!s) { save(now()); return; }
    if (now() - s > LOCK_MS) showLock();
  }

  /* ============ akses Firestore mandiri (tidak bergantung auth.js) ============ */
  function fbConf() { try { return (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.firebase) || null; } catch (e) { return null; } }
  function fsdb() {
    try {
      if (!window.firebase) return null;
      if (!firebase.apps.length) { var c = fbConf(); if (!c) return null; firebase.initializeApp(c); }
      return firebase.firestore();
    } catch (e) { return null; }
  }

  /* ============ sidik perangkat (kasar, cukup untuk "pernah dipakai di sini atau belum") ============ */
  function hashStr(s) { var h = 0, i; s = String(s || ''); for (i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; } return Math.abs(h).toString(36); }
  function deviceId() {
    try {
      var k = 'fm_device_id', v = localStorage.getItem(k);
      if (!v) { v = hashStr(navigator.userAgent + '|' + navigator.language + '|' + screen.width + 'x' + screen.height + '|' + (navigator.platform || '') + '|' + Math.random()); localStorage.setItem(k, v); }
      return v;
    } catch (e) { return hashStr(navigator.userAgent); }
  }
  function deviceLabel() {
    var ua = navigator.userAgent || '', os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Mac/.test(ua) ? 'Mac' : 'Perangkat';
    var br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
    return br + ' di ' + os;
  }

  /* ============ kunci PIN salah (server, Firestore login_security) ============ */
  function secKey(tid, role, slot) { return String(tid || '').toLowerCase() + '_' + role + (slot ? '_' + slot : ''); }
  function secRef(tid, role, slot) { var f = fsdb(); return f ? f.collection('login_security').doc(secKey(tid, role, slot)) : null; }
  var BLANK_SEC = { fails: 0, tier: 0, lockUntil: 0, isBlocked: false };

  function checkLock(tid, role, slot) {
    var ref = secRef(tid, role, slot);
    if (!ref) return Promise.resolve(Object.assign({}, BLANK_SEC));
    return ref.get().then(function (s) { return s.exists ? Object.assign({}, BLANK_SEC, s.data()) : Object.assign({}, BLANK_SEC); })
      .catch(function () { return Object.assign({}, BLANK_SEC); }); // gagal baca server: jangan ikut menahan orang
  }

  function auditSec(tid, action, detail) {
    var f = fsdb(); if (!f) return;
    f.collection('manager_audit_logs').add({
      tenantId: tid, id: 'audit_' + Date.now(), action: action, detail: detail,
      actor: 'Oneil Shield', before: '-', after: '-',
      date: new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID'),
      timestamp: Date.now(), createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function () {});
  }

  function registerFail(tid, role, slot) {
    var f = fsdb(), ref = secRef(tid, role, slot);
    if (!f || !ref) return Promise.resolve(Object.assign({}, BLANK_SEC, { fails: 1 }));
    return f.runTransaction(function (tx) {
      return tx.get(ref).then(function (doc) {
        var d = doc.exists ? Object.assign({}, BLANK_SEC, doc.data()) : Object.assign({}, BLANK_SEC);
        if (d.isBlocked) return d;
        d.fails = (d.fails || 0) + 1;
        var t = Date.now(); d._event = null;
        if ((d.tier || 0) === 0 && d.fails >= 3) { d.tier = 1; d.fails = 0; d.lockUntil = t + 5 * 60 * 1000; d._event = 'lock5'; }
        else if (d.tier === 1 && d.fails >= 5) { d.tier = 2; d.fails = 0; d.lockUntil = t + 10 * 60 * 1000; d._event = 'lock10'; }
        else if (d.tier === 2 && d.fails >= 10) { d.isBlocked = true; d.lockUntil = 0; d._event = 'blocked'; }
        tx.set(ref, { fails: d.fails, tier: d.tier, lockUntil: d.lockUntil, isBlocked: d.isBlocked, updatedAt: t }, { merge: true });
        return d;
      });
    }).then(function (d) {
      var nama = secKey(tid, role, slot);
      if (d._event === 'lock5') auditSec(tid, 'KEAMANAN_PIN_TERKUNCI', 'Akun ' + nama + ' salah PIN 3x, terkunci 5 menit');
      else if (d._event === 'lock10') auditSec(tid, 'KEAMANAN_PIN_TERKUNCI', 'Akun ' + nama + ' salah PIN lagi, terkunci 10 menit');
      else if (d._event === 'blocked') auditSec(tid, 'KEAMANAN_PIN_DIBLOKIR', 'Akun ' + nama + ' diblokir otomatis setelah 10x salah PIN berturut-turut');
      return d;
    }).catch(function () { return Object.assign({}, BLANK_SEC, { fails: 1 }); });
  }

  /* Log login toko ini, terbaru dulu. Disaring per toko (wajib oleh aturan server Shield 3.0) lalu diurutkan di perangkat,
     supaya tidak butuh index gabungan baru. Mengembalikan objek mirip snapshot (forEach -> doc.data()). */
  function recentLog(f, key, tid, n) {
    return f.collection('login_log').where('acctKey', '==', key).where('tenantId', '==', tid).get().then(function (snap) {
      var a = []; snap.forEach(function (d) { a.push(d); });
      a.sort(function (x, y) { return (y.data().at || 0) - (x.data().at || 0); });
      a = a.slice(0, n);
      return { empty: !a.length, size: a.length, docs: a, forEach: function (fn) { a.forEach(fn); } };
    });
  }

  function writeLoginLog(tid, role, slot) {
    var f = fsdb(); if (!f) return Promise.resolve({ isNewDevice: false });
    var key = secKey(tid, role, slot), dev = deviceId(), lbl = deviceLabel();
    return recentLog(f, key, tid, 15).then(function (snap) {
      var known = false, hadAny = false;
      snap.forEach(function (doc) { hadAny = true; if (doc.data().deviceId === dev) known = true; });
      var isNew = hadAny && !known;
      f.collection('login_log').add({ acctKey: key, tenantId: tid, role: role, slot: slot || null, deviceId: dev, deviceLabel: lbl, isNewDevice: isNew, at: Date.now(), createdAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(function () {});
      if (isNew) auditSec(tid, 'KEAMANAN_PERANGKAT_BARU', 'Akun ' + key + ' login dari perangkat baru (' + lbl + ')');
      return { isNewDevice: isNew };
    }).catch(function () {
      /* kemungkinan index Firestore belum dibuat saat pertama kali dipakai: tetap catat login-nya, cuma tanpa cek "perangkat baru" */
      f.collection('login_log').add({ acctKey: key, tenantId: tid, role: role, slot: slot || null, deviceId: dev, deviceLabel: lbl, isNewDevice: false, at: Date.now(), createdAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(function () {});
      return { isNewDevice: false };
    });
  }

  function registerSuccess(tid, role, slot) {
    var ref = secRef(tid, role, slot);
    if (ref) ref.set({ fails: 0, tier: 0, lockUntil: 0, isBlocked: false, updatedAt: Date.now() }, { merge: true }).catch(function () {});
    return writeLoginLog(tid, role, slot);
  }

  function recentLogins(tid, role, slot, n) {
    var f = fsdb(); if (!f) return Promise.resolve([]);
    var key = secKey(tid, role, slot);
    return recentLog(f, key, tid, n || 8)
      .then(function (snap) { var out = []; snap.forEach(function (d) { out.push(d.data()); }); return out; })
      .catch(function () { return []; });
  }

  /* ============ skor keamanan sederhana ============ */
  function scoreFromState(sec, extra) {
    var s = 100;
    if (extra) { s -= (extra.offlineDays >= 4 ? 10 : 0); s -= Math.min(15, (extra.newDev7 || 0) * 5); }
    if (sec.isBlocked) s -= 40;
    else if (sec.tier >= 2) s -= 25;
    else if (sec.tier >= 1) s -= 12;
    s -= Math.min(15, (sec.fails || 0) * 3);
    return Math.max(40, s);
  }
  function scoreWhy(sec, extra) {
    var w = [];
    if (sec.isBlocked) w.push('Akun diblokir (-40)'); else if (sec.tier >= 2) w.push('Pernah terkunci 10 menit (-25)'); else if (sec.tier >= 1) w.push('Pernah terkunci 5 menit (-12)');
    if (sec.fails) w.push(sec.fails + ' salah PIN berturut-turut (-' + Math.min(15, sec.fails * 3) + ')');
    if (extra && extra.offlineDays >= 4) w.push('Sudah ' + extra.offlineDays + ' hari tidak kontak server (-10)');
    if (extra && extra.newDev7) w.push(extra.newDev7 + ' login dari perangkat baru 7 hari ini (-' + Math.min(15, extra.newDev7 * 5) + ')');
    return w;
  }
  function tenantNewDevices(tid, sinceMs) {
    var f = fsdb(); if (!f || !tid) return Promise.resolve([]);
    return f.collection('login_log').where('tenantId', '==', tid).get().then(function (snap) {
      var out = []; snap.forEach(function (d) { var t = d.data(); if (t.isNewDevice && (t.at || 0) >= sinceMs) out.push(t); });
      out.sort(function (a, b) { return (b.at || 0) - (a.at || 0); }); return out;
    }).catch(function () { return []; });
  }
  function newDeviceBanner(tid) {
    var DK = 'fm_shield_nd_seen';
    tenantNewDevices(tid, now() - 86400000).then(function (list) {
      var lastSeen = 0; try { lastSeen = +localStorage.getItem(DK) || 0; } catch (e) {}
      var fresh = list.filter(function (t) { return (t.at || 0) > lastSeen; });
      if (!fresh.length || document.getElementById('fm-shield-nd')) return;
      var b = document.createElement('div'); b.id = 'fm-shield-nd';
      b.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:2147483300;max-width:92vw;background:#0b1220;color:#e2e8f0;border:1px solid #f5c542;border-radius:16px;padding:10px 14px;font:600 12px -apple-system,system-ui,sans-serif;display:flex;gap:10px;align-items:center;box-shadow:0 8px 30px rgba(0,0,0,.5)';
      b.innerHTML = '<span>🛡️ Oneil Shield: ' + fresh.length + ' login dari perangkat baru dalam 24 jam (' + String(fresh[0].deviceLabel || '-').replace(/[<>&]/g, '') + '). Bukan Anda? Ganti PIN.</span><button data-x style="border:0;border-radius:10px;padding:6px 10px;background:#f5c542;color:#111;font-weight:800;cursor:pointer">Mengerti</button>';
      b.querySelector('[data-x]').onclick = function () { try { localStorage.setItem(DK, String(now())); } catch (e) {} b.remove(); };
      document.body.appendChild(b);
    });
  }

  /* ============ lencana "Dilindungi Oneil Shield" (dipakai ulang) ============ */
  function badgeHtml(variant) {
    if (variant === 'mini') return '<span style="display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;color:#60a5fa">🛡️ Oneil Shield v' + VER + '</span>';
    return '<div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:#60a5fa"><span>🛡️</span><span>Dilindungi Oneil Shield v' + VER + '</span></div>';
  }
  function badgeText() { return 'Dilindungi Oneil Shield v' + VER; }

  /* ============ ringkasan bulanan Owner (dipicu saat buka halaman, bukan jadwal sungguhan) ============ */
  function maybeMonthlyReport(tid, show) {
    var f = fsdb(); if (!f || !tid) return;
    var now = new Date(), prev = new Date(now.getFullYear(), now.getMonth() - 1, 1), ym = prev.getFullYear() + '-' + String(prev.getMonth() + 1).padStart(2, '0');
    var repId = String(tid).toLowerCase() + '_' + ym, ref = f.collection('security_reports').doc(repId);
    ref.get().then(function (s) {
      if (s.exists) { if (typeof show === 'function') show(s.data()); return; }
      var loginQ = f.collection('login_log').where('tenantId', '==', tid).get();
      var auditQ = f.collection('manager_audit_logs').where('tenantId', '==', tid).get();
      Promise.all([loginQ, auditQ]).then(function (res) {
        var logins = 0, newDev = 0, lockEvents = 0, blockEvents = 0;
        res[0].forEach(function (doc) { var t = doc.data(); if (String(new Date(t.at || 0).getFullYear()) + '-' + String(new Date(t.at || 0).getMonth() + 1).padStart(2, '0') === ym) { logins++; if (t.isNewDevice) newDev++; } });
        res[1].forEach(function (doc) { var t = doc.data(); if (String(new Date(t.timestamp || 0).getFullYear()) + '-' + String(new Date(t.timestamp || 0).getMonth() + 1).padStart(2, '0') === ym) { if (t.action === 'KEAMANAN_PIN_TERKUNCI') lockEvents++; if (t.action === 'KEAMANAN_PIN_DIBLOKIR') blockEvents++; } });
        var data = { ym: ym, logins: logins, newDevices: newDev, lockEvents: lockEvents, blockEvents: blockEvents, at: Date.now() };
        ref.set(data).catch(function () {});
        if (typeof show === 'function') show(data);
      }).catch(function () {});
    }).catch(function () {});
  }
  function renderMonthlyPopup(data) {
    if (!data) return;
    var id = 'fm-shield-monthly', old = document.getElementById(id); if (old) old.remove();
    var BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    var p = data.ym.split('-'), label = (BLN[parseInt(p[1], 10) - 1] || '') + ' ' + p[0];
    var m = document.createElement('div'); m.id = id;
    m.style.cssText = 'position:fixed;inset:0;z-index:2147483400;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px;font-family:-apple-system,system-ui,sans-serif';
    m.innerHTML = '<div style="width:100%;max-width:400px;background:#0b1220;color:#e2e8f0;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:20px">'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-size:22px">🛡️</span><b style="font-size:15px">Ringkasan Keamanan ' + label + '</b></div>'
      + '<div style="font-size:12.5px;color:#94a3b8;margin-bottom:10px">Dari Oneil Shield, toko ini bulan lalu:</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12.5px">'
      + '<div style="background:rgba(255,255,255,.06);border-radius:12px;padding:10px"><div style="font-size:19px;font-weight:900">' + data.logins + '</div><div style="color:#94a3b8">Login berhasil</div></div>'
      + '<div style="background:rgba(255,255,255,.06);border-radius:12px;padding:10px"><div style="font-size:19px;font-weight:900">' + data.newDevices + '</div><div style="color:#94a3b8">Perangkat baru</div></div>'
      + '<div style="background:rgba(255,255,255,.06);border-radius:12px;padding:10px"><div style="font-size:19px;font-weight:900;color:' + (data.lockEvents ? '#f5c542' : '#22c55e') + '">' + data.lockEvents + '</div><div style="color:#94a3b8">Kunci sementara</div></div>'
      + '<div style="background:rgba(255,255,255,.06);border-radius:12px;padding:10px"><div style="font-size:19px;font-weight:900;color:' + (data.blockEvents ? '#ff5252' : '#22c55e') + '">' + data.blockEvents + '</div><div style="color:#94a3b8">Diblokir otomatis</div></div>'
      + '</div><button data-x style="margin-top:14px;width:100%;padding:10px;border-radius:12px;background:#2563eb;color:#fff;font-weight:800;font-size:13px;border:0;cursor:pointer">Tutup</button></div>';
    m.addEventListener('click', function (e) { if (e.target === m || e.target.hasAttribute('data-x')) m.remove(); });
    document.body.appendChild(m);
  }

  /* ============ panel "Oneil Shield" ============ */
  function openPanel(ctx) {
    var id = 'fm-shield-panel', old = document.getElementById(id);
    if (old) { old.remove(); }
    var m = document.createElement('div'); m.id = id;
    m.style.cssText = 'position:fixed;inset:0;z-index:2147483500;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px;font-family:-apple-system,system-ui,sans-serif';
    m.innerHTML = '<div style="width:100%;max-width:440px;max-height:90vh;overflow:auto;background:#0b1220;color:#e2e8f0;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:20px">'
      + '<div style="display:flex;justify-content:space-between;align-items:center"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:26px">🛡️</span><div><div style="font-weight:900;font-size:17px">Oneil Shield</div><div style="font-size:11px;color:#60a5fa;font-weight:700">v' + VER + ' · Aktif</div></div></div><button data-x style="border:0;background:rgba(255,255,255,.1);color:#fff;border-radius:99px;width:32px;height:32px;cursor:pointer">✕</button></div>'
      + '<div id="fm-shield-score" style="margin-top:12px;padding:12px;border-radius:14px;background:rgba(255,255,255,.06);text-align:center">Memuat skor keamanan…</div>'
      + '<p style="font-size:12.5px;color:#94a3b8;margin:14px 0 4px">Toko ini dilindungi Oneil Shield. Berikut yang menjaga datamu:</p>'
      + '<div id="fm-shield-items"></div>'
      + '<div style="margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(37,99,235,.12);font-size:11.5px;color:#bfdbfe" id="fm-shield-contact">Terakhir tersambung server: memuat…</div>'
      + '<p style="font-size:12px;font-weight:800;color:#e2e8f0;margin:14px 0 4px">Log Login Terakhir</p>'
      + '<div id="fm-shield-log" style="font-size:11.5px;color:#94a3b8">Memuat…</div>'
      + '</div>';
    m.addEventListener('click', function (e) { if (e.target === m || e.target.hasAttribute('data-x')) m.remove(); });
    document.body.appendChild(m);

    var s = seen(), d = s ? days(now() - s) : 0;
    var cEl = document.getElementById('fm-shield-contact'); if (cEl) cEl.textContent = 'Terakhir tersambung server: ' + (d <= 0 ? 'hari ini' : d + ' hari lalu') + '.';

    var tid = ctx && ctx.tid, role = ctx && ctx.role, slot = ctx && ctx.slot;
    var items = [
      ['Kunci PIN salah (server)', 'Salah PIN 3x mengunci akun 5 menit, 5x = 10 menit, 10x = diblokir — dicek di server, bukan cuma di perangkatmu.'],
      ['Log Login tercatat', 'Setiap kali ada yang berhasil masuk, waktu dan perangkatnya dicatat dan bisa dilihat Owner.'],
      ['Perangkat baru ditandai', 'Login dari perangkat yang belum pernah dipakai akun ini langsung dicatat dan dilaporkan.'],
      ['Data toko terpisah penuh', 'Transaksi tokomu tersimpan di ruang sendiri, tidak tercampur toko lain.'],
      ['Sandi & PIN terenkripsi', 'Dijaga sistem masuk Firebase, tidak disimpan sebagai teks biasa.'],
      ['Koneksi terkunci (HTTPS)', 'Semua data berpindah lewat jalur terenkripsi.'],
      ['Kunci otomatis bila offline', 'Aplikasi mengunci diri bila lebih dari 7 hari tanpa kontak server.']
    ];
    var iEl = document.getElementById('fm-shield-items');
    if (iEl) iEl.innerHTML = items.map(function (x) { return '<div style="display:flex;gap:10px;padding:10px 0;border-top:1px solid rgba(255,255,255,.07)"><span style="color:#22c55e;font-weight:900">✓</span><div><div style="font-weight:800;font-size:13px">' + x[0] + '</div><div style="font-size:11.5px;color:#94a3b8">' + x[1] + '</div></div></div>'; }).join('');

    if (tid && role) {
      Promise.all([checkLock(tid, role, slot), tenantNewDevices(tid, now() - 7 * 86400000)]).then(function (rr) {
        var sec = rr[0], extra = { offlineDays: d, newDev7: rr[1].length }, why = scoreWhy(sec, extra);
        var sc = scoreFromState(sec, extra), col = sc >= 90 ? '#22c55e' : sc >= 70 ? '#f5c542' : '#ff5252', lab = sc >= 90 ? 'Aman' : sc >= 70 ? 'Waspada' : 'Perlu Perhatian';
        var sEl = document.getElementById('fm-shield-score');
        if (sEl) sEl.innerHTML = '<div style="font-size:30px;font-weight:900;color:' + col + '">' + sc + '<span style="font-size:14px;color:#64748b">/100</span></div><div style="font-size:11.5px;font-weight:700;color:' + col + '">' + lab + '</div>' + (why.length ? '<div style="margin-top:6px;font-size:11px;color:#94a3b8;text-align:left">' + why.map(function (x) { return '• ' + x; }).join('<br>') + '</div>' : '<div style="margin-top:6px;font-size:11px;color:#94a3b8">Tidak ada yang menurunkan skor.</div>');
      });
      recentLogins(tid, role, slot, 8).then(function (list) {
        var lEl = document.getElementById('fm-shield-log'); if (!lEl) return;
        if (!list.length) { lEl.textContent = 'Belum ada catatan login.'; return; }
        lEl.innerHTML = list.map(function (t) { return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-top:1px solid rgba(255,255,255,.06)"><span>' + (t.deviceLabel || '-') + (t.isNewDevice ? ' <span style="color:#f5c542">· baru</span>' : '') + '</span><span style="color:#64748b">' + new Date(t.at || 0).toLocaleString('id-ID') + '</span></div>'; }).join('');
      });
    } else {
      var sEl2 = document.getElementById('fm-shield-score'); if (sEl2) sEl2.innerHTML = '<div style="font-size:13px;color:#94a3b8">Buka panel ini dari dalam toko untuk melihat skor keamanan akunmu.</div>';
      var lEl2 = document.getElementById('fm-shield-log'); if (lEl2) lEl2.textContent = '-';
    }
  }

  window.FM_SHIELD = {
    touch: touch, openPanel: openPanel, ver: VER, newDeviceBanner: newDeviceBanner,
    status: function () { var s = seen(); return { lastContactDays: s ? days(now() - s) : 0, locked: locked() }; },
    checkLock: checkLock, registerFail: registerFail, registerSuccess: registerSuccess,
    badgeHtml: badgeHtml, badgeText: badgeText, maybeMonthlyReport: maybeMonthlyReport, renderMonthlyPopup: renderMonthlyPopup,
    deviceLabel: deviceLabel
  };

  if (IS_CLIENT_PAGE) { (function boot() { setTimeout(checkOffline, 5000); setInterval(checkOffline, 60 * 60 * 1000); })(); }
  if (/manager|dashboard/.test(p)) { setTimeout(function () { try { var t = (typeof fmTokoParam === 'function') ? fmTokoParam() : ''; if (t) newDeviceBanner(t); } catch (e) {} }, 8000); }
})();
