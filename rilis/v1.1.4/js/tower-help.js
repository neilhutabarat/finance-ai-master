/* tower-help.js — Tiket Bantuan dari klien (hanya halaman Tower). Membaca provider_tickets bertipe 'bantuan', Tower membalas / menutup / menghapus. */
(function () {
  'use strict';
  if (!/provider/.test(location.pathname)) return;
  function H(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function DB() { return (typeof db !== 'undefined' && db) ? db : null; }
  var list = [], ov = null, started = false, filter = 'buka', pill = null;
  var B = 'padding:7px 11px;border-radius:10px;font-weight:800;font-size:11.5px;border:0;cursor:pointer;color:#fff;';
  var ST = { BARU: ['Baru', '#f59e0b'], DIJAWAB: ['Dijawab', '#10b981'], SELESAI: ['Selesai', '#64748b'] };
  function start() {
    var d = DB(); if (started || !d) return; started = true;
    d.collection('provider_tickets').where('type', '==', 'bantuan').onSnapshot(function (s) {
      list = []; s.forEach(function (x) { var v = x.data(); v.docId = x.id; list.push(v); });
      list.sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); }); notify(); render();
    }, function (e) { console.error('Tiket bantuan', e); });
  }
  function nBaru() { return list.filter(function (t) { return t.status === 'BARU'; }).length; }
  function notify() {
    var n = nBaru();
    if (!n) { if (pill) { pill.remove(); pill = null; } return; }
    if (!pill) {
      pill = document.createElement('button'); pill.type = 'button';
      pill.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147482000;padding:9px 14px;border-radius:999px;border:1px solid #92400e;background:#451a03;color:#fcd34d;font:800 12px -apple-system,Segoe UI,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.4)';
      pill.onclick = function () { FM_HELPDESK.open(); }; document.body.appendChild(pill);
    }
    pill.textContent = n + ' tiket bantuan baru';
  }
  function render() {
    if (!ov || ov.style.display === 'none') return;
    var keepId = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-r'), keepVal = document.activeElement && document.activeElement.value;
    var rows = list.filter(function (t) { return filter === 'buka' ? t.status !== 'SELESAI' : filter === 'selesai' ? t.status === 'SELESAI' : true; });
    var h = '<div style="width:100%;max-width:720px;max-height:92vh;overflow:auto;background:#0b0b0f;color:#f5f5f7;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:18px;font-family:-apple-system,Segoe UI,sans-serif">' +
      '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><div style="font-weight:800;font-size:17px">Tiket Bantuan</div><div style="font-size:12px;opacity:.65">' + nBaru() + ' menunggu balasan, ' + list.length + ' total</div></div><button data-x style="' + B + 'background:#334155">Tutup</button></div>' +
      '<div style="display:flex;gap:6px;margin:12px 0">' + [['buka', 'Belum selesai'], ['selesai', 'Selesai'], ['semua', 'Semua']].map(function (x) { return '<button data-f="' + x[0] + '" style="' + B + (filter === x[0] ? 'background:#16a34a' : 'background:#1e293b') + '">' + x[1] + '</button>'; }).join('') + '</div>';
    if (!rows.length) h += '<p style="opacity:.65;text-align:center;padding:20px;font-size:13px">Tidak ada tiket.</p>';
    rows.forEach(function (t) {
      var s = ST[t.status] || ST.BARU;
      h += '<div style="padding:12px;margin-bottom:10px;border-radius:14px;background:rgba(255,255,255,.05);font-size:12.5px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><div><b>' + H(t.subject) + '</b><div style="opacity:.6;font-size:11px;margin-top:2px">' + H(t.tenantName) + ' [' + H(t.tenantId) + '] · ' + H(t.requestedBy || '-') + ' (' + H(t.role || '-') + ') · ' + H(t.requestedAt || '') + (t.ver ? ' · ' + H(t.ver) : '') + (t.page ? ' · ' + H(t.page) : '') + '</div></div><span style="color:' + s[1] + ';font-weight:800;font-size:11px">' + s[0] + '</span></div>' +
        '<div style="margin-top:8px;white-space:pre-wrap;opacity:.9">' + H(t.message) + '</div>' +
        (t.reply ? '<div style="margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(16,185,129,.12)"><div style="font-size:11px;opacity:.7">Balasan Anda' + (t.repliedAt ? ' · ' + H(t.repliedAt) : '') + '</div><div style="white-space:pre-wrap;margin-top:2px">' + H(t.reply) + '</div></div>' : '') +
        '<textarea data-r="' + H(t.docId) + '" rows="2" placeholder="Tulis balasan…" style="width:100%;box-sizing:border-box;margin-top:8px;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f5f5f7;font-size:12.5px;outline:none;resize:vertical"></textarea>' +
        '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap"><button data-a="reply" data-id="' + H(t.docId) + '" style="' + B + 'background:#16a34a">Kirim balasan</button>' + (t.status !== 'SELESAI' ? '<button data-a="done" data-id="' + H(t.docId) + '" style="' + B + 'background:#475569">Tandai selesai</button>' : '<button data-a="reopen" data-id="' + H(t.docId) + '" style="' + B + 'background:#475569">Buka lagi</button>') + '<button data-a="del" data-id="' + H(t.docId) + '" style="' + B + 'background:#9f1239;margin-left:auto">Hapus</button></div></div>';
    });
    ov.innerHTML = h + '</div>';
    if (keepId) { var el = ov.querySelector('textarea[data-r="' + keepId.replace(/"/g, '\\"') + '"]'); if (el) { el.value = keepVal || ''; el.focus(); } }
  }
  function upd(id, data) { var d = DB(); if (!d) return alert('Firestore belum terhubung.'); d.collection('provider_tickets').doc(id).update(data).catch(function (e) { alert('Gagal: ' + (e && e.message || e)); }); }
  function act(a, id) {
    if (a === 'reply') {
      var ta = ov.querySelector('textarea[data-r="' + id.replace(/"/g, '\\"') + '"]'), v = ta ? ta.value.trim() : ''; if (!v) return alert('Tulis balasan dulu.');
      upd(id, { reply: v.slice(0, 1500), repliedAt: new Date().toLocaleString('id-ID'), repliedAtMs: Date.now(), status: 'DIJAWAB' });
    } else if (a === 'done') upd(id, { status: 'SELESAI' });
    else if (a === 'reopen') upd(id, { status: 'BARU' });
    else if (a === 'del') { if (!confirm('Hapus tiket ini?')) return; var d = DB(); if (d) d.collection('provider_tickets').doc(id).delete().catch(function (e) { alert('Gagal: ' + (e && e.message || e)); }); }
  }
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'fm-helpdesk';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:12px';
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-x')) { ov.style.display = 'none'; return; }
      var fl = e.target.closest('[data-f]'); if (fl) { filter = fl.getAttribute('data-f'); return render(); }
      var b = e.target.closest('[data-a]'); if (b) act(b.getAttribute('data-a'), b.getAttribute('data-id'));
    });
    document.body.appendChild(ov);
  }
  window.FM_HELPDESK = { open: function () { ensure(); start(); ov.style.display = 'flex'; render(); }, count: nBaru };
  function init() { start(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 2500); }); else setTimeout(init, 2500);
})();
