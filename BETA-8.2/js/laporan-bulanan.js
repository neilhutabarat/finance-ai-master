/* laporan-bulanan.js — Laporan Bulanan ke Owner. Ringkasan satu bulan (omzet, pengeluaran, laba, perbandingan, akun teratas)
   yang bisa dikirim lewat WhatsApp Web (tautan wa.me) atau disalin. Saat Owner membuka aplikasi di bulan baru, laporan bulan lalu muncul otomatis sekali.
   Pengaturan di tenant_settings/<id>.laporanBulanan: { phone, auto, lastShown }. */
(function () {
  'use strict';
  var C = { phone: '', auto: true, lastShown: '' }, started = false, ov = null, month = '', note = '', ready = false;
  var PAGE = (location.pathname.split('/').pop() || '').toLowerCase();
  function role() { return window.FM_PLANS ? FM_PLANS.pageRole() : 'manager'; }
  function tn() { try { return typeof getActiveTenant === 'function' ? getActiveTenant() : null; } catch (e) { return null; } }
  function tid() { var t = tn(); return t && t.id ? t.id : 'default'; }
  function hasDb() { return typeof db !== 'undefined' && db && tid() !== 'default'; }
  function lsKey() { return 'fm_lapbul_' + tid(); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rp(n) { return (n < 0 ? '-' : '') + 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.abs(Math.round(n || 0))); }
  function f(k) { try { return !!(window.FM_PLANS && FM_PLANS.has(k)); } catch (e) { return false; } }
  function txs() { try { return typeof txList !== 'undefined' ? txList : []; } catch (e) { return []; } }
  var MON = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  function ymOf(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function prevYm(ym) { var p = ym.split('-'), d = new Date(Number(p[0]), Number(p[1]) - 2, 1); return ymOf(d); }
  function label(ym) { var p = ym.split('-'); return MON[Number(p[1]) - 1] + ' ' + p[0]; }
  function lastMonth() { var d = new Date(); return ymOf(new Date(d.getFullYear(), d.getMonth() - 1, 1)); }
  function norm(x) { x = x || {}; return { phone: x.phone || '', auto: x.auto !== false, lastShown: x.lastShown || '' }; }

  function start() {
    if (started) return; started = true;
    if (hasDb()) { try { db.collection('tenant_settings').doc(tid()).onSnapshot(function (s) { C = norm(s.exists ? s.data().laporanBulanan : null); var first = !ready; ready = true; if (first) autoCheck(); render(); }, function () {}); } catch (e) {} }
    else { try { C = norm(JSON.parse(localStorage.getItem(lsKey()) || '{}')); } catch (e) {} ready = true; autoCheck(); }
  }
  function persist() {
    if (hasDb()) return db.collection('tenant_settings').doc(tid()).set({ laporanBulanan: C, updatedAt: Date.now() }, { merge: true }).catch(function (e) { alert('Gagal menyimpan: ' + (e && e.message || e)); });
    try { localStorage.setItem(lsKey(), JSON.stringify(C)); } catch (e) {} render(); return Promise.resolve();
  }

  function calc(ym) {
    var r = { n: 0, omzet: 0, cogs: 0, exp: 0, prive: 0, disc: 0, inn: {}, out: {} };
    txs().forEach(function (t) {
      if (String(t.dateISO || '').slice(0, 7) !== ym) return; var a = Number(t.amount) || 0, nm = t.accountName || t.desc || '(tanpa akun)'; r.n++;
      if (t.category === 'sales') { r.omzet += a; r.inn[nm] = (r.inn[nm] || 0) + a; r.disc += Number(t.discount) || 0; }
      else if (t.category === 'prive') r.prive += a;
      else { if (t.category === 'cogs') r.cogs += a; else r.exp += a; r.out[nm] = (r.out[nm] || 0) + a; }
    });
    r.laba = r.omzet - r.cogs - r.exp; return r;
  }
  function top(o, n) { return Object.keys(o).sort(function (a, b) { return o[b] - o[a]; }).slice(0, n).map(function (k) { return [k, o[k]]; }); }
  function pct(a, b) { if (!b) return a ? 'baru' : '-'; var p = Math.round((a - b) / Math.abs(b) * 100); return (p >= 0 ? '+' : '') + p + '%'; }
  function text(ym) {
    var c = calc(ym), p = calc(prevYm(ym)), t = tn(), L = ['*Laporan Bulanan ' + ((t && t.nama) || 'Toko') + '*', label(ym), '',
      'Pemasukan: ' + rp(c.omzet) + (p.n ? ' (' + pct(c.omzet, p.omzet) + ' dari ' + label(prevYm(ym)) + ')' : ''), 'Pengeluaran: ' + rp(c.cogs + c.exp),
      'Laba: ' + rp(c.laba) + (p.n ? ' (' + pct(c.laba, p.laba) + ')' : ''), 'Prive: ' + rp(c.prive), 'Jumlah transaksi: ' + c.n];
    if (c.disc) L.push('Diskon diberikan: ' + rp(c.disc));
    var ti = top(c.inn, 3), to = top(c.out, 3);
    if (ti.length) { L.push('', '*Pemasukan terbesar*'); ti.forEach(function (x, i) { L.push((i + 1) + '. ' + x[0] + ': ' + rp(x[1])); }); }
    if (to.length) { L.push('', '*Pengeluaran terbesar*'); to.forEach(function (x, i) { L.push((i + 1) + '. ' + x[0] + ': ' + rp(x[1])); }); }
    try { if (f('piutang') && window.FM_PIU && FM_PIU.totals) { var q = FM_PIU.totals(); if (q.piutang || q.utang) L.push('', 'Piutang berjalan: ' + rp(q.piutang), 'Utang berjalan: ' + rp(q.utang)); } } catch (e) {}
    L.push('', 'Dibuat otomatis oleh Oneilverse'); return L.join('\n');
  }
  function waLink(ym) { var ph = String(C.phone || '').replace(/[^0-9]/g, ''); if (ph[0] === '0') ph = '62' + ph.slice(1); return 'https://wa.me/' + ph + '?text=' + encodeURIComponent(text(ym)); }

  var S = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
  var inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:13px;outline:none';
  var btn = 'padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#f5f5f7;font-size:12.5px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-block';
  var green = ';background:#22c55e;color:#04210f;border-color:#22c55e';
  function lab(t, el) { return '<div><label style="display:block;font-size:11.5px;font-weight:700;margin:0 0 4px;opacity:.8">' + t + '</label>' + el + '</div>'; }
  function box(t, v, c) { return '<div style="padding:10px;border-radius:14px;background:rgba(255,255,255,.07)"><div style="font-size:11px;opacity:.7">' + t + '</div><div style="font-weight:800;font-size:14px;margin-top:2px;color:' + (c || 'inherit') + '">' + v + '</div></div>'; }
  function render() {
    if (!ov || ov.style.display === 'none') return;
    var c = calc(month), p = calc(prevYm(month)), ed = role() === 'owner' || role() === 'manager';
    var h = '<div style="width:100%;max-width:640px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px">' +
      '<div style="display:flex;justify-content:space-between;gap:10px"><div><div style="font-weight:800;font-size:17px">Laporan Bulanan</div><div style="font-size:12px;opacity:.65">Ringkasan satu bulan, siap dikirim ke WhatsApp.</div></div><button data-x style="' + btn + ';padding:7px 12px">Tutup</button></div>' +
      (note ? '<p style="margin:10px 0;padding:10px 12px;border-radius:12px;background:rgba(34,197,94,.14);color:#86efac;font-size:12px">' + esc(note) + '</p>' : '') +
      '<div style="margin:12px 0;max-width:200px">' + lab('Bulan', '<input id="lb-month" type="month" value="' + month + '" style="' + inp + '">') + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px">' + box('Pemasukan', rp(c.omzet) + (p.n ? '<div style="font-size:10.5px;opacity:.7;font-weight:600">' + pct(c.omzet, p.omzet) + ' vs bulan lalu</div>' : ''), '#4ade80') + box('Pengeluaran', rp(c.cogs + c.exp), '#fb7185') + box('Laba', rp(c.laba) + (p.n ? '<div style="font-size:10.5px;opacity:.7;font-weight:600">' + pct(c.laba, p.laba) + ' vs bulan lalu</div>' : '')) + box('Transaksi', String(c.n)) + '</div>';
    if (!c.n) h += '<p style="opacity:.65;font-size:12.5px;margin-top:12px">Belum ada transaksi pada bulan ini.</p>';
    h += '<pre style="white-space:pre-wrap;margin:14px 0;padding:12px;border-radius:14px;background:rgba(255,255,255,.05);font:12px/1.5 ui-monospace,Menlo,monospace;max-height:200px;overflow:auto">' + esc(text(month)) + '</pre>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><a href="' + esc(waLink(month)) + '" target="_blank" rel="noopener" style="' + btn + green + '">Kirim lewat WhatsApp</a><button data-a="copy" style="' + btn + '">Salin teks</button></div>';
    if (ed) h += '<div style="margin-top:16px;padding:12px;border-radius:14px;background:rgba(255,255,255,.05)"><div style="font-weight:800;margin-bottom:8px;font-size:13px">Pengaturan</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;align-items:end">' +
      lab('Nomor WhatsApp tujuan (kosong = pilih kontak sendiri)', '<input id="lb-phone" value="' + esc(C.phone) + '" placeholder="08xxxxxxxxxx" inputmode="tel" style="' + inp + '">') +
      '<label style="display:flex;gap:8px;align-items:center;font-size:12.5px"><input id="lb-auto" type="checkbox"' + (C.auto ? ' checked' : '') + '> Tampilkan otomatis tiap awal bulan</label></div><div style="margin-top:10px"><button data-a="save" style="' + btn + green + '">Simpan pengaturan</button></div></div>';
    ov.innerHTML = h + '</div>';
  }
  function act(a) {
    note = '';
    if (a === 'save') { C.phone = (document.getElementById('lb-phone').value || '').trim(); C.auto = !!document.getElementById('lb-auto').checked; note = 'Pengaturan disimpan.'; persist(); render(); }
    else if (a === 'copy') { (navigator.clipboard ? navigator.clipboard.writeText(text(month)) : Promise.reject()).then(function () { note = 'Laporan disalin.'; render(); }, function () { note = 'Gagal menyalin.'; render(); }); }
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-lapbul';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px;' + S;
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; } var b = e.target.closest('[data-a]'); if (b) act(b.getAttribute('data-a')); });
    ov.addEventListener('change', function (e) { if (e.target.id === 'lb-month' && e.target.value) { month = e.target.value; note = ''; render(); } });
    document.body.appendChild(ov);
  }
  function open(m) { ensure(); start(); month = m || lastMonth(); note = ''; ov.style.display = 'flex'; render(); }
  /* otomatis: Owner membuka aplikasi di bulan baru → laporan bulan lalu tampil sekali */
  function autoCheck() {
    if (PAGE !== 'dashboard.html' || role() !== 'owner' || !f('laporan_bulanan') || !C.auto) return;
    var lm = lastMonth(); if (C.lastShown >= lm) return;
    var tries = 0;
    (function wait() {
      if (txs().length === 0) { if (++tries < 8) return setTimeout(wait, 2000); return; } /* data belum termuat: coba lagi nanti, bulan tidak ditandai */
      if (!calc(lm).n) { C.lastShown = lm; persist(); return; }
      C.lastShown = lm; persist(); open(lm);
    })();
  }
  window.FM_LAPBUL = { open: open, calc: calc, text: text, start: start, _cfg: function (x) { C = norm(x); } };
  function init() { if (f('laporan_bulanan')) start(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 1500); }); else setTimeout(init, 1500);
})();
