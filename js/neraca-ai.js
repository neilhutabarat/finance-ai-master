/* neraca-ai.js — Neraca AI (UJI COBA). Hanya NERACA, disusun otomatis dari data yang sudah diinput admin:
   transaksi Kasir (kas dan bank), saldo awal dan akun tambahan dari menu Neraca, serta modul Piutang, Utang, dan Stok.
   Tidak ada input Debit/Kredit. Hanya dibaca: tidak mengubah transaksi maupun menu Neraca yang lama.
   Satu buku gabungan untuk seluruh usaha. Selisih yang tidak bisa dijelaskan ditampilkan apa adanya, tidak ditutup angka penyeimbang.
   Yang disimpan: tenant_settings/<id>.neracaAi = { lock: 'YYYY-MM', snap: {...}, j: [...jurnal manual versi lama, tidak dipakai lagi] }. */
(function () {
  'use strict';
  var D = { lock: '', snap: null, j: [] }, NL = { start: '', kasAwal: 0, modalAwal: 0, items: [] }, started = false, ov = null, asof = '', note = '', noteCls = 'ok';
  function role() { return window.FM_PLANS ? FM_PLANS.pageRole() : 'manager'; }
  function canEdit() { return role() === 'manager'; }
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : 'default'; }
  function hasDb() { return typeof db !== 'undefined' && db && tid() !== 'default'; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rp(n) { return (n < 0 ? '-' : '') + 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.abs(Math.round(n || 0))); }
  function iso(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function ym(s) { return String(s).slice(0, 7); }
  function has(k) { try { return !!(window.FM_PLANS && FM_PLANS.has(k)); } catch (e) { return false; } }
  var BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  function tglPanjang(s) { var p = String(s).split('-'); return p.length === 3 ? Number(p[2]) + ' ' + BLN[Number(p[1]) - 1] + ' ' + p[0] : s; }
  function endOfMonth(m) { var y = +m.slice(0, 4), mo = +m.slice(5, 7); return iso(new Date(y, mo, 0)); }

  function normNeraca(x) {
    x = x || {}; var kas = Number(x.kasAwal) || 0, mod = Number(x.modalAwal) || 0;
    if (x.byBiz && typeof x.byBiz === 'object') Object.keys(x.byBiz).forEach(function (k) { var o = x.byBiz[k] || {}; kas += Number(o.kasAwal) || 0; mod += Number(o.modalAwal) || 0; });
    return { start: /^\d{4}-\d{2}-\d{2}$/.test(x.start || '') ? x.start : '', kasAwal: kas, modalAwal: mod, items: Array.isArray(x.items) ? x.items : [] };
  }
  function normAi(x) {
    var o = { lock: '', snap: null, j: [] }; if (!x || typeof x !== 'object') return o;
    if (Array.isArray(x.j)) o.j = x.j;
    if (/^\d{4}-\d{2}$/.test(x.lock || '')) { o.lock = x.lock; var s = x.snap || {}; if (s && typeof s === 'object' && s.tx != null) o.snap = { kas: Number(s.kas) || 0, bank: Number(s.bank) || 0, laba: Number(s.laba) || 0, prive: Number(s.prive) || 0, tx: Number(s.tx) || 0 }; }
    return o;
  }
  function lsKey() { return 'fm_neraca_ai_' + tid(); }
  function start() {
    if (started) return; started = true;
    if (hasDb()) { try { db.collection('tenant_settings').doc(tid()).onSnapshot(function (s) { var dd = s.exists ? s.data() : null; D = normAi(dd ? dd.neracaAi : null); NL = normNeraca(dd ? dd.neraca : null); render(); }, function () {}); } catch (e) {} }
    else { try { D = normAi(JSON.parse(localStorage.getItem(lsKey()) || '{}')); } catch (e) {} try { NL = normNeraca(JSON.parse(localStorage.getItem('fm_neraca_' + tid()) || '{}')); } catch (e) {} }
    try { if (has('piutang') && window.FM_PIU && FM_PIU.start) FM_PIU.start(); } catch (e) {}
  }
  function persist() {
    if (hasDb()) return db.collection('tenant_settings').doc(tid()).set({ neracaAi: D, updatedAt: Date.now() }, { merge: true }).catch(function (e) { alert('Gagal menyimpan: ' + (e && e.message || e)); });
    try { localStorage.setItem(lsKey(), JSON.stringify(D)); } catch (e) {} render(); return Promise.resolve();
  }

  /* ---------- perhitungan ---------- */
  function txs() { try { return (typeof txList !== 'undefined' && txList) ? txList : []; } catch (e) { return []; } }
  function fromTx(day) {
    var r = { kas: NL.kasAwal || 0, bank: 0, sales: 0, cogs: 0, exp: 0, prive: 0, n: 0 };
    txs().forEach(function (t) {
      var d = t && t.dateISO || ''; if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d > day || (NL.start && d < NL.start)) return;
      var a = Math.round(Number(t.amount) || 0); if (!(a > 0)) return;
      var bank = (t.pay === 'qris' || t.pay === 'transfer'), c = t.category; r.n++;
      if (c === 'sales') { r.sales += a; if (bank) r.bank += a; else r.kas += a; }
      else { if (c === 'cogs') r.cogs += a; else if (c === 'prive') r.prive += a; else r.exp += a; if (bank) r.bank -= a; else r.kas -= a; }
    });
    r.laba = r.sales - r.cogs - r.exp; return r;
  }
  function calc(day) {
    var t = fromTx(day), piu = { piutang: 0, utang: 0 }, stokNilai = 0;
    try { if (has('piutang') && window.FM_PIU && FM_PIU.totals) piu = FM_PIU.totals(''); } catch (e) {}
    try { if (has('stok') && window.STORE && STORE.getProducts) STORE.getProducts().forEach(function (p) { stokNilai += Math.max(0, Number(p.stock) || 0) * (Number(p.hpp) || 0); }); } catch (e) {}
    var sum = function (type) { return NL.items.filter(function (i) { return i.type === type; }).reduce(function (x, i) { return x + (Number(i.amount) || 0); }, 0); };
    var its = function (type) { return NL.items.filter(function (i) { return i.type === type && (Number(i.amount) || 0) > 0; }); };
    var asetTetap = its('aset'), utangLain = its('utang'), modalTambah = its('modal');
    var lancar = t.kas + t.bank + (piu.piutang || 0) + stokNilai, tetap = sum('aset'), aset = lancar + tetap;
    var liab = (piu.utang || 0) + sum('utang');
    var ek = (NL.modalAwal || 0) + sum('modal') + t.laba - t.prive;
    return { t: t, piutang: piu.piutang || 0, utang: piu.utang || 0, stok: stokNilai, asetTetap: asetTetap, utangLain: utangLain, modalTambah: modalTambah,
      lancar: lancar, tetap: tetap, aset: aset, liab: liab, ek: ek, selisih: Math.round(aset - liab - ek) };
  }
  function warnings(c, day) {
    var w = [];
    if (!NL.start && txs().length) w.push('Tanggal mulai belum diisi di menu Neraca, jadi semua transaksi lama ikut dihitung.');
    if (!NL.kasAwal && !NL.modalAwal) w.push('Saldo awal Kas dan Modal belum diisi di menu Neraca.');
    else if (Math.round(NL.kasAwal) !== Math.round(NL.modalAwal)) w.push('Saldo awal tidak sama: Kas awal ' + rp(NL.kasAwal) + ', Modal awal ' + rp(NL.modalAwal) + '. Selisihnya ikut menjadi selisih neraca.');
    if (c.t.kas < 0) w.push('Kas bernilai minus (' + rp(c.t.kas) + '). Periksa saldo awal Kas atau pengeluaran yang salah input.');
    if (c.t.bank < 0) w.push('Bank bernilai minus (' + rp(c.t.bank) + '). Ada pengeluaran QRIS atau transfer tanpa pemasukan.');
    if (c.t.sales > 0 && c.t.cogs === 0) w.push('Ada penjualan tetapi HPP belum dicatat, jadi laba bisa terlihat terlalu besar.');
    if (day < iso()) w.push('Piutang, Utang, dan Persediaan memakai nilai terkini, bukan nilai pada tanggal ini.');
    if (D.lock && D.snap) { var f = fromTx(endOfMonth(D.lock)); if (f.n !== D.snap.tx || Math.round(f.kas) !== D.snap.kas || Math.round(f.bank) !== D.snap.bank || Math.round(f.laba) !== D.snap.laba || Math.round(f.prive) !== D.snap.prive) w.push('Transaksi pada periode yang sudah dikunci (sampai ' + D.lock + ') berubah sejak dikunci. Neraca periode itu tidak lagi sama dengan saat dikunci.'); }
    return w;
  }

  /* ---------- tampilan ---------- */
  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:13px;outline:none;color-scheme:dark';
  var btn = 'padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12px;font-weight:700;cursor:pointer';
  var green = ';background:#22c55e;color:#04210f;border-color:#22c55e';
  function lab(t, el) { return '<div><label style="display:block;font-size:11.5px;font-weight:700;margin:0 0 4px;opacity:.8">' + t + '</label>' + el + '</div>'; }
  function line(n, v, o) { o = o || {}; return '<div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0 5px ' + (o.ind ? o.ind : 0) + 'px;border-top:1px solid rgba(255,255,255,.07);font-size:12.5px' + (o.b ? ';font-weight:800' : '') + (o.c ? ';color:' + o.c : '') + '"><span>' + n + '</span><span style="white-space:nowrap">' + v + '</span></div>'; }
  function head(t) { return '<div style="font-weight:800;margin:16px 0 2px;letter-spacing:.02em">' + t + '</div>'; }
  function sub(t) { return '<div style="font-weight:700;margin:8px 0 0;opacity:.8;font-size:12px">' + t + '</div>'; }
  function box(cls, t) { var c = cls === 'err' ? 'rgba(239,68,68,.15);color:#fca5a5' : cls === 'warn' ? 'rgba(245,158,11,.14);color:#fbbf24' : 'rgba(34,197,94,.14);color:#86efac'; return '<p style="margin:6px 0;padding:8px 12px;border-radius:12px;background:' + c + ';font-size:12px">' + esc(t) + '</p>'; }
  function neg(v) { return '(' + rp(v) + ')'; }

  function render() {
    if (!ov || ov.style.display === 'none') return;
    var ed = canEdit(), c = calc(asof), w = warnings(c, asof), tk = tn(), nama = (tk && (tk.nama || tk.name)) || 'Toko', m = ym(asof);
    var locked = D.lock && m <= D.lock, seimbang = c.selisih === 0;
    var h = '<div style="width:100%;max-width:760px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px">' +
      '<div style="display:flex;justify-content:space-between;gap:10px"><div><div style="font-weight:800;font-size:17px">Neraca AI <span style="font-size:10.5px;padding:2px 8px;border-radius:99px;background:rgba(245,158,11,.18);color:#fbbf24;vertical-align:middle">uji coba</span></div><div style="font-size:12px;opacity:.65">Disusun otomatis dari data yang sudah diinput admin. Semua usaha digabung.' + (ed ? '' : ' Tampilan baca saja.') + '</div></div><button data-x style="' + btn + ';align-self:flex-start">Tutup</button></div>';
    if (note) h += box(noteCls, note);
    h += '<div style="display:flex;gap:8px;align-items:end;margin:12px 0;flex-wrap:wrap"><div style="flex:1;min-width:170px">' + lab('Per tanggal', '<input id="na-asof" type="date" value="' + esc(asof) + '" style="' + inp + '">') + '</div>' +
      '<button data-a="copy" style="' + btn + '">Salin teks</button>' +
      (ed ? '<button data-a="lock" ' + ((locked || !seimbang) ? 'disabled style="opacity:.4;cursor:not-allowed;' : 'style="') + btn + green + '">' + (locked ? 'Periode terkunci' : 'Kunci periode ' + esc(m)) + '</button>' : '') + '</div>';
    h += box(seimbang ? 'ok' : 'err', seimbang ? 'Neraca seimbang.' : 'Neraca belum seimbang: selisih ' + rp(c.selisih) + '. Selisih ini tidak ditutup otomatis. Periksa saldo awal dan akun di menu Neraca.');
    w.forEach(function (x) { h += box('warn', x); });
    h += '<div style="text-align:center;margin:14px 0 4px"><div style="font-weight:800;font-size:15px">NERACA</div><div style="font-size:12.5px;opacity:.85">' + esc(nama) + '</div><div style="font-size:12px;opacity:.65">Per ' + esc(tglPanjang(asof)) + '</div></div>';
    h += head('ASET') + sub('Aset Lancar') + line('Kas', rp(c.t.kas), { ind: 10 }) + line('Bank (QRIS dan transfer)', rp(c.t.bank), { ind: 10 });
    if (has('piutang')) h += line('Piutang Usaha', rp(c.piutang), { ind: 10 });
    if (has('stok')) h += line('Persediaan Barang', rp(c.stok), { ind: 10 });
    h += line('Jumlah Aset Lancar', rp(c.lancar), { b: 1 });
    if (c.asetTetap.length) { h += sub('Aset Tetap dan Lainnya') + c.asetTetap.map(function (i) { return line(esc(i.name), rp(i.amount), { ind: 10 }); }).join('') + line('Jumlah Aset Tetap dan Lainnya', rp(c.tetap), { b: 1 }); }
    h += line('JUMLAH ASET', rp(c.aset), { b: 1 });
    h += head('LIABILITAS');
    if (has('piutang')) h += line('Utang Usaha', rp(c.utang), { ind: 10 });
    h += c.utangLain.map(function (i) { return line(esc(i.name), rp(i.amount), { ind: 10 }); }).join('');
    h += line('JUMLAH LIABILITAS', rp(c.liab), { b: 1 });
    h += head('EKUITAS') + line('Modal Awal', rp(NL.modalAwal || 0), { ind: 10 }) +
      c.modalTambah.map(function (i) { return line('Tambahan Modal: ' + esc(i.name), rp(i.amount), { ind: 10 }); }).join('') +
      line('Laba Berjalan', rp(c.t.laba), { ind: 10 }) + line('Prive (pengambilan pribadi)', c.t.prive ? neg(c.t.prive) : rp(0), { ind: 10 }) +
      line('JUMLAH EKUITAS', rp(c.ek), { b: 1 });
    h += line('JUMLAH LIABILITAS DAN EKUITAS', rp(c.liab + c.ek), { b: 1 });
    if (!seimbang) h += line('Selisih belum terjelaskan', rp(c.selisih), { b: 1, c: '#fca5a5' });
    h += '<div style="font-size:11px;opacity:.55;margin-top:12px">Sumber: ' + c.t.n + ' transaksi Kasir sejak ' + esc(NL.start ? tglPanjang(NL.start) : 'awal') + ', saldo awal dan akun tambahan dari menu Neraca' + (has('piutang') ? ', modul Piutang dan Utang' : '') + (has('stok') ? ', nilai stok (stok x HPP)' : '') + '.</div>';
    ov.innerHTML = h + '</div>';
  }
  function textOut() {
    var c = calc(asof), tk = tn(), L = ['NERACA ' + ((tk && (tk.nama || tk.name)) || 'Toko'), 'Per ' + tglPanjang(asof), '', 'ASET', 'Kas: ' + rp(c.t.kas), 'Bank: ' + rp(c.t.bank)];
    if (has('piutang')) L.push('Piutang Usaha: ' + rp(c.piutang)); if (has('stok')) L.push('Persediaan Barang: ' + rp(c.stok));
    c.asetTetap.forEach(function (i) { L.push(i.name + ': ' + rp(i.amount)); });
    L.push('JUMLAH ASET: ' + rp(c.aset), '', 'LIABILITAS'); if (has('piutang')) L.push('Utang Usaha: ' + rp(c.utang));
    c.utangLain.forEach(function (i) { L.push(i.name + ': ' + rp(i.amount)); });
    L.push('JUMLAH LIABILITAS: ' + rp(c.liab), '', 'EKUITAS', 'Modal Awal: ' + rp(NL.modalAwal || 0));
    c.modalTambah.forEach(function (i) { L.push('Tambahan Modal ' + i.name + ': ' + rp(i.amount)); });
    L.push('Laba Berjalan: ' + rp(c.t.laba), 'Prive: ' + neg(c.t.prive), 'JUMLAH EKUITAS: ' + rp(c.ek), '', 'JUMLAH LIABILITAS DAN EKUITAS: ' + rp(c.liab + c.ek));
    if (c.selisih) L.push('SELISIH BELUM TERJELASKAN: ' + rp(c.selisih));
    return L.join('\n');
  }
  async function act(a) {
    note = ''; noteCls = 'ok';
    if (a === 'copy') { try { await navigator.clipboard.writeText(textOut()); note = 'Neraca disalin, tinggal ditempel ke WhatsApp atau catatan.'; } catch (e) { note = 'Gagal menyalin.'; noteCls = 'err'; } render(); }
    else if (a === 'lock') {
      var m = ym(asof), c = calc(asof); if (c.selisih !== 0) return;
      if (await (window.fmAsk ? fmAsk('Kunci periode sampai ' + m + '? Bila nanti ada transaksi di bulan itu berubah, akan muncul peringatan.') : confirm('Kunci periode sampai ' + m + '?'))) {
        var f = fromTx(endOfMonth(m)); D.lock = m; D.snap = { kas: Math.round(f.kas), bank: Math.round(f.bank), laba: Math.round(f.laba), prive: Math.round(f.prive), tx: f.n };
        note = 'Periode ' + m + ' dikunci.'; persist(); render();
      }
    }
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-neraca-ai';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var b = e.target.closest('[data-a]'); if (b && !b.disabled) act(b.getAttribute('data-a'));
    });
    ov.addEventListener('change', function (e) { if (e.target.id === 'na-asof' && e.target.value) { asof = e.target.value; note = ''; render(); } });
    document.body.appendChild(ov);
  }
  window.FM_NAI = { open: function () { ensure(); start(); asof = iso(); note = ''; ov.style.display = 'flex'; render(); setTimeout(render, 900); },
    _calc: calc, _set: function (ai, ne) { D = normAi(ai); if (ne) NL = normNeraca(ne); }, _data: function () { return D; }, _text: textOut };
})();
