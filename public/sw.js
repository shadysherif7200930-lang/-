/**
 * Al-Warraq Digital Library Service Worker
 * - Automatic versioned cache cleanup on activate
 * - Immediate activation via skipWaiting() + clients.claim()
 * - Never intercepts Vite dev modules (/src/, /@vite/, /node_modules/) or /api/
 * - Network-First for HTML navigations & catalog JSON
 * - Safe Cache-First only for valid hashed /assets/ files (rejects text/html MIME mismatches)
 */

const SW_VERSION = '2026.11.26.01';
const SHELL_CACHE = `warraq-shell-v${SW_VERSION}`;
const DATA_CACHE = `warraq-data-v${SW_VERSION}`;
const MEDIA_CACHE = `warraq-media-v${SW_VERSION}`;

const ACTIVE_CACHES = [SHELL_CACHE, DATA_CACHE, MEDIA_CACHE];

const APP_SHELL_URLS = [
  '/',
  '/manifest.json',
  '/manifest.webmanifest',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
];

const MAX_MEDIA_ENTRIES = 80;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.allSettled(
        APP_SHELL_URLS.map((url) => cache.add(new Request(url, { cache: 'reload' })))
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
        } catch {
          // ignore if unsupported
        }
      }

      const existingKeys = await caches.keys();
      await Promise.all(
        existingKeys
          .filter((key) => !ACTIVE_CACHES.includes(key))
          .map((staleKey) => caches.delete(staleKey))
      );

      await self.clients.claim();
      await broadcastMessage({
        type: 'SW_ACTIVATED',
        version: SW_VERSION,
      });
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept sw.js, backend /api/ routes, or Vite dev module URLs
  if (
    url.pathname === '/sw.js' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('/node_modules/') ||
    /\.(ts|tsx|jsx|mts|cts)$/i.test(url.pathname) ||
    url.searchParams.has('v') ||
    url.searchParams.has('t')
  ) {
    return;
  }

  // 0. Web App Manifests -> Network-First with SHELL_CACHE fallback
  if (url.pathname === '/manifest.json' || url.pathname === '/manifest.webmanifest') {
    event.respondWith(handleManifestNetworkFirst(request));
    return;
  }

  // 1. Digital books catalog & JSON payloads -> Network-First (no HTTP cache) + content diff alert
  if (url.pathname.startsWith('/books-data/') || url.pathname.endsWith('.json')) {
    event.respondWith(handleCatalogNetworkFirst(request));
    return;
  }

  // 2. Navigation requests -> Network-First with Navigation Preload & safe offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationNetworkFirst(event));
    return;
  }

  // 3. Book covers & images -> Stale-While-Revalidate with LRU trimming
  if (
    request.destination === 'image' ||
    /\.(png|jpg|jpeg|webp|svg|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(handleStaleWhileRevalidate(request, MEDIA_CACHE, MAX_MEDIA_ENTRIES));
    return;
  }

  // 4. Immutable hashed production assets (/assets/*) -> Cache-First (guarding against HTML error fallbacks)
  if (
    url.pathname.startsWith('/assets/') &&
    (request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'font')
  ) {
    event.respondWith(handleHashedAssetCacheFirst(request, SHELL_CACHE));
  }
});

self.addEventListener('message', (event) => {
  const { type } = event.data || {};

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (type === 'FORCE_CATALOG_REFRESH') {
    event.waitUntil(
      handleCatalogNetworkFirst(new Request('/books-data/catalog.json', { cache: 'no-store' }))
    );
    return;
  }

  if (type === 'GET_SW_INFO' && event.ports?.[0]) {
    event.ports[0].postMessage({
      version: SW_VERSION,
      caches: ACTIVE_CACHES,
    });
  }
});

async function handleManifestNetworkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const freshResponse = await fetch(request, { cache: 'no-store' });
    if (freshResponse.ok) {
      await cache.put(request, freshResponse.clone());
    }
    return freshResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return Response.error();
  }
}

async function handleCatalogNetworkFirst(request) {
  const cache = await caches.open(DATA_CACHE);

  try {
    const freshResponse = await fetch(request, { cache: 'no-store' });

    if (freshResponse.ok) {
      const prevCached = await cache.match(request);
      const freshClone = freshResponse.clone();
      const freshText = await freshResponse.clone().text();

      await cache.put(request, freshClone);

      if (prevCached) {
        const prevText = await prevCached.text();
        if (prevText !== freshText) {
          await broadcastMessage({
            type: 'CATALOG_UPDATED',
            url: request.url,
            timestamp: Date.now(),
          });
        }
      }
    }

    return freshResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    return new Response(
      JSON.stringify({ offline: true, catalogVersion: 0, books: [] }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  }
}

async function handleNavigationNetworkFirst(event) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const preloadResponse = await event.preloadResponse;
    if (
      preloadResponse &&
      preloadResponse.ok &&
      (preloadResponse.headers.get('content-type') || '').includes('text/html')
    ) {
      await cache.put('/', preloadResponse.clone());
      return preloadResponse;
    }

    const freshResponse = await fetch(event.request, { cache: 'no-store' });
    if (
      freshResponse.ok &&
      (freshResponse.headers.get('content-type') || '').includes('text/html')
    ) {
      await cache.put('/', freshResponse.clone());
      return freshResponse;
    }

    const cachedShell =
      (await cache.match('/')) ||
      (await cache.match('/index.html'));
    if (cachedShell && freshResponse.status >= 500) {
      return cachedShell;
    }
    return freshResponse;
  } catch {
    return (
      (await cache.match(event.request)) ||
      (await cache.match('/')) ||
      (await cache.match('/index.html')) ||
      new Response(
        '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>مكتبتي</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FBF9F5;color:#1C1917;font-family:system-ui,sans-serif;text-align:center;padding:24px;"><div><h1 style="margin:0 0 8px;">مكتبتي maktabty</h1><p style="margin:0 0 16px;color:#57534E;">جاري إعادة الاتصال بالخادم...</p><button onclick="location.reload()" style="padding:10px 20px;border:none;border-radius:6px;background:#9A3412;color:#fff;font-weight:600;cursor:pointer;">إعادة المحاولة</button></div></body></html>',
        {
          status: 503,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      )
    );
  }
}

async function handleHashedAssetCacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    const ct = cached.headers.get('content-type') || '';
    if (!ct.includes('text/html')) {
      return cached;
    }
    await cache.delete(request);
  }

  try {
    const networkResponse = await fetch(request);
    const ct = networkResponse.headers.get('content-type') || '';
    if (networkResponse.ok && !ct.includes('text/html')) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return Response.error();
  }
}

async function handleStaleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then(async (response) => {
      const ct = response.headers.get('content-type') || '';
      if (response.ok && !ct.includes('text/html')) {
        await cache.put(request, response.clone());
        await trimCache(cache, maxEntries);
      }
      return response;
    })
    .catch(() => null);

  return cached || (await networkPromise) || Response.error();
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const overflow = keys.slice(0, keys.length - maxEntries);
    await Promise.all(overflow.map((key) => cache.delete(key)));
  }
}

async function broadcastMessage(payload) {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  for (const client of clients) {
    client.postMessage(payload);
  }
}
