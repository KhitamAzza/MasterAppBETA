const CACHE_NAME = 'admin-dashboard-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './laporan.css',
  './CSS/Statistik.css',
  './manifest.json',
  './js/config.js',
  './js/utility.js',
  './js/bluetooth.js',
  './js/MasterAdmin.js',
  './js/Qrprint.js',
  './js/Kodekhusus.js',
  './js/statistikPage.js',
  './js/laporan.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// REQUIRED: Chrome won't show install prompt without this fetch handler
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((response) => {
        // Cache new successful requests for offline use
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
