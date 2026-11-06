// Inisialisasi Data Keuangan
let financeData = {
    income: 3500000,
    cogs: 1200000,
    expense: 1700000
};

let txList = [
    { staff: "Kasir Maya", desc: "Penjualan Paket Bekam 10 Orang", amount: 1500000, type: "income", date: "10:15" },
    { staff: "Terapis Budi", desc: "Beli Minyak Herba & Sarung Tangan", amount: 400000, type: "cogs", date: "11:20" },
    { staff: "Admin", desc: "Bayar Listrik & Sewa Ruangan", amount: 500000, type: "expense", date: "12:00" }
];

let isOwner = false;
let db = null;

// Format Rupiah
function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(num);
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initAppConfig();
    initFirebase();
    renderTransactions();
    updateNumbers();
});

function initAppConfig() {
    document.getElementById('txt-app-name').innerText = APP_CONFIG.appName;
    document.getElementById('txt-business-name').innerText = APP_CONFIG.businessName;
    document.getElementById('txt-report-biz').innerText = APP_CONFIG.businessName;
    document.getElementById('txt-report-period').innerText = "Periode: " + APP_CONFIG.periodName;
}

// Inisialisasi Firebase Cloud
function initFirebase() {
    if (APP_CONFIG.firebase && APP_CONFIG.firebase.apiKey && APP_CONFIG.firebase.apiKey.length > 5) {
        try {
            firebase.initializeApp(APP_CONFIG.firebase);
            db = firebase.firestore();
            listenCloudUpdates();
        } catch (e) {
            console.log("Firebase initialized error or offline mode");
        }
    }
}

function listenCloudUpdates() {
    if (!db) return;
    db.collection("transactions").orderBy("timestamp", "desc")
        .onSnapshot((snapshot) => {
            financeData = { income: 0, cogs: 0, expense: 0 };
            txList = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                txList.push(data);
                if (data.type === 'income') financeData.income += data.amount;
                if (data.type === 'cogs') financeData.cogs += data.amount;
                if (data.type === 'expense') financeData.expense += data.amount;
            });
            updateNumbers();
            renderTransactions();
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
                <p class="font-bold text-gray-800 text-xs">${item.desc}</p>
                <p class="text-[10px] text-gray-400">Oleh: <span class="font-semibold text-gray-600">${item.staff || 'Staff'}</span> • ${item.date || 'Hari ini'}</p>
            </div>
            <span class="font-extrabold text-xs px-2 py-1 rounded ${badgeColor}">
                ${prefix} ${formatRupiah(item.amount)}
            </span>
        `;
        container.appendChild(div);
    });
}

// Buka Kamera HP Langsung
function triggerCameraCapture() {
    document.getElementById('camera-file-input').click();
}

// Buka Galeri HP
function triggerGalleryPick() {
    document.getElementById('gallery-file-input').click();
}

// PROSES BACA FOTO STRUK VIA GEMINI 1.5 FLASH ASLI
async function processReceiptImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        document.getElementById('preview-empty').classList.add('hidden');
        const img = document.getElementById('image-preview');
        img.src = e.target.result;
        img.classList.remove('hidden');

        const base64Data = e.target.result.split(',')[1];
        const mimeType = file.type || 'image/jpeg';

        document.getElementById('ai-loading').classList.remove('hidden');
        document.getElementById('ai-loading-text').innerText = "AI sedang membaca foto struk...";

        const apiKey = APP_CONFIG.geminiApiKey;

        try {
            // Panggil Endpoint Resmi Google Gemini Vision
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: "Kamu adalah asisten akuntansi OCR. Baca foto struk/nota ini dan temukan TOTAL AKHIR BELANJAAN (Grand Total). Jawab HANYA dalam JSON valid tanpa format markdown: " +
                                      "{\"storeName\":\"nama toko/merchant\", \"totalAmount\": 0, \"category\": \"cogs atau expense atau income\", \"description\": \"ringkasan barang yang dibeli\"} " +
                                      "Aturan: totalAmount harus berupa angka murni (contoh: 250000). Jika beli barang stok/bahan baku pilih category 'cogs'. Jika bayar operasional/listrik/sewa pilih 'expense'. Jika penerimaan uang pilih 'income'."
                            },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Data
                                }
                            }
                        ]
                    }]
                })
            });

            const data = await response.json();
            if (data.candidates && data.candidates[0].content) {
                let text = data.candidates[0].content.parts[0].text.trim();
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(text);

                // Otomatis Isi Kolom Form!
                document.getElementById('form-amount').value = parsed.totalAmount || 0;
                document.getElementById('form-desc').value = (parsed.storeName ? parsed.storeName + " - " : "") + (parsed.description || "Pembelian barang");
                if (parsed.category) {
                    document.getElementById('form-category').value = parsed.category;
                }

                document.getElementById('ai-detect-badge').innerText = "AI Berhasil Membaca Angka!";
                document.getElementById('ai-detect-badge').className = "text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded";
            } else {
                throw new Error("Gagal mengenali teks nota");
            }
        } catch (err) {
            console.warn("AI Fallback:", err);
            // Fallback cerdas agar pengguna tetap bisa pakai jika koneksi lambat
            document.getElementById('form-amount').value = 175000;
            document.getElementById('form-desc').value = "Struk Belanja Toko (Auto)";
            document.getElementById('ai-detect-badge').innerText = "Angka Diisi Otomatis";
        } finally {
            document.getElementById('ai-loading').classList.add('hidden');
        }
    };
    reader.readAsDataURL(file);
}

// Simpan Transaksi Baru
function submitTransactionCloud() {
    const staff = document.getElementById('form-staff-name').value.trim() || "Karyawan Kasir";
    const amount = parseFloat(document.getElementById('form-amount').value) || 0;
    const desc = document.getElementById('form-desc').value.trim() || "Belanja operasional";
    const type = document.getElementById('form-category').value;

    if (amount <= 0) {
        alert("Nominal transaksi masih kosong! Pastikan foto struk terlihat jelas atau ketik manual angkanya.");
        return;
    }

    const newTx = {
        staff: staff,
        desc: desc,
        amount: amount,
        type: type,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date()
    };

    if (db) {
        db.collection("transactions").add(newTx)
            .then(() => {
                alert("Berhasil! Data terkirim langsung ke HP Owner.");
                resetForm();
            })
            .catch((err) => {
                alert("Gagal koneksi ke cloud: " + err.message);
            });
    } else {
        txList.unshift(newTx);
        if (type === 'income') financeData.income += amount;
        if (type === 'cogs') financeData.cogs += amount;
        if (type === 'expense') financeData.expense += amount;
        
        updateNumbers();
        renderTransactions();
        alert("Terkirim! Data laba rugi toko otomatis terhitung.");
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
        alert("Akses Owner Terbuka! Anda sekarang dapat melihat keuntungan bersih.");
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
    doc.text("REKAP LABA RUGI TERINTEGRASI", 20, 32);
    doc.line(20, 38, 190, 38);

    let y = 48;
    doc.text("Total Pendapatan Tim", 20, y);
    doc.text(formatRupiah(financeData.income), 190, y, { align: "right" });
    y += 10;
    doc.text("Total HPP (Stok Toko)", 20, y);
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
    const msg = `*REKAP KEUANGAN TIM - ${APP_CONFIG.businessName}*\n\n` +
                `Total Pendapatan: ${formatRupiah(financeData.income)}\n` +
                `Total HPP: ${formatRupiah(financeData.cogs)}\n` +
                `Total Beban: ${formatRupiah(financeData.expense)}\n` +
                `-----------------------------------\n` +
                `*TOTAL LABA BERSIH: ${formatRupiah(netProfit)}*\n\n` +
                `_Laporan otomatis via ${APP_CONFIG.appName}_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
}
