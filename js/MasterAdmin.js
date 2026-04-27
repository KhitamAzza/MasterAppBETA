// ══════════════════════════════════════════════════════════════════════════════
// MASTER ADMIN
// ══════════════════════════════════════════════════════════════════════════════

function loadMasterAdmin(container) {
  container.innerHTML = `
    <div class="container">
      <h1>MASTER ADMIN</h1>
      <div class="stats">
        <div class="stat-box"><div class="number" id="totalStudents">-</div><div class="label">Total Siswa</div></div>
        <div class="stat-box"><div class="number" id="totalDays">-</div><div class="label">Hari Tercatat</div></div>
      </div>
      <div class="search-box"><input type="text" id="searchInput" placeholder="Cari nama siswa..." autocomplete="off"></div>
      <div class="loading" id="loading">Memuat data...</div>
      <div class="no-results" id="noResults">Tidak ada siswa dengan nama tersebut</div>
      <div id="studentContainer"></div>
    </div>`;
  container.querySelector('#searchInput').addEventListener('input', handleSearch);
  loadData();
}

async function loadData() {
  try {
    const res = await fetch(`${GAS_URL}?action=masterData`);
    const result = await res.json();
    if (result && result.students) {
      allStudents = result.students;
      attendanceColumns = result.columns || [];
    } else if (Array.isArray(result) && result.length > 0) {
      allStudents = result;
      attendanceColumns = result[0].absenColumns || [];
    } else throw new Error('Format data tidak valid');
    const ts = document.getElementById('totalStudents');
    const td = document.getElementById('totalDays');
    const ld = document.getElementById('loading');
    if (ts) ts.textContent = allStudents.length;
    if (td) td.textContent = attendanceColumns.length;
    if (ld) ld.style.display = 'none';
    dataLoaded = true;
  } catch (err) {
    const ld = document.getElementById('loading');
    if (ld) ld.textContent = 'Error memuat data: ' + err.message;
    console.error(err);
  }
}

function handleSearch(e) {
  const query = e.target.value.trim().toLowerCase();
  const container = document.getElementById('studentContainer');
  const noResults = document.getElementById('noResults');
  if (!container) return;
  container.innerHTML = '';
  if (!query) { if (noResults) noResults.style.display = 'none'; return; }
  const matches = allStudents.filter(s => s.nama.toLowerCase().includes(query)).slice(0, 5);
  if (matches.length === 0) { if (noResults) noResults.style.display = 'block'; return; }
  if (noResults) noResults.style.display = 'none';
  matches.forEach(s => container.appendChild(createStudentItem(s)));
}

function createStudentItem(student) {
  const item = document.createElement('div');
  item.className = 'student-item';
  item.innerHTML = `<strong>${student.nama}</strong><span style="color:#888;font-size:13px;margin-left:10px;">${student.kelas} · ${student.ekstra}</span>`;
  item.addEventListener('click', () => openStudentModal(student));
  return item;
}

function openStudentModal(student) {
  history.pushState({ studentModal: true }, '', '#student');
  const modal = document.getElementById('studentModal');
  const content = document.getElementById('modalContent');
  if (!modal || !content) return;
  content.innerHTML = '';
  content.appendChild(createStudentCard(student));
  modal.classList.add('show');
}

function createStudentCard(student) {
  const card = document.createElement('div');
  card.className = 'student-card active';
  const info = document.createElement('div');
  info.className = 'student-info';
  info.innerHTML = `
    <div class="info-item"><label>ID</label><div class="value id">${student.id || '-'}</div></div>
    <div class="info-item"><label>Nama</label><div class="value nama">${student.nama}</div></div>
    <div class="info-item"><label>Kelas</label><div class="value kelas">${student.kelas || '-'}</div></div>
    <div class="info-item"><label>Ekstra</label><div class="value ekstra">${student.ekstra || '-'}</div></div>
    <div class="info-item"><label>Denda</label><div class="value">Rp ${Number(student.denda || 0).toLocaleString('id-ID')}</div></div>
    <div class="info-item"><label>Status</label><div class="value">${student.status || '-'}</div></div>`;
  const attSection = document.createElement('div');
  attSection.className = 'attendance-section';
  attSection.innerHTML = '<h3>Edit Absensi Harian</h3>';
  const grid = document.createElement('div');
  grid.className = 'attendance-grid';
  attendanceColumns.forEach((col, idx) => {
    const currentValue = (student.absensi[idx] || '').toUpperCase();
    const item = document.createElement('div');
    item.className = 'attendance-item';
    const label = document.createElement('label');
    label.textContent = col.header;
    const select = document.createElement('select');
    select.dataset.row = student.rowIndex;
    select.dataset.col = col.col + 1;
    select.dataset.date = col.header;
    STATUS_OPTIONS.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === currentValue) option.selected = true;
      select.appendChild(option);
    });
    updateSelectStyle(select, currentValue);
    select.addEventListener('change', (e) => { updateSelectStyle(e.target, e.target.value); saveAttendance(e.target); });
    item.appendChild(label);
    item.appendChild(select);
    grid.appendChild(item);
  });
  attSection.appendChild(grid);
  card.appendChild(info);
  card.appendChild(attSection);
  return card;
}

function updateSelectStyle(select, value) {
  select.className = '';
  const option = STATUS_OPTIONS.find(o => o.value === value);
  if (option && option.class) select.classList.add(option.class);
}

async function saveAttendance(select) {
  const row = parseInt(select.dataset.row);
  const col = parseInt(select.dataset.col);
  const value = select.value;
  const date = select.dataset.date;
  if (!row || !col) { showIndicator('error', 'Data baris/kolom tidak valid!'); return; }
  try {
    const res = await fetch(`${GAS_URL}?action=updateAttendance&rowIndex=${row}&columnIndex=${col}&value=${encodeURIComponent(value)}`);
    const result = await res.json();
    if (result.status === 'ok') showIndicator('success', `Tersimpan: ${date}`);
    else throw new Error(result.message || 'Unknown error');
  } catch (err) {
    showIndicator('error', 'Gagal menyimpan!');
    console.error('saveAttendance error:', err);
  }
}
