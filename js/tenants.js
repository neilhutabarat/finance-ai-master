/**
 * tenants.js - Dynamic Configuration Engine untuk 500+ UMKM
 * Berisi konfigurasi identitas toko, tema warna, fitur aktif, dan daftar akun COA.
 */

const TENANTS_CONFIG = {
  // 1. Profil Default (Jika dibuka tanpa parameter URL ?toko=...)
  "default": {
    id: "default",
    nama: "Demo Kasir UMKM",
    slogan: "Sistem Kasir & Keuangan Pintar",
    kategori: "retail",
    warna: "#2563eb", // Biru Modern
    warnaSekunder: "#dbeafe",
    logoText: "🏪",
    features: {
      meja: false,
      barcode: true,
      catatanPesanan: true,
      cetakPdf: true
    },
    coaPemasukan: [
      "[4-1001] Penjualan Barang Retail",
      "[4-1002] Pendapatan Lain-lain"
    ],
    coaPengeluaran: [
      "[5-1001] Pembelian Stok Barang",
      "[5-1002] Listrik & Air Operasional",
      "[5-1003] Sewa Tempat & Kebersihan"
    ],
    katalogDefault: [
      { id: 1, nama: "Produk Contoh A", harga: 15000, stok: 50 },
      { id: 2, nama: "Produk Contoh B", harga: 25000, stok: 30 }
    ]
  },

  // 2. Klien Kafe / F&B (Contoh: Kopi Senja Utama)
  "kopisenja": {
    id: "kopisenja",
    nama: "Kopi Senja Utama",
    slogan: "Cita Rasa Kopi Pilihan UMKM Juara",
    kategori: "fnb",
    warna: "#d97706", // Amber / Cokelat Kopi
    warnaSekunder: "#fef3c7",
    logoText: "☕",
    features: {
      meja: true, // Butuh Nomor Meja
      barcode: false,
      catatanPesanan: true,
      cetakPdf: true
    },
    coaPemasukan: [
      "[4-1001] Penjualan Minuman Kopi & Non-Kopi",
      "[4-1002] Penjualan Makanan & Pastry"
    ],
    coaPengeluaran: [
      "[5-1001] Belanja Biji Kopi & Susu Fresh",
      "[5-1002] Cup, Sedotan, & Kemasan",
      "[5-1003] Listrik, Gas & Es Batu",
      "[5-1004] Gaji Barista & Operasional"
    ],
    katalogDefault: [
      { id: 101, nama: "Kopi Susu Gula Aren", harga: 18000, stok: 100 },
      { id: 102, nama: "Americano Iced", harga: 15000, stok: 100 },
      { id: 103, nama: "Croissant Butter", harga: 22000, stok: 40 },
      { id: 104, nama: "Matcha Latte Creamy", harga: 20000, stok: 60 }
    ]
  },

  // 3. Klien Jasa / Laundry (Contoh: Laundry Kilat 99)
  "laundrykilat": {
    id: "laundrykilat",
    nama: "Laundry Kilat 99",
    slogan: "Bersih, Wangi, & Rapi Tepat Waktu",
    kategori: "service",
    warna: "#0284c7", // Sky Blue
    warnaSekunder: "#e0f2fe",
    logoText: "🧺",
    features: {
      meja: false,
      barcode: false,
      catatanPesanan: true, // Catatan khusus pakaian
      cetakPdf: true
    },
    coaPemasukan: [
      "[4-1001] Pendapatan Cuci Komplit Kiloan",
      "[4-1002] Pendapatan Setrika Saja",
      "[4-1003] Cuci Bedcover & Karpet"
    ],
    coaPengeluaran: [
      "[5-1001] Belanja Deterjen, Softener & Parfum",
      "[5-1002] Plastik Kemasan & Hanger",
      "[5-1003] Gas Dryer & Listrik",
      "[5-1004] Servis & Perawatan Mesin"
    ],
    katalogDefault: [
      { id: 201, nama: "Cuci Komplit Reguler (per Kg)", harga: 7000, stok: 999 },
      { id: 202, nama: "Cuci Komplit Express 1 Hari (per Kg)", harga: 12000, stok: 999 },
      { id: 203, nama: "Setrika Rapi Saja (per Kg)", harga: 5000, stok: 999 },
      { id: 204, nama: "Cuci Bedcover Besar (Pcs)", harga: 25000, stok: 999 }
    ]
  },

  // 4. Klien Bengkel Motor / Mobil (Contoh: Bengkel Maju Lancar)
  "bengkelmaju": {
    id: "bengkelmaju",
    nama: "Bengkel Maju Lancar",
    slogan: "Spesialis Servis, Ganti Oli & Sparepart",
    kategori: "service_retail",
    warna: "#dc2626", // Merah Racing
    warnaSekunder: "#fee2e2",
    logoText: "🔧",
    features: {
      meja: false,
      barcode: true,
      catatanPesanan: true, // Plat nomor kendaraan
      cetakPdf: true
    },
    coaPemasukan: [
      "[4-1001] Pendapatan Jasa Servis & Pasang",
      "[4-1002] Penjualan Oli & Cairan Mesin",
      "[4-1003] Penjualan Sparepart Onderdil"
    ],
    coaPengeluaran: [
      "[5-1001] Belanja Stok Oli & Drum",
      "[5-1002] Belanja Sparepart Motor",
      "[5-1003] Tools, Majun & Perlengkapan Bengkel"
    ],
    katalogDefault: [
      { id: 301, nama: "Jasa Servis Ringan + Tune Up", harga: 45000, stok: 999 },
      { id: 302, nama: "Oli Mesin Matic 0.8L", harga: 55000, stok: 45 },
      { id: 303, nama: "Kampas Rem Depan", harga: 35000, stok: 20 },
      { id: 304, nama: "Busi Standar Racing", harga: 25000, stok: 35 }
    ]
  }
};

/**
 * Mengambil konfigurasi tenant aktif berdasarkan parameter URL ?toko=...
 */
function getActiveTenant() {
  const urlParams = new URLSearchParams(window.location.search);
  const tenantKey = (urlParams.get("toko") || "").toLowerCase().trim();
  if (tenantKey && TENANTS_CONFIG[tenantKey]) {
    return TENANTS_CONFIG[tenantKey];
  }
  return TENANTS_CONFIG["default"];
}
