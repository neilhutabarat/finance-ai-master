/**
 * config.js - Koneksi Firebase (Firestore) Oneilverse
 * Dimuat setelah tenants.js. Dipanggil oleh halaman lewat initFirebase().
 * Halaman memeriksa variabel `db`: jika null, aplikasi memakai localStorage.
 */
const ONEILVERSE_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI",
  authDomain: "finance-ai-master-byneilverse.firebaseapp.com",
  databaseURL: "https://finance-ai-master-byneilverse-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "finance-ai-master-byneilverse",
  storageBucket: "finance-ai-master-byneilverse.firebasestorage.app",
  messagingSenderId: "120043241027",
  appId: "1:120043241027:web:ec78438f39440125b85ef6"
};

var db = null;

function initFirebase() {
  try {
    if (typeof firebase === 'undefined' || !firebase.firestore) {
      console.warn('Firebase SDK belum termuat. Aplikasi memakai penyimpanan lokal.');
      db = null;
      return;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(ONEILVERSE_FIREBASE_CONFIG);
    }
    db = firebase.firestore();
  } catch (e) {
    console.error('Gagal menghubungkan Firebase:', e);
    db = null;
  }
}
