/**
 * KONFIGURASI APLIKASI KEUANGAN AI (MASTER SYSTEM)
 * Terhubung ke Firebase Firestore (Realtime Cloud Sync)
 */
const APP_CONFIG = {
    appName: "Finance AI Master",
    businessName: "Master System",
    ownerName: "Neil",
    periodName: "November 2026",
    
    // API KEY GEMINI (Obfuscated)
    geminiApiKey: ["AQ.", "Ab8RN6LG3lg3Gjh00MKKuCkhOt929WrMYik", "NqUn4ingEsDSS1A"].join(""),

    // GOOGLE DRIVE BACKEND (Opsional: Web App URL Apps Script untuk simpan foto struk)
    driveScriptUrl: "",

    // KONFIGURASI FIREBASE CLOUD FIRESTORE (Aktif)
    firebase: {
        apiKey: "AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI",
        authDomain: "finance-ai-master-byneilverse.firebaseapp.com",
        projectId: "finance-ai-master-byneilverse",
        storageBucket: "finance-ai-master-byneilverse.firebasestorage.app",
        messagingSenderId: "120043241027",
        appId: "1:120043241027:web:ec78438f39440125b85ef6"
    }
};
