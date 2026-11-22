/* stok-admin.js — Stok untuk Admin/kasir (BETA 8.4)
   - Tombol "Stok" mengambang di Kasir: daftar stok milik usaha Admin itu saja, hanya lihat.
   - Scan Stok Masuk (fitur terpisah 'stok_scan'): scan barcode (alat USB/laser atau kamera), isi jumlah, stok bertambah.
     Barcode yang belum terdaftar ditolak. Tiap stok masuk dicatat: nama Admin, jumlah, waktu (dilihat Manager di Stok > Riwayat Masuk). */
(function () {
  'use strict';
  var ov = null, found = null, msgT = '', msgErr = false;
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function has(k) { try { return !!(window.FM_PLANS && FM_PLANS.has && FM_PLANS.has(k, 'kasir')); } catch (e) { return false; } }
  function isKasir() { return /kasir\.html/.test(location.pathname); }
  function cu() { try { var c = JSON.parse(localStorage.getItem('currentUser') || 'null'); return c && c.role === 'staff' ? c : {}; } catch (e) { return {}; } }
  function me() { var c = cu(); return { title: c.title || 'Admin', slot: c.slot || '', biz: c.biz || '' }; }
  function prods() { try { return (window.STORE && STORE.getProducts()) || []; } catch (e) { return []; } }
  function canonB(b) { return (window.FM_BIZ && FM_BIZ.canon) ? FM_BIZ.canon(b) : String(b || ''); }
  function okBiz(p) {
    var m = me(); if (!m.biz) return true;
    var c = canonB(p.biz); return !c || c.toLowerCase() === String(m.biz).toLowerCase();
  }
  function mine() { return prods().filter(okBiz); }
  function unit(p) { return p && p.unit ? p.unit : 'pcs'; }
  function fmt(n) { return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0)); }
  function tfmt(ms) { var d = new Date(ms), p = function (n) { return String(n).padStart(2, '0'); }; return p(d.getDate()) + '/' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }

  /* cari barang dari kode scan: barcode jenis, barcode satuan ganda, atau kode barang */
  function lookup(raw) {
    var v = String(raw || '').trim(); if (!v) return { err: 'Kode kosong.' };
    var hit = null, all = prods();
    all.forEach(function (p) {
      if (hit) return;
      if (p.barcode === v || p.code === v) hit = { p: p, per: 1, uname: unit(p) };
      else (p.units || []).forEach(function (u) { if (!hit && u.barcode && String(u.barcode) === v) hit = { p: p, per: u.per || 1, uname: u.name }; });
    });
    if (!hit) return { err: 'Barcode "' + v + '" belum terdaftar. Minta Manager mendaftarkan barangnya dulu.' };
    if (!okBiz(hit.p)) return { err: 'Barang ini milik usaha lain, tidak bisa ditambah dari akun ini.' };
    return hit;
  }

  var css = document.createElement('style');
  css.textContent =
    '#fm-stokadm-modal{position:fixed;inset:0;z-index:2147482700;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(15,23,42,.55);font-family:Inter,system-ui,sans-serif}' +
    '#fm-stokadm-modal .sa-box{width:min(640px,100%);max-height:92vh;display:flex;flex-direction:column;border-radius:20px;background:#fff;color:#0f172a;box-shadow:0 24px 60px rgba(15,23,42,.4);overflow:hidden}' +
    '#fm-stokadm-modal .sa-h{display:flex;align-items:center;gap:10px;padding:14px 18px 8px}#fm-stokadm-modal .sa-h h3{margin:0;font-size:16px;font-weight:800;flex:1}' +
    '#fm-stokadm-modal .sa-x{all:unset;cursor:pointer;width:30px;height:30px;border-radius:99px;background:rgba(148,163,184,.25);text-align:center;line-height:30px;font-size:14px}' +
    '#fm-stokadm-modal .sa-body{overflow:auto;padding:0 18px 14px;flex:1}' +
    '#fm-stokadm-modal input{box-sizing:border-box;width:100%;border:1px solid rgba(71,85,105,.35);border-radius:12px;padding:10px 12px;font:600 14px Inter,system-ui,sans-serif;color:#0f172a;background:#fff;outline:none}#fm-stokadm-modal input:focus{border-color:#2f55d4}' +
    '#fm-stokadm-modal .sa-btn{all:unset;cursor:pointer;display:inline-block;padding:10px 16px;border-radius:12px;background:#2f55d4;color:#fff;font-size:13px;font-weight:800;text-align:center}#fm-stokadm-modal .sa-btn.alt{background:#0f766e}#fm-stokadm-modal .sa-btn:active{transform:scale(.97)}' +
    '#fm-stokadm-modal .sa-card{padding:12px 14px;border-radius:14px;background:rgba(47,85,212,.08);margin:10px 0;font-size:13px;font-weight:700}' +
    '#fm-stokadm-modal .sa-row{display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid rgba(71,85,105,.14);font-size:13px}#fm-stokadm-modal .sa-row .nm{flex:1;min-width:0;font-weight:700}' +
    '#fm-stokadm-modal .sa-st{font:800 14px ui-monospace,monospace;white-space:nowrap}#fm-stokadm-modal .sa-st.low{color:#be123c}' +
    '#fm-stokadm-modal .sa-msg{min-height:18px;margin:8px 0;font-size:12.5px;font-weight:700;color:#065f46}#fm-stokadm-modal .sa-msg.err{color:#be123c}' +
    '#fm-stokadm-modal .sa-sub{margin:14px 0 4px;font-size:12px;font-weight:800;color:#475569}';
  (document.head || document.documentElement).appendChild(css);

  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-stokadm-modal'; ov.className = 'fixed inset-0';
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    document.body.appendChild(ov);
    /* tangkap ketikan scanner supaya tidak dianggap scan penjualan oleh Kasir saat jendela ini terbuka */
    document.addEventListener('keydown', function (e) { if (ov && ov.style.display === 'flex') { if (e.key === 'Escape') close(); if (!ov.contains(e.target)) e.stopPropagation(); } }, true);
    if (window.STORE && STORE.onChange) STORE.onChange(function () { if (ov && ov.style.display === 'flex') renderList(); });
  }
  function close() { stopCam(); if (ov) ov.style.display = 'none'; }
  function setMsg(t, err) { msgT = t || ''; msgErr = !!err; var m = document.getElementById('sa-msg'); if (m) { m.textContent = msgT; m.className = 'sa-msg' + (msgErr ? ' err' : ''); } }

  function render() {
    var m = me(), scan = has('stok_scan');
    ov.innerHTML = '<div class="sa-box"><div class="sa-h"><h3>Stok' + (m.biz ? ' ' + esc(m.biz) : '') + '</h3><button type="button" class="sa-x" data-x aria-label="Tutup">✕</button></div><div class="sa-body">' +
      (scan ? '<div class="sa-sub" style="margin-top:2px">Scan stok masuk</div>' +
        '<div style="display:flex;gap:8px"><input id="sa-in" placeholder="Scan barcode atau ketik kodenya lalu Enter" autocomplete="off" inputmode="text">' + (('BarcodeDetector' in window) ? '<button type="button" class="sa-btn alt" data-cam style="white-space:nowrap">Kamera</button>' : '') + '</div>' +
        '<div id="sa-found"></div>' : '<div class="sa-card">Daftar stok usaha Anda (hanya lihat). Penambahan stok dilakukan oleh Manager.</div>') +
      '<div class="sa-msg" id="sa-msg"></div><div class="sa-sub">Stok sekarang</div><div id="sa-list"></div>' +
      (scan ? '<div class="sa-sub">Stok masuk terakhir dari akun ini</div><div id="sa-hist"></div>' : '') + '</div></div>';
    ov.querySelector('[data-x]').onclick = close;
    var inp = document.getElementById('sa-in');
    if (inp) {
      inp.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); onScan(inp.value); inp.value = ''; } };
      setTimeout(function () { try { inp.focus(); } catch (e) {} }, 200);
    }
    var cb = ov.querySelector('[data-cam]'); if (cb) cb.onclick = openCam;
    found = null; renderList(); setMsg(msgT, msgErr);
  }

  function renderList() {
    var box = document.getElementById('sa-list'); if (!box) return;
    var l = mine();
    box.innerHTML = l.length ? l.map(function (p) {
      var lw = p.stock <= (typeof p.minStock === 'number' ? p.minStock : 5);
      return '<div class="sa-row"><div class="nm">' + esc(p.name) + '</div><div class="sa-st' + (lw ? ' low' : '') + '">' + fmt(p.stock) + ' ' + esc(unit(p)) + '</div></div>';
    }).join('') : '<div class="sa-card">Belum ada barang stok untuk usaha ini.</div>';
    var hb = document.getElementById('sa-hist');
    if (hb) {
      var m = me(), ev = [];
      l.forEach(function (p) { (p.inLog || []).forEach(function (e) { if (!m.slot || e.slot === m.slot) ev.push({ n: p.name, u: unit(p), e: e }); }); });
      ev.sort(function (a, b) { return b.e.at - a.e.at; });
      hb.innerHTML = ev.length ? ev.slice(0, 8).map(function (x) { return '<div class="sa-row"><div class="nm">' + esc(x.n) + '</div><div class="sa-st">+' + fmt(x.e.qty) + ' ' + esc(x.u) + '</div><div style="font-size:11px;color:#64748b">' + tfmt(x.e.at) + '</div></div>'; }).join('') : '<div style="font-size:12px;color:#64748b">Belum ada.</div>';
    }
  }

  function onScan(code) {
    code = String(code || '').trim(); if (!code) return;
    var r = lookup(code), box = document.getElementById('sa-found');
    if (r.err) { found = null; if (box) box.innerHTML = ''; setMsg(r.err, true); return; }
    found = r; setMsg('');
    var def = r.per > 1 ? r.per : 1;
    box.innerHTML = '<div class="sa-card"><div>' + esc(r.p.name) + '</div><div style="font-weight:600;color:#475569;margin-top:2px">Stok sekarang ' + fmt(r.p.stock) + ' ' + esc(unit(r.p)) + (r.per > 1 ? ' · barcode ini = 1 ' + esc(r.uname) + ' (isi ' + r.per + ' ' + esc(unit(r.p)) + ')' : '') + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px;align-items:center"><input id="sa-q" type="number" min="1" step="1" inputmode="numeric" value="' + def + '" style="width:110px"><span style="font-size:12px;font-weight:700;color:#475569">' + (r.per > 1 ? 'jumlah ' + esc(unit(r.p)) : esc(unit(r.p))) + '</span><button type="button" class="sa-btn" id="sa-add">Tambah stok</button></div></div>';
    var q = document.getElementById('sa-q'); try { q.focus(); q.select(); } catch (e) {}
    q.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); add(); } };
    document.getElementById('sa-add').onclick = add;
  }

  var busy = false;
  function add() {
    if (!found || busy) return;
    var q = document.getElementById('sa-q'), n = Math.floor(Number(q && q.value));
    if (!isFinite(n) || n < 1) { setMsg('Isi jumlah minimal 1.', true); return; }
    if (n > 100000) { setMsg('Jumlah terlalu besar, periksa lagi.', true); return; }
    var p = found.p, m = me(); busy = true;
    Promise.resolve(STORE.stockIn(p.code, n, m.title, { src: 'scan', slot: m.slot })).then(function (ok) {
      busy = false;
      if (ok === false) { setMsg('Gagal menyimpan. Periksa koneksi lalu coba lagi.', true); return; }
      var box = document.getElementById('sa-found'); if (box) box.innerHTML = '';
      found = null; setMsg('Tersimpan: ' + p.name + ' +' + fmt(n) + ' ' + unit(p));
      renderList();
      var inp = document.getElementById('sa-in'); if (inp) { try { inp.focus(); } catch (e) {} }
    }).catch(function () { busy = false; setMsg('Gagal menyimpan stok.', true); });
  }

  /* ---- kamera (butuh browser yang mendukung BarcodeDetector) ---- */
  var cam = null;
  function stopCam() { if (!cam) return; cam.alive = false; try { cam.stream && cam.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} if (cam.wrap && cam.wrap.parentNode) cam.wrap.parentNode.removeChild(cam.wrap); cam = null; }
  function openCam() {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices) { setMsg('Kamera scan belum didukung browser ini. Pakai alat scan atau ketik kodenya.', true); return; }
    stopCam();
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px';
    wrap.innerHTML = '<video autoplay playsinline muted style="width:min(480px,100%);border-radius:18px;background:#000"></video><div style="color:#fff;font:700 14px Inter,sans-serif">Arahkan kamera ke barcode</div><button type="button" class="sa-btn" style="all:unset;cursor:pointer;padding:10px 20px;border-radius:12px;background:#fff;color:#0f172a;font:800 13px Inter,sans-serif">Tutup kamera</button>';
    document.body.appendChild(wrap);
    var v = wrap.querySelector('video'), det;
    cam = { alive: true, wrap: wrap, stream: null };
    wrap.querySelector('button').onclick = stopCam;
    try { det = new BarcodeDetector(); } catch (e) { stopCam(); setMsg('Kamera scan belum didukung browser ini.', true); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function (st) {
      if (!cam) { st.getTracks().forEach(function (t) { t.stop(); }); return; }
      cam.stream = st; v.srcObject = st;
      var me0 = cam;
      (function loop() {
        if (cam !== me0 || !me0.alive) return;
        det.detect(v).then(function (r) {
          if (r && r[0] && r[0].rawValue) { var c = r[0].rawValue; stopCam(); onScan(c); return; }
          setTimeout(loop, 250);
        }).catch(function () { setTimeout(loop, 300); });
      })();
    }).catch(function () { stopCam(); setMsg('Kamera tidak bisa dibuka. Izinkan akses kamera.', true); });
  }

  function floatBtn() {
    if (!isKasir() || !(has('stok_admin') || has('stok_scan')) || document.getElementById('fm-stokadm-fab')) return;
    var b = document.createElement('button'); b.id = 'fm-stokadm-fab'; b.className = 'fm-fab'; b.setAttribute('data-fc', 'stk'); b.type = 'button'; b.textContent = 'Stok';
    b.style.cssText = 'position:fixed;right:120px;bottom:14px;z-index:2147482000;padding:10px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:#10b981;color:#04201a;font-weight:800;font-size:13px;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer';
    b.onclick = function () { FM_STOKADM.open(); }; document.body.appendChild(b);
  }
  window.FM_STOKADM = {
    open: function () { ensure(); msgT = ''; msgErr = false; render(); ov.style.display = 'flex'; },
    lookup: lookup, close: close
  };
  function boot() { var n = 0, iv = setInterval(function () { floatBtn(); if (document.getElementById('fm-stokadm-fab') || ++n > 20) clearInterval(iv); }, 800); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
