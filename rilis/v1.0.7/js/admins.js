/* admins.js — Admin tambahan per toko: banyak akun Admin, tiap akun punya nama dan PIN sendiri,
   boleh terikat ke satu usaha (hanya melihat barang dan akun usaha itu di Kasir).
   Dipakai Tower (menu Akun Login) dan Owner (dashboard). */
(function () {
  'use strict';
  var ov = null, tid = '', rows = [], msg = '', result = '', mOff = false;
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function tn() {
    try { if (typeof TENANTS_CONFIG !== 'undefined' && tid && TENANTS_CONFIG[tid.toLowerCase()]) return TENANTS_CONFIG[tid.toLowerCase()]; return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; }
  }
  function usahaList() {
    var u = (tn() || {}).usaha || [], out = [];
    if (typeof u === 'string') u = u.split(',');
    u.forEach(function (x) { x = String(x || '').trim(); if (x && out.indexOf(x) < 0) out.push(x); });
    return out;
  }
  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:13px;outline:none';
  var btn = 'padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12px;font-weight:700;cursor:pointer';
  var green = ';background:#22c55e;color:#04210f;border-color:#22c55e';
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-admins';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147483200;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var b = e.target.closest('[data-a]'); if (b) act(b.getAttribute('data-a'), b.getAttribute('data-id'));
    });
    document.body.appendChild(ov);
  }
  function load() { return Promise.all([FM_AUTH.admins(tid), FM_AUTH.mainOff ? FM_AUTH.mainOff(tid).catch(function () { return false; }) : false]).then(function (r) { rows = r[0]; mOff = !!r[1]; render(); }); }
  function bizSel(id, cur) { return '<select id="' + id + '" style="' + inp + ';color-scheme:dark"><option value="">Semua usaha</option>' + usahaList().map(function (b) { return '<option value="' + esc(b) + '"' + (b === cur ? ' selected' : '') + '>' + esc(b) + '</option>'; }).join('') + '</select>'; }
  function render() {
    if (!ov || ov.style.display === 'none') return;
    var h = '<div style="width:100%;max-width:720px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px">' +
      '<div style="display:flex;justify-content:space-between;gap:10px"><div><div style="font-weight:800;font-size:17px">Admin tambahan</div><div style="font-size:12px;opacity:.65">Tiap Admin punya nama dan PIN sendiri. Admin yang terikat usaha hanya melihat barang, akun, dan transaksi usaha itu di Kasir.</div></div><button data-x style="' + btn + '">Tutup</button></div>';
    if (msg) h += '<p style="margin:10px 0;padding:10px 12px;border-radius:12px;background:rgba(245,158,11,.14);color:#fbbf24;font-size:12px">' + esc(msg) + '</p>';
    if (result) h += '<pre style="margin:10px 0;padding:10px 12px;border-radius:12px;background:rgba(34,197,94,.14);color:#86efac;font-size:12.5px;white-space:pre-wrap">' + esc(result) + '</pre>';
    h += '<div style="margin-top:12px;padding:10px 12px;border-radius:14px;border:1px solid ' + (mOff ? 'rgba(34,197,94,.45)' : 'rgba(245,158,11,.45)') + ';background:' + (mOff ? 'rgba(34,197,94,.08)' : 'rgba(245,158,11,.08)') + ';display:flex;gap:10px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:220px;font-size:12.5px"><b>Admin utama: ' + (mOff ? 'nonaktif' : 'aktif (melihat semua usaha)') + '</b><br><span style="opacity:.7;font-size:11.5px">' + (mOff ? 'Hanya ' + rows.length + ' Admin per usaha di bawah yang bisa masuk Kasir.' : 'Admin utama tidak terikat usaha dan melihat semua transaksi. Nonaktifkan bila tiap usaha harus punya Admin sendiri.') + '</span></div><button data-a="main" style="' + btn + '">' + (mOff ? 'Aktifkan Admin utama' : 'Nonaktifkan Admin utama') + '</button></div>';
    h += '<div style="margin-top:14px;overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12.5px;min-width:520px"><tbody>';
    if (!rows.length) h += '<tr><td style="padding:14px;opacity:.7;text-align:center">Belum ada Admin tambahan.</td></tr>';
    rows.forEach(function (a) {
      h += '<tr style="border-top:1px solid rgba(255,255,255,.08)"><td style="padding:8px 6px"><b>' + esc(a.name) + '</b><br><span style="opacity:.6;font-size:11px">' + (a.biz ? 'Usaha: ' + esc(a.biz) : 'Semua usaha') + '</span></td>' +
        '<td style="text-align:right;white-space:nowrap"><button data-a="nama" data-id="' + esc(a.slot) + '" style="' + btn + ';padding:5px 10px">Ubah nama</button> <button data-a="biz" data-id="' + esc(a.slot) + '" style="' + btn + ';padding:5px 10px">Ubah usaha</button> <button data-a="pin" data-id="' + esc(a.slot) + '" style="' + btn + ';padding:5px 10px">PIN baru</button> <button data-a="del" data-id="' + esc(a.slot) + '" style="' + btn + ';padding:5px 10px;color:#fb7185">Hapus</button></td></tr>';
    });
    h += '</tbody></table></div><div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1);font-weight:800;font-size:13px">Tambah Admin</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:8px">' +
      '<div><label style="display:block;font-size:11.5px;font-weight:700;margin-bottom:4px;opacity:.8">Nama</label><input id="ad-name" placeholder="mis. Kasir Karung" style="' + inp + '"></div>' +
      '<div><label style="display:block;font-size:11.5px;font-weight:700;margin-bottom:4px;opacity:.8">Usaha</label>' + bizSel('ad-biz', '') + '</div>' +
      '<div><label style="display:block;font-size:11.5px;font-weight:700;margin-bottom:4px;opacity:.8">PIN (min. 6)</label><input id="ad-pin" value="' + FM_AUTH.randomPin() + '" inputmode="numeric" style="' + inp + '"></div></div>' +
      '<div style="margin-top:12px"><button data-a="add" style="' + btn + green + '">Buat Admin</button></div></div>';
    ov.innerHTML = h;
  }
  function v(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function slotNew() { var n = 1; while (rows.some(function (r) { return r.slot === 'a' + n; })) n++; return 'a' + n + (Date.now() % 1000); }
  function link() { return location.origin + location.pathname.replace(/[^/]*$/, '') + 'index.html?toko=' + tid; }
  function audit(t, a, b) { try { if (typeof ctAudit === 'function') ctAudit(tid, 'ADMIN_TAMBAHAN', t, a, b); else if (typeof recordAuditLog === 'function') recordAuditLog('ADMIN_TAMBAHAN', t, a, b); } catch (e) {} }
  async function act(a, id) {
    msg = ''; var cur = rows.filter(function (r) { return r.slot === id; })[0];
    try {
      if (a === 'add') {
        var nm = v('ad-name').trim(), pin = v('ad-pin').trim();
        if (!nm) { msg = 'Nama Admin wajib diisi.'; return render(); }
        if (rows.some(function (r) { return r.name.toLowerCase() === nm.toLowerCase(); })) { msg = 'Nama Admin sudah dipakai.'; return render(); }
        await FM_AUTH.provisionAdmin(tid, slotNew(), pin, nm, v('ad-biz'));
        result = 'Admin siap: ' + nm + (v('ad-biz') ? ' (' + v('ad-biz') + ')' : '') + '\nPIN: ' + pin + '\nLink: ' + link() + '\nPilih nama ini di layar masuk Admin.';
        audit('Membuat Admin tambahan ' + nm, '-', 'PIN BARU'); await load();
      } else if (a === 'pin' && cur) {
        var np = FM_AUTH.randomPin();
        await FM_AUTH.provisionAdmin(tid, cur.slot, np, cur.name, cur.biz);
        result = 'PIN baru untuk ' + cur.name + ': ' + np; audit('PIN baru Admin ' + cur.name, '-', 'PIN BARU'); await load();
      } else if (a === 'nama' && cur) {
        var nn = window.prompt('Nama baru untuk Admin "' + cur.name + '"', cur.name); if (nn === null) return; nn = nn.trim();
        if (!nn) { msg = 'Nama Admin tidak boleh kosong.'; return render(); }
        if (nn.toLowerCase() !== cur.name.toLowerCase() && rows.some(function (r) { return r.name.toLowerCase() === nn.toLowerCase(); })) { msg = 'Nama Admin sudah dipakai.'; return render(); }
        await FM_AUTH.updateAdmin(tid, cur.slot, nn, cur.biz); audit('Nama Admin ' + cur.name, cur.name, nn); result = 'Nama Admin diubah menjadi ' + nn + '. Berlaku saat Admin masuk lagi.'; await load();
      } else if (a === 'biz' && cur) {
        var list = usahaList(), ans = window.prompt('Usaha untuk ' + cur.name + '\nKetik salah satu: ' + (list.join(', ') || '(belum ada usaha)') + '\nKosongkan = semua usaha', cur.biz || '');
        if (ans === null) return; ans = ans.trim();
        if (ans && list.map(function (x) { return x.toLowerCase(); }).indexOf(ans.toLowerCase()) < 0) { msg = 'Usaha "' + ans + '" tidak ada di daftar usaha toko.'; return render(); }
        ans = list.filter(function (x) { return x.toLowerCase() === ans.toLowerCase(); })[0] || '';
        await FM_AUTH.updateAdmin(tid, cur.slot, cur.name, ans); audit('Usaha Admin ' + cur.name, cur.biz || 'Semua', ans || 'Semua'); result = 'Usaha ' + cur.name + ': ' + (ans || 'Semua usaha') + '. Berlaku saat Admin masuk lagi.'; await load();
      } else if (a === 'main') {
        if (!mOff && !rows.length) { msg = 'Buat dulu minimal satu Admin per usaha sebelum menonaktifkan Admin utama.'; return render(); }
        await FM_AUTH.setMainOff(tid, !mOff); audit('Admin utama', mOff ? 'NONAKTIF' : 'AKTIF', mOff ? 'AKTIF' : 'NONAKTIF'); result = 'Admin utama ' + (mOff ? 'diaktifkan kembali.' : 'dinonaktifkan. Berlaku untuk login berikutnya.'); await load();
      } else if (a === 'del' && cur) {
        if (mOff && rows.length <= 1) { msg = 'Ini Admin terakhir. Aktifkan Admin utama dulu agar toko tetap bisa masuk Kasir.'; return render(); }
        var ok = window.fmAsk ? await window.fmAsk('Hapus Admin ' + cur.name + '? Akunnya langsung tidak bisa masuk.', { ok: 'Ya, Hapus', bahaya: true }) : window.confirm('Hapus Admin ' + cur.name + '?');
        if (!ok) return; await FM_AUTH.removeAdmin(tid, cur.slot); audit('Menghapus Admin ' + cur.name, 'AKTIF', 'DIHAPUS'); result = 'Admin ' + cur.name + ' dihapus.'; await load();
      }
    } catch (e) { msg = 'Gagal: ' + ((e && e.message) || e); render(); }
  }
  function open(t) {
    if (!window.FM_AUTH || !FM_AUTH.admins) return alert('Modul akun belum termuat.');
    try { tid = t || (getActiveTenant() || {}).id || ''; } catch (e) { tid = t || ''; }
    if (!tid) return alert('Toko tidak dikenali.');
    ensure(); msg = ''; result = ''; rows = []; ov.style.display = 'flex'; render(); load();
  }
  window.FM_ADMINS = { open: open };
})();
