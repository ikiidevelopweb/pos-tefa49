# TEFA BAHAGIA DIGITAL PRINT — Sistem Kasir POS

Sistem kasir / point-of-sale untuk usaha digital print, dengan sinkronisasi
**real-time multi-device** lewat Firebase Firestore, siap deploy gratis ke **Vercel**.

## ✨ Fitur

- Login multi-role: Admin & Kasir, dengan hak akses per menu
- Kasir / POS: keranjang belanja, pencarian pelanggan, DP, struk, kirim struk via WhatsApp
- Restock barang & riwayat pembelian
- Laporan penjualan, pembelian, dan ringkasan operasional (laba/rugi)
- Data master: Barang, Kategori, Satuan, Supplier, Pelanggan, Metode Pembayaran
- Log login, manajemen user, hak akses per role, profil toko
- **Sinkronisasi real-time** antar device (HP, tablet, laptop) via Firebase Firestore
- Bekerja offline (cache lokal) lalu otomatis sync saat online kembali
- Backup / restore data ke file JSON
- Responsif penuh: mobile, tablet, desktop

## 📁 Struktur Project

```
tefa-pos/
├── public/                  ← semua yang di-deploy (root Vercel)
│   ├── index.html
│   ├── manifest.json
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── firebase-init.js     ← konfigurasi & inisialisasi Firebase
│   │   ├── utils.js              ← helper umum (format, toast, modal)
│   │   ├── data.js                ← struktur data default (DB)
│   │   ├── sync.js                ← simpan/muat data, listener real-time
│   │   ├── auth.js                ← login, logout, sesi
│   │   ├── router.js              ← sidebar & navigasi antar halaman
│   │   ├── page-dashboard.js
│   │   ├── page-kasir.js          ← POS, keranjang, struk, WhatsApp
│   │   ├── page-restock.js
│   │   ├── page-laporan.js
│   │   ├── page-master.js         ← CRUD data master
│   │   ├── page-pengaturan.js     ← user, hak akses, profil
│   │   └── app.js                  ← entry point
│   └── img/
│       └── logo-tefa.svg    ← logo default (ganti dengan logo Anda jika perlu)
├── firebase.json
├── firestore.rules
├── vercel.json
├── package.json
└── README.md (file ini)
```

## 🔥 Langkah 1 — Setup Firebase (gratis)

1. Buka [Firebase Console](https://console.firebase.google.com/) → **Add project** → beri nama (misal `tefa-bahagia-pos`).
2. Setelah project dibuat, masuk ke **Build → Firestore Database** → **Create database** → pilih mode **Production** → pilih lokasi server (`asia-southeast2` / Jakarta direkomendasikan untuk latensi terbaik di Indonesia).
3. Masuk ke **Project settings** (ikon gerigi) → scroll ke bagian **Your apps** → klik ikon **Web (`</>`)** → daftarkan app (nama bebas, tidak perlu centang Firebase Hosting).
4. Firebase akan menampilkan objek `firebaseConfig` seperti ini:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "tefa-bahagia-pos.firebaseapp.com",
     projectId: "tefa-bahagia-pos",
     storageBucket: "tefa-bahagia-pos.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
5. **Salin nilai-nilai tersebut** ke file `public/js/firebase-init.js`, ganti bagian `window.firebaseConfig = {...}` dengan punya Anda.
6. Masuk ke tab **Rules** di Firestore Database, lalu copy-paste isi file `firestore.rules` dari project ini, klik **Publish**.
   > Catatan keamanan ada di komentar dalam file `firestore.rules` — silakan dibaca.

Itu saja — tidak perlu setup billing/credit card untuk skala pemakaian normal (Firestore free tier: 50rb baca & 20rb tulis/hari, lebih dari cukup untuk 1 toko).

## ☁️ Langkah 2 — Deploy ke Vercel (gratis)

### Opsi A — Tanpa command line (paling mudah)
1. Upload folder project ini ke **GitHub** (buat repository baru, upload semua file).
2. Buka [vercel.com](https://vercel.com) → **Sign up / Login** (bisa pakai akun GitHub).
3. Klik **Add New → Project** → pilih repository GitHub Anda → **Import**.
4. Vercel akan otomatis mendeteksi ini sebagai static site. Pastikan:
   - **Root Directory**: biarkan default (`.`)
   - **Output Directory** / **Build Settings**: tidak perlu diubah (project ini sudah punya `vercel.json` yang mengarahkan ke folder `public`)
5. Klik **Deploy**. Tunggu ±30 detik. Selesai — Anda akan mendapat URL publik seperti `https://tefa-pos.vercel.app`.

### Opsi B — Lewat terminal (Vercel CLI)
```bash
npm install -g vercel
cd tefa-pos
vercel login
vercel --prod
```

Setiap kali ada perubahan kode dan di-push ke GitHub, Vercel otomatis re-deploy.

## 🖥️ Coba di Lokal (opsional, sebelum deploy)

```bash
cd tefa-pos
npx serve public
```
Buka `http://localhost:3000` di browser.

> ⚠️ Jangan buka `index.html` langsung lewat `file://` di browser — beberapa fitur (terutama Firebase) bisa gagal dimuat karena batasan CORS pada protokol file lokal. Selalu gunakan server (baik `npx serve`, Vercel, maupun live-server lainnya).

## 👤 Akun Login Bawaan

| Role  | Username | Password      |
|-------|----------|---------------|
| Admin | admin    | tefa2424      |
| Admin | admin2   | admintefa49   |
| Kasir | kasir1   | kasir11       |
| Kasir | kasir2   | kasir22       |

**Segera ganti password ini** setelah deploy, lewat menu **Pengaturan → Data User** (login sebagai admin).

## 🔄 Cara Kerja Sinkronisasi Real-time

- Setiap perubahan data (transaksi baru, edit barang, dll) langsung disimpan ke **Firebase Firestore** dan ke **localStorage** (sebagai cache offline).
- Semua device yang sedang membuka aplikasi (dan sudah login) akan **otomatis menerima update** dalam hitungan detik lewat Firestore real-time listener — tidak perlu refresh manual.
- Jika koneksi internet putus, aplikasi tetap bisa dipakai dari cache lokal; begitu online kembali, data otomatis tersinkron ulang.
- Ikon status sinkronisasi ada di pojok kanan atas (topbar) — klik untuk sync manual kapan saja.

## 🛠️ Bug & Perbaikan dari Versi Sebelumnya

Dibandingkan file `index.html` asli, perbaikan yang dilakukan:
- Kode dipisah jadi modul-modul terpisah (HTML/CSS/JS) agar mudah dipelihara dan tidak ada konflik antar bagian.
- Pencarian pelanggan di Kasir/POS yang sebelumnya tidak berfungsi (`oninput` tidak terhubung dengan benar) — sudah diperbaiki dan dilengkapi dropdown otomatis + opsi tambah pelanggan baru langsung dari kasir.
- Validasi input (nama wajib diisi, qty tidak melebihi stok, dsb) ditambahkan di semua form CRUD agar tidak menyimpan data kosong/rusak.
- `window.confirm()` (yang sering diblokir oleh WebView/browser tertentu) diganti modal konfirmasi custom (`confirmAsync`) yang konsisten di semua perangkat.
- Status sinkronisasi (`_syncTimer`/indikator cloud) yang sebelumnya cuma dummy, kini benar-benar terhubung ke Firestore real-time listener.
- Semua teks dinamis (nama barang, pelanggan, dll) di-escape (`escapeHtml`) untuk mencegah HTML rusak/celah XSS bila ada karakter khusus seperti `<`, `>`, `"`.
- Tampilan dirombak agar benar-benar responsif: sidebar jadi off-canvas (geser dari kiri) di mobile, grid produk & stat menyesuaikan lebar layar, modal full-width di mobile, tabel bisa di-scroll horizontal di layar kecil.
- Reset password Cuma dilakukan jika field diisi (tidak menimpa password lama jika dikosongkan saat edit user).

## 📦 Backup Data

Masuk ke **Pengaturan → Profil Toko** (sebagai admin) untuk export/import data ke file `.json`, atau reset semua data ke kondisi awal.

---
Dibuat untuk **TEFA BAHAGIA DIGITAL PRINT** — *Berkah & Bahagia Dalam Setiap Cetakan* 🖨️
