/* ================================================================
   UTILS.JS — Helper umum: format angka, toast, modal, tanggal
   ================================================================ */

function fmt(n) { return new Intl.NumberFormat('id-ID').format(n || 0); }
function fmtRp(n) { return 'Rp ' + fmt(n); }
function today() { return new Date().toISOString().split('T')[0]; }
function monthYear() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = 'toast ' + (type || '');
  const icons = { success: 'fa-circle-check', danger: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  t.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${escapeHtml(msg)}</span>`;
  const container = document.getElementById('toast-container');
  if (!container) return;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function openModal(html, size = '') {
  const container = document.getElementById('modal-container');
  if (!container) return;
  container.innerHTML = `<div class="modal-overlay" onclick="closeModalIfOverlay(event)"><div class="modal ${size}">${html}</div></div>`;
}
function closeModal() {
  const container = document.getElementById('modal-container');
  if (container) container.innerHTML = '';
}
function closeModalIfOverlay(e) {
  if (e.target.classList.contains('modal-overlay')) closeModal();
}

function genNoOrder() {
  appState.orderCounter++;
  return 'TF' + String(appState.orderCounter).padStart(5, '0');
}

function startClock() {
  function tick() {
    const el = document.getElementById('clock-display');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  setInterval(tick, 1000);
}
