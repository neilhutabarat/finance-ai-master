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

    function attach() {
        var tenant = (typeof getActiveTenant === 'function') ? getActiveTenant() : null;
        if (!tenant || !tenant.id || tenant.isMaster) return; // master tidak pernah dikunci
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
