/* ================================================================
   PAGE-LAPORAN.JS — Laporan penjualan, pembelian, operasional
   ================================================================ */

function pageLaporan() {
  const isAdmin = appState.user && appState.user.role === 'admin';
  return `
  <div class="page-header">
    <div class="page-header-left"><h2><i class="fa-solid fa-chart-line"></i> Laporan</h2><p>Analisis penjualan dan operasional</p></div>
    ${isAdmin ? `<button class="btn btn-danger" onclick="confirmResetLaporan()" title="Reset semua data laporan keuangan"><i class="fa-solid fa-trash-can"></i> Reset Laporan</button>` : ''}
  </div>
  <div class="tabs" id="laporan-tabs">
    <div class="tab active" onclick="switchLaporan('nota-jual',this)"><i class="fa-solid fa-receipt"></i> Nota Penjualan</div>
    <div class="tab" onclick="switchLaporan('jual-barang',this)"><i class="fa-solid fa-box"></i> Penjualan Barang</div>
    <div class="tab" onclick="switchLaporan('nota-beli',this)"><i class="fa-solid fa-cart-shopping"></i> Nota Pembelian</div>
    <div class="tab" onclick="switchLaporan('beli-barang',this)"><i class="fa-solid fa-clipboard"></i> Pembelian Barang</div>
    <div class="tab" onclick="switchLaporan('operasional',this)"><i class="fa-solid fa-gears"></i> Operasional</div>
  </div>
  <div id="laporan-content">${renderLaporanNotaJual()}</div>`;
}

function confirmResetLaporan() {
  if (appState.user.role !== 'admin') { showToast('Hanya admin yang dapat mereset laporan!', 'danger'); return; }
  openModal(`
    <div class="modal-header">
      <span class="modal-title" style="color:var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i> Reset Laporan Keuangan</span>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div style="background:#fff5f5;border:1.5px solid #fca5a5;border-radius:10px;padding:16px;margin-bottom:16px;">
        <p style="font-weight:700;color:var(--danger);margin-bottom:8px;"><i class="fa-solid fa-triangle-exclamation"></i> Peringatan!</p>
        <p style="font-size:13px;color:var(--text2);line-height:1.7;">Tindakan ini akan <strong>menghapus SEMUA data laporan keuangan</strong> secara permanen, meliputi:</p>
        <ul style="font-size:13px;color:var(--text2);margin:8px 0 0 18px;line-height:1.9;">
          <li>Semua nota & riwayat penjualan (${DB.notaJual.length} nota)</li>
          <li>Semua nota & riwayat pembelian (${DB.notaBeli.length} nota)</li>
        </ul>
        <p style="font-size:12px;color:var(--danger);margin-top:10px;font-weight:600;">Data master barang, pelanggan, supplier tidak akan terhapus.</p>
      </div>
      <div class="form-group">
        <label class="form-label">Ketik <strong>RESET</strong> untuk konfirmasi:</label>
        <input id="reset-konfirmasi" class="form-control" placeholder="Ketik RESET di sini..." autocomplete="off"/>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Batal</button>
      <button class="btn btn-danger" onclick="doResetLaporan()"><i class="fa-solid fa-trash-can"></i> Reset Sekarang</button>
    </div>
  `);
}

async function doResetLaporan() {
  const konfirmasi = document.getElementById('reset-konfirmasi');
  if (!konfirmasi || konfirmasi.value.trim().toUpperCase() !== 'RESET') {
    konfirmasi.style.borderColor = 'var(--danger)';
    konfirmasi.placeholder = 'Harus ketik RESET untuk melanjutkan!';
    return;
  }
  DB.notaJual = [];
  DB.notaBeli = [];
  window._lastSaveTs = Date.now();
  await saveDB();
  closeModal();
  showToast('Laporan keuangan berhasil direset ke kondisi awal!', 'success');
  showPage('laporan');
}

function switchLaporan(type, el) {
  document.querySelectorAll('#laporan-tabs .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const fns = {
    'nota-jual': renderLaporanNotaJual,
    'jual-barang': renderLaporanJualBarang,
    'nota-beli': renderLaporanNotaBeli,
    'beli-barang': renderLaporanBeliBarang,
    'operasional': renderLaporanOperasional,
  };
  document.getElementById('laporan-content').innerHTML = (fns[type] || renderLaporanNotaJual)();
}

function renderLaporanNotaJual() {
  const total = DB.notaJual.reduce((s, n) => s + n.total, 0);
  const dp = DB.notaJual.reduce((s, n) => s + n.dp, 0);
  const sisa = total - dp;
  return `
  <div class="stats-grid" style="margin-bottom:14px;">
    <div class="stat-card"><div class="stat-icon" style="background:#dbeafe;"><i class="fa-solid fa-money-bill-wave" style="color:#1a56db;"></i></div><div class="stat-info"><div class="stat-value">${fmtRp(total)}</div><div class="stat-label">Total Penjualan</div></div></div>
    <div class="stat-card"><div class="stat-icon" style="background:#dcfce7;"><i class="fa-solid fa-circle-check" style="color:#16a34a;"></i></div><div class="stat-info"><div class="stat-value">${fmtRp(dp)}</div><div class="stat-label">Sudah Dibayar</div></div></div>
    <div class="stat-card"><div class="stat-icon" style="background:#fee2e2;"><i class="fa-solid fa-triangle-exclamation" style="color:#dc2626;"></i></div><div class="stat-info"><div class="stat-value">${fmtRp(sisa)}</div><div class="stat-label">Piutang</div></div></div>
    <div class="stat-card"><div class="stat-icon" style="background:#fef3c7;"><i class="fa-solid fa-clipboard-list" style="color:#d97706;"></i></div><div class="stat-info"><div class="stat-value">${DB.notaJual.length}</div><div class="stat-label">Total Nota</div></div></div>
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title"><i class="fa-solid fa-receipt"></i> Semua Nota Penjualan</span></div>
    <div class="card-body" style="padding:0;"><div class="table-wrapper"><table>
      <thead><tr><th>No Nota</th><th>Tanggal</th><th>Pelanggan</th><th>Total</th><th>DP</th><th>Sisa</th><th>Metode</th><th>Status</th><th>Kasir</th><th>Order</th><th>Aksi</th></tr></thead>
      <tbody>${DB.notaJual.length === 0 ? `<tr><td colspan="11" style="text-align:center;padding:30px;color:var(--text3);">Belum ada transaksi</td></tr>` :
        DB.notaJual.map((n, i) => `
        <tr>
          <td><strong>${n.noNota}</strong></td>
          <td>${n.tanggal}</td>
          <td>${escapeHtml(n.pelanggan)}</td>
          <td>${fmtRp(n.total)}</td>
          <td>${fmtRp(n.dp)}</td>
          <td style="color:${n.sisa > 0 ? 'var(--danger)' : 'var(--success)'};">${fmtRp(n.sisa)}</td>
          <td><span class="badge badge-info">${escapeHtml(n.metode)}</span></td>
          <td><span class="badge ${n.lunas ? 'badge-success' : 'badge-warning'}">${escapeHtml(n.status)}</span></td>
          <td style="font-size:11px;">${escapeHtml(n.kasir)}</td>
          <td><span class="badge badge-purple">${escapeHtml(n.statusOrder)}</span></td>
          <td style="white-space:nowrap;">
            <button class="btn btn-xs" style="background:#25d366;color:#fff;border:none;" onclick="lihatStrukNota(${i})" title="Lihat Struk & Kirim WA"><i class="fa-brands fa-whatsapp"></i></button>
            <button class="btn btn-outline btn-xs" onclick="showStruk(DB.notaJual[${i}])" title="Lihat Struk"><i class="fa-solid fa-receipt"></i></button>
          </td>
        </tr>
      `).join('')}</tbody>
    </table></div></div>
  </div>`;
}

function renderLaporanJualBarang() {
  const map = {};
  DB.notaJual.forEach(n => n.items.forEach(i => {
    if (!map[i.nama]) map[i.nama] = { nama: i.nama, qty: 0, total: 0 };
    map[i.nama].qty += i.qty; map[i.nama].total += i.subtotal;
  }));
  const rows = Object.values(map).sort((a, b) => b.total - a.total);
  return `<div class="card"><div class="card-header"><span class="card-title"><i class="fa-solid fa-box"></i> Penjualan per Barang</span></div>
  <div class="card-body" style="padding:0;"><div class="table-wrapper"><table>
    <thead><tr><th>#</th><th>Nama Barang</th><th>Qty Terjual</th><th>Total Pendapatan</th></tr></thead>
    <tbody>${rows.length === 0 ? `<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text3);">Belum ada data</td></tr>` :
      rows.map((r, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(r.nama)}</td><td>${fmt(r.qty)}</td><td>${fmtRp(r.total)}</td></tr>`).join('')}</tbody>
  </table></div></div></div>`;
}

function renderLaporanNotaBeli() {
  const total = DB.notaBeli.reduce((s, n) => s + n.total, 0);
  return `
  <div class="stat-card" style="margin-bottom:14px;max-width:100%;"><div class="stat-icon" style="background:#fef3c7;"><i class="fa-solid fa-cart-shopping" style="color:#d97706;"></i></div><div class="stat-info"><div class="stat-value">${fmtRp(total)}</div><div class="stat-label">Total Pembelian</div></div></div>
  <div class="card"><div class="card-header"><span class="card-title"><i class="fa-solid fa-cart-shopping"></i> Nota Pembelian</span></div>
  <div class="card-body" style="padding:0;"><div class="table-wrapper"><table>
    <thead><tr><th>No Nota</th><th>Tanggal</th><th>Supplier</th><th>Barang</th><th>Qty</th><th>Total</th></tr></thead>
    <tbody>${DB.notaBeli.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text3);">Belum ada data</td></tr>` :
      DB.notaBeli.map(n => `<tr><td><strong>${n.noNota}</strong></td><td>${n.tanggal}</td><td>${escapeHtml(n.supplier)}</td><td>${escapeHtml(n.barang)}</td><td>${fmt(n.qty)}</td><td>${fmtRp(n.total)}</td></tr>`).join('')}</tbody>
  </table></div></div></div>`;
}

function renderLaporanBeliBarang() {
  const map = {};
  DB.notaBeli.forEach(n => {
    if (!map[n.barang]) map[n.barang] = { nama: n.barang, qty: 0, total: 0 };
    map[n.barang].qty += n.qty; map[n.barang].total += n.total;
  });
  const rows = Object.values(map).sort((a, b) => b.total - a.total);
  return `<div class="card"><div class="card-header"><span class="card-title"><i class="fa-solid fa-clipboard"></i> Pembelian per Barang</span></div>
  <div class="card-body" style="padding:0;"><div class="table-wrapper"><table>
    <thead><tr><th>#</th><th>Nama Barang</th><th>Total Qty</th><th>Total Biaya</th></tr></thead>
    <tbody>${rows.length === 0 ? `<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text3);">Belum ada data</td></tr>` :
      rows.map((r, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(r.nama)}</td><td>${fmt(r.qty)}</td><td>${fmtRp(r.total)}</td></tr>`).join('')}</tbody>
  </table></div></div></div>`;
}

function renderLaporanOperasional() {
  const penjualan = DB.notaJual.reduce((s, n) => s + n.dp, 0);
  const pembelian = DB.notaBeli.reduce((s, n) => s + n.total, 0);
  const laba = penjualan - pembelian;
  return `
  <div class="stats-grid" style="margin-bottom:16px;">
    <div class="stat-card"><div class="stat-icon" style="background:#dcfce7;"><i class="fa-solid fa-chart-line" style="color:#16a34a;"></i></div><div class="stat-info"><div class="stat-value">${fmtRp(penjualan)}</div><div class="stat-label">Total Pendapatan</div></div></div>
    <div class="stat-card"><div class="stat-icon" style="background:#fee2e2;"><i class="fa-solid fa-chart-line fa-flip-vertical" style="color:#dc2626;"></i></div><div class="stat-info"><div class="stat-value">${fmtRp(pembelian)}</div><div class="stat-label">Total Pengeluaran</div></div></div>
    <div class="stat-card"><div class="stat-icon" style="background:${laba > 0 ? '#dcfce7' : '#fee2e2'};">${laba > 0 ? '<i class="fa-solid fa-sack-dollar"></i>' : '<i class="fa-solid fa-sack-xmark"></i>'}</div><div class="stat-info"><div class="stat-value">${fmtRp(Math.abs(laba))}</div><div class="stat-label">${laba > 0 ? 'Laba Bersih' : 'Rugi'}</div></div></div>
    <div class="stat-card"><div class="stat-icon" style="background:#ede9fe;"><i class="fa-solid fa-chart-pie" style="color:#7c3aed;"></i></div><div class="stat-info"><div class="stat-value">${penjualan > 0 ? Math.round(laba / penjualan * 100) : '0'}%</div><div class="stat-label">Margin Keuntungan</div></div></div>
  </div>
  <div class="card"><div class="card-header"><span class="card-title"><i class="fa-solid fa-gears"></i> Ringkasan Operasional</span></div>
  <div class="card-body">
    <div style="display:grid;gap:10px;">
      <div style="display:flex;justify-content:space-between;padding:12px;background:var(--surface2);border-radius:9px;"><span>Total Transaksi Penjualan</span><strong>${DB.notaJual.length} nota</strong></div>
      <div style="display:flex;justify-content:space-between;padding:12px;background:var(--surface2);border-radius:9px;"><span>Total Transaksi Pembelian</span><strong>${DB.notaBeli.length} nota</strong></div>
      <div style="display:flex;justify-content:space-between;padding:12px;background:var(--surface2);border-radius:9px;"><span>Pelanggan Aktif</span><strong>${DB.pelanggan.length} pelanggan</strong></div>
      <div style="display:flex;justify-content:space-between;padding:12px;background:var(--surface2);border-radius:9px;"><span>Total Jenis Barang</span><strong>${DB.barang.length} barang</strong></div>
      <div style="display:flex;justify-content:space-between;padding:12px;background:#dcfce7;border-radius:9px;"><span style="font-weight:700;">Laba Bersih</span><strong style="color:var(--success);">${fmtRp(laba)}</strong></div>
    </div>
  </div></div>`;
}
