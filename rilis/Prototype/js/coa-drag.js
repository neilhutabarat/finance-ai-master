/* Pindah urutan akun COA dengan klik dan seret (mouse maupun sentuh) pada tabel #coa-table-body.
   Pegangan ".coa-h" di tiap baris; saat dilepas, urutan disimpan lewat STORE.reorderCOA. */
(function () {
  'use strict';
  var drag = null;
  function rowOf(el) { while (el && el.tagName !== 'TR') el = el.parentNode; return el; }
  document.addEventListener('pointerdown', function (e) {
    var h = e.target.closest && e.target.closest('.coa-h'); if (!h) return;
    var tr = rowOf(h); if (!tr || !tr.dataset.coa) return;
    e.preventDefault();
    drag = { tr: tr, code: tr.dataset.coa, over: null };
    tr.style.opacity = '.55'; h.style.cursor = 'grabbing';
    try { h.setPointerCapture(e.pointerId); } catch (x) {}
  });
  document.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var el = document.elementFromPoint(e.clientX, e.clientY), tr = rowOf(el);
    [].forEach.call(document.querySelectorAll('#coa-table-body tr'), function (r) { r.style.boxShadow = ''; });
    drag.over = null;
    if (tr && tr.dataset && tr.dataset.coa && tr.parentNode === drag.tr.parentNode && tr !== drag.tr) {
      drag.over = tr; tr.style.boxShadow = 'inset 0 3px 0 #2f55d4';
    }
  });
  function end() {
    if (!drag) return;
    var d = drag; drag = null;
    d.tr.style.opacity = '';
    [].forEach.call(document.querySelectorAll('#coa-table-body tr'), function (r) { r.style.boxShadow = ''; });
    if (d.over && window.STORE) {
      Promise.resolve(STORE.reorderCOA(d.code, d.over.dataset.coa)).then(function () { if (typeof renderCOATable === 'function') renderCOATable(); });
    }
  }
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
})();
