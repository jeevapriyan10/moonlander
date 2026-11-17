// MoonLander Production Service Worker
// Version: moonlander-v1.0.0
// Ensures offline access for Academy, Campaign, and Spacecraft Dossiers without stranding users on stale builds.

const CACHE_NAME = "moonlander-cache-v1.0.0";
const PRECACHE_ASSETS = [
  "/",
  "/academy",
  "/campaign",
  "/codex",
  "/profile",
  "/favicon.svg",
  "/manifest.json",
];

// Install: precache shell resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old versions to prevent stale state
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Safe update message handler
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Fetch: Stale-While-Revalidate for static assets, Network-First for dynamic routes
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET and cross-origin requests
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Network-first for API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: "Offline telemetry unavailable" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      })
    );
    return;
  }

  // Cache-first for Next.js static immutable chunks and textures
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/textures/") ||
    url.pathname.startsWith("/models/")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for pages
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and not in cache, fallback to root or cached page
          return cachedResponse || caches.match("/");
        });

      return cachedResponse || fetchPromise;
    })
  );
});
