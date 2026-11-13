/* tower-qa.js — Uji Mandiri + Pemeriksa Kecocokan (hanya halaman Tower). Semua pemeriksaan BACA-SAJA: tidak ada data yang diubah.
   Uji Mandiri: file aplikasi lengkap di server, nomor versi sama di semua tempat, modul utama termuat.
   Pemeriksa Kecocokan: data satu toko (produk, transaksi, Properti) saling cocok dan tidak ada yang janggal. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;
  function H(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function DB() { return (typeof db !== 'undefined' && db) ? db : null; }
  function shops() { try { return Object.keys(TENANTS_CONFIG).map(function (k) { return TENANTS_CONFIG[k]; }).filter(function (t) { return t && t.id && !t.deletedByTower; }).sort(function (a, b) { return String(a.nama).localeCompare(String(b.nama)); }); } catch (e) { return []; } }
  var ov = null, busy = false, res = null, mode = 'uji', sel = '';
  var B = 'padding:9px 14px;border-radius:12px;font-weight:800;font-size:12.5px;color:#fff;border:0;cursor:pointer;';
  function get(u) { return fetch(u + (u.indexOf('?') < 0 ? '?' : '&') + 'q=' + Date.now(), { cache: 'no-store' }); }
  function ok(t, d) { return { s: 'ok', t: t, d: d || '' }; }
  function bad(t, d) { return { s: 'bad', t: t, d: d || '' }; }
  function warn(t, d) { return { s: 'warn', t: t, d: d || '' }; }

  function uji() {
    var out = [], ver = (window.FM_RELEASES && FM_RELEASES.beta) || '', pre = [], swVer = '';
    ['FM_RELEASES', 'FM_PLANS', 'TENANTS_CONFIG', 'FM_HEALTH', 'FM_MON', 'FM_DEMO'].forEach(function (g) {
      var has = false; try { has = typeof eval(g) !== 'undefined'; } catch (e) {}
      out.push(has ? ok('Modul ' + g + ' termuat') : bad('Modul ' + g + ' tidak termuat', 'Kemungkinan file js-nya belum terunggah.'));
    });
    return get('version.json').then(function (r) { return r.json(); }).then(function (j) {
      out.push(j.versi === ver ? ok('version.json cocok dengan aplikasi', ver) : bad('version.json (' + j.versi + ') berbeda dengan aplikasi (' + ver + ')', 'Klien tidak akan menerima notifikasi pembaruan dengan benar.'));
    }).catch(function () { out.push(bad('version.json tidak terbaca')); })
    .then(function () { return get('sw.js').then(function (r) { return r.text(); }); })
    .then(function (t) {
      var m = t.match(/var VERSI\s*=\s*'([^']+)'/); swVer = m ? m[1] : '';
      out.push(swVer ? ok('Nomor versi mode offline (sw.js)', swVer) : bad('VERSI di sw.js tidak ditemukan'));
      var p = t.match(/var PRE\s*=\s*\[([\s\S]*?)\];/); if (p) pre = (p[1].match(/'([^']+)'/g) || []).map(function (x) { return x.replace(/'/g, ''); });
      out.push(pre.length ? ok('Daftar file offline terbaca', pre.length + ' file') : warn('Daftar file offline tidak terbaca'));
    }).catch(function () { out.push(bad('sw.js tidak terbaca')); })
    .then(function () {
      return Promise.all(pre.map(function (f) { return get(f).then(function (r) { return r.ok ? null : f + ' (' + r.status + ')'; }).catch(function () { return f + ' (gagal)'; }); }));
    }).then(function (miss) {
      miss = miss.filter(Boolean);
      if (pre.length) out.push(miss.length ? bad(miss.length + ' file hilang di server', miss.join(', ')) : ok('Semua file aplikasi ada di server', pre.length + ' file diperiksa'));
      return get('index.html').then(function (r) { return r.text(); });
    }).then(function (h) {
      var m = h.match(/data-fm-ver[^>]*>([^<]*)</), shown = m ? m[1].trim() : '';
      out.push(shown ? ok('Tulisan versi di halaman login', shown) : warn('Tulisan versi di halaman login tidak ditemukan'));
      var s = (h.match(/src="js\/[^"]+"/g) || []).length; out.push(ok('Halaman login memuat ' + s + ' file skrip'));
      return get('rilis/index.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    }).then(function (idx) {
      out.push(idx ? ok('Daftar rilis cadangan ada', JSON.stringify(idx).slice(0, 90)) : warn('Belum ada rilis cadangan (rilis/index.json)', 'Normal sampai versi akhir dibuat.'));
      return out;
    });
  }

  function cocok(id) {
    var d = DB(), out = [], t = TENANTS_CONFIG[Object.keys(TENANTS_CONFIG).filter(function (k) { return TENANTS_CONFIG[k].id === id; })[0]] || {};
    if (!d) return Promise.resolve([bad('Database belum tersambung')]);
    out.push(t.nama ? ok('Data toko terdaftar', t.nama + ' · ' + (t.tier || t.plan || '-')) : bad('Toko tidak ditemukan di daftar'));
    var coa = Array.isArray(t.coa) ? t.coa.map(function (c) { return String(c.code); }) : null;
    var prods = [], txs = [], pu = [];
    return d.collection('tp_' + id).get().then(function (s) { s.forEach(function (x) { prods.push(Object.assign({ _id: x.id }, x.data())); });
      return d.collection('tx_' + id).limit(3000).get(); }).then(function (s) { s.forEach(function (x) { txs.push(Object.assign({ _id: x.id }, x.data())); });
      return d.collection('pu_' + id).get(); }).then(function (s) { s.forEach(function (x) { pu.push(Object.assign({ _id: x.id }, x.data())); }); }).catch(function (e) { out.push(bad('Gagal membaca data', e && e.message || '')); })
    .then(function () {
      var n = 0, c = {}, bc = {}, dupC = [], dupB = [], neg = [], noName = [], noPrice = [];
      prods.forEach(function (p) {
        if (!p.name || !String(p.name).trim()) noName.push(p._id);
        if (Number(p.stock) < 0) neg.push(p.name || p._id);
        if (!(Number(p.price) > 0)) noPrice.push(p.name || p._id);
        var k = String(p.code || p._id); if (c[k]) dupC.push(k); c[k] = 1;
        if (p.barcode) { var b = String(p.barcode); if (bc[b]) dupB.push(b); bc[b] = 1; }
      });
      out.push(ok('Produk dibaca', prods.length + ' item'));
      out.push(noName.length ? bad(noName.length + ' produk tanpa nama', noName.slice(0, 5).join(', ')) : ok('Semua produk punya nama'));
      out.push(neg.length ? warn(neg.length + ' produk stoknya minus', neg.slice(0, 5).join(', ')) : ok('Tidak ada stok minus'));
      out.push(noPrice.length ? warn(noPrice.length + ' produk harga 0 / kosong', noPrice.slice(0, 5).join(', ')) : ok('Semua produk punya harga'));
      out.push(dupC.length ? bad(dupC.length + ' kode produk ganda', dupC.slice(0, 5).join(', ')) : ok('Tidak ada kode produk ganda'));
      out.push(dupB.length ? bad(dupB.length + ' barcode ganda', 'Scanner bisa salah baca barang: ' + dupB.slice(0, 5).join(', ')) : ok('Tidak ada barcode ganda'));
      var noAmt = 0, noDate = 0, noAcc = 0, unk = 0;
      txs.forEach(function (x) {
        if (!(Number(x.amount) > 0)) noAmt++;
        if (!x.dateISO || isNaN(new Date(x.dateISO).getTime())) noDate++;
        if (!x.accountCode) noAcc++; else if (coa && coa.indexOf(String(x.accountCode)) < 0) unk++;
      });
      out.push(ok('Transaksi dibaca', txs.length + (txs.length >= 3000 ? ' (3000 terbaru yang diperiksa)' : '')));
      out.push(noAmt ? bad(noAmt + ' transaksi nominal 0 / rusak') : ok('Semua nominal transaksi valid'));
      out.push(noDate ? bad(noDate + ' transaksi tanggalnya rusak') : ok('Semua tanggal transaksi valid'));
      out.push(noAcc ? bad(noAcc + ' transaksi tanpa akun') : ok('Semua transaksi punya akun'));
      if (coa) out.push(unk ? warn(unk + ' transaksi memakai kode akun yang tidak ada di COA toko', 'Bisa tidak muncul di laporan.') : ok('Kode akun transaksi cocok dengan COA toko'));
      var units = {}, ten = {}, bills = [];
      pu.forEach(function (x) { if (x.t === 'xu') units[x._id] = 1; else if (x.t === 'xs') ten[x._id] = 1; else if (x.t === 'xb') bills.push(x); });
      if (Object.keys(units).length || bills.length) {
        var orphan = bills.filter(function (b) { return (b.unitId && !units[b.unitId]) || (b.tenantId && !ten[b.tenantId]) || (b.penyewaId && !ten[b.penyewaId]); }).length;
        out.push(ok('Properti dibaca', Object.keys(units).length + ' unit · ' + Object.keys(ten).length + ' penyewa · ' + bills.length + ' tagihan'));
        out.push(orphan ? bad(orphan + ' tagihan menunjuk unit/penyewa yang sudah tidak ada') : ok('Semua tagihan Properti cocok dengan unit dan penyewa'));
        var ids = {}; txs.forEach(function (x) { if (x.propBillId) ids[x.propBillId] = 1; });
        var lunas = bills.filter(function (b) { return Number(b.paid) > 0 && !ids[b._id]; }).length;
        out.push(lunas ? warn(lunas + ' tagihan bertanda dibayar tetapi tidak ada transaksinya di pembukuan') : ok('Pembayaran Properti cocok dengan pembukuan'));
      }
      return out;
    });
  }

  function run() {
    if (busy) return; if (mode === 'cocok' && !sel) { res = [warn('Pilih toko dulu')]; render(); return; }
    busy = true; res = null; render();
    (mode === 'uji' ? uji() : cocok(sel)).then(function (r) { res = r; }).catch(function (e) { res = [bad('Pemeriksaan terhenti', e && e.message || '')]; }).then(function () { busy = false; render(); });
  }
  function render() {
    if (!ov || ov.style.display === 'none') return;
    var S = shops(), col = { ok: '#22c55e', warn: '#f59e0b', bad: '#ef4444' }, ic = { ok: '✓', warn: '!', bad: '✕' };
    var nb = res ? res.filter(function (x) { return x.s === 'bad'; }).length : 0, nw = res ? res.filter(function (x) { return x.s === 'warn'; }).length : 0;
    var tab = function (k, l) { return '<button data-m="' + k + '" style="' + B + 'background:' + (mode === k ? '#4f46e5' : '#334155') + '">' + l + '</button>'; };
    ov.innerHTML = '<div style="width:100%;max-width:560px;max-height:90vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:18px;font-family:-apple-system,Segoe UI,sans-serif"><div style="display:flex;justify-content:space-between;gap:10px"><div><div style="font-weight:800;font-size:17px">Uji Mandiri &amp; Kecocokan</div><div style="font-size:12px;opacity:.65">Hanya membaca, tidak mengubah data apa pun.</div></div><button data-x style="' + B + 'background:#334155;padding:7px 12px">Tutup</button></div>' +
      '<div style="display:flex;gap:8px;margin-top:14px">' + tab('uji', 'Uji Mandiri') + tab('cocok', 'Kecocokan Data Toko') + '</div>' +
      '<p style="font-size:12px;opacity:.7;margin:10px 0">' + (mode === 'uji' ? 'Memastikan file aplikasi lengkap di server dan nomor versi sama di semua tempat.' : 'Memeriksa produk, transaksi, dan Properti satu toko saling cocok.') + '</p>' +
      (mode === 'cocok' ? '<select id="qa-shop" style="width:100%;padding:9px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:#12131a;color:#f5f5f7;font-size:13px;margin-bottom:10px"><option value="">Pilih toko…</option>' + S.map(function (t) { return '<option value="' + H(t.id) + '"' + (sel === t.id ? ' selected' : '') + '>' + H(t.nama) + ' [' + H(t.id) + ']</option>'; }).join('') + '</select>' : '') +
      '<button data-a="run" style="' + B + 'background:#16a34a"' + (busy ? ' disabled' : '') + '>' + (busy ? 'Memeriksa…' : 'Mulai periksa') + '</button>' +
      (res ? '<div style="margin-top:12px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.07);font-size:12.5px;font-weight:700">' + (nb ? nb + ' masalah perlu diperbaiki' : (nw ? 'Aman, ' + nw + ' catatan' : 'Semua lulus')) + (nb && nw ? ' · ' + nw + ' catatan' : '') + '</div>' + res.map(function (x) { return '<div style="display:flex;gap:10px;margin-top:8px;font-size:12.5px"><span style="flex:none;width:20px;height:20px;border-radius:50%;background:' + col[x.s] + ';color:#000;font-weight:900;text-align:center;line-height:20px;font-size:12px">' + ic[x.s] + '</span><div><div style="font-weight:700">' + H(x.t) + '</div>' + (x.d ? '<div style="opacity:.65;font-size:11.5px">' + H(x.d) + '</div>' : '') + '</div></div>'; }).join('') : '') + '</div>';
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-qa';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px';
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; } var m = e.target.closest('[data-m]'); if (m) { mode = m.getAttribute('data-m'); res = null; render(); return; } if (e.target.closest('[data-a]')) run(); });
    ov.addEventListener('change', function (e) { if (e.target.id === 'qa-shop') { sel = e.target.value; res = null; render(); } });
    document.body.appendChild(ov);
  }
  window.FM_QA = { open: function () { ensure(); res = null; ov.style.display = 'flex'; render(); } };
})();
