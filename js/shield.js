/* shield.js — Oneil Shield. Dua hal:
   1) Kunci Total: bila aplikasi tidak tersambung ke server Oneilverse lebih dari 7 hari (klien kabur ke offline),
      aplikasi mengunci diri di perangkat itu. Begitu tersambung lagi dan toko tidak dibekukan, kunci terbuka otomatis.
   2) Panel keamanan "Oneil Shield" yang menampilkan perlindungan nyata agar klien merasa aman.
   Lapis kedua (aturan server Firestore menolak simpan data saat toko dibekukan Tower) ada di berkas aturan, bukan di sini.
   Catatan jujur: kunci lokal ini menahan 99% kasus; tembok asli yang tidak bisa dihapus klien adalah aturan server. */
(function () {
  'use strict';
  var p = (location.pathname.split('/').pop() || '').toLowerCase();
  if (!/kasir|manager|dashboard/.test(p)) return; // hanya halaman klien

  var KEY = 'fm_shield_seen', VER = '1.0', LOCK_MS = 7 * 24 * 60 * 60 * 1000;
  function now() { return Date.now(); }
  function seen() { try { return +localStorage.getItem(KEY) || 0; } catch (e) { return 0; } }
  function save(t) { try { localStorage.setItem(KEY, String(t)); } catch (e) {} }
  function days(ms) { return Math.max(0, Math.floor(ms / 86400000)); }

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

  /* dipanggil ctrl.js tiap berhasil membaca server (kontak nyata, bukan cache) */
  function touch() { save(now()); hideLock(); }

  function check() {
    var s = seen();
    if (!s) { save(now()); return; } // pertama kali di perangkat ini: catat, jangan kunci
    if (now() - s > LOCK_MS) showLock();
  }

  function openPanel() {
    var id = 'fm-shield-panel', old = document.getElementById(id);
    if (old) { old.style.display = 'flex'; return; }
    var VERLINE = 'v' + VER + ' · Aktif';
    var items = [
      ['Data toko terpisah penuh', 'Transaksi tokomu tersimpan di ruang sendiri, tidak tercampur toko lain.'],
      ['Sandi & PIN terenkripsi', 'Dijaga sistem masuk Firebase, tidak disimpan sebagai teks biasa.'],
      ['Koneksi terkunci (HTTPS)', 'Semua data berpindah lewat jalur terenkripsi.'],
      ['Tersimpan di server Google', 'Infrastruktur Firestore dengan cadangan otomatis.'],
      ['Kunci otomatis', 'Aplikasi mengunci diri bila lebih dari 7 hari tanpa kontak server.']
    ];
    var s = seen(), d = s ? days(now() - s) : 0;
    var m = document.createElement('div'); m.id = id;
    m.style.cssText = 'position:fixed;inset:0;z-index:2147483500;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px;font-family:-apple-system,system-ui,sans-serif';
    m.innerHTML = '<div style="width:100%;max-width:440px;max-height:90vh;overflow:auto;background:#0b1220;color:#e2e8f0;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:20px">'
      + '<div style="display:flex;justify-content:space-between;align-items:center"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:26px">🛡️</span><div><div style="font-weight:900;font-size:17px">Oneil Shield</div><div style="font-size:11px;color:#60a5fa;font-weight:700">' + VERLINE + '</div></div></div><button data-x style="border:0;background:rgba(255,255,255,.1);color:#fff;border-radius:99px;width:32px;height:32px;cursor:pointer">✕</button></div>'
      + '<p style="font-size:12.5px;color:#94a3b8;margin:12px 0 4px">Toko ini dilindungi Oneil Shield. Berikut yang menjaga datamu:</p>'
      + items.map(function (x) { return '<div style="display:flex;gap:10px;padding:10px 0;border-top:1px solid rgba(255,255,255,.07)"><span style="color:#22c55e;font-weight:900">✓</span><div><div style="font-weight:800;font-size:13px">' + x[0] + '</div><div style="font-size:11.5px;color:#94a3b8">' + x[1] + '</div></div></div>'; }).join('')
      + '<div style="margin-top:12px;padding:10px 12px;border-radius:12px;background:rgba(37,99,235,.12);font-size:11.5px;color:#bfdbfe">Terakhir tersambung server: ' + (d <= 0 ? 'hari ini' : d + ' hari lalu') + '.</div>'
      + '</div>';
    m.addEventListener('click', function (e) { if (e.target === m || e.target.hasAttribute('data-x')) m.style.display = 'none'; });
    document.body.appendChild(m);
  }

  window.FM_SHIELD = { touch: touch, openPanel: openPanel, ver: VER, status: function () { var s = seen(); return { lastContactDays: s ? days(now() - s) : 0, locked: locked() }; } };

  function boot() { setTimeout(check, 5000); setInterval(check, 60 * 60 * 1000); } // beri jeda agar ctrl.js sempat menyambung, lalu cek tiap jam
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
