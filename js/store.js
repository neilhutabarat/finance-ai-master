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
        var coaKey = 'fm_custom_coa_' + id, prodKey = 'fm_products_' + id;
        var st = { coa: null, products: [], listeners: [], unsubs: [], started: false };

        function notify() { st.listeners.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
        function sortProducts() { st.products.sort(function (a, b) { return String(a.code).localeCompare(String(b.code), undefined, { numeric: true }); }); }

        var api = {
            tenantId: id,
            onChange: function (f) { st.listeners.push(f); },
            getCOA: function () {
                if (st.coa !== null) return cp(st.coa);
                return cp((tenant.customCOA && tenant.customCOA.length) ? tenant.customCOA : []);
            },
            getProducts: function () { return cp(st.products); },
            start: function () {
                if (st.started) return api;
                st.started = true;
                hasDb = (typeof db !== 'undefined' && db);
                if (hasDb) {
                    st.unsubs.push(db.collection('tenant_settings').doc(id).onSnapshot(function (snap) {
                        var d = snap.exists ? snap.data() : null;
                        st.coa = (d && Array.isArray(d.coa)) ? d.coa : null;
                        notify();
                    }, function (e) { console.warn('store.js: gagal membaca COA', e); }));
                    st.unsubs.push(db.collection('tp_' + id).onSnapshot(function (snap) {
                        var list = [];
                        snap.forEach(function (d) { var x = d.data(); x.code = x.code || d.id; x.sellPrice = num(x.sellPrice); x.hpp = num(x.hpp); x.stock = num(x.stock); list.push(x); });
                        st.products = list; sortProducts();
                        notify();
                    }, function (e) { console.warn('store.js: gagal membaca produk', e); }));
                } else {
                    var c = lsGet(coaKey, null);
                    st.coa = Array.isArray(c) ? c : null;
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
                var x = { code: String(p.code).trim(), name: String(p.name).trim(), sellPrice: num(p.sellPrice), hpp: num(p.hpp), stock: Math.max(0, Math.floor(num(p.stock))) };
                var i = st.products.findIndex(function (q) { return q.code === x.code; });
                if (i >= 0) st.products[i] = x; else st.products.push(x);
                sortProducts(); notify();
                if (hasDb) return db.collection('tp_' + id).doc(prodId(x.code)).set(x);
                lsSet(prodKey, st.products); return Promise.resolve();
            },
            deleteProduct: function (code) {
                st.products = st.products.filter(function (q) { return q.code !== code; }); notify();
                if (hasDb) return db.collection('tp_' + id).doc(prodId(code)).delete();
                lsSet(prodKey, st.products); return Promise.resolve();
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
