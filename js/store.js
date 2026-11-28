/* store.js — COA dan produk per toko, disimpan di server (Firestore) dan dibagi ke semua layar.
   Firestore:
     tenant_settings/<ID TOKO>   { coa: [ {code,name,category} ], updatedAt }
     tp_<ID TOKO>/<kode produk>  { code, name, sellPrice, hpp, stock }
   Dipakai oleh kasir, manager, owner (otomatis lewat STORE) dan oleh Tower Kontrol (createStore per toko).
   Jika Firestore tidak tersedia, data disimpan di browser dengan nama yang dibedakan per toko. */
(function () {
    'use strict';

    function cp(x) { return JSON.parse(JSON.stringify(x)); }
    function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
    function prodId(code) { return String(code).trim().replace(/[\/\s#?\[\]]/g, '_'); }
    function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
    function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

    function createStore(tenant) {
        var id = tenant.id;
        var hasDb = (typeof db !== 'undefined' && db);
        var coaKey = 'fm_custom_coa_' + id, clsKey = 'fm_stock_closings_' + id, prodKey = 'fm_products_' + id;
        function errBanner(msg) {
            try {
                var b = document.getElementById('fm-store-err');
                if (!b && document.body) {
                    b = document.createElement('div'); b.id = 'fm-store-err';
                    b.style.cssText = 'position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:2147483600;max-width:94vw;background:#7f1d1d;color:#fff;border:1px solid #fca5a5;border-radius:14px;padding:8px 14px;font:700 12px system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.5)';
                    document.body.appendChild(b);
                }
                if (b) b.textContent = msg;
            } catch (e) {}
        }
        function noCoaBanner(snap) {
            var keys = ''; try { keys = snap.exists ? Object.keys(snap.data() || {}).join(',') : ''; } catch (e) {}
            errBanner('Dokumen pengaturan toko "' + id + '" di server ' + (snap.exists ? 'ada tapi TIDAK berisi daftar akun (isi: ' + (keys || 'kosong') + ')' : 'TIDAK ADA') + '. Yang tampil adalah akun bawaan. Jangan mengubah akun dulu; hubungi Neil.');
        }

        /* ---- Jalur cadangan: baca daftar akun langsung dari server lewat REST ----
           Jalur ini TIDAK lewat SDK Firestore, jadi tidak terpengaruh salinan offline (IndexedDB),
           urutan muat skrip, atau SDK yang belum siap. Dipakai persis seperti theme.js membaca logo toko.
           Juga mencoba variasi huruf besar/kecil ID toko, karena nama dokumen di server membedakan keduanya. */
        var REST_URL = 'https://firestore.googleapis.com/v1/projects/finance-ai-master-byneilverse/databases/(default)/documents/tenant_settings/';
        var REST_KEY = 'AIzaSyBSxD060e_MyiS62hHsWkqlAhBqDuFYQMI';
        function restParseCoa(txt) {
            try {
                var f = JSON.parse(txt).fields || {};
                var hasCoaField = !!(f.coa && f.coa.arrayValue);
                if (!hasCoaField) return { exists: true, coa: null, keys: Object.keys(f).join(',') };
                var arr = f.coa.arrayValue.values || [];
                var out = [];
                arr.forEach(function (v) {
                    var m = v.mapValue && v.mapValue.fields; if (!m) return;
                    out.push({
                        code: (m.code && (m.code.stringValue != null ? m.code.stringValue : m.code.integerValue)) || '',
                        name: (m.name && m.name.stringValue) || '',
                        category: (m.category && m.category.stringValue) || ''
                    });
                });
                return { exists: true, coa: out, keys: Object.keys(f).join(',') };
            } catch (e) { return { exists: false, coa: null, keys: '' }; }
        }
        function restGet(docId, done) {
            try {
                var x = new XMLHttpRequest();
                x.open('GET', REST_URL + encodeURIComponent(docId) + '?key=' + REST_KEY, true);
                x.onload = function () { done(x.status === 200 ? restParseCoa(x.responseText) : { exists: false, coa: null, keys: '', code: 'HTTP ' + x.status }); };
                x.onerror = function () { done({ exists: false, coa: null, keys: '', code: 'jaringan' }); };
                x.send();
            } catch (e) { done({ exists: false, coa: null, keys: '', code: 'gagal' }); }
        }
        function restLoadCoa(force) {
            var ids = [id], up = String(id).toUpperCase(), lo = String(id).toLowerCase();
            if (ids.indexOf(up) < 0) ids.push(up);
            if (ids.indexOf(lo) < 0) ids.push(lo);
            var i = 0, tried = [];
            (function next() {
                if (i >= ids.length) {
                    errBanner('Daftar akun toko tidak ditemukan di server. Dokumen yang dicoba: ' + tried.join(' | ') + '. Yang tampil adalah akun bawaan. Jangan mengubah akun dulu; kirim pesan ini ke Neil.');
                    return;
                }
                var docId = ids[i++];
                restGet(docId, function (r) {
                    tried.push(docId + ' → ' + (Array.isArray(r.coa) ? r.coa.length + ' akun' : (r.exists ? 'ada, tanpa daftar akun (isi: ' + (r.keys || 'kosong') + ')' : 'tidak ada' + (r.code ? ' (' + r.code + ')' : ''))));
                    if (Array.isArray(r.coa)) {
                        st.docId = docId; st.coa = r.coa; st.coaLoaded = true; st.serverSeen = true;
                        okBanner(); notify();
                        if (docId !== id && hasDb) { try { resubscribe(docId); } catch (e) {} }
                        return;
                    }
                    next();
                });
            })();
        }
        function resubscribe(docId) {
            st.unsubs.push(db.collection('tenant_settings').doc(docId).onSnapshot(function (snap) {
                var d = snap.exists ? snap.data() : null;
                if (d && Array.isArray(d.coa)) { st.coa = d.coa; st.coaLoaded = true; if (!(snap.metadata && snap.metadata.fromCache)) st.serverSeen = true; okBanner(); notify(); }
            }, function () {}));
        }
        function okBanner() { try { var b = document.getElementById('fm-store-err'); if (b) b.remove(); } catch (e) {} }
        var st = { docId: id, coa: null, coaLoaded: false, serverSeen: false, closings: null, products: [], listeners: [], unsubs: [], started: false };

        function notify() { st.listeners.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
        function ord(p) { return (typeof p.order === 'number' && isFinite(p.order)) ? p.order : 1e9; }
        function sortProducts() {
            st.products.sort(function (a, b) {
                var d = ord(a) - ord(b);
                return d !== 0 ? d : String(a.code).localeCompare(String(b.code), undefined, { numeric: true });
            });
        }

        var api = {
            tenantId: id,
            onChange: function (f) { st.listeners.push(f); },
            getCOA: function () {
                if (st.coa !== null) return cp(st.coa);
                return cp((tenant.customCOA && tenant.customCOA.length) ? tenant.customCOA : []);
            },
            getProducts: function () { return cp(st.products); },
            getStockClosings: function () { return cp(st.closings || []); },
            // Simpan hasil closing stok mingguan (riwayat + HPP) di dokumen pengaturan toko
            addStockClosing: function (rec) {
                var list = (st.closings || []).slice(); list.unshift(cp(rec)); st.closings = list; notify();
                if (hasDb) return db.collection('tenant_settings').doc(st.docId).set({ stockClosings: cp(list), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
                lsSet(clsKey, list); return Promise.resolve();
            },
            // Pindah akun COA: taruh 'from' di posisi 'to' (klik dan seret)
            reorderCOA: function (from, to) {
                var list = api.getCOA(), i = list.findIndex(function (c) { return c.code === from; }), j = list.findIndex(function (c) { return c.code === to; });
                if (i < 0 || j < 0 || i === j) return Promise.resolve(false);
                var it = list.splice(i, 1)[0]; list.splice(j, 0, it);
                return api.saveCOA(list).then(function () { return true; });
            },
            start: function () {
                if (st.started) return api;
                st.started = true;
                hasDb = (typeof db !== 'undefined' && db);
                if (hasDb) {
                    st.unsubs.push(db.collection('tenant_settings').doc(st.docId).onSnapshot(function (snap) {
                        var d = snap.exists ? snap.data() : null;
                        st.coa = (d && Array.isArray(d.coa)) ? d.coa : null;
                        st.coaLoaded = true; if (!(snap.metadata && snap.metadata.fromCache)) { st.serverSeen = true; okBanner(); if (st.coa === null) noCoaBanner(snap); }
                        st.closings = (d && Array.isArray(d.stockClosings)) ? d.stockClosings : [];
                        notify();
                    }, function (e) {
                        console.warn('store.js: gagal membaca COA', e);
                        errBanner('Daftar akun (COA) toko gagal dimuat dari server (' + ((e && e.code) || 'error') + '). Yang tampil adalah akun bawaan, bukan akun asli toko. Jangan mengubah akun dulu; hubungi Neil.');
                    }));
                    st.unsubs.push(db.collection('tp_' + id).onSnapshot(function (snap) {
                        var list = [];
                        snap.forEach(function (d) { var x = d.data(); x.code = x.code || d.id; x.sellPrice = num(x.sellPrice); x.hpp = num(x.hpp); x.stock = num(x.stock); x.barcode = x.barcode ? String(x.barcode) : ''; list.push(x); });
                        st.products = list; sortProducts();
                        notify();
                    }, function (e) { console.warn('store.js: gagal membaca produk', e); }));
                    /* jalur cadangan REST: selalu dicoba bila 2,5 detik belum ada daftar akun dari server */
                    setTimeout(function () { if (!st.serverSeen || st.coa === null) restLoadCoa(false); }, 2500);
                    /* jaring pengaman: bila dalam 4 detik belum ada data DARI SERVER (hanya salinan lama di perangkat), ambil langsung dari server */
                    setTimeout(function () {
                        if (st.serverSeen || !st.started) return;
                        db.collection('tenant_settings').doc(st.docId).get({ source: 'server' }).then(function (snap) {
                            st.serverSeen = true; st.coaLoaded = true;
                            var d = snap.exists ? snap.data() : null;
                            st.coa = (d && Array.isArray(d.coa)) ? d.coa : null;
                            st.closings = (d && Array.isArray(d.stockClosings)) ? d.stockClosings : st.closings;
                            okBanner(); if (st.coa === null) noCoaBanner(snap); notify();
                        }).catch(function (e) {
                            errBanner('Server belum bisa dihubungi untuk memuat daftar akun (' + ((e && e.code) || 'error') + '). Yang tampil bisa jadi salinan lama atau akun bawaan. Jangan mengubah akun dulu; periksa internet lalu muat ulang.');
                        });
                    }, 4000);
                } else {
                    restLoadCoa(true);
                    var c = lsGet(coaKey, null);
                    st.coa = Array.isArray(c) ? c : null; st.closings = lsGet(clsKey, []);
                    st.products = lsGet(prodKey, []); sortProducts();
                    notify();
                }
                return api;
            },
            stop: function () { st.unsubs.forEach(function (u) { try { u(); } catch (e) {} }); st.unsubs = []; st.started = false; },

            saveCOA: function (list) {
                /* pengaman: jangan menimpa daftar akun asli di server dengan daftar bawaan bila daftar asli belum berhasil dimuat */
                if (hasDb && !st.serverSeen && (typeof navigator === 'undefined' || navigator.onLine !== false)) { try { alert('Daftar akun belum termuat dari server, jadi penyimpanan dibatalkan supaya akun yang sudah ada tidak tertimpa. Muat ulang halaman; bila berulang, hubungi Neil.'); } catch (e) {} return Promise.reject(new Error('COA belum termuat')); }
                st.coa = cp(list); notify();
                if (hasDb) return db.collection('tenant_settings').doc(st.docId).set({ coa: cp(list), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
                lsSet(coaKey, st.coa); return Promise.resolve();
            },
            saveProduct: function (p) {
                var code = String(p.code).trim();
                var old = st.products.find(function (q) { return q.code === code; });
                var maxOrd = st.products.reduce(function (m, q) { return Math.max(m, (typeof q.order === 'number') ? q.order : -1); }, -1);
                var x = {
                    code: code, name: String(p.name).trim(), sellPrice: num(p.sellPrice), hpp: num(p.hpp),
                    stock: Math.max(0, Math.floor(num(p.stock))), barcode: p.barcode ? String(p.barcode).trim() : '',
                    minStock: (p.minStock === '' || p.minStock == null) ? 5 : Math.max(0, Math.floor(num(p.minStock))),
                    order: (typeof p.order === 'number') ? p.order : ((old && typeof old.order === 'number') ? old.order : maxOrd + 1),
                    group: p.group != null ? String(p.group).trim() : (old && old.group) || '',
                    variant: p.variant != null ? String(p.variant).trim() : (old && old.variant) || '',
                    unit: p.unit != null ? String(p.unit).trim() : (old && old.unit) || '',
                    forSale: p.forSale != null ? !!p.forSale : !!(old && old.forSale),
                    biz: p.biz != null ? String(p.biz).trim() : ((old && old.biz) || ''),
                    units: Array.isArray(p.units) ? p.units.map(function (u) { return { name: String((u && u.name) || '').trim(), per: Math.floor(num(u && u.per)), price: num(u && u.price), barcode: u && u.barcode ? String(u.barcode).trim() : '' }; }).filter(function (u) { return u.name && u.per >= 2; }).slice(0, 4) : ((old && old.units) || []),
                    openStock: p.openStock != null ? Math.max(0, Math.floor(num(p.openStock))) : (old && typeof old.openStock === 'number' ? old.openStock : Math.max(0, Math.floor(num(p.stock)))),
                    endStock: p.endStock !== undefined ? (p.endStock === null || p.endStock === '' ? null : Math.max(0, Math.floor(num(p.endStock)))) : (old && typeof old.endStock === 'number' ? old.endStock : null),
                    inLog: Array.isArray(p.inLog) ? p.inLog.slice(-30) : ((old && Array.isArray(old.inLog)) ? old.inLog : [])
                };
                var i = st.products.findIndex(function (q) { return q.code === x.code; });
                if (i >= 0) st.products[i] = x; else st.products.push(x);
                sortProducts(); notify();
                if (hasDb) return db.collection('tp_' + id).doc(prodId(x.code)).set(x);
                lsSet(prodKey, st.products); return Promise.resolve();
            },
            // Pindah urutan akun COA ke atas/bawah di dalam kategori yang sama (dir = -1 atas, +1 bawah)
            moveCOA: function (code, dir) {
                var list = api.getCOA();
                var i = list.findIndex(function (c) { return c.code === code; });
                if (i < 0) return Promise.resolve(false);
                var j = i + dir;
                while (j >= 0 && j < list.length && list[j].category !== list[i].category) j += dir;
                if (j < 0 || j >= list.length) return Promise.resolve(false);
                var t = list[i]; list[i] = list[j]; list[j] = t;
                return api.saveCOA(list).then(function () { return true; });
            },
            // Pindah urutan produk ke atas/bawah
            moveProduct: function (code, dir) {
                var list = st.products;
                var i = list.findIndex(function (q) { return q.code === code; });
                var j = i + dir;
                if (i < 0 || j < 0 || j >= list.length) return Promise.resolve(false);
                list.forEach(function (q, k) { q.order = k; });          // rapikan urutan 0..n-1
                var t = list[i].order; list[i].order = list[j].order; list[j].order = t;
                sortProducts(); notify();
                if (hasDb) {
                    var batch = db.batch();
                    list.forEach(function (q) { batch.set(db.collection('tp_' + id).doc(prodId(q.code)), q); });
                    return batch.commit().then(function () { return true; });
                }
                lsSet(prodKey, st.products); return Promise.resolve(true);
            },
            findProductByCode: function (v) {
                v = String(v || '').trim();
                if (!v) return null;
                return st.products.find(function (q) { return q.barcode === v || q.code === v; }) || null;
            },
            deleteProduct: function (code) {
                st.products = st.products.filter(function (q) { return q.code !== code; }); notify();
                if (hasDb) return db.collection('tp_' + id).doc(prodId(code)).delete();
                lsSet(prodKey, st.products); return Promise.resolve();
            },
            // Tambah stok masuk (restock); qty bisa desimal-tidak, dibulatkan ke bawah, minimal 1
            incrementStock: function (code, qty) {
                qty = Math.floor(num(qty));
                if (!(qty > 0)) return Promise.resolve(false);
                var p = st.products.find(function (q) { return q.code === code; });
                if (!p) return Promise.resolve(false);
                p.stock = Math.max(0, p.stock + qty); notify();
                if (hasDb) return db.collection('tp_' + id).doc(prodId(code)).update({ stock: firebase.firestore.FieldValue.increment(qty) }).then(function () { return true; }).catch(function (e) { console.warn('store.js: tambah stok gagal', e); return false; });
                lsSet(prodKey, st.products); return Promise.resolve(true);
            },
            // Stok masuk dari Admin (scan): tambah stok dan catat siapa, kapan, berapa (30 catatan terakhir per jenis)
            stockIn: function (code, qty, who, meta) {
                qty = Math.floor(num(qty));
                if (!(qty > 0)) return Promise.resolve(false);
                var p = st.products.find(function (q) { return q.code === code; });
                if (!p) return Promise.resolve(false);
                var e = { at: Date.now(), by: String(who || ''), qty: qty, src: (meta && meta.src) || 'scan', slot: (meta && meta.slot) || '' };
                var log = (Array.isArray(p.inLog) ? p.inLog : []).concat([e]).slice(-30);
                p.stock = Math.max(0, p.stock + qty); p.inLog = log; notify();
                if (hasDb) return db.collection('tp_' + id).doc(prodId(code)).update({ stock: firebase.firestore.FieldValue.increment(qty), inLog: log }).then(function () { return true; }).catch(function (er) { console.warn('store.js: stok masuk gagal', er); return false; });
                lsSet(prodKey, st.products); return Promise.resolve(true);
            },
            decrementStock: function (code, qty) {
                qty = num(qty) || 1;
                var p = st.products.find(function (q) { return q.code === code; });
                if (p) { p.stock = Math.max(0, p.stock - qty); notify(); }
                if (hasDb) return db.collection('tp_' + id).doc(prodId(code)).update({ stock: firebase.firestore.FieldValue.increment(-qty) }).catch(function (e) { console.warn('store.js: stok gagal diperbarui', e); });
                lsSet(prodKey, st.products); return Promise.resolve();
            }
        };
        return api;
    }

    window.createStore = createStore;

    // Otomatis aktif untuk layar toko (kasir, manager, owner): menunggu Firestore siap.
    window.STORE = null;
    function boot() {
        if (window.NO_AUTO_STORE) return;
        var tn = (typeof getActiveTenant === 'function') ? getActiveTenant() : null;
        if (!tn || tn.notFound) return;
        window.STORE = createStore(tn);
        var tries = 0;
        var t = setInterval(function () {
            tries++;
            if ((typeof db !== 'undefined' && db) || tries > 60) {
                clearInterval(t); window.STORE.start();
                /* bila terpaksa mulai tanpa server (Firestore terlambat siap), pindah ke mode server begitu siap */
                if (!(typeof db !== 'undefined' && db)) {
                    var t2 = setInterval(function () {
                        if (typeof db !== 'undefined' && db) { clearInterval(t2); try { window.STORE.stop(); window.STORE.start(); } catch (e) {} }
                    }, 1000);
                    setTimeout(function () { clearInterval(t2); }, 120000);
                }
            }
        }, 100);
    }
    // dibuat segera (sinkron) agar skrip halaman bisa langsung memakai STORE.getCOA()
    boot();
})();
