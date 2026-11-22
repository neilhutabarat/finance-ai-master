/* Control Tower: dua laman. MONITOR (hanya lihat: tabel toko lengkap, log transaksi mengetik, jam sibuk, perhatian) dan KENDALI (tombol berkelompok). Tampilan datar: hitam + hijau/kuning/merah/abu/putih. Suara dan log mengetik dipertahankan. Hanya desktop (>=1024px). */
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
  function isDemoId(id) { return /^ID0{4,}/i.test(String(id || '')); }
  function tenants() { return g(function () { return billTenants(); }, []).filter(function (t) { return !isDemoId(t.id); }); }
  function ctrl(id) { return g(function () { return getCtrl(id); }, {}); }
  function txs(id) { return g(function () { return getTenantTxList(id); }, []); }
  function online(id) { return g(function () { return onlineSessions(id); }, []); }
  function suspended(id) { return g(function () { return isTenantSuspended(id); }, false); }
  function src(id) { return g(function () { return tenantSource[id]; }, 'firestore'); }
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
    ok: function () { tone(520, 0.08, 'sine', 0.06); tone(780, 0.08, 'sine', 0.06, 0.09); tone(1040, 0.12, 'sine', 0.06, 0.18); },
    radar: function () { tone(1570, 0.055, 'sine', 0.05, 0, 2090); tone(1570, 0.055, 'sine', 0.045, 0.13, 2090); } /* "bip-bip" naik — menyerupai Dragon Radar */
  };
  var lastSpeak = 0;
  function speak(txt) {
    if (!S.on || !S.voice || !window.speechSynthesis || Date.now() - lastSpeak < 8000) return;
    lastSpeak = Date.now();
    try { var u = new SpeechSynthesisUtterance(txt); u.lang = 'id-ID'; u.rate = 0.95; u.volume = 1; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
  }
  function geoOf(id) {
    var best = null;
    g(function () { Object.keys(presenceMap).forEach(function (k) { var p = presenceMap[k]; if (p.tenantId === id && p.geo && typeof p.geo.lat === 'number' && (!best || p.ms > best.ms)) best = p; }); });
    return best ? { lat: best.geo.lat, lon: best.geo.lon, name: best.geo.name || '', live: Date.now() - best.ms < 120000 } : null;
  }

  /* ============ status toko ============ */
  function state(id) {
    var b = ctrl(id).billing;
    return g(function () { return FM_BILL.status(b, Date.now()); }, { state: 'none' }).state;
  }
  var BN = { lunas: 'lunas', tempo: 'masa tenggang', lewat: 'lewat tenggang', belum: 'belum mulai', none: 'belum diatur' };
  function pendingCount() { return g(function () { return allTickets.filter(function (x) { return x.status === 'PENDING'; }).length; }, 0); }

  /* ============ log (efek mengetik) ============ */
  var typeQ = [], typing = false;
  function fitLog(box) {
    // Log tidak pakai gulir: baris terlama dibuang begitu tidak muat di tinggi kotak, bukan di-scroll.
    var guard = 0;
    if (!box.__ro && window.ResizeObserver) { box.__ro = new ResizeObserver(function () { fitLog(box); }); box.__ro.observe(box); }
    while (box.children.length > 1 && box.scrollHeight > box.clientHeight && guard++ < 200) box.removeChild(box.firstChild);
  }
  function addLog(kind, text, instant, sound) {
    var box = $('tw-log'); if (!box) return;
    var row = document.createElement('div'); row.className = 'ln ' + kind;
    row.innerHTML = '<span class="t">' + clock(Date.now(), 7) + '</span><span class="m"></span>';
    box.appendChild(row);
    while (box.children.length > 120) box.removeChild(box.firstChild);
    var m = row.lastChild;
    if (instant || S.eco || typeQ.length > 10 || document.hidden) { m.textContent = text; fitLog(box); if (sound && !instant) SND[sound] && SND[sound](); return; }
    typeQ.push({ m: m, text: text, sound: sound, box: box }); pump();
  }
  function pump() {
    if (typing || !typeQ.length) return; typing = true;
    var it = typeQ.shift(), i = 0;
    if (it.sound) SND[it.sound] && SND[it.sound]();
    (function step() {
      i = Math.min(it.text.length, i + 2);
      it.m.innerHTML = esc(it.text.slice(0, i)) + (i < it.text.length ? '<i class="caret">_</i>' : '');
      fitLog(it.box); SND.type();
      if (i < it.text.length) setTimeout(step, 22); else { typing = false; setTimeout(pump, 40); }
    })();
  }

  /* ============ deteksi kejadian nyata ============ */
  var seen = {}, seeded = false, lastState = {}, lastOnline = {}, lastTickets = null, lastTrend = {}, bootAt = Date.now(), lastDef = null;
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
      seeded = true; lastTickets = pendingCount(); aggAt = 0; renderJam();
      tenants().forEach(function (tn) { lastState[tn.id] = state(tn.id) + (suspended(tn.id) ? 'S' : ''); lastOnline[tn.id] = online(tn.id).length > 0; });
      briefing(all); return;
    }
    var fresh = false;
    all.forEach(function (o) {
      var k = txKey(o.tn.id, o.t); if (seen[k]) return; seen[k] = 1; fresh = true;
      addLog(o.t.category === 'sales' ? 'sale' : 'cost', txText(o), false, o.t.category === 'sales' ? 'tick' : 'beep');
    });
    if (fresh) aggAt = 0;
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
  function trend() {
    tenants().forEach(function (tn) {
      var a = dayIncome(tn.id, ymd(new Date())), b = dayIncome(tn.id, ymd(new Date(Date.now() - 86400000)));
      if (!a && !b) return;
      var dir = a > b ? 'naik' : (a < b ? 'turun' : 'tetap'), key = dir + '|' + a + '|' + b;
      if (lastTrend[tn.id] === key) return; lastTrend[tn.id] = key;
      var pct = b ? Math.round(Math.abs(a - b) / b * 100) + '%' : 'baru';
      addLog(dir === 'turun' ? 'down' : 'up', tn.id + ' · ' + tn.nama + ' · OMZET ' + (dir === 'naik' ? '▲ naik ' : dir === 'turun' ? '▼ turun ' : '= tetap ') + pct + ' · hari ini ' + rp(a) + ' vs kemarin ' + rp(b), false, null);
    });
  }
  function dayIncome(id, iso) { var s = 0; txs(id).forEach(function (t) { if (t.category === 'sales' && (t.dateISO || '') === iso) s += t.amount || 0; }); return s; }

  /* ============ Oneil Shield: kejadian keamanan (kunci PIN/blokir/perangkat baru) tampil di LOG TRANSAKSI ============ */
  var secAudit = { seen: {}, seeded: false };
  function pollSecurity() {
    var d = g(function () { return db; }, null); if (!d) return;
    d.collection('manager_audit_logs').where('action', 'in', ['KEAMANAN_PIN_TERKUNCI', 'KEAMANAN_PIN_DIBLOKIR', 'KEAMANAN_PERANGKAT_BARU']).limit(40).get().then(function (snap) {
      var docs = []; snap.forEach(function (doc) { docs.push({ id: doc.id, d: doc.data() || {} }); });
      docs.sort(function (a, b) { return (a.d.timestamp || 0) - (b.d.timestamp || 0); });
      if (!secAudit.seeded) { docs.forEach(function (o) { secAudit.seen[o.id] = 1; }); secAudit.seeded = true; return; }
      docs.forEach(function (o) {
        if (secAudit.seen[o.id]) return; secAudit.seen[o.id] = 1;
        var bad = o.d.action === 'KEAMANAN_PIN_DIBLOKIR';
        addLog(bad ? 'alarm' : 'sys', '🛡️ SHIELD · ' + (o.d.tenantId || '-') + ' · ' + (o.d.detail || o.d.action), false, bad ? 'alarm' : 'notif');
        if (bad) speak('Peringatan keamanan dari Oneil Shield');
      });
    }).catch(function () {});
  }
  function briefing(all) {
    var d0 = ymd(new Date()), sales = 0, n = 0;
    all.forEach(function (o) { if (o.t.category === 'sales' && (o.t.dateISO || '') === d0) { sales += o.t.amount || 0; n++; } });
    addLog('sys', 'BRIEFING · hari ini ' + n + ' penjualan senilai ' + rp(sales) + ' · ' + alarms().length + ' alarm · ' + pendingCount() + ' tiket menunggu', false, 'ok');
  }

  /* ============ alarm & siaga ============ */
  function alarms() {
    var out = [];
    tenants().forEach(function (tn) {
      var s = state(tn.id);
      if (suspended(tn.id)) out.push({ lv: 2, tx: tn.id + ' · ' + tn.nama + ' · DIBEKUKAN' });
      else if (s === 'lewat') out.push({ lv: 2, tx: tn.id + ' · ' + tn.nama + ' · lewat tenggang billing' });
      else if (s === 'tempo') out.push({ lv: 1, tx: tn.id + ' · ' + tn.nama + ' · masa tenggang billing' });
    });
    var pc = pendingCount(); if (pc) out.push({ lv: 1, tx: pc + ' permohonan kasir menunggu (buka KENDALI > Permohonan Kasir)' });
    return out;
  }
  function defcon() {
    var al = alarms(), red = al.filter(function (a) { return a.lv === 2; }).length;
    if (red >= 2) return 2; if (red === 1) return 3; if (al.length) return 4; return 5;
  }

  /* ============ tabel toko (satu baris memuat semua data) ============ */
  var agg = {}, aggAt = 0, SPARK = '▁▂▃▄▅▆▇█';
  function nf(n) { return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(n || 0)); }
  function diag(id) {
    var list = txs(id), cat = {}, noDate = 0, bulan = ymd(new Date()).slice(0, 7), bulanThis = 0;
    list.forEach(function (t) {
      var c = t.category || '(kosong)'; cat[c] = cat[c] || { n: 0, amt: 0 };
      cat[c].n++; cat[c].amt += (t.amount || 0);
      if (!t.dateISO) noDate++;
      if ((t.dateISO || '').slice(0, 7) === bulan) bulanThis++;
    });
    var lines = ['Diagnostik: ' + id, 'Sumber data: ' + src(id) + (src(id) !== 'firestore' ? ' (bukan server — cek koneksi/izin akses)' : ''),
      'Total transaksi tersimpan: ' + list.length, 'Transaksi bulan ini: ' + bulanThis,
      'Transaksi tanpa tanggal (dateISO kosong, tidak ikut terhitung di Monitor): ' + noDate, ''];
    Object.keys(cat).sort().forEach(function (c) { lines.push(c + ': ' + cat[c].n + ' trx, total Rp ' + nf(cat[c].amt)); });
    if (!list.length) lines.push('(tidak ada data transaksi yang terbaca untuk toko ini)');
    return lines.join('\n');
  }
  function compute() {
    var first = ymd(new Date()).slice(0, 8) + '01', d0 = ymd(new Date()), days = [], i;
    for (i = 6; i >= 0; i--) days.push(ymd(new Date(Date.now() - i * 86400000)));
    var out = {};
    tenants().forEach(function (tn) {
      var a = { inc: 0, out: 0, tax: 0, trx: 0, today: 0, yest: 0, sp: [0, 0, 0, 0, 0, 0, 0] };
      txs(tn.id).forEach(function (t) {
        var d = t.dateISO || (t.timestamp ? ymd(new Date(t.timestamp)) : '') || '', sales = t.category === 'sales', amt = t.amount || 0, inMonth = !d || d >= first;
        if (d === d0) a.trx++;
        if (sales) {
          if (inMonth) a.inc += amt;
          var k = days.indexOf(d); if (k >= 0) a.sp[k] += amt;
        } else if (inMonth) { a.out += amt; a.tax += t.tax12 || Math.round(amt * 0.12); }
      });
      a.today = a.sp[6]; a.yest = a.sp[5];
      out[tn.id] = a;
    });
    agg = out; aggAt = Date.now();
  }
  function spark(sp) {
    var mx = Math.max.apply(null, sp.concat([0]));
    if (!mx) return '<span class="m">▁▁▁▁▁▁▁</span>';
    return sp.map(function (v) { return SPARK.charAt(Math.min(7, Math.round(v / mx * 7))); }).join('');
  }
  function dur(ms) {
    ms = Math.max(0, ms); var s = Math.floor(ms / 1000), d = Math.floor(s / 86400); s -= d * 86400;
    return (d ? d + 'hr ' : '') + pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60);
  }
  function billCell(id, now) {
    var b = ctrl(id).billing, ok = g(function () { return FM_BILL.ok(b); }, false);
    if (!ok) return { v: '-', c: 'm' };
    var st = g(function () { return FM_BILL.status(b, now); }, { state: 'none' });
    var c = st.state === 'lewat' ? 'r' : (st.state === 'tempo' || b.trial) ? 'y' : st.state === 'belum' ? 'm' : 'g';
    return { v: st.state === 'belum' ? '0,00' : g(function () { return FM_BILL.fmt(FM_BILL.meter(b, now)); }, '-'), c: c, st: st, trial: !!b.trial };
  }
  function dueCell(id, now) {
    var b = ctrl(id).billing, st = g(function () { return FM_BILL.status(b, now); }, { state: 'none' });
    if (st.state === 'none') return { v: '-', c: 'm' };
    if (st.state === 'belum') return { v: 'mulai ' + g(function () { return FM_BILL.dateText(b.startMs); }, ''), c: 'm' };
    if (st.state === 'lewat' || st.state === 'tempo') return { v: '+' + dur(now - (st.overdueFrom || now)), c: st.state === 'lewat' ? 'r' : 'y', live: st.overdueFrom };
    return { v: g(function () { return FM_BILL.dateText(st.E); }, '-'), c: '', };
  }
  var SORT = { key: 'last', dir: -1 };
  var SORTKEY = ['', 'id', 'nama', 'kota', 'trx', 'inc', 'out', 'lab', 'tax', '', 'vs', 'on', 'bill', 'due', 'last'];
  function setSort(key) {
    if (!key) return;
    if (SORT.key === key) SORT.dir = -SORT.dir; else { SORT.key = key; SORT.dir = key === 'id' || key === 'nama' || key === 'kota' ? 1 : -1; }
    renderTable();
    [].forEach.call(document.querySelectorAll('#tw-tbw th[data-sk]'), function (th) {
      th.classList.toggle('sorted', th.getAttribute('data-sk') === SORT.key);
      th.querySelector && (function () { var m = th.querySelector('.sk-ar'); if (m) m.textContent = th.getAttribute('data-sk') === SORT.key ? (SORT.dir > 0 ? ' ▲' : ' ▼') : ''; })();
    });
  }
  function renderTable() {
    var box = $('tw-rows'); if (!box) return;
    if (Date.now() - aggAt > 4000) compute();
    var now = Date.now(), ts = tenants(), rows = [];
    ts.forEach(function (tn) {
      var a = agg[tn.id] || { inc: 0, out: 0, tax: 0, trx: 0, today: 0, yest: 0, sp: [0, 0, 0, 0, 0, 0, 0] };
      var on = online(tn.id).length, sus = suspended(tn.id), bc = billCell(tn.id, now), dc = dueCell(tn.id, now);
      var ps = g(function () { return presenceState(tn.id); }, on ? 'on' : 'off'), lamp = ps === 'on' ? 'g blink' : ps === 'afk' ? 'y' : 'r';
      var vs = a.yest ? Math.round((a.today - a.yest) / a.yest * 100) : null, vsT, vsC, vsN;
      if (a.today === a.yest) { vsT = '▬ 0%'; vsC = 'm'; vsN = 0; } else if (vs === null) { vsT = '▲ baru'; vsC = 'g'; vsN = 1e9; } else if (vs > 0) { vsT = '▲ ' + vs + '%'; vsC = 'g'; vsN = vs; } else { vsT = '▼ ' + Math.abs(vs) + '%'; vsC = 'r'; vsN = vs; }
      var lastMs = on ? now : g(function () { return lastActiveMs(tn.id); }, 0);
      var last = on ? 'sekarang' : g(function () { return agoText(lastActiveMs(tn.id)); }, '-'), geo = geoOf(tn.id), lab = a.inc - a.out;
      var kotaName = geo && geo.name ? geo.name : '-';
      rows.push({
        tn: tn, a: a, on: on, sus: sus, bc: bc, dc: dc, lamp: lamp, vsT: vsT, vsC: vsC, vsN: vsN, last: last, lastMs: lastMs, kota: kotaName, lab: lab,
        billN: g(function () { return FM_BILL.meter(ctrl(tn.id).billing, now); }, 0)
      });
    });
    rows.sort(function (ra, rb) {
      var k = SORT.key, d = SORT.dir, va, vb;
      switch (k) {
        case 'id': va = ra.tn.id; vb = rb.tn.id; break;
        case 'nama': va = ra.tn.nama; vb = rb.tn.nama; break;
        case 'kota': va = ra.kota; vb = rb.kota; break;
        case 'trx': va = ra.a.trx; vb = rb.a.trx; break;
        case 'inc': va = ra.a.inc; vb = rb.a.inc; break;
        case 'out': va = ra.a.out; vb = rb.a.out; break;
        case 'lab': va = ra.lab; vb = rb.lab; break;
        case 'tax': va = ra.a.tax; vb = rb.a.tax; break;
        case 'vs': va = ra.vsN; vb = rb.vsN; break;
        case 'on': va = ra.on; vb = rb.on; break;
        case 'bill': va = ra.billN; vb = rb.billN; break;
        case 'due': va = ra.dc.live || 0; vb = rb.dc.live || 0; break;
        default: va = ra.lastMs; vb = rb.lastMs;
      }
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); return va < vb ? -d : va > vb ? d : 0; }
      return (va - vb) * d;
    });
    var html = rows.map(function (r) {
      var tn = r.tn, a = r.a, on = r.on, sus = r.sus, bc = r.bc, dc = r.dc;
      var srcBadge = src(tn.id) !== 'firestore' ? ' <span class="y" title="Data toko ini dibaca dari penyimpanan lokal, bukan server — transaksi baru kemungkinan tidak ikut terhitung. Klik nama toko untuk rincian.">⚠LOKAL</span>' : '';
      return '<tr><td class="' + r.lamp + '">●</td><td class="w" title="' + esc(tn.id) + '">' + esc(tn.id) + '</td><td class="w wrap" data-diag="' + esc(tn.id) + '" style="cursor:pointer" title="' + esc(tn.nama) + ' — klik untuk rincian data">' + esc(tn.nama) + (sus ? ' <span class="r">(beku)</span>' : '') + srcBadge + '</td><td class="wrap" title="' + esc(r.kota) + '">' + esc(r.kota) + '</td>' +
        '<td class="n">' + a.trx + '</td><td class="n">' + nf(a.inc) + '</td><td class="n">' + nf(a.out) + '</td><td class="n ' + (r.lab < 0 ? 'r' : 'g') + '">' + nf(r.lab) + '</td><td class="n">' + nf(a.tax) + '</td>' +
        '<td class="' + (r.vsC === 'r' ? 'y' : r.vsC === 'g' ? 'g' : 'm') + '">' + spark(a.sp) + '</td><td class="n ' + r.vsC + '">' + r.vsT + '</td><td class="n ' + (on ? 'g' : 'm') + '">' + on + '</td>' +
        '<td class="n ' + bc.c + '"><span data-live="' + esc(tn.id) + '">' + bc.v + '</span></td><td class="' + dc.c + '"><span' + (dc.live ? ' data-due="' + esc(tn.id) + '"' : '') + '>' + dc.v + '</span></td><td class="' + (on ? 'g' : 'm') + '">' + esc(r.last) + '</td></tr>';
    }).join('');
    box.innerHTML = html || '<tr><td colspan="15" class="m" style="padding:14px">Belum ada toko terdaftar.</td></tr>';
  }
  function tickLive() {
    var now = Date.now();
    [].forEach.call(document.querySelectorAll('#tw-rows [data-live]'), function (el) { el.textContent = billCell(el.getAttribute('data-live'), now).v; });
    [].forEach.call(document.querySelectorAll('#tw-rows [data-due]'), function (el) { var d = dueCell(el.getAttribute('data-due'), now); if (d.live) el.textContent = d.v; });
    var c = $('tw-clk'); if (c) c.textContent = clock(now, 7) + ' WIB';
    sumBilling(now);
  }
  function sumBilling(now) {
    var run = 0, tri = 0;
    tenants().forEach(function (tn) { var b = ctrl(tn.id).billing; if (g(function () { return FM_BILL.ok(b); }, false)) { var v = g(function () { return FM_BILL.meter(b, now); }, 0); if (b.trial) tri += v; else run += v; } });
    var a = $('tw-s5'), t = $('tw-s6'); if (a) a.textContent = 'Rp ' + g(function () { return FM_BILL.fmt(run); }, '0'); if (t) t.textContent = 'Rp ' + g(function () { return FM_BILL.fmt(tri); }, '0');
  }
  function renderStrip() {
    var d = new Date(), dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(), td = 0, inc = 0, out = 0, tax = 0;
    Object.keys(agg).forEach(function (k) { td += agg[k].today; inc += agg[k].inc; out += agg[k].out; tax += agg[k].tax; });
    var set = function (id, v) { var e = $(id); if (e) e.textContent = v; };
    set('tw-s1', rp(td)); set('tw-s2', rp(inc)); set('tw-s3', rp(out)); set('tw-s4', rp(tax)); set('tw-s7', rp(inc / Math.max(1, d.getDate()) * dim));
  }

  /* ============ panel bawah: jam sibuk dan perhatian ============ */
  function renderJam() {
    var box = $('tw-jam'); if (!box) return;
    var hrs = [], i, since = Date.now() - 14 * 86400000, tot = 0;
    for (i = 0; i < 24; i++) hrs.push(0);
    tenants().forEach(function (tn) { txs(tn.id).forEach(function (t) { var ms = t.timestamp || 0; if (ms >= since) { hrs[new Date(ms + 7 * 3600000).getUTCHours()]++; tot++; } }); });
    var mx = Math.max.apply(null, hrs.concat([1])), peak = hrs.indexOf(mx);
    box.innerHTML = '<div class="bars">' + hrs.map(function (v, h) { return '<div title="' + pad(h) + ':00 · ' + v + ' transaksi"><i style="height:' + Math.max(2, Math.round(v / mx * 100)) + '%"></i><b>' + (h % 3 === 0 ? pad(h) : '') + '</b></div>'; }).join('') + '</div>' +
      '<div class="m sm">' + (tot ? 'Jam tersibuk ' + pad(peak) + ':00 (' + mx + ' transaksi) · 14 hari terakhir, WIB' : 'Belum ada transaksi dalam 14 hari terakhir.') + '</div>';
  }
  function renderAttn() {
    var box = $('tw-attn'); if (!box) return;
    var al = alarms();
    box.innerHTML = al.length ? al.map(function (a) { return '<div class="' + (a.lv === 2 ? 'r' : 'y') + '">' + (a.lv === 2 ? '● ' : '○ ') + esc(a.tx) + '</div>'; }).join('') : '<div class="g">● Semua aman. Tidak ada alarm atau tiket.</div>';
  }
  function updateBar() {
    var ts = tenants(), on = ts.filter(function (t) { return online(t.id).length; }).length, lv = defcon(), al = alarms().length, pc = pendingCount();
    var df = $('tw-df'); if (df) { df.textContent = '● SIAGA ' + lv; df.className = lv === 5 ? 'g' : lv === 4 ? 'y' : 'r'; }
    var o = $('tw-on'); if (o) o.innerHTML = '<b>' + on + '/' + ts.length + '</b> toko online';
    var tk = $('tw-tk'); if (tk) { tk.textContent = pc + ' tiket'; tk.className = pc ? 'y' : 'm'; }
    var a = $('tw-al'); if (a) { a.textContent = al + ' alarm'; a.className = al ? 'r' : 'm'; }
    if (lastDef !== null && lv < lastDef) { SND.alarm(); speak('Tingkat siaga naik ke ' + lv); addLog('alarm', 'TINGKAT SIAGA ' + lastDef + ' → ' + lv, false, null); }
    lastDef = lv;
  }

  /* ============ dua laman: MONITOR (lihat saja) dan KENDALI ============ */
  var mode = 'mon', lastTouch = Date.now(), IDLE_MS = 120000, built = false;
  function modalOpen() {
    return g(function () { return !$('main-modal-container').classList.contains('hidden'); }, false) || g(function () { var p = $('fm-panel-modal'); return !!p && getComputedStyle(p).display !== 'none'; }, false);
  }
  function setMode(m, quiet) {
    if (m === mode) return; mode = m;
    document.documentElement.setAttribute('data-tw-pg', m);
    [].forEach.call(document.querySelectorAll('#tw-bar [data-pg]'), function (b) { b.classList.toggle('on', b.getAttribute('data-pg') === m); });
    if (!quiet) SND.tab();
    if (m === 'mon') { [renderTable, renderStrip, renderJam, renderAttn].forEach(function (fn) { try { fn(); } catch (e) { try { console.warn('tower render', e); } catch (e2) {} } }); }
  }

  function build() {
    var main = document.querySelector('main'), acts = $('fm-actions');
    if (!main || !acts || built) return;
    document.documentElement.setAttribute('data-tw-ck', '1');
    var root = document.createElement('div'); root.id = 'tw-root';
    var cell = function (n, lab, cls) { return '<div><small>' + lab + '</small><b id="tw-s' + n + '" class="' + (cls || '') + '">-</b></div>'; };
    var th = ['', 'ID', 'TOKO', 'KOTA', 'TRX HARI INI', 'PENDAPATAN', 'PENGELUARAN', 'LABA', 'PAJAK 12%', 'TREN 7 HARI', 'vs KEMARIN', 'TERMINAL', 'BILLING (Rp)', 'JATUH TEMPO', 'AKTIF TERAKHIR'], num = { 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 10: 1, 11: 1, 12: 1 };
    root.innerHTML =
      '<div id="tw-bar"><span class="pgs"><button data-pg="mon" class="on">MONITOR</button><button data-pg="ken">KENDALI</button></span><span id="tw-df" class="g">● SIAGA 5</span><span id="tw-on"></span><span id="tw-tk" class="m"></span><span id="tw-al" class="m"></span><span class="sp"></span><span id="tw-clk" class="m"></span>' +
      '<button id="tw-snd" class="pl"></button><button id="tw-eco" class="pl"></button><button id="tw-set" class="pl">Atur</button><button id="tw-out" class="pl bad">Keluar</button></div>' +
      '<div id="tw-mon"><div id="tw-strip">' + cell(1, 'OMZET HARI INI') + cell(2, 'OMZET BULAN INI') + cell(3, 'PENGELUARAN BULAN INI') + cell(4, 'PAJAK DISUMBANG') + cell(5, 'BILLING BERJALAN', 'g') + cell(6, 'BILLING UJI COBA', 'y') + cell(7, 'PROYEKSI BULAN INI') + '</div>' +
      '<div id="tw-tbw"><table><thead><tr>' + th.map(function (h, i) {
        var sk = SORTKEY[i], cls = (num[i] ? 'n' : '') + (sk && SORT.key === sk ? ' sorted' : '');
        return '<th' + (cls.trim() ? ' class="' + cls.trim() + '"' : '') + (sk ? ' data-sk="' + sk + '"' : '') + '>' + h + (sk ? '<span class="sk-ar">' + (SORT.key === sk ? (SORT.dir > 0 ? ' ▲' : ' ▼') : '') + '</span>' : '') + '</th>';
      }).join('') + '</tr></thead><tbody id="tw-rows"></tbody></table></div>' +
      '<div id="tw-bot"><div class="bx"><h4>LOG TRANSAKSI</h4><div id="tw-log"></div></div><div class="bx"><h4>JAM SIBUK</h4><div id="tw-jam"></div><h4 style="margin-top:10px">PERHATIAN</h4><div id="tw-attn"></div></div><div class="bx"><h4>CHAT GLOBAL <span class="m">(kamu: DEV)</span></h4><div id="tw-chat" class="tw-chat"></div></div></div></div>' +
      '<div id="tw-ken"></div>';
    document.body.appendChild(root);
    $('tw-ken').appendChild(acts);
    built = true; wire(); syncToggles(); mode = ''; setMode('mon', true);
  }
  function syncToggles() {
    $('tw-snd').textContent = 'Suara: ' + (S.on ? 'nyala' : 'mati'); $('tw-snd').classList.toggle('on', S.on);
    $('tw-eco').textContent = 'Hemat: ' + (S.eco ? 'nyala' : 'mati'); $('tw-eco').classList.toggle('on', S.eco);
  }
  function wire() {
    $('tw-bar').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-pg')) return setMode(b.getAttribute('data-pg'));
      if (b.id === 'tw-snd') { S.on = !S.on; store('tw_snd', S.on ? '1' : '0'); syncToggles(); if (S.on) SND.ok(); }
      else if (b.id === 'tw-eco') { S.eco = !S.eco; store('tw_eco', S.eco ? '1' : '0'); syncToggles(); SND.click(); restartTimers(); }
      else if (b.id === 'tw-set') { SND.click(); var gb = $('fm-gear'); if (gb) gb.click(); }
      else if (b.id === 'tw-out') { SND.click(); if (window.FM_LOGOUT) FM_LOGOUT(); }
    });
    $('tw-ken').addEventListener('click', function (e) { if (e.target.closest('.fm-act') && !e.target.closest('.tw-soon')) SND.click(); });
    $('tw-tbw').addEventListener('click', function (e) {
      var th = e.target.closest('th[data-sk]'); if (th) { SND.click(); setSort(th.getAttribute('data-sk')); return; }
      var dg = e.target.closest('[data-diag]'); if (dg) { SND.click(); alert(diag(dg.getAttribute('data-diag'))); }
    });
    ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, function () { lastTouch = Date.now(); }, { passive: true }); });
    document.addEventListener('keydown', function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      var mo = modalOpen();
      if (e.key === 'Tab' && !mo) { e.preventDefault(); setMode(mode === 'mon' ? 'ken' : 'mon'); return; }
      if ((e.key === 'm' || e.key === 'M') && !mo) { $('tw-snd').click(); return; }
      if (e.key === 'Escape' && g(function () { return !$('main-modal-container').classList.contains('hidden'); }, false)) g(function () { closeModal(); });
    });
  }

  /* ============ layar mulai (perlu satu klik agar browser mengizinkan suara) ============ */
  function preflight(done) {
    var ov = document.createElement('div'); ov.id = 'tw-pre';
    ov.innerHTML = '<div><div class="pt">ONEILVERSE · CONTROL TOWER</div><button id="tw-pre-go">MASUK</button><small>Klik untuk menyalakan suara. Esc untuk masuk tanpa suara.</small></div>';
    document.body.appendChild(ov);
    var fin = false;
    function end(snd) { if (fin) return; fin = true; if (snd) { ac(); SND.ok(); } ov.remove(); done(); }
    $('tw-pre-go').onclick = function () { end(true); };
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { document.removeEventListener('keydown', k); end(false); } });
    setTimeout(function () { var b = $('tw-pre-go'); if (b) b.focus(); }, 50);
  }

  /* ============ CSS (datar: hitam, hijau, kuning, merah, abu, putih) ============ */
  var CSS = [
    'html[data-tw-ck] body{overflow:hidden}html[data-tw-ck] #fm-dock{display:none!important}',
    '#tw-root{position:fixed;inset:0;z-index:40;background:linear-gradient(180deg,#f1f5f9 0%,#e8eff7 100%)!important;color:#1e293b!important;display:flex;flex-direction:column;font:12.5px/1.5 "Plus Jakarta Sans",system-ui,-apple-system,sans-serif}',
    '#tw-root .blink{animation:twBlink 1.3s infinite}@keyframes twBlink{0%,100%{opacity:1}50%{opacity:.4}}#tw-root .g{color:#059669!important}#tw-root .r{color:#dc2626!important}#tw-root .y{color:#d97706!important}#tw-root .m{color:#64748b!important}#tw-root .w{color:#0f172a!important}#tw-root .sm{font-size:11px}#tw-root b{font-weight:700;color:#0f172a}',
    '#tw-bar{flex:none;display:flex;align-items:center;gap:12px;padding:10px 18px;margin:10px 18px 0;background:#ffffff!important;border:1px solid #e2e8f0!important;border-radius:16px!important;box-shadow:0 4px 14px -6px rgba(15,23,42,.08)!important;white-space:nowrap}#tw-bar .sp{flex:1}',
    '#tw-bar .pgs{display:flex;background:#f1f5f9;border:1px solid #cbd5e1!important;border-radius:10px;overflow:hidden;padding:2px;gap:2px}#tw-bar .pgs button{all:unset;cursor:pointer;padding:5px 14px;border-radius:8px;color:#475569!important;font:700 12px/1.2 inherit;transition:all .15s ease}#tw-bar .pgs button.on{background:#2563eb!important;color:#ffffff!important;box-shadow:0 2px 6px rgba(37,99,235,.28)}',
    '#tw-bar .pl{all:unset;cursor:pointer;color:#334155!important;font:700 11.5px/1.2 inherit;padding:6px 12px;border:1px solid #cbd5e1!important;border-radius:10px;background:#f8fafc!important;transition:all .15s ease}#tw-bar .pl:hover{color:#0f172a!important;border-color:#94a3b8!important;background:#f1f5f9!important}#tw-bar .pl.on{color:#059669!important;border-color:#a7f3d0!important;background:#ecfdf5!important}#tw-bar .pl.bad{color:#dc2626!important;border-color:#fecaca!important;background:#fef2f2!important}',
    '#tw-mon{flex:1 1 0;min-height:0;display:none;flex-direction:column;padding:10px 18px 14px;gap:10px}',
    'html[data-tw-pg="mon"] #tw-mon{display:flex}html[data-tw-pg="mon"] #tw-ken{display:none}html[data-tw-pg="ken"] #tw-mon{display:none}html[data-tw-pg="ken"] #tw-ken{display:flex}',
    '#tw-strip{flex:none;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;overflow:visible;background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important}#tw-strip>div{min-width:0;padding:10px 12px;background:#ffffff!important;border:1px solid #e2e8f0!important;border-radius:14px!important;box-shadow:0 2px 8px -4px rgba(15,23,42,.06)!important}#tw-strip small{display:block;color:#64748b!important;font-size:10px;font-weight:700;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px}#tw-strip b{display:block;color:#0f172a!important;font-family:"JetBrains Mono",Consolas,monospace;font-size:clamp(11px,1.15vw,16px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#tw-strip b.g{color:#059669!important}#tw-strip b.y{color:#d97706!important}',
    '#tw-tbw{flex:1.25 1 0;min-height:60px;overflow-x:hidden;overflow-y:auto;background:#ffffff!important;border:1px solid #e2e8f0!important;border-radius:16px!important;box-shadow:0 4px 14px -6px rgba(15,23,42,.06)!important;padding:0 12px}#tw-tbw table{width:100%;table-layout:fixed;border-collapse:collapse}#tw-tbw th{position:sticky;top:0;background:#ffffff!important;font-weight:700;color:#475569!important;text-align:left;border-bottom:1.5px solid #e2e8f0!important;padding:9px 5px;font-size:clamp(8.5px,.74vw,10.5px);letter-spacing:.03em;white-space:normal;line-height:1.15;overflow:hidden;vertical-align:bottom;cursor:default}#tw-tbw th[data-sk]{cursor:pointer;user-select:none}#tw-tbw th[data-sk]:hover{color:#0f172a!important}#tw-tbw th.sorted{color:#2563eb!important}#tw-tbw .sk-ar{color:#2563eb!important}#tw-tbw td{padding:7px 5px;border-bottom:1px solid #f1f5f9!important;color:#1e293b!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:"JetBrains Mono",Consolas,monospace;font-size:clamp(9.5px,.82vw,12px);vertical-align:middle}#tw-tbw tbody tr:hover td{background:#f8fafc!important}#tw-tbw td.wrap{white-space:normal;overflow-wrap:anywhere;text-overflow:clip;line-height:1.3}#tw-tbw .n{text-align:right}',
    '#tw-tbw th:nth-child(1){width:1.2%}#tw-tbw th:nth-child(2){width:7.2%}#tw-tbw th:nth-child(3){width:11.5%}#tw-tbw th:nth-child(4){width:10%}#tw-tbw th:nth-child(5){width:4.8%}#tw-tbw th:nth-child(6){width:7%}#tw-tbw th:nth-child(7){width:7%}#tw-tbw th:nth-child(8){width:6.6%}#tw-tbw th:nth-child(9){width:6%}#tw-tbw th:nth-child(10){width:6.6%}#tw-tbw th:nth-child(11){width:5.2%}#tw-tbw th:nth-child(12){width:4.6%}#tw-tbw th:nth-child(13){width:7.8%}#tw-tbw th:nth-child(14){width:8.1%}#tw-tbw th:nth-child(15){width:5.5%}',
    '#tw-bot{flex:1 1 0;min-height:90px;display:grid;grid-template-columns:1.5fr 1fr 1.1fr;gap:12px}.bx{min-height:0;min-width:0;display:flex;flex-direction:column;background:#ffffff!important;border:1px solid #e2e8f0!important;border-radius:16px!important;box-shadow:0 4px 14px -6px rgba(15,23,42,.06)!important;padding:10px 14px}.bx h4{margin:0 0 6px;font-weight:700;color:#475569!important;font-size:10.5px;letter-spacing:.08em}',
    '#tw-log{flex:1 1 0;min-height:0;overflow:hidden;display:flex;flex-direction:column;font-family:"JetBrains Mono",Consolas,monospace;font-size:11.5px}.ln{display:flex;gap:10px;word-break:break-word;flex:none}.ln .t{color:#64748b!important;flex:none}.ln.sale .m{color:#059669!important}.ln.up .m{color:#059669!important}.ln.cost .m{color:#475569!important}.ln.down .m{color:#d97706!important}.ln.alarm .m{color:#dc2626!important}.ln.sys .m{color:#0f172a!important}',
    '.caret{font-style:normal;color:#059669}',
    '#tw-jam .bars{display:grid;grid-template-columns:repeat(24,1fr);gap:3px;height:48px;align-items:end}#tw-jam .bars>div{height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;font-size:9px;color:#64748b}#tw-jam .bars i{display:block;width:100%;background:linear-gradient(180deg,#10b981,#059669);border-radius:3px 3px 0 0}#tw-jam .bars b{height:11px;font-size:9px;color:#64748b}',
    '#tw-attn{overflow:auto;min-height:0}',
    '.tw-chat{flex:1 1 0;min-height:0;display:flex;flex-direction:column}.fmc-feed{flex:1 1 0;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:4px}',
    '.tw-chat .fmc-m{display:flex;gap:8px}.tw-chat .fmc-t{color:#64748b!important;flex:none;font-size:11px}.tw-chat .fmc-id,#tw-root .tw-chat .fmc-id{color:#334155!important;flex:none;font-weight:700;pointer-events:none;user-select:none}.tw-chat .fmc-x{color:#0f172a!important;font-size:12px}.tw-chat .fmc-m.dev .fmc-id,#tw-root .tw-chat .fmc-m.dev .fmc-id{color:#2563eb!important}.tw-chat .fmc-empty{color:#64748b;padding:6px 0}',
    '.fmc-note{flex:none;min-height:14px;color:#d97706;font-size:11px}.fmc-in{flex:none;display:flex;gap:6px;margin-top:6px}.fmc-in input{flex:1;min-width:0;border-radius:10px;background:#f8fafc!important;border:1px solid #cbd5e1!important;color:#0f172a!important;font:inherit;padding:6px 10px;outline:none}.fmc-in input:focus{border-color:#2563eb!important}.fmc-in button{all:unset;cursor:pointer;color:#ffffff!important;background:#2563eb!important;border-radius:10px;padding:6px 14px;font-weight:700;font-size:12px}',
    '#tw-ken{flex:1 1 0;min-height:0;display:none;flex-direction:column;padding:8px 18px 14px;font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-size:13px;color:#1e293b}',
    'html[data-tw-ck] #tw-ken #fm-actions{position:static!important;display:flex!important;flex-direction:column;flex:1 1 0;min-height:0;gap:10px;padding:0!important;margin:0!important;overflow:hidden!important;justify-content:flex-start!important;container-type:normal!important;background:none!important;border:0!important;box-shadow:none!important}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act{display:grid!important;grid-template-columns:28px minmax(0,1fr) auto;grid-template-rows:1fr 1fr;column-gap:9px;row-gap:0;align-items:center;justify-items:start;text-align:left!important;padding:5px 10px!important;overflow:hidden;flex-direction:row!important}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act i{grid-column:1;grid-row:1 / 3;width:28px!important;height:28px!important;border-radius:9px!important;background:#eff6ff!important;color:#2563eb!important;margin:0!important}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act svg{width:14px!important;height:14px!important}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act>span:not(.tw-pill):not([id$="badge"]){grid-column:2;grid-row:1;align-self:end;max-width:100%;font-size:12.5px!important;font-weight:700!important;color:#0f172a!important;line-height:1.15!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act small{grid-column:2;grid-row:2;align-self:start;display:block!important;max-width:100%;font-size:10.5px!important;font-weight:500!important;color:#64748b!important;line-height:1.2!important;opacity:1!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .tw-group .fm-act .tw-pill{grid-column:3;grid-row:1 / 3;align-self:center}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .fm-act{height:auto!important;min-height:0!important;border-radius:12px!important;background:#f8fafc!important;border:1px solid #e2e8f0!important;box-shadow:none!important;position:relative;text-align:left!important;transform:none!important;transition:all .12s ease}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .fm-act:hover{background:#eff6ff!important;border-color:#93c5fd!important}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .fm-act .tw-cnt,html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .fm-act [id$="badge"]{position:absolute;right:8px;top:8px;margin:0}',
    'html[data-tw-ck] #tw-ken .tw-soon{opacity:.42;filter:none}html[data-tw-ck] #tw-ken .tw-soon .tw-pill{display:none}',
    '#tw-pre{position:fixed;inset:0;z-index:200;background:#f1f5f9;display:flex;align-items:center;justify-content:center;text-align:center;font:14px "Plus Jakarta Sans",system-ui,sans-serif;color:#334155}#tw-pre .pt{color:#0f172a;font-weight:800;letter-spacing:.12em;margin-bottom:18px}',
    '#tw-pre-go{all:unset;cursor:pointer;padding:10px 32px;border-radius:999px;background:#2563eb;color:#ffffff;font-weight:700;letter-spacing:.08em;box-shadow:0 6px 18px rgba(37,99,235,.3)}#tw-pre-go:hover{background:#1d4ed8}#tw-pre small{display:block;margin-top:12px;color:#64748b;font-size:11.5px}',
    '@media(max-width:1023px){#tw-root{display:none}html[data-tw-ck] body{overflow:auto}}'
  ].join('\n');

  /* ============ jalan ============ */
  var timers = [];
  function clearTimers() { timers.forEach(clearInterval); timers = []; }
  function startTimers() {
    var slow = S.eco ? 3 : 1;
    timers.push(
      setInterval(function () { if (!document.hidden) tickLive(); }, 1000 * slow),
      setInterval(function () { if (document.hidden) return; try { if (mode === 'mon') { renderTable(); renderStrip(); renderAttn(); } updateBar(); } catch (e) { try { console.warn('tower tick', e); } catch (e2) {} } }, 4000),
      setInterval(function () { if (!document.hidden && mode === 'mon') renderJam(); }, 60000),
      setInterval(function () { if (!document.hidden) scanEvents(); }, 2000),
      setInterval(function () { if (!document.hidden) pollSecurity(); }, 5000),
      setInterval(function () { if (!document.hidden && seeded) trend(); }, 180000),
      /* sapuan radar: berbunyi di layar MONITOR selama masih ada toko online (ikut kedipan lampu hijau) */
      setInterval(function () { try { if (document.hidden || mode !== 'mon' || !S.on || S.eco) return; if (tenants().some(function (t) { return online(t.id).length; })) SND.radar(); } catch (e) {} }, 2600)
    );
  }
  function restartTimers() { clearTimers(); startTimers(); }
  function start() {
    var st = document.createElement('style'); st.id = 'tw-ck-css'; st.textContent = CSS; document.head.appendChild(st);
    if (window.innerWidth < 1024) return;
    var tries = 0;
    (function wait() {
      var acts = $('fm-actions');
      if (acts && acts.classList.contains('tw-grouped')) {
        build(); preflight(function () { lastTouch = Date.now(); });
        compute(); renderStrip(); renderTable(); renderJam(); renderAttn(); updateBar(); tickLive();
        if (window.FM_CHAT) FM_CHAT.mountTower($('tw-chat'));
        startTimers();
        var ca = window.ctAudit;
        if (typeof ca === 'function') window.ctAudit = function (tid, action, detail) { try { addLog('sys', 'AKSI TOWER · ' + (tid && tid !== '-' ? tid + ' · ' : '') + (detail || action), false, null); } catch (e) {} return ca.apply(this, arguments); };
        return;
      }
      if (++tries < 80) setTimeout(wait, 150);
    })();
  }
  window.FM_COCKPIT = { sound: SND, state: S, addLog: addLog, setMode: setMode };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
