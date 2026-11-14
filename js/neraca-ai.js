/* neraca-ai.js — Neraca AI (UJI COBA). Jurnal Debit = Kredit dicatat manual oleh Manager; Owner hanya melihat.
   Data disimpan di tenant_settings/<id>.neracaAi = { j: [...], lock: 'YYYY-MM' } (satu buku per toko).
   Terpisah dari transaksi toko dan dari menu Neraca yang lama: tidak membaca maupun mengubah keduanya.
   Saran akun memakai aturan kata kunci (bukan model AI). */
(function () {
  'use strict';
  var COA = [
    ['101', 'Kas', 'aset', 'D'], ['102', 'Bank', 'aset', 'D'], ['103', 'Piutang Usaha', 'aset', 'D'], ['104', 'Persediaan / Stok', 'aset', 'D'],
    ['105', 'Peralatan', 'aset', 'D'], ['106', 'Akumulasi Penyusutan Peralatan', 'aset', 'K'],
    ['201', 'Hutang Usaha', 'liab', 'K'], ['202', 'Hutang Bank', 'liab', 'K'], ['203', 'Hutang Gaji', 'liab', 'K'],
    ['301', 'Modal Owner', 'ekuitas', 'K'], ['302', 'Prive (ambil pribadi)', 'ekuitas', 'D'], ['303', 'Laba Ditahan', 'ekuitas', 'K'],
    ['401', 'Penjualan', 'pendapatan', 'K'], ['501', 'Harga Pokok Penjualan (HPP)', 'hpp', 'D'],
    ['601', 'Beban Sewa', 'beban', 'D'], ['602', 'Beban Gaji', 'beban', 'D'], ['603', 'Beban Listrik / Air', 'beban', 'D'],
    ['604', 'Beban Penyusutan', 'beban', 'D'], ['605', 'Beban Lain-lain', 'beban', 'D']
  ];
  var D = { j: [], lock: '' }, started = false, ov = null, per = '', note = '', noteCls = 'ok', draft = { date: '', desc: '', deb: '101', kre: '401', amt: '', adj: '0' };
  function role() { return window.FM_PLANS ? FM_PLANS.pageRole() : 'manager'; }
  function canEdit() { return role() === 'manager'; }
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : 'default'; }
  function hasDb() { return typeof db !== 'undefined' && db && tid() !== 'default'; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rp(n) { return (n < 0 ? '-' : '') + 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.abs(Math.round(n || 0))); }
  function iso(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function ym(s) { return String(s).slice(0, 7); }
  function acc(c) { for (var i = 0; i < COA.length; i++) if (COA[i][0] === c) return COA[i]; return null; }
  function norm(x) {
    var o = { j: [], lock: '' }; if (!x || typeof x !== 'object') return o;
    if (/^\d{4}-\d{2}$/.test(x.lock || '')) o.lock = x.lock;
    (Array.isArray(x.j) ? x.j : []).forEach(function (e) {
      if (e && acc(e.deb) && acc(e.kre) && e.deb !== e.kre && Number(e.amt) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(e.date || ''))
        o.j.push({ id: Number(e.id) || o.j.length + 1, date: e.date, desc: String(e.desc || 'Transaksi').slice(0, 120), deb: e.deb, kre: e.kre, amt: Math.round(Number(e.amt)), adj: !!e.adj });
    });
    return o;
  }
  function lsKey() { return 'fm_neraca_ai_' + tid(); }
  function start() {
    if (started) return; started = true;
    if (hasDb()) { try { db.collection('tenant_settings').doc(tid()).onSnapshot(function (s) { D = norm(s.exists ? s.data().neracaAi : null); render(); }, function () {}); } catch (e) {} }
    else { try { D = norm(JSON.parse(localStorage.getItem(lsKey()) || '{}')); } catch (e) {} }
  }
  function persist() {
    if (hasDb()) return db.collection('tenant_settings').doc(tid()).set({ neracaAi: D, updatedAt: Date.now() }, { merge: true }).catch(function (e) { alert('Gagal menyimpan: ' + (e && e.message || e)); });
    try { localStorage.setItem(lsKey(), JSON.stringify(D)); } catch (e) {} render(); return Promise.resolve();
  }

  /* ---------- hitungan ---------- */
  function bal(until) {
    var b = {}; COA.forEach(function (a) { b[a[0]] = { d: 0, k: 0 }; });
    D.j.forEach(function (x) { if (until && ym(x.date) > until) return; b[x.deb].d += x.amt; b[x.kre].k += x.amt; });
    return b;
  }
  function sal(b, c) { var a = acc(c), v = b[c]; return a[3] === 'D' ? v.d - v.k : v.k - v.d; }
  function grp(b, g) { return COA.filter(function (a) { return a[2] === g; }).reduce(function (s, a) { var v = b[a[0]]; return s + (g === 'aset' ? v.d - v.k : sal(b, a[0])); }, 0); }
  function fig(b) {
    var pend = grp(b, 'pendapatan'), hpp = grp(b, 'hpp'), beban = grp(b, 'beban'), laba = pend - hpp - beban;
    return { aset: grp(b, 'aset'), liab: grp(b, 'liab'), pend: pend, hpp: hpp, beban: beban, laba: laba, ek: sal(b, '301') + sal(b, '303') - sal(b, '302') + laba };
  }
  function prevYM(p) { var y = +p.slice(0, 4), m = +p.slice(5, 7) - 1; if (m < 1) { m = 12; y--; } return y + '-' + String(m).padStart(2, '0'); }
  function checks(p) {
    var out = [], b = bal(p), f = fig(b);
    if (f.aset !== f.liab + f.ek) out.push(['err', 'Neraca tidak balance, selisih ' + rp(f.aset - f.liab - f.ek) + '. Periksa jurnal terakhir.']);
    ['101', '102', '103', '104', '201', '202'].forEach(function (c) { var s = sal(b, c); if (s < 0) out.push(['err', acc(c)[1] + ' bernilai minus (' + rp(s) + '). Cek arah debit dan kredit, atau modal belum dicatat.']); });
    if (sal(b, '106') > sal(b, '105')) out.push(['err', 'Akumulasi penyusutan melebihi nilai peralatan.']);
    if (sal(b, '401') > 0 && sal(b, '104') <= 0) out.push(['warn', 'Ada penjualan tetapi persediaan 0. Stok belum dicatat atau HPP belum diakui.']);
    if (sal(b, '401') > 0 && sal(b, '501') === 0) out.push(['warn', 'Ada penjualan tetapi HPP belum dicatat, jadi laba terlihat terlalu besar.']);
    if (sal(b, '105') > 0 && !D.j.some(function (x) { return x.deb === '604' && ym(x.date) === p; })) out.push(['warn', 'Peralatan belum disusutkan di bulan ' + p + '.']);
    var p0 = sal(bal(prevYM(p)), '103'), p1 = sal(b, '103'); if (p0 > 0 && p1 > p0 * 4) out.push(['warn', 'Piutang naik lebih dari 300% dibanding bulan lalu (' + rp(p0) + ' menjadi ' + rp(p1) + ').']);
    if (D.lock && p <= D.lock) out.unshift(['ok', 'Periode ' + p + ' sudah dikunci.']);
    else if (!out.some(function (x) { return x[0] === 'err'; })) out.unshift(['ok', 'Neraca balance dan tidak ada kesalahan berat.' + (out.length ? ' Ada ' + out.length + ' catatan untuk dicek.' : '')]);
    return out;
  }

  /* ---------- saran akun ---------- */
  function amount(t) {
    t = String(t).toLowerCase(); var m = t.match(/(\d+(?:[.,]\d+)?)\s*(jt|juta|rb|ribu|k)\b/);
    if (m) { var v = parseFloat(m[1].replace(',', '.')); return Math.round(v * ((m[2] === 'jt' || m[2] === 'juta') ? 1e6 : 1e3)); }
    m = t.match(/\d{1,3}(?:[.]\d{3})+|\d{4,}/); return m ? parseInt(m[0].replace(/\./g, ''), 10) : (Number(t.replace(/[^\d]/g, '')) || 0);
  }
  var RULES = [
    [/susut/, '604', '106', 'Penyusutan peralatan'], [/bayar hutang|lunasi hutang|cicil.*hutang/, '201', '101', 'Pembayaran hutang usaha'],
    [/terima piutang|pelunasan piutang|bayar piutang|tagihan lunas/, '101', '103', 'Penerimaan piutang'], [/prive|ambil pribadi|ambil uang pribadi/, '302', '101', 'Pengambilan pribadi owner'],
    [/tambah modal|setor modal|modal awal|modal owner/, '101', '301', 'Tambahan modal owner'], [/beli peralatan|beli mesin|beli alat|beli komputer|beli laptop|beli kendaraan/, '105', '101', 'Pembelian peralatan tunai'],
    [/beli stok.*(hutang|ngutang|tempo|kredit)|(hutang|ngutang|tempo|kredit).*beli stok|beli barang.*(hutang|ngutang|tempo|kredit)/, '104', '201', 'Beli stok secara kredit'],
    [/beli stok|beli barang|kulakan|belanja stok/, '104', '101', 'Beli stok tunai'], [/hpp|harga pokok/, '501', '104', 'Mengakui HPP dari persediaan'],
    [/jual.*(hutang|ngutang|tempo|kredit|piutang)|(piutang|tempo|kredit).*jual/, '103', '401', 'Penjualan kredit (piutang)'], [/jual|laku|penjualan|omzet/, '101', '401', 'Penjualan tunai'],
    [/sewa/, '601', '101', 'Beban sewa dibayar tunai'], [/gaji|upah|honor/, '602', '101', 'Beban gaji dibayar tunai'],
    [/listrik|air|pdam|pln|internet|wifi/, '603', '101', 'Beban listrik / air dibayar tunai'], [/pinjam.*bank|kredit bank|pinjaman bank/, '101', '202', 'Pinjaman bank diterima']
  ];
  function suggest(text) { var t = String(text).toLowerCase(); for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(t)) return { deb: RULES[i][1], kre: RULES[i][2], why: RULES[i][3], amt: amount(t) }; return null; }

  function addEntry(e) {
    if (!acc(e.deb) || !acc(e.kre)) return 'Akun tidak dikenal.';
    if (e.deb === e.kre) return 'Debit dan Kredit tidak boleh akun yang sama.';
    if (!(e.amt > 0) || !isFinite(e.amt)) return 'Nominal harus lebih dari 0.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return 'Tanggal belum diisi.';
    if (D.lock && ym(e.date) <= D.lock) return 'Bulan ' + ym(e.date) + ' sudah dikunci.';
    var id = D.j.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1;
    D.j.push({ id: id, date: e.date, desc: (e.desc || 'Transaksi').slice(0, 120), deb: e.deb, kre: e.kre, amt: Math.round(e.amt), adj: !!e.adj });
    return '';
  }

  /* ---------- tampilan ---------- */
  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:13px;outline:none;color-scheme:dark';
  var btn = 'padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12px;font-weight:700;cursor:pointer';
  var green = ';background:#22c55e;color:#04210f;border-color:#22c55e';
  function lab(t, el) { return '<div><label style="display:block;font-size:11.5px;font-weight:700;margin:0 0 4px;opacity:.8">' + t + '</label>' + el + '</div>'; }
  function tr(a, b, bold) { return '<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-top:1px solid rgba(255,255,255,.07);font-size:12.5px' + (bold ? ';font-weight:800' : '') + '"><span>' + a + '</span><span>' + b + '</span></div>'; }
  function head(t) { return '<div style="font-weight:800;margin:14px 0 2px">' + t + '</div>'; }
  function box(cls, t) { var c = cls === 'err' ? 'rgba(239,68,68,.15);color:#fca5a5' : cls === 'warn' ? 'rgba(245,158,11,.14);color:#fbbf24' : 'rgba(34,197,94,.14);color:#86efac'; return '<p style="margin:6px 0;padding:8px 12px;border-radius:12px;background:' + c + ';font-size:12px">' + esc(t) + '</p>'; }
  function accOpts(sel) { return COA.map(function (a) { return '<option value="' + a[0] + '"' + (a[0] === sel ? ' selected' : '') + '>' + a[0] + ' · ' + esc(a[1]) + '</option>'; }).join(''); }

  function render() {
    if (!ov || ov.style.display === 'none') return;
    var ed = canEdit(), p = per, b = bal(p), f = fig(b), cs = checks(p), hasErr = cs.some(function (c) { return c[0] === 'err'; }), locked = D.lock && p <= D.lock;
    var h = '<div style="width:100%;max-width:820px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px">' +
      '<div style="display:flex;justify-content:space-between;gap:10px"><div><div style="font-weight:800;font-size:17px">Neraca AI <span style="font-size:10.5px;padding:2px 8px;border-radius:99px;background:rgba(245,158,11,.18);color:#fbbf24;vertical-align:middle">uji coba</span></div><div style="font-size:12px;opacity:.65">Jurnal Debit = Kredit, satu buku untuk seluruh toko.' + (ed ? '' : ' Tampilan baca saja.') + '</div></div><button data-x style="' + btn + ';align-self:flex-start">Tutup</button></div>';
    if (note) h += box(noteCls, note);
    if (ed) {
      h += head('Catat jurnal') + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:8px">' +
        '<div style="grid-column:1/-1">' + lab('Keterangan (mis. "Bayar sewa ruko 2jt")', '<input id="na-desc" autocomplete="off" value="' + esc(draft.desc) + '" style="' + inp + '">') + '</div>' +
        lab('Tanggal', '<input id="na-date" type="date" value="' + esc(draft.date) + '" style="' + inp + '">') +
        lab('Debit (bertambah / beban)', '<select id="na-deb" style="' + inp + '">' + accOpts(draft.deb) + '</select>') +
        lab('Kredit (sumber / pendapatan)', '<select id="na-kre" style="' + inp + '">' + accOpts(draft.kre) + '</select>') +
        lab('Nominal (Rp)', '<input id="na-amt" inputmode="numeric" value="' + esc(draft.amt) + '" style="' + inp + '">') +
        lab('Jenis', '<select id="na-adj" style="' + inp + '"><option value="0"' + (draft.adj === '0' ? ' selected' : '') + '>Transaksi biasa</option><option value="1"' + (draft.adj === '1' ? ' selected' : '') + '>Jurnal penyesuaian</option></select>') + '</div>' +
        '<div id="na-hint" style="font-size:12px;opacity:.75;margin-top:8px;min-height:16px"></div>' +
        '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button data-a="add" style="' + btn + green + '">Simpan jurnal</button><button data-a="dep" style="' + btn + '">Susutkan peralatan</button></div>';
    }
    h += head('Periode') + '<div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin-top:6px"><div style="flex:1;min-width:170px">' + lab('Neraca sampai akhir bulan', '<input id="na-per" type="month" value="' + esc(p) + '" style="' + inp + '">') + '</div>' +
      (ed ? '<button data-a="lock" ' + ((hasErr || locked || !D.j.length) ? 'disabled style="opacity:.4;cursor:not-allowed;' : 'style="') + btn.replace(/^/, '') + green.replace(/^/, '') + '">' + (locked ? 'Periode terkunci' : 'Kunci periode ' + esc(p)) + '</button>' : '') + '</div>' +
      '<div style="font-size:11.5px;opacity:.6;margin-top:6px">' + (D.lock ? 'Terkunci sampai ' + esc(D.lock) + ': jurnal bulan itu tidak bisa ditambah atau dihapus.' : 'Belum ada periode dikunci. Tombol aktif hanya jika tidak ada kesalahan berat.') + '</div>' +
      cs.map(function (c) { return box(c[0], c[1]); }).join('');
    function line(c) { var s = sal(b, c); if (!s) return ''; if (c === '106') s = -s; return tr(esc(acc(c)[1]), rp(s)); }
    function g(gr) { return COA.filter(function (a) { return a[2] === gr; }).map(function (a) { return line(a[0]); }).join('') || tr('-', ''); }
    h += head('Neraca') + g('aset') + tr('Total Aset', rp(f.aset), 1) + g('liab') + tr('Total Liabilitas', rp(f.liab), 1) +
      line('301') + line('303') + (sal(b, '302') ? tr('Prive', rp(-sal(b, '302'))) : '') + tr('Laba (rugi) berjalan', rp(f.laba)) + tr('Total Ekuitas', rp(f.ek), 1) + tr('Liabilitas + Ekuitas', rp(f.liab + f.ek), 1);
    h += head('Laba Rugi (kumulatif sampai periode)') + tr('Penjualan', rp(f.pend)) + tr('HPP', rp(-f.hpp)) + tr('Laba kotor', rp(f.pend - f.hpp), 1) +
      COA.filter(function (a) { return a[2] === 'beban'; }).map(function (a) { var s = sal(b, a[0]); return s ? tr(esc(a[1]), rp(-s)) : ''; }).join('') + tr('Laba bersih', rp(f.laba), 1);
    var td = 0, tk = 0, rows = '';
    COA.forEach(function (a) { var v = b[a[0]], n = v.d - v.k; if (!v.d && !v.k) return; var Dd = n > 0 ? n : 0, K = n < 0 ? -n : 0; td += Dd; tk += K; rows += tr(a[0] + ' · ' + esc(a[1]), (Dd ? 'D ' + rp(Dd) : 'K ' + rp(K))); });
    h += head('Neraca Saldo') + (rows || tr('Belum ada jurnal', '')) + tr('Total Debit / Kredit', rp(td) + ' / ' + rp(tk), 1);
    h += head('Jurnal') + (D.j.slice().sort(function (x, y) { return x.date < y.date ? 1 : x.date > y.date ? -1 : y.id - x.id; }).map(function (x) {
      var lk = D.lock && ym(x.date) <= D.lock;
      return tr(esc(x.date) + ' · ' + esc(x.desc) + (x.adj ? ' <i style="opacity:.6">(penyesuaian)</i>' : '') + '<div style="font-size:11px;opacity:.6">D ' + esc(acc(x.deb)[1]) + ' / K ' + esc(acc(x.kre)[1]) + '</div>',
        rp(x.amt) + (ed && !lk ? ' <button data-a="del" data-id="' + x.id + '" style="' + btn + ';padding:1px 8px;font-size:10.5px">Hapus</button>' : ''));
    }).join('') || tr('Belum ada jurnal.', ''));
    ov.innerHTML = h + '</div>';
  }
  function readDraft() {
    function v(id, d) { var e = document.getElementById(id); return e ? e.value : d; }
    draft = { date: v('na-date', draft.date), desc: v('na-desc', draft.desc), deb: v('na-deb', draft.deb), kre: v('na-kre', draft.kre), amt: v('na-amt', draft.amt), adj: v('na-adj', draft.adj) };
  }
  async function act(a, id) {
    note = ''; noteCls = 'ok';
    if (a === 'add') {
      readDraft();
      var err = addEntry({ date: draft.date, desc: draft.desc.trim(), deb: draft.deb, kre: draft.kre, amt: amount(draft.amt), adj: draft.adj === '1' });
      if (err) { note = err; noteCls = 'err'; return render(); }
      note = 'Jurnal tersimpan.'; draft.desc = ''; draft.amt = ''; persist(); render();
    } else if (a === 'dep') {
      var v = prompt('Nominal penyusutan bulan ' + per + ' (Rp):'); if (v == null) return;
      var e2 = addEntry({ date: per + '-28', desc: 'Penyusutan peralatan ' + per, deb: '604', kre: '106', amt: amount(v), adj: true });
      if (e2) { note = e2; noteCls = 'err'; } else { note = 'Penyusutan dicatat sebagai jurnal penyesuaian.'; persist(); } render();
    } else if (a === 'del') {
      var x = D.j.filter(function (q) { return String(q.id) === String(id); })[0];
      if (!x || (D.lock && ym(x.date) <= D.lock)) return;
      if (await (window.fmAsk ? fmAsk('Hapus jurnal "' + x.desc + '"?') : confirm('Hapus jurnal "' + x.desc + '"?'))) { D.j = D.j.filter(function (q) { return q !== x; }); persist(); render(); }
    } else if (a === 'lock') {
      if (checks(per).some(function (c) { return c[0] === 'err'; })) return;
      if (await (window.fmAsk ? fmAsk('Kunci periode sampai ' + per + '? Jurnal bulan itu tidak bisa diubah lagi.') : confirm('Kunci periode sampai ' + per + '?'))) { D.lock = per; note = 'Periode ' + per + ' dikunci.'; persist(); render(); }
    }
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-neraca-ai';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var b = e.target.closest('[data-a]'); if (b && !b.disabled) { if (b.getAttribute('data-a') === 'add') readDraft(); act(b.getAttribute('data-a'), b.getAttribute('data-id')); }
      var u = e.target.closest('[data-use]'); if (u) { var s = suggest(draft.desc); if (s) { draft.deb = s.deb; draft.kre = s.kre; if (s.amt) draft.amt = String(s.amt); render(); } }
    });
    ov.addEventListener('change', function (e) { if (e.target.id === 'na-per' && e.target.value) { per = e.target.value; note = ''; render(); } else if (/^na-/.test(e.target.id)) readDraft(); });
    ov.addEventListener('input', function (e) {
      if (!/^na-/.test(e.target.id)) return; readDraft(); if (e.target.id !== 'na-desc') return; var s = suggest(draft.desc), el = document.getElementById('na-hint'); if (!el) return;
      el.innerHTML = s ? 'Saran: ' + esc(s.why) + ' (Debit ' + esc(acc(s.deb)[1]) + ', Kredit ' + esc(acc(s.kre)[1]) + (s.amt ? ', ' + rp(s.amt) : '') + ') <button data-use style="' + btn + ';padding:2px 10px;font-size:11px">Pakai saran</button>' + (s.deb === '101' && s.kre === '401' ? ' Jangan lupa catat HPP-nya terpisah.' : '') : '';
    });
    document.body.appendChild(ov);
  }
  window.FM_NAI = { open: function () { ensure(); start(); per = iso().slice(0, 7); draft.date = draft.date || iso(); note = ''; ov.style.display = 'flex'; render(); setTimeout(render, 900); }, _suggest: suggest, _amount: amount, _set: function (x) { D = norm(x); }, _data: function () { return D; } };
})();
