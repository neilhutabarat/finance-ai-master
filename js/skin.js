/* skin.js — "Kulit UI": bentuk kartu, tombol, pop-up, dock, dan tata letak. Terpisah dari tema warna (theme.js).
   Ganti desain tiap tahun: tambah kulit baru di SKINS lalu ubah ACTIVE (atau set window.FM_SKIN sebelum file ini dimuat).
   Warna aksen dipilih pengguna di Pengaturan; kulit hanya mengatur bentuk dan bahan. */
(function () {
  'use strict';
  var ACTIVE = window.FM_SKIN || 'glass-2026';
  var SKINS = {};

  /* ---- warna teks terbaca di semua kombinasi mode ----
     Filter mode kebalikan = invert(1) hue-rotate(180deg). Agar warna AKHIR yang tampil tepat, warna yang ditulis
     di CSS dihitung balik (pre-warna) lewat invers matriks filter. */
  function hex2rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16) / 255; }); }
  function rgb2hex(c) { return '#' + c.map(function (v) { v = Math.max(0, Math.min(1, v)); var n = Math.round(v * 255).toString(16); return n.length < 2 ? '0' + n : n; }).join(''); }
  var HRM = [[-0.574, 1.430, 0.144], [0.426, 0.430, 0.144], [0.426, 1.430, -0.856]];
  function inv3(m) {
    var a = m[0][0], b = m[0][1], c = m[0][2], d = m[1][0], e = m[1][1], f = m[1][2], g = m[2][0], h = m[2][1], i = m[2][2];
    var A_ = e * i - f * h, B_ = -(d * i - f * g), C_ = d * h - e * g, det = a * A_ + b * B_ + c * C_;
    return [[A_ / det, -(b * i - c * h) / det, (b * f - c * e) / det], [B_ / det, (a * i - c * g) / det, -(a * f - c * d) / det], [C_ / det, -(a * h - b * g) / det, (a * e - b * d) / det]];
  }
  var HRI = inv3(HRM);
  function pre(finalHex, inverted) {
    if (!inverted) return finalHex;
    var f = hex2rgb(finalHex);
    var x = HRI.map(function (r) { return r[0] * f[0] + r[1] * f[1] + r[2] * f[2]; });
    return rgb2hex(x.map(function (v) { return 1 - v; }));
  }
  var FAM = {
    /* [teks di tampilan terang, teks di tampilan gelap] */
    emerald: ['#065f46', '#34d399'], green: ['#15803d', '#4ade80'], teal: ['#0f766e', '#2dd4bf'], rose: ['#be123c', '#fb7185'], red: ['#b91c1c', '#f87171'],
    amber: ['#92400e', '#fbbf24'], yellow: ['#854d0e', '#facc15'], orange: ['#c2410c', '#fb923c'], indigo: ['#3730a3', '#a5b4fc'], violet: ['#5b21b6', '#c4b5fd'],
    purple: ['#6b21a8', '#d8b4fe'], sky: ['#0369a1', '#7dd3fc'], cyan: ['#0e7490', '#67e8f9'], blue: ['#1d4ed8', '#93c5fd'], pink: ['#be185d', '#f9a8d4']
  };
  var GRAY = { '400': ['#475569', '#a3aec2'], '500': ['#334155', '#b6bfd0'], '600': ['#1e293b', '#cdd3df'] };
  var SURFACES = ['amber', 'yellow', 'orange', 'emerald', 'green', 'teal', 'rose', 'red', 'pink', 'sky', 'cyan', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'slate', 'gray', 'zinc', 'stone'];
  function buildTextCss() {
    var out = [];
    var combos = [['dark', false], ['light', false], ['dark', true], ['light', true]];
    var skip = ':not(.oneui-hero *):not([style*="0f172a"] *):not(#fm-dock *):not(#fm-set *):not(.fm-keep *)';
    combos.forEach(function (cb) {
      var native = cb[0], inverted = cb[1];
      var finalDark = (native === 'dark') !== inverted;   // tampilan akhir gelap?
      var idx = finalDark ? 1 : 0;
      var P = 'html[data-fm-native="' + native + '"]' + (inverted ? '[data-fm-invert]' : ':not([data-fm-invert])');
      Object.keys(FAM).forEach(function (f) {
        var solid = [4, 5, 6, 7, 8, 9].map(function (n) { return ':not([class*="bg-' + f + '-' + n + '00"])'; }).join('') + ':not([class*="bg-slate-9"]):not([class*="bg-slate-8"]):not([class*="bg-gradient"]):not([class*="from-"])';
        out.push(P + ' [class*="text-' + f + '-"]' + solid + skip + '{color:' + pre(FAM[f][idx], inverted) + '!important}');
      });
      Object.keys(GRAY).forEach(function (n) {
        var sel = ['slate', 'gray', 'zinc'].map(function (g) { return P + ' [class*="text-' + g + '-' + n + '"]' + skip; }).join(',');
        out.push(sel + '{color:' + pre(GRAY[n][idx], inverted) + '!important}');
      });
    });
    /* permukaan berwarna muda (bg-*-50/100/200) -> bahan netral supaya teks selalu kontras */
    var surf = [];
    SURFACES.forEach(function (f) { ['50', '100', '200'].forEach(function (n) { surf.push('[class*="bg-' + f + '-' + n + '"]'); }); });
    combos.forEach(function (cb) {
      var finalDark = (cb[0] === 'dark') !== cb[1], idx = finalDark ? 1 : 0;
      var P = 'html[data-fm-native="' + cb[0] + '"]' + (cb[1] ? '[data-fm-invert]' : ':not([data-fm-invert])');
      out.push(P + ' .fm-ic .pos,' + P + ' .fm-ok{color:' + pre(FAM.emerald[idx], cb[1]) + '!important}');
      out.push(P + ' .fm-ic .neg{color:' + pre(FAM.rose[idx], cb[1]) + '!important}');
    });
    out.push(':is(' + surf.join(',') + '):not(button):not(.fm-keep):not(.oneui-hero *){background:var(--s-line)!important}');
    return out.join('\n');
  }
  var TEXTCSS = buildTextCss();

  var A = 'var(--fm-accent,#3d63dd)';
  var FONT = '-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,sans-serif';

  /* ===================== KULIT: Glass 2026 (One UI x Apple glass) ===================== */
  SKINS['glass-2026'] = { name: 'Glass 2026', css: [
    /* ---- variabel bahan. Nilai sudah dibalik untuk mode kebalikan (filter invert) ---- */
    'html[data-fm-native="dark"]:not([data-fm-invert]){--s-surf:rgba(255,255,255,.06);--s-line:rgba(255,255,255,.1);--s-hi:rgba(255,255,255,.13);--s-shadow:rgba(0,0,0,.75);--s-gloss:rgba(255,255,255,.045);--s-bg:#05060a;--s-b2:rgba(255,255,255,.1);--s-b2l:rgba(255,255,255,.14);--s-b2t:#f3f4f6}',
    'html[data-fm-native="light"]:not([data-fm-invert]){--s-surf:rgba(255,255,255,.76);--s-line:rgba(15,23,42,.07);--s-hi:rgba(255,255,255,.95);--s-shadow:rgba(15,23,42,.3);--s-gloss:rgba(255,255,255,.5);--s-bg:#e8ecf3;--s-b2:rgba(255,255,255,.82);--s-b2l:rgba(15,23,42,.12);--s-b2t:#0f172a}',
    'html[data-fm-native="dark"][data-fm-invert]{--s-surf:rgba(0,0,0,.76);--s-line:rgba(240,232,213,.07);--s-hi:rgba(0,0,0,.95);--s-shadow:rgba(240,232,213,.3);--s-gloss:rgba(0,0,0,.5);--s-bg:#17130c;--s-b2:rgba(0,0,0,.82);--s-b2l:rgba(240,232,213,.12);--s-b2t:#f0e8d5}',
    'html[data-fm-native="light"][data-fm-invert]{--s-surf:rgba(0,0,0,.06);--s-line:rgba(0,0,0,.1);--s-hi:rgba(0,0,0,.13);--s-shadow:rgba(255,255,255,.75);--s-gloss:rgba(0,0,0,.045);--s-bg:#fafaf5;--s-b2:rgba(0,0,0,.1);--s-b2l:rgba(0,0,0,.14);--s-b2t:#0c0b09}',

    /* ---- scrollbar halus ---- */
    '*{scrollbar-width:thin;scrollbar-color:rgba(148,163,184,.45) transparent}',
    '::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-corner{background:transparent}::-webkit-scrollbar-button{display:none;width:0;height:0}::-webkit-scrollbar-thumb{background:rgba(148,163,184,.42);border-radius:9px;border:2px solid transparent;background-clip:padding-box}',
    '.fixed.inset-0[id*="modal"] *,#fm-panel-modal *,#fm-more *{scrollbar-width:none}.fixed.inset-0[id*="modal"] *::-webkit-scrollbar,#fm-panel-modal *::-webkit-scrollbar{display:none}',

    /* ---- latar halaman ---- */
    'html[data-fm-native] body{background:var(--s-bg)!important;background-image:radial-gradient(55% 40% at 6% 0%,color-mix(in srgb,' + A + ' 15%,transparent),transparent 70%),radial-gradient(50% 40% at 100% 100%,color-mix(in srgb,' + A + ' 10%,transparent),transparent 70%)!important;background-attachment:fixed!important;padding-bottom:104px}',

    /* ---- header: bilah kaca ringkas ---- */
    'html[data-fm-native] header.oneui-hero{margin:10px 12px 0!important;padding:8px 16px!important;border-radius:26px!important;background:linear-gradient(180deg,rgba(255,255,255,.22) 0,rgba(255,255,255,.06) 42%,rgba(255,255,255,0) 56%),linear-gradient(180deg,rgba(28,32,44,.55),rgba(5,7,12,.74))!important;border:1px solid rgba(255,255,255,.2)!important;border-top-color:rgba(255,255,255,.42)!important;border-bottom-color:rgba(255,255,255,.05)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -1px 0 rgba(0,0,0,.5),inset 0 -18px 28px -22px rgba(0,0,0,.6),0 3px 5px rgba(0,0,0,.2),0 16px 30px -12px rgba(0,0,0,.5),0 34px 54px -30px rgba(0,0,0,.55)!important;-webkit-backdrop-filter:blur(26px) saturate(180%);backdrop-filter:blur(26px) saturate(180%)}',
    '.oneui-hero>div{gap:8px 16px!important}',
    '@media(min-width:640px){.oneui-hero [class*="w-12"][class*="h-12"]{width:40px!important;height:40px!important}}',
    '.oneui-hero h1{font-size:20px!important;line-height:1.15}',
    '.oneui-hero [id="topbar-store-slogan"]{font-size:11.5px!important;margin-top:1px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:34ch}',
    '.oneui-hero button,.oneui-hero :has(> #user-role-display){background:rgba(255,255,255,.07)!important;background-image:none!important;color:#e5e7eb!important;border:1px solid rgba(255,255,255,.15)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.1)!important}',
    '.oneui-hero #tier-badge-indicator,.oneui-hero [class*="from-amber"]{background:rgba(255,255,255,.08)!important;border-color:rgba(255,255,255,.2)!important;color:#e5e7eb!important;box-shadow:none!important}',
    '.oneui-hero button[onclick*="logout"],.oneui-hero button[onclick*="Logout"],.oneui-hero button[onclick*="index.html"],html[data-fm-page="tower"] .oneui-hero button[onclick*="release_notes"]{display:none!important}',
    '.oneui-hero [class*="rounded-xl"][onclick],.oneui-hero [class*="glass-capsule"],.oneui-hero [class*="ios-pill"]{padding-top:5px!important;padding-bottom:5px!important}',
    '@media(max-width:1100px){.oneui-hero [id="topbar-store-slogan"]{display:none}}',

    /* ---- bahan kartu kaca (rata, tanpa gradasi abu) ---- */
    '.ios-glass,.white-ice-glass-card{position:relative;background:var(--s-surf)!important;background-image:none!important;border:1px solid var(--s-line)!important;border-radius:24px!important;box-shadow:inset 0 1px 0 var(--s-hi),0 18px 36px -26px var(--s-shadow)!important;-webkit-backdrop-filter:blur(26px) saturate(165%);backdrop-filter:blur(26px) saturate(165%);overflow:hidden}',
    '.ios-glass::before,.white-ice-glass-card::before{content:"";position:absolute;left:0;right:0;top:0;height:38%;background:linear-gradient(180deg,var(--s-gloss),transparent);border-radius:24px 24px 50% 50%/24px 24px 16px 16px;pointer-events:none;z-index:-1}',
    /* kartu gelap berkilau penanda (Saldo Kas Sah) */
    '.white-ice-glass-card[style*="0f172a"]{background:linear-gradient(180deg,rgba(255,255,255,.2) 0,rgba(255,255,255,.05) 44%,rgba(255,255,255,0) 58%),linear-gradient(180deg,rgba(28,32,44,.55),rgba(5,7,12,.74))!important;border:1px solid rgba(255,255,255,.2)!important;border-top-color:rgba(255,255,255,.42)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -1px 0 rgba(0,0,0,.5),0 3px 5px rgba(0,0,0,.2),0 18px 30px -12px rgba(0,0,0,.5),0 32px 48px -28px rgba(0,0,0,.5)!important}',
    '.white-ice-glass-card[style*="0f172a"]::before{display:none}',
    '.fm-gone{display:none!important}',
    /* keterbacaan teks berwarna: dihitung otomatis untuk 4 kombinasi (native x invert) */
    TEXTCSS,
    '.oneui-hero button[class*="bg-rose"]{background:rgba(244,63,94,.22)!important;background-image:none!important;color:#ffe1e6!important;border:1px solid rgba(251,113,133,.45)!important}',

    /* ---- tombol: bahan seragam, bentuk pil ---- */
    'button[class*="bg-indigo-"],button[class*="bg-purple-"],button[class*="bg-violet-"],button[class*="bg-emerald-"],button[class*="bg-teal-"],button[class*="bg-blue-"],button[class*="bg-green-"],button[class*="bg-sky-"],button[class*="from-indigo"],button[class*="from-purple"],button[class*="from-emerald"],button[class*="from-teal"],button[class*="from-blue"]{background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,0) 55%),color-mix(in srgb,' + A + ' 86%,#000)!important;color:var(--fm-on,#fff)!important;border:1px solid rgba(255,255,255,.2)!important;border-radius:999px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.34),0 10px 20px -12px color-mix(in srgb,' + A + ' 80%,#000)!important}',
    'button[class*="bg-slate-9"],button[class*="bg-slate-8"],button[class*="bg-gray-9"],button[class*="bg-gray-8"],button[class*="bg-amber-5"],button[class*="bg-amber-6"],button[class*="bg-amber-7"],button[class*="bg-orange-"],button[class*="from-amber"],button[class*="from-orange"],button[class*="bg-white"],button[class*="bg-slate-50"],button[class*="bg-slate-100"],button[class*="bg-slate-200"],button[class*="bg-purple-50"],button[class*="bg-purple-100"]{background:var(--s-b2)!important;background-image:none!important;color:var(--s-b2t)!important;border:1px solid var(--s-b2l)!important;border-radius:999px!important;box-shadow:inset 0 1px 0 var(--s-hi),inset 0 -1px 0 rgba(0,0,0,.08),0 2px 3px rgba(0,0,0,.1),0 12px 20px -10px var(--s-shadow)!important}',
    'button[class*="bg-rose-5"],button[class*="bg-rose-6"],button[class*="bg-rose-7"],button[class*="bg-red-5"],button[class*="bg-red-6"],button[class*="bg-red-7"],button[class*="from-rose"],button[class*="from-red"]{background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,0) 55%),#a02c46!important;color:#fff!important;border:1px solid rgba(255,255,255,.16)!important;border-radius:999px!important}',
    'button[class*="rounded-"]{font-weight:700;letter-spacing:-.005em}',
    'button:hover{filter:brightness(1.06)}button:active{filter:brightness(.96)}html[data-fm-invert="1"] button:hover{filter:none}',
    'button:has(h4)[class*="bg-"]{text-align:left;border-radius:20px!important}',
    'html[data-fm-dock] .fm-tile,html[data-fm-dock] .fm-tile-wrap{display:none!important}',

    /* ---- kolom isian ---- */
    'input:not([type=checkbox]):not([type=radio]):not([type=color]):not([type=range]),select,textarea{border-radius:14px!important;min-width:0}',
    'html[data-fm-native="light"]:not([data-fm-invert]) input:not([type=checkbox]):not([type=radio]):not([type=color]),html[data-fm-native="light"]:not([data-fm-invert]) select,html[data-fm-native="light"]:not([data-fm-invert]) textarea{background-color:rgba(255,255,255,.78)!important;border-color:rgba(148,163,184,.45)!important;box-shadow:inset 0 1px 2px rgba(15,23,42,.05)!important}',

    /* ---- tombol tindakan (grid seragam) ---- */
    '.fm-actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:10px}',
    '.fm-actions:empty{display:none}',
    '.fm-actions .fm-act{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:11px;min-height:54px;padding:10px 14px;border-radius:20px;cursor:pointer;background:var(--s-surf);border:1px solid var(--s-line);box-shadow:inset 0 1px 0 var(--s-hi),0 14px 28px -22px var(--s-shadow);-webkit-backdrop-filter:blur(22px);backdrop-filter:blur(22px);font:700 13px/1.2 ' + FONT + ';letter-spacing:-.005em;transition:transform .2s,filter .2s;-webkit-tap-highlight-color:transparent}',
    '.fm-actions .fm-act:hover{transform:translateY(-2px);filter:brightness(1.05)}.fm-actions .fm-act:active{transform:scale(.97)}',
    '.fm-actions .fm-act i{width:34px;height:34px;border-radius:12px;flex:none;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,' + A + ' 16%,transparent);color:' + A + '}',
    '.fm-actions .fm-act svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
    '.fm-actions .fm-act span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    /* ubin dinamis: bentuk dan ukuran dihitung dari ruang kosong (lihat layoutTiles) */
    '.fm-actions[data-fm-mosaic]{align-content:stretch}',
    '.fm-actions[data-fm-mosaic] .fm-act{min-width:0}',
    '.fm-actions .fm-act[data-sz="l"],.fm-actions .fm-act[data-sz="xl"]{flex-direction:column;justify-content:center;text-align:center;gap:10px;font-size:15px;font-weight:800;padding:14px}',
    '.fm-actions .fm-act[data-sz="l"] i{width:46px;height:46px;border-radius:16px}.fm-actions .fm-act[data-sz="l"] svg{width:24px;height:24px}',
    '.fm-actions .fm-act[data-sz="xl"]{font-size:18px;gap:14px}.fm-actions .fm-act[data-sz="xl"] i{width:64px;height:64px;border-radius:22px}.fm-actions .fm-act[data-sz="xl"] svg{width:32px;height:32px}',
    '.fm-actions .fm-act[data-sz="l"] span,.fm-actions .fm-act[data-sz="xl"] span{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.2}',
    '@media(max-width:640px){.fm-actions{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.fm-actions .fm-act{padding:9px 11px;gap:9px;font-size:12.5px}}',

    /* ---- kartu insight ---- */
    '#fm-insights{display:flex;flex-direction:column;gap:12px}',
    '.fm-ins-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}',
    '@media(max-width:1023px){.fm-ins-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.fm-ins-grid{grid-template-columns:1fr}}',
    '.fm-ic{padding:14px 16px;display:flex;flex-direction:column;gap:5px;min-width:0}',
    '.fm-ic h4{font-size:12.5px;font-weight:800;margin:0 0 3px;letter-spacing:-.005em}',
    '.fm-row{display:flex;justify-content:space-between;gap:10px;font-size:12.5px;line-height:1.5}.fm-row span{opacity:.72;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fm-row b{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-weight:700;white-space:nowrap}',
    '.fm-sub{font-size:11.5px;opacity:.65;line-height:1.4}.fm-ok{font-size:12.5px;color:#10b981;font-weight:600}',
    '.fm-bar{height:7px;border-radius:9px;background:var(--s-line);overflow:hidden;margin:4px 0 2px}.fm-bar i{display:block;height:100%;border-radius:9px;background:' + A + '}',
    '.fm-tg{display:grid;grid-template-columns:1fr 1fr auto;gap:6px;margin-top:6px}.fm-tg input{padding:7px 10px;font-size:12px;font-weight:700;background:transparent;border:1px solid var(--s-line);outline:none;color:inherit;min-width:0}.fm-tg button{padding:7px 14px;font-size:12px;border-radius:999px;border:0;background:' + A + ';color:#fff;cursor:pointer}',
    '.fm-scroll{overflow:auto;min-height:0}.fm-ic table{width:100%;font-size:12.5px;border-collapse:collapse}.fm-ic th{text-align:right;font-weight:700;opacity:.6;padding:4px 8px;font-size:11.5px}.fm-ic th:first-child,.fm-ic td:first-child{text-align:left}.fm-ic td{text-align:right;padding:6px 8px;border-top:1px solid var(--s-line);font-family:ui-monospace,Menlo,monospace}.fm-ic td:first-child{font-family:inherit;font-weight:700}.fm-ic td.pos{color:#10b981}.fm-ic td.neg{color:#f43f5e}',

    '@media(max-width:640px){html[data-fm-page] main>.grid:first-child{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important}html[data-fm-page="owner"] main>.grid:first-child .ios-glass p.text-\\[10px\\],html[data-fm-page] main>.grid:first-child .ios-glass:nth-child(4):not(#fm-bill)>div:last-child{display:none}html[data-fm-page] main>.grid:first-child .ios-glass{padding:12px 14px!important}html[data-fm-page] main>.grid:first-child h3[class*="text-2xl"]{font-size:19px!important}.fm-ins-grid{gap:8px}}',
    /* ---- pop-up kaca ---- */
    '@media screen{',
    '.fixed.inset-0[id*="modal"]{background:rgba(6,8,14,.4)!important;-webkit-backdrop-filter:blur(22px) saturate(140%)!important;backdrop-filter:blur(22px) saturate(140%)!important}',
    '.fixed.inset-0[id*="modal"]>div{border-radius:30px!important;animation:fmPop .42s cubic-bezier(.2,.9,.25,1.12) both;-webkit-backdrop-filter:blur(34px) saturate(180%);backdrop-filter:blur(34px) saturate(180%);box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 40px 90px -30px rgba(0,0,0,.7)!important;border:1px solid rgba(255,255,255,.16)!important}',
    'html[data-fm-native="dark"]:not([data-fm-invert]) .fixed.inset-0[id*="modal"]>div{background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.03)),rgba(16,18,25,.84)!important}',
    'html[data-fm-native="light"]:not([data-fm-invert]) .fixed.inset-0[id*="modal"]>div{background:rgba(255,255,255,.86)!important;border-color:rgba(255,255,255,.95)!important}',
    '@keyframes fmPop{from{opacity:0;transform:translateY(16px) scale(.94)}to{opacity:1;transform:none}}',
    '@keyframes fmUp{from{opacity:.4;transform:translateY(100%)}to{opacity:1;transform:none}}',
    '@media(max-width:640px){.fixed.inset-0[id*="modal"]{align-items:flex-end!important;padding:0!important}.fixed.inset-0[id*="modal"]>div{width:100%!important;max-width:none!important;max-height:90vh!important;border-radius:30px 30px 0 0!important;animation:fmUp .42s cubic-bezier(.2,.9,.25,1) both;padding-bottom:env(safe-area-inset-bottom);position:relative}.fixed.inset-0[id*="modal"]>div::after{content:"";position:absolute;left:50%;top:7px;width:40px;height:5px;margin-left:-20px;border-radius:9px;background:rgba(148,163,184,.55);pointer-events:none}}',
    '}',

    /* ---- dock ---- */
    '#fm-dock{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:45;display:flex;align-items:flex-end;gap:2px;padding:7px 9px;max-width:calc(100vw - 16px);border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,.2) 0,rgba(255,255,255,.05) 44%,rgba(255,255,255,0) 58%),linear-gradient(180deg,rgba(28,32,44,.55),rgba(5,7,12,.72));border:1px solid rgba(255,255,255,.2);border-top-color:rgba(255,255,255,.42);border-bottom-color:rgba(255,255,255,.05);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -1px 0 rgba(0,0,0,.45),inset 0 -16px 24px -20px rgba(0,0,0,.55),0 3px 5px rgba(0,0,0,.22),0 18px 30px -12px rgba(0,0,0,.55),0 36px 56px -30px rgba(0,0,0,.55);-webkit-backdrop-filter:blur(28px) saturate(180%);backdrop-filter:blur(28px) saturate(180%)}',
    '#fm-dock .fm-dk{all:unset;box-sizing:border-box;white-space:nowrap;width:58px;display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 0 5px;border-radius:19px;cursor:pointer;color:#e9ebf1;font:600 10.5px/1.1 ' + FONT + ';transition:transform .28s cubic-bezier(.2,.9,.25,1.2),background .2s;-webkit-tap-highlight-color:transparent}',
    '#fm-dock .fm-dk svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}',
    '#fm-dock .fm-dk:hover{background:rgba(255,255,255,.1);transform:translateY(-6px) scale(1.12)}#fm-dock .fm-dk:active{transform:translateY(-2px) scale(.96)}',
    '#fm-dock .fm-dk.danger{color:#fda4af}',
    '#fm-dock .fm-sep{width:1px;align-self:stretch;margin:8px 4px;background:rgba(255,255,255,.14)}',
    'html[data-fm-dock] #fm-gear{display:none!important}',
    '@media(max-width:420px){#fm-dock .fm-dk{width:52px;font-size:10px}#fm-dock{padding:6px 7px;gap:1px}}',
    '@media print{#fm-dock{display:none!important}}',
    '#fm-more{position:fixed;inset:0;z-index:2147481500;display:none;align-items:flex-end;justify-content:center;background:rgba(6,8,14,.4);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}',
    '#fm-more .fm-ms{width:100%;max-width:420px;margin:0 10px calc(92px + env(safe-area-inset-bottom));padding:10px;border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.03)),rgba(16,18,25,.88);border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 40px 80px -30px #000;animation:fmPop .36s cubic-bezier(.2,.9,.25,1.12) both}',
    '#fm-more button{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:12px;width:100%;padding:13px 14px;border-radius:18px;color:#f3f4f6;font:600 14px ' + FONT + ';cursor:pointer}#fm-more button:hover{background:rgba(255,255,255,.09)}',
    '#fm-more svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}',

    /* ---- panel popup (bagian halaman yang dibuka dari tombol tindakan) ---- */
    'html[data-fm-native="light"]:not([data-fm-invert="1"]) header.oneui-hero{background:linear-gradient(180deg,rgba(255,255,255,.2) 0,rgba(255,255,255,.05) 42%,rgba(255,255,255,0) 56%),linear-gradient(180deg,rgba(28,32,44,.74),rgba(5,7,12,.88))!important}',
    'html[data-fm-native="light"]:not([data-fm-invert="1"]) #fm-dock{background:linear-gradient(180deg,rgba(255,255,255,.2) 0,rgba(255,255,255,.05) 44%,rgba(255,255,255,0) 58%),linear-gradient(180deg,rgba(28,32,44,.74),rgba(5,7,12,.86))!important}',
    '#fm-panel-modal{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;padding:16px}',
    '#fm-panel-modal>div{width:100%;max-width:760px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;color:inherit;font-family:' + FONT + '}',
    '#fm-panel-modal .fm-ph{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px 12px}',
    '#fm-panel-modal .fm-ph h3{margin:0;font-size:17px;font-weight:800;letter-spacing:-.01em}#fm-panel-modal .fm-ph p{margin:2px 0 0;font-size:12px;opacity:.65}',
    '#fm-panel-modal .fm-px{all:unset;box-sizing:border-box;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;background:var(--s-b2,rgba(148,163,184,.2));font-size:16px;font-weight:700}',
    '#fm-panel-modal .fm-pb{padding:4px 22px 22px;overflow:auto;min-height:0}',
    '#fm-panel-modal .fm-pb>*{margin:0!important;box-shadow:none!important;background:transparent!important;border:0!important;padding:0!important;backdrop-filter:none!important}',
    '#fm-panel-modal .fm-pb>*::before{display:none!important}',
    '#fm-panel-modal .fm-pb>*>.border-b:first-child,#fm-panel-modal .fm-pb>*>h2:first-child{display:none!important}',
    '.fixed [class*="bg-purple-50"],.fixed [class*="bg-indigo-50"],.fixed [class*="bg-rose-50"],.fixed [class*="bg-emerald-50"],.fixed [class*="bg-amber-50"],.fixed [class*="bg-slate-50"]:not(button){background:var(--s-line)!important}',
    '#fm-stash{display:none!important}',

    /* ===== desktop: pas satu layar (tanpa gulir halaman) ===== */
    '@media (min-width:1024px) and (min-height:540px){',
    'html[data-fm-fit] .oneui-hero{max-width:1448px;margin-left:auto!important;margin-right:auto!important;width:calc(100% - 24px)}',
    'html[data-fm-fit] body{height:100vh;height:100dvh;overflow:hidden;display:flex;flex-direction:column;padding-bottom:0!important}',
    'html[data-fm-fit] main{flex:1 1 0;min-height:0;display:flex!important;flex-direction:column;gap:10px;padding:10px 16px 78px!important;margin:0 auto!important;max-width:1480px!important}',
    'html[data-fm-fit] main>*{margin:0!important}',
    'html[data-fm-fit] main .ios-glass,html[data-fm-fit] main .white-ice-glass-card{padding-top:12px!important;padding-bottom:12px!important}',
    'html[data-fm-fit] main h3[class*="text-2xl"],html[data-fm-fit] main h3[class*="text-3xl"]{font-size:clamp(20px,3.4vh,28px)!important;line-height:1.1;margin:2px 0!important}',
    /* kasir */
    'html[data-fm-page="kasir"] main>.grid:first-child{flex:none}',
    'html[data-fm-page="kasir"] .fm-saldo{grid-column:1/-1!important;padding:8px 18px!important;display:grid!important;grid-template-columns:minmax(0,1.2fr) minmax(0,1.2fr) auto auto;grid-template-rows:auto auto;align-items:center;gap:0 22px}',
    'html[data-fm-page="kasir"] .fm-saldo>div{display:contents!important}',
    'html[data-fm-page="kasir"] .fm-saldo>*,html[data-fm-page="kasir"] .fm-saldo>div>*{margin:0!important;border:0!important;padding:0!important}',
    'html[data-fm-page="kasir"] .fm-saldo>div:nth-child(1)>div:first-child{grid-column:1;grid-row:1}',
    'html[data-fm-page="kasir"] .fm-saldo>div:nth-child(1)>button{grid-column:4;grid-row:1;justify-self:end;padding:6px 16px!important}',
    'html[data-fm-page="kasir"] .fm-saldo>div:nth-child(1) span.text-\\[10px\\]{display:none}',
    'html[data-fm-page="kasir"] .fm-saldo>div:nth-child(2)>div:first-child{grid-column:1;grid-row:2}',
    'html[data-fm-page="kasir"] .fm-saldo>div:nth-child(2)>div:last-child{grid-column:3;grid-row:1/3;justify-self:end;text-align:right}',
    'html[data-fm-page="kasir"] .fm-saldo>div:nth-child(3)>span{grid-column:2;grid-row:1/3;font-size:12.5px;line-height:1.5;justify-self:start}',
    'html[data-fm-page="kasir"] .fm-saldo>div:nth-child(3)>button{grid-column:4;grid-row:2;justify-self:end;font-size:12px}',
    'html[data-fm-page="kasir"] .fm-saldo>div:nth-child(2)>div:first-child>span{display:none}',
    'html[data-fm-page="kasir"] main>.grid:nth-child(2)>section:first-child{padding:10px 14px!important}',
    'html[data-fm-page="kasir"] main>.grid:nth-child(2)>section:first-child>.border-b{border:0!important;padding:0 0 2px!important}',
    'html[data-fm-page="kasir"] main>.grid:nth-child(2)>section:first-child #form-title{font-size:14px!important}',
    'html[data-fm-page="kasir"] main>.grid:nth-child(2)>section:first-child #form-title>div{display:none}',
    'html[data-fm-page="kasir"] main>.grid:nth-child(2)>section:first-child>div:last-child{gap:6px 10px!important}',
    'html[data-fm-page="kasir"] #btn-save-draft{padding-top:9px!important;padding-bottom:9px!important}',
    'html[data-fm-page="owner"] main>.grid:first-child>.ios-glass:nth-child(4)>div:last-child{display:none}',
    'html[data-fm-page="kasir"] #kasir-live-balance{font-size:clamp(24px,4.4vh,34px)!important;line-height:1.05}',
    'html[data-fm-page="kasir"] main>.grid:nth-child(2){flex:1 1 0;min-height:0;align-items:stretch!important}',
    'html[data-fm-page="kasir"] main>.grid:nth-child(2)>section{min-height:0}',
    'html[data-fm-page="kasir"] main>.grid:nth-child(2)>section:first-child{overflow:auto;padding:14px 16px!important}',
    'html[data-fm-page="kasir"] main>.grid:nth-child(2)>section:first-child>.border-b{padding-bottom:4px!important}',
    'html[data-fm-page="kasir"] main>.grid:nth-child(2)>section:first-child>.border-b p{display:none}',
    'html[data-fm-page="kasir"] main>.grid:nth-child(2)>section.lg\\:col-span-5{grid-column:span 6/span 6!important}',
    'html[data-fm-page="kasir"] main>.grid:nth-child(2)>section.lg\\:col-span-7{grid-column:span 6/span 6!important}',
    'html[data-fm-page="kasir"] main>.grid:nth-child(2)>section:first-child>.space-y-3\\.5,html[data-fm-page="kasir"] main>.grid:nth-child(2)>section:first-child>div:last-child{display:grid;grid-template-columns:1fr 1fr;gap:8px 10px}',
    'html[data-fm-page="kasir"] section:first-child>div.space-y-3\\.5>*{margin:0!important}',
    'html[data-fm-page="kasir"] #barcode-block,html[data-fm-page="kasir"] #barcode-locked,html[data-fm-page="kasir"] #product-grid-wrap,html[data-fm-page="kasir"] #btn-save-draft{grid-column:1/-1}',
    'html[data-fm-page="kasir"] #product-grid{max-height:92px!important}',
    'html[data-fm-page="kasir"] main>.grid:nth-child(2)>section:last-child{display:flex!important;flex-direction:column;gap:10px;overflow:hidden}',
    'html[data-fm-page="kasir"] main>.grid:nth-child(2)>section:last-child>*{margin:0!important}',
    'html[data-fm-page="kasir"] main>.grid:nth-child(2)>section:last-child>.white-ice-glass-card:first-child{flex:1 1 0;min-height:0;display:flex;flex-direction:column}',
    'html[data-fm-page="kasir"] #draft-items-container{flex:1 1 0;max-height:none!important;min-height:0;overflow:auto}',
    /* manager & owner */
    'html[data-fm-page="owner"] main>.grid:first-child,html[data-fm-page="manager"] main>.grid:first-child{flex:none}',
    'html[data-fm-page="owner"] main>.grid:first-child .ios-glass p.text-\\[10px\\]{display:none}',
    'html[data-fm-fit] .fm-ic{padding:10px 14px!important;gap:3px}',
    'html[data-fm-fit] main>.grid:first-child>.ios-glass{justify-content:center!important;gap:2px}',
    'html[data-fm-fit] main input:not([type=checkbox]):not([type=radio]):not([type=file]),html[data-fm-fit] main select{padding-top:8px!important;padding-bottom:8px!important}',
    'html[data-fm-fit] main label{margin-bottom:2px!important}',
    'html[data-fm-fit] #fm-insights{flex:1 1 0;min-height:0;display:flex;flex-direction:column;gap:12px}',
    'html[data-fm-fit] #fm-insights .fm-ins-grid{flex:none}',
    'html[data-fm-fit] #fm-insights .fm-ins-main{flex:1 1 0;min-height:0}',
    'html[data-fm-fit] #fm-insights .fm-ins-main .fm-scroll{flex:1 1 0}',
    'html[data-fm-fit] #fm-actions{flex:none}',
    'html[data-fm-fit] #fm-insights:empty{display:none}',
    'html[data-fm-fit] main:has(#fm-insights:empty) #fm-actions{flex:1 1 0;min-height:0}',
    'html[data-fm-page="manager"] main>.grid.lg\\:grid-cols-12{display:none!important}',
    'html[data-fm-page="owner"] main>div:not(#fm-insights):not(#fm-actions):not(.grid):not([data-fm-panel]){display:none}',
    '}',
    /* manager: sisa grid bila kosong */

    /* ===== Tower & Partner: pas satu layar di desktop ===== */
    '@media (min-width:1024px) and (min-height:540px){',
    'html[data-fm-page="tower"] main>.grid:first-child,html[data-fm-page="partner"] main>.grid:first-child,html[data-fm-page="tower"] #fm-actions{flex:none}',
    'html[data-fm-page="tower"] main>.grid:first-child>*{padding:10px 16px!important;gap:2px}',
    'html[data-fm-page="tower"] main>.grid:first-child>* .border-t{display:none}',
    'html[data-fm-page="tower"] main>.grid:first-child>* p{margin:0!important}',
    '@media(min-width:1024px){html[data-fm-page="tower"] #fm-actions{flex:1 1 0!important;min-height:0;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:1fr}',
    'html[data-fm-page="tower"] .fm-actions .fm-act{flex-direction:column;justify-content:center;text-align:center;gap:10px;font-size:15px;font-weight:800}',
    'html[data-fm-page="tower"] .fm-actions .fm-act i{width:50px;height:50px;border-radius:17px}html[data-fm-page="tower"] .fm-actions .fm-act svg{width:26px;height:26px}}',
    'html[data-fm-page="tower"] #tw-mini{display:none}',
    'html[data-fm-page="tower"] #tw-mini>div{flex:1 1 0;min-height:0}',
    'html[data-fm-page="tower"] #tw-mini .tw-mini-rows{overflow:auto;flex:1 1 0;min-height:0}',
    'html[data-fm-page="tower"] main>.ios-glass:last-child{flex:1 1 0;min-height:0;display:flex;flex-direction:column;gap:8px!important;padding-top:12px!important;padding-bottom:12px!important}',
    'html[data-fm-page="tower"] main>.ios-glass:last-child>.overflow-x-auto{flex:1 1 0;min-height:0;overflow:auto}',
    'html[data-fm-page="tower"] main>.ios-glass:last-child>div:first-child{padding-bottom:6px!important}',
    'html[data-fm-page="tower"] main>.ios-glass:last-child>div:first-child p{display:none}',
    'html[data-fm-page="partner"] main>.flex.justify-center{display:none}',
    'html[data-fm-page="partner"] #partner-recent{flex:1 1 0;min-height:0;display:flex;flex-direction:column}',
    'html[data-fm-page="partner"] #partner-recent .fm-scroll{flex:1 1 0;min-height:0}',
    '}',
    /* ===== portal login: satu nada dengan halaman lain ===== */
    'html[data-fm-page="login"] body{font-family:' + FONT + '!important;padding-bottom:0!important;min-height:100vh;min-height:100dvh}',
    'html[data-fm-page="login"] .white-ice-glass-card{max-width:420px}',
    'html[data-fm-page="login"] #login-brand{font-weight:800!important;letter-spacing:-.02em}',
    'html[data-fm-page="login"] #btn-login-submit{background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,0) 55%),color-mix(in srgb,' + A + ' 86%,#000)!important;color:var(--fm-on,#fff)!important;border:1px solid rgba(255,255,255,.2)!important;border-radius:999px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 14px 26px -14px color-mix(in srgb,' + A + ' 80%,#000)!important}',
    'html[data-fm-page="login"] #btn-login-submit:disabled{opacity:.5}',
    '@media(max-height:700px){html[data-fm-page="login"] body{align-items:center}html[data-fm-page="login"] .white-ice-glass-card{padding:16px 22px!important;gap:10px!important}html[data-fm-page="login"] .white-ice-glass-card.space-y-5>*{margin-top:0!important;margin-bottom:0!important}html[data-fm-page="login"] .white-ice-glass-card #login-logo-trigger{width:56px!important;height:56px!important}html[data-fm-page="login"] #login-sub{display:none}}',
    '.fm-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:96px;height:100%;text-align:center;font-weight:700;font-size:13px;opacity:.8}.fm-empty span{font-weight:500;font-size:11.5px;opacity:.7}',
    'html[data-fm-page="login"] #login-brand{margin-top:6px}',
    '.oneui-hero .flex.items-center.space-x-2{flex-wrap:wrap;row-gap:4px}',
    '@media(max-width:640px){html[data-fm-page="partner"] main>.grid:first-child>:last-child{grid-column:1/-1}html[data-fm-page="partner"] main>.grid:first-child{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important}}',
    'thead th,.fixed thead,.fixed th{color:var(--s-b2t)!important;font-weight:800}',
    '.oneui-hero .badge-pro-gold,.oneui-hero [class*="badge-pro"]{color:#2a1a00!important;text-shadow:none!important}',
    '[class*="bg-amber-6"]:not(button):not(.oneui-hero *),[class*="bg-yellow-6"]:not(button):not(.oneui-hero *),[class*="bg-orange-6"]:not(button):not(.oneui-hero *){background-color:#b45309!important;color:#fff!important}',
    'button[class*="bg-yellow-"]{background:var(--s-b2)!important;background-image:none!important;color:var(--s-b2t)!important;border:1px solid var(--s-b2l)!important;border-radius:999px!important}',
    '[class*="bg-cyan-6"]:not(.oneui-hero *),[class*="bg-sky-6"]:not(.oneui-hero *){background-color:#0e7490!important;color:#fff!important}',
    '[class*="bg-emerald-6"]:not(.oneui-hero *):not(button){background-color:#047857!important;color:#fff!important}',
    '@media(max-width:1023px){html[data-fm-page="kasir"] main>.grid:first-child{grid-template-columns:minmax(0,1fr)!important}html[data-fm-page="kasir"] .fm-saldo{grid-column:1/-1!important}}',
    'html[data-fm-invert="1"] #fm-dock,html[data-fm-invert="1"] .white-ice-glass-card[style*="0f172a"]{filter:invert(1) hue-rotate(180deg)}',

    /* ===== layar sempit: tanpa gulir halaman ===== */
    'html[data-fm-narrow] body{height:100vh;height:100dvh;overflow:hidden;display:flex;flex-direction:column;padding-bottom:0!important}',
    'html[data-fm-narrow] main{flex:1 1 0;min-height:0;display:flex!important;flex-direction:column;gap:8px;padding:6px 12px 96px!important;margin:0 auto!important;width:100%;overflow:hidden}',
    'html[data-fm-narrow] main>*{margin:0!important}',
    'html[data-fm-narrow] #fm-insights,html[data-fm-narrow][data-fm-page="manager"] main>.grid.lg\\:grid-cols-12,html[data-fm-narrow][data-fm-page="partner"] main>.flex.justify-center{display:none!important}',
    'html[data-fm-narrow] #fm-actions{flex:1 1 0;min-height:0;overflow:auto;align-content:start}',
    'html[data-fm-narrow] header.oneui-hero{margin:8px 10px 0!important;padding:8px 14px!important}',
    'html[data-fm-narrow] .oneui-hero>div>div:last-child{display:none!important}',
    'html[data-fm-narrow] .oneui-hero h1{font-size:18px!important}',
    'html[data-fm-narrow] .oneui-hero p,html[data-fm-narrow] .oneui-hero [id="topbar-store-slogan"]{display:none!important}',
    'html[data-fm-narrow] main>.grid:first-child{flex:none}',
    'html[data-fm-narrow] main>.grid:first-child>.ios-glass{padding:8px 12px!important;gap:1px}',
    'html[data-fm-narrow] main>.grid:first-child>.ios-glass .border-t{display:none}',
    'html[data-fm-narrow][data-fm-page="partner"] #partner-recent{flex:1 1 0;min-height:0;display:flex;flex-direction:column}',
    'html[data-fm-narrow][data-fm-page="partner"] #partner-recent .fm-scroll{flex:1 1 0;min-height:0}',
    '.fm-insights:empty{display:none}'
  ].join('\n') };

  /* ===================== pemasang ===================== */
  var skin = SKINS[ACTIVE] || SKINS['glass-2026'];
  var st = document.createElement('style');
  st.id = 'fm-skin-css'; st.setAttribute('data-skin', ACTIVE); st.textContent = skin.css;
  (document.head || document.documentElement).appendChild(st);
  window.FM_SKINS = { active: ACTIVE, list: Object.keys(SKINS) };

  var path = (location.pathname || '').toLowerCase();
  var PAGE = path.indexOf('kasir') >= 0 ? 'kasir' : path.indexOf('manager') >= 0 ? 'manager' : path.indexOf('dashboard') >= 0 ? 'owner' : path.indexOf('provider') >= 0 ? 'tower' : path.indexOf('partner') >= 0 ? 'partner' : (path.indexOf('index') >= 0 || /\/$/.test(path) || path === '') ? 'login' : '';
  if (PAGE) { document.documentElement.setAttribute('data-fm-page', PAGE); if (PAGE !== 'login') document.documentElement.setAttribute('data-fm-fit', '1'); }

  /* ===================== ikon & util ===================== */
  var IC = {
    swap: '<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>',
    tax: '<path d="M3 21h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 3l9 5H3z"/>',
    book: '<path d="M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2.4.6 4 2.3 4 5.2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    spark: '<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
    archive: '<rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4"/>',
    coins: '<circle cx="9" cy="9" r="6"/><path d="M15 9.5a6 6 0 1 1-5.5 8.3M7 9h4"/>',
    store: '<path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-6h6v6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    ticket: '<path d="M3 9a2 2 0 0 0 0 6v3h18v-3a2 2 0 0 1 0-6V6H3zM13 6v12"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    building: '<path d="M4 21V5l8-3 8 3v16M9 21v-4h6v4M8 9h.01M12 9h.01M16 9h.01M8 13h.01M12 13h.01M16 13h.01"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'
  };
  function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || IC.grid) + '</svg>'; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  /* ===================== keluar ===================== */
  function findLogout() { return document.querySelector('button[onclick*="ogout"]') || document.querySelector('header button[onclick*="index.html"]'); }
  window.FM_LOGOUT = function () { var b = findLogout(); if (b) b.click(); };

  /* ===================== panel popup ===================== */
  var stash;
  function ensureStash() { if (!stash) { stash = document.createElement('div'); stash.id = 'fm-stash'; document.body.appendChild(stash); } return stash; }
  var curPanel = null;
  function closePanel() {
    var m = document.getElementById('fm-panel-modal'); if (!m) return;
    m.style.display = 'none';
    if (curPanel) {
      var key = curPanel.getAttribute && curPanel.getAttribute('data-fm-i'), box = document.getElementById('fm-insights');
      if (key && box) {
        var fresh = [].slice.call(box.querySelectorAll('[data-fm-i]')).filter(function (x) { return x.getAttribute('data-fm-i') === key; })[0];
        if (fresh) curPanel.parentNode && curPanel.parentNode.removeChild(curPanel); else box.appendChild(curPanel);
      } else ensureStash().appendChild(curPanel);
      curPanel = null;
    }
  }
  function openPanel(el, title, sub) {
    var m = document.getElementById('fm-panel-modal');
    if (!m) {
      m = document.createElement('div'); m.id = 'fm-panel-modal'; m.className = 'fixed inset-0';
      m.innerHTML = '<div><div class="fm-ph"><div><h3></h3><p></p></div><button type="button" class="fm-px" aria-label="Tutup">✕</button></div><div class="fm-pb"></div></div>';
      m.addEventListener('click', function (e) { if (e.target === m) closePanel(); });
      m.querySelector('.fm-px').onclick = closePanel;
      document.body.appendChild(m);
    }
    m.querySelector('h3').textContent = title || ''; m.querySelector('p').textContent = sub || '';
    var body = m.querySelector('.fm-pb'); body.innerHTML = '';
    m.firstChild.style.maxWidth = el.hasAttribute('data-wide') ? 'min(1180px,96vw)' : '';
    curPanel = el; body.appendChild(el); el.style.display = '';
    m.style.display = 'flex';
  }
  window.FM_OPEN_PANEL = openPanel;
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(); });

  function actionTile(label, ic, onclick) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'fm-act';
    b.innerHTML = '<i>' + svg(ic) + '</i><span>' + esc(label) + '</span>'; b.onclick = onclick; return b;
  }
  function buildActions() {
    var grid = document.getElementById('fm-actions'); if (!grid) return;
    // tombol tindakan yang sudah ada (data-fm-action) -> ubin seragam
    [].slice.call(grid.querySelectorAll('[data-fm-action]')).forEach(function (b) {
      var sp = b.querySelector('span');
      var label = ((sp ? sp.textContent : b.textContent) || '').replace(/^\s*\+\s*/, '').replace(/\s+/g, ' ').trim();
      var onclick = b.getAttribute('onclick') || '';
      var t = actionTile(label, b.getAttribute('data-ic') || 'grid', function () { new Function(onclick).call(t); });
      [].slice.call(b.querySelectorAll('[id]')).forEach(function (el) { t.appendChild(el); });
      b.parentNode.replaceChild(t, b);
    });
    // bagian halaman -> panel popup
    [].slice.call(document.querySelectorAll('[data-fm-panel]')).forEach(function (el) {
      var title = el.getAttribute('data-title') || 'Panel', sub = el.getAttribute('data-sub') || '', ic = el.getAttribute('data-ic') || 'grid';
      ensureStash().appendChild(el);
      var tl = actionTile(title, ic, function () { openPanel(el, title, sub); });
      if (el.hasAttribute('data-first')) grid.insertBefore(tl, grid.firstChild); else grid.appendChild(tl);
    });
  }

  /* ===================== dock ===================== */
  var MAP = {
    mutasi: ['Mutasi', 'swap'], tax: ['Pajak', 'tax'], ledger: ['Buku Besar', 'book'], closing_history: ['Closing', 'clock'],
    labarugi: ['Laba Rugi', 'chart'], audit_trail: ['Audit', 'shield']
  };
  function buildDock() {
    if (document.getElementById('fm-dock')) return;
    var tiles = [].slice.call(document.querySelectorAll('button[onclick*="openModal("]')).filter(function (b) {
      return b.querySelector('h4') && !b.closest('.fixed');
    });
    var custom = window.FM_DOCK_ITEMS;
    if (custom && custom.length) {
      tiles = []; 
    } else if (!tiles.length) return;
    var items = custom && custom.length ? custom.map(function (c) { return { label: c.label, icon: c.icon, fn: function () { new Function(c.run)(); } }; }) : tiles.map(function (b) {
      var m = /openModal\('([^']+)'/.exec(b.getAttribute('onclick') || '');
      var map = MAP[m ? m[1] : ''] || [(b.querySelector('h4').textContent || '').trim(), 'grid'];
      return { label: map[0], icon: map[1], el: b };
    });
    tiles.forEach(function (b) {
      b.classList.add('fm-tile');
      var p = b.parentElement;
      if (p && [].slice.call(p.children).every(function (c) { return c.classList.contains('fm-tile'); })) p.classList.add('fm-tile-wrap');
    });
    var wide = window.innerWidth >= 480;
    var tail = [{ label: 'Pengaturan', icon: 'gear', fn: function () { var g = document.getElementById('fm-gear'); if (g) g.click(); }, settings: true }];
    if (findLogout()) tail.push({ label: 'Keluar', icon: 'out', fn: window.FM_LOGOUT, danger: true });
    var maxShown = wide ? 9 : 5;
    var shown = items, extra = [];
    if (items.length + tail.length > maxShown) { var keep = maxShown - tail.length - 1; shown = items.slice(0, keep); extra = items.slice(keep); }
    function act(it) { return function () { if (it.fn) it.fn(); else it.el.click(); }; }
    function btn(it) {
      var b = document.createElement('button'); b.className = 'fm-dk' + (it.danger ? ' danger' : ''); b.type = 'button';
      b.innerHTML = svg(it.icon) + '<span>' + esc(it.label) + '</span>'; b.onclick = act(it); return b;
    }
    var dock = document.createElement('div'); dock.id = 'fm-dock'; dock.setAttribute('role', 'toolbar');
    shown.forEach(function (it) { dock.appendChild(btn(it)); });
    if (extra.length) {
      var mb = document.createElement('button'); mb.className = 'fm-dk'; mb.type = 'button'; mb.innerHTML = svg('more') + '<span>Lainnya</span>';
      mb.onclick = function () { showMore(extra, act); }; dock.appendChild(mb);
    }
    var sp = document.createElement('div'); sp.className = 'fm-sep'; dock.appendChild(sp);
    tail.forEach(function (it) { dock.appendChild(btn(it)); });
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

  /* ===================== judul pop-up bawaan ===================== */
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


  /* ===================== layar sempit (HP/tablet): tanpa gulir halaman, isi panjang jadi pop-up ===================== */
  var NARROW_MQ = window.matchMedia ? window.matchMedia('(max-width:1023px)') : { matches: false };
  function buildNarrow() {
    if (!NARROW_MQ.matches || !PAGE || PAGE === 'login') return;
    var main = document.querySelector('main'); if (!main) return;
    document.documentElement.setAttribute('data-fm-narrow', '1');
    var grid = document.getElementById('fm-actions');
    if (!grid) { grid = document.createElement('div'); grid.id = 'fm-actions'; grid.className = 'fm-actions'; main.appendChild(grid); }
    var first = document.createDocumentFragment(), last = document.createDocumentFragment();
    if (PAGE === 'manager' || PAGE === 'owner') {
      (window.FM_PLANS && !FM_PLANS.has('dashboard') ? [] : [['Ringkasan Hari Ini', 'chart'], ['Metode Bayar Hari Ini', 'swap'], ['Target Omzet', 'spark'], ['Stok Menipis', 'box'], ['Laba & Margin per Produk', 'tax']]).forEach(function (c) {
        first.appendChild(actionTile(c[0].replace(' Hari Ini', ''), c[1], function () {
          var el = [].slice.call(document.querySelectorAll('[data-fm-i]')).filter(function (x) { return x.getAttribute('data-fm-i') === c[0]; })[0];
          if (el) openPanel(el, c[0], ''); else if (window.FM_PLANS) FM_PLANS.openModal();
        }));
      });
    }
    if (PAGE === 'kasir') {
      var g2 = document.querySelector('main>.grid:nth-child(2)');
      if (g2) {
        var secs = [].slice.call(g2.children).filter(function (x) { return x.tagName === 'SECTION'; });
        var defs = [['Input Transaksi', 'plus', 'Catat penjualan atau pengeluaran kas'], ['Draft & Pembayaran', 'list', 'Antrean nota, metode bayar, dan cetak struk']];
        secs.forEach(function (sec, idx) {
          var d = defs[idx] || [sec.id || 'Panel', 'grid', ''];
          ensureStash().appendChild(sec);
          first.appendChild(actionTile(d[0], d[1], function () { openPanel(sec, d[0], d[2]); }));
        });
        g2.style.display = 'none';
      }
    }
    if (PAGE === 'tower') {
      var dir = main.querySelector(':scope>.ios-glass:last-child');
      if (dir && dir.querySelector('#umkm-table-body')) {
        ensureStash().appendChild(dir);
        first.appendChild(actionTile('Direktori Mitra', 'building', function () { openPanel(dir, 'Direktori Jaringan Mitra UMKM', 'Usia ID, mode, terminal, income, outcome, status'); }));
      }
    }
    if (document.getElementById('weather-text')) last.appendChild(actionTile('Cuaca & Lokasi', 'spark', function () { if (window.openWeatherModal) openWeatherModal(); }));
    if (document.getElementById('kurs-text')) last.appendChild(actionTile('Kurs & Emas', 'coins', function () { if (window.openKursModal) openKursModal(); }));
    grid.insertBefore(first, grid.firstChild); grid.appendChild(last);
  }


  /* ===================== ubin dinamis (gaya Windows Phone) =====================
     Jumlah kolom, lebar tiap ubin, dan tinggi baris dihitung dari ruang kosong yang tersedia.
     Tiap baris selalu penuh (tanpa lubang); ubin di baris yang lebih sepi otomatis melebar. */
  function layoutTiles() {
    var g = document.getElementById('fm-actions');
    if (!g || PAGE === 'tower' || PAGE === 'login') return;
    var tiles = [].slice.call(g.children).filter(function (c) { return c.classList && c.classList.contains('fm-act'); });
    var N = tiles.length; if (!N) return;
    g.setAttribute('data-fm-mosaic', '1');
    var W = g.clientWidth || 0; if (!W) return;
    var narrow = W < 560, GAP = 10, MIN_W = narrow ? 120 : 170, MIN_H = 60, MAX_H = narrow ? 200 : 460;
    // tinggi tersedia: hanya bila wadah memang diberi ruang (flex), selain itu tinggi alami
    g.style.maxHeight = ''; g.style.gridTemplateColumns = ''; g.style.gridAutoRows = '';
    tiles.forEach(function (t) { t.style.gridColumn = ''; t.removeAttribute('data-sz'); });
    var H = (parseFloat(getComputedStyle(g).flexGrow) > 0) ? (g.clientHeight || 0) : 0;
    var cMin = 2, cMax = Math.max(2, Math.min(6, Math.floor((W + GAP) / (MIN_W + GAP))));
    if (narrow) cMax = Math.min(cMax, 3);
    var best = null;
    for (var c = cMin; c <= cMax; c++) {
      var rows = Math.ceil(N / c), tw = (W - GAP * (c - 1)) / c;
      var th = H > 0 ? Math.min(MAX_H, (H - GAP * (rows - 1)) / rows) : 78;
      if (th < MIN_H && H > 0) th = MIN_H;
      var score = Math.abs(Math.log((tw / th) / 1.8)) + (N % c === 0 ? 0 : 0.04 * (c - (N % c))) ;
      if (!best || score < best.score) best = { c: c, rows: rows, th: th, score: score };
    }
    var cols = best.c, rows2 = best.rows, base = Math.floor(N / rows2), rem = N % rows2, idx = 0;
    for (var r = 0; r < rows2; r++) {
      var k = base + (r < rem ? 1 : 0), each = Math.floor(cols / k), extra = cols % k;
      for (var j = 0; j < k; j++) {
        var span = each + (j < extra ? 1 : 0);
        tiles[idx++].style.gridColumn = 'span ' + span;
      }
    }
    g.style.gridTemplateColumns = 'repeat(' + cols + ',minmax(0,1fr))';
    g.style.gridAutoRows = H > 0 ? 'minmax(' + MIN_H + 'px,' + Math.round(best.th) + 'px)' : 'minmax(' + MIN_H + 'px,auto)';
    g.style.alignContent = 'start';
    // ukuran isi ubin mengikuti ruang yang didapat
    tiles.forEach(function (t) {
      var w = t.offsetWidth, h = t.offsetHeight;
      t.setAttribute('data-sz', (h >= 150 && w >= 150) ? 'xl' : (h >= 100 && w >= 120) ? 'l' : 's');
      if (t.getAttribute('data-sz') === 's') t.removeAttribute('data-sz');
    });
  }
  /* kartu angka di atas: baris terakhir yang tidak penuh dilebarkan supaya tidak ada ruang kosong di pinggir */
  function fillStatRow() {
    var g = document.querySelector('main>.grid:first-child'); if (!g || PAGE === 'tower' || PAGE === 'login' || PAGE === 'kasir') return;
    var kids = [].slice.call(g.children).filter(function (c) { return c.offsetParent !== null || getComputedStyle(c).display !== 'none'; });
    kids.forEach(function (c) { c.style.gridColumn = ''; });
    var cols = (getComputedStyle(g).gridTemplateColumns || '').split(' ').filter(Boolean).length;
    if (cols < 2 || !kids.length) return;
    var k = kids.length, r = k % cols; if (!r) return;
    var rowStart = k - r, each = Math.floor(cols / r), extra = cols % r;
    for (var j = 0; j < r; j++) kids[rowStart + j].style.gridColumn = 'span ' + (each + (j < extra ? 1 : 0));
    if (k < cols) { g.style.gridTemplateColumns = 'repeat(' + k + ',minmax(0,1fr))'; kids.forEach(function (c) { c.style.gridColumn = ''; }); }
  }
  var tileT = 0;
  function scheduleTiles() { clearTimeout(tileT); tileT = setTimeout(function () { try { fillStatRow(); layoutTiles(); } catch (e) { console.warn('tiles', e); } }, 60); }
  function watchTiles() {
    var g = document.getElementById('fm-actions'); if (!g) return;
    window.addEventListener('resize', scheduleTiles);
    try { if (window.ResizeObserver) { var ro = new ResizeObserver(scheduleTiles); ro.observe(g); if (g.parentNode) ro.observe(g.parentNode); } } catch (e) {}
    try { new MutationObserver(scheduleTiles).observe(g, { childList: true }); } catch (e) {}
    scheduleTiles();
  }

  function init() {
    try { wrapOpenModal(); } catch (e) { console.warn('skin', e); }
    try { buildActions(); } catch (e) { console.warn('actions', e); }
    try { buildDock(); } catch (e) { console.warn('dock', e); }
    try { buildNarrow(); } catch (e) { console.warn('narrow', e); }
    try { watchTiles(); } catch (e) { console.warn('tiles', e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
  else setTimeout(init, 0);
})();
