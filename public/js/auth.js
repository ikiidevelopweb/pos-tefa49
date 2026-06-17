/* ================================================================
   AUTH.JS — Login, Logout, Session, User Menu
   ================================================================ */

async function doLogin() {
  const u = document.getElementById('l-user').value.trim();
  const p = document.getElementById('l-pass').value.trim();
  const r = document.getElementById('l-role').value;
  const errEl = document.getElementById('login-err');
  errEl.textContent = '';

  if (!u || !p) {
    errEl.textContent = 'Username dan password wajib diisi!';
    return;
  }

  const loginBtn = document.querySelector('.login-btn');
  const originalBtnHtml = loginBtn ? loginBtn.innerHTML : '';
  if (loginBtn) { loginBtn.disabled = true; loginBtn.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> Menghubungkan...'; }

  // Coba ambil data terbaru dari cloud sebelum verifikasi user,
  // supaya kalau ada user baru ditambah dari device lain tetap bisa login.
  try { await loadDBAsync(); } catch (e) { /* lanjut pakai data lokal */ }

  if (loginBtn) { loginBtn.disabled = false; loginBtn.innerHTML = originalBtnHtml; }

  const user = DB.users.find(x => x.username === u && x.password === p && x.role === r && x.aktif);
  if (!user) {
    errEl.textContent = 'Username, password, atau role salah!';
    updateSyncStatus(_firebaseOK ? 'synced' : 'offline');
    return;
  }

  appState.user = user;
  const now = new Date().toLocaleString('id-ID');
  user.lastLogin = now;
  DB.logLogin.unshift({
    user: user.nama, role: user.role, waktu: now,
    ip: '192.168.1.' + Math.floor(Math.random() * 255), status: 'Berhasil'
  });
  window._lastSaveTs = Date.now();
  saveDB();

  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';

  renderUserChrome(user);
  buildSidebar();
  showPage('dashboard');
  startClock();
  startAutoSync();
  showToast('Selamat datang, ' + user.nama + '!', 'success');
}

function renderUserChrome(user) {
  const roleLbl = user.role === 'admin' ? 'Administrator' : 'Kasir';
  const initial = (user.nama || '?')[0].toUpperCase();

  setText('sb-name', user.nama);
  setText('sb-role-label', roleLbl);
  setText('sb-avatar', initial);

  setText('tb-avatar', initial);
  setText('tb-name', user.nama);
  setText('tb-role', roleLbl);
  setText('dd-avatar', initial);
  setText('dd-name', user.nama);
  setText('dd-role', roleLbl);

  if (user.role !== 'admin') {
    hideEl('dd-settings-btn');
    hideEl('dd-backup-btn');
  } else {
    showEl('dd-settings-btn');
    showEl('dd-backup-btn');
  }
}

function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function hideEl(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
function showEl(id) { const el = document.getElementById(id); if (el) el.style.display = 'flex'; }

function doLogout() {
  if (_unsubscribeRT) { _unsubscribeRT(); _unsubscribeRT = null; }
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-err').textContent = '';
  appState.user = null;
  appState.cart = [];
  closeModal();
}

function showLogoutModal() {
  const user = appState.user;
  if (!user) return;
  const roleLbl = user.role === 'admin' ? 'Administrator' : 'Kasir';
  openModal(`
    <div class="modal-body" style="padding:32px 28px;text-align:center;">
      <div class="logout-modal-avatar">${user.nama[0]}</div>
      <div style="font-size:18px;font-weight:800;color:var(--text);margin-bottom:4px;">${user.nama}</div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:6px;">${roleLbl}</div>
      <div style="display:inline-flex;align-items:center;gap:5px;background:var(--primary-light);color:var(--primary);padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;margin-bottom:22px;">
        <i class="fa-solid fa-circle" style="font-size:7px;color:#10b981;"></i> Sedang Aktif
      </div>
      <div style="background:#fff8f0;border:1.5px solid #fed7aa;border-radius:12px;padding:16px 18px;margin-bottom:24px;">
        <div style="font-size:15px;font-weight:700;color:#9a3412;margin-bottom:6px;"><i class="fa-solid fa-right-from-bracket"></i> Keluar dari Sistem?</div>
        <div style="font-size:13px;color:#c2410c;line-height:1.6;">Sesi Anda akan diakhiri. Pastikan semua transaksi sudah tersimpan sebelum keluar.</div>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-outline" style="flex:1;font-size:14px;padding:12px;" onclick="closeModal()">
          <i class="fa-solid fa-arrow-left"></i> Batal
        </button>
        <button class="btn btn-danger" style="flex:1;font-size:14px;padding:12px;" onclick="doLogout()">
          <i class="fa-solid fa-right-from-bracket"></i> Ya, Keluar
        </button>
      </div>
    </div>
  `, 'modal-sm');
}

function toggleUserMenu() {
  const dd = document.getElementById('user-dropdown');
  const chevron = document.getElementById('user-chevron');
  const btn = document.getElementById('topbar-user-btn');
  if (!dd) return;
  const isOpen = dd.style.display === 'block';
  dd.style.display = isOpen ? 'none' : 'block';
  if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
  if (btn) {
    btn.style.borderColor = isOpen ? 'var(--border)' : 'var(--primary)';
    btn.style.background = isOpen ? 'var(--bg)' : 'var(--primary-light)';
  }
}

function closeUserMenu() {
  const dd = document.getElementById('user-dropdown');
  const chevron = document.getElementById('user-chevron');
  const btn = document.getElementById('topbar-user-btn');
  if (dd) dd.style.display = 'none';
  if (chevron) chevron.style.transform = '';
  if (btn) { btn.style.borderColor = 'var(--border)'; btn.style.background = 'var(--bg)'; }
}

// Tutup dropdown saat klik di luar area menu
document.addEventListener('click', function (e) {
  const wrap = document.getElementById('user-menu-wrap');
  if (wrap && !wrap.contains(e.target)) closeUserMenu();
});

// Tutup sidebar/topbar dropdown saat tekan Escape (aksesibilitas)
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeUserMenu();
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer && modalContainer.innerHTML.trim()) closeModal();
  }
});

/* ---------------------------------------------------------------
   confirmAsync — pengganti window.confirm() berbasis modal,
   supaya konsisten dengan tampilan & berjalan di semua browser
   (window.confirm bisa diblokir di beberapa WebView/iframe).
   --------------------------------------------------------------- */
function confirmAsync(title, message) {
  return new Promise((resolve) => {
    openModal(`
      <div class="modal-header"><span class="modal-title">${title}</span><button class="modal-close" onclick="_confirmResolve(false)">×</button></div>
      <div class="modal-body"><p style="font-size:13px;color:var(--text2);line-height:1.7;">${message}</p></div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="_confirmResolve(false)">Batal</button>
        <button class="btn btn-danger" onclick="_confirmResolve(true)">Ya, Lanjutkan</button>
      </div>
    `, 'modal-sm');
    window._confirmResolve = (val) => { closeModal(); delete window._confirmResolve; resolve(val); };
  });
}
