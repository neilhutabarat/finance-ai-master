/* Dialog konfirmasi & pemberitahuan Oneilverse: di tengah layar, kaca tembus pandang, menggantikan kotak bawaan peramban.
   window.fmAsk(pesan, {ok:'Hapus', batal:'Batal', judul:'Konfirmasi', bahaya:true}) -> Promise<boolean>
   window.alert dialihkan ke pemberitahuan bergaya sama (tombol OK saja). */
(function () {
  if (window.fmAsk) return;
  var nativeAlert = window.alert;
  var css = document.createElement('style');
  css.textContent =
    '#fm-dlg{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.38);font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;animation:fmDlgIn .16s ease-out}' +
    '@keyframes fmDlgIn{from{opacity:0}to{opacity:1}}' +
    '#fm-dlg .fm-dlg-box{width:min(420px,100%);border-radius:22px;background:rgba(255,255,255,.84);border:1px solid rgba(255,255,255,.7);box-shadow:0 24px 60px rgba(15,23,42,.35);padding:22px 22px 18px;color:#0f172a;text-align:center;animation:fmDlgPop .18s cubic-bezier(.2,.9,.25,1.15)}' +
    '@keyframes fmDlgPop{from{transform:scale(.94);opacity:0}to{transform:scale(1);opacity:1}}' +
    '#fm-dlg h4{margin:0 0 8px;font-size:16px;font-weight:800;color:#0f172a}' +
    '#fm-dlg p{margin:0 0 18px;font-size:13px;line-height:1.55;color:#334155;white-space:pre-line;word-break:break-word;text-align:left;max-height:46vh;overflow:auto}' +
    '#fm-dlg .fm-dlg-row{display:flex;gap:10px;justify-content:center}' +
    '#fm-dlg button{flex:1;max-width:180px;border:0;border-radius:14px;padding:11px 14px;font:700 13px/1 inherit;font-family:inherit;cursor:pointer;transition:transform .12s,opacity .12s}' +
    '#fm-dlg button:active{transform:scale(.97)}' +
    '#fm-dlg .fm-dlg-no{background:rgba(148,163,184,.28);color:#1e293b}' +
    '#fm-dlg .fm-dlg-ok{background:#2f55d4;color:#fff;box-shadow:0 6px 16px rgba(47,85,212,.35)}' +
    '#fm-dlg .fm-dlg-ok.bahaya{background:#e11d48;box-shadow:0 6px 16px rgba(225,29,72,.35)}' +
    'html[data-fm-invert="1"] #fm-dlg{filter:invert(1) hue-rotate(180deg)}' +
    '#fm-dlg button:focus-visible{outline:2px solid #0f172a;outline-offset:2px}';
  (document.head || document.documentElement).appendChild(css);

  var antre = [], tampil = false;
  function buka(item) {
    tampil = true;
    var o = item.opt || {};
    if (!item.info && !o.ok) { var m = String(item.msg || ''); if (/^(Hapus|Kosongkan)/i.test(m)) { o = { ok: 'Ya, Hapus', bahaya: true }; } else if (/^Keluar/i.test(m)) { o = { ok: 'Keluar', bahaya: true }; } else if (/Closing/i.test(m)) { o = { ok: 'Ya, Closing', judul: 'Closing' }; } else if (/cetak struk/i.test(m)) { o = { ok: 'Bayar & Cetak', judul: 'Konfirmasi Pembayaran' }; } }
    var el = document.createElement('div'); el.id = 'fm-dlg'; el.setAttribute('role', 'alertdialog'); el.setAttribute('aria-modal', 'true');
    var box = document.createElement('div'); box.className = 'fm-dlg-box';
    var h = document.createElement('h4'); h.textContent = o.judul || (item.info ? 'Pemberitahuan' : 'Konfirmasi');
    var p = document.createElement('p'); p.textContent = String(item.msg == null ? '' : item.msg);
    var row = document.createElement('div'); row.className = 'fm-dlg-row';
    var no = null, ok = document.createElement('button'); ok.type = 'button'; ok.className = 'fm-dlg-ok' + (o.bahaya ? ' bahaya' : ''); ok.textContent = o.ok || (item.info ? 'OK' : 'Ya, Lanjut');
    if (!item.info) { no = document.createElement('button'); no.type = 'button'; no.className = 'fm-dlg-no'; no.textContent = o.batal || 'Batal'; row.appendChild(no); }
    row.appendChild(ok); box.appendChild(h); box.appendChild(p); box.appendChild(row); el.appendChild(box);
    function tutup(v) {
      document.removeEventListener('keydown', kunci, true);
      if (el.parentNode) el.parentNode.removeChild(el);
      tampil = false; item.res(v);
      if (antre.length) buka(antre.shift());
    }
    function kunci(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); tutup(false); }
      else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); tutup(true); }
    }
    ok.onclick = function () { tutup(true); };
    if (no) no.onclick = function () { tutup(false); };
    el.addEventListener('mousedown', function (e) { if (e.target === el && !item.info) tutup(false); });
    document.addEventListener('keydown', kunci, true);
    document.body.appendChild(el);
    try { ok.focus(); } catch (x) {}
  }
  function masuk(item) { if (!document.body) { document.addEventListener('DOMContentLoaded', function () { masuk(item); }); return; } if (tampil) antre.push(item); else buka(item); }
  window.fmAsk = function (msg, opt) { return new Promise(function (res) { masuk({ msg: msg, opt: opt, res: res }); }); };
  window.alert = function (msg) { masuk({ msg: msg, info: true, res: function () {} }); };
  window.fmNativeAlert = nativeAlert;
})();
