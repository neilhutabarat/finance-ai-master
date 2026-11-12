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

/* Kunci toko dari alamat (?toko=) atau, di halaman login yang alamatnya dipersingkat, dari memori halaman */
function fmTokoParam() {
  try { return new URLSearchParams(window.location.search).get("toko") || window.__fmToko || ""; } catch (e) { return window.__fmToko || ""; }
}

function getActiveTenant() {
  const tenantKey = String(fmTokoParam()).toLowerCase().trim();
  if (tenantKey && TENANTS_CONFIG[tenantKey]) {
    return TENANTS_CONFIG[tenantKey].deletedByTower ? TENANT_NOT_FOUND : TENANTS_CONFIG[tenantKey];
  }
  // Ada parameter ?toko= tetapi tokonya tidak dikenal: jangan jatuh ke Oneilverse.
  if (tenantKey && tenantKey !== "oneilverse") {
    return TENANT_NOT_FOUND;
  }
  return (TENANTS_CONFIG["id26110901"] && TENANTS_CONFIG["id26110901"].deletedByTower) ? TENANT_NOT_FOUND : TENANTS_CONFIG["id26110901"];
}
// toko yang boleh diatur penuh dari Tower: toko klien buatan Tower + toko master (untuk uji coba fitur)
function isManaged(tn) { return !!(tn && (tn.fromRegistry || tn.isMaster)); }

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

// Template COA per jenis usaha (dipilih saat membuat toko di Tower; setelah itu bebas diedit per toko)
const COA_TEMPLATES = {
  umum: { label: "Usaha Umum (standar)", coa: DEFAULT_UMKM_COA },
  warung: { label: "Warung / Kafe / Rumah Makan", coa: [
    { code: "101", name: "Penjualan Makanan", category: "sales" },
    { code: "102", name: "Penjualan Minuman", category: "sales" },
    { code: "103", name: "Pendapatan Lain-lain", category: "sales" },
    { code: "201", name: "Bahan Baku Makanan", category: "cogs" },
    { code: "202", name: "Bahan Baku Minuman", category: "cogs" },
    { code: "203", name: "Kemasan & Perlengkapan Saji", category: "cogs" },
    { code: "301", name: "Gaji & Upah", category: "expense" },
    { code: "302", name: "Sewa Tempat", category: "expense" },
    { code: "303", name: "Listrik, Air & Gas", category: "expense" },
    { code: "304", name: "Transportasi & Operasional", category: "expense" },
    { code: "305", name: "Perawatan Peralatan", category: "expense" },
    { code: "306", name: "Promosi & Iklan", category: "expense" },
    { code: "401", name: "Prive (Pengambilan Pribadi Owner)", category: "prive" }
  ] },
  toko: { label: "Toko / Minimarket", coa: [
    { code: "101", name: "Penjualan Barang", category: "sales" },
    { code: "102", name: "Komisi & Jasa (pulsa, token, dll)", category: "sales" },
    { code: "103", name: "Pendapatan Lain-lain", category: "sales" },
    { code: "201", name: "Pembelian Barang Dagang", category: "cogs" },
    { code: "202", name: "Ongkos Kirim Pembelian", category: "cogs" },
    { code: "301", name: "Gaji & Upah", category: "expense" },
    { code: "302", name: "Sewa Tempat", category: "expense" },
    { code: "303", name: "Listrik, Air & Internet", category: "expense" },
    { code: "304", name: "Transportasi & Operasional", category: "expense" },
    { code: "305", name: "Perlengkapan Toko", category: "expense" },
    { code: "306", name: "Barang Rusak / Hilang", category: "expense" },
    { code: "401", name: "Prive (Pengambilan Pribadi Owner)", category: "prive" }
  ] },
  jasa: { label: "Jasa / Layanan", coa: [
    { code: "101", name: "Pendapatan Jasa", category: "sales" },
    { code: "102", name: "Pendapatan Lain-lain", category: "sales" },
    { code: "201", name: "Bahan / Material Jasa", category: "cogs" },
    { code: "202", name: "Upah Tenaga Lepas", category: "cogs" },
    { code: "301", name: "Gaji & Upah", category: "expense" },
    { code: "302", name: "Sewa Tempat", category: "expense" },
    { code: "303", name: "Listrik, Air & Internet", category: "expense" },
    { code: "304", name: "Transportasi & Operasional", category: "expense" },
    { code: "305", name: "Perlengkapan & Alat", category: "expense" },
    { code: "306", name: "Promosi & Iklan", category: "expense" },
    { code: "401", name: "Prive (Pengambilan Pribadi Owner)", category: "prive" }
  ] },
  kosong: { label: "Kosong (isi sendiri)", coa: [] }
};

function registrySig(c) { return c ? [c.tier, c.nama, c.slogan, c.warna, c.warnaAksen, c.logoText, JSON.stringify(c.features || {}), c.deleted ? 'x' : '', c.pinnedVersion || ''].join("|") : ""; }

// Fitur per toko (diatur dari Tower). Jika belum diatur, fitur dianggap aktif.
function tenantHasFeature(tn, key) { return !(tn && tn.features && tn.features[key] === false); }

const REGISTRY_PROJECT_ID = "finance-ai-master-byneilverse";
const REGISTRY_API_KEY = "AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI"; // kunci web Firebase (bukan rahasia)
const REGISTRY_CACHE_KEY = "fm_registry_cache_v1";

function registryMerge(cfg) {
  if (!cfg || !cfg.id) return null;
  const k = String(cfg.id).toLowerCase();
  if (TENANTS_CONFIG[k] && !TENANTS_CONFIG[k].fromRegistry) {
    // toko bawaan file tidak boleh ditimpa, KECUALI toko master (uji coba): hanya field yang boleh diatur Tower
    if (!TENANTS_CONFIG[k].isMaster) return null;
    var m = TENANTS_CONFIG[k];
    ["nama", "slogan", "warna", "warnaAksen", "logoText", "tier", "features", "customCOA", "locations", "pinnedVersion"].forEach(function (f) { if (cfg[f] !== undefined) m[f] = cfg[f]; });
    m.deletedByTower = cfg.deleted === true;
    return k;
  }
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

function registryDropCache(key) {
  try { const c = registryReadCache(); delete c[key]; localStorage.setItem(REGISTRY_CACHE_KEY, JSON.stringify(c)); } catch (e) {}
  try { if (TENANTS_CONFIG[key] && TENANTS_CONFIG[key].fromRegistry) delete TENANTS_CONFIG[key]; } catch (e) {}
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
      else if (xhr.status === 404) { registryDropCache(key); }   // toko sudah dihapus dari Tower
      if (done) done(cfg, xhr.status);
    };
    if (isAsync) { xhr.onload = handle; xhr.onerror = function () { if (done) done(null); }; }
    xhr.send();
    if (!isAsync) handle();
  } catch (e) { if (done) done(null); }
}

(function loadRegistryForCurrentUrl() {
  try {
    const key = String(fmTokoParam()).toLowerCase().trim();
    if (!key) key = "id26110901";
    if (TENANTS_CONFIG[key] && !TENANTS_CONFIG[key].fromRegistry && !TENANTS_CONFIG[key].isMaster) return;
    const cached = registryReadCache()[key];
    if (cached) {
      registryMerge(cached);            // pakai cache supaya halaman langsung siap
      registryFetch(key, true, function (fresh, status) {   // segarkan cache di latar belakang
        try {
          const flag = "fm_reload_" + key;
          if (status === 404) {                // toko dihapus: buang cache lalu muat ulang agar tampil "Toko Tidak Ditemukan"
            if (!sessionStorage.getItem(flag)) { sessionStorage.setItem(flag, "1"); window.location.reload(); }
            return;
          }
          if (fresh && registrySig(fresh) !== registrySig(cached)) {   // paket/nama/slogan/tampilan berubah: muat ulang sekali
            if (!sessionStorage.getItem(flag)) { sessionStorage.setItem(flag, "1"); window.location.reload(); }
          } else { sessionStorage.removeItem(flag); }
        } catch (e) {}
      });
    } else {
      registryFetch(key, false);        // pertama kali: ambil dulu dari server sebelum halaman berjalan
    }
  } catch (e) {}
})();

// ===== TOKO BERHENTI (arsip 90 hari) =====
const FORMER_BASE = "https://firestore.googleapis.com/v1/projects/" + REGISTRY_PROJECT_ID + "/databases/(default)/documents/former_tenants/";
function formerFetch(key, cb) {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", FORMER_BASE + encodeURIComponent(String(key).toLowerCase()) + "?key=" + REGISTRY_API_KEY, true);
    xhr.onload = function () {
      if (xhr.status !== 200) return cb(null);
      try {
        const f = JSON.parse(xhr.responseText).fields || {};
        const g = function (k) { const v = f[k]; return v ? (v.stringValue !== undefined ? v.stringValue : v.integerValue !== undefined ? Number(v.integerValue) : v.booleanValue !== undefined ? v.booleanValue : null) : null; };
        cb({ id: g("id"), nama: g("nama"), endedAt: g("endedAt"), purgeAt: g("purgeAt"), status: g("status"), downloadRequested: g("downloadRequested"), requestedAt: g("requestedAt") });
      } catch (e) { cb(null); }
    };
    xhr.onerror = function () { cb(null); };
    xhr.send();
  } catch (e) { cb(null); }
}
function formerRequest(key, name, email, cb) {
  try {
    const xhr = new XMLHttpRequest();
    const mask = ["downloadRequested", "requestedAt", "contactName", "contactEmail"].map(function (m) { return "updateMask.fieldPaths=" + m; }).join("&");
    xhr.open("PATCH", FORMER_BASE + encodeURIComponent(String(key).toLowerCase()) + "?" + mask + "&key=" + REGISTRY_API_KEY, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function () { cb(xhr.status === 200); };
    xhr.onerror = function () { cb(false); };
    xhr.send(JSON.stringify({ fields: {
      downloadRequested: { booleanValue: true }, requestedAt: { integerValue: String(Date.now()) },
      contactName: { stringValue: String(name || "") }, contactEmail: { stringValue: String(email || "") }
    } }));
  } catch (e) { cb(false); }
}
const FORMER_NOTICE_HTML =
  '<div style="text-align:left;font-size:12px;line-height:1.65;color:#cbd5e1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px;margin:14px 0">' +
  '<b style="color:#fff;display:block;margin-bottom:6px">Ketentuan permintaan riwayat toko</b>' +
  '• Riwayat transaksi (seluruh waktu) dikirim oleh Tower Kontrol ke email Anda.<br>' +
  '• Pengunduhan hanya <b>1 kali</b>. Setelah data dikirim/diunduh, data toko langsung <b>dihapus permanen</b>.<br>' +
  '• Jika tidak diminta, data toko dihapus otomatis oleh sistem <b>90 hari</b> setelah kerja sama berakhir.<br>' +
  '• Tower Kontrol dapat menghapus data riwayat toko kapan saja.</div>';
function showFormerStoreCard(key, info) {
  const old = document.getElementById("former-card"); if (old) old.remove();
  const el = document.createElement("div");
  el.id = "former-card";
  el.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:rgba(2,6,23,.98);display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',Inter,system-ui,sans-serif;";
  const fmt = function (ms) { return new Date(ms).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }); };
  const left = Math.max(0, Math.ceil((info.purgeAt - Date.now()) / 86400000));
  let body;
  if (info.status !== "archived" || Date.now() > info.purgeAt) {
    body = '<p style="font-size:13px;color:#94a3b8;line-height:1.6">Masa penyimpanan data toko ini sudah berakhir, sehingga data riwayat telah dihapus.</p>';
  } else if (info.downloadRequested) {
    body = '<p style="font-size:13px;color:#86efac;line-height:1.6;margin-top:10px">✓ Permintaan Anda sudah diterima' + (info.requestedAt ? ' pada ' + fmt(info.requestedAt) : '') + '. Tower Kontrol akan mengirim riwayat toko ke email Anda.</p>' + FORMER_NOTICE_HTML;
  } else {
    body = '<p style="font-size:13px;color:#94a3b8;line-height:1.6">Data riwayat tersedia untuk diminta sampai <b style="color:#fff">' + fmt(info.purgeAt) + '</b> (' + left + ' hari lagi).</p>' + FORMER_NOTICE_HTML +
      '<input id="fc-name" placeholder="Nama Anda" style="width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.15);background:#0f172a;color:#fff;margin-bottom:8px;font-size:13px">' +
      '<input id="fc-email" type="email" placeholder="Email tujuan pengiriman" style="width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.15);background:#0f172a;color:#fff;margin-bottom:10px;font-size:13px">' +
      '<label style="display:flex;gap:8px;align-items:flex-start;font-size:12px;color:#cbd5e1;text-align:left;margin-bottom:12px"><input id="fc-ok" type="checkbox" style="margin-top:2px"> Saya sudah membaca dan memahami ketentuan di atas.</label>' +
      '<button id="fc-send" style="width:100%;padding:13px;border-radius:14px;border:0;background:#2563eb;color:#fff;font-weight:800;font-size:13px;cursor:pointer">Ajukan Permintaan Riwayat</button><p id="fc-msg" style="font-size:12px;color:#fca5a5;margin-top:8px"></p>';
  }
  el.innerHTML = '<div style="max-width:440px;width:100%;text-align:center;color:#e2e8f0"><div style="font-size:42px">📁</div>' +
    '<h2 style="font-size:20px;font-weight:800;margin:10px 0 6px">Kerja sama ' + String(info.nama || "").replace(/[<>&]/g, "") + ' telah berakhir</h2>' + body + '</div>';
  document.body.appendChild(el);
  const sb = document.getElementById("fc-send");
  if (sb) sb.onclick = function () {
    const n = document.getElementById("fc-name").value.trim(), em = document.getElementById("fc-email").value.trim(), msg = document.getElementById("fc-msg");
    if (!n || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { msg.innerText = "Isi nama dan email yang valid."; return; }
    if (!document.getElementById("fc-ok").checked) { msg.innerText = "Centang pernyataan memahami ketentuan."; return; }
    sb.disabled = true; sb.innerText = "Mengirim...";
    formerRequest(key, n, em, function (ok) {
      if (ok) { info.downloadRequested = true; info.requestedAt = Date.now(); showFormerStoreCard(key, info); }
      else { sb.disabled = false; sb.innerText = "Ajukan Permintaan Riwayat"; msg.innerText = "Gagal mengirim. Periksa internet lalu coba lagi."; }
    });
  };
}
// Dipanggil pada halaman yang menerima ?toko= yang tidak dikenal: jika ternyata toko lama, tampilkan kartu riwayat.
function checkFormerStore() {
  try {
    const key = String(fmTokoParam()).toLowerCase().trim();
    if (!key) return;
    formerFetch(key, function (info) { if (info && info.id) showFormerStoreCard(key, info); });
  } catch (e) {}
}
// <<< REGISTRY-END
