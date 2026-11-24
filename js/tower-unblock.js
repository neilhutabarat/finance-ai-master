/* tower-unblock.js — Buka Blokir Login (Tower).
   Menampilkan peran yang terkunci / terblokir karena salah PIN (koleksi login_security) dan membukanya.
   Membuka blokir = menghapus catatan salah PIN peran itu, PIN tidak berubah. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;
  var RL = { staff: 'Admin / Kasir', manager: 'Manager', owner: 'Owner', partner: 'Mitra' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* pakai koneksi Tower (db = FM_AUTH.towerDb()), bukan koneksi bawaan yang tidak masuk sebagai Tower */
  function fs() { try { if (typeof db !== 'undefined' && db) return db; } catch (e) {} try { return FM_AUTH.towerDb(); } catch (e) { return null; } }
  function storeName(id) {
    try { var C = (typeof TENANTS_CONFIG !== 'undefined') ? TENANTS_CONFIG : (window.TENANTS_CONFIG || {}); var t = C[String(id).toLowerCase()]; if (t && t.nama) return t.nama; } catch (e) {}
    return '';
  }
  function status(d) {
    if (d.isBlocked) return ['Diblokir permanen', '#f87171'];
    if ((d.lockUntil || 0) > Date.now()) return ['Terkunci sampai ' + new Date(d.lockUntil).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), '#fbbf24'];
    return [(d.fails || 0) + 'x salah PIN', '#94a3b8'];
  }
  function open() {
    if (typeof towerOverlay !== 'function') return alert('Tower belum siap, muat ulang halaman.');
    var ov = towerOverlay('tw-unblock', 'Buka Blokir Login', 'Peran yang terkunci karena salah PIN. Membuka blokir tidak mengubah PIN.', '<div id="tw-unb-list" style="font-size:13px;opacity:.8">Memuat…</div>');
    load(ov);
  }
  function load(ov) {
    var box = ov.el.querySelector('#tw-unb-list'), f = fs();
    if (!f) { box.textContent = 'Database belum siap.'; return; }
    f.collection('login_security').get().then(function (snap) {
      var rows = [];
      snap.forEach(function (doc) {
        var d = doc.data() || {};
        if (!d.isBlocked && !((d.lockUntil || 0) > Date.now()) && !(d.fails > 0)) return;
        var p = doc.id.split('_'), tid = p[0], role = p[1] || '', slot = p[2] || '';
        rows.push({ id: doc.id, tid: tid, role: role, slot: slot, d: d });
      });
      rows.sort(function (a, b) { return (b.d.isBlocked ? 2 : 0) + ((b.d.lockUntil || 0) > Date.now() ? 1 : 0) - ((a.d.isBlocked ? 2 : 0) + ((a.d.lockUntil || 0) > Date.now() ? 1 : 0)); });
      if (!rows.length) { box.innerHTML = '<div style="padding:18px 4px;opacity:.75">Tidak ada akun yang terkunci. Semua aman.</div>'; return; }
      box.style.opacity = 1;
      box.innerHTML = rows.map(function (r) {
        var st = status(r.d), nm = storeName(r.tid);
        return '<div style="display:flex;align-items:center;gap:12px;padding:10px 4px;border-top:1px solid rgba(255,255,255,.08)">' +
          '<div style="flex:1;min-width:0"><div style="font-weight:800">' + esc(r.tid.toUpperCase()) + (nm ? ' · ' + esc(nm) : '') + '</div>' +
          '<div style="font-size:12px;opacity:.75">' + esc(RL[r.role] || r.role) + (r.slot ? ' ' + esc(r.slot) : '') + ' · <span style="color:' + st[1] + '">' + esc(st[0]) + '</span></div></div>' +
          '<button data-unb="' + esc(r.id) + '" style="' + (window.TW_BTN || 'padding:8px 12px;border-radius:12px;font-weight:800;font-size:12px;color:#fff;') + 'background:#0891b2;border:0;cursor:pointer">Buka blokir</button></div>';
      }).join('');
      [].forEach.call(box.querySelectorAll('[data-unb]'), function (b) {
        b.onclick = function () {
          var id = b.getAttribute('data-unb');
          if (!confirm('Buka blokir ' + id.toUpperCase() + '?')) return;
          b.disabled = true; b.textContent = 'Membuka…';
          f.collection('login_security').doc(id).delete().then(function () { load(ov); }).catch(function (e) { b.disabled = false; b.textContent = 'Buka blokir'; alert('Gagal: ' + (e && e.message || e)); });
        };
      });
    }).catch(function (e) { box.textContent = 'Gagal memuat: ' + (e && e.message || e); });
  }
  window.FM_TUNB = { open: open };
})();
