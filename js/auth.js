/* auth.js — Login aman dengan Firebase Authentication (email+sandi sintetis per toko & peran).
   - Akun toko:  <idtoko>.<peran>.<gen>@login.oneilverse.invalid  (sandi = PIN minimal 6 karakter)
   - Akun dibuat oleh Tower (semua peran) atau Owner (kasir & manager tokonya) memakai aplikasi sekunder
     supaya sesi yang sedang login tidak terganggu.
   - tenant_access/<uid> = {tenant, role}  -> dibaca rules Firestore untuk membatasi data per toko.
   - tenant_access_cfg/<idtoko> = {gen:{peran:n}, uid:{peran:uid}} -> dibaca halaman login (publik) untuk tahu akun terbaru.
   - Tower masuk dengan email Anda sendiri (akun dibuat manual di Firebase Console).
   LEGACY=true: toko yang akunnya belum diaktifkan masih boleh pakai login lama (sementara, sampai ZIP B). */
(function () {
  'use strict';
  var LEGACY = false;
  var DOMAIN = '@login.oneilverse.invalid';
  var ROLES_BY_PAGE = { 'kasir.html': ['staff', 'manager', 'owner'], 'manager.html': ['manager', 'owner'], 'dashboard.html': ['owner'], 'partner.html': ['partner'], 'provider.html': 'tower' };

  function noop() {}
  function fbConf() { try { return (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.firebase) || null; } catch (e) { return null; } }
  function app() {
    if (!window.firebase) throw new Error('Firebase belum dimuat');
    if (!firebase.apps.length) { var c = fbConf(); if (!c) throw new Error('Konfigurasi Firebase tidak ada'); firebase.initializeApp(c); }
    return firebase.app();
  }
  function auth() { app(); return firebase.auth(); }
  function fs() { app(); return firebase.firestore(); }
  function key(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function email(t, role, gen) { return key(t) + '.' + role + '.' + gen + DOMAIN; }
  function isSynthetic(em) { return !!em && em.slice(-DOMAIN.length) === DOMAIN; }
  function cfgRef(t) { return fs().collection('tenant_access_cfg').doc(t); }
  function getCfg(t) { return cfgRef(t).get().then(function (s) { return s.exists ? s.data() : null; }); }

  /* ---- cache akses (agar kasir tetap jalan saat internet putus) ---- */
  function cacheGet(uid) { try { return JSON.parse(localStorage.getItem('fm_access_' + uid) || 'null'); } catch (e) { return null; } }
  function cacheSet(uid, d) { try { if (d) localStorage.setItem('fm_access_' + uid, JSON.stringify({ tenant: d.tenant, role: d.role })); else localStorage.removeItem('fm_access_' + uid); } catch (e) {} }
  function readAccess(uid) {
    return fs().collection('tenant_access').doc(uid).get().then(function (s) { var d = s.exists ? s.data() : null; cacheSet(uid, d); return { d: d, fresh: true }; });
  }

  var ERR = {
    bad: 'Password / PIN salah.',
    throttle: 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.',
    net: 'Tidak ada koneksi internet. Periksa jaringan lalu coba lagi.',
    denied: 'Akun ini tidak berhak masuk ke toko / peran ini.',
    err: 'Login gagal. Coba lagi.'
  };
  function reason(e) {
    var c = (e && e.code) || '';
    if (/wrong-password|invalid-credential|user-not-found|invalid-email|invalid-login/.test(c)) return 'bad';
    if (/too-many-requests/.test(c)) return 'throttle';
    if (/network|unavailable/.test(c) || /offline/i.test((e && e.message) || '')) return 'net';
    return 'err';
  }

  /* ---- login toko ---- */
  function login(tid, role, pin) {
    return getCfg(tid).then(function (cfg) {
      if (!cfg || !cfg.gen || !cfg.gen[role]) return { legacy: true };
      return auth().signInWithEmailAndPassword(email(tid, role, cfg.gen[role]), pin).then(function (cr) {
        return readAccess(cr.user.uid).then(function (r) {
          var d = r.d;
          if (!d || d.tenant !== tid || d.role !== role) return auth().signOut().catch(noop).then(function () { return { ok: false, reason: 'denied' }; });
          try { localStorage.removeItem('fm_legacy_tenant'); } catch (e) {}
          return { ok: true, access: d };
        });
      }, function (e) { return { ok: false, reason: reason(e) }; });
    }, function (e) { return { ok: false, reason: reason(e) }; });
  }
  function loginTower(em, pw) {
    return auth().signInWithEmailAndPassword(String(em || '').trim(), pw).then(function (cr) {
      if (isSynthetic(cr.user.email)) return auth().signOut().catch(noop).then(function () { return { ok: false, reason: 'denied' }; });
      return { ok: true };
    }, function (e) { return { ok: false, reason: reason(e) }; });
  }

  /* ---- buat / reset akun (Tower atau Owner) ---- */
  function provision(tid, role, pin) {
    pin = String(pin || '');
    if (pin.length < 6) return Promise.reject(new Error('PIN minimal 6 karakter (disarankan 6 angka).'));
    return cfgRef(tid).get().then(function (s) {
      var cfg = s.exists ? s.data() : {};
      var gen = Object.assign({}, cfg.gen || {}), uid = Object.assign({}, cfg.uid || {});
      var g = (gen[role] || 0) + 1, em = email(tid, role, g), oldUid = uid[role];
      var sec = firebase.initializeApp(fbConf(), 'prov' + Date.now());
      return sec.auth().createUserWithEmailAndPassword(em, pin).then(function (cr) {
        var nu = cr.user.uid;
        return sec.auth().signOut().catch(noop).then(function () { return sec.delete().catch(noop); }).then(function () {
          var b = fs().batch();
          b.set(fs().collection('tenant_access').doc(nu), { tenant: tid, role: role, gen: g, email: em, at: Date.now() });
          if (oldUid) b.delete(fs().collection('tenant_access').doc(oldUid));
          gen[role] = g; uid[role] = nu;
          b.set(cfgRef(tid), { tenant: tid, gen: gen, uid: uid, updatedAt: Date.now() }, { merge: true });
          return b.commit();
        });
      }, function (e) { try { sec.delete(); } catch (x) {} throw e; });
    });
  }
  /* beberapa peran sekaligus: harus berurutan (membaca & menulis dokumen cfg yang sama) */
  function provisionMany(tid, map) {
    var done = [], p = Promise.resolve();
    Object.keys(map).forEach(function (role) { if (map[role]) p = p.then(function () { return provision(tid, role, map[role]).then(function () { done.push(role); }); }); });
    return p.then(function () { return done; });
  }
  function changeOwnPin(pin) {
    pin = String(pin || '');
    if (pin.length < 6) return Promise.reject(new Error('PIN minimal 6 karakter (disarankan 6 angka).'));
    var u = auth().currentUser;
    if (!u) return Promise.reject(new Error('Sesi login tidak ditemukan. Keluar lalu masuk lagi.'));
    return u.updatePassword(pin).catch(function (e) {
      if (e && e.code === 'auth/requires-recent-login') throw new Error('Demi keamanan, keluar lalu masuk lagi sebelum mengganti PIN Anda sendiri.');
      throw e;
    });
  }
  function status(tid) { return getCfg(tid); }
  function randomPin() { var a = new Uint32Array(1); (window.crypto || window.msCrypto).getRandomValues(a); return String(100000 + (a[0] % 900000)); }

  /* ---- penjaga halaman ---- */
  function legacyOk(tid, roles) {
    if (!LEGACY) return false;
    try {
      var u = JSON.parse(localStorage.getItem('currentUser') || 'null'); if (!u || !u.role) return false;
      if (roles === 'tower') return u.role === 'superadmin';
      return roles.indexOf(u.role) > -1 && localStorage.getItem('fm_legacy_tenant') === tid;
    } catch (e) { return false; }
  }
  function toLogin() {
    try { ['currentUser', 'auth_role', 'auth_title'].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}
    var q = location.search || '';
    location.replace('index.html' + q);
  }
  function guard(roles) {
    var tid = ''; try { tid = (typeof getActiveTenant === 'function' && getActiveTenant() || {}).id || ''; } catch (e) {}
    var un = null, settled = false;
    function pass() { if (settled) return; settled = true; document.documentElement.classList.remove('fm-authwait'); }
    function fail() { if (settled) return; settled = true; toLogin(); }
    try {
      un = auth().onAuthStateChanged(function (u) {
        if (un) { un(); un = null; }
        if (!u) { legacyOk(tid, roles) ? pass() : fail(); return; }
        if (roles === 'tower') { isSynthetic(u.email) ? fail() : pass(); return; }
        var c = cacheGet(u.uid);
        function okOf(d) { return !!d && d.tenant === tid && roles.indexOf(d.role) > -1; }
        if (c) {
          okOf(c) ? pass() : fail();
          readAccess(u.uid).then(function (r) { if (!okOf(r.d)) { auth().signOut().catch(noop).then(toLogin); } }, noop);
        } else {
          readAccess(u.uid).then(function (r) { okOf(r.d) ? pass() : fail(); }, function () { legacyOk(tid, roles) ? pass() : fail(); });
        }
      });
    } catch (e) { legacyOk(tid, roles) ? pass() : fail(); }
  }

  /* ---- keluar: akhiri sesi Firebase juga ---- */
  function doSignOut(cb) {
    var done = false, f = function () { if (!done) { done = true; cb(); } };
    var t = setTimeout(f, 1500);
    try { auth().signOut().then(function () { clearTimeout(t); f(); }, function () { clearTimeout(t); f(); }); } catch (e) { clearTimeout(t); f(); }
  }
  function wrapLogout() {
    ['logout', 'logoutKasirSession'].forEach(function (n) {
      var f = window[n];
      if (typeof f !== 'function' || f.__fmAuth) return;
      var w = function () { var a = arguments, self = this; try { localStorage.removeItem('fm_legacy_tenant'); } catch (e) {} doSignOut(function () { f.apply(self, a); }); };
      w.__fmAuth = true; window[n] = w;
    });
  }

  window.FM_AUTH = { LEGACY: LEGACY, login: login, loginTower: loginTower, provision: provision, provisionMany: provisionMany, changeOwnPin: changeOwnPin, status: status, randomPin: randomPin, errText: function (r) { return ERR[r] || ERR.err; }, isSynthetic: isSynthetic, signOut: doSignOut, auth: auth };

  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var need = ROLES_BY_PAGE[page];
  if (need) {
    document.documentElement.classList.add('fm-authwait');
    var st = document.createElement('style'); st.textContent = 'html.fm-authwait body{visibility:hidden!important}'; document.head.appendChild(st);
    var run = function () { guard(need); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
    setTimeout(function () { if (document.documentElement.classList.contains('fm-authwait')) toLogin(); }, 15000);
  }
  window.addEventListener('load', wrapLogout);
})();
