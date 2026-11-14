/* widgets.js — Kurs & Emas (dibaca dari Firestore provider_settings/rates, diisi/disegarkan manual dari Tower)
   dan Cuaca (Open-Meteo, langsung dari browser, di-cache 3 jam; tidak memakai kuota Firestore). */
(function () {
    var CURS = [
    ['USD', 'Dolar Amerika', 'US$'], ['EUR', 'Euro', '€'], ['GBP', 'Poundsterling', '£'], ['JPY', 'Yen Jepang', '¥'],
    ['SAR', 'Riyal Arab Saudi', 'SR'], ['SGD', 'Dolar Singapura', 'S$'], ['CNY', 'Yuan China', 'CN¥']
  ];
  var rates = null;
  var SLOT_MS = 12 * 3600 * 1000, WIB = 7 * 3600 * 1000;
  function slotOf(ms) { return Math.floor((ms + WIB) / SLOT_MS); }          // berganti tiap 00.00 dan 12.00 WIB
  function slotStartMs(slot) { return slot * SLOT_MS - WIB; }

  // Ambil kurs dari internet dan simpan untuk semua toko. force=true (tombol Tower) mengabaikan kunci jadwal.
  function refreshRates(force) {
    if (!(typeof db !== 'undefined' && db)) return Promise.reject(new Error('Belum terhubung ke server.'));
    var ref = db.collection('provider_settings').doc('rates'), slot = slotOf(Date.now());
    var claim = force ? Promise.resolve(true) : db.runTransaction(function (tx) {
      return tx.get(ref).then(function (s) {
        var d = s.exists ? s.data() : null;
        if (d && d.slot >= slot) return false;                                     // slot ini sudah dikerjakan
        if (d && d.lock && d.lock.slot === slot && Date.now() - d.lock.at < 120000) return false;   // perangkat lain sedang mengerjakan
        tx.set(ref, { lock: { slot: slot, at: Date.now() } }, { merge: true });
        return true;
      });
    });
    return claim.then(function (ok) {
      if (!ok) return false;
      return fetch('https://open.er-api.com/v6/latest/USD').then(function (r) { return r.json(); }).then(function (j) {
        if (!j || !j.rates || !j.rates.IDR) throw new Error('data sumber kosong');
        var out = {};
        CURS.forEach(function (c) { var k = c[0]; if (k === 'USD') out[k] = j.rates.IDR; else if (j.rates[k]) out[k] = j.rates.IDR / j.rates[k]; });
        Object.keys(out).forEach(function (k) { out[k] = Math.round(out[k] * 100) / 100; });
        return ref.set({ rates: out, updatedAt: Date.now(), slot: slot, source: 'open.er-api.com', sourceUpdatedAt: (j.time_last_update_unix || 0) * 1000, lock: firebase.firestore.FieldValue.delete() }, { merge: true }).then(function () { return true; });
      }).catch(function (e) {
        if (!force) ref.set({ lock: firebase.firestore.FieldValue.delete() }, { merge: true }).catch(function () {});
        throw e;
      });
    });
  }
  function maybeRefreshRates(doc) {
    if (maybeRefreshRates._busy) return;
    if (doc && doc.slot >= slotOf(Date.now())) return;
    maybeRefreshRates._busy = true;
    refreshRates(false).catch(function () {}).then(function () { setTimeout(function () { maybeRefreshRates._busy = false; }, 60000); });
  }

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function idr(n, dec) { return Number(n).toLocaleString('id-ID', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }); }
  function when(ms) {
    if (!ms) return '-';
    var d = new Date(ms);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  // ---------- modal bawaan widget (satu gaya untuk semua halaman) ----------
  function ensureModal(id, title) {
    var m = document.getElementById(id);
    if (m) return m;
    m = document.createElement('div');
    m.id = id;
    m.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482000;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:16px;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif;';
    m.innerHTML = '<div style="width:100%;max-width:400px;max-height:88vh;overflow:auto;background:#0b0f19;color:#e5e7eb;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:20px;box-shadow:0 24px 60px rgba(0,0,0,.6)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><b style="font-size:14px">' + esc(title) + '</b>' +
      '<button data-x style="width:30px;height:30px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:#fff;font-size:16px;cursor:pointer">✕</button></div>' +
      '<div data-body></div></div>';
    m.addEventListener('click', function (e) { if (e.target === m || e.target.hasAttribute('data-x')) m.style.display = 'none'; });
    document.body.appendChild(m);
    return m;
  }
  /* Pop-up cuaca dan kurs memakai kaca terang yang sama dengan pop-up lain; di desktop kartu disusun 4 kolom agar muat tanpa scroll */
  (function () {
    var M = '#w-modal-weather,#w-modal-kurs', P = '#w-modal-weather>div,#w-modal-kurs>div';
    var c = M.split(',').map(function (x) { return x; });
    var pn = P.split(',').map(function (x) { return x; });
    var t = [
      c.join(',') + '{background:rgba(15,23,42,.28)!important;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}',
      pn.join(',') + '{max-width:min(760px,96vw)!important;max-height:96vh!important;padding:16px 20px!important;background:linear-gradient(160deg,rgba(255,255,255,.9),rgba(255,255,255,.78) 55%,rgba(255,255,255,.86))!important;color:#0f172a!important;border:1px solid rgba(255,255,255,.85)!important;box-shadow:0 24px 60px -20px rgba(15,23,42,.45),inset 0 1px 0 rgba(255,255,255,.95)!important;backdrop-filter:blur(14px) saturate(1.2);-webkit-backdrop-filter:blur(14px) saturate(1.2)}',
      pn.map(function (x) { return x + ' [data-x]'; }).join(',') + '{background:rgba(15,23,42,.08)!important;color:#0f172a!important}',
      pn.map(function (x) { return x + ' *[style*="color:#94a3b8"]'; }).join(',') + '{color:#475569!important}',
      pn.map(function (x) { return x + ' *[style*="color:#64748b"]'; }).join(',') + '{color:#475569!important}',
      pn.map(function (x) { return x + ' *[style*="color:#67e8f9"]'; }).join(',') + '{color:#0369a1!important}',
      pn.map(function (x) { return x + ' *[style*="color:#fbbf24"]'; }).join(',') + '{color:#b45309!important}',
      pn.map(function (x) { return x + ' [style*="background:rgba(255,255,255,.06)"]'; }).join(',') + '{background:rgba(255,255,255,.62)!important;border-color:rgba(15,23,42,.1)!important}',
      pn.map(function (x) { return x + ' [style*="border-top:1px solid rgba(255,255,255,.1)"]'; }).join(',') + '{border-top-color:rgba(15,23,42,.12)!important}',
      pn.map(function (x) { return x + ' [data-gps]'; }).join(',') + '{background:rgba(15,23,42,.06)!important;border-color:rgba(15,23,42,.2)!important;color:#0f172a!important}',
      '@media(min-width:700px){' + pn.map(function (x) { return x + ' [style*="grid-template-columns:1fr 1fr"]'; }).join(',') + '{grid-template-columns:repeat(4,1fr)!important}}'
    ].join('\n');
    var st = document.createElement('style'); st.id = 'w-modal-css'; st.textContent = t; (document.head || document.documentElement).appendChild(st);
  })();
  function showModal(m) { m.style.display = 'flex'; }

  // ---------- KURS & EMAS ----------
  function renderKurs() {
    var txt = document.getElementById('kurs-text');
    if (txt) {
      if (rates && rates.rates && rates.rates.USD) {
        var g = rates.gold ? ' | Emas ' + (rates.gold / 1e6).toFixed(2).replace('.', ',') + ' jt/g' : '';
        txt.innerText = 'USD ' + idr(rates.rates.USD) + g;
      } else txt.innerText = 'Kurs: belum tersedia';
    }
    var m = ensureModal('w-modal-kurs', 'Kurs & Emas');
    var b = m.querySelector('[data-body]');
    if (!rates || !rates.rates) { b.innerHTML = '<p style="font-size:12px;color:#94a3b8">Data kurs belum diisi oleh penyedia aplikasi.</p>'; return; }
    var row = function (l, sub, v, hl) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:11px 13px;margin-bottom:8px;border-radius:16px;background:' + (hl ? 'rgba(245,158,11,.14)' : 'rgba(255,255,255,.06)') + ';border:1px solid ' + (hl ? 'rgba(245,158,11,.45)' : 'rgba(255,255,255,.08)') + '">' +
        '<div><b style="font-size:13px;display:block">' + l + '</b><span style="font-size:10px;color:#94a3b8">' + sub + '</span></div>' +
        '<b style="font-family:ui-monospace,Menlo,monospace;font-size:13px;color:' + (hl ? '#fbbf24' : '#fff') + '">' + v + '</b></div>';
    };
    var h = '';
    if (rates.gold) h += row('Emas Antam', 'Harga per gram', 'Rp ' + idr(rates.gold), true);
    CURS.forEach(function (c) {
      var v = rates.rates[c[0]];
      if (v) h += row(c[0] + ' · ' + c[1], 'per 1 ' + c[0], 'Rp ' + idr(v, v < 1000 ? 2 : 0));
    });
    var nextMs = slotStartMs(slotOf(Date.now()) + 1);
    h += '<p style="font-size:10px;color:#64748b;margin-top:10px;line-height:1.55">Kurs disegarkan ' + when(rates.updatedAt) + (rates.sourceUpdatedAt ? ' · data sumber per ' + when(rates.sourceUpdatedAt) : '') + '. Pembaruan otomatis berikutnya sekitar ' + when(nextMs) + ' WIB (tiap 00.00 dan 12.00). Sebagai acuan; harga transaksi mengikuti penyedia masing-masing.</p>';
    b.innerHTML = h;
  }

  function startRates() {
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (typeof db !== 'undefined' && db) {
        clearInterval(t);
        db.collection('provider_settings').doc('rates').onSnapshot(function (snap) {
          rates = snap.exists ? snap.data() : null;
          renderKurs();
          maybeRefreshRates(rates);
        }, function () {});
      } else if (tries > 30) { clearInterval(t); ratesViaRest(); }   // halaman tanpa Firebase (mis. partner): baca lewat REST
    }, 100);
  }
  function ratesViaRest() {
    try {
      var x = new XMLHttpRequest();
      x.open('GET', 'https://firestore.googleapis.com/v1/projects/finance-ai-master-byneilverse/databases/(default)/documents/provider_settings/rates?key=AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI', true);
      x.onload = function () {
        if (x.status !== 200) return;
        try {
          var f = JSON.parse(x.responseText).fields || {};
          var n = function (v) { return v ? Number(v.doubleValue !== undefined ? v.doubleValue : v.integerValue) : 0; };
          var r = {}, mf = (f.rates && f.rates.mapValue && f.rates.mapValue.fields) || {};
          Object.keys(mf).forEach(function (k) { r[k] = n(mf[k]); });
          rates = { rates: r, gold: n(f.gold), updatedAt: n(f.updatedAt) };
          renderKurs();
        } catch (e) {}
      };
      x.send();
    } catch (e) {}
  }

  // ---------- CUACA ----------
  var WMO = {
    0: ['Cerah', '☀️'], 1: ['Cerah Berawan', '🌤️'], 2: ['Berawan Sebagian', '⛅'], 3: ['Mendung', '☁️'],
    45: ['Berkabut', '🌫️'], 48: ['Kabut Beku', '🌫️'], 51: ['Gerimis Ringan', '🌦️'], 53: ['Gerimis', '🌦️'], 55: ['Gerimis Lebat', '🌧️'],
    61: ['Hujan Ringan', '🌦️'], 63: ['Hujan Sedang', '🌧️'], 65: ['Hujan Lebat', '🌧️'], 80: ['Hujan Lokal Ringan', '🌦️'], 81: ['Hujan Lokal', '🌧️'], 82: ['Hujan Lokal Deras', '⛈️'],
    95: ['Badai Petir', '⛈️'], 96: ['Badai Petir + Es', '⛈️'], 99: ['Badai Petir + Es', '⛈️']
  };
  function wmo(c) { return WMO[c] || ['Tidak diketahui', '🌡️']; }
  function compass(d) { return ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'][Math.round((d % 360) / 45) % 8]; }
  function uvLabel(u) { return u < 3 ? 'Rendah' : u < 6 ? 'Sedang' : u < 8 ? 'Tinggi' : u < 11 ? 'Sangat Tinggi' : 'Ekstrem'; }

  // Lokasi: 1) GPS perangkat (presisi tinggi), 2) perkiraan dari jaringan (IP) hanya jika GPS tidak bisa dipakai.
  // Nama tempat sampai desa/kelurahan (OpenStreetMap), cadangan BigDataCloud.
  var GEO_KEY = 'fm_geo_v3';
  function geoCached() {
    try {
      var c = JSON.parse(localStorage.getItem(GEO_KEY) || 'null');
      if (!c) return null;
      var ttl = c.src === 'GPS' ? 6 * 3600 * 1000 : 5 * 60 * 1000;   // hasil jaringan cepat kedaluwarsa agar GPS dicoba lagi
      if (Date.now() - c.t < ttl) return c;
    } catch (e) {}
    return null;
  }
  function geoSave(g) { g.t = g.t || Date.now(); try { localStorage.setItem(GEO_KEY, JSON.stringify(g)); } catch (e) {} window.FM_GEO = g; try { window.dispatchEvent(new CustomEvent('fm:geo')); } catch (e) {} return g; }
  function jget(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); }); }

  function uniq(a) { var o = []; a.forEach(function (x) { if (x && o.map(function (y) { return y.toLowerCase(); }).indexOf(String(x).toLowerCase()) < 0) o.push(x); }); return o; }
  function placeName(lat, lon) {
    var osm = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=id&lat=' + lat + '&lon=' + lon;
    return jget(osm).then(function (j) {
      var a = (j && j.address) || {};
      var desa = a.village || a.suburb || a.neighbourhood || a.hamlet || a.quarter;
      var kec = a.city_district || a.municipality || a.district || a.subdistrict || a.town;
      var kab = a.county || a.city || a.regency;
      var prov = a.state;
      if (!desa && !kec && !kab) throw new Error('osm kosong');
      var parts = uniq([desa, kec && (/^kec/i.test(kec) ? kec : 'Kec. ' + kec), kab, prov]);
      return { name: parts.join(', '), short: [desa, kab].filter(Boolean).join(', ') };
    }).catch(function () {
      return jget('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + lon + '&localityLanguage=id').then(function (j) {
        var parts = uniq([j.locality, j.city, j.principalSubdivision]);
        return { name: parts.join(', '), short: parts.slice(0, 2).join(', ') };
      }).catch(function () { return { name: '', short: '' }; });
    });
  }
  function gpsState() {
    try { if (navigator.permissions && navigator.permissions.query) return navigator.permissions.query({ name: 'geolocation' }).then(function (p) { return p.state; }).catch(function () { return 'unknown'; }); } catch (e) {}
    return Promise.resolve('unknown');
  }
  function viaGPS() {
    return new Promise(function (res, rej) {
      if (!navigator.geolocation) return rej(new Error('no-gps'));
      navigator.geolocation.getCurrentPosition(function (p) {
        var lat = p.coords.latitude, lon = p.coords.longitude, acc = Math.round(p.coords.accuracy || 0);
        placeName(lat, lon).then(function (n) { res({ lat: lat, lon: lon, acc: acc, name: n.name || 'Lokasi perangkat (GPS)', short: n.short, src: 'GPS' }); });
      }, function (e) { rej(e); }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
    });
  }
  function viaNetwork() {
    return jget('https://ipwho.is/').then(function (j) {
      if (!j || j.success === false || !j.latitude) throw new Error('ip1');
      return { lat: j.latitude, lon: j.longitude, name: [j.city, j.region].filter(Boolean).join(', ') || 'Lokasi jaringan', src: 'Jaringan' };
    }).catch(function () {
      return jget('https://get.geojs.io/v1/ip/geo.json').then(function (j) {
        if (!j || !j.latitude) throw new Error('ip2');
        return { lat: Number(j.latitude), lon: Number(j.longitude), name: [j.city, j.region].filter(Boolean).join(', ') || 'Lokasi jaringan', src: 'Jaringan' };
      });
    });
  }
  var gpsDenied = false;
  function resolveLocation(force) {
    var c = geoCached();
    if (c && !force) return Promise.resolve(geoSave(Object.assign({}, c, { t: c.t })));
    return viaGPS().then(function (g) { gpsDenied = false; return g; }).catch(function (e) {
      gpsDenied = !!(e && e.code === 1);
      return viaNetwork();
    }).then(function (g) { g.t = Date.now(); return geoSave(g); });
  }

  var wx = null, wxState = 'loading';
  function loadWeather(force) {
    wxState = 'loading'; renderWeather();
    resolveLocation(force).then(function (loc) {
      var ck = 'fm_weather_v3_' + loc.lat.toFixed(2) + '_' + loc.lon.toFixed(2);
      try {
        var c = JSON.parse(localStorage.getItem(ck) || 'null');
        if (c && !force && Date.now() - c.t < 3 * 3600 * 1000) { wx = c; wxState = 'ok'; renderWeather(); return; }
      } catch (e) {}
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + loc.lat + '&longitude=' + loc.lon +
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset&timezone=auto&forecast_days=3';
      return jget(url).then(function (j) {
        if (!j || !j.current) throw new Error('data kosong');
        wx = { t: Date.now(), loc: loc, cur: j.current, day: j.daily };
        try { localStorage.setItem(ck, JSON.stringify(wx)); } catch (e) {}
        wxState = 'ok'; renderWeather();
      });
    }).catch(function () { wxState = 'wait'; renderWeather(); });
  }
  window.addEventListener('online', function () { if (wxState !== 'ok') loadWeather(false); });

  function renderWeather(failed) {
    var txt = document.getElementById('weather-text');
    var m = ensureModal('w-modal-weather', 'Prakiraan Cuaca');
    var b = m.querySelector('[data-body]');
    if (!wx) {
      if (txt) txt.innerText = wxState === 'wait' ? 'Cuaca: menunggu jaringan' : 'Memuat cuaca...';
      b.innerHTML = wxState === 'wait'
        ? '<div style="text-align:center;padding:14px 4px"><div style="font-size:44px">📡</div><p style="font-size:13px;font-weight:700;margin:10px 0 4px">Menunggu jaringan</p><p style="font-size:12px;color:#94a3b8;line-height:1.6">Hubungkan perangkat ke internet, atau izinkan akses lokasi pada peramban agar cuaca di sekitar Anda bisa ditampilkan.</p><button data-retry style="margin-top:14px;padding:10px 18px;border-radius:14px;border:0;background:#2563eb;color:#fff;font-weight:800;font-size:12px;cursor:pointer">Coba Lagi</button></div>'
        : '<p style="font-size:12px;color:#94a3b8">Memuat cuaca...</p>';
      var rb = b.querySelector('[data-retry]'); if (rb) rb.onclick = function () { loadWeather(true); };
      return;
    }
    var cur = wx.cur, d = wx.day, w = wmo(cur.weather_code);
    if (txt) txt.innerText = Math.round(cur.temperature_2m) + '°C ' + w[0];
    var cell = function (l, v) { return '<div style="padding:11px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08)"><span style="display:block;font-size:10px;color:#94a3b8;margin-bottom:3px">' + l + '</span><b style="font-size:14px">' + v + '</b></div>'; };
    var days = ['Hari ini', 'Besok', 'Lusa'];
    var hm = function (s) { return String(s || '').slice(11, 16) || '-'; };
    var h = '<div style="text-align:center;padding:4px 0 14px"><div style="font-size:54px;line-height:1">' + w[1] + '</div>' +
      '<div style="font-size:40px;font-weight:900;margin-top:6px">' + Math.round(cur.temperature_2m) + '°C</div>' +
      '<div style="font-size:13px;font-weight:700;color:#67e8f9;margin-top:2px">' + w[0] + '</div>' +
      '<div style="font-size:12px;font-weight:700;margin-top:6px;line-height:1.4">📍 ' + esc(wx.loc.name) + '</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-top:2px">' + (wx.loc.src === 'GPS' ? 'Lokasi GPS' + (wx.loc.acc ? ' · akurasi ±' + wx.loc.acc + ' m' : '') : 'Lokasi perkiraan dari jaringan, bisa meleset ke kota lain') + '</div>' +
      (wx.loc.src === 'GPS' ? '' : '<div style="font-size:11px;color:#fbbf24;margin-top:4px;line-height:1.4">' + (gpsDenied ? 'Izin lokasi ditolak. Ketuk ikon gembok di samping alamat, izinkan Lokasi, lalu tekan tombol di bawah.' : 'Tekan tombol di bawah lalu pilih Izinkan agar lokasi presisi.') + '</div>') +
      '<button type="button" data-gps style="margin-top:8px;padding:7px 14px;border-radius:99px;font-size:12px;font-weight:700;border:1px solid rgba(148,163,184,.4);background:rgba(148,163,184,.15);color:inherit;cursor:pointer">Perbarui dari GPS</button></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
      cell('Terasa seperti', Math.round(cur.apparent_temperature) + '°C') +
      cell('Kelembapan', Math.round(cur.relative_humidity_2m) + '%') +
      cell('Angin', Math.round(cur.wind_speed_10m) + ' km/j ' + compass(cur.wind_direction_10m)) +
      cell('Tekanan', Math.round(cur.surface_pressure) + ' hPa') +
      cell('Peluang Hujan', (d.precipitation_probability_max[0] == null ? '-' : d.precipitation_probability_max[0] + '%')) +
      cell('Indeks UV', Math.round(d.uv_index_max[0]) + ' (' + uvLabel(d.uv_index_max[0]) + ')') +
      cell('Matahari Terbit', hm(d.sunrise[0])) + cell('Matahari Terbenam', hm(d.sunset[0])) + '</div>' +
      '<div style="margin-top:12px;border-top:1px solid rgba(255,255,255,.1);padding-top:10px">';
    for (var i = 0; i < d.time.length; i++) {
      var dw = wmo(d.weather_code[i]);
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 2px;font-size:12px"><span style="width:70px;font-weight:700">' + days[i] + '</span><span>' + dw[1] + ' ' + dw[0] + '</span>' +
        '<span style="font-family:ui-monospace,Menlo,monospace;color:#94a3b8">' + Math.round(d.temperature_2m_min[i]) + '° / ' + Math.round(d.temperature_2m_max[i]) + '°</span></div>';
    }
    h += '</div><p style="font-size:10px;color:#64748b;margin-top:8px">Diperbarui ' + when(wx.t) + ' · sumber Open-Meteo · lokasi dari ' + (wx.loc.src === 'GPS' ? 'GPS' : 'jaringan') + ' · disegarkan tiap 3 jam.</p>';
    b.innerHTML = h;
    var gb = b.querySelector('[data-gps]'); if (gb) gb.onclick = function () { gb.textContent = 'Mencari lokasi...'; loadWeather(true); };
  }

  function wire() {
    var wt = document.getElementById('weather-text'), kt = document.getElementById('kurs-text');
    var ow = function () { showModal(ensureModal('w-modal-weather', 'Prakiraan Cuaca')); };
    var ok = function () { showModal(ensureModal('w-modal-kurs', 'Kurs & Emas')); };
    window.openWeatherModal = ow; window.openKursModal = ok;
    window.closeWeatherModal = function () { var m = document.getElementById('w-modal-weather'); if (m) m.style.display = 'none'; };
    window.closeKursModal = function () { var m = document.getElementById('w-modal-kurs'); if (m) m.style.display = 'none'; };
    var PL = window.FM_PLANS;
    var hid = function (e) { if (e && e.parentElement) e.parentElement.style.setProperty('display', 'none', 'important'); };
    var okW = !(PL && !PL.has('weather')), okK = !(PL && !PL.has('rates'));
    if (!okW) { hid(wt); wt = null; }
    if (!okK) { hid(kt); kt = null; }
    if (!okW && !okK) return;
    if (wt && wt.parentElement) { wt.parentElement.onclick = ow; wt.parentElement.style.cursor = 'pointer'; }
    if (kt && kt.parentElement) { kt.parentElement.onclick = ok; kt.parentElement.style.cursor = 'pointer'; }
    var box = document.getElementById('premium-widgets-container');
    if (box) { box.classList.remove('hidden'); box.style.display = 'flex'; }
    if (wt) { loadWeather(false); setInterval(function () { loadWeather(false); }, 3 * 3600 * 1000); }
    if (kt) startRates();
  }

  window.FM_WIDGETS = { loadWeather: loadWeather, CURS: CURS, refreshRates: refreshRates, maybeRefreshRates: maybeRefreshRates, slotOf: slotOf, slotStartMs: slotStartMs };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
