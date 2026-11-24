/* tower-unblock.js — Buka Blokir Login (Tower).
   Menampilkan peran yang terkunci / terblokir karena salah PIN (koleksi login_security) dan membukanya.
   Membuka blokir = menghapus catatan salah PIN peran itu, PIN tidak berubah. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;
  var RL = { staff: 'Admin / Kasir', manager: 'Manager', owner: 'Owner', partner: 'Mitra', acct: 'Akun toko' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* pakai koneksi Tower (db = FM_AUTH.towerDb()), bukan koneksi bawaan yang tidak masuk sebagai Tower */
  function fs() { try { if (typeof db !== 'undefined' && db) return db; } catch (e) {} try { return FM_AUTH.towerDb(); } catch (e) { return null; } }
  function storeName(id) {
    try { var C = (typeof TENANTS_CONFIG !== 'undefined') ? TENANTS_CONFIG : (window.TENANTS_CONFIG || {}); var t = C[String(id).toLowerCase()]; if (t && t.nama) return t.nama; } catch (e) {}
    return '';
  }
  function status(d) {
    if (d.isBlocked) return ['Diblokir permanen', '#f87171', 'rgba(248,113,113,.14)'];
    if ((d.lockUntil || 0) > Date.now()) return ['Terkunci sampai ' + new Date(d.lockUntil).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), '#fbbf24', 'rgba(251,191,36,.14)'];
    return [(d.fails || 0) + 'x salah PIN', '#cbd5e1', 'rgba(148,163,184,.16)'];
  }
  function open() {
    if (typeof towerOverlay !== 'function') return alert('Tower belum siap, muat ulang halaman.');
    var ov = towerOverlay('tw-unblock', 'Buka Blokir Login', 'Peran yang terkunci karena salah PIN. Membuka blokir tidak mengubah PIN.', '<div id="tw-unb-list" style="font-size:13px;opacity:.8;overflow-y:auto;min-height:0;flex:1 1 auto">Memuat…</div>');
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
      if (!rows.length) { box.style.opacity = 1; box.innerHTML = '<div style="padding:22px 6px;text-align:center;opacity:.75">Tidak ada akun yang terkunci. Semua aman.</div>'; return; }
      box.style.opacity = 1;
      box.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px;padding:4px 18px 6px">' + rows.map(function (r) {
        var st = status(r.d), nm = storeName(r.tid);
        return '<div style="display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)">' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-weight:800;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(nm || r.tid.toUpperCase()) + '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px;font-size:11.5px">' +
              '<span style="font-family:ui-monospace,Menlo,Consolas,monospace;opacity:.6">' + esc(r.tid.toUpperCase()) + '</span>' +
              '<span style="opacity:.6">' + esc(RL[r.role] || r.role) + (r.slot ? ' ' + esc(r.slot) : '') + '</span>' +
              '<span style="padding:2px 8px;border-radius:999px;font-weight:700;color:' + st[1] + ';background:' + st[2] + '">' + esc(st[0]) + '</span>' +
            '</div>' +
          '</div>' +
          '<button data-unb="' + esc(r.id) + '" data-nm="' + esc(nm || r.tid.toUpperCase()) + '" style="flex:none;padding:8px 16px;border-radius:999px;font-weight:800;font-size:12.5px;color:#fff;background:#0891b2;border:0;cursor:pointer">Buka blokir</button>' +
        '</div>';
      }).join('') + '</div><div id="tw-unb-msg" style="min-height:18px;margin:4px 18px 10px;font-size:12px;opacity:.8"></div>';
      var msg = box.querySelector('#tw-unb-msg');
      [].forEach.call(box.querySelectorAll('[data-unb]'), function (b) {
        b.onclick = async function () {
          var id = b.getAttribute('data-unb'), nm = b.getAttribute('data-nm');
          var ok = typeof fmAsk === 'function' ? await fmAsk('Buka blokir login ' + nm + '? PIN tidak berubah.') : confirm('Buka blokir login ' + nm + '?');
          if (!ok) return;
          b.disabled = true; b.textContent = 'Membuka…'; b.style.opacity = .6;
          f.collection('login_security').doc(id).delete().then(function () { load(ov); })
            .catch(function (e) { b.disabled = false; b.textContent = 'Buka blokir'; b.style.opacity = 1; msg.style.color = '#f87171'; msg.textContent = 'Gagal membuka blokir: ' + (e && e.message || e); });
        };
      });
    }).catch(function (e) { box.textContent = 'Gagal memuat: ' + (e && e.message || e); });
  }
  window.FM_TUNB = { open: open };
})();
