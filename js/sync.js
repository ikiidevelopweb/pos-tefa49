// ===== PERSISTENCE — FIREBASE FIRESTORE REAL-TIME =====
// Koleksi Firestore: "pos_tefa" → document "data" (semua DB)
//                    "pos_tefa" → document "meta" (orderCounter)
const FS_COL  = 'pos_tefa';
const FS_DOC  = 'data';
const FS_META = 'meta';
const LS_KEY  = 'tefa_pos_db';   // localStorage fallback
const LS_CTR  = 'tefa_pos_ctr';
let _unsubscribeRT = null;        // listener real-time Firestore
let _firebaseOK = false;          // apakah Firebase berhasil init
let _lastFirebaseError = '';      // alasan gagal terakhir (ditampilkan ke user)

// --- explainFirebaseError: ubah kode error teknis jadi penjelasan yang mudah dipahami ---
function explainFirebaseError(e){
  const code = e && e.code ? e.code : '';
  const map = {
    'permission-denied': 'Akses ditolak oleh Firestore Security Rules. Pastikan provider "Anonymous" di Firebase Authentication sudah Enabled, dan Rules sudah di-Publish (lihat firestore.rules).',
    'unauthenticated': 'Sesi login anonim ke Firebase belum berhasil. Aktifkan provider "Anonymous" di Firebase Console → Authentication → Sign-in method.',
    'unavailable': 'Tidak bisa menghubungi server Firebase (cek koneksi internet, atau domain *.googleapis.com / *.gstatic.com mungkin diblokir jaringan/firewall).',
    'not-found': 'Database Firestore belum dibuat. Buka Firebase Console → Build → Firestore Database → Create database.',
    'failed-precondition': 'Firestore Database belum diaktifkan untuk project ini.',
    'auth/configuration-not-found': 'Provider "Anonymous" belum diaktifkan di Firebase Console → Authentication → Sign-in method.',
    'auth/admin-restricted-operation': 'Sign-in anonim dinonaktifkan oleh admin project. Aktifkan provider "Anonymous" di Firebase Console.',
  };
  return map[code] || (e && e.message ? e.message : 'Terjadi error tidak dikenal saat menghubungi Firebase.');
}

// ===== FIREBASE PERSISTENCE FUNCTIONS =====

// --- saveDB: simpan ke Firestore + localStorage fallback ---
async function saveDB() {
  // Selalu simpan lokal dulu (instant, fallback kalau offline)
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(DB));
    localStorage.setItem(LS_CTR, String(appState.orderCounter));
  } catch(e) {}

  updateSyncStatus('saving');

  if (!_firebaseOK || !window._firebase) {
    updateSyncStatus('offline');
    return;
  }
  try {
    const { db, doc, setDoc } = window._firebase;
    // Simpan seluruh DB sebagai satu dokumen
    const nowTs = Date.now();
    window._lastSaveTs = nowTs;
    await setDoc(doc(db, FS_COL, FS_DOC), {
      ...DB,
      _ts: nowTs
    });
    // Simpan orderCounter terpisah
    await setDoc(doc(db, FS_COL, FS_META), {
      orderCounter: appState.orderCounter,
      _ts: Date.now()
    });
    updateSyncStatus('synced');
  } catch(e) {
    _lastFirebaseError = explainFirebaseError(e);
    console.error('Firestore save gagal:', _lastFirebaseError, e);
    updateSyncStatus('error');
  }
}

// --- loadDBAsync: load dari Firestore, fallback localStorage ---
async function loadDBAsync() {
  // Tunggu Firebase siap (max 5 detik)
  if (!window._firebaseReady) {
    await new Promise((resolve) => {
      const t = setTimeout(resolve, 5000);
      document.addEventListener('firebase-ready', () => { clearTimeout(t); resolve(); }, { once: true });
    });
  }

  if (window._firebase) {
    _firebaseOK = true;
    _lastFirebaseError = '';
    showFirebaseBanner(false);
    try {
      const { db, doc, getDoc } = window._firebase;
      const snap = await getDoc(doc(db, FS_COL, FS_DOC));
      const snapMeta = await getDoc(doc(db, FS_COL, FS_META));

      if (snap.exists()) {
        const remote = snap.data();
        // Merge setiap key DB dari Firestore
        Object.keys(DB).forEach(k => {
          if (remote[k] !== undefined) DB[k] = remote[k];
        });
        if (snapMeta.exists() && snapMeta.data().orderCounter) {
          appState.orderCounter = parseInt(snapMeta.data().orderCounter) || appState.orderCounter;
        }
        // Update localStorage
        localStorage.setItem(LS_KEY, JSON.stringify(DB));
        localStorage.setItem(LS_CTR, String(appState.orderCounter));
        return true;
      }
      // Firestore kosong → gunakan data lokal lalu upload
      loadDB(); // sync dari localStorage
      return false;
    } catch(e) {
      _lastFirebaseError = explainFirebaseError(e);
      console.warn('Firestore load gagal:', _lastFirebaseError, e);
      _firebaseOK = false;
      showFirebaseBanner(true);
    }
  } else {
    _lastFirebaseError = 'SDK Firebase gagal dimuat (cek koneksi internet atau konfigurasi di js/firebase-config.js).';
    showFirebaseBanner(true);
  }

  // Fallback: localStorage
  return loadDB();
}

// --- loadDB sinkron (localStorage saja, dipanggil di awal) ---
function loadDB() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    Object.keys(saved).forEach(k => { if (k in DB) DB[k] = saved[k]; });
    const ctr = localStorage.getItem(LS_CTR);
    if (ctr) appState.orderCounter = parseInt(ctr) || appState.orderCounter;
    return true;
  } catch(e) { return false; }
}

// --- startRealtimeListener: dengarkan perubahan Firestore secara real-time ---
function startRealtimeListener() {
  if (!_firebaseOK || !window._firebase) return;
  // Hentikan listener lama jika ada
  if (_unsubscribeRT) _unsubscribeRT();

  const { db, doc, onSnapshot } = window._firebase;
  _unsubscribeRT = onSnapshot(doc(db, FS_COL, FS_DOC),
    (snap) => {
      if (!snap.exists()) return;
      const remote = snap.data();
      const remoteTs = remote._ts || 0;
      // Hanya update jika data lebih baru (bukan dari save kita sendiri)
      if (remoteTs > (window._lastSaveTs || 0) + 2000) {
        Object.keys(DB).forEach(k => {
          if (remote[k] !== undefined) DB[k] = remote[k];
        });
        localStorage.setItem(LS_KEY, JSON.stringify(DB));
        updateSyncStatus('synced');
        showToast('Data diperbarui dari device lain', 'info');
        // Refresh halaman aktif
        if (appState.user) showPage(appState.currentPage);
      }
    },
    (err) => {
      console.warn('Realtime listener error:', err);
      updateSyncStatus('error');
    }
  );
}

// --- pullCloudUpdate: manual refresh ---
async function pullCloudUpdate(silent = true) {
  if (!_firebaseOK || !window._firebase) {
    updateSyncStatus('offline');
    return false;
  }
  try {
    const { db, doc, getDoc } = window._firebase;
    const snap = await getDoc(doc(db, FS_COL, FS_DOC));
    if (snap.exists()) {
      const remote = snap.data();
      Object.keys(DB).forEach(k => {
        if (remote[k] !== undefined) DB[k] = remote[k];
      });
      localStorage.setItem(LS_KEY, JSON.stringify(DB));
      updateSyncStatus('synced');
      if (!silent) showToast('Data berhasil disinkronkan!', 'success');
      if (appState.user) showPage(appState.currentPage);
      return true;
    }
  } catch(e) {
    _lastFirebaseError = explainFirebaseError(e);
    console.warn('pullCloudUpdate gagal:', _lastFirebaseError, e);
    updateSyncStatus('error');
  }
  return false;
}

// --- startAutoSync: ganti ke realtime listener ---
function startAutoSync() {
  startRealtimeListener();
  updateSyncStatus('synced');
}

// --- updateSyncStatus: tampilkan status di topbar ---
function updateSyncStatus(status) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  const map = {
    synced:  { icon:'fa-cloud-check',       color:'#16a34a', bg:'#dcfce7', text:'Real-time' },
    saving:  { icon:'fa-rotate fa-spin',    color:'#d97706', bg:'#fef3c7', text:'Menyimpan...' },
    offline: { icon:'fa-cloud-arrow-up',    color:'#94a3b8', bg:'#f1f5f9', text:'Mode Lokal' },
    error:   { icon:'fa-triangle-exclamation', color:'#dc2626', bg:'#fee2e2', text:'Gagal Sync' },
  };
  const s = map[status] || map.synced;
  el.style.background = s.bg;
  el.style.color = s.color;
  el.querySelector('i').className = `fa-solid ${s.icon}`;
  el.querySelector('span').textContent = s.text;
  el.style.opacity = '1';
}

function flashSaveIndicator(state) {
  // Delegate to sync status indicator
  if (state === 'saving') updateSyncStatus('saving');
  else updateSyncStatus('synced');
}

function exportBackup() {
  const blob = new Blob([JSON.stringify({DB, orderCounter: appState.orderCounter}, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'backup-tefa-' + today() + '.json';
  a.click();
  showToast('Backup berhasil diunduh!', 'success');
}

async function resetDataToko() {
  openModal(`
    <div class="modal-body" style="padding:32px 28px;text-align:center;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#ef4444,#f87171);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;color:#fff;margin:0 auto 16px;"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <div style="font-size:18px;font-weight:800;color:var(--text);margin-bottom:8px;">Reset Semua Data?</div>
      <div style="background:#fee2e2;border:1.5px solid #fca5a5;border-radius:12px;padding:14px 16px;margin-bottom:22px;text-align:left;">
        <div style="font-size:13px;color:#991b1b;line-height:1.7;">
          <i class="fa-solid fa-circle-xmark"></i> Semua transaksi penjualan<br>
          <i class="fa-solid fa-circle-xmark"></i> Data pelanggan & perubahan barang<br>
          <i class="fa-solid fa-circle-xmark"></i> Riwayat restock & pengaturan<br>
          <div style="margin-top:8px;font-weight:700;">Tindakan ini tidak dapat dibatalkan!</div>
        </div>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-outline" style="flex:1;padding:12px;" onclick="closeModal()"><i class="fa-solid fa-arrow-left"></i> Batal</button>
        <button class="btn btn-danger" style="flex:1;padding:12px;" onclick="closeModal();_doResetData()"><i class="fa-solid fa-trash"></i> Ya, Reset</button>
      </div>
    </div>
  `, 'modal-sm');
}

async function _doResetData() {
  localStorage.removeItem(LS_KEY);
  localStorage.removeItem(LS_CTR);
  if (_firebaseOK && window._firebase) {
    try {
      const { db, doc, deleteDoc } = window._firebase;
      await deleteDoc(doc(db, FS_COL, FS_DOC));
      await deleteDoc(doc(db, FS_COL, FS_META));
    } catch(e) { console.warn('Firestore delete gagal:', e); }
  }
  showToast('Data direset. Memuat ulang...', 'warning');
  setTimeout(() => location.reload(), 1500);
}

// --- showFirebaseGuide: tampilkan panduan setup Firebase (dipanggil dari banner login) ---
function showFirebaseGuide(){
  const reasonHtml = _lastFirebaseError
    ? `<div style="background:#fee2e2;border:1.5px solid #fca5a5;border-radius:9px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#991b1b;"><i class="fa-solid fa-circle-exclamation"></i> <strong>Penyebab terdeteksi:</strong> ${_lastFirebaseError}</div>`
    : '';
  openModal(`
    <div class="modal-header"><span class="modal-title"><i class="fa-solid fa-cloud"></i> Panduan Setup Firebase</span><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      ${reasonHtml}
      <ol style="font-size:13px;color:var(--text2);line-height:2;padding-left:18px;">
        <li>Buka <a href="https://console.firebase.google.com" target="_blank" rel="noopener">Firebase Console</a> dan pilih/buat project Anda.</li>
        <li>Masuk ke menu <strong>Build → Firestore Database</strong>, lalu klik <strong>Create database</strong> (pilih lokasi server terdekat, mis. asia-southeast2).</li>
        <li>Masuk ke tab <strong>Rules</strong> dan terapkan aturan keamanan yang membutuhkan login (lihat berkas README.md aplikasi ini untuk contoh rule yang aman).</li>
        <li>Masuk ke menu <strong>Build → Authentication → Sign-in method</strong>, aktifkan provider <strong>Anonymous</strong>.</li>
        <li>Salin konfigurasi project (Project settings → ikon &lt;/&gt; Web app) ke berkas <code>js/firebase-config.js</code> pada bagian <code>firebaseConfig</code>.</li>
        <li>Simpan, lalu klik ikon sinkronisasi di pojok kanan atas untuk mencoba lagi (tidak perlu reload halaman).</li>
      </ol>
      <div style="background:var(--primary-light);border-radius:9px;padding:10px 14px;margin-top:10px;font-size:12px;color:var(--primary);">
        <i class="fa-solid fa-circle-info"></i> Selama Firebase belum tersambung, data tetap aman tersimpan di penyimpanan lokal perangkat ini (mode offline), namun tidak akan tersinkron ke device lain.
      </div>
    </div>
    <div class="modal-footer"><button class="btn btn-primary" onclick="closeModal()">Mengerti</button></div>
  `, 'modal-sm');
}

function showFirebaseBanner(show){
  const b = document.getElementById('fb-banner');
  if (!b) return;
  b.style.display = show ? 'block' : 'none';
  if (show) {
    const reasonEl = b.querySelector('#fb-banner-reason');
    if (reasonEl) reasonEl.textContent = _lastFirebaseError || 'Belum berhasil terhubung ke Firebase.';
  }
}

// Load saved data. If none found, generate sample data once then save.
const _hasSavedData = loadDB();

// Generate sample transactions
(function generateSampleData(){
  if (_hasSavedData) return; // skip – data already loaded from localStorage
  const now = new Date();
  for(let i=0;i<15;i++){
    const d = new Date(now);
    d.setDate(d.getDate() - Math.floor(Math.random()*30));
    const items = [];
    const numItems = Math.floor(Math.random()*3)+1;
    let total = 0;
    for(let j=0;j<numItems;j++){
      const b = DB.barang[Math.floor(Math.random()*DB.barang.length)];
      const qty = Math.floor(Math.random()*10)+1;
      const sub = b.hargaJual * qty;
      total += sub;
      items.push({id:b.id,nama:b.nama,qty,harga:b.hargaJual,subtotal:sub});
    }
    const cust = DB.pelanggan[Math.floor(Math.random()*DB.pelanggan.length)];
    const metode = DB.metodePembayaran[Math.floor(Math.random()*4)];
    const dp = Math.random()>0.7 ? Math.floor(total*0.5/1000)*1000 : total;
    const lunas = dp >= total;
    DB.notaJual.push({
      id: 1000+i,
      noNota: 'NJ'+String(1000+i),
      tanggal: d.toISOString().split('T')[0],
      pelanggan: cust.nama,
      pelangganId: cust.id,
      items,
      total,
      dp,
      sisa: total - dp,
      lunas,
      metode: metode.nama,
      kasir: Math.random()>0.5 ? 'Ahmad Fauzi' : 'Siti Rahayu',
      status: lunas ? 'Lunas' : 'DP',
      statusOrder: ['Design','Printing','Finishing','Ready','Diambil'][Math.floor(Math.random()*5)],
    });
  }
  for(let i=0;i<8;i++){
    const d = new Date(now);
    d.setDate(d.getDate() - Math.floor(Math.random()*30));
    const sup = DB.supplier[Math.floor(Math.random()*DB.supplier.length)];
    const b = DB.barang[Math.floor(Math.random()*DB.barang.length)];
    const qty = Math.floor(Math.random()*500)+50;
    const total = b.hargaBeli * qty;
    DB.notaBeli.push({
      id: 2000+i,
      noNota: 'NB'+String(2000+i),
      tanggal: d.toISOString().split('T')[0],
      supplier: sup.nama,
      barang: b.nama,
      qty,
      hargaBeli: b.hargaBeli,
      total,
    });
  }
  saveDB(); // simpan data awal ke localStorage
})();
