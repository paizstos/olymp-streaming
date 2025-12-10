const CACHE_NAME = 'olymp-pwa-v2';
const CORE_ASSETS = [
  '/',
  '/css/style.css',
  '/js/homeLanding.js',
  '/js/goalOverlay.js',
  '/js/pwa-register.js',
  '/images/logo_total-rm.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => (key !== CACHE_NAME ? caches.delete(key) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(response => {
          // Ne pas mettre en cache les réponses partielles (206), les streams ou les erreurs
          const okForCache =
            response &&
            response.ok &&
            response.status === 200 &&
            response.type === 'basic' &&
            !response.headers.has('Content-Range');

          if (okForCache) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }

          return response;
        })
        .catch(() => caches.match('/'));
    })
  );
});
