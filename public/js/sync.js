/* ================================================================
   SYNC.JS — Persistence: Firestore (real-time, cloud) + localStorage (fallback)
   ================================================================ */

const FS_COL  = 'pos_tefa';
const FS_DOC  = 'data';
const FS_META = 'meta';
const LS_KEY  = 'tefa_pos_db';
const LS_CTR  = 'tefa_pos_ctr';

let _unsubscribeRT = null;   // unsubscribe function listener real-time Firestore
let _firebaseOK = false;     // status: apakah Firebase berhasil init & bisa dipakai
let _syncTimer = null;       // (reserved, dipakai jika perlu polling fallback)

/* ---------------------------------------------------------------
   saveDB() — simpan ke Firestore (jika online) + localStorage (selalu)
   --------------------------------------------------------------- */
async function saveDB() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(DB));
    localStorage.setItem(LS_CTR, String(appState.orderCounter));
  } catch (e) {
    console.warn('localStorage gagal menyimpan:', e);
  }

  updateSyncStatus('saving');

  if (!_firebaseOK || !window._firebase) {
    updateSyncStatus('offline');
    return;
  }
  try {
    const { db, doc, setDoc } = window._firebase;
    const nowTs = Date.now();
    window._lastSaveTs = nowTs;
    await setDoc(doc(db, FS_COL, FS_DOC), { ...DB, _ts: nowTs });
    await setDoc(doc(db, FS_COL, FS_META), { orderCounter: appState.orderCounter, _ts: Date.now() });
    updateSyncStatus('synced');
  } catch (e) {
    console.error('Firestore save gagal:', e);
    updateSyncStatus('error');
  }
}

/* ---------------------------------------------------------------
   loadDBAsync() — tunggu Firebase siap, lalu coba ambil data cloud.
   Jika cloud kosong/gagal → fallback ke localStorage.
   --------------------------------------------------------------- */
async function loadDBAsync() {
  if (!window._firebaseReady) {
    await new Promise((resolve) => {
      const t = setTimeout(resolve, 6000);
      document.addEventListener('firebase-ready', () => { clearTimeout(t); resolve(); }, { once: true });
    });
  }

  if (window._firebase) {
    _firebaseOK = true;
    try {
      const { db, doc, getDoc } = window._firebase;
      const snap = await getDoc(doc(db, FS_COL, FS_DOC));
      const snapMeta = await getDoc(doc(db, FS_COL, FS_META));

      if (snap.exists()) {
        const remote = snap.data();
        Object.keys(DB).forEach(k => { if (remote[k] !== undefined) DB[k] = remote[k]; });
        if (snapMeta.exists() && snapMeta.data().orderCounter) {
          appState.orderCounter = parseInt(snapMeta.data().orderCounter) || appState.orderCounter;
        }
        localStorage.setItem(LS_KEY, JSON.stringify(DB));
        localStorage.setItem(LS_CTR, String(appState.orderCounter));
        return true;
      }
      // Firestore kosong (project baru) → pakai data lokal apa adanya, lalu upload ke cloud
      const hasLocal = loadDB();
      if (!hasLocal) generateSampleData();
      await saveDB();
      return hasLocal;
    } catch (e) {
      console.warn('Firestore load gagal, pakai localStorage:', e);
      _firebaseOK = false;
    }
  }

  // Fallback total: tidak ada koneksi Firebase sama sekali
  const hasLocal = loadDB();
  if (!hasLocal) generateSampleData();
  return hasLocal;
}

/* ---------------------------------------------------------------
   loadDB() — sinkron, hanya dari localStorage (dipakai sbg fallback cepat)
   --------------------------------------------------------------- */
function loadDB() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    Object.keys(saved).forEach(k => { if (k in DB) DB[k] = saved[k]; });
    const ctr = localStorage.getItem(LS_CTR);
    if (ctr) appState.orderCounter = parseInt(ctr) || appState.orderCounter;
    return true;
  } catch (e) {
    return false;
  }
}

/* ---------------------------------------------------------------
   startRealtimeListener() — dengarkan perubahan Firestore live.
   Device lain yang menyimpan data akan otomatis ter-refresh di sini.
   --------------------------------------------------------------- */
function startRealtimeListener() {
  if (!_firebaseOK || !window._firebase) return;
  if (_unsubscribeRT) _unsubscribeRT();

  const { db, doc, onSnapshot } = window._firebase;
  _unsubscribeRT = onSnapshot(doc(db, FS_COL, FS_DOC),
    (snap) => {
      if (!snap.exists()) return;
      const remote = snap.data();
      const remoteTs = remote._ts || 0;
      // Hindari "menelan" balik perubahan yang baru kita simpan sendiri
      if (remoteTs > (window._lastSaveTs || 0) + 1500) {
        Object.keys(DB).forEach(k => { if (remote[k] !== undefined) DB[k] = remote[k]; });
        try { localStorage.setItem(LS_KEY, JSON.stringify(DB)); } catch (e) {}
        updateSyncStatus('synced');
        showToast('Data diperbarui dari device lain', 'info');
        if (appState.user) showPage(appState.currentPage);
      }
    },
    (err) => {
      console.warn('Realtime listener error:', err);
      updateSyncStatus('error');
    }
  );
}

/* ---------------------------------------------------------------
   pullCloudUpdate() — tarik manual data terbaru dari cloud
   --------------------------------------------------------------- */
async function pullCloudUpdate(silent = true) {
  if (!_firebaseOK || !window._firebase) {
    updateSyncStatus('offline');
    if (!silent) showToast('Firebase belum terkonfigurasi / offline.', 'warning');
    return false;
  }
  try {
    const { db, doc, getDoc } = window._firebase;
    const snap = await getDoc(doc(db, FS_COL, FS_DOC));
    if (snap.exists()) {
      const remote = snap.data();
      Object.keys(DB).forEach(k => { if (remote[k] !== undefined) DB[k] = remote[k]; });
      try { localStorage.setItem(LS_KEY, JSON.stringify(DB)); } catch (e) {}
      updateSyncStatus('synced');
      if (!silent) showToast('Data berhasil disinkronkan!', 'success');
      if (appState.user) showPage(appState.currentPage);
      return true;
    }
  } catch (e) {
    updateSyncStatus('error');
  }
  return false;
}

/* ---------------------------------------------------------------
   startAutoSync() — aktifkan listener real-time setelah login
   --------------------------------------------------------------- */
function startAutoSync() {
  startRealtimeListener();
  updateSyncStatus(_firebaseOK ? 'synced' : 'offline');
}

/* ---------------------------------------------------------------
   updateSyncStatus() — indikator status di topbar
   --------------------------------------------------------------- */
function updateSyncStatus(status) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  const map = {
    synced:  { icon: 'fa-cloud-check',          color: '#16a34a', bg: '#dcfce7', text: 'Real-time' },
    saving:  { icon: 'fa-rotate fa-spin',        color: '#d97706', bg: '#fef3c7', text: 'Menyimpan...' },
    offline: { icon: 'fa-cloud-arrow-up',        color: '#94a3b8', bg: '#f1f5f9', text: 'Mode Lokal' },
    error:   { icon: 'fa-triangle-exclamation',  color: '#dc2626', bg: '#fee2e2', text: 'Gagal Sync' },
  };
  const s = map[status] || map.synced;
  el.style.background = s.bg;
  el.style.color = s.color;
  const icon = el.querySelector('i');
  const label = el.querySelector('span');
  if (icon) icon.className = `fa-solid ${s.icon}`;
  if (label) label.textContent = s.text;
  el.style.opacity = '1';
}

function manualSync() {
  if (!_firebaseOK) {
    showToast('Firebase belum terkonfigurasi. Cek panduan setup di README.', 'warning');
    return;
  }
  showToast('Sedang sinkronisasi...', 'info');
  pullCloudUpdate(false);
}

/* ---------------------------------------------------------------
   Backup / Restore / Reset
   --------------------------------------------------------------- */
function exportBackup() {
  const blob = new Blob([JSON.stringify({ DB, orderCounter: appState.orderCounter }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'backup-tefa-' + today() + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Backup berhasil diunduh!', 'success');
}

function importBackupClick() {
  const input = document.getElementById('import-file-input');
  if (input) input.click();
}

async function importBackupFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.DB) { showToast('File backup tidak valid!', 'danger'); return; }
      const ok = await confirmAsync(
        'Import Backup',
        'Import backup akan menggantikan SEMUA data saat ini di cloud & lokal. Lanjutkan?'
      );
      if (!ok) return;
      Object.keys(data.DB).forEach(k => { if (k in DB) DB[k] = data.DB[k]; });
      if (data.orderCounter) appState.orderCounter = parseInt(data.orderCounter) || appState.orderCounter;
      window._lastSaveTs = Date.now();
      await saveDB();
      showToast('Backup berhasil diimpor dan disinkronkan!', 'success');
      showPage(appState.currentPage);
    } catch (err) {
      showToast('Gagal membaca file backup!', 'danger');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

function resetDataToko() {
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
    } catch (e) { console.warn('Firestore delete gagal:', e); }
  }
  showToast('Data direset. Memuat ulang...', 'warning');
  setTimeout(() => location.reload(), 1500);
}
