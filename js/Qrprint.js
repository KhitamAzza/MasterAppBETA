// ══════════════════════════════════════════════════════════════════════════════
// QR PRINTER
// ══════════════════════════════════════════════════════════════════════════════

function loadQrPrinter(container) {
  container.innerHTML = `
    <div class="container">
      <h1>CETAK QR CODE</h1>
      <div class="qr-search-container">
        <div class="search-box">
          <input type="text" id="qrSearchInput" placeholder="Cari nama siswa..." autocomplete="off">
        </div>
        <div class="qr-autocomplete" id="qrAutocomplete"></div>
      </div>
      <div class="loading" id="qrLoading">Memuat data siswa...</div>
      <div id="qrResult"></div>
    </div>`;
  container.querySelector('#qrSearchInput').addEventListener('input', handleQrSearch);
  loadSumberData();
}

async function loadSumberData() {
  try {
    const res = await fetch(`${GAS_URL}?action=getSumberStudents`);
    const result = await res.json();
    if (Array.isArray(result)) {
      sumberStudents = result;
    } else if (result && result.students) {
      sumberStudents = result.students;
    } else {
      throw new Error('Format data tidak valid');
    }
    const ld = document.getElementById('qrLoading');
    if (ld) ld.style.display = 'none';
  } catch (err) {
    const ld = document.getElementById('qrLoading');
    if (ld) ld.textContent = 'Error: ' + err.message;
    console.error(err);
  }
}

function handleQrSearch(e) {
  const query = e.target.value.trim().toLowerCase();
  const auto = document.getElementById('qrAutocomplete');
  if (!auto) return;
  auto.innerHTML = '';
  if (!query) { auto.classList.remove('show'); return; }
  const matches = sumberStudents.filter(s => s.nama && s.nama.toLowerCase().includes(query)).slice(0, 8);
  if (matches.length === 0) { auto.classList.remove('show'); return; }
  matches.forEach((s) => {
    const item = document.createElement('div');
    item.className = 'qr-autocomplete-item';
    item.innerHTML = `<div class="name">${s.nama || 'Tanpa Nama'}</div><div class="meta">${s.kelas || '-'} · ID: ${s.id || 'KOSONG'}</div>`;
    item.addEventListener('click', () => selectQrStudent(s));
    auto.appendChild(item);
  });
  auto.classList.add('show');
}

function selectQrStudent(student) {
  if (!student || !student.id) {
    showIndicator('error', 'Data siswa tidak lengkap (ID kosong)');
    console.error("Invalid student selected:", student);
    return;
  }
  selectedStudent = student;
  document.getElementById('qrAutocomplete').classList.remove('show');
  document.getElementById('qrSearchInput').value = student.nama || '';
  renderQrCard(student);
}

function renderQrCard(student) {
  const container = document.getElementById('qrResult');
  if (!container) return;
  const safeId = String(student.id || "").trim();
  if (!safeId) {
    container.innerHTML = `<div class="loading" style="color:#f87171;">Error: ID siswa kosong</div>`;
    return;
  }
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(safeId)}&size=200&margin=2&dark=000000&light=ffffff`;
  const isConnected = bluetoothCharacteristic !== null;
  container.innerHTML = `
    <div class="qr-card">
      <div class="qr-card-header">
        <h2>${student.nama || 'Tanpa Nama'}</h2>
        <div class="kelas">${student.kelas || '-'}</div>
      </div>
      <div class="qr-image-wrap">
        <img src="${qrUrl}" alt="QR Code" id="qrImage" crossorigin="anonymous" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23fff%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23333%22 font-size=%2214%22%3EQR Error%3C/text%3E%3C/svg%3E'">
      </div>
      <div class="qr-id-text">${safeId}</div>
      <button class="qr-connect-btn ${isConnected ? 'connected' : ''}" id="qrConnectBtn" onclick="connectBluetooth()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"/>
        </svg>
        <span>${isConnected ? 'Printer Terhubung' : 'Hubungkan Printer'}</span>
      </button>
      <br>
      <button class="qr-print-btn" id="qrPrintBtn" onclick="printQrThermal()" ${!isConnected ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 6 2 18 2 18 9"/>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        <span>Cetak QR</span>
      </button>
      <div class="qr-status" id="qrStatus">${isConnected ? 'Siap mencetak' : 'Hubungkan printer Bluetooth terlebih dahulu'}</div>
    </div>`;
}


// ─── ESC/POS Print QR as Raster Image ─────────────────────────────────────

async function printQrThermal() {
  if (!selectedStudent) {
    showIndicator('error', 'Pilih siswa terlebih dahulu');
    return;
  }
  if (!selectedStudent.id) {
    showIndicator('error', 'ID siswa kosong, tidak bisa mencetak');
    return;
  }
  if (!bluetoothCharacteristic) {
    showIndicator('error', 'Hubungkan printer dulu');
    return;
  }

  const status = document.getElementById('qrStatus');
  const printBtn = document.getElementById('qrPrintBtn');

  try {
    if (printBtn) printBtn.disabled = true;
    if (status) status.textContent = 'Mencetak...';

    const safeId = String(selectedStudent.id).trim();
    const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(safeId)}&size=300&margin=2&dark=000000&light=ffffff`;

    // Fetch the QR image and convert to bitmap
    const imgData = await fetchQrImageData(qrUrl);

    const encoder = new EscPosEncoder();
    let commands = [];

    // Init printer
    commands.push(0x1B, 0x40);

    // Center align
    commands.push(0x1B, 0x61, 0x01);

    // Bold + double height + double width for name
    commands.push(0x1B, 0x21, 0x30);
    commands.push(...encoder.encodeText(selectedStudent.nama || 'Siswa'));
    commands.push(0x0A);

    // Normal for class
    commands.push(0x1B, 0x21, 0x00);
    commands.push(...encoder.encodeText(selectedStudent.kelas || '-'));
    commands.push(0x0A, 0x0A);

    // Print QR as raster image (GS v 0)
    const rasterCommands = encoder.rasterImage(imgData.width, imgData.height, imgData.data);
    commands.push(...rasterCommands);

    commands.push(0x0A, 0x0A);

    // ID below QR
    commands.push(0x1B, 0x21, 0x10);
    commands.push(...encoder.encodeText(safeId));
    commands.push(0x0A, 0x0A);

    // Feed and cut
    commands.push(0x1B, 0x64, 0x03);
    commands.push(0x1D, 0x56, 0x00);

    // Send in chunks
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

    if (status) status.textContent = 'Selesai mencetak!';
    showIndicator('success', 'QR berhasil dicetak!');

  } catch (err) {
    console.error('Print error:', err);
    if (status) status.textContent = 'Gagal mencetak: ' + err.message;
    showIndicator('error', 'Gagal mencetak: ' + err.message);
  } finally {
    if (printBtn) printBtn.disabled = false;
  }
}

