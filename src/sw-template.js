// Service worker for the installed app. vite.config.js fills in the version
// and the list of files when it copies this to dist/sw.js.
const VERSION = '__VERSION__';
const FILES = __FILES__;
const CACHE = `cs-degree-lab-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
});

// The page asks the waiting worker to take over when the learner taps "Reload".
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('cs-degree-lab-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Serve from the cache first; anything not cached goes to the network.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const key = request.mode === 'navigate' ? './' : request;
      const cached = await cache.match(key, { ignoreSearch: true });
      return cached || fetch(request);
    }),
  );
});
