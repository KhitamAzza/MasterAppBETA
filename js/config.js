const GAS_URL = 'https://script.google.com/macros/s/AKfycbzwgwoKQNXSWn7BrwlzZe1XmVlY0JnGgA6CKY7cjVUXols6Oo_7IyBIiuVDmoQh__wO/exec';

let allStudents = [];
let attendanceColumns = [];
let dataLoaded = false;
let currentApp = null;

// QR Printer state
let sumberStudents = [];
let selectedStudent = null;
let bluetoothDevice = null;
let bluetoothServer = null;
let bluetoothCharacteristic = null;

//Kode khusus state
let kodeKhususList = [];
let kodeSelectedStudent = null;
let kodeGeneratedCodes = [];

const STATUS_OPTIONS = [
  { value: '',          label: 'Kosong',    class: '' },
  { value: 'HADIR',     label: 'HADIR',     class: 'status-hadir' },
  { value: 'IZIN',      label: 'IZIN',      class: 'status-izin' },
  { value: 'SAKIT',     label: 'SAKIT',     class: 'status-sakit' },
  { value: 'ALPHA',     label: 'ALPHA',     class: 'status-alpha' },
  { value: 'TERLAMBAT', label: 'TERLAMBAT', class: 'status-alpha' },
  { value: 'PAGI',      label: 'PAGI',      class: 'status-hadir' }
];

const APP_CONFIG = {
  masterAdmin: { title: 'Master Admin', color: '#00d4ff' },
  qrPrinter:   { title: 'Cetak QR',     color: '#ff6b35' },
  kodeKhusus:  { title: 'Kode Khusus',  color: '#f59e0b' },
  statistik:   { title: 'Statistik',    color: '#c084fc' }
};