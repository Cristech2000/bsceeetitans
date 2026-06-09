const CACHE_NAME = 'bsceee-v1';

self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Just pass through - no caching for now to avoid issues
    event.respondWith(fetch(event.request));
});
