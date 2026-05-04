// Service Worker v2 - Clinident
// Estrategia:
// - index.html y navegaciones: network-first SIN cache (siempre fresco)
// - assets/* (con hash de Vite): cache-first inmutable
// - sw.js: nunca se cachea (regla del navegador + .htaccess refuerza)
// - Cache versionado por build -> activate borra TODO cache de versiones anteriores

const BUILD_VERSION = '__BUILD_VERSION__'; // reemplazado por deploy.sh
const CACHE_NAME = `clinident-${BUILD_VERSION}`;
const ASSETS_CACHE = `${CACHE_NAME}-assets`;

self.addEventListener('install', () => {
  // Activarse inmediatamente sin esperar a que el SW viejo deje de controlar pestañas
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Borrar TODOS los caches anteriores (de versiones distintas)
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((n) => !n.startsWith(`clinident-${BUILD_VERSION}`))
        .map((n) => caches.delete(n))
    );
    // Tomar control inmediato de las pestañas abiertas
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Saltar cross-origin y API
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navegaciones (HTML) -> SIEMPRE network, sin cache
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() =>
        new Response(
          '<!doctype html><meta charset="utf-8"><title>Sin conexión</title>'
          + '<p style="font-family:system-ui;padding:2rem">Sin conexión. Reintentando...</p>'
          + '<script>setTimeout(()=>location.reload(),3000)</script>',
          { headers: { 'content-type': 'text/html; charset=utf-8' } }
        )
      )
    );
    return;
  }

  // Assets con hash de Vite (/assets/*-[hash].[ext]) -> cache-first inmutable
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSETS_CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        if (fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch {
        return new Response('', { status: 504 });
      }
    })());
    return;
  }

  // Resto (favicon, manifest, /imagenes/*, etc) -> stale-while-revalidate
  event.respondWith((async () => {
    const cache = await caches.open(ASSETS_CACHE);
    const cached = await cache.match(req);
    const fetchPromise = fetch(req)
      .then((resp) => {
        if (resp.ok) cache.put(req, resp.clone());
        return resp;
      })
      .catch(() => cached);
    return cached || fetchPromise;
  })());
});

// Permitir forzar update desde la página
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
