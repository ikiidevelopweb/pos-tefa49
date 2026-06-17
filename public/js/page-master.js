/* ================================================================
   PAGE-MASTER.JS — Data master: Barang, Kategori, Satuan,
   Supplier, Pelanggan, Metode Pembayaran
   ================================================================ */

function crudTable(title, addLabel, cols, rows, editFn, delFn, addFn) {
  return `
  <div class="page-header">
    <div class="page-header-left"><h2>${title}</h2></div>
    <button class="btn btn-primary" onclick="${addFn}"><i class="fa-solid fa-plus"></i> ${addLabel}</button>
  </div>
  <div class="card"><div class="card-body" style="padding:0;"><div class="table-wrapper"><table>
    <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}<th>Aksi</th></tr></thead>
    <tbody>${rows.length === 0 ? `<tr><td colspan="${cols.length + 1}" style="text-align:center;padding:30px;color:var(--text3);">Belum ada data</td></tr>` :
      rows.map((r, i) => `<tr>${r.map(c => `<td>${c}</td>`).join('')}<td style="white-space:nowrap;">
      <button class="btn btn-outline btn-xs" onclick="${editFn}(${i})"><i class="fa-solid fa-pen-to-square"></i></button>
      <button class="btn btn-danger btn-xs" onclick="${delFn}(${i})"><i class="fa-solid fa-trash"></i></button>
    </td></tr>`).join('')}</tbody>
  </table></div></div></div>`;
}

/* ---------------- MASTER BARANG ---------------- */
function pageMasterBarang() {
  const rows = DB.barang.map(b => [
    `<strong>${escapeHtml(b.kode)}</strong>`,
    `<div style="display:flex;align-items:center;gap:8px;">${b.img ? `<img src="${escapeHtml(b.img)}" style="width:32px;height:32px;border-radius:7px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'" loading="lazy"/>` : `<span style="font-size:18px;"><i class="${b.emoji || 'fa-solid fa-box'}"></i></span>`}<span>${escapeHtml(b.nama)}</span></div>`,
    escapeHtml(b.kategori),
    escapeHtml(b.satuan),
    fmtRp(b.hargaBeli),
    fmtRp(b.hargaJual),
    `<span class="badge ${b.stok <= b.stokMin ? 'badge-danger' : 'badge-success'}">${fmt(b.stok)}</span>`,
    fmt(b.stokMin),
  ]);
  return crudTable('<i class="fa-solid fa-folder-open"></i> Data Barang', 'Tambah Barang',
    ['Kode', 'Nama', 'Kategori', 'Satuan', 'H.Beli', 'H.Jual', 'Stok', 'Min Stok'],
    rows, 'editBarang', 'hapusBarang', 'modalTambahBarang()');
}

function modalTambahBarang(idx = -1) {
  const b = idx >= 0 ? DB.barang[idx] : {};
  if (DB.kategori.length === 0) { showToast('Tambahkan minimal 1 kategori terlebih dahulu!', 'danger'); return; }
  if (DB.satuan.length === 0) { showToast('Tambahkan minimal 1 satuan terlebih dahulu!', 'danger'); return; }
  openModal(`
    <div class="modal-header"><span class="modal-title">${idx >= 0 ? 'Edit' : 'Tambah'} Barang</span><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="form-grid form-grid-2">
        <div class="form-group"><label class="form-label">Kode</label><input id="b-kode" class="form-control" value="${escapeHtml(b.kode || '')}"/></div>
        <div class="form-group"><label class="form-label">Nama</label><input id="b-nama" class="form-control" value="${escapeHtml(b.nama || '')}"/></div>
        <div class="form-group"><label class="form-label">Kategori</label><select id="b-kat" class="form-control">${DB.kategori.map(k => `<option ${k.nama === b.kategori ? 'selected' : ''}>${escapeHtml(k.nama)}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Satuan</label><select id="b-sat" class="form-control">${DB.satuan.map(s => `<option ${s.nama === b.satuan ? 'selected' : ''}>${escapeHtml(s.nama)}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Harga Beli</label><input type="number" id="b-hbeli" class="form-control" value="${b.hargaBeli || 0}" min="0"/></div>
        <div class="form-group"><label class="form-label">Harga Jual</label><input type="number" id="b-hjual" class="form-control" value="${b.hargaJual || 0}" min="0"/></div>
        <div class="form-group"><label class="form-label">Stok Awal</label><input type="number" id="b-stok" class="form-control" value="${b.stok || 0}" min="0"/></div>
        <div class="form-group"><label class="form-label">Stok Minimum</label><input type="number" id="b-stokmin" class="form-control" value="${b.stokMin || 0}" min="0"/></div>
        <div class="form-group" style="grid-column:1/-1;">
          <label class="form-label">Gambar Produk (URL)</label>
          <div style="display:flex;gap:10px;align-items:flex-start;">
            <div style="flex:1;">
              <input id="b-img" class="form-control" value="${escapeHtml(b.img || '')}" placeholder="https://images.unsplash.com/... atau URL gambar lainnya" oninput="previewBarangImg()"/>
              <div style="font-size:11px;color:var(--text3);margin-top:4px;">Kosongkan untuk menggunakan icon Font Awesome.</div>
            </div>
            <div id="b-img-preview" style="width:64px;height:64px;border-radius:10px;overflow:hidden;background:var(--bg);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${b.img ? `<img src="${escapeHtml(b.img)}" style="width:100%;height:100%;object-fit:cover;" id="b-img-preview-img"/>` : `<i class="${b.emoji || 'fa-solid fa-box'}" id="b-img-preview-icon" style="font-size:22px;color:var(--text3);"></i>`}
            </div>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Icon (FA class, fallback)</label><input id="b-emoji" class="form-control" value="${escapeHtml(b.emoji || 'fa-solid fa-file')}" placeholder="fa-solid fa-file"/></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="simpanBarang(${idx})"><i class="fa-solid fa-floppy-disk"></i> Simpan</button>
    </div>
  `);
}
function editBarang(i) { modalTambahBarang(i); }
function simpanBarang(idx) {
  const nama = document.getElementById('b-nama').value.trim();
  if (!nama) { showToast('Nama barang wajib diisi!', 'danger'); return; }
  const obj = {
    kode: document.getElementById('b-kode').value.trim(),
    nama,
    kategori: document.getElementById('b-kat').value,
    satuan: document.getElementById('b-sat').value,
    hargaBeli: parseInt(document.getElementById('b-hbeli').value) || 0,
    hargaJual: parseInt(document.getElementById('b-hjual').value) || 0,
    stok: parseInt(document.getElementById('b-stok').value) || 0,
    stokMin: parseInt(document.getElementById('b-stokmin').value) || 0,
    emoji: document.getElementById('b-emoji').value || 'fa-solid fa-file',
    img: document.getElementById('b-img').value || '',
  };
  if (idx >= 0) { Object.assign(DB.barang[idx], obj); }
  else { obj.id = Date.now(); DB.barang.push(obj); }
  saveDB(); closeModal(); showPage('master-barang'); showToast('Barang disimpan', 'success');
}
async function hapusBarang(i) {
  const ok = await confirmAsync('Hapus Barang', 'Hapus barang ini? Tindakan ini tidak dapat dibatalkan.');
  if (ok) { DB.barang.splice(i, 1); saveDB(); showPage('master-barang'); showToast('Barang dihapus', 'danger'); }
}

function previewBarangImg() {
  const url = document.getElementById('b-img')?.value?.trim();
  const preview = document.getElementById('b-img-preview');
  if (!preview) return;
  if (url) {
    preview.innerHTML = `<img src="${escapeHtml(url)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<i class=&quot;fa-solid fa-image-slash&quot; style=&quot;font-size:22px;color:var(--danger);padding:8px;&quot;></i>'"/>`;
  } else {
    const iconVal = document.getElementById('b-emoji')?.value || 'fa-solid fa-box';
    preview.innerHTML = `<i class="${iconVal}" style="font-size:22px;color:var(--text3);"></i>`;
  }
}

/* ---------------- MASTER KATEGORI ---------------- */
function pageMasterKategori() {
  const rows = DB.kategori.map(k => [escapeHtml(k.nama), escapeHtml(k.deskripsi)]);
  return crudTable('<i class="fa-solid fa-tags"></i> Data Kategori', 'Tambah Kategori', ['Nama', 'Deskripsi'], rows, 'editKategori', 'hapusKategori', 'modalTambahKategori()');
}
function modalTambahKategori(idx = -1) {
  const k = idx >= 0 ? DB.kategori[idx] : {};
  openModal(`<div class="modal-header"><span class="modal-title">${idx >= 0 ? 'Edit' : 'Tambah'} Kategori</span><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body"><div class="form-grid">
    <div class="form-group"><label class="form-label">Nama</label><input id="k-nama" class="form-control" value="${escapeHtml(k.nama || '')}"/></div>
    <div class="form-group"><label class="form-label">Deskripsi</label><input id="k-desk" class="form-control" value="${escapeHtml(k.deskripsi || '')}"/></div>
  </div></div>
  <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Batal</button><button class="btn btn-primary" onclick="simpanKategori(${idx})"><i class="fa-solid fa-floppy-disk"></i> Simpan</button></div>`, 'modal-sm');
}
function editKategori(i) { modalTambahKategori(i); }
function simpanKategori(idx) {
  const nama = document.getElementById('k-nama').value.trim();
  if (!nama) { showToast('Nama kategori wajib diisi!', 'danger'); return; }
  const obj = { nama, deskripsi: document.getElementById('k-desk').value.trim() };
  if (idx >= 0) { Object.assign(DB.kategori[idx], obj); } else { obj.id = Date.now(); DB.kategori.push(obj); }
  saveDB(); closeModal(); showPage('master-kategori'); showToast('Kategori disimpan', 'success');
}
async function hapusKategori(i) {
  const ok = await confirmAsync('Hapus Kategori', 'Hapus kategori ini?');
  if (ok) { DB.kategori.splice(i, 1); saveDB(); showPage('master-kategori'); showToast('Kategori dihapus', 'danger'); }
}

/* ---------------- MASTER SATUAN ---------------- */
function pageMasterSatuan() {
  const rows = DB.satuan.map(s => [escapeHtml(s.nama)]);
  return crudTable('<i class="fa-solid fa-scale-balanced"></i> Data Satuan', 'Tambah Satuan', ['Nama Satuan'], rows, 'editSatuan', 'hapusSatuan', 'modalTambahSatuan()');
}
function modalTambahSatuan(idx = -1) {
  const s = idx >= 0 ? DB.satuan[idx] : {};
  openModal(`<div class="modal-header"><span class="modal-title">${idx >= 0 ? 'Edit' : 'Tambah'} Satuan</span><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body"><div class="form-group"><label class="form-label">Nama Satuan</label><input id="s-nama" class="form-control" value="${escapeHtml(s.nama || '')}"/></div></div>
  <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Batal</button><button class="btn btn-primary" onclick="simpanSatuan(${idx})"><i class="fa-solid fa-floppy-disk"></i> Simpan</button></div>`, 'modal-sm');
}
function editSatuan(i) { modalTambahSatuan(i); }
function simpanSatuan(idx) {
  const nama = document.getElementById('s-nama').value.trim();
  if (!nama) { showToast('Nama satuan wajib diisi!', 'danger'); return; }
  const obj = { nama };
  if (idx >= 0) { Object.assign(DB.satuan[idx], obj); } else { obj.id = Date.now(); DB.satuan.push(obj); }
  saveDB(); closeModal(); showPage('master-satuan'); showToast('Satuan disimpan', 'success');
}
async function hapusSatuan(i) {
  const ok = await confirmAsync('Hapus Satuan', 'Hapus satuan ini?');
  if (ok) { DB.satuan.splice(i, 1); saveDB(); showPage('master-satuan'); showToast('Satuan dihapus', 'danger'); }
}

/* ---------------- MASTER SUPPLIER ---------------- */
function pageMasterSupplier() {
  const rows = DB.supplier.map(s => [escapeHtml(s.nama), escapeHtml(s.tlp), escapeHtml(s.alamat), escapeHtml(s.produk)]);
  return crudTable('<i class="fa-solid fa-truck"></i> Data Supplier', 'Tambah Supplier', ['Nama', 'Telepon', 'Alamat', 'Produk'], rows, 'editSupplier', 'hapusSupplier', 'modalTambahSupplier()');
}
function modalTambahSupplier(idx = -1) {
  const s = idx >= 0 ? DB.supplier[idx] : {};
  openModal(`<div class="modal-header"><span class="modal-title">${idx >= 0 ? 'Edit' : 'Tambah'} Supplier</span><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body"><div class="form-grid form-grid-2">
    <div class="form-group"><label class="form-label">Nama</label><input id="sp-nama" class="form-control" value="${escapeHtml(s.nama || '')}"/></div>
    <div class="form-group"><label class="form-label">Telepon</label><input id="sp-tlp" class="form-control" value="${escapeHtml(s.tlp || '')}"/></div>
    <div class="form-group"><label class="form-label">Alamat</label><input id="sp-almt" class="form-control" value="${escapeHtml(s.alamat || '')}"/></div>
    <div class="form-group"><label class="form-label">Produk</label><input id="sp-prod" class="form-control" value="${escapeHtml(s.produk || '')}"/></div>
  </div></div>
  <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Batal</button><button class="btn btn-primary" onclick="simpanSupplier(${idx})"><i class="fa-solid fa-floppy-disk"></i> Simpan</button></div>`);
}
function editSupplier(i) { modalTambahSupplier(i); }
function simpanSupplier(idx) {
  const nama = document.getElementById('sp-nama').value.trim();
  if (!nama) { showToast('Nama supplier wajib diisi!', 'danger'); return; }
  const obj = { nama, tlp: document.getElementById('sp-tlp').value.trim(), alamat: document.getElementById('sp-almt').value.trim(), produk: document.getElementById('sp-prod').value.trim() };
  if (idx >= 0) { Object.assign(DB.supplier[idx], obj); } else { obj.id = Date.now(); DB.supplier.push(obj); }
  saveDB(); closeModal(); showPage('master-supplier'); showToast('Supplier disimpan', 'success');
}
async function hapusSupplier(i) {
  const ok = await confirmAsync('Hapus Supplier', 'Hapus supplier ini?');
  if (ok) { DB.supplier.splice(i, 1); saveDB(); showPage('master-supplier'); showToast('Supplier dihapus', 'danger'); }
}

/* ---------------- MASTER PELANGGAN ---------------- */
function pageMasterPelanggan() {
  const rows = DB.pelanggan.map(p => [
    escapeHtml(p.nama), escapeHtml(p.tlp), escapeHtml(p.alamat), fmtRp(p.totalBeli),
    `<span class="badge ${p.piutang > 0 ? 'badge-danger' : 'badge-success'}">${fmtRp(p.piutang)}</span>`,
  ]);
  return crudTable('<i class="fa-solid fa-users"></i> Data Pelanggan', 'Tambah Pelanggan', ['Nama', 'Telepon', 'Alamat', 'Total Beli', 'Piutang'], rows, 'editPelanggan', 'hapusPelanggan', 'modalTambahPelanggan()');
}
function modalTambahPelanggan(idx = -1) {
  const p = idx >= 0 ? DB.pelanggan[idx] : {};
  openModal(`<div class="modal-header"><span class="modal-title">${idx >= 0 ? 'Edit' : 'Tambah'} Pelanggan</span><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body"><div class="form-grid form-grid-2">
    <div class="form-group"><label class="form-label">Nama</label><input id="pl-nama" class="form-control" value="${escapeHtml(p.nama || '')}"/></div>
    <div class="form-group"><label class="form-label">Telepon</label><input id="pl-tlp" class="form-control" value="${escapeHtml(p.tlp || '')}"/></div>
    <div class="form-group"><label class="form-label">Alamat</label><input id="pl-almt" class="form-control" value="${escapeHtml(p.alamat || '')}"/></div>
    <div class="form-group"><label class="form-label">Email</label><input id="pl-email" class="form-control" value="${escapeHtml(p.email || '')}"/></div>
    <div class="form-group"><label class="form-label">Piutang Awal</label><input type="number" id="pl-piutang" class="form-control" value="${p.piutang || 0}" min="0"/></div>
  </div></div>
  <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Batal</button><button class="btn btn-primary" onclick="simpanPelanggan(${idx})"><i class="fa-solid fa-floppy-disk"></i> Simpan</button></div>`);
}
function editPelanggan(i) { modalTambahPelanggan(i); }
function simpanPelanggan(idx) {
  const nama = document.getElementById('pl-nama').value.trim();
  if (!nama) { showToast('Nama pelanggan wajib diisi!', 'danger'); return; }
  const obj = {
    nama, tlp: document.getElementById('pl-tlp').value.trim(), alamat: document.getElementById('pl-almt').value.trim(),
    email: document.getElementById('pl-email').value.trim(), piutang: parseInt(document.getElementById('pl-piutang').value) || 0,
    totalBeli: idx >= 0 ? DB.pelanggan[idx].totalBeli : 0
  };
  if (idx >= 0) { Object.assign(DB.pelanggan[idx], obj); } else { obj.id = Date.now(); DB.pelanggan.push(obj); }
  saveDB(); closeModal(); showPage('master-pelanggan'); showToast('Pelanggan disimpan', 'success');
}
async function hapusPelanggan(i) {
  const ok = await confirmAsync('Hapus Pelanggan', 'Hapus pelanggan ini? Riwayat transaksinya akan tetap ada di laporan.');
  if (ok) { DB.pelanggan.splice(i, 1); saveDB(); showPage('master-pelanggan'); showToast('Pelanggan dihapus', 'danger'); }
}

/* ---------------- MASTER METODE PEMBAYARAN ---------------- */
function pageMasterMetode() {
  const rows = DB.metodePembayaran.map(m => [
    escapeHtml(m.nama),
    m.noRek ? escapeHtml(m.noRek) : '<span style="color:var(--text3)">-</span>',
    m.namaRek ? escapeHtml(m.namaRek) : '<span style="color:var(--text3)">-</span>',
    `<span class="badge ${m.aktif ? 'badge-success' : 'badge-gray'}">${m.aktif ? 'Aktif' : 'Nonaktif'}</span>`
  ]);
  return crudTable('<i class="fa-solid fa-credit-card"></i> Metode Pembayaran', 'Tambah Metode', ['Nama', 'No. Rekening', 'Nama Rekening', 'Status'], rows, 'editMetode', 'hapusMetode', 'modalTambahMetode()');
}
function modalTambahMetode(idx = -1) {
  const m = idx >= 0 ? DB.metodePembayaran[idx] : {};
  openModal(`<div class="modal-header"><span class="modal-title">${idx >= 0 ? 'Edit' : 'Tambah'} Metode</span><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body"><div class="form-grid">
    <div class="form-group"><label class="form-label">Nama Metode</label><input id="m-nama" class="form-control" value="${escapeHtml(m.nama || '')}"/></div>
    <div class="form-group"><label class="form-label">No. Rekening / No. HP</label><input id="m-norek" class="form-control" placeholder="Kosongkan jika tunai" value="${escapeHtml(m.noRek || '')}"/></div>
    <div class="form-group"><label class="form-label">Nama Rekening / Akun</label><input id="m-namarek" class="form-control" placeholder="Kosongkan jika tunai" value="${escapeHtml(m.namaRek || '')}"/></div>
    <div class="form-group"><label class="form-label">Status</label><select id="m-aktif" class="form-control"><option value="1" ${m.aktif ? 'selected' : ''}>Aktif</option><option value="0" ${!m.aktif ? 'selected' : ''}>Nonaktif</option></select></div>
  </div></div>
  <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Batal</button><button class="btn btn-primary" onclick="simpanMetode(${idx})"><i class="fa-solid fa-floppy-disk"></i> Simpan</button></div>`, 'modal-sm');
}
function editMetode(i) { modalTambahMetode(i); }
function simpanMetode(idx) {
  const nama = document.getElementById('m-nama').value.trim();
  if (!nama) { showToast('Nama metode wajib diisi!', 'danger'); return; }
  const obj = { nama, noRek: document.getElementById('m-norek').value.trim(), namaRek: document.getElementById('m-namarek').value.trim(), aktif: document.getElementById('m-aktif').value === '1' };
  if (idx >= 0) { Object.assign(DB.metodePembayaran[idx], obj); } else { obj.id = Date.now(); DB.metodePembayaran.push(obj); }
  saveDB(); closeModal(); showPage('master-metode'); showToast('Metode disimpan', 'success');
}
async function hapusMetode(i) {
  const ok = await confirmAsync('Hapus Metode', 'Hapus metode pembayaran ini?');
  if (ok) { DB.metodePembayaran.splice(i, 1); saveDB(); showPage('master-metode'); showToast('Metode dihapus', 'danger'); }
}
