// ─── Bluetooth Connection ───────────────────────────────────────────────────

async function connectBluetooth() {
  const status = document.getElementById('qrStatus');
  const connectBtn = document.getElementById('qrConnectBtn');
  const printBtn = document.getElementById('qrPrintBtn');

  try {
    if (status) status.textContent = 'Mencari printer...';

    bluetoothDevice = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '0000ff00-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        '0000fee7-0000-1000-8000-00805f9b34fb'
      ]
    });

    if (status) status.textContent = 'Menghubungkan...';
    bluetoothServer = await bluetoothDevice.gatt.connect();

    const services = await bluetoothServer.getPrimaryServices();
    let targetChar = null;

    for (const service of services) {
      const chars = await service.getCharacteristics();
      for (const char of chars) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          targetChar = char;
          break;
        }
      }
      if (targetChar) break;
    }

    if (!targetChar) throw new Error('Printer tidak mendukung write characteristic');

    bluetoothCharacteristic = targetChar;

    // QR Printer buttons
    if (connectBtn) {
      connectBtn.classList.add('connected');
      connectBtn.querySelector('span').textContent = 'Printer Terhubung';
    }
    if (printBtn) printBtn.disabled = false;

    // Kode Khusus buttons
    const kodeConnectBtn = document.getElementById('kodeConnectBtn');
    const kodePrintBtn = document.getElementById('kodePrintBtn');
    if (kodeConnectBtn) {
      kodeConnectBtn.classList.add('connected');
      kodeConnectBtn.querySelector('span').textContent = 'Printer Terhubung';
    }
    if (kodePrintBtn) kodePrintBtn.disabled = false;

    if (status) status.textContent = `Terhubung: ${bluetoothDevice.name || 'Unknown'}`;

    showIndicator('success', 'Printer terhubung!');

  } catch (err) {
    console.error('Bluetooth error:', err);
    if (status) status.textContent = 'Gagal: ' + err.message;
    showIndicator('error', 'Gagal menghubungkan printer');
  }
}
