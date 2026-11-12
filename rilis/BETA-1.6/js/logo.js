/* logo.js — logo Oneilverse: "Orbit N".
   Cincin orbit (huruf O) yang terbuka di satu sisi, planet emas di celahnya (verse = semesta),
   dan huruf N garis-tunggal di pusatnya. Satu sumber untuk semua halaman + favicon. */
(function () {
  'use strict';
  var seq = 0;
  function mark(px, o) {
    o = o || {};
    var k = 'lg' + (++seq);
    var tile = o.tile !== false;
    return '<svg viewBox="0 0 120 120" width="' + (px || 56) + '" height="' + (px || 56) + '" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Oneilverse" class="fm-logo-svg">' +
      '<defs>' +
      '<linearGradient id="' + k + 'bg" x1="10" y1="6" x2="110" y2="116" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1B2447"/><stop offset=".55" stop-color="#0C1230"/><stop offset="1" stop-color="#05081B"/></linearGradient>' +
      '<linearGradient id="' + k + 'g" x1="24" y1="22" x2="98" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFF3CF"/><stop offset=".35" stop-color="#F5D488"/><stop offset=".7" stop-color="#D6A23F"/><stop offset="1" stop-color="#A8731F"/></linearGradient>' +
      '<linearGradient id="' + k + 's" x1="46" y1="42" x2="74" y2="80" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C9D4F5"/></linearGradient>' +
      '<radialGradient id="' + k + 'p" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFFBEA"/><stop offset=".45" stop-color="#F7D77F"/><stop offset="1" stop-color="#C98A25"/></radialGradient>' +
      '<radialGradient id="' + k + 'glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#5B7CFF" stop-opacity=".45"/><stop offset="1" stop-color="#5B7CFF" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      (tile ? '<rect x="3" y="3" width="114" height="114" rx="30" fill="url(#' + k + 'bg)"/>' +
        '<rect x="3.75" y="3.75" width="112.5" height="112.5" rx="29.25" stroke="#FFFFFF" stroke-opacity=".16" stroke-width="1.5"/>' +
        '<circle cx="60" cy="60" r="46" fill="url(#' + k + 'glow)"/>' : '') +
      /* cincin orbit: busur terbuka dari -64° s/d -16° (celah untuk planet) */
      '<path d="M 92.3 49.5 A 34 34 0 1 1 75.96 29.98" transform="rotate(0 60 60)" stroke="url(#' + k + 'g)" stroke-width="5.5" stroke-linecap="round"/>' +
      /* N garis tunggal */
      '<path d="M46.5 77 V43 L73.5 77 V43" stroke="url(#' + k + 's)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      /* planet di celah orbit */
      '<circle cx="60" cy="60" r="27" stroke="#FFFFFF" stroke-opacity=".10" stroke-width="1"/>' +
      '<circle cx="86" cy="37.5" r="7.4" fill="url(#' + k + 'p)"/>' +
      '<path d="M29 88 l1.6 4.4 4.4 1.6 -4.4 1.6 -1.6 4.4 -1.6 -4.4 -4.4 -1.6 4.4 -1.6z" fill="#F5D488" fill-opacity=".9"/>' +
      '<circle cx="83.8" cy="35.3" r="2" fill="#FFFFFF" fill-opacity=".85"/>' +
      '</svg>';
  }
  function wordmark(cls) {
    return '<span class="fm-wordmark ' + (cls || '') + '">ONEILVERSE</span>';
  }
  function favicon() {
    try {
      var svg = mark(64).replace('class="fm-logo-svg"', '');
      var l = document.querySelector('link[rel~="icon"]');
      if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l); }
      l.type = 'image/svg+xml';
      l.href = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    } catch (e) {}
  }
  function apply() {
    /* 1) pemicu logo di login & kasir: ganti isi, pertahankan elemen pemicu (easter egg 7x) */
    var trig = document.getElementById('login-logo-trigger');
    if (trig && !trig.getAttribute('data-fm-logo-done')) {
      trig.setAttribute('data-fm-logo-done', '1');
      Array.prototype.slice.call(trig.children).forEach(function (c) { if (c.id !== 'login-logo-badge') c.remove(); });
      trig.insertAdjacentHTML('afterbegin', mark('100%'));
      trig.classList.add('fm-logo-wrap');
    }
    /* 2) logo kecil di header halaman lain */
    var hs = document.querySelectorAll('header svg[viewBox="0 0 100 100"]');
    Array.prototype.forEach.call(hs, function (sv) {
      var tileEl = sv.parentElement; if (!tileEl) return;
      var d = document.createElement('div');
      d.className = 'fm-logo-wrap shrink-0 w-12 h-12 sm:w-14 sm:h-14';
      d.innerHTML = mark('100%');
      tileEl.replaceWith(d);
    });
    /* 3) penampung deklaratif */
    Array.prototype.forEach.call(document.querySelectorAll('[data-fm-logo]'), function (el) {
      if (el.getAttribute('data-fm-logo-done')) return;
      el.setAttribute('data-fm-logo-done', '1');
      el.innerHTML = mark(el.getAttribute('data-fm-logo') || 56);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-fm-ver]'), function (el) { if (window.FM_RELEASES) el.textContent = 'v' + FM_RELEASES.version + ' (' + FM_RELEASES.beta + ')'; });
    favicon();
  }
  window.FM_LOGO = { mark: mark, wordmark: wordmark, apply: apply };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();
