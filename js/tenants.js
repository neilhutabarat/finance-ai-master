/**
 * tenants.js - Konfigurasi Multi-Tenant & Master Engine Oneilverse
 */

// COA Standar Master Template Oneilverse
const ONEILVERSE_COA_LIST = [
  { code: "101", name: "Iklan Video YouTube", category: "sales" },
  { code: "102", name: "Adsense YouTube", category: "sales" },
  { code: "103", name: "Beli Aplikasi", category: "sales" },
  { code: "104", name: "Cicilan Aplikasi", category: "sales" },
  { code: "105", name: "UMKM Server", category: "sales" },
  { code: "106", name: "Penambahan Fitur", category: "sales" },
  { code: "107", name: "Pro Mode", category: "sales" },
  { code: "201", name: "Music Production", category: "cogs" },
  { code: "202", name: "Video Production", category: "cogs" },
  { code: "203", name: "Grok", category: "expense" },
  { code: "204", name: "Server Internal", category: "expense" },
  { code: "205", name: "AI Agent", category: "expense" },
  { code: "206", name: "Poin+", category: "expense" },
  { code: "207", name: "CapCut Pro", category: "expense" },
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
  { code: "202", name: "Sewa Studio & Sound System", category: "cogs" },
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
  // 1. MASTER BLUEPRINT (Oneilverse Induk - Bersih Rp 0, Dikecualikan dari data statistik provider)
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
    isSinglePage: true,
    isProviderID: true,
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
    isSinglePage: true,
    isProviderID: false,
    customCOA: ONENTERTAINMENT_COA_LIST,
    locations: {
      kasir: { name: "Kalinilam, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8479, lon: 109.9730 },
      manager: { name: "Kalinilam, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8475, lon: 109.9728 },
      owner: { name: "Kalinilam, Delta Pawan, Ketapang, Kalimantan Barat", lat: -1.8470, lon: 109.9725 }
    }
  },
  // 4. Mitra Klien UMKM Contoh
};

const TENANT_NOT_FOUND = {
  id: "TOKO-TIDAK-DITEMUKAN",
  nama: "Toko tidak ditemukan",
  slogan: "Periksa kembali link toko Anda dan pastikan perangkat terhubung ke internet.",
  warna: "#334155", warnaAksen: "#94a3b8", logoText: "?",
  tier: "basic", isMaster: false, isSinglePage: false, isProviderID: false,
  notFound: true, customCOA: [],
  locations: { kasir: { name: "-", lat: 0, lon: 0 }, manager: { name: "-", lat: 0, lon: 0 }, owner: { name: "-", lat: 0, lon: 0 } }
};

function getActiveTenant() {
  const urlParams = new URLSearchParams(window.location.search);
  const tenantKey = (urlParams.get("toko") || "").toLowerCase().trim();
  if (tenantKey && TENANTS_CONFIG[tenantKey]) {
    return TENANTS_CONFIG[tenantKey];
  }
  // Ada parameter ?toko= tetapi tokonya tidak dikenal: jangan jatuh ke Oneilverse.
  if (tenantKey && tenantKey !== "oneilverse") {
    return TENANT_NOT_FOUND;
  }
  return TENANTS_CONFIG["id26110901"];
}

function formatIdAge(createdAtMs) {
  if (!createdAtMs) return "1 menit";
  const diffMs = Math.max(0, Date.now() - createdAtMs);
  const totalMinutes = Math.floor(diffMs / 60000);
  if (totalMinutes < 1000) return `${Math.max(1, totalMinutes)} menit`;
  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 1000) return `${totalHours} jam`;
  const totalDays = Math.floor(totalHours / 24);
  return `${totalDays} hari`;
}

// >>> REGISTRY-BEGIN
// ===== TOKO KLIEN DINAMIS (dibuat dari Tower Kontrol, disimpan di Firestore: tenants_registry) =====
// COA standar untuk toko klien baru (bisa diubah per toko nanti).
const DEFAULT_UMKM_COA = [
  { code: "101", name: "Penjualan Produk/Jasa", category: "sales" },
  { code: "102", name: "Pendapatan Lain-lain", category: "sales" },
  { code: "201", name: "Pembelian Bahan Baku / Barang Dagang", category: "cogs" },
  { code: "301", name: "Gaji & Upah", category: "expense" },
  { code: "302", name: "Sewa Tempat", category: "expense" },
  { code: "303", name: "Listrik, Air & Internet", category: "expense" },
  { code: "304", name: "Transportasi & Operasional", category: "expense" },
  { code: "305", name: "Perlengkapan & Pemeliharaan", category: "expense" },
  { code: "401", name: "Prive (Pengambilan Pribadi Owner)", category: "prive" }
];

const REGISTRY_PROJECT_ID = "finance-ai-master-byneilverse";
const REGISTRY_API_KEY = "AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI"; // kunci web Firebase (bukan rahasia)
const REGISTRY_CACHE_KEY = "fm_registry_cache_v1";

function registryMerge(cfg) {
  if (!cfg || !cfg.id) return null;
  const k = String(cfg.id).toLowerCase();
  if (TENANTS_CONFIG[k] && !TENANTS_CONFIG[k].fromRegistry) return null; // toko bawaan file tidak boleh ditimpa
  cfg.fromRegistry = true;
  if (!cfg.customCOA || !cfg.customCOA.length) cfg.customCOA = DEFAULT_UMKM_COA;
  TENANTS_CONFIG[k] = cfg;
  return k;
}

function registryReadCache() {
  try { return JSON.parse(localStorage.getItem(REGISTRY_CACHE_KEY) || "{}") || {}; } catch (e) { return {}; }
}
function registryWriteCache(key, cfg) {
  try { const c = registryReadCache(); c[key] = cfg; localStorage.setItem(REGISTRY_CACHE_KEY, JSON.stringify(c)); } catch (e) {}
}

function registryFetch(key, isAsync, done) {
  const url = "https://firestore.googleapis.com/v1/projects/" + REGISTRY_PROJECT_ID +
    "/databases/(default)/documents/tenants_registry/" + encodeURIComponent(key) + "?key=" + REGISTRY_API_KEY;
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, isAsync);
    const handle = function () {
      let cfg = null;
      if (xhr.status === 200) {
        try {
          const f = JSON.parse(xhr.responseText).fields || {};
          if (f.json && f.json.stringValue) cfg = JSON.parse(f.json.stringValue);
        } catch (e) {}
      }
      if (cfg) { registryMerge(cfg); registryWriteCache(key, cfg); }
      if (done) done(cfg);
    };
    if (isAsync) { xhr.onload = handle; xhr.onerror = function () { if (done) done(null); }; }
    xhr.send();
    if (!isAsync) handle();
  } catch (e) { if (done) done(null); }
}

(function loadRegistryForCurrentUrl() {
  try {
    const key = (new URLSearchParams(window.location.search).get("toko") || "").toLowerCase().trim();
    if (!key || (TENANTS_CONFIG[key] && !TENANTS_CONFIG[key].fromRegistry)) return;
    const cached = registryReadCache()[key];
    if (cached) {
      registryMerge(cached);            // pakai cache supaya halaman langsung siap
      registryFetch(key, true, function (fresh) {   // segarkan cache di latar belakang
        try {
          const flag = "fm_reload_" + key;
          if (fresh && fresh.tier !== cached.tier) {   // paket berubah: muat ulang sekali agar fitur baru aktif
            if (!sessionStorage.getItem(flag)) { sessionStorage.setItem(flag, "1"); window.location.reload(); }
          } else { sessionStorage.removeItem(flag); }
        } catch (e) {}
      });
    } else {
      registryFetch(key, false);        // pertama kali: ambil dulu dari server sebelum halaman berjalan
    }
  } catch (e) {}
})();
// <<< REGISTRY-END
