// Folderkaart service worker — ZELFHELEND: wist oude cache en herlaadt automatisch
const CACHE = 'folderkaart-v4';

self.addEventListener('install', e => {
  self.skipWaiting(); // nieuwe versie meteen activeren, geen wachten
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    const hadOld = keys.some(k => k !== CACHE); // was er een oude versie?
    await Promise.all(keys.map(k => caches.delete(k))); // wis ALLES
    await self.clients.claim();
    // Als er een oude (kapotte) versie gecached stond: herlaad alle open vensters
    if (hadOld) {
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(c => { try { c.navigate(c.url); } catch (_) {} });
    }
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Netwerk-eerst: altijd verse versie, val alleen offline terug op cache
  e.respondWith(
    fetch(req)
      .then(resp => {
        try {
          if (resp.ok && new URL(req.url).origin === self.location.origin) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(req, clone));
          }
        } catch (_) {}
        return resp;
      })
      .catch(() => caches.match(req))
  );
});
