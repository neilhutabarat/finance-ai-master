/* devmode.js — Manager & Owner: mode Ponsel (tampilan HP) atau Desktop. Mode Ponsel membuka halaman yang sama
   di dalam bingkai selebar HP (phone.html) sehingga tata letak HP berlaku walau dibuka dari desktop. Hanya preferensi lokal perangkat. */
(function () {
  'use strict';
  var K = 'fm_dev';
  function mode() { try { return localStorage.getItem(K) === 'phone' ? 'phone' : 'desktop'; } catch (e) { return 'desktop'; } }
  var inFrame = false; try { inFrame = window.top !== window; } catch (e) { inFrame = true; }
  var rel = location.pathname.split('/').pop() + location.search + location.hash;
  window.FM_DEVMODE = {
    inFrame: inFrame,
    mode: mode,
    canSwitch: function () { return inFrame || window.innerWidth > 700; },
    toggle: function () {
      try { localStorage.setItem(K, inFrame ? 'desktop' : 'phone'); } catch (e) {}
      try {
        if (inFrame) window.top.location.replace(rel); else location.replace('phone.html?u=' + encodeURIComponent(rel));
      } catch (e) { location.reload(); }
    }
  };
  if (!inFrame && mode() === 'phone' && window.innerWidth > 700) {
    location.replace('phone.html?u=' + encodeURIComponent(rel));
  }
})();
