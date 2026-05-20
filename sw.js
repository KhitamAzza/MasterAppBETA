const CACHE_NAME = 'admin-dashboard-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './laporan.css',
  './Statistik.css',
  './js/config.js',
  './js/utility.js',
  './js/bluetooth.js',
  './js/MasterAdmin.js',
  './js/Qrprint.js',
  './js/Kodekhusus.js',
  './js/statistikPage.js',
  './js/app.js',
  './js/laporan.js',
  './manifest.json'
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

// Mobile-friendly fetch: cache first, then network
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      // Return cached version immediately (fast on mobile)
      // Then fetch fresh version in background for next time
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, clone);
          });
        }
        return networkResponse;
      }).catch(() => cached);
      
      return cached || fetchPromise;
    })
  );
});