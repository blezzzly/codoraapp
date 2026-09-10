const CACHE_NAME = 'cpp-quest-v5';
const STATIC_ASSETS = [
  '/',
  '/home',
  '/learn',
  '/practice',
  '/challenges',
  '/library',
  '/ide',
  '/progress',
  '/profile',
  '/settings',
  '/community',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Cache the app shell pages — never fail the install if one URL hiccups.
      await Promise.allSettled(
        STATIC_ASSETS.map((url) => cache.add(url).catch(() => {}))
      );

      // Also precache the hashed JS/CSS chunks referenced by the home page so
      // the whole app shell works offline even on a totally fresh install.
      try {
        const res = await fetch('/', { cache: 'no-cache' });
        const html = await res.text();
        const urls = [...new Set(html.match(/\/_next\/static\/[^"']+\.(?:js|css)/g) || [])];
        await Promise.allSettled(urls.map((url) => cache.add(url).catch(() => {})));
      } catch {}
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Don't touch the code-judge API — it must always go to the network.
  if (url.pathname.startsWith('/api/')) return;

  // Same-origin requests (page HTML, RSC payloads, hashed JS/CSS chunks):
  // network-first so new deploys apply immediately, cached for offline use.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match('/')) ||
            Response.error()
          );
        })
    );
    return;
  }

  // Cross-origin fonts and the Monaco editor CDN: cache-first for offline.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        const ok = response && (response.status === 200 || response.status === 0);
        const cacheable = ok && (response.type === 'basic' || response.type === 'cors');
        if (cacheable) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      } catch {
        return caches.match('/');
      }
    })()
  );
});