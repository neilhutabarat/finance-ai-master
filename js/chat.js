/* Chat global antar ID toko + DEV (Tower). Hanya teks, tampil sebagai ID saja (tidak bisa diklik).
   Koleksi: global_chat (pesan), global_chat_cfg/main (saklar nyala/mati + daftar ID dibisukan).
   Saklar "kasir boleh chat" per toko disimpan di tenant_settings/{ID}.chatKasir.
   Dipakai oleh: kasir.html (pojok kiri bawah), dashboard.html/Owner (pojok kanan bawah; di HP jadi layar penuh), provider.html/Tower (panel Monitor + moderasi). */
(function () {
  'use strict';
  var PATH = (location.pathname || '').toLowerCase();
  var IS_TOWER = /provider/.test(PATH);
  var ROLE = IS_TOWER ? 'dev' : /kasir/.test(PATH) ? 'staff' : /manager/.test(PATH) ? 'manager' : /dashboard/.test(PATH) ? 'owner' : '';
  if (!ROLE || ROLE === 'manager') { window.FM_CHAT = null; return; }

  var COL = 'global_chat', CFG = 'global_chat_cfg', MAXLEN = 140, COOLDOWN = 5000;
  var S = { msgs: [], cfg: { enabled: true, muted: [] }, err: false, open: false, kasirOk: true, last: 0, seen: 0, first: true, towerEl: null };
  try { S.seen = +localStorage.getItem('fmc_seen') || 0; } catch (e) {}

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function hm(ms) { var d = new Date(ms + 7 * 3600000); return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); }
  function g(fn, d) { try { var v = fn(); return v === undefined ? d : v; } catch (e) { return d; } }

  function me() {
    if (IS_TOWER) return { tid: 'DEV', role: 'dev', label: 'DEV' };
    var t = g(function () { return getActiveTenant(); }, null), tid = t && t.id ? String(t.id).toUpperCase() : '';
    return { tid: tid, role: ROLE, label: tid + (ROLE === 'staff' ? '-K' : '-O') };
  }
  function ready() { return typeof db !== 'undefined' && db && g(function () { return firebase.auth().currentUser; }, null); }

  /* ---------- aturan kirim ---------- */
  var LINK = /(https?:|www\.|\.com|\.net|\.org|\.id\b|\.co\b|bit\.ly|wa\.me)/i;
  function clean(t) { return String(t || '').replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function blocked() {
    var m = me();
    if (!IS_TOWER) {
      if (S.cfg.enabled === false) return 'Chat sedang dimatikan oleh DEV.';
      if ((S.cfg.muted || []).indexOf(m.tid) >= 0) return 'ID ini sedang dibisukan oleh DEV.';
      if (ROLE === 'staff' && !S.kasirOk) return 'Pemilik toko mematikan chat untuk kasir.';
    }
    return '';
  }
  function send(text, done) {
    text = clean(text);
    var why = blocked(); if (why) return done && done(why);
    if (!text) return done && done('');
    if (text.length > MAXLEN) return done && done('Maksimal ' + MAXLEN + ' karakter.');
    if (!IS_TOWER && LINK.test(text)) return done && done('Tautan tidak diperbolehkan.');
    var wait = S.last + COOLDOWN - Date.now();
    if (!IS_TOWER && wait > 0) return done && done('Tunggu ' + Math.ceil(wait / 1000) + ' detik.');
    var m = me(); if (!m.tid) return done && done('ID toko tidak dikenali.');
    S.last = Date.now();
    db.collection(COL).add({ tid: m.tid, role: m.role, label: m.label, text: text, ms: Date.now(), at: firebase.firestore.FieldValue.serverTimestamp() })
      .then(function () { done && done(''); })
      .catch(function (e) { done && done('Gagal mengirim' + (e && e.code ? ' (' + e.code + ')' : '') + '. Coba lagi.'); });
  }

  /* ---------- berlangganan data ---------- */
  var subscribed = false, unsubs = [];
  function retry() { subscribed = false; unsubs.forEach(function (u) { try { u(); } catch (e) {} }); unsubs = []; setTimeout(subscribe, 60000); }
  function subscribe() {
    if (subscribed) return; subscribed = true;
    unsubs.push(db.collection(COL).orderBy('ms', 'desc').limit(IS_TOWER ? 300 : 80).onSnapshot(function (snap) {
      var a = []; snap.forEach(function (d) { var x = d.data(); x.id = d.id; a.push(x); });
      var all = a.slice(); a.reverse();
      var fresh = S.first ? [] : a.filter(function (x) { return x.ms > (S.msgs.length ? S.msgs[S.msgs.length - 1].ms : 0); });
      S.first = false; S.msgs = a; S.err = false;
      if (S.open) markSeen();
      if (IS_TOWER) {
        fresh.forEach(function (x) { if (x.role === 'dev') return; var c = window.FM_COCKPIT; if (c) { c.addLog('sys', 'CHAT · ' + x.label + ' · ' + x.text, false, 'notif'); } });
        if (all.length > 200) { var b = db.batch(); all.slice(200).forEach(function (x) { b.delete(db.collection(COL).doc(x.id)); }); b.commit().catch(function () {}); }
      }
      paint();
    }, function () { S.err = true; paint(); retry(); }));
    unsubs.push(db.collection(CFG).doc('main').onSnapshot(function (s) { S.cfg = Object.assign({ enabled: true, muted: [] }, s.exists ? s.data() : {}); paint(); }, function () {}));
    if (!IS_TOWER) {
      var tid = me().tid;
      if (tid) unsubs.push(db.collection('tenant_settings').doc(tid).onSnapshot(function (s) { S.kasirOk = !(s.exists && s.data().chatKasir === false); paint(); }, function () {}));
    }
  }
  function markSeen() { var l = S.msgs.length ? S.msgs[S.msgs.length - 1].ms : 0; S.seen = Math.max(S.seen, l); try { localStorage.setItem('fmc_seen', String(S.seen)); } catch (e) {} }
  function unread() { var m = me().label; return S.msgs.filter(function (x) { return x.ms > S.seen && x.label !== m; }).length; }

  /* ---------- tampilan daftar pesan (dipakai widget dan panel Tower) ---------- */
  function feedHtml(limit) {
    var mine = me().label, list = S.msgs.slice(-(limit || 60));
    if (S.err) return '<div class="fmc-empty">Chat belum aktif. ' + (IS_TOWER ? 'Aturan Firestore v6 belum dipublikasikan.' : 'Coba lagi nanti.') + '</div>';
    if (!list.length) return '<div class="fmc-empty">Belum ada pesan.</div>';
    return list.map(function (x) {
      return '<div class="fmc-m' + (x.role === 'dev' ? ' dev' : '') + (x.label === mine ? ' me' : '') + '"><span class="fmc-t">' + hm(x.ms || 0) + '</span><b class="fmc-id">' + esc(x.label) + '</b><span class="fmc-x">' + esc(x.text) + '</span></div>';
    }).join('');
  }
  function stickScroll(el) { if (el) el.scrollTop = el.scrollHeight; }

  /* ---------- widget klien (kasir / owner) ---------- */
  /* Palet "mendung" senada dengan tampilan kasir/owner/manager: satu warna biru-abu, transparan,
     tanpa hitam pekat. Tulisan tetap gelap pekat (#1f2937) di atasnya supaya mudah dibaca. */
  var CSS = [
    '.fmc-m{display:flex;gap:7px;align-items:baseline;line-height:1.35;word-break:break-word}',
    '.fmc-t{flex:none;font-size:10px;color:#64748b}.fmc-id{flex:none;font-weight:700;font-size:11px;color:#475569;pointer-events:none;user-select:none;-webkit-user-select:none;cursor:default}',
    '.fmc-x{color:#1f2937;font-size:12.5px}.fmc-m.me .fmc-id{color:#2563eb}.fmc-m.dev .fmc-id{color:#92400e;background:rgba(251,191,36,.35);padding:0 6px;border-radius:5px}',
    '.fmc-empty{color:#64748b;font-size:12px;padding:14px 4px;text-align:center}',
    '#fmc-tab{position:fixed;z-index:44;bottom:12px;display:flex;align-items:center;gap:7px;padding:7px 14px;border-radius:99px;background:rgba(75,87,104,.55);color:#fff;border:1px solid rgba(255,255,255,.35);font:600 12px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 18px rgba(30,41,59,.25)}',
    '#fmc-tab.kasir{left:12px}#fmc-tab.owner{right:12px}#fmc-tab i{font-style:normal;min-width:18px;text-align:center;padding:0 5px;border-radius:99px;background:#dc2626;color:#fff;font-size:10.5px;display:none}#fmc-tab i.on{display:inline-block}',
    '#fmc-panel{position:fixed;z-index:45;bottom:56px;width:310px;height:390px;display:flex;flex-direction:column;background:rgba(241,245,249,.72);color:#1f2937;border:1px solid rgba(255,255,255,.5);border-radius:18px;box-shadow:0 10px 40px rgba(30,41,59,.3);font-family:system-ui,sans-serif;overflow:hidden;transition:transform .22s ease,opacity .22s ease;pointer-events:none;opacity:0}',
    '#fmc-panel.kasir{left:12px;transform:translateX(-18px)}#fmc-panel.owner{right:12px;transform:translateX(18px)}#fmc-panel.open{pointer-events:auto;opacity:1;transform:translateX(0)}',
    '#fmc-hd{flex:none;display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid rgba(100,116,139,.25);font-size:12px;font-weight:700}#fmc-hd small{font-weight:400;color:#64748b;font-size:10.5px}#fmc-hd .sp{flex:1}',
    '#fmc-hd button{all:unset;cursor:pointer;color:#475569;padding:2px 7px;font-size:15px}',
    '#fmc-opt{flex:none;display:none;align-items:center;gap:8px;padding:6px 12px;border-bottom:1px solid rgba(100,116,139,.25);font-size:11.5px;color:#475569}#fmc-opt.on{display:flex}#fmc-opt input{accent-color:#2563eb}',
    '#fmc-feed{flex:1 1 0;min-height:0;overflow:auto;padding:8px 12px;display:flex;flex-direction:column;gap:4px}',
    '#fmc-note{flex:none;min-height:16px;padding:0 12px;font-size:11px;color:#b45309}',
    '#fmc-in{flex:none;display:flex;gap:6px;padding:8px 10px;border-top:1px solid rgba(100,116,139,.25)}#fmc-in input{flex:1;min-width:0;background:rgba(255,255,255,.6);border:1px solid rgba(100,116,139,.3);border-radius:99px;padding:7px 12px;color:#1f2937;font-size:13px;outline:none}#fmc-in button{all:unset;cursor:pointer;padding:6px 14px;border-radius:99px;background:#4b5768;color:#fff;font:700 12px system-ui}',
    '@media(max-width:1023px){#fmc-tab{bottom:88px;padding:11px 16px}#fmc-tab.kasir{left:auto;right:12px}#fmc-panel,#fmc-panel.kasir,#fmc-panel.owner{inset:0;bottom:0;left:0;right:0;width:auto;height:auto;border-radius:0;z-index:2147482000;transform:none;transition:opacity .2s ease}#fmc-panel.kasir,#fmc-panel.owner{transform:none}#fmc-panel:not(.open){opacity:0}}',
    /* tampilan gelap tembus pandang: terbaca jelas di atas latar apa pun */
    '#fmc-panel{background:rgba(10,15,28,.78)!important;color:#e5e7eb!important;border:1px solid rgba(255,255,255,.2)!important;box-shadow:0 12px 40px rgba(0,0,0,.45)!important}',
    '#fmc-hd,#fmc-opt,#fmc-in{border-color:rgba(255,255,255,.16)!important}#fmc-hd{color:#f8fafc}#fmc-hd small{color:#94a3b8!important}#fmc-hd button{color:#cbd5e1!important}#fmc-opt{color:#cbd5e1!important}',
    '#fmc-panel .fmc-t{color:#94a3b8!important}#fmc-panel .fmc-id{color:#cbd5e1!important}#fmc-panel .fmc-x{color:#f1f5f9!important}#fmc-panel .fmc-m.me .fmc-id{color:#7dd3fc!important}#fmc-panel .fmc-m.dev .fmc-id{color:#fde68a!important;background:rgba(251,191,36,.22)!important}#fmc-panel .fmc-empty{color:#94a3b8!important}#fmc-note{color:#fbbf24!important}',
    '#fmc-in input{background:rgba(255,255,255,.1)!important;border-color:rgba(255,255,255,.22)!important;color:#f8fafc!important}#fmc-in input::placeholder{color:#94a3b8}#fmc-in button{background:#3b5bdb!important}',
    '#fmc-tab{background:rgba(15,23,42,.72)!important;border-color:rgba(255,255,255,.3)!important}',
    'html[data-fm-invert="1"] #fmc-panel,html[data-fm-invert="1"] #fmc-tab{filter:invert(1) hue-rotate(180deg)}'
  ].join('\n');
  var built = false;
  function build() {
    if (built || IS_TOWER) return;
    if (window.FM_PLANS && !FM_PLANS.has('chat')) return;
    built = true;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var side = ROLE === 'staff' ? 'kasir' : 'owner';
    var tab = document.createElement('button'); tab.id = 'fmc-tab'; tab.className = side; tab.type = 'button'; tab.innerHTML = 'Chat <i id="fmc-n"></i>';
    var pn = document.createElement('div'); pn.id = 'fmc-panel'; pn.className = side;
    pn.innerHTML = '<div id="fmc-hd"><span>Chat global</span><small id="fmc-me"></small><span class="sp"></span><button type="button" id="fmc-x" title="Tutup">×</button></div>' +
      (ROLE === 'owner' ? '<label id="fmc-opt" class="on"><input type="checkbox" id="fmc-ko"> Kasir toko saya boleh ikut chat</label>' : '') +
      '<div id="fmc-feed"></div><div id="fmc-note"></div><div id="fmc-in"><input id="fmc-txt" maxlength="' + MAXLEN + '" placeholder="Tulis pesan (maks ' + MAXLEN + ' huruf)" autocomplete="off"><button type="button" id="fmc-go">Kirim</button></div>';
    document.body.appendChild(tab); document.body.appendChild(pn);
    tab.onclick = function () { toggle(); };
    $('fmc-x').onclick = function () { toggle(false); };
    var txt = $('fmc-txt'); function go() { var v = txt.value; $('fmc-note').textContent = ''; send(v, function (why) { if (why) $('fmc-note').textContent = why; else txt.value = ''; }); }
    $('fmc-go').onclick = go; txt.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); e.stopPropagation(); });
    var ko = $('fmc-ko'); if (ko) ko.onchange = function () { var tid = me().tid; db.collection('tenant_settings').doc(tid).set({ chatKasir: ko.checked }, { merge: true }).catch(function () { ko.checked = !ko.checked; $('fmc-note').textContent = 'Gagal menyimpan pengaturan.'; }); };
    $('fmc-me').textContent = 'kamu: ' + me().label;
  }
  function toggle(force) {
    S.open = force === undefined ? !S.open : !!force;
    var pn = $('fmc-panel'); if (pn) pn.classList.toggle('open', S.open);
    if (S.open) { markSeen(); paint(); var t = $('fmc-txt'); if (t && window.innerWidth >= 1024) t.focus(); }
  }

  /* ---------- panel Tower (Monitor) ---------- */
  function mountTower(el) {
    if (!el) return; S.towerEl = el;
    el.innerHTML = '<div id="tw-cfeed" class="fmc-feed"></div><div id="tw-cnote" class="fmc-note"></div><div class="fmc-in"><input id="tw-ctxt" maxlength="' + MAXLEN + '" placeholder="Tulis sebagai DEV..." autocomplete="off"><button type="button" id="tw-cgo">KIRIM</button></div>';
    var txt = $('tw-ctxt'); function go() { $('tw-cnote').textContent = ''; send(txt.value, function (why) { if (why) $('tw-cnote').textContent = why; else txt.value = ''; }); }
    $('tw-cgo').onclick = go; txt.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); e.stopPropagation(); });
    start(); paint();
  }

  /* ---------- moderasi Tower ---------- */
  function openModeration() {
    if (!IS_TOWER) return;
    var old = $('fmc-mod'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'fmc-mod';
    ov.style.cssText = 'position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,sans-serif';
    ov.innerHTML = '<div style="width:min(720px,100%);max-height:90vh;display:flex;flex-direction:column;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:22px;color:#e6e6e6;overflow:hidden">' +
      '<div style="display:flex;align-items:center;padding:14px 18px;border-bottom:1px solid #1f1f1f"><b style="font-size:15px">Chat Global: moderasi</b><span style="flex:1"></span><button id="fmc-mclose" style="all:unset;cursor:pointer;color:#999;font-size:20px;padding:0 6px">×</button></div>' +
      '<div style="padding:14px 18px;display:flex;flex-direction:column;gap:12px;overflow:auto"><div id="fmc-mbody"></div></div></div>';
    document.body.appendChild(ov);
    ov.onclick = function (e) { if (e.target === ov || e.target.id === 'fmc-mclose') ov.remove(); };
    paintMod();
  }
  function paintMod() {
    var b = $('fmc-mbody'); if (!b) return;
    var muted = S.cfg.muted || [], on = S.cfg.enabled !== false;
    var btn = 'all:unset;cursor:pointer;padding:4px 12px;border-radius:99px;background:#1f1f1f;color:#ddd;font-size:12px';
    b.innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><span style="font-size:13px">Chat untuk semua toko:</span><button data-a="toggle" style="' + btn + ';background:' + (on ? '#1f7a4a' : '#5a1d1d') + '">' + (on ? 'NYALA' : 'MATI') + '</button></div>' +
      '<div style="margin-bottom:12px"><div style="font-size:12px;color:#888;margin-bottom:6px">ID dibisukan (' + muted.length + ')</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">' +
      (muted.map(function (m) { return '<span style="background:#1f1f1f;border-radius:99px;padding:3px 10px;font-size:12px">' + esc(m) + ' <a data-a="unmute" data-id="' + esc(m) + '" style="cursor:pointer;color:#ff8f8f;margin-left:4px">lepas</a></span>'; }).join('') || '<span style="color:#666;font-size:12px">Tidak ada.</span>') +
      '</div><div style="display:flex;gap:6px"><input id="fmc-mid" placeholder="Ketik ID, mis. ID261112403" style="flex:1;background:#161616;border:1px solid #2a2a2a;border-radius:99px;padding:6px 12px;color:#eee;font-size:12.5px;outline:none"><button data-a="mute" style="' + btn + '">Bisukan</button></div></div>' +
      '<div style="font-size:12px;color:#888;margin-bottom:6px">Pesan terakhir <button data-a="clear" style="' + btn + ';margin-left:8px;color:#ff8f8f">Hapus semua</button></div>' +
      '<div style="display:flex;flex-direction:column;gap:3px">' + (S.msgs.slice(-60).reverse().map(function (x) {
        return '<div style="display:flex;gap:8px;align-items:baseline;font-size:12.5px;border-bottom:1px solid #151515;padding:3px 0"><span style="color:#666;flex:none">' + hm(x.ms || 0) + '</span><b style="color:' + (x.role === 'dev' ? '#f5c542' : '#9a9a9a') + ';flex:none">' + esc(x.label) + '</b><span style="flex:1;word-break:break-word">' + esc(x.text) + '</span>' +
          (x.role === 'dev' ? '' : '<a data-a="mute" data-id="' + esc(x.tid) + '" style="cursor:pointer;color:#f5c542;flex:none">bisukan</a>') + '<a data-a="del" data-id="' + esc(x.id) + '" style="cursor:pointer;color:#ff8f8f;flex:none">hapus</a></div>';
      }).join('') || '<div style="color:#666;font-size:12px">Belum ada pesan.</div>') + '</div>';
    b.onclick = async function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (!a) return;
      var id = e.target.getAttribute('data-id'), ref = db.collection(CFG).doc('main');
      var done = function () {}, fail = function () { alert('Gagal. Pastikan aturan Firestore v6 sudah dipublikasikan.'); };
      if (a === 'toggle') ref.set({ enabled: !(S.cfg.enabled !== false), muted: S.cfg.muted || [] }, { merge: true }).then(done, fail);
      else if (a === 'mute') { id = (id || ($('fmc-mid') && $('fmc-mid').value) || '').trim().toUpperCase(); if (!id) return; var m = (S.cfg.muted || []).filter(function (x) { return x !== id; }); m.push(id); ref.set({ enabled: S.cfg.enabled !== false, muted: m }, { merge: true }).then(done, fail); }
      else if (a === 'unmute') ref.set({ enabled: S.cfg.enabled !== false, muted: (S.cfg.muted || []).filter(function (x) { return x !== id; }) }, { merge: true }).then(done, fail);
      else if (a === 'del') db.collection(COL).doc(id).delete().then(done, fail);
      else if (a === 'clear') { if (!await fmAsk('Hapus semua pesan chat?')) return; var bt = db.batch(); S.msgs.forEach(function (x) { bt.delete(db.collection(COL).doc(x.id)); }); bt.commit().then(done, fail); }
    };
  }

  /* ---------- gambar ulang ---------- */
  function paint() {
    var n = unread();
    var badge = $('fmc-n'); if (badge) { badge.textContent = n > 9 ? '9+' : n; badge.classList.toggle('on', n > 0 && !S.open); }
    var feed = $('fmc-feed'); if (feed) { feed.innerHTML = feedHtml(60); stickScroll(feed); }
    var ko = $('fmc-ko'); if (ko && document.activeElement !== ko) ko.checked = S.kasirOk;
    var inp = $('fmc-txt'); if (inp) { var why = blocked(); inp.disabled = !!why; inp.placeholder = why || ('Tulis pesan (maks ' + MAXLEN + ' huruf)'); }
    var tf = $('tw-cfeed'); if (tf) { tf.innerHTML = feedHtml(60); stickScroll(tf); }
    if ($('fmc-mod')) paintMod();
  }

  /* Hapus seluruh isi Chat Universe, dipanggil langsung dari tile KENDALI (tanpa buka panel moderasi dulu) */
  async function clearAll() {
    if (!IS_TOWER) return;
    if (!await fmAsk('Hapus SEMUA pesan di Chat Universe? Tindakan ini tidak bisa dibatalkan.')) return;
    db.collection(COL).get().then(function (snap) {
      if (snap.empty) { alert('Chat sudah kosong.'); return; }
      var docs = snap.docs, i = 0;
      function next() {
        if (i >= docs.length) { alert('Semua pesan (' + docs.length + ') sudah dihapus.'); return; }
        var b = db.batch(); docs.slice(i, i + 400).forEach(function (d) { b.delete(d.ref); });
        i += 400;
        b.commit().then(next).catch(function (e) { alert('Gagal menghapus semua: ' + (e && e.code || e.message)); });
      }
      next();
    }).catch(function (e) { alert('Gagal membaca chat: ' + (e && e.code || e.message)); });
  }

  var started = false;
  function start() {
    if (started) return; started = true;
    var tries = 0;
    (function wait() {
      if (ready()) { build(); subscribe(); return; }
      if (++tries < 80) setTimeout(wait, 500);
    })();
  }
  window.FM_CHAT = { mountTower: mountTower, openModeration: openModeration, send: send, state: S, clearAll: clearAll };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
