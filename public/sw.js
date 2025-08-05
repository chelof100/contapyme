const CACHE_NAME = 'contapyme-v1';
const BASE_PATH = '/contapyme'; // GitHub Pages base path

const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/assets/css/index.css`,
  `${BASE_PATH}/assets/js/index.js`,
  `${BASE_PATH}/assets/js/vendor.js`,
  `${BASE_PATH}/assets/js/ui.js`,
  `${BASE_PATH}/assets/js/supabase.js`,
  `${BASE_PATH}/assets/js/utils.js`
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 