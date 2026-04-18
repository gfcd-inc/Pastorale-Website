const CACHE_NAME = 'pastorale-guide-v7';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './data/content-ja.json',
  './data/content-en.json',
  './data/content-zh.json',
  '../images/interior-evening.jpg',
  '../images/balmuda-cooking.jpg',
  '../images/coffee-brewing.jpg',
  '../images/kitchen.jpg',
  '../images/deck-chairs.jpg',
  '../images/bathroom.jpg',
  '../images/lake-view.jpg',
  '../images/lake-tree.jpg',
  '../images/Pastorale_5GHz.png',
  '../images/Pastorale_2.4GHz.png',
  '../images/%E3%83%AD%E3%82%B4%20(1).png'
];

// Install: cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Cache First for assets, Network First for JSON data
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network First for content JSON (so updates propagate quickly)
  if (url.pathname.endsWith('.json') && url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache First for everything else
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // Cache successful GET requests
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
