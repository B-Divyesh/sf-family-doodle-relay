const CACHE = 'relay-shell-v4';
const DOCUMENTS = ['/', '/?demo=1', '/demo'];
const STATIC = ['/relay-hero-mobile.avif', '/favicon.svg'];

async function precacheShell() {
  const cache = await caches.open(CACHE);
  await cache.addAll([...DOCUMENTS, ...STATIC]);
  const index = await cache.match('/');
  if (!index) return;
  const html = await index.text();
  const urls = [...html.matchAll(/(?:src|href)="([^"?#]+(?:\.js|\.css))"/g)]
    .map(([, value]) => new URL(value, self.location.origin).pathname);
  await cache.addAll([...new Set(urls)]);
}

self.addEventListener('install', event => {
  event.waitUntil(precacheShell());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      void caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(async () => {
    const cache = await caches.open(CACHE);
    return (await cache.match(event.request)) || (event.request.mode === 'navigate' ? (await cache.match('/demo')) || (await cache.match('/')) : Response.error());
  }));
});
