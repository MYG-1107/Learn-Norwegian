'use strict';
const CACHE_NAME = 'learn-norwegian-static-v1';
const BASE = new URL('./', self.location.href);
const CORE_FILES = [
  '', 'index.html', 'learning-centre.html', 'norwegian-beginners.html',
  'norwegian-phrases.html', 'norwegian-pronunciation.html', 'about.html',
  'contact-developers.html', 'privacy.html', 'accessibility.html', '404.html',
  'styles.css', 'app.js', 'learning.js', 'pwa.js', 'logo.svg', 'manifest.webmanifest'
].map((path) => new URL(path, BASE).toString());
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith('learn-norwegian-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(BASE.href)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(async (response) => {
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match(new URL('index.html', BASE).toString()))));
    return;
  }
  event.respondWith(caches.match(request).then(async (cached) => {
    if (cached) return cached;
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  }).catch(() => caches.match(request)));
});
