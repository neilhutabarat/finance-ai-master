/**
 * tenants.js - Konfigurasi Multi-Tenant untuk Finance Master
 * Mengatur nama toko, logo emoji, warna identitas, dan COA khusus untuk masing-masing UMKM.
 */

const TENANTS_CONFIG = {
  // 1. Profil Default (Jika link dibuka biasa tanpa ?toko=...)
  "default": {
    id: "default",
    nama: "Terminal Kasir & Admin",
    slogan: "Input Transaksi & Laporan Mutasi Kas / Buku Besar",
    warna: "#059669", // Emerald Asli
    logoText: "🏪",
    // Biarkan customCOA kosong jika ingin memakai getCOA() bawaan js/config.js
    customCOA: []
  },

  // 2. Klien Kafe / Kopi (Contoh: ?toko=kopisenja)
  "kopisenja": {
    id: "kopisenja",
    nama: "Kopi Senja Utama",
    slogan: "Cita Rasa Kopi Pilihan UMKM Juara",
    warna: "#d97706", // Amber Cokelat
    logoText: "☕",
    customCOA: [
      { code: "101", name: "Penjualan Kopi & Minuman", category: "sales" },
      { code: "102", name: "Penjualan Makanan / Pastry", category: "sales" },
      { code: "201", name: "Belanja Biji Kopi & Susu", category: "cogs" },
      { code: "202", name: "Cup, Sedotan & Kemasan", category: "cogs" },
      { code: "301", name: "Biaya Listrik, Gas & Es Batu", category: "expense" },
      { code: "302", name: "Gaji Barista & Kebersihan", category: "expense" },
      { code: "401", name: "Prive Pemilik Toko Kopi", category: "prive" }
    ]
  },

  // 3. Klien Jasa Laundry (Contoh: ?toko=laundrykilat)
  "laundrykilat": {
    id: "laundrykilat",
    nama: "Laundry Kilat 99",
    slogan: "Bersih, Wangi, & Rapi Tepat Waktu",
    warna: "#0284c7", // Sky Blue
    logoText: "🧺",
    customCOA: [
      { code: "101", name: "Pendapatan Cuci Komplit Kiloan", category: "sales" },
      { code: "102", name: "Pendapatan Setrika Saja", category: "sales" },
      { code: "103", name: "Pendapatan Cuci Karpet & Bedcover", category: "sales" },
      { code: "201", name: "Belanja Deterjen, Softener & Parfum", category: "cogs" },
      { code: "202", name: "Plastik Packing & Gantungan", category: "cogs" },
      { code: "301", name: "Listrik, Air & Gas Dryer", category: "expense" },
      { code: "302", name: "Servis & Perawatan Mesin Cuci", category: "expense" },
      { code: "401", name: "Prive Pemilik Laundry", category: "prive" }
    ]
  },

  // 4. Klien Bengkel Motor / Mobil (Contoh: ?toko=bengkelmaju)
  "bengkelmaju": {
    id: "bengkelmaju",
    nama: "Bengkel Maju Lancar",
    slogan: "Spesialis Servis, Ganti Oli & Sparepart",
    warna: "#dc2626", // Merah Racing
    logoText: "🔧",
    customCOA: [
      { code: "101", name: "Pendapatan Jasa Servis & Bongkar", category: "sales" },
      { code: "102", name: "Penjualan Oli & Cairan Mesin", category: "sales" },
      { code: "103", name: "Penjualan Sparepart Onderdil", category: "sales" },
      { code: "201", name: "Belanja Drum Oli & Botol", category: "cogs" },
      { code: "202", name: "Belanja Sparepart Motor", category: "cogs" },
      { code: "301", name: "Listrik, Kompresor & Majun", category: "expense" },
      { code: "302", name: "Upah Harian Mekanik", category: "expense" },
      { code: "401", name: "Prive Pemilik Bengkel", category: "prive" }
    ]
  }
};

function getActiveTenant() {
  const urlParams = new URLSearchParams(window.location.search);
  const tenantKey = (urlParams.get("toko") || "").toLowerCase().trim();
  if (tenantKey && TENANTS_CONFIG[tenantKey]) {
    return TENANTS_CONFIG[tenantKey];
  }
  return TENANTS_CONFIG["default"];
}
