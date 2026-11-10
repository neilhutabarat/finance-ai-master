/* ctrl.js — penjaga kontrol toko dari Provider (Tower Kontrol).
   Dipakai di kasir.html, manager.html, dashboard.html.
   Membaca dokumen Firestore  tenant_ctrl/<ID TOKO>  secara live:
     { suspended: true/false, suspendReason: "...", allowedCashiers: n }
   Jika suspended = true, seluruh layar ditutup sampai provider mengaktifkan kembali.
   Jika Firestore tidak bisa dibaca, layar TIDAK dikunci (agar toko tidak mati karena gangguan jaringan). */
(function () {
    'use strict';
    var overlayId = 'ctrl-suspend-overlay';

    function esc(v) {
        return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function showOverlay(reason) {
        var el = document.getElementById(overlayId);
        if (!el) {
            el = document.createElement('div');
            el.id = overlayId;
            el.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(2,6,23,.97);display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;';
            document.body.appendChild(el);
        }
        el.innerHTML =
            '<div style="max-width:420px;text-align:center;color:#e2e8f0">' +
            '<div style="font-size:44px">🔒</div>' +
            '<h2 style="font-size:20px;font-weight:900;margin:12px 0 8px">Layanan Sementara Dinonaktifkan</h2>' +
            '<p style="font-size:13px;line-height:1.6;color:#94a3b8">Akses toko ini dihentikan sementara oleh penyedia aplikasi.' +
            (reason ? '<br><br><b style="color:#fbbf24">Alasan:</b> ' + esc(reason) : '') +
            '<br><br>Silakan hubungi penyedia aplikasi untuk mengaktifkan kembali.</p>' +
            '<button id="ctrl-suspend-exit" style="margin-top:18px;padding:10px 22px;border-radius:12px;background:#0891b2;color:#fff;font-weight:800;font-size:13px;border:0;cursor:pointer">Keluar</button>' +
            '</div>';
        var b = document.getElementById('ctrl-suspend-exit');
        if (b) b.onclick = function () {
            if (typeof window.logout === 'function') { try { window.logout(); return; } catch (e) {} }
            window.location.replace('index.html');
        };
    }

    function hideOverlay() {
        var el = document.getElementById(overlayId);
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }

    function start() {
        var tn0 = (typeof getActiveTenant === 'function') ? getActiveTenant() : null;
        if (tn0 && tn0.notFound) {
            var el = document.createElement('div');
            el.id = overlayId;
            el.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(2,6,23,.98);display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;';
            el.innerHTML = '<div style="max-width:420px;text-align:center;color:#e2e8f0"><div style="font-size:44px">🔎</div>' +
                '<h2 style="font-size:20px;font-weight:900;margin:12px 0 8px">Toko Tidak Ditemukan</h2>' +
                '<p style="font-size:13px;line-height:1.6;color:#94a3b8">Link toko tidak dikenal atau perangkat sedang offline. Periksa link dari penyedia aplikasi dan coba lagi.</p></div>';
            document.body.appendChild(el);
            return;
        }
        var tries = 0;
        var timer = setInterval(function () {
            tries++;
            if (typeof db !== 'undefined' && db) {
                clearInterval(timer);
                attach();
            } else if (tries > 100) {
                clearInterval(timer); // Firestore tidak tersedia: jangan kunci apa pun
            }
        }, 100);
    }

    // ===== PENGUMUMAN DARI PROVIDER (lonceng di pojok kanan bawah) =====
    var notices = [];
    var noticeTenantId = null;

    function readKey() { return 'fm_notice_read_' + noticeTenantId; }
    function getRead() { try { return JSON.parse(localStorage.getItem(readKey()) || '[]'); } catch (e) { return []; } }
    function markRead(ids) {
        try { var r = getRead(); ids.forEach(function (i) { if (r.indexOf(i) < 0) r.push(i); }); localStorage.setItem(readKey(), JSON.stringify(r.slice(-200))); } catch (e) {}
    }
    function visibleNotices() {
        var now = Date.now();
        return notices.filter(function (n) { return !n.expiresAt || n.expiresAt > now; })
            .sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
    }
    function unreadList() { var r = getRead(); return visibleNotices().filter(function (n) { return r.indexOf(n.id) < 0; }); }

    function ensureBell() {
        var b = document.getElementById('ctrl-notice-bell');
        if (!b) {
            b = document.createElement('button');
            b.id = 'ctrl-notice-bell';
            b.type = 'button';
            b.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147482000;width:46px;height:46px;border-radius:23px;border:0;cursor:pointer;background:#0891b2;color:#fff;font-size:20px;box-shadow:0 6px 20px rgba(0,0,0,.35);';
            b.onclick = togglePanel;
            document.body.appendChild(b);
        }
        return b;
    }

    function renderBell() {
        var vis = visibleNotices();
        var b = document.getElementById('ctrl-notice-bell');
        if (!vis.length) { if (b && b.parentNode) b.parentNode.removeChild(b); closePanel(); return; }
        b = ensureBell();
        var un = unreadList();
        var urgent = un.some(function (n) { return n.level === 'penting'; });
        b.style.background = urgent ? '#e11d48' : '#0891b2';
        b.innerHTML = '🔔' + (un.length ? '<span style="position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#f59e0b;color:#111;font-size:11px;font-weight:900;line-height:18px;text-align:center">' + un.length + '</span>' : '');
        var panel = document.getElementById('ctrl-notice-panel');
        if (panel) renderPanel();
    }

    function closePanel() {
        var p = document.getElementById('ctrl-notice-panel');
        if (p && p.parentNode) p.parentNode.removeChild(p);
    }

    function togglePanel() {
        if (document.getElementById('ctrl-notice-panel')) { closePanel(); renderBell(); return; }
        openPanel();
    }

    function openPanel() {
        var un = unreadList().map(function (n) { return n.id; });
        renderPanel(un);
        markRead(un);
        renderBell();
    }

    function renderPanel(newIds) {
        var p = document.getElementById('ctrl-notice-panel');
        if (!p) {
            p = document.createElement('div');
            p.id = 'ctrl-notice-panel';
            p.style.cssText = 'position:fixed;right:16px;bottom:72px;z-index:2147482001;width:min(360px,calc(100vw - 32px));max-height:60vh;overflow:auto;background:#0f172a;color:#e2e8f0;border:1px solid rgba(255,255,255,.15);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.5);font-family:system-ui,sans-serif;';
            document.body.appendChild(p);
        }
        var fresh = newIds || p._fresh || [];
        p._fresh = fresh;
        var html = '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.1);font-weight:900;font-size:13px">Pengumuman<button id="ctrl-notice-close" style="background:none;border:0;color:#94a3b8;font-size:16px;cursor:pointer">✕</button></div>';
        visibleNotices().forEach(function (n) {
            var isNew = fresh.indexOf(n.id) >= 0;
            var urgent = n.level === 'penting';
            html += '<div style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.06);' + (isNew ? 'background:rgba(8,145,178,.12);' : '') + '">' +
                '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><b style="font-size:13px;color:#fff">' + esc(n.title) + '</b>' +
                (urgent ? '<span style="font-size:9px;font-weight:900;background:#e11d48;color:#fff;border-radius:6px;padding:1px 6px">PENTING</span>' : '') +
                (isNew ? '<span style="font-size:9px;font-weight:900;background:#f59e0b;color:#111;border-radius:6px;padding:1px 6px">BARU</span>' : '') + '</div>' +
                '<p style="font-size:12px;line-height:1.55;color:#cbd5e1;margin:6px 0 4px;white-space:pre-wrap">' + esc(n.message) + '</p>' +
                '<span style="font-size:10px;color:#64748b">' + esc(n.date || '') + '</span></div>';
        });
        p.innerHTML = html;
        var c = document.getElementById('ctrl-notice-close');
        if (c) c.onclick = function () { closePanel(); renderBell(); };
    }

    function attachNotices(tenant) {
        noticeTenantId = tenant.id;
        db.collection('provider_notices').where('targetTenant', 'in', ['ALL', tenant.id]).onSnapshot(function (snap) {
            var list = [];
            snap.forEach(function (d) { var x = d.data(); x.id = d.id; list.push(x); });
            notices = list;
            renderBell();
            // pesan PENTING yang belum dibaca langsung dibuka
            if (!document.getElementById('ctrl-notice-panel') && unreadList().some(function (n) { return n.level === 'penting'; })) openPanel();
        }, function (e) { console.warn('ctrl.js: gagal membaca pengumuman.', e); });
    }

    function attach() {
        var tenant = (typeof getActiveTenant === 'function') ? getActiveTenant() : null;
        if (!tenant || !tenant.id) return;
        attachNotices(tenant);
        if (tenant.isMaster) return; // master tidak pernah dikunci
        db.collection('tenant_ctrl').doc(tenant.id).onSnapshot(function (snap) {
            var d = snap.exists ? snap.data() : null;
            window.TENANT_CTRL = d || {};
            if (d && d.suspended === true) showOverlay(d.suspendReason || '');
            else hideOverlay();
        }, function (err) {
            console.warn('ctrl.js: gagal membaca tenant_ctrl, layar tidak dikunci.', err);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
