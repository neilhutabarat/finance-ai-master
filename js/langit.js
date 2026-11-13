/* langit.js — latar belakang hidup.
   Gambar (1 dari 4) dipilih oleh js/theme.js (FM_WP.pick) sesuai pengaturan Tower. File ini mengolah gambar itu
   menurut keadaan NYATA di lokasi toko: jam terbit/terbenam matahari, tutupan awan, hujan, petir, kabut (Open-Meteo),
   lalu memasangnya sebagai latar halaman (--fm-wp). Malam cerah = cahaya bulan sesuai fase bulan.
   Gerakan (hujan/kilat) hanya jalan bila cuaca memang hujan, di layar lebar yang lancar. Data toko tidak disentuh. */
(function () {
  'use strict';
  var IS_TOWER = /provider/.test(location.pathname);
  var FILES = (window.FM_WP && FM_WP.files) || ['img/wp/1.jpg', 'img/wp/2.jpg', 'img/wp/3.jpg', 'img/wp/4.jpg'];
  /* batas bawah langit (pecahan tinggi gambar) untuk mencari area langit */
  var SKYMAX = [0.42, 0.50, 0.60, 0.53];
  var OUT_W = 1600;

  /* ---------- util ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function rnd(seed) { var a = seed % 2147483647; if (a <= 0) a += 2147483646; return function () { a = (a * 16807) % 2147483647; return (a - 1) / 2147483646; }; }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function fillC(x, W, H, col, a, op) { x.globalCompositeOperation = op || 'source-over'; x.globalAlpha = clamp(a, 0, 1); x.fillStyle = col; x.fillRect(0, 0, W, H); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }

  /* ---------- topeng langit (sekali per gambar) ---------- */
  var imgCache = {}, maskCache = {};
  function loadImg(idx) {
    if (imgCache[idx]) return imgCache[idx];
    imgCache[idx] = new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { delete imgCache[idx]; rej(new Error('gambar')); }; im.src = FILES[idx]; });
    return imgCache[idx];
  }
  function boxBlur(a, w, h, r) {
    var t = new Float32Array(a.length), o = new Float32Array(a.length), x, y, k, s, n;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) { s = 0; n = 0; for (k = -r; k <= r; k++) { var xx = x + k; if (xx >= 0 && xx < w) { s += a[y * w + xx]; n++; } } t[y * w + x] = s / n; }
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) { s = 0; n = 0; for (k = -r; k <= r; k++) { var yy = y + k; if (yy >= 0 && yy < h) { s += t[yy * w + x]; n++; } } o[y * w + x] = s / n; }
    return o;
  }
  function toMaskCanvas(arr, w, h) {
    var c = mk(w, h), x = c.getContext('2d'), d = x.createImageData(w, h);
    for (var i = 0; i < arr.length; i++) { d.data[i * 4 + 3] = clamp((arr[i] - 110) * 2.4, 0, 255);   /* tepi dipertegas ke dalam agar tidak menempel ke pohon/atap */ }
    x.putImageData(d, 0, 0); return c;
  }
  function skyLike(r, g, b) {
    if (b >= r + 10 && b >= g - 10) return true;                 // biru langit
    if (r > 178 && g > 178 && b > 178) return true;              // awan putih
    if (r > 150 && g > 165 && b > 180) return true;               // awan kebiruan / kabut
    return false;
  }
  function buildMask(img, idx) {
    if (maskCache[idx]) return maskCache[idx];
    var w = 400, h = Math.round(400 * img.height / img.width), c = mk(w, h), x = c.getContext('2d');
    x.drawImage(img, 0, 0, w, h);
    var d = x.getImageData(0, 0, w, h).data, maxY = Math.floor(SKYMAX[idx] * h);
    var all = new Float32Array(w * h), blue = new Float32Array(w * h);
    for (var cx = 0; cx < w; cx++) {
      var miss = 0;
      for (var cy = 0; cy < maxY; cy++) {
        var i = (cy * w + cx) * 4, r = d[i], g = d[i + 1], b = d[i + 2];
        if (skyLike(r, g, b)) {
          miss = 0; all[cy * w + cx] = 255;
          if (b > r + 22 && b >= g - 6 && !(r > 196 && g > 196)) blue[cy * w + cx] = 255;
        } else { miss++; if (miss >= 2) break; }
      }
    }
    var m = { all: toMaskCanvas(boxBlur(all, w, h, 2), w, h), blue: toMaskCanvas(boxBlur(blue, w, h, 2), w, h) };
    maskCache[idx] = m; return m;
  }

  /* ---------- tekstur awan mendung (sekali) ---------- */
  var cloudTex = null;
  function getCloudTex() {
    if (cloudTex) return cloudTex;
    var W = 800, H = 450, c = mk(W, H), x = c.getContext('2d'), r = rnd(77);
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgb(104,112,126)'); g.addColorStop(1, 'rgb(196,202,210)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (var i = 0; i < 170; i++) {
      var px = r() * W, py = r() * H, rad = 40 + r() * 120, tone = r() > .5 ? 238 : 92 + r() * 40, al = .08 + r() * .13;
      var rg = x.createRadialGradient(px, py, 0, px, py, rad); rg.addColorStop(0, 'rgba(' + tone + ',' + tone + ',' + (tone + 6) + ',' + al + ')'); rg.addColorStop(1, 'rgba(' + tone + ',' + tone + ',' + tone + ',0)');
      x.fillStyle = rg; x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    }
    cloudTex = c; return c;
  }

  /* ---------- gambar olahan ---------- */
  function layerSky(base, W, H, maskC, draw, a, op) {
    var t = mk(W, H), tx = t.getContext('2d'); draw(tx, W, H);
    tx.globalCompositeOperation = 'destination-in'; tx.drawImage(maskC, 0, 0, W, H);
    base.globalCompositeOperation = op || 'source-over'; base.globalAlpha = clamp(a, 0, 1); base.drawImage(t, 0, 0); base.globalAlpha = 1; base.globalCompositeOperation = 'source-over';
  }
  /* S: { n malam 0..1, w senja 0..1, c awan 0..1, r hujan 0..1, fog 0..1, sun {u,up}, moon {u,ph}, side 'rise'|'set', t waktu } */
  function paint(cv, img, idx, S) {
    var W = cv.width, H = cv.height, x = cv.getContext('2d'), M = buildMask(img, idx), sky = SKYMAX[idx] * H;
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    x.drawImage(img, 0, 0, W, H);
    var c = S.c, n = S.n, r = S.r;
    /* 1. awan mendung menutup langit */
    if (c > 0.18) {
      var tex = getCloudTex(), off = ((S.t || 0) / 90000) % 1;
      layerSky(x, W, H, M.all, function (tx, w, h) { tx.drawImage(tex, -off * w * .2, 0, w * 1.3, h * 1.1); }, smooth((c - .18) / .55) * .96);
    }
    /* 2. pudarkan warna + redupkan bila berawan/hujan */
    if (c > 0.05 || r > 0) {
      fillC(x, W, H, '#808080', c * .5 + r * .15, 'saturation');
      fillC(x, W, H, 'rgb(150,158,172)', c * .34 + r * .3, 'multiply');
    }
    /* 3. kabut */
    if (S.fog > 0) {
      var fg = x.createLinearGradient(0, 0, 0, H); fg.addColorStop(0, 'rgba(222,228,234,' + (S.fog * .5) + ')'); fg.addColorStop(1, 'rgba(222,228,234,' + (S.fog * .8) + ')');
      x.fillStyle = fg; x.fillRect(0, 0, W, H);
    }
    /* 4. matahari (siang, cuaca cerah) */
    if (S.sun && S.sun.up && c < .55 && n < .9) {
      var u = S.sun.u, sx = W * (.1 + .8 * u), sy = sky * .96 - Math.sin(Math.PI * u) * sky * .8, low = 1 - Math.sin(Math.PI * u), rad = H * (.028 + low * .006);
      var col = low > .55 ? 'rgb(255,168,92)' : low > .2 ? 'rgb(255,226,164)' : 'rgb(255,250,226)', vis = (1 - c * 1.6) * (1 - n);
      layerSky(x, W, H, M.all, function (tx) {
        var gl = tx.createRadialGradient(sx, sy, 0, sx, sy, H * .5); gl.addColorStop(0, 'rgba(255,214,150,' + (.5 * vis) + ')'); gl.addColorStop(1, 'rgba(255,200,130,0)');
        tx.fillStyle = gl; tx.fillRect(0, 0, W, H);
      }, 1, 'screen');
      layerSky(x, W, H, M.all, function (tx) { tx.fillStyle = col; tx.beginPath(); tx.arc(sx, sy, rad, 0, 7); tx.fill(); }, clamp(vis, 0, 1));
    }
    /* 5. cahaya senja / fajar */
    if (S.w > 0) {
      var w = S.w * (1 - c * .55);
      fillC(x, W, H, 'rgb(255,150,84)', w * .34, 'overlay');
      fillC(x, W, H, 'rgb(255,208,170)', w * .34, 'multiply');
      var gx = W * (S.side === 'rise' ? .14 : .86), gy = sky * 1.02, gr = x.createRadialGradient(gx, gy, 0, gx, gy, W * .62);
      gr.addColorStop(0, 'rgba(255,170,96,' + (w * .4) + ')'); gr.addColorStop(1, 'rgba(255,120,70,0)');
      x.globalCompositeOperation = 'screen'; x.fillStyle = gr; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
    }
    /* 6. malam */
    if (n > 0) {
      fillC(x, W, H, 'rgb(52,66,118)', n * .88, 'multiply');
      layerSky(x, W, H, M.all, function (tx, w, h) { tx.fillStyle = 'rgb(28,36,84)'; tx.fillRect(0, 0, w, h); }, n * .55, 'multiply');
      fillC(x, W, H, 'rgb(10,16,46)', n * .38, 'screen');
      var clear = clamp(1 - c * 1.3, 0, 1) * (1 - r);
      if (clear > .05) {
        var ph = S.moon ? S.moon.ph : .5, ill = .5 * (1 - Math.cos(2 * Math.PI * ph));
        /* bintang: hanya di langit biru, bukan di awan */
        layerSky(x, W, H, M.blue, function (tx, w, h) {
          var rr = rnd(9), i, N = Math.round(w * h / 5200);
          for (i = 0; i < N; i++) { var px = rr() * w, py = rr() * sky, b = .3 + rr() * .7, s = rr() > .93 ? 1.9 : 1.1; tx.fillStyle = 'rgba(255,255,255,' + b + ')'; tx.fillRect(px, py, s, s); }
        }, n * clear * (1 - ill * .55));
        /* bulan */
        if (S.moon) {
          var mu = S.moon.u, mx = W * (.12 + .76 * mu), my = sky * .96 - Math.sin(Math.PI * mu) * sky * .78, mr = H * .034;
          layerSky(x, W, H, M.all, function (tx) {
            var gl = tx.createRadialGradient(mx, my, 0, mx, my, H * .36); gl.addColorStop(0, 'rgba(190,210,255,' + (.5 * ill + .1) + ')'); gl.addColorStop(1, 'rgba(160,190,255,0)');
            tx.fillStyle = gl; tx.fillRect(0, 0, W, H);
            tx.fillStyle = 'rgb(236,241,255)'; tx.beginPath(); tx.arc(mx, my, mr, 0, 7); tx.fill();
            /* fase: bayangan sabit */
            var k = Math.cos(2 * Math.PI * ph);   // 1 baru .. -1 purnama
            if (k > -.9) { tx.globalCompositeOperation = 'destination-out'; tx.fillStyle = '#000'; tx.beginPath(); tx.arc(mx + (ph < .5 ? -1 : 1) * mr * (.4 + (k + 1) * .5), my, mr * 1.02, 0, 7); tx.fill(); tx.globalCompositeOperation = 'source-over'; }
          }, .22 + .78 * clear, 'screen');
        }
        /* cahaya bulan menerangi daratan sedikit */
        fillC(x, W, H, 'rgb(40,52,92)', n * clear * ill * .22, 'screen');
      }
    }
  }

  /* ---------- keadaan dari cuaca + jam ---------- */
  function parseLocal(str, offS) { var m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(str || ''); if (!m) return null; return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - offS * 1000; }
  function moonPhase(ms) { var syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14); var p = ((ms - ref) / 86400000 / syn) % 1; return p < 0 ? p + 1 : p; }
  /* fallback tanpa data: terbit 06.00, terbenam 18.00 waktu perangkat */
  function fallbackEvents(now) {
    var d = new Date(now), out = [];
    for (var k = -1; k <= 1; k++) { var b = new Date(d.getFullYear(), d.getMonth(), d.getDate() + k); out.push({ t: new Date(b.getFullYear(), b.getMonth(), b.getDate(), 6, 0).getTime(), k: 'rise' }, { t: new Date(b.getFullYear(), b.getMonth(), b.getDate(), 18, 0).getTime(), k: 'set' }); }
    return out;
  }
  function eventsOf(wx, now) {
    if (!wx || !wx.daily || !wx.daily.sunrise) return fallbackEvents(now);
    var off = wx.utc_offset_seconds || 0, ev = [];
    wx.daily.sunrise.forEach(function (s) { var t = parseLocal(s, off); if (t) ev.push({ t: t, k: 'rise' }); });
    wx.daily.sunset.forEach(function (s) { var t = parseLocal(s, off); if (t) ev.push({ t: t, k: 'set' }); });
    ev.sort(function (a, b) { return a.t - b.t; });
    return ev.length >= 2 ? ev : fallbackEvents(now);
  }
  function stateFrom(wx, now, over) {
    var ev = eventsOf(wx, now), prev = null, next = null, i;
    for (i = 0; i < ev.length; i++) { if (ev[i].t <= now) prev = ev[i]; else { next = ev[i]; break; } }
    if (!prev) prev = { t: now - 6 * 3600000, k: next && next.k === 'rise' ? 'set' : 'rise' };
    if (!next) next = { t: now + 6 * 3600000, k: prev.k === 'rise' ? 'set' : 'rise' };
    var up = prev.k === 'rise';                                       // sedang siang
    var dPrev = (now - prev.t) / 60000, dNext = (next.t - now) / 60000;
    /* malam: 1 sepenuhnya gelap; peralihan 15 mnt sebelum terbenam sampai 45 mnt sesudahnya, dan 45 mnt sebelum terbit sampai 15 mnt sesudahnya */
    var n;
    if (up) n = dNext < 15 ? smooth((15 - dNext) / 60) : (dPrev < 15 ? 1 - smooth((dPrev + 45) / 60) : 0);
    else n = dPrev < 45 ? smooth((dPrev + 15) / 60) : (dNext < 45 ? 1 - smooth((45 - dNext) / 60) : 1);
    var nearK = Math.abs(dPrev) < Math.abs(dNext) ? prev : next, dm = Math.min(Math.abs(dPrev), Math.abs(dNext));
    var w = Math.max(0, 1 - dm / 50);
    var cur = (wx && wx.current) || {}, code = Number(cur.weather_code) || 0, cloud = clamp((Number(cur.cloud_cover) || 0) / 100, 0, 1), pr = Number(cur.precipitation) || 0;
    var rain = 0, thunder = code >= 95, fog = (code === 45 || code === 48) ? .7 : 0;
    if (code >= 51 && code <= 57) rain = .28; else if (code >= 61 && code <= 65) rain = code === 61 ? .5 : code === 63 ? .72 : .95; else if (code === 66 || code === 67) rain = .6;
    else if (code >= 80 && code <= 82) rain = code === 80 ? .55 : code === 81 ? .78 : 1; else if (code >= 95) rain = .95; else if (code >= 71 && code <= 77) rain = 0;
    if (pr > 0) rain = Math.max(rain, clamp(pr / 4, .2, 1));
    if (code === 3) cloud = Math.max(cloud, .9); else if (code === 2) cloud = Math.max(cloud, .4);
    if (rain > 0 || thunder) cloud = Math.max(cloud, .88);
    if (fog) cloud = Math.max(cloud, .45);
    var S = {
      n: n, w: w, c: cloud, r: rain, fog: fog, thunder: thunder, side: nearK.k, t: now,
      sun: up ? { up: true, u: clamp((now - prev.t) / (next.t - prev.t), 0, 1) } : { up: false, u: 0 },
      moon: !up ? { u: clamp((now - prev.t) / (next.t - prev.t), 0, 1), ph: moonPhase(now) } : { u: .5, ph: moonPhase(now) }
    };
    if (over) for (var k in over) S[k] = over[k];
    return S;
  }
  function sig(idx, S) { return [idx, Math.round(S.n * 30), Math.round(S.w * 30), Math.round(S.c * 10), Math.round(S.r * 10), Math.round(S.fog * 10), Math.round((S.sun.u || 0) * 60), Math.round((S.moon.u || 0) * 60)].join('|'); }

  /* ---------- pratinjau (dipakai Tower) ---------- */
  var PRESETS = {
    siang: { n: 0, w: 0, c: 0, r: 0, fog: 0, side: 'set', sun: { up: true, u: .5 }, moon: { u: .5, ph: .5 } },
    fajar: { n: .1, w: 1, c: .1, r: 0, fog: 0, side: 'rise', sun: { up: true, u: .02 }, moon: { u: .95, ph: .5 } },
    senja: { n: .15, w: 1, c: .15, r: 0, fog: 0, side: 'set', sun: { up: true, u: .96 }, moon: { u: .02, ph: .5 } },
    malam: { n: 1, w: 0, c: 0, r: 0, fog: 0, side: 'set', sun: { up: false, u: 0 }, moon: { u: .4, ph: .45 } },
    malamawan: { n: 1, w: 0, c: .7, r: 0, fog: 0, side: 'set', sun: { up: false, u: 0 }, moon: { u: .4, ph: .45 } },
    mendung: { n: 0, w: 0, c: .95, r: 0, fog: 0, side: 'set', sun: { up: true, u: .5 }, moon: { u: .5, ph: .5 } },
    hujan: { n: 0, w: 0, c: .95, r: .8, fog: 0, side: 'set', sun: { up: true, u: .5 }, moon: { u: .5, ph: .5 } },
    petir: { n: .55, w: 0, c: .98, r: 1, fog: 0, thunder: true, side: 'set', sun: { up: false, u: 0 }, moon: { u: .4, ph: .5 } },
    kabut: { n: 0, w: 0, c: .6, r: 0, fog: .7, side: 'rise', sun: { up: true, u: .1 }, moon: { u: .5, ph: .5 } }
  };
  function renderTo(cv, idx, state) {
    var S = typeof state === 'string' ? PRESETS[state] : state; if (!S) S = PRESETS.siang; S.t = S.t || Date.now();
    return loadImg(idx).then(function (img) { cv.height = Math.round(cv.width * img.height / img.width); paint(cv, img, idx, S); return S; });
  }
  window.FM_LANGIT = { renderTo: renderTo, presets: Object.keys(PRESETS), stateFrom: stateFrom };
  if (IS_TOWER) return;

  /* ---------- lokasi & cuaca nyata ---------- */
  var WX_KEY = 'fm_lw_v1', geo = null, wx = null, wxAt = 0;
  function readGeo() { try { var g = JSON.parse(localStorage.getItem('fm_geo_v3') || 'null'); if (g && isFinite(g.lat) && isFinite(g.lon)) return g; } catch (e) {} return null; }
  function viaNet() {
    return fetch('https://ipwho.is/').then(function (r) { return r.json(); }).then(function (j) { if (!j || j.success === false || !j.latitude) throw 0; return { lat: j.latitude, lon: j.longitude, name: [j.city, j.region].filter(Boolean).join(', '), src: 'Jaringan' }; });
  }
  function ensureGeo(force) {
    var g = readGeo(); if (g && !force) { geo = g; return Promise.resolve(g); }
    if (window.FM_WIDGETS && FM_WIDGETS.loadWeather) { try { FM_WIDGETS.loadWeather(!!force); } catch (e) {} }
    return new Promise(function (res) {
      var done = false, fin = function (v) { if (done) return; done = true; if (v) { geo = v; } res(geo); };
      window.addEventListener('fm:geo', function once() { window.removeEventListener('fm:geo', once); fin(readGeo()); });
      setTimeout(function () { if (!done) viaNet().then(function (v) { try { v.t = Date.now(); localStorage.setItem('fm_geo_v3', JSON.stringify(v)); window.FM_GEO = v; } catch (e) {} fin(v); }).catch(function () { fin(readGeo()); }); }, window.FM_WIDGETS ? 6000 : 0);
    });
  }
  function fetchWx(force) {
    return ensureGeo(false).then(function (g) {
      if (!g) return null;
      var key = WX_KEY + '_' + g.lat.toFixed(2) + '_' + g.lon.toFixed(2), c = null;
      try { c = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
      if (c && !force && Date.now() - c.t < 15 * 60000) { wx = c.d; wxAt = c.t; return wx; }
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + g.lat + '&longitude=' + g.lon + '&current=weather_code,cloud_cover,precipitation&daily=sunrise,sunset&timezone=auto&past_days=1&forecast_days=2';
      return fetch(url).then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); }).then(function (j) {
        if (!j || !j.current || !j.daily) throw new Error('kosong');
        wx = j; wxAt = Date.now(); try { localStorage.setItem(key, JSON.stringify({ t: wxAt, d: j })); } catch (e) {} return j;
      }).catch(function () { if (c && Date.now() - c.t < 6 * 3600000) { wx = c.d; wxAt = c.t; return wx; } wx = null; return null; });
    });
  }

  /* ---------- konfigurasi dari Tower (app_meta/wallpaper, dibaca tanpa login) ---------- */
  var PID = 'finance-ai-master-byneilverse', AK = 'AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI';
  function fetchCfg() {
    var url = 'https://firestore.googleapis.com/v1/projects/' + PID + '/databases/(default)/documents/app_meta/wallpaper?key=' + AK;
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      var f = d && d.fields; if (!f || !f.json || !f.json.stringValue) return; var j = JSON.parse(f.json.stringValue);
      if (j && typeof j === 'object') localStorage.setItem('fm_wp_cfg', JSON.stringify(j));
    }).catch(function () {});
  }

  /* ---------- pemasangan ke halaman ---------- */
  var lastSig = '', busy = false, curUrl = null, out = null, S = null, idxNow = 0;
  function setBg(url) { document.documentElement.style.setProperty('--fm-wp', 'url("' + url + '")'); window.FM_LANGIT_ON = true; }
  function compute() { idxNow = FM_WP.pick(); S = stateFrom(wx, Date.now()); return S; }
  var again = false;
  function apply(force) {
    if (busy) { again = again || !!force; return; } compute(); var sg = sig(idxNow, S); if (!force && sg === lastSig) { syncFx(); return; }
    busy = true;
    loadImg(idxNow).then(function (img) {
      var W = OUT_W, H = Math.round(W * img.height / img.width);
      if (!out) out = mk(W, H); out.width = W; out.height = H;
      paint(out, img, idxNow, S);
      var done = function (url, small) {
        var old = curUrl; curUrl = url; setBg(url); lastSig = sg;
        if (old && old.indexOf('blob:') === 0) setTimeout(function () { try { URL.revokeObjectURL(old); } catch (e) {} }, 2000);
        try { var t = mk(480, Math.round(480 * H / W)); t.getContext('2d').drawImage(out, 0, 0, t.width, t.height); localStorage.setItem('fm_wp_last', JSON.stringify({ idx: idxNow, t: Date.now(), u: t.toDataURL('image/jpeg', .72) })); } catch (e) {}
        busy = false; syncFx(); if (again) { again = false; apply(true); }
      };
      if (out.toBlob) out.toBlob(function (b) { if (b) done(URL.createObjectURL(b)); else done(out.toDataURL('image/jpeg', .86)); }, 'image/jpeg', .86);
      else done(out.toDataURL('image/jpeg', .86));
    }).catch(function () { busy = false; again = false; });
  }

  /* ---------- gerakan: hujan & kilat (hanya saat benar-benar hujan) ---------- */
  var fx = null, fxCtx = null, drops = [], raf = 0, lastT = 0, flash = 0, nextFlash = 0, frames = 0, sumDt = 0, slow = false;
  function mode() { try { return (window.FM_THEME_PREF && FM_THEME_PREF().live) || 'auto'; } catch (e) { return 'auto'; } }
  function canAnimate() {
    var m = mode();
    if (m === 'off') return false;
    if (m === 'on') return true;
    if (slow) return false;
    try { if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return false; } catch (e) {}
    if ((window.innerWidth || 0) < 1024) return false;
    if (navigator.connection && navigator.connection.saveData) return false;
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 3) return false;
    if (navigator.deviceMemory && navigator.deviceMemory < 2) return false;
    try { if (sessionStorage.getItem('fm_live_slow')) return false; } catch (e) {}
    return true;
  }
  function stopFx() { if (raf) cancelAnimationFrame(raf); raf = 0; if (fx) { fx.remove(); fx = null; fxCtx = null; } drops = []; }
  function syncFx() {
    var want = S && (S.r > 0 || S.thunder) && canAnimate() && !document.hidden;
    if (!want) { stopFx(); return; }
    if (!fx) {
      fx = document.createElement('canvas'); fx.id = 'fm-fx'; fx.setAttribute('aria-hidden', 'true');
      fx.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:30';
      document.body.appendChild(fx); fxCtx = fx.getContext('2d'); sizeFx(); frames = 0; sumDt = 0; lastT = 0;
    }
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function sizeFx() {
    if (!fx) return; var dpr = 1, w = Math.ceil(window.innerWidth * dpr), h = Math.ceil(window.innerHeight * dpr); fx.width = w; fx.height = h;
    var N = Math.round((S ? S.r : .5) * Math.min(520, w * h / 4200)), r = rnd(5); drops = [];
    for (var i = 0; i < N; i++) drops.push({ x: r() * w, y: r() * h, l: 9 + r() * 16, v: 700 + r() * 600, a: .1 + r() * .16 });
  }
  function loop(ts) {
    raf = 0; if (!fx || !S) return;
    var dt = lastT ? Math.min(100, ts - lastT) : 16; if (lastT && dt < 30) { raf = requestAnimationFrame(loop); return; }
    lastT = ts; frames++; sumDt += dt;
    if (frames === 60 && mode() === 'auto' && sumDt / 60 > 48) { slow = true; try { sessionStorage.setItem('fm_live_slow', '1'); } catch (e) {} stopFx(); return; }
    var w = fx.width, h = fx.height, x = fxCtx, s = dt / 1000; x.clearRect(0, 0, w, h);
    x.strokeStyle = 'rgba(214,226,244,1)'; x.lineWidth = 1;
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i]; d.y += d.v * s; d.x -= d.v * s * .18; if (d.y > h) { d.y = -d.l; d.x = Math.random() * (w + 120); } if (d.x < -20) d.x = w + 10;
      x.globalAlpha = d.a; x.beginPath(); x.moveTo(d.x, d.y); x.lineTo(d.x - d.l * .18, d.y + d.l); x.stroke();
    }
    x.globalAlpha = 1;
    if (S.thunder) {
      if (!nextFlash) nextFlash = ts + 5000 + Math.random() * 9000;
      if (ts > nextFlash) { flash = 1; nextFlash = ts + 6000 + Math.random() * 12000; }
      if (flash > 0) { x.fillStyle = 'rgba(235,240,255,' + (flash * .22) + ')'; x.fillRect(0, 0, w, h); flash -= s * 3.2; }
    }
    raf = requestAnimationFrame(loop);
  }
  window.addEventListener('resize', function () { sizeFx(); syncFx(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { stopFx(); } else { fetchWx(false).then(function () { apply(false); }); } });
  window.addEventListener('fm:live', function () { slow = false; stopFx(); syncFx(); });
  window.addEventListener('fm:geo', function () { fetchWx(true).then(function () { apply(true); }); });
  window.addEventListener('fm:geo-refresh', function () { try { localStorage.removeItem('fm_geo_v3'); } catch (e) {} ensureGeo(true).then(function () { return fetchWx(true); }).then(function () { apply(true); }); });
  window.addEventListener('online', function () { fetchWx(true).then(function () { apply(false); }); });

  /* ---------- mulai ---------- */
  function boot() {
    if (!window.FM_WP) return;
    apply(true);                                  // langsung tampil dengan jam perangkat (tanpa menunggu jaringan)
    fetchCfg().then(function () { return fetchWx(false); }).then(function () { apply(true); });
    setInterval(function () { if (!document.hidden) apply(false); }, 60000);
    setInterval(function () { fetchCfg(); fetchWx(false).then(function () { apply(false); }); }, 15 * 60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.FM_LANGIT.state = function () { return S; };
  window.FM_LANGIT.apply = apply; window.FM_LANGIT.fetchWx = fetchWx;
})();
