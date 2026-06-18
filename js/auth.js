// ===== AUTH =====
async function doLogin(){
  const u = document.getElementById('l-user').value.trim();
  const p = document.getElementById('l-pass').value.trim();
  const r = document.getElementById('l-role').value;

  // Coba load data terbaru dari cloud sebelum cek user
  updateSyncStatus('saving');
  const loginBtn = document.querySelector('.login-btn');
  if (loginBtn) { loginBtn.disabled = true; loginBtn.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> Menghubungkan...'; }
  try { await loadDBAsync(); } catch(e) {}
  if (loginBtn) { loginBtn.disabled = false; loginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Masuk'; }

  const user = DB.users.find(x=>x.username===u && x.password===p && x.role===r && x.aktif);
  if(!user){
    document.getElementById('login-err').textContent='Username, password, atau role salah!';
    updateSyncStatus('synced');
    return;
  }
  appState.user = user;
  const now = new Date().toLocaleString('id-ID');
  user.lastLogin = now;
  DB.logLogin.unshift({user:user.nama,role:user.role,waktu:now,ip:'192.168.1.'+Math.floor(Math.random()*255),status:'Berhasil'});
  window._lastSaveTs = Date.now();
  saveDB();
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='flex';
  // Sidebar footer
  document.getElementById('sb-name').textContent=user.nama;
  document.getElementById('sb-role-label').textContent=user.role==='admin'?'Administrator':'Kasir';
  document.getElementById('sb-avatar').textContent=user.nama[0];
  // Topbar user menu
  const roleLbl = user.role==='admin'?'Administrator':'Kasir';
  document.getElementById('tb-avatar').textContent=user.nama[0];
  document.getElementById('tb-name').textContent=user.nama;
  document.getElementById('tb-role').textContent=roleLbl;
  document.getElementById('dd-avatar').textContent=user.nama[0];
  document.getElementById('dd-name').textContent=user.nama;
  document.getElementById('dd-role').textContent=roleLbl;
  // Hide admin-only items for kasir
  if(user.role!=='admin'){
    const s=document.getElementById('dd-settings-btn'); if(s) s.style.display='none';
    const b=document.getElementById('dd-backup-btn'); if(b) b.style.display='none';
  }
  buildSidebar();
  showPage('dashboard');
  startClock();
  startAutoSync();
  showToast('Selamat datang, '+user.nama+'!','success');
}

async function manualSync(){
  showToast('Sedang sinkronisasi...', 'info');
  if (!_firebaseOK || !window._firebase) {
    // Coba sambungkan ulang — mungkin sudah diperbaiki di Firebase Console
    await loadDBAsync();
    if (!_firebaseOK) {
      showToast(_lastFirebaseError || 'Firebase belum tersambung. Cek panduan setup.', 'warning');
      return;
    }
    showToast('Berhasil tersambung ke Firebase!', 'success');
    startAutoSync();
    if (appState.user) showPage(appState.currentPage);
    return;
  }
  pullCloudUpdate(false);
}

function doLogout(){
  // Hentikan listener real-time Firestore agar tidak terus berjalan setelah logout
  if (typeof _unsubscribeRT === 'function') { _unsubscribeRT(); _unsubscribeRT = null; }
  if (typeof _clockTimer !== 'undefined' && _clockTimer) { clearInterval(_clockTimer); _clockTimer = null; }
  document.getElementById('app').style.display='none';
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('login-err').textContent='';
  appState.user=null;
  appState.cart=[];
  closeModal();
  showToast('Anda telah keluar dari sistem','info');
}

function showLogoutModal(){
  const user = appState.user;
  if(!user) return;
  const roleLbl = user.role==='admin'?'Administrator':'Kasir';
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

function toggleUserMenu(){
  const dd = document.getElementById('user-dropdown');
  const chevron = document.getElementById('user-chevron');
  const btn = document.getElementById('topbar-user-btn');
  const isOpen = dd.style.display === 'block';
  dd.style.display = isOpen ? 'none' : 'block';
  chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
  btn.style.borderColor = isOpen ? 'var(--border)' : 'var(--primary)';
  btn.style.background = isOpen ? 'var(--bg)' : 'var(--primary-light)';
}

function closeUserMenu(){
  const dd = document.getElementById('user-dropdown');
  const chevron = document.getElementById('user-chevron');
  const btn = document.getElementById('topbar-user-btn');
  if(dd) dd.style.display = 'none';
  if(chevron) chevron.style.transform = '';
  if(btn){ btn.style.borderColor='var(--border)'; btn.style.background='var(--bg)'; }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e){
  const wrap = document.getElementById('user-menu-wrap');
  if(wrap && !wrap.contains(e.target)) closeUserMenu();
});

// ===== CLOCK =====
let _clockTimer = null;
function startClock(){
  function tick(){
    const now = new Date();
    const el = document.getElementById('clock-display');
    if (el) el.textContent = now.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  }
  if (_clockTimer) clearInterval(_clockTimer);
  tick();
  _clockTimer = setInterval(tick,1000);
}

// ===== SIDEBAR =====
function buildSidebar(){
  const role = appState.user.role;
  const menus = MENUS[role];
  const nav = document.getElementById('sidebar-nav');
  let html='', lastSection='';
  menus.forEach(m=>{
    if(m.section !== lastSection){
      if(lastSection) html+='</div>';
      html+=`<div class="sidebar-section"><div class="sidebar-section-title">${m.section}</div>`;
      lastSection=m.section;
    }
    html+=`<div class="nav-item" id="nav-${m.id}" onclick="showPage('${m.id}')"><span class="nav-icon">${m.icon}</span>${m.label}</div>`;
  });
  if(lastSection) html+='</div>';
  nav.innerHTML=html;
}

function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('show');
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

// ===== PAGE ROUTING =====
function showPage(id){
  appState.currentPage=id;
  closeSidebar();
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));
  const nav = document.getElementById('nav-'+id);
  if(nav) nav.classList.add('active');
  const pages = {
    'dashboard': pageDashboard,
    'kasir': pageKasir,
    'restock': pageRestock,
    'laporan': pageLaporan,
    'master-barang': pageMasterBarang,
    'master-kategori': pageMasterKategori,
    'master-satuan': pageMasterSatuan,
    'master-supplier': pageMasterSupplier,
    'master-pelanggan': pageMasterPelanggan,
    'master-metode': pageMasterMetode,
    'pengaturan-log': pageLogLogin,
    'pengaturan-user': pageDataUser,
    'pengaturan-hak': pageHakAkses,
    'pengaturan-toko': pageProfilToko,
    'profil': pageProfil,
    'notifications': pageNotifications,
  };
  const titles = {
    'dashboard':'Dashboard','kasir':'Kasir / POS','restock':'Restock Barang',
    'laporan':'Laporan','master-barang':'Data Barang','master-kategori':'Data Kategori',
    'master-satuan':'Data Satuan','master-supplier':'Data Supplier',
    'master-pelanggan':'Data Pelanggan','master-metode':'Metode Pembayaran',
    'pengaturan-log':'Log Login','pengaturan-user':'Data User',
    'pengaturan-hak':'Hak Akses','pengaturan-toko':'Profil Toko',
    'profil':'Profil Saya','notifications':'Notifikasi',
  };
  document.getElementById('topbar-title').textContent = titles[id]||id;
  const content = document.getElementById('page-content');
  const fn = pages[id];
  if(fn) { content.innerHTML='<div class="page-content">'+fn()+'</div>'; afterRender(id); }
  else content.innerHTML='<div style="padding:40px;text-align:center;color:#94a3b8;font-size:18px;"><i class="fa-solid fa-triangle-exclamation"></i> Halaman belum tersedia</div>';
}

function afterRender(id){
  if(id==='kasir') initKasir();
}

