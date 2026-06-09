const CACHE = 'folderkaart-v1';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Netwerk eerst voor API calls, cache voor rest
  if (e.request.url.includes('googleapis.com') ||
      e.request.url.includes('overpass') ||
      e.request.url.includes('openstreetmap') ||
      e.request.url.includes('corsproxy')) {
    return; // laat netwerk-verzoeken passeren
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(resp => {
        if (resp.ok) {
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        }
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
