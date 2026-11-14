/* monitor.js — pemantauan ringan: catat error aplikasi dan login berhasil ke Tower (koleksi error_logs / login_logs).
   Tidak mengirim isi transaksi, PIN, atau data pribadi. Dibatasi agar tidak membanjiri server. */
(function () {
  'use strict';
  var page = (location.pathname.split('/').pop() || '').replace('.html', '') || 'index';
  if (page === 'provider' || page === 'index' || page === '404') return;
  var sent = 0, seen = {}, MAX = 6;
  function tid() { try { return (typeof getActiveTenant === 'function' && getActiveTenant() || {}).id || ''; } catch (e) { return ''; } }
  function role() { return page === 'kasir' ? 'staff' : page === 'manager' ? 'manager' : page === 'dashboard' ? 'owner' : page; }
  function ready() { try { return !!(window.FM_AUTH && FM_AUTH.curUser() && typeof db !== 'undefined' && db && tid()); } catch (e) { return false; } }
  function ver() { try { return (window.FM_THEME && FM_THEME.version) || (document.querySelector('[data-fm-ver]') || {}).textContent || ''; } catch (e) { return ''; } }
  function who() { try { var u = JSON.parse(localStorage.getItem('currentUser') || 'null'); return u ? { name: String(u.title || '').slice(0, 40), slot: u.slot || '' } : {}; } catch (e) { return {}; } }
  function cut(s, n) { return String(s == null ? '' : s).slice(0, n); }
  function logError(msg, src, line, stack) {
    try {
      msg = cut(msg, 300); if (!msg || sent >= MAX) return;
      var k = msg + '|' + line; if (seen[k]) return; seen[k] = 1;
      if (/ResizeObserver|Script error\.?$|Non-Error promise rejection/i.test(msg)) return;
      if (!ready()) return; sent++;
      db.collection('error_logs').add({ tenantId: tid(), role: role(), page: page, msg: msg, src: cut(String(src || '').split('/').pop(), 80), line: Number(line) || 0, stack: cut(stack, 700), ver: cut(ver(), 30), ua: cut(navigator.userAgent, 120), ms: Date.now() }).catch(function () {});
    } catch (e) {}
  }
  window.addEventListener('error', function (e) { logError(e.message, e.filename, e.lineno, e.error && e.error.stack); });
  window.addEventListener('unhandledrejection', function (e) { var r = e.reason; logError((r && (r.message || r.code)) || String(r), '', 0, r && r.stack); });
  /* catatan login: sekali per sesi tab, setelah akun terbaca */
  var tries = 0, iv = setInterval(function () {
    if (++tries > 40) return clearInterval(iv);
    if (!ready()) return;
    clearInterval(iv);
    try {
      var key = 'fm_login_logged_' + tid() + '_' + role();
      if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1');
      var w = who();
      db.collection('login_logs').add({ tenantId: tid(), role: role(), page: page, name: w.name || '', slot: w.slot || '', ver: cut(ver(), 30), ua: cut(navigator.userAgent, 120), ms: Date.now() }).catch(function () {});
    } catch (e) {}
  }, 1500);
})();
