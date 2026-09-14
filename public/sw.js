const CACHE_NAME = "codora-workspace-v10";

// Separate cache for the large on-demand runtime (Clang toolchain ~60MB).
// Downloaded once by the runtime manager with progress, then served offline.
// Never precached, never purged, never auto-cached on first fetch.
const RUNTIME_CACHE = "codora-runtimes-v1";

// Paths the runtime manager can cache. Served from the runtime cache first so
// a large toolchain resolves instantly and works offline.
const RUNTIME_HOSTED_PREFIXES = ["/vendor/clang/", "/vendor/teavm/", "/vendor/pyodide/"];

function isRuntimeHosted(url) {
  if (url.endsWith("/clang.worker.js") || url.endsWith("/pyodide.worker.js") || url.endsWith("/java.worker.js")) {
    return true;
  }
  return RUNTIME_HOSTED_PREFIXES.some((prefix) => url.startsWith(prefix));
}

function responseTypeForUrl(url) {
  if (url.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (url.endsWith(".wasm")) return "application/wasm";
  if (url.endsWith(".json")) return "application/json";
  return null;
}

/**
 * Browsers refuse to load worker/importScripts files (and some wasm) unless the
 * response uses the right MIME type. Older installs stored everything as
 * application/octet-stream, which silently broke the engines. Rewrite the
 * header of any cached asset whose type we can derive from its URL.
 */
function withCorrectContentType(response, url) {
  if (!response || !response.body) return response;
  const type = responseTypeForUrl(url);
  if (!type) return response;
  const headers = new Headers(response.headers);
  const existing = headers.get("content-type") || "";
  const existingBase = (existing.split(";")[0] || "").trim().toLowerCase();
  const typeBase = type.split(";")[0].trim().toLowerCase();
  if (existingBase === typeBase) return response;
  headers.set("Content-Type", type);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Fallback tab list when public/codora-routes.json cannot be read.
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

// The offline compilers/interpreters. Vendored locally so nothing ever needs
// the network. Pyodide (Python) is ~13MB, so these are cached FIRST during
// install — the whole point of the PWA is that Run keeps working offline.
const VENDOR_ASSETS = [
  "/vendor/pyodide/pyodide.js",
  "/vendor/pyodide/pyodide.asm.js",
  "/vendor/pyodide/pyodide.asm.wasm",
  "/vendor/pyodide/python_stdlib.zip",
  "/vendor/pyodide/pyodide-lock.json",
  "/vendor/pyodide.worker.js",
  "/vendor/jscpp/JSCPP.es5.min.js",
];

// Small app-shell files needed for the app itself to load offline.
const SHELL_ASSETS = [
  ROUTES_MANIFEST,
  "/offline-manifest.json",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Every network call made by the service worker gets a hard timeout so a slow
// mobile connection can never stall install/activation and leave offline dead.
const FETCH_TIMEOUT_MS = 25000;

function fetchWithTimeout(input, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(input, { cache: "no-cache", ...init, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(installApp());
  self.skipWaiting();
});

async function installApp() {
  const cache = await caches.open(CACHE_NAME);

  // 1) Engines first — offline Run is the priority.
  await Promise.allSettled(VENDOR_ASSETS.map((asset) => cacheOrSkip(cache, asset)));
  // 2) Minimal app shell so the app itself opens offline.
  await Promise.allSettled(SHELL_ASSETS.map((asset) => cacheOrSkip(cache, asset)));
  await warmRoute(cache, "/");
  // 3) The remaining pages are warmed after activation in the background so
  //    install/activation never waits on the full route set.
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
  warmRemainingRoutes().catch(() => {});
});

async function readRoutes() {
  try {
    const res = await fetchWithTimeout(ROUTES_MANIFEST);
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

// Warm every page shell (HTML + RSC payload) and its hashed chunks, one at a
// time to stay gentle on mobile networks. Runs after activation in the
// background, so it never blocks the app from working.
async function warmRemainingRoutes() {
  const cache = await caches.open(CACHE_NAME);
  const routes = await readRoutes();
  const allPages = [
    ...routes.tabs,
    ...routes.lessons,
    ...routes.practice,
  ];
  for (const path of allPages) {
    if (path === "/") continue;
    try {
      await warmRoute(cache, path);
    } catch {}
  }
}

async function cacheOrSkip(cache, url) {
  try {
    const res = await fetchWithTimeout(url);
    if (res.ok) await cache.put(url, res);
  } catch {}
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
    const res = await fetchWithTimeout(url.href, { headers: { "accept": "text/html" } });
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
    const res = await fetchWithTimeout(url.href, { headers: { RSC: "1" } });
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
      withTimeout(cache.add(new URL(u, self.location.origin).href).catch(() => {}), FETCH_TIMEOUT_MS)
    )
  );
}

function isRscRequest(request) {
  return (
    request.headers.get("rsc") === "1" ||
    request.headers.get("next-router-state-tree") !== null ||
    request.headers.get("next-router-prefetch") !== null ||
    new URL(request.url).searchParams.has("_rsc")
  );
}

async function runtimeFetch(request) {
  for (const cacheName of [RUNTIME_CACHE, CACHE_NAME]) {
    const cache = await caches.open(cacheName);
    const hit = await cache.match(request);
    if (hit) return withCorrectContentType(hit, request.url);
  }
  try {
    const response = await fetchWithTimeout(request);
    const ok = response && (response.status === 200 || response.status === 0);
    if (ok && (response.type === "basic" || response.type === "cors")) {
      return response;
    }
    return Response.error();
  } catch {
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const response = await fetchWithTimeout(request);
    const ok = response && (response.status === 200 || response.status === 0);
    if (ok && (response.type === "basic" || response.type === "cors")) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = () =>
    fetchWithTimeout(request)
      .then((response) => {
        if (
          response &&
          (response.status === 200 || response.status === 0) &&
          (response.type === "basic" || response.type === "cors")
        ) {
          cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => Response.error());
  const response = cached || (await network());
  if (cached) network();
  return response;
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
  // (The desktop app doesn't even use it; the browser PWA runs engines in the
  // page via the vendored /vendor files.)
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    return;
  }

  // Vendored engines: cache-first so offline Run resolves instantly and is
  // never blocked by a slow network.
  if (url.origin === self.location.origin && url.pathname.startsWith("/vendor/")) {
    if (isRuntimeHosted(url.pathname)) {
      event.respondWith(runtimeFetch(request));
      return;
    }
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.origin !== self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  const isRsc = isRscRequest(request);
  const isDoc =
    request.destination === "document" ||
    (request.headers.get("accept") || "").includes("text/html");
  const pathKey = url.pathname;

  event.respondWith(
    fetchWithTimeout(request)
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

// ---- In-app control channel ------------------------------------------------
// The Settings page asks the SW whether every engine file is cached, and can
// kick off a "prepare for offline" pass while the phone is still online.

async function engineStatusPayload() {
  const cache = await caches.open(CACHE_NAME);
  const engines = {};
  for (const url of VENDOR_ASSETS) {
    engines[url] = !!(await cache.match(url));
  }
  return { cacheName: CACHE_NAME, engines };
}

async function prepareOffline() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(VENDOR_ASSETS.map((asset) => cacheOrSkip(cache, asset)));
  const routes = await readRoutes();
  const allPages = [...routes.tabs, ...routes.lessons, ...routes.practice];
  for (const path of allPages) {
    try {
      await warmRoute(cache, path);
    } catch {}
  }
}

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data.type !== "string") return;

  if (data.type === "COFORA_ENGINES_STATUS") {
    event.waitUntil(
      (async () => {
        const payload = await engineStatusPayload();
        event.source.postMessage({ type: "COFORA_ENGINES_STATUS", payload });
        return payload;
      })()
    );
  }

  if (data.type === "COFORA_PREPARE_OFFLINE") {
    event.waitUntil(
      (async () => {
        await prepareOffline();
        const payload = await engineStatusPayload();
        event.source.postMessage({ type: "COFORA_PREPARE_DONE", payload });
        return payload;
      })()
    );
  }
});