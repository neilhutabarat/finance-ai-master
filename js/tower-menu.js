/* Menu Control Tower: ubin dikelompokkan (Klien / Uang / Sistem), ubin "segera" untuk fitur yang belum bisa dipakai,
   dan palet warna yang lebih tenang. Hanya aktif di halaman Tower. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;

  var GROUPS = [
    { id: 'klien', title: 'Kelola Toko Klien', hint: 'Toko yang sudah berjalan', c: '#8fb8e8', items: [
      { t: 'Permohonan Kasir', ic: 'users', run: "openModal('tickets')", badge: 'stat-pending-tickets', d: 'Setujui atau tolak terminal baru' },
      { t: 'Lokasi & Aktivitas', ic: 'shield', run: "towerPick('lokasi')", d: 'GPS, online, mutasi live' },
      { t: 'Jaringan Mitra', ic: 'building', find: 'Jaringan Mitra', d: 'Pantau daftar toko (hanya lihat)' },
      { t: 'Link Toko', ic: 'send', run: "towerPick('link')", d: 'Salin link login' },
      { t: 'Bekukan / Aktifkan', ic: 'moon', run: "towerPick('freeze')", d: 'Bekukan atau aktifkan toko' },
      { t: 'Kendali Massal', ic: 'users', run: "towerMass()", d: 'Bekukan, pesan, paket fitur: banyak toko' },
      { t: 'Toko Berhenti', ic: 'archive', find: 'Toko Berhenti', d: 'Toko yang dibekukan atau berhenti' },
      { t: 'Hapus / Pulihkan Klien', ic: 'trash', run: "towerPick('hapus')", d: 'Hapus klien atau pulihkan' }
    ] },
    { id: 'pantau', title: 'Pantau & Bantuan', hint: 'Tiket klien, error, dan kesehatan sistem', c: '#9fa8e6', items: [
      { t: 'Tiket Bantuan', ic: 'bell', run: "FM_HELPDESK.open()", d: 'Pertanyaan dari klien, balas di sini' },
      { t: 'Pemantauan Error', ic: 'bell', run: "FM_MON.open('error')", d: 'Error aplikasi dari toko, kapan dan di mana' },
      { t: 'Log Login', ic: 'users', run: "FM_MON.open('login')", d: 'Siapa masuk, kapan, perangkat apa' },
      { t: 'Kesehatan Sistem', ic: 'shield', run: "FM_HEALTH.open()", d: 'Pindai, bersihkan server, perbaiki bug data' }
    ] },
    { id: 'uang', title: 'Keuangan', hint: 'Tagihan, pajak, dan pembukuan', c: '#d9b872', items: [
      { t: 'Billing Toko', ic: 'chart', run: "towerPick('billing')", d: 'Biaya dan pembayaran toko' },
      { t: 'Billing Jaringan', ic: 'chart', find: 'Billing Jaringan', d: 'Tagihan, jatuh tempo, cicilan, uji coba' },
      { t: 'Pengingat Jatuh Tempo', ic: 'bell', run: "towerDue()", d: 'Toko yang tagihannya dekat' },
      { t: 'Pajak Jaringan', ic: 'tax', run: "openModal('tax_net')", d: 'Pajak yang disumbangkan tiap toko' },
      { t: 'Catat Pembukuan', dup: true, ic: 'swap', run: "openModal('provider_input_tx')", d: 'Pemasukan dan pengeluaran Tower' },
      { t: 'COA Provider', ic: 'list', find: 'COA Provider', d: 'Daftar akun, bisa diseret untuk urutan' },
      { t: 'Kurs & Emas', ic: 'coins', find: 'Kurs', d: 'Kurs dan harga emas terkini' }
    ] },
    { id: 'bangun', title: 'Daftar & Siapkan Toko', hint: 'Untuk klien baru', c: '#6fc7c0', items: [
      { t: 'Klien Baru', dup: true, ic: 'store', run: "openModal('add_tenant')", d: 'Daftarkan toko, pilih jenis usaha' },
      { t: 'Profil Toko', ic: 'store', run: "towerPick('profil')", d: 'Nama, slogan, warna, logo' },
      { t: 'Fitur Toko', ic: 'grid', run: "towerPick('fitur')", d: 'Centang fitur per peran' },
      { t: 'COA Toko', ic: 'list', run: "towerPick('coa')", d: 'Daftar akun toko' },
      { t: 'Stok & Katalog', ic: 'box', run: "FM_LAB.open('template')", d: 'Isi katalog awal, simpan & salin template toko' },
      { t: 'Kuota Terminal', ic: 'users', run: "towerPick('kuota')", d: 'Kasir, Manager, Owner' },
      { t: 'Salin Fitur', ic: 'grid', run: "towerPick('salin')", d: 'Salin fitur dari toko lain' }
    ] },
    { id: 'paket', title: 'Paket, Versi & Serah Terima', hint: 'Setelah toko siap', c: '#e0a47a', items: [
      { t: 'Paket & Billing', ic: 'tag', run: "towerPick('paket')", d: 'Basic atau Plus, lalu tagihan' },
      { t: 'Versi Toko', ic: 'swap', run: "towerPick('versi')", d: 'Kunci versi aplikasi' },
      { t: 'Rakit & Uji', ic: 'grid', run: "FM_LAB.open('rakit')", d: 'Aktifkan fitur satu per satu, catat hasil uji' },
      { t: 'Ubah ID', ic: 'key', run: "FM_LAB.open('rename')", d: 'Ganti ID toko yang belum Published' },
      { t: 'Published', ic: 'send', run: "FM_LAB.open('publish')", d: 'Tandai toko yang sudah diserahkan' }
    ] },
    { id: 'uji', title: 'Data & Uji Coba', hint: 'Hati-hati: mengubah atau menghapus data uji', c: '#e29a9a', items: [
      { t: 'Reset Statistik', warn: true, ic: 'trash', run: "FM_LAB.open('reset')", d: 'Hapus data uji coba toko, kembali ke 0' },
      { t: 'Data Demo', ic: 'grid', run: "FM_DEMO.open()", d: 'Isi toko uji dengan transaksi contoh' },
      { t: 'Uji Mandiri', ic: 'shield', run: "FM_QA.open()", d: 'Cek file, versi, dan kecocokan data toko (baca-saja)' }
    ] },
    { id: 'tampil', title: 'Tampilan & Komunikasi', hint: 'Wallpaper, pengumuman, dan chat', c: '#8fd0b0', items: [
      { t: 'Wallpaper', ic: 'spark', run: "FM_TWALL.open()", d: 'Atur tampilan toko: wallpaper (unggah sendiri), kejelasan kaca, hujan di kaca, wallpaper portal. Berganti tanpa muat ulang' },
      { t: 'Pesan Siaran', dup: true, ic: 'send', run: "openModal('broadcast_modal')", d: 'Kirim pengumuman ke semua toko' },
      { t: 'Catatan Rilis', ic: 'book', find: 'Catatan Rilis', d: 'Riwayat pembaruan untuk klien' },
      { t: 'Chat Global', ic: 'bell', run: "if(window.FM_CHAT)FM_CHAT.openModeration()", d: 'Moderasi, bisukan, nyala atau mati' },
      { t: 'Hapus Semua Chat', ic: 'trash', run: "if(window.FM_CHAT)FM_CHAT.clearAll()", d: 'Kosongkan Chat Universe (permanen)' }
    ] },
    { id: 'sistem', title: 'Pengaturan Sistem', hint: 'Jarang disentuh', c: '#b8bccc', items: [
      { t: 'Akun Login', ic: 'key', find: 'Akun Login', d: 'PIN Admin, Manager, Owner toko' },
      { t: 'OneilStore', ic: 'tag', run: "FM_TSTORE.open()", d: 'Permintaan sewa, sewa aktif, beri sewa, dan mode demo toko' },
      { t: 'Rollout Versi', ic: 'box', run: "if(window.openRolloutModal)openRolloutModal()", d: 'Versi default Basic dan Plus' }
    ] }
  ];

  var CSS = [
    /* palet tenang: biru-abu lembut, kartu tidak terlalu pekat */
    'html[data-fm-page="tower"][data-fm-native="dark"]:not([data-fm-invert]){--s-bg:#000;--s-surf:rgba(255,255,255,.04);--s-line:rgba(255,255,255,.11);--s-hi:rgba(255,255,255,.14);--s-shadow:rgba(0,0,0,.9);--s-gloss:rgba(255,255,255,.02)}',
    'html[data-fm-page="tower"][data-fm-native="dark"]:not([data-fm-invert]) body{background:#000!important;background-image:none!important;color:#dfe5f2}',
    'html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child>*{background:#07090c!important;background-image:none!important;border-color:rgba(255,255,255,.12)!important}',
    'html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child .text-white,html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child h3{color:#e6ebf6!important}',
    'html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child .text-indigo-300,html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child .text-cyan-300,html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child .text-amber-300,html[data-fm-page="tower"]:not([data-fm-invert]) main>.grid:first-child .text-rose-300{filter:saturate(.7)}',
    /* kelompok menu */
    'html[data-fm-page="tower"] #fm-actions.tw-grouped{display:flex!important;flex-direction:column;gap:8px;flex:1 1 0!important;min-height:0;overflow:hidden;grid-template-columns:none!important;padding:2px 2px 76px}',
    '.tw-group{display:flex;flex-direction:column;gap:5px}',
    '.tw-head{display:flex;align-items:baseline;gap:10px;padding:0 4px}',
    '.tw-head b{font-size:13px;font-weight:800;letter-spacing:.01em;color:var(--g)}',
    '.tw-head span{font-size:11px;opacity:.55}',
    '.tw-head:before{content:"";align-self:center;width:4px;height:14px;border-radius:3px;background:var(--g)}',
    '.tw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:7px}',
    'html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act{flex-direction:row!important;justify-content:flex-start!important;text-align:left!important;gap:11px!important;min-height:36px;height:auto;font-size:12px!important;font-weight:700!important;padding:5px 11px!important;position:relative;border-radius:16px}',
    'html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act i{width:28px!important;height:28px!important;border-radius:12px!important;background:color-mix(in srgb,var(--g) 18%,transparent)!important;color:var(--g)!important}',
    'html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act svg{width:16px!important;height:16px!important}',
    'html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act span{white-space:normal!important;line-height:1.2}',
    '.tw-soon{opacity:.42;filter:grayscale(.55);border-style:dashed!important;cursor:default!important}',
    '.tw-soon:hover{transform:none!important;filter:grayscale(.55)!important}',
    '.tw-pill{margin-left:auto;flex:none;font-size:9.5px;font-weight:800;padding:2px 8px;border-radius:999px;background:rgba(188,201,230,.16);color:#cdd6ea}',
    '.tw-cnt{margin-left:auto;flex:none;min-width:22px;text-align:center;font-size:11px;font-weight:800;padding:2px 7px;border-radius:999px;background:#c9706f;color:#fff}',
    '.tw-rowbtns button{white-space:nowrap}',
    '.fm-act small{display:none}@media(max-width:1023px){.tw-dup{display:none!important}}',
    '@media(max-width:640px){.tw-grid{grid-template-columns:repeat(2,minmax(0,1fr))}html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act{padding:8px 10px!important;font-size:12.5px!important;gap:8px!important}html[data-fm-page="tower"] #fm-actions.tw-grouped .fm-act i{width:30px!important;height:30px!important}}'
  ].join('\n');

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function tile(it, g) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'fm-act' + (it.warn ? ' tw-warn' : '') + (it.soon ? ' tw-soon' : '') + (it.dup ? ' tw-dup' : ''); b.setAttribute('data-tw', it.t);
    b.innerHTML = '<i>' + (window.FM_SVG ? FM_SVG(it.ic) : '') + '</i><span>' + esc(it.t) + '</span>' + (it.soon ? '<em class="tw-pill" style="font-style:normal">segera</em>' : '') + (it.d ? '<small>' + esc(it.d) + '</small>' : '');
    if (it.soon) { b.title = 'Segera hadir'; b.setAttribute('aria-disabled', 'true'); b.onclick = function (e) { e.preventDefault(); }; }
    return b;
  }

  function build() {
    var host = document.getElementById('fm-actions');
    if (!host || host.classList.contains('tw-grouped')) return;
    var old = [].slice.call(host.querySelectorAll('.fm-act'));
    if (!old.length) return;
    var byText = function (frag) {
      for (var i = 0; i < old.length; i++) if ((old[i].textContent || '').indexOf(frag) >= 0) return old[i];
      return null;
    };
    var dirTile = byText('Jaringan Mitra');
    var frag = document.createDocumentFragment();
    GROUPS.forEach(function (g) {
      var sec = document.createElement('section'); sec.className = 'tw-group'; sec.setAttribute('data-g', g.id); sec.style.setProperty('--g', g.c);
      sec.innerHTML = '<div class="tw-head"><b>' + esc(g.title) + '</b><span>' + esc(g.hint) + '</span></div>';
      var grid = document.createElement('div'); grid.className = 'tw-grid'; sec.appendChild(grid);
      g.items.forEach(function (it) {
        var el;
        if (it.find) {
          var src = byText(it.find);
          if (src) { el = src; var sp = el.querySelector('span'); if (sp && it.t) sp.textContent = it.t; if (it.d && !el.querySelector('small')) { var sm = document.createElement('small'); sm.textContent = it.d; el.appendChild(sm); } }
        }
        if (!el && it.edit) {
          el = tile(it, g);
          el.onclick = function () {
            if (dirTile) dirTile.click();
            setTimeout(function () { var s = document.getElementById('dir-search'); if (s) { s.focus(); s.placeholder = 'Ketik nama/ID toko, lalu tekan Edit Toko di barisnya'; } }, 250);
          };
        } else if (!el && it.run) {
          el = tile(it, g);
          el.onclick = function () { new Function(it.run)(); };
        } else if (!el) {
          el = tile(it, g);
        }
        if (it.badge) {
          var c = document.createElement('em'); c.className = 'tw-cnt'; c.style.fontStyle = 'normal'; c.setAttribute('data-tw-badge', it.badge); c.style.display = 'none';
          el.appendChild(c);
        }
        grid.appendChild(el);
      });
      frag.appendChild(sec);
    });
    host.innerHTML = '';
    var nav = document.createElement('div'); nav.className = 'tw-tabs'; nav.setAttribute('role', 'tablist');
    GROUPS.forEach(function (g) { var t = document.createElement('button'); t.type = 'button'; t.className = 'tw-tab'; t.setAttribute('data-tab', g.id); t.style.setProperty('--g', g.c); t.textContent = g.title; nav.appendChild(t); });
    host.appendChild(nav); host.appendChild(frag);
    host.classList.add('tw-grouped');
    function setTab(id) {
      var g = GROUPS.filter(function (x) { return x.id === id; })[0] || GROUPS[0];
      [].slice.call(host.querySelectorAll('.tw-group')).forEach(function (sx) { sx.classList.toggle('on', sx.getAttribute('data-g') === g.id); });
      [].slice.call(host.querySelectorAll('.tw-tab')).forEach(function (tx) { tx.classList.toggle('on', tx.getAttribute('data-tab') === g.id); });
      var rows = Math.max(1, Math.ceil(g.items.length / 5));
      host.style.setProperty('--tw-rows', rows);
      host.style.setProperty('--tw-fixed', ((rows - 1) * 10 + 58) + 'px');
      try { localStorage.setItem('fm_tw_tab', g.id); } catch (e) {}
    }
    nav.onclick = function (e) { var b = e.target.closest ? e.target.closest('.tw-tab') : null; if (b) setTab(b.getAttribute('data-tab')); };
    var last = ''; try { last = localStorage.getItem('fm_tw_tab') || ''; } catch (e) {}
    setTab(last || GROUPS[0].id);
  }

  function badges() {
    [].slice.call(document.querySelectorAll('[data-tw-badge]')).forEach(function (c) {
      var src = document.getElementById(c.getAttribute('data-tw-badge'));
      var n = src ? parseInt(src.textContent, 10) || 0 : 0;
      c.textContent = n; c.style.display = n > 0 ? '' : 'none';
    });
  }

  var CSS2 = [
    '.tw-tabs{display:flex;flex-wrap:wrap;gap:6px;padding:2px 4px 6px}',
    '.tw-tab{all:unset;box-sizing:border-box;cursor:pointer;padding:8px 14px;border-radius:999px;font-size:12.5px;font-weight:700;color:#0f172a;background:rgba(255,255,255,.6);border:1px solid rgba(15,23,42,.16)}',
    '.tw-tab:hover{background:rgba(255,255,255,.9)}',
    '.tw-tab.on{background:var(--g);border-color:rgba(15,23,42,.3);box-shadow:0 2px 8px -3px rgba(15,23,42,.4)}',
    '.tw-group{display:none!important}.tw-group.on{display:flex!important}',
    'html[data-tw-ck] #tw-ken .tw-group .tw-head{display:none!important}',
    'html[data-fm-page="tower"] #tw-ken #fm-actions .tw-group .fm-act.tw-warn{border-color:rgba(220,38,38,.5)!important}',
    'html[data-fm-page="tower"] #tw-ken #fm-actions .tw-group .fm-act.tw-warn i{background:rgba(220,38,38,.16)!important;color:#b91c1c!important}',
    'html[data-tw-ck] #tw-ken #fm-actions .tw-group .tw-grid{grid-auto-rows:min(76px,calc((100cqh - var(--tw-fixed,172px)) / var(--tw-rows,2)))!important;align-content:start}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'tw-menu-css'; st.textContent = CSS + '\n' + CSS2; document.head.appendChild(st);
  function start() {
    var tries = 0;
    (function wait() {
      var h = document.getElementById('fm-actions');
      if (h && h.querySelector('.fm-act')) { build(); badges(); setInterval(badges, 1500); return; }
      if (++tries < 40) setTimeout(wait, 150);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
