/* Ledger service worker.
 * - Precaches the app shell so the app opens instantly and works (shell only) offline.
 * - HTML: network-first, so a new deploy is picked up as soon as you are online.
 * - Same-origin static files: stale-while-revalidate.
 * - NEVER touches cross-origin traffic (Supabase auth/data, FX rates): financial data is always live.
 * Bump VERSION to force clients to drop old caches. */
const VERSION = 'ledger-v1';
const SHELL = [
  '/', '/manifest.webmanifest', '/vendor/supabase.js',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png', '/icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Tolerant: one failing asset must not block installation.
    await Promise.all(SHELL.map((url) => cache.add(url).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, rates API, etc.: straight to the network

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await Promise.race([
          fetch(req),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))
        ]);
        const cache = await caches.open(VERSION);
        cache.put('/', fresh.clone()).catch(() => {});
        return fresh;
      } catch (e) {
        const cached = await caches.match('/');
        if (cached) return cached;
        throw e;
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req);
    const network = fetch(req).then((res) => { if (res && res.ok) cache.put(req, res.clone()).catch(() => {}); return res; }).catch(() => null);
    return cached || (await network) || Response.error();
  })());
});
