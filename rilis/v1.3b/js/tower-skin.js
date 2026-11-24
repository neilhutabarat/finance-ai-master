/* tower-skin.js — tampilan seragam Control Tower: pop-up terang senada tema, Kendali yang lebih segar, tema terang/gelap.
   Hanya aktif di provider.html. Tidak mengubah logika; hanya CSS + penanda kelas. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;
  var root = document.documentElement;
  try { if (localStorage.getItem('tw_theme') === 'dark') root.setAttribute('data-tw-theme', 'dark'); } catch (e) {}

  var L = 'html:not([data-tw-theme="dark"])'; /* semua aturan pop-up hanya berlaku di tema terang */
  var CSS = [
    /* ---------- token ---------- */
    ':root{--tw-ink:#0f172a;--tw-ink2:#334155;--tw-mut:#64748b;--tw-line:#e6ebf3;--tw-soft:#f4f7fb;--tw-card:#ffffff;--tw-acc:#3b6cf6;--tw-acc2:#2a52d4}',

    /* ---------- POP-UP UTAMA (main-modal-container) ---------- */
    L + ' #main-modal-container{background:rgba(30,41,59,.34)!important;backdrop-filter:blur(7px) saturate(1.1)!important}',
    L + ' #main-modal-container .modal-sheet{background:#f8fafd!important;border:1px solid #e3e9f2!important;border-radius:26px!important;box-shadow:0 34px 80px -24px rgba(15,23,42,.38),0 2px 0 rgba(255,255,255,.8) inset!important}',
    L + ' #main-modal-container .modal-sheet>div:first-child{background:linear-gradient(180deg,#ffffff,#f3f6fc)!important;border-bottom:1px solid var(--tw-line)!important;padding:18px 24px!important}',
    L + ' #main-modal-container #modal-title{color:var(--tw-ink)!important;font-size:18px;font-weight:800;letter-spacing:-.015em}',
    L + ' #main-modal-container #modal-subtitle{color:var(--tw-mut)!important;font-size:12.5px}',
    L + ' #main-modal-container .modal-sheet>div:first-child>button{background:#eef2f8!important;color:#475569!important;width:34px;height:34px;transition:background .15s}',
    L + ' #main-modal-container .modal-sheet>div:first-child>button:hover{background:#e0e7f2!important;color:#0f172a!important}',
    L + ' #main-modal-container #modal-back{background:#eef2f8!important;color:#334155!important;font-weight:700}',
    L + ' #main-modal-container #modal-body-content{padding:22px 24px!important;font-size:13.5px;line-height:1.6;scrollbar-width:thin}',
    L + ' #main-modal-container .modal-sheet>div:last-child{background:#ffffff!important;border-top:1px solid var(--tw-line)!important;padding:12px 24px!important}',
    L + ' #main-modal-container .modal-sheet>div:last-child button{background:#eef2f8!important;color:#334155!important;font-size:13px!important;padding:9px 22px!important;border-radius:12px!important;font-weight:700}',
    L + ' #main-modal-container .modal-sheet>div:last-child button:hover{background:#e0e7f2!important}',
    /* isi pop-up dirancang untuk latar gelap: dibalik (invert + putar warna) supaya jadi terang dengan kontras yang benar */
    L + ' #main-modal-container #modal-body-content{filter:invert(1) hue-rotate(180deg);background:transparent!important;color:#e6ecf5}',
    L + ' #main-modal-container #modal-body-content img,' + L + ' #main-modal-container #modal-body-content canvas,' + L + ' #main-modal-container #modal-body-content video,' + L + ' #main-modal-container #modal-body-content input[type="checkbox"],' + L + ' #main-modal-container #modal-body-content input[type="radio"],' + L + ' #main-modal-container #modal-body-content input[type="color"],' + L + ' #main-modal-container #modal-body-content input[type="range"]{filter:invert(1) hue-rotate(180deg)}',
    L + ' .tw-ov input[type="checkbox"],' + L + ' .tw-ov input[type="radio"],' + L + ' .tw-ov input[type="color"],' + L + ' .tw-ov input[type="range"]{filter:invert(1) hue-rotate(180deg)}',
    L + ' #main-modal-container #modal-body-content{scrollbar-color:#cbd5e1 transparent}',

    /* ---------- POP-UP BUATAN SCRIPT (overlay gelap -> dibalik jadi terang) ---------- */
    L + ' .tw-ov{background:rgba(30,41,59,.34)!important;backdrop-filter:blur(7px) saturate(1.1)!important}',
    L + ' .tw-ov>*{filter:invert(1) hue-rotate(180deg);border-radius:24px;box-shadow:0 34px 80px -24px rgba(0,0,0,.55)}',
    L + ' .tw-ov img,' + L + ' .tw-ov canvas,' + L + ' .tw-ov video{filter:invert(1) hue-rotate(180deg)}',

    /* ---------- KENDALI ---------- */
    'html[data-tw-ck] #tw-ken #fm-actions{gap:12px!important}',
    'html[data-tw-ck] #tw-ken .tw-ken-q{border-radius:14px;padding:9px 16px 9px 38px;font-size:13px;font-weight:600;border:1px solid #dbe3ef;background:#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\'%3E%3Ccircle cx=\'11\' cy=\'11\' r=\'6.5\'/%3E%3Cpath d=\'M16 16l4 4\'/%3E%3C/svg%3E") no-repeat 13px 50%/17px!important;box-shadow:0 1px 2px rgba(15,23,42,.04)}',
    'html[data-tw-ck] #tw-ken #tw-favs{display:flex;flex-wrap:wrap;gap:8px;flex:none;align-items:center}',
    'html[data-tw-ck] #tw-ken #tw-favs.has:before{content:"Favorit";font-size:11px;font-weight:800;color:#64748b;margin-right:2px}',
    'html[data-tw-ck] #tw-ken #tw-favs .tw-tab-edit{margin-left:auto;padding:5px 12px;font-size:11.5px}',
    /* layar pendek (laptop kecil): sembunyikan deskripsi tombol & rapatkan, agar semua kartu muat tanpa gulir */
    'html[data-tw-ck] #tw-ken .tw-fav{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:7px;padding:6px 13px 6px 9px;border-radius:999px;background:#fff;border:1px solid #dbe3ef;font:700 12px/1 "Plus Jakarta Sans",system-ui,sans-serif;color:#1e293b;box-shadow:0 1px 2px rgba(15,23,42,.04);transition:transform .15s,border-color .15s,box-shadow .15s}',
    'html[data-tw-ck] #tw-ken .tw-fav:hover{transform:translateY(-1px);border-color:var(--tw-acc);box-shadow:0 6px 14px -8px rgba(59,108,246,.5)}',
    'html[data-tw-ck] #tw-ken .tw-fav svg{width:16px;height:16px;color:var(--tw-acc)}',

    'html[data-tw-ck] #tw-ken #tw-board{gap:12px!important}',
    'html[data-tw-ck] #tw-ken .tw-group{position:relative;border:1px solid #e6ebf3!important;border-radius:22px!important;padding:14px 14px 14px!important;gap:12px!important;background:linear-gradient(155deg,color-mix(in srgb,var(--g) 9%,#fff) 0%,#ffffff 46%)!important;box-shadow:0 1px 2px rgba(15,23,42,.04),0 14px 30px -20px color-mix(in srgb,var(--g) 55%,transparent)!important}',
    'html[data-tw-ck] #tw-ken .tw-group .tw-head{gap:11px!important;align-items:center!important;padding:0 2px!important}',
    'html[data-tw-ck] #tw-ken .tw-group .tw-head:before{display:none!important}',
    'html[data-tw-ck] #tw-ken .tw-gi{all:unset;flex:none;width:34px;height:34px;border-radius:12px;display:grid;place-items:center;color:#fff;background:linear-gradient(145deg,var(--g),color-mix(in srgb,var(--g) 62%,#000));box-shadow:0 8px 16px -8px var(--g)}',
    'html[data-tw-ck] #tw-ken .tw-gi svg{width:19px;height:19px}',
    'html[data-tw-ck] #tw-ken .tw-gi .f{opacity:.28}',
    'html[data-tw-ck] #tw-ken .tw-ht{display:flex;flex-direction:column;min-width:0}',
    'html[data-tw-ck] #tw-ken .tw-group .tw-head .tw-ht b{font-size:14.5px!important;font-weight:800!important;letter-spacing:-.01em;color:#0f172a!important}',
    'html[data-tw-ck] #tw-ken .tw-group .tw-head .tw-ht span{font-size:11px!important;color:#64748b!important;margin-top:1px}',
    'html[data-tw-ck] #tw-ken .tw-grid{gap:8px!important;grid-auto-rows:minmax(56px,1fr)!important}',
    /* layar pendek: kartu tumbuh mengikuti isi dan Kendali bisa digulir, tidak ada teks yang terpotong */
    'html[data-tw-ck] #tw-ken #tw-board{grid-template-rows:repeat(2,minmax(max-content,1fr))!important;overflow-y:auto;padding:2px 2px 8px}',
    'html[data-tw-ck] #tw-ken .tw-group{overflow:hidden!important;min-height:min-content!important}',
    'html[data-tw-ck] #tw-ken .tw-group .tw-grid{flex:1 0 auto!important;min-height:min-content!important}',

    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act.tw-tile{display:grid!important;grid-template-columns:36px minmax(0,1fr)!important;grid-template-rows:auto auto!important;align-content:center;column-gap:11px!important;row-gap:1px!important;padding:7px 12px 7px 10px!important;border-radius:15px!important;background:rgba(255,255,255,.78)!important;border:1px solid color-mix(in srgb,var(--g) 14%,#e6ebf3)!important;box-shadow:none!important;position:relative;text-align:left!important;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease,background .16s ease}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act.tw-tile:hover{background:#fff!important;border-color:var(--g)!important;transform:translateY(-2px);box-shadow:0 12px 22px -14px var(--g)!important}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act.tw-tile:active{transform:translateY(0)}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act.tw-tile>i{grid-column:1!important;grid-row:1 / 3!important;width:36px!important;height:36px!important;border-radius:12px!important;background:color-mix(in srgb,var(--g) 13%,#fff)!important;color:var(--g)!important;display:grid;place-items:center;transition:background .16s,color .16s,transform .16s}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act.tw-tile:hover>i{background:var(--g)!important;color:#fff!important;transform:rotate(-4deg) scale(1.04)}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act.tw-tile svg.twi{width:20px!important;height:20px!important;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act.tw-tile svg.twi .f{fill:currentColor;stroke:none;opacity:.2}',
    'html[data-tw-ck] #tw-ken .tw-fav svg.twi,html[data-tw-ck] #tw-ken .tw-gi svg.twi{fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}',
    'html[data-tw-ck] #tw-ken .tw-fav svg.twi .f,html[data-tw-ck] #tw-ken .tw-gi svg.twi .f{fill:currentColor;stroke:none;opacity:.22}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act.tw-tile>span:not(.tw-pill){grid-column:2!important;grid-row:1!important;align-self:end!important;font-size:12.4px!important;font-weight:700!important;color:#0f172a!important;letter-spacing:-.012em;white-space:normal!important;line-height:1.2}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act.tw-tile>small{grid-column:2!important;grid-row:2!important;align-self:start!important;display:block!important;font-size:10.8px!important;font-weight:500!important;color:#64748b!important;line-height:1.3;white-space:normal!important}',
    'html[data-tw-ck] #tw-ken .tw-tile.tw-warn{border-color:rgba(225,29,116,.35)!important}',
    'html[data-tw-ck] #tw-ken .tw-tile.tw-warn>i{background:rgba(225,29,116,.1)!important;color:#e11d74!important}',
    /* lencana angka (mis. permohonan kasir menunggu) */
    'html[data-tw-ck] #tw-ken .tw-tile .tw-cnt{position:absolute!important;right:9px!important;top:8px!important;min-width:20px;padding:2px 6px;font-size:10.5px;background:linear-gradient(145deg,#fb5a7a,#e11d48);box-shadow:0 4px 10px -3px rgba(225,29,72,.6);animation:twPing 2.2s ease-in-out infinite}',
    '@keyframes twPing{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}',
    /* bintang favorit */
    'html[data-tw-ck] #tw-ken .tw-star{position:absolute;right:7px;bottom:6px;width:18px;height:18px;border-radius:6px;display:grid;place-items:center;opacity:0;cursor:pointer;transition:opacity .15s,background .15s;background:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z\'/%3E%3C/svg%3E") center/14px no-repeat}',
    'html[data-tw-ck] #tw-ken .tw-tile:hover .tw-star{opacity:1}',
    'html[data-tw-ck] #tw-ken .tw-tile.is-fav .tw-star{opacity:1;background:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23f59e0b\' stroke=\'%23f59e0b\' stroke-width=\'2\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z\'/%3E%3C/svg%3E") center/14px no-repeat}',
    'html[data-tw-ck] #tw-ken .tw-star:hover{background-color:rgba(245,158,11,.14)}',
    'html[data-tw-ck] #tw-ken .tw-tab-edit{border-radius:12px;font-size:12.5px}',

    /* ---------- tombol tema di bar atas ---------- */
    '#tw-bar{gap:8px!important;flex-wrap:nowrap}#tw-bar .pgs{flex:none}#tw-bar .pl{padding:6px 10px!important;white-space:nowrap}',

    /* ---------- TEMA GELAP Control Tower (kokpit saja; pop-up memakai gaya gelap aslinya) ---------- */
    'html[data-tw-theme="dark"] #tw-root{filter:invert(.92) hue-rotate(180deg)}',
    'html[data-tw-theme="dark"] #tw-root img,html[data-tw-theme="dark"] #tw-root canvas{filter:invert(1) hue-rotate(180deg)}'
  ].join('\n');
  /* lembar gaya lain memakai selektor "digelembungkan" ([data-fm-page] berulang); gandakan atribut agar gaya ini tetap menang */
  var KP = 'html' + new Array(12).join('[data-tw-ck]');
  CSS += '\n' + ('@media (max-height:760px){html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act.tw-tile>small{display:none!important}html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act.tw-tile{padding:5px 10px 5px 8px!important}html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act.tw-tile>span:not(.tw-pill){grid-row:1 / 3!important;align-self:center!important}html[data-tw-ck] #tw-ken .tw-group{padding:10px 12px!important;gap:8px!important}html[data-tw-ck] #tw-ken .tw-gi{width:30px;height:30px}html[data-tw-ck] #tw-ken .tw-group .tw-head .tw-ht span{display:none!important}html[data-tw-ck] #tw-ken .tw-grid{gap:6px!important;grid-auto-rows:minmax(42px,1fr)!important}}');
  CSS = CSS.split('html[data-tw-ck][data-fm-page="tower"] #tw-ken').join(KP + '[data-fm-page="tower"] #tw-ken').split('html[data-tw-ck] #tw-ken').join(KP + ' #tw-ken');
  CSS += '\n' + KP + '[data-tw-theme="dark"],' + KP + '[data-tw-theme="dark"] body{background:#0b101c!important;background-image:none!important}';
  var st = document.createElement('style'); st.id = 'tw-skin-css'; st.textContent = CSS; document.head.appendChild(st);

  /* ---------- tandai overlay buatan script yang bergaya gelap ---------- */
  var SKIP = { 'tw-root': 1, 'tw-pop': 1, 'main-modal-container': 1, 'tw-pre': 1 };
  function lum(c) { var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(c || ''); if (!m) return 1; if (m[4] !== undefined && +m[4] < 0.5) return 1; return (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) / 255; }
  function consider(n) {
    if (!n || n.nodeType !== 1 || SKIP[n.id] || n.classList.contains('tw-ov')) return;
    var cs = getComputedStyle(n);
    if (cs.position !== 'fixed' || n.offsetWidth < window.innerWidth * 0.9 || n.offsetHeight < window.innerHeight * 0.9) return;
    var card = n.firstElementChild; if (!card || /^(STYLE|SCRIPT)$/.test(card.tagName)) return;
    var ccs = getComputedStyle(card), bg = card.style.backgroundColor || ccs.backgroundColor, clear = /rgba\(.*,\s*0\)$|transparent/.test(bg);
    /* kartu dianggap gelap bila latarnya gelap, atau latarnya bergradien/transparan tetapi teksnya terang */
    var dark = lum(bg) < 0.45 && !clear;
    if (!dark && (clear || ccs.backgroundImage !== 'none')) dark = lum(ccs.color) > 0.6 || /gradient/.test(ccs.backgroundImage) && lum(ccs.color) > 0.5;
    if (dark) n.classList.add('tw-ov');
  }
  function scan(list) { for (var i = 0; i < list.length; i++) { var n = list[i]; requestAnimationFrame(function (x) { return function () { consider(x); }; }(n)); } }
  function watchBody() {
    new MutationObserver(function (ms) { ms.forEach(function (m) { if (m.addedNodes.length) scan(m.addedNodes); }); }).observe(document.body, { childList: true });
  }
  if (document.body) watchBody(); else document.addEventListener('DOMContentLoaded', watchBody);

  /* ---------- tombol tema ---------- */
  function mountTheme() {
    var bar = document.getElementById('tw-bar'), set = document.getElementById('tw-set');
    if (!bar || !set) return false;
    if (document.getElementById('tw-theme')) return true;
    var b = document.createElement('button'); b.id = 'tw-theme'; b.className = 'pl'; set.parentNode.insertBefore(b, set);
    function lab() { b.textContent = root.getAttribute('data-tw-theme') === 'dark' ? 'Tema: gelap' : 'Tema: terang'; b.title = 'Ganti tema terang / gelap'; }
    b.onclick = function (e) {
      e.stopPropagation();
      var d = root.getAttribute('data-tw-theme') === 'dark';
      if (d) root.removeAttribute('data-tw-theme'); else root.setAttribute('data-tw-theme', 'dark');
      try { localStorage.setItem('tw_theme', d ? 'light' : 'dark'); } catch (er) {}
      lab();
    };
    lab(); return true;
  }
  var tries = 0; (function w() { if (mountTheme()) return; if (++tries < 80) setTimeout(w, 200); })();
})();
