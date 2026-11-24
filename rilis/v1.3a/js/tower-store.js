/* tower-store.js — Store (dulu OneilStore) sisi Tower (hanya halaman Tower).
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
  var B = 'padding:7px 13px;border-radius:999px;font-weight:800;font-size:12px;border:1px solid rgba(255,255,255,.2);cursor:pointer;color:#fff;';
  var INP = 'width:100%;box-sizing:border-box;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:12.5px;outline:none';
  var PER = { hari: 'Harian', minggu: 'Mingguan', bulan: 'Bulanan', tahun: 'Tahunan', perm: 'Permanen', gratis: 'Gratis', coba: 'Coba' };
  var catNote = '', demoMode = false, fresh = false;

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

  /* hitung tanggal berakhir: lanjut dari sisa sewa bila masih aktif; permanen tidak pernah habis */
  function grant(tenantId, item, period) {
    var d = DB(); if (!d) { alert('Firestore belum terhubung.'); return Promise.reject(); }
    var ex = ((ctrls[tenantId] || {}).rentals || {})[item];
    var entry = { until: ST().untilFor(ex, period), trial: period === 'coba' && !(ex && !ex.trial && Number(ex.until) > Date.now()), since: (ex && ex.since) || Date.now(), period: (ex && ex.perm) ? 'perm' : period };
    if (period === 'perm' || period === 'gratis' || (ex && ex.perm)) { entry.perm = true; entry.trial = false; }
    if (String(item).indexOf('b:') === 0) entry.keys = ST().keysOf(item);
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

  async function act(a, id, extra) {
    if (a === 'ok') {
      var r = find(id); if (!r) return;
      var ids = (r.items && r.items.length) ? r.items : [r.item], its = ids.map(function (x) { return ST() && ST().item(x); });
      if (its.some(function (x) { return !x; })) return alert('Item tidak dikenal: ' + ids.join(', '));
      var nm = its.map(function (x) { return x.name; }).join(' + ');
      var msg = 'Aktifkan ' + nm + ' (' + (PER[r.period] || r.period) + ') untuk ' + nameOf(r.tenantId) + '?\n\nPastikan pembayaran ' + rp(r.price) + ' sudah diterima.';
      if (r.period === 'coba') msg = 'Aktifkan masa coba ' + nm + ' untuk ' + nameOf(r.tenantId) + '?';
      else if (r.period === 'gratis') {
        msg = 'Aktifkan ' + nm + ' GRATIS (permanen) untuk ' + nameOf(r.tenantId) + '?';
        if (!ST().quote(ids, 'gratis').ok) msg = 'PERINGATAN: item ini sekarang TIDAK berstatus Gratis di katalog.\n\n' + msg;
      } else {
        var q = ST().quote(ids, r.period);
        if (!q.ok) msg = 'PERINGATAN: periode ' + (PER[r.period] || r.period) + ' tidak ada di katalog untuk item ini.\n\n' + msg;
        else if (Number(r.price) !== q.total) msg = 'PERINGATAN: harga di permintaan (' + rp(r.price) + ') BERBEDA dari katalog sekarang (' + rp(q.total) + ').\nPeriksa dulu sebelum mengaktifkan.\n\n' + msg;
      }
      if (!(await fmAsk(msg))) return;
      var nt = (await fmPrompt('Catatan untuk klien (boleh kosong):', 'Terima kasih, fitur sudah aktif.')); if (nt === null) return;
      Promise.all(ids.map(function (x) { return grant(r.tenantId, x, r.period); })).then(function (es) {
        return upd(id, { status: 'AKTIF', note: String(nt).slice(0, 300), processedAt: new Date().toLocaleString('id-ID'), until: es[0].until });
      }).catch(function (e) { if (e) alert('Gagal: ' + (e.message || e)); });
    } else if (a === 'no') {
      var nt2 = (await fmPrompt('Alasan penolakan (terlihat oleh klien):', 'Pembayaran belum diterima.')); if (nt2 === null) return;
      upd(id, { status: 'DITOLAK', note: String(nt2).slice(0, 300), processedAt: new Date().toLocaleString('id-ID') }).catch(function (e) { alert('Gagal: ' + (e && e.message || e)); });
    } else if (a === 'del') {
      if (!(await fmAsk('Hapus permintaan ini?'))) return; var d = DB(); if (d) d.collection('provider_tickets').doc(id).delete().catch(function (e) { alert('Gagal: ' + (e && e.message || e)); });
    } else if (a === 'revoke') {
      var p = String(id).split('|'); if ((await fmAsk('Cabut sewa ' + p[1] + ' dari ' + nameOf(p[0]) + '? Data toko tidak berubah, hanya fiturnya terkunci lagi.'))) revoke(p[0], p[1]);
    } else if (a === 'date') {
      var q = String(id).split('|'), cur = ((ctrls[q[0]] || {}).rentals || {})[q[1]], v = (await fmPrompt('Tanggal berakhir baru (YYYY-MM-DD):', cur ? iso(cur.until) : iso(Date.now()))); if (v === null) return;
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v).trim()); if (!m) return alert('Format harus YYYY-MM-DD.');
      var ms = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59).getTime(); if (!isFinite(ms)) return alert('Tanggal tidak valid.');
      var d2 = DB(); if (!d2) return; var u = {}; u['rentals.' + q[1] + '.until'] = ms;
      d2.collection('tenant_ctrl').doc(q[0]).update(u).catch(function (e) { alert('Gagal: ' + (e && e.message || e)); });
    } else if (a === 'ks_sell' || a === 'ks_free' || a === 'ks_off') { collect(); bulk(a.slice(3) === 'sell' ? 'sell' : a.slice(3) === 'free' ? 'free' : 'off');
    } else if (a === 'ks_clear') { sel = {}; collect(); fresh = true; render();
    } else if (a === 'ks_grp') { collect(); ST().features().forEach(function (f) { if (f.grp === id) sel[f.key] = true; }); fresh = true; render();
    } else if (/^k[bs]_(new|bundle|edit|cancel|rm|add|save|del)$/.test(a)) { collect(); bundleAct(a, id);
    } else if (a === 'kt_save') { saveCat();
    } else if (a === 'kt_reset') { resetCat();
    } else if (a === 'dm_on' || a === 'dm_ext') {
      var dd = DB(); if (!dd) return alert('Firestore belum terhubung.');
      var cur2 = Number((ctrls[id] || {}).demoUntil) || 0, base = (a === 'dm_ext' && cur2 > Date.now()) ? cur2 : Date.now();
      var dy = (await fmPrompt((a === 'dm_ext' ? 'Tambah berapa hari?' : 'Masa demo berapa hari?') + ' (' + nameOf(id) + ')', '7')); if (dy === null) return;
      dy = Math.round(Number(dy)); if (!(dy >= 1 && dy <= 90)) return alert('Isi angka 1 sampai 90.');
      dd.collection('tenant_ctrl').doc(id).set({ demoUntil: base + dy * 86400000, demo: true }, { merge: true }).catch(function (e) { alert('Gagal: ' + (e && e.message || e)); });
    } else if (a === 'dm_off') {
      if (!(await fmAsk('Jadikan ' + nameOf(id) + ' toko asli? Label dan batas demo dicabut. Data toko TIDAK dihapus (bersihkan data contoh lewat Kesehatan Sistem bila perlu).'))) return;
      var d3 = DB(); if (!d3) return; var u3 = { demo: firebase.firestore.FieldValue.delete(), demoUntil: firebase.firestore.FieldValue.delete() };
      d3.collection('tenant_ctrl').doc(id).update(u3).catch(function (e) { alert('Gagal: ' + (e && e.message || e)); });
    } else if (a === 'dm_new') { ov.style.display = 'none'; try { openModal('add_tenant'); } catch (e) { alert('Buka menu Klien Baru dari beranda Tower.'); }
    } else if (a === 'dm_data') { ov.style.display = 'none'; try { FM_DEMO.open(); } catch (e) { alert('Data Demo belum dimuat.'); }
    } else if (a === 'give') {
      var tId = (ov.querySelector('#ts-t') || {}).value, item = (ov.querySelector('#ts-i') || {}).value, per = (ov.querySelector('#ts-p') || {}).value;
      if (!tId || !item) { note = 'Pilih toko dan item.'; return render(); }
      var itm = ST().item(item); if (!(await fmAsk('Beri sewa ' + (itm ? itm.name : item) + ' (' + (PER[per] || per) + ') ke ' + nameOf(tId) + '?'))) return;
      grant(tId, item, per).then(function (e) { note = e.perm ? 'Sewa permanen aktif.' : 'Sewa aktif sampai ' + dstr(e.until) + '.'; render(); }).catch(function (e) { if (e) { note = 'Gagal: ' + (e.message || e); render(); } });
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
        var alive = Number(e.until) > now, days = Math.ceil((Number(e.until) - now) / 86400000), perm = !!e.perm;
        h += '<div style="padding:10px 12px;margin-bottom:8px;border-radius:14px;background:rgba(255,255,255,.05);font-size:12.5px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><div><b>' + H(it ? it.name : id) + '</b>' + (e.trial ? ' <span style="color:#fbbf24;font-size:10px">COBA</span>' : '') +
          '<div style="opacity:.7;font-size:11.5px">' + H(nameOf(tid)) + ' [' + H(tid) + ']</div></div><div style="text-align:right;font-size:11.5px;color:' + (alive ? '#4ade80' : '#fb7185') + '">' + (perm ? 'Permanen' : alive ? 'Sampai ' + dstr(Number(e.until)) + ' (' + days + ' hari)' : 'Habis ' + dstr(Number(e.until))) + '</div></div>' +
          '<div style="display:flex;gap:6px;margin-top:8px">' + (perm ? '' : '<button data-a="date" data-id="' + H(tid + '|' + id) + '" style="' + B + 'background:#334155">Atur tanggal</button>') + '<button data-a="revoke" data-id="' + H(tid + '|' + id) + '" style="' + B + 'background:#be123c">Cabut</button></div></div>';
      });
    });
    if (!n) h = '<p style="opacity:.65;text-align:center;padding:20px;font-size:13px">Belum ada sewa.</p>';
    return h;
  }
  function viewBeri() {
    var st = ST(), bl = st.bundles(), gs = {}, opts = '';
    if (bl.length) opts += '<optgroup label="Bundel">' + bl.map(function (b) { return '<option value="' + H(b.id) + '">' + H(b.name) + '</option>'; }).join('') + '</optgroup>';
    st.features().forEach(function (f) { (gs[f.grp] = gs[f.grp] || []).push(f); });
    Object.keys(gs).forEach(function (g) { opts += '<optgroup label="' + H(g) + '">' + gs[g].map(function (f) { return '<option value="' + H(f.id) + '">' + H(f.name) + '</option>'; }).join('') + '</optgroup>'; });
    return '<div style="font-size:12px;opacity:.7;margin-bottom:8px">Untuk penjualan langsung tanpa permintaan dari klien.</div>' +
      '<label style="font-size:11.5px;font-weight:700;opacity:.8">Toko</label><select id="ts-t" style="' + INP + ';margin:4px 0 10px">' + tenantsList().map(function (t) { return '<option value="' + H(t.id) + '">' + H(t.nama) + ' [' + H(t.id) + ']</option>'; }).join('') + '</select>' +
      '<label style="font-size:11.5px;font-weight:700;opacity:.8">Fitur atau paket</label><select id="ts-i" style="' + INP + ';margin:4px 0 10px">' + opts + '</select>' +
      '<label style="font-size:11.5px;font-weight:700;opacity:.8">Lama</label><select id="ts-p" style="' + INP + ';margin:4px 0 10px"><option value="hari">Harian (1 hari)</option><option value="minggu">Mingguan (7 hari)</option><option value="bulan" selected>Bulanan (1 bulan)</option><option value="tahun">Tahunan (12 bulan)</option><option value="perm">Permanen (tanpa batas)</option><option value="coba">Coba (' + st.trialDays + ' hari)</option></select>' +
      (note ? '<div style="font-size:12px;color:#fbbf24;margin-bottom:8px">' + H(note) + '</div>' : '') +
      '<button data-a="give" style="' + B + 'background:#7c3aed;width:100%;padding:10px">Aktifkan sewa</button>';
  }

  /* ---- Katalog (v2): tiap fitur satu baris, bisa dicentang lalu dibundel. Disimpan di app_meta/store_catalog ---- */
  var KINP = 'width:84px;box-sizing:border-box;padding:6px 7px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:12px;outline:none;text-align:right';
  var SEL = 'padding:6px 8px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:#15151b;color:#f5f5f7;font-size:12px;outline:none';
  var GREY = ';background:rgba(255,255,255,.08)', VIO = ';background:#a855f7;border-color:#a855f7', GREEN = ';background:#22c55e;color:#04210f;border-color:#22c55e', RED = ';background:#be123c;border-color:#be123c';
  var dcat = null, sel = {}, bform = null, kview = 'fitur';
  function emptyCat() { return { v: 2, feats: {}, bundles: [], disc: { min: 3, pct: 0 }, trial: true }; }
  function loadDcat() {
    var c = ST().cat(), o = emptyCat();
    if (c && c.v === 2) { try { o = JSON.parse(JSON.stringify(c)); } catch (e) {} o.feats = o.feats || {}; o.bundles = o.bundles || []; o.disc = o.disc || { min: 3, pct: 0 }; if (o.trial !== false) o.trial = true; }
    return o;
  }
  function stat(e) { return (!e || e.sell === false) ? 'off' : (e.free === true ? 'free' : 'sell'); }
  function setStat(e, s) { e = e || { p: {} }; e.sell = s !== 'off'; e.free = s === 'free'; e.p = e.p || {}; return e; }
  function readPrices(root, attr) {
    var p = {}; ST().periods.forEach(function (x) { var el = root.querySelector('[' + attr + '="' + x[0] + '"]'); if (el) { var v = Number(String(el.value).replace(/[^0-9]/g, '')); p[x[0]] = v > 0 ? v : null; } });
    return p;
  }
  /* salin isian layar ke dcat sebelum layar digambar ulang */
  function collect() {
    if (!ov || !dcat) return;
    [].forEach.call(ov.querySelectorAll('[data-kf]'), function (r) {
      var k = r.getAttribute('data-kf'), e = dcat.feats[k] = dcat.feats[k] || { p: {} }, s = r.querySelector('[data-kstat]').value;
      setStat(e, s); if (r.querySelector('[data-kp]')) e.p = readPrices(r, 'data-kp');
    });
    var dm = ov.querySelector('#kt-dmin'), dp = ov.querySelector('#kt-dpct'), tr = ov.querySelector('#kt-trial');
    if (dm && dp) { dcat.disc.min = Math.max(2, parseInt(dm.value, 10) || 3); dcat.disc.pct = Math.min(50, Math.max(0, Number(dp.value) || 0)); }
    if (tr) dcat.trial = !!tr.checked;
    var bn = ov.querySelector('#kb-name');
    if (bn && bform) {
      bform.name = bn.value; bform.desc = (ov.querySelector('#kb-desc') || {}).value || ''; setStat(bform, (ov.querySelector('#kb-stat') || {}).value || 'off');
      if (ov.querySelector('[data-kbp]')) bform.p = readPrices(ov, 'data-kbp');
    }
  }
  function nSel() { return Object.keys(sel).filter(function (k) { return sel[k]; }); }
  function cell(k, v, ph, attr) {
    return '<label style="display:flex;flex-direction:column;gap:2px;font-size:10.5px;opacity:.9"><span style="opacity:.7">' + k[1] + '</span><input ' + attr + '="' + k[0] + '" inputmode="numeric" value="' + (v ? v : '') + '" placeholder="' + (ph || '-') + '" style="' + KINP + '"></label>';
  }
  function priceGrid(e, attr) { return '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 2px 28px">' + ST().periods.map(function (x) { return cell(x, e && e.p ? e.p[x[0]] : null, '-', attr); }).join('') + '</div>'; }
  function statSel(v, attr) { return '<select ' + attr + ' style="' + SEL + '"><option value="off"' + (v === 'off' ? ' selected' : '') + '>Tidak dijual</option><option value="sell"' + (v === 'sell' ? ' selected' : '') + '>Dijual</option><option value="free"' + (v === 'free' ? ' selected' : '') + '>Gratis</option></select>'; }
  function viewFitur() {
    var st = ST(), groups = [], by = {};
    st.features().forEach(function (f) { if (!by[f.grp]) { by[f.grp] = []; groups.push(f.grp); } by[f.grp].push(f); });
    var h = '<div style="font-size:12px;opacity:.7;margin-bottom:6px;line-height:1.5">Semua fitur yang bisa dijual tampil satu per satu (fitur inti yang terkunci tidak ada di sini). Atur status tiap fitur, atau centang beberapa lalu <b>Buat bundel</b>. Fitur <b>Gratis</b> bisa diambil klien tanpa bayar.</div>';
    groups.forEach(function (g) {
      h += '<div style="display:flex;justify-content:space-between;align-items:center;margin:14px 0 2px"><div style="font-weight:900;font-size:12.5px;color:#c084fc">' + H(g) + '</div><button data-a="ks_grp" data-id="' + H(g) + '" style="' + B + GREY + ';padding:3px 10px;font-size:11px">Pilih semua</button></div>';
      by[g].forEach(function (f) {
        var e = dcat.feats[f.key], s = stat(e);
        h += '<div data-kf="' + H(f.key) + '" style="padding:9px 2px;border-top:1px solid rgba(255,255,255,.08);' + (s === 'off' ? 'opacity:.75' : '') + '"><div style="display:flex;gap:10px;align-items:center">' +
          '<input type="checkbox" data-ksel="' + H(f.key) + '"' + (sel[f.key] ? ' checked' : '') + '><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:13px">' + H(f.name) + '</div>' + (f.d ? '<div style="font-size:11.5px;opacity:.65;line-height:1.4">' + H(f.d) + '</div>' : '') + '</div>' + statSel(s, 'data-kstat') + '</div>' +
          (s === 'sell' ? priceGrid(e, 'data-kp') : '') + '</div>';
      });
    });
    var d = dcat.disc;
    h += '<div style="margin-top:16px;padding:12px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b>Diskon beli kombinasi</b><span>mulai</span><input id="kt-dmin" inputmode="numeric" value="' + d.min + '" style="' + KINP + ';width:52px"><span>fitur, potongan</span><input id="kt-dpct" inputmode="numeric" value="' + d.pct + '" style="' + KINP + ';width:52px"><span>% (0 = tanpa diskon)</span></div>' +
      '<label style="margin-top:10px;display:flex;gap:8px;align-items:center;font-size:12px"><input type="checkbox" id="kt-trial"' + (dcat.trial !== false ? ' checked' : '') + '><span>Izinkan coba gratis ' + ST().trialDays + ' hari (satu kali per fitur)</span></label>';
    return h;
  }
  function bundleSum(keys) {
    var st = ST(), sum = 0, ok = keys.length > 0;
    keys.forEach(function (k) { var e = dcat.feats[k], v = e && e.p && Number(e.p.bulan); if (stat(e) === 'sell' && v > 0) sum += v; else ok = false; });
    return ok ? sum : 0;
  }
  function viewBundel() {
    var st = ST(), feats = st.features(), nm = {}; feats.forEach(function (f) { nm[f.key] = f.name; });
    if (bform) {
      var s = stat(bform), sum = bundleSum(bform.keys), pb = bform.p && Number(bform.p.bulan);
      var chips = bform.keys.map(function (k) { return '<span style="display:inline-flex;gap:6px;align-items:center;padding:4px 6px 4px 10px;border-radius:999px;background:rgba(168,85,247,.2);font-size:12px;margin:0 6px 6px 0">' + H(nm[k] || k) + '<button data-a="kb_rm" data-id="' + H(k) + '" style="border:0;background:rgba(255,255,255,.15);color:#fff;border-radius:50%;width:18px;height:18px;cursor:pointer;font-size:11px;line-height:1">×</button></span>'; }).join('');
      var rest = feats.filter(function (f) { return bform.keys.indexOf(f.key) < 0; });
      var h = '<div style="font-weight:900;font-size:15px;margin:6px 0 10px">' + (bform.isNew ? 'Bundel baru' : 'Ubah bundel') + '</div>' +
        '<label style="font-size:11.5px;font-weight:700;opacity:.8">Nama bundel</label><input id="kb-name" value="' + H(bform.name || '') + '" maxlength="40" placeholder="Contoh: Paket Laporan" style="' + INP + ';margin:4px 0 10px">' +
        '<label style="font-size:11.5px;font-weight:700;opacity:.8">Keterangan singkat (boleh kosong)</label><input id="kb-desc" value="' + H(bform.desc || '') + '" maxlength="100" style="' + INP + ';margin:4px 0 10px">' +
        '<div style="font-size:11.5px;font-weight:700;opacity:.8;margin-bottom:6px">Isi bundel (' + bform.keys.length + ' fitur)</div><div>' + (chips || '<span style="opacity:.6;font-size:12px">Belum ada fitur.</span>') + '</div>' +
        '<div style="display:flex;gap:6px;margin:4px 0 12px"><select id="kb-add" style="' + SEL + ';flex:1;min-width:0"><option value="">Tambah fitur…</option>' + rest.map(function (f) { return '<option value="' + H(f.key) + '">' + H(f.grp + ' · ' + f.name) + '</option>'; }).join('') + '</select><button data-a="kb_add" style="' + B + VIO + '">Tambah</button></div>' +
        '<div style="display:flex;gap:8px;align-items:center"><label style="font-size:11.5px;font-weight:700;opacity:.8">Status</label>' + statSel(s, 'id="kb-stat"') + '</div>' + (s === 'sell' ? priceGrid(bform, 'data-kbp') : '') +
        (s === 'sell' && sum ? '<div style="font-size:11.5px;opacity:.75;margin:6px 0 0 0">Jumlah harga bulanan satuan: ' + rp(sum) + (pb ? (sum > pb ? ' · hemat ' + rp(sum - pb) + ' per bulan' : ' · bundel tidak lebih murah dari satuan') : '') + '</div>' : (s === 'sell' ? '<div style="font-size:11.5px;opacity:.6;margin-top:6px">Pembanding hemat tampil bila semua isi bundel berstatus Dijual dengan harga bulanan.</div>' : '')) +
        (catNote ? '<div style="margin-top:10px;font-size:12px;color:#fbbf24">' + H(catNote) + '</div>' : '') +
        '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button data-a="kb_save" style="' + B + VIO + ';flex:1;padding:10px">Simpan bundel</button><button data-a="kb_cancel" style="' + B + GREY + ';padding:10px">Batal</button>' + (bform.isNew ? '' : '<button data-a="kb_del" data-id="' + H(bform.id) + '" style="' + B + RED + ';padding:10px">Hapus</button>') + '</div>';
      return h;
    }
    var h2 = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:4px 0 6px"><div style="font-size:12px;opacity:.7;line-height:1.5;flex:1">Bundel = beberapa fitur dijual sekaligus. Cara cepat: centang fitur di tab Fitur lalu Buat bundel.</div><button data-a="kb_new" style="' + B + VIO + '">+ Bundel baru</button></div>';
    if (!dcat.bundles.length) return h2 + '<p style="opacity:.6;text-align:center;padding:20px;font-size:13px">Belum ada bundel.</p>';
    dcat.bundles.forEach(function (b) {
      var s = stat(b), col = s === 'sell' ? '#c084fc' : s === 'free' ? '#4ade80' : '#94a3b8';
      h2 += '<div style="padding:11px 2px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:10px;align-items:center"><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:13px">' + H(b.name) + ' <span style="font-size:11px;color:' + col + '">' + (s === 'sell' ? 'Dijual' : s === 'free' ? 'Gratis' : 'Tidak dijual') + '</span></div><div style="font-size:11.5px;opacity:.65;line-height:1.45">' + b.keys.map(function (k) { return H(nm[k] || k); }).join(', ') + '</div></div><button data-a="kb_edit" data-id="' + H(b.id) + '" style="' + B + GREY + '">Ubah</button></div>';
    });
    return h2;
  }
  function viewKatalog() {
    if (!dcat) dcat = loadDcat();
    var sub = function (id, t) { return '<button data-ksub="' + id + '" style="' + B + (kview === id ? VIO : GREY) + '">' + t + '</button>'; };
    var h = '<div style="display:flex;gap:6px;margin:0 0 8px">' + sub('fitur', 'Fitur satuan') + sub('bundel', 'Bundel (' + dcat.bundles.length + ')') + '</div>';
    h += kview === 'bundel' ? viewBundel() : viewFitur();
    if (kview === 'fitur' || !bform) {
      var n = nSel().length;
      if (kview === 'fitur' && n) h += '<div style="position:sticky;bottom:-18px;margin:14px -18px -18px;padding:10px 18px;background:#0b0b0f;border-top:1px solid rgba(255,255,255,.12);display:flex;gap:6px;flex-wrap:wrap;align-items:center"><b style="font-size:12px">' + n + ' dipilih</b><button data-a="ks_bundle" style="' + B + VIO + '">Buat bundel</button><button data-a="ks_sell" style="' + B + GREY + '">Dijual</button><button data-a="ks_free" style="' + B + GREY + '">Gratis</button><button data-a="ks_off" style="' + B + GREY + '">Tidak dijual</button><button data-a="ks_clear" style="' + B + GREY + '">Batal</button></div>';
      else h += (catNote ? '<div style="margin-top:10px;font-size:12px;color:#fbbf24">' + H(catNote) + '</div>' : '') +
        '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button data-a="kt_save" style="' + B + VIO + ';flex:1;padding:10px">Simpan katalog</button><button data-a="kt_reset" style="' + B + GREY + ';padding:10px">Kosongkan katalog</button></div>' +
          '<div style="font-size:11px;opacity:.6;margin-top:8px;line-height:1.5">Klien membaca katalog saat membuka Store. Perubahan baru berlaku setelah Simpan katalog. Harga diperiksa lagi saat Anda mengaktifkan permintaan.</div>';
    }
    return h;
  }
  function bulk(s) { fresh = true; nSel().forEach(function (k) { dcat.feats[k] = setStat(dcat.feats[k], s); }); sel = {}; catNote = ''; render(); }
  async function bundleAct(a, id) {
    var st = ST(); fresh = true;
    if (a === 'kb_new') { bform = { id: 'b:' + Date.now().toString(36), isNew: true, name: '', desc: '', keys: [], sell: false, free: false, p: {} }; kview = 'bundel'; }
    else if (a === 'ks_bundle') { bform = { id: 'b:' + Date.now().toString(36), isNew: true, name: '', desc: '', keys: st.features().map(function (f) { return f.key; }).filter(function (k) { return sel[k]; }), sell: false, free: false, p: {} }; sel = {}; kview = 'bundel'; }
    else if (a === 'kb_edit') { var b = dcat.bundles.filter(function (x) { return x.id === id; })[0]; if (!b) return; bform = JSON.parse(JSON.stringify(b)); bform.isNew = false; bform.p = bform.p || {}; }
    else if (a === 'kb_cancel') { bform = null; }
    else if (a === 'kb_rm') { bform.keys = bform.keys.filter(function (k) { return k !== id; }); }
    else if (a === 'kb_add') { var v = (ov.querySelector('#kb-add') || {}).value; if (v && bform.keys.indexOf(v) < 0) bform.keys.push(v); }
    else if (a === 'kb_save') {
      var nmv = String(bform.name || '').trim();
      if (!nmv) { catNote = 'Isi nama bundel.'; return render(); }
      if (bform.keys.length < 2) { catNote = 'Bundel perlu minimal 2 fitur.'; return render(); }
      if (stat(bform) === 'sell' && !st.periods.some(function (x) { return bform.p[x[0]]; })) { catNote = 'Status Dijual perlu minimal satu harga.'; return render(); }
      if (dcat.bundles.some(function (x) { return x.id !== bform.id && String(x.name).trim().toLowerCase() === nmv.toLowerCase(); })) { catNote = 'Nama bundel sudah dipakai.'; return render(); }
      var rec = { id: bform.id, name: nmv, desc: String(bform.desc || '').trim(), keys: bform.keys.slice(), sell: bform.sell !== false && stat(bform) !== 'off', free: bform.free === true, p: bform.p || {} };
      var i = -1; dcat.bundles.forEach(function (x, j) { if (x.id === rec.id) i = j; }); if (i >= 0) dcat.bundles[i] = rec; else dcat.bundles.push(rec);
      bform = null; catNote = 'Bundel disimpan di layar ini. Tekan Simpan katalog di tab Fitur satuan agar klien melihatnya.';
    }
    else if (a === 'kb_del') {
      var use = Object.keys(ctrls).filter(function (t) { var e = (ctrls[t].rentals || {})[id]; return e && Number(e.until) > Date.now(); });
      if (use.length) { catNote = 'Bundel ini masih disewa aktif oleh: ' + use.map(nameOf).join(', ') + '. Ubah status menjadi Tidak dijual saja, atau tunggu sewa habis.'; return render(); }
      if (!(await fmAsk('Hapus bundel ini dari katalog?'))) return;
      dcat.bundles = dcat.bundles.filter(function (x) { return x.id !== id; }); bform = null; catNote = 'Bundel dihapus di layar ini. Tekan Simpan katalog agar berlaku.';
    }
    render();
  }
  async function saveCat() {
    var d = DB(); if (!d) { catNote = 'Firestore belum terhubung.'; return render(); }
    collect();
    var st = ST(), bad = Object.keys(dcat.feats).filter(function (k) { var e = dcat.feats[k]; return stat(e) === 'sell' && !st.periods.some(function (x) { return e.p && e.p[x[0]]; }); })
      .concat(dcat.bundles.filter(function (b) { return stat(b) === 'sell' && !st.periods.some(function (x) { return b.p && b.p[x[0]]; }); }).map(function (b) { return b.id; }));
    if (bad.length && !(await fmAsk(bad.length + ' item berstatus Dijual tapi belum punya harga, jadi tidak akan tampil di klien. Tetap simpan?'))) return;
    var out = JSON.parse(JSON.stringify(dcat)); out.v = 2;
    d.collection('app_meta').doc('store_catalog').set({ json: JSON.stringify(out), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(function () {
      st.setCat(out); catNote = 'Katalog tersimpan. Klien memakainya saat membuka Store.'; render();
    }).catch(function (e) { catNote = 'Gagal menyimpan: ' + (e && e.message || e); render(); });
  }
  async function resetCat() {
    if (!(await fmAsk('Kosongkan katalog? Semua fitur dan bundel menjadi Tidak dijual dan Store klien tampil kosong. Sewa yang sudah berjalan tetap aktif sampai tanggalnya.'))) return;
    var d = DB(); if (!d) return; var empty = emptyCat();
    d.collection('app_meta').doc('store_catalog').set({ json: JSON.stringify(empty), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(function () { ST().setCat(empty); dcat = emptyCat(); bform = null; sel = {}; fresh = true; catNote = 'Katalog dikosongkan.'; render(); }).catch(function (e) { catNote = 'Gagal: ' + (e && e.message || e); render(); });
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
    var TB = function (id, t) { return '<button data-tab="' + id + '" style="' + B + (tab === id ? VIO : GREY) + '">' + t + '</button>'; };
    if (tab === 'katalog' && !fresh) collect();
    fresh = false;
    var keepTop = ov.firstChild && ov.firstChild.scrollTop || 0;
    var body = demoMode ? viewDemo() : tab === 'aktif' ? viewAktif() : tab === 'beri' ? viewBeri() : tab === 'katalog' ? viewKatalog() : viewMinta();
    var keep = { t: (ov.querySelector('#ts-t') || {}).value, i: (ov.querySelector('#ts-i') || {}).value, p: (ov.querySelector('#ts-p') || {}).value };
    ov.innerHTML = '<div style="width:100%;max-width:860px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px;font-family:-apple-system,Segoe UI,sans-serif">' +
      '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><div style="font-weight:800;font-size:17px">' + (demoMode ? 'Demo Toko' : 'Store') + '</div><div style="font-size:12px;opacity:.65">' + (demoMode ? 'Atur toko uji dengan batas waktu demo' : nBaru() + ' permintaan menunggu') + '</div></div><button data-x style="' + B + 'background:#334155">Tutup</button></div>' +
      (demoMode ? '' : '<div style="display:flex;gap:6px;margin:12px 0">' + TB('minta', 'Permintaan') + TB('aktif', 'Sewa aktif') + TB('beri', 'Beri sewa') + TB('katalog', 'Katalog') + '</div>') + '<div style="margin-top:' + (demoMode ? '12' : '0') + 'px">' + body + '</div></div>';
    if (keepTop && ov.firstChild) ov.firstChild.scrollTop = keepTop;
    if (tab === 'beri') { [['#ts-t', keep.t], ['#ts-i', keep.i], ['#ts-p', keep.p]].forEach(function (x) { var el = ov.querySelector(x[0]); if (el && x[1]) el.value = x[1]; }); }
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-tstore';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px';
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var t = e.target.closest('[data-tab]'); if (t) { if (tab === 'katalog') collect(); tab = t.getAttribute('data-tab'); note = ''; catNote = ''; return render(); }
      var ks = e.target.closest('[data-ksub]'); if (ks) { collect(); kview = ks.getAttribute('data-ksub'); catNote = ''; return render(); }
      var fl = e.target.closest('[data-f]'); if (fl) { filter = fl.getAttribute('data-f'); return render(); }
      var b = e.target.closest('[data-a]'); if (b) act(b.getAttribute('data-a'), b.getAttribute('data-id'));
    });
    ov.addEventListener('change', function (e) {
      var t = e.target; if (!t || !t.hasAttribute) return;
      if (t.hasAttribute('data-ksel')) { var k = t.getAttribute('data-ksel'); if (t.checked) sel[k] = true; else delete sel[k]; collect(); return render(); }
      if (t.hasAttribute('data-kstat') || t.id === 'kb-stat') { collect(); render(); }
    });
    if (!document.getElementById('fm-tstore-css')) { var cs = document.createElement('style'); cs.id = 'fm-tstore-css'; cs.textContent = '#fm-tstore input[type=checkbox]{-webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:5px;border:2px solid rgba(255,255,255,.5);background:transparent center/12px no-repeat;cursor:pointer;flex:0 0 auto;margin:0}#fm-tstore input[type=checkbox]:checked{background-color:#a855f7;border-color:#a855f7;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 12 12%27%3E%3Cpath d=%27M2 6.5l2.5 2.5L10 3.5%27 fill=%27none%27 stroke=%27%23fff%27 stroke-width=%271.8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E")}'; document.head.appendChild(cs); }
    document.body.appendChild(ov);
  }
  window.FM_TSTORE = { openDemo: function () { ensure(); start(); demoMode = true; ov.style.display = 'flex'; render(); }, open: function (t) { demoMode = false; ensure(); start(); dcat = null; bform = null; sel = {}; kview = 'fitur'; catNote = ''; try { ST().fetchCat(function () { if (!bform && !nSel().length && ov.style.display !== 'none') { dcat = null; if (tab === 'katalog') render(); } }); } catch (e) {} if (t) tab = t; ov.style.display = 'flex'; render(); }, count: nBaru };
  function init() { start(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 2800); }); else setTimeout(init, 2800);
})();
