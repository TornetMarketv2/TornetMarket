const CACHE = 'tornet-static-v8';
const FILES = ['./','./index.html','./styles.css','./script.js','./autoshop.js','./feedback.js','./products.js','./manifest.webmanifest','./assets/oni-motion.gif','./assets/oni-still.png','./assets/background.jpg','./assets/logo.png','./assets/oni-favicon-32.png','./assets/oni-favicon-48.png','./assets/oni-apple-touch-180.png','./assets/oni-icon-192.png','./assets/oni-icon-512.png','./assets/oni-maskable-512.png'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('tornet-static-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
// Network first so edits to products.js appear on refresh; offline fallback for the app shell.
self.addEventListener('fetch', event => {
 if(event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
 event.respondWith(fetch(event.request).then(response => {
  if(response.ok) { const copy=response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request,copy))); }
  return response;
 }).catch(async () => (await caches.match(event.request)) || (event.request.mode === 'navigate' ? await caches.match('./index.html') : Response.error())));
});
