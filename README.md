# POS Kasir — TEFA BAHAGIA DIGITAL PRINT

Aplikasi kasir (Point of Sale) berbasis web, statis (HTML/CSS/JS murni, tanpa
backend/server custom), dengan data tersimpan di **Firebase Firestore** agar
otomatis tersinkron **real-time** antar device (kasir 1, kasir 2, admin, dsb),
dan tetap bisa diakses **offline** lewat cache lokal browser.

## Struktur Berkas

```
index.html               ← struktur halaman (HTML murni)
css/style.css             ← semua styling, termasuk breakpoint responsif
js/firebase-config.js     ← konfigurasi & inisialisasi Firebase (EDIT DI SINI)
js/utils.js                ← helper umum (format Rupiah, toast, modal, dsb)
js/data.js                 ← skema state aplikasi + data contoh awal + menu sidebar
js/sync.js                 ← simpan/baca data ke Firestore + fallback localStorage
js/auth.js                 ← login/logout, sidebar, jam, routing antar halaman
js/page-dashboard.js       ← halaman Dashboard
js/page-kasir.js           ← halaman Kasir/POS, keranjang, struk, kirim WhatsApp
js/page-restock.js         ← halaman Restock barang
js/page-laporan.js         ← halaman Laporan (penjualan, pembelian, operasional)
js/page-master.js          ← data master (barang, kategori, satuan, supplier, dst)
js/page-settings.js        ← log login, data user, hak akses, profil toko & saya
assets/img/logo-tefa.svg   ← logo toko (ganti dengan logo asli bila perlu)
firestore.rules            ← contoh security rules Firestore (lihat di bawah)
vercel.json                ← konfigurasi deployment Vercel
```

Setiap berkas JS dimuat sebagai script biasa (bukan ES module) sesuai urutan
di `index.html` — urutan ini penting karena beberapa berkas bergantung pada
variabel global yang didefinisikan di berkas sebelumnya.

## 1. Setup Firebase (database + sinkron real-time)

Project Firebase (`tefa-bahagia`) sudah dikonfigurasi di `js/firebase-config.js`,
tapi **Firestore Database belum otomatis aktif** di project baru — ikuti
langkah ini sekali saja:

1. Buka [Firebase Console](https://console.firebase.google.com) → pilih project Anda
   (atau buat project baru, lalu ganti object `firebaseConfig` di
   `js/firebase-config.js` dengan konfigurasi project Anda — ambil dari
   **Project settings → Your apps → ikon Web `</>`**).
2. Menu **Build → Firestore Database** → klik **Create database**.
   Pilih lokasi server terdekat (mis. `asia-southeast2` untuk Indonesia),
   mode **Production**.
3. Menu **Build → Authentication → Sign-in method** → aktifkan provider
   **Anonymous**. (Aplikasi otomatis login anonim di belakang layar agar
   Firestore Rules bisa membatasi akses hanya untuk pengguna lewat aplikasi
   ini, bukan publik bebas — sistem login username/password kustom aplikasi
   ini tidak berubah, lapisan anonim ini murni untuk keamanan database.)
4. Menu **Firestore Database → tab Rules** → salin isi `firestore.rules`
   dari folder ini, tempel, lalu **Publish**.

Tanpa langkah 2–4, aplikasi tetap berjalan tapi data hanya tersimpan lokal di
browser masing-masing device (tidak tersinkron) — akan muncul banner
peringatan kuning di layar login.

### Catatan keamanan
- API key Firebase di `firebase-config.js` **bukan rahasia** (semua web app
  Firebase menampilkannya di sisi klien) — keamanan database diatur lewat
  **Firestore Rules**, bukan dengan menyembunyikan key tersebut.
- Untuk pengamanan tambahan (opsional, disarankan untuk produksi jangka
  panjang): di Google Cloud Console, batasi API key tersebut hanya untuk
  domain Vercel Anda (HTTP referrer restriction), dan aktifkan
  **Firebase App Check**.
- Login admin/kasir di aplikasi ini (username/password) tersimpan di dalam
  data Firestore itu sendiri — ganti password default (lihat bagian
  "Akun Default" di bawah) segera setelah deploy pertama kali.

## 2. Deploy ke Vercel (akses publik)

**Opsi A — lewat GitHub (disarankan, auto-deploy setiap push):**
1. Push folder ini ke repository GitHub baru.
2. Buka [vercel.com](https://vercel.com) → **Add New → Project** → import
   repository tersebut.
3. Framework preset: pilih **Other** (situs statis, tidak perlu build
   command/output directory khusus). Klik **Deploy**.
4. Setelah selesai, Anda akan mendapat URL publik seperti
   `https://nama-project.vercel.app` yang bisa diakses dan disinkron dari
   device mana pun.

**Opsi B — lewat Vercel CLI (cepat, tanpa GitHub):**
```bash
npm i -g vercel
cd tefa-pos
vercel --prod
```

## 3. Akun Default (ganti setelah deploy!)

| Role  | Username | Password      |
|-------|----------|---------------|
| Admin | admin    | tefa2424      |
| Admin | admin    | admintefa49   |
| Kasir | kasir1   | kasir11       |
| Kasir | kasir2   | kasir22       |

Ganti password lewat menu **Profil Saya** (untuk akun sendiri) atau
**Pengaturan → Data User** (khusus admin, untuk mengelola semua akun).

## 4. Mengganti Logo

Ganti berkas `assets/img/logo-tefa.svg` dengan logo Anda sendiri (boleh
`.png`/`.jpg`/`.svg`, cukup samakan nama berkas atau ubah path `src` di
`index.html`). Jika gambar gagal dimuat, aplikasi otomatis menampilkan ikon
cadangan agar tampilan tidak rusak.

## 5. Backup & Reset Data

Menu **Profil Toko** (admin) menyediakan:
- **Export Backup JSON** — mengunduh seluruh data sebagai berkas `.json`.
- **Import Backup JSON** — memulihkan data dari berkas backup.
- **Reset ke Data Awal** — menghapus seluruh data (lokal + Firestore) dan
  memulai ulang dengan data contoh.

## 6. Pengembangan Lokal

Karena aplikasi memuat berkas lewat path relatif (`css/style.css`,
`js/...`), jalankan lewat server lokal (bukan dibuka langsung sebagai
`file://`), misalnya:
```bash
npx serve .
# atau
python3 -m http.server 8080
```
lalu buka `http://localhost:8080`.

## Perubahan & Perbaikan dari Versi Sebelumnya

- **Perbaikan bug**: tombol sinkronisasi (ikon cloud di topbar / menu "Sinkronisasi Data")
  sebelumnya hanya membaca status lama dan langsung menampilkan notifikasi
  "Firebase belum terkonfigurasi" tanpa benar-benar mencoba menyambung ulang —
  jadi notifikasi itu terus muncul setiap diklik meski masalah di Firebase
  Console sudah diperbaiki, sampai halaman di-reload manual. Sekarang tombol
  ini **mencoba menyambung ulang setiap kali diklik**, dan jika gagal,
  menampilkan **alasan spesifik** (mis. "Akses ditolak oleh Security Rules",
  "Provider Anonymous belum diaktifkan", dll) bukan pesan generik.

- Memisahkan satu berkas HTML raksasa (~2.650 baris) menjadi berkas
  HTML/CSS/JS terstruktur agar mudah dirawat.
- **Perbaikan bug kritis**: tombol Logout sebelumnya memanggil variabel
  `_syncTimer` yang tidak pernah dideklarasikan — menyebabkan error dan
  proses logout gagal total. Sudah diperbaiki (kini menghentikan listener
  real-time Firestore dengan benar saat logout).
- Perbaikan fungsi `showFirebaseGuide()` yang dipanggil dari banner
  peringatan tapi sebelumnya tidak pernah didefinisikan (akan error jika
  diklik) — sekarang menampilkan panduan setup lengkap.
- Perbaikan tampilan ikon kategori barang di halaman Restock yang
  sebelumnya menampilkan teks nama class CSS mentah (mis. `fa-solid
  fa-file`) bukan ikon sebenarnya.
- Perbaikan kalkulasi kolom "Kurang" di halaman Restock yang sebelumnya
  selalu menambahkan angka tetap 200 secara tidak masuk akal.
- Profil Toko (nama, alamat, telepon, tagline) kini benar-benar
  dipakai di struk cetak & pesan WhatsApp — sebelumnya nilai-nilai
  tersebut di-hardcode sehingga perubahan di menu Pengaturan tidak
  berefek pada struk.
- Menambahkan Firebase Anonymous Authentication + Firestore Rules contoh
  agar database tidak terbuka bebas ke publik, tetap kompatibel dengan
  sinkronisasi real-time multi-device.
- Mengganti referensi logo lokal yang rusak (`img/logo-tefa.png`, berkas
  yang tidak pernah ada) dengan logo SVG bawaan + fallback otomatis jika
  gambar gagal dimuat.
- Tata letak responsif (mobile/tablet/desktop) sudah cukup lengkap di versi
  sebelumnya dan dipertahankan — sidebar collapsible, tabel scroll
  horizontal, grid produk kasir menyesuaikan ukuran layar, modal full-width
  di mobile, dsb.
