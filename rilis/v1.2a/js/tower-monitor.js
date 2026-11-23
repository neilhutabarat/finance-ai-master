/* tower-monitor.js — Pemantauan Error dan Log Login (hanya halaman Tower).
   Data ditulis oleh toko (js/monitor.js) ke error_logs dan login_logs; hanya Tower yang membaca & menghapus. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;
  var BTN = 'padding:7px 11px;border-radius:10px;font-weight:800;font-size:11.5px;color:#fff;border:0;cursor:pointer;';
  function H(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function DB() { return (typeof db !== 'undefined' && db) ? db : null; }
  function nm(id) { try { var t = TENANTS_CONFIG[String(id).toLowerCase()]; return t ? t.nama : id; } catch (e) { return id; } }
  function ago(ms) { var s = Math.max(0, (Date.now() - ms) / 1000); return s < 90 ? 'baru saja' : s < 5400 ? Math.round(s / 60) + ' mnt lalu' : s < 129600 ? Math.round(s / 3600) + ' jam lalu' : Math.round(s / 86400) + ' hari lalu'; }
  function dev(ua) {
    ua = String(ua || ''); var os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'Mac' : /Linux/i.test(ua) ? 'Linux' : '?';
    var br = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : '?';
    return os + ' · ' + br;
  }
  var tab = 'error', shop = '', data = { error: [], login: [] }, ov = null, loaded = false;
  function load() {
    var d = DB(); if (!d) return Promise.resolve();
    return Promise.all([d.collection('error_logs').orderBy('ms', 'desc').limit(400).get(), d.collection('login_logs').orderBy('ms', 'desc').limit(400).get()]).then(function (r) {
      data.error = []; data.login = [];
      r[0].forEach(function (x) { var v = x.data(); v._id = x.id; data.error.push(v); });
      r[1].forEach(function (x) { var v = x.data(); v._id = x.id; data.login.push(v); });
      loaded = true;
    });
  }
  function render() {
    var box = ov.el.querySelector('#mn-body'); if (!box) return;
    var rows = data[tab].filter(function (x) { return !shop || x.tenantId === shop; });
    var shops = {}; data[tab].forEach(function (x) { shops[x.tenantId] = 1; });
    var h = '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:10px">' +
      '<button data-t="error" style="' + BTN + 'background:' + (tab === 'error' ? '#dc2626' : '#334155') + '">Error (' + data.error.length + ')</button>' +
      '<button data-t="login" style="' + BTN + 'background:' + (tab === 'login' ? '#0891b2' : '#334155') + '">Log Login (' + data.login.length + ')</button>' +
      '<select id="mn-shop" style="padding:7px;border-radius:10px;background:#1e293b;color:#fff;font-size:11.5px;border:1px solid rgba(255,255,255,.15)"><option value="">Semua toko</option>' + Object.keys(shops).map(function (k) { return '<option value="' + H(k) + '"' + (k === shop ? ' selected' : '') + '>' + H(nm(k)) + '</option>'; }).join('') + '</select>' +
      '<span style="flex:1"></span><button data-a="reload" style="' + BTN + 'background:#334155">Muat ulang</button><button data-a="old" style="' + BTN + 'background:#7c3aed">Hapus &gt; 30 hari</button><button data-a="all" style="' + BTN + 'background:#be123c">Kosongkan</button></div>';
    if (!rows.length) { box.innerHTML = h + '<div style="padding:22px;text-align:center;opacity:.65;font-size:12.5px">' + (tab === 'error' ? 'Tidak ada error tercatat. Bagus.' : 'Belum ada login tercatat.') + '</div>'; return; }
    if (tab === 'error') {
      var g = {}; rows.forEach(function (x) { var k = x.tenantId + '|' + x.msg + '|' + x.src + '|' + x.line; var o = g[k] = g[k] || { x: x, n: 0, last: 0, vers: {} }; o.n++; if (x.ms > o.last) o.last = x.ms; if (x.ver) o.vers[x.ver] = 1; });
      var list = Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return b.last - a.last; });
      h += '<div style="font-size:11.5px;opacity:.7;margin-bottom:6px">' + list.length + ' jenis error dari ' + rows.length + ' kejadian. Salin teksnya dan kirim ke Claude untuk diperbaiki.</div>';
      list.forEach(function (o) {
        var x = o.x;
        h += '<div style="padding:9px 10px;margin-bottom:6px;border-radius:12px;background:rgba(255,255,255,.05);border-left:3px solid #ef4444"><div style="font-weight:800;font-size:12.5px;word-break:break-word">' + H(x.msg) + '</div>' +
          '<div style="font-size:11px;opacity:.7;margin-top:2px">' + H(nm(x.tenantId)) + ' · ' + H(x.page) + ' · ' + H(x.src) + ':' + (x.line || 0) + ' · ' + o.n + '× · ' + ago(o.last) + ' · ' + H(Object.keys(o.vers).join(', ')) + ' · ' + H(dev(x.ua)) + '</div>' +
          (x.stack ? '<details style="margin-top:4px"><summary style="font-size:11px;cursor:pointer;opacity:.7">Detail</summary><pre style="font-size:10.5px;white-space:pre-wrap;opacity:.8;margin:4px 0 0">' + H(x.stack) + '</pre></details>' : '') + '</div>';
      });
    } else {
      h += '<table style="width:100%;border-collapse:collapse;font-size:11.5px"><thead><tr style="text-align:left;opacity:.6"><th style="padding:5px">Waktu</th><th>Toko</th><th>Peran</th><th>Nama</th><th>Perangkat</th><th>Versi</th></tr></thead><tbody>';
      rows.slice(0, 300).forEach(function (x) {
        h += '<tr style="border-top:1px solid rgba(255,255,255,.07)"><td style="padding:6px 5px;white-space:nowrap">' + new Date(x.ms).toLocaleString('id-ID') + '<br><span style="opacity:.55">' + ago(x.ms) + '</span></td><td>' + H(nm(x.tenantId)) + '</td><td>' + H({ staff: 'Admin', manager: 'Manager', owner: 'Owner' }[x.role] || x.role) + '</td><td>' + H(x.name || '-') + '</td><td>' + H(dev(x.ua)) + '</td><td>' + H(x.ver || '') + '</td></tr>';
      });
      h += '</tbody></table>';
    }
    box.innerHTML = h;
  }
  function purge(older) {
    var d = DB(), col = tab === 'error' ? 'error_logs' : 'login_logs', cut = older ? Date.now() - 30 * 864e5 : Infinity;
    var ids = data[tab].filter(function (x) { return (!shop || x.tenantId === shop) && x.ms < cut; });
    if (!ids.length) return alert('Tidak ada yang perlu dihapus.');
    if (!confirm('Hapus ' + ids.length + ' catatan ' + (tab === 'error' ? 'error' : 'login') + '?')) return;
    var p = Promise.resolve();
    for (var i = 0; i < ids.length; i += 400) (function (part) { p = p.then(function () { var b = d.batch(); part.forEach(function (x) { b.delete(d.collection(col).doc(x._id)); }); return b.commit(); }); })(ids.slice(i, i + 400));
    p.then(load).then(render).catch(function (e) { alert('Gagal: ' + (e && e.message)); });
  }
  function open(t) {
    if (!DB()) return alert('Firestore belum terhubung. Masuk ke Tower dulu.');
    tab = t === 'login' ? 'login' : 'error'; shop = '';
    ov = towerOverlay('tw-mon', 'Pemantauan Error & Log Login', 'Error aplikasi dari toko, dan siapa yang masuk kapan', '<div id="mn-body" style="overflow:auto;padding:0 18px 16px"><div style="padding:20px;opacity:.7;font-size:12.5px">Memuat…</div></div>');
    ov.el.firstChild.style.width = 'min(900px,100%)';
    ov.el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-t]'); if (t) { tab = t.getAttribute('data-t'); shop = ''; render(); return; }
      var a = e.target.closest('[data-a]'); if (!a) return; var k = a.getAttribute('data-a');
      if (k === 'reload') load().then(render); else if (k === 'old') purge(true); else if (k === 'all') purge(false);
    });
    ov.el.addEventListener('change', function (e) { if (e.target.id === 'mn-shop') { shop = e.target.value; render(); } });
    load().then(render).catch(function (e) { ov.el.querySelector('#mn-body').innerHTML = '<div style="padding:16px;color:#fda4af;font-size:12.5px">Gagal memuat: ' + H(e && e.message) + '. Pastikan aturan Firestore terbaru sudah dipasang.</div>'; });
  }
  window.FM_MON = { open: open };
})();
