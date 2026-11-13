/* bantuan.js — Bantuan di dalam aplikasi: panduan per fitur (dengan pencarian) dan Tiket Bantuan ke tim.
   Tiket disimpan di provider_tickets dengan type:'bantuan'; balasan dari Tower tampil di sini. Tombol "?" muncul di Kasir, Manager, Owner. */
(function () {
  'use strict';
  var PAGE = (location.pathname.split('/').pop() || '').toLowerCase();
  if (!/^(kasir|manager|dashboard)\.html$/.test(PAGE)) return;
  function role() { return window.FM_PLANS ? FM_PLANS.pageRole() : (PAGE === 'manager.html' ? 'manager' : PAGE === 'dashboard.html' ? 'owner' : 'kasir'); }
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : 'default'; }
  function hasDb() { return typeof db !== 'undefined' && db && tid() !== 'default'; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function f(k) { try { return !!(window.FM_PLANS && FM_PLANS.has(k)); } catch (e) { return false; } }
  function actor() { try { return (typeof user !== 'undefined' && user && (user.title || user.name)) || ''; } catch (e) { return ''; } }
  function ver() { try { return (window.FM_THEME && FM_THEME.version) || ''; } catch (e) { return ''; } }

  /* [fitur (null = selalu), peran yang melihat, judul, langkah-langkah] */
  var K = ['kasir', 'manager', 'owner'], M = ['manager', 'owner'];
  var TOPICS = [
    [null, K, 'Mencatat penjualan', ['Pilih akun atau barang, isi jumlah, lalu tambahkan ke daftar.', 'Cek daftar, pilih cara bayar (Tunai, QRIS, Transfer).', 'Tekan Konfirmasi & Cetak Struk Sah. Struk bisa dicetak atau dibagikan.']],
    [null, K, 'Mencatat pengeluaran', ['Pilih akun pengeluaran, isi jumlah dan keterangan.', 'Tambahkan ke daftar lalu konfirmasi seperti penjualan.']],
    [null, K, 'Koreksi atau salah input', ['Transaksi yang sudah dikonfirmasi dikoreksi oleh Manager.', 'Beri tahu Manager nomor atau jam transaksinya.']],
    ['stok', K, 'Stok barang', ['Stok berkurang otomatis saat barang terjual.', 'Manager mengatur barang, Induk, dan harga lewat Stok & Closing.', 'Di daftar stok, tombol Ubah dan Salin mempercepat input barang mirip.']],
    ['satuan_ganda', K, 'Satuan ganda (mis. pcs dan dus)', ['Di Kasir pilih satuan jual di samping jumlah.', 'Stok tetap dihitung dalam satuan terkecil.']],
    ['barcode', K, 'Barcode', ['Tekan tombol kamera untuk memindai barcode barang.', 'Bila barcode tidak dikenal, aplikasi mencari berdasarkan nama.']],
    ['piutang', K, 'Piutang & Utang', ['Buka tombol Piutang & Utang.', 'Tambah pelanggan atau pemasok, lalu catat piutang atau utangnya.', 'Pembayaran sebagian (DP) dicatat sebagai transaksi otomatis.', 'Tombol Tagih mengirim pengingat lewat WhatsApp.']],
    ['diskon', K, 'Diskon & Promo', ['Promo otomatis berlaku saat barang yang cocok dimasukkan.', 'Diskon manual hanya sampai batas persen dari Manager.', 'Manager mengatur promo lewat Diskon & Promo.']],
    ['absensi', K, 'Absensi karyawan', ['Tekan tombol Absen, pilih nama, lalu Masuk atau Pulang.', 'Manager mengatur daftar karyawan dan jam kerja, dan melihat rekap bulanan.']],
    ['offline_penuh', K, 'Saat internet putus', ['Tetap catat transaksi seperti biasa.', 'Catatan tersimpan di perangkat dan terkirim otomatis saat online.', 'Jangan keluar akun atau hapus data browser sebelum penanda "sudah tersinkron" muncul.']],
    ['coa', M, 'Daftar akun (COA)', ['Buka Kelola Akun (COA) untuk menambah, mengubah, atau mengurutkan akun.', 'Akun dipakai Kasir saat mencatat transaksi.']],
    ['stok_closing', M, 'Closing stok', ['Buka Stok & Closing, hitung stok fisik, lalu simpan closing periode.', 'Selisih stok tampil sebagai penyesuaian.']],
    ['gaji', M, 'Laporan gaji', ['Buka Laporan Gaji, pilih bulan, tambah catatan gaji karyawan.', 'Bila gaji otomatis aktif, gaji tercatat sebagai pengeluaran.']],
    ['banyak_usaha', M, 'Banyak usaha dalam satu toko', ['Buka Ringkasan Usaha untuk melihat pemasukan dan pengeluaran tiap usaha.', 'Ketuk baris usaha untuk melihat rincian per Admin.']],
    ['admin_usaha', M, 'Admin tambahan per usaha', ['Owner menambah Admin dan menentukan usahanya.', 'Admin hanya melihat barang dan akun usahanya di Kasir.']],
    ['arus_kas', M, 'Arus kas', ['Buka Arus Kas & Anggaran, tab Arus Kas.', 'Pilih bulan untuk melihat uang masuk, keluar, per minggu, dan per cara bayar.']],
    ['anggaran', M, 'Anggaran bulanan', ['Di tab Anggaran, isi batas pengeluaran per akun dan target pemasukan.', 'Batang hijau aman, kuning hampir habis, merah lewat batas.']],
    ['rekon', M, 'Rekonsiliasi kas', ['Di tab Rekonsiliasi Kas, isi uang awal laci dan uang tunai yang dihitung.', 'Aplikasi menunjukkan selisih terhadap catatan, lalu simpan sebagai riwayat.']],
    ['neraca', M, 'Neraca', ['Isi tanggal mulai, kas awal, dan modal awal sekali di awal.', 'Tambah aset tetap, utang lain, atau tambahan modal bila ada.', 'Tombol Salin teks membagikan neraca ke WhatsApp.']],
    ['pajak_bulanan', M, 'Laporan pajak', ['Atur tarif di bagian Pengaturan pajak.', 'Tabel menampilkan perkiraan pajak tiap bulan; tandai yang sudah disetor.', 'Angkanya perkiraan, konfirmasi ke konsultan pajak.']],
    ['backup', M, 'Backup & ekspor', ['Buka Backup & Ekspor, pilih Excel atau salinan lengkap.', 'Simpan file di tempat aman secara berkala.']],
    [null, M, 'Fitur toko', ['Tombol Fitur Toko menampilkan fitur yang aktif.', 'Untuk menambah atau mematikan fitur, hubungi tim lewat tab Tanya Tim.']]
  ];
  function topics() { return TOPICS.filter(function (t) { return t[1].indexOf(role()) >= 0 && (!t[0] || f(t[0])); }); }

  var ov = null, tab = 'panduan', q = '', openIdx = -1, tickets = [], started = false, note = '', sending = false, lastSend = 0;
  function seenKey() { return 'fm_help_seen_' + tid(); }
  function seen() { try { return Number(localStorage.getItem(seenKey())) || 0; } catch (e) { return 0; } }
  function unread() { var s = seen(); return tickets.filter(function (t) { return t.repliedAtMs && t.repliedAtMs > s; }).length; }
  function start() {
    if (started || !hasDb()) return; started = true;
    try { db.collection('provider_tickets').where('tenantId', '==', tid()).where('type', '==', 'bantuan').onSnapshot(function (s) { tickets = []; s.forEach(function (d) { var x = d.data(); x.docId = d.id; tickets.push(x); }); tickets.sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); }); badge(); render(); }, function () {}); } catch (e) {}
  }
  function badge() { var b = document.getElementById('fm-help-fab'), n = unread(); if (!b) return; var d = b.querySelector('i'); if (d) d.style.display = n ? 'block' : 'none'; }

  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:13px;outline:none';
  var btn = 'padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12px;font-weight:700;cursor:pointer';
  var green = ';background:#22c55e;color:#04210f;border-color:#22c55e';
  function lab(t, el) { return '<div style="margin-top:10px"><label style="display:block;font-size:11.5px;font-weight:700;margin:0 0 4px;opacity:.8">' + t + '</label>' + el + '</div>'; }
  var ST = { BARU: ['Menunggu', '#fbbf24'], DIJAWAB: ['Sudah dijawab', '#4ade80'], SELESAI: ['Selesai', '#94a3b8'] };
  function viewPanduan() {
    var ql = q.trim().toLowerCase(), L = topics().filter(function (t) { return !ql || (t[2] + ' ' + t[3].join(' ')).toLowerCase().indexOf(ql) >= 0; });
    var h = '<input id="hp-q" value="' + esc(q) + '" placeholder="Cari bantuan, mis. stok, diskon, absen" style="' + inp + ';margin:12px 0">';
    if (!L.length) return h + '<p style="opacity:.7;font-size:13px;text-align:center;padding:14px">Tidak ketemu. Coba kata lain, atau tanyakan ke tim lewat tab Tanya Tim.</p>';
    return h + L.map(function (t, i) {
      var o = openIdx === i || !!ql;
      return '<div style="border-top:1px solid rgba(255,255,255,.08)"><button data-op="' + i + '" style="all:unset;display:flex;justify-content:space-between;width:100%;box-sizing:border-box;padding:11px 2px;cursor:pointer;font-weight:700;font-size:13px"><span>' + esc(t[2]) + '</span><span style="opacity:.5">' + (o ? '−' : '+') + '</span></button>' +
        (o ? '<ol style="margin:0 0 12px;padding-left:20px;font-size:12.5px;line-height:1.55;opacity:.9">' + t[3].map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' : '') + '</div>';
    }).join('');
  }
  function viewTanya() {
    var h = '<p style="font-size:12px;opacity:.7;margin:12px 0 0">Tulis pertanyaan atau masalah Anda. Tim akan membalas, dan balasannya muncul di sini.</p>' +
      lab('Judul singkat', '<input id="hp-sub" maxlength="80" placeholder="mis. Stok tidak berkurang" style="' + inp + '">') +
      lab('Penjelasan', '<textarea id="hp-msg" rows="4" maxlength="1000" placeholder="Apa yang terjadi, di layar mana, dan apa yang sudah dicoba" style="' + inp + ';resize:vertical"></textarea>') +
      '<div style="margin-top:10px"><button data-a="send" style="' + btn + green + '"' + (sending ? ' disabled' : '') + '>Kirim ke tim</button></div>';
    if (!hasDb()) h += '<p style="font-size:11.5px;color:#fbbf24;margin-top:8px">Perlu internet dan akun toko untuk mengirim.</p>';
    if (tickets.length) h += '<div style="font-weight:800;margin:18px 0 6px">Riwayat pertanyaan</div>' + tickets.map(function (t) {
      var s = ST[t.status] || ST.BARU;
      return '<div style="padding:10px;margin-bottom:8px;border-radius:12px;background:rgba(255,255,255,.05);font-size:12.5px"><div style="display:flex;justify-content:space-between;gap:8px"><b>' + esc(t.subject) + '</b><span style="color:' + s[1] + ';font-size:11px;font-weight:700">' + s[0] + '</span></div><div style="opacity:.75;margin-top:4px;white-space:pre-wrap">' + esc(t.message) + '</div><div style="opacity:.5;font-size:11px;margin-top:3px">' + esc(t.requestedAt || '') + '</div>' +
        (t.reply ? '<div style="margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.3)"><div style="font-size:11px;opacity:.7">Balasan tim' + (t.repliedAt ? ' · ' + esc(t.repliedAt) : '') + '</div><div style="white-space:pre-wrap;margin-top:2px">' + esc(t.reply) + '</div></div>' : '') + '</div>';
    }).join('');
    return h;
  }
  function render() {
    if (!ov || ov.style.display === 'none') return;
    var keep = document.activeElement && document.activeElement.id, selS = 0;
    var sub = (document.getElementById('hp-sub') || {}).value, msg = (document.getElementById('hp-msg') || {}).value;
    var h = '<div style="width:100%;max-width:560px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px">' +
      '<div style="display:flex;justify-content:space-between;gap:10px"><div><div style="font-weight:800;font-size:17px">Bantuan</div><div style="font-size:12px;opacity:.65">Panduan singkat dan tanya langsung ke tim.</div></div><button data-x style="' + btn + '">Tutup</button></div>' +
      '<div style="display:flex;gap:6px;margin-top:12px"><button data-tab="panduan" style="' + btn + (tab === 'panduan' ? green : '') + '">Panduan</button><button data-tab="tanya" style="' + btn + (tab === 'tanya' ? green : '') + '">Tanya Tim' + (unread() ? ' •' : '') + '</button></div>' +
      (note ? '<p style="margin:10px 0 0;padding:10px 12px;border-radius:12px;background:rgba(34,197,94,.14);color:#86efac;font-size:12px">' + esc(note) + '</p>' : '') + (tab === 'panduan' ? viewPanduan() : viewTanya()) + '</div>';
    ov.innerHTML = h;
    if (tab === 'tanya') { var a = document.getElementById('hp-sub'), b = document.getElementById('hp-msg'); if (a && sub) a.value = sub; if (b && msg) b.value = msg; }
    if (keep) { var el = document.getElementById(keep); if (el && el.focus) { try { el.focus(); if (el.setSelectionRange && el.value) el.setSelectionRange(el.value.length, el.value.length); } catch (e) {} } }
  }
  function send() {
    var sub = (document.getElementById('hp-sub').value || '').trim(), msg = (document.getElementById('hp-msg').value || '').trim();
    if (!sub || msg.length < 5) { note = 'Isi judul dan penjelasan (minimal 5 huruf).'; return render(); }
    if (!hasDb()) { note = 'Tidak bisa mengirim sekarang. Periksa internet atau login ulang.'; return render(); }
    if (Date.now() - lastSend < 30000) { note = 'Tunggu sebentar sebelum mengirim lagi.'; return render(); }
    var t = tn(), now = Date.now(), tk = { id: 'help_' + now, type: 'bantuan', tenantId: tid(), tenantName: (t && t.nama) || tid(), subject: sub.slice(0, 80), message: msg.slice(0, 1000), status: 'BARU', requestedBy: actor(), role: role(), page: PAGE, ver: ver(), requestedAt: new Date().toLocaleString('id-ID'), timestamp: now };
    sending = true; render(); lastSend = now;
    db.collection('provider_tickets').doc(tk.id).set(tk).then(function () { sending = false; note = 'Terkirim. Balasan tim akan muncul di sini.'; start(); render(); }).catch(function (e) { sending = false; lastSend = 0; note = 'Gagal terkirim: ' + (e && e.message || e); render(); });
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-help';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482700;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var t = e.target.closest('[data-tab]'); if (t) { tab = t.getAttribute('data-tab'); note = ''; if (tab === 'tanya') { try { localStorage.setItem(seenKey(), String(Date.now())); } catch (x) {} badge(); } return render(); }
      var o = e.target.closest('[data-op]'); if (o) { var i = Number(o.getAttribute('data-op')); openIdx = openIdx === i ? -1 : i; return render(); }
      var b = e.target.closest('[data-a]'); if (b && b.getAttribute('data-a') === 'send') send();
    });
    ov.addEventListener('input', function (e) { if (e.target.id === 'hp-q') { q = e.target.value; render(); } });
    document.body.appendChild(ov);
  }
  function fab() {
    if (document.getElementById('fm-help-fab')) return;
    var b = document.createElement('button'); b.id = 'fm-help-fab'; b.type = 'button'; b.setAttribute('aria-label', 'Bantuan'); b.innerHTML = '?<i style="display:none;position:absolute;top:-2px;right:-2px;width:11px;height:11px;border-radius:50%;background:#ef4444;border:2px solid #0b0b0f"></i>';
    b.style.cssText = 'position:fixed;left:12px;bottom:66px;z-index:2147482000;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:#1e293b;color:#f5f5f7;font-weight:800;font-size:17px;box-shadow:0 6px 18px rgba(0,0,0,.35);cursor:pointer;' + S;
    b.onclick = function () { FM_HELP.open(); }; document.body.appendChild(b);
  }
  window.FM_HELP = { open: function (t) { ensure(); start(); tab = t || 'panduan'; note = ''; q = ''; openIdx = -1; ov.style.display = 'flex'; if (tab === 'tanya') { try { localStorage.setItem(seenKey(), String(Date.now())); } catch (e) {} badge(); } render(); }, topics: topics };
  function init() { fab(); start(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 1200); }); else setTimeout(init, 1200);
})();
