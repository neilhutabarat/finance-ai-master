/* skin.js — "Kulit UI": bentuk kartu, tombol, pop-up, dan dock. Terpisah dari tema warna (theme.js).
   Untuk mengganti desain tiap tahun: tambah kulit baru di SKINS lalu ubah ACTIVE (atau window.FM_SKIN sebelum file ini dimuat).
   Warna aksen tetap dipilih pengguna di Pengaturan; kulit hanya mengatur bentuk/bahan. */
(function () {
  'use strict';
  var ACTIVE = window.FM_SKIN || 'glass-2026';
  var SKINS = {};

  /* ========================= KULIT: Glass 2026 ========================= */
  var A = 'var(--fm-accent,#3d63dd)';
  SKINS['glass-2026'] = {
    name: 'Glass 2026',
    css: [
      /* ---------- latar halaman ---------- */
      'html[data-fm-native="dark"] body,html[data-fm-native="dark"][data-fm-black="1"] body{background:#05060a!important;background-image:radial-gradient(60% 45% at 8% 0%,color-mix(in srgb,' + A + ' 17%,transparent),transparent 72%),radial-gradient(50% 40% at 100% 100%,color-mix(in srgb,' + A + ' 11%,transparent),transparent 72%)!important;background-attachment:fixed!important}',
      'html[data-fm-native="light"]:not([data-fm-black]):not([data-fm-invert]) body{background:#e9edf4!important;background-image:radial-gradient(55% 40% at 6% 0%,color-mix(in srgb,' + A + ' 16%,transparent),transparent 70%),radial-gradient(50% 40% at 100% 100%,color-mix(in srgb,' + A + ' 12%,transparent),transparent 70%)!important;background-attachment:fixed!important}',
      'body{padding-bottom:116px!important}',

      /* ---------- header ---------- */
      '.oneui-hero{background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,0) 60%),#0b0e14!important;border-bottom-left-radius:30px!important;border-bottom-right-radius:30px!important;border-bottom:1px solid rgba(255,255,255,.1)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 18px 40px -26px rgba(0,0,0,.8)!important}',
      '.oneui-hero #tier-badge-indicator,.oneui-hero [class*="from-amber"]{background:rgba(255,255,255,.08)!important;border-color:rgba(255,255,255,.2)!important;color:#e5e7eb!important;box-shadow:none!important}',

      /* ---------- bahan kartu kaca (gelap) ---------- */
      'html[data-fm-native="dark"] .ios-glass,html[data-fm-native="dark"][data-fm-black="1"] .ios-glass{position:relative;background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.025)),rgba(15,17,23,.7)!important;border:1px solid rgba(255,255,255,.1)!important;border-top-color:rgba(255,255,255,.2)!important;border-radius:26px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 -1px 0 rgba(0,0,0,.45),0 26px 50px -30px rgba(0,0,0,.95)!important;-webkit-backdrop-filter:blur(28px) saturate(170%);backdrop-filter:blur(28px) saturate(170%);overflow:hidden}',
      'html[data-fm-native="dark"] .ios-glass::before{content:"";position:absolute;left:0;right:0;top:0;height:46%;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,0));border-radius:26px 26px 60% 60%/26px 26px 20px 20px;pointer-events:none;z-index:-1}',
      /* ---------- bahan kartu kaca (terang) ---------- */
      '.white-ice-glass-card{background:linear-gradient(180deg,rgba(255,255,255,.78),rgba(255,255,255,.5))!important;border:1px solid rgba(255,255,255,.9)!important;border-bottom-color:rgba(148,163,184,.35)!important;border-radius:26px!important;box-shadow:inset 0 1px 0 #fff,0 24px 46px -30px rgba(15,23,42,.45)!important;-webkit-backdrop-filter:blur(28px) saturate(170%);backdrop-filter:blur(28px) saturate(170%)}',
      '.white-ice-glass-card::before{height:42%!important;background:linear-gradient(180deg,rgba(255,255,255,.6),rgba(255,255,255,0))!important;z-index:-1!important}',
      /* kartu gelap berkilau (mis. Saldo Kas Sah) */
      '.white-ice-glass-card[style*="0f172a"]{background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,0) 55%),#10141d!important;border-color:rgba(255,255,255,.16)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 24px 46px -26px rgba(2,6,23,.9)!important}',
      '.white-ice-glass-card[style*="0f172a"]::before{display:none}',
      '.white-ice-glass-card[class*="border-amber"],.white-ice-glass-card[class*="border-rose"],.white-ice-glass-card[class*="border-emerald"]{border-color:rgba(255,255,255,.9)!important}',

      /* ---------- tombol: bahan seragam ---------- */
      /* utama (aksen) */
      'button[class*="bg-indigo-"],button[class*="bg-purple-"],button[class*="bg-violet-"],button[class*="bg-emerald-"],button[class*="bg-teal-"],button[class*="bg-blue-"],button[class*="bg-green-"],button[class*="bg-sky-"],button[class*="from-indigo"],button[class*="from-purple"],button[class*="from-emerald"],button[class*="from-teal"],button[class*="from-blue"]{background:linear-gradient(180deg,rgba(255,255,255,.3),rgba(255,255,255,0) 55%),' + A + '!important;color:#fff!important;border:1px solid rgba(255,255,255,.22)!important;border-radius:14px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.38),0 10px 20px -12px color-mix(in srgb,' + A + ' 80%,#000)!important}',
      /* sekunder (grafit kaca) */
      'button[class*="bg-slate-9"],button[class*="bg-slate-8"],button[class*="bg-gray-9"],button[class*="bg-gray-8"],button[class*="bg-amber-5"],button[class*="bg-amber-6"],button[class*="bg-amber-7"],button[class*="bg-orange-"],button[class*="from-amber"],button[class*="from-orange"]{background:linear-gradient(180deg,rgba(255,255,255,.17),rgba(255,255,255,0) 55%),#1a1e28!important;color:#f3f4f6!important;border:1px solid rgba(255,255,255,.13)!important;border-radius:14px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 10px 20px -14px rgba(2,6,23,.8)!important}',
      /* bahaya (lembut) */
      'button[class*="bg-rose-5"],button[class*="bg-rose-6"],button[class*="bg-rose-7"],button[class*="bg-red-5"],button[class*="bg-red-6"],button[class*="bg-red-7"],button[class*="from-rose"],button[class*="from-red"]{background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,0) 55%),#8f2740!important;color:#fff!important;border:1px solid rgba(255,255,255,.16)!important;border-radius:14px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.22)!important}',
      /* terang (kaca bening) */
      'html[data-fm-native="light"] button[class*="bg-white"],html[data-fm-native="light"] button[class*="bg-slate-50"],html[data-fm-native="light"] button[class*="bg-slate-100"],html[data-fm-native="light"] button[class*="bg-slate-200"]{background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,255,255,.55))!important;color:#0f172a!important;border:1px solid rgba(148,163,184,.4)!important;border-radius:14px!important;box-shadow:inset 0 1px 0 #fff,0 8px 16px -12px rgba(15,23,42,.35)!important}',
      'button.rounded-xl,button.rounded-2xl,button[class*="rounded-"]{font-weight:700;letter-spacing:-.005em}',
      'button:hover{filter:brightness(1.07)}button:active{filter:brightness(.96)}',
      'html[data-fm-invert="1"] button:hover{filter:none}',
      /* ubin menu yang diganti dock tetap rapi jika dock tidak aktif */
      'button:has(h4)[class*="bg-"]{text-align:left}',
      'html[data-fm-dock] .fm-tile,html[data-fm-dock] .fm-tile-wrap{display:none!important}',

      '.oneui-hero button,.oneui-hero :has(> #user-role-display){background:rgba(255,255,255,.07)!important;background-image:none!important;color:#e5e7eb!important;border:1px solid rgba(255,255,255,.16)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.12)!important}',
      '.oneui-hero button[class*="rose"],.oneui-hero button[class*="red"]{color:#fda4af!important}',
      /* teks berwarna pada kartu gelap: naikkan keterbacaan */
      'html[data-fm-native="dark"] [class*="text-emerald-6"],html[data-fm-native="dark"] [class*="text-emerald-7"],html[data-fm-native="dark"] [class*="text-emerald-8"]{color:#34d399!important}',
      'html[data-fm-native="dark"] [class*="text-rose-6"],html[data-fm-native="dark"] [class*="text-rose-7"],html[data-fm-native="dark"] [class*="text-rose-8"]{color:#fb7185!important}',
      'html[data-fm-native="dark"] [class*="text-indigo-9"],html[data-fm-native="dark"] [class*="text-indigo-8"]{color:#a5b4fc!important}',
      'html[data-fm-native="dark"] [class*="text-purple-9"],html[data-fm-native="dark"] [class*="text-purple-8"],html[data-fm-native="dark"] [class*="text-purple-7"]{color:#d8b4fe!important}',
      'input,select,textarea{min-width:0}',

      /* ---------- kolom isian ---------- */
      'input:not([type=checkbox]):not([type=radio]):not([type=color]):not([type=range]),select,textarea{border-radius:14px!important}',
      'html[data-fm-native="light"] input:not([type=checkbox]):not([type=radio]):not([type=color]),html[data-fm-native="light"] select,html[data-fm-native="light"] textarea{background-color:rgba(255,255,255,.72)!important;border-color:rgba(148,163,184,.45)!important;box-shadow:inset 0 1px 2px rgba(15,23,42,.05)!important}',

      /* ---------- pop-up (jendela kaca) ---------- */
      '@media screen{',
      '.fixed.inset-0[id*="modal"]{background:rgba(6,8,14,.4)!important;-webkit-backdrop-filter:blur(22px) saturate(140%)!important;backdrop-filter:blur(22px) saturate(140%)!important}',
      '.fixed.inset-0[id*="modal"]>div{border-radius:30px!important;animation:fmPop .42s cubic-bezier(.2,.9,.25,1.12) both;-webkit-backdrop-filter:blur(34px) saturate(180%);backdrop-filter:blur(34px) saturate(180%);box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 40px 90px -30px rgba(0,0,0,.7)!important;border:1px solid rgba(255,255,255,.16)!important}',
      'html[data-fm-native="dark"] .fixed.inset-0[id*="modal"]>div{background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.03)),rgba(16,18,25,.82)!important}',
      'html[data-fm-native="light"] .fixed.inset-0[id*="modal"]>div{background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(255,255,255,.78))!important;border-color:rgba(255,255,255,.95)!important}',
      '@keyframes fmPop{from{opacity:0;transform:translateY(16px) scale(.94)}to{opacity:1;transform:none}}',
      '@keyframes fmUp{from{opacity:.4;transform:translateY(100%)}to{opacity:1;transform:none}}',
      '@media(max-width:640px){.fixed.inset-0[id*="modal"]{align-items:flex-end!important;padding:0!important}.fixed.inset-0[id*="modal"]>div{width:100%!important;max-width:none!important;max-height:90vh!important;border-radius:30px 30px 0 0!important;animation:fmUp .42s cubic-bezier(.2,.9,.25,1) both;padding-bottom:env(safe-area-inset-bottom);position:relative}.fixed.inset-0[id*="modal"]>div::after{content:"";position:absolute;left:50%;top:7px;width:40px;height:5px;margin-left:-20px;border-radius:9px;background:rgba(148,163,184,.55);pointer-events:none}}',
      '}',

      /* ---------- dock ---------- */
      '#fm-dock{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:45;display:flex;align-items:flex-end;gap:4px;padding:8px 10px;max-width:calc(100vw - 20px);border-radius:30px;background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.04)),rgba(14,16,22,.66);border:1px solid rgba(255,255,255,.16);border-top-color:rgba(255,255,255,.28);box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 26px 56px -18px rgba(0,0,0,.7);-webkit-backdrop-filter:blur(30px) saturate(180%);backdrop-filter:blur(30px) saturate(180%)}',
      '#fm-dock .fm-dk{all:unset;box-sizing:border-box;width:60px;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 0 6px;border-radius:20px;cursor:pointer;color:#e9ebf1;font:600 10.5px/1.1 -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,sans-serif;transition:transform .28s cubic-bezier(.2,.9,.25,1.2),background .2s;-webkit-tap-highlight-color:transparent}',
      '#fm-dock .fm-dk svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}',
      '#fm-dock .fm-dk:hover{background:rgba(255,255,255,.1);transform:translateY(-6px) scale(1.12)}',
      '#fm-dock .fm-dk:active{transform:translateY(-2px) scale(.96)}',
      '#fm-dock .fm-sep{width:1px;align-self:stretch;margin:8px 4px;background:rgba(255,255,255,.14)}',
      'html[data-fm-dock] #fm-gear{display:none!important}',
      '@media(max-width:420px){#fm-dock .fm-dk{width:54px;font-size:10px}#fm-dock{padding:7px 8px;gap:2px}}',
      '@media print{#fm-dock{display:none!important}}',
      /* daftar "Lainnya" */
      '#fm-more{position:fixed;inset:0;z-index:2147481500;display:none;align-items:flex-end;justify-content:center;background:rgba(6,8,14,.4);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}',
      '#fm-more .fm-ms{width:100%;max-width:420px;margin:0 10px calc(96px + env(safe-area-inset-bottom));padding:10px;border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.03)),rgba(16,18,25,.85);border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 40px 80px -30px #000;animation:fmPop .36s cubic-bezier(.2,.9,.25,1.12) both}',
      '#fm-more button{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:12px;width:100%;padding:13px 14px;border-radius:18px;color:#f3f4f6;font:600 14px -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,sans-serif;cursor:pointer}',
      '#fm-more button:hover{background:rgba(255,255,255,.09)}',
      '#fm-more svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}'
    ].join('\n')
  };

  /* ========================= pemasang ========================= */
  var skin = SKINS[ACTIVE] || SKINS['glass-2026'];
  var st = document.createElement('style');
  st.id = 'fm-skin-css'; st.setAttribute('data-skin', ACTIVE);
  st.textContent = skin.css;
  (document.head || document.documentElement).appendChild(st);
  window.FM_SKINS = { active: ACTIVE, list: Object.keys(SKINS) };

  /* ========================= dock ========================= */
  var IC = {
    swap: '<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>',
    tax: '<path d="M3 21h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 3l9 5H3z"/>',
    book: '<path d="M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'
  };
  var MAP = {
    mutasi: ['Mutasi', 'swap'], tax: ['Pajak', 'tax'], ledger: ['Buku Besar', 'book'], closing_history: ['Closing', 'clock'],
    labarugi: ['Laba Rugi', 'chart'], audit_trail: ['Audit', 'shield']
  };
  function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || IC.grid) + '</svg>'; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function buildDock() {
    if (document.getElementById('fm-dock')) return;
    var tiles = [].slice.call(document.querySelectorAll('button[onclick*="openModal("]')).filter(function (b) {
      return b.querySelector('h4') && !b.closest('.fixed');
    });
    if (!tiles.length) return;
    var items = tiles.map(function (b) {
      var m = /openModal\('([^']+)'/.exec(b.getAttribute('onclick') || '');
      var key = m ? m[1] : '';
      var map = MAP[key] || [(b.querySelector('h4').textContent || '').trim(), 'grid'];
      return { label: map[0], icon: map[1], el: b };
    });
    // sembunyikan ubin asli (dan pembungkusnya bila hanya berisi ubin)
    tiles.forEach(function (b) {
      b.classList.add('fm-tile');
      var p = b.parentElement;
      if (p && [].slice.call(p.children).every(function (c) { return c.classList.contains('fm-tile'); })) p.classList.add('fm-tile-wrap');
    });
    items.push({ label: 'Pengaturan', icon: 'gear', fn: function () { var g = document.getElementById('fm-gear'); if (g) g.click(); }, settings: true });

    var dock = document.createElement('div'); dock.id = 'fm-dock'; dock.setAttribute('role', 'toolbar');
    var maxShown = window.innerWidth < 480 ? 5 : 8;
    var shown = items, extra = [];
    if (items.length > maxShown) { shown = items.slice(0, maxShown - 2).concat(items.slice(-1)); extra = items.slice(maxShown - 2, items.length - 1); }
    function act(it) { return function () { if (it.fn) it.fn(); else it.el.click(); }; }
    function btn(it) {
      var b = document.createElement('button'); b.className = 'fm-dk'; b.type = 'button';
      b.innerHTML = svg(it.icon) + '<span>' + esc(it.label) + '</span>'; b.onclick = act(it); return b;
    }
    shown.forEach(function (it, i) {
      if (it.settings && i > 0) { var sp = document.createElement('div'); sp.className = 'fm-sep'; dock.appendChild(sp); }
      if (it.settings && extra.length) {
        var mb = document.createElement('button'); mb.className = 'fm-dk'; mb.type = 'button'; mb.innerHTML = svg('more') + '<span>Lainnya</span>';
        mb.onclick = function () { showMore(extra, act); }; dock.appendChild(mb);
      }
      dock.appendChild(btn(it));
    });
    document.body.appendChild(dock);
    document.documentElement.setAttribute('data-fm-dock', '1');
  }

  function showMore(list, act) {
    var m = document.getElementById('fm-more');
    if (!m) {
      m = document.createElement('div'); m.id = 'fm-more'; m.innerHTML = '<div class="fm-ms"></div>';
      m.addEventListener('click', function (e) { if (e.target === m) m.style.display = 'none'; });
      document.body.appendChild(m);
    }
    var box = m.firstChild; box.innerHTML = '';
    list.forEach(function (it) {
      var b = document.createElement('button'); b.innerHTML = svg(it.icon) + '<span>' + esc(it.label) + '</span>';
      b.onclick = function () { m.style.display = 'none'; act(it)(); }; box.appendChild(b);
    });
    m.style.display = 'flex';
  }

  var TITLES = {
    mutasi: ['Mutasi Kas Sah', 'Daftar struk dan transaksi yang sudah final'], tax: ['Pajak 12%', 'Rekap PPN dari belanja'],
    ledger: ['Buku Besar', 'Rincian per akun'], closing_history: ['Riwayat Closing', 'Catatan penyerahan uang kas'],
    labarugi: ['Laporan Laba Rugi', 'Performa usaha berjalan'], audit_trail: ['Riwayat Audit Manager', 'Jejak koreksi, void, dan perubahan akun'],
    coa_mgmt: ['Kelola Akun & Produk', 'Atur akun COA dan produk toko'], add_cashier_request: ['Buka Kasir Baru', 'Permintaan terminal tambahan'],
    manage_passwords: ['Kelola Password Staf', 'Ubah akses masuk staf'], customize_roles: ['Ubah Nama Peran', 'Sesuaikan sebutan peran']
  };
  function wrapOpenModal() {
    var orig = window.openModal; if (typeof orig !== 'function' || orig.__fmWrapped) return;
    var w = function (type) {
      var r = orig.apply(this, arguments);
      var t = TITLES[type], h = document.getElementById('modal-title'), sub = document.getElementById('modal-subtitle');
      if (t && h) { h.textContent = t[0]; if (sub) sub.textContent = t[1]; }
      return r;
    };
    w.__fmWrapped = true; window.openModal = w;
  }
  function init() { try { wrapOpenModal(); buildDock(); } catch (e) { console.warn('dock', e); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
  else setTimeout(init, 0);
})();
