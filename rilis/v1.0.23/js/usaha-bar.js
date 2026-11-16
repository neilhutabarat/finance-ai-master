/* usaha-bar.js — Bar pilihan usaha dan indikator Admin untuk Manager dan Owner (toko multi-usaha).
   Satu toko, satu alamat: pilihan "Semua usaha" = gabungan, atau satu usaha. Titik hijau = Admin sedang online. Toko satu usaha: tidak tampil. */
(function () {
  'use strict';
  var PAGE = (location.pathname.split('/').pop() || '').toLowerCase();
  if (PAGE !== 'manager.html' && PAGE !== 'dashboard.html') return;
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : ''; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  var bar = null, admins = [], pres = [], started = false;
  var ACTIVE_MS = 150000;

  function status(a) {
    var best = null;
    pres.forEach(function (p) { if (p.who === a.name) { var ms = p.lastSeen && p.lastSeen.toMillis ? p.lastSeen.toMillis() : (Number(p.lastSeen) || 0); if (!best || ms > best.ms) best = { ms: ms, idle: !!p.idle }; } });
    if (!best || Date.now() - best.ms > ACTIVE_MS) return 'off';
    return best.idle ? 'idle' : 'on';
  }
  var COL = { on: '#22c55e', idle: '#eab308', off: '#64748b' }, LBL = { on: 'online', idle: 'diam', off: 'offline' };
  function render() {
    if (!bar) return;
    var v = window.FM_BIZ.view(), L = window.FM_BIZ.list();
    var chip = function (val, txt) { var on = (v === val); return '<button type="button" data-biz="' + esc(val) + '" style="padding:6px 13px;border-radius:999px;border:1px solid ' + (on ? 'transparent' : 'rgba(148,163,184,.4)') + ';background:' + (on ? '#16a34a' : 'transparent') + ';color:' + (on ? '#fff' : 'inherit') + ';font-size:12px;font-weight:800;cursor:pointer">' + esc(txt) + '</button>'; };
    var h = '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><span style="font-size:11.5px;font-weight:800;opacity:.7;margin-right:2px">Tampilkan</span>' + chip('', 'Semua usaha') + L.map(function (n) { return chip(n, n); }).join('') + '</div>';
    if (admins.length) h += '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:8px;font-size:12px">' + admins.map(function (a) { var s = status(a); return '<span title="' + LBL[s] + '" style="display:inline-flex;align-items:center;gap:6px;font-weight:700"><i style="width:9px;height:9px;border-radius:50%;background:' + COL[s] + ';display:inline-block' + (s === 'on' ? ';box-shadow:0 0 0 3px rgba(34,197,94,.25)' : '') + '"></i>' + esc(a.name) + (a.biz ? '<span style="opacity:.6;font-weight:600"> · ' + esc(a.biz) + '</span>' : '') + '</span>'; }).join('') + '</div>';
    bar.innerHTML = h;
  }
  function refreshPages() {
    try { if (typeof renderAllReports === 'function') renderAllReports(); } catch (e) {}
    try { if (window.FM_ANALISA && FM_ANALISA.render) FM_ANALISA.render(); } catch (e) {}
    try { if (window.FM_INSIGHTS && FM_INSIGHTS.render) FM_INSIGHTS.render(); } catch (e) {}
  }
  function build() {
    if (bar || !window.FM_BIZ || !FM_BIZ.enabled()) return;
    var anchor = document.getElementById('fm-actions'); if (!anchor || !anchor.parentNode) return;
    bar = document.createElement('div'); bar.id = 'fm-biz-bar';
    bar.style.cssText = 'margin:0 0 14px;padding:10px 12px;border-radius:16px;border:1px solid rgba(148,163,184,.3);background:rgba(148,163,184,.08)';
    anchor.parentNode.insertBefore(bar, anchor);
    bar.addEventListener('click', function (e) { var b = e.target.closest('[data-biz]'); if (!b) return; FM_BIZ.setView(b.getAttribute('data-biz')); render(); refreshPages(); });
    render();
    try { if (window.FM_AUTH && FM_AUTH.admins && tid()) FM_AUTH.admins(tid()).then(function (a) { admins = a || []; render(); }).catch(function () {}); } catch (e) {}
    try { if (typeof db !== 'undefined' && db && tid()) db.collection('tenant_presence').where('tenantId', '==', tid()).where('role', '==', 'kasir').onSnapshot(function (s) { pres = []; s.forEach(function (d) { pres.push(d.data()); }); render(); }, function () {}); } catch (e) {}
    setInterval(render, 30000);
    if (FM_BIZ.view()) refreshPages();
  }
  function init() { var n = 0, iv = setInterval(function () { build(); if (bar || ++n > 30) clearInterval(iv); }, 500); }
  window.FM_BIZBAR = { rebuild: function () { if (bar) { bar.remove(); bar = null; } build(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
