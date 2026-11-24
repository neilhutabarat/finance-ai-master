/* tower-featx.js — Fitur Khusus Toko (Tower).
   Memberi atau mencabut fitur untuk satu toko saja, tanpa mengubah paket.
   Disimpan di tenant_ctrl/<toko>.featX = { kunci: true | false } (dibaca aplikasi klien lewat js/ctrl.js + js/plans.js).
   Tanpa centang khusus, toko mengikuti paketnya. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;
  var P = function () { return window.FM_PLANS; };
  var ROLES = ['kasir', 'manager', 'owner'];
  var TIER = { basic: 'Basic', plus: 'Plus', pro: 'Pro' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fs() { try { if (typeof db !== 'undefined' && db) return db; } catch (e) {} try { return FM_AUTH.towerDb(); } catch (e) { return null; } }
  function stores() {
    var C = {}; try { C = (typeof TENANTS_CONFIG !== 'undefined') ? TENANTS_CONFIG : (window.TENANTS_CONFIG || {}); } catch (e) {}
    var seen = {}, out = [];
    Object.keys(C).forEach(function (k) { var t = C[k]; if (!t || !t.id || t.deletedByTower || seen[t.id]) return; seen[t.id] = 1; out.push(t); });
    out.sort(function (a, b) { return String(a.nama || '').localeCompare(String(b.nama || '')); });
    return out;
  }
  function tierOf(tn) { try { return P().tierOf(tn) || 'basic'; } catch (e) { return 'basic'; } }
  function optional(f) { return f && !f.soon && ROLES.some(function (r) { return f.r[r] === 'o'; }); }
  /* menyala dari paket / pengaturan toko (tanpa fitur khusus) */
  function baseOn(f, tn) { try { return ROLES.some(function (r) { return f.r[r] === 'o' && P().hasBase(f.key, r, tn); }); } catch (e) { return false; } }
  function shortLabel(l) { return String(l || '').replace(/\s*\((?:Kamera|Excel)[^)]*\)/g, '').replace(/:\s*/, ' · ').trim(); }

  var ov = null;
  function shell(sub, body) {
    if (typeof towerOverlay !== 'function') { alert('Tower belum siap, muat ulang halaman.'); return null; }
    ov = towerOverlay('tw-featx', 'Fitur Khusus Toko', sub, '<div id="tw-fx" style="padding:4px 18px 14px;font-size:13px">' + body + '</div>');
    return ov.el.querySelector('#tw-fx');
  }

  /* ---------- langkah 1: pilih toko ---------- */
  function open() {
    var box = shell('Beri atau cabut fitur untuk satu toko saja. Paket dan toko lain tidak berubah.',
      '<input id="tw-fx-q" type="search" placeholder="Cari nama atau ID toko" style="width:100%;box-sizing:border-box;padding:10px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:inherit;font-size:13px;outline:none">' +
      '<div id="tw-fx-list" style="display:flex;flex-direction:column;gap:6px;margin-top:10px"></div>');
    if (!box) return;
    var q = box.querySelector('#tw-fx-q'), list = box.querySelector('#tw-fx-list');
    function draw() {
      var t = q.value.trim().toLowerCase();
      var rows = stores().filter(function (s) { return !t || String(s.nama || '').toLowerCase().indexOf(t) >= 0 || String(s.id).toLowerCase().indexOf(t) >= 0; });
      list.innerHTML = rows.length ? rows.map(function (s) {
        return '<button data-fx="' + esc(s.id) + '" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)">' +
          '<span style="flex:1;min-width:0"><b style="display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(s.nama || s.id) + '</b><span style="font-size:11.5px;opacity:.6;font-family:ui-monospace,Menlo,Consolas,monospace">' + esc(String(s.id).toUpperCase()) + '</span></span>' +
          '<span style="font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.1)">' + esc(TIER[tierOf(s)] || 'Basic') + '</span></button>';
      }).join('') : '<div style="padding:16px 4px;opacity:.7">Toko tidak ditemukan.</div>';
      [].forEach.call(list.querySelectorAll('[data-fx]'), function (b) { b.onclick = function () { edit(b.getAttribute('data-fx')); }; });
    }
    q.oninput = draw; draw(); setTimeout(function () { try { q.focus(); } catch (e) {} }, 50);
  }

  /* ---------- langkah 2: centang fitur toko ---------- */
  function edit(id) {
    var tn = stores().filter(function (s) { return s.id === id; })[0]; if (!tn) return open();
    var box = shell('Memuat…', '<div style="opacity:.7;padding:12px 0">Memuat…</div>'); if (!box) return;
    var f = fs(); if (!f) { box.textContent = 'Database belum siap.'; return; }
    f.collection('tenant_ctrl').doc(id).get().then(function (snap) {
      var X = {}; try { var d = snap.exists ? snap.data() : {}; if (d && d.featX && typeof d.featX === 'object') X = JSON.parse(JSON.stringify(d.featX)); } catch (e) {}
      render(tn, X);
    }).catch(function (e) { box.textContent = 'Gagal memuat: ' + (e && e.message || e); });
  }
  function render(tn, X) {
    var tier = tierOf(tn), FEATS = (P() && P().FEATURES) || [], CATS = (P() && P().CATS) || [];
    var byKey = {}; FEATS.forEach(function (f) { byKey[f.key] = f; });
    var used = {}, groups = [];
    CATS.forEach(function (c) { var ks = (c.keys || []).filter(function (k) { return optional(byKey[k]); }); ks.forEach(function (k) { used[k] = 1; }); if (ks.length) groups.push([c.label.replace(/\s*\(.*\)$/, ''), ks]); });
    var rest = FEATS.filter(function (f) { return optional(f) && !used[f.key]; }).map(function (f) { return f.key; });
    if (rest.length) groups.push(['Lainnya', rest]);

    function isOn(k) { return X[k] === true || X[k] === false ? X[k] : baseOn(byKey[k], tn); }
    function nKhusus() { return Object.keys(X).filter(function (k) { return X[k] === true || X[k] === false; }).length; }

    var body = '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">' +
        '<button data-back style="all:unset;cursor:pointer;font-size:12px;font-weight:700;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.08)">← Pilih toko lain</button>' +
        '<b style="font-size:14px">' + esc(tn.nama || tn.id) + '</b><span style="font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.1)">' + esc(TIER[tier] || 'Basic') + '</span>' +
        '<span id="tw-fx-n" style="font-size:12px;opacity:.7"></span></div>' +
      '<div style="display:flex;flex-direction:column;gap:12px">' + groups.map(function (g) {
        return '<div style="border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);padding:6px 12px">' +
          '<div style="font-weight:800;font-size:12.5px;padding:6px 2px 4px;opacity:.85">' + esc(g[0]) + '</div>' +
          g[1].map(function (k) {
            var f = byKey[k];
            return '<label style="display:flex;align-items:center;gap:10px;padding:8px 2px;border-top:1px solid rgba(255,255,255,.06);cursor:pointer">' +
              '<input type="checkbox" data-k="' + esc(k) + '"' + (isOn(k) ? ' checked' : '') + ' style="width:17px;height:17px;flex:none;accent-color:#0891b2">' +
              '<span style="flex:1;min-width:0">' + esc(shortLabel(f.label)) + '</span>' +
              '<span data-tag="' + esc(k) + '" style="font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:999px;background:rgba(8,145,178,.22);color:#67e8f9;display:none">Khusus</span></label>';
          }).join('') + '</div>';
      }).join('') + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:14px -18px -14px;position:sticky;bottom:-14px;padding:12px 18px 14px;background:#0f172a;border-top:1px solid rgba(255,255,255,.1)">' +
        '<button data-save style="all:unset;cursor:pointer;padding:10px 18px;border-radius:999px;background:#0891b2;color:#fff;font-weight:800;font-size:13px">Simpan</button>' +
        '<button data-reset style="all:unset;cursor:pointer;padding:10px 18px;border-radius:999px;background:rgba(255,255,255,.08);font-weight:700;font-size:13px">Kembalikan ke paket</button>' +
        '<span id="tw-fx-msg" style="align-self:center;font-size:12px;opacity:.8"></span></div>';
    var box = shell('Centang untuk memberi fitur, hapus centang untuk mencabut. Hanya berlaku untuk toko ini.', body); if (!box) return;
    var msg = box.querySelector('#tw-fx-msg');
    function sync() {
      [].forEach.call(box.querySelectorAll('[data-tag]'), function (t) { var k = t.getAttribute('data-tag'); t.style.display = (X[k] === true || X[k] === false) ? 'inline-block' : 'none'; });
      var n = nKhusus(); box.querySelector('#tw-fx-n').textContent = n ? n + ' fitur khusus' : 'Mengikuti paket';
    }
    [].forEach.call(box.querySelectorAll('[data-k]'), function (c) {
      c.onchange = function () { var k = c.getAttribute('data-k'), base = baseOn(byKey[k], tn); if (c.checked === base) delete X[k]; else X[k] = c.checked; msg.textContent = ''; sync(); };
    });
    box.querySelector('[data-back]').onclick = open;
    function save(obj, done) {
      var f = fs(); if (!f) return;
      msg.style.color = ''; msg.textContent = 'Menyimpan…';
      var ref = f.collection('tenant_ctrl').doc(tn.id);
      ref.update({ featX: obj }).catch(function () { return ref.set({ featX: obj }, { merge: true }); })
        .then(function () { msg.style.color = '#34d399'; msg.textContent = 'Tersimpan. Aplikasi toko memuat ulang sendiri.'; if (done) done(); })
        .catch(function (e) { msg.style.color = '#f87171'; msg.textContent = 'Gagal menyimpan: ' + (e && e.message || e); });
    }
    box.querySelector('[data-save]').onclick = function () { save(X); };
    box.querySelector('[data-reset]').onclick = async function () {
      if (!nKhusus()) { msg.textContent = 'Toko ini sudah mengikuti paket.'; return; }
      var ok = typeof fmAsk === 'function' ? await fmAsk('Kembalikan semua fitur ' + (tn.nama || tn.id) + ' ke isi paket ' + (TIER[tier] || 'Basic') + '?') : confirm('Kembalikan ke paket?');
      if (!ok) return;
      save({}, function () { X = {}; [].forEach.call(box.querySelectorAll('[data-k]'), function (c) { c.checked = baseOn(byKey[c.getAttribute('data-k')], tn); }); sync(); });
    };
    sync();
  }
  window.FM_TFX = { open: open, edit: edit };
})();
