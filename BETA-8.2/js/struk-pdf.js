/* Struk -> PDF kecil (lebar kertas 80 mm, tinggi mengikuti isi) tanpa pustaka luar.
   Dibaca dari struk yang tampil di layar, lalu diunduh (atau dibagikan di HP, mis. ke WhatsApp / galeri). */
(function () {
  'use strict';
  var W = 226.8, MX = 12, FS = 8, CW = FS * 0.6, LH = 11.5, COLS = Math.floor((W - 2 * MX) / CW);

  function ascii(t) {
    t = String(t == null ? '' : t).replace(/\s+/g, ' ').trim();
    try { t = t.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {}
    return t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—−]/g, '-').replace(/×/g, 'x').replace(/[^\x20-\x7e]/g, '');
  }
  function esc(t) { return t.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  function txt(sel) { var e = document.querySelector(sel); return ascii(e ? e.textContent : ''); }
  function wrap(s, n) {
    var out = [], cur = '';
    s.split(' ').forEach(function (w) {
      while (w.length > n) { if (cur) { out.push(cur); cur = ''; } out.push(w.slice(0, n)); w = w.slice(n); }
      if (!cur) cur = w; else if ((cur + ' ' + w).length <= n) cur += ' ' + w; else { out.push(cur); cur = w; }
    });
    if (cur) out.push(cur);
    return out.length ? out : [''];
  }

  /* kumpulkan baris struk: {t:'teks', a:'c|l', b:true/false} */
  function collect() {
    var L = [];
    function c(t, b) { wrap(t, COLS).forEach(function (x) { L.push({ t: x, a: 'c', b: !!b }); }); }
    function lr(l, r, b) {
      l = ascii(l); r = ascii(r);
      var room = COLS - r.length - 1;
      if (room >= 8) {
        var parts = wrap(l, room);
        parts.forEach(function (p, i) {
          if (i < parts.length - 1) L.push({ t: p, a: 'l', b: b });
          else L.push({ t: p + new Array(Math.max(1, COLS - p.length - r.length + 1)).join(' ') + r, a: 'l', b: b });
        });
      } else { wrap(l, COLS).forEach(function (p) { L.push({ t: p, a: 'l', b: b }); }); L.push({ t: new Array(Math.max(1, COLS - r.length + 1)).join(' ') + r, a: 'l', b: b }); }
    }
    function line() { L.push({ t: new Array(COLS + 1).join('-'), a: 'l' }); }
    c(txt('#receipt-store-name').toUpperCase(), true);
    c(txt('#receipt-tenant-id')); c(txt('#receipt-date'));
    line();
    [].forEach.call(document.querySelectorAll('#receipt-items-list > div'), function (row) {
      var sp = row.querySelectorAll('span'); if (sp.length >= 2) lr(sp[0].textContent, sp[sp.length - 1].textContent, false);
    });
    line();
    lr(txt('#receipt-total-label'), txt('#receipt-total'), true);
    lr('Metode Bayar:', txt('#receipt-pay'), false);
    lr('Petugas:', txt('#receipt-staff'), false);
    line();
    c('Terima kasih atas pembayaran Anda.'); c('Simpan struk ini sebagai bukti sah.');
    return L;
  }

  function buildPDF(lines) {
    var H = Math.max(120, 2 * 14 + lines.length * LH + 6);
    var cs = ['BT', FS + ' TL'], y = H - 14 - FS;
    lines.forEach(function (ln, i) {
      var w = ln.t.length * CW, x = ln.a === 'c' ? Math.max(MX, (W - w) / 2) : MX;
      cs.push('/' + (ln.b ? 'F2' : 'F1') + ' ' + FS + ' Tf 1 0 0 1 ' + x.toFixed(2) + ' ' + (y - i * LH).toFixed(2) + ' Tm (' + esc(ln.t) + ') Tj');
    });
    cs.push('ET');
    var stream = cs.join('\n');
    var objs = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W.toFixed(2) + ' ' + H.toFixed(2) + '] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
      '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>'
    ];
    var out = '%PDF-1.4\n', offs = [];
    objs.forEach(function (o, i) { offs.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
    var xr = out.length;
    out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(function (o) { return ('0000000000' + o).slice(-10) + ' 00000 n \n'; }).join('');
    out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF';
    var u = new Uint8Array(out.length); for (var i = 0; i < out.length; i++) u[i] = out.charCodeAt(i) & 255;
    return new Blob([u], { type: 'application/pdf' });
  }

  function fname() {
    var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
    var s = txt('#receipt-store-name').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'toko';
    return 'struk-' + s + '-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + '.pdf';
  }

  window.FM_STRUK_PDF = {
    blob: function () { return buildPDF(collect()); },
    save: function () {
      var blob = buildPDF(collect()), name = fname();
      var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
      try {
        var f = new File([blob], name, { type: 'application/pdf' });
        if (mobile && navigator.canShare && navigator.canShare({ files: [f] })) {
          navigator.share({ files: [f], title: name }).catch(function (e) { if (e && e.name !== 'AbortError') dl(blob, name); });
          return;
        }
      } catch (e) {}
      dl(blob, name);
    }
  };
  function dl(blob, name) {
    var a = document.createElement('a'), u = URL.createObjectURL(blob);
    a.href = u; a.download = name; a.style.display = 'none'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(u); if (a.parentNode) a.parentNode.removeChild(a); }, 4000);
  }
})();
