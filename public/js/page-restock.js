/* ================================================================
   PAGE-RESTOCK.JS
   ================================================================ */

function pageRestock() {
  const stokRendah = DB.barang.filter(b => b.stok <= b.stokMin);
  return `
  <div class="page-header">
    <div class="page-header-left"><h2><i class="fa-solid fa-box-open"></i> Restock Barang</h2><p>Manajemen pengisian ulang stok</p></div>
    <button class="btn btn-primary" onclick="modalRestockBaru()"><i class="fa-solid fa-plus"></i> Restock Baru</button>
  </div>
  ${stokRendah.length > 0 ? `
  <div class="card" style="margin-bottom:16px;border-color:var(--danger);">
    <div class="card-header" style="background:#fff5f5;"><span class="card-title" style="color:var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i> Stok Perlu Restock (${stokRendah.length} barang)</span></div>
    <div class="card-body" style="padding:0;">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Barang</th><th>Stok</th><th>Min</th><th>Kurang</th><th>Aksi</th></tr></thead>
          <tbody>
            ${stokRendah.map(b => `
              <tr>
                <td><i class="${b.emoji}"></i> ${escapeHtml(b.nama)}</td>
                <td><span class="badge badge-danger">${fmt(b.stok)} ${escapeHtml(b.satuan)}</span></td>
                <td>${fmt(b.stokMin)}</td>
                <td>${fmt(Math.max(0, b.stokMin - b.stok + 200))}</td>
                <td><button class="btn btn-warning btn-xs" onclick="modalRestockBarang(${b.id})">Restock</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>` : ''}
  <div class="card">
    <div class="card-header"><span class="card-title"><i class="fa-solid fa-clipboard-list"></i> Riwayat Restock</span></div>
    <div class="card-body" style="padding:0;">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>No Nota</th><th>Tanggal</th><th>Supplier</th><th>Barang</th><th>Qty</th><th>Total</th></tr></thead>
          <tbody>
            ${DB.notaBeli.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text3);">Belum ada riwayat restock</td></tr>` :
              DB.notaBeli.map(n => `
              <tr>
                <td><strong>${n.noNota}</strong></td>
                <td>${n.tanggal}</td>
                <td>${escapeHtml(n.supplier)}</td>
                <td>${escapeHtml(n.barang)}</td>
                <td>${fmt(n.qty)}</td>
                <td>${fmtRp(n.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function modalRestockBaru() {
  if (DB.barang.length === 0) { showToast('Belum ada data barang!', 'danger'); return; }
  openModal(`
    <div class="modal-header"><span class="modal-title"><i class="fa-solid fa-box-open"></i> Restock Baru</span><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="form-grid form-grid-2">
        <div class="form-group">
          <label class="form-label">Supplier</label>
          <select id="rst-supplier" class="form-control">
            ${DB.supplier.map(s => `<option>${escapeHtml(s.nama)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Barang</label>
          <select id="rst-barang" class="form-control">
            ${DB.barang.map(b => `<option value="${b.id}">${escapeHtml(b.nama)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Qty</label>
          <input type="number" id="rst-qty" class="form-control" value="100" min="1"/>
        </div>
        <div class="form-group">
          <label class="form-label">Harga Beli / unit</label>
          <input type="number" id="rst-harga" class="form-control" value="200" min="0"/>
        </div>
        <div class="form-group" style="grid-column:1/-1;">
          <label class="form-label">Catatan</label>
          <input type="text" id="rst-catatan" class="form-control" placeholder="Catatan restock..."/>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="simpanRestock()"><i class="fa-solid fa-floppy-disk"></i> Simpan</button>
    </div>
  `);
}

function modalRestockBarang(id) {
  const b = DB.barang.find(x => x.id === id);
  if (!b) return;
  openModal(`
    <div class="modal-header"><span class="modal-title"><i class="fa-solid fa-box-open"></i> Restock: ${escapeHtml(b.nama)}</span><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <p>Stok saat ini: <strong>${fmt(b.stok)} ${escapeHtml(b.satuan)}</strong> (Min: ${fmt(b.stokMin)})</p>
      <div class="form-grid" style="margin-top:12px;">
        <div class="form-group"><label class="form-label">Qty Tambah</label><input type="number" id="rst-qty-q" class="form-control" value="${b.stokMin * 2}" min="1"/></div>
        <div class="form-group"><label class="form-label">Harga Beli</label><input type="number" id="rst-harga-q" class="form-control" value="${b.hargaBeli}" min="0"/></div>
        <div class="form-group"><label class="form-label">Supplier</label><select id="rst-sup-q" class="form-control">${DB.supplier.map(s => `<option>${escapeHtml(s.nama)}</option>`).join('')}</select></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="restockBarang(${id})"><i class="fa-solid fa-check"></i> Restock</button>
    </div>
  `, 'modal-sm');
}

function restockBarang(id) {
  const b = DB.barang.find(x => x.id === id);
  if (!b) return;
  const qty = parseInt(document.getElementById('rst-qty-q').value) || 0;
  const harga = parseInt(document.getElementById('rst-harga-q').value) || 0;
  const sup = document.getElementById('rst-sup-q').value;
  if (qty <= 0) { showToast('Qty harus lebih dari 0!', 'danger'); return; }
  b.stok += qty;
  DB.notaBeli.unshift({ id: Date.now(), noNota: 'NB' + Date.now(), tanggal: today(), supplier: sup, barang: b.nama, qty, hargaBeli: harga, total: qty * harga });
  saveDB();
  closeModal();
  showPage('restock');
  showToast('Restock berhasil! Stok +' + qty, 'success');
}

function simpanRestock() {
  const bId = document.getElementById('rst-barang').value;
  const b = DB.barang.find(x => x.id == bId);
  if (!b) { showToast('Barang tidak ditemukan!', 'danger'); return; }
  const qty = parseInt(document.getElementById('rst-qty').value) || 0;
  const harga = parseInt(document.getElementById('rst-harga').value) || 0;
  const sup = document.getElementById('rst-supplier').value;
  if (qty <= 0) { showToast('Qty harus lebih dari 0!', 'danger'); return; }
  b.stok += qty;
  DB.notaBeli.unshift({ id: Date.now(), noNota: 'NB' + Date.now(), tanggal: today(), supplier: sup, barang: b.nama, qty, hargaBeli: harga, total: qty * harga });
  saveDB();
  closeModal();
  showPage('restock');
  showToast('Restock disimpan!', 'success');
}
