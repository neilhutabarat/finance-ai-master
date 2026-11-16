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
  /* Tower memakai aplikasi Firebase bernama 'tower' (sesi login tersimpan terpisah), sehingga login klien di browser yang sama tidak menimpa sesi Tower */
  var PAGE0 = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var TOWER_CTX = PAGE0 === 'provider.html';
  function tapp() {
    app();
    try { return firebase.app('tower'); } catch (e) { return firebase.initializeApp(fbConf(), 'tower'); }
  }
  function auth() { return TOWER_CTX ? tapp().auth() : (app(), firebase.auth()); }
  function fs() { return TOWER_CTX ? tapp().firestore() : (app(), firebase.firestore()); }
  function key(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function email(t, role, gen) { return key(t) + '.' + role + '.' + gen + DOMAIN; }
  function adminEmail(t, slot, gen) { return key(t) + '.staff.' + String(slot).replace(/[^a-z0-9]/gi, '') + 'g' + gen + DOMAIN; }
  function isSynthetic(em) { return !!em && em.slice(-DOMAIN.length) === DOMAIN; }
  function cfgRef(t) { return fs().collection('tenant_access_cfg').doc(t); }
  function getCfg(t) { return cfgRef(t).get().then(function (s) { return s.exists ? s.data() : null; }); }

  /* ---- cache akses (agar kasir tetap jalan saat internet putus) ---- */
  function cacheGet(uid) { try { return JSON.parse(localStorage.getItem('fm_access_' + uid) || 'null'); } catch (e) { return null; } }
  function cacheSet(uid, d) { try { if (d) localStorage.setItem('fm_access_' + uid, JSON.stringify({ tenant: d.tenant, role: d.role })); else localStorage.removeItem('fm_access_' + uid); } catch (e) {} }
  function readAccess(uid) {
    return fs().collection('tenant_access').doc(uid).get().then(function (s) {
      var d = s.exists ? s.data() : null, unsure = !!(s.metadata && s.metadata.fromCache && !s.exists);
      if (!unsure) cacheSet(uid, d);
      return { d: d, fresh: !unsure, unsure: unsure };
    });
  }

  var ERR = {
    bad: 'Password / PIN salah.',
    throttle: 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.',
    net: 'Tidak ada koneksi internet. Periksa jaringan lalu coba lagi.',
    denied: 'Akun ini tidak berhak masuk ke toko / peran ini.',
    mainoff: 'Admin utama dinonaktifkan untuk toko ini. Pilih nama Admin Anda di kolom pilihan Admin.',
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
  function login(tid, role, pin, slot) {
    return getCfg(tid).then(function (cfg) {
      var em;
      if (role === 'staff' && !slot && cfg && cfg.mainOff) return { ok: false, reason: 'mainoff' };
      if (role === 'staff' && slot) {
        var a = cfg && cfg.admins && cfg.admins[slot];
        if (!a) return { ok: false, reason: 'denied' };
        em = adminEmail(tid, slot, a.gen);
      } else {
        if (!cfg || !cfg.gen || !cfg.gen[role]) return { legacy: true };
        em = email(tid, role, cfg.gen[role]);
      }
      return auth().signInWithEmailAndPassword(em, pin).then(function (cr) {
        return readAccess(cr.user.uid).then(function (r) {
          var d = r.d;
          if (!d || d.tenant !== tid || d.role !== role || (slot ? d.slot !== slot : !!d.slot)) return auth().signOut().catch(noop).then(function () { return { ok: false, reason: 'denied' }; });
          try { localStorage.removeItem('fm_legacy_tenant'); } catch (e) {}
          return { ok: true, access: d };
        });
      }, function (e) { return { ok: false, reason: reason(e) }; });
    }, function (e) { return { ok: false, reason: reason(e) }; });
  }
  function loginTower(em, pw) {
    var ta = tapp().auth();
    return ta.signInWithEmailAndPassword(String(em || '').trim(), pw).then(function (cr) {
      if (isSynthetic(cr.user.email)) return ta.signOut().catch(noop).then(function () { return { ok: false, reason: 'denied' }; });
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
  /* ---- Admin tambahan: banyak akun Admin per toko, tiap akun PIN sendiri, boleh terikat ke satu usaha ---- */
  /* Admin utama (tanpa kode usaha, melihat semua) bisa dinonaktifkan Tower/Owner bila toko memakai Admin per usaha */
  function mainOff(tid) { return getCfg(tid).then(function (c) { return !!(c && c.mainOff); }); }
  function setMainOff(tid, on) { return cfgRef(tid).set({ tenant: tid, mainOff: !!on, updatedAt: Date.now() }, { merge: true }); }
  function admins(tid) { return getCfg(tid).then(function (c) { var a = (c && c.admins) || {}; return Object.keys(a).map(function (k) { return { slot: k, name: a[k].name || k, biz: a[k].biz || '', gen: a[k].gen }; }).sort(function (x, y) { return String(x.name).localeCompare(String(y.name)); }); }, function () { return []; }); }
  function provisionAdmin(tid, slot, pin, name, biz) {
    pin = String(pin || '');
    if (pin.length < 6) return Promise.reject(new Error('PIN minimal 6 karakter (disarankan 6 angka).'));
    slot = String(slot || '').replace(/[^a-z0-9]/gi, '');
    if (!slot) return Promise.reject(new Error('Kode admin tidak valid.'));
    return cfgRef(tid).get().then(function (s) {
      var cfg = s.exists ? s.data() : {}, cur = (cfg.admins || {})[slot] || null;
      var g = ((cur && cur.gen) || 0) + 1, em = adminEmail(tid, slot, g), oldUid = cur && cur.uid;
      var sec = firebase.initializeApp(fbConf(), 'prov' + Date.now());
      return sec.auth().createUserWithEmailAndPassword(em, pin).then(function (cr) {
        var nu = cr.user.uid;
        return sec.auth().signOut().catch(noop).then(function () { return sec.delete().catch(noop); }).then(function () {
          var b = fs().batch(), nm = String(name || (cur && cur.name) || slot).trim(), bz = biz !== undefined ? String(biz || '') : ((cur && cur.biz) || '');
          b.set(fs().collection('tenant_access').doc(nu), { tenant: tid, role: 'staff', slot: slot, name: nm, biz: bz, gen: g, email: em, at: Date.now() });
          if (oldUid) b.delete(fs().collection('tenant_access').doc(oldUid));
          var upd = {}; upd[slot] = { gen: g, uid: nu, name: nm, biz: bz };
          b.set(cfgRef(tid), { tenant: tid, admins: upd, updatedAt: Date.now() }, { merge: true });
          return b.commit();
        });
      }, function (e) { try { sec.delete(); } catch (x) {} throw e; });
    });
  }
  function updateAdmin(tid, slot, name, biz) {
    return cfgRef(tid).get().then(function (s) {
      var cur = s.exists ? ((s.data().admins || {})[slot]) : null; if (!cur) throw new Error('Admin tidak ditemukan.');
      var b = fs().batch(), nm = String(name || cur.name).trim(), bz = String(biz || '');
      var u = {}; u['admins.' + slot + '.name'] = nm; u['admins.' + slot + '.biz'] = bz;
      b.update(cfgRef(tid), u);
      if (cur.uid) b.update(fs().collection('tenant_access').doc(cur.uid), { name: nm, biz: bz });
      return b.commit();
    });
  }
  function removeAdmin(tid, slot) {
    return cfgRef(tid).get().then(function (s) {
      var cur = s.exists ? ((s.data().admins || {})[slot]) : null; if (!cur) return;
      var b = fs().batch(), u = {}; u['admins.' + slot] = firebase.firestore.FieldValue.delete();
      if (cur.uid) b.delete(fs().collection('tenant_access').doc(cur.uid));
      b.update(cfgRef(tid), u);
      return b.commit();
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
  function toLogin(isTower) {
    /* kunci sesi lama hanya dibersihkan oleh Tower; halaman klien tidak boleh menghapus sesi Tower di browser yang sama */
    if (isTower) { try { ['currentUser', 'auth_role', 'auth_title'].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {} }
    var q = location.search || '';
    location.replace(loginUrl());
  }
  function guard(roles) {
    var tid = ''; try { tid = (typeof getActiveTenant === 'function' && getActiveTenant() || {}).id || ''; } catch (e) {}
    var un = null, settled = false;
    function pass() { if (settled) return; settled = true; document.documentElement.classList.remove('fm-authwait'); }
    function fail() { if (settled) return; settled = true; toLogin(roles === 'tower'); }
    /* akun toko berbentuk <idtoko>.<peran>.<gen>@... : tenant dan peran bisa dipastikan dari email tanpa internet */
    function mailOk(u) {
      try { if (!u || !isSynthetic(u.email)) return false; var m = String(u.email).split('@')[0].split('.'); return m.length >= 3 && m[0] === key(tid) && roles.indexOf(m[1]) > -1; } catch (e) { return false; }
    }
    try {
      un = auth().onAuthStateChanged(function (u) {
        if (un) { un(); un = null; }
        if (!u) { legacyOk(tid, roles) ? pass() : fail(); return; }
        if (roles === 'tower') { isSynthetic(u.email) ? fail() : pass(); return; }
        var c = cacheGet(u.uid);
        function okOf(d) { return !!d && d.tenant === tid && roles.indexOf(d.role) > -1; }
        if (c) {
          okOf(c) ? pass() : fail();
          readAccess(u.uid).then(function (r) { if (!r.unsure && !okOf(r.d)) { auth().signOut().catch(noop).then(function () { toLogin(false); }); } }, noop);
        } else if (mailOk(u)) {
          /* sesi sah menurut email: langsung masuk (tidak menunggu server). Pencabutan akses tetap dicek di latar belakang. */
          pass();
          readAccess(u.uid).then(function (r) { if (!r.unsure && !okOf(r.d)) { auth().signOut().catch(noop).then(function () { toLogin(false); }); } }, noop);
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
  /* alamat login toko ini: selalu bawa ?toko= supaya keluar tidak kembali ke toko uji coba */
  function loginUrl() {
    var t = '';
    if (/(provider|partner)\.html$/i.test(location.pathname)) return 'index.html';
    try { t = (typeof fmTokoParam === 'function' ? fmTokoParam() : new URLSearchParams(location.search).get('toko')) || ''; } catch (e) {}
    try { if (t) sessionStorage.setItem('fm_last_toko', t); else t = sessionStorage.getItem('fm_last_toko') || ''; } catch (e) {}
    return 'index.html' + (t ? '?toko=' + encodeURIComponent(t) : '');
  }
  try { loginUrl(); } catch (e) {}
  function wrapLogout() {
    ['logout', 'logoutKasirSession'].forEach(function (n) {
      var f = window[n];
      if (typeof f !== 'function' || f.__fmAuth) return;
      var w = async function () {
        var url = loginUrl();
        if (n === 'logout' && !await fmAsk('Keluar dari sistem?')) return;
        try { ['currentUser', 'auth_role', 'auth_title', 'fm_session_user_v13', 'fm_active_cashier_session', 'fm_legacy_tenant'].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}
        doSignOut(function () { location.replace(url); });
      };
      w.__fmAuth = true; window[n] = w;
    });
  }

  window.FM_AUTH = { mainOff: mainOff, setMainOff: setMainOff, admins: admins, updateAdmin: updateAdmin, provisionAdmin: provisionAdmin, removeAdmin: removeAdmin, curUser: function () { try { return auth().currentUser; } catch (e) { return null; } }, towerDb: function () { return tapp().firestore(); }, LEGACY: LEGACY, login: login, loginTower: loginTower, provision: provision, provisionMany: provisionMany, changeOwnPin: changeOwnPin, status: status, randomPin: randomPin, errText: function (r) { return ERR[r] || ERR.err; }, isSynthetic: isSynthetic, signOut: doSignOut, auth: auth };

  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var need = ROLES_BY_PAGE[page];
  if (need) {
    document.documentElement.classList.add('fm-authwait');
    var st = document.createElement('style'); st.textContent = 'html.fm-authwait body{visibility:hidden!important}'; document.head.appendChild(st);
    var run = function () { guard(need); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
    setTimeout(function () {
      if (!document.documentElement.classList.contains('fm-authwait')) return;
      /* terlalu lama menunggu: jika sesi sah ada, buka halaman; jika tidak, ke login */
      try { var cu = auth().currentUser; if (cu && (need === 'tower' ? !isSynthetic(cu.email) : (isSynthetic(cu.email) && String(cu.email).split('@')[0].split('.')[1] && need.indexOf(String(cu.email).split('@')[0].split('.')[1]) > -1))) { document.documentElement.classList.remove('fm-authwait'); return; } } catch (e) {}
      toLogin(need === 'tower');
    }, 15000);
  }
  window.addEventListener('load', wrapLogout);
})();
