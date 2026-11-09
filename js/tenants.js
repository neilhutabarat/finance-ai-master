/**
 * tenants.js - Konfigurasi Multi-Tenant & Master Engine Oneilverse
 */

// COA Standar Master Template Oneilverse
const ONEILVERSE_COA_LIST = [
  // --- INCOME (Pemasukan) ---
  { code: "101", name: "Iklan Video YouTube", category: "sales" },
  { code: "102", name: "Adsense YouTube", category: "sales" },
  { code: "103", name: "Beli Aplikasi", category: "sales" },
  { code: "104", name: "Cicilan Aplikasi", category: "sales" },
  { code: "105", name: "UMKM Server", category: "sales" },
  { code: "106", name: "Penambahan Fitur", category: "sales" },
  { code: "107", name: "Pro Mode", category: "sales" },

  // --- OUTCOME (Pengeluaran Operasional & Produksi) ---
  { code: "201", name: "Music Production", category: "cogs" },
  { code: "202", name: "Video Production", category: "cogs" },
  { code: "203", name: "Grok", category: "expense" },
  { code: "204", name: "Server Internal", category: "expense" },
  { code: "205", name: "AI Agent", category: "expense" },
  { code: "206", name: "Poin+", category: "expense" },
  { code: "207", name: "CapCut Pro", category: "expense" },

  // --- PRIVE ---
  { code: "401", name: "Prive / Penarikan Owner", category: "prive" }
];

// COA Khusus ONEntertainment (Showbiz / Musik / Rekaman)
const ONENTERTAINMENT_COA_LIST = [
  { code: "101", name: "Royalti Musik Digital & Streaming", category: "sales" },
  { code: "102", name: "Adsense YouTube Music & Channel", category: "sales" },
  { code: "103", name: "Jasa Rekaman & Mixing Audio", category: "sales" },
  { code: "104", name: "Produksi Video Klip Artis", category: "sales" },
  { code: "105", name: "Sponsorship & Brand Partnership", category: "sales" },
  { code: "201", name: "Honor Musisi & Session Player", category: "cogs" },
  { code: "202", name: "Sewa Studio & Perangkat Sound", category: "cogs" },
  { code: "203", name: "Lisensi Software DAW & Audio Plugins", category: "expense" },
  { code: "204", name: "Distribusi Rilis Musik (Aggregator)", category: "expense" },
  { code: "401", name: "Prive / Bagi Hasil Partner", category: "prive" }
];

// COA Khusus Provider by Oneilverse (Infrastruktur / Cloud)
const PROVIDER_COA_LIST = [
  { code: "P101", name: "Langganan Server UMKM (50rb/bln)", category: "sales" },
  { code: "P102", name: "Biaya Lisensi Terminal Kasir Tambahan", category: "sales" },
  { code: "P103", name: "Upgrade Paket Plus Mode", category: "sales" },
  { code: "P104", name: "Upgrade Paket Pro Mode", category: "sales" },
  { code: "P105", name: "Jasa Custom Software & Maintenance", category: "sales" },
  { code: "P201", name: "Sewa Cloud Hosting & Database Server", category: "expense" },
  { code: "P202", name: "Kuota Token API AI Engine", category: "expense" },
  { code: "P203", name: "Biaya Transaksi Payment Gateway QRIS", category: "expense" },
  { code: "P401", name: "Prive / Penarikan Laba Provider", category: "prive" }
];

const TENANTS_CONFIG = {
  // 1. MASTER BLUEPRINT (Oneilverse Induk - Bersih Rp 0, Dikecualikan dari data provider)
  "id26110901": {
    id: "ID26110901",
    nama: "Oneilverse",
    slogan: "Creative Production & Software Infrastructure",
    warna: "#0f172a",
    warnaAksen: "#38bdf8",
    logoText: "ON",
    tier: "pro",
    isMaster: true,
    isSinglePage: false,
    customCOA: ONEILVERSE_COA_LIST,
    locations: {
      kasir: { name: "Kalinilam, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8485, lon: 109.9721 },
      manager: { name: "Kalinilam, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8482, lon: 109.9725 },
      owner: { name: "Kalinilam, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8480, lon: 109.9719 }
    }
  },
  "oneilverse": {
    id: "ID26110901",
    nama: "Oneilverse",
    slogan: "Creative Production & Software Infrastructure",
    warna: "#0f172a",
    warnaAksen: "#38bdf8",
    logoText: "ON",
    tier: "pro",
    isMaster: true,
    isSinglePage: false,
    customCOA: ONEILVERSE_COA_LIST,
    locations: {
      kasir: { name: "Kalinilam, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8485, lon: 109.9721 },
      manager: { name: "Kalinilam, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8482, lon: 109.9725 },
      owner: { name: "Kalinilam, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8480, lon: 109.9719 }
    }
  },

  // 2. ID261110B - Provider by Oneilverse (1 Laman Penampil Data Partner / Pribadi)
  "id261110b": {
    id: "ID261110B",
    nama: "Provider by Oneilverse",
    slogan: "Cloud Hosting, Licensing & Platform Infrastructure",
    warna: "#070d18",
    warnaAksen: "#38bdf8",
    logoText: "ON",
    tier: "pro",
    isMaster: false,
    isSinglePage: true, // 1 laman saja, tanpa kasir/manager/owner
    isProviderID: true, // Data masuk ke pendapatan Provider
    customCOA: PROVIDER_COA_LIST,
    locations: {
      kasir: { name: "Kalinilam, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8488, lon: 109.9722 },
      manager: { name: "Kalinilam, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8485, lon: 109.9720 },
      owner: { name: "Kalinilam, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8481, lon: 109.9718 }
    }
  },

  // 3. ID261110A - ONEntertainment by Oneilverse (1 Laman Penampil Data Partner / Showbiz)
  "id261110a": {
    id: "ID261110A",
    nama: "ONEntertainment by Oneilverse",
    slogan: "Music Production, Record Label & Showbiz Entertainment",
    warna: "#180828",
    warnaAksen: "#c084fc",
    logoText: "ON",
    tier: "pro",
    isMaster: false,
    isSinglePage: true, // 1 laman saja, tanpa kasir/manager/owner
    isProviderID: false,
    customCOA: ONENTERTAINMENT_COA_LIST,
    locations: {
      kasir: { name: "Kalinilam, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8479, lon: 109.9730 },
      manager: { name: "Kalinilam, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8475, lon: 109.9728 },
      owner: { name: "Kalinilam, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8470, lon: 109.9725 }
    }
  },

  // 4. Mitra Klien UMKM Contoh (Untuk simulasi Leaderboard & Jaringan UMKM Sehat/Defisit)
  "id26111001": {
    id: "ID26111001",
    nama: "Berkah Jati Furniture",
    slogan: "Mebel & Kerajinan Kayu Berkualitas",
    warna: "#1e293b",
    warnaAksen: "#10b981",
    logoText: "BJ",
    tier: "plus",
    isMaster: false,
    isSinglePage: false,
    customCOA: ONEILVERSE_COA_LIST,
    locations: {
      kasir: { name: "Kantor Mulia, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8390, lon: 109.9801 },
      manager: { name: "Kantor Mulia, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8385, lon: 109.9805 },
      owner: { name: "Mulia Kerta, Benua Kayong, Ketapang, Kalimantan Barat", lat: -1.8450, lon: 109.9910 }
    }
  },
  "id26111003": {
    id: "ID26111003",
    nama: "Kopi Sentosa Ritel",
    slogan: "Coffee Roastery & Retail Cafe",
    warna: "#292524",
    warnaAksen: "#f59e0b",
    logoText: "KS",
    tier: "basic",
    isMaster: false,
    isSinglePage: false,
    customCOA: ONEILVERSE_COA_LIST,
    locations: {
      kasir: { name: "Sukaharja, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8510, lon: 109.9740 },
      manager: { name: "Sukaharja, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8512, lon: 109.9745 },
      owner: { name: "Sampit, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8490, lon: 109.9710 }
    }
  },
  "id26111004": {
    id: "ID26111004",
    nama: "Studio Kreatif Mandiri",
    slogan: "Design Graphic & Digital Printing",
    warna: "#1e1b4b",
    warnaAksen: "#6366f1",
    logoText: "SM",
    tier: "plus",
    isMaster: false,
    isSinglePage: false,
    customCOA: ONEILVERSE_COA_LIST,
    locations: {
      kasir: { name: "Tengah, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8440, lon: 109.9680 },
      manager: { name: "Tengah, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8442, lon: 109.9685 },
      owner: { name: "Kalinilam, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8480, lon: 109.9719 }
    }
  }
};

function getActiveTenant() {
  const urlParams = new URLSearchParams(window.location.search);
  const tenantKey = (urlParams.get("toko") || "").toLowerCase().trim();
  if (tenantKey && TENANTS_CONFIG[tenantKey]) {
    return TENANTS_CONFIG[tenantKey];
  }
  // Default adalah Master Template Oneilverse
  return TENANTS_CONFIG["id26110901"];
}

// Format Usia ID sesuai aturan 1000 menit & 1000 jam
function formatIdAge(createdAtMs) {
  if (!createdAtMs) return "1 menit";
  const diffMs = Math.max(0, Date.now() - createdAtMs);
  const totalMinutes = Math.floor(diffMs / 60000);

  if (totalMinutes < 1000) {
    return `${Math.max(1, totalMinutes)} menit`;
  }
  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 1000) {
    return `${totalHours} jam`;
  }
  const totalDays = Math.floor(totalHours / 24);
  return `${totalDays} hari`;
}
