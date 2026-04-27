// ─── Init ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  window.addEventListener('popstate', handlePopState);
  document.getElementById('studentModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'studentModal') document.getElementById('studentModal').classList.remove('show');
  });
});

function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  const clockTime = document.getElementById('clockTime');
  const clockDate = document.getElementById('clockDate');
  if (clockTime) clockTime.textContent = timeStr;
  if (clockDate) clockDate.textContent = dateStr;
}

// ─── Navigation ─────────────────────────────────────────────────────────────

function openAppModal(appId) {
  currentApp = appId;
  const modal = document.getElementById('appModal');
  const content = document.getElementById('appModalContent');
  content.innerHTML = '';
  modal.classList.add('show');
  history.pushState({ app: appId }, '', '#');
  loadAppContent(appId, content);
}

function closeAppModal() {
  const studentModal = document.getElementById('studentModal');
  const appModal = document.getElementById('appModal');

  // If student detail modal is open, close it first (stay in app)
  if (studentModal?.classList.contains('show')) {
    studentModal.classList.remove('show');
    history.pushState({ app: currentApp }, '', '#');
    return;
  }

  // Otherwise close the whole app and return to main menu
  appModal.classList.remove('show');
  currentApp = null;
}

function handlePopState(e) {
  const modal = document.getElementById('appModal');
  const studentModal = document.getElementById('studentModal');

  if (studentModal?.classList.contains('show')) {
    studentModal.classList.remove('show');
    history.pushState({ app: currentApp }, '', '#');
    return;
  }

  if (modal?.classList.contains('show')) {
    modal.classList.remove('show');
    currentApp = null;
  }
}

function loadAppContent(appId, container) {
  if (appId === 'masterAdmin') loadMasterAdmin(container);
  else if (appId === 'qrPrinter') loadQrPrinter(container);
  else if (appId === 'kodeKhusus') loadKodeKhusus(container);
  else if (appId === 'statistik') loadStatistik(container);
}
