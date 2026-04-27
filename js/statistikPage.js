let statCurrentDay = null;
let statDetailMode = 'kelas';
let statSortBy = 'ALPHA';

async function loadStatistik(container) {
  container.innerHTML = `
    <div class="container" id="statContainer">
      <h1 style="background: linear-gradient(90deg, #c084fc, #7b2cbf); -webkit-background-clip: text;">STATISTIK</h1>
      <div class="loading" id="statLoading">Memuat data...</div>
      <div id="statGeneralView" style="display:none;"></div>
      <div id="statDetailView" style="display:none;"></div>
    </div>`;

  try {
    if (!dataLoaded || allStudents.length === 0 || attendanceColumns.length === 0) {
      const res = await fetch(`${GAS_URL}?action=masterData`);
      const result = await res.json();
      if (result && result.students) {
        allStudents = result.students;
        attendanceColumns = result.columns || [];
      } else if (Array.isArray(result) && result.length > 0) {
        allStudents = result;
        attendanceColumns = result[0].absenColumns || [];
      }
      dataLoaded = true;
    }
    document.getElementById('statLoading').style.display = 'none';
    renderStatGeneral();
  } catch (err) {
    document.getElementById('statLoading').textContent = 'Error: ' + err.message;
  }
}

function renderStatGeneral() {
  const view = document.getElementById('statGeneralView');
  const detail = document.getElementById('statDetailView');
  if (view) view.style.display = 'block';
  if (detail) detail.style.display = 'none';

  let html = '<div class="stat-days-grid">';
  
  attendanceColumns.forEach((col, idx) => {
    const counts = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TERLAMBAT: 0, PAGI: 0 };
    allStudents.forEach(s => {
      const val = ((s.absensi || [])[idx] || '').toUpperCase();
      if (counts.hasOwnProperty(val)) counts[val]++;
    });

    const total = allStudents.length;
    const hadirTotal = counts.HADIR + counts.PAGI;
    const hadirPct = total > 0 ? Math.round((hadirTotal / total) * 100) : 0;

    html += `
      <div class="stat-day-card" onclick="openStatDetail(${idx})">
        <div class="stat-day-header">${col.header}</div>
        <div class="stat-day-main">
          <div class="stat-day-rate">${hadirPct}%</div>
          <div class="stat-day-sublabel">Kehadiran</div>
        </div>
        <div class="stat-day-bars">
          <div class="stat-day-minirow">
            <span class="stat-mini-label">Hadir</span>
            <div class="stat-mini-track"><div class="stat-mini-fill hadir" style="width:${total > 0 ? (hadirTotal / total * 100) : 0}%"></div></div>
            <span class="stat-mini-num">${hadirTotal}</span>
          </div>
          <div class="stat-day-minirow">
            <span class="stat-mini-label">Alpha</span>
            <div class="stat-mini-track"><div class="stat-mini-fill alpha" style="width:${total > 0 ? ((counts.ALPHA + counts.TERLAMBAT) / total * 100) : 0}%"></div></div>
            <span class="stat-mini-num">${counts.ALPHA}</span>
          </div>
          <div class="stat-day-minirow">
  <span class="stat-mini-label">Terlambat</span>
  <div class="stat-mini-track"><div class="stat-mini-fill terlambat" style="width:${total > 0 ? (counts.TERLAMBAT / total * 100) : 0}%"></div></div>
  <span class="stat-mini-num">${counts.TERLAMBAT}</span>
</div>
          <div class="stat-day-minirow">
            <span class="stat-mini-label">Izin</span>
            <div class="stat-mini-track"><div class="stat-mini-fill izin" style="width:${total > 0 ? (counts.IZIN / total * 100) : 0}%"></div></div>
            <span class="stat-mini-num">${counts.IZIN}</span>
          </div>
          <div class="stat-day-minirow">
            <span class="stat-mini-label">Sakit</span>
            <div class="stat-mini-track"><div class="stat-mini-fill sakit" style="width:${total > 0 ? (counts.SAKIT / total * 100) : 0}%"></div></div>
            <span class="stat-mini-num">${counts.SAKIT}</span>
          </div>
        </div>
      </div>`;
  });

  html += '</div>';
  view.innerHTML = html;
}

function openStatDetail(dayIndex) {
  statCurrentDay = dayIndex;
  statDetailMode = 'kelas';
  statSortBy = 'ALPHA';
  renderStatDetail();
}

function backToStatGeneral() {
  renderStatGeneral();
}

function setStatMode(mode) {
  statDetailMode = mode;
  renderStatDetail();
}

function setStatSort(sort) {
  statSortBy = sort;
  renderStatDetail();
}

function renderStatDetail() {
  const view = document.getElementById('statGeneralView');
  const detail = document.getElementById('statDetailView');
  if (view) view.style.display = 'none';
  if (detail) detail.style.display = 'block';
  if (statCurrentDay === null || !detail) return;

  const col = attendanceColumns[statCurrentDay];
  const counts = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TERLAMBAT: 0, PAGI: 0 };
  allStudents.forEach(s => {
    const val = ((s.absensi || [])[statCurrentDay] || '').toUpperCase();
    if (counts.hasOwnProperty(val)) counts[val]++;
  });
  const total = allStudents.length;

  const groups = {};
  allStudents.forEach(s => {
    const key = statDetailMode === 'kelas' ? (s.kelas || 'Tidak diketahui') : (s.ekstra || 'Tidak diketahui');
    if (!groups[key]) groups[key] = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TERLAMBAT: 0, PAGI: 0, total: 0 };
    const val = ((s.absensi || [])[statCurrentDay] || '').toUpperCase();
    if (groups[key].hasOwnProperty(val)) groups[key][val]++;
    groups[key].total++;
  });

  const sortedGroups = Object.entries(groups).sort((a, b) => {
    const av = a[1][statSortBy] || 0;
    const bv = b[1][statSortBy] || 0;
    return bv - av;
  });

  let html = `
    <div class="stat-detail-header">
      <button class="stat-back-btn" onclick="backToStatGeneral()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Kembali</span>
      </button>
      <div class="stat-detail-title">Detail: ${col.header}</div>
    </div>

    <div class="stat-detail-summary">
      <div class="stat-dpill">Hadir: ${counts.HADIR + counts.PAGI}</div>
      <div class="stat-dpill izin">Izin: ${counts.IZIN}</div>
      <div class="stat-dpill sakit">Sakit: ${counts.SAKIT}</div>
      <div class="stat-dpill alpha">Alpha: ${counts.ALPHA}</div>
      <div class="stat-dpill terlambat">Terlambat: ${counts.TERLAMBAT}</div>
      <div class="stat-dpill">Total: ${total}</div>
    </div>

    <div class="stat-toggle-group">
      <button class="stat-toggle ${statDetailMode === 'kelas' ? 'active' : ''}" onclick="setStatMode('kelas')">Per Kelas</button>
      <button class="stat-toggle ${statDetailMode === 'ekstra' ? 'active' : ''}" onclick="setStatMode('ekstra')">Per Ekstra</button>
    </div>

    <div class="stat-sort-label">Urutkan berdasarkan:</div>
    <div class="stat-sort-group">
      ${['HADIR', 'ALPHA', 'TERLAMBAT', 'IZIN', 'SAKIT'].map(s =>
        `<button class="stat-sort-btn ${statSortBy === s ? 'active' : ''}" onclick="setStatSort('${s}')">${s}</button>`
      ).join('')}
    </div>

    <div class="stat-detail-list">
  `;

  sortedGroups.forEach(([name, data]) => {
    const hadirTotal = data.HADIR + data.PAGI;
    const hadirPct = data.total > 0 ? Math.round((hadirTotal / data.total) * 100) : 0;
    const alphaPct = data.total > 0 ? Math.round(((data.ALPHA) / data.total) * 100) : 0;
    const terlambatPct = data.total > 0 ? Math.round(((data.TERLAMBAT) / data.total) * 100) : 0;

    html += `
      <div class="stat-detail-item">
        <div class="stat-detail-item-header">
          <div class="stat-detail-name">${name}</div>
          <div class="stat-detail-count">${data.total} siswa</div>
        </div>
        <div class="stat-detail-bars">
          <div class="stat-dbar-row">
            <span>Hadir</span>
            <div class="stat-dbar-track"><div class="stat-dbar-fill hadir" style="width:${hadirPct}%"></div></div>
            <span>${hadirTotal} (${hadirPct}%)</span>
          </div>
          <div class="stat-dbar-row">
            <span>Alpha</span>
            <div class="stat-dbar-track"><div class="stat-dbar-fill alpha" style="width:${alphaPct}%"></div></div>
            <span>${data.ALPHA} (${alphaPct}%)</span>
          </div>
          <div class="stat-dbar-row">
  <span>Terlambat</span>
  <div class="stat-dbar-track"><div class="stat-dbar-fill terlambat" style="width:${data.total > 0 ? (data.TERLAMBAT / data.total * 100) : 0}%"></div></div>
  <span>${data.TERLAMBAT}</span>
</div>
          <div class="stat-dbar-row">
            <span>Izin</span>
            <div class="stat-dbar-track"><div class="stat-dbar-fill izin" style="width:${data.total > 0 ? (data.IZIN / data.total * 100) : 0}%"></div></div>
            <span>${data.IZIN}</span>
          </div>
          <div class="stat-dbar-row">
            <span>Sakit</span>
            <div class="stat-dbar-track"><div class="stat-dbar-fill sakit" style="width:${data.total > 0 ? (data.SAKIT / data.total * 100) : 0}%"></div></div>
            <span>${data.SAKIT}</span>
          </div>
        </div>
      </div>`;
  });

  html += '</div>';
  detail.innerHTML = html;
}