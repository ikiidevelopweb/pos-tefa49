/* ================================================================
   ROUTER.JS — Sidebar, navigasi antar halaman (SPA routing)
   ================================================================ */

function buildSidebar() {
  if (!appState.user) return;
  const role = appState.user.role;
  const menus = MENUS[role] || MENUS.kasir;
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  let html = '', lastSection = '';
  menus.forEach(m => {
    if (m.section !== lastSection) {
      if (lastSection) html += '</div>';
      html += `<div class="sidebar-section"><div class="sidebar-section-title">${escapeHtml(m.section)}</div>`;
      lastSection = m.section;
    }
    html += `<div class="nav-item" id="nav-${m.id}" onclick="showPage('${m.id}')"><span class="nav-icon">${m.icon}</span>${escapeHtml(m.label)}</div>`;
  });
  if (lastSection) html += '</div>';
  nav.innerHTML = html;
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('show');
}
function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
}

const PAGE_REGISTRY = {
  'dashboard':        pageDashboard,
  'kasir':             pageKasir,
  'restock':           pageRestock,
  'laporan':           pageLaporan,
  'master-barang':     pageMasterBarang,
  'master-kategori':   pageMasterKategori,
  'master-satuan':     pageMasterSatuan,
  'master-supplier':   pageMasterSupplier,
  'master-pelanggan':  pageMasterPelanggan,
  'master-metode':     pageMasterMetode,
  'pengaturan-log':    pageLogLogin,
  'pengaturan-user':   pageDataUser,
  'pengaturan-hak':    pageHakAkses,
  'pengaturan-toko':   pageProfilToko,
  'profil':            pageProfil,
  'notifications':     pageNotifications,
};

const PAGE_TITLES = {
  'dashboard': 'Dashboard', 'kasir': 'Kasir / POS', 'restock': 'Restock Barang',
  'laporan': 'Laporan', 'master-barang': 'Data Barang', 'master-kategori': 'Data Kategori',
  'master-satuan': 'Data Satuan', 'master-supplier': 'Data Supplier',
  'master-pelanggan': 'Data Pelanggan', 'master-metode': 'Metode Pembayaran',
  'pengaturan-log': 'Log Login', 'pengaturan-user': 'Data User',
  'pengaturan-hak': 'Hak Akses', 'pengaturan-toko': 'Profil Toko',
  'profil': 'Profil Saya', 'notifications': 'Notifikasi',
};

function showPage(id) {
  if (!appState.user) return;

  // Cek hak akses (kecuali notifications, selalu boleh)
  const role = appState.user.role;
  const allowed = DB.hakAkses[role] || [];
  const isMasterOrSettings = id.startsWith('master-') || id.startsWith('pengaturan-');
  const baseAllowed = allowed.includes(id) ||
    (isMasterOrSettings && (allowed.includes('master') || allowed.includes('pengaturan'))) ||
    id === 'notifications';

  if (!baseAllowed && role !== 'admin') {
    showToast('Anda tidak memiliki akses ke halaman ini.', 'danger');
    return;
  }

  appState.currentPage = id;
  closeSidebar();
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const nav = document.getElementById('nav-' + id);
  if (nav) nav.classList.add('active');

  document.getElementById('topbar-title').textContent = PAGE_TITLES[id] || id;
  const content = document.getElementById('page-content');
  const fn = PAGE_REGISTRY[id];
  if (fn) {
    content.innerHTML = '<div class="page-content">' + fn() + '</div>';
    afterRender(id);
  } else {
    content.innerHTML = '<div style="padding:40px;text-align:center;color:#94a3b8;font-size:18px;"><i class="fa-solid fa-triangle-exclamation"></i> Halaman belum tersedia</div>';
  }
}

function afterRender(id) {
  if (id === 'kasir') initKasir();
}
