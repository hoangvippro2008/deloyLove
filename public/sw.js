const CACHE = "cosmic-love-static-v2";
const cacheablePrefixes = ["/_next/static/", "/images/"];
const cacheableFiles = new Set(["/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"]);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !request.url.startsWith("http")) {
    return;
  }

  const url = new URL(request.url);
  const shouldCache =
    url.origin === self.location.origin &&
    (cacheableFiles.has(url.pathname) || cacheablePrefixes.some((prefix) => url.pathname.startsWith(prefix)));

  if (!shouldCache) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
        return response;
      })
      .catch(() => caches.match(request))
  );
});
