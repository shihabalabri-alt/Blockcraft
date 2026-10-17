// Blockcraft service worker - custom project file (NOT vanilla Minecraft).
// v2: the game document is NETWORK-FIRST (users get every new deploy
// immediately whenever online; cache is only the offline fallback).
// Install assets (manifest/icons) stay cache-first; offline fallback '/'.
const CACHE = 'blockcraft-v2';
const ASSETS = ['/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let path = '';
  try { path = new URL(req.url).pathname; } catch (_) {}
  const isGame = req.mode === 'navigate' || path === '/' || path === '/index.html';
  if (isGame) {
    // Fresh game whenever the network allows; fall back to the cached copy offline.
    e.respondWith(
      fetch(req).then((res) => {
        try {
          if (res && res.ok && res.type === 'basic') {
            const cp = res.clone();
            caches.open(CACHE).then((c) => c.put(req, cp)).catch(() => {});
          }
        } catch (_) {}
        return res;
      }).catch(() => caches.match('/'))
    );
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        try {
          if (res && res.ok && res.type === 'basic') {
            const cp = res.clone();
            caches.open(CACHE).then((c) => c.put(req, cp)).catch(() => {});
          }
        } catch (_) {}
        return res;
      }).catch(() => caches.match('/'));
    })
  );
});
