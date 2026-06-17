/* ================================================================
   PAGE-PENGATURAN.JS — Log Login, Data User, Hak Akses,
   Profil Toko, Profil Saya, Notifikasi
   ================================================================ */

/* ---------------- LOG LOGIN ---------------- */
function pageLogLogin() {
  const count = DB.logLogin.length;
  return `
  <div class="page-header">
    <div class="page-header-left"><h2><i class="fa-solid fa-clipboard-list"></i> Log Login</h2><p>Riwayat aktivitas login pengguna</p></div>
    ${count > 0 ? `<button class="btn btn-danger" onclick="confirmHapusLog()"><i class="fa-solid fa-trash-can"></i> Hapus Riwayat</button>` : ''}
  </div>
  <div class="card"><div class="card-body" style="padding:0;"><div class="table-wrapper"><table>
    <thead><tr><th>#</th><th>Pengguna</th><th>Role</th><th>Waktu</th><th>IP</th><th>Status</th></tr></thead>
    <tbody>${DB.logLogin.map((l, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(l.user)}</td><td><span class="badge ${l.role === 'admin' ? 'badge-purple' : 'badge-info'}">${escapeHtml(l.role)}</span></td><td>${escapeHtml(l.waktu)}</td><td>${escapeHtml(l.ip)}</td><td><span class="badge badge-success">${escapeHtml(l.status)}</span></td></tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text3);"><i class="fa-solid fa-inbox" style="font-size:24px;display:block;margin-bottom:8px;"></i>Belum ada riwayat login</td></tr>'}</tbody>
  </table></div></div></div>`;
}

function confirmHapusLog() {
  openModal(`
    <div class="modal-header">
      <span class="modal-title" style="color:var(--danger);"><i class="fa-solid fa-trash-can"></i> Hapus Riwayat Login</span>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div style="background:#fff5f5;border:1.5px solid #fca5a5;border-radius:10px;padding:16px;margin-bottom:4px;">
        <p style="font-size:13px;color:var(--text2);line-height:1.8;">Semua <strong>${DB.logLogin.length} riwayat aktivitas login</strong> akan dihapus permanen dan tidak dapat dikembalikan.</p>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Batal</button>
      <button class="btn btn-danger" onclick="doHapusLog()"><i class="fa-solid fa-trash-can"></i> Hapus Semua</button>
    </div>
  `, 'modal-sm');
}

async function doHapusLog() {
  DB.logLogin = [];
  await saveDB();
  closeModal();
  showToast('Riwayat login berhasil dihapus', 'success');
  showPage('pengaturan-log');
}

/* ---------------- DATA USER ---------------- */
function pageDataUser() {
  return `
  <div class="page-header"><div class="page-header-left"><h2><i class="fa-solid fa-user-gear"></i> Data User</h2></div><button class="btn btn-primary" onclick="modalTambahUser()"><i class="fa-solid fa-plus"></i> Tambah User</button></div>
  <div class="card"><div class="card-body" style="padding:0;"><div class="table-wrapper"><table>
    <thead><tr><th>#</th><th>Nama</th><th>Username</th><th>Role</th><th>Status</th><th>Last Login</th><th>Aksi</th></tr></thead>
    <tbody>${DB.users.map((u, i) => `<tr>
      <td>${i + 1}</td>
      <td><strong>${escapeHtml(u.nama)}</strong></td>
      <td>${escapeHtml(u.username)}</td>
      <td><span class="badge ${u.role === 'admin' ? 'badge-purple' : 'badge-info'}">${escapeHtml(u.role)}</span></td>
      <td><span class="badge ${u.aktif ? 'badge-success' : 'badge-gray'}">${u.aktif ? 'Aktif' : 'Nonaktif'}</span></td>
      <td style="font-size:11px;">${escapeHtml(u.lastLogin || '-')}</td>
      <td><button class="btn btn-outline btn-xs" onclick="editUser(${i})"><i class="fa-solid fa-pen-to-square"></i></button> <button class="btn btn-danger btn-xs" onclick="hapusUser(${i})"><i class="fa-solid fa-trash"></i></button></td>
    </tr>`).join('')}</tbody>
  </table></div></div></div>`;
}
function modalTambahUser(idx = -1) {
  const u = idx >= 0 ? DB.users[idx] : {};
  openModal(`<div class="modal-header"><span class="modal-title">${idx >= 0 ? 'Edit' : 'Tambah'} User</span><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body"><div class="form-grid form-grid-2">
    <div class="form-group"><label class="form-label">Nama Lengkap</label><input id="u-nama" class="form-control" value="${escapeHtml(u.nama || '')}"/></div>
    <div class="form-group"><label class="form-label">Username</label><input id="u-uname" class="form-control" value="${escapeHtml(u.username || '')}"/></div>
    <div class="form-group"><label class="form-label">Password</label><input type="password" id="u-pass" class="form-control" value="" placeholder="${idx >= 0 ? 'Kosongkan jika tidak diubah' : 'Wajib diisi'}"/></div>
    <div class="form-group"><label class="form-label">Role</label><select id="u-role" class="form-control"><option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option><option value="kasir" ${u.role === 'kasir' ? 'selected' : ''}>Kasir</option></select></div>
    <div class="form-group"><label class="form-label">Status</label><select id="u-aktif" class="form-control"><option value="1" ${u.aktif !== false ? 'selected' : ''}>Aktif</option><option value="0" ${u.aktif === false ? 'selected' : ''}>Nonaktif</option></select></div>
  </div></div>
  <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Batal</button><button class="btn btn-primary" onclick="simpanUser(${idx})"><i class="fa-solid fa-floppy-disk"></i> Simpan</button></div>`);
}
function editUser(i) { modalTambahUser(i); }
function simpanUser(idx) {
  const nama = document.getElementById('u-nama').value.trim();
  const username = document.getElementById('u-uname').value.trim();
  const passInput = document.getElementById('u-pass').value;
  if (!nama || !username) { showToast('Nama dan username wajib diisi!', 'danger'); return; }
  if (idx < 0 && !passInput) { showToast('Password wajib diisi untuk user baru!', 'danger'); return; }
  // Cek username unik
  const dup = DB.users.find((x, i) => x.username === username && i !== idx);
  if (dup) { showToast('Username sudah digunakan!', 'danger'); return; }

  const obj = {
    nama, username,
    password: passInput || DB.users[idx]?.password,
    role: document.getElementById('u-role').value,
    aktif: document.getElementById('u-aktif').value === '1'
  };
  if (idx >= 0) { Object.assign(DB.users[idx], obj); } else { obj.id = Date.now(); obj.lastLogin = ''; DB.users.push(obj); }
  saveDB(); closeModal(); showPage('pengaturan-user'); showToast('User disimpan', 'success');
}
async function hapusUser(i) {
  if (DB.users.length <= 1) { showToast('Tidak bisa menghapus user terakhir!', 'danger'); return; }
  const ok = await confirmAsync('Hapus User', 'Hapus user ini? Akun tidak akan bisa login lagi.');
  if (ok) { DB.users.splice(i, 1); saveDB(); showPage('pengaturan-user'); showToast('User dihapus', 'danger'); }
}

/* ---------------- HAK AKSES ---------------- */
function pageHakAkses() {
  const menus_all = ['dashboard', 'kasir', 'restock', 'laporan', 'master-barang', 'master-kategori', 'master-satuan', 'master-supplier', 'master-pelanggan', 'master-metode', 'pengaturan-log', 'pengaturan-user', 'pengaturan-hak', 'pengaturan-toko', 'profil'];
  const labels = { 'dashboard': 'Dashboard', 'kasir': 'Kasir / POS', 'restock': 'Restock Barang', 'laporan': 'Laporan', 'master-barang': 'Data Barang', 'master-kategori': 'Kategori', 'master-satuan': 'Satuan', 'master-supplier': 'Supplier', 'master-pelanggan': 'Pelanggan', 'master-metode': 'Metode Bayar', 'pengaturan-log': 'Log Login', 'pengaturan-user': 'Data User', 'pengaturan-hak': 'Hak Akses', 'pengaturan-toko': 'Profil Toko', 'profil': 'Profil' };
  return `
  <div class="page-header"><div class="page-header-left"><h2><i class="fa-solid fa-shield-halved"></i> Hak Akses</h2></div></div>
  <div class="card"><div class="card-header"><span class="card-title">Atur akses menu per role</span></div>
  <div class="card-body"><div class="table-wrapper"><table>
    <thead><tr><th>Menu</th><th>Admin</th><th>Kasir</th></tr></thead>
    <tbody>${menus_all.map(m => `<tr>
      <td>${labels[m] || m}</td>
      <td><input type="checkbox" ${DB.hakAkses.admin.includes(m) ? 'checked' : ''} onchange="toggleHak('admin','${m}',this.checked)"/></td>
      <td><input type="checkbox" ${DB.hakAkses.kasir.includes(m) ? 'checked' : ''} onchange="toggleHak('kasir','${m}',this.checked)"/></td>
    </tr>`).join('')}</tbody>
  </table></div></div></div>`;
}
function toggleHak(role, menu, val) {
  if (role === 'admin' && menu === 'dashboard' && !val) {
    showToast('Dashboard tidak bisa dinonaktifkan untuk Admin!', 'danger');
    showPage('pengaturan-hak');
    return;
  }
  if (val && !DB.hakAkses[role].includes(menu)) DB.hakAkses[role].push(menu);
  else if (!val) DB.hakAkses[role] = DB.hakAkses[role].filter(m => m !== menu);
  saveDB();
  showToast('Hak akses diperbarui', 'success');
}

/* ---------------- PROFIL TOKO ---------------- */
function pageProfilToko() {
  const t = DB.pengaturanToko;
  return `
  <div class="page-header"><div class="page-header-left"><h2><i class="fa-solid fa-store"></i> Profil Toko</h2></div></div>
  <div class="card" style="max-width:600px;">
    <div class="card-header"><span class="card-title">Informasi Toko</span></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Nama Toko</label><input id="tk-nama" class="form-control" value="${escapeHtml(t.nama)}"/></div>
        <div class="form-group"><label class="form-label">Tagline</label><input id="tk-tag" class="form-control" value="${escapeHtml(t.tagline)}"/></div>
        <div class="form-group"><label class="form-label">Alamat</label><input id="tk-almt" class="form-control" value="${escapeHtml(t.alamat)}"/></div>
        <div class="form-group"><label class="form-label">Telepon / WA</label><input id="tk-tlp" class="form-control" value="${escapeHtml(t.tlp)}"/></div>
        <div class="form-group"><label class="form-label">Email</label><input id="tk-email" class="form-control" value="${escapeHtml(t.email)}"/></div>
        <div class="form-group"><label class="form-label">Path Logo</label><input id="tk-logo" class="form-control" value="${escapeHtml(t.logo)}"/></div>
      </div>
      <button class="btn btn-primary" style="margin-top:14px;" onclick="simpanToko()"><i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan</button>
    </div>
  </div>
  <div class="card" style="max-width:600px;margin-top:16px;border-color:#fca5a5;">
    <div class="card-header" style="background:#fff5f5;">
      <span class="card-title" style="color:var(--danger);"><i class="fa-solid fa-database"></i> Manajemen Data</span>
    </div>
    <div class="card-body">
      <p style="font-size:13px;color:var(--text2);margin-bottom:14px;">Data tersimpan otomatis di browser <b>dan disinkronkan ke cloud (Firebase Firestore)</b> agar bisa diakses dari device lain secara real-time. Klik ikon sync di topbar untuk memperbarui manual.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-outline" onclick="exportBackup()"><i class="fa-solid fa-download"></i> Export Backup JSON</button>
        <button class="btn btn-outline" onclick="importBackupClick()"><i class="fa-solid fa-upload"></i> Import Backup JSON</button>
        <input type="file" id="import-file-input" accept=".json" style="display:none" onchange="importBackupFile(this)"/>
        <button class="btn btn-danger" onclick="resetDataToko()"><i class="fa-solid fa-rotate-left"></i> Reset ke Data Awal</button>
      </div>
    </div>
  </div>`;
}
function simpanToko() {
  DB.pengaturanToko.nama = document.getElementById('tk-nama').value.trim();
  DB.pengaturanToko.tagline = document.getElementById('tk-tag').value.trim();
  DB.pengaturanToko.alamat = document.getElementById('tk-almt').value.trim();
  DB.pengaturanToko.tlp = document.getElementById('tk-tlp').value.trim();
  DB.pengaturanToko.email = document.getElementById('tk-email').value.trim();
  DB.pengaturanToko.logo = document.getElementById('tk-logo').value.trim();
  saveDB();
  showToast('Profil toko disimpan', 'success');
}

/* ---------------- PROFIL SAYA ---------------- */
function pageProfil() {
  const u = appState.user;
  return `
  <div class="page-header"><div class="page-header-left"><h2><i class="fa-solid fa-circle-user"></i> Profil Saya</h2></div></div>
  <div class="card" style="max-width:500px;">
    <div class="card-body" style="text-align:center;padding:30px;">
      <div style="width:72px;height:72px;background:linear-gradient(135deg,#1a56db,#60a5fa);border-radius:18px;display:inline-flex;align-items:center;justify-content:center;font-size:32px;font-weight:800;color:#fff;margin-bottom:14px;">${u.nama[0]}</div>
      <h2 style="font-size:20px;font-weight:800;">${escapeHtml(u.nama)}</h2>
      <p style="color:var(--text2);margin-bottom:4px;">${escapeHtml(u.username)}</p>
      <span class="badge ${u.role === 'admin' ? 'badge-purple' : 'badge-info'}" style="font-size:13px;">${u.role === 'admin' ? 'Administrator' : 'Kasir'}</span>
    </div>
    <div style="border-top:1.5px solid var(--border);padding:20px;">
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Nama Lengkap</label><input id="pf-nama" class="form-control" value="${escapeHtml(u.nama)}"/></div>
        <div class="form-group"><label class="form-label">Username</label><input id="pf-uname" class="form-control" value="${escapeHtml(u.username)}"/></div>
        <div class="form-group"><label class="form-label">Password Baru</label><input type="password" id="pf-pass" class="form-control" placeholder="Kosongkan jika tidak diubah"/></div>
      </div>
      <button class="btn btn-primary" style="margin-top:14px;width:100%;" onclick="simpanProfil()"><i class="fa-solid fa-floppy-disk"></i> Simpan Profil</button>
    </div>
  </div>`;
}
function simpanProfil() {
  const u = appState.user;
  const nama = document.getElementById('pf-nama').value.trim();
  const username = document.getElementById('pf-uname').value.trim();
  if (!nama || !username) { showToast('Nama dan username wajib diisi!', 'danger'); return; }
  const dup = DB.users.find(x => x.username === username && x.id !== u.id);
  if (dup) { showToast('Username sudah digunakan user lain!', 'danger'); return; }

  u.nama = nama;
  u.username = username;
  const newPass = document.getElementById('pf-pass').value;
  if (newPass) u.password = newPass;
  saveDB();
  renderUserChrome(u);
  showToast('Profil diperbarui', 'success');
}

/* ---------------- NOTIFIKASI ---------------- */
function pageNotifications() {
  const stokRendah = DB.barang.filter(b => b.stok <= b.stokMin);
  const piutang = DB.pelanggan.filter(p => p.piutang > 0);
  const notifs = [
    ...stokRendah.map(b => ({ type: 'warning', msg: `Stok ${b.nama} menipis (${b.stok} ${b.satuan})` })),
    ...piutang.map(p => ({ type: 'danger', msg: `${p.nama} memiliki piutang ${fmtRp(p.piutang)}` })),
    { type: 'info', msg: 'Sistem POS berjalan normal' },
  ];
  return `
  <div class="page-header"><div class="page-header-left"><h2><i class="fa-solid fa-bell"></i> Notifikasi</h2></div></div>
  <div class="card">
    <div class="card-body">
      ${notifs.map(n => `<div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:9px;background:var(--surface2);margin-bottom:8px;">
        <span style="font-size:20px;">${n.type === 'warning' ? '<i class="fa-solid fa-triangle-exclamation" style="color:#d97706;"></i>' : n.type === 'danger' ? '<i class="fa-solid fa-circle-exclamation" style="color:#dc2626;"></i>' : '<i class="fa-solid fa-circle-info" style="color:#1a56db;"></i>'}</span>
        <span style="font-size:13px;">${escapeHtml(n.msg)}</span>
      </div>`).join('')}
    </div>
  </div>`;
}
