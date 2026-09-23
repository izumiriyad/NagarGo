const CACHE_NAME = "nagargo-shell-v3";
const APP_SHELL = ["/", "/offline", "/nagargo-mark.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never cache API requests, socket connections, or cross-origin resources
  // that aren't static assets we control. Serve these always from network.
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname !== self.location.hostname ||
    url.pathname.startsWith("/_next/webpack-hmr") ||
    event.request.headers.get("accept")?.includes("text/event-stream")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For _next/static and other static assets: cache-first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/static/")) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached ?? fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
      )
    );
    return;
  }

  // For everything else: network-first, fall back to cache then offline page
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached ?? (await caches.match("/offline")) ?? new Response("Offline", { status: 503 });
      })
  );
});
