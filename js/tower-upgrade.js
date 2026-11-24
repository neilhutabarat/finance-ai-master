/* tower-upgrade.js — Permintaan Upgrade sisi Tower (hanya halaman Tower), pasangan dari js/upgrade.js di sisi klien.
   - Tiket provider_tickets bertipe 'upgrade': kind 'beli' (pengajuan berlangganan) dan kind 'coba' (coba gratis 24 jam).
   - Klien langsung aktif 24 jam sejak menekan tombol (until = pressedAt + 24 jam). Tower:
       Konfirmasi -> status AKTIF, activeUntil = pressedAt + lama langganan (1 / 12 bulan)
       Matikan    -> status MATI (kapan saja, termasuk sebelum 24 jam habis)
       Tolak      -> status DITOLAK + alasan
     Tanpa konfirmasi, paket kembali sendiri setelah 24 jam (dihitung di sisi klien).
   - Pengaturan: nomor WhatsApp, gambar QRIS, dan harga disimpan di app_meta/upgrade_cfg { json }.
   - Data toko tidak pernah disentuh. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;
  var DAY = 86400000;
  function H(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function DB() { return (typeof db !== 'undefined' && db) ? db : null; }
  function rp(n) { return 'Rp' + Number(n || 0).toLocaleString('id-ID'); }
  function dstr(ms) { try { return new Date(ms).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
  function nameOf(id) { try { var T = (typeof TENANTS_CONFIG !== 'undefined') ? TENANTS_CONFIG : {}; var k = Object.keys(T).filter(function (x) { return T[x] && String(T[x].id).toLowerCase() === String(id).toLowerCase(); })[0]; return k ? (T[k].nama || id) : id; } catch (e) { return id; } }
  var NAME = { plus: 'Plus', pro: 'Pro' };
  var DEF = { plus: { bulan: 149000, tahun: 1490000 }, pro: { bulan: 249000, tahun: 2490000 } };
  var reqs = [], ov = null, started = false, tab = 'minta', first = true, seen = {}, cfg = {}, cfgLoaded = false, draft = null, note = '', hid = null;
  var B = 'padding:7px 13px;border-radius:999px;font-weight:800;font-size:12px;border:1px solid rgba(255,255,255,.2);cursor:pointer;color:#fff;';
  var VIO = 'background:#7c3aed;border-color:#7c3aed;', GREY = 'background:#334155;', GRN = 'background:#16a34a;border-color:#16a34a;', RED = 'background:#be123c;border-color:#be123c;';
  var INP = 'width:100%;box-sizing:border-box;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:12.5px;outline:none';

  function badgeEl() {
    if (!hid) { hid = document.getElementById('stat-upg-pending'); if (!hid) { hid = document.createElement('span'); hid.id = 'stat-upg-pending'; hid.style.display = 'none'; document.body.appendChild(hid); } }
    return hid;
  }
  function untilOf(t) {
    if (!t || t.status === 'MATI' || t.status === 'DITOLAK') return 0;
    if (t.kind === 'beli' && t.status === 'AKTIF') return Number(t.activeUntil) || 0;
    return Number(t.until) || 0;
  }
  function waiting() { return reqs.filter(function (t) { return t.kind === 'beli' && t.status === 'BARU'; }); }
  function start() {
    var d = DB(); if (started || !d) return; started = true;
    d.collection('provider_tickets').where('type', '==', 'upgrade').onSnapshot(function (s) {
      reqs = []; s.forEach(function (x) { var v = x.data(); v.docId = x.id; reqs.push(v); });
      reqs.sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
      badgeEl().textContent = waiting().length;
      var fresh = reqs.filter(function (t) { return t.kind === 'beli' && t.status === 'BARU' && !seen[t.docId]; });
      reqs.forEach(function (t) { seen[t.docId] = 1; });
      if (!first && fresh.length) {
        try { var C = window.FM_COCKPIT; if (C && C.atc) C.atc.say([nameOf(fresh[0].tenantId) + ' mengajukan upgrade ke paket ' + NAME[fresh[0].tier] + '. Mohon periksa permintaan upgrade. Menara kontrol, keluar.'], { lead: 300 }); } catch (e) {}
      }
      first = false; render();
    }, function (e) { console.error('Permintaan Upgrade', e); });
  }
  function loadCfg() {
    var d = DB(); if (!d || cfgLoaded) return; cfgLoaded = true;
    d.collection('app_meta').doc('upgrade_cfg').get().then(function (s) { try { if (s.exists && s.data().json) cfg = JSON.parse(s.data().json) || {}; } catch (e) {} draft = null; render(); }).catch(function () { cfgLoaded = false; });
  }
  function upd(id, data) { var d = DB(); if (!d) return Promise.reject(); return d.collection('provider_tickets').doc(id).update(data); }
  function find(id) { return reqs.filter(function (r) { return r.docId === id; })[0]; }
  function addMonths(ms, n) { var d = new Date(ms); d.setMonth(d.getMonth() + n); return d.getTime(); }
  function fail(e) { if (e) alert('Gagal: ' + (e.message || e)); }

  async function act(a, id) {
    var r = find(id);
    if (a === 'ok') {
      if (!r) return;
      var until = addMonths(Number(r.pressedAt) || r.timestamp || Date.now(), Number(r.months) || 1);
      var msg = 'Konfirmasi ' + nameOf(r.tenantId) + ' paket ' + NAME[r.tier] + ' (' + (r.period === 'tahun' ? '1 tahun' : '1 bulan') + ')?\n\nPastikan pembayaran ' + rp(r.price) + ' dan bukti transfer sudah diterima.\nPaket aktif sampai ' + dstr(until) + ' (dihitung sejak klien menekan tombol).';
      if (until <= Date.now()) msg = 'PERINGATAN: masa langganan ini sudah lewat kalau dihitung sejak klien menekan tombol.\n\n' + msg;
      if (!(await fmAsk(msg, { ok: 'Konfirmasi', judul: 'Konfirmasi paket' }))) return;
      upd(id, { status: 'AKTIF', activeUntil: until, confirmedAt: Date.now(), note: '' }).catch(fail);
    } else if (a === 'no') {
      var nt = await fmPrompt('Alasan penolakan (terlihat oleh klien):', 'Pembayaran belum diterima.', { judul: 'Tolak pengajuan' }); if (nt === null) return;
      upd(id, { status: 'DITOLAK', note: String(nt).slice(0, 300), processedAt: Date.now() }).catch(fail);
    } else if (a === 'off') {
      if (!r) return;
      if (!(await fmAsk('Matikan paket ' + NAME[r.tier] + ' milik ' + nameOf(r.tenantId) + ' sekarang? Fitur tambahan terkunci lagi. Data toko tidak berubah.', { ok: 'Matikan', bahaya: true, judul: 'Matikan paket' }))) return;
      upd(id, { status: 'MATI', offAt: Date.now() }).catch(fail);
    } else if (a === 'del') {
      if (!r) return;
      var isTrial = r.kind === 'coba';
      if (!(await fmAsk(isTrial ? 'Hapus catatan coba ini? Toko ini bisa mencoba paket ' + NAME[r.tier] + ' lagi.' : 'Hapus catatan pengajuan ini?', { ok: 'Hapus', bahaya: true }))) return;
      var d = DB(); if (d) d.collection('provider_tickets').doc(id).delete().catch(fail);
    } else if (a === 'again') {
      if (!r) return;
      if (!(await fmAsk('Beri ' + nameOf(r.tenantId) + ' kesempatan coba ' + NAME[r.tier] + ' 24 jam sekali lagi? Jika paket coba masih berjalan, langsung berhenti.', { ok: 'Beri kesempatan', judul: 'Coba ulang' }))) return;
      var d4 = DB(); if (d4) d4.collection('provider_tickets').doc(id).delete().catch(fail);
    } else if (a === 'savecfg') { saveCfg();
    } else if (a === 'qrdel') { collect(); draft.qris = ''; render();
    }
  }

  function status(r) {
    var now = Date.now(), u = untilOf(r);
    if (r.status === 'DITOLAK') return ['Ditolak', '#fb7185'];
    if (r.status === 'MATI') return ['Dimatikan', '#94a3b8'];
    if (r.kind === 'coba') return u > now ? ['Coba berjalan sampai ' + dstr(u), '#fbbf24'] : ['Coba selesai', '#94a3b8'];
    if (r.status === 'AKTIF') return u > now ? ['Aktif sampai ' + dstr(u), '#4ade80'] : ['Langganan habis ' + dstr(u), '#94a3b8'];
    return u > now ? ['Aktif sementara sampai ' + dstr(u) + ', menunggu konfirmasi', '#fbbf24'] : ['Belum dikonfirmasi, paket sudah kembali otomatis', '#fb923c'];
  }
  function card(r) {
    var st = status(r), live = untilOf(r) > Date.now(), btn = '';
    if (r.kind === 'beli' && r.status === 'BARU') btn += '<button data-a="ok" data-id="' + H(r.docId) + '" style="' + B + GRN + '">Konfirmasi</button><button data-a="no" data-id="' + H(r.docId) + '" style="' + B + GREY + '">Tolak</button>';
    if (live) btn += '<button data-a="off" data-id="' + H(r.docId) + '" style="' + B + RED + '">Matikan</button>';
    if (!live || r.status === 'DITOLAK') btn += '<button data-a="del" data-id="' + H(r.docId) + '" style="' + B + GREY + '">' + (r.kind === 'coba' ? 'Hapus (boleh coba lagi)' : 'Hapus') + '</button>';
    return '<div style="padding:11px 12px;margin-bottom:8px;border-radius:14px;background:rgba(255,255,255,.05);font-size:12.5px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><div><b>' + H(nameOf(r.tenantId)) + '</b> <span style="opacity:.6">(' + H(r.tenantId) + ')</span><div style="opacity:.75;margin-top:2px">' +
      (r.kind === 'coba' ? 'Coba gratis ' + NAME[r.tier] + ' · 24 jam' : 'Paket ' + NAME[r.tier] + ' · ' + (r.period === 'tahun' ? '1 tahun' : '1 bulan') + ' · ' + rp(r.price)) + '</div><div style="opacity:.55;font-size:11.5px;margin-top:2px">Ditekan ' + H(dstr(r.pressedAt || r.timestamp)) + ' oleh ' + H(r.requestedBy || '-') + ' (' + H(r.role || '-') + ')</div></div>' +
      '<div style="text-align:right;font-size:11.5px;font-weight:800;color:' + st[1] + ';max-width:46%">' + H(st[0]) + '</div></div>' +
      (r.note ? '<div style="margin-top:6px;opacity:.8">Catatan: ' + H(r.note) + '</div>' : '') + (btn ? '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">' + btn + '</div>' : '') + '</div>';
  }
  function viewMinta() {
    var l = reqs.filter(function (r) { return r.kind === 'beli'; });
    var w = l.filter(function (r) { return r.status === 'BARU'; }), rest = l.filter(function (r) { return r.status !== 'BARU'; });
    var h = '<div style="font-size:12px;opacity:.7;margin-bottom:8px">Klien langsung aktif 24 jam sejak menekan tombol. Cek bukti di WhatsApp, lalu Konfirmasi atau Matikan.</div>';
    h += '<div style="font-weight:800;font-size:12.5px;margin:6px 0">Menunggu konfirmasi (' + w.length + ')</div>' + (w.length ? w.map(card).join('') : '<div style="opacity:.6;font-size:12px;padding:6px 2px">Tidak ada.</div>');
    h += '<div style="font-weight:800;font-size:12.5px;margin:14px 0 6px">Riwayat</div>' + (rest.length ? rest.slice(0, 40).map(card).join('') : '<div style="opacity:.6;font-size:12px;padding:6px 2px">Belum ada.</div>');
    return h;
  }
  function tenantsAll() {
    var out = []; try { var T = (typeof TENANTS_CONFIG !== 'undefined') ? TENANTS_CONFIG : {}; Object.keys(T).forEach(function (k) { var t = T[k]; if (t && t.id && !t.deletedByTower) out.push({ id: t.id, nama: t.nama || t.id }); }); } catch (e) {}
    out.sort(function (a, b) { return String(a.nama).localeCompare(String(b.nama)); }); return out;
  }
  function trialOf(tid, tier) { return reqs.filter(function (r) { return r.kind === 'coba' && r.tier === tier && String(r.tenantId).toLowerCase() === String(tid).toLowerCase(); })[0]; }
  function trialCell(t, tier) {
    var r = trialOf(t.id, tier), lbl = NAME[tier] + ': ', btn = '';
    if (!r) return '<div style="flex:1;min-width:150px"><b>' + lbl + '</b><span style="opacity:.6">belum pernah coba</span><div style="font-size:11px;opacity:.5;margin-top:2px">Klien bisa mencoba sendiri</div></div>';
    var live = untilOf(r) > Date.now();
    if (live) btn = '<button data-a="off" data-id="' + H(r.docId) + '" style="' + B + RED + '">Matikan</button>';
    else btn = '<button data-a="again" data-id="' + H(r.docId) + '" style="' + B + GRN + '">Beri coba lagi</button>';
    return '<div style="flex:1;min-width:150px"><b>' + lbl + '</b><span style="color:' + (live ? '#fbbf24' : '#94a3b8') + '">' + (live ? 'sedang coba, sampai ' + H(dstr(untilOf(r))) : (r.status === 'MATI' ? 'dimatikan, sudah terpakai' : 'sudah terpakai')) + '</span><div style="margin-top:6px">' + btn + '</div></div>';
  }
  function viewCoba() {
    var l = tenantsAll();
    return '<div style="font-size:12px;opacity:.7;margin-bottom:8px">Coba gratis 24 jam, sekali per paket per toko. Tekan "Beri coba lagi" untuk toko yang kamu izinkan mencoba ulang.</div>' +
      (l.length ? l.map(function (t) { return '<div style="padding:10px 12px;margin-bottom:8px;border-radius:14px;background:rgba(255,255,255,.05);font-size:12.5px"><b>' + H(t.nama) + '</b> <span style="opacity:.55">(' + H(t.id) + ')</span><div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:8px">' + trialCell(t, 'plus') + trialCell(t, 'pro') + '</div></div>'; }).join('') : '<div style="opacity:.6;font-size:12px;padding:6px 2px">Belum ada toko.</div>');
  }
  function cur() {
    if (draft) return draft;
    var p = cfg.harga || {}, g = function (t, k) { return (p[t] && Number(p[t][k])) || DEF[t][k]; };
    draft = { wa: cfg.wa || '', qris: cfg.qris || '', hp: g('plus', 'bulan'), ht: g('plus', 'tahun'), rp: g('pro', 'bulan'), rt: g('pro', 'tahun') };
    return draft;
  }
  function collect() {
    if (!ov) return; var d = cur(), v = function (id) { var e = ov.querySelector(id); return e ? e.value : null; };
    if (v('#tu-wa') !== null) { d.wa = v('#tu-wa'); d.hp = Number(v('#tu-hp')) || 0; d.ht = Number(v('#tu-ht')) || 0; d.rp = Number(v('#tu-rp')) || 0; d.rt = Number(v('#tu-rt')) || 0; }
  }
  function viewCfg() {
    var d = cur(), f = function (lbl, id, val, ph) { return '<label style="display:block;font-size:11.5px;opacity:.8;margin-top:10px">' + lbl + '<input id="' + id + '" value="' + H(val) + '" ' + (ph ? 'placeholder="' + ph + '" ' : '') + 'inputmode="numeric" style="' + INP + ';margin-top:4px"></label>'; };
    return '<div style="font-size:12px;opacity:.7">Dipakai klien saat berlangganan. Tahunan = bayar 10 bulan.</div>' +
      '<label style="display:block;font-size:11.5px;opacity:.8;margin-top:12px">Nomor WhatsApp penerima bukti<input id="tu-wa" value="' + H(d.wa) + '" placeholder="08xxxxxxxxxx" inputmode="tel" style="' + INP + ';margin-top:4px"></label>' +
      '<div style="font-size:11.5px;opacity:.8;margin-top:12px">Gambar QRIS</div>' + (d.qris ? '<img src="' + H(d.qris) + '" alt="QRIS" style="display:block;max-width:200px;margin-top:6px;border-radius:12px;background:#fff;padding:8px">' : '<div style="opacity:.6;font-size:12px;margin-top:4px">Belum ada gambar.</div>') +
      '<div style="display:flex;gap:8px;margin-top:8px;align-items:center;flex-wrap:wrap"><input id="tu-file" type="file" accept="image/*" style="font-size:12px;max-width:100%">' + (d.qris ? '<button data-a="qrdel" style="' + B + GREY + '">Hapus gambar</button>' : '') + '</div>' +
      '<div style="font-weight:800;font-size:12.5px;margin:16px 0 0">Harga (Rp)</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
      '<div>' + f('Plus per bulan', 'tu-hp', d.hp) + '</div><div>' + f('Plus per tahun', 'tu-ht', d.ht) + '</div><div>' + f('Pro per bulan', 'tu-rp', d.rp) + '</div><div>' + f('Pro per tahun', 'tu-rt', d.rt) + '</div></div>' +
      (note ? '<div style="margin-top:12px;font-size:12px;color:#fbbf24">' + H(note) + '</div>' : '') +
      '<button data-a="savecfg" style="' + B + VIO + ';margin-top:14px;width:100%;padding:11px">Simpan pengaturan</button>';
  }
  function saveCfg() {
    collect(); var d = cur(), db_ = DB(); if (!db_) return alert('Firestore belum terhubung.');
    var wa = String(d.wa || '').replace(/[^\d+]/g, ''); if (wa && wa.replace(/\D/g, '').length < 9) { note = 'Nomor WhatsApp terlalu pendek.'; return render(); }
    if (!(d.hp > 0 && d.ht > 0 && d.rp > 0 && d.rt > 0)) { note = 'Isi semua harga dengan angka lebih dari 0.'; return render(); }
    var out = { wa: wa, qris: d.qris || '', harga: { plus: { bulan: d.hp, tahun: d.ht }, pro: { bulan: d.rp, tahun: d.rt } } };
    db_.collection('app_meta').doc('upgrade_cfg').set({ json: JSON.stringify(out), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(function () { cfg = out; draft = null; note = 'Tersimpan. Klien memakai pengaturan ini saat membuka halaman berikutnya.'; render(); }).catch(function (e) { note = 'Gagal menyimpan: ' + (e && e.message || e); render(); });
  }
  function readQr(file) {
    if (!file) return;
    var rd = new FileReader();
    rd.onload = function () {
      var im = new Image();
      im.onload = function () {
        var m = 640, k = Math.min(1, m / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
        var url = c.toDataURL('image/png'); if (url.length > 700000) url = c.toDataURL('image/jpeg', 0.9);
        collect(); cur().qris = url; note = ''; render();
      };
      im.onerror = function () { note = 'File bukan gambar yang valid.'; render(); };
      im.src = rd.result;
    };
    rd.readAsDataURL(file);
  }

  function render() {
    if (!ov || ov.style.display === 'none') return;
    var TB = function (id, t) { return '<button data-tab="' + id + '" style="' + B + (tab === id ? VIO : GREY) + '">' + t + '</button>'; };
    var keepTop = ov.firstChild && ov.firstChild.scrollTop || 0, nw = waiting().length;
    var body = tab === 'coba' ? viewCoba() : tab === 'cfg' ? viewCfg() : viewMinta();
    ov.innerHTML = '<div style="width:100%;max-width:760px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px;font-family:-apple-system,Segoe UI,Roboto,sans-serif">' +
      '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><div style="font-weight:800;font-size:17px">Permintaan Upgrade</div><div style="font-size:12px;opacity:.6">Plus dan Pro yang diajukan klien</div></div><button data-x style="' + B + GREY + '">Tutup</button></div>' +
      '<div style="display:flex;gap:6px;margin:12px 0">' + TB('minta', 'Permintaan' + (nw ? ' (' + nw + ')' : '')) + TB('coba', 'Coba gratis') + TB('cfg', 'Pengaturan') + '</div><div>' + body + '</div></div>';
    if (keepTop && ov.firstChild) ov.firstChild.scrollTop = keepTop;
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-tupg';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px';
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var t = e.target.closest('[data-tab]'); if (t) { collect(); tab = t.getAttribute('data-tab'); note = ''; return render(); }
      var b = e.target.closest('[data-a]'); if (b) act(b.getAttribute('data-a'), b.getAttribute('data-id'));
    });
    ov.addEventListener('change', function (e) { if (e.target && e.target.id === 'tu-file') readQr(e.target.files && e.target.files[0]); });
    document.body.appendChild(ov);
  }
  window.FM_TUPG = { open: function (t) { ensure(); start(); loadCfg(); tab = t || 'minta'; note = ''; ov.style.display = 'flex'; render(); } };
  function init() { start(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 3000); }); else setTimeout(init, 3000);
})();
