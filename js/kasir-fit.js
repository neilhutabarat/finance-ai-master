/* kasir-fit.js — Kasir ON1: form "Input Transaksi" selalu muat di satu layar, tanpa gulir di dalam kartu.
   Hanya aktif di desktop (lebar >=1024 & tinggi >=540, sama dengan mode "pas satu layar" di skin.js).
   Cara kerja: bila isi kartu form lebih tinggi dari kartunya, isinya diperkecil sedikit (CSS zoom) sampai muat.
   Batas terkecil 0.58 supaya tetap terbaca; di bawah itu kartu tetap bisa digulir seperti semula. */
(function () {
  'use strict';
  if (!/kasir/i.test(location.pathname)) return;
  var MQ = '(min-width:1024px) and (min-height:540px)', MIN = 0.58, busy = false, t = null;
  function sec() { return document.querySelector('main>.grid:nth-child(2)>section:first-child'); }
  function kids(s) { return [].slice.call(s.children); }
  function setZ(s, z) { kids(s).forEach(function (c) { c.style.zoom = z >= 0.999 ? '' : String(z); }); }
  function fit() {
    if (busy) return; var s = sec(); if (!s) return;
    if (!document.documentElement.hasAttribute('data-fm-fit') || !window.matchMedia(MQ).matches) { setZ(s, 1); s.style.overflow = ''; return; }
    busy = true;
    try {
      var z = 1; setZ(s, 1);
      for (var i = 0; i < 6; i++) {
        var over = s.scrollHeight - s.clientHeight;
        if (over <= 1) break;
        var cs = getComputedStyle(s), pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
        var content = s.scrollHeight - pad, avail = s.clientHeight - pad;
        z = Math.max(MIN, z * (avail / content) - 0.005);
        setZ(s, z);
        if (z <= MIN) break;
      }
      s.style.overflow = (s.scrollHeight - s.clientHeight <= 1) ? 'hidden' : '';
    } finally { busy = false; }
  }
  function later() { clearTimeout(t); t = setTimeout(fit, 120); }
  window.addEventListener('resize', later);
  window.addEventListener('load', function () { later(); setTimeout(fit, 1200); setTimeout(fit, 3500); });
  /* isi form berubah (pilih akun/produk, muncul kolom jumlah/pajak/bank): hitung ulang */
  function watch() {
    var s = sec(); if (!s) return setTimeout(watch, 800);
    new MutationObserver(function (m) { if (!busy) later(); }).observe(s, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
  }
  watch();
})();
