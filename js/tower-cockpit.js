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
  function compute() {
    var first = ymd(new Date()).slice(0, 8) + '01', d0 = ymd(new Date()), days = [], i;
    for (i = 6; i >= 0; i--) days.push(ymd(new Date(Date.now() - i * 86400000)));
    var out = {};
    tenants().forEach(function (tn) {
      var a = { inc: 0, out: 0, tax: 0, trx: 0, today: 0, yest: 0, sp: [0, 0, 0, 0, 0, 0, 0] };
      txs(tn.id).forEach(function (t) {
        var d = t.dateISO || '', sales = t.category === 'sales', amt = t.amount || 0;
        if (d === d0) a.trx++;
        if (sales) {
          if (d >= first) a.inc += amt;
          var k = days.indexOf(d); if (k >= 0) a.sp[k] += amt;
        } else if (d >= first) { a.out += amt; a.tax += t.tax12 || Math.round(amt * 0.12); }
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
  function renderTable() {
    var box = $('tw-rows'); if (!box) return;
    if (Date.now() - aggAt > 4000) compute();
    var now = Date.now(), ts = tenants(), html = '';
    ts.forEach(function (tn) {
      var a = agg[tn.id] || { inc: 0, out: 0, tax: 0, trx: 0, today: 0, yest: 0, sp: [0, 0, 0, 0, 0, 0, 0] };
      var on = online(tn.id).length, sus = suspended(tn.id), bc = billCell(tn.id, now), dc = dueCell(tn.id, now);
      var lamp = sus || bc.c === 'r' ? 'r' : bc.c === 'y' && !bc.trial ? 'y' : on ? 'g' : 'm';
      var vs = a.yest ? Math.round((a.today - a.yest) / a.yest * 100) : null, vsT, vsC;
      if (a.today === a.yest) { vsT = '▬ 0%'; vsC = 'm'; } else if (vs === null) { vsT = '▲ baru'; vsC = 'g'; } else if (vs > 0) { vsT = '▲ ' + vs + '%'; vsC = 'g'; } else { vsT = '▼ ' + Math.abs(vs) + '%'; vsC = 'r'; }
      var last = on ? 'sekarang' : g(function () { return agoText(lastActiveMs(tn.id)); }, '-'), geo = geoOf(tn.id), lab = a.inc - a.out;
      html += '<tr><td class="' + lamp + '">●</td><td class="w">' + esc(tn.id) + '</td><td class="w">' + esc(tn.nama) + (sus ? ' <span class="r">(beku)</span>' : '') + '</td><td>' + esc(geo && geo.name ? geo.name : '-') + '</td>' +
        '<td class="n">' + a.trx + '</td><td class="n">' + nf(a.inc) + '</td><td class="n">' + nf(a.out) + '</td><td class="n ' + (lab < 0 ? 'r' : 'g') + '">' + nf(lab) + '</td><td class="n">' + nf(a.tax) + '</td>' +
        '<td class="' + (vsC === 'r' ? 'y' : vsC === 'g' ? 'g' : 'm') + '">' + spark(a.sp) + '</td><td class="n ' + vsC + '">' + vsT + '</td><td class="n ' + (on ? 'g' : 'm') + '">' + on + '</td>' +
        '<td class="n ' + bc.c + '"><span data-live="' + esc(tn.id) + '">' + bc.v + '</span></td><td class="' + dc.c + '"><span' + (dc.live ? ' data-due="' + esc(tn.id) + '"' : '') + '>' + dc.v + '</span></td><td class="' + (on ? 'g' : 'm') + '">' + esc(last) + '</td></tr>';
    });
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
    if (m === 'mon') { renderTable(); renderStrip(); renderJam(); renderAttn(); }
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
      '<div id="tw-tbw"><table><thead><tr>' + th.map(function (h, i) { return '<th' + (num[i] ? ' class="n"' : '') + '>' + h + '</th>'; }).join('') + '</tr></thead><tbody id="tw-rows"></tbody></table></div>' +
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
    '#tw-root{position:fixed;inset:0;z-index:40;background:#000;color:#9a9a9a;display:flex;flex-direction:column;font:12px/1.5 Consolas,"Courier New",monospace}',
    '#tw-root .g{color:#3ddc84}#tw-root .r{color:#ff5252}#tw-root .y{color:#f5c542}#tw-root .m{color:#777}#tw-root .w{color:#eee}#tw-root .sm{font-size:11px}#tw-root b{font-weight:400;color:#eee}',
    '#tw-bar{flex:none;display:flex;align-items:center;gap:16px;padding:9px 16px;border-bottom:1px solid #2a2a2a;white-space:nowrap}#tw-bar .sp{flex:1}',
    '#tw-bar .pgs{display:flex;border:1px solid #333}#tw-bar .pgs button{all:unset;cursor:pointer;padding:3px 14px;color:#999;font:inherit;letter-spacing:.04em}#tw-bar .pgs button.on{background:#eee;color:#000}',
    '#tw-bar .pl{all:unset;cursor:pointer;color:#999;font:inherit;padding:2px 10px;border:1px solid #333}#tw-bar .pl:hover{color:#eee;border-color:#666}#tw-bar .pl.on{color:#3ddc84}#tw-bar .pl.bad{color:#ff5252}',
    '#tw-mon{flex:1 1 0;min-height:0;display:none;flex-direction:column;padding:0 16px 10px}',
    'html[data-tw-pg="mon"] #tw-mon{display:flex}html[data-tw-pg="mon"] #tw-ken{display:none}html[data-tw-pg="ken"] #tw-mon{display:none}html[data-tw-pg="ken"] #tw-ken{display:flex}',
    '#tw-strip{flex:none;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border-bottom:1px solid #2a2a2a;overflow:hidden}#tw-strip>div{min-width:0;padding:6px 8px;border-right:1px solid #1e1e1e}#tw-strip>div:last-child{border:0}#tw-strip small{display:block;color:#666;font-size:9.5px;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#tw-strip b{display:block;font-size:clamp(11px,1.15vw,16px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#tw-strip b.g{color:#3ddc84}#tw-strip b.y{color:#f5c542}',
    '#tw-tbw{flex:1.25 1 0;min-height:60px;overflow-x:hidden;overflow-y:auto;margin-top:4px}#tw-tbw table{width:100%;table-layout:fixed;border-collapse:collapse}#tw-tbw th{position:sticky;top:0;background:#000;font-weight:400;color:#666;text-align:left;border-bottom:1px solid #333;padding:3px 4px;font-size:clamp(8px,.72vw,10px);letter-spacing:.02em;white-space:normal;line-height:1.1;overflow:hidden;vertical-align:bottom}#tw-tbw td{padding:4px;border-bottom:1px solid #151515;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:clamp(9px,.82vw,12px)}#tw-tbw .n{text-align:right}',
    '#tw-tbw th:nth-child(1){width:1.2%}#tw-tbw th:nth-child(2){width:7.2%}#tw-tbw th:nth-child(3){width:9.5%}#tw-tbw th:nth-child(4){width:8%}#tw-tbw th:nth-child(5){width:4.8%}#tw-tbw th:nth-child(6){width:7.8%}#tw-tbw th:nth-child(7){width:7.8%}#tw-tbw th:nth-child(8){width:7%}#tw-tbw th:nth-child(9){width:6%}#tw-tbw th:nth-child(10){width:6.6%}#tw-tbw th:nth-child(11){width:5.6%}#tw-tbw th:nth-child(12){width:5%}#tw-tbw th:nth-child(13){width:8.4%}#tw-tbw th:nth-child(14){width:9.6%}#tw-tbw th:nth-child(15){width:5.5%}',
    '#tw-bot{flex:1 1 0;min-height:90px;display:grid;grid-template-columns:1.5fr 1fr 1.1fr;gap:16px;margin-top:8px}.bx{min-height:0;min-width:0;display:flex;flex-direction:column;border-top:1px solid #333;padding-top:5px}.bx h4{margin:0 0 4px;font-weight:400;color:#666;font-size:10px;letter-spacing:.1em}',
    '#tw-log{flex:1 1 0;min-height:0;overflow:hidden;display:flex;flex-direction:column}.ln{display:flex;gap:10px;word-break:break-word;flex:none}.ln .t{color:#555;flex:none}.ln.sale .m{color:#3ddc84}.ln.up .m{color:#3ddc84}.ln.cost .m{color:#999}.ln.down .m{color:#f5c542}.ln.alarm .m{color:#ff5252}.ln.sys .m{color:#eee}',
    '.caret{font-style:normal;color:#3ddc84}',
    '#tw-jam .bars{display:grid;grid-template-columns:repeat(24,1fr);gap:2px;height:46px;align-items:end}#tw-jam .bars>div{height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;font-size:9px;color:#555}#tw-jam .bars i{display:block;width:100%;background:#2e7d4f}#tw-jam .bars b{height:11px;font-size:9px;color:#555}',
    '#tw-attn{overflow:auto;min-height:0}',
    '.tw-chat{flex:1 1 0;min-height:0;display:flex;flex-direction:column}.fmc-feed{flex:1 1 0;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:2px}',
    '.tw-chat .fmc-m{display:flex;gap:8px}.tw-chat .fmc-t{color:#555;flex:none;font-size:11px}.tw-chat .fmc-id,#tw-root .tw-chat .fmc-id{color:#9a9a9a;flex:none;font-weight:400;pointer-events:none;user-select:none}.tw-chat .fmc-x{color:#ddd;font-size:12px}.tw-chat .fmc-m.dev .fmc-id,#tw-root .tw-chat .fmc-m.dev .fmc-id{color:#f5c542}.tw-chat .fmc-empty{color:#666;padding:6px 0}',
    '.fmc-note{flex:none;min-height:14px;color:#f5c542;font-size:11px}.fmc-in{flex:none;display:flex;gap:6px}.fmc-in input{flex:1;min-width:0;border-radius:0;background:#000;border:1px solid #333;color:#eee;font:inherit;padding:3px 8px;outline:none}.fmc-in input:focus{border-color:#3ddc84}.fmc-in button{all:unset;cursor:pointer;color:#3ddc84;border:1px solid #333;padding:3px 10px;font:inherit}',
    '#tw-ken{flex:1 1 0;min-height:0;display:none;flex-direction:column;padding:2px 18px 12px;font-family:system-ui,"Segoe UI",Roboto,sans-serif;font-size:13px;color:#e6e6e6}',
    'html[data-tw-ck] #tw-ken #fm-actions{position:static!important;display:flex!important;flex-direction:column;flex:1 1 0;min-height:0;gap:8px;padding:0!important;margin:0!important;overflow:hidden;background:none!important;border:0!important;box-shadow:none!important}',
    'html[data-tw-ck] #tw-ken .tw-group{flex:1 1 0;min-height:0;display:flex;flex-direction:column;gap:5px}',
    'html[data-tw-ck] #tw-ken .tw-head{padding:0 6px}html[data-tw-ck] #tw-ken .tw-head:before,html[data-tw-ck] #tw-ken .tw-head span{display:none}html[data-tw-ck] #tw-ken .tw-head b{font-size:13px;font-weight:600;color:#bbb;letter-spacing:0}',
    'html[data-tw-ck] #tw-ken .tw-grid{flex:1 1 0;min-height:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .fm-act{flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;gap:3px!important;height:auto!important;min-height:0!important;padding:10px 16px!important;border-radius:24px!important;background:#121212!important;border:0!important;box-shadow:none!important;position:relative;text-align:left!important;transform:none!important}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .fm-act:hover{background:#1c1c1c!important}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .fm-act i{width:34px!important;height:34px!important;border-radius:12px!important;background:#1f1f1f!important;color:#ddd!important;margin-bottom:4px}html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .fm-act svg{width:17px!important;height:17px!important}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .fm-act>span:not(.tw-pill):not([id$="badge"]){font-size:15px!important;font-weight:600!important;color:#f2f2f2}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .fm-act small{display:block;font-size:12px;font-weight:400;color:#888;line-height:1.3}',
    'html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .fm-act .tw-cnt,html[data-tw-ck][data-fm-page="tower"] #tw-ken #fm-actions.tw-grouped .fm-act [id$="badge"]{position:absolute;right:14px;top:14px;margin:0}',
    'html[data-tw-ck] #tw-ken .tw-soon{opacity:.35;filter:none;border:0!important}html[data-tw-ck] #tw-ken .tw-soon .tw-pill{display:none}',
    '#tw-pre{position:fixed;inset:0;z-index:200;background:#000;display:flex;align-items:center;justify-content:center;text-align:center;font:13px Consolas,"Courier New",monospace;color:#9a9a9a}#tw-pre .pt{color:#eee;letter-spacing:.16em;margin-bottom:18px}',
    '#tw-pre-go{all:unset;cursor:pointer;padding:8px 30px;border:1px solid #3ddc84;color:#3ddc84;letter-spacing:.14em}#tw-pre-go:hover{background:#0e2418}#tw-pre small{display:block;margin-top:12px;color:#666;font-size:11px}',
    '@media(max-width:1023px){#tw-root{display:none}html[data-tw-ck] body{overflow:auto}}'
  ].join('\n');

  /* ============ jalan ============ */
  var timers = [];
  function clearTimers() { timers.forEach(clearInterval); timers = []; }
  function startTimers() {
    var slow = S.eco ? 3 : 1;
    timers.push(
      setInterval(function () { if (!document.hidden) tickLive(); }, 1000 * slow),
      setInterval(function () { if (document.hidden) return; if (mode === 'mon') { renderTable(); renderStrip(); renderAttn(); } updateBar(); }, 4000),
      setInterval(function () { if (!document.hidden && mode === 'mon') renderJam(); }, 60000),
      setInterval(function () { if (!document.hidden) scanEvents(); }, 2000),
      setInterval(function () { if (!document.hidden && seeded) trend(); }, 180000),
      setInterval(function () { if (mode === 'ken' && !modalOpen() && Date.now() - lastTouch > IDLE_MS) setMode('mon'); }, 5000)
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
