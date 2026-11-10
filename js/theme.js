/* theme.js — tampilan bersama: font bergaya iPhone, gerakan halus, mode Terang / Gelap Pekat, warna pilihan pengguna,
   menu Pengaturan (tema, warna, logo usaha, versi, catatan rilis). Dipakai Tower, kasir, manager, owner.
   Preferensi tersimpan di perangkat ini, terpisah per toko dan per peran. */
(function () {
  var APP_VERSION = '1.0.0';
  var BETA = 'BETA 1.3';
  var RELEASE_NOTES = [
    ['1.0.0 (BETA 1.3)', '11 Nov 2026', ['Tampilan baru bergaya One UI berbalut kaca: bilah header ringkas, kartu rata tanpa gradasi, tombol pil seragam', 'Halaman desktop pas satu layar tanpa gulir halaman; ruang kosong diisi ringkasan', 'Tombol tindakan dirapikan dalam grid seragam; bagian panjang (instruksi kasir, analisis AI) dibuka lewat pop-up', 'Tombol Keluar dipindah ke dock (di HP ada di Pengaturan); chip versi di header dihapus', 'Scrollbar pop-up disembunyikan agar tampil bersih']],
    ['1.0.0 (BETA 1.2)', '11 Nov 2026', ['Kulit tampilan baru "Glass 2026": kartu, tombol, dan pop-up bergaya kaca seragam di semua halaman', 'Dock di bagian bawah layar; setiap menu membuka pop-up tanpa pindah halaman', 'Judul pop-up diperbaiki di semua halaman']],
    ['1.0.0 (BETA 1.1)', '11 Nov 2026', ['Tampilan baru yang lebih tenang dan rapi di desktop, tablet, dan HP: satu warna aksen, permukaan netral','Rilis uji awal: kasir, manager, owner, dan portal login per toko', 'Fitur & Paket: lihat fitur Basic, Plus, Pro (yang terkunci tetap terlihat)', 'Dashboard owner: ringkasan hari ini, laba per produk, stok menipis, metode bayar, target omzet, ekspor CSV', 'Kasir: scan barcode, jumlah (pcs), metode bayar, struk WhatsApp (Plus)', 'Tema terang/gelap pekat, warna halaman, logo usaha']]
  ];
  var ACCENTS = ['#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#e11d48', '#ea580c', '#ca8a04', '#059669', '#0d9488', '#475569'];

  var script = document.currentScript;
  var LITE = !!(script && script.hasAttribute('data-lite'));
  var path = (location.pathname || '').toLowerCase();
  var ROLE = path.indexOf('kasir') >= 0 ? 'kasir' : path.indexOf('manager') >= 0 ? 'manager' : path.indexOf('dashboard') >= 0 ? 'owner' : path.indexOf('provider') >= 0 ? 'tower' : path.indexOf('partner') >= 0 ? 'partner' : (path.indexOf('index') >= 0 || /\/$/.test(path)) ? 'login' : 'lain';
  var NATIVE = (ROLE === 'kasir' || ROLE === 'login') ? 'light' : 'dark';
  var TOKO = ''; try { TOKO = (new URLSearchParams(location.search).get('toko') || '').toLowerCase().trim(); } catch (e) {}
  var KEY = 'fm_theme_' + (TOKO || 'master') + '_' + ROLE;

  function loadPref() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function savePref(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  var pref = loadPref();

  var CSS = [
    'html,body,button,input,select,textarea{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display",Inter,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif!important}',
    '.font-mono{font-family:ui-monospace,"SF Mono",Menlo,"JetBrains Mono",Consolas,monospace!important}',
    'html{-webkit-text-size-adjust:100%}',
    '@media(max-width:640px){input,select,textarea{font-size:16px!important}button,select,input:not([type=checkbox]):not([type=radio]):not([type=color]){min-height:40px}body{padding-bottom:env(safe-area-inset-bottom)}table{font-size:12px}}',
    'body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;letter-spacing:-.011em}',
    // gerakan halus
    'button,[onclick],a,select,input,.ios-glass,.white-ice-glass-card{transition:transform .18s cubic-bezier(.2,.8,.2,1),background-color .22s ease,border-color .22s ease,box-shadow .22s ease,opacity .22s ease,color .22s ease}',
    'button:active,[role=button]:active{transform:scale(.97)}',
    '@keyframes fmFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
    '@keyframes fmSheet{from{opacity:0;transform:translateY(24px) scale(.98)}to{opacity:1;transform:none}}',
    '@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}',
    // keterbacaan: teks sangat kecil dinaikkan sedikit
    '.text-\\[9px\\]{font-size:10.5px!important}.text-\\[10px\\]{font-size:11.5px!important}.text-\\[11px\\]{font-size:12px!important}',
    // gelap pekat (halaman bawaan gelap)
    'html[data-fm-black="1"] body{background:#000!important;background-image:none!important;color:#f5f5f7}',
    'html[data-fm-black="1"] .ios-glass{background:rgba(10,10,12,.97)!important;border-color:rgba(255,255,255,.1)!important;box-shadow:0 1px 0 rgba(255,255,255,.05) inset!important}',
    'html[data-fm-black="1"] .glass-capsule,html[data-fm-black="1"] .glass-capsule-dark{background:#000!important;border-color:rgba(255,255,255,.14)!important}',
    'html[data-fm-black="1"] .bg-slate-900,html[data-fm-black="1"] .bg-slate-950{background-color:#050507!important}',
    'html[data-fm-black="1"] .text-slate-500{color:#8e96a8!important}html[data-fm-black="1"] .text-slate-400{color:#b6bece!important}html[data-fm-black="1"] .text-slate-600{color:#7f8799!important}',
    // mode kebalikan (terang pada halaman gelap / gelap pada halaman terang)
    'html[data-fm-invert="1"]{filter:invert(1) hue-rotate(180deg);background:#fff}',
    'html[data-fm-invert="1"] body{background-color:#fff!important;background-image:none!important}',
    'html[data-fm-invert="1"] img,html[data-fm-invert="1"] video,html[data-fm-invert="1"] canvas,html[data-fm-invert="1"] .oneui-hero,html[data-fm-invert="1"] header.bg-gradient-to-r,html[data-fm-invert="1"] .fm-keep{filter:invert(1) hue-rotate(180deg)}',
    '@media print{html[data-fm-invert="1"]{filter:none!important;background:#fff!important}html[data-fm-invert="1"] img,html[data-fm-invert="1"] .oneui-hero,html[data-fm-invert="1"] header.bg-gradient-to-r{filter:none!important}}',
    // warna pilihan pengguna
    'html[data-fm-accent] .oneui-hero{background:linear-gradient(160deg,#0b0e13 0%,color-mix(in srgb,var(--fm-accent) 30%,#0b0e13) 100%)!important}',
    'html[data-fm-accent] header.bg-gradient-to-r{background:linear-gradient(90deg,#000 0%,color-mix(in srgb,var(--fm-accent) 45%,#000) 55%,#000 100%)!important}',
    'html[data-fm-accent]:not([data-fm-black]):not([data-fm-invert]) body{background-image:radial-gradient(at 8% 8%,color-mix(in srgb,var(--fm-accent) 9%,transparent) 0,transparent 45%),radial-gradient(at 92% 92%,color-mix(in srgb,var(--fm-accent) 6%,transparent) 0,transparent 50%)!important}',
    'html[data-fm-accent] input:focus,html[data-fm-accent] select:focus,html[data-fm-accent] textarea:focus{border-color:var(--fm-accent)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--fm-accent) 25%,transparent)!important}',
    'html[data-fm-accent] ::selection{background:var(--fm-accent);color:#fff}',
    // tombol & panel pengaturan
    '#fm-gear{position:fixed;left:14px;bottom:14px;z-index:2147480000;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(18,18,22,.92);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.45);backdrop-filter:blur(14px)}',
    '#fm-gear:hover{transform:rotate(30deg)}',
    '#fm-set{display:none;position:fixed;inset:0;z-index:2147481000;background:rgba(0,0,0,.66);backdrop-filter:blur(6px);align-items:flex-end;justify-content:center}',
    '@media(min-width:640px){#fm-set{align-items:center}}',
    '#fm-set .fm-sheet{width:100%;max-width:460px;max-height:90vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:26px 26px 0 0;padding:20px 18px 26px;animation:fmSheet .3s cubic-bezier(.16,1,.3,1)}',
    '@media(min-width:640px){#fm-set .fm-sheet{border-radius:26px}}',
    '#fm-set h3{font-size:18px;font-weight:800;margin:0}',
    '#fm-set .fm-sec{margin-top:18px}#fm-set .fm-lab{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8e96a8;margin-bottom:8px}',
    '#fm-set .fm-card{background:#15151b;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:12px 14px}',
    '#fm-set .fm-modes{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
    '#fm-set .fm-mode{border:2px solid rgba(255,255,255,.1);border-radius:16px;padding:12px;cursor:pointer;background:#15151b;text-align:left;color:#f5f5f7;font-weight:700;font-size:13px}',
    '#fm-set .fm-mode.on{border-color:var(--fm-pick,#2563eb);box-shadow:0 0 0 3px color-mix(in srgb,var(--fm-pick,#2563eb) 28%,transparent)}',
    '#fm-set .fm-prev{height:46px;border-radius:10px;margin-bottom:8px;border:1px solid rgba(255,255,255,.12)}',
    '#fm-set .fm-sw{display:flex;flex-wrap:wrap;gap:10px;align-items:center}',
    '#fm-set .fm-dot{width:34px;height:34px;border-radius:50%;border:3px solid transparent;cursor:pointer;outline:1px solid rgba(255,255,255,.2)}',
    '#fm-set .fm-dot.on{border-color:#fff}',
    '#fm-set .fm-btn{border:0;border-radius:12px;padding:10px 14px;font-weight:800;font-size:12px;cursor:pointer;background:#2a2a33;color:#fff}',
    '#fm-set .fm-btn.pri{background:var(--fm-pick,#2563eb)}',
    '#fm-set details{background:#15151b;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px 14px;margin-bottom:8px}',
    '#fm-set summary{cursor:pointer;font-weight:700;font-size:13px}',
    '#fm-set ul{margin:8px 0 0;padding-left:18px;font-size:12px;line-height:1.7;color:#c7cbd6}'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.id = 'fm-theme-css';
  styleEl.textContent = CSS;
  (document.head || document.documentElement).appendChild(styleEl);

  function apply() {
    var h = document.documentElement;
    var mode = pref.mode || NATIVE;           // 'light' | 'dark'
    h.setAttribute('data-fm-native', NATIVE);
    ['data-fm-black', 'data-fm-invert', 'data-fm-accent'].forEach(function (a) { h.removeAttribute(a); });
    if (!LITE && ROLE !== 'lain') {
      if (mode !== NATIVE) h.setAttribute('data-fm-invert', '1');
      else if (mode === 'dark') h.setAttribute('data-fm-black', '1');
      if (pref.accent) { h.setAttribute('data-fm-accent', '1'); h.style.setProperty('--fm-accent', pref.accent); }
      else h.style.removeProperty('--fm-accent');
    }
  }
  apply();
  if (LITE || ROLE === 'lain') return;
  if (ROLE === 'login' || ROLE === 'partner') { /* tema & gerigi tersedia; logo/pengaturan toko tidak */ }

  // ---------- menu Pengaturan ----------
  var TENANT_ID = (TOKO && TOKO !== 'oneilverse') ? TOKO.toUpperCase() : 'ID26110901';
  var CAN_LOGO = (ROLE === 'owner' || ROLE === 'manager');
  var logoData = null;

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function build() {
    var gear = document.createElement('button');
    gear.id = 'fm-gear'; gear.type = 'button'; gear.setAttribute('aria-label', 'Pengaturan');
    gear.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
    document.body.appendChild(gear);
    var set = document.createElement('div');
    set.id = 'fm-set';
    set.innerHTML = '<div class="fm-sheet"></div>';
    document.body.appendChild(set);
    gear.onclick = function () { render(); set.style.display = 'flex'; };
    set.addEventListener('click', function (e) { if (e.target === set) set.style.display = 'none'; });
  }

  function render() {
    var box = document.querySelector('#fm-set .fm-sheet');
    var mode = pref.mode || NATIVE;
    var pick = pref.accent || '#2563eb';
    box.style.setProperty('--fm-pick', pick);
    var h = '<div style="display:flex;justify-content:space-between;align-items:center"><h3>Pengaturan</h3><button class="fm-btn" data-close>Tutup</button></div>';
    h += '<div class="fm-sec"><div class="fm-lab">Tema</div><div class="fm-modes">' +
      '<button class="fm-mode ' + (mode === 'light' ? 'on' : '') + '" data-mode="light"><div class="fm-prev" style="background:linear-gradient(135deg,#ffffff,#e2e8f0)"></div>Terang</button>' +
      '<button class="fm-mode ' + (mode === 'dark' ? 'on' : '') + '" data-mode="dark"><div class="fm-prev" style="background:#000"></div>Gelap Pekat</button></div></div>';
    h += '<div class="fm-sec"><div class="fm-lab">Atur Warna Halaman</div><div class="fm-card"><div class="fm-sw">' +
      ACCENTS.map(function (c) { return '<span class="fm-dot ' + (pref.accent === c ? 'on' : '') + '" data-acc="' + c + '" style="background:' + c + '"></span>'; }).join('') +
      '</div><div style="display:flex;gap:10px;align-items:center;margin-top:12px"><label style="font-size:12px;color:#c7cbd6">Warna bebas</label><input type="color" id="fm-acc-custom" value="' + esc(pick) + '" style="width:44px;height:30px;border:0;background:none;padding:0"><button class="fm-btn" data-accreset style="margin-left:auto">Kembali ke Bawaan</button></div></div></div>';
    if (CAN_LOGO) {
      h += '<div class="fm-sec"><div class="fm-lab">Logo Usaha</div><div class="fm-card">' +
        '<div style="display:flex;gap:12px;align-items:center"><div id="fm-logo-prev" style="width:64px;height:64px;border-radius:16px;background:#22222b;display:flex;align-items:center;justify-content:center;overflow:hidden;font-weight:800;color:#8e96a8;font-size:12px">' + (logoData ? '<img src="' + esc(logoData) + '" style="width:100%;height:100%;object-fit:contain">' : 'Inisial') + '</div>' +
        '<div style="flex:1;font-size:12px;line-height:1.55;color:#c7cbd6">Unggah logo (JPG, PNG, atau WebP). <b style="color:#fff">Ukuran logo dibatasi maksimal 100 KB.</b> Gambar yang lebih besar akan diperkecil otomatis; disarankan bentuk persegi. Jika tidak ada logo, tampil inisial nama usaha.</div></div>' +
        '<div style="display:flex;gap:8px;margin-top:10px"><label class="fm-btn pri" style="cursor:pointer">Pilih Gambar<input type="file" id="fm-logo-file" accept="image/*" style="display:none"></label>' + (logoData ? '<button class="fm-btn" data-logodel>Hapus Logo</button>' : '') + '</div>' +
        '<p id="fm-logo-msg" style="font-size:12px;margin:8px 0 0;color:#fca5a5"></p></div></div>';
    }
    if (window.FM_PLANS) h += '<div class="fm-sec"><button class="fm-btn pri" data-plans style="width:100%;padding:13px">✨ Fitur &amp; Paket</button></div>';
    if (window.FM_LOGOUT && window.innerWidth < 480) h += '<div class="fm-sec"><button class="fm-btn" data-logout style="width:100%;padding:13px;color:#fda4af">Keluar dari Akun</button></div>';
    h += '<div class="fm-sec"><div class="fm-lab">Versi Aplikasi</div><div class="fm-card" style="display:flex;justify-content:space-between;font-size:13px"><span>Oneilverse POS</span><b>v' + APP_VERSION + ' · ' + BETA + '</b></div></div>';
    h += '<div class="fm-sec"><div class="fm-lab">Catatan Rilis</div>' + RELEASE_NOTES.map(function (n, i) {
      return '<details ' + (i === 0 ? 'open' : '') + '><summary>v' + n[0] + ' · ' + n[1] + '</summary><ul>' + n[2].map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></details>';
    }).join('') + '</div>';
    h += '<p style="font-size:11px;color:#8e96a8;margin-top:14px;line-height:1.5">Tema dan warna tersimpan di perangkat ini, terpisah untuk tiap peran.</p>';
    box.innerHTML = h;

    var lo = box.querySelector('[data-logout]'); if (lo) lo.onclick = function () { document.getElementById('fm-set').style.display = 'none'; window.FM_LOGOUT(); };
    var pb = box.querySelector('[data-plans]'); if (pb) pb.onclick = function () { document.getElementById('fm-set').style.display = 'none'; if (window.FM_PLANS) FM_PLANS.openModal(); };
    box.querySelector('[data-close]').onclick = function () { document.getElementById('fm-set').style.display = 'none'; };
    box.querySelectorAll('[data-mode]').forEach(function (b) { b.onclick = function () { pref.mode = b.getAttribute('data-mode'); savePref(pref); apply(); render(); }; });
    box.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function () { pref.accent = b.getAttribute('data-acc'); savePref(pref); apply(); render(); }; });
    box.querySelector('#fm-acc-custom').oninput = function (e) { pref.accent = e.target.value; savePref(pref); apply(); };
    box.querySelector('#fm-acc-custom').onchange = function () { render(); };
    box.querySelector('[data-accreset]').onclick = function () { delete pref.accent; savePref(pref); apply(); render(); };
    var lf = box.querySelector('#fm-logo-file'); if (lf) lf.onchange = function () { if (lf.files && lf.files[0]) uploadLogo(lf.files[0]); };
    var ld = box.querySelector('[data-logodel]'); if (ld) ld.onclick = function () { saveLogo(''); };
  }

  // ---------- logo usaha ----------
  function logoMsg(t, ok) { var m = document.getElementById('fm-logo-msg'); if (m) { m.style.color = ok ? '#86efac' : '#fca5a5'; m.textContent = t; } }
  function compress(file) {
    return new Promise(function (res, rej) {
      if (!/^image\//.test(file.type)) return rej(new Error('File harus berupa gambar.'));
      if (file.size > 10 * 1024 * 1024) return rej(new Error('Gambar terlalu besar (maks. 10 MB sebelum diperkecil).'));
      var fr = new FileReader();
      fr.onerror = function () { rej(new Error('Gagal membaca file.')); };
      fr.onload = function () {
        var img = new Image();
        img.onerror = function () { rej(new Error('Gambar tidak dapat dibuka.')); };
        img.onload = function () {
          var sizes = [256, 192, 144, 112, 80], MAX = 100 * 1024;
          for (var s = 0; s < sizes.length; s++) {
            var c = document.createElement('canvas'), d = sizes[s];
            c.width = d; c.height = d;
            var ctx = c.getContext('2d');
            var r = Math.min(d / img.width, d / img.height), w = img.width * r, hh = img.height * r;
            ctx.drawImage(img, (d - w) / 2, (d - hh) / 2, w, hh);
            var qs = [0.92, 0.8, 0.65, 0.5];
            for (var q = 0; q < qs.length; q++) {
              var u = c.toDataURL('image/webp', qs[q]);
              if (u.indexOf('data:image/webp') !== 0) u = c.toDataURL('image/png');   // peramban tanpa WebP
              if ((u.length - u.indexOf(',') - 1) * 0.75 <= MAX) return res(u);
              if (u.indexOf('data:image/png') === 0) break;                           // PNG tidak punya kualitas: perkecil dimensi
            }
          }
          rej(new Error('Gambar tidak bisa diperkecil hingga 100 KB. Coba gambar yang lebih sederhana.'));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  // gambar mini (untuk daftar klien di Tower) disimpan terpisah agar Tower tidak perlu mengunduh logo penuh
  function makeThumb(dataUrl) {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () {
        var c = document.createElement('canvas'); c.width = 64; c.height = 64;
        var r = Math.min(64 / im.width, 64 / im.height), w = im.width * r, h = im.height * r;
        c.getContext('2d').drawImage(im, (64 - w) / 2, (64 - h) / 2, w, h);
        var u = c.toDataURL('image/webp', 0.75); if (u.indexOf('data:image/webp') !== 0) u = c.toDataURL('image/png');
        res(u);
      };
      im.onerror = function () { res(''); };
      im.src = dataUrl;
    });
  }
  function uploadLogo(file) {
    logoMsg('Memproses...', true);
    compress(file).then(saveLogo).catch(function (e) { logoMsg(e.message, false); });
  }
  function saveLogo(data) {
    if (!(typeof db !== 'undefined' && db)) { logoMsg('Belum terhubung ke server. Coba lagi sebentar.', false); return; }
    var upd = data ? { logo: data, logoUpdatedAt: Date.now() } : { logo: firebase.firestore.FieldValue.delete(), logoUpdatedAt: Date.now() };
    var thumbP = data ? makeThumb(data) : Promise.resolve('');
    thumbP.then(function (thumb) {
      var w = db.collection('tenant_logos').doc(TENANT_ID);
      return Promise.all([db.collection('tenant_settings').doc(TENANT_ID).set(upd, { merge: true }), data ? w.set({ thumb: thumb, updatedAt: Date.now() }) : w.delete()]);
    }).then(function () {
      logoData = data || null; applyLogo(); render();
      logoMsg(data ? 'Logo tersimpan (' + Math.round((data.length - data.indexOf(',') - 1) * 0.75 / 1024) + ' KB).' : 'Logo dihapus.', true);
    }).catch(function (e) { logoMsg('Gagal menyimpan: ' + e.message, false); });
  }
  function applyLogo() {
    try {
      var nameEl = document.getElementById('topbar-store-name');
      if (!nameEl) return;
      var box = nameEl, svg = null;
      while (box && box.parentElement && !svg) { box = box.parentElement; svg = box.querySelector('svg'); }
      if (!svg || !svg.parentElement) return;
      var holder = svg.parentElement, badge = document.getElementById('ctrl-logo-badge'), img = document.getElementById('fm-logo-img');
      if (logoData) {
        if (!img) { img = document.createElement('img'); img.id = 'fm-logo-img'; img.alt = 'Logo'; img.style.cssText = 'width:100%;height:100%;min-height:40px;object-fit:contain;border-radius:14px'; holder.appendChild(img); }
        img.src = logoData; svg.style.display = 'none'; if (badge) badge.style.display = 'none';
        var ri = document.getElementById('receipt-logo-img'); if (ri) { ri.src = logoData; ri.classList.remove('hidden'); }
      } else {
        var ri2 = document.getElementById('receipt-logo-img'); if (ri2) ri2.classList.add('hidden');
        if (img) img.remove();
        if (badge) badge.style.display = 'flex'; else svg.style.display = '';
      }
    } catch (e) {}
  }
  function startLogo() {
    var tries = 0, t = setInterval(function () {
      tries++;
      if (typeof db !== 'undefined' && db) {
        clearInterval(t);
        db.collection('tenant_settings').doc(TENANT_ID).onSnapshot(function (snap) {
          var d = snap.exists ? snap.data() : null;
          logoData = (d && d.logo) || null;
          applyLogo(); setTimeout(applyLogo, 600); setTimeout(applyLogo, 2500);
        }, function () {});
      } else if (tries > 100) clearInterval(t);
    }, 100);
  }

  // logo di halaman login (belum ada koneksi Firebase di sana: baca lewat REST)
  function loginLogo() {
    if (ROLE !== 'login' || !TOKO || TOKO === 'oneilverse') return;
    try {
      var x = new XMLHttpRequest();
      x.open('GET', 'https://firestore.googleapis.com/v1/projects/finance-ai-master-byneilverse/databases/(default)/documents/tenant_settings/' + encodeURIComponent(TENANT_ID) + '?key=AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI', true);
      x.onload = function () {
        if (x.status !== 200) return;
        try { var f = JSON.parse(x.responseText).fields || {}; logoData = (f.logo && f.logo.stringValue) || null; applyLoginLogo(); } catch (e) {}
      };
      x.send();
    } catch (e) {}
  }
  function applyLoginLogo() {
    var trig = document.getElementById('login-logo-trigger'); if (!trig) return;
    var img = document.getElementById('fm-login-logo'), svg = trig.querySelector('svg'), badge = document.getElementById('login-logo-badge');
    if (logoData) {
      if (!img) { img = document.createElement('img'); img.id = 'fm-login-logo'; img.alt = 'Logo'; img.style.cssText = 'width:80px;height:80px;object-fit:contain;border-radius:24px'; trig.appendChild(img); }
      img.src = logoData; if (svg) svg.style.display = 'none'; if (badge) badge.style.display = 'none';
    } else if (img) img.remove();
  }
  function init() {
    build();
    if (ROLE === 'login') {
      var o = window.applyTenantBranding;
      if (typeof o === 'function') window.applyTenantBranding = function (tn) { o(tn); applyLoginLogo(); };
      loginLogo();
    } else if (ROLE !== 'tower' && ROLE !== 'partner') startLogo();
  }
  window.FM_THEME = { version: APP_VERSION, open: function () { document.getElementById('fm-gear').click(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
