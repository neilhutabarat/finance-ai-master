/* plans.js — daftar fitur per paket (Basic / Plus / Pro), pengunci (gembok), dan kartu "Segera tersedia".
   Satu sumber kebenaran: ubah status 'soon' -> 'ready' saat fiturnya sudah dibangun. */
(function () {
  var ORDER = { basic: 0, plus: 1, pro: 2 };
  var LABEL = { basic: 'Basic', plus: 'Plus', pro: 'Pro' };

  // status: 'ready' = sudah ada di aplikasi; 'soon' = belum (tampil redup "Segera tersedia"); need: 'server' = menunggu server (Blaze)
  var FEATURES = [
    { key: 'export_raw', tier: 'basic', status: 'ready', icon: '📤', label: 'Ekspor data mentah (CSV/Excel)', desc: 'Unduh seluruh transaksi kapan saja. Data milik Anda.' },

    { key: 'today_summary', tier: 'plus', status: 'ready', icon: '📊', label: 'Ringkasan Hari Ini', desc: 'Omzet, laba kotor, produk terlaris, dan jam ramai dalam satu kartu.' },
    { key: 'margin_product', tier: 'plus', status: 'ready', icon: '💹', label: 'Laba & margin per produk', desc: 'Tahu produk mana yang benar-benar untung dan mana yang tipis.' },
    { key: 'low_stock', tier: 'plus', status: 'ready', icon: '📦', label: 'Peringatan stok menipis', desc: 'Daftar belanja otomatis sebelum barang laris habis.' },
    { key: 'pay_methods', tier: 'plus', status: 'ready', icon: '💳', label: 'Rekap metode bayar', desc: 'Tunai, QRIS, dan transfer terpisah agar kas selalu cocok.' },
    { key: 'wa_receipt', tier: 'plus', status: 'ready', icon: '💬', label: 'Struk lewat WhatsApp', desc: 'Kirim struk digital ke pelanggan tanpa kertas.' },
    { key: 'targets', tier: 'plus', status: 'ready', icon: '🎯', label: 'Target harian & bulanan', desc: 'Pantau progres omzet terhadap target Anda.' },
    { key: 'ar_debt', tier: 'plus', status: 'soon', icon: '🧾', label: 'Piutang & kasbon pelanggan', desc: 'Catat utang pelanggan dan pengingat jatuh tempo.' },
    { key: 'promo', tier: 'plus', status: 'soon', icon: '🏷️', label: 'Diskon & promo', desc: 'Diskon persen, nominal, dan paket langsung di kasir.' },
    { key: 'pdf_report', tier: 'plus', status: 'soon', icon: '📄', label: 'Laporan PDF/Excel berlogo', desc: 'Laporan rapi siap kirim ke bank atau akuntan.' },
    { key: 'ai_5q', tier: 'plus', status: 'soon', need: 'server', icon: '🤖', label: 'Analisis AI (5 pertanyaan)', desc: 'Jawaban otomatis atas pertanyaan penting tentang usaha Anda.' },

    { key: 'roles_detail', tier: 'pro', status: 'soon', icon: '🛡️', label: 'Izin rinci per peran', desc: 'Atur batas diskon, void, dan persetujuan manager.' },
    { key: 'anomaly', tier: 'pro', status: 'soon', icon: '🚨', label: 'Deteksi anomali', desc: 'Void berlebihan, harga diubah, dan selisih kas ketahuan.' },
    { key: 'forecast_stock', tier: 'pro', status: 'soon', icon: '🔮', label: 'Prediksi stok habis', desc: 'Perkiraan kapan barang habis dan rekomendasi belanja.' },
    { key: 'finance_full', tier: 'pro', status: 'soon', icon: '📚', label: 'Laporan keuangan lengkap', desc: 'Arus kas, neraca sederhana, dan estimasi pajak final UMKM.' },
    { key: 'budget', tier: 'pro', status: 'soon', icon: '🧮', label: 'Anggaran per akun', desc: 'Peringatan saat pengeluaran melewati anggaran.' },
    { key: 'price_history', tier: 'pro', status: 'soon', icon: '🕘', label: 'Riwayat perubahan harga', desc: 'Siapa mengubah harga apa dan kapan.' },
    { key: 'drive_backup', tier: 'pro', status: 'soon', need: 'server', icon: '☁️', label: 'Cadangan ke Google Drive', desc: 'Cadangan terjadwal ke penyimpanan Anda sendiri.' },
    { key: 'ai_free', tier: 'pro', status: 'soon', need: 'server', icon: '🧠', label: 'Tanya AI bebas', desc: 'Tanya apa saja tentang usaha Anda, dengan kuota bulanan.' },
    { key: 'tg_report', tier: 'pro', status: 'soon', need: 'server', icon: '✈️', label: 'Laporan otomatis ke Telegram', desc: 'Ringkasan harian dan mingguan masuk sendiri ke ponsel.' },
    { key: 'multi_outlet', tier: 'pro', status: 'soon', icon: '🏬', label: 'Banyak outlet satu laporan', desc: 'Pantau semua cabang sekaligus.' },
    { key: 'stock_opname', tier: 'pro', status: 'soon', icon: '🗂️', label: 'Stok opname & pembelian', desc: 'Pembelian ke pemasok dan penyesuaian stok.' },
    { key: 'loyalty', tier: 'pro', status: 'soon', icon: '⭐', label: 'Member & poin loyalitas', desc: 'Pelanggan kembali karena poin.' }
  ];

  function tenantTier() {
    try {
      var tn = (typeof getActiveTenant === 'function') ? getActiveTenant() : null;
      if (!tn) return 'basic';
      return ORDER[tn.tier] != null ? tn.tier : 'basic';
    } catch (e) { return 'basic'; }
  }
  function find(key) { return FEATURES.find(function (f) { return f.key === key; }); }
  // true jika paket toko sudah mencukupi DAN fiturnya sudah ada
  function has(key) {
    var f = find(key); if (!f) return false;
    return f.status === 'ready' && ORDER[tenantTier()] >= ORDER[f.tier];
  }
  function tierOf(key) { var f = find(key); return f ? f.tier : 'pro'; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  // HTML kotak terkunci dengan teaser dari data toko sendiri
  function lockedHtml(key, teaser) {
    var f = find(key) || { label: key, tier: 'plus' };
    return '<div style="border:1px dashed rgba(148,163,184,.5);border-radius:16px;padding:14px;background:rgba(100,116,139,.12);text-align:left">' +
      '<div style="font-weight:800;font-size:13px">🔒 ' + esc(f.label) + ' <span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:99px;background:rgba(245,158,11,.2);color:#f59e0b;margin-left:4px">' + LABEL[f.tier] + '</span></div>' +
      (teaser ? '<div style="font-size:12px;margin-top:6px;line-height:1.5;opacity:.9">' + teaser + '</div>' : '') +
      '<div style="font-size:11px;margin-top:6px;opacity:.7">Tersedia di paket ' + LABEL[f.tier] + '. Hubungi penyedia aplikasi untuk mengaktifkan.</div></div>';
  }

  function cardHtml(f) {
    var cur = ORDER[tenantTier()], need = ORDER[f.tier];
    var state, badge, op = 1;
    if (f.status === 'soon') { state = 'soon'; badge = 'Segera tersedia'; op = .9; }
    else if (cur >= need) { state = 'on'; badge = '✓ Aktif'; }
    else { state = 'lock'; badge = '🔒 ' + LABEL[f.tier]; }
    var bg = state === 'soon' ? 'rgba(15,23,42,.55)' : 'rgba(255,255,255,.06)';
    var bc = state === 'on' ? 'rgba(52,211,153,.5)' : 'rgba(255,255,255,.12)';
    var bgc = state === 'on' ? 'rgba(52,211,153,.2)' : state === 'lock' ? 'rgba(245,158,11,.2)' : 'rgba(148,163,184,.22)';
    var tc = state === 'on' ? 'text-emerald-600' : state === 'lock' ? 'text-amber-600' : 'text-slate-500';
    return '<div style="border:1px ' + (state === 'soon' ? 'dashed' : 'solid') + ' ' + bc + ';background:' + bg + ';border-radius:16px;padding:12px;opacity:' + op + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><b style="font-size:13px">' + f.icon + ' ' + esc(f.label) + '</b>' +
      '<span class="' + tc + '" style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:99px;white-space:nowrap;background:' + bgc + '">' + badge + '</span></div>' +
      '<div style="font-size:11.5px;margin-top:5px;line-height:1.5;opacity:.88">' + esc(f.desc) + '</div></div>';
  }

  function renderSections(filterSoonOnly) {
    var out = '';
    ['basic', 'plus', 'pro'].forEach(function (t) {
      var list = FEATURES.filter(function (f) { return f.tier === t && (!filterSoonOnly || f.status === 'soon'); });
      if (!list.length) return;
      out += '<div style="margin:16px 0 8px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.65">Fitur ' + LABEL[t] + (t === 'plus' ? ' · Paling Dipilih' : '') + '</div>' +
        '<div style="display:grid;gap:8px">' + list.map(cardHtml).join('') + '</div>';
    });
    return out;
  }

  function openModal() {
    var m = document.getElementById('fm-plans-modal');
    if (!m) {
      m = document.createElement('div'); m.id = 'fm-plans-modal';
      m.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482500;background:rgba(0,0,0,.7);align-items:center;justify-content:center;padding:14px;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,sans-serif';
      m.innerHTML = '<div style="width:100%;max-width:520px;max-height:90vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:17px">Fitur & Paket</b><button data-x style="border:0;border-radius:10px;background:#2a2a33;color:#fff;padding:8px 12px;font-weight:800;font-size:12px;cursor:pointer">Tutup</button></div><div data-sum style="font-size:12px;opacity:.75;margin-top:6px"></div><div data-body></div></div>';
      m.addEventListener('click', function (e) { if (e.target === m || e.target.hasAttribute('data-x')) m.style.display = 'none'; });
      document.body.appendChild(m);
    }
    m.querySelector('[data-sum]').textContent = 'Paket toko Anda: ' + LABEL[tenantTier()] + '. Fitur yang terkunci tetap terlihat agar Anda tahu apa yang tersedia.';
    m.querySelector('[data-body]').innerHTML = renderSections(false);
    m.style.display = 'flex';
  }

  window.FM_PLANS = { FEATURES: FEATURES, LABEL: LABEL, tier: tenantTier, has: has, tierOf: tierOf, lockedHtml: lockedHtml, renderSections: renderSections, openModal: openModal, cardHtml: cardHtml };
})();
