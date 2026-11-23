/* ON Messenger (di dalam Finance AI Master / Oneilverse).
   Mengadopsi gaya chat mobile-first ala Chatneil:
   - Di desktop: tampil seukuran HP (380x640px) saat tombol Chat di dock ditekan; di HP: fullscreen.
   - Daftar obrolan:
     1) Chat World (Jaringan ON) -> koleksi global_chat
     2) Ony (CS Live) -> kontak bawaan CS Live (DM ke DEV/Tower)
     3) Kontak ID Toko tersimpan -> user bisa tambah ID Toko + kasih nama sendiri (localStorage)
   - Panel Tower (provider.html) tetap dipertahankan penuh (mountTower & openModeration). */
(function () {
  'use strict';
  var PATH = (location.pathname || '').toLowerCase();
  var IS_TOWER = /provider/.test(PATH);
  var ROLE = IS_TOWER ? 'dev' : /kasir/.test(PATH) ? 'staff' : /manager/.test(PATH) ? 'manager' : /dashboard/.test(PATH) ? 'owner' : '';
  if (!ROLE) { window.FM_CHAT = null; return; }

  var COL = 'global_chat', CFG = 'global_chat_cfg', DM_COL = 'on_dm', MAXLEN = 140, COOLDOWN = 5000;
  var S = {
    msgs: [], cfg: { enabled: true, muted: [] }, err: false, open: false, kasirOk: true,
    last: 0, seen: 0, first: true, towerEl: null,
    view: 'list', // 'list' | 'room' | 'add'
    activeRoom: null, // { id, name, type: 'world'|'cs'|'dm', tid }
    dmMsgs: [], dmErr: false, dmUnsub: null,
    contacts: []
  };
  try { S.seen = +localStorage.getItem('fmc_seen') || 0; } catch (e) {}

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function hm(ms) { var d = new Date(ms + 7 * 3600000); return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); }
  function g(fn, d) { try { var v = fn(); return v === undefined ? d : v; } catch (e) { return d; } }

  function me() {
    if (IS_TOWER) return { tid: 'DEV', role: 'dev', label: 'DEV' };
    var t = g(function () { return getActiveTenant(); }, null), tid = t && t.id ? String(t.id).toUpperCase() : '';
    return { tid: tid, role: ROLE, label: tid + (ROLE === 'staff' ? '-K' : ROLE === 'manager' ? '-M' : '-O') };
  }
  function ready() { return typeof db !== 'undefined' && db && g(function () { return window.FM_AUTH ? FM_AUTH.curUser() : firebase.auth().currentUser; }, null); }

  /* ---------- kontak tersimpan (ID Toko + Nama Sendiri) ---------- */
  function cKey() { return 'on_contacts_' + (me().tid || 'anon'); }
  function loadContacts() {
    try {
      var raw = localStorage.getItem(cKey());
      S.contacts = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(S.contacts)) S.contacts = [];
    } catch (e) { S.contacts = []; }
  }
  function saveContacts() {
    try { localStorage.setItem(cKey(), JSON.stringify(S.contacts)); } catch (e) {}
  }
  function addContact(tid, alias) {
    tid = String(tid || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    alias = String(alias || '').trim().slice(0, 32);
    if (!tid) return 'Masukkan ID Toko yang valid.';
    if (tid === me().tid) return 'Tidak bisa menyimpan ID toko sendiri.';
    if (!alias) alias = 'Toko ' + tid;
    var ex = S.contacts.find(function (c) { return c.tid === tid; });
    if (ex) ex.name = alias;
    else S.contacts.unshift({ tid: tid, name: alias, addedAt: Date.now() });
    saveContacts();
    return '';
  }
  function removeContact(tid) {
    S.contacts = S.contacts.filter(function (c) { return c.tid !== tid; });
    saveContacts();
  }

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
  function sendWorld(text, done) {
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

  function dmPairId(a, b) {
    var arr = [String(a || '').toUpperCase(), String(b || '').toUpperCase()].sort();
    return arr[0] + '__' + arr[1];
  }
  function sendDm(targetTid, text, done) {
    text = clean(text);
    if (!text) return done && done('');
    if (text.length > 300) return done && done('Maksimal 300 karakter.');
    var m = me(); if (!m.tid) return done && done('ID toko tidak dikenali.');
    var pair = dmPairId(m.tid, targetTid);
    var now = Date.now();
    db.collection(DM_COL).doc(pair).set({
      tid: targetTid === 'DEV' ? m.tid : targetTid,
      lastText: text,
      lastMs: now,
      lastFrom: m.label
    }, { merge: true }).catch(function () {});
    db.collection(DM_COL).doc(pair).collection('messages').add({
      fromTid: m.tid, fromLabel: m.label, toTid: targetTid,
      text: text, ms: now, at: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function () { done && done(''); })
      .catch(function (e) { done && done('Gagal kirim DM (' + (e && e.code ? e.code : 'rules') + ').'); });
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
      if (S.open && S.view === 'room' && S.activeRoom && S.activeRoom.type === 'world') markSeen();
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
  function subscribeDm(targetTid) {
    if (S.dmUnsub) { try { S.dmUnsub(); } catch (e) {} S.dmUnsub = null; }
    S.dmMsgs = []; S.dmErr = false;
    var m = me(); if (!m.tid || !ready()) return;
    var pair = dmPairId(m.tid, targetTid);
    S.dmUnsub = db.collection(DM_COL).doc(pair).collection('messages').orderBy('ms', 'desc').limit(60).onSnapshot(function (snap) {
      var a = []; snap.forEach(function (d) { var x = d.data(); x.id = d.id; a.push(x); });
      a.reverse(); S.dmMsgs = a; S.dmErr = false; paint();
    }, function () { S.dmErr = true; paint(); });
  }
  function markSeen() { var l = S.msgs.length ? S.msgs[S.msgs.length - 1].ms : 0; S.seen = Math.max(S.seen, l); try { localStorage.setItem('fmc_seen', String(S.seen)); } catch (e) {} }
  function unread() { var m = me().label; return S.msgs.filter(function (x) { return x.ms > S.seen && x.label !== m; }).length; }

  /* ---------- tampilan daftar pesan ---------- */
  function feedHtml(limit) {
    var mine = me().label, list = S.msgs.slice(-(limit || 60));
    if (S.err) return '<div class="fmc-empty">Chat World belum aktif. Coba lagi nanti.</div>';
    if (!list.length) return '<div class="fmc-empty">Belum ada pesan di Chat World.</div>';
    return list.map(function (x) {
      var isMe = x.label === mine;
      return '<div class="on-bwrap' + (isMe ? ' me' : '') + '">' +
        '<div class="on-bubble' + (x.role === 'dev' ? ' dev' : '') + '">' +
        (!isMe ? '<div class="on-sender">' + esc(x.label) + '</div>' : '') +
        '<div class="on-text">' + esc(x.text) + '</div>' +
        '<div class="on-meta">' + hm(x.ms || 0) + (isMe ? ' ✓✓' : '') + '</div>' +
        '</div></div>';
    }).join('');
  }
  function dmFeedHtml() {
    if (S.dmErr) return '<div class="fmc-empty">DM belum aktif di Firestore Rules.<br><small>Tambahkan rule koleksi <b>on_dm</b> di Firebase Console agar DM ke Ony &amp; antar toko berjalan.</small></div>';
    var myTid = me().tid, clrAt = 0;
    try { clrAt = +localStorage.getItem('on_clr_' + myTid + '_' + (S.activeRoom ? S.activeRoom.tid : '')) || 0; } catch (e) {}
    var visible = S.dmMsgs.filter(function (x) { return (x.ms || 0) > clrAt; });
    if (!visible.length) return '<div class="fmc-empty">Mulai percakapan dengan ' + esc(S.activeRoom ? S.activeRoom.name : '') + '.</div>';
    return visible.map(function (x) {
      var isMe = x.fromTid === myTid;
      return '<div class="on-bwrap' + (isMe ? ' me' : '') + '" data-id="' + esc(x.id || '') + '" data-ms="' + (x.ms || 0) + '" data-me="' + (isMe ? '1' : '0') + '">' +
        '<div class="on-bubble">' +
        (!isMe ? '<div class="on-sender">' + esc(x.fromLabel || x.fromTid) + '</div>' : '') +
        '<div class="on-text">' + esc(x.text) + '</div>' +
        '<div class="on-meta">' + hm(x.ms || 0) + (isMe ? ' ✓✓' : '') + '</div>' +
        '</div></div>';
    }).join('');
  }
  function stickScroll(el) { if (el) el.scrollTop = el.scrollHeight; }

  /* ---------- widget klien (ukuran HP di desktop, fullscreen di HP) ---------- */
  var CSS = [
    '.fmc-empty{color:#94a3b8;font-size:12.5px;padding:24px 14px;text-align:center;line-height:1.5}',
    '#fmc-tab{position:fixed;z-index:44;bottom:12px;display:flex;align-items:center;gap:7px;padding:8px 15px;border-radius:99px;background:rgba(15,23,42,.82);color:#fff;border:1px solid rgba(255,255,255,.3);font:600 12.5px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 18px rgba(0,0,0,.35)}',
    '#fmc-tab.kasir{left:12px}#fmc-tab.owner{right:12px}#fmc-tab i{font-style:normal;min-width:18px;text-align:center;padding:0 5px;border-radius:99px;background:#ef4444;color:#fff;font-size:10.5px;display:none}#fmc-tab i.on{display:inline-block}',
    /* Ukuran HP di Desktop (380x640) */
    '#fmc-panel{position:fixed;z-index:45;bottom:58px;width:380px;height:640px;max-height:calc(100vh - 76px);display:flex;flex-direction:column;background:#0f172a;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);border-radius:26px;box-shadow:0 20px 50px rgba(0,0,0,.6);font-family:system-ui,-apple-system,sans-serif;overflow:hidden;transition:transform .22s ease,opacity .22s ease;pointer-events:none;opacity:0}',
    '#fmc-panel.kasir{left:12px;transform:translateY(16px)}#fmc-panel.owner{right:12px;transform:translateY(16px)}#fmc-panel.open{pointer-events:auto;opacity:1;transform:translateY(0)}',
    '#fmc-hd{flex:none;display:flex;align-items:center;gap:10px;padding:12px 14px;background:#1e293b;border-bottom:1px solid rgba(255,255,255,.1);font-size:14px;font-weight:700}',
    '#fmc-hd .on-sub{display:block;font-weight:400;color:#94a3b8;font-size:11px}',
    '#fmc-hd .sp{flex:1}',
    '#fmc-hd button{all:unset;cursor:pointer;color:#cbd5e1;padding:4px 8px;border-radius:8px;font-size:16px;line-height:1}#fmc-hd button:hover{background:rgba(255,255,255,.1)}',
    '#fmc-hd .on-addbtn{font-size:12px;font-weight:600;background:#2563eb;color:#fff;padding:5px 10px;border-radius:99px}',
    /* Daftar Kontak & Obrolan */
    '#on-list{flex:1 1 0;min-height:0;overflow:auto;padding:8px 0}',
    '.on-item{display:flex;align-items:center;gap:12px;padding:11px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .15s}',
    '.on-item:hover{background:rgba(255,255,255,.05)}',
    '.on-av{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex:none;color:#fff;background:#334155}',
    '.on-av.world{background:linear-gradient(135deg,#2563eb,#0ea5e9)}.on-av.cs{background:linear-gradient(135deg,#10b981,#059669)}',
    '.on-info{flex:1;min-width:0}.on-name{font-size:14px;font-weight:600;color:#f8fafc;display:flex;align-items:center;gap:6px}',
    '.on-badge{font-size:10px;padding:1px 6px;border-radius:99px;background:rgba(16,185,129,.2);color:#34d399;font-weight:600}',
    '.on-prev{font-size:12px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}',
    '.on-del{all:unset;cursor:pointer;color:#64748b;padding:4px 8px;font-size:14px}.on-del:hover{color:#ef4444}',
    /* Form Tambah Kontak */
    '#on-addbox{flex:1;padding:18px 16px;display:flex;flex-direction:column;gap:12px}',
    '#on-addbox label{font-size:12px;color:#cbd5e1;font-weight:600}',
    '#on-addbox input{width:100%;box-sizing:border-box;background:#1e293b;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:10px 12px;color:#fff;font-size:13.5px;outline:none}',
    '#on-addbox button{background:#2563eb;color:#fff;border:none;border-radius:10px;padding:11px;font-weight:700;font-size:13.5px;cursor:pointer}',
    /* Ruang Chat */
    '#fmc-opt{flex:none;display:none;align-items:center;gap:8px;padding:7px 14px;background:#1e293b;border-bottom:1px solid rgba(255,255,255,.08);font-size:11.5px;color:#cbd5e1}#fmc-opt.on{display:flex}#fmc-opt input{accent-color:#3b82f6}',
    '#fmc-feed{flex:1 1 0;min-height:0;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#0b1120}',
    '.on-bwrap{display:flex;flex-direction:column;align-items:flex-start}.on-bwrap.me{align-items:flex-end}',
    '.on-bubble{max-width:82%;padding:8px 12px;border-radius:16px 16px 16px 4px;background:#1e293b;color:#f1f5f9;font-size:13px;line-height:1.4;word-break:break-word;box-shadow:0 1px 2px rgba(0,0,0,.25)}',
    '.on-bwrap.me .on-bubble{background:#2563eb;color:#fff;border-radius:16px 16px 4px 16px}',
    '.on-bubble.dev{border:1px solid rgba(251,191,36,.4);background:#292524}',
    '.on-sender{font-size:11px;font-weight:700;color:#7dd3fc;margin-bottom:2px}',
    '.on-meta{font-size:10px;color:rgba(255,255,255,.6);text-align:right;margin-top:3px}',
    '#fmc-note{flex:none;min-height:16px;padding:2px 12px;font-size:11px;color:#fbbf24;background:#0b1120}',
    '#fmc-in{flex:none;display:flex;gap:8px;padding:10px 12px;background:#1e293b;border-top:1px solid rgba(255,255,255,.1)}',
    '#fmc-in input{flex:1;min-width:0;background:#0f172a;border:1px solid rgba(255,255,255,.2);border-radius:99px;padding:9px 14px;color:#f8fafc;font-size:13px;outline:none}',
    '#fmc-in button{all:unset;cursor:pointer;padding:8px 16px;border-radius:99px;background:#2563eb;color:#fff;font:700 12.5px system-ui}',
    '#on-sheet-ov{position:absolute;inset:0;z-index:20;background:rgba(2,6,23,.65);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center;padding:12px}',
    '#on-sheet{width:100%;background:#1e293b;border:1px solid rgba(255,255,255,.15);border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:8px;box-shadow:0 12px 32px rgba(0,0,0,.5)}',
    '#on-sheet-t{font-size:13.5px;font-weight:700;color:#f8fafc;text-align:center;margin-bottom:2px}',
    '#on-sheet button{border:none;border-radius:12px;padding:11px;font-size:13px;font-weight:600;cursor:pointer;background:#334155;color:#f1f5f9}',
    '#on-sheet button.danger{background:#dc2626;color:#fff}',
    '#on-sheet button.cancel{background:transparent;color:#94a3b8}',
    'html[data-fm-invert="1"] #fmc-panel,html[data-fm-invert="1"] #fmc-tab{filter:invert(1) hue-rotate(180deg)}',
    '@media(max-width:1023px){#fmc-tab{bottom:88px;padding:11px 16px}#fmc-tab.kasir{left:auto;right:12px}#fmc-panel,#fmc-panel.kasir,#fmc-panel.owner{inset:0;bottom:0;left:0;right:0;width:auto;height:auto;max-height:none;border-radius:0;z-index:2147482000;transform:none}}'
  ].join('\n');

  var built = false;
  function build() {
    if (built || IS_TOWER) return;
    if (window.FM_PLANS && !FM_PLANS.has('chat')) return;
    built = true;
    loadContacts();
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var side = ROLE === 'staff' ? 'kasir' : 'owner';
    var tab = document.createElement('button'); tab.id = 'fmc-tab'; tab.className = side; tab.type = 'button'; tab.innerHTML = '💬 Chat <i id="fmc-n"></i>';
    var pn = document.createElement('div'); pn.id = 'fmc-panel'; pn.className = side;
    document.body.appendChild(tab); document.body.appendChild(pn);
    tab.onclick = function () { toggle(); };
    paint();
  }

  function openRoom(room) {
    S.activeRoom = room;
    S.view = 'room';
    if (room.type === 'world') {
      markSeen();
    } else {
      subscribeDm(room.tid);
    }
    paint();
    setTimeout(function () { var t = $('fmc-txt'); if (t && window.innerWidth >= 1024) t.focus(); }, 50);
  }

  function renderPanel() {
    var pn = $('fmc-panel'); if (!pn) return;
    var m = me();
    if (S.view === 'list') {
      var lastW = S.msgs.length ? S.msgs[S.msgs.length - 1] : null;
      var wPrev = lastW ? (lastW.label + ': ' + lastW.text) : 'Obrolan semua jaringan ON';
      var u = unread();
      var html = '<div id="fmc-hd"><div>ON Messenger<span class="on-sub">ID: ' + esc(m.label) + '</span></div><span class="sp"></span>' +
        '<button type="button" class="on-addbtn" id="on-btn-add">+ Kontak</button>' +
        '<button type="button" id="fmc-x" title="Tutup">×</button></div>' +
        '<div id="on-list">' +
        '<div class="on-item" data-room="world"><div class="on-av world">🌐</div><div class="on-info"><div class="on-name">Chat World <span class="on-badge">Jaringan ON</span>' + (u ? '<span class="on-badge" style="background:#ef4444;color:#fff">' + u + '</span>' : '') + '</div><div class="on-prev">' + esc(wPrev) + '</div></div></div>' +
        '<div class="on-item" data-room="cs"><div class="on-av cs">O</div><div class="on-info"><div class="on-name">Ony <span class="on-badge">CS Live</span></div><div class="on-prev">Bantuan &amp; Support Resmi Oneilverse</div></div></div>';
      S.contacts.forEach(function (c) {
        html += '<div class="on-item" data-tid="' + esc(c.tid) + '"><div class="on-av">' + esc((c.name || c.tid).charAt(0).toUpperCase()) + '</div>' +
          '<div class="on-info"><div class="on-name">' + esc(c.name) + '</div><div class="on-prev">ID Toko: ' + esc(c.tid) + '</div></div>' +
          '<button type="button" class="on-del" data-del="' + esc(c.tid) + '" title="Hapus kontak">🗑</button></div>';
      });
      html += '</div>';
      pn.innerHTML = html;
      $('fmc-x').onclick = function () { toggle(false); };
      $('on-btn-add').onclick = function () { S.view = 'add'; paint(); };
      pn.querySelectorAll('.on-item').forEach(function (el) {
        el.onclick = function (e) {
          if (e.target && e.target.getAttribute('data-del')) return;
          var r = el.getAttribute('data-room');
          if (r === 'world') openRoom({ id: 'world', name: 'Chat World', type: 'world', tid: '' });
          else if (r === 'cs') openRoom({ id: 'DEV', name: 'Ony (CS Live)', type: 'cs', tid: 'DEV' });
          else {
            var tid = el.getAttribute('data-tid');
            var c = S.contacts.find(function (x) { return x.tid === tid; });
            if (c) openRoom({ id: tid, name: c.name, type: 'dm', tid: tid });
          }
        };
      });
      pn.querySelectorAll('.on-del').forEach(function (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          removeContact(btn.getAttribute('data-del'));
          paint();
        };
      });
    } else if (S.view === 'add') {
      pn.innerHTML = '<div id="fmc-hd"><button type="button" id="on-back">←</button><span>Tambah Kontak Toko</span><span class="sp"></span><button type="button" id="fmc-x">×</button></div>' +
        '<div id="on-addbox">' +
        '<div><label>ID Toko Tujuan</label><input id="on-in-tid" placeholder="Contoh: TOKO01" autocomplete="off"></div>' +
        '<div><label>Nama Kontak (Bebas)</label><input id="on-in-name" placeholder="Contoh: Cabang Medan" autocomplete="off"></div>' +
        '<div id="on-add-err" style="font-size:12px;color:#fbbf24;min-height:16px"></div>' +
        '<button type="button" id="on-save-c">Simpan Kontak</button>' +
        '</div>';
      $('fmc-x').onclick = function () { toggle(false); };
      $('on-back').onclick = function () { S.view = 'list'; paint(); };
      $('on-save-c').onclick = function () {
        var err = addContact($('on-in-tid').value, $('on-in-name').value);
        if (err) { $('on-add-err').textContent = err; return; }
        S.view = 'list'; paint();
      };
    } else if (S.view === 'room' && S.activeRoom) {
      var rm = S.activeRoom;
      var sub = rm.type === 'world' ? 'Semua jaringan ON' : (rm.type === 'cs' ? 'CS Live Oneilverse' : 'ID Toko: ' + rm.tid);
      pn.innerHTML = '<div id="fmc-hd"><button type="button" id="on-back">←</button><div>' + esc(rm.name) + '<span class="on-sub">' + esc(sub) + '</span></div><span class="sp"></span>' +
        (rm.type !== 'world' ? '<button type="button" id="on-clr" style="font-size:11.5px;color:#fca5a5" title="Bersihkan chat">Clear</button>' : '') +
        '<button type="button" id="fmc-x">×</button></div>' +
        (rm.type === 'world' && ROLE === 'owner' ? '<label id="fmc-opt" class="on"><input type="checkbox" id="fmc-ko"> Kasir toko saya boleh ikut chat</label>' : '') +
        '<div id="fmc-feed"></div><div id="fmc-note"></div>' +
        '<div id="fmc-in"><input id="fmc-txt" maxlength="' + (rm.type === 'world' ? MAXLEN : 300) + '" placeholder="Tulis pesan..." autocomplete="off"><button type="button" id="fmc-go">Kirim</button></div>';
      $('fmc-x').onclick = function () { toggle(false); };
      $('on-back').onclick = function () { S.view = 'list'; if (S.dmUnsub) { try { S.dmUnsub(); } catch (e) {} S.dmUnsub = null; } paint(); };
      var ko = $('fmc-ko');
      if (ko) {
        ko.checked = S.kasirOk;
        ko.onchange = function () {
          var tid = me().tid;
          db.collection('tenant_settings').doc(tid).set({ chatKasir: ko.checked }, { merge: true }).catch(function () { ko.checked = !ko.checked; $('fmc-note').textContent = 'Gagal menyimpan pengaturan.'; });
        };
      }
      var feed = $('fmc-feed');
      feed.innerHTML = rm.type === 'world' ? feedHtml(60) : dmFeedHtml();
      stickScroll(feed);
      if (rm.type !== 'world') {
        function showSheet(title, actionLabel, onConfirm) {
          var old = $('on-sheet-ov'); if (old) old.remove();
          var ov = document.createElement('div'); ov.id = 'on-sheet-ov';
          ov.innerHTML = '<div id="on-sheet"><div id="on-sheet-t">' + esc(title) + '</div>' +
            '<button type="button" class="danger" id="on-sh-ok">' + esc(actionLabel) + '</button>' +
            '<button type="button" class="cancel" id="on-sh-no">Batal</button></div>';
          pn.appendChild(ov);
          $('on-sh-no').onclick = function () { ov.remove(); };
          ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
          $('on-sh-ok').onclick = function () { ov.remove(); onConfirm(); };
        }
        var clr = $('on-clr');
        if (clr) clr.onclick = function () {
          showSheet('Bersihkan semua chat di room ini?', 'Bersihkan Chat', function () {
            try { localStorage.setItem('on_clr_' + me().tid + '_' + rm.tid, String(Date.now())); } catch (e) {}
            paint();
          });
        };
        feed.querySelectorAll('.on-bwrap').forEach(function (bw) {
          bw.onclick = function () {
            var id = bw.getAttribute('data-id'), ms = +bw.getAttribute('data-ms'), isMe = bw.getAttribute('data-me') === '1';
            if (!id || !isMe) return;
            var canUnsend = (Date.now() - ms) <= 30 * 60 * 1000;
            showSheet(canUnsend ? 'Batal kirim pesan ini? (maks 30 menit)' : 'Hapus pesan ini?', canUnsend ? 'Batal Kirim' : 'Hapus', function () {
              db.collection(DM_COL).doc(dmPairId(me().tid, rm.tid)).collection('messages').doc(id).delete().catch(function () {});
            });
          };
        });
      }
      var txt = $('fmc-txt');
      function go() {
        var v = txt.value; $('fmc-note').textContent = '';
        var cb = function (why) { if (why) $('fmc-note').textContent = why; else txt.value = ''; };
        if (rm.type === 'world') sendWorld(v, cb);
        else sendDm(rm.tid, v, cb);
      }
      $('fmc-go').onclick = go;
      txt.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); e.stopPropagation(); });
    }
  }

  function toggle(force) {
    S.open = force === undefined ? !S.open : !!force;
    var pn = $('fmc-panel'); if (pn) pn.classList.toggle('open', S.open);
    if (S.open) {
      if (S.view === 'room' && S.activeRoom && S.activeRoom.type === 'world') markSeen();
      paint();
    }
  }

  /* ---------- panel Tower (Monitor) ---------- */
  function mountTower(el) {
    if (!el) return; S.towerEl = el;
    el.innerHTML = '<div id="tw-cfeed" class="fmc-feed"></div><div id="tw-cnote" class="fmc-note"></div><div class="fmc-in"><input id="tw-ctxt" maxlength="' + MAXLEN + '" placeholder="Tulis sebagai DEV..." autocomplete="off"><button type="button" id="tw-cgo">KIRIM</button></div>';
    var txt = $('tw-ctxt'); function go() { $('tw-cnote').textContent = ''; sendWorld(txt.value, function (why) { if (why) $('tw-cnote').textContent = why; else txt.value = ''; }); }
    $('tw-cgo').onclick = go; txt.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); e.stopPropagation(); });
    start(); paint();
  }

  /* ---------- moderasi Tower ---------- */
  function openModeration() {
    if (!IS_TOWER) return;
    var old = $('fmc-mod'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'fmc-mod';
    ov.style.cssText = 'position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,sans-serif';
    var box = document.createElement('div');
    box.style.cssText = 'width:100%;max-width:460px;background:#111827;color:#e5e7eb;border:1px solid #374151;border-radius:14px;padding:16px';
    var muted = (S.cfg.muted || []).slice();
    box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b>Moderasi Chat Global</b><button id="fmc-mx" style="all:unset;cursor:pointer;font-size:18px;color:#9ca3af">×</button></div>' +
      '<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin-bottom:10px"><input type="checkbox" id="fmc-men"' + (S.cfg.enabled !== false ? ' checked' : '') + '> Chat global aktif untuk semua toko</label>' +
      '<div style="font-size:12px;color:#9ca3af;margin-bottom:4px">ID Toko yang dibisukan (pisahkan koma):</div>' +
      '<input id="fmc-mm" value="' + esc(muted.join(', ')) + '" style="width:100%;box-sizing:border-box;background:#1f2937;border:1px solid #374151;border-radius:8px;padding:8px;color:#fff;font-size:13px;margin-bottom:12px">' +
      '<div style="display:flex;gap:8px;justify-content:flex-end"><button id="fmc-ms" style="background:#2563eb;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer">Simpan</button></div>';
    ov.appendChild(box); document.body.appendChild(ov);
    $('fmc-mx').onclick = function () { ov.remove(); };
    $('fmc-ms').onclick = function () {
      var list = $('fmc-mm').value.split(',').map(function (s) { return s.trim().toUpperCase(); }).filter(Boolean);
      db.collection(CFG).doc('main').set({ enabled: $('fmc-men').checked, muted: list }, { merge: true }).then(function () { ov.remove(); }).catch(function () {});
    };
  }

  function paint() {
    if (IS_TOWER) {
      var tf = $('tw-cfeed'); if (tf) { tf.innerHTML = feedHtml(150); stickScroll(tf); }
      return;
    }
    var n = $('fmc-n');
    if (n) { var u = unread(); n.textContent = u > 99 ? '99+' : String(u); n.classList.toggle('on', u > 0 && !S.open); }
    renderPanel();
  }

  function start() {
    if (!IS_TOWER) build();
    if (ready()) subscribe();
  }

  /* Kosongkan seluruh isi Chat Global (Chat Universe). Hanya Tower. Percakapan pribadi (DM) tidak disentuh. */
  function clearAll() {
    if (!IS_TOWER) return;
    if (typeof db === 'undefined' || !db) return alert('Firestore belum terhubung.');
    if (!confirm('Kosongkan SELURUH isi Chat Global untuk semua toko?\n\nPesan yang dihapus tidak bisa dikembalikan. Percakapan pribadi tidak ikut terhapus.')) return;
    var total = 0;
    function round() {
      return db.collection(COL).limit(400).get().then(function (snap) {
        if (snap.empty) return;
        var b = db.batch(); snap.forEach(function (d) { b.delete(d.ref); total++; });
        return b.commit().then(round);
      });
    }
    round().then(function () { alert('Chat Global dikosongkan (' + total + ' pesan dihapus).'); }).catch(function (e) { alert('Gagal mengosongkan chat: ' + ((e && e.message) || e)); });
  }

  window.FM_CHAT = { start: start, toggle: toggle, mountTower: mountTower, openModeration: openModeration, clearAll: clearAll };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
