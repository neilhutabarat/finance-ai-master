/* kasir-fit.js — Kasir ON1: form "Input Transaksi" selalu muat di satu layar, tanpa gulir di dalam kartu.
   Hanya aktif di desktop (lebar >=1024 & tinggi >=540, sama dengan mode "pas satu layar" di skin.js).
   Langkah 1: CSS memadatkan form (4 kolom, kontrol kecil, kartu produk 1 baris). Langkah 2 (cadangan): bila isi kartu form lebih tinggi dari kartunya, isinya diperkecil sedikit (CSS zoom) sampai muat.
   Batas terkecil 0.78 supaya tetap terbaca; di bawah itu kartu tetap bisa digulir seperti semula. */
(function () {
  'use strict';
  if (!/kasir/i.test(location.pathname)) return;

  /* ---- Pemadatan form (desktop): rapatkan ruang, bukan sekadar mengecilkan ---- */
  var S = 'html[data-fm-page="kasir"][data-fm-fit] body main>.grid:nth-child(2)>section:first-child', C = S + '>div.space-y-3\\.5';
  var CSS = '@media (min-width:1024px) and (min-height:540px){' +
    'html[data-fm-page="kasir"][data-fm-fit] body main>.grid:nth-child(2)>section.lg\\:col-span-5{grid-column:span 7/span 7!important;container-type:inline-size;container-name:kform}' +
    'html[data-fm-page="kasir"][data-fm-fit] body main>.grid:nth-child(2)>section.lg\\:col-span-7{grid-column:span 5/span 5!important;container-type:inline-size;container-name:kdraft}' +
    S + '{padding:8px 12px!important;gap:5px!important;display:flex!important;flex-direction:column!important}' +
    S + '>*{margin:0!important}' +
    S + '>.border-b{padding:0!important;min-height:0!important}' +
    S + ' #form-title{font-size:12px!important}' +
    S + '>div.grid{gap:5px 8px!important;grid-template-columns:1fr 1fr!important}' +
    S + ' label{font-size:10px!important;line-height:1.1!important;margin-bottom:1px!important}' +
    S + ' input:not([type=checkbox]):not([type=radio]):not([type=file]),' + S + ' select{padding:4px 8px!important;font-size:12px!important;min-height:0!important;border-radius:10px!important;line-height:1.2!important}' +
    S + '>div.grid button{padding:5px 6px!important;font-size:11px!important;border-radius:10px!important}' +
    C + '{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:5px 8px!important;align-items:start!important}' +
    C + '>*{margin:0!important;grid-column:span 1}' +
    C + '>#barcode-block,' + C + '>#barcode-locked,' + C + '>#product-grid-wrap,' + C + '>#btn-save-draft{grid-column:1/-1!important}' +
    C + '>div:has(>#tx-account),' + C + '>#tx-qty-wrap{grid-column:span 2!important}' +
    C + '>#tx-qty2-wrap{grid-column:span 2!important}' +
    C + '>div:has(>#tx-amount){grid-column:span 2!important}' +
    C + '>div:has(>#tx-desc){grid-column:span 3!important}' +
    C + '>div:has(>#pay-method){grid-column:1/-1!important}' +
    C + ' #tx-cat-badge{margin-top:2px!important;padding:1px 6px!important;font-size:10px!important;border-radius:8px!important}' +
    C + ' #tx-qty-wrap>.flex:first-child,' + C + ' #tx-qty2-wrap>label{margin-bottom:1px!important}' +
    C + ' #tx-qty-wrap button[onclick^="changeQty"],' + C + ' #tx-qty2-wrap button[onclick^="changeQty2"]{width:26px!important;height:26px!important;font-size:15px!important;border-radius:9px!important;padding:0!important;flex:none!important}' +
    C + ' #tx-qty,' + C + ' #tx-qty2{font-size:13px!important;padding:3px 4px!important;min-width:0!important}' +
    C + ' #tx-price2{margin-top:3px!important}' +
    C + ' #tx-stock-hint{font-size:9px!important;padding:0 6px!important}' +
    C + ' #tx-disc-wrap{margin-top:3px!important}' +
    C + ' #tx-amount{font-size:15px!important;padding:4px 8px!important;line-height:1.2!important}' +
    C + '>div:has(>#tx-amount)>div:first-child>span{display:none!important}' +
    C + ' #tx-lock-note{font-size:9px!important;margin:0 0 1px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:100%!important}' +
    C + ' #pajak-preview-box{margin-top:3px!important;padding:4px 8px!important;font-size:10px!important}' +
    C + ' #pay-bank-extra{margin-top:3px!important}' +
    C + ' #btn-save-draft{padding-top:6px!important;padding-bottom:6px!important;font-size:12px!important;border-radius:12px!important}' +
    C + ' #product-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:4px!important;max-height:50px!important;overflow-y:auto!important;scrollbar-width:none!important}' +
    C + ' #product-grid::-webkit-scrollbar{display:none!important}' +
    C + ' #product-grid>button{padding:3px 6px!important;border-width:1px!important;border-radius:9px!important;height:46px!important;overflow:hidden!important}' +
    C + ' #product-grid>button>div:first-child>div:first-child{width:24px!important;height:24px!important;font-size:11px!important;border-radius:7px!important}' +
    C + ' #product-grid>button>div:first-child{gap:5px!important}' +
    C + ' #product-grid>button>div:first-child .truncate{font-size:10px!important;line-height:1.1!important}' +
    C + ' #product-grid>button>div:first-child .font-mono{font-size:9.5px!important;line-height:1.1!important}' +
    C + ' #product-grid>button>div:last-child:not(:first-child){display:none!important}' +
    C + ' #product-grid-wrap>.flex{margin-bottom:2px!important}' +
    C + ' #product-grid-search{width:130px!important;padding:2px 8px!important;font-size:11px!important}' +

    /* kolom kiri sempit -> 4 kolom berpasangan, tidak ada yang bertabrakan */
    '@container kform (max-width:700px){' +
      C + '{grid-template-columns:repeat(4,minmax(0,1fr))!important}' +
      C + '>div:has(>#tx-account),' + C + '>#tx-qty-wrap,' + C + '>#tx-qty2-wrap,' + C + '>div:has(>#tx-amount),' + C + '>div:has(>#tx-desc),' + C + '>div:has(>#tx-staff){grid-column:span 2!important}' +
      C + '>div:has(>#pay-method){grid-column:1/-1!important}' +
      C + ' #product-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}' +
    '}' +

    /* Metode Bayar dinamis: pilihan Bank/QRIS/rekening berjajar sejajar, bukan menumpuk ke bawah (tidak ada ruang kosong) */
    C + '>div:has(>#pay-method){display:flex!important;flex-wrap:wrap!important;gap:3px 8px!important;align-items:flex-start!important}' +
    C + '>div:has(>#pay-method)>label{flex:1 0 100%!important}' +
    C + '>div:has(>#pay-method)>select,' + C + '>div:has(>#pay-method) #pay-sub,' + C + '>div:has(>#pay-method) #pay-bank-acc{flex:1 1 120px!important;min-width:0!important;width:auto!important}' +
    C + '>div:has(>#pay-method)>#pay-bank-extra:not(.hidden){display:contents!important;margin:0!important}' +
    C + '>div:has(>#pay-method) #pay-bank-warn{flex:1 0 100%!important}' +
    C + ':has(#pay-bank-extra:not(.hidden))>div:has(>#pay-method){grid-column:1/-1!important}' +
    '@container kform (min-width:701px){' +
      C + ':has(#pay-bank-extra:not(.hidden))>div:has(>#tx-desc){grid-column:span 4!important}' +
      C + ':has(#pay-bank-extra:not(.hidden))>div:has(>#tx-staff){grid-column:span 2!important}' +
    '}' +
    C + ' #pay-bank-warn{font-size:9px!important;line-height:1.2!important;margin:0!important}' +
    C + ' #tx-lock-note{white-space:nowrap!important}' +
    /* kolom kanan: isi ikut menyusut mengikuti lebarnya, tidak pernah terpotong */
    '@container kdraft (max-width:620px){' +
      'html[data-fm-page="kasir"][data-fm-fit] body #draft-count-badge{white-space:nowrap!important;flex:none!important;font-size:9.5px!important;padding:2px 8px!important}' +
      'html[data-fm-page="kasir"][data-fm-fit] body section.lg\\:col-span-7>div:first-child>div:first-child{gap:8px!important;flex-wrap:nowrap!important}' +
      'html[data-fm-page="kasir"][data-fm-fit] body section.lg\\:col-span-7>div:first-child>div:first-child span.uppercase{font-size:10px!important;letter-spacing:0!important;line-height:1.15!important}' +
      'html[data-fm-page="kasir"][data-fm-fit] body section.lg\\:col-span-7>div:first-child>div:last-child{flex-direction:row!important;gap:10px!important;align-items:center!important}' +
      'html[data-fm-page="kasir"][data-fm-fit] body #btn-finalize{white-space:nowrap!important;padding:9px 14px!important;font-size:12px!important;width:auto!important;flex:none!important}' +
      'html[data-fm-page="kasir"][data-fm-fit] body #draft-total-amount{font-size:17px!important;white-space:nowrap!important}' +
      'html[data-fm-page="kasir"][data-fm-fit] body section.lg\\:col-span-7>.grid-cols-3{gap:8px!important}' +
      'html[data-fm-page="kasir"][data-fm-fit] body section.lg\\:col-span-7>.grid-cols-3>div{padding:8px 6px!important;min-width:0!important}' +
      'html[data-fm-page="kasir"][data-fm-fit] body section.lg\\:col-span-7>.grid-cols-3>div>span:first-child{font-size:9px!important;letter-spacing:0!important;white-space:nowrap!important}' +
      'html[data-fm-page="kasir"][data-fm-fit] body #kas-total-in,html[data-fm-page="kasir"][data-fm-fit] body #kas-total-out,html[data-fm-page="kasir"][data-fm-fit] body #kas-net{font-size:clamp(11px,3.3cqw,19px)!important;white-space:nowrap!important;display:block!important}' +
    '}' +
  '}';
  (function () { var st = document.createElement('style'); st.id = 'fm-kcompact'; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); })();
  var MQ = '(min-width:1024px) and (min-height:540px)', MIN = 0.78, busy = false, t = null;
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
