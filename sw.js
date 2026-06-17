// Network-first service worker, with cache-first for immutable image assets.
//
// App shell (HTML/JS/CSS) is network-first so it updates without a hard
// refresh, falling back to the cache only when offline. Image assets (car
// cutouts, brand logos) are cache-first: their contents never change per
// filename, so once fetched they're served from cache instantly and survive
// transient network failures. Only same-origin GETs are cached — Supabase API
// calls and font CDNs pass through untouched, so user data is never stale.
//
// Bump CACHE when image assets are regenerated under existing filenames; the
// activate handler purges every cache that doesn't match the current name.
const CACHE = 'car-tracker-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function fromNetwork(request) {
  return fetch(request).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(request, copy)).catch(() => {});
    return res;
  });
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Cache-first for immutable image assets — resilient to network blips.
  if (/\.(png|jpe?g|svg|webp|gif|ico)$/i.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fromNetwork(e.request).catch(() => Response.error())
      )
    );
    return;
  }

  // Network-first for the app shell; fall back to cache when offline. Never
  // resolve to undefined — that throws "Failed to convert value to 'Response'".
  e.respondWith(
    fromNetwork(e.request).catch(() =>
      caches.match(e.request).then(cached => cached || Response.error())
    )
  );
});
