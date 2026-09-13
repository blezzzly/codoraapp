const CACHE_NAME = "codora-workspace-v9";

// Fallback tab list when public/codora-routes.json cannot be read at install.
const DEFAULT_TABS = [
  "/",
  "/home",
  "/learn",
  "/practice",
  "/ide",
  "/profile",
  "/challenges",
  "/library",
  "/progress",
  "/settings",
  "/community",
  "/onboarding",
];

const ROUTES_MANIFEST = "/codora-routes.json";

// Offline runtimes. JSCPP (C++) and Pyodide (Python) are vendored locally so
// the compiler + console keep working 100% offline with no CDN dependency.
const VENDOR_ASSETS = [
  "/vendor/jscpp/JSCPP.es5.min.js",
  "/vendor/pyodide.worker.js",
  "/vendor/pyodide/pyodide.js",
  "/vendor/pyodide/pyodide.asm.js",
  "/vendor/pyodide/pyodide.asm.wasm",
  "/vendor/pyodide/python_stdlib.zip",
  "/vendor/pyodide/pyodide-lock.json",
  ROUTES_MANIFEST,
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(installApp());
  self.skipWaiting();
});

async function installApp() {
  const cache = await caches.open(CACHE_NAME);

  const routes = await readRoutes();
  const allPages = [
    ...routes.tabs,
    ...routes.lessons,
    ...routes.practice,
  ];

  // Warm every page shell (HTML + RSC payload) and its hashed chunks, with a
  // modest concurrency limit so a fresh install doesn't hammer the server.
  await mapLimit(allPages, 5, (path) => warmRoute(cache, path));

  await Promise.allSettled(
    VENDOR_ASSETS.map((asset) => cacheOrSkip(cache, asset))
  );
}

async function readRoutes() {
  try {
    const res = await fetch(ROUTES_MANIFEST, { cache: "no-cache" });
    if (res.ok) {
      const data = await res.json();
      return {
        tabs: Array.isArray(data.tabs) ? data.tabs : DEFAULT_TABS,
        lessons: Array.isArray(data.lessons) ? data.lessons : [],
        practice: Array.isArray(data.practice) ? data.practice : [],
      };
    }
  } catch {}
  return { tabs: DEFAULT_TABS, lessons: [], practice: [] };
}

/**
 * Cache one route's server HTML and RSC payload plus every hashed JS/CSS chunk
 * it references. The RSC payload is what Next.js fetches for client-side
 * navigation; the chunks are what it lazy-loads to render the route.
 */
async function warmRoute(cache, path) {
  const url = new URL(path, self.location.origin);

  let htmlText = null;
  try {
    const res = await fetch(url.href, { cache: "no-cache" });
    if (res.ok) {
      const text = await res.text();
      await cache.put(
        path + "?__html=1",
        new Response(text, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })
      );
      htmlText = text;
    }
  } catch {}

  try {
    const res = await fetch(url.href, {
      cache: "no-cache",
      headers: { RSC: "1" },
    });
    const type = res.headers.get("content-type") || "";
    if (res.ok && type.includes("x-component")) {
      const text = await res.text();
      await cache.put(
        path + "?__rsc=1",
        new Response(text, { headers: { "Content-Type": type } })
      );
      await cacheChunkRefs(cache, text);
    }
  } catch {}

  if (htmlText) await cacheChunkRefs(cache, htmlText);
}

async function cacheChunkRefs(cache, text) {
  const urls = [
    ...new Set(text.match(/\/_next\/static\/[^"'\s\\\)]+\.(?:js|css)/g) || []),
  ];
  await Promise.allSettled(
    urls.map((u) =>
      cache.add(new URL(u, self.location.origin).href).catch(() => {})
    )
  );
}

async function cacheOrSkip(cache, url) {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (res.ok) await cache.put(url, res);
  } catch {}
}

function mapLimit(items, limit, fn) {
  const total = items.length;
  if (total === 0) return Promise.resolve();

  let index = 0;
  let active = 0;
  let done = 0;

  return new Promise((resolve) => {
    const pump = () => {
      while (active < limit && index < total) {
        const i = index++;
        active++;
        Promise.resolve()
          .then(() => fn(items[i]))
          .catch(() => {})
          .finally(() => {
            active--;
            done++;
            if (done >= total) resolve();
            else pump();
          });
      }
    };
    pump();
  });
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
  );
  self.clients.claim();
});

/**
 * Next.js client-side navigation fetches the page's RSC stream (which drives
 * rendering), full reloads fetch the HTML shell, and the runtime lazily loads
 * hashed chunk files. Each is cached under a distinct, stable key so offline
 * navigation serves exactly what the app asked for.
 */
function isRscRequest(request) {
  return (
    request.headers.get("rsc") === "1" ||
    request.headers.get("next-router-state-tree") !== null ||
    request.headers.get("next-router-prefetch") !== null ||
    new URL(request.url).searchParams.has("_rsc")
  );
}

async function crossOriginFetch(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    const ok = response && (response.status === 200 || response.status === 0);
    const cacheable =
      ok && (response.type === "basic" || response.type === "cors");
    if (cacheable) {
      const clone = response.clone();
      cache.put(request, clone);
    }
    return response;
  } catch {
    return (await cache.match("/?__html=1")) || Response.error();
  }
}

async function offlineFallback(request, pathKey) {
  const cache = await caches.open(CACHE_NAME);
  const tryMatch = async (key) => {
    const hit = await cache.match(key);
    return hit || undefined;
  };

  if (isRscRequest(request)) {
    const rscHit = await tryMatch(pathKey + "?__rsc=1");
    if (rscHit) return rscHit;
  }

  const htmlHit = await tryMatch(pathKey + "?__html=1");
  if (htmlHit) return htmlHit;

  const exact = await tryMatch(request);
  if (exact) return exact;

  const plain = await tryMatch(pathKey);
  if (plain) return plain;

  return (
    (await tryMatch("/?__html=1")) ||
    (await tryMatch("/")) ||
    Response.error()
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // The code-judge API always needs the network — it is not precached.
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    return;
  }

  if (url.origin !== self.location.origin) {
    event.respondWith(crossOriginFetch(request));
    return;
  }

  const isRsc = isRscRequest(request);
  const isDoc =
    request.destination === "document" ||
    (request.headers.get("accept") || "").includes("text/html");
  const pathKey = url.pathname;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          if (isRsc) cache.put(pathKey + "?__rsc=1", clone);
          else if (isDoc) {
            cache.put(pathKey + "?__html=1", clone);
            cache.put(request, clone.clone());
          } else cache.put(request, clone);
        });
        return response;
      })
      .catch(() => offlineFallback(request, pathKey))
  );
});