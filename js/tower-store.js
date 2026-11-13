/* tower-store.js — OneilStore sisi Tower (hanya halaman Tower).
   - Permintaan sewa dari klien = provider_tickets bertipe 'store'. Tower mengaktifkan / menolak.
   - Sewa aktif ditulis ke tenant_ctrl/<toko>.rentals = { <idItem>: { until, trial, since, period } } dan tenant_ctrl/<toko>.trialUsed.
   - Sewa hanya menambah fitur; mencabut atau kedaluwarsa tidak menyentuh data toko. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;
  function H(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function DB() { return (typeof db !== 'undefined' && db) ? db : null; }
  function ST() { return (window.FM_PLANS && FM_PLANS.STORE) || null; }
  function rp(n) { return 'Rp' + Number(n || 0).toLocaleString('id-ID'); }
  function dstr(ms) { try { return new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(ms) { var d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  var reqs = [], ctrls = {}, ov = null, started = false, tab = 'minta', pill = null, note = '';
  var B = 'padding:7px 11px;border-radius:10px;font-weight:800;font-size:11.5px;border:0;cursor:pointer;color:#fff;';
  var INP = 'width:100%;box-sizing:border-box;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:12.5px;outline:none';
  var PER = { bulan: 'Bulanan', tahun: 'Tahunan', coba: 'Coba' };

  function tenantsList() {
    var out = []; try { var T = (typeof TENANTS_CONFIG !== 'undefined') ? TENANTS_CONFIG : {}; Object.keys(T).forEach(function (k) { var t = T[k]; if (t && t.id) out.push({ id: t.id, nama: t.nama || t.id }); }); } catch (e) {}
    out.sort(function (a, b) { return String(a.nama).localeCompare(String(b.nama)); }); return out;
  }
  function nameOf(id) { var l = tenantsList().filter(function (t) { return String(t.id).toLowerCase() === String(id).toLowerCase(); })[0]; return l ? l.nama : id; }

  function start() {
    var d = DB(); if (started || !d) return; started = true;
    d.collection('provider_tickets').where('type', '==', 'store').onSnapshot(function (s) {
      reqs = []; s.forEach(function (x) { var v = x.data(); v.docId = x.id; reqs.push(v); });
      reqs.sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); }); notify(); render();
    }, function (e) { console.error('Permintaan Store', e); });
    d.collection('tenant_ctrl').onSnapshot(function (s) { ctrls = {}; s.forEach(function (x) { ctrls[x.id] = x.data() || {}; }); render(); }, function () {});
  }
  function nBaru() { return reqs.filter(function (t) { return t.status === 'BARU'; }).length; }
  function notify() {
    var n = nBaru();
    if (!n) { if (pill) { pill.remove(); pill = null; } return; }
    if (!pill) {
      pill = document.createElement('button'); pill.type = 'button';
      pill.style.cssText = 'position:fixed;left:12px;bottom:56px;z-index:2147482000;padding:9px 14px;border-radius:999px;border:1px solid #6b21a8;background:#2e1065;color:#d8b4fe;font:800 12px -apple-system,Segoe UI,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.4)';
      pill.onclick = function () { FM_TSTORE.open('minta'); }; document.body.appendChild(pill);
    }
    pill.textContent = n + ' permintaan Store baru';
  }

  /* hitung tanggal berakhir: lanjut dari sisa sewa bila masih aktif */
  function untilFor(existing, period) {
    var now = Date.now(), base = (existing && Number(existing.until) > now) ? Number(existing.until) : now, d = new Date(base);
    if (period === 'coba') d.setDate(d.getDate() + ((ST() && ST().trialDays) || 7));
    else if (period === 'tahun') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d.getTime();
  }
  function grant(tenantId, item, period) {
    var d = DB(); if (!d) { alert('Firestore belum terhubung.'); return Promise.reject(); }
    var ex = ((ctrls[tenantId] || {}).rentals || {})[item];
    var entry = { until: untilFor(ex, period), trial: period === 'coba' && !(ex && !ex.trial && Number(ex.until) > Date.now()), since: (ex && ex.since) || Date.now(), period: period };
    var data = { rentals: {} }; data.rentals[item] = entry;
    if (period === 'coba') { data.trialUsed = {}; data.trialUsed[item] = true; }
    return d.collection('tenant_ctrl').doc(tenantId).set(data, { merge: true }).then(function () { return entry; });
  }
  function revoke(tenantId, item) {
    var d = DB(); if (!d) return alert('Firestore belum terhubung.');
    var u = {}; u['rentals.' + item] = firebase.firestore.FieldValue.delete();
    d.collection('tenant_ctrl').doc(tenantId).update(u).catch(function (e) { alert('Gagal: ' + (e && e.message || e)); });
  }
  function upd(id, data) { var d = DB(); if (!d) return Promise.reject(); return d.collection('provider_tickets').doc(id).update(data); }
  function find(id) { return reqs.filter(function (r) { return r.docId === id; })[0]; }

  function act(a, id, extra) {
    if (a === 'ok') {
      var r = find(id); if (!r) return;
      var it = ST() && ST().item(r.item); if (!it) return alert('Item tidak dikenal: ' + r.item);
      var msg = 'Aktifkan ' + it.name + ' (' + (PER[r.period] || r.period) + ') untuk ' + nameOf(r.tenantId) + '?\n\nPastikan pembayaran ' + rp(r.price) + ' sudah diterima.';
      if (r.period === 'coba') msg = 'Aktifkan masa coba ' + it.name + ' untuk ' + nameOf(r.tenantId) + '?';
      if (!confirm(msg)) return;
      var nt = prompt('Catatan untuk klien (boleh kosong):', 'Terima kasih, fitur sudah aktif.'); if (nt === null) return;
      grant(r.tenantId, r.item, r.period).then(function (e) {
        return upd(id, { status: 'AKTIF', note: String(nt).slice(0, 300), processedAt: new Date().toLocaleString('id-ID'), until: e.until });
      }).catch(function (e) { if (e) alert('Gagal: ' + (e.message || e)); });
    } else if (a === 'no') {
      var nt2 = prompt('Alasan penolakan (terlihat oleh klien):', 'Pembayaran belum diterima.'); if (nt2 === null) return;
      upd(id, { status: 'DITOLAK', note: String(nt2).slice(0, 300), processedAt: new Date().toLocaleString('id-ID') }).catch(function (e) { alert('Gagal: ' + (e && e.message || e)); });
    } else if (a === 'del') {
      if (!confirm('Hapus permintaan ini?')) return; var d = DB(); if (d) d.collection('provider_tickets').doc(id).delete().catch(function (e) { alert('Gagal: ' + (e && e.message || e)); });
    } else if (a === 'revoke') {
      var p = String(id).split('|'); if (confirm('Cabut sewa ' + p[1] + ' dari ' + nameOf(p[0]) + '? Data toko tidak berubah, hanya fiturnya terkunci lagi.')) revoke(p[0], p[1]);
    } else if (a === 'date') {
      var q = String(id).split('|'), cur = ((ctrls[q[0]] || {}).rentals || {})[q[1]], v = prompt('Tanggal berakhir baru (YYYY-MM-DD):', cur ? iso(cur.until) : iso(Date.now())); if (v === null) return;
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v).trim()); if (!m) return alert('Format harus YYYY-MM-DD.');
      var ms = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59).getTime(); if (!isFinite(ms)) return alert('Tanggal tidak valid.');
      var d2 = DB(); if (!d2) return; var u = {}; u['rentals.' + q[1] + '.until'] = ms;
      d2.collection('tenant_ctrl').doc(q[0]).update(u).catch(function (e) { alert('Gagal: ' + (e && e.message || e)); });
    } else if (a === 'dm_on' || a === 'dm_ext') {
      var dd = DB(); if (!dd) return alert('Firestore belum terhubung.');
      var cur2 = Number((ctrls[id] || {}).demoUntil) || 0, base = (a === 'dm_ext' && cur2 > Date.now()) ? cur2 : Date.now();
      var dy = prompt((a === 'dm_ext' ? 'Tambah berapa hari?' : 'Masa demo berapa hari?') + ' (' + nameOf(id) + ')', '7'); if (dy === null) return;
      dy = Math.round(Number(dy)); if (!(dy >= 1 && dy <= 90)) return alert('Isi angka 1 sampai 90.');
      dd.collection('tenant_ctrl').doc(id).set({ demoUntil: base + dy * 86400000, demo: true }, { merge: true }).catch(function (e) { alert('Gagal: ' + (e && e.message || e)); });
    } else if (a === 'dm_off') {
      if (!confirm('Jadikan ' + nameOf(id) + ' toko asli? Label dan batas demo dicabut. Data toko TIDAK dihapus (bersihkan data contoh lewat Kesehatan Sistem bila perlu).')) return;
      var d3 = DB(); if (!d3) return; var u3 = { demo: firebase.firestore.FieldValue.delete(), demoUntil: firebase.firestore.FieldValue.delete() };
      d3.collection('tenant_ctrl').doc(id).update(u3).catch(function (e) { alert('Gagal: ' + (e && e.message || e)); });
    } else if (a === 'dm_new') { ov.style.display = 'none'; try { openModal('add_tenant'); } catch (e) { alert('Buka menu Klien Baru dari beranda Tower.'); }
    } else if (a === 'dm_data') { ov.style.display = 'none'; try { FM_DEMO.open(); } catch (e) { alert('Data Demo belum dimuat.'); }
    } else if (a === 'give') {
      var tId = (ov.querySelector('#ts-t') || {}).value, item = (ov.querySelector('#ts-i') || {}).value, per = (ov.querySelector('#ts-p') || {}).value;
      if (!tId || !item) { note = 'Pilih toko dan item.'; return render(); }
      var itm = ST().item(item); if (!confirm('Beri sewa ' + (itm ? itm.name : item) + ' (' + (PER[per] || per) + ') ke ' + nameOf(tId) + '?')) return;
      grant(tId, item, per).then(function (e) { note = 'Sewa aktif sampai ' + dstr(e.until) + '.'; render(); }).catch(function (e) { if (e) { note = 'Gagal: ' + (e.message || e); render(); } });
    }
  }

  function viewMinta() {
    var h = '<div style="display:flex;gap:6px;margin:4px 0 10px">' + [['baru', 'Menunggu'], ['semua', 'Semua']].map(function (x) { return '<button data-f="' + x[0] + '" style="' + B + (filter === x[0] ? 'background:#7c3aed' : 'background:#334155') + '">' + x[1] + '</button>'; }).join('') + '</div>';
    var rows = reqs.filter(function (r) { return filter === 'semua' || r.status === 'BARU'; });
    if (!rows.length) return h + '<p style="opacity:.65;text-align:center;padding:20px;font-size:13px">Tidak ada permintaan.</p>';
    rows.forEach(function (r) {
      var col = r.status === 'AKTIF' ? '#4ade80' : r.status === 'DITOLAK' ? '#fb7185' : '#fbbf24';
      h += '<div style="padding:12px;margin-bottom:10px;border-radius:14px;background:rgba(255,255,255,.05);font-size:12.5px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><div><b>' + H(r.itemName || r.item) + '</b> <span style="opacity:.7">· ' + H(PER[r.period] || r.period) + ' · ' + rp(r.price) + '</span>' +
        '<div style="opacity:.7;font-size:11.5px;margin-top:2px">' + H(nameOf(r.tenantId)) + ' [' + H(r.tenantId) + '] · ' + H(r.requestedBy || '') + ' (' + H(r.role || '') + ') · ' + H(r.requestedAt || '') + '</div></div>' +
        '<b style="color:' + col + ';font-size:11px">' + H(r.status) + '</b></div>' +
        (r.note ? '<div style="margin-top:6px;opacity:.85;white-space:pre-wrap">Catatan: ' + H(r.note) + '</div>' : '') +
        '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">' +
        (r.status === 'BARU' ? '<button data-a="ok" data-id="' + H(r.docId) + '" style="' + B + 'background:#16a34a">Aktifkan</button><button data-a="no" data-id="' + H(r.docId) + '" style="' + B + 'background:#be123c">Tolak</button>' : '') +
        '<button data-a="del" data-id="' + H(r.docId) + '" style="' + B + 'background:#475569">Hapus</button></div></div>';
    });
    return h;
  }
  function viewAktif() {
    var st = ST(), now = Date.now(), h = '', n = 0;
    Object.keys(ctrls).sort().forEach(function (tid) {
      var R = ctrls[tid].rentals || {};
      Object.keys(R).forEach(function (id) {
        var it = st.item(id), e = R[id]; if (!e) return; n++;
        var alive = Number(e.until) > now, days = Math.ceil((Number(e.until) - now) / 86400000);
        h += '<div style="padding:10px 12px;margin-bottom:8px;border-radius:14px;background:rgba(255,255,255,.05);font-size:12.5px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><div><b>' + H(it ? it.name : id) + '</b>' + (e.trial ? ' <span style="color:#fbbf24;font-size:10px">COBA</span>' : '') +
          '<div style="opacity:.7;font-size:11.5px">' + H(nameOf(tid)) + ' [' + H(tid) + ']</div></div><div style="text-align:right;font-size:11.5px;color:' + (alive ? '#4ade80' : '#fb7185') + '">' + (alive ? 'Sampai ' + dstr(Number(e.until)) + ' (' + days + ' hari)' : 'Habis ' + dstr(Number(e.until))) + '</div></div>' +
          '<div style="display:flex;gap:6px;margin-top:8px"><button data-a="date" data-id="' + H(tid + '|' + id) + '" style="' + B + 'background:#334155">Atur tanggal</button><button data-a="revoke" data-id="' + H(tid + '|' + id) + '" style="' + B + 'background:#be123c">Cabut</button></div></div>';
      });
    });
    if (!n) h = '<p style="opacity:.65;text-align:center;padding:20px;font-size:13px">Belum ada sewa.</p>';
    return h;
  }
  function viewBeri() {
    var st = ST(), opts = st.products.map(function (p) { return '<option value="' + H(p.id) + '">' + H(p.name) + ' — ' + rp(p.price) + '</option>'; }).join('') +
      '<optgroup label="Paket usaha">' + st.packs.map(function (p) { return '<option value="' + H(p.id) + '">' + H(p.name) + ' — ' + rp(p.price) + '</option>'; }).join('') + '</optgroup>' +
      '<option value="' + H(st.all.id) + '">' + H(st.all.name) + ' — ' + rp(st.all.price) + '</option>';
    return '<div style="font-size:12px;opacity:.7;margin-bottom:8px">Untuk penjualan langsung tanpa permintaan dari klien.</div>' +
      '<label style="font-size:11.5px;font-weight:700;opacity:.8">Toko</label><select id="ts-t" style="' + INP + ';margin:4px 0 10px">' + tenantsList().map(function (t) { return '<option value="' + H(t.id) + '">' + H(t.nama) + ' [' + H(t.id) + ']</option>'; }).join('') + '</select>' +
      '<label style="font-size:11.5px;font-weight:700;opacity:.8">Fitur atau paket</label><select id="ts-i" style="' + INP + ';margin:4px 0 10px">' + opts + '</select>' +
      '<label style="font-size:11.5px;font-weight:700;opacity:.8">Lama</label><select id="ts-p" style="' + INP + ';margin:4px 0 10px"><option value="bulan">Bulanan (1 bulan)</option><option value="tahun">Tahunan (12 bulan)</option><option value="coba">Coba (' + st.trialDays + ' hari)</option></select>' +
      (note ? '<div style="font-size:12px;color:#fbbf24;margin-bottom:8px">' + H(note) + '</div>' : '') +
      '<button data-a="give" style="' + B + 'background:#7c3aed;width:100%;padding:10px">Aktifkan sewa</button>';
  }
  function viewDemo() {
    var now = Date.now(), list = tenantsList(), h = '<div style="font-size:12px;opacity:.7;margin-bottom:8px">Toko demo tampil label <b>DEMO · sisa N hari</b> di aplikasi klien, lalu terkunci otomatis saat habis. Data tidak dihapus.</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px"><button data-a="dm_new" style="' + B + 'background:#7c3aed">+ Toko baru</button><button data-a="dm_data" style="' + B + 'background:#334155">Isi data contoh</button></div>';
    if (!list.length) return h + '<p style="opacity:.65;text-align:center;padding:16px;font-size:13px">Belum ada toko.</p>';
    list.forEach(function (t) {
      var dm = Number((ctrls[t.id] || {}).demoUntil) || 0, on = dm > 0, left = Math.ceil((dm - now) / 86400000);
      h += '<div style="padding:10px 12px;margin-bottom:8px;border-radius:14px;background:rgba(255,255,255,.05);font-size:12.5px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><div><b>' + H(t.nama) + '</b><div style="opacity:.7;font-size:11.5px">[' + H(t.id) + ']</div></div>' +
        '<div style="text-align:right;font-size:11.5px;color:' + (on ? (dm > now ? '#fbbf24' : '#fb7185') : '#94a3b8') + '">' + (on ? (dm > now ? 'DEMO · sisa ' + left + ' hari (sampai ' + dstr(dm) + ')' : 'DEMO · habis ' + dstr(dm)) : 'Toko asli') + '</div></div>' +
        '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">' + (on ? '<button data-a="dm_ext" data-id="' + H(t.id) + '" style="' + B + 'background:#334155">Tambah hari</button><button data-a="dm_off" data-id="' + H(t.id) + '" style="' + B + 'background:#16a34a">Jadikan toko asli</button>' : '<button data-a="dm_on" data-id="' + H(t.id) + '" style="' + B + 'background:#d97706">Jadikan demo</button>') + '</div></div>';
    });
    return h;
  }
  var filter = 'baru';
  function render() {
    if (!ov || ov.style.display === 'none') return;
    if (!ST()) { ov.innerHTML = '<div style="color:#fff;padding:20px">Katalog Store belum dimuat.</div>'; return; }
    var TB = function (id, t) { return '<button data-tab="' + id + '" style="' + B + (tab === id ? 'background:#7c3aed' : 'background:#334155') + '">' + t + '</button>'; };
    var body = tab === 'aktif' ? viewAktif() : tab === 'beri' ? viewBeri() : tab === 'demo' ? viewDemo() : viewMinta();
    var keep = { t: (ov.querySelector('#ts-t') || {}).value, i: (ov.querySelector('#ts-i') || {}).value, p: (ov.querySelector('#ts-p') || {}).value };
    ov.innerHTML = '<div style="width:100%;max-width:720px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px;font-family:-apple-system,Segoe UI,sans-serif">' +
      '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><div style="font-weight:800;font-size:17px">OneilStore</div><div style="font-size:12px;opacity:.65">' + nBaru() + ' permintaan menunggu</div></div><button data-x style="' + B + 'background:#334155">Tutup</button></div>' +
      '<div style="display:flex;gap:6px;margin:12px 0">' + TB('minta', 'Permintaan') + TB('aktif', 'Sewa aktif') + TB('beri', 'Beri sewa') + TB('demo', 'Demo') + '</div>' + body + '</div>';
    if (tab === 'beri') { [['#ts-t', keep.t], ['#ts-i', keep.i], ['#ts-p', keep.p]].forEach(function (x) { var el = ov.querySelector(x[0]); if (el && x[1]) el.value = x[1]; }); }
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-tstore';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px';
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var t = e.target.closest('[data-tab]'); if (t) { tab = t.getAttribute('data-tab'); note = ''; return render(); }
      var fl = e.target.closest('[data-f]'); if (fl) { filter = fl.getAttribute('data-f'); return render(); }
      var b = e.target.closest('[data-a]'); if (b) act(b.getAttribute('data-a'), b.getAttribute('data-id'));
    });
    document.body.appendChild(ov);
  }
  window.FM_TSTORE = { open: function (t) { ensure(); start(); if (t) tab = t; ov.style.display = 'flex'; render(); }, count: nBaru };
  function init() { start(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 2800); }); else setTimeout(init, 2800);
})();
