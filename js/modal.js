/* modal.js — Perubahan Modal (Manager dan Owner). Modal awal + tambahan modal + laba bersih - prive = modal akhir.
   Saldo awal dan tambahan modal diambil dari menu Neraca (tenant_settings.neraca); laba dan prive dari transaksi, dengan aturan yang sama seperti Neraca AI,
   sehingga modal akhir harus sama dengan ekuitas di Neraca AI. Tambahan modal di Neraca belum bertanggal, jadi dihitung di periode yang mencakup tanggal mulai Neraca. */
(function () {
  'use strict';
  var L = window.FM_LAPX; if (!L) return;
  var per = 'bulan', note = '', last = null;
  function build() {
    var P = L.period(per), nai = window.FM_NAI, rp = L.rp;
    if (!nai || !nai._nl) return { err: 'Modul Neraca AI belum dimuat. Muat ulang halaman.', P: P };
    try { nai._start && nai._start(); } catch (e) {}
    var nl = nai._nl(), st = nl.start || '', warn = [];
    if (!st) warn.push('Tanggal mulai belum diisi di Saldo Awal Neraca AI, jadi semua transaksi lama dihitung dari awal.');
    if (st && st > P.b) return { P: P, before: true, st: st };
    var inc = !st || st >= P.a, effA = st ? (st > P.a ? st : P.a) : '0000-00-00', awal, tambah = 0;
    if (inc) { awal = nl.modalAwal || 0; tambah = (nl.items || []).filter(function (i) { return i.type === 'modal'; }).reduce(function (s, i) { return s + (Number(i.amount) || 0); }, 0); }
    else awal = nai._calc(L.addDays(P.a, -1)).ek;
    var c = L.sum(effA, P.b, true), akhir = awal + tambah + c.laba - c.prive, chk = nai._calc(P.b).ek, beda = Math.round(akhir - chk);
    if (!(nl.modalAwal || tambah) && inc) warn.push('Modal awal belum diisi di Saldo Awal Neraca AI.');
    var rows = [['Modal awal periode', awal, ''], ['Tambahan modal', tambah, '+'], ['Laba bersih periode', c.laba, '+'], ['Prive (pengambilan pribadi)', -c.prive, '-']];
    var text = 'LAPORAN PERUBAHAN MODAL\n' + P.label + '\n\n' + rows.map(function (r) { return r[0] + ': ' + rp(r[1]); }).join('\n') + '\nModal akhir periode: ' + rp(akhir) + '\n\n' + (beda === 0 ? 'Sama dengan ekuitas di Neraca AI.' : 'Berbeda ' + rp(beda) + ' dari ekuitas di Neraca AI.');
    return { P: P, rows: rows, akhir: akhir, beda: beda, warn: warn, text: text, inc: inc, effA: effA };
  }
  function body() {
    var r = last = build(), h = L.periodTabs(per), rp = L.rp;
    if (r.err) return h + '<p style="font-size:13px;opacity:.8;margin-top:14px">' + L.esc(r.err) + '</p>';
    if (r.before) return h + '<div style="padding:24px 6px;text-align:center;opacity:.75;font-size:13px">Neraca baru dimulai pada ' + L.esc(r.st) + ', jadi belum ada perubahan modal di ' + L.esc(r.P.label) + '.</div>';
    h += '<div style="font-size:11.5px;opacity:.65;margin:8px 0 6px">' + L.esc(r.P.label) + '. Semua usaha, tidak mengikuti filter usaha.</div>';
    h += '<div style="border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);padding:4px 14px">' + r.rows.map(function (x) {
      return '<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:13px"><span>' + L.esc(x[0]) + '</span><b style="color:' + (x[1] < 0 ? '#fb7185' : '#f5f5f7') + '">' + rp(x[1]) + '</b></div>';
    }).join('') + '<div style="display:flex;justify-content:space-between;gap:10px;padding:12px 0;font-size:14px"><b>Modal akhir periode</b><b style="color:' + (r.akhir < 0 ? '#fb7185' : '#34d399') + '">' + rp(r.akhir) + '</b></div></div>';
    h += '<div style="margin-top:10px;font-size:12px;line-height:1.5;color:' + (r.beda === 0 ? '#4ade80' : '#fbbf24') + '">' + (r.beda === 0 ? 'Sama dengan ekuitas di Neraca AI.' : 'Berbeda ' + rp(r.beda) + ' dari ekuitas di Neraca AI. Periksa data di menu Neraca.') + '</div>';
    r.warn.forEach(function (w) { h += '<div style="margin-top:6px;font-size:12px;color:#fbbf24;line-height:1.5">' + L.esc(w) + '</div>'; });
    if (!r.inc) h += '<div style="margin-top:6px;font-size:11.5px;opacity:.65;line-height:1.5">Modal awal periode diambil dari ekuitas akhir hari sebelumnya, sudah termasuk tambahan modal yang dicatat di Neraca.</div>';
    h += '<div style="display:flex;gap:8px;margin-top:14px;align-items:center"><button data-lx="copy" style="' + L.BTN + L.VIO + '">Salin teks</button><span style="font-size:12px;color:#4ade80">' + L.esc(note) + '</span></div>';
    return h;
  }
  function act(a) { if (a === 'copy' && last && last.text) L.copy(last.text, function (ok) { note = ok ? 'Tersalin.' : 'Gagal menyalin.'; L.render('modal'); setTimeout(function () { note = ''; L.render('modal'); }, 2200); }); }
  window.FM_MODAL = { open: function () { if (!L.has('perubahan_modal')) return; per = 'bulan'; note = ''; L.open('modal', { title: 'Perubahan Modal', sub: 'Dari modal awal sampai modal akhir', body: body, act: act, per: function (k) { per = k; } }); setTimeout(function () { L.render('modal'); }, 900); }, _build: build, _per: function (k) { per = k; } };
})();
