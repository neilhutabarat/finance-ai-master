/* kasir-v12.js — Modul Peningkatan Terminal Kasir v1.2 (Uji Coba Terisolasi)
   Memuat 11 fitur peningkatan:
   1. Hitung Uang Diterima & Kembalian + tombol pecahan cepat + Diskon Struk & Nama Pelanggan
   2. Tab Draft | Parkir Antrean | Riwayat Hari Ini (lengkap Cetak Ulang & WA)
   3. Chip Cepat "Sering Dipakai", kontrol Qty (+/-) langsung di draft, & form kiri ringkas
   4. Label jelas Saldo Shift (Belum Closing) vs Saldo Kas Sah (Akumulasi)
   5. Shortcut Keyboard Kasir (F2 Scan, F3 Akun, F4 Bayar, F6 Parkir, F8/Ctrl+Enter Cetak)
   6. Indikator Status Sync Server (Online/Offline) & Efek Suara Bip Scanner
   7. Parkir / Hold Antrean (Multi-Keranjang)
   8. Split Payment (Bayar Campuran: Tunai + QRIS / Transfer / Petty Cash)
   9. Struk Digital WhatsApp Lengkap (lengkap rincian item, kembalian, split, pelanggan)
   10. Peringatan Stok Real-Time saat pilih/scan produk (Habis / Menipis / Aman)
   11. Sakelar Mode Panduan (?) yang memunculkan/menyembunyikan ikon (i) penjelasan fungsi
*/
(function () {
  'use strict';

  /* ==================== 0. UTILITAS & SUARA BIP ==================== */
  var TENANT_ID = (function () {
    try { return (typeof activeTenant !== 'undefined' && activeTenant && activeTenant.id) ? activeTenant.id : 'default'; }
    catch (e) { return 'default'; }
  })();
  var PARK_KEY = 'fm_v12_parked_' + TENANT_ID;
  var BEEP_KEY = 'fm_v12_beep';
  var GUIDE_KEY = 'fm_v12_guide';

  var beepOn = (function () { try { return localStorage.getItem(BEEP_KEY) !== '0'; } catch (e) { return true; } })();
  var guideOn = (function () { try { return localStorage.getItem(GUIDE_KEY) === '1'; } catch (e) { return false; } })();
  var parkedList = (function () { try { return JSON.parse(localStorage.getItem(PARK_KEY) || '[]'); } catch (e) { return []; } })();

  var rightTab = 'draft'; // 'draft' | 'parked' | 'history'
  var payMode = 'tunai';  // 'tunai' | 'qris' | 'bank' | 'petty' | 'split'
  var audioCtx = null;

  function playTone(freq, dur, type, vol) {
    if (!beepOn) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq || 1050, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol || 0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (dur || 0.08));
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + (dur || 0.08));
    } catch (e) {}
  }

  function beepScan() { playTone(1200, 0.07, 'sine', 0.09); }
  function beepWarn() { playTone(320, 0.18, 'sawtooth', 0.11); }
  function beepSuccess() {
    playTone(880, 0.07, 'sine', 0.08);
    setTimeout(function () { playTone(1320, 0.11, 'sine', 0.09); }, 80);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtRp(n) {
    var v = Math.round(Number(n) || 0);
    var neg = v < 0;
    return (neg ? '-Rp ' : 'Rp ') + new Intl.NumberFormat('id-ID').format(Math.abs(v));
  }

  function fmtNum(n) {
    var v = Math.round(Number(n) || 0);
    return new Intl.NumberFormat('id-ID').format(Math.abs(v));
  }

  function parseNum(str) {
    if (typeof str === 'number') return str;
    var clean = String(str || '').replace(/[^0-9]/g, '');
    return parseInt(clean, 10) || 0;
  }

  /* ==================== 1. CSS KASIR v1.2 ==================== */
  var CSS = [
    '.v12-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:800;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;box-shadow:0 2px 10px rgba(99,102,241,.35);letter-spacing:.03em}',
    '.v12-sync{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:800;border:1px solid rgba(255,255,255,.2);background:rgba(15,23,42,.45);color:#e2e8f0;cursor:pointer;transition:all .15s}',
    '.v12-sync .dot{width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981}',
    '.v12-sync.off .dot{background:#f59e0b;box-shadow:0 0 8px #f59e0b}',
    '.v12-beep-btn{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:800;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);color:#fff;cursor:pointer}',
    '.v12-beep-btn.muted{opacity:.65;color:#cbd5e1}',
    /* Panel Opsi Ringkas Form Kiri */
    '.v12-opt-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;padding:7px 11px;border-radius:12px;background:rgba(241,245,249,.85);border:1px solid #cbd5e1;font-size:11px;font-weight:700;color:#334155;cursor:pointer;transition:all .15s}',
    '.v12-opt-toggle:hover{background:#e2e8f0;color:#0f172a}',
    '.v12-opt-body{display:none;padding:8px 10px;margin-top:4px;border-radius:14px;background:rgba(248,250,252,.9);border:1px dashed #cbd5e1;gap:8px;flex-direction:column}',
    '.v12-opt-body.open{display:flex}',
    /* Chip Cepat Favorit */
    '.v12-fav-box{display:flex;flex-direction:column;gap:4px}',
    '.v12-fav-hd{display:flex;align-items:center;justify-content:space-between;font-size:10.5px;font-weight:800;color:#475569}',
    '.v12-fav-list{display:flex;flex-wrap:wrap;gap:5px}',
    '.v12-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;font-size:11px;font-weight:700;background:#ffffff;border:1px solid #cbd5e1;color:#1e293b;cursor:pointer;transition:all .12s;max-width:100%}',
    '.v12-chip:hover{border-color:#6366f1;background:#eef2ff;color:#312e81;transform:translateY(-1px)}',
    '.v12-chip.is-prod{border-color:#a7f3d0;background:#ecfdf5;color:#065f46}',
    '.v12-chip.is-prod:hover{border-color:#059669;background:#d1fae5}',
    '.v12-chip.low{border-color:#fde68a;background:#fffbeb;color:#92400e}',
    '.v12-chip.out{border-color:#fecaca;background:#fef2f2;color:#991b1b;opacity:.65}',
    '.v12-chip small{font-size:9.5px;font-weight:800;opacity:.8}',
    /* Chip Nominal Cepat */
    '.v12-nom-chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}',
    '.v12-nom-btn{padding:3px 8px;border-radius:8px;font-size:10.5px;font-weight:800;background:#f1f5f9;border:1px solid #cbd5e1;color:#334155;cursor:pointer;font-family:"JetBrains Mono",monospace}',
    '.v12-nom-btn:hover{background:#e0e7ff;border-color:#818cf8;color:#1e1b4b}',
    /* Peringatan Stok Real-Time */
    '.v12-stk-alert{display:none;align-items:center;justify-content:space-between;padding:6px 10px;border-radius:11px;font-size:11px;font-weight:800;margin-top:4px}',
    '.v12-stk-alert.show{display:flex}',
    '.v12-stk-alert.ok{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46}',
    '.v12-stk-alert.warn{background:#fffbeb;border:1px solid #fcd34d;color:#92400e}',
    '.v12-stk-alert.err{background:#fef2f2;border:1px solid #fca5a5;color:#991b1b}',
    /* Tab Panel Kanan (Draft | Parkir | Riwayat) */
    '.v12-rtabs{display:flex;align-items:center;gap:4px;background:#f1f5f9;padding:3px;border-radius:12px;border:1px solid #cbd5e1;flex-wrap:wrap}',
    '.v12-rtab{all:unset;cursor:pointer;padding:5px 10px;border-radius:9px;font-size:11px;font-weight:800;color:#475569;display:inline-flex;align-items:center;gap:5px;transition:all .15s}',
    '.v12-rtab:hover{color:#0f172a;background:rgba(255,255,255,.5)}',
    '.v12-rtab.on{background:#4f46e5;color:#ffffff;box-shadow:0 2px 8px rgba(79,70,229,.28)}',
    '.v12-rtab .cnt{padding:1px 6px;border-radius:999px;font-size:9.5px;background:rgba(15,23,42,.12);color:inherit}',
    '.v12-rtab.on .cnt{background:rgba(255,255,255,.22);color:#fff}',
    '.v12-park-btn{all:unset;cursor:pointer;margin-left:auto;padding:5px 10px;border-radius:9px;font-size:11px;font-weight:800;background:#fffbeb;border:1px solid #fcd34d;color:#92400e;display:inline-flex;align-items:center;gap:4px;transition:all .12s}',
    '.v12-park-btn:hover{background:#fef3c7;border-color:#f59e0b}',
    /* Kontrol Qty Inline di Draft */
    '.v12-dqty{display:inline-flex;align-items:center;gap:2px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:1px 3px;margin-right:4px}',
    '.v12-dqty button{all:unset;cursor:pointer;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:#334155;border-radius:5px}',
    '.v12-dqty button:hover{background:#e2e8f0;color:#0f172a}',
    '.v12-dqty span{font-size:10.5px;font-weight:800;padding:0 4px;font-family:"JetBrains Mono",monospace;color:#0f172a}',
    /* Panel Checkout: Diskon, Pelanggan, Uang Diterima, Kembalian, Split Payment */
    '.v12-co{background:rgba(248,250,252,.92);border:1px solid #cbd5e1;border-radius:16px;padding:10px 12px;display:flex;flex-direction:column;gap:8px;position:relative;z-index:10}',
    '.v12-co-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.v12-co label{display:block;font-size:10px;font-weight:800;color:#475569;margin-bottom:2px}',
    '.v12-co input,.v12-co select{width:100%;box-sizing:border-box;border-radius:10px;border:1px solid #cbd5e1;background:#ffffff;padding:5px 9px;font-size:11.5px;font-weight:700;color:#0f172a;outline:none}',
    '.v12-co input:focus,.v12-co select:focus{border-color:#4f46e5;box-shadow:0 0 0 2px rgba(79,70,229,.15)}',
    '.v12-pm-bar{display:flex;flex-wrap:wrap;gap:4px}',
    '.v12-pm-pill{all:unset;cursor:pointer;padding:4px 9px;border-radius:8px;font-size:10.5px;font-weight:800;background:#ffffff;border:1px solid #cbd5e1;color:#334155;transition:all .12s}',
    '.v12-pm-pill:hover{background:#f1f5f9}',
    '.v12-pm-pill.on{background:#4f46e5;border-color:#4f46e5;color:#ffffff}',
    '.v12-pm-pill.split.on{background:linear-gradient(135deg,#7c3aed,#4f46e5);border-color:#6d28d9;color:#fff}',
    '.v12-cash-box{display:flex;flex-direction:column;gap:6px}',
    '.v12-cash-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:8px;align-items:stretch}',
    '.v12-change-card{border-radius:12px;padding:6px 10px;display:flex;flex-direction:column;justify-content:center;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46}',
    '.v12-change-card.under{background:#fef2f2;border-color:#fca5a5;color:#991b1b}',
    '.v12-change-card.neutral{background:#f1f5f9;border-color:#cbd5e1;color:#475569}',
    '.v12-change-card small{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.03em}',
    '.v12-change-card b{font-size:14.5px;font-weight:900;font-family:"JetBrains Mono",monospace}',
    '.v12-split-box{display:none;flex-direction:column;gap:6px;padding:8px;border-radius:12px;background:#f5f3ff;border:1px solid #ddd6fe}',
    '.v12-split-box.show{display:flex}',
    '.v12-split-row{display:grid;grid-template-columns:110px 1fr;gap:6px;align-items:center}',
    /* Shortcut Bar */
    '.v12-kbd-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px;padding-top:4px;font-size:10px;color:#64748b;font-weight:700}',
    '.v12-kbd{display:inline-block;padding:1px 5px;border-radius:5px;background:#e2e8f0;color:#1e293b;font-family:"JetBrains Mono",monospace;font-size:9.5px;font-weight:800;margin-right:2px}',
    /* Mode Panduan (i) */
    '.v12-info-dot{display:none;width:16px;height:16px;border-radius:50%;background:#e0e7ff;border:1px solid #818cf8;color:#3730a3;font:900 10px/1 "Plus Jakarta Sans",sans-serif;align-items:center;justify-content:center;cursor:pointer;margin-left:5px;vertical-align:middle;padding:0;flex:none;transition:all .15s}',
    '.v12-info-dot:hover{background:#4f46e5;color:#ffffff;transform:scale(1.12)}',
    'html[data-v12-guide="1"] .v12-info-dot{display:inline-flex;animation:v12Pulse 2s infinite}',
    '@keyframes v12Pulse{0%,100%{box-shadow:0 0 0 0 rgba(79,70,229,.35)}50%{box-shadow:0 0 0 4px rgba(79,70,229,0)}}',
    '#v12-guide-fab{position:fixed;right:356px;bottom:16px;z-index:2147482000;height:38px;padding:0 13px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:#1e293b;color:#f8fafc;font:800 11.5px "Plus Jakarta Sans",system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.32);cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all .15s}',
    '#v12-guide-fab.on{background:#4f46e5;border-color:#a5b4fc;color:#ffffff;box-shadow:0 6px 20px rgba(79,70,229,.45)}',
    '#v12-tip-pop{position:fixed;z-index:2147483500;max-width:290px;background:#0f172a;color:#f8fafc;border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:11px 13px;font:600 11.5px/1.45 "Plus Jakarta Sans",system-ui,sans-serif;box-shadow:0 16px 38px rgba(2,6,23,.45);display:none}',
    '#v12-tip-pop.open{display:block}',
    '#v12-tip-pop b{display:block;font-size:12px;font-weight:800;color:#38bdf8;margin-bottom:3px}',
    /* Dark mode harmony */
    'html[data-fm-native="dark"] .v12-co,html[data-fm-black="1"] .v12-co{background:rgba(15,23,42,.75)!important;border-color:rgba(255,255,255,.14)!important;color:#f1f5f9!important}',
    'html[data-fm-native="dark"] .v12-co input,html[data-fm-native="dark"] .v12-co select,html[data-fm-black="1"] .v12-co input,html[data-fm-black="1"] .v12-co select{background:rgba(30,41,59,.9)!important;border-color:rgba(255,255,255,.16)!important;color:#f8fafc!important}',
    'html[data-fm-native="dark"] .v12-rtabs,html[data-fm-black="1"] .v12-rtabs{background:rgba(15,23,42,.8)!important;border-color:rgba(255,255,255,.14)!important}',
    'html[data-fm-native="dark"] .v12-rtab:not(.on),html[data-fm-black="1"] .v12-rtab:not(.on){color:#cbd5e1!important}',
    'html[data-fm-native="dark"] .v12-chip:not(.is-prod),html[data-fm-black="1"] .v12-chip:not(.is-prod){background:rgba(30,41,59,.85)!important;border-color:rgba(255,255,255,.15)!important;color:#e2e8f0!important}',
    'html[data-fm-native="dark"] .v12-opt-toggle,html[data-fm-black="1"] .v12-opt-toggle{background:rgba(30,41,59,.8)!important;border-color:rgba(255,255,255,.14)!important;color:#e2e8f0!important}',
    'html[data-fm-native="dark"] .v12-opt-body,html[data-fm-black="1"] .v12-opt-body{background:rgba(15,23,42,.75)!important;border-color:rgba(255,255,255,.16)!important}',
    '@media(max-width:768px){#v12-guide-fab{right:70px;bottom:16px}.v12-co-row,.v12-cash-grid{grid-template-columns:1fr}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('fm-kasir-v12-css')) return;
    var st = document.createElement('style');
    st.id = 'fm-kasir-v12-css';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  /* ==================== 2. MODE PANDUAN (i) & TOOLTIP ==================== */
  var tipEl = null;
  function applyGuideState() {
    if (guideOn) document.documentElement.setAttribute('data-v12-guide', '1');
    else document.documentElement.removeAttribute('data-v12-guide');
    var fab = document.getElementById('v12-guide-fab');
    if (fab) {
      fab.classList.toggle('on', guideOn);
      fab.innerHTML = '<span>💡 Panduan: ' + (guideOn ? 'AKTIF' : 'MATI') + '</span>';
    }
    var hBtn = document.getElementById('v12-help-guide-toggle');
    if (hBtn) {
      hBtn.textContent = guideOn ? 'Matikan Titik Panduan (ⓘ)' : 'Aktifkan Titik Panduan (ⓘ) di Layar';
      hBtn.style.background = guideOn ? '#4f46e5' : '#0f172a';
    }
    if (!guideOn && tipEl) tipEl.classList.remove('open');
  }

  function toggleGuide(force) {
    guideOn = typeof force === 'boolean' ? force : !guideOn;
    try { localStorage.setItem(GUIDE_KEY, guideOn ? '1' : '0'); } catch (e) {}
    applyGuideState();
    beepScan();
  }

  function makeInfoDot(title, desc) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'v12-info-dot';
    b.setAttribute('data-v12-title', title);
    b.setAttribute('data-v12-desc', desc);
    b.setAttribute('aria-label', 'Penjelasan ' + title);
    b.textContent = 'i';
    return b;
  }

  function attachInfoDot(targetEl, title, desc) {
    if (!targetEl || targetEl.querySelector('.v12-info-dot')) return;
    targetEl.appendChild(makeInfoDot(title, desc));
  }

  function initGuideSystem() {
    applyGuideState();
    if (!document.getElementById('v12-guide-fab')) {
      var fab = document.createElement('button');
      fab.id = 'v12-guide-fab';
      fab.type = 'button';
      fab.title = 'Tampilkan atau sembunyikan ikon penjelasan fungsi (ⓘ) di setiap bagian kasir';
      fab.onclick = function () { toggleGuide(); };
      document.body.appendChild(fab);
      applyGuideState();
    }
    if (!document.getElementById('v12-tip-pop')) {
      tipEl = document.createElement('div');
      tipEl.id = 'v12-tip-pop';
      document.body.appendChild(tipEl);
    }

    document.addEventListener('click', function (e) {
      var dot = e.target.closest('.v12-info-dot');
      if (dot) {
        e.preventDefault();
        e.stopPropagation();
        var ti = dot.getAttribute('data-v12-title') || 'Info Fungsi';
        var de = dot.getAttribute('data-v12-desc') || '';
        tipEl.innerHTML = '<b>ⓘ ' + esc(ti) + '</b><div>' + esc(de) + '</div>';
        tipEl.classList.add('open');
        var r = dot.getBoundingClientRect();
        var top = Math.min(window.innerHeight - 110, Math.max(12, r.bottom + 8));
        var left = Math.min(window.innerWidth - 305, Math.max(12, r.left - 20));
        tipEl.style.top = top + 'px';
        tipEl.style.left = left + 'px';
        return;
      }
      if (tipEl && !e.target.closest('#v12-tip-pop')) {
        tipEl.classList.remove('open');
      }
    }, true);

    // Pasang juga tombol sakelar di dalam popup ? (FM_HELP) saat dibuka
    document.addEventListener('click', function (e) {
      if (e.target.closest('#fm-help-fab') || e.target.closest('#fm-help')) {
        setTimeout(injectGuideSwitchIntoHelpModal, 60);
      }
    });
  }

  function injectGuideSwitchIntoHelpModal() {
    var helpModal = document.getElementById('fm-help');
    if (!helpModal || document.getElementById('v12-help-guide-bar')) return;
    var card = helpModal.firstElementChild;
    if (!card) return;
    var bar = document.createElement('div');
    bar.id = 'v12-help-guide-bar';
    bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;margin:8px 0;border-radius:12px;background:#eef2ff;border:1px solid #c7d2fe;color:#1e1b4b;font-size:12px;font-weight:700';
    bar.innerHTML = '<div><b>💡 Mode Panduan Layar (ⓘ)</b><div style="font-size:11px;font-weight:500;color:#4338ca">Munculkan ikon ⓘ di setiap tombol & fungsi kasir untuk penjelasan singkat.</div></div>' +
      '<button type="button" id="v12-help-guide-toggle" style="border:0;border-radius:10px;padding:7px 12px;color:#fff;font-weight:800;font-size:11.5px;cursor:pointer;white-space:nowrap"></button>';
    card.insertBefore(bar, card.children[1] || null);
    document.getElementById('v12-help-guide-toggle').onclick = function () { toggleGuide(); };
    applyGuideState();
  }

  /* ==================== 3. HEADER: BADGE v1.2, STATUS SYNC & BIP ==================== */
  function initHeaderIndicators() {
    var tierBadge = document.getElementById('tier-badge-indicator');
    if (tierBadge && !document.getElementById('v12-ver-badge')) {
      var vb = document.createElement('span');
      vb.id = 'v12-ver-badge';
      vb.className = 'v12-badge';
      vb.textContent = 'v1.2 UJI COBA';
      tierBadge.parentNode.insertBefore(vb, tierBadge.nextSibling);
    }

    var clockEl = document.getElementById('realtime-clock-display');
    var capsule = clockEl ? clockEl.parentElement : null;
    if (capsule && !document.getElementById('v12-sync-pill')) {
      var syncBtn = document.createElement('button');
      syncBtn.type = 'button';
      syncBtn.id = 'v12-sync-pill';
      syncBtn.className = 'v12-sync';
      syncBtn.title = 'Status sinkronisasi data dengan server Cloud Firestore';
      syncBtn.innerHTML = '<span class="dot"></span><span id="v12-sync-text">Server Sinkron</span>';
      capsule.parentNode.insertBefore(syncBtn, capsule.nextSibling);

      var sndBtn = document.createElement('button');
      sndBtn.type = 'button';
      sndBtn.id = 'v12-sound-btn';
      sndBtn.className = 'v12-beep-btn' + (beepOn ? '' : ' muted');
      sndBtn.title = 'Nyalakan/matikan suara bip kasir';
      sndBtn.textContent = beepOn ? '🔊 Bip' : '🔇 Bip';
      sndBtn.onclick = function () {
        beepOn = !beepOn;
        try { localStorage.setItem(BEEP_KEY, beepOn ? '1' : '0'); } catch (e) {}
        sndBtn.className = 'v12-beep-btn' + (beepOn ? '' : ' muted');
        sndBtn.textContent = beepOn ? '🔊 Bip' : '🔇 Bip';
        if (beepOn) beepScan();
      };
      capsule.parentNode.insertBefore(sndBtn, syncBtn.nextSibling);
    }

    function updateSyncStatus() {
      var pill = document.getElementById('v12-sync-pill');
      var txt = document.getElementById('v12-sync-text');
      if (!pill || !txt) return;
      var online = navigator.onLine !== false;
      var hasFirestore = typeof db !== 'undefined' && !!db;
      if (online && hasFirestore) {
        pill.classList.remove('off');
        txt.textContent = 'Server Tersinkron';
      } else {
        pill.classList.add('off');
        txt.textContent = online ? 'Mode Lokal' : 'Offline (Antre Lokal)';
      }
    }
    window.addEventListener('online', updateSyncStatus);
    window.addEventListener('offline', updateSyncStatus);
    setInterval(updateSyncStatus, 5000);
    updateSyncStatus();
  }

  /* ==================== 4. PERJELAS LABEL SALDO SHIFT VS AKUMULASI ==================== */
  function clarifyBalanceLabels() {
    var saldoCard = document.querySelector('.fm-saldo');
    if (saldoCard) {
      var titleSpan = saldoCard.querySelector('span.uppercase');
      if (titleSpan) {
        titleSpan.textContent = 'SALDO SHIFT (BELUM CLOSING)';
        attachInfoDot(titleSpan, 'Saldo Shift / Laci Kasir', 'Jumlah uang bersih di laci kasir pada shift saat ini (sejak closing terakhir). Akan kembali ke Rp 0 saat Anda menekan tombol Closing.');
      }
      var subSpan = titleSpan && titleSpan.nextElementSibling;
      if (subSpan) subSpan.textContent = 'Uang bersih shift aktif sejak closing terakhir';
    }

    var inEl = document.getElementById('kas-total-in');
    var outEl = document.getElementById('kas-total-out');
    var netEl = document.getElementById('kas-net');
    if (inEl && inEl.previousElementSibling) {
      inEl.previousElementSibling.textContent = 'TOTAL MASUK (PERIODE)';
    }
    if (outEl && outEl.previousElementSibling) {
      outEl.previousElementSibling.textContent = 'TOTAL KELUAR (PERIODE)';
    }
    if (netEl && netEl.previousElementSibling) {
      netEl.previousElementSibling.textContent = 'SALDO KAS SAH (AKUMULASI)';
      attachInfoDot(netEl.previousElementSibling, 'Saldo Kas Sah (Akumulasi)', 'Total akumulasi seluruh kas masuk dikurangi kas keluar yang sudah disahkan pada buku toko (termasuk shift-shift sebelumnya).');
    }
  }

  /* ==================== 5. RINGKAS FORM KIRI, CHIP FAVORIT & STOK REAL-TIME ==================== */
  function initLeftFormEnhancements() {
    var dateInput = document.getElementById('tx-date-input');
    var staffInput = document.getElementById('tx-staff');
    var accountSelect = document.getElementById('tx-account');
    var amountInput = document.getElementById('tx-amount');
    if (!dateInput || !accountSelect || !amountInput) return;

    // 5A. Lipat Tanggal, Bukti Struk, dan Petugas ke dalam bar opsional ringkas
    var topGrid = dateInput.closest('.grid');
    var staffBlock = staffInput ? staffInput.parentElement : null;
    if (topGrid && !document.getElementById('v12-opt-wrap')) {
      var wrap = document.createElement('div');
      wrap.id = 'v12-opt-wrap';
      wrap.className = 'relative z-10';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'v12-opt-toggle';
      btn.id = 'v12-opt-btn';

      var body = document.createElement('div');
      body.className = 'v12-opt-body';
      body.id = 'v12-opt-body';

      topGrid.parentNode.insertBefore(wrap, topGrid);
      body.appendChild(topGrid);
      if (staffBlock) body.appendChild(staffBlock);
      wrap.appendChild(btn);
      wrap.appendChild(body);

      function syncOptSummary() {
        var dVal = dateInput.value || '';
        var stVal = (staffInput && staffInput.value.trim()) || (typeof user !== 'undefined' && user.title) || 'Admin';
        var hasFile = !document.getElementById('file-chip').classList.contains('hidden');
        var isOpen = body.classList.contains('open');
        btn.innerHTML = '<span>⚙️ Tanggal: <b>' + esc(dVal || 'Hari ini') + '</b> · Petugas: <b>' + esc(stVal) + '</b>' + (hasFile ? ' · 📎 Bukti Terlampir' : ' · 📷 Bukti Nota') + '</span>' +
          '<span>' + (isOpen ? 'Tutup ▴' : 'Ubah ▾') + '</span>';
      }

      btn.onclick = function () {
        body.classList.toggle('open');
        syncOptSummary();
      };
      dateInput.addEventListener('change', syncOptSummary);
      if (staffInput) staffInput.addEventListener('input', syncOptSummary);
      syncOptSummary();
      attachInfoDot(btn, 'Opsi Tanggal, Petugas & Bukti', 'Tanggal & petugas otomatis terisi hari ini. Klik panel ini hanya jika ingin melampirkan foto nota/invoice atau mengubah tanggal mundur.');
    }

    // 5B. Chip Cepat "Sering Dipakai / Favorit"
    var accBlock = accountSelect.parentElement;
    if (accBlock && !document.getElementById('v12-fav-wrap')) {
      var favWrap = document.createElement('div');
      favWrap.id = 'v12-fav-wrap';
      favWrap.className = 'v12-fav-box';
      favWrap.innerHTML = '<div class="v12-fav-hd"><span id="v12-fav-title">⚡ Sering Dipakai (1-Klik)</span><span class="text-[10px] text-slate-400">Ketuk untuk pilih cepat</span></div>' +
        '<div id="v12-fav-list" class="v12-fav-list"></div>';
      accBlock.parentNode.insertBefore(favWrap, accBlock);
      attachInfoDot(document.getElementById('v12-fav-title'), 'Chip Cepat Sering Dipakai', 'Daftar produk dan akun mutasi yang paling sering ditransaksikan di toko ini. Klik 1x untuk langsung memilih atau menambah jumlah.');
    }

    // 5C. Banner Peringatan Stok Real-Time
    if (accBlock && !document.getElementById('v12-stock-alert')) {
      var stkAlert = document.createElement('div');
      stkAlert.id = 'v12-stock-alert';
      stkAlert.className = 'v12-stk-alert';
      accBlock.appendChild(stkAlert);
    }

    // 5D. Tombol Nominal Cepat di bawah Nominal Transaksi (untuk non-produk)
    var amtBlock = amountInput.parentElement;
    if (amtBlock && !document.getElementById('v12-nom-chips')) {
      var nomBox = document.createElement('div');
      nomBox.id = 'v12-nom-chips';
      nomBox.className = 'v12-nom-chips';
      [10000, 20000, 50000, 100000, 250000].forEach(function (val) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'v12-nom-btn';
        b.textContent = '+' + (val / 1000) + 'rb';
        b.onclick = function () {
          if (amountInput.readOnly) return;
          var cur = parseNum(amountInput.value);
          amountInput.value = fmtNum(cur + val);
          if (typeof calculateTaxPreview === 'function') calculateTaxPreview();
          beepScan();
        };
        nomBox.appendChild(b);
      });
      var clr = document.createElement('button');
      clr.type = 'button';
      clr.className = 'v12-nom-btn';
      clr.textContent = 'Reset';
      clr.onclick = function () {
        if (amountInput.readOnly) return;
        amountInput.value = '';
        if (typeof calculateTaxPreview === 'function') calculateTaxPreview();
      };
      nomBox.appendChild(clr);
      amountInput.parentNode.insertBefore(nomBox, amountInput.nextSibling);
    }

    renderFavoriteChips();
  }

  function renderFavoriteChips() {
    var listEl = document.getElementById('v12-fav-list');
    if (!listEl) return;

    var items = [];
    var seen = {};

    // 1. Ambil produk jualan toko (prioritas utama untuk POS)
    var prods = (typeof fmSaleProducts === 'function') ? fmSaleProducts() : [];
    prods.slice(0, 4).forEach(function (p) {
      var avail = (typeof availableStock === 'function') ? availableStock(p.code, '') : (p.stock || 0);
      seen[p.code] = true;
      items.push({
        code: p.code,
        name: p.name,
        isProduct: true,
        avail: avail,
        price: p.sellPrice
      });
    });

    // 2. Ambil akun yang paling sering muncul di txList
    var freq = {};
    var txs = (typeof myTx === 'function') ? myTx() : (typeof txList !== 'undefined' ? txList : []);
    (txs || []).forEach(function (t) {
      if (!t || !t.accountCode) return;
      freq[t.accountCode] = (freq[t.accountCode] || 0) + 1;
    });
    var coa = (typeof STORE !== 'undefined' && STORE.getCOA) ? STORE.getCOA() : [];
    var sortedCoa = coa.slice().sort(function (a, b) {
      return (freq[b.code] || 0) - (freq[a.code] || 0);
    });
    sortedCoa.forEach(function (c) {
      if (items.length >= 6 || seen[c.code]) return;
      if (typeof adminBizOk === 'function' && !adminBizOk(c.biz)) return;
      seen[c.code] = true;
      items.push({
        code: c.code,
        name: c.name,
        isProduct: false,
        category: c.category
      });
    });

    if (!items.length) {
      listEl.innerHTML = '<span class="text-[11px] text-slate-400">Pilih akun di bawah untuk mulai transaksi.</span>';
      return;
    }

    listEl.innerHTML = '';
    items.forEach(function (it) {
      var btn = document.createElement('button');
      btn.type = 'button';
      var cls = 'v12-chip';
      if (it.isProduct) {
        cls += ' is-prod';
        if (it.avail <= 0) cls += ' out';
        else if (it.avail <= 5) cls += ' low';
      }
      btn.className = cls;
      var stkText = it.isProduct ? (it.avail <= 0 ? 'Habis' : 'Stok ' + it.avail) : it.code;
      btn.innerHTML = '<span class="truncate max-w-[130px]">' + (it.isProduct ? '📦 ' : '') + esc(it.name) + '</span><small>(' + esc(stkText) + ')</small>';
      btn.onclick = function () {
        var sel = document.getElementById('tx-account');
        if (!sel) return;
        if (it.isProduct && it.avail <= 0) {
          beepWarn();
          updateStockAlertBanner();
          alert('Stok "' + it.name + '" sedang habis (0). Silakan tambah stok di menu Stok terlebih dahulu.');
          return;
        }
        // Jika produk yang sama sudah terpilih, tambah qty +1
        if (it.isProduct && sel.value === it.code && !document.getElementById('tx-qty-wrap').classList.contains('hidden')) {
          if (typeof changeQty === 'function') changeQty(1);
          beepScan();
          updateStockAlertBanner();
          return;
        }
        sel.value = it.code;
        if (typeof updateCategoryBadge === 'function') updateCategoryBadge();
        beepScan();
        updateStockAlertBanner();
        if (!it.isProduct) {
          var amt = document.getElementById('tx-amount');
          if (amt && !amt.readOnly) amt.focus();
        }
      };
      listEl.appendChild(btn);
    });
  }

  function updateStockAlertBanner() {
    var banner = document.getElementById('v12-stock-alert');
    var nomChips = document.getElementById('v12-nom-chips');
    var sel = document.getElementById('tx-account');
    if (!banner || !sel) return;
    var opt = sel.options[sel.selectedIndex];
    var isProd = opt && opt.dataset && opt.dataset.isProduct === 'true';

    if (nomChips) nomChips.style.display = isProd ? 'none' : 'flex';

    if (!isProd || !opt.value) {
      banner.className = 'v12-stk-alert';
      banner.innerHTML = '';
      return;
    }

    var editId = (document.getElementById('edit-draft-id') || {}).value || '';
    var avail = (typeof availableStock === 'function') ? availableStock(opt.value, editId) : 0;
    if (avail <= 0) {
      banner.className = 'v12-stk-alert show err';
      banner.innerHTML = '<span>⚠️ STOK HABIS (0 tersedia)</span><span>Tidak bisa dijual</span>';
      beepWarn();
    } else if (avail <= 5) {
      banner.className = 'v12-stk-alert show warn';
      banner.innerHTML = '<span>⚠️ STOK MENIPIS</span><span>Sisa ' + avail + ' di stok toko</span>';
    } else {
      banner.className = 'v12-stk-alert show ok';
      banner.innerHTML = '<span>✓ Stok Aman</span><span>Tersedia ' + avail + '</span>';
    }
  }

  /* ==================== 6. PANEL KANAN: 3 TAB (DRAFT | PARKIR | RIWAYAT) & CHECKOUT ==================== */
  function initRightPanelEnhancements() {
    var draftContainer = document.getElementById('draft-items-container');
    if (!draftContainer) return;
    var rightCard = draftContainer.parentElement;
    if (!rightCard || document.getElementById('v12-rtabs-bar')) return;

    var oldHeader = rightCard.firstElementChild;
    var tabHeader = document.createElement('div');
    tabHeader.id = 'v12-rtabs-bar';
    tabHeader.className = 'flex items-center justify-between border-b border-slate-200/80 pb-2.5 gap-2 flex-wrap relative z-10';
    tabHeader.innerHTML =
      '<div class="v12-rtabs" id="v12-rtabs">' +
        '<button type="button" class="v12-rtab on" data-rtab="draft">🛒 Draft <span class="cnt" id="draft-count-badge">0</span></button>' +
        '<button type="button" class="v12-rtab" data-rtab="parked">⏸ Parkir <span class="cnt" id="v12-park-count">0</span></button>' +
        '<button type="button" class="v12-rtab" data-rtab="history">🕒 Riwayat Hari Ini <span class="cnt" id="v12-hist-count">0</span></button>' +
      '</div>' +
      '<button type="button" class="v12-park-btn" id="v12-btn-park" title="Simpan sementara antrean ini untuk melayani pelanggan berikutnya (Shortcut: F6)">⏸ Parkirkan</button>';

    rightCard.replaceChild(tabHeader, oldHeader);
    attachInfoDot(document.getElementById('v12-rtabs'), 'Tab Draft, Parkir & Riwayat', 'Pindah antara keranjang aktif (Draft), keranjang pelanggan yang ditunda sementara (Parkir), dan daftar transaksi yang sudah lunas hari ini (Riwayat Hari Ini untuk cetak ulang/WA).');
    attachInfoDot(document.getElementById('v12-btn-park'), 'Parkirkan Antrean (Hold)', 'Jika pelanggan di kasir masih mengambil barang tambahan, klik Parkirkan agar keranjangnya disimpan sementara dan Anda bisa melayani antrean berikutnya.');

    // Container untuk tab Parkir dan tab Riwayat Hari Ini
    var parkedBox = document.createElement('div');
    parkedBox.id = 'v12-parked-container';
    parkedBox.className = 'hidden space-y-2 max-h-60 overflow-y-auto relative z-10';
    rightCard.insertBefore(parkedBox, draftContainer.nextSibling);

    var histBox = document.createElement('div');
    histBox.id = 'v12-history-container';
    histBox.className = 'hidden space-y-2 max-h-64 overflow-y-auto relative z-10';
    rightCard.insertBefore(histBox, parkedBox.nextSibling);

    // Panel Checkout: Pelanggan, Diskon Struk, Metode Bayar / Split, Uang Diterima & Kembalian
    var footerRow = rightCard.lastElementChild;
    var coBox = document.createElement('div');
    coBox.id = 'v12-checkout-box';
    coBox.className = 'v12-co';
    coBox.innerHTML =
      '<div class="v12-co-row">' +
        '<div><label id="v12-lbl-cust">👤 Pelanggan / Catatan Struk</label><input type="text" id="v12-cust-name" placeholder="Pelanggan Umum (opsional)"></div>' +
        '<div><label id="v12-lbl-disc">🏷️ Diskon / Potongan Struk (Rp / %)</label><input type="text" id="v12-bill-disc" placeholder="Misal: 5.000 atau 10%"></div>' +
      '</div>' +
      '<div>' +
        '<label id="v12-lbl-pm">💳 Metode Pembayaran</label>' +
        '<div class="v12-pm-bar" id="v12-pm-pills">' +
          '<button type="button" class="v12-pm-pill on" data-pm="tunai">💵 Tunai</button>' +
          '<button type="button" class="v12-pm-pill" data-pm="qris">📱 QRIS</button>' +
          '<button type="button" class="v12-pm-pill" data-pm="bank">🏦 Transfer Bank</button>' +
          '<button type="button" class="v12-pm-pill" data-pm="petty">🪙 Petty Cash</button>' +
          '<button type="button" class="v12-pm-pill split" data-pm="split">⚡ Split (Campuran)</button>' +
        '</div>' +
      '</div>' +
      '<div class="v12-cash-box" id="v12-cash-section">' +
        '<div class="v12-cash-grid">' +
          '<div>' +
            '<label id="v12-lbl-cash">💵 Uang Diterima (Rp) <span class="text-[9.5px] text-indigo-600">[F4]</span></label>' +
            '<input type="text" id="v12-cash-received" inputmode="numeric" placeholder="Ketik uang diterima..." class="font-mono">' +
          '</div>' +
          '<div class="v12-change-card neutral" id="v12-change-card">' +
            '<small id="v12-change-label">KEMBALIAN</small>' +
            '<b id="v12-change-amount">Rp 0</b>' +
          '</div>' +
        '</div>' +
        '<div class="v12-nom-chips" id="v12-cash-presets">' +
          '<button type="button" class="v12-nom-btn" data-cash="exact">Uang Pas</button>' +
          '<button type="button" class="v12-nom-btn" data-cash="20000">20.000</button>' +
          '<button type="button" class="v12-nom-btn" data-cash="50000">50.000</button>' +
          '<button type="button" class="v12-nom-btn" data-cash="100000">100.000</button>' +
          '<button type="button" class="v12-nom-btn" data-cash="+50000">+50rb</button>' +
        '</div>' +
      '</div>' +
      '<div class="v12-split-box" id="v12-split-section">' +
        '<div class="text-[10.5px] font-extrabold text-indigo-900">⚡ Pembayaran Campuran (Split Payment)</div>' +
        '<div class="v12-split-row">' +
          '<select id="v12-split-m1"><option value="tunai">💵 Tunai</option><option value="qris">📱 QRIS</option><option value="transfer">🏦 Transfer</option><option value="petty">🪙 Petty Cash</option></select>' +
          '<input type="text" id="v12-split-amt1" inputmode="numeric" placeholder="Nominal 1 (Rp)" class="font-mono">' +
        '</div>' +
        '<div class="v12-split-row">' +
          '<select id="v12-split-m2"><option value="qris">📱 QRIS</option><option value="transfer">🏦 Transfer</option><option value="tunai">💵 Tunai</option><option value="petty">🪙 Petty Cash</option></select>' +
          '<input type="text" id="v12-split-amt2" inputmode="numeric" placeholder="Nominal 2 / Sisa (Rp)" class="font-mono">' +
        '</div>' +
        '<div class="text-[10.5px] font-bold text-indigo-800" id="v12-split-status">Isi nominal pertama, sisa tagihan dihitung otomatis.</div>' +
      '</div>';

    rightCard.insertBefore(coBox, footerRow);

    // Bar petunjuk shortcut keyboard
    var kbdBar = document.createElement('div');
    kbdBar.className = 'v12-kbd-bar';
    kbdBar.id = 'v12-kbd-bar';
    kbdBar.innerHTML =
      '<div><span class="v12-kbd">F2</span>Scan <span class="v12-kbd">F3</span>Akun <span class="v12-kbd">F4</span>Uang Diterima <span class="v12-kbd">F6</span>Parkir <span class="v12-kbd">F8</span>Cetak Sah</div>' +
      '<span class="text-[10px] text-indigo-600 font-extrabold">Kasir v1.2</span>';
    rightCard.appendChild(kbdBar);

    attachInfoDot(document.getElementById('v12-lbl-disc'), 'Potongan / Diskon Struk', 'Ketik nominal rupiah (misal 5000) atau persen (misal 10%) untuk memberi potongan harga pada total belanja struk ini.');
    attachInfoDot(document.getElementById('v12-lbl-pm'), 'Metode Bayar & Split Payment', 'Pilih Tunai, QRIS, Transfer, Petty Cash, atau pilih Split (Campuran) bila pelanggan membayar sebagian Tunai dan sebagian QRIS/Transfer.');
    attachInfoDot(document.getElementById('v12-lbl-cash'), 'Hitung Kembalian Otomatis', 'Masukkan uang tunai yang diterima dari pelanggan atau klik tombol pecahan cepat (Uang Pas, 50.000, 100.000). Kembalian dihitung otomatis.');

    wireRightPanelEvents();
  }

  function switchRightTab(tab) {
    rightTab = tab || 'draft';
    [].forEach.call(document.querySelectorAll('#v12-rtabs [data-rtab]'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-rtab') === rightTab);
    });
    var dBox = document.getElementById('draft-items-container');
    var pBox = document.getElementById('v12-parked-container');
    var hBox = document.getElementById('v12-history-container');
    var coBox = document.getElementById('v12-checkout-box');
    var parkBtn = document.getElementById('v12-btn-park');

    if (dBox) dBox.classList.toggle('hidden', rightTab !== 'draft');
    if (pBox) pBox.classList.toggle('hidden', rightTab !== 'parked');
    if (hBox) hBox.classList.toggle('hidden', rightTab !== 'history');
    if (coBox) coBox.style.display = rightTab === 'draft' ? 'flex' : 'none';
    if (parkBtn) parkBtn.style.display = rightTab === 'draft' ? 'inline-flex' : 'none';

    if (rightTab === 'parked') renderParkedList();
    if (rightTab === 'history') renderTodayHistory();
  }

  /* ==================== 7. PERHITUNGAN TOTAL, DISKON STRUK, KEMBALIAN & SPLIT ==================== */
  function getRawDraftTotal() {
    if (typeof draftList === 'undefined' || !Array.isArray(draftList)) return 0;
    var tot = 0;
    draftList.forEach(function (d) {
      tot += (typeof sgnAmt === 'function') ? sgnAmt(d) : (d.amount || 0);
    });
    return tot;
  }

  function getBillDiscount(rawTotal) {
    var inp = document.getElementById('v12-bill-disc');
    if (!inp || rawTotal <= 0) return 0;
    var val = String(inp.value || '').trim();
    if (!val) return 0;
    var disc = 0;
    if (val.indexOf('%') >= 0) {
      var pct = Math.min(100, Math.max(0, parseFloat(val.replace(',', '.')) || 0));
      disc = Math.round(rawTotal * (pct / 100));
    } else {
      disc = parseNum(val);
    }
    return Math.max(0, Math.min(rawTotal, disc));
  }

  function getNetPayable() {
    var raw = getRawDraftTotal();
    var disc = getBillDiscount(raw);
    return { raw: raw, disc: disc, net: raw >= 0 ? (raw - disc) : raw };
  }

  function recalcCheckoutUI() {
    var t = getNetPayable();
    var totEl = document.getElementById('draft-total-amount');
    if (totEl) {
      if (t.disc > 0) {
        totEl.innerHTML = fmtRp(t.net) + ' <span class="text-xs text-emerald-600 font-bold">(Hemat ' + fmtRp(t.disc) + ')</span>';
      } else {
        totEl.textContent = (typeof fmSigned === 'function') ? fmSigned(t.net) : fmtRp(t.net);
      }
    }

    var target = Math.max(0, t.net);
    // Mode Tunai
    var cashInp = document.getElementById('v12-cash-received');
    var chCard = document.getElementById('v12-change-card');
    var chLbl = document.getElementById('v12-change-label');
    var chAmt = document.getElementById('v12-change-amount');
    if (cashInp && chCard && chLbl && chAmt) {
      var cashVal = parseNum(cashInp.value);
      if (!target || !cashInp.value.trim()) {
        chCard.className = 'v12-change-card neutral';
        chLbl.textContent = 'KEMBALIAN';
        chAmt.textContent = 'Rp 0';
      } else if (cashVal >= target) {
        chCard.className = 'v12-change-card';
        chLbl.textContent = 'KEMBALIAN';
        chAmt.textContent = fmtRp(cashVal - target);
      } else {
        chCard.className = 'v12-change-card under';
        chLbl.textContent = 'KURANG BAYAR';
        chAmt.textContent = fmtRp(target - cashVal);
      }
    }

    // Mode Split
    var s1Inp = document.getElementById('v12-split-amt1');
    var s2Inp = document.getElementById('v12-split-amt2');
    var sStat = document.getElementById('v12-split-status');
    if (payMode === 'split' && s1Inp && s2Inp && sStat) {
      var a1 = parseNum(s1Inp.value);
      var a2 = parseNum(s2Inp.value);
      var sum = a1 + a2;
      if (target <= 0) {
        sStat.textContent = 'Tambahkan item ke draft terlebih dahulu.';
        sStat.className = 'text-[10.5px] font-bold text-slate-500';
      } else if (sum === target) {
        sStat.textContent = '✓ Pas! Total Split = ' + fmtRp(target);
        sStat.className = 'text-[10.5px] font-extrabold text-emerald-700';
      } else if (sum > target) {
        sStat.textContent = '✓ Lunas · Kembalian: ' + fmtRp(sum - target);
        sStat.className = 'text-[10.5px] font-extrabold text-emerald-700';
      } else {
        sStat.textContent = '⚠️ Masih kurang: ' + fmtRp(target - sum);
        sStat.className = 'text-[10.5px] font-extrabold text-rose-600';
      }
    }
  }

  function setPayMode(pm) {
    payMode = pm || 'tunai';
    [].forEach.call(document.querySelectorAll('#v12-pm-pills [data-pm]'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-pm') === payMode);
    });
    var cashSec = document.getElementById('v12-cash-section');
    var splitSec = document.getElementById('v12-split-section');
    if (cashSec) cashSec.style.display = payMode === 'tunai' ? 'flex' : 'none';
    if (splitSec) splitSec.classList.toggle('show', payMode === 'split');

    var leftSel = document.getElementById('pay-method');
    if (leftSel && payMode !== 'split') {
      leftSel.value = payMode;
      if (typeof onPayMethodChange === 'function') onPayMethodChange();
    } else if (leftSel && payMode === 'split') {
      var m1 = (document.getElementById('v12-split-m1') || {}).value || 'tunai';
      leftSel.value = m1 === 'transfer' ? 'bank' : m1;
      if (typeof onPayMethodChange === 'function') onPayMethodChange();
    }
    if (payMode === 'split') {
      var t = Math.max(0, getNetPayable().net);
      var s1 = document.getElementById('v12-split-amt1');
      var s2 = document.getElementById('v12-split-amt2');
      if (s1 && s2 && t > 0 && !parseNum(s1.value) && !parseNum(s2.value)) {
        var half = Math.round(t / 2);
        s1.value = fmtNum(half);
        s2.value = fmtNum(t - half);
      }
    }
    recalcCheckoutUI();
  }

  function wireRightPanelEvents() {
    // Tab switch
    var rtabs = document.getElementById('v12-rtabs');
    if (rtabs) {
      rtabs.addEventListener('click', function (e) {
        var b = e.target.closest('[data-rtab]');
        if (!b) return;
        beepScan();
        switchRightTab(b.getAttribute('data-rtab'));
      });
    }

    // Tombol Parkirkan
    var parkBtn = document.getElementById('v12-btn-park');
    if (parkBtn) {
      parkBtn.onclick = function () { parkCurrentDraft(); };
    }

    // Metode bayar pills
    var pmPills = document.getElementById('v12-pm-pills');
    if (pmPills) {
      pmPills.addEventListener('click', function (e) {
        var b = e.target.closest('[data-pm]');
        if (!b) return;
        beepScan();
        setPayMode(b.getAttribute('data-pm'));
      });
    }

    // Sinkron jika dropdown kiri diubah
    var leftPm = document.getElementById('pay-method');
    if (leftPm) {
      leftPm.addEventListener('change', function () {
        if (payMode !== 'split') setPayMode(leftPm.value);
      });
    }

    // Diskon struk & Uang Diterima
    var discInp = document.getElementById('v12-bill-disc');
    if (discInp) discInp.addEventListener('input', recalcCheckoutUI);

    var cashInp = document.getElementById('v12-cash-received');
    if (cashInp) {
      cashInp.addEventListener('input', function () {
        if (typeof formatInputThousand === 'function') formatInputThousand(cashInp);
        recalcCheckoutUI();
      });
    }

    // Pecahan cepat uang diterima
    var presets = document.getElementById('v12-cash-presets');
    if (presets) {
      presets.addEventListener('click', function (e) {
        var b = e.target.closest('[data-cash]');
        if (!b || !cashInp) return;
        var mode = b.getAttribute('data-cash');
        var net = Math.max(0, getNetPayable().net);
        if (mode === 'exact') {
          cashInp.value = net > 0 ? fmtNum(net) : '';
        } else if (mode.charAt(0) === '+') {
          var add = parseInt(mode.slice(1), 10) || 0;
          cashInp.value = fmtNum(parseNum(cashInp.value) + add);
        } else {
          cashInp.value = fmtNum(parseInt(mode, 10) || 0);
        }
        beepScan();
        recalcCheckoutUI();
      });
    }

    // Split payment auto-fill sisa
    var s1 = document.getElementById('v12-split-amt1');
    var s2 = document.getElementById('v12-split-amt2');
    if (s1 && s2) {
      s1.addEventListener('input', function () {
        if (typeof formatInputThousand === 'function') formatInputThousand(s1);
        var net = Math.max(0, getNetPayable().net);
        var v1 = parseNum(s1.value);
        if (net > 0 && v1 <= net) {
          s2.value = fmtNum(net - v1);
        }
        recalcCheckoutUI();
      });
      s2.addEventListener('input', function () {
        if (typeof formatInputThousand === 'function') formatInputThousand(s2);
        recalcCheckoutUI();
      });
    }
  }

  /* ==================== 8. PARKIR / HOLD ANTREAN ==================== */
  function saveParked() {
    try { localStorage.setItem(PARK_KEY, JSON.stringify(parkedList)); } catch (e) {}
    updateTabCounters();
  }

  function parkCurrentDraft() {
    if (typeof draftList === 'undefined' || !draftList.length) {
      beepWarn();
      alert('Antrean draft masih kosong. Tambahkan item terlebih dahulu sebelum memarkir antrean.');
      return;
    }
    var custEl = document.getElementById('v12-cust-name');
    var discEl = document.getElementById('v12-bill-disc');
    var label = (custEl && custEl.value.trim()) || ('Pelanggan #' + (parkedList.length + 1));
    var total = getNetPayable().net;

    parkedList.unshift({
      id: 'park_' + Date.now(),
      label: label,
      disc: (discEl && discEl.value.trim()) || '',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      total: total,
      items: draftList.slice()
    });
    saveParked();

    draftList = [];
    localStorage.setItem('fm_kasir_drafts', JSON.stringify(draftList));
    if (custEl) custEl.value = '';
    if (discEl) discEl.value = '';
    var cashEl = document.getElementById('v12-cash-received');
    if (cashEl) cashEl.value = '';

    beepSuccess();
    if (typeof renderDraftList === 'function') renderDraftList();
    renderParkedList();
  }

  function restoreParkedCart(parkId) {
    var idx = parkedList.findIndex(function (p) { return p.id === parkId; });
    if (idx < 0) return;
    var cart = parkedList[idx];

    if (typeof draftList !== 'undefined' && draftList.length > 0) {
      if (!confirm('Draft saat ini berisi ' + draftList.length + ' item. Gabungkan dengan antrean parkir "' + cart.label + '"?')) return;
      draftList = draftList.concat(cart.items);
    } else {
      draftList = cart.items.slice();
    }

    parkedList.splice(idx, 1);
    saveParked();
    localStorage.setItem('fm_kasir_drafts', JSON.stringify(draftList));

    var custEl = document.getElementById('v12-cust-name');
    var discEl = document.getElementById('v12-bill-disc');
    if (custEl && cart.label) custEl.value = cart.label;
    if (discEl && cart.disc) discEl.value = cart.disc;

    beepScan();
    switchRightTab('draft');
    if (typeof renderDraftList === 'function') renderDraftList();
  }

  function deleteParkedCart(parkId) {
    parkedList = parkedList.filter(function (p) { return p.id !== parkId; });
    saveParked();
    renderParkedList();
  }

  function renderParkedList() {
    var box = document.getElementById('v12-parked-container');
    if (!box) return;
    updateTabCounters();
    if (!parkedList.length) {
      box.innerHTML = '<div class="p-6 text-center text-xs text-slate-500 bg-white/60 rounded-2xl border border-dashed border-slate-300">Belum ada antrean yang diparkir.<br><span class="text-[11px] text-slate-400">Klik tombol <b>⏸ Parkirkan</b> saat ada pembeli yang menunda transaksi.</span></div>';
      return;
    }
    box.innerHTML = parkedList.map(function (p) {
      var names = (p.items || []).map(function (i) { return i.accountName + ' ×' + (i.qty || 1); }).join(', ');
      return '<div class="flex items-center justify-between p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs gap-2">' +
        '<div class="min-w-0 flex-1">' +
          '<div class="font-black text-slate-900 flex items-center gap-1.5"><span>⏸ ' + esc(p.label) + '</span><span class="text-[10px] font-mono text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded">' + esc(p.time) + '</span></div>' +
          '<div class="text-[11px] text-slate-600 truncate">' + esc(names) + '</div>' +
        '</div>' +
        '<div class="flex items-center gap-1.5 shrink-0">' +
          '<span class="font-black font-mono text-slate-900 mr-1">' + fmtRp(p.total) + '</span>' +
          '<button type="button" data-park-restore="' + esc(p.id) + '" class="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px]">▶ Panggil</button>' +
          '<button type="button" data-park-del="' + esc(p.id) + '" class="p-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-black text-[11px]" title="Hapus">✕</button>' +
        '</div>' +
      '</div>';
    }).join('');

    [].forEach.call(box.querySelectorAll('[data-park-restore]'), function (b) {
      b.onclick = function () { restoreParkedCart(b.getAttribute('data-park-restore')); };
    });
    [].forEach.call(box.querySelectorAll('[data-park-del]'), function (b) {
      b.onclick = function () { deleteParkedCart(b.getAttribute('data-park-del')); };
    });
  }

  /* ==================== 9. RIWAYAT HARI INI & CETAK ULANG / WA ==================== */
  function getTodayTxList() {
    var all = (typeof myTx === 'function') ? myTx() : (typeof txList !== 'undefined' ? txList : []);
    var todayISO = (typeof localISO === 'function') ? localISO() : new Date().toISOString().slice(0, 10);
    var todayFull = new Date().toLocaleDateString('id-ID');
    return (all || []).filter(function (t) {
      return t && (t.dateISO === todayISO || t.dateFull === todayFull);
    });
  }

  function renderTodayHistory() {
    var box = document.getElementById('v12-history-container');
    if (!box) return;
    var list = getTodayTxList();
    updateTabCounters();
    if (!list.length) {
      box.innerHTML = '<div class="p-6 text-center text-xs text-slate-500 bg-white/60 rounded-2xl border border-dashed border-slate-300">Belum ada transaksi sah hari ini.</div>';
      return;
    }

    var PAYLBL = { tunai: 'Tunai', qris: 'QRIS', transfer: 'Transfer', petty: 'Petty Cash' };
    box.innerHTML = list.slice(0, 30).map(function (tx, i) {
      var isIn = (typeof fmKasMasuk === 'function') ? fmKasMasuk(tx.category) : (tx.category === 'sales');
      var payTag = tx.payDetail || PAYLBL[tx.pay] || tx.pay || 'Tunai';
      return '<div class="flex items-center justify-between p-2.5 rounded-2xl bg-white/90 border border-slate-200 text-xs gap-2">' +
        '<div class="min-w-0 flex-1">' +
          '<div class="font-black text-slate-900 truncate">' + (tx.isProduct ? '📦 ' : '') + esc(tx.accountName) + (tx.qty > 1 ? ' ×' + tx.qty : '') + '</div>' +
          '<div class="text-[10.5px] text-slate-500 flex items-center gap-1.5 flex-wrap">' +
            '<span class="font-mono">' + esc(tx.date || '') + '</span>·<span>' + esc(payTag) + '</span>' +
            (tx.customerName ? '·<span>👤 ' + esc(tx.customerName) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="flex items-center gap-1.5 shrink-0">' +
          '<span class="font-black font-mono ' + (isIn ? 'text-emerald-700' : 'text-rose-600') + '">' + (isIn ? '' : '-') + 'Rp ' + fmtNum(tx.amount) + '</span>' +
          '<button type="button" data-hist-print="' + i + '" class="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10.5px]" title="Cetak Ulang Struk">🖨 Struk</button>' +
          '<button type="button" data-hist-wa="' + i + '" class="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px]" title="Kirim Struk ke WhatsApp">💬 WA</button>' +
        '</div>' +
      '</div>';
    }).join('');

    [].forEach.call(box.querySelectorAll('[data-hist-print]'), function (b) {
      b.onclick = function () {
        var tx = list[Number(b.getAttribute('data-hist-print'))];
        if (tx) reopenReceiptForTx(tx, false);
      };
    });
    [].forEach.call(box.querySelectorAll('[data-hist-wa]'), function (b) {
      b.onclick = function () {
        var tx = list[Number(b.getAttribute('data-hist-wa'))];
        if (tx) reopenReceiptForTx(tx, true);
      };
    });
  }

  function reopenReceiptForTx(tx, directlyOpenWA) {
    var PAYLBL = { tunai: 'Tunai', qris: 'QRIS', transfer: 'Transfer', petty: 'Petty Cash' };
    var isIn = (typeof fmKasMasuk === 'function') ? fmKasMasuk(tx.category) : (tx.category === 'sales');
    var signed = isIn ? tx.amount : -tx.amount;
    var payText = tx.payDetail || (PAYLBL[tx.pay] || tx.pay || 'Tunai') + (tx.bankName ? ' (' + tx.bankName + ')' : '');
    var whenText = (tx.dateFull || '') + ' ' + (tx.date || '');
    var itemLine = tx.accountName + (tx.qty > 1 ? ' x' + tx.qty : '') + ' = ' + (isIn ? '' : '-') + 'Rp ' + fmtNum(tx.amount);

    document.getElementById('receipt-date').innerText = whenText + ' (Cetak Ulang)';
    document.getElementById('receipt-staff').innerText = tx.staff || (typeof user !== 'undefined' && user.title) || 'Admin';
    document.getElementById('receipt-total').innerText = fmtRp(signed);
    document.getElementById('receipt-pay').innerText = payText;

    var rList = document.getElementById('receipt-items-list');
    if (rList) {
      rList.innerHTML = '<div class="flex justify-between"><span>' + (tx.isProduct ? '📦 ' : '') + esc(tx.accountName) + (tx.qty > 1 ? ' x' + tx.qty : '') + '</span><span>' + (isIn ? '' : '-') + 'Rp ' + fmtNum(tx.amount) + '</span></div>';
    }
    updateReceiptExtraRows({
      customer: tx.customerName || '',
      disc: tx.billDiscount || 0,
      cashIn: tx.cashReceived || 0,
      change: tx.cashChange || 0
    });

    lastReceipt = {
      store: (document.getElementById('receipt-store-name') || {}).innerText || 'ONEILVERSE',
      when: whenText,
      total: signed,
      pay: payText,
      customer: tx.customerName || '',
      disc: tx.billDiscount || 0,
      cashIn: tx.cashReceived || 0,
      change: tx.cashChange || 0,
      items: [itemLine]
    };

    if (directlyOpenWA) {
      window.sendReceiptWA();
    } else {
      document.getElementById('modal-receipt').classList.remove('hidden');
    }
  }

  function updateReceiptExtraRows(meta) {
    var old = document.getElementById('v12-receipt-extra');
    if (old) old.remove();
    var payRow = document.getElementById('receipt-pay');
    if (!payRow || !payRow.parentElement || !payRow.parentElement.parentElement) return;
    var box = payRow.parentElement.parentElement;

    var extra = document.createElement('div');
    extra.id = 'v12-receipt-extra';
    extra.className = 'space-y-1 text-[10px] text-slate-600 font-normal';
    var html = '';
    if (meta.customer) {
      html += '<div class="flex justify-between"><span>Pelanggan:</span><span class="font-bold text-slate-800">' + esc(meta.customer) + '</span></div>';
    }
    if (meta.disc > 0) {
      html += '<div class="flex justify-between text-emerald-700 font-bold"><span>Potongan Struk:</span><span>-Rp ' + fmtNum(meta.disc) + '</span></div>';
    }
    if (meta.cashIn > 0) {
      html += '<div class="flex justify-between"><span>Uang Diterima:</span><span class="font-bold">Rp ' + fmtNum(meta.cashIn) + '</span></div>';
      html += '<div class="flex justify-between text-emerald-700 font-black"><span>Kembalian:</span><span>Rp ' + fmtNum(meta.change) + '</span></div>';
    }
    extra.innerHTML = html;
    box.appendChild(extra);
  }

  function updateTabCounters() {
    var dBadge = document.getElementById('draft-count-badge');
    if (dBadge && typeof draftList !== 'undefined') dBadge.textContent = String(draftList.length);
    var pBadge = document.getElementById('v12-park-count');
    if (pBadge) pBadge.textContent = String(parkedList.length);
    var hBadge = document.getElementById('v12-hist-count');
    if (hBadge) hBadge.textContent = String(getTodayTxList().length);
  }

  /* ==================== 10. HOOK & UPGRADE FUNGSI INTI KASIR ==================== */
  function changeDraftItemQty(idx, delta) {
    if (typeof draftList === 'undefined' || !draftList[idx]) return;
    var d = draftList[idx];
    var newQty = (d.qty || 1) + delta;
    if (newQty < 1) {
      if (typeof removeDraftItem === 'function') removeDraftItem(idx);
      return;
    }
    if (d.isProduct) {
      var per = d.per || 1;
      var avail = (typeof availableStock === 'function') ? Math.floor(availableStock(d.accountCode, d.id) / per) : 999999;
      if (newQty > avail) {
        beepWarn();
        alert('Stok "' + d.accountName + '" tidak cukup (tersedia ' + avail + ').');
        return;
      }
      var p = (typeof STORE !== 'undefined' && STORE.getProducts) ? STORE.getProducts().find(function (x) { return x.code === d.accountCode; }) : null;
      var un = { name: d.unitName || 'pcs', per: per, price: d.unitPrice || 0 };
      var dc = (p && typeof fmDisc === 'function') ? fmDisc(p, un, newQty, d.discManual || '') : { net: (d.unitPrice || 0) * newQty, disc: 0, name: '' };
      d.qty = newQty;
      d.amount = dc.net;
      d.dpp = dc.net;
      d.discount = dc.disc;
      d.promo = dc.name;
      d.desc = 'Penjualan ' + d.accountName + (per > 1 ? ' (' + d.unitName + ')' : '') + ' x' + newQty;
    } else {
      var unitP = d.unitPrice || Math.round((d.amount || 0) / Math.max(1, d.qty || 1));
      d.unitPrice = unitP;
      d.qty = newQty;
      d.amount = unitP * newQty;
      var isOut = (d.category === 'cogs' || d.category === 'expense');
      d.tax12 = isOut ? Math.round(d.amount * 0.12) : 0;
      d.dpp = isOut ? (d.amount - d.tax12) : d.amount;
    }
    localStorage.setItem('fm_kasir_drafts', JSON.stringify(draftList));
    beepScan();
    if (typeof renderDraftList === 'function') renderDraftList();
  }

  function hookCoreFunctions() {
    // 10A. Hook renderDraftList agar tombol +/- qty muncul di setiap baris draft & total terhitung dengan diskon struk
    var origRenderDraft = window.renderDraftList;
    if (typeof origRenderDraft === 'function' && !origRenderDraft.__v12) {
      var wrappedRenderDraft = function () {
        var r = origRenderDraft.apply(this, arguments);
        try {
          var container = document.getElementById('draft-items-container');
          if (container && typeof draftList !== 'undefined' && draftList.length > 0) {
            var rows = container.children;
            for (var i = 0; i < rows.length; i++) {
              var rightBox = rows[i].lastElementChild;
              if (rightBox && !rightBox.querySelector('.v12-dqty') && draftList[i]) {
                var qCtrl = document.createElement('div');
                qCtrl.className = 'v12-dqty';
                qCtrl.innerHTML = '<button type="button" data-dq-idx="' + i + '" data-dq-d="-1" title="Kurangi jumlah">−</button>' +
                  '<span>' + (draftList[i].qty || 1) + '</span>' +
                  '<button type="button" data-dq-idx="' + i + '" data-dq-d="1" title="Tambah jumlah">+</button>';
                rightBox.insertBefore(qCtrl, rightBox.firstElementChild);
              }
            }
            [].forEach.call(container.querySelectorAll('[data-dq-idx]'), function (btn) {
              btn.onclick = function (ev) {
                ev.stopPropagation();
                changeDraftItemQty(Number(btn.getAttribute('data-dq-idx')), Number(btn.getAttribute('data-dq-d')));
              };
            });
          }
          updateTabCounters();
          recalcCheckoutUI();
          updateStockAlertBanner();
        } catch (e) {}
        return r;
      };
      wrappedRenderDraft.__v12 = true;
      window.renderDraftList = wrappedRenderDraft;
    }

    // 10B. Hook updateCategoryBadge & applyQtyToForm untuk stok real-time
    ['updateCategoryBadge', 'applyQtyToForm'].forEach(function (fnName) {
      var orig = window[fnName];
      if (typeof orig === 'function' && !orig.__v12) {
        var w = function () {
          var res = orig.apply(this, arguments);
          try { updateStockAlertBanner(); } catch (e) {}
          return res;
        };
        w.__v12 = true;
        window[fnName] = w;
      }
    });

    // 10C. Hook addSaleToDraft & saveToDraftKasir untuk efek suara bip
    ['addSaleToDraft', 'saveToDraftKasir'].forEach(function (fnName) {
      var orig = window[fnName];
      if (typeof orig === 'function' && !orig.__v12) {
        var w = function () {
          var beforeLen = (typeof draftList !== 'undefined') ? draftList.length : 0;
          var res = orig.apply(this, arguments);
          var afterLen = (typeof draftList !== 'undefined') ? draftList.length : 0;
          if (res === true || afterLen >= beforeLen) beepScan();
          return res;
        };
        w.__v12 = true;
        window[fnName] = w;
      }
    });

    // 10D. Hook renderAllReports agar Riwayat Hari Ini & Chip Favorit ikut terbarui
    var origRenderAll = window.renderAllReports;
    if (typeof origRenderAll === 'function' && !origRenderAll.__v12) {
      var wAll = function () {
        var res = origRenderAll.apply(this, arguments);
        try {
          updateTabCounters();
          renderFavoriteChips();
          if (rightTab === 'history') renderTodayHistory();
        } catch (e) {}
        return res;
      };
      wAll.__v12 = true;
      window.renderAllReports = wAll;
    }

    // 10E. Upgrade sendReceiptWA agar mendukung rincian pelanggan, diskon, kembalian, split payment, dan langsung jalan di v1.2
    window.sendReceiptWA = function () {
      if (!lastReceipt) return alert('Belum ada struk transaksi untuk dikirim.');
      var lines = [
        '*' + (lastReceipt.store || 'ONEILVERSE') + '*',
        lastReceipt.when || '',
        lastReceipt.customer ? ('Pelanggan: ' + lastReceipt.customer) : '',
        '------------------',
        (lastReceipt.items || []).join('\n'),
        '------------------'
      ].filter(Boolean);
      if (lastReceipt.disc > 0) lines.push('Potongan: -Rp ' + fmtNum(lastReceipt.disc));
      lines.push('*TOTAL: ' + fmtRp(lastReceipt.total) + '*');
      lines.push('Bayar: ' + (lastReceipt.pay || 'Tunai'));
      if (lastReceipt.cashIn > 0) {
        lines.push('Tunai Diterima: Rp ' + fmtNum(lastReceipt.cashIn));
        lines.push('Kembalian: Rp ' + fmtNum(lastReceipt.change || 0));
      }
      lines.push('Terima kasih!');
      var txt = lines.join('\n');

      var saved = '';
      try { saved = localStorage.getItem('fm_wa_last') || ''; } catch (e) {}
      var old = document.getElementById('fm-wa-box');
      if (old) old.remove();
      var ov = document.createElement('div');
      ov.id = 'fm-wa-box';
      ov.style.cssText = 'position:fixed;inset:0;z-index:2147483200;background:rgba(2,6,23,.55);display:flex;align-items:center;justify-content:center;padding:18px;font-family:system-ui,sans-serif';
      ov.innerHTML = '<div style="width:100%;max-width:360px;background:#fff;color:#0f172a;border-radius:20px;padding:18px;box-shadow:0 20px 50px rgba(0,0,0,.35)">' +
        '<b style="font-size:15px">💬 Kirim Struk Digital WhatsApp</b>' +
        '<p style="font-size:12px;color:#64748b;margin:6px 0 10px">Masukkan nomor WA pelanggan (contoh 08123456789). Kosongkan bila ingin memilih kontak langsung di WhatsApp.</p>' +
        '<input id="fm-wa-num" type="tel" inputmode="numeric" placeholder="08..." value="' + esc(saved.replace(/[^0-9]/g, '')) + '" style="width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:12px;padding:11px 12px;font-size:14px;outline:none">' +
        '<div style="display:flex;gap:8px;margin-top:12px"><button id="fm-wa-cancel" style="flex:1;border:0;border-radius:12px;padding:11px;background:#e2e8f0;color:#334155;font-weight:700;cursor:pointer">Batal</button>' +
        '<button id="fm-wa-go" style="flex:2;border:0;border-radius:12px;padding:11px;background:#16a34a;color:#fff;font-weight:800;cursor:pointer">Kirim WhatsApp</button></div></div>';
      document.body.appendChild(ov);
      var inp = document.getElementById('fm-wa-num');
      inp.focus();
      var tutup = function () { ov.remove(); };
      document.getElementById('fm-wa-cancel').onclick = tutup;
      ov.addEventListener('click', function (e) { if (e.target === ov) tutup(); });
      var kirim = function () {
        var phone = (inp.value || '').replace(/[^0-9]/g, '');
        if (phone.indexOf('0') === 0) phone = '62' + phone.slice(1);
        else if (phone.indexOf('8') === 0) phone = '62' + phone;
        try { localStorage.setItem('fm_wa_last', phone); } catch (e) {}
        var url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(txt);
        var a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener';
        document.body.appendChild(a); a.click(); a.remove();
        tutup();
      };
      document.getElementById('fm-wa-go').onclick = kirim;
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') kirim(); });
    };

    // 10F. Upgrade finalizeAndPrint untuk validasi Uang Diterima/Split, Diskon Struk, Nama Pelanggan, dan Kembalian
    var origFinalize = window.finalizeAndPrint;
    if (typeof origFinalize === 'function' && !origFinalize.__v12) {
      window.finalizeAndPrint = async function () {
        if (typeof draftList === 'undefined' || draftList.length === 0) {
          beepWarn();
          return alert('Antrean draft kosong! Input transaksi terlebih dahulu.');
        }

        var totals = getNetPayable();
        var target = Math.max(0, totals.net);
        var custName = ((document.getElementById('v12-cust-name') || {}).value || '').trim();
        var cashIn = 0;
        var change = 0;
        var splitInfo = '';
        var PAYLBL = { tunai: 'Tunai', qris: 'QRIS', transfer: 'Transfer', bank: 'Transfer', petty: 'Petty Cash' };

        if (payMode === 'tunai' && target > 0) {
          var rawCash = ((document.getElementById('v12-cash-received') || {}).value || '').trim();
          if (rawCash) {
            cashIn = parseNum(rawCash);
            if (cashIn < target) {
              beepWarn();
              return alert('Uang diterima (' + fmtRp(cashIn) + ') kurang dari total tagihan (' + fmtRp(target) + ')!');
            }
            change = cashIn - target;
          }
        } else if (payMode === 'split' && target > 0) {
          var m1 = (document.getElementById('v12-split-m1') || {}).value || 'tunai';
          var m2 = (document.getElementById('v12-split-m2') || {}).value || 'qris';
          var a1 = parseNum((document.getElementById('v12-split-amt1') || {}).value);
          var a2 = parseNum((document.getElementById('v12-split-amt2') || {}).value);
          if (a1 + a2 < target) {
            beepWarn();
            return alert('Total Split Payment (' + fmtRp(a1 + a2) + ') masih kurang dari total tagihan (' + fmtRp(target) + ')!');
          }
          cashIn = a1 + a2;
          change = Math.max(0, (a1 + a2) - target);
          splitInfo = 'Split: ' + (PAYLBL[m1] || m1) + ' ' + fmtRp(a1) + ' + ' + (PAYLBL[m2] || m2) + ' ' + fmtRp(a2);
        }

        // Jika ada diskon struk, terapkan ke item penjualan pertama di draft agar pembukuan & struk konsisten
        if (totals.disc > 0 && draftList.length > 0) {
          var remainingDisc = totals.disc;
          draftList.forEach(function (d) {
            if (remainingDisc <= 0) return;
            var isIn = (typeof fmKasMasuk === 'function') ? fmKasMasuk(d.category) : (d.category === 'sales');
            if (isIn && d.amount > 0) {
              var cut = Math.min(d.amount, remainingDisc);
              d.amount -= cut;
              d.dpp = d.amount;
              d.discount = (d.discount || 0) + cut;
              remainingDisc -= cut;
            }
          });
        }

        // Tambahkan info pelanggan/split ke deskripsi draft bila diisi
        if (custName || splitInfo) {
          draftList.forEach(function (d) {
            var extraTag = [custName ? ('Pelanggan: ' + custName) : '', splitInfo].filter(Boolean).join(' · ');
            if (extraTag && String(d.desc || '').indexOf(extraTag) < 0) {
              d.desc = (d.desc ? d.desc + ' (' + extraTag + ')' : extraTag);
            }
          });
        }

        var prevCount = (typeof txList !== 'undefined') ? txList.length : 0;
        await origFinalize.apply(this, arguments);
        var nowCount = (typeof txList !== 'undefined') ? txList.length : 0;

        // Jika transaksi berhasil disahkan (draftList sudah dikosongkan)
        if (typeof draftList !== 'undefined' && draftList.length === 0 && nowCount >= prevCount) {
          beepSuccess();
          var addedCount = Math.max(1, nowCount - prevCount);
          for (var i = 0; i < addedCount && i < txList.length; i++) {
            if (custName) txList[i].customerName = custName;
            if (totals.disc > 0) txList[i].billDiscount = totals.disc;
            if (cashIn > 0) { txList[i].cashReceived = cashIn; txList[i].cashChange = change; }
            if (splitInfo) txList[i].payDetail = splitInfo;
          }
          if (typeof persistData === 'function') persistData();

          if (splitInfo) {
            var rPay = document.getElementById('receipt-pay');
            if (rPay) rPay.innerText = splitInfo;
          }
          updateReceiptExtraRows({
            customer: custName,
            disc: totals.disc,
            cashIn: cashIn,
            change: change
          });
          if (lastReceipt) {
            lastReceipt.customer = custName;
            lastReceipt.disc = totals.disc;
            lastReceipt.cashIn = cashIn;
            lastReceipt.change = change;
            if (splitInfo) lastReceipt.pay = splitInfo;
          }

          // Bersihkan input checkout v1.2
          ['v12-cust-name', 'v12-bill-disc', 'v12-cash-received', 'v12-split-amt1', 'v12-split-amt2'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
          });
          recalcCheckoutUI();
          updateTabCounters();
        }
      };
      window.finalizeAndPrint.__v12 = true;
    }
  }

  /* ==================== 11. SHORTCUT KEYBOARD KASIR ==================== */
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'F2') {
        e.preventDefault();
        var bc = document.getElementById('barcode-input');
        var acc = document.getElementById('tx-account');
        if (bc && !document.getElementById('barcode-block').classList.contains('hidden')) bc.focus();
        else if (acc) acc.focus();
        beepScan();
        return;
      }
      if (e.key === 'F3') {
        e.preventDefault();
        var acc2 = document.getElementById('tx-account');
        if (acc2) acc2.focus();
        beepScan();
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        var cash = document.getElementById('v12-cash-received');
        var amt = document.getElementById('tx-amount');
        if (typeof draftList !== 'undefined' && draftList.length > 0 && cash && payMode === 'tunai') {
          switchRightTab('draft');
          cash.focus();
        } else if (amt) {
          amt.focus();
        }
        beepScan();
        return;
      }
      if (e.key === 'F6') {
        e.preventDefault();
        if (typeof draftList !== 'undefined' && draftList.length > 0) parkCurrentDraft();
        else switchRightTab(rightTab === 'parked' ? 'draft' : 'parked');
        return;
      }
      if (e.key === 'F8' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        if (typeof window.finalizeAndPrint === 'function') window.finalizeAndPrint();
      }
    });
  }

  /* ==================== BOOTSTRAP v1.2 ==================== */
  function boot() {
    injectCSS();
    initHeaderIndicators();
    clarifyBalanceLabels();
    initLeftFormEnhancements();
    initRightPanelEnhancements();
    hookCoreFunctions();
    initKeyboardShortcuts();
    initGuideSystem();

    // Pasang titik info tambahan pada elemen form utama
    var bcLbl = document.querySelector('#barcode-block label');
    if (bcLbl) attachInfoDot(bcLbl, 'Scan Barcode Produk (F2)', 'Arahkan scanner laser/USB atau ketik kode/nama barang lalu tekan Enter. Barang otomatis masuk ke antrean draft.');
    var accLbl = document.querySelector('label[for="tx-account"]') || (document.getElementById('tx-account') && document.getElementById('tx-account').previousElementSibling && document.getElementById('tx-account').previousElementSibling.querySelector('label'));
    if (accLbl) attachInfoDot(accLbl, 'Pilih Akun Mutasi / Produk (F3)', 'Pilih produk toko (stok berkurang otomatis) atau akun pembukuan COA (penjualan, biaya operasional, HPP, prive, aset, hutang, modal).');

    if (typeof window.renderDraftList === 'function') window.renderDraftList();
    updateTabCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 50); });
  } else {
    setTimeout(boot, 50);
  }
})();
