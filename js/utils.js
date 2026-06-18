// ===== UTILS =====
function fmt(n){return new Intl.NumberFormat('id-ID').format(n);}
function fmtRp(n){return 'Rp '+fmt(n);}
function today(){return new Date().toISOString().split('T')[0];}
function monthYear(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}

function showToast(msg,type='info'){
  const t = document.createElement('div');
  t.className='toast '+(type||'');
  t.textContent=msg;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(()=>t.remove(),3000);
}

function openModal(html,size=''){
  document.getElementById('modal-container').innerHTML=`<div class="modal-overlay" onclick="closeModalIfOverlay(event)"><div class="modal ${size}">${html}</div></div>`;
}
function closeModal(){document.getElementById('modal-container').innerHTML='';}
function closeModalIfOverlay(e){if(e.target.classList.contains('modal-overlay')) closeModal();}

function genNoOrder(){
  appState.orderCounter++;
  return 'TF'+String(appState.orderCounter).padStart(5,'0');
}

