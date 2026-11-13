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

    // ===== MODE DEMO: tenant_ctrl.demoUntil (ms) diatur Tower. Label sisa hari; terkunci saat habis (data tidak disentuh) =====
    function demoMs(d) { var v = d ? Number(d.demoUntil) : 0; return v > 0 ? v : 0; }
    function showDemoEnd() {
        var el = document.getElementById(overlayId);
        if (!el) {
            el = document.createElement('div');
            el.id = overlayId;
            el.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(2,6,23,.97);display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;';
            document.body.appendChild(el);
        }
        el.innerHTML =
            '<div style="max-width:420px;text-align:center;color:#e2e8f0">' +
            '<div style="font-size:44px">⏳</div>' +
            '<h2 style="font-size:20px;font-weight:900;margin:12px 0 8px">Masa Demo Selesai</h2>' +
            '<p style="font-size:13px;line-height:1.6;color:#94a3b8">Terima kasih sudah mencoba Oneilverse. Data demo Anda tidak dihapus.' +
            '<br><br>Hubungi penyedia aplikasi untuk melanjutkan sebagai toko sungguhan.</p>' +
            '<button id="ctrl-demo-exit" style="margin-top:18px;padding:10px 22px;border-radius:12px;background:#0891b2;color:#fff;font-weight:800;font-size:13px;border:0;cursor:pointer">Keluar</button>' +
            '</div>';
        var b = document.getElementById('ctrl-demo-exit');
        if (b) b.onclick = function () {
            if (typeof window.logout === 'function') { try { window.logout(); return; } catch (e) {} }
            window.location.replace('index.html');
        };
    }
    function demoPill(dm) {
        var el = document.getElementById('fm-demo-pill');
        if (!dm) { if (el && el.parentNode) el.parentNode.removeChild(el); return; }
        var left = dm - Date.now(), over = left <= 0, days = Math.ceil(left / 86400000);
        var txt = over ? 'DEMO · masa demo selesai' : (left < 86400000 ? 'DEMO · berakhir hari ini' : 'DEMO · sisa ' + days + ' hari');
        if (!el) {
            el = document.createElement('div'); el.id = 'fm-demo-pill';
            el.style.cssText = 'position:fixed;top:6px;left:50%;transform:translateX(-50%);z-index:2147482000;padding:3px 12px;border-radius:999px;font:800 11px system-ui,sans-serif;letter-spacing:.3px;pointer-events:none;box-shadow:0 4px 14px rgba(0,0,0,.35)';
            document.body.appendChild(el);
        }
        el.textContent = txt;
        el.style.background = (over || left < 86400000) ? '#be123c' : '#f59e0b';
        el.style.color = '#fff';
    }
    var lastCtrl = null, demoTick = null;
    function demoEnded(d) { var dm = demoMs(d); return !!dm && Date.now() > dm; }
    function demoTickStart() {
        if (demoTick) return;
        demoTick = setInterval(function () {
            if (!lastCtrl || !demoMs(lastCtrl)) return;
            demoPill(demoMs(lastCtrl));
            if (demoEnded(lastCtrl) && !(lastCtrl.suspended === true)) showDemoEnd();
        }, 60000);
    }

    function hideOverlay() {
        var el = document.getElementById(overlayId);
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }

    // ===== LOGO ONEILVERSE + TULISAN DI TENGAH HEADER, SEJAJAR BARIS NAMA TOKO (tanpa foto profil/inisial toko) =====
    function centerBrand(t) {
        try {
            var hd = document.querySelector('header.oneui-hero'); if (!hd || !window.FM_LOGO) return;
            var row = hd.firstElementChild;
            var box = document.getElementById('fm-center-brand');
            if (!box) {
                box = document.createElement('div');
                box.id = 'fm-center-brand';
                var trig = document.getElementById('login-logo-trigger'), old = trig ? trig.parentElement : null;
                box.innerHTML = '<span id="fm-cb-mark" style="display:inline-flex;width:38px;height:38px;flex:none"></span><span id="fm-cb-text" style="font-family:\'Inter Display\',Inter,system-ui,sans-serif;font-weight:700;font-size:24px;letter-spacing:-.012em;line-height:1;white-space:nowrap"></span>';
                box.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:10px;color:inherit;user-select:none;z-index:2';
                if (trig) {
                    var mk = box.querySelector('#fm-cb-mark'); mk.appendChild(trig);
                    trig.className = 'relative flex items-center justify-center select-none cursor-pointer shrink-0';
                    ['width', 'height'].forEach(function (p) { trig.style.setProperty(p, '38px', 'important'); });
                    if (old && old !== mk && !old.children.length) old.style.display = 'none';
                } else box.querySelector('#fm-cb-mark').innerHTML = FM_LOGO.mark('100%');
                var place = function () {
                    var kids = row ? Array.prototype.filter.call(row.children, function (k) { return k !== box; }) : [];
                    if (row && kids.length >= 2 && window.matchMedia('(min-width:1100px)').matches) {
                        // 3 kolom: nama toko | logo di tengah | widget (jam, cuaca, kurs). Tidak saling menimpa walau widget banyak.
                        row.style.display = 'grid'; row.style.gridTemplateColumns = 'minmax(0,1fr) auto minmax(0,1fr)'; row.style.alignItems = 'center'; row.style.columnGap = '20px';
                        if (box.parentNode !== row || row.children[1] !== box) row.insertBefore(box, kids[1]);
                        kids[0].style.justifySelf = 'start'; kids[kids.length - 1].style.justifySelf = 'end'; kids[kids.length - 1].style.justifyContent = 'flex-end';
                        box.style.position = 'static'; box.style.transform = 'none'; box.style.margin = '0';
                    } else {
                        if (row) { row.style.display = ''; row.style.gridTemplateColumns = ''; row.style.columnGap = ''; }
                        kids.forEach(function (k) { k.style.justifySelf = ''; });
                        if (box.parentNode !== hd || hd.firstElementChild !== box) hd.insertBefore(box, hd.firstChild);
                        box.style.position = 'static'; box.style.transform = 'none'; box.style.margin = '0 0 14px';
                    }
                };
                place(); window.addEventListener('resize', place);
            }
            var tx = document.getElementById('fm-cb-text');
            if (tx) tx.innerHTML = 'oneilverse' + (t === 'plus' ? FM_LOGO.plus() : '');
        } catch (e) {}
    }

    // ===== NAMA, ID, LOGO, DAN PAKET TOKO DI HEADER (sebelumnya tertulis mati "Oneilverse") =====
    function applyHeaderBranding(tn) {
        if (!tn || tn.notFound) return;
        try {
            var slEl = document.getElementById('topbar-store-slogan');
            if (slEl) {
                var L = tn.locations || {}, alamat = '';
                ['kasir', 'manager', 'owner'].forEach(function (r) { if (!alamat && L[r] && L[r].name && L[r].name !== '-') alamat = L[r].name; });
                if (alamat) slEl.textContent = alamat; else if (tn.slogan) slEl.textContent = tn.slogan;
            }
            if (tn.isMaster) return;
            var nameEl = document.getElementById('topbar-store-name');
            if (nameEl) nameEl.textContent = tn.nama;
            var idEl = document.getElementById('tenant-badge-indicator');
            if (idEl) idEl.textContent = tn.id;
            var rc = document.getElementById('receipt-store-name');
            if (rc) rc.textContent = String(tn.nama || '').toUpperCase();
            if (document.title) document.title = document.title.replace(/^Oneilverse/, tn.nama);

            var tierEl = document.getElementById('tier-badge-indicator');
            var t = (tn.tier === 'pro') ? 'plus' : (tn.tier || 'basic');
            if (tierEl) tierEl.style.display = 'none'; // Basic tanpa lencana; Plus ditandai "+" di ujung nama

            centerBrand(t);
        } catch (e) { console.warn('ctrl.js: gagal menerapkan nama toko', e); }
    }

    function start() {
        try { applyHeaderBranding((typeof getActiveTenant === 'function') ? getActiveTenant() : null); } catch (e) {}
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

    // ===== KEHADIRAN (PRESENCE) & KUOTA KASIR =====
    // Setiap layar kasir/manager/owner yang terbuka mengirim "tanda hidup" tiap 60 detik ke
    // tenant_presence/<TOKO>__<peran>__<sesi>. Tower membaca ini untuk menampilkan siapa yang online.
    // Kasir, manager, dan owner masing-masing dibatasi kuota (allowedCashiers/allowedManagers/allowedOwners, default 1)
    // dari tenant_ctrl; toko master tidak dibatasi.
    var BEAT_MS = 60000, ACTIVE_MS = 150000;
    var SESSION_ID = (function () {
        var k = 'fm_presence_sid';
        try { var v = sessionStorage.getItem(k); if (!v) { v = Math.random().toString(36).slice(2, 10); sessionStorage.setItem(k, v); } return v; }
        catch (e) { return Math.random().toString(36).slice(2, 10); }
    })();
    var ROLE = (function () {
        var p = (window.location.pathname || '').toLowerCase();
        if (p.indexOf('kasir') >= 0) return 'kasir';
        if (p.indexOf('manager') >= 0) return 'manager';
        if (p.indexOf('dashboard') >= 0) return 'owner';
        return 'lain';
    })();
    var startedAtMs = Date.now();
    // AFK: layar terbuka tetapi tidak disentuh lebih dari 5 menit (dipakai Tower untuk lampu kuning)
    var lastTouch = Date.now(), IDLE_MS = 5 * 60 * 1000;
    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll'].forEach(function (ev) { document.addEventListener(ev, function () { lastTouch = Date.now(); }, { passive: true, capture: true }); });
    var presenceState = null; // null | 'started' | 'blocked'
    var quotaOverlayId = 'ctrl-quota-overlay';
    var QUOTA_FIELD = { kasir: 'allowedCashiers', manager: 'allowedManagers', owner: 'allowedOwners' };
    var ROLE_NAME = { kasir: 'kasir', manager: 'manager', owner: 'owner' };

    function whoAmI() {
        try { var u = JSON.parse(localStorage.getItem('currentUser') || 'null'); return (u && (u.title || u.name)) || ROLE; } catch (e) { return ROLE; }
    }

    function presenceRef(tenant) { return db.collection('tenant_presence').doc(tenant.id + '__' + ROLE + '__' + SESSION_ID); }

    function beat(tenant) {
        var doc = {
            tenantId: tenant.id, role: ROLE, sessionId: SESSION_ID, who: String(whoAmI()).slice(0, 60),
            startedAt: startedAtMs, idle: (Date.now() - lastTouch > IDLE_MS) || !!document.hidden, lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        };
        var g = window.FM_GEO;
        if (g && isFinite(g.lat) && isFinite(g.lon)) doc.geo = { src: g.src === 'GPS' ? 'GPS' : 'Jaringan', lat: g.lat, lon: g.lon, name: String(g.name || '').slice(0, 140), acc: g.acc || 0, at: g.t || Date.now() };
        presenceRef(tenant).set(doc, { merge: true }).catch(function () {});
    }

    function startPresence(tenant) {
        if (presenceState === 'started') return;
        presenceState = 'started';
        hideQuotaOverlay();
        beat(tenant);
        setInterval(function () { beat(tenant); }, BEAT_MS);
        window.addEventListener('fm:geo', function () { beat(tenant); });
        window.addEventListener('pagehide', function () { try { presenceRef(tenant).delete(); } catch (e) {} });
    }

    function hideQuotaOverlay() {
        var el = document.getElementById(quotaOverlayId);
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }

    function showQuotaOverlay(used, allowed) {
        var rn = ROLE_NAME[ROLE] || 'terminal';
        var el = document.getElementById(quotaOverlayId);
        if (!el) {
            el = document.createElement('div');
            el.id = quotaOverlayId;
            el.style.cssText = 'position:fixed;inset:0;z-index:2147482900;background:rgba(2,6,23,.97);display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;';
            document.body.appendChild(el);
        }
        el.innerHTML = '<div style="max-width:420px;text-align:center;color:#e2e8f0"><div style="font-size:44px">🖥️</div>' +
            '<h2 style="font-size:20px;font-weight:900;margin:12px 0 8px">Kuota Terminal ' + rn.charAt(0).toUpperCase() + rn.slice(1) + ' Penuh</h2>' +
            '<p style="font-size:13px;line-height:1.6;color:#94a3b8">Toko ini memiliki lisensi <b style="color:#fff">' + allowed + ' terminal ' + rn + '</b> dan saat ini <b style="color:#fff">' + used + '</b> sedang aktif di perangkat lain.' +
            '<br><br>Tutup layar ' + rn + ' di perangkat lain, atau ajukan penambahan terminal lewat menu Manager/Owner. Layar ini akan terbuka otomatis setelah kuota tersedia.</p>' +
            '<button id="ctrl-quota-exit" style="margin-top:18px;padding:10px 22px;border-radius:12px;background:#0891b2;color:#fff;font-weight:800;font-size:13px;border:0;cursor:pointer">Keluar</button></div>';
        var b = document.getElementById('ctrl-quota-exit');
        if (b) b.onclick = function () {
            if (typeof window.logout === 'function') { try { window.logout(); return; } catch (e) {} }
            window.location.replace('index.html');
        };
    }

    function checkQuota(tenant, allowed, onOk, onFull) {
        db.collection('tenant_presence').where('tenantId', '==', tenant.id).where('role', '==', ROLE).get().then(function (snap) {
            var now = Date.now(), n = 0;
            snap.forEach(function (d) {
                if (d.id.slice(-(SESSION_ID.length + 2)) === '__' + SESSION_ID) return; // sesi ini sendiri
                var ls = d.data().lastSeen;
                var ms = (ls && typeof ls.toMillis === 'function') ? ls.toMillis() : 0;
                if (now - ms < ACTIVE_MS) n++;
            });
            if (n >= allowed) onFull(n); else onOk();
        }).catch(function () { onOk(); }); // gagal membaca: jangan menghalangi toko
    }

    function proceedPresence(tenant, ctrl) {
        if (presenceState === 'started') return;
        if (ctrl && ctrl.suspended === true) return;
        var field = QUOTA_FIELD[ROLE];
        if (field) {
            var allowed = (ctrl && typeof ctrl[field] === 'number' && ctrl[field] > 0) ? ctrl[field] : 1;
            checkQuota(tenant, allowed, function () { startPresence(tenant); }, function (n) {
                presenceState = 'blocked';
                showQuotaOverlay(n, allowed);
            });
        } else {
            startPresence(tenant);
        }
    }

    // Jika toko dihapus dari Tower saat sedang dipakai: buang cache, kunci layar, dan keluarkan sesi
    function watchDeletion(tenant) {
        var key = String(tenant.id).toLowerCase();
        db.collection('tenants_registry').doc(key).onSnapshot(function (snap) {
            if (snap.exists && !snap.metadata.fromCache) {
                // paket/nama dari Tower berubah: perbarui header tanpa menunggu muat ulang
                try {
                    var cfg0 = JSON.parse((snap.data() || {}).json || 'null');
                    if (cfg0 && typeof registryMerge === 'function') {
                        var k0 = registryMerge(cfg0);
                        if (k0 && typeof registryWriteCache === 'function') registryWriteCache(k0, cfg0);
                        applyHeaderBranding(getActiveTenant());
                    }
                } catch (e0) {}
                return;
            }
            if (snap.exists || snap.metadata.fromCache) return;
            if (typeof registryDropCache === 'function') registryDropCache(key);
            try { sessionStorage.clear(); } catch (e) {}
            var old = document.getElementById(overlayId); if (old) old.remove();
            var el = document.createElement('div');
            el.id = overlayId;
            el.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(2,6,23,.98);display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;';
            el.innerHTML = '<div style="max-width:420px;text-align:center;color:#e2e8f0"><div style="font-size:44px">🗑️</div>' +
                '<h2 style="font-size:20px;font-weight:900;margin:12px 0 8px">Toko Sudah Dihapus</h2>' +
                '<p style="font-size:13px;line-height:1.6;color:#94a3b8">Akun toko ini sudah dinonaktifkan oleh penyedia aplikasi. Riwayat toko dapat diminta lewat halaman berikut.</p>' +
                '<a href="index.html?toko=' + encodeURIComponent(tenant.id) + '" style="display:inline-block;margin-top:14px;padding:11px 18px;border-radius:14px;background:#2563eb;color:#fff;font-weight:800;font-size:13px;text-decoration:none">Buka Halaman Riwayat</a></div>';
            document.body.appendChild(el);
        }, function () {});
    }

    function attach() {
        var tenant = (typeof getActiveTenant === 'function') ? getActiveTenant() : null;
        if (!tenant || !tenant.id) return;
        attachNotices(tenant);
        if (tenant.fromRegistry) watchDeletion(tenant);
        db.collection('tenant_ctrl').doc(tenant.id).onSnapshot(function (snap) {
            if (!snap.metadata.fromCache && window.FM_SHIELD) FM_SHIELD.touch(); // kontak server nyata: segarkan Kunci Total
            var d = snap.exists ? snap.data() : null;
            window.TENANT_CTRL = d || {};
            try { localStorage.setItem('fm_rentals_' + tenant.id, JSON.stringify((d && d.rentals) || {})); } catch (eR) {}
            /* kejelasan kaca per toko (1-5), diatur Tower; kosong = ikut pengaturan umum */
            try { var rv = d && (d.rain === 'on' || d.rain === 'off') ? d.rain : null; var rs = JSON.stringify({ id: tenant.id, v: rv }); if (localStorage.getItem('fm_rain_s') !== rs) { localStorage.setItem('fm_rain_s', rs); window.dispatchEvent(new CustomEvent('fm:glass')); } } catch (eRn) {}
            try { var gv = d ? parseInt(d.glass, 10) : 0; var gs = JSON.stringify({ id: tenant.id, v: (gv >= 1 && gv <= 5) ? gv : null }); if (localStorage.getItem('fm_glass_s') !== gs) { localStorage.setItem('fm_glass_s', gs); window.dispatchEvent(new CustomEvent('fm:glass')); } } catch (eG) {}
            try { window.dispatchEvent(new CustomEvent('fm:ctrl')); } catch (e) {}
            var billFreeze = !!(d && window.FM_BILL && FM_BILL.freezeNow(d.billing, Date.now()));
            lastCtrl = d; demoPill(demoMs(d)); demoTickStart();
            if (d && d.suspended === true) showOverlay(d.suspendReason || '');
            else if (billFreeze) showOverlay('Pembayaran layanan belum diterima dan sudah melewati masa tenggang.');
            else if (demoEnded(d)) showDemoEnd();
            else hideOverlay();
            proceedPresence(tenant, d); // saat diblokir kuota, dicek ulang tiap data kontrol berubah (mis. kuota ditambah)
        }, function (err) {
            console.warn('ctrl.js: gagal membaca tenant_ctrl, layar tidak dikunci.', err);
            proceedPresence(tenant, null);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
