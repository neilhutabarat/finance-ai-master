/* usaha.js — satu toko dengan beberapa usaha (mis. Jahit, Karung, Kelontong).
   - Daftar nama usaha diisi Tower di tenant.usaha (array); aktif bila fitur 'banyak_usaha' dicentang.
   - Tiap akun COA dan tiap Induk stok boleh diberi label usaha (field biz). Kosong = "Umum".
   - Transaksi baru menyimpan biz saat disahkan di kasir; transaksi lama dibaca dari label akunnya.
   Toko satu usaha: modul ini tidak menampilkan apa pun. */
(function () {
  'use strict';
  function tn() { try { return (typeof getActiveTenant === 'function') ? getActiveTenant() : null; } catch (e) { return null; } }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function list() {
    var t = tn(), u = t && t.usaha;
    if (!Array.isArray(u)) return [];
    var seen = {}, out = [];
    u.forEach(function (x) { x = String(x || '').trim(); if (x && !seen[x.toLowerCase()]) { seen[x.toLowerCase()] = 1; out.push(x); } });
    return out;
  }
  function enabled() {
    if (!list().length) return false;
    try { return !!(window.FM_PLANS && (FM_PLANS.has('banyak_usaha', 'manager') || FM_PLANS.has('banyak_usaha', 'owner'))); } catch (e) { return false; }
  }
  function canon(name) { var n = String(name || '').trim().toLowerCase(); return list().filter(function (x) { return x.toLowerCase() === n; })[0] || ''; }
  function ofAccount(code) {
    try { var c = STORE.getCOA().filter(function (x) { return String(x.code) === String(code); })[0]; return c ? canon(c.biz) : ''; } catch (e) { return ''; }
  }
  function ofProduct(code) {
    try { var p = STORE.getProducts().filter(function (x) { return x.code === code; })[0]; return p ? canon(p.biz) : ''; } catch (e) { return ''; }
  }
  function ofGroup(g) {
    try { var p = STORE.getProducts().filter(function (x) { return String(x.group || '').toLowerCase() === String(g || '').toLowerCase() && x.biz; })[0]; return p ? canon(p.biz) : ''; } catch (e) { return ''; }
  }
  /* usaha sebuah transaksi: pakai label yang tersimpan saat disahkan, bila tidak ada baca dari akun */
  function ofTx(t) {
    if (!t) return '';
    if (typeof t.biz === 'string') return canon(t.biz);
    return t.isProduct ? ofProduct(t.accountCode) : ofAccount(t.accountCode);
  }
  function ofDraft(d) { return d && d.isProduct ? ofProduct(d.accountCode) : ofAccount(d && d.accountCode); }
  function options(cur) {
    return '<option value="">Umum</option>' + list().map(function (n) { return '<option value="' + esc(n) + '"' + (n === cur ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('');
  }

  /* ---- pilihan usaha di tabel COA (manager dan owner) ---- */
  function decorateCOA() {
    var body = document.getElementById('coa-table-body'); if (!body || !enabled()) return;
    var coa; try { coa = STORE.getCOA(); } catch (e) { return; }
    [].forEach.call(body.querySelectorAll('tr[data-coa]'), function (tr) {
      if (tr.getAttribute('data-biz-done')) return;
      var code = tr.getAttribute('data-coa'), c = coa.filter(function (x) { return String(x.code) === code; })[0]; if (!c) return;
      var td = tr.children[2]; if (!td) return;
      tr.setAttribute('data-biz-done', '1');
      var sel = document.createElement('select'); sel.title = 'Usaha pemilik akun ini'; sel.innerHTML = options(canon(c.biz));
      sel.style.cssText = 'display:block;margin-top:4px;padding:3px 6px;border-radius:8px;border:1px solid rgba(148,163,184,.45);background:transparent;color:inherit;font-size:11px;font-weight:700;text-transform:none';
      sel.onchange = function () {
        var l = STORE.getCOA(), it = l.filter(function (x) { return String(x.code) === code; })[0]; if (!it) return;
        var old = it.biz || 'Umum'; if (sel.value) it.biz = sel.value; else delete it.biz;
        Promise.resolve(STORE.saveCOA(l)).then(function () {
          try { if (typeof recordAuditLog === 'function') recordAuditLog('USAHA_AKUN_COA', 'Usaha akun [' + code + '] ' + it.name, old, sel.value || 'Umum'); } catch (e) {}
        });
      };
      td.appendChild(sel);
    });
  }
  function watch() {
    var body = document.getElementById('coa-table-body'); if (!body) return false;
    decorateCOA();
    new MutationObserver(function () { decorateCOA(); }).observe(body, { childList: true });
    return true;
  }
  function start() { var n = 0, iv = setInterval(function () { if (watch() || ++n > 40) clearInterval(iv); }, 300); }

  window.FM_BIZ = { list: list, enabled: enabled, ofAccount: ofAccount, ofProduct: ofProduct, ofGroup: ofGroup, ofTx: ofTx, ofDraft: ofDraft, options: options, canon: canon };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
