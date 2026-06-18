// ===== STATE =====
let appState = {
  user: null,
  currentPage: 'dashboard',
  cart: [],
  orderCounter: 1024,
};

// ===== DATA =====
let DB = {
  users: [
    {id:1,username:'admin',password:'tefa2424',role:'admin',nama:'Ikii',aktif:true,lastLogin:''},
    {id:2,username:'admin',password:'admintefa49',role:'admin',nama:'Wahyono',aktif:true,lastLogin:''},
    {id:3,username:'kasir1',password:'kasir11',role:'kasir',nama:'Wisnu',aktif:true,lastLogin:''},
        {id:4,username:'kasir2',password:'kasir22',role:'kasir',nama:'Fiki',aktif:true,lastLogin:''},

  ],
  barang: [
    {id:1,kode:'BRG001',nama:'Fotocopy A4 Hitam Putih',kategori:'Cetak',satuan:'Lembar',hargaBeli:150,hargaJual:300,stok:5000,stokMin:500,emoji:'fa-solid fa-file',img:'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120&h=120&fit=crop&auto=format'},
    {id:2,kode:'BRG002',nama:'Fotocopy A4 Warna',kategori:'Cetak',satuan:'Lembar',hargaBeli:500,hargaJual:1000,stok:2000,stokMin:300,emoji:'fa-solid fa-rainbow',img:'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=120&h=120&fit=crop&auto=format'},
    {id:3,kode:'BRG003',nama:'Print A4 HVS Hitam Putih',kategori:'Cetak',satuan:'Lembar',hargaBeli:200,hargaJual:1000,stok:3000,stokMin:500,emoji:'fa-solid fa-print',img:'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=120&h=120&fit=crop&auto=format'},
    {id:4,kode:'BRG004',nama:'Print A4 HVS Warna',kategori:'Cetak',satuan:'Lembar',hargaBeli:600,hargaJual:2000,stok:1500,stokMin:200,emoji:'fa-solid fa-palette',img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=120&fit=crop&auto=format'},
    {id:5,kode:'BRG005',nama:'Banner Outdoor 1x1m',kategori:'Banner',satuan:'m²',hargaBeli:18000,hargaJual:25000,stok:200,stokMin:20,emoji:'fa-solid fa-sign-hanging',img:'https://images.unsplash.com/photo-1614036417651-efe5912149d8?w=120&h=120&fit=crop&auto=format'},
    {id:6,kode:'BRG006',nama:'Banner Indoor 1x1m',kategori:'Banner',satuan:'m²',hargaBeli:20000,hargaJual:30000,stok:150,stokMin:15,emoji:'fa-solid fa-bullhorn',img:'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=120&h=120&fit=crop&auto=format'},
    {id:7,kode:'BRG007',nama:'Undangan 10x15cm',kategori:'Undangan',satuan:'Pcs',hargaBeli:2000,hargaJual:5000,stok:1000,stokMin:100,emoji:'fa-solid fa-envelope-open-text',img:'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=120&h=120&fit=crop&auto=format'},
    {id:8,kode:'BRG008',nama:'Kartu Nama Standard',kategori:'Kartu',satuan:'Pcs',hargaBeli:500,hargaJual:1500,stok:3000,stokMin:300,emoji:'fa-solid fa-id-card',img:'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=120&h=120&fit=crop&auto=format'},
    {id:9,kode:'BRG009',nama:'Stiker Vinyl A4',kategori:'Stiker',satuan:'Lembar',hargaBeli:5000,hargaJual:15000,stok:500,stokMin:50,emoji:'fa-solid fa-tag',img:'https://images.unsplash.com/photo-1527960669566-f882ba85a4c2?w=120&h=120&fit=crop&auto=format'},
    {id:10,kode:'BRG010',nama:'MMT 3x1m',kategori:'Banner',satuan:'m²',hargaBeli:18000,hargaJual:40000,stok:100,stokMin:10,emoji:'fa-solid fa-image',img:'https://images.unsplash.com/photo-1542601906897-ecd650ef4e96?w=120&h=120&fit=crop&auto=format'},
    {id:11,kode:'BRG011',nama:'Kalender Meja 2025',kategori:'Kalender',satuan:'Pcs',hargaBeli:15000,hargaJual:35000,stok:200,stokMin:20,emoji:'fa-solid fa-calendar',img:'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=120&h=120&fit=crop&auto=format'},
    {id:12,kode:'BRG012',nama:'Buku Nota 50 Lembar',kategori:'Nota',satuan:'Pcs',hargaBeli:8000,hargaJual:20000,stok:300,stokMin:30,emoji:'fa-solid fa-book',img:'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=120&h=120&fit=crop&auto=format'},
  ],
  kategori: [
    {id:1,nama:'Cetak',deskripsi:'Layanan cetak dokumen'},
    {id:2,nama:'Banner',deskripsi:'Banner dan spanduk'},
    {id:3,nama:'Undangan',deskripsi:'Cetak undangan'},
    {id:4,nama:'Kartu',deskripsi:'Kartu nama dan kartu lainnya'},
    {id:5,nama:'Stiker',deskripsi:'Stiker dan label'},
    {id:6,nama:'Kalender',deskripsi:'Kalender meja dan dinding'},
    {id:7,nama:'Nota',deskripsi:'Nota dan buku'},
  ],
  satuan: [
    {id:1,nama:'Lembar'},{id:2,nama:'Pcs'},{id:3,nama:'m²'},{id:4,nama:'Rim'},{id:5,nama:'Box'},{id:6,nama:'Set'},
  ],
  pelanggan: [
    {id:1,nama:'Perusahaan ABC',tlp:'0811234567',alamat:'Jl. Merdeka No. 10',email:'abc@mail.com',totalBeli:1850000,piutang:250000},
    {id:2,nama:'Budi Hartono',tlp:'0812345678',alamat:'Jl. Kenanga No. 5',email:'',totalBeli:950000,piutang:0},
    {id:3,nama:'Yayasan Nur Hidayah',tlp:'0823456789',alamat:'Jl. Pondok Baru No. 3',email:'',totalBeli:3200000,piutang:500000},
    {id:4,nama:'Toko Serba Ada',tlp:'0834567890',alamat:'Pasar Baru Kios 12',email:'',totalBeli:2100000,piutang:0},
    {id:5,nama:'SMA Negeri 1',tlp:'0845678901',alamat:'Jl. Pendidikan No. 1',email:'',totalBeli:5400000,piutang:150000},
  ],
  supplier: [
    {id:1,nama:'CV Kertas Jaya',tlp:'0811000001',alamat:'Jl. Industri No. 1',produk:'Kertas HVS, Art Paper'},
    {id:2,nama:'Toko Tinta Mandiri',tlp:'0822000002',alamat:'Jl. Percetakan No. 5',produk:'Tinta Printer, Toner'},
    {id:3,nama:'UD Bahan Sablon',tlp:'0833000003',alamat:'Jl. Bengkel No. 8',produk:'Bahan Banner, MMT'},
  ],
  metodePembayaran: [
    {id:1,nama:'Tunai',aktif:true,noRek:'',namaRek:''},
    {id:2,nama:'QRIS',aktif:true,noRek:'087742956126',namaRek:'TEFA BAHAGIA'},
    {id:3,nama:'Transfer BCA',aktif:true,noRek:'1234567890',namaRek:'TEFA BAHAGIA DIGITAL PRINT'},
    {id:4,nama:'Transfer BRI',aktif:true,noRek:'0987654321',namaRek:'TEFA BAHAGIA DIGITAL PRINT'},
    {id:5,nama:'Transfer BNI',aktif:true,noRek:'1122334455',namaRek:'TEFA BAHAGIA DIGITAL PRINT'},
    {id:6,nama:'OVO',aktif:true,noRek:'087742956126',namaRek:'TEFA BAHAGIA'},
    {id:7,nama:'GoPay',aktif:true,noRek:'087742956126',namaRek:'TEFA BAHAGIA'},
    {id:8,nama:'Dana',aktif:true,noRek:'087742956126',namaRek:'TEFA BAHAGIA'},
    {id:9,nama:'Cicilan',aktif:false,noRek:'',namaRek:''},
  ],
  notaJual: [],
  notaBeli: [],
  logLogin: [],
  pengaturanToko: {
    nama: 'TEFA BAHAGIA DIGITAL PRINT',
    tagline: 'Berkah & Bahagia Dalam Setiap Cetakan',
    alamat: 'Jl. Bahagia, Kota Cirebon',
    tlp: '087742956126',
    email: 'tefa.bahagia@gmail.com',
    logo: '🖨️',
  },
  hakAkses: {
    admin: ['dashboard','kasir','restock','laporan','master','pengaturan','profil'],
    kasir: ['dashboard','kasir','profil'],
  }
};

// ===== MENU CONFIG =====
const MENUS = {
  admin: [
    {id:'dashboard',icon:'<i class="fa-solid fa-gauge-high"></i>',label:'Dashboard',section:'Main'},
    {id:'kasir',icon:'<i class="fa-solid fa-cash-register"></i>',label:'Kasir / POS',section:'Main'},
    {id:'restock',icon:'<i class="fa-solid fa-box-open"></i>',label:'Restock Barang',section:'Main'},
    {id:'laporan',icon:'<i class="fa-solid fa-chart-line"></i>',label:'Laporan',section:'Laporan'},
    {id:'master-barang',icon:'<i class="fa-solid fa-folder-open"></i>',label:'Barang',section:'Data Master'},
    {id:'master-kategori',icon:'<i class="fa-solid fa-tags"></i>',label:'Kategori',section:'Data Master'},
    {id:'master-satuan',icon:'<i class="fa-solid fa-scale-balanced"></i>',label:'Satuan',section:'Data Master'},
    {id:'master-supplier',icon:'<i class="fa-solid fa-truck"></i>',label:'Supplier',section:'Data Master'},
    {id:'master-pelanggan',icon:'<i class="fa-solid fa-users"></i>',label:'Pelanggan',section:'Data Master'},
    {id:'master-metode',icon:'<i class="fa-solid fa-credit-card"></i>',label:'Metode Bayar',section:'Data Master'},
    {id:'pengaturan-log',icon:'<i class="fa-solid fa-clipboard-list"></i>',label:'Log Login',section:'Pengaturan'},
    {id:'pengaturan-user',icon:'<i class="fa-solid fa-user-gear"></i>',label:'Data User',section:'Pengaturan'},
    {id:'pengaturan-hak',icon:'<i class="fa-solid fa-shield-halved"></i>',label:'Hak Akses',section:'Pengaturan'},
    {id:'pengaturan-toko',icon:'<i class="fa-solid fa-store"></i>',label:'Profil Toko',section:'Pengaturan'},
    {id:'profil',icon:'<i class="fa-solid fa-circle-user"></i>',label:'Profil Saya',section:'Akun'},
  ],
  kasir: [
    {id:'dashboard',icon:'<i class="fa-solid fa-gauge-high"></i>',label:'Dashboard',section:'Main'},
    {id:'kasir',icon:'<i class="fa-solid fa-cash-register"></i>',label:'Kasir / POS',section:'Main'},
    {id:'profil',icon:'<i class="fa-solid fa-circle-user"></i>',label:'Profil Saya',section:'Akun'},
  ],
};
