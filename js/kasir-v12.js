/* kasir-v12.js — Modul Peningkatan Terminal Kasir v1.2 (Rapi & Pas 1 Layar)
   Prinsip Desain:
   - Menjaga 100% proporsi grid 1-layar asli kasir.html (form kiri 2 kolom simetris, kartu draft kanan lega tanpa terpotong).
   - Kalkulator Uang Diterima, Kembalian, Pecahan Cepat, Diskon Struk, Nama Pelanggan, dan Split Payment
     tampil di dalam Modal Konfirmasi Pembayaran yang lega saat tombol "Konfirmasi & Cetak Struk Sah" ditekan.
   - Sakelar Mode Panduan (i) berada di dalam menu tombol (?) di pojok kanan bawah sehingga tidak menimpa dock bawah.
*/
(function () {
  'use strict';

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
      gain.gain.setValueAtTime(vol || 0.07, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (dur || 0.07));
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + (dur || 0.07));
    } catch (e) {}
  }

  function beepScan() { playTone(1150, 0.06, 'sine', 0.07); }
  function beepWarn() { playTone(320, 0.16, 'sawtooth', 0.09); }
  function beepSuccess() {
    playTone(880, 0.06, 'sine', 0.07);
    setTimeout(function () { playTone(1320, 0.1, 'sine', 0.08); }, 75);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtRp(n) {
    var v = Math.round(Number(n) || 0);
    return (v < 0 ? '-Rp ' : 'Rp ') + new Intl.NumberFormat('id-ID').format(Math.abs(v));
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

  /* ==================== 1. CSS BERSIH & PAS 1 LAYAR ==================== */
  var CSS = [
    /* Header pills */
    '.v12-sync{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:700;border:1px solid rgba(255,255,255,.18);background:rgba(15,23,42,.35);color:#e2e8f0}',
    '.v12-sync .dot{width:6px;height:6px;border-radius:50%;background:#10b981}',
    '.v12-sync.off .dot{background:#f59e0b}',
    '.v12-beep-btn{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:700;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;cursor:pointer}',
    '.v12-beep-btn.muted{opacity:.55}',

    /* Inline mini-pills di label Form Kiri (TIDAK menambah tinggi baris form) */
    '.v12-inline-pills{display:inline-flex;align-items:center;gap:3px;flex-wrap:wrap}',
    '.v12-mini-pill{all:unset;cursor:pointer;padding:1.5px 7px;border-radius:999px;font-size:10px;font-weight:800;background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;transition:all .12s;white-space:nowrap}',
    '.v12-mini-pill:hover{background:#4f46e5;color:#fff;border-color:#4f46e5}',
    '.v12-stk-pill{display:none;padding:1.5px 7px;border-radius:999px;font-size:10px;font-weight:800;white-space:nowrap}',
    '.v12-stk-pill.show{display:inline-block}',
    '.v12-stk-pill.ok{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0}',
    '.v12-stk-pill.warn{background:#fffbeb;color:#b45309;border:1px solid #fcd34d}',
    '.v12-stk-pill.err{background:#fef2f2;color:#b91c1c;border:1px solid #fca5a5}',

    /* Popover Favorit (mengambang, tidak merusak grid 2 kolom) */
    '#v12-fav-pop{position:fixed;z-index:2147483100;width:min(340px,92vw);background:#ffffff;border:1px solid #cbd5e1;border-radius:16px;padding:10px 12px;box-shadow:0 18px 40px -10px rgba(15,23,42,.28);display:none;flex-direction:column;gap:7px;color:#0f172a}',
    '#v12-fav-pop.open{display:flex}',
    '.v12-fav-grid{display:flex;flex-wrap:wrap;gap:5px}',
    '.v12-fchip{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:10px;font-size:11px;font-weight:700;background:#f8fafc;border:1px solid #e2e8f0;color:#1e293b;transition:all .12s}',
    '.v12-fchip:hover{background:#eef2ff;border-color:#818cf8;color:#312e81}',
    '.v12-fchip.prod{background:#ecfdf5;border-color:#a7f3d0;color:#065f46}',
    '.v12-fchip.low{background:#fffbeb;border-color:#fcd34d;color:#92400e}',
    '.v12-fchip.out{background:#fef2f2;border-color:#fca5a5;color:#991b1b;opacity:.6}',
    '.v12-fchip small{font-size:9.5px;opacity:.75;font-weight:800}',

    /* Tab Panel Kanan — Rapi, Segmented, Tanpa Emoji Berlebihan */
    '.v12-rtabs{display:inline-flex;align-items:center;gap:2px;background:#f1f5f9;padding:2.5px;border-radius:11px;border:1px solid #e2e8f0}',
    '.v12-rtab{all:unset;cursor:pointer;padding:4px 10px;border-radius:8.5px;font-size:11px;font-weight:800;color:#64748b;display:inline-flex;align-items:center;gap:5px;transition:all .15s;white-space:nowrap}',
    '.v12-rtab:hover{color:#0f172a}',
    '.v12-rtab.on{background:#ffffff;color:#0f172a;box-shadow:0 1px 3px rgba(15,23,42,.1)}',
    '.v12-rtab .cnt{padding:0.5px 5.5px;border-radius:999px;font-size:9.5px;font-weight:800;background:#e2e8f0;color:#475569}',
    '.v12-rtab.on .cnt{background:#4f46e5;color:#ffffff}',
    '.v12-park-act{all:unset;cursor:pointer;padding:4px 10px;border-radius:999px;font-size:10.5px;font-weight:800;background:#f8fafc;border:1px solid #cbd5e1;color:#334155;transition:all .12s;white-space:nowrap}',
    '.v12-park-act:hover{background:#eef2ff;border-color:#818cf8;color:#312e81}',

    /* Container Parkir & Riwayat mengikuti flex:1 seperti #draft-items-container */
    'html[data-fm-page="kasir"] #v12-parked-container,html[data-fm-page="kasir"] #v12-history-container{flex:1 1 0;max-height:none!important;min-height:0;overflow:auto}',

    /* Kontrol Qty Inline di baris Draft */
    '.v12-dqty{display:inline-flex;align-items:center;gap:2px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:1px 3px;margin-right:4px}',
    '.v12-dqty button{all:unset;cursor:pointer;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:#334155;border-radius:5px}',
    '.v12-dqty button:hover{background:#e2e8f0;color:#0f172a}',
    '.v12-dqty span{font-size:10.5px;font-weight:800;padding:0 4px;font-family:"JetBrains Mono",monospace;color:#0f172a}',

    /* Modal Konfirmasi Pembayaran & Kembalian (Muncul saat klik Konfirmasi & Cetak Struk Sah) */
    '#v12-pay-modal{position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.55);backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;padding:16px}',
    '#v12-pay-modal.open{display:flex}',
    '.v12-pay-card{width:100%;max-width:460px;background:#ffffff;color:#0f172a;border-radius:24px;padding:20px 22px;box-shadow:0 25px 60px -15px rgba(15,23,42,.35);display:flex;flex-direction:column;gap:14px;max-height:92vh;overflow-y:auto}',
    '.v12-pay-top{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:10px}',
    '.v12-pay-totbox{background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:12px 14px;display:flex;align-items:baseline;justify-content:space-between}',
    '.v12-pay-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
    '.v12-pay-card label{display:block;font-size:10.5px;font-weight:800;color:#475569;margin-bottom:3px}',
    '.v12-pay-card input,.v12-pay-card select{width:100%;box-sizing:border-box;border-radius:12px;border:1px solid #cbd5e1;background:#f8fafc;padding:8px 11px;font-size:12.5px;font-weight:700;color:#0f172a;outline:none}',
    '.v12-pay-card input:focus,.v12-pay-card select:focus{background:#ffffff;border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.14)}',
    '.v12-pm-tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}',
    '.v12-pm-tab{all:unset;cursor:pointer;text-align:center;padding:7px 4px;border-radius:10px;font-size:11px;font-weight:800;background:#f1f5f9;border:1px solid #cbd5e1;color:#475569;transition:all .12s}',
    '.v12-pm-tab:hover{background:#e2e8f0;color:#0f172a}',
    '.v12-pm-tab.on{background:#4f46e5;border-color:#4f46e5;color:#ffffff}',
    '.v12-change-box{border-radius:14px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46}',
    '.v12-change-box.under{background:#fef2f2;border-color:#fca5a5;color:#991b1b}',
    '.v12-change-box.neutral{background:#f1f5f9;border-color:#cbd5e1;color:#475569}',
    '.v12-presets{display:flex;flex-wrap:wrap;gap:5px}',
    '.v12-preset-btn{all:unset;cursor:pointer;padding:4px 10px;border-radius:8px;font-size:11px;font-weight:800;background:#f1f5f9;border:1px solid #cbd5e1;color:#334155;font-family:"JetBrains Mono",monospace}',
    '.v12-preset-btn:hover{background:#eef2ff;border-color:#818cf8;color:#312e81}',

    /* Mode Panduan (i) — hanya tampil bila dinyalakan dari menu (?) */
    '.v12-info-dot{display:none;width:15px;height:15px;border-radius:50%;background:#e0e7ff;border:1px solid #818cf8;color:#3730a3;font:900 9.5px/1 "Plus Jakarta Sans",sans-serif;align-items:center;justify-content:center;cursor:pointer;margin-left:5px;vertical-align:middle;padding:0;flex:none}',
    '.v12-info-dot:hover{background:#4f46e5;color:#ffffff}',
    'html[data-v12-guide="1"] .v12-info-dot{display:inline-flex}',
    '#v12-tip-pop{position:fixed;z-index:2147483500;max-width:280px;background:#0f172a;color:#f8fafc;border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:10px 12px;font:600 11.5px/1.45 "Plus Jakarta Sans",system-ui,sans-serif;box-shadow:0 16px 38px rgba(2,6,23,.45);display:none}',
    '#v12-tip-pop.open{display:block}',
    '#v12-tip-pop b{display:block;font-size:12px;font-weight:800;color:#38bdf8;margin-bottom:3px}',

    /* Dark mode compatibility */
    'html[data-fm-native="dark"] .v12-rtabs,html[data-fm-black="1"] .v12-rtabs{background:rgba(15,23,42,.7)!important;border-color:rgba(255,255,255,.12)!important}',
    'html[data-fm-native="dark"] .v12-rtab:not(.on),html[data-fm-black="1"] .v12-rtab:not(.on){color:#94a3b8!important}',
    'html[data-fm-native="dark"] .v12-rtab.on,html[data-fm-black="1"] .v12-rtab.on{background:rgba(30,41,59,.95)!important;color:#f8fafc!important}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('fm-kasir-v12-css')) return;
    var st = document.createElement('style');
    st.id = 'fm-kasir-v12-css';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  /* ==================== 2. MODE PANDUAN (DI DALAM TOMBOL ?) ==================== */
  var tipEl = null;
  function applyGuideState() {
    if (guideOn) document.documentElement.setAttribute('data-v12-guide', '1');
    else document.documentElement.removeAttribute('data-v12-guide');
    var hBtn = document.getElementById('v12-help-guide-toggle');
    if (hBtn) {
      hBtn.textContent = guideOn ? 'Aktif (Klik untuk Matikan)' : 'Mati (Klik untuk Aktifkan)';
      hBtn.style.background = guideOn ? '#4f46e5' : '#334155';
    }
    if (!guideOn && tipEl) tipEl.classList.remove('open');
  }

  function toggleGuide(force) {
    guideOn = typeof force === 'boolean' ? force : !guideOn;
    try { localStorage.setItem(GUIDE_KEY, guideOn ? '1' : '0'); } catch (e) {}
    applyGuideState();
    beepScan();
  }

  function attachInfoDot(targetEl, title, desc) {
    if (!targetEl || targetEl.querySelector('.v12-info-dot')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'v12-info-dot';
    b.setAttribute('data-v12-title', title);
    b.setAttribute('data-v12-desc', desc);
    b.textContent = 'i';
    targetEl.appendChild(b);
  }

  function initGuideSystem() {
    applyGuideState();
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
        var ti = dot.getAttribute('data-v12-title') || 'Penjelasan Fungsi';
        var de = dot.getAttribute('data-v12-desc') || '';
        tipEl.innerHTML = '<b>ⓘ ' + esc(ti) + '</b><div>' + esc(de) + '</div>';
        tipEl.classList.add('open');
        var r = dot.getBoundingClientRect();
        tipEl.style.top = Math.min(window.innerHeight - 110, Math.max(12, r.bottom + 8)) + 'px';
        tipEl.style.left = Math.min(window.innerWidth - 295, Math.max(12, r.left - 20)) + 'px';
        return;
      }
      if (tipEl && !e.target.closest('#v12-tip-pop')) {
        tipEl.classList.remove('open');
      }
    }, true);

    // Saat tombol ? (#fm-help-fab) diklik, sisipkan sakelar Mode Panduan di bagian atas modal bantuan
    document.addEventListener('click', function (e) {
      if (e.target.closest('#fm-help-fab') || e.target.closest('#fm-help')) {
        setTimeout(injectGuideSwitchIntoHelpModal, 50);
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
    bar.innerHTML = '<div><b>Mode Panduan Layar (ⓘ)</b><div style="font-size:11px;font-weight:500;color:#4338ca">Tampilkan ikon ⓘ di setiap fungsi kasir untuk membaca penjelasan singkat.</div></div>' +
      '<button type="button" id="v12-help-guide-toggle" style="border:0;border-radius:10px;padding:7px 12px;color:#fff;font-weight:800;font-size:11.5px;cursor:pointer;white-space:nowrap"></button>';
    card.insertBefore(bar, card.children[1] || null);
    document.getElementById('v12-help-guide-toggle').onclick = function () { toggleGuide(); };
    applyGuideState();
  }

  /* ==================== 3. HEADER: STATUS SYNC & BIP SCANNER ==================== */
  function initHeaderIndicators() {
    var clockEl = document.getElementById('realtime-clock-display');
    var capsule = clockEl ? clockEl.parentElement : null;
    if (capsule && !document.getElementById('v12-sync-pill')) {
      var syncEl = document.createElement('span');
      syncEl.id = 'v12-sync-pill';
      syncEl.className = 'v12-sync';
      syncEl.title = 'Status sinkronisasi data dengan server';
      syncEl.innerHTML = '<span class="dot"></span><span id="v12-sync-text">Tersinkron</span>';
      capsule.parentNode.insertBefore(syncEl, capsule.nextSibling);

      var sndBtn = document.createElement('button');
      sndBtn.type = 'button';
      sndBtn.id = 'v12-sound-btn';
      sndBtn.className = 'v12-beep-btn' + (beepOn ? '' : ' muted');
      sndBtn.title = 'Suara bip scanner kasir';
      sndBtn.textContent = beepOn ? 'Bip: Aktif' : 'Bip: Mati';
      sndBtn.onclick = function () {
        beepOn = !beepOn;
        try { localStorage.setItem(BEEP_KEY, beepOn ? '1' : '0'); } catch (e) {}
        sndBtn.className = 'v12-beep-btn' + (beepOn ? '' : ' muted');
        sndBtn.textContent = beepOn ? 'Bip: Aktif' : 'Bip: Mati';
        if (beepOn) beepScan();
      };
      capsule.parentNode.insertBefore(sndBtn, syncEl.nextSibling);
    }

    function updateSyncStatus() {
      var pill = document.getElementById('v12-sync-pill');
      var txt = document.getElementById('v12-sync-text');
      if (!pill || !txt) return;
      var online = navigator.onLine !== false;
      var hasFirestore = typeof db !== 'undefined' && !!db;
      if (online && hasFirestore) {
        pill.classList.remove('off');
        txt.textContent = 'Tersinkron';
      } else {
        pill.classList.add('off');
        txt.textContent = online ? 'Lokal' : 'Offline';
      }
    }
    window.addEventListener('online', updateSyncStatus);
    window.addEventListener('offline', updateSyncStatus);
    setInterval(updateSyncStatus, 5000);
    updateSyncStatus();
  }

  /* ==================== 4. LABEL SALDO YANG JELAS ==================== */
  function clarifyBalanceLabels() {
    var saldoCard = document.querySelector('.fm-saldo');
    if (saldoCard) {
      var titleSpan = saldoCard.querySelector('span.uppercase');
      if (titleSpan) {
        titleSpan.textContent = 'SALDO SHIFT';
        attachInfoDot(titleSpan, 'Saldo Shift (Belum Closing)', 'Uang bersih di laci kasir pada shift berjalan sejak closing terakhir. Akan di-reset ke Rp 0 saat tombol Closing ditekan.');
      }
    }
    var netEl = document.getElementById('kas-net');
    if (netEl && netEl.previousElementSibling) {
      netEl.previousElementSibling.textContent = 'SALDO KAS SAH';
      attachInfoDot(netEl.previousElementSibling, 'Saldo Kas Sah (Akumulasi)', 'Total akumulasi seluruh kas masuk dikurangi kas keluar yang sudah disahkan pada pembukuan toko.');
    }
  }

  /* ==================== 5. FORM KIRI: CHIP FAVORIT POPOVER, PECAHAN & STOK BADGE ==================== */
  /* Catatan penting: TIDAK menambah elemen anak langsung ke dalam grid form kiri agar grid 2x2 skin.js tetap 100% utuh! */
  var favPop = null;
  function initLeftFormInlineEnhancements() {
    var accSelect = document.getElementById('tx-account');
    var amtInput = document.getElementById('tx-amount');
    if (!accSelect || !amtInput) return;

    // 5A. Tombol "Favorit ▾" & Badge Stok di baris label Pilih Akun Mutasi / Produk Toko
    var accHeader = accSelect.previousElementSibling;
    if (accHeader && !document.getElementById('v12-fav-trigger')) {
      var rightTools = document.createElement('div');
      rightTools.className = 'v12-inline-pills';
      rightTools.innerHTML =
        '<span id="v12-stk-pill" class="v12-stk-pill"></span>' +
        '<button type="button" id="v12-fav-trigger" class="v12-mini-pill" title="Pilih cepat produk atau akun yang sering dipakai">⚡ Sering Dipakai ▾</button>';
      accHeader.appendChild(rightTools);

      var accLabel = accHeader.querySelector('label');
      if (accLabel) attachInfoDot(accLabel, 'Pilih Akun / Produk (F3)', 'Pilih produk toko (stok otomatis berkurang) atau akun COA. Gunakan tombol "Sering Dipakai" di kanan untuk memilih cepat dalam 1 klik.');
    }

    // Buat Popover Mengambang untuk Chip Sering Dipakai
    if (!document.getElementById('v12-fav-pop')) {
      favPop = document.createElement('div');
      favPop.id = 'v12-fav-pop';
      favPop.innerHTML =
        '<div class="flex items-center justify-between"><span class="text-[11px] font-black text-slate-700">⚡ Produk & Akun Sering Dipakai</span><button type="button" id="v12-fav-close" class="text-xs font-bold text-slate-400 hover:text-slate-700">✕</button></div>' +
        '<div id="v12-fav-grid" class="v12-fav-grid"></div>';
      document.body.appendChild(favPop);

      var trig = document.getElementById('v12-fav-trigger');
      if (trig) {
        trig.onclick = function (e) {
          e.stopPropagation();
          if (favPop.classList.contains('open')) {
            favPop.classList.remove('open');
            return;
          }
          renderFavPopoverItems();
          favPop.classList.add('open');
          var r = trig.getBoundingClientRect();
          favPop.style.top = Math.min(window.innerHeight - 200, r.bottom + 6) + 'px';
          favPop.style.left = Math.min(window.innerWidth - 350, Math.max(12, r.right - 280)) + 'px';
        };
      }
      document.getElementById('v12-fav-close').onclick = function () { favPop.classList.remove('open'); };
      document.addEventListener('click', function (e) {
        if (favPop && favPop.classList.contains('open') && !e.target.closest('#v12-fav-pop') && !e.target.closest('#v12-fav-trigger')) {
          favPop.classList.remove('open');
        }
      });
    }

    // 5B. Tombol Nominal Cepat (+20rb, +50rb, +100rb) langsung di baris label Nominal Transaksi (Rp)
    var amtHeader = amtInput.parentElement && amtInput.parentElement.firstElementChild;
    if (amtHeader && !document.getElementById('v12-nom-inline')) {
      var nomPills = document.createElement('div');
      nomPills.id = 'v12-nom-inline';
      nomPills.className = 'v12-inline-pills';
      [20000, 50000, 100000].forEach(function (v) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'v12-mini-pill';
        b.textContent = '+' + (v / 1000) + 'rb';
        b.onclick = function () {
          if (amtInput.readOnly) return;
          amtInput.value = fmtNum(parseNum(amtInput.value) + v);
          if (typeof calculateTaxPreview === 'function') calculateTaxPreview();
          beepScan();
        };
        nomPills.appendChild(b);
      });
      var autoPill = amtHeader.querySelector('span');
      if (autoPill) autoPill.replaceWith(nomPills);
      else amtHeader.appendChild(nomPills);
    }
  }

  function renderFavPopoverItems() {
    var grid = document.getElementById('v12-fav-grid');
    if (!grid) return;
    var items = [];
    var seen = {};

    var prods = (typeof fmSaleProducts === 'function') ? fmSaleProducts() : [];
    prods.slice(0, 6).forEach(function (p) {
      var avail = (typeof availableStock === 'function') ? availableStock(p.code, '') : (p.stock || 0);
      seen[p.code] = true;
      items.push({ code: p.code, name: p.name, isProduct: true, avail: avail });
    });

    var freq = {};
    var txs = (typeof myTx === 'function') ? myTx() : (typeof txList !== 'undefined' ? txList : []);
    (txs || []).forEach(function (t) {
      if (t && t.accountCode) freq[t.accountCode] = (freq[t.accountCode] || 0) + 1;
    });
    var coa = (typeof STORE !== 'undefined' && STORE.getCOA) ? STORE.getCOA() : [];
    coa.slice().sort(function (a, b) { return (freq[b.code] || 0) - (freq[a.code] || 0); }).forEach(function (c) {
      if (items.length >= 8 || seen[c.code]) return;
      if (typeof adminBizOk === 'function' && !adminBizOk(c.biz)) return;
      seen[c.code] = true;
      items.push({ code: c.code, name: c.name, isProduct: false });
    });

    grid.innerHTML = '';
    items.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      var cls = 'v12-fchip';
      if (it.isProduct) {
        cls += ' prod';
        if (it.avail <= 0) cls += ' out';
        else if (it.avail <= 5) cls += ' low';
      }
      b.className = cls;
      var tag = it.isProduct ? (it.avail <= 0 ? 'Habis' : 'Stok ' + it.avail) : it.code;
      b.innerHTML = '<span>' + esc(it.name) + '</span><small>(' + esc(tag) + ')</small>';
      b.onclick = function () {
        var sel = document.getElementById('tx-account');
        if (!sel) return;
        if (it.isProduct && it.avail <= 0) {
          beepWarn();
          alert('Stok "' + it.name + '" sedang habis (0).');
          return;
        }
        sel.value = it.code;
        if (typeof updateCategoryBadge === 'function') updateCategoryBadge();
        updateStockPill();
        beepScan();
        if (favPop) favPop.classList.remove('open');
        if (!it.isProduct) {
          var amt = document.getElementById('tx-amount');
          if (amt && !amt.readOnly) amt.focus();
        }
      };
      grid.appendChild(b);
    });
  }

  function updateStockPill() {
    var pill = document.getElementById('v12-stk-pill');
    var nomInline = document.getElementById('v12-nom-inline');
    var sel = document.getElementById('tx-account');
    if (!pill || !sel) return;
    var opt = sel.options[sel.selectedIndex];
    var isProd = opt && opt.dataset && opt.dataset.isProduct === 'true';

    if (nomInline) nomInline.style.display = isProd ? 'none' : 'inline-flex';

    if (!isProd || !opt.value) {
      pill.className = 'v12-stk-pill';
      pill.textContent = '';
      return;
    }
    var editId = (document.getElementById('edit-draft-id') || {}).value || '';
    var avail = (typeof availableStock === 'function') ? availableStock(opt.value, editId) : 0;
    if (avail <= 0) {
      pill.className = 'v12-stk-pill show err';
      pill.textContent = 'Stok Habis (0)';
      beepWarn();
    } else if (avail <= 5) {
      pill.className = 'v12-stk-pill show warn';
      pill.textContent = 'Stok Menipis (' + avail + ')';
    } else {
      pill.className = 'v12-stk-pill show ok';
      pill.textContent = 'Stok: ' + avail;
    }
  }

  /* ==================== 6. PANEL KANAN: 3 TAB BERSIH (DRAFT | PARKIR | RIWAYAT) ==================== */
  function initRightCardTabs() {
    var draftContainer = document.getElementById('draft-items-container');
    if (!draftContainer) return;
    var rightCard = draftContainer.parentElement;
    if (!rightCard || document.getElementById('v12-rtabs-bar')) return;

    var oldHeader = rightCard.firstElementChild;
    var tabHeader = document.createElement('div');
    tabHeader.id = 'v12-rtabs-bar';
    tabHeader.className = 'flex items-center justify-between border-b border-slate-200/80 pb-2.5 gap-2 relative z-10';
    tabHeader.innerHTML =
      '<div class="v12-rtabs" id="v12-rtabs">' +
        '<button type="button" class="v12-rtab on" data-rtab="draft">Draft <span class="cnt" id="draft-count-badge">0</span></button>' +
        '<button type="button" class="v12-rtab" data-rtab="parked">Parkir <span class="cnt" id="v12-park-count">0</span></button>' +
        '<button type="button" class="v12-rtab" data-rtab="history">Riwayat Hari Ini <span class="cnt" id="v12-hist-count">0</span></button>' +
      '</div>' +
      '<button type="button" class="v12-park-act" id="v12-btn-park" title="Simpan sementara antrean ini untuk melayani pelanggan berikutnya (F6)">Parkirkan Antrean</button>';

    rightCard.replaceChild(tabHeader, oldHeader);
    attachInfoDot(document.getElementById('v12-rtabs'), 'Tab Draft, Parkir & Riwayat Hari Ini', 'Draft = antrean berjalan. Parkir = keranjang pelanggan yang ditunda sementara. Riwayat Hari Ini = transaksi sah hari ini (bisa cetak ulang struk atau kirim WA).');

    var parkedBox = document.createElement('div');
    parkedBox.id = 'v12-parked-container';
    parkedBox.className = 'hidden space-y-2 overflow-y-auto relative z-10';
    rightCard.insertBefore(parkedBox, draftContainer.nextSibling);

    var histBox = document.createElement('div');
    histBox.id = 'v12-history-container';
    histBox.className = 'hidden space-y-2 overflow-y-auto relative z-10';
    rightCard.insertBefore(histBox, parkedBox.nextSibling);

    document.getElementById('v12-rtabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-rtab]');
      if (!b) return;
      beepScan();
      switchRightTab(b.getAttribute('data-rtab'));
    });

    document.getElementById('v12-btn-park').onclick = function () { parkCurrentDraft(); };
  }

  function switchRightTab(tab) {
    rightTab = tab || 'draft';
    [].forEach.call(document.querySelectorAll('#v12-rtabs [data-rtab]'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-rtab') === rightTab);
    });
    var dBox = document.getElementById('draft-items-container');
    var pBox = document.getElementById('v12-parked-container');
    var hBox = document.getElementById('v12-history-container');
    var parkBtn = document.getElementById('v12-btn-park');

    if (dBox) dBox.classList.toggle('hidden', rightTab !== 'draft');
    if (pBox) pBox.classList.toggle('hidden', rightTab !== 'parked');
    if (hBox) hBox.classList.toggle('hidden', rightTab !== 'history');
    if (parkBtn) parkBtn.style.visibility = rightTab === 'draft' ? 'visible' : 'hidden';

    if (rightTab === 'parked') renderParkedList();
    if (rightTab === 'history') renderTodayHistory();
  }

  /* ==================== 7. PARKIR ANTREAN ==================== */
  function saveParked() {
    try { localStorage.setItem(PARK_KEY, JSON.stringify(parkedList)); } catch (e) {}
    updateTabCounters();
  }

  function parkCurrentDraft() {
    if (typeof draftList === 'undefined' || !draftList.length) {
      beepWarn();
      alert('Antrean draft masih kosong. Tambahkan item terlebih dahulu.');
      return;
    }
    var tot = 0;
    draftList.forEach(function (d) { tot += (typeof sgnAmt === 'function') ? sgnAmt(d) : (d.amount || 0); });
    var label = 'Antrean #' + (parkedList.length + 1);

    parkedList.unshift({
      id: 'park_' + Date.now(),
      label: label,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      total: tot,
      items: draftList.slice()
    });
    saveParked();

    draftList = [];
    localStorage.setItem('fm_kasir_drafts', JSON.stringify(draftList));
    beepSuccess();
    if (typeof renderDraftList === 'function') renderDraftList();
    renderParkedList();
  }

  function restoreParkedCart(parkId) {
    var idx = parkedList.findIndex(function (p) { return p.id === parkId; });
    if (idx < 0) return;
    var cart = parkedList[idx];

    if (typeof draftList !== 'undefined' && draftList.length > 0) {
      if (!confirm('Gabungkan dengan ' + draftList.length + ' item di draft saat ini?')) return;
      draftList = draftList.concat(cart.items);
    } else {
      draftList = cart.items.slice();
    }

    parkedList.splice(idx, 1);
    saveParked();
    localStorage.setItem('fm_kasir_drafts', JSON.stringify(draftList));
    beepScan();
    switchRightTab('draft');
    if (typeof renderDraftList === 'function') renderDraftList();
  }

  function renderParkedList() {
    var box = document.getElementById('v12-parked-container');
    if (!box) return;
    updateTabCounters();
    if (!parkedList.length) {
      box.innerHTML = '<div class="p-6 text-center text-xs text-slate-500 bg-white/60 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 h-full"><span>Belum ada antrean yang diparkir.</span><span class="text-[11px] text-slate-400">Gunakan tombol Parkirkan Antrean bila pembeli menunda pembayaran.</span></div>';
      return;
    }
    box.innerHTML = parkedList.map(function (p) {
      var names = (p.items || []).map(function (i) { return i.accountName + ' ×' + (i.qty || 1); }).join(', ');
      return '<div class="flex items-center justify-between p-3 rounded-2xl bg-white/90 border border-slate-200 text-xs gap-2">' +
        '<div class="min-w-0 flex-1">' +
          '<div class="font-black text-slate-900 flex items-center gap-1.5"><span>' + esc(p.label) + '</span><span class="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">' + esc(p.time) + '</span></div>' +
          '<div class="text-[11px] text-slate-500 truncate">' + esc(names) + '</div>' +
        '</div>' +
        '<div class="flex items-center gap-1.5 shrink-0">' +
          '<span class="font-black font-mono text-slate-900 mr-1">' + fmtRp(p.total) + '</span>' +
          '<button type="button" data-park-restore="' + esc(p.id) + '" class="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px]">Panggil</button>' +
          '<button type="button" data-park-del="' + esc(p.id) + '" class="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-[11px]" title="Hapus">✕</button>' +
        '</div>' +
      '</div>';
    }).join('');

    [].forEach.call(box.querySelectorAll('[data-park-restore]'), function (b) {
      b.onclick = function () { restoreParkedCart(b.getAttribute('data-park-restore')); };
    });
    [].forEach.call(box.querySelectorAll('[data-park-del]'), function (b) {
      b.onclick = function () {
        parkedList = parkedList.filter(function (x) { return x.id !== b.getAttribute('data-park-del'); });
        saveParked();
        renderParkedList();
      };
    });
  }

  /* ==================== 8. RIWAYAT HARI INI & CETAK ULANG / WA ==================== */
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
      box.innerHTML = '<div class="p-6 text-center text-xs text-slate-500 bg-white/60 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 h-full"><span>Belum ada transaksi sah hari ini.</span><span class="text-[11px] text-slate-400">Transaksi yang sudah dicetak hari ini akan muncul di sini.</span></div>';
      return;
    }

    var PAYLBL = { tunai: 'Tunai', qris: 'QRIS', transfer: 'Transfer', petty: 'Petty Cash' };
    box.innerHTML = list.slice(0, 30).map(function (tx, i) {
      var isIn = (typeof fmKasMasuk === 'function') ? fmKasMasuk(tx.category) : (tx.category === 'sales');
      var payTag = tx.payDetail || PAYLBL[tx.pay] || tx.pay || 'Tunai';
      return '<div class="flex items-center justify-between p-2.5 rounded-2xl bg-white/90 border border-slate-200 text-xs gap-2">' +
        '<div class="min-w-0 flex-1">' +
          '<div class="font-black text-slate-900 truncate">' + esc(tx.accountName) + (tx.qty > 1 ? ' ×' + tx.qty : '') + '</div>' +
          '<div class="text-[10.5px] text-slate-500 flex items-center gap-1.5 flex-wrap">' +
            '<span class="font-mono">' + esc(tx.date || '') + '</span>·<span>' + esc(payTag) + '</span>' +
            (tx.customerName ? '·<span>' + esc(tx.customerName) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="flex items-center gap-1.5 shrink-0">' +
          '<span class="font-black font-mono ' + (isIn ? 'text-emerald-700' : 'text-rose-600') + '">' + (isIn ? '' : '-') + 'Rp ' + fmtNum(tx.amount) + '</span>' +
          '<button type="button" data-hist-print="' + i + '" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10.5px]">Struk</button>' +
          '<button type="button" data-hist-wa="' + i + '" class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10.5px]">WA</button>' +
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

    document.getElementById('receipt-date').innerText = whenText + ' (Salinan)';
    document.getElementById('receipt-staff').innerText = tx.staff || (typeof user !== 'undefined' && user.title) || 'Admin';
    document.getElementById('receipt-total').innerText = fmtRp(signed);
    document.getElementById('receipt-pay').innerText = payText;

    var rList = document.getElementById('receipt-items-list');
    if (rList) {
      rList.innerHTML = '<div class="flex justify-between"><span>' + esc(tx.accountName) + (tx.qty > 1 ? ' x' + tx.qty : '') + '</span><span>' + (isIn ? '' : '-') + 'Rp ' + fmtNum(tx.amount) + '</span></div>';
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

    if (directlyOpenWA) window.sendReceiptWA();
    else document.getElementById('modal-receipt').classList.remove('hidden');
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
    if (meta.customer) html += '<div class="flex justify-between"><span>Pelanggan:</span><span class="font-bold text-slate-800">' + esc(meta.customer) + '</span></div>';
    if (meta.disc > 0) html += '<div class="flex justify-between text-emerald-700 font-bold"><span>Potongan Struk:</span><span>-Rp ' + fmtNum(meta.disc) + '</span></div>';
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

  /* ==================== 9. MODAL KONFIRMASI PEMBAYARAN, KEMBALIAN & SPLIT ==================== */
  /* Menggantikan popup konfirmasi polos saat tombol "Konfirmasi & Cetak Struk Sah" ditekan */
  function openCheckoutModal(rawTotal, onConfirm) {
    var old = document.getElementById('v12-pay-modal');
    if (old) old.remove();

    var initPm = ((document.getElementById('pay-method') || {}).value) || 'tunai';
    var modal = document.createElement('div');
    modal.id = 'v12-pay-modal';
    modal.className = 'open';
    modal.innerHTML =
      '<div class="v12-pay-card">' +
        '<div class="v12-pay-top">' +
          '<div><h3 class="text-base font-black text-slate-900">Konfirmasi Pembayaran & Struk</h3><p class="text-[11px] text-slate-500 font-medium">' + draftList.length + ' item di antrean draft</p></div>' +
          '<button type="button" id="v12-pay-x" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs">✕</button>' +
        '</div>' +
        '<div class="v12-pay-totbox">' +
          '<span class="text-xs font-extrabold text-slate-500 uppercase">Total Tagihan</span>' +
          '<span id="v12-m-net" class="text-2xl font-black text-slate-900 font-mono">' + fmtRp(rawTotal) + '</span>' +
        '</div>' +
        '<div class="v12-pay-grid2">' +
          '<div><label>Pelanggan / Catatan (Opsional)</label><input type="text" id="v12-m-cust" placeholder="Pelanggan Umum"></div>' +
          '<div><label>Potongan / Diskon Struk (Rp / %)</label><input type="text" id="v12-m-disc" placeholder="0 atau 10%"></div>' +
        '</div>' +
        '<div>' +
          '<label>Metode Pembayaran</label>' +
          '<div class="v12-pm-tabs" id="v12-m-pmtabs">' +
            '<button type="button" class="v12-pm-tab" data-mpm="tunai">Tunai</button>' +
            '<button type="button" class="v12-pm-tab" data-mpm="qris">QRIS</button>' +
            '<button type="button" class="v12-pm-tab" data-mpm="bank">Transfer</button>' +
            '<button type="button" class="v12-pm-tab" data-mpm="petty">Petty Cash</button>' +
            '<button type="button" class="v12-pm-tab" data-mpm="split">Split Bayar</button>' +
          '</div>' +
        '</div>' +
        '<div id="v12-m-cashwrap" class="space-y-2">' +
          '<div><label>Uang Tunai Diterima (Rp)</label><input type="text" id="v12-m-cash" inputmode="numeric" placeholder="Kosongkan bila uang pas" class="font-mono text-base"></div>' +
          '<div class="v12-presets" id="v12-m-presets">' +
            '<button type="button" class="v12-preset-btn" data-mp="exact">Uang Pas</button>' +
            '<button type="button" class="v12-preset-btn" data-mp="20000">20.000</button>' +
            '<button type="button" class="v12-preset-btn" data-mp="50000">50.000</button>' +
            '<button type="button" class="v12-preset-btn" data-mp="100000">100.000</button>' +
            '<button type="button" class="v12-preset-btn" data-mp="+50000">+50rb</button>' +
          '</div>' +
          '<div class="v12-change-box neutral" id="v12-m-chbox">' +
            '<span class="text-xs font-extrabold uppercase" id="v12-m-chlbl">Kembalian</span>' +
            '<b class="text-lg font-black font-mono" id="v12-m-chval">Rp 0 (Uang Pas)</b>' +
          '</div>' +
        '</div>' +
        '<div id="v12-m-splitwrap" class="hidden space-y-2 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200">' +
          '<div class="v12-pay-grid2">' +
            '<div><label>Metode 1</label><select id="v12-m-sm1"><option value="tunai">Tunai</option><option value="qris">QRIS</option><option value="transfer">Transfer</option><option value="petty">Petty Cash</option></select></div>' +
            '<div><label>Nominal 1 (Rp)</label><input type="text" id="v12-m-sa1" inputmode="numeric" class="font-mono"></div>' +
          '</div>' +
          '<div class="v12-pay-grid2">' +
            '<div><label>Metode 2</label><select id="v12-m-sm2"><option value="qris">QRIS</option><option value="transfer">Transfer</option><option value="tunai">Tunai</option><option value="petty">Petty Cash</option></select></div>' +
            '<div><label>Nominal 2 (Rp)</label><input type="text" id="v12-m-sa2" inputmode="numeric" class="font-mono"></div>' +
          '</div>' +
          '<div id="v12-m-sstat" class="text-xs font-extrabold text-indigo-800 pt-1"></div>' +
        '</div>' +
        '<div class="flex items-center gap-2.5 pt-2 border-t border-slate-200">' +
          '<button type="button" id="v12-pay-cancel" class="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs">Batal</button>' +
          '<button type="button" id="v12-pay-ok" class="flex-[2] py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md">Sahkan & Cetak Struk</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    var curPm = initPm;
    var discEl = document.getElementById('v12-m-disc');
    var cashEl = document.getElementById('v12-m-cash');
    var sa1El = document.getElementById('v12-m-sa1');
    var sa2El = document.getElementById('v12-m-sa2');

    function calcState() {
      var dRaw = String(discEl.value || '').trim();
      var disc = 0;
      if (rawTotal > 0 && dRaw) {
        if (dRaw.indexOf('%') >= 0) {
          var pct = Math.min(100, Math.max(0, parseFloat(dRaw.replace(',', '.')) || 0));
          disc = Math.round(rawTotal * (pct / 100));
        } else {
          disc = parseNum(dRaw);
        }
        disc = Math.max(0, Math.min(rawTotal, disc));
      }
      var net = rawTotal >= 0 ? (rawTotal - disc) : rawTotal;
      var target = Math.max(0, net);
      document.getElementById('v12-m-net').innerHTML = fmtRp(net) + (disc > 0 ? ' <span class="text-xs text-emerald-600 font-bold">(-' + fmtRp(disc) + ')</span>' : '');

      var chBox = document.getElementById('v12-m-chbox');
      var chLbl = document.getElementById('v12-m-chlbl');
      var chVal = document.getElementById('v12-m-chval');
      var cashIn = parseNum(cashEl.value);

      if (!cashEl.value.trim() || target === 0) {
        chBox.className = 'v12-change-box neutral';
        chLbl.textContent = 'KEMBALIAN';
        chVal.textContent = 'Rp 0 (Uang Pas)';
      } else if (cashIn >= target) {
        chBox.className = 'v12-change-box';
        chLbl.textContent = 'KEMBALIAN';
        chVal.textContent = fmtRp(cashIn - target);
      } else {
        chBox.className = 'v12-change-box under';
        chLbl.textContent = 'KURANG BAYAR';
        chVal.textContent = fmtRp(target - cashIn);
      }

      if (curPm === 'split') {
        var a1 = parseNum(sa1El.value);
        var a2 = parseNum(sa2El.value);
        var sStat = document.getElementById('v12-m-sstat');
        if (a1 + a2 >= target) {
          sStat.textContent = '✓ Lunas · Kembalian: ' + fmtRp((a1 + a2) - target);
          sStat.className = 'text-xs font-extrabold text-emerald-700 pt-1';
        } else {
          sStat.textContent = 'Kurang: ' + fmtRp(target - (a1 + a2));
          sStat.className = 'text-xs font-extrabold text-rose-600 pt-1';
        }
      }
      return { disc: disc, net: net, target: target };
    }

    function setModalPm(pm) {
      curPm = pm;
      [].forEach.call(modal.querySelectorAll('[data-mpm]'), function (b) {
        b.classList.toggle('on', b.getAttribute('data-mpm') === curPm);
      });
      document.getElementById('v12-m-cashwrap').classList.toggle('hidden', curPm !== 'tunai');
      document.getElementById('v12-m-splitwrap').classList.toggle('hidden', curPm !== 'split');
      if (curPm === 'split') {
        var t = calcState().target;
        if (t > 0 && !parseNum(sa1El.value) && !parseNum(sa2El.value)) {
          var h = Math.round(t / 2);
          sa1El.value = fmtNum(h);
          sa2El.value = fmtNum(t - h);
        }
      }
      calcState();
    }

    setModalPm(initPm);

    document.getElementById('v12-m-pmtabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-mpm]');
      if (b) { beepScan(); setModalPm(b.getAttribute('data-mpm')); }
    });

    discEl.addEventListener('input', calcState);
    cashEl.addEventListener('input', function () {
      if (typeof formatInputThousand === 'function') formatInputThousand(cashEl);
      calcState();
    });

    document.getElementById('v12-m-presets').addEventListener('click', function (e) {
      var b = e.target.closest('[data-mp]');
      if (!b) return;
      var mp = b.getAttribute('data-mp');
      var t = calcState().target;
      if (mp === 'exact') cashEl.value = t > 0 ? fmtNum(t) : '';
      else if (mp.charAt(0) === '+') cashEl.value = fmtNum(parseNum(cashEl.value) + (parseInt(mp.slice(1), 10) || 0));
      else cashEl.value = fmtNum(parseInt(mp, 10) || 0);
      beepScan();
      calcState();
    });

    sa1El.addEventListener('input', function () {
      if (typeof formatInputThousand === 'function') formatInputThousand(sa1El);
      var t = calcState().target;
      var v1 = parseNum(sa1El.value);
      if (t > 0 && v1 <= t) sa2El.value = fmtNum(t - v1);
      calcState();
    });
    sa2El.addEventListener('input', function () {
      if (typeof formatInputThousand === 'function') formatInputThousand(sa2El);
      calcState();
    });

    function close() { modal.remove(); }
    document.getElementById('v12-pay-x').onclick = close;
    document.getElementById('v12-pay-cancel').onclick = close;
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });

    document.getElementById('v12-pay-ok').onclick = function () {
      var st = calcState();
      var cust = (document.getElementById('v12-m-cust').value || '').trim();
      var cashIn = 0, change = 0, splitInfo = '';
      var PAYLBL = { tunai: 'Tunai', qris: 'QRIS', transfer: 'Transfer', bank: 'Transfer', petty: 'Petty Cash' };

      if (curPm === 'tunai' && st.target > 0 && cashEl.value.trim()) {
        cashIn = parseNum(cashEl.value);
        if (cashIn < st.target) {
          beepWarn();
          return alert('Uang diterima (' + fmtRp(cashIn) + ') kurang dari total tagihan (' + fmtRp(st.target) + ')!');
        }
        change = cashIn - st.target;
      } else if (curPm === 'split' && st.target > 0) {
        var m1 = document.getElementById('v12-m-sm1').value;
        var m2 = document.getElementById('v12-m-sm2').value;
        var a1 = parseNum(sa1El.value);
        var a2 = parseNum(sa2El.value);
        if (a1 + a2 < st.target) {
          beepWarn();
          return alert('Total Split (' + fmtRp(a1 + a2) + ') kurang dari total tagihan (' + fmtRp(st.target) + ')!');
        }
        cashIn = a1 + a2;
        change = (a1 + a2) - st.target;
        splitInfo = 'Split: ' + (PAYLBL[m1] || m1) + ' ' + fmtRp(a1) + ' + ' + (PAYLBL[m2] || m2) + ' ' + fmtRp(a2);
      }

      // Sinkronkan ke dropdown pay-method kiri
      var leftSel = document.getElementById('pay-method');
      if (leftSel) {
        if (curPm !== 'split') leftSel.value = curPm;
        else {
          var sm1 = document.getElementById('v12-m-sm1').value;
          leftSel.value = sm1 === 'transfer' ? 'bank' : sm1;
        }
        if (typeof onPayMethodChange === 'function') onPayMethodChange();
      }

      close();
      onConfirm({
        customer: cust,
        disc: st.disc,
        cashIn: cashIn,
        change: change,
        splitInfo: splitInfo
      });
    };

    setTimeout(function () {
      if (curPm === 'tunai') cashEl.focus();
    }, 40);
  }

  /* ==================== 10. HOOK FUNGSI INTI KASIR ==================== */
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
                qCtrl.innerHTML = '<button type="button" data-dq-idx="' + i + '" data-dq-d="-1" title="Kurangi">−</button>' +
                  '<span>' + (draftList[i].qty || 1) + '</span>' +
                  '<button type="button" data-dq-idx="' + i + '" data-dq-d="1" title="Tambah">+</button>';
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
          updateStockPill();
        } catch (e) {}
        return r;
      };
      wrappedRenderDraft.__v12 = true;
      window.renderDraftList = wrappedRenderDraft;
    }

    ['updateCategoryBadge', 'applyQtyToForm'].forEach(function (fnName) {
      var orig = window[fnName];
      if (typeof orig === 'function' && !orig.__v12) {
        var w = function () {
          var res = orig.apply(this, arguments);
          try { updateStockPill(); } catch (e) {}
          return res;
        };
        w.__v12 = true;
        window[fnName] = w;
      }
    });

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

    var origRenderAll = window.renderAllReports;
    if (typeof origRenderAll === 'function' && !origRenderAll.__v12) {
      var wAll = function () {
        var res = origRenderAll.apply(this, arguments);
        try {
          updateTabCounters();
          if (rightTab === 'history') renderTodayHistory();
        } catch (e) {}
        return res;
      };
      wAll.__v12 = true;
      window.renderAllReports = wAll;
    }

    // Upgrade sendReceiptWA
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
        lines.push('Diterima: Rp ' + fmtNum(lastReceipt.cashIn));
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
        '<b style="font-size:15px">Kirim Struk Digital WhatsApp</b>' +
        '<p style="font-size:12px;color:#64748b;margin:6px 0 10px">Masukkan nomor WA pelanggan (contoh 08123456789). Kosongkan bila ingin memilih kontak di WhatsApp.</p>' +
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

    // Upgrade finalizeAndPrint: buka Modal Pembayaran & Kembalian yang lega (menggantikan fmAsk polos)
    var origFinalize = window.finalizeAndPrint;
    if (typeof origFinalize === 'function' && !origFinalize.__v12) {
      window.finalizeAndPrint = async function () {
        if (typeof draftList === 'undefined' || draftList.length === 0) {
          beepWarn();
          return alert('Antrean draft kosong! Input transaksi terlebih dahulu.');
        }

        // Validasi stok produk dulu
        for (var i = 0; i < draftList.length; i++) {
          var d = draftList[i];
          if (!d.isProduct) continue;
          var p = STORE.getProducts().find(function (x) { return x.code === d.accountCode; });
          var have = p ? p.stock : 0;
          if (have < (d.qty || 1) * (d.per || 1)) {
            beepWarn();
            return alert('Stok ' + d.accountName + ' tidak cukup (tersisa ' + have + ').');
          }
        }

        var rawTotal = 0;
        draftList.forEach(function (d) { rawTotal += (typeof sgnAmt === 'function') ? sgnAmt(d) : (d.amount || 0); });

        openCheckoutModal(rawTotal, async function (meta) {
          if (meta.disc > 0 && draftList.length > 0) {
            var rem = meta.disc;
            draftList.forEach(function (d) {
              if (rem <= 0) return;
              var isIn = (typeof fmKasMasuk === 'function') ? fmKasMasuk(d.category) : (d.category === 'sales');
              if (isIn && d.amount > 0) {
                var cut = Math.min(d.amount, rem);
                d.amount -= cut;
                d.dpp = d.amount;
                d.discount = (d.discount || 0) + cut;
                rem -= cut;
              }
            });
          }

          if (meta.customer || meta.splitInfo) {
            draftList.forEach(function (d) {
              var tag = [meta.customer ? ('Pelanggan: ' + meta.customer) : '', meta.splitInfo].filter(Boolean).join(' · ');
              if (tag && String(d.desc || '').indexOf(tag) < 0) {
                d.desc = d.desc ? (d.desc + ' (' + tag + ')') : tag;
              }
            });
          }

          // Bypass fmAsk kedua karena kasir sudah mengonfirmasi di Modal Pembayaran v1.2
          var origAsk = window.fmAsk;
          window.fmAsk = function () { return Promise.resolve(true); };
          var prevCount = (typeof txList !== 'undefined') ? txList.length : 0;
          try {
            await origFinalize();
          } finally {
            window.fmAsk = origAsk;
          }
          var nowCount = (typeof txList !== 'undefined') ? txList.length : 0;

          if (typeof draftList !== 'undefined' && draftList.length === 0 && nowCount >= prevCount) {
            beepSuccess();
            var added = Math.max(1, nowCount - prevCount);
            for (var k = 0; k < added && k < txList.length; k++) {
              if (meta.customer) txList[k].customerName = meta.customer;
              if (meta.disc > 0) txList[k].billDiscount = meta.disc;
              if (meta.cashIn > 0) { txList[k].cashReceived = meta.cashIn; txList[k].cashChange = meta.change; }
              if (meta.splitInfo) txList[k].payDetail = meta.splitInfo;
            }
            if (typeof persistData === 'function') persistData();

            if (meta.splitInfo) {
              var rPay = document.getElementById('receipt-pay');
              if (rPay) rPay.innerText = meta.splitInfo;
            }
            updateReceiptExtraRows(meta);
            if (lastReceipt) {
              lastReceipt.customer = meta.customer;
              lastReceipt.disc = meta.disc;
              lastReceipt.cashIn = meta.cashIn;
              lastReceipt.change = meta.change;
              if (meta.splitInfo) lastReceipt.pay = meta.splitInfo;
            }
            updateTabCounters();
          }
        });
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
        var mCash = document.getElementById('v12-m-cash');
        var amt = document.getElementById('tx-amount');
        if (mCash) mCash.focus();
        else if (amt) amt.focus();
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
        var okBtn = document.getElementById('v12-pay-ok');
        if (okBtn) okBtn.click();
        else if (typeof window.finalizeAndPrint === 'function') window.finalizeAndPrint();
      }
    });
  }

  /* ==================== BOOTSTRAP ==================== */
  function boot() {
    injectCSS();
    initHeaderIndicators();
    clarifyBalanceLabels();
    initLeftFormInlineEnhancements();
    initRightCardTabs();
    hookCoreFunctions();
    initKeyboardShortcuts();
    initGuideSystem();

    if (typeof window.renderDraftList === 'function') window.renderDraftList();
    updateTabCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 50); });
  } else {
    setTimeout(boot, 50);
  }
})();
