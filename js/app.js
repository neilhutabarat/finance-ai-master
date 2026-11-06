// Inisialisasi Data Keuangan
let financeData = {
    income: 0,
    cogs: 0,
    expense: 0
};

let txList = [];
let isOwner = false;
let db = null;

// Format Rupiah
function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(num || 0);
}

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initAppConfig();
    initFirebase();
    updateNumbers();
});

function initAppConfig() {
    document.getElementById('txt-app-name').innerText = APP_CONFIG.appName;
    document.getElementById('txt-business-name').innerText = APP_CONFIG.businessName;
    document.getElementById('txt-report-biz').innerText = APP_CONFIG.businessName;
    document.getElementById('txt-report-period').innerText = "Periode: " + APP_CONFIG.periodName;
}

// Inisialisasi Firebase Cloud Firestore
function initFirebase() {
    if (APP_CONFIG.firebase && APP_CONFIG.firebase.apiKey) {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(APP_CONFIG.firebase);
            }
            db = firebase.firestore();
            
            const badge = document.getElementById('cloud-status-badge');
            if (badge) {
                badge.innerText = "Firestore Online";
                badge.className = "text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center";
            }
            
            listenCloudUpdates();
        } catch (e) {
            console.error("Firebase init error:", e);
            const badge = document.getElementById('cloud-status-badge');
            if (badge) {
                badge.innerText = "Cloud Offline";
                badge.className = "text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center";
            }
        }
    }
}

// Sinkronisasi Realtime Firestore
function listenCloudUpdates() {
    if (!db) return;
    db.collection("transactions").orderBy("timestamp", "desc")
        .onSnapshot((snapshot) => {
            financeData = { income: 0, cogs: 0, expense: 0 };
            txList = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                data.id = doc.id;
                txList.push(data);
                const amount = Number(data.amount) || 0;
                if (data.type === 'income') financeData.income += amount;
                if (data.type === 'cogs') financeData.cogs += amount;
                if (data.type === 'expense') financeData.expense += amount;
            });
            updateNumbers();
            renderTransactions();
        }, (error) => {
            console.error("Firestore error:", error);
        });
}

function updateNumbers() {
    const grossProfit = financeData.income - financeData.cogs;
    const netProfit = grossProfit - financeData.expense;

    document.getElementById('val-net-profit').innerText = formatRupiah(netProfit);
    document.getElementById('val-income').innerText = formatRupiah(financeData.income);
    document.getElementById('val-cogs').innerText = formatRupiah(financeData.cogs);
    document.getElementById('val-expense').innerText = formatRupiah(financeData.expense);

    document.getElementById('rep-income').innerText = formatRupiah(financeData.income);
    document.getElementById('rep-cogs').innerText = formatRupiah(financeData.cogs);
    document.getElementById('rep-gross').innerText = formatRupiah(grossProfit);
    document.getElementById('rep-expense').innerText = formatRupiah(financeData.expense);
    document.getElementById('rep-net').innerText = formatRupiah(netProfit);
}

function renderTransactions() {
    const container = document.getElementById('tx-history-list');
    document.getElementById('total-tx-count').innerText = txList.length + " Transaksi";
    container.innerHTML = "";

    if (txList.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400 py-4 text-xs">Belum ada transaksi di Firestore.</p>`;
        return;
    }

    txList.forEach((item) => {
        let badgeColor = "text-orange-600 bg-orange-50";
        let prefix = "-";
        if (item.type === 'income') {
            badgeColor = "text-emerald-600 bg-emerald-50";
            prefix = "+";
        } else if (item.type === 'expense') {
            badgeColor = "text-rose-600 bg-rose-50";
            prefix = "-";
        }

        const div = document.createElement('div');
        div.className = "flex justify-between items-center p-2.5 rounded-lg bg-gray-50 border border-gray-100";
        div.innerHTML = `
            <div>
                <p class="font-bold text-gray-800 text-xs">${item.desc || 'Transaksi'}</p>
                <p class="text-[10px] text-gray-400">Oleh: <span class="font-semibold text-gray-600">${item.staff || 'Kasir'}</span> • ${item.date || 'Hari ini'}</p>
            </div>
            <span class="font-extrabold text-xs px-2 py-1 rounded ${badgeColor}">
                ${prefix} ${formatRupiah(item.amount)}
            </span>
        `;
        container.appendChild(div);
    });
}

// Buka Kamera Belakang HP Langsung
function triggerCameraCapture() {
    document.getElementById('camera-file-input').click();
}

function triggerGalleryPick() {
    document.getElementById('gallery-file-input').click();
}

// Menampilkan Preview Struk dari Kamera/Galeri
function handleReceiptPreview(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('preview-empty').classList.add('hidden');
        const img = document.getElementById('image-preview');
        img.src = e.target.result;
        img.classList.remove('hidden');

        document.getElementById('status-badge').innerText = "Foto Struk Terlampir";
        document.getElementById('status-badge').className = "text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded";
    };
    reader.readAsDataURL(file);
}

// Simpan Transaksi Baru ke Firestore Realtime
async function submitTransactionCloud() {
    const staff = document.getElementById('form-staff-name').value.trim() || "Kasir";
    const amount = parseFloat(document.getElementById('form-amount').value) || 0;
    const desc = document.getElementById('form-desc').value.trim() || "Belanja operasional";
    const type = document.getElementById('form-category').value;

    if (amount <= 0) {
        alert("Nominal transaksi masih kosong! Masukkan angka yang sesuai di kolom nominal.");
        return;
    }

    const newTx = {
        staff: staff,
        desc: desc,
        amount: amount,
        type: type,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (db) {
        try {
            await db.collection("transactions").add(newTx);
            alert("Berhasil! Transaksi otomatis tersimpan dan tersinkronisasi ke seluruh HP.");
            resetForm();
        } catch (err) {
            console.error("Firestore write error:", err);
            alert("Gagal menyimpan ke Firestore: " + err.message);
        }
    } else {
        txList.unshift({
            ...newTx,
            timestamp: new Date()
        });
        if (type === 'income') financeData.income += amount;
        if (type === 'cogs') financeData.cogs += amount;
        if (type === 'expense') financeData.expense += amount;
        updateNumbers();
        renderTransactions();
        alert("Mode Offline: Transaksi tersimpan lokal.");
        resetForm();
    }
}

function resetForm() {
    document.getElementById('form-amount').value = "";
    document.getElementById('form-desc').value = "";
    document.getElementById('image-preview').classList.add('hidden');
    document.getElementById('preview-empty').classList.remove('hidden');
    document.getElementById('camera-file-input').value = "";
    document.getElementById('gallery-file-input').value = "";
    document.getElementById('status-badge').innerText = "Form Input Kasir";
    document.getElementById('status-badge').className = "text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded";
}

// Navigasi Tab
function switchTab(tabName) {
    if ((tabName === 'dashboard' || tabName === 'report') && !isOwner) {
        toggleRoleModal();
        return;
    }

    ['scan', 'dashboard', 'report'].forEach(t => {
        document.getElementById(`tab-${t}`).classList.add('hidden');
        document.getElementById(`nav-${t}`).classList.remove('text-emerald-600');
        document.getElementById(`nav-${t}`).classList.add('text-gray-400');
    });

    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    document.getElementById(`nav-${tabName}`).classList.add('text-emerald-600');
    document.getElementById(`nav-${tabName}`).classList.remove('text-gray-400');
    lucide.createIcons();
}

// Modal PIN Owner
function toggleRoleModal() {
    const modal = document.getElementById('modal-role');
    modal.classList.toggle('hidden');
    document.getElementById('input-pin').value = "";
}

function verifyOwnerPin() {
    const pin = document.getElementById('input-pin').value;
    if (pin === "1234") {
        isOwner = true;
        document.getElementById('role-badge').innerText = "Mode Owner (Aktif)";
        document.getElementById('role-badge').className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300";
        document.getElementById('karyawan-notice').classList.add('hidden');
        toggleRoleModal();
        alert("Akses Owner Terbuka! Anda sekarang dapat melihat ringkasan keuangan.");
        switchTab('dashboard');
    } else {
        alert("PIN salah! Hanya Owner yang memiliki akses laporan.");
    }
}

// Ekspor PDF & Share WhatsApp
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const grossProfit = financeData.income - financeData.cogs;
    const netProfit = grossProfit - financeData.expense;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(46, 125, 50);
    doc.text(APP_CONFIG.businessName, 20, 25);
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text("REKAP LABA RUGI USAHA", 20, 32);
    doc.line(20, 38, 190, 38);

    let y = 48;
    doc.text("Total Pendapatan", 20, y);
    doc.text(formatRupiah(financeData.income), 190, y, { align: "right" });
    y += 10;
    doc.text("Total HPP (Bahan & Stok)", 20, y);
    doc.text("(" + formatRupiah(financeData.cogs) + ")", 190, y, { align: "right" });
    y += 6;
    doc.line(20, y, 190, y);
    y += 8;
    doc.text("Laba Kotor", 20, y);
    doc.text(formatRupiah(grossProfit), 190, y, { align: "right" });
    y += 12;
    doc.text("Total Beban Operasional", 20, y);
    doc.text("(" + formatRupiah(financeData.expense) + ")", 190, y, { align: "right" });
    y += 6;
    doc.line(20, y, 190, y);
    y += 8;
    doc.setFontSize(13);
    doc.setTextColor(46, 125, 50);
    doc.text("TOTAL LABA BERSIH", 20, y);
    doc.text(formatRupiah(netProfit), 190, y, { align: "right" });

    doc.save("Rekap_Laba_Rugi_" + APP_CONFIG.businessName.replace(/\s+/g, '_') + ".pdf");
}

function shareReport() {
    const grossProfit = financeData.income - financeData.cogs;
    const netProfit = grossProfit - financeData.expense;
    const msg = `*REKAP KEUANGAN - ${APP_CONFIG.businessName}*\n\n` +
                `Total Pendapatan: ${formatRupiah(financeData.income)}\n` +
                `Total HPP: ${formatRupiah(financeData.cogs)}\n` +
                `Total Beban: ${formatRupiah(financeData.expense)}\n` +
                `-----------------------------------\n` +
                `*TOTAL LABA BERSIH: ${formatRupiah(netProfit)}*\n\n` +
                `_Laporan dibuat otomatis via ${APP_CONFIG.appName}_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
}
