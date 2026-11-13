/* i18n.js — Banyak Bahasa (BETA 8.5): Indonesia (bawaan) dan English.
   Cara kerja: teks Indonesia di layar diganti dengan padanan Inggris dari kamus di bawah, termasuk teks yang muncul belakangan
   (jendela, tabel, pesan). Teks yang belum ada di kamus tetap tampil dalam Bahasa Indonesia, aman dan tidak merusak data.
   Hanya tampilan yang berubah: data, angka, dan catatan transaksi tidak diubah.
   Aktif bila fitur 'bahasa' dicentang di toko. Pilihan bahasa disimpan per perangkat (tombol kecil ID | EN di pojok kanan bawah). */
(function () {
  'use strict';
  var KEY = 'fm_lang';
  function has() { try { return !!(window.FM_PLANS && FM_PLANS.has && (FM_PLANS.has('bahasa', 'kasir') || FM_PLANS.has('bahasa', 'manager') || FM_PLANS.has('bahasa', 'owner'))); } catch (e) { return false; } }
  function lang() { try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'id'; } catch (e) { return 'id'; } }

  var D = [
    ['Absensi', 'Attendance'], ['Absensi Karyawan', 'Employee Attendance'], ['Admin', 'Admin'], ['Aksi', 'Actions'], ['Akun', 'Account'], ['Akun Transaksi', 'Transaction Account'],
    ['Alpha', 'Absent'], ['Analisa Keuangan', 'Financial Analysis'], ['Anti-Fraud', 'Anti-Fraud'], ['Arus Kas & Anggaran', 'Cash Flow & Budget'], ['Atur target', 'Set target'],
    ['Backup & Ekspor', 'Backup & Export'], ['Bantuan', 'Help'], ['Batal', 'Cancel'], ['Belum absen', 'Not clocked in'], ['Belum ada.', 'None yet.'], ['Belum diatur.', 'Not set.'],
    ['Belum ada closing', 'No closing yet'], ['Belum ada closing stok.', 'No stock closing yet.'], ['Belum ada jenis stok.', 'No stock items yet.'], ['Belum ada karyawan.', 'No employees yet.'],
    ['Belum ada pembayaran.', 'No payments yet.'], ['Belum ada penjualan.', 'No sales yet.'], ['Belum ada promo.', 'No promos yet.'], ['Belum ada stok masuk dari Admin.', 'No stock-in from Admin yet.'],
    ['Belum ada transaksi pada bulan ini.', 'No transactions this month.'], ['Belum ada transaksi pada periode ini.', 'No transactions in this period.'], ['Belum ada akun pengeluaran.', 'No expense accounts yet.'],
    ['Belum ada barang stok untuk usaha ini.', 'No stock items for this business yet.'], ['Bersih', 'Net'], ['Bersihkan Semua Log', 'Clear All Logs'], ['Berkas', 'File'],
    ['Bukti Struk / Invoice', 'Receipt / Invoice Proof'], ['Bukti nota terlampir', 'Receipt proof attached'], ['Buku Besar', 'General Ledger'], ['Bulan', 'Month'], ['Bulan ini', 'This month'],
    ['Buka Kasir Baru', 'Open New Cashier'], ['Cari produk...', 'Search products...'], ['Catatan', 'Notes'], ['Catatan Pajak 12%', '12% Tax Notes'], ['Cetak', 'Print'], ['Cetak Sekarang', 'Print Now'],
    ['Cetak laporan', 'Print report'], ['Closing', 'Closing'], ['Closing Minggu Ini', "This Week's Closing"], ['Daftar Jenis Stok', 'Stock Item List'], ['Daftar struk final', 'Final receipt list'],
    ['Data Sebelum', 'Data Before'], ['Data Sesudah', 'Data After'], ['Debit', 'Debit'], ['Dijual di kasir?', 'Sold at cashier?'], ['Diskon', 'Discount'], ['Diskon & Promo', 'Discounts & Promos'],
    ['Draft Transaksi Berjalan (Bebas Edit Sebelum Cetak)', 'Current Draft Transactions (Editable Before Printing)'], ['Fitur Toko', 'Store Features'], ['Gaji pokok', 'Base salary'],
    ['Ganti Password / PIN Staf', 'Change Staff Password / PIN'], ['Hadir', 'Present'], ['Hapus', 'Delete'], ['Hapus catatan', 'Delete note'], ['Harga beli per satuan (Rp)', 'Purchase price per unit (Rp)'],
    ['Harga jual', 'Selling price'], ['Harga jual (Rp)', 'Selling price (Rp)'], ['Hari ini', 'Today'], ['Income (Pemasukan)', 'Income'], ['Induk', 'Parent'], ['Info', 'Info'],
    ['Input Transaksi', 'Enter Transaction'], ['Instruksi & Pengawasan Admin', 'Admin Instructions & Supervision'], ['Isi', 'Qty per unit'], ['Izin', 'Leave'], ['Jabatan', 'Position'],
    ['Jabatan / Hak Akses:', 'Position / Access Rights:'], ['Jam kerja', 'Work hours'], ['Jatuh tempo', 'Due date'], ['Jejak koreksi, void, & COA Manager', 'Manager correction, void & COA trail'], ['Jenis', 'Type'],
    ['Jual', 'Sell'], ['Jumlah', 'Amount'], ['Kamera', 'Camera'], ['Karyawan', 'Employees'], ['Kas Keluar', 'Cash Out'], ['Kas Masuk', 'Cash In'], ['Kas Masuk:', 'Cash In:'], ['Kasir', 'Cashier'],
    ['Kategori', 'Category'], ['Kembali', 'Back'], ['Kelola Akun (COA)', 'Manage Accounts (COA)'], ['Kelola Password Staf', 'Manage Staff Passwords'], ['Keterangan', 'Description'],
    ['Keterangan (opsional)', 'Description (optional)'], ['Keterangan Koreksi', 'Correction Note'], ['Keterangan Transaksi', 'Transaction Description'], ['Kirim Instruksi', 'Send Instruction'],
    ['Kirim WA', 'Send WA'], ['Kirim ke tim', 'Send to team'], ['Kirim lewat WhatsApp', 'Send via WhatsApp'], ['Kirim Catatan / Arahan ke Kasir:', 'Send Notes / Directions to Cashier:'],
    ['Kode', 'Code'], ['Kode & Kategori', 'Code & Category'], ['Konfirmasi & Cetak Struk Sah', 'Confirm & Print Official Receipt'], ['Koreksi & void nota kasir', 'Correct & void cashier receipts'],
    ['Koreksi / catat izin, sakit, alpha', 'Correct / record leave, sick, absent'], ['Koreksi Tanggal Transaksi', 'Correct Transaction Date'], ['Koreksi Transaksi Sah', 'Correct Official Transaction'],
    ['Koreksi jumlah stok', 'Correct stock quantity'], ['Koreksi tanggal nota & rekening koran', 'Correct receipt date & statement'], ['Kredit', 'Credit'], ['Kurs Mata Uang & Logam Mulia', 'Exchange Rates & Precious Metals'],
    ['LABA BERSIH OPERASIONAL (A - B):', 'NET OPERATING PROFIT (A - B):'], ['Laba', 'Profit'], ['Laba Bersih', 'Net Profit'], ['Laba bersih', 'Net profit'], ['Laba Bersih Usaha', 'Business Net Profit'],
    ['Laba & Margin per Produk', 'Profit & Margin per Product'], ['Lanjut ke Closing Mingguan', 'Continue to Weekly Closing'], ['Laporan Bulanan', 'Monthly Report'], ['Laporan Gaji', 'Payroll Report'],
    ['Laporan Kas', 'Cash Report'], ['Laporan Pajak', 'Tax Report'], ['Laporan Pajak Bulanan', 'Monthly Tax Report'], ['Lewat jatuh tempo', 'Overdue'], ['Lunas', 'Paid'], ['Margin', 'Margin'],
    ['Manager', 'Manager'], ['Masuk ke Sistem', 'Sign In'], ['Memuat Cuaca...', 'Loading weather...'], ['Memuat Kurs...', 'Loading rates...'], ['Memuat Waktu...', 'Loading time...'],
    ['Mencari lokasi...', 'Finding location...'], ['Metode Bayar', 'Payment Method'], ['Metode Bayar:', 'Payment Method:'], ['Mutasi', 'Statement'], ['Mutasi Buku Kas', 'Cash Book Statement'],
    ['Mutasi Kas Sah', 'Official Cash Statement'], ['Mutasi Sah', 'Official Statement'], ['Nama', 'Name'], ['Nama Akun', 'Account Name'], ['Nama induk', 'Parent name'], ['Nama jenis', 'Item name'],
    ['Nama petugas', 'Staff name'], ['Neraca', 'Balance Sheet'], ['Nilai Bersih', 'Net Value'], ['Nominal Akumulasi', 'Accumulated Amount'], ['Nominal Transaksi (Rp)', 'Transaction Amount (Rp)'],
    ['Nota', 'Receipt'], ['Omzet', 'Revenue'], ['Opsional', 'Optional'], ['Outcome (Operasional)', 'Outcome (Operational)'], ['Outcome (Produksi)', 'Outcome (Production)'], ['Owner', 'Owner'],
    ['PAJAK 12% UNTUK NEGARA', '12% TAX FOR THE STATE'], ['PIC Kasir', 'Cashier PIC'], ['PPN', 'VAT'], ['PPN 12%', 'VAT 12%'], ['PPN 12% Inklusif', 'VAT 12% Inclusive'], ['PPh Final', 'Final Income Tax'],
    ['Pajak 12%', 'Tax 12%'], ['Pajak Belanja Inklusif', 'Inclusive Purchase Tax'], ['Pajak Negara', 'State Tax'], ['Pajak PPN 12%', 'VAT 12% Tax'], ['Panduan', 'Guide'],
    ['Panduan singkat dan tanya langsung ke tim.', 'Quick guide and ask the team directly.'], ['Pemberi', 'Giver'], ['Pendapatan', 'Income'], ['Pengaturan', 'Settings'], ['Pengaturan pajak', 'Tax settings'],
    ['Penerima', 'Receiver'], ['Per akun COA', 'Per COA account'], ['Per cara bayar', 'By payment method'], ['Per minggu', 'Per week'], ['Perbarui', 'Refresh'], ['Persen (%)', 'Percent (%)'],
    ['Petugas', 'Staff'], ['Petugas Closing', 'Closing Staff'], ['Petugas:', 'Staff:'], ['Pilih Admin:', 'Select Admin:'], ['Pilih Akun Mutasi / Produk Toko', 'Select Statement Account / Store Product'],
    ['Pilih Tanggal Baru:', 'Select New Date:'], ['Pilih tanggal', 'Select date'], ['Piutang & Utang', 'Receivables & Payables'], ['Piutang belum dibayar', 'Unpaid receivables'], ['Pokok', 'Principal'],
    ['Pos Pengeluaran', 'Expense Items'], ['Potongan', 'Deduction'], ['Prive (Penarikan Owner)', "Drawings (Owner Withdrawal)"], ['Produk', 'Product'], ['Produk Cepat', 'Quick Products'], ['Pulang', 'Clock out'],
    ['QRIS', 'QRIS'], ['Rekap Closing Kasir', 'Cashier Closing Recap'], ['Rincian data pembukuan', 'Bookkeeping detail'], ['Ringkasan Usaha', 'Business Summary'], ['Ringkasan per Usaha', 'Summary per Business'],
    ['Ringkasan per usaha', 'Summary per business'], ['Riwayat', 'History'], ['Riwayat Audit Manager', 'Manager Audit History'], ['Riwayat Closing', 'Closing History'], ['Riwayat closing', 'Closing history'],
    ['Riwayat Closing Terakhir:', 'Latest Closing History:'], ['Riwayat Masuk', 'Stock-In History'], ['Riwayat pertanyaan', 'Question history'], ['Riwayat terakhir', 'Latest history'],
    ['SALDO', 'BALANCE'], ['Saldo', 'Balance'], ['Saldo Diserahkan', 'Balance Handed Over'], ['Saldo Kas Sah', 'Official Cash Balance'], ['Saldo awal', 'Opening balance'], ['Sakit', 'Sick'],
    ['Salin', 'Copy'], ['Salin teks', 'Copy text'], ['Saya Paham', 'Got it'], ['Scan Barcode Produk', 'Scan Product Barcode'], ['Scan stok masuk', 'Scan stock-in'], ['Selisih', 'Difference'], ['Selisih:', 'Difference:'],
    ['Semua barang', 'All items'], ['Semua stok aman.', 'All stock is fine.'], ['Setor', 'Deposit'], ['Simpan', 'Save'], ['Simpan Jenis', 'Save Item'], ['Simpan Nama Peran', 'Save Role Name'],
    ['Simpan Password Baru', 'Save New Password'], ['Simpan Perubahan', 'Save Changes'], ['Simpan Tanggal', 'Save Date'], ['Simpan Target', 'Save Target'], ['Simpan ke Antrean Draft', 'Save to Draft Queue'],
    ['Simpan batas', 'Save limit'], ['Simpan jam kerja', 'Save work hours'], ['Simpan koreksi', 'Save correction'], ['Simpan pembayaran', 'Save payment'], ['Simpan pengaturan', 'Save settings'],
    ['Simpan rekonsiliasi', 'Save reconciliation'], ['Simpan saldo awal', 'Save opening balance'], ['Simpan struk ini sebagai bukti sah.', 'Keep this receipt as official proof.'],
    ['Simpan struk sebagai PDF', 'Save receipt as PDF'], ['Sisa', 'Remaining'], ['Sisa laba setelah prive', 'Profit left after drawings'], ['Slip', 'Slip'], ['Status', 'Status'], ['Stok', 'Stock'],
    ['Stok & Closing', 'Stock & Closing'], ['Stok Masuk', 'Stock In'], ['Stok akhir (sisa)', 'Ending stock (remaining)'], ['Stok awal', 'Opening stock'], ['Stok masuk terakhir dari akun ini', 'Latest stock-in from this account'],
    ['Stok saat ini', 'Current stock'], ['Stok sekarang', 'Current stock'], ['Tabel Pajak 12%', '12% Tax Table'], ['Tambah', 'Add'], ['Tambah Akun Baru (COA):', 'Add New Account (COA):'],
    ['Tambah akun neraca', 'Add balance sheet account'], ['Tambah stok', 'Add stock'], ['Tampilkan', 'Show'], ['Tandai sudah disetor', 'Mark as deposited'], ['Tanggal', 'Date'], ['Tanggal Transaksi', 'Transaction Date'],
    ['Target bulanan (Rp)', 'Monthly target (Rp)'], ['Target harian (Rp)', 'Daily target (Rp)'], ['Terbayar', 'Paid'], ['Terjual', 'Sold'], ['Terlambat', 'Late'], ['Terlampir', 'Attached'],
    ['Terima kasih atas pembayaran Anda.', 'Thank you for your payment.'], ['Tersedia: 0', 'Available: 0'], ['Tidak ada transaksi pada periode ini.', 'No transactions in this period.'],
    ['Tindakan', 'Actions'], ['Total', 'Total'], ['Total Keluar', 'Total Out'], ['Total Masuk', 'Total In'], ['Total Nilai Pembayaran:', 'Total Payment Value:'], ['Total Transaksi', 'Total Transactions'],
    ['TOTAL BAYAR:', 'TOTAL PAYMENT:'], ['TOTAL A. INCOME (PEMASUKAN):', 'TOTAL A. INCOME:'], ['TOTAL B. OUTCOME (BIAYA & TOOLS):', 'TOTAL B. OUTCOME (COSTS & TOOLS):'], ['Transaksi', 'Transactions'],
    ['Transaksi:', 'Transactions:'], ['Transfer', 'Transfer'], ['Tulis instruksi atau konfirmasi pengeluaran...', 'Write an instruction or expense confirmation...'], ['Tunai', 'Cash'],
    ['Tunjangan', 'Allowance'], ['Tutup', 'Close'], ['Tutup kamera', 'Close camera'], ['Ubah', 'Edit'], ['Ubah Nama Peran', 'Rename Role'], ['Ubah Nama Peran Karyawan', 'Rename Employee Role'],
    ['Uang Bersih di Laci:', 'Net Cash in Drawer:'], ['Uang keluar', 'Money out'], ['Uang masuk', 'Money in'], ['Uang tunai di laci saat ini', 'Cash currently in the drawer'], ['Umum', 'General'],
    ['Unduh CSV', 'Download CSV'], ['Unduh CSV (Excel)', 'Download CSV (Excel)'], ['Unduh Excel (.xlsx)', 'Download Excel (.xlsx)'], ['Unduh Laporan', 'Download Report'], ['Unduh PDF', 'Download PDF'],
    ['Unduh data toko Anda sendiri kapan saja.', 'Download your own store data anytime.'], ['Unduh salinan lengkap (.json)', 'Download full copy (.json)'], ['Uraian', 'Details'], ['Uraian Transaksi', 'Transaction Details'],
    ['Usaha', 'Business'], ['Utang belum dibayar', 'Unpaid payables'], ['Verifikasi faktur belanja negara', 'Verify state purchase invoices'], ['Waktu', 'Time'], ['Waktu Closing', 'Closing Time'],
    ['Ya, tampil di kasir', 'Yes, show at cashier'], ['Tidak (bahan / stok saja)', 'No (materials / stock only)'], ['Batas stok menipis', 'Low stock limit'], ['Satuan', 'Unit'], ['Satuan ganda', 'Multiple units'],
    ['Harga jual belum diisi', 'selling price not set'], ['harga jual', 'selling price'], ['boleh kosong', 'can be empty'], ['sisa', 'remaining'], ['sisa stok', 'remaining stock'], ['masuk', 'in'],
    ['Cari bantuan, mis. stok, diskon, absen', 'Search help, e.g. stock, discount, attendance'], ['Tembak barcode atau ketik nama barang lalu Enter', 'Scan a barcode or type the item name, then press Enter'],
    ['Scan barcode atau ketik kodenya lalu Enter', 'Scan a barcode or type the code, then press Enter'], ['Arahkan kamera ke barcode', 'Point the camera at the barcode'], ['Barcode (scan atau ketik)', 'Barcode (scan or type)'],
    ['Barcode satuan ini (opsional)', 'Barcode of this unit (optional)'], ['mis. nota supplier', 'e.g. supplier invoice'], ['mis. Diskon Akhir Pekan', 'e.g. Weekend Discount'], ['Stok saat ini dan', 'Current stock and'],
    ['(isi semua sisa stok)', '(fill in all remaining stock)'], ['Analisa belum bisa dihitung. Muat ulang halaman.', 'Analysis cannot be calculated yet. Reload the page.'],
    ['Cocokkan uang laci dengan baris Tunai.', 'Match the drawer cash with the Cash line.'], ['Diskon yang diberikan bulan ini:', 'Discounts given this month:'], ['Ringkasan satu bulan, siap dikirim ke WhatsApp.', 'One-month summary, ready to send via WhatsApp.'],
    ['Perlu internet dan akun toko untuk mengirim.', 'Needs internet and a store account to send.'], ['Tampilkan otomatis tiap awal bulan', 'Show automatically at the start of each month'], ['Target pemasukan bulan ini', "This month's income target"],
    ['Batas pengeluaran per akun (tiap bulan)', 'Spending limit per account (monthly)'], ['Dihitung dari transaksi toko ini, diperbarui setiap dibuka.', "Calculated from this store's transactions, updated every time it's opened."],
    ['Transaksi lama tanpa catatan cara bayar dihitung Tunai.', 'Older transactions without a payment method count as Cash.'], ['Belum ada karyawan terdaftar. Minta Manager menambahkannya.', 'No employees registered yet. Ask the Manager to add them.'],
    ['Belum ada jenis stok. Input dulu di tab', 'No stock items yet. Add them first in the tab'], ['Barang ini milik usaha lain, tidak bisa ditambah dari akun ini.', 'This item belongs to another business and cannot be added from this account.'],
    ['Minta Manager mendaftarkan barangnya dulu.', 'Ask the Manager to register the item first.'], ['Tidak ada prive pada periode ini.', 'No drawings in this period.']
  ];

  var MAP = {}; D.forEach(function (p) { MAP[p[0]] = p[1]; });
  function tr(s) {
    var t = s.trim(); if (!t) return s;
    var r = MAP[t.replace(/\s+/g, ' ')];
    if (r === undefined) return s;
    var a = s.match(/^\s*/)[0], b = s.match(/\s*$/)[0];
    return a + r + b;
  }
  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|CODE|PRE|NOSCRIPT)$/;
  function skipEl(el) { return !el || SKIP.test(el.tagName || '') || (el.closest && el.closest('[data-no-i18n],[contenteditable="true"]')); }
  function doNode(n) {
    if (n.nodeType === 3) { if (!skipEl(n.parentNode)) { var v = tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; } return; }
    if (n.nodeType !== 1 || skipEl(n)) return;
    ['placeholder', 'title', 'aria-label'].forEach(function (a) { if (n.hasAttribute && n.hasAttribute(a)) { var v = tr(n.getAttribute(a)); if (v !== n.getAttribute(a)) n.setAttribute(a, v); } });
    for (var c = n.firstChild; c; c = c.nextSibling) doNode(c);
  }
  var ob = null, busy = false;
  function run() {
    if (ob) return;
    document.documentElement.setAttribute('lang', 'en');
    doNode(document.body);
    ob = new MutationObserver(function (ms) {
      if (busy) return; busy = true;
      try {
        ms.forEach(function (m) {
          if (m.type === 'childList') [].forEach.call(m.addedNodes, doNode);
          else if (m.type === 'characterData') doNode(m.target);
          else if (m.type === 'attributes') doNode(m.target);
        });
      } catch (e) {}
      busy = false;
    });
    ob.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
  }

  function btn() {
    if (document.getElementById('fm-lang-btn') || !has()) return;
    var b = document.createElement('button'); b.id = 'fm-lang-btn'; b.type = 'button'; b.setAttribute('data-no-i18n', '1'); b.title = 'Language / Bahasa';
    b.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147482100;padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(15,23,42,.82);color:#fff;font:800 12px Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.25)';
    function paint() { b.innerHTML = '<span style="opacity:' + (lang() === 'id' ? 1 : .45) + '">ID</span> | <span style="opacity:' + (lang() === 'en' ? 1 : .45) + '">EN</span>'; }
    paint();
    b.onclick = function () { try { localStorage.setItem(KEY, lang() === 'en' ? 'id' : 'en'); } catch (e) {} location.reload(); };
    document.body.appendChild(b);
  }
  function boot() {
    var n = 0, iv = setInterval(function () {
      n++;
      if (has()) { clearInterval(iv); if (lang() === 'en') run(); }
      else if (n > 25) clearInterval(iv);
    }, 400);
  }
  window.FM_I18N = { lang: lang, tr: tr, active: function () { return lang() === 'en' && has(); }, has: has, set: function (l) { try { localStorage.setItem(KEY, l === 'en' ? 'en' : 'id'); } catch (e) {} location.reload(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
