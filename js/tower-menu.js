/* Menu Control Tower: ubin dikelompokkan (Klien / Uang / Sistem), ubin "segera" untuk fitur yang belum bisa dipakai,
   dan palet warna yang lebih tenang. Hanya aktif di halaman Tower. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;

  var DEFAULT_GROUPS = [
    { id: 'klien', title: 'Klien', hint: 'Toko baru, profil & akun masuk', c: '#3b6cf6', items: [
      { key: 'klien_baru', t: 'Tambah Toko Baru', dup: true, ic: 'klien_baru', run: "openModal('add_tenant')", d: 'Daftarkan toko & pilih paket' },
      { key: 'profil_toko', t: 'Profil Toko', ic: 'profil_toko', run: "towerPick('profil')", d: 'Ubah nama & alamat toko' },
      { key: 'link_toko', t: 'Salin Link Login', ic: 'link_toko', run: "towerPick('link')", d: 'Bagikan link masuk ke klien' },
      { key: 'akun_login', t: 'PIN & Akun Login', ic: 'akun_login', find: 'Akun Login', d: 'Cek PIN Admin, Manager, Owner' },
      { key: 'permohonan_kasir', t: 'Permohonan Kasir', ic: 'permohonan_kasir', run: "openModal('tickets')", badge: 'stat-pending-tickets', d: 'Setujui atau tolak perangkat kasir' }
    ] },
    { id: 'bangun', title: 'Akses & Status', hint: 'Siapa boleh masuk & kondisi toko', c: '#0ea5a4', items: [
      { key: 'kuota_terminal', t: 'Jatah Perangkat', ic: 'kuota_terminal', run: "towerPick('kuota')", d: 'Jumlah Kasir, Manager & Owner' },
      { key: 'bekukan_aktifkan', t: 'Bekukan / Aktifkan', ic: 'bekukan_aktifkan', run: "towerPick('freeze')", d: 'Hentikan sementara akses toko' },
      { key: 'toko_berhenti', t: 'Arsip Toko Berhenti', ic: 'toko_berhenti', find: 'Toko Berhenti', d: 'Daftar toko yang nonaktif' },
      { key: 'buka_blokir', t: 'Buka Blokir Login', ic: 'akun_login', run: "FM_TUNB.open()", d: 'Buka akun yang terkunci karena salah PIN' },
      { key: 'hapus_pulihkan', t: 'Tempat Sampah Klien', ic: 'hapus_pulihkan', run: "towerPick('hapus')", d: 'Hapus klien atau kembalikan' }
    ] },
    { id: 'layanan', title: 'Paket & Tagihan', hint: 'Langganan, biaya & fitur sewa', c: '#f97316', items: [
      { key: 'paket_billing', t: 'Ubah Paket Toko', ic: 'paket_billing', run: "towerPick('paket')", d: 'Basic, Plus, Pro & durasi' },
      { key: 'isi_paket_fitur', t: 'Atur Isi Paket', ic: 'isi_paket_fitur', run: "openModal('paket_fitur')", d: 'Fitur bawaan tiap paket' },
      { key: 'fitur_khusus', t: 'Fitur Khusus Toko', ic: 'isi_paket_fitur', run: "FM_TFX.open()", d: 'Beri atau cabut fitur untuk satu toko' },
      { key: 'upgrade_req', t: 'Permintaan Upgrade', ic: 'upgrade_req', run: "FM_TUPG.open()", badge: 'stat-upg-pending', d: 'Konfirmasi paket yang diajukan klien' },
      { key: 'billing_toko', t: 'Tagihan per Toko', ic: 'billing_toko', run: "towerPick('billing')", d: 'Biaya & pembayaran satu toko' },
      { key: 'billing_jaringan', t: 'Tagihan Semua Toko', ic: 'billing_jaringan', find: 'Billing Jaringan', d: 'Rekap tagihan & jatuh tempo' },
      { key: 'store', t: 'OneilStore', ic: 'store', run: "FM_TSTORE.open()", d: 'Harga & sewa fitur satuan' },
      { key: 'demo_toko', t: 'Atur Toko Demo', ic: 'demo_toko', run: "FM_TSTORE.openDemo()", d: 'Jadikan toko demo atau asli' }
    ] },
    { id: 'pantau', title: 'Bantuan & Kesehatan', hint: 'Tiket klien, error & kondisi sistem', c: '#e11d74', items: [
      { key: 'tiket_bantuan', t: 'Tiket Bantuan', ic: 'tiket_bantuan', run: "FM_HELPDESK.open()", d: 'Balas pertanyaan dari toko' },
      { key: 'pemantauan_error', t: 'Laporan Error', ic: 'pemantauan_error', run: "FM_MON.open('error')", d: 'Error dari perangkat toko' },
      { key: 'kesehatan_sistem', t: 'Kesehatan Sistem', ic: 'kesehatan_sistem', run: "FM_HEALTH.open()", d: 'Periksa server & data' },
      { key: 'kurs_emas', t: 'Kurs & Harga Emas', ic: 'kurs_emas', find: 'Kurs', d: 'Perbarui kurs & harga emas' }
    ] },
    { id: 'versi', title: 'Rilis', hint: 'Versi, uji coba & serah terima', c: '#7c5cfc', items: [
      { key: 'versi_toko', t: 'Kunci Versi Toko', ic: 'versi_toko', run: "towerPick('versi')", d: 'Tahan toko di versi tertentu' },
      { key: 'rollout_versi', t: 'Atur Rollout Versi', ic: 'rollout_versi', run: "if(window.openRolloutModal)openRolloutModal()", d: 'Versi bawaan & Oneil Shield' },
      { key: 'ubah_id', t: 'Ganti ID Toko', ic: 'ubah_id', run: "FM_LAB.open('rename')", d: 'Ubah ID sebelum diserahkan' },
      { key: 'published', t: 'Tandai Diserahkan', ic: 'published', run: "FM_LAB.open('publish')", d: 'Toko siap dipakai klien' },
      { key: 'uji_mandiri', t: 'Cek Siap Serah', ic: 'uji_mandiri', run: "FM_QA.open()", d: 'Periksa file & data toko' },
      { key: 'reset_statistik', t: 'Bersihkan Data Uji', warn: true, ic: 'reset_statistik', run: "FM_LAB.open('reset')", d: 'Kosongkan data uji coba' }
    ] },
    { id: 'tampil', title: 'Tampilan & Komunikasi', hint: 'Wallpaper, pengumuman & chat', c: '#10b981', items: [
      { key: 'wallpaper', t: 'Wallpaper & Kaca', ic: 'wallpaper', run: "FM_TWALL.open()", d: 'Latar & efek kaca aplikasi' },
      { key: 'pesan_siaran', t: 'Kirim Pengumuman', dup: true, ic: 'pesan_siaran', run: "openModal('broadcast_modal')", d: 'Pesan siaran ke semua toko' },
      { key: 'chat_global', t: 'Moderasi Chat', ic: 'chat_global', run: "if(window.FM_CHAT)FM_CHAT.openModeration()", d: 'Bisukan atau atur Chat Global' },
      { key: 'hapus_semua_chat', t: 'Bersihkan Chat', ic: 'hapus_semua_chat', run: "if(window.FM_CHAT)FM_CHAT.clearAll()", d: 'Hapus seluruh isi Chat Universe' }
    ] }
  ];
  /* judul lama yang tersimpan di menu kustom ikut diganti ke nama baru */
  var OLD_TITLES = { '1. Toko & Klien': 'Klien', '2. Fitur, Kuota & Status': 'Akses & Status', '3. Paket, Tagihan & Store': 'Paket & Tagihan', '4. Pantau, Error & Kas Tower': 'Bantuan & Kesehatan', '5. Versi, Uji & Serah Terima': 'Rilis', '6. Tampilan & Chat': 'Tampilan & Komunikasi' };

  /* ============ ikon sendiri: garis tipis dua nada (bukan set ikon umum) ============ */
  var TWI = {
    klien_baru: '<path class="f" d="M5.5 12h13v8h-13z"/><path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5c0 1.4 1 2.5 2.3 2.5s2.3-1.1 2.3-2.5c0 1.4 1 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1 2.5 2.3 2.5s2.3-1.1 2.3-2.5"/><path d="M5.5 12v8h13v-8"/><path d="M12 14.4v3.4M10.3 16.1h3.4"/>',
    profil_toko: '<rect class="f" x="3.5" y="5.5" width="17" height="13" rx="3.2"/><rect x="3.5" y="5.5" width="17" height="13" rx="3.2"/><circle cx="9" cy="11" r="2"/><path d="M5.9 16.2c.6-1.6 1.7-2.3 3.1-2.3s2.5.7 3.1 2.3"/><path d="M14.5 10h3M14.5 13h2.2"/>',
    link_toko: '<path d="M10.2 13.8a3.6 3.6 0 0 0 5.1 0l3-3a3.6 3.6 0 0 0-5.1-5.1l-1 1"/><path d="M13.8 10.2a3.6 3.6 0 0 0-5.1 0l-3 3a3.6 3.6 0 0 0 5.1 5.1l1-1"/>',
    akun_login: '<rect class="f" x="5" y="11" width="14" height="9" rx="3"/><rect x="5" y="11" width="14" height="9" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.2" r="1.2"/><path d="M12 16.4V18"/>',
    permohonan_kasir: '<path class="f" d="M4 13l2-7h12l2 7v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 13l2-7h12l2 7v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 13h4.5l1 2h5l1-2H20"/>',
    kuota_terminal: '<path class="f" d="M5 17a8 8 0 1 1 14 0z"/><path d="M5 17a8 8 0 1 1 14 0"/><path d="M12 13.2l3.4-4.2"/><circle cx="12" cy="13.4" r="1.3"/><path d="M8 17h8"/>',
    bekukan_aktifkan: '<circle class="f" cx="12" cy="13" r="7"/><path d="M12 4v7"/><path d="M7.3 7.6a7 7 0 1 0 9.4 0"/>',
    toko_berhenti: '<rect class="f" x="3.5" y="4.5" width="17" height="4.5" rx="1.6"/><rect x="3.5" y="4.5" width="17" height="4.5" rx="1.6"/><path d="M5.5 9v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/>',
    hapus_pulihkan: '<path class="f" d="M6.5 7l.8 11a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L17.5 7z"/><path d="M5 7h14M9.5 7V5h5v2"/><path d="M6.5 7l.8 11a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L17.5 7"/><path d="M10.5 11v5M13.5 11v5"/>',
    paket_billing: '<path class="f" d="M12 4l8 4.2-8 4.2-8-4.2z"/><path d="M12 4l8 4.2-8 4.2-8-4.2z"/><path d="M4 12.2l8 4.2 8-4.2"/><path d="M4 16l8 4.2 8-4.2"/>',
    isi_paket_fitur: '<rect class="f" x="4.5" y="4" width="15" height="16" rx="3"/><rect x="4.5" y="4" width="15" height="16" rx="3"/><path d="M8.3 9.3l1.2 1.2 2.2-2.4M13.5 10h3M8.3 15l1.2 1.2 2.2-2.4M13.5 15.7h3"/>',
    billing_toko: '<path class="f" d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M9 8.5h6M9 12h6M9 15.5h3.5"/>',
    billing_jaringan: '<rect class="f" x="4.5" y="12" width="3" height="8" rx="1"/><rect class="f" x="10.5" y="7" width="3" height="13" rx="1"/><rect class="f" x="16.5" y="10" width="3" height="10" rx="1"/><path d="M3.5 20.5h17"/><path d="M6 8.5l4-3 3.5 2.2L19 4"/>',
    upgrade_req: '<rect class="f" x="5" y="3.5" width="14" height="17" rx="2.8"/><rect x="5" y="3.5" width="14" height="17" rx="2.8"/><path d="M12 16.2V9.6M9 12.4l3-3 3 3"/>',
    store: '<path class="f" d="M5.5 8h13l-1 11.5a1.5 1.5 0 0 1-1.5 1.4H8a1.5 1.5 0 0 1-1.5-1.4z"/><path d="M5.5 8h13l-1 11.5a1.5 1.5 0 0 1-1.5 1.4H8a1.5 1.5 0 0 1-1.5-1.4z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
    demo_toko: '<path class="f" d="M10.5 9.2L5.6 17.5A2 2 0 0 0 7.3 20.5h9.4a2 2 0 0 0 1.7-3l-4.9-8.3z"/><path d="M9.5 4h5M10.5 4v5.2L5.6 17.5A2 2 0 0 0 7.3 20.5h9.4a2 2 0 0 0 1.7-3l-4.9-8.3V4"/><path d="M8 15h8"/>',
    tiket_bantuan: '<circle class="f" cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.4"/><path d="M6 6l3.6 3.6M18 6l-3.6 3.6M6 18l3.6-3.6M18 18l-3.6-3.6"/>',
    pemantauan_error: '<path class="f" d="M12 4.5l8.5 14.5h-17z"/><path d="M12 4.5l8.5 14.5h-17z"/><path d="M12 10v4M12 16.6v.1"/>',
    log_login: '<path class="f" d="M12 4h5.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H12z"/><path d="M10 7.5V6a2 2 0 0 1 2-2h5.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H12a2 2 0 0 1-2-2v-1.5"/><path d="M4 12h9M10 8.8l3.2 3.2-3.2 3.2"/>',
    kesehatan_sistem: '<path class="f" d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/><path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/><path d="M7 12.5h2.5l1.3-2.5 2 5 1.3-2.5H17"/>',
    kurs_emas: '<path class="f" d="M4 19l1.8-4.5h5.4L13 19z"/><path class="f" d="M11 19l1.8-4.5h5.4L20 19z"/><path d="M4 19l1.8-4.5h5.4L13 19zM11 19l1.8-4.5h5.4L20 19z"/><path d="M7.4 14.5L9 10.5h5.2l1.5 4"/><path d="M12 4v2.4M10.8 5.2h2.4"/>',
    versi_toko: '<path class="f" d="M3.5 12.2V5.5a2 2 0 0 1 2-2h6.7l8.3 8.3a2 2 0 0 1 0 2.8l-6.7 6.7a2 2 0 0 1-2.8 0z"/><path d="M3.5 12.2V5.5a2 2 0 0 1 2-2h6.7l8.3 8.3a2 2 0 0 1 0 2.8l-6.7 6.7a2 2 0 0 1-2.8 0z"/><circle cx="8" cy="8" r="1.4"/>',
    rollout_versi: '<path class="f" d="M12 3.5c3.6 1.6 5.5 5.2 5 9.2l-3 3h-4l-3-3c-.5-4 1.4-7.6 5-9.2z"/><path d="M12 3.5c3.6 1.6 5.5 5.2 5 9.2l-3 3h-4l-3-3c-.5-4 1.4-7.6 5-9.2z"/><circle cx="12" cy="9.3" r="1.5"/><path d="M8.5 14.5L6 15.5l1 3 3-1.5M15.5 14.5l2.5 1-1 3-3-1.5M12 18v3"/>',
    ubah_id: '<rect class="f" x="3.5" y="4" width="17" height="6.5" rx="2.2"/><path d="M4 8h12M13 5l3 3-3 3"/><path d="M20 16H8M11 13l-3 3 3 3"/>',
    published: '<path class="f" d="M6 5h11l-2.2 3.8L17 12.6H6z"/><path d="M6 20V4.5"/><path d="M6 5h11l-2.2 3.8L17 12.6H6"/>',
    uji_mandiri: '<rect class="f" x="5.5" y="5.5" width="13" height="15" rx="2.6"/><rect x="5.5" y="5.5" width="13" height="15" rx="2.6"/><path d="M9 3.5h6v3H9z"/><path d="M9 13.2l2.2 2.2L15 11"/>',
    reset_statistik: '<circle class="f" cx="12" cy="12" r="3.2"/><path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5"/><path d="M4.5 4.5v4h4"/>',
    wallpaper: '<rect class="f" x="3.5" y="5" width="17" height="14" rx="3"/><rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="M3.5 16l4.5-4.5 4 4 2.5-2.5 6 5"/><circle cx="15.8" cy="9.2" r="1.5"/>',
    pesan_siaran: '<path class="f" d="M4 10.5V14a1 1 0 0 0 1 1h2.5L16 19V5L7.5 9.5H5a1 1 0 0 0-1 1z"/><path d="M4 10.5V14a1 1 0 0 0 1 1h2.5L16 19V5L7.5 9.5H5a1 1 0 0 0-1 1z"/><path d="M19 9.5a4 4 0 0 1 0 5"/>',
    chat_global: '<path class="f" d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v8a1.5 1.5 0 0 1-1.5 1.5h-7L7.5 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z"/><path d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v8a1.5 1.5 0 0 1-1.5 1.5h-7L7.5 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z"/><path d="M8.5 10h7M8.5 13h4"/>',
    hapus_semua_chat: '<path class="f" d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v8a1.5 1.5 0 0 1-1.5 1.5h-7L7.5 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z"/><path d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v8a1.5 1.5 0 0 1-1.5 1.5h-7L7.5 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z"/><path d="M9.8 8.8l4.4 4.4M14.2 8.8l-4.4 4.4"/>',
    g_klien: '<circle class="f" cx="9" cy="8" r="3"/><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.5-3 2.7-4.7 5.5-4.7s5 1.7 5.5 4.7"/><path d="M16 5.5a2.7 2.7 0 0 1 0 5.2M17 14.6c1.8.5 3 2 3.4 4.4"/>',
    g_bangun: '<path class="f" d="M12 3.5l7 2.8v5.4c0 4.4-3 7.3-7 8.8-4-1.5-7-4.4-7-8.8V6.3z"/><path d="M12 3.5l7 2.8v5.4c0 4.4-3 7.3-7 8.8-4-1.5-7-4.4-7-8.8V6.3z"/><path d="M9 12l2.2 2.2L15.2 10"/>',
    g_layanan: '<rect class="f" x="3.5" y="6.5" width="17" height="12" rx="3"/><rect x="3.5" y="6.5" width="17" height="12" rx="3"/><path d="M3.5 10.5h17"/><path d="M15.5 14.8h2.2"/><path d="M6 4.5h9"/>',
    g_pantau: '<circle class="f" cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.4"/><path d="M6 6l3.6 3.6M18 6l-3.6 3.6M6 18l3.6-3.6M18 18l-3.6-3.6"/>',
    g_versi: '<path class="f" d="M12 3.5c3.6 1.6 5.5 5.2 5 9.2l-3 3h-4l-3-3c-.5-4 1.4-7.6 5-9.2z"/><path d="M12 3.5c3.6 1.6 5.5 5.2 5 9.2l-3 3h-4l-3-3c-.5-4 1.4-7.6 5-9.2z"/><circle cx="12" cy="9.3" r="1.5"/><path d="M8.5 14.5L6 15.5l1 3 3-1.5M15.5 14.5l2.5 1-1 3-3-1.5M12 18v3"/>',
    g_tampil: '<path class="f" d="M12 3.5l1.9 5 5.1 1.9-5.1 1.9L12 17.3l-1.9-5-5.1-1.9 5.1-1.9z"/><path d="M12 3.5l1.9 5 5.1 1.9-5.1 1.9L12 17.3l-1.9-5-5.1-1.9 5.1-1.9z"/><path d="M18.5 16.5v3M17 18h3"/>'
  };
  function twIcon(key) {
    var d = TWI[key]; if (!d) return '';
    return '<svg class="twi" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  }
  window.FM_TWICON = twIcon;

  /* ============ menu kustom (disimpan di Firestore, app_meta/tower_menu) ============ */
  var PALETTE = ['#8fb8e8', '#9fa8e6', '#d9b872', '#e0a47a', '#6fc7c0', '#c9a8e0', '#f0a8c0', '#e29a9a', '#8fd0b0', '#7dd3c0', '#f0c674'];
  var CUSTOM = null;
  var GROUPS = DEFAULT_GROUPS;
  function esc2(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function allItemsFlat() {
    var out = []; DEFAULT_GROUPS.forEach(function (g) { g.items.forEach(function (it) { out.push(it); }); }); return out;
  }
  function defaultItemGroupMap() {
    var m = {}; DEFAULT_GROUPS.forEach(function (g) { g.items.forEach(function (it) { m[it.key] = g.id; }); }); return m;
  }
  function defaultGroupMeta() {
    var m = {}; DEFAULT_GROUPS.forEach(function (g) { m[g.id] = { title: g.title, hint: g.hint, c: g.c }; }); return m;
  }
  function effectiveGroups() {
    var meta = defaultGroupMeta();
    var useCustom = CUSTOM && CUSTOM.v === 2 && CUSTOM.groups && CUSTOM.groups.length;
    var base = useCustom ? CUSTOM.groups.slice() : DEFAULT_GROUPS.map(function (g) { return { id: g.id, title: g.title }; });
    var groups = base.map(function (g, i) {
      var m = meta[g.id] || {};
      return { id: g.id, title: OLD_TITLES[g.title] || g.title || m.title || 'Kategori', hint: m.hint || '', c: m.c || PALETTE[i % PALETTE.length], items: [] };
    });
    var byId = {}; groups.forEach(function (g) { byId[g.id] = g; });
    var itemGroupMap = (useCustom && CUSTOM.itemGroup) || {};
    var defMap = defaultItemGroupMap();
    allItemsFlat().forEach(function (it) {
      var gid = itemGroupMap[it.key] || defMap[it.key];
      var g = byId[gid] || byId[defMap[it.key]] || groups[0];
      g.items.push(it);
    });
    return groups.filter(function (g) { return g.items.length > 0; });
  }
  function fsdb() { try { return (typeof db !== 'undefined' && db) ? db : null; } catch (e) { return null; } }
  function loadCustomConfig(done) {
    var d = fsdb(); if (!d) { done(); return; }
    d.collection('app_meta').doc('tower_menu').get().then(function (s) {
      try { if (s.exists && s.data().json) CUSTOM = JSON.parse(s.data().json); } catch (e) {}
      done();
    }).catch(function () { done(); });
  }
  function saveCustomConfig(groups, itemGroup, cb) {
    var d = fsdb(); if (!d) { cb && cb(false); return; }
    d.collection('app_meta').doc('tower_menu').set({ json: JSON.stringify({ v: 2, groups: groups, itemGroup: itemGroup }), updatedAt: firebase.firestore.FieldValue.serverTimestamp() })
      .then(function () { cb && cb(true); }).catch(function () { cb && cb(false); });
  }
  function resetCustomConfig(cb) {
    var d = fsdb(); if (!d) { cb && cb(false); return; }
    d.collection('app_meta').doc('tower_menu').delete().then(function () { cb && cb(true); }).catch(function () { cb && cb(false); });
  }

  function openMenuEditor() {
    var cur = effectiveGroups();
    var draftGroups = cur.map(function (g) { return { id: g.id, title: g.title }; });
    var draftItemGroup = {};
    cur.forEach(function (g) { g.items.forEach(function (it) { draftItemGroup[it.key] = g.id; }); });

    var old = document.getElementById('tw-menu-editor'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'tw-menu-editor';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483300;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,sans-serif';
    ov.innerHTML = '<div style="width:100%;max-width:640px;max-height:88vh;overflow:auto;background:#0b0f17;color:#e2e8f0;border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:18px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><b style="font-size:16px">Atur Menu Kendali</b><button data-x style="all:unset;cursor:pointer;color:#94a3b8;font-size:13px">Tutup</button></div>' +
      '<p style="font-size:11.5px;color:#94a3b8;margin:0 0 12px">Ubah nama kategori, tambah/hapus kategori, atau pindahkan tombol ke kategori lain. Tersimpan untuk semua perangkat.</p>' +
      '<div id="tme-groups" style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px"></div>' +
      '<button id="tme-addgroup" style="all:unset;cursor:pointer;color:#93c5fd;font-size:12.5px;font-weight:700;margin-bottom:16px">+ Kategori Baru</button>' +
      '<div style="border-top:1px solid rgba(255,255,255,.1);padding-top:12px">' +
      '<b style="font-size:13px">Tombol</b>' +
      '<div id="tme-items" style="display:flex;flex-direction:column;gap:6px;margin-top:8px"></div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:16px;align-items:center">' +
      '<button id="tme-reset" style="all:unset;cursor:pointer;color:#f87171;font-size:12px;padding:9px 14px;border:1px solid rgba(248,113,113,.4);border-radius:10px">Kembalikan ke Bawaan</button>' +
      '<span style="flex:1"></span>' +
      '<button id="tme-save" style="all:unset;cursor:pointer;color:#04120c;background:#34d399;font-weight:800;font-size:12.5px;padding:10px 18px;border-radius:10px">Simpan</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(ov);

    function renderGroups() {
      var box = ov.querySelector('#tme-groups');
      box.innerHTML = draftGroups.map(function (g) {
        return '<div style="display:flex;gap:6px;align-items:center"><input data-gid="' + esc2(g.id) + '" value="' + esc2(g.title) + '" style="flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:6px 9px;color:#fff;font-size:12.5px;outline:none"><button data-delg="' + esc2(g.id) + '" title="Hapus kategori" style="all:unset;cursor:pointer;color:#f87171;padding:4px 8px">✕</button></div>';
      }).join('');
      [].slice.call(box.querySelectorAll('[data-gid]')).forEach(function (inp) {
        inp.oninput = function () {
          var g = draftGroups.filter(function (x) { return x.id === inp.getAttribute('data-gid'); })[0];
          if (g) g.title = inp.value;
          renderItems();
        };
      });
      [].slice.call(box.querySelectorAll('[data-delg]')).forEach(function (btn) {
        btn.onclick = function () {
          if (draftGroups.length <= 1) { alert('Minimal harus ada 1 kategori.'); return; }
          var gid = btn.getAttribute('data-delg');
          draftGroups = draftGroups.filter(function (x) { return x.id !== gid; });
          var fallback = draftGroups[0].id;
          Object.keys(draftItemGroup).forEach(function (k) { if (draftItemGroup[k] === gid) draftItemGroup[k] = fallback; });
          renderGroups(); renderItems();
        };
      });
    }
    function renderItems() {
      var box = ov.querySelector('#tme-items');
      var opt = function (selId) { return draftGroups.map(function (g) { return '<option value="' + esc2(g.id) + '"' + (g.id === selId ? ' selected' : '') + '>' + esc2(g.title) + '</option>'; }).join(''); };
      box.innerHTML = allItemsFlat().map(function (it) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06)"><span style="font-size:12.5px">' + esc2(it.t) + '</span><select data-key="' + esc2(it.key) + '" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:5px 8px;color:#fff;font-size:12px;outline:none">' + opt(draftItemGroup[it.key]) + '</select></div>';
      }).join('');
      [].slice.call(box.querySelectorAll('select[data-key]')).forEach(function (sel) {
        sel.onchange = function () { draftItemGroup[sel.getAttribute('data-key')] = sel.value; };
      });
    }

    renderGroups(); renderItems();

    ov.querySelector('#tme-addgroup').onclick = async function () {
      var nama = (await fmPrompt('Nama kategori baru:')); if (!nama) return;
      draftGroups.push({ id: 'g_' + Date.now(), title: nama });
      renderGroups(); renderItems();
    };
    ov.querySelector('#tme-reset').onclick = async function () {
      if (!(await fmAsk('Kembalikan semua ke susunan bawaan? Perubahanmu akan hilang.'))) return;
      resetCustomConfig(function (ok) {
        if (!ok) { alert('Gagal, cek koneksi Firestore.'); return; }
        location.reload();
      });
    };
    ov.querySelector('#tme-save').onclick = function () {
      saveCustomConfig(draftGroups, draftItemGroup, function (ok) {
        if (!ok) { alert('Gagal menyimpan, cek koneksi Firestore.'); return; }
        alert('Tersimpan. Halaman akan dimuat ulang.');
        location.reload();
      });
    };
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.hasAttribute('data-x')) ov.remove(); });
  }

  var CSS = [
    /* palet tenang: biru-abu lembut, kartu tidak terlalu pekat */
    'html[data-fm-page="tower"][data-fm-native="dark"]:not([data-fm-invert]){--s-bg:#000;--s-surf:rgba(255,255,255,.04);--s-line:rgba(255,255,255,.11);--s-hi:rgba(255,255,255,.14);--s-shadow:rgba(0,0,0,.9);--s-gloss:rgba(255,255,255,.02)}',
    'html[data-fm-page="tower"][data-fm-native="dark"]:not([data-fm-invert]) body{background:#000!important;background-image:none!important;color:#dfe5f2}',
    'html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child>*{background:#07090c!important;background-image:none!important;border-color:rgba(255,255,255,.12)!important}',
    'html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child .text-white,html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child h3{color:#e6ebf6!important}',
    'html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child .text-indigo-300,html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child .text-cyan-300,html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child .text-amber-300,html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child .text-rose-300{filter:saturate(.7)}',
    /* kelompok menu */
    'html[data-fm-page="tower"] #fm-actions.tw-grouped{display:flex!important;flex-direction:column;gap:8px;flex:1 1 0!important;min-height:0;overflow:hidden;grid-template-columns:none!important;padding:2px 2px 76px}',
    '.tw-group{display:flex;flex-direction:column;gap:5px}',
    '.tw-head{display:flex;align-items:baseline;gap:10px;padding:0 4px}',
    '.tw-head b{font-size:13px;font-weight:800;letter-spacing:.01em;color:var(--g)}',
    '.tw-head span{font-size:11px;opacity:.55}',
    '.tw-head:before{content:"";align-self:center;width:4px;height:14px;border-radius:3px;background:var(--g)}',
    '.tw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:7px}',
    'html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act{flex-direction:row!important;justify-content:flex-start!important;text-align:left!important;gap:11px!important;min-height:36px;height:auto;font-size:12px!important;font-weight:700!important;padding:5px 11px!important;position:relative;border-radius:16px}',
    'html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act i{width:28px!important;height:28px!important;border-radius:12px!important;background:color-mix(in srgb,var(--g) 18%,transparent)!important;color:var(--g)!important}',
    'html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act svg{width:16px!important;height:16px!important}',
    'html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act span{white-space:normal!important;line-height:1.2}',
    '.tw-soon{opacity:.42;filter:grayscale(.55);border-style:dashed!important;cursor:default!important}',
    '.tw-soon:hover{transform:none!important;filter:grayscale(.55)!important}',
    '.tw-pill{margin-left:auto;flex:none;font-size:9.5px;font-weight:800;padding:2px 8px;border-radius:999px;background:rgba(188,201,230,.16);color:#cdd6ea}',
    '.tw-cnt{margin-left:auto;flex:none;min-width:22px;text-align:center;font-size:11px;font-weight:800;padding:2px 7px;border-radius:999px;background:#c9706f;color:#fff}',
    '.tw-rowbtns button{white-space:nowrap}',
    '.fm-act small{display:none}@media(max-width:1023px){.tw-dup{display:none!important}}',
    '@media(max-width:640px){.tw-grid{grid-template-columns:repeat(2,minmax(0,1fr))}html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act{padding:8px 10px!important;font-size:12.5px!important;gap:8px!important}html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act i{width:30px!important;height:30px!important}}'
  ].join('\n');

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function tile(it, g) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'fm-act tw-tile' + (it.warn ? ' tw-warn' : '') + (it.soon ? ' tw-soon' : '') + (it.dup ? ' tw-dup' : ''); b.setAttribute('data-tw', it.t);
    if (it.d) b.title = it.t + ' — ' + it.d;
    b.innerHTML = '<i>' + (twIcon(it.ic) || (window.FM_SVG ? FM_SVG(it.ic) : '')) + '</i><span>' + esc(it.t) + '</span>' + (it.soon ? '<em class="tw-pill" style="font-style:normal">segera</em>' : '') + (it.d ? '<small>' + esc(it.d) + '</small>' : '');
    if (it.soon) { b.title = 'Segera hadir'; b.setAttribute('aria-disabled', 'true'); b.onclick = function (e) { e.preventDefault(); }; }
    return b;
  }

  function build() {
    var host = document.getElementById('fm-actions');
    if (!host || host.classList.contains('tw-grouped')) return;
    var old = [].slice.call(host.querySelectorAll('.fm-act'));
    if (!old.length) return;
    var byText = function (frag) {
      for (var i = 0; i < old.length; i++) if ((old[i].textContent || '').indexOf(frag) >= 0) return old[i];
      return null;
    };
    var dirTile = byText('Jaringan Mitra');
    var frag = document.createDocumentFragment();
    GROUPS.forEach(function (g) {
      var sec = document.createElement('section'); sec.className = 'tw-group'; sec.setAttribute('data-g', g.id); sec.style.setProperty('--g', g.c);
      sec.innerHTML = '<div class="tw-head"><u class="tw-gi">' + (twIcon('g_' + g.id) || '') + '</u><div class="tw-ht"><b>' + esc(g.title) + '</b><span>' + esc(g.hint) + '</span></div></div>';
      var grid = document.createElement('div'); grid.className = 'tw-grid'; sec.appendChild(grid);
      g.items.forEach(function (it) {
        var el;
        if (it.find) {
          var src = byText(it.find);
          if (src) { el = src; el.classList.add('tw-tile'); var ico = el.querySelector('i'); if (ico && twIcon(it.ic)) ico.innerHTML = twIcon(it.ic); var sp = el.querySelector('span'); if (sp && it.t) sp.textContent = it.t; if (it.d) { var sm = el.querySelector('small'); if (!sm) { sm = document.createElement('small'); el.appendChild(sm); } sm.textContent = it.d; } }
        }
        if (!el && it.edit) {
          el = tile(it, g);
          el.onclick = function () {
            if (dirTile) dirTile.click();
            setTimeout(function () { var s = document.getElementById('dir-search'); if (s) { s.focus(); s.placeholder = 'Ketik nama/ID toko, lalu tekan Edit Toko di barisnya'; } }, 250);
          };
        } else if (!el && it.run) {
          el = tile(it, g);
          el.onclick = function () { new Function(it.run)(); };
        } else if (!el) {
          el = tile(it, g);
        }
        if (it.badge) {
          var c = document.createElement('em'); c.className = 'tw-cnt'; c.style.fontStyle = 'normal'; c.setAttribute('data-tw-badge', it.badge); c.style.display = 'none';
          el.appendChild(c);
        }
        el.setAttribute('data-tw-key', it.key); if (it.d && !el.title) el.title = it.t + ' — ' + it.d;
        var star = document.createElement('b'); star.className = 'tw-star'; star.setAttribute('role', 'button'); star.title = 'Sematkan ke Favorit';
        star.onclick = function (e) { e.preventDefault(); e.stopPropagation(); toggleFav(it.key); };
        el.appendChild(star);
        grid.appendChild(el);
      });
      frag.appendChild(sec);
    });
    host.innerHTML = '';
    var nav = document.createElement('div'); nav.className = 'tw-tabs';
    var qIn = document.createElement('input'); qIn.type = 'search'; qIn.className = 'tw-ken-q'; qIn.placeholder = 'Cari tombol, mis. paket, tagihan, versi, demo';
    qIn.oninput = function () {
      var q = (qIn.value || '').toLowerCase().trim();
      [].slice.call(host.querySelectorAll('.tw-group')).forEach(function (sec) {
        var any = 0;
        [].slice.call(sec.querySelectorAll('.fm-act')).forEach(function (btn) {
          var txt = ((btn.getAttribute('data-tw') || '') + ' ' + (btn.textContent || '')).toLowerCase();
          var ok = !q || txt.indexOf(q) >= 0;
          btn.style.setProperty('display', ok ? '' : 'none', ok ? '' : 'important');
          if (ok) any++;
        });
        sec.style.setProperty('display', (!q || any) ? 'flex' : 'none', 'important');
      });
    };
    var editBtn = document.createElement('button'); editBtn.type = 'button'; editBtn.className = 'tw-tab tw-tab-edit'; editBtn.textContent = 'Atur Menu';
    editBtn.onclick = function (e) { e.stopPropagation(); openMenuEditor(); };
    editBtn.id = 'tw-edit-menu';
    var board = document.createElement('div'); board.id = 'tw-board';
    board.appendChild(frag);
    var favs = document.createElement('div'); favs.id = 'tw-favs';
    host.appendChild(favs); host.appendChild(board); favs.appendChild(editBtn);
    host.classList.add('tw-grouped');
    renderFavs();
  }

  /* ============ favorit: tombol yang sering dipakai disematkan di baris atas ============ */
  function favList() { try { var v = JSON.parse(localStorage.getItem('tw_fav') || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function toggleFav(key) {
    var l = favList(), i = l.indexOf(key); if (i >= 0) l.splice(i, 1); else l.push(key);
    try { localStorage.setItem('tw_fav', JSON.stringify(l.slice(0, 8))); } catch (e) {}
    renderFavs();
  }
  function renderFavs() {
    var host = document.getElementById('tw-favs'); if (!host) return;
    var l = favList(), meta = {};
    allItemsFlat().forEach(function (it) { meta[it.key] = it; });
    [].slice.call(document.querySelectorAll('#tw-board .fm-act[data-tw-key]')).forEach(function (b) { b.classList.toggle('is-fav', l.indexOf(b.getAttribute('data-tw-key')) >= 0); });
    var eb = document.getElementById('tw-edit-menu'); host.innerHTML = ''; host.classList.toggle('has', l.length > 0);
    l.forEach(function (k) {
      var it = meta[k]; if (!it) return;
      var c = document.createElement('button'); c.type = 'button'; c.className = 'tw-fav';
      c.innerHTML = twIcon(it.ic) + '<span>' + esc(it.t) + '</span>';
      c.onclick = function () { var t = document.querySelector('#tw-board .fm-act[data-tw-key="' + k + '"]'); if (t) t.click(); };
      host.appendChild(c);
    });
    if (eb) host.appendChild(eb);
  }

  function badges() {
    [].slice.call(document.querySelectorAll('[data-tw-badge]')).forEach(function (c) {
      var src = document.getElementById(c.getAttribute('data-tw-badge'));
      var n = src ? parseInt(src.textContent, 10) || 0 : 0;
      c.textContent = n; c.style.display = n > 0 ? '' : 'none';
    });
  }

  var CSS2 = [
    '.tw-tabs{display:flex;align-items:center;gap:10px;padding:0;flex:none}',
    '.tw-ken-q{flex:1;max-width:420px;padding:7px 14px;border-radius:12px;border:1px solid #cbd5e1;background:#ffffff;color:#0f172a;font-size:12.5px;font-weight:600;outline:none;box-shadow:0 2px 6px -2px rgba(15,23,42,.05)}',
    '.tw-ken-q:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}',
    '.tw-tab{all:unset;box-sizing:border-box;cursor:pointer;padding:7px 14px;border-radius:10px;font-size:12px;font-weight:700;color:#334155;background:#ffffff;border:1px solid #cbd5e1}',
    '.tw-tab:hover{background:#f8fafc;color:#0f172a}',
    '#tw-board{flex:1 1 0;min-height:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));gap:10px}',
    '.tw-group{display:flex!important;flex-direction:column;gap:8px;min-height:0;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:11px 13px;box-shadow:0 4px 12px -6px rgba(15,23,42,.06);overflow:hidden}',
    'html[data-tw-ck] #tw-ken .tw-group .tw-head{display:flex!important;align-items:baseline;gap:8px;padding:0 2px;flex:none}',
    'html[data-tw-ck] #tw-ken .tw-group .tw-head:before{display:block!important;content:"";align-self:center;width:4px;height:14px;border-radius:3px;background:var(--g,#2563eb)}',
    'html[data-tw-ck] #tw-ken .tw-group .tw-head b{font-size:13px!important;font-weight:800!important;color:#0f172a!important;letter-spacing:.01em;white-space:nowrap}',
    'html[data-tw-ck] #tw-ken .tw-group .tw-head span{display:inline!important;font-size:11px!important;color:#64748b!important;opacity:1!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    'html[data-tw-ck] #tw-ken .tw-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-auto-rows:minmax(44px,1fr)!important;gap:6px!important;flex:1 1 0!important;min-height:0!important;align-content:stretch}',
    'html[data-fm-page="tower"] #tw-ken #fm-actions .tw-group .fm-act.tw-warn{border-color:rgba(220,38,38,.45)!important}',
    'html[data-fm-page="tower"] #tw-ken #fm-actions .tw-group .fm-act.tw-warn i{background:rgba(220,38,38,.12)!important;color:#dc2626!important}',
    '.tw-tab-edit{background:#ffffff!important;border:1px dashed #94a3b8!important;color:#334155!important;margin-left:auto}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'tw-menu-css'; st.textContent = CSS + '\n' + CSS2; document.head.appendChild(st);
  function start() {
    var tries = 0;
    (function wait() {
      var h = document.getElementById('fm-actions');
      var dbReady = (typeof db !== 'undefined' && db);
      if (h && h.querySelector('.fm-act') && (dbReady || tries > 20)) {
        loadCustomConfig(function () { GROUPS = effectiveGroups(); build(); badges(); setInterval(badges, 1500); });
        return;
      }
      if (++tries < 40) setTimeout(wait, 150);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
