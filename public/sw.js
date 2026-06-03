// LiveCare TI — Service Worker
//
// Estrategia:
// - Pre-cacheia o "app shell" basico no install (icones, manifest, pagina offline).
// - GET de paginas HTML: NetworkFirst. Tenta online primeiro; se falhar, devolve
//   versao cacheada; se nao houver cache, devolve /offline.
// - GET de assets estaticos (_next/static/*): CacheFirst com fallback pra rede
//   (esses arquivos sao hashed, nunca mudam).
// - Skip pra Supabase (storage, auth, postgrest): passa direto.
//
// Versionar pelo nome do cache: bump quando mudar logica do SW.

const CACHE_VERSION = "livecare-v1";
const APP_SHELL = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon.png",
  "/offline",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // addAll falha tudo se algum item nao baixar. Add individual pra ser tolerante.
      return Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch(() => {
            /* ignora itens faltantes */
          })
        )
      );
    })
  );
  // Ativa imediatamente (sem aguardar reload)
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
  );
  // Toma controle de todas as abas abertas imediatamente
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // So intercepta GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Nao mexer em chamadas pra outras origens (Supabase, fontes, etc)
  if (url.origin !== self.location.origin) return;

  // Assets hashed do Next (cacheFirst — sao imutaveis)
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Skip API routes (sempre online)
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  // Paginas e dados dinamicos: NetworkFirst
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Resto (imagens, etc): StaleWhileRevalidate
  event.respondWith(staleWhileRevalidate(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Ultimo recurso: pagina offline customizada
    const offline = await caches.match("/offline");
    return offline ?? Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached ?? networkPromise;
}

// Permite que o app force atualizacao do SW (ex.: ao detectar nova versao)
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
