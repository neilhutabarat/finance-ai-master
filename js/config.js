/**
 * config.js - Konfigurasi Firebase Oneilverse
 * Dimuat SEBELUM js/core.js. File ini hanya menyediakan APP_CONFIG.
 * Fungsi initFirebase() dan variabel db sudah ada di js/core.js,
 * jadi JANGAN dideklarasikan lagi di sini (akan bentrok).
 */
const APP_CONFIG = {
  firebase: {
    apiKey: "AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI",
    authDomain: "finance-ai-master-byneilverse.firebaseapp.com",
    databaseURL: "https://finance-ai-master-byneilverse-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "finance-ai-master-byneilverse",
    storageBucket: "finance-ai-master-byneilverse.firebasestorage.app",
    messagingSenderId: "120043241027",
    appId: "1:120043241027:web:ec78438f39440125b85ef6"
  }
};

/* ---- Arah kas per kategori COA (ditambahkan 18 Nov 2026) ----
   Yang MENAMBAH kas: penjualan (sales) dan setoran modal pemilik (modal).
   Modal BUKAN pendapatan: ia komponen Neraca, jadi tidak ikut omzet, laba, atau pajak.
   Ditaruh di config.js karena berkas inilah yang dimuat SEMUA halaman (partner.html tidak memuat core.js). */
function fmKasMasuk(c) { c = String(c || ''); return c === 'sales' || c === 'modal'; }
try { window.fmKasMasuk = fmKasMasuk; } catch (e) {}
