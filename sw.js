/* ============================================
   SERVICE WORKER — Lafé Cantina
   Funciona 100% offline após primeira visita
   ============================================ */

const CACHE_NAME = 'lafe-v3';
const ASSETS = [
  './index.html',
  './app.js',
  './style.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Josefin+Sans:wght@300;400;600&display=swap'
];

// Instala e faz cache de todos os arquivos
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache local assets (must succeed)
      const local = ASSETS.filter(a => a.startsWith('./'));
      return cache.addAll(local).then(() => {
        // Cache Google Fonts (optional — ok se offline)
        const remote = ASSETS.filter(a => !a.startsWith('./'));
        return Promise.allSettled(remote.map(url =>
          fetch(url).then(r => cache.put(url, r)).catch(() => {})
        ));
      });
    })
  );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Serve do cache, busca na rede se não encontrar
self.addEventListener('fetch', event => {
  // Ignora requisições não-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Só cacheia respostas válidas
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Fallback para index.html se offline
        return caches.match('./index.html');
      });
    })
  );
});
