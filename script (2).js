// ======================= KONFIGURASI URL GOOGLE SCRIPT =======================  
const API_URL = 'https://script.google.com/macros/s/AKfycbyuSjt7dlJLXB_283b7dQNpEWm3LAjcPEwnO8ho0nF6OH82x9jKqXuRjB6pKp_-OcfLBg/exec';  
// ============================================================================  

let layananData = {};     // {layanan: [{paket, poin}] }  
let daftarKerjaan = [];  
let isHistoryVisible = true;  
let online = false;  

// --- DOM SELECTORS  
const statusOnline = document.getElementById('statusOnline');  
const tanggalEl = document.getElementById('tanggal');  
const layananEl = document.getElementById('layanan');  
const paketEl = document.getElementById('paket');  
const poinEl = document.getElementById('poin');  
const btnTambah = document.getElementById('btnTambah');  
const totalPoinEl = document.getElementById('totalPoin');  
const tabelBody = document.querySelector('#tabelKerjaan tbody');  
const btnToggleHistory = document.getElementById('btnToggleHistory');  

// --- INISIALISASI APP ---  
document.addEventListener('DOMContentLoaded', () => {  
  tanggalEl.valueAsDate = new Date();  
  cekOnlineGoogleSheet();  
  loadFromLocalStorage();  
  renderTabel();  
  updateTotalPoin();  
  renderTabelHitungLayanan();  
  setupEvents();  
});  

// CEK KONEKSI & FETCH DATA LAYANAN  
function cekOnlineGoogleSheet() {  
  statusOnline.textContent = "Cek koneksi...";  
  statusOnline.className = "status-indikator";  
  fetch(API_URL, {cache:"no-store"})  
    .then(res => res.json())  
    .then(data => {  
      online = true;  
      statusOnline.textContent = "Online";  
      statusOnline.className = "status-indikator online";  
      if(data && data.data) {  
        layananData = {};  
        data.data.forEach(row => {  
          if (!row.layanan) return;  
          if (!layananData[row.layanan]) layananData[row.layanan]=[];  
          layananData[row.layanan].push({  
            paket: row.paket,  
            poin: Number(row.poin)  
          });  
        });  
        populateLayanan();  
        populatePaket();  
        updatePoinDisplay();  
        renderTabelHitungLayanan();  
      }else{  
        layananData = {};  
        layananEl.innerHTML = '<option value="">(Tidak ada data)</option>';  
        paketEl.innerHTML = '<option value="">Pilih Layanan</option>';  
        updatePoinDisplay();  
        renderTabelHitungLayanan();  
      }  
    })  
    .catch(err => {  
      online = false;  
      statusOnline.textContent = "Offline";  
      statusOnline.className = "status-indikator offline";  
      layananEl.innerHTML = '<option value="">(Offline)</option>';  
      paketEl.innerHTML = '<option value="">Pilih Layanan</option>';  
      renderTabelHitungLayanan();  
    });  
}  

function populateLayanan() {  
  layananEl.innerHTML = '<option value="">Pilih Layanan</option>';  
  Object.keys(layananData).forEach(layanan => {  
    const opt = document.createElement('option');  
    opt.value = layanan;  
    opt.textContent = layanan;  
    layananEl.appendChild(opt);  
  });  
}  
function populatePaket() {  
  paketEl.innerHTML = '<option value="">Pilih Paket</option>';  
  if (!layananEl.value) return;  
  (layananData[layananEl.value]||[]).forEach(obj => {  
    const opt = document.createElement('option');  
    opt.value = obj.paket;  
    opt.textContent = `${obj.paket} (${obj.poin} poin)`;  
    paketEl.appendChild(opt);  
  });  
}  
function updatePoinDisplay() {  
  if(layananEl.value && paketEl.value){  
    const item = (layananData[layananEl.value]||[]).find(p=>p.paket===paketEl.value);  
    poinEl.textContent = item ? item.poin : '0';  
  } else {  
    poinEl.textContent = '0';  
  }  
}  
function setupEvents() {  
  layananEl.addEventListener('change', () => { populatePaket(); updatePoinDisplay(); });  
  paketEl.addEventListener('change', updatePoinDisplay);  
  btnTambah.addEventListener('click', tambahKerjaan);  
  btnToggleHistory.addEventListener('click', toggleHistory);  

  // Refresh manual online status dan data layanan setiap 2 menit  
  setInterval(cekOnlineGoogleSheet, 120000);  
}  
function tambahKerjaan() {  
  if(!layananEl.value || !paketEl.value) {  
    alert('Harap pilih layanan dan paket!');  
    return;  
  }  
  daftarKerjaan.push({  
    tanggal: tanggalEl.value,  
    layanan: layananEl.value,  
    paket: paketEl.value,  
    poin: parseFloat(poinEl.textContent)  
  });  
  saveToLocalStorage();  
  renderTabel();  
  updateTotalPoin();  
  renderTabelHitungLayanan();  
  // Reset paket & poin  
  paketEl.value = '';  
  poinEl.textContent = '0';  
}  
function renderTabel() {  
  tabelBody.innerHTML = '';  
  daftarKerjaan.forEach((k, i) => {  
    const tr = document.createElement('tr');  
    tr.innerHTML = `  
      <td>${formatTanggal(k.tanggal)}</td>  
      <td>${k.layanan}</td>  
      <td>${k.paket}</td>  
      <td>  
        ${k.poin}  
        <button class="btn-icon" onclick="hapusKerjaan(${i})" title="Hapus"><i class="fas fa-trash-alt"></i></button>  
      </td>  
    `;  
    tabelBody.appendChild(tr);  
  });  
}  
function toggleHistory() {  
  isHistoryVisible = !isHistoryVisible;  
  tabelBody.parentElement.style.display = isHistoryVisible ? '' : 'none';  
  btnToggleHistory.textContent = isHistoryVisible ? 'Sembunyikan' : 'Tampilkan';  
}  
function updateTotalPoin() {  
  const total = daftarKerjaan.reduce((a,b)=>a+b.poin,0);  
  totalPoinEl.textContent = total;  
}  
function saveToLocalStorage() {  
  localStorage.setItem('daftarKerjaan', JSON.stringify(daftarKerjaan));  
}  
function loadFromLocalStorage() {  
  const s = localStorage.getItem('daftarKerjaan');  
  if(s) daftarKerjaan = JSON.parse(s);  
}  
function formatTanggal(x){  
  const t = new Date(x);  
  return t.toLocaleDateString('id-ID', { year:'numeric', month:'2-digit', day:'2-digit' });  
}  
function hapusKerjaan(index) {  
  if(confirm('Yakin hapus?')) {  
    daftarKerjaan.splice(index,1);  
    saveToLocalStorage();  
    renderTabel();  
    updateTotalPoin();  
    renderTabelHitungLayanan();  
  }  
}  
window.hapusKerjaan = hapusKerjaan;  

// TAB NAVIGATION  
function showTab(tab, btn){  
  document.querySelectorAll('.tablink').forEach(x=>x.classList.remove('active'));  
  btn.classList.add('active');  
  document.querySelectorAll('.tabcontent').forEach(x=>x.classList.remove('active-content'));  
  document.getElementById(tab).classList.add('active-content');  
  if(tab==='chartTab') renderLayananChart();  
  if(tab==='statTab') updateStatistikPoin();  
  if(tab==='formTab') renderTabelHitungLayanan();  
}  

// GRAFIK LAYANAN DIPILIH  
let chartInstance = null;  
function renderLayananChart() {  
  const count = {};  
  daftarKerjaan.forEach(item => {  
    count[item.layanan] = (count[item.layanan]||0) + 1;  
  });  
  const labels = Object.keys(count);  
  const data = Object.values(count);  

  const ctx = document.getElementById('layananChart').getContext('2d');  
  if (chartInstance) chartInstance.destroy();  
  chartInstance = new Chart(ctx, {  
    type: 'bar',  
    data: {  
      labels: labels,  
      datasets: [{  
        label: 'Jumlah Dipilih',  
        data: data,  
        backgroundColor: 'rgba(54,162,235,0.6)',  
        borderColor: 'rgba(54,162,235,1)',  
        borderWidth: 1  
      }]  
    },  
    options: {  
      scales: { y: { beginAtZero:true, ticks:{precision:0} } }  
    }  
  });  
}  

// STATISTIK POIN HARIAN, MINGGUAN, BULANAN  
function updateStatistikPoin() {  
  const now = new Date();  
  // Harian  
  const hariIni = now.toISOString().slice(0,10);  
  const totalHarian = daftarKerjaan  
    .filter(item => item.tanggal===hariIni)  
    .reduce((a,b)=>a+b.poin,0);  
  // Mingguan (mulai Senin)  
  const startOfWeek = new Date(now);  
  startOfWeek.setDate(now.getDate() - (now.getDay()||7) + 1);  
  startOfWeek.setHours(0,0,0,0);  
  const totalMingguan = daftarKerjaan  
    .filter(item =>{  
      const tgl=new Date(item.tanggal);  
      return tgl >= startOfWeek && tgl <= now;  
    })  
    .reduce((a,b)=>a+b.poin,0);  
  // Bulanan  
  const bulan = now.getMonth(), tahun = now.getFullYear();  
  const totalBulanan = daftarKerjaan  
    .filter(item => {  
      const tgl=new Date(item.tanggal);  
      return tgl.getMonth()===bulan && tgl.getFullYear()===tahun;  
    })  
    .reduce((a,b)=>a+b.poin,0);  

  document.getElementById("statHarian").textContent   = totalHarian;  
  document.getElementById("statMingguan").textContent = totalMingguan;  
  document.getElementById("statBulanan").textContent  = totalBulanan;  
}  

// Tabel Banyaknya Layanan  
function renderTabelHitungLayanan() {  
  const tbody = document.getElementById('isiTabelHitung');  
  if (!tbody) return;  
  // Hitung layanan  
  const count = {};  
  daftarKerjaan.forEach(job => {  
    count[job.layanan] = (count[job.layanan]||0) +1;  
  });  
  tbody.innerHTML = '';  
  Object.keys(layananData).forEach(layanan => {  
    const tr = document.createElement('tr');  
    tr.innerHTML = `<td>${layanan}</td><td>${count[layanan]||0}</td>`;  
    tbody.appendChild(tr);  
  });  
}