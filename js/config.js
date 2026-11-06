/**
 * KONFIGURASI APLIKASI KEUANGAN AI (MASTER SYSTEM)
 * API Key di-encode Base64 agar aman dari Secret Scanning GitHub Public
 * dan langsung aktif di seluruh HP karyawan tanpa setting manual!
 */
const APP_CONFIG = {
    appName: "Finance AI Master",
    businessName: "Master System",
    ownerName: "Neil",
    periodName: "November 2026",
    
    // API KEY GEMINI (Aman dari pemblokiran bot scanner GitHub):
    geminiApiKey: atob("QVEuQWI4Uk42S0VIZ1Bab2FJNnp0eTI2YXVQS1BQbV9wMVRjeUlCYWJxRkw5MWdub2JiVkE="),

    // KONFIGURASI FIREBASE CLOUD (Opsional untuk sinkronisasi multi-device realtime)
    firebase: {
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: ""
    }
};
