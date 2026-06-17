/* ================================================================
   PAGE-DASHBOARD.JS
   ================================================================ */

function pageDashboard() {
  const today_str = today();
  const month_str = monthYear();

  const todayTx = DB.notaJual.filter(n => n.tanggal === today_str);
  const monthTx = DB.notaJual.filter(n => n.tanggal.startsWith(month_str));
  const pendapatanHari = todayTx.reduce((s, n) => s + n.dp, 0);
  const pendapatanBulan = monthTx.reduce((s, n) => s + n.dp, 0);
  const pembelianBulan = DB.notaBeli.filter(n => n.tanggal.startsWith(month_str)).reduce((s, n) => s + n.total, 0);
  const totalPiutang = DB.pelanggan.reduce((s, p) => s + p.piutang, 0);
  const stokRendah = DB.barang.filter(b => b.stok <= b.stokMin);

  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const val = DB.notaJual.filter(n => n.tanggal === ds).reduce((s, n) => s + n.dp, 0);
    chartData.push({ label: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()], val });
  }
  const maxVal = Math.max(...chartData.map(c => c.val), 1);

  const recentOrders = [...DB.notaJual].sort((a, b) => b.id - a.id).slice(0, 5);

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h2><i class="fa-solid fa-gauge-high"></i> Dashboard</h2>
      <p>${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · ${escapeHtml(appState.user.nama)} (${appState.user.role})</p>
    </div>
    <button class="btn btn-primary" onclick="showPage('kasir')"><i class="fa-solid fa-plus"></i> Transaksi Baru</button>
  </div>

  ${totalPiutang > 0 ? `<div class="piutang-card"><span style="font-size:22px"><i class="fa-solid fa-triangle-exclamation" style="color:#d97706;"></i></span><div><strong>Total Piutang: ${fmtRp(totalPiutang)}</strong><div style="font-size:12px;color:#92400e;">Ada ${DB.pelanggan.filter(p => p.piutang > 0).length} pelanggan dengan piutang belum lunas</div></div><button class="btn btn-warning btn-sm" style="margin-left:auto" onclick="showPage('master-pelanggan')">Lihat</button></div>` : ''}

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon" style="background:#dbeafe;"><i class="fa-solid fa-money-bill-wave" style="color:#1a56db;"></i></div>
      <div class="stat-info">
        <div class="stat-value">${fmtRp(pendapatanHari)}</div>
        <div class="stat-label">Pendapatan Hari Ini</div>
        <div class="stat-change up"><i class="fa-regular fa-calendar-days"></i> ${todayTx.length} transaksi</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#dcfce7;"><i class="fa-solid fa-chart-line" style="color:#16a34a;"></i></div>
      <div class="stat-info">
        <div class="stat-value">${fmtRp(pendapatanBulan)}</div>
        <div class="stat-label">Pendapatan Bulan Ini</div>
        <div class="stat-change up"><i class="fa-regular fa-calendar"></i> ${monthTx.length} transaksi</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#fef3c7;"><i class="fa-solid fa-cart-shopping" style="color:#d97706;"></i></div>
      <div class="stat-info">
        <div class="stat-value">${fmtRp(pembelianBulan)}</div>
        <div class="stat-label">Pembelian Bulan Ini</div>
        <div class="stat-change" style="color:var(--text2);"><i class="fa-solid fa-box"></i> ${DB.notaBeli.filter(n => n.tanggal.startsWith(month_str)).length} nota</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#fee2e2;"><i class="fa-solid fa-sack-xmark" style="color:#dc2626;"></i></div>
      <div class="stat-info">
        <div class="stat-value">${fmtRp(totalPiutang)}</div>
        <div class="stat-label">Total Piutang</div>
        <div class="stat-change ${totalPiutang > 0 ? 'down' : 'up'}">${totalPiutang > 0 ? '<i class="fa-solid fa-triangle-exclamation"></i> Belum lunas' : '<i class="fa-solid fa-circle-check"></i> Bersih'}</div>
      </div>
    </div>
  </div>

  <div class="dash-grid" style="margin-bottom:16px;">
    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fa-solid fa-chart-bar"></i> Penjualan 7 Hari</span></div>
      <div class="card-body">
        <div class="chart-bar-container">
          ${chartData.map(c => `
            <div class="chart-bar-wrap">
              <div style="font-size:10px;color:var(--text2);font-weight:600;">${c.val > 0 ? fmtRp(Math.round(c.val / 1000)) + 'k' : ''}</div>
              <div class="chart-bar" style="height:${Math.max(4, Math.round(c.val / maxVal * 80))}px;"></div>
              <div class="chart-label">${c.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fa-solid fa-triangle-exclamation"></i> Stok Menipis</span><span class="badge badge-danger">${stokRendah.length}</span></div>
      <div class="card-body" style="padding:8px 12px;">
        ${stokRendah.length === 0 ? '<div style="text-align:center;padding:20px;color:var(--success);"><i class="fa-solid fa-circle-check"></i> Stok aman</div>' :
          stokRendah.slice(0, 5).map(b => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;background:var(--surface2);margin-bottom:6px;">
            <span style="font-size:20px;"><i class="${b.emoji}"></i></span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(b.nama)}</div>
              <div style="font-size:11px;color:var(--danger);">Stok: ${b.stok} ${escapeHtml(b.satuan)} (min: ${b.stokMin})</div>
            </div>
            <button class="btn btn-xs btn-warning" onclick="showPage('restock')">Restock</button>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <span class="card-title"><i class="fa-solid fa-receipt"></i> Transaksi Terbaru</span>
      <button class="btn btn-outline btn-sm" onclick="showPage('laporan')">Lihat Semua</button>
    </div>
    <div class="card-body" style="padding:0;">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>No Nota</th><th>Pelanggan</th><th>Total</th><th>Bayar</th><th>Metode</th><th>Status</th><th>Kasir</th></tr></thead>
          <tbody>
            ${recentOrders.length === 0 ? `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text3);">Belum ada transaksi</td></tr>` :
              recentOrders.map(o => `
              <tr>
                <td><strong>${o.noNota}</strong></td>
                <td>${escapeHtml(o.pelanggan)}</td>
                <td>${fmtRp(o.total)}</td>
                <td>${fmtRp(o.dp)}</td>
                <td><span class="badge badge-info">${escapeHtml(o.metode)}</span></td>
                <td><span class="badge ${o.lunas ? 'badge-success' : 'badge-warning'}">${escapeHtml(o.status)}</span></td>
                <td style="font-size:12px;">${escapeHtml(o.kasir)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}
