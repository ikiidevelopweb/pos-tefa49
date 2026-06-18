// --- KASIR POS ---
let kasirSearch='', kasirKategori='Semua';
function pageKasir(){
  return `
  <div class="page-header">
    <div class="page-header-left"><h2><i class="fa-solid fa-cash-register"></i> Kasir / Point of Sale</h2><p>Transaksi baru</p></div>
  </div>
  <div class="pos-layout">
    <div class="pos-products">
      <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
        <div class="search-bar" style="flex:1;min-width:200px;"><span class="search-icon"><i class="fa-solid fa-magnifying-glass"></i></span><input id="pos-search" placeholder="Cari barang..." oninput="filterPOS()"/></div>
        <select class="form-control" id="pos-kat" onchange="filterPOS()" style="width:auto;min-width:120px;">
          <option value="Semua">Semua Kategori</option>
          ${DB.kategori.map(k=>`<option>${k.nama}</option>`).join('')}
        </select>
      </div>
      <div class="product-grid" id="pos-grid"></div>
    </div>
    <div class="pos-cart">
      <div class="pos-cart-header"><i class="fa-solid fa-receipt"></i> Keranjang</div>
      <div class="pos-cart-items" id="pos-cart-items">
        <div style="text-align:center;padding:40px 20px;color:var(--text3);"><i class="fa-solid fa-cart-shopping"></i> Keranjang kosong</div>
      </div>
      <div class="pos-cart-footer">
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;"><span style="color:var(--text2);">Subtotal</span><span id="cart-sub">Rp 0</span></div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;color:var(--text2);">Diskon</span>
            <input type="number" id="cart-diskon" class="form-control" style="width:90px;padding:4px 8px;font-size:12px;" value="0" oninput="updateCartTotal()" placeholder="0"/>
          </div>
          <div style="display:flex;justify-content:space-between;font-weight:800;font-size:16px;border-top:1.5px solid var(--border);padding-top:8px;"><span>TOTAL</span><span id="cart-total" style="color:var(--primary);">Rp 0</span></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <select class="form-control" id="cart-metode">
            ${DB.metodePembayaran.filter(m=>m.aktif).map(m=>`<option>${m.nama}</option>`).join('')}
          </select>
          <div style="position:relative;" id="pelanggan-wrap">
            <div style="display:flex;gap:6px;align-items:center;">
              <div style="flex:1;position:relative;">
                <input id="cart-pelanggan-input" class="form-control" placeholder="Ketik nama pelanggan / cari..." autocomplete="off"
                  oninput="cariPelangganPOS()" onfocus="cariPelangganPOS()" onblur="setTimeout(()=>tutupDropdownPelanggan(),180)"
                  style="padding-right:28px;"/>
                <span style="position:absolute;right:9px;top:50%;transform:translateY(-50%);color:var(--text3);font-size:12px;pointer-events:none;"><i class="fa-solid fa-magnifying-glass"></i></span>
              </div>
              <button type="button" class="btn btn-outline btn-sm" onclick="tambahPelangganCepatPOS()" title="Tambah pelanggan baru" style="flex-shrink:0;padding:7px 10px;"><i class="fa-solid fa-user-plus"></i></button>
            </div>
            <div id="cart-pelanggan-id" style="display:none;"></div>
            <div id="pelanggan-dropdown" style="display:none;position:absolute;left:0;right:0;top:calc(100% + 4px);background:#fff;border:1.5px solid var(--border);border-radius:10px;box-shadow:var(--shadow-md);z-index:200;max-height:180px;overflow-y:auto;"></div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-outline" style="flex:1;" onclick="clearCart()"><i class="fa-solid fa-trash"></i> Batal</button>
            <button class="btn btn-success" style="flex:2;" onclick="prosesTransaksi()"><i class="fa-solid fa-check"></i> Bayar</button>
          </div>
          <button class="btn btn-outline" style="width:100%;font-size:12px;" onclick="simpanDP()"><i class="fa-solid fa-coins"></i> Simpan Sebagai DP</button>
        </div>
      </div>
    </div>
  </div>`;
}

function initKasir(){
  renderPOSGrid();
  renderCart();
}

// ===== PELANGGAN POS - SEARCH + MANUAL INPUT =====
let _posSelectedPelId = null;

function getPelangganPOS(){
  const input = document.getElementById('cart-pelanggan-input');
  const nama = input ? input.value.trim() : '';
  return { pelId: _posSelectedPelId, pelNama: nama || 'Umum' };
}

function cariPelangganPOS(){
  _posSelectedPelId = null; // reset selection on typing
  const input = document.getElementById('cart-pelanggan-input');
  const dd = document.getElementById('pelanggan-dropdown');
  if(!input || !dd) return;
  const q = input.value.trim().toLowerCase();
  const results = q
    ? DB.pelanggan.filter(p => p.nama.toLowerCase().includes(q) || (p.tlp||'').includes(q))
    : DB.pelanggan.slice(0, 8);
  if(results.length === 0 && q){
    dd.style.display = 'block';
    dd.innerHTML = `<div style="padding:10px 14px;color:var(--text3);font-size:13px;"><i class="fa-solid fa-user-plus"></i> "${input.value}" — akan dipakai sebagai nama baru. Klik <strong><i class="fa-solid fa-user-plus"></i></strong> untuk simpan ke daftar.</div>`;
    return;
  }
  if(results.length === 0){ dd.style.display='none'; return; }
  dd.style.display = 'block';
  dd.innerHTML = results.map(p=>`
    <div onclick="pilihPelangganPOS(${p.id},'${p.nama.replace(/'/g,"\\'")}')"
      style="padding:9px 14px;cursor:pointer;font-size:13px;display:flex;align-items:center;gap:10px;transition:background .15s;"
      onmouseover="this.style.background='var(--primary-light)'" onmouseout="this.style.background=''">
      <div style="width:30px;height:30px;border-radius:8px;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--primary);font-size:13px;flex-shrink:0;">${p.nama[0].toUpperCase()}</div>
      <div>
        <div style="font-weight:600;color:var(--text);">${p.nama}</div>
        <div style="font-size:11px;color:var(--text3);">${p.tlp||'—'} ${p.piutang>0?'· <span style="color:var(--danger);">Piutang '+fmtRp(p.piutang)+'</span>':''}</div>
      </div>
    </div>
  `).join('');
}

function pilihPelangganPOS(id, nama){
  _posSelectedPelId = id;
  const input = document.getElementById('cart-pelanggan-input');
  if(input){
    input.value = nama;
    input.style.borderColor = 'var(--success)';
    input.style.background = '#f0fdf4';
  }
  tutupDropdownPelanggan();
  showToast('Pelanggan: '+nama, 'success');
}

function tutupDropdownPelanggan(){
  const dd = document.getElementById('pelanggan-dropdown');
  if(dd) dd.style.display = 'none';
}

function resetPilihPelangganPOS(){
  _posSelectedPelId = null;
  const input = document.getElementById('cart-pelanggan-input');
  if(input){ input.value=''; input.style.borderColor=''; input.style.background=''; }
}

function tambahPelangganCepatPOS(){
  const input = document.getElementById('cart-pelanggan-input');
  const namaAwal = input ? input.value.trim() : '';
  openModal(`
    <div class="modal-header">
      <span class="modal-title"><i class="fa-solid fa-user-plus"></i> Tambah Pelanggan Baru</span>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-grid form-grid-2">
        <div class="form-group" style="grid-column:1/-1;">
          <label class="form-label">Nama Pelanggan <span style="color:var(--danger);">*</span></label>
          <input id="cp-nama" class="form-control" value="${namaAwal}" placeholder="Nama lengkap pelanggan" autofocus/>
        </div>
        <div class="form-group">
          <label class="form-label">No. Telepon</label>
          <input id="cp-tlp" class="form-control" placeholder="08xx..." type="tel"/>
        </div>
        <div class="form-group">
          <label class="form-label">Email (opsional)</label>
          <input id="cp-email" class="form-control" placeholder="email@..." type="email"/>
        </div>
        <div class="form-group" style="grid-column:1/-1;">
          <label class="form-label">Alamat (opsional)</label>
          <input id="cp-alamat" class="form-control" placeholder="Alamat pelanggan..."/>
        </div>
      </div>
      <div style="background:var(--primary-light);border-radius:9px;padding:10px 14px;margin-top:12px;font-size:12px;color:var(--primary);">
        <i class="fa-solid fa-circle-info"></i> Pelanggan akan langsung dipilih dan ditambahkan ke daftar master pelanggan.
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="simpanPelangganCepatPOS()"><i class="fa-solid fa-floppy-disk"></i> Simpan & Pilih</button>
    </div>
  `,'modal-sm');
}

function simpanPelangganCepatPOS(){
  const nama = document.getElementById('cp-nama').value.trim();
  if(!nama){ showToast('Nama pelanggan wajib diisi!','danger'); return; }
  const newPel = {
    id: Date.now(),
    nama,
    tlp: document.getElementById('cp-tlp').value.trim(),
    email: document.getElementById('cp-email').value.trim(),
    alamat: document.getElementById('cp-alamat').value.trim(),
    totalBeli: 0,
    piutang: 0,
  };
  DB.pelanggan.push(newPel);
  saveDB();
  closeModal();
  pilihPelangganPOS(newPel.id, newPel.nama);
  showToast('Pelanggan "'+nama+'" ditambahkan!','success');
}

function filterPOS(){
  kasirSearch = document.getElementById('pos-search').value.toLowerCase();
  kasirKategori = document.getElementById('pos-kat').value;
  renderPOSGrid();
}

function renderPOSGrid(){
  const grid = document.getElementById('pos-grid');
  if(!grid) return;
  let items = DB.barang;
  if(kasirKategori!=='Semua') items=items.filter(b=>b.kategori===kasirKategori);
  if(kasirSearch) items=items.filter(b=>b.nama.toLowerCase().includes(kasirSearch));
  grid.innerHTML = items.map(b=>`
    <div class="product-card" onclick="addToCart(${b.id})">
      ${b.img
        ? `<img class="product-img" src="${b.img}" alt="${b.nama}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" loading="lazy"/>
           <div class="product-img-fallback" style="display:none;"><i class="${b.emoji||'fa-solid fa-box'}"></i></div>`
        : `<div class="product-img-fallback"><i class="${b.emoji||'fa-solid fa-box'}"></i></div>`}
      <div class="product-name">${b.nama}</div>
      <div class="product-price">${fmtRp(b.hargaJual)}</div>
      <div style="font-size:10px;color:${b.stok<=b.stokMin?'var(--danger)':'var(--text3)'};">Stok: ${b.stok} ${b.satuan}</div>
    </div>
  `).join('') || '<div style="padding:20px;color:var(--text3);">Tidak ada barang</div>';
}

function addToCart(id){
  const b = DB.barang.find(x=>x.id===id);
  if(!b) return;
  const existing = appState.cart.find(c=>c.id===id);
  if(existing){ existing.qty++; }
  else { appState.cart.push({id:b.id,nama:b.nama,harga:b.hargaJual,qty:1,emoji:b.emoji,img:b.img||''}); }
  renderCart();
  showToast(b.nama+' ditambahkan','success');
}

function changeQty(id,delta){
  const item = appState.cart.find(c=>c.id===id);
  if(!item) return;
  item.qty += delta;
  if(item.qty<=0) appState.cart = appState.cart.filter(c=>c.id!==id);
  renderCart();
}

function removeFromCart(id){
  appState.cart = appState.cart.filter(c=>c.id!==id);
  renderCart();
}

function clearCart(){
  appState.cart=[];
  renderCart();
  resetPilihPelangganPOS();
}

function renderCart(){
  const el = document.getElementById('pos-cart-items');
  if(!el) return;
  if(appState.cart.length===0){
    el.innerHTML='<div style="text-align:center;padding:30px;color:var(--text3);"><i class="fa-solid fa-cart-shopping"></i> Keranjang kosong</div>';
    document.getElementById('cart-sub').textContent='Rp 0';
    document.getElementById('cart-total').textContent='Rp 0';
    return;
  }
  el.innerHTML = appState.cart.map(c=>`
    <div class="pos-cart-item">
      ${c.img
        ? `<img class="product-img-sm" src="${c.img}" alt="${c.nama}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" loading="lazy"/>
           <div class="product-img-fallback-sm" style="display:none;"><i class="${c.emoji||'fa-solid fa-box'}"></i></div>`
        : `<div class="product-img-fallback-sm"><i class="${c.emoji||'fa-solid fa-box'}"></i></div>`}
      <div style="flex:1;min-width:0;">
        <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.nama}</div>
        <div style="font-size:11px;color:var(--text2);">${fmtRp(c.harga)} / pcs</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
        <div class="qty-control">
          <button class="qty-btn" onclick="changeQty(${c.id},-1)">-</button>
          <span style="font-size:13px;font-weight:700;min-width:24px;text-align:center;">${c.qty}</span>
          <button class="qty-btn" onclick="changeQty(${c.id},1)">+</button>
          <button class="qty-btn" style="background:#fee2e2;color:var(--danger);" onclick="removeFromCart(${c.id})">×</button>
        </div>
        <div style="font-size:12px;font-weight:700;color:var(--primary);">${fmtRp(c.harga*c.qty)}</div>
      </div>
    </div>
  `).join('');
  updateCartTotal();
}

function updateCartTotal(){
  const sub = appState.cart.reduce((s,c)=>s+c.harga*c.qty,0);
  const diskon = parseInt(document.getElementById('cart-diskon')?.value||0)||0;
  const total = Math.max(0,sub-diskon);
  const subEl=document.getElementById('cart-sub');
  const totEl=document.getElementById('cart-total');
  if(subEl) subEl.textContent=fmtRp(sub);
  if(totEl) totEl.textContent=fmtRp(total);
}

function getCartTotal(){
  const sub=appState.cart.reduce((s,c)=>s+c.harga*c.qty,0);
  const diskon=parseInt(document.getElementById('cart-diskon')?.value||0)||0;
  return Math.max(0,sub-diskon);
}

function prosesTransaksi(){
  if(appState.cart.length===0){showToast('Keranjang kosong!','danger');return;}
  const total = getCartTotal();
  const metode = document.getElementById('cart-metode').value;
  const {pelId, pelNama} = getPelangganPOS();
  const pel = pelId ? DB.pelanggan.find(p=>p.id==pelId) : null;
  const namaDisplay = pel ? pel.nama : (pelNama || 'Umum');
  openModal(`
    <div class="modal-header"><span class="modal-title"><i class="fa-solid fa-credit-card"></i> Konfirmasi Pembayaran</span><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:32px;font-weight:800;color:var(--primary);">${fmtRp(total)}</div>
        <div style="color:var(--text2);">Metode: <strong>${metode}</strong></div>
        <div style="color:var(--text2);">Pelanggan: <strong>${namaDisplay}</strong></div>
      </div>
      ${metode==='Tunai'?`
        <div class="form-group" style="margin-bottom:12px;">
          <label class="form-label">Bayar Dengan</label>
          <input type="number" id="bayar-nominal" class="form-control" value="${total}" oninput="updateKembalian(${total})" placeholder="Nominal uang"/>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:700;padding:12px;background:var(--surface2);border-radius:9px;">
          <span>Kembalian</span><span id="kembalian-val" style="color:var(--success);">${fmtRp(0)}</span>
        </div>
      `:'<div style="text-align:center;padding:12px;color:var(--text2);">Lakukan pembayaran via '+metode+'</div>'}
      <div style="margin-top:12px;">
        <label class="form-label">Catatan (opsional)</label>
        <textarea class="form-control" id="nota-catatan" rows="2" placeholder="Catatan tambahan..."></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Batal</button>
      <button class="btn btn-success" onclick="bayarSelesai(${total},'${metode}',${pelId||'null'},'${namaDisplay.replace(/'/g,"\\'")}')"><i class="fa-solid fa-check-double"></i> Selesai & Cetak Struk</button>
    </div>
  `,'modal-sm');
}

function updateKembalian(total){
  const bayar = parseInt(document.getElementById('bayar-nominal').value)||0;
  const el = document.getElementById('kembalian-val');
  if(el) el.textContent = fmtRp(Math.max(0,bayar-total));
}

function bayarSelesai(total, metode, pelId, pelNamaManual){
  const noNota = genNoOrder();
  const items = appState.cart.map(c=>({id:c.id,nama:c.nama,qty:c.qty,harga:c.harga,subtotal:c.harga*c.qty}));
  const pel = pelId && pelId!='null' ? DB.pelanggan.find(p=>p.id==pelId) : null;
  const nota = {
    id: Date.now(),
    noNota,
    tanggal: today(),
    pelanggan: pel ? pel.nama : (pelNamaManual && pelNamaManual!=='Umum' ? pelNamaManual : 'Umum'),
    pelangganId: pelId&&pelId!='null'?pelId:null,
    items,
    total,
    dp: total,
    sisa: 0,
    lunas: true,
    metode,
    kasir: appState.user.nama,
    status: 'Lunas',
    statusOrder: 'Ready',
    catatan: document.getElementById('nota-catatan')?.value||'',
  };
  DB.notaJual.unshift(nota);
  if(pel){ pel.totalBeli += total; }
  // Kurangi stok
  items.forEach(item=>{ const b=DB.barang.find(x=>x.id===item.id); if(b) b.stok=Math.max(0,b.stok-item.qty); });
  saveDB();
  closeModal();
  appState.cart=[];
  resetPilihPelangganPOS();
  showStruk(nota);
  showToast('Transaksi berhasil! '+noNota,'success');
}

function simpanDP(){
  if(appState.cart.length===0){showToast('Keranjang kosong!','danger');return;}
  const total = getCartTotal();
  const {pelId, pelNama} = getPelangganPOS();
  const pelNamaDisplay = pelNama || 'Umum';
  openModal(`
    <div class="modal-header"><span class="modal-title"><i class="fa-solid fa-coins"></i> Simpan Sebagai DP</span><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div style="font-size:15px;margin-bottom:12px;">Total: <strong>${fmtRp(total)}</strong></div>
      <div style="background:var(--primary-light);border-radius:9px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:var(--primary);">
        <i class="fa-solid fa-user"></i> Pelanggan: <strong>${pelNamaDisplay}</strong>
        ${pelId?`<span class="badge badge-info" style="margin-left:6px;">Terdaftar</span>`:`<span class="badge badge-gray" style="margin-left:6px;">Nama Manual</span>`}
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Nominal DP</label>
          <input type="number" id="dp-nominal" class="form-control" value="${Math.floor(total/2)}" placeholder="Jumlah DP"/>
        </div>
        <div class="form-group">
          <label class="form-label">Deadline</label>
          <input type="date" id="dp-deadline" class="form-control" value="${today()}"/>
        </div>
        <div class="form-group" style="grid-column:1/-1;">
          <label class="form-label">Catatan</label>
          <input type="text" id="dp-catatan" class="form-control" placeholder="Catatan order..."/>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Batal</button>
      <button class="btn btn-warning" onclick="simpanDPSelesai(${total},${pelId||'null'},'${pelNamaDisplay.replace(/'/g,"\\'")}')"><i class="fa-solid fa-floppy-disk"></i> Simpan DP</button>
    </div>
  `,'modal-sm');
}

function simpanDPSelesai(total, pelId, pelNamaManual){
  const dp = parseInt(document.getElementById('dp-nominal').value)||0;
  const pel = pelId && pelId!='null' ? DB.pelanggan.find(p=>p.id==pelId) : null;
  const noNota = genNoOrder();
  const items = appState.cart.map(c=>({id:c.id,nama:c.nama,qty:c.qty,harga:c.harga,subtotal:c.harga*c.qty}));
  const nota = {
    id: Date.now(),
    noNota,
    tanggal: today(),
    pelanggan: pel ? pel.nama : (pelNamaManual && pelNamaManual!=='Umum' ? pelNamaManual : 'Umum'),
    pelangganId: pelId&&pelId!='null'?pelId:null,
    items,
    total,
    dp,
    sisa: total-dp,
    lunas: false,
    metode: 'Tunai (DP)',
    kasir: appState.user.nama,
    status: 'DP',
    statusOrder: 'Design',
    catatan: document.getElementById('dp-catatan')?.value||'',
    deadline: document.getElementById('dp-deadline')?.value||'',
  };
  DB.notaJual.unshift(nota);
  if(pel){ pel.piutang += (total-dp); }
  saveDB();
  closeModal();
  appState.cart=[];
  resetPilihPelangganPOS();
  showStruk(nota);
  showToast('DP tersimpan! '+noNota,'success');
}

function showStruk(nota){
  const tgl = new Date(nota.tanggal).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
  const pelData = nota.pelangganId ? DB.pelanggan.find(p=>p.id==nota.pelangganId) : null;
  const nomorTersimpan = pelData?.tlp ? pelData.tlp.replace(/\D/g,'').replace(/^0/,'62') : '';
  const toko = DB.pengaturanToko;
  openModal(`
    <div class="modal-header"><span class="modal-title"><i class="fa-solid fa-receipt"></i> Struk Pembelian</span><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body" style="padding-bottom:4px;">
      <div class="struk-preview" id="struk-content">
        <div class="struk-header">
          <div style="font-size:15px;font-weight:bold;">${toko.nama}</div>
          <div style="font-size:10px;">${toko.alamat}</div>
          <div style="font-size:10px;">Telp: ${toko.tlp}</div>
        </div>
        <div style="font-size:11px;margin:4px 0;">No: <strong>${nota.noNota}</strong></div>
        <div style="font-size:11px;">Tgl: ${tgl}</div>
        <div style="font-size:11px;">Kasir: ${nota.kasir}</div>
        <div style="font-size:11px;">Plgn: ${nota.pelanggan}</div>
        <div class="struk-divider"></div>
        ${nota.items.map(i=>`
          <div class="struk-row"><span style="font-size:11px;flex:1;">${i.nama}</span></div>
          <div class="struk-row"><span style="font-size:11px;">${i.qty} x ${fmtRp(i.harga)}</span><span style="font-size:11px;">${fmtRp(i.subtotal)}</span></div>
        `).join('')}
        <div class="struk-divider"></div>
        <div class="struk-row struk-total"><span>TOTAL</span><span>${fmtRp(nota.total)}</span></div>
        <div class="struk-row"><span>DP</span><span>${fmtRp(nota.dp)}</span></div>
        ${nota.sisa>0?`<div class="struk-row" style="color:red;"><span>SISA</span><span>${fmtRp(nota.sisa)}</span></div>`:''}
        <div class="struk-row"><span>Metode</span><span>${nota.metode}</span></div>
        <div class="struk-row"><span>Status</span><span>${nota.status}</span></div>
        <div class="struk-divider"></div>
        <div class="struk-footer">
          <div>★ Terima Kasih ★</div>
          <div>${toko.tagline}</div>
        </div>
      </div>

      <!-- WA SENDER SECTION -->
      <div style="margin-top:14px;background:linear-gradient(135deg,#e7fbe9 0%,#d4f8d4 100%);border-radius:12px;padding:14px 16px;border:1.5px solid #b2dfb2;">
        <div style="font-size:13px;font-weight:700;color:#1a7c1a;margin-bottom:10px;display:flex;align-items:center;gap:7px;">
          <i class="fa-brands fa-whatsapp" style="font-size:18px;"></i> Kirim Struk via WhatsApp
        </div>
        ${nomorTersimpan ? `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:8px 12px;background:#fff;border-radius:9px;border:1px solid #c3e6c3;cursor:pointer;" onclick="document.getElementById('wa-nomor').value='${nomorTersimpan}';highlightWAInput()">
          <i class="fa-solid fa-address-book" style="color:#25d366;font-size:15px;"></i>
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:600;color:#1a7c1a;">${pelData.nama}</div>
            <div style="font-size:11px;color:#555;">${pelData.tlp}</div>
          </div>
          <span style="font-size:10px;background:#25d366;color:#fff;padding:2px 8px;border-radius:20px;">Pakai</span>
        </div>` : ''}
        <div style="display:flex;gap:8px;align-items:center;">
          <div style="flex:1;position:relative;">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-weight:600;color:#555;font-size:13px;">+</span>
            <input id="wa-nomor" class="form-control" type="tel"
              placeholder="628xxxxxxxxxx"
              value="${nomorTersimpan}"
              style="padding-left:22px;border-color:#b2dfb2;background:#fff;font-size:13px;"
              oninput="this.value=this.value.replace(/[^0-9]/g,'')"
              onkeydown="if(event.key==='Enter')kirimWAStruk('${nota.noNota}','${nota.pelanggan.replace(/'/g,"\\'")}',${nota.total},${nota.dp},${nota.sisa},${JSON.stringify(nota.items).replace(/'/g,"\\'")},'${tgl}','${nota.metode}','${nota.status}','${nota.kasir}')"/>
          </div>
          <button class="btn" onclick="kirimWAStruk('${nota.noNota}','${nota.pelanggan.replace(/'/g,"\\'")}',${nota.total},${nota.dp},${nota.sisa},${JSON.stringify(nota.items).replace(/'/g,"\\'")},'${tgl}','${nota.metode}','${nota.status}','${nota.kasir}')"
            style="background:#25d366;color:#fff;font-weight:700;gap:6px;white-space:nowrap;flex-shrink:0;border:none;padding:9px 16px;border-radius:9px;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:13px;">
            <i class="fa-brands fa-whatsapp"></i> Kirim
          </button>
        </div>
        <div style="font-size:10px;color:#666;margin-top:6px;"></div>
      </div>
    </div>
    <div class="modal-footer" style="padding-top:10px;">
      <button class="btn btn-outline" onclick="closeModal()">Tutup</button>
      <button class="btn btn-success" onclick="window.print()"><i class="fa-solid fa-print"></i> Cetak</button>
    </div>
  `);
}

function highlightWAInput(){
  const el = document.getElementById('wa-nomor');
  if(el){ el.style.borderColor='#25d366'; el.style.background='#f0fff0'; el.focus(); }
}

function kirimWAStruk(noNota, pelanggan, total, dp, sisa, items, tgl, metode, status, kasir){
  const noEl = document.getElementById('wa-nomor');
  let nomor = (noEl ? noEl.value : '').replace(/\D/g,'');
  if(!nomor){ showToast('Masukkan nomor WhatsApp terlebih dahulu!','danger'); noEl&&noEl.focus(); return; }
  if(nomor.startsWith('0')) nomor = '62' + nomor.slice(1);
  if(!nomor.startsWith('62')){ showToast('Nomor harus diawali 62 (kode Indonesia)','danger'); return; }

  const toko = DB.pengaturanToko;
  const itemLines = items.map(i=>`  • ${i.nama}\n    ${i.qty} x ${fmtRp(i.harga)} = ${fmtRp(i.subtotal)}`).join('\n');
  const sisaLine = sisa > 0 ? `\n💳 *Sisa Bayar :* ${fmtRp(sisa)}` : '';

  const pesan =
`🖨️ *${toko.nama}*
${toko.alamat}
📞 ${toko.tlp}
─────────────────────
📋 *STRUK PEMBELIAN*
─────────────────────
No. Nota  : *${noNota}*
Tanggal   : ${tgl}
Pelanggan : ${pelanggan}
Kasir     : ${kasir}
─────────────────────
📦 *Detail Pesanan:*
${itemLines}
─────────────────────
💰 *Total     : ${fmtRp(total)}*
✅ *DP / Bayar: ${fmtRp(dp)}*${sisaLine}
💳 Metode    : ${metode}
📌 Status    : ${status}
─────────────────────
🙏 Terima kasih, ${pelanggan}!
_${toko.tagline}_ ✨`;

  const url = `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`;
  window.open(url, '_blank');
  showToast('Membuka WhatsApp ke +'+nomor,'success');
}

// legacy (kept for backward compat)
function kirimWA(noNota, pelanggan, total, dp){
  const toko = DB.pengaturanToko;
  const pesan = `Halo kak! 🖨️\n*${toko.nama}*\n\nKonfirmasi Order:\nNo. Nota: *${noNota}*\nPelanggan: ${pelanggan}\nTotal: *${fmtRp(total)}*\nDP: ${fmtRp(dp)}\nSisa: ${fmtRp(total-dp)}\n\nTerima kasih sudah percaya kepada kami 🙏\n_${toko.tagline}_`;
  const url = `https://wa.me/?text=${encodeURIComponent(pesan)}`;
  window.open(url,'_blank');
}

function lihatStrukNota(i){
  const nota = DB.notaJual[i];
  showStruk(nota);
  // Auto-focus WA input after modal renders
  setTimeout(()=>{
    const el = document.getElementById('wa-nomor');
    if(el){ el.focus(); el.scrollIntoView({behavior:'smooth',block:'center'}); }
  }, 200);
}

