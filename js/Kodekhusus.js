// ══════════════════════════════════════════════════════════════════════════════
// KODE KHUSUS
// ══════════════════════════════════════════════════════════════════════════════

function loadKodeKhusus(container) {
  container.innerHTML = `
    <div class="container">
      <h1 style="background: linear-gradient(90deg, #f59e0b, #d97706); -webkit-background-clip: text;">KODE KHUSUS</h1>
      <div class="loading" id="kodeLoading">Memuat data...</div>
      <div id="kodeContainer"></div>
    </div>
    <button class="kode-fab" id="kodeFab" onclick="showKodeGenerateForm()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>`;
  loadKodeKhususData();
}

async function loadKodeKhususData() {
  try {
    const res = await fetch(`${GAS_URL}?action=getKodeKhusus`);
    const result = await res.json();
    if (Array.isArray(result)) {
      kodeKhususList = result;
    } else if (result && result.codes) {
      kodeKhususList = result.codes;
    } else {
      kodeKhususList = [];
    }
    const ld = document.getElementById('kodeLoading');
    if (ld) ld.style.display = 'none';
    renderKodeKhususList();
  } catch (err) {
    const ld = document.getElementById('kodeLoading');
    if (ld) ld.textContent = 'Error: ' + err.message;
    console.error(err);
  }
}

function renderKodeKhususList() {
  const container = document.getElementById('kodeContainer');
  if (!container) return;

  const unused = kodeKhususList.filter(k => !k.status || k.status === '');
  const used = kodeKhususList.filter(k => k.status === 'used');

  let html = '';

  if (unused.length > 0) {
    html += `
      <div class="kode-section">
        <div class="kode-section-title">Kode Belum Digunakan (${unused.length})</div>
        <div class="kode-list">
          ${unused.map(k => kodeItemHTML(k, false)).join('')}
        </div>
      </div>`;
  }

  if (used.length > 0) {
    html += `
      <div class="kode-section">
        <div class="kode-section-title">Kode Sudah Digunakan (${used.length})</div>
        <div class="kode-list">
          ${used.slice(0, 10).map(k => kodeItemHTML(k, true)).join('')}
        </div>
        ${used.length > 10 ? `<div style="text-align:center;color:#555;font-size:12px;padding:12px;">...dan ${used.length - 10} lainnya</div>` : ''}
      </div>`;
  }

  if (kodeKhususList.length === 0) {
    html += `<div style="text-align:center;padding:40px;color:#555;">Belum ada kode khusus</div>`;
  }

  container.innerHTML = html;

  const fab = document.getElementById('kodeFab');
  if (fab) fab.style.display = 'flex';
}

function kodeItemHTML(kode, isUsed) {
  return `
    <div class="kode-item">
      <div class="kode-item-info">
        <div class="kode-item-name">${kode.nama || '-'}</div>
        <div class="kode-item-meta">${kode.kelas || '-'} · ID: ${kode.idSiswa || '-'}</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="kode-item-code">${kode.kode || '-----'}</div>
        <span class="kode-item-status ${isUsed ? 'kode-status-used' : 'kode-status-unused'}">${isUsed ? 'Used' : 'Unused'}</span>
      </div>
    </div>`;
}

function showKodeGenerateForm() {
  const container = document.getElementById('kodeContainer');
  if (!container) return;

  const fab = document.getElementById('kodeFab');
  if (fab) fab.style.display = 'none';

  kodeSelectedStudent = null;
  kodeGeneratedCodes = [];

  container.innerHTML = `
    <div class="kode-generate-form">
      <h3>Buat Kode Khusus Baru</h3>
      <div class="kode-search-wrap">
        <div class="search-box">
          <input type="text" id="kodeSearchInput" placeholder="Cari nama siswa..." autocomplete="off">
        </div>
        <div class="qr-autocomplete" id="kodeAutocomplete"></div>
      </div>
      <div id="kodeSelectedStudent"></div>
      <div id="kodeGeneratedCodes"></div>
      <div id="kodeActionButtons"></div>
      <button class="kode-cancel-btn" onclick="renderKodeKhususList()">Batal</button>
    </div>`;

  if (sumberStudents.length === 0) {
    loadSumberData().then(() => setupKodeSearch());
  } else {
    setupKodeSearch();
  }
}

function setupKodeSearch() {
  const input = document.getElementById('kodeSearchInput');
  const auto = document.getElementById('kodeAutocomplete');
  if (!input || !auto) return;

  input.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    auto.innerHTML = '';
    if (!query) { auto.classList.remove('show'); return; }

    const matches = sumberStudents.filter(s => s.nama && s.nama.toLowerCase().includes(query)).slice(0, 8);
    if (matches.length === 0) { auto.classList.remove('show'); return; }

    matches.forEach(s => {
      const item = document.createElement('div');
      item.className = 'qr-autocomplete-item';
      item.innerHTML = `<div class="name">${s.nama || 'Tanpa Nama'}</div><div class="meta">${s.kelas || '-'} · ID: ${s.id || 'KOSONG'}</div>`;
      item.addEventListener('click', () => selectKodeStudent(s));
      auto.appendChild(item);
    });
    auto.classList.add('show');
  });
}

function selectKodeStudent(student) {
  if (!student || !student.id) {
    showIndicator('error', 'Data siswa tidak lengkap');
    return;
  }
  kodeSelectedStudent = student;

  const auto = document.getElementById('kodeAutocomplete');
  const input = document.getElementById('kodeSearchInput');
  if (auto) auto.classList.remove('show');
  if (input) input.value = student.nama || '';

  const container = document.getElementById('kodeSelectedStudent');
  if (container) {
    container.innerHTML = `
      <div class="kode-selected-student">
        <div class="label">Siswa Terpilih</div>
        <div class="name">${student.nama}</div>
        <div class="meta">${student.kelas || '-'} · ID: ${student.id}</div>
      </div>`;
  }

  renderKodeActionButtons();
}

function renderKodeActionButtons() {
  const container = document.getElementById('kodeActionButtons');
  if (!container) return;

    if (kodeGeneratedCodes.length === 2) {
    const isConnected = bluetoothCharacteristic !== null;
    container.innerHTML = `
      <button class="qr-connect-btn ${isConnected ? 'connected' : ''}" id="kodeConnectBtn" onclick="connectBluetooth()" style="margin-bottom:12px;width:100%;justify-content:center;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"/>
        </svg>
        <span>${isConnected ? 'Printer Terhubung' : 'Hubungkan Printer'}</span>
      </button>
      <button class="kode-print-btn" id="kodePrintBtn" onclick="printKodeThermal()" ${!isConnected ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 6 2 18 2 18 9"/>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        <span>Cetak Kode</span>
      </button>`;
  } else {
    // Show generate button
    container.innerHTML = `
      <button class="kode-generate-btn" id="kodeGenerateBtn" onclick="generateKodeKhusus()" ${!kodeSelectedStudent ? 'disabled' : ''}>
        Generate 2 Kode
      </button>`;
  }
}

async function generateKodeKhusus() {
  if (!kodeSelectedStudent) return;

  const existingCodes = new Set(kodeKhususList.map(k => k.kode));
  kodeGeneratedCodes = [];
  let attempts = 0;

  while (kodeGeneratedCodes.length < 2 && attempts < 100) {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    if (!existingCodes.has(code) && !kodeGeneratedCodes.includes(code)) {
      kodeGeneratedCodes.push(code);
    }
    attempts++;
  }

  if (kodeGeneratedCodes.length < 2) {
    showIndicator('error', 'Gagal generate kode unik, coba lagi');
    return;
  }
  try {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'saveKodeKhusus',
      idSiswa: kodeSelectedStudent.id,
      nama: kodeSelectedStudent.nama,
      kelas: kodeSelectedStudent.kelas || '',
      kodes: kodeGeneratedCodes
    })
  });
  const result = await res.json();
  if (result.status !== 'ok') throw new Error(result.message || 'Gagal menyimpan');
  
  showIndicator('success', 'Kode tersimpan!');
  renderKodeActionButtons(); // shows print button
} catch (err) {
  showIndicator('error', err.message || 'Gagal menyimpan');
  kodeGeneratedCodes = []; // reset so user can retry
}

}

async function printKodeThermal() {
  if (!kodeSelectedStudent || kodeGeneratedCodes.length !== 2) {
    showIndicator('error', 'Generate kode terlebih dahulu');
    return;
  }
if (!bluetoothCharacteristic) {
    showIndicator('error', 'Hubungkan printer dulu');
    return;
  }
  const printBtn = document.getElementById('kodePrintBtn');

  try {
    if (printBtn) printBtn.disabled = true;

    // Save to sheet first — FIX: action goes in body, not URL
   
    // Print via Bluetooth
    await sendKodeToPrinter();

    showIndicator('success', 'Kode dicetak!');

    setTimeout(() => {
      kodeSelectedStudent = null;
      kodeGeneratedCodes = [];
      loadKodeKhususData();
    }, 1500);

  } catch (err) {
    console.error('Kode print error:', err);
    showIndicator('error', err.message || 'Gagal mencetak');
    if (printBtn) printBtn.disabled = false;
  }
}
async function sendKodeToPrinter() {
  const encoder = new EscPosEncoder();
  let commands = [];

  // Init
  commands.push(0x1B, 0x40);
  // Center align
  commands.push(0x1B, 0x61, 0x01);
  // Bold + big title
  commands.push(0x1B, 0x21, 0x30);
  commands.push(...encoder.encodeText('KODE KHUSUS'));
  commands.push(0x0A, 0x0A);
  // Normal
  commands.push(0x1B, 0x21, 0x00);
  commands.push(...encoder.encodeText(kodeSelectedStudent.nama || 'Siswa'));
  commands.push(0x0A);
  commands.push(...encoder.encodeText(kodeSelectedStudent.kelas || '-'));
  commands.push(0x0A, 0x0A);

  // Codes
  kodeGeneratedCodes.forEach((code, idx) => {
    commands.push(0x1B, 0x21, 0x20);
    commands.push(...encoder.encodeText(`KODE ${idx + 1}`));
    commands.push(0x0A);
    commands.push(0x1B, 0x21, 0x30);
    commands.push(...encoder.encodeText(code));
    commands.push(0x0A, 0x0A);
  });

  // Reset + cut
  commands.push(0x1B, 0x21, 0x00);
  commands.push(0x1B, 0x64, 0x03);
  commands.push(0x1D, 0x56, 0x00);

  // Send chunks
  const chunkSize = 64;
  for (let i = 0; i < commands.length; i += chunkSize) {
    const chunk = new Uint8Array(commands.slice(i, i + chunkSize));
    if (bluetoothCharacteristic.properties.writeWithoutResponse) {
      await bluetoothCharacteristic.writeValueWithoutResponse(chunk);
    } else {
      await bluetoothCharacteristic.writeValueWithResponse(chunk);
    }
    await new Promise(r => setTimeout(r, 50));
  }
}

