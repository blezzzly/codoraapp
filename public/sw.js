const CACHE_NAME = 'codora-workspace-v7';
const STATIC_ASSETS = [
  '/',
  '/home',
  '/learn',
  '/practice',
  '/challenges',
  '/library',
  '/ide',
  '/world',
  '/progress',
  '/profile',
  '/settings',
  '/onboarding',
  '/community',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // 1) Pre-cache the full app-shell HTML for every top-level tab so a
      //    hard reload works offline right after first install.
      await Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          fetch(url, { cache: 'no-cache' })
            .then((res) => {
              if (res.ok) cache.put(url, res);
            })
            .catch(() => {})
        )
      );

      // 2) Pre-cache the RSC payload for every tab. Next.js client-side
      //    navigation fetches these to render a route without a full reload,
      //    so caching them makes clicking the nav/cards work offline too.
      //    Stored under `<path>?__rsc=1` so it never collides with the HTML.
      await Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          fetch(url, { cache: 'no-cache', headers: { RSC: '1' } })
            .then((res) => {
              const type = res.headers.get('content-type') || '';
              if (res.ok && type.includes('x-component')) {
                cache.put(url + '?__rsc=1', res);
              }
            })
            .catch(() => {})
        )
      );

      // 3) Also pre-cache the hashed JS/CSS chunks referenced by the home
      //    page so the whole app shell runs offline on a fresh install.
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
        .catch(() => offlineFallback(request))
    );
    return;
  }

  // Cross-origin fonts and other static assets: cache-first for offline.
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
        return (await caches.match('/')) || Response.error();
      }
    })()
  );
});

async function offlineFallback(request) {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(request.url);
  const isRsc = request.headers.get('rsc') === '1' || url.searchParams.has('_rsc');
  url.search = '';
  const pathKey = url.toString();

  if (isRsc) {
    const rscHit = await cache.match(pathKey + '?__rsc=1');
    if (rscHit) return rscHit;
  }

  const exact = await cache.match(request);
  if (exact) return exact;

  const pathHit = await cache.match(pathKey);
  if (pathHit) return pathHit;

  return (await cache.match('/')) || Response.error();
}