/**
 * Service Worker für die Lagerkisten-App
 * - macht die Seite installierbar
 * - Seite startet auch offline (Kisteninhalt = zuletzt geladener Stand)
 * - Die Seite selbst wird immer zuerst frisch aus dem Netz geholt,
 *   Änderungen an index.html sind also sofort sichtbar.
 */
const CACHE = 'lagerkisten-v1';
const DATEIEN = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'favicon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(DATEIEN)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Nur eigene Dateien behandeln – Daten aus Google Sheets laufen normal übers Netz
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  if (e.request.mode === 'navigate') {
    // Seite: zuerst Netz, offline aus dem Zwischenspeicher
    e.respondWith(
      fetch(e.request)
        .then(antwort => {
          const kopie = antwort.clone();
          caches.open(CACHE).then(c => c.put('index.html', kopie));
          return antwort;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Symbole usw.: aus dem Zwischenspeicher, sonst Netz
  e.respondWith(caches.match(e.request).then(treffer => treffer || fetch(e.request)));
});
