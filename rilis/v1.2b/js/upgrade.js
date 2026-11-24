/* upgrade.js — Upgrade paket (v1.2b): kartu Plus/Pro, flyer manfaat, coba gratis 24 jam, dan pengajuan paket lewat QRIS.
   - Dipakai di Kasir, Manager, dan Owner. Kasir boleh melihat flyer dan mencoba, tetapi tidak bisa berlangganan.
   - Semua catatan ditulis sebagai tiket provider_tickets bertipe 'upgrade' (jalur yang sama dengan OneilStore, aturan Firestore tidak diubah).
       kind 'coba' : coba gratis 24 jam, SEKALI per paket per toko (id tiket tetap: coba_<toko>_<paket>)
       kind 'beli' : pengajuan berlangganan. Aktif sementara 24 jam sejak klien menekan, lalu Tower mengonfirmasi (status AKTIF + activeUntil)
                     atau mematikannya (MATI) atau menolak (DITOLAK). Tanpa konfirmasi, otomatis kembali setelah 24 jam.
   - Paket efektif dihitung di sini (FM_UPG.tier) dan dibaca plans.js. Hanya MENAMBAH fitur; data toko tidak pernah disentuh.
   - Nomor WhatsApp, gambar QRIS, dan harga diatur Tower di app_meta/upgrade_cfg (dibaca tanpa login, seperti paket_catalog). */
(function () {
  'use strict';
  var PAGE = (location.pathname.split('/').pop() || '').toLowerCase();
  if (!/^(kasir|manager|dashboard)\.html$/.test(PAGE)) return;
  var ROLE = PAGE === 'kasir.html' ? 'kasir' : PAGE === 'manager.html' ? 'manager' : 'owner';
  var CAN_BUY = ROLE !== 'kasir';
  var DAY = 86400000;
  var RANK = { basic: 0, plus: 1, pro: 2 };
  var NAME = { plus: 'Plus', pro: 'Pro' };
  var DEF = { plus: { bulan: 149000, tahun: 1490000 }, pro: { bulan: 249000, tahun: 2490000 } };
  var P = function () { return window.FM_PLANS || null; };
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : 'default'; }
  function hasDb() { return typeof db !== 'undefined' && db && tid() !== 'default'; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rp(n) { return 'Rp' + Number(n || 0).toLocaleString('id-ID'); }
  function actor() { try { return (typeof user !== 'undefined' && user && (user.title || user.name)) || ''; } catch (e) { return ''; } }
  function ver() { try { return (window.FM_THEME && FM_THEME.version) || ''; } catch (e) { return ''; } }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---------- data: tiket + pengaturan ---------- */
  var KT = function () { return 'fm_upg_t_' + tid(); };
  var T = null, started = false, cfg = jget('fm_upg_cfg', {}) || {}, loadedSig = null;
  function tickets() { if (T !== null) return T; var a = jget(KT(), []); if (tid() !== 'default') T = a; return a; }
  function untilOf(t) {
    if (!t || t.status === 'MATI' || t.status === 'DITOLAK' || t.status === 'SELESAI') return 0;
    if (t.kind === 'beli' && t.status === 'AKTIF') return Number(t.activeUntil) || 0;
    return Number(t.until) || 0;
  }
  function best(list) { var b = ''; list.forEach(function (t) { if (RANK[t.tier] > (RANK[b] || 0)) b = t.tier; }); return b; }
  function activeList(now) { now = now || Date.now(); return tickets().filter(function (t) { return untilOf(t) > now; }); }
  function tier() { return best(activeList()); }                                   /* paket tambahan yang sedang berjalan (coba / sementara / lunas) */
  function ever() { return best(tickets().filter(function (t) { return t.status !== 'DITOLAK'; })); } /* paket tertinggi yang pernah dipakai (untuk gembok setelah habis) */
  function paidTier() { var b = best(activeList().filter(function (t) { return t.kind === 'beli' && t.status === 'AKTIF'; })), base = 'basic'; try { base = P().tierOf(tn()); } catch (e) {} return RANK[b] > RANK[base] ? b : base; }
  function trialUsed(t) { return tickets().some(function (x) { return x.kind === 'coba' && x.tier === t; }); }
  function pending() { return tickets().filter(function (t) { return t.kind === 'beli' && t.status === 'BARU' && untilOf(t) > Date.now(); })[0] || null; }
  function sig() { return tier() + '|' + ever(); }
  function price(t, per) { var c = cfg.harga && cfg.harga[t] && Number(cfg.harga[t][per]); return c > 0 ? c : DEF[t][per]; }

  function start() {
    if (started || !hasDb()) return; started = true;
    try {
      db.collection('provider_tickets').where('tenantId', '==', tid()).where('type', '==', 'upgrade').onSnapshot(function (s) {
        var a = []; s.forEach(function (d) { var x = d.data(); x.docId = d.id; a.push(x); });
        a.sort(function (x, y) { return (y.timestamp || 0) - (x.timestamp || 0); });
        T = a; jset(KT(), a); changed(); render();
      }, function () {});
    } catch (e) {}
  }
  function fetchCfg() {
    try {
      var url = 'https://firestore.googleapis.com/v1/projects/finance-ai-master-byneilverse/databases/(default)/documents/app_meta/upgrade_cfg?key=AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI';
      fetch(url, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (d && d.fields && d.fields.json && d.fields.json.stringValue) { var j = JSON.parse(d.fields.json.stringValue); if (j && typeof j === 'object') { cfg = j; jset('fm_upg_cfg', j); render(); } }
      }).catch(function () {});
    } catch (e) {}
  }

  /* ---------- konten flyer: diambil otomatis dari Atur Isi Paket ---------- */
  function flyerRows(t) {
    var p = P(); if (!p || !p.paketFeatures || !p.STORE) return [];
    var hi = p.paketFeatures(t), lo = p.paketFeatures(t === 'pro' ? 'plus' : 'basic'), out = [];
    p.STORE.features().forEach(function (r) {
      var a = hi[r.key], b = lo[r.key] || {}; if (!a) return;
      var add = ['kasir', 'manager', 'owner'].some(function (ro) { return a[ro] === true && b[ro] !== true; });
      if (add) out.push(r);
    });
    return out;
  }

  /* ---------- tampilan ---------- */
  var ov = null, S = { v: 'home', tier: 'plus', per: 'bulan', note: '', busy: false };
  var F = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif';
  var GOLD = '#e5c373';
  function css() {
    if (document.getElementById('fm-upg-css')) return;
    var s = document.createElement('style'); s.id = 'fm-upg-css';
    s.textContent =
      '#fm-upg{position:fixed;inset:0;z-index:2147482800;display:none;align-items:center;justify-content:center;padding:12px;background:rgba(0,0,0,.62);font-family:' + F + '}' +
      '#fm-upg .u-box{width:100%;max-width:440px;max-height:92vh;overflow:auto;background:#141416;color:#f3f4f6;border:1px solid #2a2a2e;border-radius:26px;padding:20px;box-shadow:0 30px 80px rgba(0,0,0,.6)}' +
      '#fm-upg h2{margin:0;font-size:19px;font-weight:900;letter-spacing:-.01em}' +
      '#fm-upg .u-sub{font-size:12.5px;color:#a1a1aa;margin-top:3px;line-height:1.5}' +
      '#fm-upg .u-x{border:0;background:#25252a;color:#d4d4d8;width:32px;height:32px;border-radius:50%;font-size:16px;cursor:pointer}' +
      '#fm-upg{--cw:min(80vw,284px,calc((100vh - 250px)*.6))}#fm-upg .u-box.wide{max-width:calc(var(--cw)*2 + 18px + 42px)}' +
      '#fm-upg .u-box{scrollbar-width:none;-ms-overflow-style:none}#fm-upg .u-box::-webkit-scrollbar{display:none}' +
      'html body #fm-upg#fm-upg#fm-upg{filter:none!important}' +
      'html body #fm-upg#fm-upg#fm-upg.si{filter:invert(1) hue-rotate(180deg)!important}' +
      '#fm-upg.lt img.u-qr{filter:invert(1) hue-rotate(180deg)}' +
      '#fm-upg .u-cards{display:flex;gap:18px;margin:18px -20px 4px;padding:8px 20px 18px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;perspective:1100px}' +
      '#fm-upg .u-cards::-webkit-scrollbar{display:none}#fm-upg .u-card:first-child{margin-left:auto}#fm-upg .u-card:last-child{margin-right:auto}' +
      '#fm-upg .u-card{all:unset;box-sizing:border-box;flex:0 0 var(--cw);aspect-ratio:5/8.8;scroll-snap-align:center;border-radius:24px;cursor:pointer;position:relative;overflow:hidden;display:flex;flex-direction:column;padding:20px 20px 16px;color:#fff;font-family:' + F + ';--mx:30%;--my:10%;--rx:0deg;--ry:0deg;background:linear-gradient(155deg,#26262b 0%,#0a0a0c 38%,#000 70%,#16161a 100%);box-shadow:0 26px 50px rgba(0,0,0,.7),inset 0 0 0 1px #3a3a41,inset 0 1px 0 rgba(255,255,255,.16);transform:rotateX(var(--rx)) rotateY(var(--ry));transition:transform .25s ease-out}' +
      '#fm-upg .u-card.pro{background:linear-gradient(155deg,#3a2c12 0%,#14100a 36%,#000 68%,#241b0b 100%);box-shadow:0 26px 50px rgba(0,0,0,.7),0 0 0 1px #6f5320,0 0 0 3px #000,0 0 0 4.5px #e5c373,0 0 28px rgba(229,195,115,.28),inset 0 1px 0 rgba(255,232,170,.45)}' +
      '#fm-upg .u-foil{position:absolute;inset:0;pointer-events:none;background:radial-gradient(260px 200px at var(--mx) var(--my),rgba(255,255,255,.2),transparent 62%);mix-blend-mode:screen}' +
      '#fm-upg .pro .u-foil{background:radial-gradient(280px 220px at var(--mx) var(--my),rgba(255,226,150,.38),transparent 62%)}' +
      '#fm-upg .u-card::after{content:"";position:absolute;top:-30%;left:-70%;width:38%;height:160%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.18),transparent);transform:rotate(12deg);animation:fmUpgSheen 1.8s ease-out 1 .35s both;pointer-events:none}' +
      '@keyframes fmUpgSheen{from{left:-70%}to{left:150%}}' +
      '@media (prefers-reduced-motion:reduce){#fm-upg .u-card::after{animation:none;opacity:0}#fm-upg-chip::after{animation:none!important}#fm-upg .u-card{transition:none;transform:none}}' +
      '#fm-upg .u-card:active{filter:brightness(1.1)}#fm-upg .u-card:focus-visible{outline:2px solid #fff;outline-offset:4px}' +
      '#fm-upg .u-wm{position:absolute;right:-48px;bottom:60px;width:250px;height:250px;opacity:.06;pointer-events:none}' +
      '#fm-upg .pro .u-wm{opacity:.1}' +
      '#fm-upg .u-top{display:flex;justify-content:space-between;align-items:center;position:relative}' +
      '#fm-upg .u-lg{display:flex;align-items:center;gap:8px;font-size:10px;font-weight:700;letter-spacing:.3em;color:#a3a3ab}' +
      '#fm-upg .pro .u-lg{color:#d9b866}' +
      '#fm-upg .u-nfc{opacity:.6}' +
      '#fm-upg .u-nm{display:flex;align-items:baseline;gap:10px;font-family:Didot,"Bodoni 72","Playfair Display",Georgia,serif;font-size:50px;line-height:1;font-weight:700;margin-top:20px;position:relative;color:#f4f4f5}' +
      '#fm-upg .u-nm i{font-style:normal;display:inline-block;transform:skewX(-14deg);font-family:' + F + ';font-size:34px;font-weight:800;margin-left:-4px}' +
      '#fm-upg .pro .u-nm{background:linear-gradient(120deg,#f8e7b0,#d4a94f 42%,#fff2c8 58%,#c49a45);-webkit-background-clip:text;background-clip:text;color:transparent}' +
      '#fm-upg .u-pl{display:inline-block;transform:skewX(-14deg);font-size:15px;font-weight:800;letter-spacing:0;margin-left:-4px;color:#fff}' +
      '#fm-upg .u-pp{font-size:8.5px;font-weight:800;letter-spacing:.14em;padding:3px 6px 2px;border-radius:4px;background:#17140c;color:#cda75c;box-shadow:inset 0 0 0 1px rgba(205,167,92,.5);margin-left:-2px}' +
      '#fm-upg .plus .u-vip{background:linear-gradient(135deg,#fff,#c9c9d0);color:#000;font-size:18px;letter-spacing:0;padding:3px 10px;font-family:' + F + '}' +
      '#fm-upg .u-vip{font-size:9.5px;font-weight:800;letter-spacing:.22em;padding:4px 8px;border-radius:5px;background:linear-gradient(135deg,#f6e0a0,#c49a45);color:#1a1405;align-self:center;font-family:' + F + '}' +
      '#fm-upg .u-tl{display:block;font-size:11.5px;color:#9a9aa3;margin-top:6px;letter-spacing:.03em;position:relative}' +
      '#fm-upg .pro .u-tl{color:#c9ab6a}' +
      '#fm-upg .u-ben{list-style:none;margin:16px 0 0;padding:14px 0 0;border-top:1px solid rgba(255,255,255,.12);display:flex;flex-direction:column;gap:9px;position:relative;flex:1;min-height:0;overflow:hidden}' +
      '#fm-upg .pro .u-ben{border-color:rgba(229,195,115,.32)}' +
      '#fm-upg .u-ben li{display:flex;gap:10px;align-items:center;font-size:12.5px;line-height:1.3;font-weight:600;color:#ececef}' +
      '#fm-upg .u-ben li svg{flex:0 0 auto}#fm-upg .u-bn{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}' +
      '#fm-upg .u-ben li.more{color:#8b8b93;font-weight:500;padding-left:20px}' +
      '#fm-upg .pro .u-ben li.more{color:#b8924a}' +
      '#fm-upg .u-foot{position:relative;display:flex;flex-direction:column;gap:9px;margin-top:10px}' +
      '#fm-upg .u-pr{display:flex;align-items:baseline;gap:6px;font-size:10.5px;color:#9a9aa3}#fm-upg .u-pr b{font-size:21px;color:#fff;letter-spacing:-.01em}' +
      '#fm-upg .pro .u-pr b{color:#f1d58a}' +
      '#fm-upg .u-tag{display:block;text-align:center;font-size:11.5px;font-weight:800;padding:9px 10px;border-radius:99px;background:#fff;color:#000;white-space:nowrap}' +
      '#fm-upg .pro .u-tag{background:linear-gradient(135deg,#f6e0a0,#c49a45);color:#1a1405}' +
      '#fm-upg .u-hold{position:relative;margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.1);display:flex;justify-content:space-between;gap:8px;font-size:9px;letter-spacing:.18em;color:#7d7d86;font-weight:700;text-transform:uppercase}' +
      '#fm-upg .pro .u-hold{border-color:rgba(229,195,115,.25);color:#a8884a}' +
      '#fm-upg .u-hold span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#d4d4d8;max-width:62%}#fm-upg .pro .u-hold span:last-child{color:#e8cd8c}' +
      '#fm-upg .u-b{all:unset;box-sizing:border-box;display:block;width:100%;text-align:center;padding:13px;border-radius:14px;font-size:14px;font-weight:800;cursor:pointer;margin-top:10px;background:#25252a;color:#f3f4f6}' +
      '#fm-upg .u-b.main{background:#fff;color:#000}' +
      '#fm-upg .u-b.gold{background:linear-gradient(135deg,#f1d58a,#c49a45);color:#1a1405}' +
      '#fm-upg .u-b[disabled],#fm-upg .u-b.off{opacity:.45;cursor:not-allowed}' +
      '#fm-upg .u-b:focus-visible{outline:2px solid ' + GOLD + ';outline-offset:2px}' +
      '#fm-upg .u-row{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-top:1px solid #25252a}' +
      '#fm-upg .u-row b{display:block;font-size:13px;font-weight:700}' +
      '#fm-upg .u-row span{display:block;font-size:11.5px;color:#a1a1aa;margin-top:1px;line-height:1.45}' +
      '#fm-upg .u-grp{font-size:11.5px;font-weight:800;color:#a1a1aa;margin:14px 0 2px}' +
      '#fm-upg .u-per{all:unset;box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;width:100%;padding:14px;border-radius:16px;border:1.5px solid #2c2c30;margin-top:10px;cursor:pointer}' +
      '#fm-upg .u-per.on{border-color:#fff;background:#1b1b1f}' +
      '#fm-upg .u-per.on.gold{border-color:' + GOLD + '}' +
      '#fm-upg .u-note{margin-top:12px;padding:10px 12px;border-radius:12px;background:#1f1f23;font-size:12px;line-height:1.55;color:#d4d4d8}' +
      '#fm-upg .u-warn{background:#2a1f10;color:#f3c98b}' +
      '#fm-upg img.u-qr{display:block;width:100%;max-width:260px;margin:14px auto 0;border-radius:14px;background:#fff;padding:10px}' +
      '#fm-upg .u-dots{display:flex;gap:6px;justify-content:center;margin:2px 0 12px}#fm-upg .u-dots i{width:22px;height:4px;border-radius:9px;background:#2c2c30}#fm-upg .u-dots i.on{background:#fff}' +
      '#fm-upg-chip#fm-upg-chip{all:unset;box-sizing:border-box;cursor:pointer;position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 13px 0 10px;border-radius:999px;font:800 12px/1 ' + F + ';letter-spacing:.02em;white-space:nowrap;background:#0a0a0c!important;color:#f1d58a!important;box-shadow:inset 0 0 0 1px rgba(229,195,115,.7)!important;vertical-align:middle}' +
      '#fm-upg-chip#fm-upg-chip::after{content:"";position:absolute;top:0;bottom:0;left:-40%;width:30%;background:linear-gradient(100deg,transparent,rgba(255,236,180,.45),transparent);transform:skewX(-20deg);animation:fmUpgChip 7s ease-in-out infinite}' +
      '#fm-upg-chip#fm-upg-chip.act{background:#052e16!important;color:#bbf7d0!important;box-shadow:inset 0 0 0 1px rgba(134,239,172,.6)!important}' +
      '#fm-upg-chip#fm-upg-chip.act::after{display:none}' +
      '@keyframes fmUpgChip{0%,70%{left:-40%}100%{left:130%}}' +
      '#fm-upg-chip:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
      '#fm-upg-bar{position:fixed;left:50%;transform:translateX(-50%);bottom:14px;z-index:2147482700;display:flex;gap:10px;align-items:center;padding:10px 14px;border-radius:16px;background:#050505;color:#fff;font:700 12.5px ' + F + ';box-shadow:0 10px 30px rgba(0,0,0,.5),inset 0 0 0 1px #3a3a40;max-width:92vw}' +
      '#fm-upg-bar button{all:unset;cursor:pointer;padding:7px 12px;border-radius:99px;background:#fff;color:#000;font-weight:800;font-size:12px}';
    document.head.appendChild(s);
  }
  var ICON = {
    plus: '<svg class="u-ico" width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"><path d="M12 4v16M4 12h16"/></svg>',
    pro: '<svg class="u-ico" width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="' + GOLD + '" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2.5l2.6 6.4 6.9.5-5.3 4.5 1.7 6.7L12 17l-5.9 3.6 1.7-6.7L2.5 9.4l6.9-.5z"/></svg>'
  };
  function leftText(ms) { var m = Math.max(1, Math.ceil((ms - Date.now()) / 60000)); return m >= 120 ? Math.ceil(m / 60) + ' jam' : m >= 60 ? '1 jam' : m + ' menit'; }
  function dstr(ms) { try { return new Date(ms).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
  function visibleTiers() { var b = paidTier(); return ['plus', 'pro'].filter(function (t) { return RANK[t] > RANK[b]; }); }
  function activeOf(t) { return activeList().filter(function (x) { return x.tier === t; })[0] || null; }

  var TICK = function (c) { return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'; };
  function logoSvg(px, c) { try { return window.FM_LOGO ? FM_LOGO.mark(px, { tile: false, color: c }) : ''; } catch (e) { return ''; } }
  function cardHtml(t) {
    var a = activeOf(t), tag = a ? (a.kind === 'coba' ? 'Coba · ' + leftText(untilOf(a)) : 'Aktif') : (trialUsed(t) ? 'Lihat isi' : 'Coba gratis 24 jam');
    var rows = flyerRows(t), col = t === 'pro' ? GOLD : '#fff', max = t === 'pro' ? 4 : 5, mk = t === 'pro' ? '#e5c373' : '#ffffff', tt = tn();
    var li = rows.slice(0, max).map(function (r) { return '<li>' + TICK(col) + '<span class="u-bn">' + esc(r.name) + '</span></li>'; }).join('');
    if (!rows.length) li = '<li class="more"><span>Daftar manfaat sedang disiapkan</span></li>';
    if (rows.length > max) li += '<li class="more"><span>+ ' + (rows.length - max) + ' fitur lainnya</span></li>';
    if (t === 'pro' && rows.length) li = '<li>' + TICK(col) + '<span><b>Semua isi Plus</b></span></li>' + li;
    return '<button class="u-card ' + t + '" data-t="' + t + '" aria-label="Paket ' + NAME[t] + '"><span class="u-foil"></span><span class="u-wm">' + logoSvg(250, mk) + '</span>' +
      '<span class="u-top"><span class="u-lg">' + logoSvg(22, mk) + 'ONEILVERSE' + (t === 'plus' ? '<b class="u-pl">+</b>' : '<b class="u-pp">PRO</b>') + '</span><svg class="u-nfc" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="' + mk + '" stroke-width="1.7" stroke-linecap="round"><path d="M8 7.5a6.5 6.5 0 0 1 0 9M12 5a10 10 0 0 1 0 14M16 2.5a13.5 13.5 0 0 1 0 19"/></svg></span>' +
      '<span class="u-nm">' + NAME[t] + '<span class="u-vip">' + (t === 'plus' ? '+' : 'PRO') + '</span></span><span class="u-tl">' + (t === 'pro' ? 'Akses penuh, tanpa batas' : 'Naik kelas untuk usaha Anda') + '</span>' +
      '<ul class="u-ben">' + li + '</ul>' +
      '<span class="u-foot"><span class="u-pr"><b>' + rp(price(t, 'bulan')) + '</b>per bulan</span><span class="u-tag">' + esc(tag) + '</span></span>' +
      '<span class="u-hold"><span>Pemegang kartu</span><span>' + esc((tt && tt.nama) || tid()) + '</span></span></button>';
  }
  function head(title, sub, back) {
    return '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:4px"><div style="display:flex;gap:10px;align-items:flex-start">' +
      (back ? '<button class="u-x" data-go="' + back + '" aria-label="Kembali">&#8592;</button>' : '') + '<div><h2>' + title + '</h2>' + (sub ? '<div class="u-sub">' + sub + '</div>' : '') + '</div></div><button class="u-x" data-x aria-label="Tutup">&#10005;</button></div>';
  }
  function vHome() {
    var vt = visibleTiers(), pend = pending();
    var h = head('Tingkatkan toko Anda', 'Geser dan tekan kartu untuk melihat semua isi paket. Coba gratis 24 jam, sekali untuk tiap paket.');
    if (pend) h += '<div class="u-note u-warn">Paket ' + NAME[pend.tier] + ' aktif. Pembayaran sedang diverifikasi.</div>';
    h += vt.length ? '<div class="u-cards">' + vt.map(cardHtml).join('') + '</div>' : '<div class="u-note">Toko ini sudah memakai paket tertinggi.</div>';
    return h;
  }
  function vFlyer() {
    var t = S.tier, rows = flyerRows(t), a = activeOf(t), pend = pending(), h = head('Paket ' + NAME[t], t === 'pro' ? 'Semua isi Plus, ditambah yang di bawah ini.' : 'Tambahan dari paket Basic.', 'home');
    if (!rows.length) h += '<div class="u-note">Daftar manfaat paket ini sedang disiapkan.</div>';
    var by = {}, order = []; rows.forEach(function (r) { if (!by[r.grp]) { by[r.grp] = []; order.push(r.grp); } by[r.grp].push(r); });
    order.forEach(function (g) { h += '<div class="u-grp">' + esc(g) + '</div>'; by[g].forEach(function (r) { h += '<div class="u-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + (t === 'pro' ? GOLD : '#fff') + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto;margin-top:2px"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><div><b>' + esc(r.name) + '</b>' + (r.d ? '<span>' + esc(r.d) + '</span>' : '') + '</div></div>'; }); });
    h += '<div class="u-note" style="margin-top:14px">Mulai ' + rp(price(t, 'bulan')) + ' / bulan, atau ' + rp(price(t, 'tahun')) + ' / tahun (bayar 10 bulan, gratis 2 bulan).</div>';
    if (S.note) h += '<div class="u-note u-warn">' + esc(S.note) + '</div>';
    if (a) h += '<div class="u-note">' + (a.kind === 'coba' ? 'Masa coba berjalan, sisa ' + leftText(untilOf(a)) + '.' : (a.status === 'AKTIF' ? 'Paket aktif sampai ' + esc(dstr(untilOf(a))) + '.' : 'Paket aktif. Pembayaran sedang diverifikasi.')) + '</div>';
    else if (!trialUsed(t)) h += '<button class="u-b ' + (t === 'pro' ? 'gold' : 'main') + '" data-a="trial">Coba gratis 24 jam</button>';
    else h += '<div class="u-sub" style="margin-top:10px;text-align:center">Masa coba paket ini sudah dipakai.</div>';
    if (!CAN_BUY) h += '<button class="u-b off" disabled>Berlangganan lewat Manager atau Owner</button>';
    else if (pend) h += '<button class="u-b off" disabled>Menunggu konfirmasi pengajuan</button>';
    else h += '<button class="u-b ' + (a ? (t === 'pro' ? 'gold' : 'main') : '') + '" data-go="dur">Berlangganan ' + NAME[t] + '</button>';
    return h;
  }
  function vDur() {
    var t = S.tier, h = head('Pilih lama langganan', 'Paket ' + NAME[t], 'flyer');
    ['bulan', 'tahun'].forEach(function (p) {
      h += '<button class="u-per ' + (S.per === p ? 'on ' : '') + (t === 'pro' ? 'gold' : '') + '" data-per="' + p + '"><span><b style="font-size:14px">' + (p === 'bulan' ? '1 bulan' : '1 tahun') + '</b>' + (p === 'tahun' ? '<span style="display:block;font-size:11.5px;color:#a1a1aa;margin-top:2px">Bayar 10 bulan, gratis 2 bulan</span>' : '') + '</span><b style="font-size:15px">' + rp(price(t, p)) + '</b></button>';
    });
    var ready = cfg.wa && cfg.qris;
    if (!ready) h += '<div class="u-note u-warn">Pembayaran belum dibuka. Hubungi penyedia aplikasi.</div>';
    h += '<button class="u-b ' + (t === 'pro' ? 'gold' : 'main') + (ready ? '' : ' off') + '" ' + (ready ? '' : 'disabled ') + 'data-go="pay">Lanjut bayar</button>';
    return h;
  }
  function waLink() {
    var n = String(cfg.wa || '').replace(/\D/g, ''); if (n.charAt(0) === '0') n = '62' + n.slice(1);
    var t = tn(), txt = 'Halo, saya kirim bukti transfer upgrade ' + NAME[S.tier] + ' (' + (S.per === 'tahun' ? '1 tahun' : '1 bulan') + ') ' + rp(price(S.tier, S.per)) + ' untuk toko ' + ((t && t.nama) || tid()) + ' (ID ' + tid() + ').';
    return 'https://wa.me/' + n + '?text=' + encodeURIComponent(txt);
  }
  function vPay() {
    var t = S.tier, h = head('Bayar dengan QRIS', NAME[t] + ' · ' + (S.per === 'tahun' ? '1 tahun' : '1 bulan'), 'dur');
    h += '<div style="text-align:center;margin-top:12px"><div style="font-size:12px;color:#a1a1aa">Nominal</div><div style="font-size:26px;font-weight:900;letter-spacing:-.01em">' + rp(price(t, S.per)) + '</div></div>';
    h += '<img class="u-qr" src="' + esc(cfg.qris) + '" alt="Kode QRIS">';
    h += '<div class="u-note"><b>1.</b> Scan QRIS dan bayar sesuai nominal.<br><b>2.</b> Kirim bukti transfer ke WhatsApp ' + esc(cfg.wa) + '.<br><b>3.</b> Kembali ke sini dan tekan Sudah Kirim.</div>';
    h += '<a class="u-b" style="text-decoration:none" href="' + esc(waLink()) + '" target="_blank" rel="noopener">Buka WhatsApp</a><button class="u-b ' + (t === 'pro' ? 'gold' : 'main') + '" data-go="c1">Sudah Kirim</button>';
    return h;
  }
  var CONF = [
    ['Sudah membayar?', 'Pastikan pembayaran QRIS sudah berhasil dan nominalnya sesuai ', 'Ya, sudah bayar'],
    ['Bukti sudah dikirim?', 'Bukti transfer sudah dikirim ke WhatsApp penyedia aplikasi. Tanpa bukti, pengajuan tidak bisa dikonfirmasi.', 'Ya, aktifkan paket']
  ];
  function vConf(i) {
    var c = CONF[i], dots = '<div class="u-dots">' + [0, 1].map(function (k) { return '<i class="' + (k <= i ? 'on' : '') + '"></i>'; }).join('') + '</div>';
    return head(c[0], '', i === 0 ? 'pay' : 'c' + i) + dots + '<div class="u-note" style="margin-top:0">' + esc(c[1]) + (i === 0 ? '<b>' + rp(price(S.tier, S.per)) + '</b>.' : '') + '</div>' +
      (S.note ? '<div class="u-note u-warn">' + esc(S.note) + '</div>' : '') + '<button class="u-b ' + (S.tier === 'pro' ? 'gold' : 'main') + '" ' + (S.busy ? 'disabled ' : '') + 'data-go="' + (i < 1 ? 'c2' : 'send') + '">' + (S.busy ? 'Mengirim...' : c[2]) + '</button><button class="u-b" data-go="pay">Batal</button>';
  }
  function vTrial() {
    return head('Mulai coba ' + NAME[S.tier] + '?', '', 'flyer') + '<div class="u-note" style="margin-top:12px">Paket ' + NAME[S.tier] + ' aktif 24 jam sejak sekarang. Masa coba hanya sekali untuk tiap paket di toko ini.</div>' +
      (S.note ? '<div class="u-note u-warn">' + esc(S.note) + '</div>' : '') + '<button class="u-b ' + (S.tier === 'pro' ? 'gold' : 'main') + '" ' + (S.busy ? 'disabled ' : '') + 'data-a="trialgo">' + (S.busy ? 'Memulai...' : 'Mulai coba 24 jam') + '</button><button class="u-b" data-go="flyer">Batal</button>';
  }
  function vDone() {
    return head(S.done === 'coba' ? 'Masa coba dimulai' : 'Paket aktif', '') + '<div class="u-note" style="margin-top:12px">' + (S.done === 'coba' ? 'Paket ' + NAME[S.tier] + ' aktif 24 jam. Muat ulang halaman supaya semua fitur terbuka.' : 'Paket ' + NAME[S.tier] + ' sudah aktif. Terima kasih. Muat ulang halaman supaya semua fitur terbuka.') + '</div><button class="u-b ' + (S.tier === 'pro' ? 'gold' : 'main') + '" data-a="reload">Muat ulang sekarang</button>';
  }
  /* Tema ikut halaman: terang atau gelap. Sebagian halaman dibalik warnanya oleh pembungkusnya, jadi jumlah pembalikan di atas popup dihitung dulu. */
  function isLight() { return document.documentElement.getAttribute('data-fm-gelap') !== '1'; }
  function ancInv() { var n = 0, e = ov.parentElement; while (e) { try { if (/invert/.test(getComputedStyle(e).filter)) n++; } catch (x) {} e = e.parentElement; } return n % 2; }
  function render() {
    if (!ov || ov.style.display === 'none') { chip(); return; }
    var lt = isLight(); ov.className = ((lt ? 1 : 0) ^ ancInv() ? 'si ' : '') + (lt ? 'lt' : '');
    var v = S.v, h = v === 'flyer' ? vFlyer() : v === 'dur' ? vDur() : v === 'pay' ? vPay() : v === 'c1' ? vConf(0) : v === 'c2' ? vConf(1) : v === 'c3' ? vConf(2) : v === 'trial' ? vTrial() : v === 'done' ? vDone() : vHome();
    var box = ov.firstChild, top = box ? box.scrollTop : 0;
    ov.innerHTML = '<div class="u-box' + (v === 'home' ? ' wide' : '') + '" role="dialog" aria-modal="true">' + h + '</div>';
    if (top && ov.firstChild) ov.firstChild.scrollTop = top;
    chip();
  }

  /* ---------- aksi ---------- */
  function base(t) {
    var now = Date.now(), tt = tn();
    return { type: 'upgrade', tier: t, tenantId: tid(), tenantName: (tt && tt.nama) || tid(), requestedBy: actor(), role: ROLE, page: PAGE, ver: ver(), requestedAt: new Date().toLocaleString('id-ID'), timestamp: now, pressedAt: now, until: now + DAY };
  }
  function addLocal(x) { var a = tickets().filter(function (y) { return y.id !== x.id && y.docId !== x.id; }); a.unshift(x); T = a; jset(KT(), a); }
  function fail(e) { S.busy = false; S.note = 'Gagal terkirim: ' + (e && e.message || e || 'periksa internet'); render(); }
  function trial() {
    if (!hasDb()) { S.note = 'Tidak bisa terhubung sekarang. Periksa internet atau login ulang.'; S.v = 'flyer'; return render(); }
    var t = S.tier; S.busy = true; render();
    var id = 'coba_' + tid() + '_' + t, ref = db.collection('provider_tickets').doc(id);
    ref.get().then(function (d) {
      if (d.exists || trialUsed(t)) { S.busy = false; S.note = 'Masa coba paket ini sudah pernah dipakai.'; S.v = 'flyer'; return render(); }
      var x = base(t); x.id = id; x.kind = 'coba'; x.status = 'COBA';
      return ref.set(x).then(function () { S.busy = false; S.v = 'done'; S.done = 'coba'; addLocal(x); render(); });
    }).catch(fail);
  }
  function send() {
    if (!CAN_BUY) return;
    if (!hasDb()) { S.note = 'Tidak bisa terhubung sekarang. Periksa internet atau login ulang.'; S.v = 'c2'; return render(); }
    if (pending()) { S.note = 'Masih ada pengajuan yang menunggu konfirmasi.'; S.v = 'c2'; return render(); }
    var t = S.tier, now = Date.now(), x = base(t); x.id = 'upg_' + now; x.kind = 'beli'; x.status = 'BARU'; x.period = S.per; x.months = S.per === 'tahun' ? 12 : 1; x.price = price(t, S.per); x.acks = 3;
    S.busy = true; render();
    db.collection('provider_tickets').doc(x.id).set(x).then(function () { S.busy = false; S.v = 'done'; S.done = 'beli'; addLocal(x); render(); }).catch(fail);
  }
  function tilt(e) {
    var c = e.target.closest && e.target.closest('.u-card'); if (!c || e.pointerType === 'touch') return;
    var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.setProperty('--ry', ((x - .5) * 12).toFixed(1) + 'deg'); c.style.setProperty('--rx', ((.5 - y) * 10).toFixed(1) + 'deg');
    c.style.setProperty('--mx', (x * 100).toFixed(0) + '%'); c.style.setProperty('--my', (y * 100).toFixed(0) + '%');
  }
  function onClick(e) {
    if (e.target === ov || e.target.closest('[data-x]')) { ov.style.display = 'none'; chip(); return; }
    var c = e.target.closest('[data-t]'); if (c) { S.tier = c.getAttribute('data-t'); S.v = 'flyer'; S.note = ''; return render(); }
    var pr = e.target.closest('[data-per]'); if (pr) { S.per = pr.getAttribute('data-per'); return render(); }
    var g = e.target.closest('[data-go]'); if (g && !g.disabled) { var v = g.getAttribute('data-go'); S.note = ''; if (v === 'send') return send(); S.v = v; return render(); }
    var a = e.target.closest('[data-a]'); if (!a) return; var k = a.getAttribute('data-a');
    if (k === 'trial') { S.v = 'trial'; S.note = ''; render(); } else if (k === 'trialgo') trial(); else if (k === 'reload') location.reload();
  }
  function open(t) {
    css(); if (!ov) { ov = document.createElement('div'); ov.id = 'fm-upg'; ov.addEventListener('click', onClick); ov.addEventListener('pointermove', tilt); ov.addEventListener('pointerleave', function () { [].forEach.call(ov.querySelectorAll('.u-card'), function (c) { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); }); }); document.body.appendChild(ov); }
    start(); fetchCfg(); try { if (P() && P().fetchPaketCat) P().fetchPaketCat(function () { render(); }); } catch (e) {}
    var vt = visibleTiers(); S.note = ''; S.busy = false;
    if (t && vt.indexOf(t) >= 0) { S.tier = t; S.v = 'flyer'; } else S.v = 'home';
    ov.style.display = 'flex'; render();
  }
  /* dipanggil plans.js saat tombol terkunci ditekan: buka flyer paket yang pernah dipakai */
  function openLocked() { var e = ever(); if (!e || !visibleTiers().length) return false; open(visibleTiers().indexOf(e) >= 0 ? e : visibleTiers()[0]); return true; }

  /* ---------- tombol di header + pita muat ulang ---------- */
  function chip() {
    var el = document.getElementById('fm-upg-chip'), vt = visibleTiers(), a = activeList().sort(function (x, y) { return RANK[y.tier] - RANK[x.tier]; })[0];
    if (!vt.length && !a) { if (el) el.remove(); return; }
    if (!el) {
      var role = document.getElementById('user-role-display'), host = role && role.parentElement; if (!host || !host.parentElement) return;
      el = document.createElement('button'); el.id = 'fm-upg-chip'; el.type = 'button'; el.addEventListener('click', function () { open(); });
      host.parentElement.insertBefore(el, host);
    }
    var pro = (a && a.tier === 'pro') || (!a && vt.indexOf('pro') >= 0 && vt.length === 1);
    el.className = a ? 'act' : (pro ? 'pro' : '');
    el.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2.5l2.6 6.4 6.9.5-5.3 4.5 1.7 6.7L12 17l-5.9 3.6 1.7-6.7L2.5 9.4l6.9-.5z"/></svg>' + (a ? NAME[a.tier] + ' · ' + leftText(untilOf(a)) : 'Upgrade');
  }
  function changed() {
    if (loadedSig === null) { loadedSig = sig(); return; }
    if (sig() === loadedSig) return;
    if (document.getElementById('fm-upg-bar') || (ov && ov.style.display !== 'none' && S.v === 'done')) return;
    var b = document.createElement('div'); b.id = 'fm-upg-bar'; b.innerHTML = '<span>Paket toko berubah.</span><button type="button">Muat ulang</button>';
    b.querySelector('button').onclick = function () { location.reload(); }; document.body.appendChild(b);
  }
  window.FM_UPG = { tier: tier, ever: ever, open: open, openLocked: openLocked, tickets: tickets };
  function init() { css(); start(); fetchCfg(); loadedSig = sig(); chip(); setInterval(function () { changed(); chip(); }, 20000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 1200); }); else setTimeout(init, 1200);
})();
