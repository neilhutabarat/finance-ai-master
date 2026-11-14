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
        var st = { coa: null, closings: null, products: [], listeners: [], unsubs: [], started: false };

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
                if (hasDb) return db.collection('tenant_settings').doc(id).set({ stockClosings: cp(list), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
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
                    st.unsubs.push(db.collection('tenant_settings').doc(id).onSnapshot(function (snap) {
                        var d = snap.exists ? snap.data() : null;
                        st.coa = (d && Array.isArray(d.coa)) ? d.coa : null;
                        st.closings = (d && Array.isArray(d.stockClosings)) ? d.stockClosings : [];
                        notify();
                    }, function (e) { console.warn('store.js: gagal membaca COA', e); }));
                    st.unsubs.push(db.collection('tp_' + id).onSnapshot(function (snap) {
                        var list = [];
                        snap.forEach(function (d) { var x = d.data(); x.code = x.code || d.id; x.sellPrice = num(x.sellPrice); x.hpp = num(x.hpp); x.stock = num(x.stock); x.barcode = x.barcode ? String(x.barcode) : ''; list.push(x); });
                        st.products = list; sortProducts();
                        notify();
                    }, function (e) { console.warn('store.js: gagal membaca produk', e); }));
                } else {
                    var c = lsGet(coaKey, null);
                    st.coa = Array.isArray(c) ? c : null; st.closings = lsGet(clsKey, []);
                    st.products = lsGet(prodKey, []); sortProducts();
                    notify();
                }
                return api;
            },
            stop: function () { st.unsubs.forEach(function (u) { try { u(); } catch (e) {} }); st.unsubs = []; st.started = false; },

            saveCOA: function (list) {
                st.coa = cp(list); notify();
                if (hasDb) return db.collection('tenant_settings').doc(id).set({ coa: cp(list), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
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
            if ((typeof db !== 'undefined' && db) || tries > 60) { clearInterval(t); window.STORE.start(); }
        }, 100);
    }
    // dibuat segera (sinkron) agar skrip halaman bisa langsung memakai STORE.getCOA()
    boot();
})();
