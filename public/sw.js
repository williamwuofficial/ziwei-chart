// Offline support. Everything the app computes runs in the browser, so once the page and its
// hashed assets are cached the chart and analysis work without a connection. Place search
// (Open-Meteo, cross-origin) is never cached; a previously chosen place is remembered locally.
const CACHE = 'ziwei-chart-v2';
const PAGES = ['./', './index.html', './learn.html', './about.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PAGES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // Network first so new deploys show up; fall back to the cached page offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          // Each page is cached under its own URL, so offline visits get the right page.
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit ?? caches.match('./'))),
    );
    return;
  }

  // Hashed build assets never change, so cache first.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
