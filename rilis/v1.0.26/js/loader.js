/* loader.js — layar pemuat + tombol "Perbarui Aplikasi".
   1) Layar "Memuat..." tampil sejak awal halaman dan baru hilang setelah halaman siap, jadi tidak terlihat susunan setengah jadi (kedip) saat F5 atau Ctrl+Shift+R.
   2) Layar yang sama muncul saat berpindah halaman.
   3) Tombol merah "Perbarui Aplikasi": hapus cache aplikasi + service worker, unduh ulang file halaman ini, lalu muat ulang.
      Login, data toko, dan pengaturan tampilan TIDAK dihapus. Progres yang ditampilkan adalah jumlah file yang benar-benar diunduh ulang. */
(function () {
  'use strict';
  if (window.__fmLoader) return; window.__fmLoader = true;
  var root = document.documentElement, ld = null, done = false, hideT = 0;

  var CSS = '#fm-ld{position:fixed;inset:0;z-index:2147483646;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#f6f3ec;color:#334155;font:700 14px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;opacity:1;transition:opacity .3s ease}' +
    '#fm-ld.fm-ld-out{opacity:0;pointer-events:none}' +
    'html[data-fm-invert="1"] #fm-ld,html[data-fm-ctdark] #fm-ld{filter:invert(1) hue-rotate(180deg)}html[data-fm-invert="1"] #fm-refresh,html[data-fm-ctdark] #fm-refresh{filter:invert(1) hue-rotate(180deg)}' +
    '#fm-ld .fm-ld-dots{display:flex;gap:10px;align-items:flex-end;height:46px}#fm-ld .fm-ld-dots i{display:block;width:15px;height:15px;border-radius:50%;background:#dc2626;transform-origin:50% 100%;animation:fmhop .72s cubic-bezier(.3,.7,.4,1) infinite}#fm-ld .fm-ld-dots i:nth-child(2){background:#f59e0b;animation-delay:.12s}#fm-ld .fm-ld-dots i:nth-child(3){background:#2563eb;animation-delay:.24s}' +
    '#fm-ld .fm-ld-bar{width:200px;height:6px;border-radius:99px;background:rgba(15,23,42,.1);overflow:hidden;display:none}#fm-ld .fm-ld-bar i{display:block;height:100%;width:0;background:#dc2626;border-radius:99px;transition:width .2s ease}' +
    '#fm-ld.fm-ld-upd .fm-ld-bar{display:block}#fm-ld .fm-ld-s{font-weight:500;font-size:12px;opacity:.65;min-height:15px}#fm-ld .fm-ld-t{font-size:18px;font-weight:800;letter-spacing:.01em}' +
    '@keyframes fmhop{0%,100%{transform:translateY(0) scale(1.25,.7)}18%{transform:translateY(0) scale(.9,1.15)}55%{transform:translateY(-30px) scale(.92,1.1)}85%{transform:translateY(0) scale(1.05,.95)}}@media(prefers-reduced-motion:reduce){#fm-ld .fm-ld-dots i{animation:none}}' +
    '@keyframes fmrfx{0%{transform:scale(1) rotate(0);box-shadow:0 0 0 0 rgba(220,38,38,.7)}15%{transform:scale(1.12) rotate(-5deg)}30%{transform:scale(1.12) rotate(5deg)}45%{transform:scale(1.08) rotate(-3deg);box-shadow:0 0 0 12px rgba(220,38,38,0)}60%,100%{transform:scale(1) rotate(0);box-shadow:0 0 0 0 rgba(220,38,38,0)}}' +
    'html body #fm-refresh.fm-rf-new{animation:fmrfx 1.5s ease-in-out infinite!important;font-size:12.5px!important;background:#b91c1c!important}@media(prefers-reduced-motion:reduce){html body #fm-refresh.fm-rf-new{animation:none!important;outline:3px solid rgba(220,38,38,.5)}}' +
    'html body #fm-refresh{border:0!important;border-radius:999px!important;background:#dc2626!important;background-image:none!important;color:#fff!important;font:700 12px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif!important;padding:7px 13px!important;cursor:pointer;white-space:nowrap;box-shadow:0 2px 8px rgba(220,38,38,.35)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;filter:none!important;opacity:1!important;text-shadow:none!important;flex:0 0 auto}' +
    'html body #fm-refresh:hover{background:#b91c1c!important}#fm-refresh:active{transform:scale(.97)}html body #fm-refresh.fm-rf-fix{position:fixed!important;right:8px!important;top:5px!important;bottom:auto!important;margin:0!important;min-height:0!important;height:auto!important;padding:5px 10px!important;font-size:11px!important;z-index:2147483000}';
  CSS += '#fm-ld .fm-ld-cv{position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none}#fm-ld .fm-ld-v{height:64px;min-height:64px;width:260px}#fm-ld.fm-ld-upd .fm-ld-v{display:none}#fm-ld:not(.fm-ld-upd) .fm-ld-s{display:none}';
  var st = document.createElement('style'); st.id = 'fm-ld-css'; st.textContent = CSS; (document.head || root).appendChild(st);

  function verText() { var v = (window.FM_RELEASES && FM_RELEASES.beta) || ''; if (!v) { var pm = /\/rilis\/(v[\d.]+)\//.exec(location.pathname); v = pm ? pm[1] : 'v1.0.26'; } if (v) { try { localStorage.setItem('fm_ld_ver', v); } catch (e) {} } else { try { v = localStorage.getItem('fm_ld_ver') || ''; } catch (e) {} } return v; }

  /* ---- Genki Dama: bola-bola energi berkumpul membentuk nomor versi ---- */
  var FX_MS = 1900, fxRaf = 0, fxSprite = null;
  function sprite() {
    if (fxSprite) return fxSprite;
    var c = document.createElement('canvas'); c.width = c.height = 32; var g = c.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.28, 'rgba(147,210,255,.95)'); r.addColorStop(.6, 'rgba(37,99,235,.45)'); r.addColorStop(1, 'rgba(37,99,235,0)');
    g.fillStyle = r; g.fillRect(0, 0, 32, 32); return (fxSprite = c);
  }
  function targets(text, cx, cy) {
    var W = 300, H = 80, c = document.createElement('canvas'); c.width = W; c.height = H; var g = c.getContext('2d');
    g.fillStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 46px system-ui,-apple-system,Segoe UI,Roboto,sans-serif'; g.fillText(text, W / 2, H / 2 + 2);
    var d = g.getImageData(0, 0, W, H).data, pts = [], step = 3, x, y;
    for (y = 0; y < H; y += step) for (x = 0; x < W; x += step) if (d[(y * W + x) * 4 + 3] > 120) pts.push([cx - W / 2 + x, cy - H / 2 + y]);
    return pts;
  }
  function startGenki() {
    try {
      if (!ld || fxRaf) return;
      var cv = ld.querySelector('.fm-ld-cv'), holder = ld.querySelector('.fm-ld-v'); if (!cv || !holder) return;
      var dpr = 1, w = cv.width = window.innerWidth, h = cv.height = window.innerHeight, g = cv.getContext('2d');
      var rc = holder.getBoundingClientRect(), cx = rc.left + rc.width / 2, cy = rc.top + rc.height / 2;
      var text = verText(), pts = targets(text, cx, cy), sp = sprite(), reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
      if (pts.length > 1200) { var k = Math.ceil(pts.length / 1200); pts = pts.filter(function (_, i) { return i % k === 0; }); }
      var R = Math.max(w, h) * 0.55, P = pts.map(function (p) {
        var a = Math.random() * 6.2832, rr = R * (0.55 + Math.random() * 0.6);
        return { tx: p[0], ty: p[1], sx: cx + Math.cos(a) * rr, sy: cy + Math.sin(a) * rr, de: Math.random() * 620, du: 950 + Math.random() * 300, sz: 3 + Math.random() * 1.6, ph: Math.random() * 6.28 };
      });
      var t0 = performance.now();
      function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
      function frame(now) {
        if (!ld || !ld.parentNode || !cv.parentNode) { fxRaf = 0; return; }
        var t = now - t0, i, p, e, rot, dx, dy, x, y, pulse;
        g.clearRect(0, 0, w, h);
        var all = t > FX_MS;
        for (i = 0; i < P.length; i++) {
          p = P[i]; e = reduce ? 1 : Math.min(1, Math.max(0, (t - p.de) / p.du)); e = ease(e);
          rot = (1 - e) * 1.6; dx = (p.sx - p.tx) * (1 - e); dy = (p.sy - p.ty) * (1 - e);
          x = p.tx + dx * Math.cos(rot) - dy * Math.sin(rot); y = p.ty + dx * Math.sin(rot) + dy * Math.cos(rot);
          pulse = e >= 1 ? 1 + Math.sin(t / 260 + p.ph) * 0.08 : 1 + (1 - e) * 0.6;
          var sz = p.sz * pulse; g.globalAlpha = .35 + .65 * e; g.drawImage(sp, x - sz, y - sz, sz * 2, sz * 2);
        }
        g.globalAlpha = 1;
        if (all) { var f = Math.max(0, 1 - (t - FX_MS) / 380); if (f > 0) { var gr = g.createRadialGradient(cx, cy, 0, cx, cy, 95); gr.addColorStop(0, 'rgba(147,210,255,' + (.35 * f) + ')'); gr.addColorStop(1, 'rgba(147,210,255,0)'); g.fillStyle = gr; g.fillRect(cx - 100, cy - 100, 200, 200); } }
        fxRaf = requestAnimationFrame(frame);
      }
      fxRaf = requestAnimationFrame(frame);
    } catch (e) { fxRaf = 0; }
  }
  function build(text) {
    if (ld && ld.parentNode) { ld.classList.remove('fm-ld-out'); ld.querySelector('.fm-ld-t').textContent = text; return ld; }
    ld = document.createElement('div'); ld.id = 'fm-ld'; ld.setAttribute('role', 'status'); ld.setAttribute('aria-live', 'polite');
    ld.innerHTML = '<div class="fm-ld-dots"><i></i><i></i><i></i></div><div class="fm-ld-t"></div><div class="fm-ld-v"></div><div class="fm-ld-bar"><i></i></div><div class="fm-ld-s"></div><canvas class="fm-ld-cv"></canvas>';
    ld.querySelector('.fm-ld-s').textContent = verText();
    ld.querySelector('.fm-ld-t').textContent = text; root.appendChild(ld); startGenki(); return ld;
  }
  function show(text) { clearTimeout(hideT); build(text || 'Memuat...'); }
  function hide() {
    if (!ld) return; var el = ld; el.classList.add('fm-ld-out');
    setTimeout(function () { if (el.parentNode && el.classList.contains('fm-ld-out')) el.parentNode.removeChild(el); if (ld === el) { ld = null; fxRaf = 0; } }, 360);
  }

  /* ---- 1. tampil sejak awal, hilang setelah halaman siap ---- */
  show('Oneilverse');
  var t0 = Date.now();
  function finish() { if (done) return; done = true; hide(); }
  function check() {
    if (done) return;
    if (ld && !window.__fmUpdating) { var s0 = ld.querySelector('.fm-ld-s'), vt = verText(); if (s0 && vt && s0.textContent !== vt) s0.textContent = vt; }
    var ready = (root.classList.contains('fm-ready') || (document.readyState === 'complete' && Date.now() - t0 > 1500)) && Date.now() - t0 > FX_MS + 250;
    if (document.readyState === 'complete' && ready) { setTimeout(finish, 120); return; }
    setTimeout(check, 60);
  }
  check();
  setTimeout(finish, 7000); /* pengaman: tidak pernah menahan layar lebih dari 7 detik */

  /* ---- 2. pindah halaman ---- */
  window.addEventListener('beforeunload', function () { if (window.__fmUpdating) return; show('Oneilverse'); hideT = setTimeout(hide, 6000); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) { done = true; hide(); } });

  /* ---- 3. perbarui aplikasi ---- */
  function sameOrigin(u) { try { return new URL(u, location.href).origin === location.origin; } catch (e) { return false; } }
  function urls() {
    var l = [location.pathname + location.search, '/version.json', '/js/rollout.js'];
    [].forEach.call(document.querySelectorAll('script[src],link[rel="stylesheet"][href]'), function (n) { var u = n.getAttribute('src') || n.getAttribute('href'); if (u && sameOrigin(u)) l.push(new URL(u, location.href).pathname + new URL(u, location.href).search); });
    /* seperti Ctrl+Shift+R: ikutkan SEMUA berkas yang benar-benar dimuat halaman ini (skrip yang dimuat dinamis, gambar, font), bukan hanya yang tertulis di HTML */
    try { performance.getEntriesByType('resource').forEach(function (r) { if (sameOrigin(r.name) && !/googleapis|firestore|identitytoolkit/.test(r.name)) { var p = new URL(r.name); l.push(p.pathname + p.search); } }); } catch (e) {}
    return l.filter(function (u, i) { return l.indexOf(u) === i; });
  }
  function run() {
    if (window.__fmUpdating) return; window.__fmUpdating = true; done = true;
    show('Memperbarui Oneilverse...'); var el = ld; el.classList.add('fm-ld-upd');
    var bar = el.querySelector('.fm-ld-bar i'), sub = el.querySelector('.fm-ld-s'), t = el.querySelector('.fm-ld-t'), started = Date.now();
    function step(p, s) { bar.style.width = Math.round(p * 100) + '%'; sub.textContent = s || ''; }
    step(0.03, 'Menghapus cache lama');
    var chain = Promise.resolve();
    chain = chain.then(function () { return (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) ? navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); }) : null; }).catch(function () {});
    chain = chain.then(function () { return window.caches ? caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }) : null; }).catch(function () {});
    chain = chain.then(function () { try { localStorage.removeItem('fm_rollout_cfg_v1'); sessionStorage.removeItem('fm_rollout_redirect_count'); } catch (e) {} step(0.1, 'Mengunduh versi terbaru'); });
    chain = chain.then(function () {
      var list = urls(), n = 0, i = 0, total = list.length;
      function worker() {
        if (i >= total) return Promise.resolve();
        var u = list[i++];
        return fetch(u, { cache: 'reload', credentials: 'same-origin' }).catch(function () {}).then(function () { n++; step(0.1 + 0.8 * n / total, 'File ' + n + ' dari ' + total); return worker(); });
      }
      return Promise.all([worker(), worker(), worker(), worker()]);
    });
    chain.catch(function () {}).then(function () {
      var wait = Math.max(0, 1100 - (Date.now() - started));
      setTimeout(function () { step(1, 'Selesai'); t.textContent = 'Membuka ulang...'; setTimeout(function () { location.reload(); }, 350); }, wait);
    });
    setTimeout(function () { if (window.__fmUpdating) location.reload(); }, 25000); /* pengaman jaringan lambat */
  }

  /* tombol merah: di sebelah "Role", atau pojok kanan bawah bila halaman tidak punya header role */
  function mountBtn() {
    if (document.getElementById('fm-refresh')) return;
    var b = document.createElement('button'); b.id = 'fm-refresh'; b.type = 'button'; b.textContent = 'Perbarui Aplikasi'; b.title = 'Muat versi terbaru aplikasi (login dan data tidak hilang)';
    b.addEventListener('click', run);
    var role = document.getElementById('user-role-display'), pill = role && (role.closest('.ios-pill') || role.parentNode);
    if (pill) { b.style.setProperty('margin-left', '10px', 'important'); pill.appendChild(b); pill.style.setProperty('flex-wrap', 'nowrap', 'important'); } else { b.className = 'fm-rf-fix'; document.body.appendChild(b); }
  }
  function floatIfHidden() {
    var b = document.getElementById('fm-refresh'); if (!b || b.classList.contains('fm-rf-fix')) return;
    if (!b.offsetParent || b.getBoundingClientRect().width === 0) { b.classList.add('fm-rf-fix'); document.body.appendChild(b); }
  }
  function init() { try { mountBtn(); [400, 1500, 3500].forEach(function (ms) { setTimeout(floatIfHidden, ms); }); window.addEventListener('resize', function () { setTimeout(floatIfHidden, 200); }); } catch (e) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  var pendingNew = '';
  function flagNew(ver) {
    pendingNew = ver || 'baru';
    var b = document.getElementById('fm-refresh');
    if (!b) return;
    b.classList.add('fm-rf-new'); b.textContent = 'Ada versi baru! Perbarui';
    b.title = 'Versi ' + (ver || 'terbaru') + ' tersedia. Tekan untuk memperbarui (login dan data tidak hilang).';
    setTimeout(floatIfHidden, 50);
  }
  var _mount = mountBtn;
  mountBtn = function () { _mount(); if (pendingNew) flagNew(pendingNew); };
  window.FM_REFRESH = { run: run, flagNew: flagNew };
})();
