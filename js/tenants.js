/**
 * tenants.js - Konfigurasi Multi-Tenant Finance Master
 * Termasuk Entitas Utama ID: ID26110901 (Oneilverse)
 */

const TENANTS_CONFIG = {
  // 1. Entitas Utama: Oneilverse (ID: ID26110901)
  "id26110901": {
    id: "ID26110901",
    nama: "Oneilverse",
    slogan: "Creative Production & Software Infrastructure",
    warna: "#0f172a", // Slate Dark Premium
    warnaAksen: "#6366f1", // Indigo Modern
    logoText: "⚡",
    isMasterEnterprise: true,
    customCOA: [
      // --- INCOME (Pemasukan) ---
      { code: "101", name: "Iklan Video YouTube", category: "sales" },
      { code: "102", name: "Adsense YouTube", category: "sales" },
      { code: "103", name: "Beli Aplikasi", category: "sales" },
      { code: "104", name: "Cicilan Aplikasi", category: "sales" },
      { code: "105", name: "UMKM Server", category: "sales" },
      { code: "106", name: "Penambahan Fitur", category: "sales" },
      { code: "107", name: "Pro Mode", category: "sales" },

      // --- OUTCOME (Pengeluaran / Biaya Operasional & Produksi) ---
      { code: "201", name: "Music Production", category: "cogs" },
      { code: "202", name: "Video Production", category: "cogs" },
      { code: "203", name: "Grok", category: "expense" },
      { code: "204", name: "Server Internal", category: "expense" },
      { code: "205", name: "AI Agent", category: "expense" },
      { code: "206", name: "Poin+", category: "expense" },
      { code: "207", name: "CapCut Pro", category: "expense" },

      // --- MODAL / PRIVE ---
      { code: "401", name: "Prive / Penarikan Owner", category: "prive" }
    ]
  },

  // Alias jika dibuka dengan ?toko=oneilverse
  "oneilverse": {
    id: "ID26110901",
    nama: "Oneilverse",
    slogan: "Creative Production & Software Infrastructure",
    warna: "#0f172a",
    warnaAksen: "#6366f1",
    logoText: "⚡",
    isMasterEnterprise: true,
    customCOA: [
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
    ]
  },

  // Default bawaan untuk UMKM lain
  "default": {
    id: "default",
    nama: "Terminal Kasir & Admin",
    slogan: "Input Transaksi & Laporan Mutasi Kas / Buku Besar",
    warna: "#059669",
    warnaAksen: "#10b981",
    logoText: "🏪",
    customCOA: []
  }
};

function getActiveTenant() {
  const urlParams = new URLSearchParams(window.location.search);
  const tenantKey = (urlParams.get("toko") || "").toLowerCase().trim();
  if (tenantKey && TENANTS_CONFIG[tenantKey]) {
    return TENANTS_CONFIG[tenantKey];
  }
  // Jika tidak diisi parameter, default ke ID26110901 (Oneilverse) atau profil default
  return TENANTS_CONFIG["id26110901"] || TENANTS_CONFIG["default"];
}
