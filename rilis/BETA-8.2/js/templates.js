/* templates.js — paket template bawaan per jenis usaha (dipakai Tower: Klien Baru & Template).
   Katalog hanya berisi KATEGORI dan ukuran/jenis umum tanpa merek. Merek diisi toko sendiri
   (ubah nama jenis / Salin induk lalu Ubah). Harga adalah PERKIRAAN umum Nov 2026, wajib dicek toko. */
(function () {
  'use strict';
  /* "Induk|satuan|margin%|Jenis:modal[:satuan[:harga jual]];..." */
  var MINIMARKET = [
    /* ---- sembako & bahan pokok ---- */
    'Beras Curah|kg|8|Medium:15500;Premium:16800;Super:17800;Pulen Wangi:19000',
    'Beras Kemasan|pak|8|2 kg:36000;5 kg:82000;10 kg:158000;25 kg:385000',
    'Gula Pasir|kg|8|Curah:18200;Kemasan 1 kg:19800;Kemasan 500 g:10200;Gula Merah:22000;Gula Batu:25000',
    'Minyak Goreng|liter|8|Curah:18800;Kemasan 1 L:22000;Kemasan 2 L:43000;Pouch 1 L:21500;Pouch 2 L:42500;Jeriken 5 L:104000',
    'Tepung Terigu|kg|10|Protein Tinggi:12500;Protein Sedang:11500;Protein Rendah:10500',
    'Tepung Lain|bks|12|Tapioka 500 g:8000;Beras 500 g:9500;Maizena 150 g:7500;Tepung Bumbu 200 g:7500;Tepung Panir 200 g:9500;Tepung Ketan 500 g:11500',
    'Telur|kg|7|Ayam Ras:26500;Ayam Kampung:42000;Bebek:33000;Asin:4500:butir;Puyuh 10 butir:13000:pak',
    'Garam|bks|15|Halus 250 g:3200;Halus 500 g:5500;Kasar 500 g:4500;Beryodium 1 kg:9000',
    'Mie Instan|bks|8|Goreng:2900;Kuah:2800;Kuah Jumbo:4200;Cup:5400;Goreng Jumbo:3900;Rebus Kemasan 5 pcs:14000:pak',
    'Bihun, Soun & Pasta|bks|12|Bihun 200 g:6500;Soun 100 g:4800;Kwetiau 200 g:7000;Spaghetti 500 g:13500;Makaroni 200 g:6500',
    'Kecap & Saus|btl|12|Kecap Manis 135 ml:6200;Kecap Manis 275 ml:10500;Kecap Manis 550 ml:19000;Saus Sambal 135 ml:5500;Saus Sambal 275 ml:10000;Saus Tomat 135 ml:5500;Saus Tiram 135 ml:9500;Cuka 150 ml:3500',
    'Bumbu Instan|sch|15|Nasi Goreng:2600;Soto:2300;Rendang:4800;Opor:3500;Sup:2300;Pecel:3200',
    'Bumbu Dapur Kemasan|bks|15|Penyedap Rasa 100 g:3800;Penyedap Rasa 250 g:8700;Merica Bubuk:3000;Ketumbar Bubuk:3000;Kunyit Bubuk:3000;Kaldu Bubuk:2600;Terasi:3000',
    'Santan & Pengental|bks|12|Santan 65 ml:3700;Santan 200 ml:7500;Santan 1 L:30000;Agar-agar:3800;Gelatin:5000',
    'Susu Kental Manis|kaleng|10|Putih 370 g:12000;Cokelat 370 g:12500;Sachet:1700:sch',
    'Susu UHT|kotak|10|Plain 125 ml:3500;Plain 200 ml:5200;Plain 1 L:19500;Cokelat 200 ml:5600;Stroberi 200 ml:5600',
    'Susu Bubuk|bks|10|Dewasa 400 g:42000;Dewasa 800 g:82000;Anak 400 g:58000;Sachet:3500:sch;Skim 200 g:25000',
    'Susu Formula Bayi|kaleng|8|Tahap 1 400 g:82000;Tahap 2 400 g:78000;Tahap 3 400 g:75000;Tahap 1 800 g:158000',
    'Kopi|bks|12|Bubuk 65 g:6500;Bubuk 200 g:19000;Instan 3in1 Sachet:1400:sch;Instan 3in1 Renceng 10:13500:renceng;Hitam Sachet:1300:sch;Instan Botol 50 g:21000',
    'Teh|bks|12|Celup 25 Kantong:6500;Celup 50 Kantong:12500;Bubuk 100 g:7500;Tubruk 200 g:9000;Teh Hijau:11500',
    'Minuman Serbuk|sch|15|Jahe:1800;Cokelat:2000;Buah Sachet:1500;Sirup 460 ml:16000:btl;Sereal Minum:2200',
    'Sereal & Oat|bks|10|Sereal Sarapan 330 g:26000;Oat 800 g:35000;Oat Instan Sachet:3200:sch;Granola:38000',
    'Roti & Kue|bks|12|Roti Tawar:14000;Roti Manis:5000;Roti Sobek:16000;Bolu Kemas:9000;Kue Kering Toples:32000:toples',
    'Biskuit|bks|12|Krim 120 g:7500;Kaleng 650 g:62000:kaleng;Cracker 250 g:11000;Wafer 130 g:7500;Sandwich Cokelat:2200;Biskuit Bayi:14000',
    'Snack Kemasan|bks|15|Keripik Kentang 68 g:10000;Snack Jagung Kecil:2000;Snack Jagung Besar:9000;Keripik Singkong 150 g:11000;Kacang Kulit 200 g:9000;Kacang Atom 200 g:10000',
    'Kerupuk & Emping|bks|15|Kerupuk Udang 250 g:12000;Kerupuk Aci 200 g:8000;Emping Mentah 200 g:21000;Kerupuk Kulit 150 g:15000',
    'Permen|bks|18|Permen Karet:1800;Permen Keras Bungkus:1500;Permen Jahe:3000;Permen Mint Tube:2500;Lolipop:1000;Permen Jelly:2500',
    'Cokelat|pcs|15|Batang Kecil:4200;Batang Sedang:9500;Batang Besar:21000;Cokelat Meses 200 g:9500;Cokelat Masak 250 g:21000',
    /* ---- minuman siap minum ---- */
    'Soft Drink|btl|10|Botol 250 ml:3700;Botol 390 ml:4500;Botol 600 ml:6000;Botol 1,5 L:12500;Kaleng 330 ml:6500:kaleng',
    'Air Mineral|btl|10|Botol 330 ml:1700;Botol 600 ml:2800;Botol 1,5 L:5000;Gelas 220 ml Dus:21000:dus;Galon Isi Ulang 19 L:14000:galon;Galon Segel 19 L:21000:galon',
    'Teh Kemasan|btl|12|Botol 350 ml:3800;Botol 450 ml:4800;Botol 500 ml:5200;Kotak 250 ml:3000:kotak;Kotak 1 L:9500:kotak',
    'Kopi Siap Minum|btl|12|Kaleng 240 ml:7000:kaleng;Botol 250 ml:8500;Botol 1 L:28000;Kotak 200 ml:5500:kotak',
    'Minuman Isotonik & Energi|btl|12|Isotonik 500 ml:6000;Isotonik 1 L:12000;Energi Kaleng 250 ml:7500:kaleng;Energi Sachet:2200:sch;Vitamin Drink 140 ml:6500',
    'Jus & Sari Buah|btl|12|Kotak 200 ml:4000:kotak;Botol 350 ml:6500;Botol 1 L:19000;Sari Kelapa 330 ml:7500',
    'Yogurt & Susu Fermentasi|btl|15|Susu Fermentasi 65 ml:2400;Yogurt Cup 100 g:5500:cup;Yogurt Botol 250 ml:9500;Yogurt Drink Kotak 200 ml:6000:kotak',
    'Es Krim|pcs|20|Cone:5500;Cup:4500:cup;Stik:3500;Family 700 ml:28000:tub;Sandwich:4000',
    /* ---- segar & beku ---- */
    'Frozen Food|bks|12|Nugget 500 g:36000;Sosis 375 g:29000;Bakso Sapi 500 g:38000;Bakso Ayam 500 g:30000;Kentang Goreng 1 kg:45000;Dimsum 10 pcs:22000;Otak-otak 300 g:21000',
    'Daging & Ayam Segar|kg|8|Ayam Broiler Utuh:38500;Dada Ayam:42000;Paha Ayam:41000;Sayap Ayam:40000;Daging Sapi Has:128000;Daging Sapi Giling:118000;Tulang Iga:95000',
    'Ikan & Seafood|kg|10|Ikan Segar Umum:36000;Lele:28000;Nila:34000;Udang:82000;Cumi:68000;Ikan Asin:55000;Ikan Beku Fillet:52000',
    'Sayur Segar|kg|15|Bawang Merah:38000;Bawang Putih:36500;Bawang Bombay:26000;Cabai Merah Besar:50000;Cabai Keriting:98000;Cabai Rawit Merah:97000;Cabai Rawit Hijau:70000;Tomat:12000;Kentang:16000;Wortel:14000;Kol:9000;Timun:8000;Terong:11000;Sawi:9000;Bayam Ikat:3000:ikat;Kangkung Ikat:3000:ikat;Buncis:14000;Jahe:28000;Kunyit:18000;Lengkuas:16000;Daun Bawang Ikat:3500:ikat;Seledri Ikat:3000:ikat',
    'Buah Segar|kg|20|Apel:32000;Jeruk:24000;Pisang:16000;Semangka:8000;Melon:14000;Anggur:55000;Pir:30000;Pepaya:9000;Mangga:22000;Nanas:12000;Salak:20000;Jeruk Nipis:22000',
    'Tahu, Tempe & Olahan|pcs|20|Tahu Putih:500;Tahu Kuning:700;Tempe Papan:5500;Tempe Bungkus:1000;Oncom:3500;Tauge 250 g:3000:bks',
    'Makanan Kaleng|kaleng|12|Sarden 155 g:10500;Kornet 198 g:21500;Jagung Manis 340 g:14500;Buah Kaleng 400 g:19000;Kacang Merah 400 g:11500;Jamur Kaleng 400 g:14000',
    'Makanan Bayi|pouch|12|Bubur Bayi Sachet:5200:sch;Bubur Bayi Kotak 120 g:12000:kotak;Biskuit Bayi 130 g:14000;Puree Buah Pouch 100 g:17000',
    'Makanan Hewan|bks|12|Kucing 1 kg:42000;Kucing Sachet 85 g:6500:sch;Anjing 1 kg:38000;Burung 500 g:15000;Pasir Kucing 5 L:32000',
    /* ---- kebersihan & rumah tangga ---- */
    'Deterjen|bks|12|Bubuk Sachet:1300:sch;Bubuk 800 g:19000;Bubuk 1,8 kg:38000;Cair 800 ml:21000;Cair Refill 1 L:23000;Deterjen Batang:3000',
    'Pelembut & Pewangi Pakaian|bks|12|Sachet:1300:sch;Refill 800 ml:16000;Botol 900 ml:24000;Pewangi Setrika 450 ml:12000',
    'Pemutih & Pembersih Noda|btl|12|Pemutih 500 ml:8500;Pemutih 1 L:15500;Penghilang Noda 450 ml:15000;Pewangi Lemari Gantung:11000',
    'Sabun Cuci Piring|btl|12|Sachet:1500:sch;Refill 400 ml:8500;Botol 800 ml:15000;Jeruk Nipis 750 ml:15500;Batang:4500',
    'Pembersih Lantai|btl|12|Sachet:1700:sch;Refill 800 ml:14000;Botol 800 ml:17000;Karbol 800 ml:15000',
    'Pembersih Serbaguna|btl|12|Kaca Spray 500 ml:15000;Pembersih Kamar Mandi 500 ml:17000;Toilet Cleaner 500 ml:15000;Pembersih Dapur 500 ml:17000;Bubuk Pembersih 500 g:7000',
    'Pengharum Ruangan|pcs|15|Spray 300 ml:22000;Spray 500 ml:33000;Gel Kotak:15000;Refill:19000;Pengharum Toilet:7500',
    'Racun Nyamuk|pcs|15|Bakar Isi 12:6500:box;Semprot 400 ml:29000;Elektrik Alat:15000;Elektrik Refill Cair:13000;Lotion Anti Nyamuk:7000;Koil Oles:5000',
    'Insektisida Rumah|pcs|15|Semut Kecoa Spray 400 ml:30000;Umpan Kecoa:9500;Kapur Semut:3000;Perangkap Tikus Lem:6000;Kamper Bola:5000',
    'Tisu|pak|15|Wajah 250 lembar:9500;Wajah 2 Ply Mini:4500;Gulung Toilet 4 roll:12000;Dapur 2 roll:12500;Basah 50 lembar:9000;Saku Kecil:2000',
    'Kantong Sampah|pak|15|Kecil 15 lembar:4500;Sedang 20 lembar:7500;Besar 20 lembar:11000;Jumbo 10 lembar:12500',
    'Spons & Lap|pcs|20|Spons Cuci:3000;Sabut Cuci:2000;Lap Microfiber:7500;Lap Dapur:5000;Sikat Pakaian:6500;Kain Pel:12000',
    'Peralatan Kebersihan|pcs|20|Sapu Ijuk:14000;Sapu Lidi:11000;Pengki:8000;Pel Lantai:28000;Ember 10 L:15000;Gayung:6000;Sikat WC:10000;Sikat Lantai:12000',
    'Plastik & Kemasan|pak|18|Kantong Kresek 1 kg:12000:kg;Plastik Klip Kecil:4500;Plastik Klip Besar:8500;Aluminium Foil:15000:roll;Cling Wrap:14000:roll;Plastik Es 1 kg:14000:kg;Sedotan 50 pcs:4500;Gelas Plastik 25 pcs:9500;Kotak Makan Sekali Pakai 10 pcs:14000;Kertas Minyak:10000',
    'Baterai|pcs|18|AA Tahan Lama:4500;AAA:4500;A2 Besar:8500;9 Volt:19000;Kancing CR2032:9500;Baterai Isi Ulang AA:24000',
    'Lampu & Listrik|pcs|20|Lampu LED 5 W:12000;Lampu LED 9 W:16000;Lampu LED 12 W:23000;Stop Kontak 4 Lubang:32000;Kabel Roll 5 m:55000;Saklar:11000;Fitting:7500;Senter:23000',
    'Korek & Lilin|pcs|20|Korek Gas:3500;Korek Kayu Kotak:1500;Lilin Kecil:1000;Lilin Putih Besar:2500;Obat Bakar Dupa:5000',
    'Gas Elpiji|tabung|10|3 Kg Isi:19500;3 Kg Kosong Tukar:19500;Regulator:60000;Selang Gas:30000',
    /* ---- perawatan diri ---- */
    'Sabun Mandi|pcs|15|Batang:3500;Cair Sachet:1500:sch;Cair Botol 450 ml:19000;Cair Refill 400 ml:15000;Sabun Antiseptik:5500;Sabun Bayi:9500',
    'Sampo|btl|15|Sachet:700:sch;Botol 170 ml:15000;Botol 340 ml:27000;Anti Ketombe 170 ml:19000;Sampo Bayi 100 ml:12000;Refill 300 ml:20000',
    'Kondisioner & Perawatan Rambut|pcs|15|Kondisioner Sachet:800:sch;Kondisioner Botol 170 ml:15000;Minyak Rambut 100 ml:12000;Pomade:25000;Gel Rambut:10000;Pewarna Rambut Sachet:9000;Hair Spray:21000',
    'Pasta Gigi|pcs|15|Tube 75 g:7500;Tube 150 g:13500;Herbal 75 g:9000;Anak 50 g:9500;Sachet:700:sch',
    'Sikat Gigi & Mulut|pcs|18|Sikat Gigi Dewasa:5500;Sikat Gigi Anak:5500;Obat Kumur 250 ml:13000;Obat Kumur 500 ml:22000;Benang Gigi:11000;Tusuk Gigi:1500',
    'Deodoran & Parfum|pcs|18|Roll On 50 ml:12000;Spray 150 ml:24000;Bedak Tabur Badan:9500;Parfum Mini:12000;Cologne 100 ml:20000',
    'Body Lotion & Pelembap|pcs|18|Lotion 100 ml:9500;Lotion 200 ml:15500;Lotion 400 ml:26000;Baby Oil 100 ml:12000;Vaseline 50 g:9500;Minyak Zaitun 60 ml:15000',
    'Perawatan Wajah|pcs|18|Sabun Wajah 100 ml:14000;Pelembap Wajah 40 g:16000;Tabir Surya 50 ml:27000;Masker Wajah:3500;Bedak Padat:19000;Bedak Tabur:12000;Lipstik:18000;Pensil Alis:11000',
    'Pembalut & Kewanitaan|pak|15|Reguler 10 pcs:7500;Malam 8 pcs:9500;Panty Liner 20 pcs:7500;Sabun Kewanitaan 60 ml:12000',
    'Popok Bayi|pak|12|NB 20 pcs:48000;S 20 pcs:50000;M 18 pcs:52000;L 16 pcs:52000;XL 14 pcs:52000;Popok Dewasa 10 pcs:55000',
    'Perlengkapan Bayi|pcs|18|Tisu Basah Bayi 50:11000;Minyak Telon 60 ml:14000;Bedak Bayi 100 g:11000;Dot Botol:8000;Botol Susu 120 ml:21000;Sabun Bayi Cair 200 ml:17000',
    'Pencukur & Perawatan Kuku|pcs|20|Pisau Cukur Sekali Pakai:3500;Pisau Cukur Set Isi 2:10000;Gunting Kuku:7000;Cotton Bud 100 pcs:4500;Kapas 100 g:9500;Sisir:3500;Cermin Kecil:5000',
    /* ---- kesehatan (obat bebas) ---- */
    'Obat Bebas|strip|15|Pereda Nyeri Strip:3500;Obat Flu Strip:3000;Obat Batuk Sachet:2500:sch;Obat Batuk Botol:14000:btl;Antasida Strip:5000;Obat Sakit Kepala Sachet:1500:sch;Oralit:1500:sch;Obat Maag Cair Sachet:3000:sch;Tetes Mata:12000:btl;Obat Cacing:9000',
    'Obat Luar & Antiseptik|pcs|18|Minyak Angin Roll On:12000;Minyak Kayu Putih 60 ml:18000;Balsem Gosok:9500;Koyo Isi 2:5500;Plester 10 pcs:5000;Antiseptik 60 ml:9500;Kasa Steril:4500;Salep Kulit:12500;Alkohol 70% 100 ml:6500;Hand Sanitizer 100 ml:11000',
    'Vitamin & Suplemen|pcs|15|Vitamin C 10 Tablet:12000;Vitamin C Effervescent Tube:28000;Multivitamin Strip:11000;Minuman Kesehatan Botol:6000;Madu 150 ml:26000;Jamu Sachet:2500:sch;Jamu Botol:7000',
    'Masker & Alat Kesehatan|pcs|20|Masker Medis Box 50:28000:box;Masker Sekali Pakai 3 pcs:5000;Termometer:55000;Tensimeter Digital:230000;Sarung Tangan Karet:12000;Alat Tes Kehamilan:9500',
    /* ---- rokok ---- */
    'Rokok Kretek|bks|4|Filter 12 Batang:23000;Filter 16 Batang:31000;Tanpa Filter:15000;Mild 16 Batang:33000;Premium 20 Batang:42000',
    'Rokok Putih|bks|4|Filter 16 Batang:31000;Filter 20 Batang:37000;Menthol 16 Batang:32000',
    'Rokok Eceran|btg|30|Per Batang Kretek:1900;Per Batang Putih:2200',
    'Tembakau & Pelengkap|pcs|20|Tembakau Iris 50 g:15000;Kertas Linting:3500;Cengkeh 50 g:12000',
    /* ---- alat tulis & kantor ---- */
    'Pulpen|pcs|25|Standar Hitam:1800;Standar Biru:1800;Standar Merah:1800;Gel Hitam:3500;Gel Warna:4000;Pulpen Bolpoin Pak 12:19000:pak',
    'Pensil & Perlengkapan|pcs|25|Pensil 2B:1800;Pensil Mekanik:6500;Isi Pensil Mekanik:3500;Penghapus:1800;Rautan:2500;Pensil Warna 12:12000:set',
    'Penggaris & Alat Ukur|pcs|25|Penggaris Plastik 30 cm:3000;Penggaris Besi 30 cm:8500;Busur & Segitiga Set:9500:set;Jangka:11000;Meteran Gulung:14000',
    'Buku Tulis|pcs|25|38 Lembar:3500;58 Lembar:5200;Buku Besar Folio:15000;Buku Gambar A4:6000;Buku Kas:18000;Buku Nota:9000;Buku Agenda:20000;Buku Kotak-kotak:6000',
    'Kertas|rim|15|HVS A4 70 gr:48000;HVS A4 80 gr:56000;HVS F4 70 gr:54000;Kertas Foto:21000:pak;Kertas Warna:15000:pak;Kertas Lipat:8000:pak;Kertas Karton:3500:lbr;Kertas Kado:2500:lbr',
    'Map & Amplop|pcs|25|Map Plastik:3500;Map Snelhecter:8500;Map Kertas:2000;Amplop Putih Pak 100:17000:pak;Amplop Coklat Pak 100:22000:pak;Ordner:27000;Pembatas Buku:7000',
    'Perekat|pcs|25|Lakban Bening:6500;Lakban Hitam:7500;Isolasi Kecil:2500;Lem Kertas:3000;Lem Serbaguna:7000;Lem Tembak Isi:2500;Double Tape:4500;Lakban Kertas:6500',
    'Spidol & Tinta|pcs|25|Spidol Papan Tulis:7000;Spidol Permanen:6000;Stabilo:6500;Tinta Spidol:12000;Tinta Stempel:8500;Bantalan Stempel:12000;Kapur Tulis Kotak:4500;Tip-Ex:5000',
    'Perlengkapan Kantor|pcs|25|Stapler:12000;Isi Staples:2000;Gunting:7500;Cutter:6500;Isi Cutter:3500;Penjepit Kertas:3000;Paper Clip Kotak:3000;Kalkulator:38000;Papan Jalan:9500;Pelubang Kertas:18000',
    'Perlengkapan Sekolah|pcs|25|Tas Sekolah:90000;Tempat Pensil:12000;Kotak Bekal:17000;Botol Minum:19000;Sampul Buku 10 pcs:6500:pak;Label Nama:3500:pak;Seragam Kaos Kaki:12000',
    /* ---- pulsa & digital ---- */
    'Pulsa Reguler|pcs|0|5.000:5400:pcs:6500;10.000:10200:pcs:11500;20.000:20200:pcs:21500;25.000:25200:pcs:26500;50.000:50200:pcs:51500;100.000:100200:pcs:101500',
    'Token Listrik|pcs|0|20.000:20000:pcs:22500;50.000:50000:pcs:52500;100.000:100000:pcs:102500;200.000:200000:pcs:202500;500.000:500000:pcs:502500',
    'Paket Data & Voucher|pcs|0|Paket Data Kecil:12000:pcs:15000;Paket Data Sedang:35000:pcs:39000;Paket Data Besar:70000:pcs:75000;Voucher Game 20.000:19500:pcs:22500;Voucher Wifi Harian:3000:pcs:5000',
    'Kartu Perdana|pcs|25|Perdana Reguler:8000;Perdana Data:30000;Perdana Ekonomis:5000',
    'Aksesoris HP|pcs|30|Kabel Data:12000;Charger Kepala:25000;Charger Set:38000;Earphone:12000;Headset Bluetooth:55000;Casing HP:15000;Anti Gores:8000;Memori 32 GB:55000;Power Bank 10.000 mAh:120000;Holder HP:15000',
    /* ---- peralatan & perlengkapan ---- */
    'Peralatan Makan|pcs|25|Piring Plastik:8000;Piring Melamin:11000;Mangkuk:6500;Gelas Plastik:4000;Gelas Kaca:7000;Sendok Garpu Set:6000:set;Sendok Makan:1500;Cangkir:9000;Teko:25000;Toples Plastik:13000',
    'Peralatan Masak|pcs|25|Panci Kecil:35000;Panci Sedang:60000;Wajan:45000;Penggorengan Anti Lengket:65000;Spatula:6500;Sendok Sayur:8500;Pisau Dapur:15000;Talenan:12000;Saringan:8500;Parutan:8000;Ulekan:18000;Dandang:90000',
    'Wadah & Termos|pcs|25|Termos Air Panas 1 L:60000;Botol Minum Plastik:12000;Kotak Makan Plastik:15000;Kotak Penyimpan Besar:30000;Ember Plastik Tutup:22000;Tempat Sendok:9000;Rak Piring:35000',
    'Perlengkapan Kamar Mandi|pcs|25|Handuk Kecil:12000;Handuk Mandi:45000;Gayung:6000;Ember Mandi:15000;Tempat Sabun:4500;Gantungan:3000;Keset:12000;Sikat Pakaian:6000',
    'Alas Kaki|pasang|25|Sandal Jepit:12000;Sandal Karet:25000;Sandal Rumah:20000;Kaos Kaki:8000;Sandal Anak:15000',
    'Payung & Jas Hujan|pcs|25|Payung Lipat:30000;Payung Besar:45000;Jas Hujan Plastik:5000;Jas Hujan Setelan:60000;Ponco:35000',
    'Perlengkapan Ibadah|pcs|20|Sajadah:30000;Sarung:55000;Peci:20000;Mukena:110000;Tasbih:6500;Al-Qur\'an:60000;Dupa Pak:5000',
    'Mainan Anak|pcs|30|Mainan Plastik Kecil:5000;Boneka:25000;Mobil-mobilan:15000;Balon Pak:3500:pak;Puzzle:17000;Kartu Permainan:7000;Gelembung Sabun:5000;Buku Mewarnai:8000',
    'Pesta & Kado|pcs|25|Kantong Kado Kecil:3000;Kantong Kado Besar:6500;Kertas Kado:2500:lbr;Pita:3500:roll;Lilin Ulang Tahun:5000:pak;Topi Pesta:5000;Balon Karakter:6500;Kartu Ucapan:5000;Boks Kado:8000',
    'Pertanian & Taman Ringan|pcs|20|Benih Sayur Sachet:5000:sch;Pupuk Cair 500 ml:18000;Pupuk Tabur 1 kg:12000;Pot Plastik:8500;Media Tanam:12000;Penyiram Tanaman:15000',
    'Perkakas Ringan|pcs|25|Palu:35000;Obeng Set:30000:set;Tang:30000;Gergaji Kecil:28000;Paku 1 kg:25000:kg;Baut Kecil Kotak:15000:box;Lakban Kabel:5000;Cat Semprot:30000;Kuas Cat:8500;Meteran 5 m:15000'
  ];

  function pre(g) { return String(g || 'STK').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'STK'; }
  function roundUp(n) { var u = n >= 100000 ? 500 : 100; return Math.ceil(n / u) * u; }
  function build(lines) {
    var out = [], used = {}, ord = 0;
    lines.forEach(function (ln) {
      var f = ln.split('|'), g = f[0], u = f[1], m = Number(f[2]) || 0, cnt = 0;
      f.slice(3).join('|').split(';').forEach(function (it) {
        var q = it.split(':'); if (q.length < 2) return;
        var vr = q[0].trim(), hpp = Number(q[1]) || 0, un = (q[2] || u).trim(), sell = q[3] ? Number(q[3]) : roundUp(hpp * (1 + m / 100));
        var p = pre(g), n = 1, code;
        do { code = p + '-' + String(n++).padStart(3, '0'); } while (used[code]);
        used[code] = 1; ord++; cnt++;
        out.push({ id: code, v: { code: code, name: g + ' - ' + vr, sellPrice: sell, hpp: hpp, stock: 0, barcode: '', minStock: 5, order: ord, group: g, variant: vr, unit: un, forSale: true, biz: '', openStock: 0, endStock: null } });
      });
    });
    return out;
  }
  var PACKS = {
    minimarket: { label: 'Minimarket Besar', type: 'minimarket', preset: 'minimarket', lines: MINIMARKET }
  };
  /* jenis usaha (COA_TEMPLATES) -> paket fitur bawaan (PRESETS di plans.js) */
  var TYPE_PRESET = { umum: 'umum', warung: 'kafe', toko: 'minimarket', minimarket: 'minimarket', jasa: 'jasa', konveksi: 'konveksi', laundry: 'laundry', salon: 'salon', bengkel: 'bengkel' };

  function featuresOf(presetKey) {
    var pr = window.FM_PLANS && FM_PLANS.PRESETS[presetKey], out = {};
    if (!window.FM_PLANS) return out;
    FM_PLANS.FEATURES.forEach(function (f) {
      if (f.soon) return;
      FM_PLANS.ROLES.forEach(function (r) {
        if (f.r[r] !== 'o') return;
        out[f.key] = out[f.key] || {};
        out[f.key][r] = !!pr && (!pr.keys || pr.keys.indexOf(f.key) >= 0 || pr.keys.indexOf(f.key + ':' + r) >= 0);
      });
    });
    return out;
  }
  function catalog(key) { var p = PACKS[key]; return p ? build(p.lines) : []; }
  function coaOf(type) { try { return JSON.parse(JSON.stringify(COA_TEMPLATES[type].coa)); } catch (e) { return []; } }
  /* snapshot siap pakai untuk Terapkan Template (bentuknya sama dengan snapshot toko) */
  function snap(key) {
    var p = PACKS[key]; if (!p) return null;
    var s = { parts: { fitur: 1, coa: 1, katalog: 1 }, features: featuresOf(p.preset), coa: coaOf(p.type), catalog: catalog(key) };
    return s;
  }
  window.FM_TPL = {
    PACKS: PACKS, TYPE_PRESET: TYPE_PRESET, catalog: catalog, snap: snap, featuresOf: featuresOf,
    hasCatalog: function (type) { return !!PACKS[type]; }
  };
})();
