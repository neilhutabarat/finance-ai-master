/* Kokpit Control Tower: peta, papan toko dengan lampu dan tuas, panel tab (log, alarm, tiket, billing, kotak hitam, konsol),
   suara, dan urutan pra-terbang. Semua angka dibaca dari data asli Tower; tidak ada data karangan. Hanya desktop. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;

  /* ============ util kecil ============ */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function g(fn, dflt) { try { var v = fn(); return v === undefined ? dflt : v; } catch (e) { return dflt; } }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function clock(ms, off) { var d = new Date(ms + off * 3600000); return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()); }
  function rp(n) { return g(function () { return formatThousand(n); }, 'Rp ' + Math.round(n || 0)); }
  function tenants() { return g(function () { return billTenants(); }, []); }
  function ctrl(id) { return g(function () { return getCtrl(id); }, {}); }
  function txs(id) { return g(function () { return getTenantTxList(id); }, []); }
  function online(id) { return g(function () { return onlineSessions(id); }, []); }
  function suspended(id) { return g(function () { return isTenantSuspended(id); }, false); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  /* ============ suara (Web Audio, tanpa file) ============ */
  var S = { ctx: null, on: store('tw_snd') !== '0', voice: store('tw_voice') !== '0', eco: store('tw_eco') === '1', last: 0, vol: Math.max(1, Math.min(10, +store('tw_vol') || 5)), master: null };
  function ac() {
    if (!S.ctx) { try { S.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (S.ctx.state === 'suspended') S.ctx.resume();
    return S.ctx;
  }
  function master(c) {
    if (!S.master) { S.master = c.createDynamicsCompressor(); S.master.threshold.value = -16; S.master.knee.value = 10; S.master.ratio.value = 8; S.master.attack.value = 0.002; S.master.release.value = 0.15; var o = c.createGain(); o.gain.value = 1.15; S.master.connect(o); o.connect(c.destination); }
    return S.master;
  }
  function tone(f, dur, type, vol, when, slideTo) {
    if (!S.on) return; var c = ac(); if (!c) return;
    var t = c.currentTime + (when || 0), o = c.createOscillator(), gn = c.createGain();
    vol = Math.min(0.8, (vol || 0.05) * S.vol);
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol || 0.05, t + 0.005); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn); gn.connect(master(c)); o.start(t); o.stop(t + dur + 0.02);
  }
  var SND = {
    tick: function () { tone(1500, 0.03, 'square', 0.035); tone(1100, 0.04, 'square', 0.03, 0.035); },
    type: function () { var n = Date.now(); if (n - S.last < 45) return; S.last = n; tone(2300 + Math.random() * 400, 0.012, 'square', 0.012); },
    click: function () { tone(260, 0.05, 'square', 0.07, 0, 90); },
    lever: function () { tone(180, 0.06, 'sawtooth', 0.06, 0, 70); tone(520, 0.03, 'square', 0.04, 0.07); },
    beep: function () { tone(880, 0.07, 'sine', 0.06); },
    tab: function () { tone(660, 0.04, 'sine', 0.05); tone(990, 0.04, 'sine', 0.04, 0.045); },
    notif: function () { tone(740, 0.09, 'sine', 0.07); tone(988, 0.12, 'sine', 0.07, 0.1); },
    alarm: function () { for (var i = 0; i < 3; i++) { tone(620, 0.14, 'square', 0.06, i * 0.3); tone(880, 0.14, 'square', 0.06, i * 0.3 + 0.15); } },
    flap: function () { tone(900, 0.02, 'square', 0.03); tone(600, 0.025, 'square', 0.03, 0.03); },
    fanfare: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.16, 'triangle', 0.08, i * 0.11); }); tone(1319, 0.4, 'triangle', 0.08, 0.46); },
    goal: function () { [392, 523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.14, 'sawtooth', 0.05, i * 0.09); }); },
    ok: function () { tone(520, 0.08, 'sine', 0.06); tone(780, 0.08, 'sine', 0.06, 0.09); tone(1040, 0.12, 'sine', 0.06, 0.18); }
  };
  var lastSpeak = 0;
  function speak(txt) {
    if (!S.on || !S.voice || !window.speechSynthesis || Date.now() - lastSpeak < 8000) return;
    lastSpeak = Date.now();
    try { var u = new SpeechSynthesisUtterance(txt); u.lang = 'id-ID'; u.rate = 0.95; u.volume = 1; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
  }

  /* ============ peta (garis pulau disederhanakan) ============ */
  var ISL = [
    [[95.3,5.6],[97.5,5.2],[98.7,3.8],[100.3,2.2],[102.2,1.6],[103.8,1.2],[104.4,-1.0],[106.0,-2.9],[105.8,-5.8],[104.6,-5.9],[102.3,-4.2],[100.8,-2.2],[99.2,0.2],[97.6,1.8],[96.0,3.0]],
    [[105.2,-6.8],[106.4,-6.0],[108.4,-6.7],[110.6,-6.9],[112.7,-6.9],[114.4,-7.8],[114.4,-8.7],[112.0,-8.3],[109.5,-7.8],[106.5,-7.4]],
    [[108.9,1.5],[109.7,2.0],[111.2,1.8],[113.0,3.2],[115.2,4.8],[117.5,6.9],[118.8,5.5],[117.9,4.0],[118.1,1.0],[116.5,-1.2],[116.2,-3.8],[114.5,-4.0],[113.0,-3.2],[111.5,-3.3],[110.2,-2.9],[109.2,-0.5]],
    [[119.8,0.9],[121.5,1.0],[124.8,1.6],[125.0,1.2],[123.2,0.4],[121.3,0.3],[122.3,-0.9],[123.3,-0.8],[122.0,-2.8],[123.2,-3.9],[122.6,-5.0],[121.5,-4.6],[121.2,-2.9],[120.4,-2.7],[120.3,-5.5],[119.5,-5.6],[119.4,-3.4],[118.8,-2.8]],
    [[131.0,-0.8],[132.8,-0.4],[134.1,-0.8],[134.9,-3.3],[137.8,-1.5],[141.0,-2.6],[141.0,-9.1],[139.2,-8.1],[138.0,-8.4],[137.7,-5.0],[135.0,-4.2],[133.7,-3.9],[132.8,-4.1],[131.9,-2.8]],
    [[114.4,-8.1],[115.7,-8.2],[115.6,-8.8],[114.5,-8.7]],
    [[115.9,-8.4],[116.7,-8.4],[116.6,-9.0],[116.0,-8.9]],
    [[116.8,-8.4],[119.0,-8.3],[119.0,-8.9],[117.0,-8.9]],
    [[119.9,-8.4],[122.8,-8.3],[122.9,-8.7],[120.0,-8.9]],
    [[119.2,-9.5],[120.9,-9.5],[120.9,-10.2],[119.4,-10.2]],
    [[123.5,-9.3],[125.1,-9.0],[127.2,-8.4],[127.2,-9.2],[124.0,-10.3]],
    [[127.5,2.0],[128.6,1.2],[128.2,0.2],[128.0,-0.8],[127.6,0.4],[127.8,1.0]],
    [[128.0,-3.0],[130.6,-3.0],[130.8,-3.5],[128.2,-3.8]],
    [[125.2,-3.0],[126.8,-3.2],[126.6,-3.9],[125.4,-3.7]]
  ];
  var MW = 1000, MH = 400, LON0 = 94, LON1 = 142, LAT0 = 7.5, LAT1 = -11.5;
  function px(lon) { return (lon - LON0) / (LON1 - LON0) * MW; }
  function py(lat) { return (LAT0 - lat) / (LAT0 - LAT1) * MH; }
  var view = { k: 1, x: 0, y: 0 };

  function mapSvg() {
    var grid = '';
    for (var lo = 95; lo <= 141; lo += 5) grid += '<line x1="' + px(lo) + '" y1="0" x2="' + px(lo) + '" y2="' + MH + '"/>';
    for (var la = 5; la >= -10; la -= 5) grid += '<line x1="0" y1="' + py(la) + '" x2="' + MW + '" y2="' + py(la) + '"/>';
    var land = ISL.map(function (p) { return '<polygon points="' + p.map(function (c) { return px(c[0]).toFixed(1) + ',' + py(c[1]).toFixed(1); }).join(' ') + '"/>'; }).join('');
    return '<svg id="tw-svg" viewBox="0 0 ' + MW + ' ' + MH + '" preserveAspectRatio="xMidYMid meet"><g id="tw-vp"><g class="tw-grid">' + grid + '</g><g class="tw-land">' + land + '</g><g id="tw-dots"></g></g></svg>';
  }
  function applyView() { var vp = $('tw-vp'); if (vp) vp.setAttribute('transform', 'translate(' + view.x + ' ' + view.y + ') scale(' + view.k + ')'); drawDots(); }
  function zoom(f, cx, cy) {
    var nk = Math.max(1, Math.min(8, view.k * f)); f = nk / view.k;
    cx = cx == null ? MW / 2 : cx; cy = cy == null ? MH / 2 : cy;
    view.x = cx - (cx - view.x) * f; view.y = cy - (cy - view.y) * f; view.k = nk; clampView(); applyView();
  }
  function clampView() { view.x = Math.min(0, Math.max(MW - MW * view.k, view.x)); view.y = Math.min(0, Math.max(MH - MH * view.k, view.y)); }

  function geoOf(id) {
    var best = null;
    g(function () { Object.keys(presenceMap).forEach(function (k) { var p = presenceMap[k]; if (p.tenantId === id && p.geo && typeof p.geo.lat === 'number' && (!best || p.ms > best.ms)) best = p; }); });
    return best ? { lat: best.geo.lat, lon: best.geo.lon, name: best.geo.name || '', live: Date.now() - best.ms < 120000 } : null;
  }
  var pinged = {};
  function drawDots() {
    var gEl = $('tw-dots'); if (!gEl) return;
    var html = '', noLoc = 0;
    tenants().forEach(function (tn) {
      var geo = geoOf(tn.id);
      if (!geo) { noLoc++; return; }
      var x = px(geo.lon), y = py(geo.lat), c = lampColor(tn.id);
      html += '<g class="tw-dot" data-id="' + esc(tn.id) + '" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + (1 / view.k).toFixed(3) + ')">' +
        (pinged[tn.id] && Date.now() - pinged[tn.id] < 4000 ? '<circle class="tw-ping" r="6" fill="none" stroke="' + c + '" stroke-width="' + 1.5 + '"/>' : '') +
        '<circle r="5" fill="' + c + '"/><circle r="' + 10 + '" fill="' + c + '" opacity=".2"/><title>' + esc(tn.nama + ' [' + tn.id + ']' + (geo.name ? ' - ' + geo.name : '')) + '</title></g>';
    });
    gEl.innerHTML = html;
    var nl = $('tw-noloc'); if (nl) nl.textContent = noLoc ? noLoc + ' toko belum punya lokasi' : (tenants().length ? 'semua toko terpetakan' : 'belum ada toko');
  }

  /* ============ status toko ============ */
  function state(id) {
    var b = ctrl(id).billing, st = g(function () { return FM_BILL.status(b, Date.now()); }, { state: 'none' });
    return st.state;
  }
  function lampColor(id) {
    if (suspended(id)) return '#ff5a5a';
    var s = state(id);
    if (s === 'lewat') return '#ff5a5a';
    if (s === 'tempo') return '#ffc247';
    return online(id).length ? '#3dffa0' : '#5b6b78';
  }
  function lampCls(id) {
    if (suspended(id)) return 'tw-l red';
    var s = state(id);
    if (s === 'lewat') return 'tw-l red blink';
    if (s === 'tempo') return 'tw-l amber blink';
    return online(id).length ? 'tw-l green' : 'tw-l off';
  }

  /* ============ log (efek mengetik) ============ */
  var logLines = [], typeQ = [], typing = false;
  function logTime() { return clock(Date.now(), 7); }
  function addLog(kind, text, instant, sound) {
    var row = document.createElement('div'); row.className = 'tw-ln ' + kind;
    var box = $('tw-log'); if (!box) return;
    row.innerHTML = '<span class="t">' + logTime() + '</span><span class="m"></span>';
    box.appendChild(row);
    while (box.children.length > 200) box.removeChild(box.firstChild);
    var m = row.lastChild;
    var go = instant || S.eco || typeQ.length > 10 || document.hidden;
    if (go) { m.textContent = text; box.scrollTop = box.scrollHeight; if (sound && !instant) SND[sound] && SND[sound](); return; }
    typeQ.push({ m: m, text: text, sound: sound, box: box }); pump();
  }
  function pump() {
    if (typing || !typeQ.length) return; typing = true;
    var it = typeQ.shift(), i = 0, caret = '<i class="tw-caret">_</i>';
    if (it.sound) SND[it.sound] && SND[it.sound]();
    (function step() {
      i = Math.min(it.text.length, i + 2);
      it.m.innerHTML = esc(it.text.slice(0, i)) + (i < it.text.length ? caret : '');
      it.box.scrollTop = it.box.scrollHeight; SND.type();
      if (i < it.text.length) setTimeout(step, 22); else { typing = false; setTimeout(pump, 40); }
    })();
  }

  /* ============ deteksi kejadian nyata ============ */
  var seen = {}, seeded = false, lastState = {}, lastOnline = {}, lastTickets = null, lastTrend = {};
  function txKey(id, t) { return id + '|' + (t.id || (t.timestamp + '|' + t.amount)); }
  function collectTx() {
    var all = [];
    tenants().forEach(function (tn) { txs(tn.id).forEach(function (t) { all.push({ tn: tn, t: t }); }); });
    all.sort(function (a, b) { return (a.t.timestamp || 0) - (b.t.timestamp || 0); });
    return all;
  }
  function txText(o) {
    var t = o.t, sales = t.category === 'sales';
    return o.tn.id + ' · ' + o.tn.nama + ' · ' + (sales ? 'PENJUALAN ' : 'PENGELUARAN ') + rp(t.amount) + (t.accountName ? ' · ' + t.accountName : '');
  }
  function scanEvents() {
    var all = collectTx();
    if (!seeded) {
      if (!all.length && Date.now() - bootAt < 4000) return;
      all.slice(-25).forEach(function (o) { addLog(o.t.category === 'sales' ? 'sale' : 'cost', txText(o), true); });
      all.forEach(function (o) { seen[txKey(o.tn.id, o.t)] = 1; });
      seeded = true; computeRecords(); lastTickets = pendingCount();
      tenants().forEach(function (tn) { lastState[tn.id] = state(tn.id) + (suspended(tn.id) ? 'S' : ''); lastOnline[tn.id] = online(tn.id).length > 0; });
      briefing(all); return;
    }
    var newTx = false;
    all.forEach(function (o) {
      var k = txKey(o.tn.id, o.t); if (seen[k]) return; seen[k] = 1;
      addLog(o.t.category === 'sales' ? 'sale' : 'cost', txText(o), false, o.t.category === 'sales' ? 'tick' : 'beep');
      pinged[o.tn.id] = Date.now(); flash('tw-m-omzet'); newTx = true;
    });
    if (newTx) medals();
    tenants().forEach(function (tn) {
      var s = state(tn.id) + (suspended(tn.id) ? 'S' : '');
      if (lastState[tn.id] !== undefined && lastState[tn.id] !== s) {
        var bad = /lewat|S$/.test(s);
        addLog(bad ? 'alarm' : 'sys', tn.id + ' · ' + tn.nama + ' · status ' + (suspended(tn.id) ? 'DIBEKUKAN' : (BN[state(tn.id)] || state(tn.id)).toUpperCase()), false, bad ? 'alarm' : 'notif');
        if (bad) speak('Perhatian. ' + tn.nama + ' ' + (suspended(tn.id) ? 'dibekukan' : 'melewati jatuh tempo'));
      }
      lastState[tn.id] = s;
      var on = online(tn.id).length > 0;
      if (lastOnline[tn.id] !== undefined && lastOnline[tn.id] !== on) addLog('sys', tn.id + ' · ' + tn.nama + (on ? ' · ONLINE' : ' · OFFLINE'), false, on ? 'notif' : null);
      lastOnline[tn.id] = on;
    });
    var pc = pendingCount();
    if (lastTickets !== null && pc > lastTickets) { addLog('alarm', 'TIKET BARU · ' + pc + ' permohonan kasir menunggu', false, 'alarm'); speak('Ada permohonan kasir baru'); }
    lastTickets = pc;
  }
  var BN = { lunas: 'lunas', tempo: 'masa tenggang', lewat: 'lewat tenggang', belum: 'belum mulai', none: 'belum diatur' };
  function pendingCount() { return g(function () { return allTickets.filter(function (x) { return x.status === 'PENDING'; }).length; }, 0); }

  function sumDay(id, iso) { var s = 0; txs(id).forEach(function (t) { if (t.category === 'sales' && (t.dateISO || '') === iso) s += t.amount || 0; }); return s; }
  function trend() {
    var d0 = ymd(new Date()), d1 = ymd(new Date(Date.now() - 86400000));
    tenants().forEach(function (tn) {
      var a = sumDay(tn.id, d0), b = sumDay(tn.id, d1); if (!a && !b) return;
      var dir = a > b ? 'naik' : (a < b ? 'turun' : 'tetap'), key = dir + '|' + a + '|' + b;
      if (lastTrend[tn.id] === key) return; lastTrend[tn.id] = key;
      var pct = b ? Math.round(Math.abs(a - b) / b * 100) + '%' : 'baru';
      addLog(dir === 'turun' ? 'down' : 'up', tn.id + ' · ' + tn.nama + ' · OMZET ' + (dir === 'naik' ? '▲ naik ' : dir === 'turun' ? '▼ turun ' : '= tetap ') + pct + ' · hari ini ' + rp(a) + ' vs kemarin ' + rp(b), false, null);
    });
  }
  function briefing(all) {
    var d0 = ymd(new Date()), sales = 0, n = 0;
    all.forEach(function (o) { if (o.t.category === 'sales' && (o.t.dateISO || '') === d0) { sales += o.t.amount || 0; n++; } });
    var al = alarms();
    addLog('sys', 'BRIEFING · hari ini ' + n + ' penjualan senilai ' + rp(sales) + ' · ' + al.length + ' alarm · ' + pendingCount() + ' tiket menunggu', false, 'ok');
  }

  /* ============ alarm & siaga ============ */
  function alarms() {
    var out = [];
    tenants().forEach(function (tn) {
      var s = state(tn.id);
      if (suspended(tn.id)) out.push({ lv: 2, id: tn.id, tx: tn.nama + ' · DIBEKUKAN' });
      else if (s === 'lewat') out.push({ lv: 2, id: tn.id, tx: tn.nama + ' · lewat tenggang billing' });
      else if (s === 'tempo') out.push({ lv: 1, id: tn.id, tx: tn.nama + ' · masa tenggang billing' });
    });
    var pc = pendingCount(); if (pc) out.push({ lv: 1, id: '', tx: pc + ' permohonan kasir menunggu', tab: 'tiket' });
    return out;
  }
  function defcon() {
    var al = alarms(), red = al.filter(function (a) { return a.lv === 2; }).length;
    if (red >= 2) return 2; if (red === 1) return 3; if (al.length) return 4; return 5;
  }

  /* ============ tab ============ */
  var TABS = [['log', 'LOG'], ['alarm', 'ALARM'], ['tiket', 'TIKET'], ['billing', 'BILLING'], ['kotak', 'KOTAK'], ['konsol', 'KONSOL'], ['jam', 'JAM'], ['replay', 'REPLAY'], ['bola', 'BOLA']], curTab = 'log';
  function setTab(t) {
    if (curTab !== t) SND.tab();
    curTab = t;
    [].forEach.call(document.querySelectorAll('.tw-tab'), function (b) { b.classList.toggle('on', b.getAttribute('data-t') === t); });
    [].forEach.call(document.querySelectorAll('.tw-pg'), function (p) { p.style.display = p.getAttribute('data-t') === t ? '' : 'none'; });
    renderTab(t);
    if (t === 'konsol') { var i = $('tw-cin'); if (i) setTimeout(function () { i.focus(); }, 0); }
  }
  function renderTab(t) {
    if (t === 'alarm') {
      var al = alarms(), box = $('tw-pg-alarm');
      box.innerHTML = al.length ? al.map(function (a) { return '<div class="tw-ar lv' + a.lv + '"><span class="tw-l ' + (a.lv === 2 ? 'red blink' : 'amber blink') + '"></span><span>' + esc(a.tx) + '</span>' + (a.id ? '<button data-open="' + esc(a.id) + '">Inspeksi</button>' : '<button data-tab="' + a.tab + '">Buka</button>') + '</div>'; }).join('') : '<div class="tw-empty">Semua sistem normal. Tidak ada alarm.</div>';
    } else if (t === 'tiket') {
      var tk = g(function () { return allTickets; }, []), pend = tk.map(function (x, i) { return { x: x, i: i }; }).filter(function (o) { return o.x.status === 'PENDING'; });
      $('tw-pg-tiket').innerHTML = pend.length ? pend.map(function (o) { return '<div class="tw-ar lv1"><span>' + esc(o.x.tenantName) + ' [' + esc(o.x.tenantId) + '] · +' + esc(o.x.qty) + ' terminal ' + esc(g(function () { return ROLE_LABEL[o.x.role || 'kasir']; }, 'Kasir')) + '</span><span><button data-ok="' + o.i + '">Setujui</button><button class="no" data-no="' + o.i + '">Tolak</button></span></div>'; }).join('') + '<div class="tw-sub"><button data-all>Semua riwayat…</button></div>' : '<div class="tw-empty">Tidak ada permohonan menunggu.</div><div class="tw-sub"><button data-all>Buka riwayat tiket</button></div>';
    } else if (t === 'billing') {
      renderBillingTab();
    } else if (t === 'kotak') {
      loadBox();
    } else if (t === 'jam') {
      renderJam();
    } else if (t === 'replay') {
      renderReplay();
    } else if (t === 'bola') {
      renderBola();
    }
  }
  function renderBillingTab() {
    var box = $('tw-pg-billing'); if (!box) return; var now = Date.now();
    box.innerHTML = '<table class="tw-t"><thead><tr><th>Toko</th><th>Tipe</th><th>Estimasi</th><th>Jatuh tempo</th></tr></thead><tbody>' + tenants().map(function (tn) {
      var b = ctrl(tn.id).billing, ok = g(function () { return FM_BILL.ok(b); }, false), st = g(function () { return FM_BILL.status(b, now); }, {});
      var left = ok && st.E ? flapHtml(cd(st.E - now)) : '-';
      return '<tr><td>' + esc(tn.nama) + '</td><td class="' + (b && b.trial ? 'tr' : 'ru') + '">' + (ok ? (b.trial ? 'UJI' : 'JALAN') : '-') + '</td><td class="num" data-live="' + esc(tn.id) + '">' + (ok ? 'Rp ' + g(function () { return FM_BILL.fmt(FM_BILL.meter(b, now)); }, '-') : '-') + '</td><td class="num" data-cd="' + (ok && st.E ? st.E : '') + '">' + left + '</td></tr>';
    }).join('') + '</tbody></table>';
  }
  function flapHtml(str) { return '<span class="fp">' + String(str).split('').map(function (c) { return '<b class="fc">' + esc(c) + '</b>'; }).join('') + '</span>'; }
  var flapAt = 0;
  function setFlap(el, str) {
    var cells = el.querySelectorAll('.fc'); str = String(str);
    if (cells.length !== str.length) { el.innerHTML = flapHtml(str); return; }
    var changed = 0;
    for (var i = 0; i < cells.length; i++) if (cells[i].textContent !== str[i]) { cells[i].textContent = str[i]; if (!S.eco) { cells[i].classList.remove('fl'); void cells[i].offsetWidth; cells[i].classList.add('fl'); } if (i < str.length - 2) changed++; }
    if (changed && curTab === 'billing' && Date.now() - flapAt > 1500) { flapAt = Date.now(); SND.flap(); }
  }
  function cd(ms) {
    var neg = ms < 0; ms = Math.abs(ms); var d = Math.floor(ms / 86400000), h = Math.floor(ms % 86400000 / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000);
    return (neg ? '+' : '') + (d ? d + 'h ' : '') + pad(h) + ':' + pad(m) + ':' + pad(s);
  }
  var boxLoaded = 0;
  function loadBox() {
    var box = $('tw-pg-kotak'); if (!box) return;
    if (Date.now() - boxLoaded < 15000) return; boxLoaded = Date.now();
    if (!g(function () { return typeof db !== 'undefined' && db; }, false)) { box.innerHTML = '<div class="tw-empty">Firestore belum terhubung. Riwayat aksi tidak dapat dibaca.</div>'; return; }
    box.innerHTML = '<div class="tw-empty">Membaca kotak hitam…</div>';
    db.collection('manager_audit_logs').where('actor', '==', 'Platform Provider').limit(80).get().then(function (snap) {
      var l = []; snap.forEach(function (d) { l.push(d.data()); });
      l.sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
      box.innerHTML = l.length ? l.slice(0, 60).map(function (x) { return '<div class="tw-ln sys"><span class="t">' + esc((x.date || '').slice(-8)) + '</span><span class="m">' + esc((x.tenantId && x.tenantId !== '-' ? x.tenantId + ' · ' : '') + (x.detail || x.action)) + '</span></div>'; }).join('') : '<div class="tw-empty">Belum ada aksi Tower tercatat.</div>';
    }).catch(function (e) { box.innerHTML = '<div class="tw-empty">Gagal membaca: ' + esc(e.message) + '</div>'; });
  }

  /* ============ papan toko + tuas ============ */
  var boardSig = '';
  function lever(label, on, act, id, dis) {
    return '<button class="tw-lv ' + (on ? 'on' : 'off') + (dis ? ' dis' : '') + '" data-act="' + act + '" data-id="' + esc(id) + '" title="' + esc(label) + '" ' + (dis ? 'disabled' : '') + '><i></i><b>' + label + '</b></button>';
  }
  function renderBoard() {
    var ts = tenants(), sig = ts.map(function (tn) { var b = ctrl(tn.id).billing; return [tn.id, tn.nama, lampCls(tn.id), suspended(tn.id), b && b.trial, b && b.ppn, g(function () { return FM_BILL.ok(b); }, false)].join(':'); }).join('|');
    if (sig === boardSig) return; boardSig = sig;
    var box = $('tw-rows'); if (!box) return;
    box.innerHTML = ts.length ? ts.map(function (tn) {
      var b = ctrl(tn.id).billing, ok = g(function () { return FM_BILL.ok(b); }, false);
      return '<div class="tw-row" data-id="' + esc(tn.id) + '"><span class="' + lampCls(tn.id) + '"></span>' +
        '<span class="nm"><b>' + esc(tn.nama) + '</b><small>' + esc(tn.id) + '</small></span>' +
        '<span class="lvs">' + lever('AKTIF', !suspended(tn.id), 'susp', tn.id, tn.deletedByTower) + lever('UJI', !!(b && b.trial), 'trial', tn.id, !ok) + lever('PPN', ok && b.ppn !== false, 'ppn', tn.id, !ok) + '</span>' +
        '<span class="bt"><button data-edit="' + esc(tn.id) + '">EDIT</button><button data-open="' + esc(tn.id) + '">INSPEK</button></span></div>';
    }).join('') : '<div class="tw-empty">Belum ada toko klien. Tekan KLIEN BARU.</div>';
  }
  function quickBill(id, patch) {
    var tn = g(function () { return TENANTS_CONFIG[String(id).toLowerCase()]; }), b = ctrl(id).billing;
    if (!tn || !g(function () { return FM_BILL.ok(b); }, false)) return alert('Atur biaya dasar toko ini dulu lewat Inspeksi.');
    saveBillingFields(tn, {
      base: b.base || 0, startMs: b.startMs, graceDays: typeof b.graceDays === 'number' ? b.graceDays : 3, installMonths: typeof b.installMonths === 'number' ? b.installMonths : 36,
      autoFreeze: b.autoFreeze !== false, trial: patch.trial !== undefined ? patch.trial : !!b.trial, ppn: patch.ppn !== undefined ? patch.ppn : b.ppn !== false
    }, true);
  }
  function onBoardClick(e) {
    var b = e.target.closest('button'); if (!b) return;
    var id = b.getAttribute('data-id');
    if (b.classList.contains('tw-lv')) {
      SND.lever(); var act = b.getAttribute('data-act'), cur = ctrl(id).billing || {};
      if (act === 'susp') setTenantSuspended(id, !suspended(id));
      else if (act === 'trial') quickBill(id, { trial: !cur.trial });
      else if (act === 'ppn') quickBill(id, { ppn: cur.ppn === false });
      return;
    }
    if (b.hasAttribute('data-edit')) { SND.click(); openTenantSettings(b.getAttribute('data-edit')); }
    if (b.hasAttribute('data-open')) { SND.click(); openInspectUMKM(b.getAttribute('data-open')); }
  }

  /* ============ monitor angka ============ */
  function flash(id) { var el = $(id); if (!el || S.eco) return; el.classList.remove('tw-fl'); void el.offsetWidth; el.classList.add('tw-fl'); }
  function updateMonitors() {
    var now = Date.now(), run = 0, tri = 0;
    tenants().forEach(function (tn) { var b = ctrl(tn.id).billing; if (g(function () { return FM_BILL.ok(b); }, false)) { var v = g(function () { return FM_BILL.meter(b, now); }, 0); if (b.trial) tri += v; else run += v; } });
    var a = $('tw-m-run'); if (a) a.textContent = 'Rp ' + g(function () { return FM_BILL.fmt(run); }, '0');
    var b2 = $('tw-m-tri'); if (b2) b2.textContent = 'Rp ' + g(function () { return FM_BILL.fmt(tri); }, '0');
    // proyeksi omzet jaringan akhir bulan
    var d = new Date(), first = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-01', sum = 0;
    tenants().forEach(function (tn) { if (tn.isMaster) return; txs(tn.id).forEach(function (t) { if (t.category === 'sales' && (t.dateISO || '') >= first) sum += t.amount || 0; }); });
    var dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(), proj = sum / Math.max(1, d.getDate()) * dim;
    var p = $('tw-m-proj'); if (p) p.textContent = rp(proj);
    var ps = $('tw-m-projs'); if (ps) ps.textContent = 'dari ' + rp(sum) + ' · hari ' + d.getDate() + '/' + dim;
  }
  function updateBar() {
    var ts = tenants(), on = ts.filter(function (t) { return online(t.id).length; }).length, lv = defcon(), now = Date.now();
    var dbOk = g(function () { return typeof db !== 'undefined' && db; }, false);
    set('tw-b-fb', dbOk ? 'FIREBASE OK' : 'FIREBASE OFF', dbOk ? 'ok' : 'bad');
    set('tw-b-on', 'ONLINE ' + on + '/' + ts.length, on ? 'ok' : 'idle');
    set('tw-b-tk', 'TIKET ' + pendingCount(), pendingCount() ? 'warn blink' : 'idle');
    set('tw-b-df', 'SIAGA ' + lv, lv === 5 ? 'ok' : lv === 4 ? 'warn' : 'bad blink');
    $('tw-b-clk').textContent = 'WIB ' + clock(now, 7) + ' · WITA ' + clock(now, 8).slice(0, 5) + ' · WIT ' + clock(now, 9).slice(0, 5);
    var al = alarms().length, tb = document.querySelector('.tw-tab[data-t="alarm"]'); if (tb) { tb.setAttribute('data-n', al || ''); tb.classList.toggle('warn', !!al); }
    var tt = document.querySelector('.tw-tab[data-t="tiket"]'); if (tt) tt.setAttribute('data-n', pendingCount() || '');
    if (lastDef !== null && lv < lastDef) { SND.alarm(); speak('Tingkat siaga naik ke ' + lv); addLog('alarm', 'TINGKAT SIAGA ' + lastDef + ' → ' + lv, false, null); }
    lastDef = lv;
  }
  var lastDef = null;
  function set(id, txt, cls) { var el = $(id); if (!el) return; el.textContent = txt; el.className = 'tw-b ' + cls; }


  /* ============ medali & rekor ============ */
  var rec = {};
  function computeRecords() {
    var d0 = ymd(new Date());
    tenants().forEach(function (tn) {
      var by = {}; txs(tn.id).forEach(function (t) { if (t.category === 'sales') { var d = t.dateISO || ''; by[d] = (by[d] || 0) + (t.amount || 0); } });
      var mx = 0; Object.keys(by).forEach(function (d) { if (d !== d0 && by[d] > mx) mx = by[d]; });
      rec[tn.id] = { mx: mx, flag: false, count: txs(tn.id).length };
    });
  }
  function medals() {
    var d0 = ymd(new Date());
    tenants().forEach(function (tn) {
      var r = rec[tn.id]; if (!r) { computeRecords(); r = rec[tn.id]; if (!r) return; }
      var today = sumDay(tn.id, d0), n = txs(tn.id).length;
      if (r.mx > 0 && today > r.mx && !r.flag) { r.flag = true; addLog('up', 'REKOR · ' + tn.id + ' · ' + tn.nama + ' · omzet harian tertinggi ' + rp(today) + ' (sebelumnya ' + rp(r.mx) + ')', false, 'fanfare'); speak('Rekor baru. ' + tn.nama + ' mencetak omzet harian tertinggi'); }
      if (Math.floor(n / 100) > Math.floor(r.count / 100)) addLog('up', 'MEDALI · ' + tn.id + ' · ' + tn.nama + ' · transaksi ke-' + (Math.floor(n / 100) * 100), false, 'fanfare');
      r.count = n;
    });
  }

  /* ============ jam sibuk ============ */
  function renderJam() {
    var box = $('tw-pg-jam'); if (!box) return;
    var hrs = [], i, since = Date.now() - 14 * 86400000, tot = 0;
    for (i = 0; i < 24; i++) hrs.push(0);
    tenants().forEach(function (tn) { txs(tn.id).forEach(function (t) { var ms = t.timestamp || 0; if (ms >= since) { hrs[new Date(ms + 7 * 3600000).getUTCHours()]++; tot++; } }); });
    var mx = Math.max.apply(null, hrs.concat([1])), peak = hrs.indexOf(mx);
    box.innerHTML = '<div class="tw-sub0">Jumlah transaksi per jam (WIB), 14 hari terakhir · seluruh jaringan</div><div class="tw-heat">' + hrs.map(function (v, h) { var a = v ? 0.15 + 0.85 * v / mx : 0.04; return '<div class="hc" style="background:rgba(61,255,160,' + a.toFixed(2) + ')" title="' + pad(h) + ':00 · ' + v + ' transaksi"><b>' + pad(h) + '</b><small>' + v + '</small></div>'; }).join('') + '</div>' +
      '<div class="tw-sub0">' + (tot ? 'Jam tersibuk: <b>' + pad(peak) + ':00–' + pad((peak + 1) % 24) + ':00</b> (' + mx + ' transaksi) · total ' + tot + ' transaksi' : 'Belum ada transaksi dalam 14 hari terakhir.') + '</div>';
  }

  /* ============ replay ============ */
  var RP = { run: false, timer: null, day: 0 };
  function renderReplay() {
    var box = $('tw-pg-replay'); if (!box || box.getAttribute('data-ready')) { if (box) updateRpBtn(); return; }
    box.setAttribute('data-ready', '1');
    box.innerHTML = '<div class="tw-rpbar"><select id="tw-rp-day"><option value="0">Hari ini</option><option value="1">Kemarin</option><option value="2">2 hari lalu</option></select><button id="tw-rp-go">▶ PUTAR</button><span id="tw-rp-clk" class="tw-clk">--:--:--</span></div><div class="tw-prog"><i id="tw-rp-bar"></i></div><div id="tw-rp-out" class="tw-logbox"><div class="tw-empty">Pilih hari lalu tekan PUTAR. Transaksi hari itu diputar ulang dengan bunyi dan titik di peta.</div></div>';
    $('tw-rp-go').onclick = function () { SND.click(); RP.run ? stopReplay() : startReplay(+$('tw-rp-day').value); };
  }
  function updateRpBtn() { var b = $('tw-rp-go'); if (b) b.textContent = RP.run ? '■ STOP' : '▶ PUTAR'; }
  function stopReplay() { RP.run = false; clearTimeout(RP.timer); updateRpBtn(); }
  function startReplay(dayOff) {
    var iso = ymd(new Date(Date.now() - dayOff * 86400000)), list = collectTx().filter(function (o) { return (o.t.dateISO || '') === iso; });
    var out = $('tw-rp-out'); out.innerHTML = '';
    if (!list.length) { out.innerHTML = '<div class="tw-empty">Tidak ada transaksi pada ' + iso + '.</div>'; return; }
    RP.run = true; updateRpBtn(); var i = 0, prev = list[0].t.timestamp || 0;
    (function step() {
      if (!RP.run) return;
      if (i >= list.length) { stopReplay(); var d = document.createElement('div'); d.className = 'tw-ln sys'; d.innerHTML = '<span class="m">— replay selesai · ' + list.length + ' transaksi —</span>'; out.appendChild(d); SND.ok(); return; }
      var o = list[i], ms = o.t.timestamp || 0, sales = o.t.category === 'sales';
      var ln = document.createElement('div'); ln.className = 'tw-ln ' + (sales ? 'sale' : 'cost'); ln.innerHTML = '<span class="t">' + clock(ms, 7) + '</span><span class="m">' + esc(txText(o)) + '</span>'; out.appendChild(ln); out.scrollTop = out.scrollHeight;
      pinged[o.tn.id] = Date.now(); drawDots(); (sales ? SND.tick : SND.beep)();
      var c = $('tw-rp-clk'); if (c) c.textContent = clock(ms, 7); var bar = $('tw-rp-bar'); if (bar) bar.style.width = Math.round((i + 1) / list.length * 100) + '%';
      var gap = i + 1 < list.length ? ((list[i + 1].t.timestamp || ms) - ms) : 0; prev = ms; i++;
      RP.timer = setTimeout(step, Math.max(140, Math.min(900, gap / 3000)));
    })();
  }

  /* ============ Real Madrid (football-data.org) ============ */
  var BOLA = { key: store('tw_fdkey') || '', data: null, at: 0, err: '', live: false, lastScore: null };
  function bolaFetch(force) {
    if (!BOLA.key || document.hidden) return;
    if (!force && Date.now() - BOLA.at < (BOLA.live ? 25000 : 600000)) return;
    BOLA.at = Date.now();
    var from = ymd(new Date(Date.now() - 3 * 86400000)), to = ymd(new Date(Date.now() + 45 * 86400000));
    fetch('https://api.football-data.org/v4/teams/86/matches?dateFrom=' + from + '&dateTo=' + to, { headers: { 'X-Auth-Token': BOLA.key } })
      .then(function (r) { if (!r.ok) throw new Error(r.status === 403 || r.status === 401 ? 'kunci ditolak (HTTP ' + r.status + ')' : r.status === 429 ? 'terlalu sering (HTTP 429)' : 'HTTP ' + r.status); return r.json(); })
      .then(function (j) { BOLA.data = j.matches || []; BOLA.err = ''; bolaGoalCheck(); if (curTab === 'bola') bolaPaint(); })
      .catch(function (e) { BOLA.err = e.message || 'gagal'; if (curTab === 'bola') bolaPaint(); });
  }
  function bolaPick() {
    var ms = (BOLA.data || []).slice().sort(function (a, b) { return Date.parse(a.utcDate) - Date.parse(b.utcDate); }), now = Date.now();
    var live = ms.filter(function (m) { return /IN_PLAY|PAUSED|LIVE/.test(m.status); })[0] || null;
    var next = ms.filter(function (m) { return /SCHEDULED|TIMED/.test(m.status) && Date.parse(m.utcDate) > now - 60000; })[0] || null;
    var last = ms.filter(function (m) { return m.status === 'FINISHED'; }).pop() || null;
    BOLA.live = !!live; return { live: live, next: next, last: last };
  }
  function scoreOf(m) { var f = m && m.score && m.score.fullTime || {}; return [f.home == null ? 0 : f.home, f.away == null ? 0 : f.away]; }
  function bolaGoalCheck() {
    var pk = bolaPick(); if (!pk.live) { BOLA.lastScore = null; return; }
    var sc = scoreOf(pk.live), key = pk.live.id;
    if (BOLA.lastScore && BOLA.lastScore.id === key && (sc[0] + sc[1] > BOLA.lastScore.s[0] + BOLA.lastScore.s[1])) {
      var madHome = pk.live.homeTeam && pk.live.homeTeam.id === 86, mine = madHome ? sc[0] > BOLA.lastScore.s[0] : sc[1] > BOLA.lastScore.s[1];
      addLog(mine ? 'up' : 'down', 'GOL! ' + shortName(pk.live.homeTeam) + ' ' + sc[0] + ' - ' + sc[1] + ' ' + shortName(pk.live.awayTeam), false, 'goal');
      speak(mine ? 'Gol! Real Madrid mencetak gol' : 'Gol untuk lawan');
    }
    BOLA.lastScore = { id: key, s: sc };
  }
  function shortName(t) { return t ? (t.shortName || t.name || '?') : '?'; }
  function liveMinute(m) {
    var el = (Date.now() - Date.parse(m.utcDate)) / 60000;
    if (m.status === 'PAUSED') return { txt: 'ISTIRAHAT', est: false };
    var min = m.minute ? +m.minute : (el <= 47 ? el : Math.max(46, el - 15));
    min = Math.max(0, Math.min(130, min)); var mm = Math.floor(min), ss = Math.floor((min - mm) * 60);
    return { txt: pad(mm) + ':' + pad(ss), est: !m.minute };
  }
  function renderBola() {
    var box = $('tw-pg-bola'); if (!box) return;
    if (!BOLA.key) {
      box.innerHTML = '<div class="tw-empty">Masukkan kunci API football-data.org (gratis) untuk jadwal dan skor Real Madrid.</div><div class="tw-rpbar"><input id="tw-fd-in" placeholder="tempel kunci API" autocomplete="off"><button id="tw-fd-ok">SIMPAN</button></div><div class="tw-sub0">Kunci disimpan di browser ini saja. Daftar gratis di football-data.org.</div>';
      $('tw-fd-ok').onclick = function () { var v = $('tw-fd-in').value.trim(); if (!v) return; BOLA.key = v; store('tw_fdkey', v); SND.ok(); box.innerHTML = ''; renderBola(); };
      return;
    }
    if (!$('tw-bola-box')) box.innerHTML = '<div id="tw-bola-box"></div><div class="tw-sub0" id="tw-bola-foot"></div>';
    bolaPaint(); bolaFetch(true);
  }
  function bolaPaint() {
    var bx = $('tw-bola-box'); if (!bx) return;
    if (!BOLA.data) { bx.innerHTML = '<div class="tw-empty">' + (BOLA.err ? 'Gagal memuat: ' + esc(BOLA.err) : 'Memuat jadwal…') + '</div>'; return; }
    var pk = bolaPick(), h = '';
    if (pk.live) {
      var m = pk.live, sc = scoreOf(m), mn = liveMinute(m);
      h = '<div class="tw-bl live"><div class="cm">' + esc((m.competition && m.competition.name) || '') + ' · <b class="red">● LIVE</b></div><div class="tm"><span>' + esc(shortName(m.homeTeam)) + '</span><b class="sc">' + sc[0] + ' - ' + sc[1] + '</b><span>' + esc(shortName(m.awayTeam)) + '</span></div><div class="mn" id="tw-bola-min" data-id="' + m.id + '">' + mn.txt + '</div><small>' + (mn.est ? 'menit perkiraan, bisa terlambat dari siaran' : '') + '</small></div>';
    } else if (pk.next) {
      var n = pk.next, t = Date.parse(n.utcDate);
      h = '<div class="tw-bl"><div class="cm">JADWAL BERIKUTNYA · ' + esc((n.competition && n.competition.name) || '') + '</div><div class="tm"><span>' + esc(shortName(n.homeTeam)) + '</span><b class="sc">vs</b><span>' + esc(shortName(n.awayTeam)) + '</span></div><div class="mn" id="tw-bola-cd" data-t="' + t + '">' + flapHtml(cd(t - Date.now())) + '</div><small>' + new Date(t + 7 * 3600000).toISOString().slice(0, 16).replace('T', ' ') + ' WIB</small></div>';
    } else h = '<div class="tw-empty">Tidak ada pertandingan dalam 45 hari ke depan.</div>';
    if (pk.last && !pk.live) { var l = pk.last, ls = scoreOf(l); h += '<div class="tw-bl last"><div class="cm">TERAKHIR · ' + esc((l.competition && l.competition.name) || '') + '</div><div class="tm"><span>' + esc(shortName(l.homeTeam)) + '</span><b class="sc">' + ls[0] + ' - ' + ls[1] + '</b><span>' + esc(shortName(l.awayTeam)) + '</span></div></div>'; }
    bx.innerHTML = h;
    var ft = $('tw-bola-foot'); if (ft) ft.textContent = BOLA.err ? 'Pembaruan terakhir gagal: ' + BOLA.err : 'Sumber: football-data.org' + (BOLA.live ? ' · diperbarui tiap 30 detik' : ' · diperbarui tiap 10 menit');
  }
  function bolaTick() {
    if (curTab !== 'bola' || !BOLA.data) return;
    var c = $('tw-bola-cd'); if (c) { var t = +c.getAttribute('data-t'); if (t - Date.now() < -60000) { bolaFetch(true); } else setFlap(c, cd(t - Date.now())); }
    var m = $('tw-bola-min'); if (m) { var pk = bolaPick(); if (pk.live) m.textContent = liveMinute(pk.live).txt; }
  }

  /* ============ konsol ============ */
  var hist = [], hi = 0;
  function out(txt, cls) { var box = $('tw-cout'); if (!box) return; var r = document.createElement('div'); r.className = 'tw-ln ' + (cls || 'sys'); r.innerHTML = '<span class="m"></span>'; box.appendChild(r); var m = r.firstChild; var i = 0; if (S.eco) { m.textContent = txt; return; } (function s() { i = Math.min(txt.length, i + 3); m.innerHTML = esc(txt.slice(0, i)) + (i < txt.length ? '<i class="tw-caret">_</i>' : ''); box.scrollTop = box.scrollHeight; SND.type(); if (i < txt.length) setTimeout(s, 14); })(); box.scrollTop = box.scrollHeight; }
  function find(q) { q = String(q || '').toLowerCase().trim(); if (!q) return null; return tenants().filter(function (t) { return t.id.toLowerCase() === q || t.id.toLowerCase().indexOf(q) >= 0 || String(t.nama || '').toLowerCase().indexOf(q) >= 0; })[0] || null; }
  var CMD = {
    bantuan: function () { out('Perintah: status · toko · omzet · tiket · billing · pajak · alarm · buka <toko> · edit <toko> · bekukan <toko> · aktifkan <toko> · link <toko> · suara on/off · volume 1-10 · hemat on/off · bola kunci <kunci> · bersih'); },
    status: function () { var ts = tenants(); out('SIAGA ' + defcon() + ' · ' + ts.length + ' toko · ' + ts.filter(function (t) { return online(t.id).length; }).length + ' online · ' + alarms().length + ' alarm · ' + pendingCount() + ' tiket'); },
    toko: function () { tenants().forEach(function (t) { out(t.id + ' · ' + t.nama + ' · ' + (suspended(t.id) ? 'BEKU' : online(t.id).length ? 'ONLINE' : 'offline')); }); },
    omzet: function () { var d0 = ymd(new Date()), s = 0; tenants().forEach(function (t) { s += sumDay(t.id, d0); }); out('Omzet jaringan hari ini: ' + rp(s)); },
    tiket: function () { out(pendingCount() + ' permohonan kasir menunggu'); if (pendingCount()) setTab('tiket'); },
    billing: function () { setTab('billing'); out('Tab billing dibuka.'); },
    pajak: function () { openModal('tax_net'); out('Panel pajak dibuka.'); },
    alarm: function () { var al = alarms(); out(al.length ? al.map(function (a) { return a.tx; }).join(' | ') : 'Tidak ada alarm.'); },
    bersih: function () { var b = $('tw-cout'); if (b) b.innerHTML = ''; },
    buka: function (a) { var t = find(a); if (!t) return out('Toko tidak ditemukan: ' + a, 'alarm'); openInspectUMKM(t.id); out('Membuka inspeksi ' + t.nama); },
    edit: function (a) { var t = find(a); if (!t) return out('Toko tidak ditemukan: ' + a, 'alarm'); openTenantSettings(t.id); out('Membuka pengaturan ' + t.nama); },
    bekukan: function (a) { var t = find(a); if (!t) return out('Toko tidak ditemukan: ' + a, 'alarm'); setTenantSuspended(t.id, true); },
    aktifkan: function (a) { var t = find(a); if (!t) return out('Toko tidak ditemukan: ' + a, 'alarm'); setTenantSuspended(t.id, false); },
    link: function (a) { var t = find(a); if (!t) return out('Toko tidak ditemukan: ' + a, 'alarm'); out(tenantLink(t.id)); },
    suara: function (a) { S.on = a !== 'off'; store('tw_snd', S.on ? '1' : '0'); syncToggles(); out('Suara ' + (S.on ? 'menyala' : 'mati')); if (S.on) SND.ok(); },
    volume: function (a) { var v = Math.max(1, Math.min(10, parseInt(a, 10) || 0)); if (!v) return out('Volume sekarang ' + S.vol + ' (1 sampai 10). Contoh: volume 7'); S.vol = v; store('tw_vol', String(v)); out('Volume diatur ke ' + v); SND.ok(); },
    bola: function (a) { var p = String(a || '').split(/\s+/); if (p[0] === 'kunci' && p[1]) { BOLA.key = p[1]; store('tw_fdkey', p[1]); out('Kunci bola disimpan.'); bolaFetch(true); } else if (p[0] === 'hapus') { BOLA.key = ''; BOLA.data = null; store('tw_fdkey', ''); out('Kunci bola dihapus.'); } else { setTab('bola'); } },
    hemat: function (a) { S.eco = a !== 'off'; store('tw_eco', S.eco ? '1' : '0'); syncToggles(); out('Mode hemat ' + (S.eco ? 'menyala' : 'mati')); }
  };
  function runCmd(line) {
    line = String(line || '').trim(); if (!line) return;
    hist.push(line); hi = hist.length;
    var r = document.createElement('div'); r.className = 'tw-ln cmd'; r.innerHTML = '<span class="m">› ' + esc(line) + '</span>'; $('tw-cout').appendChild(r);
    var p = line.split(/\s+/), c = p.shift().toLowerCase(), f = CMD[c];
    if (!f) return out('Perintah tidak dikenal. Ketik "bantuan".', 'alarm');
    SND.click(); f(p.join(' '));
  }

  /* ============ toggle bar ============ */
  function syncToggles() {
    var a = $('tw-t-snd'), b = $('tw-t-eco'), c = $('tw-t-voice');
    if (a) { a.classList.toggle('on', S.on); a.querySelector('b').textContent = S.on ? 'SUARA' : 'SENYAP'; }
    if (b) b.classList.toggle('on', S.eco);
    if (c) c.classList.toggle('on', S.voice);
    document.documentElement.classList.toggle('tw-eco', S.eco);
  }

  /* ============ bangun DOM ============ */
  var bootAt = Date.now(), built = false;
  function build() {
    var main = document.querySelector('main'), acts = $('fm-actions');
    if (!main || !acts || built) return; built = true;
    document.documentElement.setAttribute('data-tw-ck', '1');
    var ic = function (k) { return window.FM_SVG ? FM_SVG(k) : ''; };
    var sec = document.createElement('section'); sec.id = 'tw-ck';
    sec.innerHTML =
      '<div class="tw-bar"><span id="tw-b-fb" class="tw-b idle">FIREBASE</span><span id="tw-b-on" class="tw-b idle">ONLINE</span><span id="tw-b-tk" class="tw-b idle">TIKET</span><span id="tw-b-df" class="tw-b ok">SIAGA 5</span>' +
      '<span id="tw-b-clk" class="tw-clk"></span><span class="tw-sp"></span>' +
      '<button class="tw-tg" id="tw-t-snd"><i></i><b>SUARA</b></button><button class="tw-tg" id="tw-t-voice" title="Suara pelapor untuk alarm"><i></i><b>PELAPOR</b></button><button class="tw-tg" id="tw-t-eco" title="Matikan animasi berat"><i></i><b>HEMAT</b></button>' +
      '<span class="tw-vr"></span>' +
      '<button class="tw-ab" data-go="add"><span class="ic">' + ic('plus') + '</span>KLIEN BARU</button><button class="tw-ab" data-go="cat"><span class="ic">' + ic('swap') + '</span>CATAT</button><button class="tw-ab" data-go="msg"><span class="ic">' + ic('send') + '</span>PESAN</button><button class="tw-ab" data-go="set"><span class="ic">' + ic('gear') + '</span>ATUR</button><button class="tw-ab bad" data-go="out"><span class="ic">' + ic('out') + '</span>KELUAR</button></div>' +
      '<div class="tw-main">' +
      '<div class="tw-pane tw-map"><div class="tw-ph"><span class="tw-l green"></span>PETA JARINGAN<span class="tw-sp"></span><small id="tw-noloc"></small></div><div class="tw-mapbox" id="tw-mapbox">' + mapSvg() + '<div class="tw-sweep"></div><div class="tw-zm"><button data-z="in">+</button><button data-z="out">−</button><button data-z="reset">⌂</button></div><div class="tw-leg"><span><i class="g"></i>online</span><span><i class="o"></i>offline</span><span><i class="a"></i>tenggang</span><span><i class="r"></i>beku/lewat</span></div></div></div>' +
      '<div class="tw-pane tw-board"><div class="tw-ph"><span class="tw-l green"></span>PAPAN TOKO<span class="tw-sp"></span><small>tuas: AKTIF · UJI COBA · PPN</small></div><div id="tw-rows" class="tw-rows"></div></div>' +
      '<div class="tw-pane tw-tabs"><div class="tw-tabbar">' + TABS.map(function (t) { return '<button class="tw-tab' + (t[0] === 'log' ? ' on' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="tw-pgs"><div class="tw-pg" data-t="log"><div id="tw-log" class="tw-logbox"></div></div><div class="tw-pg" data-t="alarm" style="display:none" id="tw-pg-alarm"></div><div class="tw-pg" data-t="tiket" style="display:none" id="tw-pg-tiket"></div><div class="tw-pg" data-t="billing" style="display:none" id="tw-pg-billing"></div><div class="tw-pg" data-t="kotak" style="display:none" id="tw-pg-kotak"></div><div class="tw-pg" data-t="jam" style="display:none" id="tw-pg-jam"></div><div class="tw-pg" data-t="replay" style="display:none" id="tw-pg-replay"></div><div class="tw-pg" data-t="bola" style="display:none" id="tw-pg-bola"></div>' +
      '<div class="tw-pg" data-t="konsol" style="display:none"><div id="tw-cout" class="tw-logbox"></div><div class="tw-cinw"><span>›</span><input id="tw-cin" autocomplete="off" spellcheck="false" placeholder="ketik bantuan"></div></div></div></div>' +
      '</div>';
    main.insertBefore(sec, acts);
    // monitor tambahan
    var grid = main.querySelector(':scope>.grid:first-child');
    if (grid) {
      var mk = function (title, valId, subId, cls) { var d = document.createElement('div'); d.className = 'ios-glass p-5 flex flex-col justify-between tw-mon ' + cls; d.innerHTML = '<span class="tw-mt">' + title + '</span><h3 id="' + valId + '" class="tw-mv">-</h3><p id="' + subId + '" class="tw-ms"></p>'; return d; };
      var m1 = mk('ESTIMASI BILLING', 'tw-m-run', 'tw-m-runs', 'run'); m1.querySelector('.tw-ms').innerHTML = 'uji coba: <b id="tw-m-tri">-</b>';
      grid.appendChild(m1); grid.appendChild(mk('PROYEKSI AKHIR BULAN', 'tw-m-proj', 'tw-m-projs', 'proj'));
      var om = grid.children[1]; if (om) om.id = 'tw-m-omzet';
    }
    wire(); syncToggles(); applyView();
  }
  function wire() {
    $('tw-rows').addEventListener('click', onBoardClick);
    $('tw-ck').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('tw-tab')) return setTab(b.getAttribute('data-t'));
      if (b.hasAttribute('data-tab')) return setTab(b.getAttribute('data-tab'));
      if (b.hasAttribute('data-open') && !b.closest('#tw-rows')) { SND.click(); return openInspectUMKM(b.getAttribute('data-open')); }
      if (b.hasAttribute('data-ok')) { SND.click(); return approveTicket(+b.getAttribute('data-ok')); }
      if (b.hasAttribute('data-no')) { SND.click(); return rejectTicket(+b.getAttribute('data-no')); }
      if (b.hasAttribute('data-all')) { SND.click(); return openModal('tickets'); }
      var z = b.getAttribute('data-z'); if (z) { SND.click(); if (z === 'in') zoom(1.5); else if (z === 'out') zoom(1 / 1.5); else { view = { k: 1, x: 0, y: 0 }; applyView(); } return; }
      var go = b.getAttribute('data-go'); if (!go) return; SND.click();
      if (go === 'add') openModal('add_tenant'); else if (go === 'cat') openModal('provider_input_tx'); else if (go === 'msg') openModal('broadcast_modal');
      else if (go === 'set') { var gb = $('fm-gear'); if (gb) gb.click(); } else if (go === 'out' && window.FM_LOGOUT) FM_LOGOUT();
    });
    $('tw-t-snd').onclick = function () { S.on = !S.on; store('tw_snd', S.on ? '1' : '0'); syncToggles(); if (S.on) SND.ok(); };
    $('tw-t-voice').onclick = function () { S.voice = !S.voice; store('tw_voice', S.voice ? '1' : '0'); syncToggles(); SND.click(); };
    $('tw-t-eco').onclick = function () { S.eco = !S.eco; store('tw_eco', S.eco ? '1' : '0'); syncToggles(); SND.click(); };
    var mb = $('tw-mapbox'), drag = null;
    mb.addEventListener('wheel', function (e) { e.preventDefault(); var r = $('tw-svg').getBoundingClientRect(), sc = MW / r.width; zoom(e.deltaY < 0 ? 1.25 : 0.8, (e.clientX - r.left) * sc, (e.clientY - r.top) * sc); }, { passive: false });
    mb.addEventListener('mousedown', function (e) { if (e.target.closest('.tw-zm')) return; drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; mb.classList.add('drag'); });
    window.addEventListener('mouseup', function () { drag = null; mb.classList.remove('drag'); });
    window.addEventListener('mousemove', function (e) { if (!drag) return; var r = $('tw-svg').getBoundingClientRect(), sc = MW / r.width; view.x = drag.vx + (e.clientX - drag.x) * sc; view.y = drag.vy + (e.clientY - drag.y) * sc; clampView(); applyView(); });
    mb.addEventListener('click', function (e) { var d = e.target.closest('.tw-dot'); if (d) { SND.click(); openInspectUMKM(d.getAttribute('data-id')); } });
    var inp = $('tw-cin');
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { runCmd(inp.value); inp.value = ''; }
      else if (e.key === 'ArrowUp') { if (hi > 0) inp.value = hist[--hi] || ''; e.preventDefault(); }
      else if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; e.preventDefault(); }
      e.stopPropagation();
    });
    document.addEventListener('keydown', function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      var modalOpen = g(function () { return !$('main-modal-container').classList.contains('hidden'); }, false);
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      var fi = /^F([1-9])$/.exec(e.key);
      if (fi && !modalOpen) { e.preventDefault(); setTab(TABS[+fi[1] - 1][0]); return; }
      if (e.key === '/' && !modalOpen) { e.preventDefault(); setTab('konsol'); return; }
      if (e.key === 'm' || e.key === 'M') { if (!modalOpen) $('tw-t-snd').click(); return; }
      if (e.key === 'Escape' && modalOpen) closeModal();
    });
  }

  /* ============ urutan pra-terbang ============ */
  function preflight(done) {
    var ov = document.createElement('div'); ov.id = 'tw-pre';
    ov.innerHTML = '<div class="tw-pre-box"><div class="tw-pre-t">ONEILVERSE · CONTROL TOWER</div><div id="tw-pre-l" class="tw-pre-l"></div><button id="tw-pre-go">MULAI KOKPIT</button><small>Tekan tombol untuk menyalakan suara. Esc untuk melewati.</small></div>';
    document.body.appendChild(ov);
    var started = false, l = $('tw-pre-l');
    function end() { if (!ov.parentNode) return; ov.classList.add('out'); setTimeout(function () { ov.remove(); }, 400); done(); }
    function go() {
      if (started) return; started = true; $('tw-pre-go').style.display = 'none'; ac(); SND.beep();
      var ts = tenants(), steps = [
        ['LAMPU INDIKATOR', 'OK'], ['SAMBUNGAN FIREBASE', g(function () { return typeof db !== 'undefined' && db; }, false) ? 'OK' : 'TERPUTUS'], ['REGISTRI TOKO', ts.length + ' TOKO'],
        ['SENSOR LOKASI', ts.filter(function (t) { return geoOf(t.id); }).length + ' TERPETAKAN'], ['LISTRIK BILLING', 'OK'], ['SISTEM SIAP', 'LEPAS LANDAS']
      ], i = 0;
      (function next() {
        if (i >= steps.length) { SND.ok(); setTimeout(end, 500); return; }
        var r = document.createElement('div'); r.innerHTML = '<span class="lamp"></span>' + esc(steps[i][0]) + ' <b>' + esc(steps[i][1]) + '</b>'; l.appendChild(r);
        setTimeout(function () { r.classList.add('on'); SND.beep(); }, 150); i++; setTimeout(next, S.eco ? 80 : 420);
      })();
    }
    $('tw-pre-go').onclick = go;
    document.addEventListener('keydown', function esc2(e) { if (e.key === 'Escape') { document.removeEventListener('keydown', esc2); end(); } });
    setTimeout(function () { var b = $('tw-pre-go'); if (b) b.focus(); }, 50);
  }

  /* ============ CSS ============ */
  var CSS = [
    'html[data-tw-ck] .fm-dock,html[data-tw-ck] #fm-dock{display:none!important}',
    'html[data-tw-ck][data-fm-page="tower"] main{padding:8px 14px 10px!important;gap:7px!important}',
    'html[data-tw-ck] header.oneui-hero{padding:6px 20px!important;margin-top:6px!important}',
    'html[data-tw-ck] header.oneui-hero p,html[data-tw-ck] header.oneui-hero [id*="slogan"]{display:none!important}',
    'html[data-tw-ck] header.oneui-hero h1{font-size:17px!important;font-family:Orbitron,"Share Tech Mono",ui-monospace,monospace;letter-spacing:.06em}',
    'html[data-tw-ck][data-fm-page="tower"] main>.grid:first-child{grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:7px!important}',
    'html[data-tw-ck][data-fm-page="tower"] main>.grid:first-child>*{padding:6px 11px!important;min-height:0;border-radius:10px!important;background:#03060a!important;border:1px solid rgba(94,255,190,.16)!important}',
    'html[data-tw-ck][data-fm-page="tower"] main>.grid:first-child>* span[class*="uppercase"],.tw-mt{font-size:9.5px!important;letter-spacing:.08em!important;font-family:"Share Tech Mono",ui-monospace,monospace}',
    'html[data-tw-ck][data-fm-page="tower"] main>.grid:first-child>* span[class*="rounded-full"]{display:none!important}',
    'html[data-tw-ck][data-fm-page="tower"] main>.grid:first-child>* h3,.tw-mv{font-size:19px!important;font-family:"Share Tech Mono",ui-monospace,monospace!important;color:#5dffbe!important;text-shadow:0 0 8px rgba(93,255,190,.45);margin:1px 0!important;line-height:1.1}',
    'html[data-tw-ck][data-fm-page="tower"] main>.grid:first-child>*:nth-child(3) h3{font-size:14px!important}',
    'html[data-tw-ck][data-fm-page="tower"] main>.grid:first-child>* p,.tw-ms{font-size:10px!important;color:#7f9aa8!important;font-family:"Share Tech Mono",ui-monospace,monospace}',
    '.tw-mon.proj .tw-mv{color:#ffd37a!important;text-shadow:0 0 8px rgba(255,211,122,.4)}.tw-ms b{color:#e08bff}',
    '.tw-fl{animation:twfl .9s ease-out}@keyframes twfl{0%{box-shadow:0 0 0 2px rgba(93,255,190,.9)}100%{box-shadow:0 0 0 0 rgba(93,255,190,0)}}',
    '#tw-ck{flex:1 1 0;min-height:0;display:flex;flex-direction:column;gap:7px;font-family:"Share Tech Mono",ui-monospace,Consolas,monospace;color:#cfe9df}',
    '.tw-bar{display:flex;align-items:center;gap:5px;flex:none;padding:4px 8px;overflow:hidden;border:1px solid rgba(94,255,190,.16);border-radius:10px;background:#03060a;font-size:11px}',
    '.tw-sp{flex:1}.tw-vr{width:1px;align-self:stretch;background:rgba(255,255,255,.12);margin:0 3px}',
    '.tw-b{white-space:nowrap;padding:2px 7px;font-size:10.5px;border-radius:6px;font-weight:700;letter-spacing:.06em;border:1px solid transparent}',
    '.tw-b.ok{color:#3dffa0;background:rgba(61,255,160,.09);border-color:rgba(61,255,160,.3)}.tw-b.idle{color:#8aa0ad;background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.1)}',
    '.tw-b.warn{color:#ffc247;background:rgba(255,194,71,.1);border-color:rgba(255,194,71,.35)}.tw-b.bad{color:#ff6b6b;background:rgba(255,90,90,.1);border-color:rgba(255,90,90,.4)}',
    '.blink{animation:twbl 1s steps(2,start) infinite}@keyframes twbl{50%{opacity:.25}}html.tw-eco .blink{animation:none}',
    '.tw-clk{color:#7fd8ff;letter-spacing:.02em;margin-left:4px;white-space:nowrap;font-size:10.5px}.tw-ab,.tw-tg{white-space:nowrap}',
    '.tw-tg{all:unset;cursor:pointer;display:flex;align-items:center;gap:6px;padding:2px 6px;border-radius:6px;border:1px solid rgba(255,255,255,.12);color:#8aa0ad;font-size:10px;font-weight:700;letter-spacing:.06em}',
    '.tw-tg i{width:22px;height:11px;border-radius:6px;background:#1a2229;position:relative;display:block}.tw-tg i:after{content:"";position:absolute;top:1px;left:1px;width:9px;height:9px;border-radius:50%;background:#5b6b78;transition:left .15s,background .15s}',
    '.tw-tg.on{color:#3dffa0}.tw-tg.on i:after{left:12px;background:#3dffa0;box-shadow:0 0 6px #3dffa0}',
    '.tw-ab{all:unset;cursor:pointer;display:flex;align-items:center;gap:4px;padding:3px 7px;border-radius:6px;border:1px solid rgba(255,255,255,.14);color:#cfe9df;font-size:10.5px;font-weight:700;letter-spacing:.05em}',
    '.tw-ab:hover{background:rgba(93,255,190,.1);border-color:rgba(93,255,190,.4)}.tw-ab.bad{color:#ff8e8e}.tw-ab.bad:hover{background:rgba(255,90,90,.12);border-color:rgba(255,90,90,.45)}',
    '.tw-ab .ic svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;display:block}',
    '.tw-main{flex:1 1 0;min-height:0;display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1.05fr) minmax(0,1fr);gap:7px}',
    '.tw-pane{min-height:0;min-width:0;display:flex;flex-direction:column;border:1px solid rgba(94,255,190,.16);border-radius:10px;background:#02050a;overflow:hidden}',
    '.tw-ph{flex:none;display:flex;align-items:center;gap:8px;padding:5px 10px;font-family:Orbitron,"Share Tech Mono",monospace;font-size:10px;letter-spacing:.14em;color:#9fe9cf;border-bottom:1px solid rgba(94,255,190,.12)}.tw-ph small{font-family:"Share Tech Mono",monospace;letter-spacing:.03em;color:#6f8794;font-size:10px}',
    '.tw-l{display:inline-block;width:9px;height:9px;border-radius:50%;flex:none;background:#5b6b78}',
    '.tw-l.green{background:#3dffa0;box-shadow:0 0 7px #3dffa0}.tw-l.red{background:#ff5a5a;box-shadow:0 0 7px #ff5a5a}.tw-l.amber{background:#ffc247;box-shadow:0 0 7px #ffc247}.tw-l.off{background:#3a4650}',
    '.tw-mapbox{position:relative;flex:1 1 0;min-height:0;background:radial-gradient(70% 70% at 50% 50%,#04121a,#010306);cursor:grab;overflow:hidden}.tw-mapbox.drag{cursor:grabbing}',
    '#tw-svg{width:100%;height:100%;display:block}.tw-grid line{stroke:rgba(94,255,190,.07);stroke-width:.6}.tw-land polygon{fill:#0a2a2a;stroke:#2fd6a1;stroke-width:.9;stroke-linejoin:round;vector-effect:non-scaling-stroke;opacity:.95}',
    '.tw-dot{cursor:pointer}.tw-dot circle{vector-effect:none}.tw-ping{animation:twp 1.4s ease-out infinite;transform-origin:center}@keyframes twp{0%{r:4;opacity:1}100%{r:24;opacity:0}}html.tw-eco .tw-ping{animation:none}',
    '.tw-sweep{position:absolute;inset:0;pointer-events:none;background:conic-gradient(from 0deg at 50% 50%,rgba(61,255,160,.16),rgba(61,255,160,0) 22%,rgba(61,255,160,0));animation:twsw 7s linear infinite;mix-blend-mode:screen;opacity:.55}@keyframes twsw{to{transform:rotate(360deg)}}html.tw-eco .tw-sweep{display:none}',
    '.tw-zm{position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:4px}.tw-zm button{all:unset;cursor:pointer;width:24px;height:24px;text-align:center;line-height:23px;border-radius:6px;border:1px solid rgba(94,255,190,.3);background:rgba(2,8,12,.85);color:#9fe9cf;font-size:14px}.tw-zm button:hover{background:rgba(94,255,190,.15)}',
    '.tw-leg{position:absolute;left:8px;bottom:6px;display:flex;gap:9px;font-size:9.5px;color:#7f9aa8}.tw-leg i{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:4px}.tw-leg .g{background:#3dffa0}.tw-leg .o{background:#5b6b78}.tw-leg .a{background:#ffc247}.tw-leg .r{background:#ff5a5a}',
    '.tw-rows{flex:1 1 0;min-height:0;overflow:auto;padding:4px}.tw-row{display:flex;align-items:center;gap:8px;padding:5px 7px;border-radius:8px;border:1px solid rgba(255,255,255,.06);margin-bottom:4px;background:rgba(255,255,255,.02)}.tw-row:hover{border-color:rgba(93,255,190,.3)}',
    '.tw-row .nm{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15}.tw-row .nm b{font-size:11.5px;color:#e6f5ef;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tw-row .nm small{font-size:9.5px;color:#6f8794}',
    '.lvs{display:flex;gap:5px}.tw-lv{all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px}.tw-lv i{position:relative;display:block;width:15px;height:26px;border-radius:8px;background:#0b1217;border:1px solid rgba(255,255,255,.18)}',
    '.tw-lv i:after{content:"";position:absolute;left:2px;width:9px;height:11px;border-radius:5px;background:linear-gradient(#c9d3da,#6e7c86);transition:top .18s cubic-bezier(.4,1.6,.5,1);top:12px}',
    '.tw-lv.on i:after{top:2px;background:linear-gradient(#7dffc6,#18b97a);box-shadow:0 0 7px rgba(61,255,160,.7)}.tw-lv b{font-size:8px;letter-spacing:.06em;color:#7f9aa8;font-weight:700}.tw-lv.on b{color:#3dffa0}.tw-lv.dis{opacity:.3;cursor:not-allowed}',
    '.tw-lv.on[data-act="trial"] i:after{background:linear-gradient(#f0b3ff,#a24ad1);box-shadow:0 0 7px rgba(224,139,255,.7)}.tw-lv.on[data-act="trial"] b{color:#e08bff}',
    '.bt{display:flex;flex-direction:column;gap:3px}.bt button,.tw-ar button,.tw-sub button{all:unset;cursor:pointer;padding:2px 8px;border-radius:5px;border:1px solid rgba(255,255,255,.16);font-size:9.5px;letter-spacing:.05em;color:#cfe9df;text-align:center}.bt button:hover,.tw-ar button:hover,.tw-sub button:hover{background:rgba(93,255,190,.12);border-color:rgba(93,255,190,.4)}',
    '.tw-tabbar{flex:none;display:flex;border-bottom:1px solid rgba(94,255,190,.12)}.tw-tab{all:unset;cursor:pointer;flex:1;text-align:center;padding:6px 2px;font-size:9.5px;letter-spacing:.07em;color:#6f8794;position:relative;border-bottom:2px solid transparent;white-space:nowrap}',
    '.tw-tab.on{color:#3dffa0;border-bottom-color:#3dffa0;background:rgba(61,255,160,.06)}.tw-tab:hover{color:#cfe9df}.tw-tab[data-n]:not([data-n=""]):after{content:attr(data-n);margin-left:4px;padding:0 5px;border-radius:8px;background:#ff5a5a;color:#fff;font-size:9px}.tw-tab.warn:not(.on){color:#ffc247}',
    '.tw-pgs{flex:1 1 0;min-height:0;display:flex;flex-direction:column}.tw-pg{flex:1 1 0;min-height:0;overflow:auto;padding:5px 7px}.tw-pg[data-t="konsol"]{display:flex;flex-direction:column;padding:0}.tw-pg[data-t="log"]{padding:0}',
    '.tw-logbox{flex:1 1 0;min-height:0;overflow:auto;padding:6px 8px;font-size:11px;line-height:1.5}.tw-ln{display:flex;gap:7px;word-break:break-word}.tw-ln .t{color:#4f6573;flex:none}.tw-ln.sale .m{color:#5dffbe}.tw-ln.cost .m{color:#ffb46b}.tw-ln.up .m{color:#62ff9c}.tw-ln.down .m{color:#ff7b7b}.tw-ln.alarm .m{color:#ff6b6b}.tw-ln.sys .m{color:#8fd0ff}.tw-ln.cmd .m{color:#e6f5ef}',
    '.tw-caret{font-style:normal;animation:twbl .8s steps(2,start) infinite;color:#3dffa0}',
    '.tw-cinw{flex:none;display:flex;gap:6px;align-items:center;padding:5px 8px;border-top:1px solid rgba(94,255,190,.14);background:#01040a}.tw-cinw span{color:#3dffa0}.tw-cinw input{all:unset;flex:1;color:#e6f5ef;font-size:11.5px;caret-color:#3dffa0}',
    '.tw-ar{display:flex;align-items:center;gap:8px;padding:5px 7px;margin-bottom:4px;border-radius:7px;border:1px solid rgba(255,255,255,.08);font-size:11px;justify-content:space-between}.tw-ar.lv2{border-color:rgba(255,90,90,.4);color:#ffb3b3}.tw-ar.lv1{border-color:rgba(255,194,71,.35);color:#ffe0a0}.tw-ar>span:first-child{flex:1}.tw-ar button.no{color:#ff8e8e}',
    '.tw-empty{color:#6f8794;font-size:11px;padding:12px 6px;text-align:center}.tw-sub{text-align:right;margin-top:6px}',
    '.tw-t{width:100%;border-collapse:collapse;font-size:10.5px}.tw-t th{text-align:left;color:#6f8794;font-weight:400;padding:3px 4px;border-bottom:1px solid rgba(255,255,255,.1)}.tw-t td{padding:4px;border-bottom:1px solid rgba(255,255,255,.05)}.tw-t .num{text-align:right;color:#5dffbe}.tw-t .tr{color:#e08bff}.tw-t .ru{color:#3dffa0}',
    '.tw-tab{font-size:9px!important;letter-spacing:.03em!important}.tw-main{grid-template-columns:minmax(0,1.08fr) minmax(0,.95fr) minmax(0,1.25fr)!important}',
    '.fp{display:inline-flex;gap:1px}.fc{display:inline-block;min-width:11px;text-align:center;background:linear-gradient(#10181d 49%,#04080b 51%);border:1px solid rgba(255,255,255,.08);border-radius:3px;padding:1px 2px;color:#ffd37a;font-weight:400}.fc.fl{animation:twfp .35s ease-out}@keyframes twfp{0%{transform:rotateX(-90deg);opacity:.2}100%{transform:rotateX(0);opacity:1}}',
    '.tw-sub0{font-size:10.5px;color:#7f9aa8;padding:5px 2px}.tw-sub0 b{color:#5dffbe}.tw-heat{display:grid;grid-template-columns:repeat(12,1fr);gap:3px}.hc{border-radius:5px;border:1px solid rgba(61,255,160,.12);text-align:center;padding:4px 0;line-height:1.15}.hc b{display:block;font-size:10px;color:#e6f5ef;font-weight:400}.hc small{font-size:9px;color:#9fe9cf}',
    '.tw-rpbar{display:flex;gap:6px;align-items:center;padding:5px 7px}.tw-rpbar select,.tw-rpbar input{all:unset;box-sizing:border-box;padding:3px 7px;border:1px solid rgba(255,255,255,.16);border-radius:6px;color:#e6f5ef;font-size:11px;background:#02050a}.tw-rpbar input{flex:1}.tw-rpbar button{all:unset;cursor:pointer;padding:3px 10px;border-radius:6px;border:1px solid rgba(61,255,160,.45);color:#3dffa0;font-size:10.5px;letter-spacing:.06em}.tw-rpbar button:hover{background:rgba(61,255,160,.12)}',
    '.tw-prog{height:3px;background:rgba(255,255,255,.07);margin:0 7px}.tw-prog i{display:block;height:100%;width:0;background:#3dffa0;box-shadow:0 0 6px #3dffa0;transition:width .15s}',
    '.tw-pg[data-t="replay"]{display:flex;flex-direction:column;padding:0}',
    '.tw-bl{border:1px solid rgba(94,255,190,.18);border-radius:10px;padding:10px;margin-bottom:8px;text-align:center;background:rgba(255,255,255,.02)}.tw-bl.live{border-color:rgba(255,90,90,.5);box-shadow:0 0 14px rgba(255,90,90,.12)}.tw-bl .cm{font-size:10px;color:#7f9aa8;letter-spacing:.05em}.tw-bl .red{color:#ff5a5a;animation:twbl 1s steps(2,start) infinite}',
    '.tw-bl .tm{display:flex;align-items:center;justify-content:center;gap:10px;margin:8px 0;font-size:13px;color:#e6f5ef}.tw-bl .tm span{flex:1;text-align:center}.tw-bl .sc{font-size:26px;color:#5dffbe;text-shadow:0 0 10px rgba(93,255,190,.5);font-weight:400}.tw-bl .mn{font-size:20px;color:#ffd37a;letter-spacing:.06em}.tw-bl small{display:block;color:#6f8794;font-size:10px;margin-top:4px}.tw-bl.last .sc{font-size:18px}',
    /* pra-terbang */
    '#tw-pre{position:fixed;inset:0;z-index:200;background:#000;display:flex;align-items:center;justify-content:center;font-family:"Share Tech Mono",ui-monospace,monospace;transition:opacity .4s}#tw-pre.out{opacity:0}',
    '.tw-pre-box{width:min(460px,90vw);text-align:center;color:#9fe9cf}.tw-pre-t{font-family:Orbitron,"Share Tech Mono",monospace;letter-spacing:.2em;font-size:13px;margin-bottom:18px;color:#3dffa0}',
    '.tw-pre-l{text-align:left;min-height:130px;font-size:12px}.tw-pre-l div{display:flex;align-items:center;gap:9px;padding:3px 0;opacity:.4}.tw-pre-l div.on{opacity:1}.tw-pre-l .lamp{width:9px;height:9px;border-radius:50%;background:#3a4650}.tw-pre-l div.on .lamp{background:#3dffa0;box-shadow:0 0 8px #3dffa0}.tw-pre-l b{margin-left:auto;color:#3dffa0}',
    '#tw-pre-go{all:unset;cursor:pointer;margin-top:10px;padding:10px 26px;border-radius:8px;border:1px solid #3dffa0;color:#3dffa0;letter-spacing:.18em;font-size:12px}#tw-pre-go:hover{background:rgba(61,255,160,.14)}.tw-pre-box small{display:block;margin-top:12px;color:#5b6b78;font-size:10.5px}',
    /* pop-up bergaya panel pesawat */
    'html[data-fm-page="tower"] #main-modal-container{font-family:"Share Tech Mono",ui-monospace,Consolas,monospace}',
    'html[data-fm-page="tower"] #main-modal-container>div{background:#000!important;border:1px solid rgba(94,255,190,.28)!important;box-shadow:0 0 40px rgba(61,255,160,.08)}',
    'html[data-fm-page="tower"] #main-modal-container #modal-title{font-family:Orbitron,"Share Tech Mono",monospace;letter-spacing:.12em;font-size:13px;color:#3dffa0}',
    'html[data-fm-page="tower"] #main-modal-container input,html[data-fm-page="tower"] #main-modal-container select,html[data-fm-page="tower"] #main-modal-container textarea,html[data-fm-page="tower"] #main-modal-container button{font-family:inherit}',
    'html[data-fm-page="tower"] #main-modal-container .font-mono{text-shadow:0 0 6px rgba(93,255,190,.25)}',
    'html[data-fm-page="tower"] #main-modal-container th{letter-spacing:.08em}',
    '@media(max-width:1023px){#tw-ck{display:none}html[data-tw-ck] #fm-dock{display:flex!important}}'
  ].join('\n');

  /* ============ jalan ============ */
  var timers = [];
  function tick1() { if (document.hidden) return; renderBoard(); drawDots(); updateBar(); updateMonitors(); if (curTab === 'alarm') renderTab('alarm'); if (curTab === 'tiket') renderTab('tiket'); }
  function tickCd() {
    if (document.hidden) return; var now = Date.now();
    [].forEach.call(document.querySelectorAll('#tw-pg-billing [data-cd]'), function (el) { var e = +el.getAttribute('data-cd'); if (e) setFlap(el, cd(e - now)); });
    [].forEach.call(document.querySelectorAll('#tw-pg-billing [data-live]'), function (el) { var b = ctrl(el.getAttribute('data-live')).billing; if (g(function () { return FM_BILL.ok(b); }, false)) el.textContent = 'Rp ' + FM_BILL.fmt(FM_BILL.meter(b, now)); });
    bolaTick();
    var c = $('tw-b-clk'); if (c) c.textContent = 'WIB ' + clock(now, 7) + ' · WITA ' + clock(now, 8).slice(0, 5) + ' · WIT ' + clock(now, 9).slice(0, 5);
  }
  function start() {
    var st = document.createElement('style'); st.id = 'tw-ck-css'; st.textContent = CSS; document.head.appendChild(st);
    var lk = document.createElement('link'); lk.rel = 'stylesheet'; lk.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Share+Tech+Mono&display=swap'; document.head.appendChild(lk);
    if (window.innerWidth < 1024) return;
    var tries = 0;
    (function wait() {
      var acts = $('fm-actions');
      if (acts && acts.classList.contains('tw-grouped')) {
        build();
        preflight(function () { setTab('log'); });
        tick1();
        timers.push(setInterval(tick1, 1500), setInterval(tickCd, 1000), setInterval(function () { if (!document.hidden) scanEvents(); }, 2000), setInterval(function () { if (!document.hidden && seeded) trend(); }, 180000), setInterval(function () { bolaFetch(false); }, 20000));
        setTimeout(function () { if (seeded) trend(); }, 6000);
        var ca = window.ctAudit;
        if (typeof ca === 'function') window.ctAudit = function (tid, action, detail) { try { addLog('sys', 'AKSI TOWER · ' + (tid && tid !== '-' ? tid + ' · ' : '') + (detail || action), false, null); boxLoaded = 0; } catch (e) {} return ca.apply(this, arguments); };
        return;
      }
      if (++tries < 80) setTimeout(wait, 150);
    })();
  }
  window.FM_COCKPIT = { sound: SND, state: S, addLog: addLog };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
