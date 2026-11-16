/* logo.js — logo Oneilverse: huruf の (O) dengan ん (n) menyatu di garis tengahnya.
   Satu sumber untuk semua halaman + favicon. Paket Plus ditandai "+" miring di ujung nama. */
(function () {
  'use strict';
  var NO = "M33.7 9.1L32.3 9.2L30.9 9.3L29.5 9.4L28.1 9.6L26.7 9.9L25.3 10.3L24 10.7L22.6 11.2L21.3 11.8L19.9 12.5L18.6 13.3L17.4 14.1L16.2 15L15 16L13.9 17.1L12.8 18.2L11.8 19.3L10.9 20.5L10 21.8L9.2 23L8.6 24.3L8 25.7L7.4 27L7 28.4L6.6 29.8L6.3 31.2L6.2 32.6L6 34L6 35.3L6 36.7L6.2 38.1L6.4 39.4L6.7 40.8L7.1 42L7.6 43.2L8.2 44.4L8.9 45.5L9.8 46.5L10.7 47.3L11.6 48L12.7 48.6L13.8 49L15 49.3L16.2 49.4L17.4 49.2L18.6 49L19.7 48.5L20.9 47.9L22 47.1L23 46.3L24 45.3L25 44.2L25.9 43L26.7 41.8L27.5 40.5L28.2 39.2L28.9 37.8L29.5 36.5L30.1 35.1L30.6 33.7L31.1 32.3L31.5 30.9L31.9 29.6L32.3 28.2L32.6 26.9L32.9 25.6L33.1 24.4L33.2 23.3L33.2 22.3L33.2 21.4L33.1 20.7L32.9 20.1L32.6 19.7L32.2 19.5L31.8 19.5L31.3 19.7L30.8 20.1L30.3 20.6L29.8 21.4L29.2 22.3L28.8 23.3L28.3 24.4L27.8 25.6L27.3 26.9L26.9 28.1L26.4 29.5L25.9 30.8L25.4 32.1L24.9 33.5L24.3 34.8L23.6 36L22.9 37.2L22.2 38.3L21.4 39.3L20.5 40.1L19.6 40.9L18.6 41.4L17.6 41.7L16.6 41.9L15.7 41.8L14.8 41.6L13.9 41.1L13.1 40.5L12.4 39.7L11.8 38.7L11.4 37.7L11 36.5L10.8 35.3L10.7 34L10.7 32.7L10.9 31.4L11.1 30L11.4 28.7L11.9 27.4L12.4 26.1L13.1 24.8L13.8 23.6L14.6 22.5L15.5 21.4L16.5 20.4L17.6 19.5L18.7 18.7L19.9 18L21.1 17.4L22.4 16.8L23.7 16.4L25 16L26.4 15.8L27.8 15.6L29.1 15.4L30.5 15.3L31.9 15.3L33.3 15.3L34.7 15.3L36.1 15.4L37.5 15.6L38.8 15.8L40.2 16.2L41.5 16.6L42.8 17.1L44 17.7L45.2 18.5L46.3 19.3L47.3 20.3L48.3 21.3L49.1 22.4L49.9 23.6L50.6 24.8L51.1 26.1L51.6 27.4L51.9 28.8L52.1 30.2L52.2 31.5L52.2 32.9L52 34.3L51.8 35.6L51.4 37L51 38.3L50.4 39.6L49.7 40.9L48.9 42.1L48 43.3L47 44.5L46 45.5L44.9 46.5L43.8 47.5L42.6 48.4L41.5 49.2L40.4 50L39.4 50.8L38.5 51.4L37.7 52.1L37.1 52.6L36.7 53.2L36.5 53.6L36.5 54L36.7 54.4L37.1 54.6L37.7 54.8L38.5 54.9L39.5 54.8L40.5 54.7L41.6 54.4L42.9 54.1L44.1 53.6L45.3 53.1L46.6 52.4L47.8 51.7L49 50.8L50.1 49.9L51.2 48.9L52.2 47.8L53.2 46.7L54 45.5L54.8 44.2L55.5 42.9L56.1 41.6L56.6 40.3L57.1 38.9L57.4 37.5L57.7 36.2L57.9 34.8L58 33.4L58 32L57.9 30.6L57.8 29.2L57.6 27.8L57.3 26.4L56.9 25L56.4 23.7L55.9 22.4L55.2 21.1L54.5 19.8L53.7 18.6L52.9 17.4L51.9 16.3L50.8 15.2L49.7 14.2L48.6 13.4L47.3 12.6L46.1 11.9L44.8 11.2L43.4 10.7L42.1 10.3L40.7 9.9L39.3 9.6L37.9 9.4L36.5 9.2L35.1 9.2Z";
  var NN = "M29.5 12.2L29 12.4L28.6 12.7L28.1 13.1L27.6 13.6L27.1 14.1L26.6 14.8L26.1 15.4L25.6 16.1L25.1 16.9L24.7 17.6L24.2 18.4L23.8 19.2L23.3 20L22.9 20.8L22.5 21.6L22 22.4L21.6 23.2L21.2 24L20.7 24.8L20.3 25.6L19.9 26.4L19.5 27.2L19.1 28L18.6 28.8L18.2 29.6L17.8 30.4L17.4 31.2L17 32.1L16.6 32.9L16.2 33.7L15.8 34.5L15.4 35.3L15 36.1L14.6 37L14.2 37.8L13.8 38.6L13.4 39.4L13.1 40.2L12.7 41.1L12.3 41.9L12 42.7L11.6 43.5L11.3 44.3L11 45.1L10.8 45.9L10.5 46.7L10.4 47.4L10.3 48.1L10.3 48.8L10.3 49.4L10.5 49.9L10.7 50.4L10.9 50.7L11.3 50.9L11.6 50.9L12 50.9L12.4 50.7L12.9 50.4L13.3 50L13.7 49.5L14.1 48.9L14.5 48.2L14.9 47.5L15.3 46.8L15.7 46L16.1 45.3L16.6 44.5L17 43.7L17.4 42.9L17.9 42.1L18.4 41.4L18.9 40.6L19.4 39.9L19.9 39.2L20.5 38.5L21.1 37.9L21.8 37.4L22.5 36.8L23.1 36.4L23.9 36L24.6 35.6L25.3 35.4L26.1 35.3L26.8 35.2L27.4 35.3L28.1 35.4L28.7 35.7L29.3 36L29.8 36.5L30.2 37L30.6 37.7L30.9 38.4L31.2 39.1L31.5 39.9L31.7 40.8L31.9 41.6L32.1 42.5L32.3 43.4L32.5 44.3L32.7 45.2L33 46L33.3 46.8L33.7 47.6L34.1 48.4L34.5 49.1L35 49.8L35.6 50.4L36.2 50.9L36.9 51.4L37.6 51.8L38.3 52.2L39.1 52.4L39.8 52.6L40.6 52.7L41.5 52.7L42.3 52.6L43.1 52.5L43.9 52.2L44.7 52L45.5 51.6L46.2 51.2L47 50.8L47.7 50.3L48.4 49.8L49 49.2L49.6 48.7L50.2 48L50.8 47.4L51.3 46.7L51.8 46L52.2 45.3L52.6 44.5L52.9 43.8L53.1 43.1L53.3 42.4L53.4 41.8L53.4 41.2L53.4 40.7L53.3 40.2L53.1 39.9L52.8 39.7L52.5 39.6L52.2 39.6L51.8 39.8L51.4 40.1L51 40.5L50.6 40.9L50.2 41.5L49.7 42.1L49.2 42.7L48.7 43.4L48.2 44L47.6 44.6L47 45.2L46.3 45.8L45.7 46.3L45 46.7L44.3 47L43.5 47.3L42.8 47.5L42.1 47.6L41.4 47.6L40.7 47.4L40 47.2L39.5 46.9L38.9 46.4L38.4 45.9L38 45.3L37.7 44.6L37.4 43.8L37.1 43L36.9 42.2L36.8 41.3L36.6 40.4L36.5 39.5L36.3 38.6L36.2 37.7L36 36.8L35.8 36L35.5 35.1L35.2 34.3L34.9 33.6L34.5 32.9L34 32.2L33.5 31.6L32.9 31.1L32.3 30.6L31.6 30.1L31 29.7L30.3 29.3L29.7 28.9L29.1 28.4L28.6 28L28.1 27.5L27.8 27L27.5 26.4L27.3 25.8L27.2 25.1L27.3 24.4L27.4 23.7L27.5 23L27.8 22.2L28.1 21.4L28.4 20.7L28.7 19.9L29.1 19.1L29.5 18.3L29.9 17.5L30.2 16.8L30.5 16.1L30.7 15.4L30.9 14.7L31 14.1L31.1 13.5L31 13.1L30.9 12.7L30.6 12.4L30.3 12.2L29.9 12.2Z";
  function mark(px, o) {
    o = o || {};
    var tile = o.tile !== false;
    var fg = o.color || '#FFFFFF';
    return '<svg viewBox="0 0 120 120" width="' + (px || 56) + '" height="' + (px || 56) + '" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Oneilverse" class="fm-logo-svg">' +
      (tile ? '<rect x="3" y="3" width="114" height="114" rx="30" fill="#0E0F14"/><rect x="3.75" y="3.75" width="112.5" height="112.5" rx="29.25" stroke="#FFFFFF" stroke-opacity=".14" stroke-width="1.5"/>' : '') +
      '<g transform="translate(' + (tile ? '17 17' : '0 0') + ') scale(' + (tile ? '1.3125' : '1.875') + ')" fill="' + fg + '" fill-rule="evenodd">' +
      '<path d="' + NO + '"/>' +
      '<g transform="translate(35.5 33) rotate(-4) scale(.62) translate(-32 -32)"><path d="' + NN + '"/></g>' +
      '</g></svg>';
  }
  function plus(cls) {
    return '<span class="fm-plus ' + (cls || '') + '" aria-label="Plus" style="display:inline-block;transform:skewX(-14deg);font-weight:800;margin-left:1px">+</span>';
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
    Array.prototype.forEach.call(document.querySelectorAll('[data-fm-ver]'), function (el) { if (window.FM_RELEASES) el.textContent = /^BETA/.test(FM_RELEASES.beta) ? 'v' + FM_RELEASES.version + ' (' + FM_RELEASES.beta + ')' : FM_RELEASES.beta; });
    favicon();
  }
  window.FM_LOGO = { mark: mark, wordmark: wordmark, plus: plus, apply: apply };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();
