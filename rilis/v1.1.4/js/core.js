// Shared Core Engine
let db = null;

const DEFAULT_COA = [
    { code: "4-1001", name: "Penjualan Kasir / Produk", category: "sales" },
    { code: "4-1002", name: "Pendapatan Lain-lain", category: "sales" },
    { code: "5-1001", name: "Pembelian Bahan Baku / Stok Dagang", category: "cogs" },
    { code: "5-1002", name: "Ongkos Angkut Pembelian", category: "cogs" },
    { code: "6-1001", name: "Biaya BBM & Transportasi", category: "expense" },
    { code: "6-1002", name: "Biaya Listrik, Air & Internet", category: "expense" },
    { code: "6-1003", name: "Gaji & Upah Karyawan", category: "expense" },
    { code: "6-1004", name: "Biaya Konsumsi & ATK", category: "expense" },
    { code: "6-1005", name: "Biaya Pemeliharaan & Operasional Lain", category: "expense" },
    { code: "3-2001", name: "Prive Pemilik (Tarik Kas Pribadi)", category: "prive" }
];

const DEFAULT_RAW_MATERIALS = [
    { code: "BB-001", name: "Minyak Goreng Premium", type: "Bahan Pokok", unit: "Liter", costPerUnit: 18000, initialQty: 100, finalQty: 30 },
    { code: "BB-002", name: "Beras Rojolele Super", type: "Bahan Pokok", unit: "Kg", costPerUnit: 15000, initialQty: 150, finalQty: 40 },
    { code: "BB-003", name: "Ayam Broiler Segar", type: "Daging / Protein", unit: "Ekor", costPerUnit: 35000, initialQty: 80, finalQty: 15 },
    { code: "BB-004", name: "Bumbu Racik & Rempah", type: "Bumbu & Sayur", unit: "Paket", costPerUnit: 50000, initialQty: 30, finalQty: 5 },
    { code: "BB-005", name: "Kemasan Box & Plastik", type: "Packaging", unit: "Pcs", costPerUnit: 1200, initialQty: 1000, finalQty: 250 }
];

const DEFAULT_NOTICES = [
    {
        id: "notif_1",
        senderRole: "manager",
        senderName: "Supervisor Toko",
        title: "Pengecekan Fisik Stok Minyak Goreng",
        message: "Untuk kasir shift sore, tolong dicek sisa fisik minyak goreng di rak display sebelum closing ya.",
        date: "08/11/2026 09:30",
        timestamp: Date.now() - 3600000,
        replies: [
            {
                id: "rep_1",
                senderRole: "staff",
                senderName: "Kasir Shift Pagi (Ony)",
                message: "Siap Pak, fisik di laci display masih ada 15 botol, sisanya di gudang utama.",
                date: "08/11/2026 10:15",
                timestamp: Date.now() - 2400000
            }
        ]
    }
];

const ROLES = {
    owner: { title: "Owner", pin: "1234", redirect: "dashboard.html", canInput: false },
    manager: { title: "Manager / Supervisor", pin: "5678", redirect: "dashboard.html", canInput: true },
    staff: { title: "Admin / Kasir", pin: "1111", redirect: "kasir.html", canInput: true }
};

function initFirebase() {
    if (APP_CONFIG.firebase && APP_CONFIG.firebase.apiKey) {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(APP_CONFIG.firebase);
            }
            db = firebase.firestore();
        } catch (e) {
            console.error("Firebase init:", e);
        }
    }
}

function getCOA() {
    const saved = localStorage.getItem('fm_coa_list_v13');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('fm_coa_list_v13', JSON.stringify(DEFAULT_COA));
    return DEFAULT_COA;
}

function saveCOA(list) {
    localStorage.setItem('fm_coa_list_v13', JSON.stringify(list));
}

function getMaterials() {
    const saved = localStorage.getItem('fm_materials_v13');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('fm_materials_v13', JSON.stringify(DEFAULT_RAW_MATERIALS));
    return DEFAULT_RAW_MATERIALS;
}

function saveMaterials(list) {
    localStorage.setItem('fm_materials_v13', JSON.stringify(list));
}

// ================= SISTEM PEMBERITAHUAN DUA ARAH =================
function getNotices() {
    const saved = localStorage.getItem('fm_notices_v16');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('fm_notices_v16', JSON.stringify(DEFAULT_NOTICES));
    return DEFAULT_NOTICES;
}

function saveNotices(list) {
    localStorage.setItem('fm_notices_v16', JSON.stringify(list));
}

function getCurrentUser() {
    const raw = localStorage.getItem('fm_session_user_v13');
    return raw ? JSON.parse(raw) : null;
}

function requireAuth(allowedRoles = []) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = "index.html";
        return null;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        alert("Akses Ditolak: Anda tidak memiliki wewenang untuk halaman ini.");
        if (user.role === 'staff') {
            window.location.href = "kasir.html";
        } else {
            window.location.href = "dashboard.html";
        }
        return null;
    }
    return user;
}

function logout() {
    if (confirm("Keluar dari sistem?")) {
        localStorage.removeItem('fm_session_user_v13');
        window.location.href = "index.html";
    }
}

function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(num || 0);
}

function formatThousandSeparator(value) {
    if (!value && value !== 0) return "";
    let clean = value.toString().replace(/[^0-9]/g, '');
    if (!clean) return "";
    return new Intl.NumberFormat('id-ID').format(clean);
}

function parseThousandSeparator(value) {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/[^0-9]/g, '')) || 0;
}
