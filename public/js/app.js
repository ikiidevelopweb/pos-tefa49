/* ================================================================
   APP.JS — Entry point: inisialisasi aplikasi saat halaman dimuat
   ================================================================ */

document.addEventListener('DOMContentLoaded', async function () {
  // Render opsi role di form login dari MENUS keys (admin/kasir)
  const roleSelect = document.getElementById('l-role');
  if (roleSelect) {
    roleSelect.innerHTML = `<option value="admin">Admin</option><option value="kasir">Kasir</option>`;
  }

  updateSyncStatus('saving');

  // Muat data: coba cloud (Firestore) dulu, fallback localStorage / sample data
  await loadDBAsync();

  updateSyncStatus(_firebaseOK ? 'synced' : 'offline');

  // Enter key pada form login
  const passInput = document.getElementById('l-pass');
  if (passInput) {
    passInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doLogin();
    });
  }
  const userInput = document.getElementById('l-user');
  if (userInput) {
    userInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('l-pass').focus();
    });
  }

  console.log('%cTEFA BAHAGIA POS', 'color:#1a56db;font-weight:bold;font-size:14px;', '— Siap digunakan.');
});

// Tampilkan peringatan sebelum menutup tab jika ada keranjang aktif (mencegah kehilangan transaksi)
window.addEventListener('beforeunload', function (e) {
  if (appState.user && appState.cart && appState.cart.length > 0) {
    e.preventDefault();
    e.returnValue = '';
  }
});
